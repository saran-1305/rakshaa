"""
RAKSHA 2.0 - Global Disaster Intelligence Events Service
Ingests, normalizes, deduplicates, and caches global disaster feeds:
1. USGS Earthquake Real-Time GeoJSON Feed (M4.5+ Global & Significant)
2. NASA EONET Natural Event Tracker (Severe Storms, Cyclones, Wildfires, Volcanoes, Floods)
3. RAKSHA Verified Regional Disaster Presets (Chamoli, Wayanad, Silchar, Joshimath, Munambam)
"""

import time
import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import requests

logger = logging.getLogger("RAKSHA_GlobalEvents")

class GlobalEventsService:
    def __init__(self, cache_ttl_seconds: int = 180):
        self.cache_ttl = cache_ttl_seconds
        self._cached_incidents: List[Dict[str, Any]] = []
        self._cached_providers: Dict[str, Any] = {}
        self._last_fetch_time: float = 0.0

        self.usgs_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson"
        self.eonet_url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=60"
        self.headers = {"User-Agent": "RAKSHA-Disaster-Intelligence/2.0 (contact: info@raksha-disaster.org)"}

    def get_regional_presets(self) -> List[Dict[str, Any]]:
        """Returns RAKSHA's 5 verified regional benchmark scenarios clearly tagged as demo presets."""
        return [
            {
                "id": "devgram",
                "provider": "RAKSHA_BENCHMARK",
                "provider_event_id": "PRESET-DEVGRAM",
                "title": "Devgram Glacial Debris Flow & Inundation",
                "place": "Chamoli District, Uttarakhand, India",
                "hazard_category": "flood",
                "hazard_type": "Glacial Inundation & Debris Flow",
                "lat": 30.3207,
                "lon": 79.2163,
                "depth_km": 0.0,
                "severity": 0.88,
                "severity_unit": "hazard_index",
                "alert_level": "critical",
                "event_time": "2026-10-20T14:30:00Z",
                "updated_time": "2026-10-23T06:00:00Z",
                "source_url": "https://nrsc.gov.in/disaster_management",
                "is_demo_preset": True,
                "can_run_relocation_analysis": True,
                "default_population": 720,
                "planning_window_mins": 180,
                "primary_route_name": "Urgam-Helang Road ➔ NH-58 Badrinath Corridor",
                "provenance": "VERIFIED_REGIONAL_BENCHMARK",
                "description": "High-risk mountain settlement in Chamoli with multi-hazard flood and steep debris flow exposure."
            },
            {
                "id": "wayanad",
                "provider": "RAKSHA_BENCHMARK",
                "provider_event_id": "PRESET-WAYANAD",
                "title": "Chooralmala / Meppadi Torrential Landslide",
                "place": "Wayanad District, Kerala, India",
                "hazard_category": "landslide",
                "hazard_type": "Landslide Runoff & Torrential Debris Flow",
                "lat": 11.5126,
                "lon": 76.1287,
                "depth_km": 0.0,
                "severity": 0.94,
                "severity_unit": "hazard_index",
                "alert_level": "critical",
                "event_time": "2026-10-20T18:00:00Z",
                "updated_time": "2026-10-23T06:00:00Z",
                "source_url": "https://keralasdda.gov.in",
                "is_demo_preset": True,
                "can_run_relocation_analysis": True,
                "default_population": 2450,
                "planning_window_mins": 180,
                "primary_route_name": "SH-59 Meppadi-Chooralmala Hill Highway",
                "provenance": "VERIFIED_REGIONAL_BENCHMARK",
                "description": "High-gradient Western Ghats terrain impacted by intense cloudbursts and massive debris torrents."
            },
            {
                "id": "silchar",
                "provider": "RAKSHA_BENCHMARK",
                "provider_event_id": "PRESET-SILCHAR",
                "title": "Silchar / Barak River Embankment Breach",
                "place": "Cachar District, Assam, India",
                "hazard_category": "flood",
                "hazard_type": "Riverine Flood & Embankment Breach",
                "lat": 24.8333,
                "lon": 92.7789,
                "depth_km": 0.0,
                "severity": 0.82,
                "severity_unit": "hazard_index",
                "alert_level": "warning",
                "event_time": "2026-10-21T02:00:00Z",
                "updated_time": "2026-10-23T06:00:00Z",
                "source_url": "https://asdma.assam.gov.in",
                "is_demo_preset": True,
                "can_run_relocation_analysis": True,
                "default_population": 14800,
                "planning_window_mins": 300,
                "primary_route_name": "Silchar-Hailakandi Elevated Corridor / NH-37",
                "provenance": "VERIFIED_REGIONAL_BENCHMARK",
                "description": "Extensive urban and rural lowlands flooded by Barak River overflow and Bethukandi breach."
            },
            {
                "id": "chamoli",
                "provider": "RAKSHA_BENCHMARK",
                "provider_event_id": "PRESET-JOSHIMATH",
                "title": "Joshimath Town Slope Subsidence Zone",
                "place": "Chamoli District, Uttarakhand, India",
                "hazard_category": "landslide",
                "hazard_type": "Land Subsidence & Slope Destabilization",
                "lat": 30.5574,
                "lon": 79.5670,
                "depth_km": 0.0,
                "severity": 0.76,
                "severity_unit": "hazard_index",
                "alert_level": "warning",
                "event_time": "2026-10-21T10:00:00Z",
                "updated_time": "2026-10-23T06:00:00Z",
                "source_url": "https://usdda.uk.gov.in",
                "is_demo_preset": True,
                "can_run_relocation_analysis": True,
                "default_population": 2800,
                "planning_window_mins": 240,
                "primary_route_name": "Joshimath-Auli Strategic Road",
                "provenance": "VERIFIED_REGIONAL_BENCHMARK",
                "description": "High-altitude fragile Himalayan moraine slopes experiencing ground fissures and foundation shear."
            },
            {
                "id": "munambam",
                "provider": "RAKSHA_BENCHMARK",
                "provider_event_id": "PRESET-MUNAMBAM",
                "title": "Munambam Coastal Surge & Sea Ingress",
                "place": "Ernakulam District, Kerala, India",
                "hazard_category": "storm",
                "hazard_type": "Coastal Storm Surge & Tidal Ingress",
                "lat": 10.1792,
                "lon": 76.1738,
                "depth_km": 0.0,
                "severity": 0.72,
                "severity_unit": "hazard_index",
                "alert_level": "advisory",
                "event_time": "2026-10-22T04:00:00Z",
                "updated_time": "2026-10-23T06:00:00Z",
                "source_url": "https://incois.gov.in",
                "is_demo_preset": True,
                "can_run_relocation_analysis": True,
                "default_population": 3500,
                "planning_window_mins": 180,
                "primary_route_name": "Vypin-Pallippuram Coastal Elevated Road",
                "provenance": "VERIFIED_REGIONAL_BENCHMARK",
                "description": "Narrow barrier spit vulnerable to cyclone swells and tidal embankment overflow."
            }
        ]

    def _fetch_usgs(self) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Fetches and normalizes USGS M4.5+ global earthquake feeds."""
        t0 = time.time()
        try:
            res = requests.get(self.usgs_url, headers=self.headers, timeout=4.5)
            latency = int((time.time() - t0) * 1000)
            if res.status_code != 200:
                return [], {"status": "HTTP_ERROR", "code": res.status_code, "latency_ms": latency}

            data = res.json()
            features = data.get("features", [])
            normalized = []

            for f in features:
                props = f.get("properties", {})
                geom = f.get("geometry", {})
                coords = geom.get("coordinates", [0, 0, 0])
                if len(coords) < 2:
                    continue

                lon, lat = coords[0], coords[1]
                depth = coords[2] if len(coords) > 2 else 10.0
                mag = props.get("mag", 4.5)
                f_id = f.get("id") or props.get("code") or f"usgs_{int(lat*100)}_{int(lon*100)}"

                # Alert classification
                if mag >= 6.5:
                    alert = "critical"
                elif mag >= 5.5:
                    alert = "warning"
                else:
                    alert = "moderate"

                event_ms = props.get("time") or int(time.time() * 1000)
                event_iso = datetime.fromtimestamp(event_ms / 1000.0, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

                updated_ms = props.get("updated") or event_ms
                updated_iso = datetime.fromtimestamp(updated_ms / 1000.0, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

                normalized.append({
                    "id": f"usgs-{f_id}",
                    "provider": "USGS",
                    "provider_event_id": f_id,
                    "title": props.get("title") or f"M {mag} Earthquake",
                    "place": props.get("place") or f"Coordinates {lat:.2f}, {lon:.2f}",
                    "hazard_category": "earthquake",
                    "hazard_type": f"Earthquake (M {mag:.1f})",
                    "lat": round(lat, 4),
                    "lon": round(lon, 4),
                    "depth_km": round(depth, 1),
                    "severity": round(mag, 1),
                    "severity_unit": "magnitude",
                    "alert_level": alert,
                    "event_time": event_iso,
                    "updated_time": updated_iso,
                    "source_url": props.get("url") or f"https://earthquake.usgs.gov/earthquakes/eventpage/{f_id}",
                    "is_demo_preset": False,
                    "can_run_relocation_analysis": True,
                    "default_population": int(max(500, min(100000, 10 ** (mag - 2.5) * 50))),
                    "planning_window_mins": 180,
                    "primary_route_name": f"Regional Access Corridor to {props.get('place', 'Epicenter')}",
                    "provenance": "LIVE_USGS_FEED",
                    "description": f"USGS Real-Time Seismic Detection: Magnitude {mag:.1f} at depth {depth:.1f} km."
                })

            return normalized, {"status": "LIVE", "count": len(normalized), "latency_ms": latency}
        except Exception as e:
            return [], {"status": "UNAVAILABLE", "error": str(e), "latency_ms": int((time.time() - t0) * 1000)}

    def _fetch_eonet(self) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Fetches and normalizes NASA EONET natural disaster events."""
        t0 = time.time()
        try:
            res = requests.get(self.eonet_url, headers=self.headers, timeout=4.5)
            latency = int((time.time() - t0) * 1000)
            if res.status_code != 200:
                return [], {"status": "HTTP_ERROR", "code": res.status_code, "latency_ms": latency}

            data = res.json()
            events = data.get("events", [])
            normalized = []

            for ev in events:
                e_id = ev.get("id")
                title = ev.get("title", "Natural Hazard Event")
                cats = ev.get("categories", [{}])
                cat_id = cats[0].get("id", "severeStorms") if cats else "severeStorms"
                cat_title = cats[0].get("title", "Severe Storm") if cats else "Severe Storm"

                # Map EONET category to RAKSHA hazard_category
                if "storm" in cat_id.lower() or "cyclone" in title.lower():
                    hazard_cat = "storm"
                elif "fire" in cat_id.lower():
                    hazard_cat = "wildfire"
                elif "volcano" in cat_id.lower():
                    hazard_cat = "volcano"
                elif "flood" in cat_id.lower():
                    hazard_cat = "flood"
                elif "landslide" in cat_id.lower():
                    hazard_cat = "landslide"
                else:
                    hazard_cat = "other"

                geometries = ev.get("geometry", [])
                if not geometries:
                    continue

                # Take the latest coordinate point
                latest_geom = geometries[-1]
                coords = latest_geom.get("coordinates", [])
                if len(coords) < 2:
                    continue

                lon, lat = coords[0], coords[1]
                event_date = latest_geom.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
                mag_val = latest_geom.get("magnitudeValue") or 50.0
                mag_unit = latest_geom.get("magnitudeUnit") or "severity"

                sources = ev.get("sources", [{}])
                source_url = sources[0].get("url") if sources else f"https://eonet.gsfc.nasa.gov/api/v3/events/{e_id}"

                normalized.append({
                    "id": f"eonet-{e_id}",
                    "provider": "NASA_EONET",
                    "provider_event_id": e_id,
                    "title": title,
                    "place": f"Global Sector ({lat:.2f}°, {lon:.2f}°)",
                    "hazard_category": hazard_cat,
                    "hazard_type": f"{cat_title}",
                    "lat": round(lat, 4),
                    "lon": round(lon, 4),
                    "depth_km": 0.0,
                    "severity": round(float(mag_val), 1) if isinstance(mag_val, (int, float)) else 50.0,
                    "severity_unit": mag_unit,
                    "alert_level": "critical" if hazard_cat in ["storm", "volcano"] else "warning",
                    "event_time": event_date,
                    "updated_time": event_date,
                    "source_url": source_url,
                    "is_demo_preset": False,
                    "can_run_relocation_analysis": True,
                    "default_population": 4500,
                    "planning_window_mins": 240,
                    "primary_route_name": f"Evacuation Corridor for {title}",
                    "provenance": "LIVE_NASA_EONET",
                    "description": f"NASA EONET Active Hazard Tracking: Category {cat_title} with {mag_val} {mag_unit}."
                })

            return normalized, {"status": "LIVE", "count": len(normalized), "latency_ms": latency}
        except Exception as e:
            return [], {"status": "UNAVAILABLE", "error": str(e), "latency_ms": int((time.time() - t0) * 1000)}

    def fetch_all_incidents(
        self,
        category: Optional[str] = None,
        min_severity: Optional[float] = None,
        include_demo: bool = True,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Retrieves, deduplicates, and caches global incidents with provider provenance metrics.
        """
        now = time.time()
        # Use cache if within TTL
        if not force_refresh and self._cached_incidents and (now - self._last_fetch_time) < self.cache_ttl:
            all_events = list(self._cached_incidents)
            provider_stats = dict(self._cached_providers)
        else:
            usgs_events, usgs_stat = self._fetch_usgs()
            eonet_events, eonet_stat = self._fetch_eonet()
            presets = self.get_regional_presets()

            provider_stats = {
                "usgs": usgs_stat,
                "nasa_eonet": eonet_stat,
                "regional_demo": {"status": "PRESET_BENCHMARK", "count": len(presets)}
            }

            combined = []
            seen_coords = set()

            # Add demo presets first
            for p in presets:
                coord_key = (round(p["lat"], 2), round(p["lon"], 2))
                seen_coords.add(coord_key)
                combined.append(p)

            # Add USGS earthquakes
            for ev in usgs_events:
                coord_key = (round(ev["lat"], 2), round(ev["lon"], 2))
                if coord_key not in seen_coords:
                    seen_coords.add(coord_key)
                    combined.append(ev)

            # Add NASA EONET events
            for ev in eonet_events:
                coord_key = (round(ev["lat"], 2), round(ev["lon"], 2))
                if coord_key not in seen_coords:
                    seen_coords.add(coord_key)
                    combined.append(ev)

            self._cached_incidents = combined
            self._cached_providers = provider_stats
            self._last_fetch_time = now
            all_events = combined

        # Apply filtering
        filtered = []
        for ev in all_events:
            if not include_demo and ev.get("is_demo_preset"):
                continue

            if category and category != "all":
                if category == "demo" and not ev.get("is_demo_preset"):
                    continue
                elif category != "demo" and ev.get("hazard_category") != category:
                    continue

            if min_severity is not None:
                if ev.get("severity", 0) < min_severity:
                    continue

            filtered.append(ev)

        return {
            "status": "success",
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "cache_age_seconds": round(now - self._last_fetch_time, 1),
            "total_count": len(filtered),
            "providers": provider_stats,
            "incidents": filtered
        }

    def get_incident_by_id(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Resolves an incident by its ID (either preset or external)."""
        # Ensure cache populated
        if not self._cached_incidents:
            self.fetch_all_incidents()

        for inc in self._cached_incidents:
            if inc["id"] == incident_id:
                return inc

        # Check presets directly if not found in cache
        for p in self.get_regional_presets():
            if p["id"] == incident_id:
                return p

        return None

global_events_service = GlobalEventsService()
