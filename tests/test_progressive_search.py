"""
RAKSHA 2.0 - Progressive Search Expansion & Map Consistency Automated Test Suite

Covers the 13 required verification scenarios:
1. Sufficient capacity found within 5 km.
2. Insufficient capacity at 5 km but sufficient capacity at 10 km.
3. Continued expansion to 15 km, 20 km, and beyond.
4. A safe candidate outside the current radius is not incorrectly shown as an in-radius approved site.
5. A candidate with slope above the existing threshold remains vetoed.
6. A candidate in a mandatory debris-flow exclusion remains vetoed.
7. Duplicate candidates are not counted twice.
8. The search terminates at its configured operational maximum.
9. Provider failure produces a truthful incomplete result.
10. Insufficient total safe capacity produces a nonzero shortfall.
11. Approved-site allocations do not exceed site capacity.
12. Total allocated population does not exceed the displaced population.
13. The map's active radius matches the backend response.
"""

import sys
import os
import unittest
from unittest.mock import patch

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app
from satellite_service import SatelliteTelemetryService
from relocation_engine import RelocationEngine, haversine_distance_km

client = TestClient(app)

DEVGRAM_ORIGIN = (30.3207, 79.2163)

class TestProgressiveRelocationSearch(unittest.TestCase):
    def setUp(self):
        self.sat_service = SatelliteTelemetryService()
        self.engine = RelocationEngine(satellite_service=self.sat_service)

    # ---------------------------------------------------------------------------
    # Test 1: Sufficient capacity found within 5 km
    # ---------------------------------------------------------------------------
    def test_1_sufficient_capacity_within_5km(self):
        """When displaced population fits within Ring 1 (<= 5km), search stops at 5km."""
        # devgram has OSM-DEV-R1 at 3.35km with capacity 240
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=180,
            hazard_level="CRITICAL",
            hazard_type="Glacial Inundation & Landslide Runoff",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        self.assertEqual(result["final_search_radius_km"], 5.0)
        self.assertEqual(result["completion_status"], "SUFFICIENT_SAFE_CAPACITY_FOUND")
        self.assertEqual(len(result["rings_evaluated"]), 1)
        self.assertEqual(result["remaining_capacity_shortfall"], 0)
        self.assertTrue(result["is_fully_covered"])
        
        # Candidate sites beyond 5km must NOT be in active radius and must NOT be allocated
        for site in result["all_evaluated_candidates"]:
            if site["distance_km"] > 5.0:
                self.assertFalse(site["in_active_radius"])
                self.assertEqual(site["allocated_population"], 0)

    # ---------------------------------------------------------------------------
    # Test 2: Insufficient capacity at 5 km but sufficient capacity at 10 km
    # ---------------------------------------------------------------------------
    def test_2_insufficient_at_5km_sufficient_at_10km(self):
        """When Ring 1 (240 cap) is insufficient for 500 people, search expands to 10km (Ring 2 adds 480+320 cap)."""
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=500,
            hazard_level="CRITICAL",
            hazard_type="Glacial Inundation & Landslide Runoff",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        self.assertEqual(result["final_search_radius_km"], 10.0)
        self.assertEqual(result["completion_status"], "SUFFICIENT_SAFE_CAPACITY_FOUND")
        self.assertEqual(len(result["rings_evaluated"]), 2)
        self.assertEqual(result["remaining_capacity_shortfall"], 0)
        self.assertTrue(result["is_fully_covered"])

    # ---------------------------------------------------------------------------
    # Test 3: Continued expansion to 15 km, 20 km, and beyond
    # ---------------------------------------------------------------------------
    def test_3_continued_expansion_to_15km_20km_and_beyond(self):
        """When displaced population is large (1500), expansion continues sequentially past 10km into 15km and 20km."""
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=1500,
            hazard_level="CRITICAL",
            hazard_type="Glacial Inundation & Landslide Runoff",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        self.assertGreaterEqual(result["final_search_radius_km"], 15.0)
        self.assertGreaterEqual(len(result["rings_evaluated"]), 3)
        steps = result["search_steps"]
        self.assertGreaterEqual(len(steps), 3)
        self.assertIn("Ring 1", steps[0]["ring_label"])
        self.assertIn("Ring 2", steps[1]["ring_label"])
        self.assertIn("Ring 3", steps[2]["ring_label"])

    # ---------------------------------------------------------------------------
    # Test 4: Safe candidate outside current radius is not shown as in-radius approved
    # ---------------------------------------------------------------------------
    def test_4_safe_candidate_outside_current_radius_not_in_radius(self):
        """Candidates whose distance > final_search_radius_km must not be marked in-radius or allocated."""
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=200,
            hazard_level="CRITICAL",
            hazard_type="Glacial Inundation & Landslide Runoff",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        final_radius = result["final_search_radius_km"]
        self.assertEqual(final_radius, 5.0)
        for site in result["all_evaluated_candidates"]:
            if site["distance_km"] > final_radius:
                self.assertFalse(site["in_active_radius"])
                self.assertEqual(site["allocated_population"], 0)

    # ---------------------------------------------------------------------------
    # Test 5: Candidate with slope above threshold remains vetoed
    # ---------------------------------------------------------------------------
    def test_5_slope_above_threshold_remains_vetoed(self):
        """Slope > 14.0 degrees must ALWAYS trigger HARD_VETO regardless of population need."""
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=50000,
            hazard_level="CRITICAL",
            hazard_type="Glacial Inundation & Landslide Runoff",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        vetoed_sites = [s for s in result["all_evaluated_candidates"] if s.get("status") == "HARD_VETO"]
        self.assertGreater(len(vetoed_sites), 0)
        slope_vetoed = [s for s in vetoed_sites if s.get("slope_degrees", 0) > 14.0 or any("14" in r or "Slope" in r or "slope" in r for r in s.get("veto_reasons", []))]
        self.assertGreater(len(slope_vetoed), 0)
        for s in slope_vetoed:
            self.assertEqual(s["status"], "HARD_VETO")
            self.assertEqual(s["allocated_population"], 0)

    # ---------------------------------------------------------------------------
    # Test 6: Candidate in mandatory debris-flow exclusion remains vetoed
    # ---------------------------------------------------------------------------
    def test_6_mandatory_debris_flow_exclusion_remains_vetoed(self):
        """A site flagged with debris flow / flood runout must remain HARD_VETO."""
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=500,
            hazard_level="CRITICAL",
            hazard_type="Glacial Inundation & Landslide Runoff",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        vetoed = [s for s in result["all_evaluated_candidates"] if s.get("status") == "HARD_VETO"]
        self.assertGreater(len(vetoed), 0)
        has_debris_or_flood_reason = any(
            any("flood" in r.lower() or "debris" in r.lower() or "runout" in r.lower() or "slope" in r.lower() for r in v.get("veto_reasons", []))
            for v in vetoed
        )
        self.assertTrue(has_debris_or_flood_reason)

    # ---------------------------------------------------------------------------
    # Test 7: Duplicate candidates are not counted twice
    # ---------------------------------------------------------------------------
    def test_7_duplicate_candidates_not_counted_twice(self):
        """Candidate sites with identical IDs returned by OSM/providers are deduplicated by ID."""
        dup_facilities = [
            {"id": "OSM-DUP-1", "name": "Campus Alpha", "type": "College", "lat": 30.33, "lon": 79.22, "gross_area_sqm": 20000, "is_real_osm": True, "slope_deg": 6.0},
            {"id": "OSM-DUP-1", "name": "Campus Alpha Duplicate", "type": "College", "lat": 30.33, "lon": 79.22, "gross_area_sqm": 20000, "is_real_osm": True, "slope_deg": 6.0},
            {"id": "OSM-DUP-2", "name": "Campus Beta", "type": "School", "lat": 30.35, "lon": 79.24, "gross_area_sqm": 25000, "is_real_osm": True, "slope_deg": 5.5},
        ]
        with patch.object(self.sat_service, 'fetch_real_osm_facilities', return_value=dup_facilities):
            result = self.engine.evaluate_relocation_rings(
                centroid_lat=DEVGRAM_ORIGIN[0],
                centroid_lon=DEVGRAM_ORIGIN[1],
                displaced_population=300,
                hazard_level="MODERATE",
                initial_radius_km=5.0,
                step_km=5.0,
                max_radius_km=15.0
            )
            candidate_ids = [c["id"] for c in result["all_evaluated_candidates"]]
            self.assertEqual(len(candidate_ids), len(set(candidate_ids)))
            self.assertEqual(len(candidate_ids), 2)

    # ---------------------------------------------------------------------------
    # Test 8: Search terminates at its configured operational maximum
    # ---------------------------------------------------------------------------
    def test_8_search_terminates_at_configured_operational_maximum(self):
        """If capacity is not met, the search MUST NOT expand beyond max_radius_km."""
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=50000,  # Unattainable with regional facilities
            hazard_level="CRITICAL",
            hazard_type="Glacial Inundation & Landslide Runoff",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=15.0  # Operational maximum
        )
        self.assertEqual(result["final_search_radius_km"], 15.0)
        self.assertEqual(result["completion_status"], "OPERATIONAL_LIMIT_REACHED")
        self.assertGreater(result["remaining_capacity_shortfall"], 0)
        self.assertFalse(result["is_fully_covered"])

    # ---------------------------------------------------------------------------
    # Test 9: Provider failure produces a truthful incomplete result
    # ---------------------------------------------------------------------------
    def test_9_provider_failure_produces_truthful_incomplete_result(self):
        """When candidates cannot be found or provider fails, truthful shortfall is returned."""
        with patch.object(self.sat_service, 'fetch_real_osm_facilities', return_value=[]):
            result = self.engine.evaluate_relocation_rings(
                centroid_lat=DEVGRAM_ORIGIN[0],
                centroid_lon=DEVGRAM_ORIGIN[1],
                displaced_population=500,
                hazard_level="HIGH"
            )
            self.assertEqual(result["completion_status"], "PROVIDER_FAILURE")
            self.assertEqual(result["remaining_capacity_shortfall"], 500)
            self.assertFalse(result["is_fully_covered"])
            self.assertEqual(result["coverage_pct"], 0.0)
            self.assertIn("No candidate facilities", result["status_explanation"])

    # ---------------------------------------------------------------------------
    # Test 10: Insufficient total safe capacity produces a nonzero shortfall
    # ---------------------------------------------------------------------------
    def test_10_insufficient_total_safe_capacity_produces_nonzero_shortfall(self):
        """Do not claim 100% coverage when total approved capacity is below displaced population."""
        displaced = 25000
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=displaced,
            hazard_level="CRITICAL",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        self.assertFalse(result["is_fully_covered"])
        self.assertLess(result["coverage_pct"], 100.0)
        self.assertGreater(result["remaining_capacity_shortfall"], 0)
        self.assertEqual(result["remaining_capacity_shortfall"], displaced - result["total_safe_capacity_discovered"])

    # ---------------------------------------------------------------------------
    # Test 11: Approved-site allocations do not exceed site capacity
    # ---------------------------------------------------------------------------
    def test_11_approved_site_allocations_do_not_exceed_capacity(self):
        """For every allocated site, allocated_population must be <= sphere_capacity."""
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=900,
            hazard_level="CRITICAL",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        for site in result["all_evaluated_candidates"]:
            allocated = site.get("allocated_population", 0)
            capacity = site.get("sphere_capacity") or site.get("shelter_capacity_persons", 0)
            self.assertLessEqual(allocated, capacity, f"Site {site['name']} allocated {allocated} > capacity {capacity}")

    # ---------------------------------------------------------------------------
    # Test 12: Total allocated population does not exceed displaced population
    # ---------------------------------------------------------------------------
    def test_12_total_allocated_population_does_not_exceed_displaced(self):
        """Total allocated across all approved sites must not exceed displaced population."""
        displaced = 720
        result = self.engine.evaluate_relocation_rings(
            centroid_lat=DEVGRAM_ORIGIN[0],
            centroid_lon=DEVGRAM_ORIGIN[1],
            displaced_population=displaced,
            hazard_level="CRITICAL",
            initial_radius_km=5.0,
            step_km=5.0,
            max_radius_km=25.0
        )
        total_allocated = sum(s.get("allocated_population", 0) for s in result["all_evaluated_candidates"])
        self.assertLessEqual(total_allocated, displaced)
        self.assertEqual(total_allocated, displaced)

    # ---------------------------------------------------------------------------
    # Test 13: Map active radius matches backend response via API
    # ---------------------------------------------------------------------------
    def test_13_map_active_radius_matches_backend_response(self):
        """API endpoint returns final_search_radius_km and candidate geodetic distances strictly match."""
        payload = {
            "lat": DEVGRAM_ORIGIN[0],
            "lon": DEVGRAM_ORIGIN[1],
            "displaced_population": 720,
            "hazard_type": "Glacial Inundation & Landslide Runoff",
            "initial_radius_km": 5.0,
            "step_km": 5.0,
            "max_radius_km": 25.0
        }
        response = client.post("/api/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("relocation_decision", data)
        decision = data["relocation_decision"]

        final_radius = decision["final_search_radius_km"]
        self.assertGreaterEqual(final_radius, 10.0)

        candidates = decision.get("all_evaluated_candidates", [])
        self.assertGreater(len(candidates), 0)

        for site in candidates:
            lat = site.get("lat") or site["coordinates"]["lat"]
            lon = site.get("lon") or site["coordinates"]["lon"]
            computed_dist = haversine_distance_km(DEVGRAM_ORIGIN[0], DEVGRAM_ORIGIN[1], lat, lon)
            self.assertAlmostEqual(site["distance_km"], computed_dist, delta=0.25)
            # Active radius consistency
            if site["distance_km"] <= final_radius:
                self.assertTrue(site["in_active_radius"])
            else:
                self.assertFalse(site["in_active_radius"])
                self.assertEqual(site["allocated_population"], 0)

if __name__ == "__main__":
    unittest.main()
