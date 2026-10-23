"""
RAKSHA: Earth Observation & AI-Powered Disaster Relocation System
FastAPI Web Application & Live Geospatial API Server
"""

import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from satellite_service import SatelliteTelemetryService
from relocation_engine import RelocationEngine
from bhoonidhi_client import bhoonidhi_service
from bhuvan_client import bhuvan_service
from worldpop_client import worldpop_service
from global_events_service import global_events_service

app = FastAPI(
    title="RAKSHA Disaster Relocation Engine",
    description="Real-Time Earth Observation & Progressive Relocation Decision Intelligence",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Services
sat_service = SatelliteTelemetryService()
engine = RelocationEngine(satellite_service=sat_service)

# Mount Static Assets
assets_dir = os.path.join(os.path.dirname(__file__), "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

PRESET_HOTSPOTS = [
    {
        "id": "devgram",
        "name": "Devgram Hazard Habitation (Chamoli, Uttarakhand)",
        "lat": 30.3207,
        "lon": 79.2163,
        "hazard_type": "Glacial Inundation & Landslide Runoff",
        "default_population": 720,
        "description": "High-risk mountain settlement in Chamoli with multi-hazard flood and landslide exposure."
    },
    {
        "id": "wayanad",
        "name": "Wayanad Landslide Core (Meppadi/Chooralmala, Kerala)",
        "lat": 11.5126,
        "lon": 76.1287,
        "hazard_type": "Landslide & Torrential Inundation",
        "default_population": 2450,
        "description": "High-gradient Western Ghats terrain impacted by intense cloudbursts and debris flows."
    },
    {
        "id": "silchar",
        "name": "Silchar / Barak Valley Inundation (Assam)",
        "lat": 24.8333,
        "lon": 92.7789,
        "hazard_type": "Riverine Inundation & Embankment Breach",
        "default_population": 14800,
        "description": "Extensive urban and rural lowlands flooded by Barak River overflow."
    },
    {
        "id": "chamoli",
        "name": "Joshimath / Chamoli Subsidence Zone (Uttarakhand)",
        "lat": 30.5574,
        "lon": 79.5670,
        "hazard_type": "Land Subsidence & Slope Destabilization",
        "default_population": 2800,
        "description": "High-altitude fragile Himalayan moraine slopes experiencing ground fissures."
    },
    {
        "id": "munambam",
        "name": "Munambam Coastal Erosion & Storm Surge (Ernakulam, Kerala)",
        "lat": 10.1792,
        "lon": 76.1738,
        "hazard_type": "Coastal Storm Surge & Sea Ingress",
        "default_population": 3500,
        "description": "Narrow barrier spit vulnerable to cyclone swells and tidal embankment overflow."
    }
]

class AnalysisRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude [-90.0 to 90.0]")
    lon: float = Field(..., ge=-180.0, le=180.0, description="Longitude [-180.0 to 180.0]")
    displaced_population: int = Field(default=3500, ge=50, le=500000, description="Scenario Displaced Population [50 - 500,000]")
    hazard_type: Optional[str] = Field(default="Multi-Hazard Crisis", max_length=100)
    initial_radius_km: Optional[float] = Field(default=5.0, ge=1.0, le=50.0, description="Initial search radius (km)")
    step_km: Optional[float] = Field(default=5.0, ge=1.0, le=25.0, description="Progressive ring expansion increment (km)")
    max_radius_km: Optional[float] = Field(default=25.0, ge=5.0, le=100.0, description="Operational maximum search radius (km)")

@app.get("/api/health")
def health_check():
    return sat_service.probe_component_health()

@app.get("/api/global-incidents")
def get_global_incidents(
    category: Optional[str] = None,
    min_severity: Optional[float] = None,
    include_demo: bool = True,
    refresh: bool = False
):
    """
    Returns global disaster incidents normalized from USGS, NASA EONET, and verified presets.
    """
    return global_events_service.fetch_all_incidents(
        category=category,
        min_severity=min_severity,
        include_demo=include_demo,
        force_refresh=refresh
    )

@app.get("/api/global-incidents/{incident_id}")
def get_global_incident_detail(incident_id: str):
    """
    Returns full details for a specific global incident or preset.
    """
    incident = global_events_service.get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")
    return incident

@app.get("/api/presets")
def get_presets():
    return PRESET_HOTSPOTS

@app.get("/api/scenarios")
def get_scenarios():
    return {
        "devgram": {
            "id": "devgram",
            "name": "Devgram Village (Urgam Valley, Chamoli, Uttarakhand)",
            "lat": 30.3207,
            "lon": 79.2163,
            "hazard_type": "Glacial Inundation & Mountain Flash Flood",
            "displaced_population": 720,
            "planning_window_mins": 180,
            "primary_route_name": "Urgam-Helang Road ➔ NH-58 Badrinath Corridor",
            "primary_distance_km": 5.31
        },
        "wayanad": {
            "id": "wayanad",
            "name": "Chooralmala / Mundakkai (Meppadi, Wayanad, Kerala)",
            "lat": 11.5126,
            "lon": 76.1287,
            "hazard_type": "Landslide Runoff & Torrential Debris Flow",
            "displaced_population": 2450,
            "planning_window_mins": 180,
            "primary_route_name": "SH-59 Meppadi-Chooralmala Hill Highway",
            "primary_distance_km": 6.57
        },
        "silchar": {
            "id": "silchar",
            "name": "Silchar Flood Plain / Bethukandi Breach (Cachar, Assam)",
            "lat": 24.8333,
            "lon": 92.7789,
            "hazard_type": "Riverine Flood & Embankment Breach",
            "displaced_population": 14800,
            "planning_window_mins": 300,
            "primary_route_name": "Silchar-Hailakandi Elevated Corridor / NH-37",
            "primary_distance_km": 10.16
        }
    }

class LogisticsCalcRequest(BaseModel):
    allocations: Optional[List[Dict[str, Any]]] = None
    scenario: Optional[str] = None
    vehicle_capacity: int = Field(default=60, ge=5, le=200)
    available_fleet: int = Field(default=80, ge=1, le=1000)
    speed_kmh: float = Field(default=30.0, ge=5.0, le=120.0)
    load_mins: float = Field(default=20.0, ge=1.0, le=180.0)
    unload_mins: float = Field(default=15.0, ge=1.0, le=180.0)
    planning_window_mins: float = Field(default=160.0, ge=30.0, le=1440.0)

@app.post("/api/logistics/calculate")
def calculate_logistics(req: LogisticsCalcRequest):
    allocs = req.allocations
    plan_window = req.planning_window_mins

    if not allocs and req.scenario:
        scen_meta = get_scenarios().get(req.scenario)
        if scen_meta:
            plan_window = scen_meta.get("planning_window_mins", plan_window)
            eval_res = engine.evaluate_relocation_rings(
                centroid_lat=scen_meta["lat"],
                centroid_lon=scen_meta["lon"],
                displaced_population=scen_meta["displaced_population"],
                hazard_level="High",
                hazard_type=scen_meta["hazard_type"]
            )
            allocs = eval_res.get("multi_site_allocation", {}).get("allocations", [])

    if not allocs:
        # Default fallback to Devgram allocations if none provided
        allocs = [
            {"site_id": "site-1", "site_name": "Pipalkoti Institutional Complex", "allocated_population": 350, "distance_km": 5.31, "capacity": 350},
            {"site_id": "site-2", "site_name": "Helang Community Campus", "allocated_population": 250, "distance_km": 7.82, "capacity": 250},
            {"site_id": "site-3", "site_name": "GIC Joshimath Corridor Ground", "allocated_population": 120, "distance_km": 11.45, "capacity": 200}
        ]

    return engine.compute_detailed_logistics(
        allocations=allocs,
        vehicle_capacity=req.vehicle_capacity,
        available_fleet=req.available_fleet,
        speed_kmh=req.speed_kmh,
        load_mins=req.load_mins,
        unload_mins=req.unload_mins,
        planning_window_mins=plan_window
    )

@app.post("/api/analyze")
def run_analysis(req: AnalysisRequest):
    try:
        # 1. Resolve Location
        loc_name = sat_service.get_location_name(req.lat, req.lon)

        # 2a. Live Optical Satellite EO Query (Sentinel-2 L2A STAC)
        sentinel_telemetry = sat_service.fetch_sentinel2_scene(req.lat, req.lon)

        # 2b. Live All-Weather Radar Satellite EO Query (Sentinel-1 C-Band SAR STAC)
        sentinel1_telemetry = sat_service.fetch_sentinel1_sar_scene(req.lat, req.lon)

        # 3. Live Satellite Precipitation & Soil Moisture
        meteo_telemetry = sat_service.fetch_satellite_precipitation(req.lat, req.lon)

        hazard_index = meteo_telemetry.get("computed_hazard_index", 0.65)
        hazard_level = meteo_telemetry.get("hazard_level", "Elevated")

        # 4. Compute Dynamic AOI
        aoi_data = engine.compute_dynamic_aoi(
            centroid_lat=req.lat,
            centroid_lon=req.lon,
            hazard_index=hazard_index
        )

        # 4b. WorldPop 100m Gridded Population Exposure Query (Open Access CC BY 4.0)
        worldpop_exposure = worldpop_service.estimate_aoi_exposure(
            aoi_coords_lat_lon=aoi_data.get("polygon_coordinates", []),
            census_scenario_pop=req.displaced_population
        )

        # 5. Progressive Concentric Ring Evaluation & Multi-Criteria Ranking
        relocation_results = engine.evaluate_relocation_rings(
            centroid_lat=req.lat,
            centroid_lon=req.lon,
            displaced_population=req.displaced_population,
            hazard_level=hazard_level,
            hazard_index=hazard_index,
            flow_bearing_deg=aoi_data.get("flow_bearing_deg", 135.0),
            hazard_type=req.hazard_type,
            initial_radius_km=req.initial_radius_km or 5.0,
            step_km=req.step_km or 5.0,
            max_radius_km=req.max_radius_km or 25.0
        )

        # 6. Cartosat-3 Sub-Meter High-Resolution Validation for Top Recommended Site
        top_site = relocation_results.get("ranked_safe_sites", [{}])[0] if relocation_results.get("ranked_safe_sites") else None
        cartosat_validation = sat_service.validate_cartosat3_site(top_site) if top_site else {}
        relocation_results["cartosat3_validation"] = cartosat_validation
        relocation_results["sentinel1_sar_telemetry"] = sentinel1_telemetry

        # 7. ISRO Bhuvan / NRSC 1:50k LULC & Historical Disaster Screening
        bhuvan_thematic = sat_service.fetch_bhuvan_thematic(top_site, req.lat, req.lon) if top_site else {}
        relocation_results["bhuvan_thematic"] = bhuvan_thematic

        provenance = relocation_results.get("data_provenance", {})
        provenance["worldpop"] = worldpop_exposure.get("status", "LIVE")

        return {
            "status": "success",
            "system_version": "RAKSHA Engine 2.0",
            "location_name": loc_name,
            "query_parameters": {
                "latitude": req.lat,
                "longitude": req.lon,
                "displaced_population": req.displaced_population,
                "hazard_type": req.hazard_type
            },
            "data_provenance": provenance,
            "worldpop_exposure": worldpop_exposure,
            "satellite_telemetry": sentinel_telemetry,
            "sentinel1_sar_telemetry": sentinel1_telemetry,
            "cartosat3_validation": cartosat_validation,
            "bhuvan_thematic": bhuvan_thematic,
            "precipitation_telemetry": meteo_telemetry,
            "dynamic_aoi": aoi_data,
            "relocation_decision": relocation_results
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/population/worldpop")
def get_worldpop_stats(lat: float, lon: float, radius_km: float = 3.0):
    """
    Queries the live WorldPop 100m gridded population API for an area around (lat, lon).
    Open Access under Creative Commons Attribution 4.0 (No API key required).
    """
    return worldpop_service.estimate_point_exposure(lat, lon, radius_km)

@app.get("/api/terrain/transect")
def get_terrain_transect(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    samples: int = 14,
    dest_name: Optional[str] = "Relocation Target Site"
):
    try:
        transect = sat_service.fetch_elevation_transect(
            start_lat=origin_lat,
            start_lon=origin_lon,
            end_lat=dest_lat,
            end_lon=dest_lon,
            samples=samples
        )
        transect["origin"] = {"lat": origin_lat, "lon": origin_lon}
        transect["destination"] = {"lat": dest_lat, "lon": dest_lon, "name": dest_name}
        return transect
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bhuvan/thematic")
def get_bhuvan_thematic(lat: float, lon: float, site_name: Optional[str] = None):
    return bhuvan_service.query_thematic_lulc(lat, lon, site_name or "")

@app.get("/api/bhoonidhi/status")
def get_bhoonidhi_status():
    return bhoonidhi_service.get_auth_status()

@app.get("/api/cartosat/validate")
def get_cartosat_validation(lat: float, lon: float, site_name: Optional[str] = None):
    mock_site = {
        "name": site_name or "Target Zone",
        "lat": lat,
        "lon": lon,
        "coordinates": {"lat": lat, "lon": lon},
        "gross_area_sqm": 125000
    }
    return sat_service.validate_cartosat3_site(mock_site)

@app.get("/favicon.svg")
@app.get("/favicon.ico")
def serve_favicon():
    fav_path = os.path.join(os.path.dirname(__file__), "favicon.svg")
    if os.path.exists(fav_path):
        return FileResponse(fav_path, media_type="image/svg+xml")
    return HTMLResponse("", status_code=204)

@app.get("/icons.svg")
def serve_icons():
    icons_path = os.path.join(os.path.dirname(__file__), "icons.svg")
    if os.path.exists(icons_path):
        return FileResponse(icons_path, media_type="image/svg+xml")
    return HTMLResponse("", status_code=204)

@app.get("/", response_class=HTMLResponse)
@app.get("/landing", response_class=HTMLResponse)
def serve_landing():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "landing.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Landing template not found</h1>"

@app.get("/overview", response_class=HTMLResponse)
@app.get("/executive-summary", response_class=HTMLResponse)
@app.get("/summary", response_class=HTMLResponse)
def serve_overview():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "overview.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Overview template not found</h1>"

@app.get("/simulation", response_class=HTMLResponse)
@app.get("/deep-diagnostic", response_class=HTMLResponse)
def serve_simulation():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "index.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Deep Diagnostic template not found</h1>"

@app.get("/eo-studio", response_class=HTMLResponse)
@app.get("/earth-observation", response_class=HTMLResponse)
@app.get("/satellite", response_class=HTMLResponse)
def serve_eo_studio():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "satellite.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA EO Studio template not found</h1>"

@app.get("/hazard-lab", response_class=HTMLResponse)
@app.get("/hazard", response_class=HTMLResponse)
def serve_hazard_lab():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "hazard_lab.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Hazard Intelligence Lab template not found</h1>"

@app.get("/relocation", response_class=HTMLResponse)
@app.get("/relocation-engine", response_class=HTMLResponse)
def serve_relocation():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "relocation.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Relocation Decision Studio template not found</h1>"

@app.get("/workflow", response_class=HTMLResponse)
@app.get("/workflow/{step}", response_class=HTMLResponse)
@app.get("/relocation-workflow", response_class=HTMLResponse)
def serve_workflow(step: str = "1"):
    template_path = os.path.join(os.path.dirname(__file__), "templates", "workflow.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Relocation Workflow template not found</h1>"

@app.get("/fleet", response_class=HTMLResponse)
@app.get("/mobility", response_class=HTMLResponse)
@app.get("/plan", response_class=HTMLResponse)
@app.get("/logistics-dispatch", response_class=HTMLResponse)
@app.get("/logistics", response_class=HTMLResponse)
def serve_fleet():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "logistics.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Fleet Logistics template not found</h1>"

@app.get("/ddma", response_class=HTMLResponse)
@app.get("/ddma-dossier", response_class=HTMLResponse)
@app.get("/dossier", response_class=HTMLResponse)
def serve_ddma():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "dossier.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA DDMA Legal Dossier template not found</h1>"

@app.get("/presentation", response_class=HTMLResponse)
@app.get("/script", response_class=HTMLResponse)
def serve_presentation():
    template_path = os.path.join(os.path.dirname(__file__), "templates", "presentation.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>RAKSHA Presentation Script template not found</h1>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8050, reload=False)

