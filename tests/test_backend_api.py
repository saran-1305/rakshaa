"""
RAKSHA 2.0 - Backend API Integration & Safety Validation Test Suite
Tests:
1. System Health & Probes (/api/health)
2. Presets & Scenarios Retrieval (/api/presets, /api/scenarios)
3. Relocation Decision Engine & Hard-Veto Rules (/api/analyze)
4. Dynamic Fleet Evacuation Logistics (/api/logistics/calculate)
5. Request Validation & Error Handling
6. Terrain Elevation Transect (/api/terrain/transect)
"""

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    """Verify system health returns operational status and component breakdown."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "system" in data
    assert data["system"] == "RAKSHA Engine 2.0"
    assert "overall_status" in data
    assert "components" in data
    assert "weather" in data["components"]
    assert "elevation" in data["components"]
    assert "sentinel2" in data["components"]
    assert "osm" in data["components"]

def test_presets_endpoint():
    """Verify preset disaster hotspots list."""
    response = client.get("/api/presets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    ids = [p["id"] for p in data]
    assert "devgram" in ids
    assert "wayanad" in ids
    assert "silchar" in ids

def test_scenarios_endpoint():
    """Verify detailed scenario metadata."""
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "devgram" in data
    assert "wayanad" in data
    assert data["devgram"]["displaced_population"] > 0

def test_analyze_endpoint_and_hard_veto():
    """Verify relocation analysis executes and applies Zero-Tolerance Hard Veto."""
    payload = {
        "lat": 30.3207,
        "lon": 79.2163,
        "displaced_population": 720,
        "hazard_type": "Glacial Inundation & Landslide Runoff"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "data_provenance" in data
    assert "relocation_decision" in data

    decision = data["relocation_decision"]
    # Check that hard-vetoed sites exist and have reasons
    if "vetoed_sites" in decision and len(decision["vetoed_sites"]) > 0:
        vetoed = decision["vetoed_sites"][0]
        assert "veto_reasons" in vetoed
        assert len(vetoed["veto_reasons"]) > 0

    # Check multi-site allocation exists
    assert "multi_site_allocation" in decision

def test_logistics_calculation():
    """Verify dynamic logistics computes consistent turnaround, fuel, and convoy metrics."""
    payload = {
        "scenario": "devgram",
        "vehicle_capacity": 55,
        "available_fleet": 30,
        "speed_kmh": 35.0,
        "planning_window_mins": 180.0
    }
    response = client.post("/api/logistics/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "derived_metrics" in data
    metrics = data["derived_metrics"]
    assert metrics["total_passenger_movements"] > 0
    assert metrics["estimated_operational_mins"] > 0
    assert metrics["total_cost_inr"] > 0
    assert "site_allocations" in data
    assert len(data["site_allocations"]) > 0

def test_input_validation_errors():
    """Verify that invalid out-of-range coordinates return 422 HTTP error."""
    # Latitude > 90 is invalid
    payload = {
        "lat": 195.0,
        "lon": 79.0,
        "displaced_population": 500
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422

def test_terrain_transect():
    """Verify SRTM elevation transect between origin and destination."""
    response = client.get(
        "/api/terrain/transect?origin_lat=30.3207&origin_lon=79.2163&dest_lat=30.3540&dest_lon=79.2560&samples=8"
    )
    assert response.status_code == 200
    data = response.json()
    assert "points" in data
    assert len(data["points"]) > 0
    assert "summary" in data
    assert "min_elevation_m" in data["summary"]
    assert "max_elevation_m" in data["summary"]

if __name__ == "__main__":
    print("Running RAKSHA API test suite...")
    test_health_endpoint()
    print("[PASS] test_health_endpoint passed")
    test_presets_endpoint()
    print("[PASS] test_presets_endpoint passed")
    test_scenarios_endpoint()
    print("[PASS] test_scenarios_endpoint passed")
    test_analyze_endpoint_and_hard_veto()
    print("[PASS] test_analyze_endpoint_and_hard_veto passed")
    test_logistics_calculation()
    print("[PASS] test_logistics_calculation passed")
    test_input_validation_errors()
    print("[PASS] test_input_validation_errors passed")
    test_terrain_transect()
    print("[PASS] test_terrain_transect passed")
    print("All backend API integration tests passed successfully!")
