/**
 * RAKSHA 2.0 — Typed API Client
 * Provides resilient, typed HTTP communication with the Python FastAPI backend.
 * Transparently tracks data provenance and handles network failures/fallbacks.
 */

export interface ComponentHealthInfo {
  status: 'live' | 'connected' | 'pre_indexed' | 'architecture' | 'fallback' | 'unavailable';
  latency_ms: number;
  source: string;
  [key: string]: any;
}

export interface BackendHealthResponse {
  system: string;
  overall_status: 'operational' | 'resilient_degraded';
  timestamp: string;
  components: Record<string, ComponentHealthInfo>;
}

export interface GlobalIncident {
  id: string;
  provider: 'USGS' | 'NASA_EONET' | 'RAKSHA_BENCHMARK' | string;
  provider_event_id: string;
  title: string;
  place: string;
  hazard_category: 'earthquake' | 'storm' | 'wildfire' | 'volcano' | 'flood' | 'landslide' | 'other';
  hazard_type: string;
  lat: number;
  lon: number;
  depth_km: number;
  severity: number;
  severity_unit: string;
  alert_level: 'critical' | 'warning' | 'moderate' | 'advisory';
  event_time: string;
  updated_time: string;
  source_url: string;
  is_demo_preset: boolean;
  can_run_relocation_analysis: boolean;
  default_population: number;
  planning_window_mins?: number;
  primary_route_name?: string;
  provenance: string;
  description?: string;
}

export interface GlobalIncidentsResponse {
  status: string;
  timestamp: string;
  cache_age_seconds: number;
  total_count: number;
  providers: Record<string, { status: string; count?: number; latency_ms?: number; [k: string]: any }>;
  incidents: GlobalIncident[];
}

export interface BackendPreset {
  id: string;
  name: string;
  lat: number;
  lon: number;
  hazard_type: string;
  default_population: number;
  description: string;
}

export interface BackendAnalysisRequest {
  lat: number;
  lon: number;
  displaced_population: number;
  hazard_type?: string;
  initial_radius_km?: number;
  step_km?: number;
  max_radius_km?: number;
}

export interface ProgressiveRingStep {
  radius: number;
  radius_km: number;
  ring: number;
  label: string;
  status: 'SUFFICIENT' | 'INSUFFICIENT' | string;
  candidates: number;
  candidates_count: number;
  newly_approved_count: number;
  newly_vetoed_count: number;
  safe_capacity: number;
  usable_capacity: number;
  cumulative_safe_capacity: number;
  remaining_shortfall: number;
}

export interface BackendAnalysisResponse {
  status: string;
  system_version: string;
  location_name: string;
  query_parameters: {
    latitude: number;
    longitude: number;
    displaced_population: number;
    hazard_type?: string;
  };
  data_provenance: {
    overall_mode: string;
    badge_color: string;
    sentinel1: string;
    sentinel2: string;
    cartosat3: string;
    weather: string;
    elevation: string;
    osm: string;
    bhuvan: string;
    worldpop: string;
    [key: string]: string;
  };
  worldpop_exposure: any;
  satellite_telemetry: any;
  sentinel1_sar_telemetry: any;
  cartosat3_validation: any;
  bhuvan_thematic: any;
  precipitation_telemetry: any;
  dynamic_aoi: {
    centroid: { lat: number; lon: number };
    hazard_index: number;
    base_radius_m: number;
    area_sq_km: number;
    polygon_coordinates: [number, number][];
    flow_bearing_deg: number;
  };
  relocation_decision: {
    status?: string;
    initial_radius_km?: number;
    final_search_radius_km?: number;
    search_increment_km?: number;
    max_operational_radius_km?: number;
    rings_searched_count?: number;
    rings_evaluated_count?: number;
    rings_evaluated?: ProgressiveRingStep[];
    search_steps?: ProgressiveRingStep[];
    displaced_population_target?: number;
    required_population_capacity?: number;
    total_safe_capacity_discovered?: number;
    total_usable_capacity_discovered?: number;
    approved_capacity?: number;
    capacity_fulfilled?: boolean;
    capacity_shortfall?: number;
    remaining_capacity_shortfall?: number;
    coverage_pct?: number;
    completion_status?: 'SUFFICIENT_SAFE_CAPACITY_FOUND' | 'OPERATIONAL_LIMIT_REACHED' | 'DATA_SOURCE_EXHAUSTED' | 'PROVIDER_FAILURE' | string;
    status_explanation?: string;
    candidate_count_per_ring?: Record<string, number>;
    newly_discovered_candidates_per_ring?: Record<string, number>;
    rejected_candidate_count?: number;
    veto_reasons_summary?: Record<string, number>;
    origin_elevation_m?: number;
    ranked_safe_sites?: any[];
    vetoed_sites?: any[];
    all_evaluated_candidates?: any[];
    multi_site_allocation?: any;
    [key: string]: any;
  };
}

export interface BackendLogisticsRequest {
  allocations?: {
    site_id: string;
    site_name: string;
    allocated_population: number;
    distance_km: number;
    capacity?: number;
  }[];
  scenario?: string;
  vehicle_capacity?: number;
  available_fleet?: number;
  speed_kmh?: number;
  load_mins?: number;
  unload_mins?: number;
  planning_window_mins?: number;
}

export interface BackendLogisticsResponse {
  user_configured: {
    vehicle_capacity: number;
    available_fleet: number;
    speed_kmh: number;
    planning_window_mins: number;
  };
  derived_metrics: {
    total_vehicles_required: number;
    trips_required: number;
    total_passenger_movements: number;
    estimated_vehicle_hours: number;
    estimated_operational_hours: number;
    estimated_operational_mins: number;
    estimated_buffer_mins: number;
    is_within_planning_window: boolean;
    total_cost_inr: number;
    fuel_cost_inr: number;
    crew_cost_inr: number;
  };
  explainable_derivation: string;
  site_allocations: {
    site_id: string;
    site_name: string;
    allocated_population: number;
    distance_km: number;
    loads_required: number;
    one_way_mins: number;
    round_trip_cycle_mins: number;
    vehicle_hours: number;
  }[];
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeoutMs: number = 8000;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.defaultTimeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Probes backend health and status of all Earth Observation & spatial components.
   */
  public async getHealth(): Promise<BackendHealthResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Retrieves live global disaster incidents normalized from USGS, NASA EONET, and verified presets.
   */
  public async getGlobalIncidents(params: {
    category?: string;
    min_severity?: number;
    include_demo?: boolean;
    refresh?: boolean;
  } = {}): Promise<GlobalIncidentsResponse> {
    const q = new URLSearchParams();
    if (params.category) q.append('category', params.category);
    if (params.min_severity !== undefined) q.append('min_severity', params.min_severity.toString());
    if (params.include_demo !== undefined) q.append('include_demo', params.include_demo.toString());
    if (params.refresh) q.append('refresh', 'true');

    const res = await this.fetchWithTimeout(`${this.baseUrl}/global-incidents?${q.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch global incidents: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Resolves detail for a single global incident or preset.
   */
  public async getGlobalIncident(incidentId: string): Promise<GlobalIncident> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/global-incidents/${encodeURIComponent(incidentId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch incident ${incidentId}: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Retrieves preset disaster hotspots.
   */
  public async getPresets(): Promise<BackendPreset[]> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/presets`);
    if (!res.ok) {
      throw new Error(`Failed to fetch presets: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Retrieves standard scenarios dictionary.
   */
  public async getScenarios(): Promise<Record<string, any>> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/scenarios`);
    if (!res.ok) {
      throw new Error(`Failed to fetch scenarios: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Runs the full relocation decision pipeline:
   * Dynamic AOI -> STAC Satellite Telemetry -> 5km Concentric Rings -> Zero-Tolerance Hard Veto -> Sphere Project allocation.
   */
  public async runAnalysis(req: BackendAnalysisRequest): Promise<BackendAnalysisResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/analyze`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Analysis failed (HTTP ${res.status}): ${errorText}`);
    }
    return res.json();
  }

  /**
   * Computes mathematical evacuation logistics based on fleet constraints.
   */
  public async calculateLogistics(req: BackendLogisticsRequest): Promise<BackendLogisticsResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/logistics/calculate`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Logistics calculation failed (HTTP ${res.status}): ${errorText}`);
    }
    return res.json();
  }

  /**
   * Queries WorldPop 100m gridded population API for demographic estimates.
   */
  public async getWorldPopStats(lat: number, lon: number, radiusKm: number = 3.0): Promise<any> {
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/population/worldpop?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`
    );
    if (!res.ok) {
      throw new Error(`WorldPop query failed: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Queries SRTM digital elevation transect along the evacuation route.
   */
  public async getTerrainTransect(
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number,
    samples: number = 14,
    destName?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      origin_lat: originLat.toString(),
      origin_lon: originLon.toString(),
      dest_lat: destLat.toString(),
      dest_lon: destLon.toString(),
      samples: samples.toString()
    });
    if (destName) params.append('dest_name', destName);

    const res = await this.fetchWithTimeout(`${this.baseUrl}/terrain/transect?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Terrain transect failed: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Queries ISRO Bhuvan / NRSC 1:50,000 Land Use / Land Cover.
   */
  public async getBhuvanThematic(lat: number, lon: number, siteName?: string): Promise<any> {
    const params = new URLSearchParams({ lat: lat.toString(), lon: lon.toString() });
    if (siteName) params.append('site_name', siteName);

    const res = await this.fetchWithTimeout(`${this.baseUrl}/bhuvan/thematic?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Bhuvan thematic query failed: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Queries Bhoonidhi authentication and Cartosat-3 access status.
   */
  public async getBhoonidhiStatus(): Promise<any> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/bhoonidhi/status`);
    if (!res.ok) {
      throw new Error(`Bhoonidhi status check failed: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Queries the AI Tactical Commander intelligence brief for live situational directives and what-if stress tests.
   */
  public async getTacticalBrief(payload: {
    scenario_id?: string;
    scenario_name?: string;
    hazard_type?: string;
    displaced_population?: number;
    planning_window_mins?: number;
    active_search_radius_km?: number;
    approved_capacity?: number;
    weather_hazard_index?: number;
    corridor_speed_kmh?: number;
    query?: string;
    stress_factors?: Record<string, any>;
  }): Promise<{
    scenario_id: string;
    situation_status: string;
    threat_level: string;
    effective_hazard_index: number;
    estimated_clearance_mins: number;
    planning_window_mins: number;
    is_within_window: boolean;
    buffer_mins: number;
    effective_capacity: number;
    displaced_population: number;
    capacity_deficit: number;
    executive_summary: string[];
    tactical_actions_matrix: Array<{ agency: string; priority: string; action: string }>;
    contingency_triggers: Array<{ trigger: string; response: string }>;
    custom_query_response?: string | null;
  }> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/ai/tactical-brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`AI Tactical Commander query failed: HTTP ${res.status}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();

