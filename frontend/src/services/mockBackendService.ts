import { SYNTHETIC_SCENARIOS, type DisasterScenario } from '../data/syntheticScenarios';

export interface SystemHealth {
  status: 'OPERATIONAL' | 'DEGRADED';
  mode: 'SYNTHETIC_OFFLINE_PROTOTYPE';
  latency_ms: number;
  components: {
    sentinel1_stac: string;
    sentinel2_stac: string;
    cartosat3_highres: string;
    isro_bhuvan_wms: string;
    worldpop_exposure: string;
    srtm_elevation_engine: string;
  };
}

export interface DynamicLogisticsResult {
  allocations: {
    site_id: string;
    site_name: string;
    allocated_population: number;
    distance_km: number;
    buses_assigned: number;
    trips_per_bus: number;
    corridor_clearance_mins: number;
  }[];
  summary: {
    total_evacuees: number;
    fleet_deployed: number;
    fleet_capacity_per_bus: number;
    convoy_speed_kmh: number;
    max_evacuation_time_mins: number;
    planning_window_mins: number;
    fuel_consumption_liters: number;
    is_within_window: boolean;
  };
}

export class MockBackendService {
  private static instance: MockBackendService;
  
  public static getInstance(): MockBackendService {
    if (!MockBackendService.instance) {
      MockBackendService.instance = new MockBackendService();
    }
    return MockBackendService.instance;
  }

  public async getHealth(): Promise<SystemHealth> {
    await this.delay(180);
    return {
      status: 'OPERATIONAL',
      mode: 'SYNTHETIC_OFFLINE_PROTOTYPE',
      latency_ms: 24,
      components: {
        sentinel1_stac: 'SYNTHETIC (Planetary Computer S1-GRD)',
        sentinel2_stac: 'SYNTHETIC (Copernicus S2-L2A)',
        cartosat3_highres: 'SYNTHETIC (ISRO Cartosat-3 0.28m PAN)',
        isro_bhuvan_wms: 'SYNTHETIC (NRSC 1:50k LULC)',
        worldpop_exposure: 'SYNTHETIC (WorldPop 100m Gridded)',
        srtm_elevation_engine: 'SYNTHETIC (SRTM 30m DEM)'
      }
    };
  }

  public getScenariosList(): { id: string; name: string; state: string; hazard_type: string; default_pop: number }[] {
    return Object.values(SYNTHETIC_SCENARIOS).map((s) => ({
      id: s.id,
      name: s.name,
      state: s.state,
      hazard_type: s.hazard_type,
      default_pop: s.displaced_population
    }));
  }

  public async getScenario(scenarioId: string): Promise<DisasterScenario> {
    await this.delay(350);
    const scenario = SYNTHETIC_SCENARIOS[scenarioId] || SYNTHETIC_SCENARIOS['devgram'];
    return scenario;
  }

  public async runLiveAnalysis(params: {
    scenarioId: string;
    overridePopulation?: number;
    overrideSpeed?: number;
    overrideFleet?: number;
  }): Promise<{
    scenario: DisasterScenario;
    logistics: DynamicLogisticsResult;
    executionTimeMs: number;
  }> {
    const startTime = performance.now();
    await this.delay(500); // Simulate realistic scanning latency

    const baseScenario = SYNTHETIC_SCENARIOS[params.scenarioId] || SYNTHETIC_SCENARIOS['devgram'];
    const totalPop = params.overridePopulation || baseScenario.displaced_population;
    const fleetCount = params.overrideFleet || baseScenario.fleet_logistics.default_fleet_size;
    const speed = params.overrideSpeed || baseScenario.fleet_logistics.speed_kmh;
    const busCap = baseScenario.fleet_logistics.default_bus_capacity;

    const logistics = this.computeLogistics({
      scenario: baseScenario,
      totalPop,
      fleetCount,
      busCapacity: busCap,
      speedKmh: speed
    });

    const endTime = performance.now();
    return {
      scenario: {
        ...baseScenario,
        displaced_population: totalPop
      },
      logistics,
      executionTimeMs: Math.round(endTime - startTime)
    };
  }

  public computeLogistics(params: {
    scenario: DisasterScenario;
    totalPop: number;
    fleetCount: number;
    busCapacity: number;
    speedKmh: number;
  }): DynamicLogisticsResult {
    const { scenario, totalPop, fleetCount, busCapacity, speedKmh } = params;
    const approvedSites = scenario.candidate_sanctuaries.filter((s) => s.status === 'APPROVED');
    
    const totalApprovedCapacity = approvedSites.reduce((sum, s) => sum + s.sphere_capacity_persons, 0) || 1;
    
    let allocatedTotal = 0;
    const allocations = approvedSites.map((site, index) => {
      const isLast = index === approvedSites.length - 1;
      const proportion = site.sphere_capacity_persons / totalApprovedCapacity;
      const allocated = isLast ? Math.max(0, totalPop - allocatedTotal) : Math.round(totalPop * proportion);
      allocatedTotal += allocated;

      // Fleet distribution based on cohort size
      const siteFleetProportion = Math.max(1, Math.round(fleetCount * (allocated / (totalPop || 1))));
      const tripsNeeded = Math.ceil(allocated / (siteFleetProportion * busCapacity || 1));
      
      const oneWayTransitHours = site.distance_km / Math.max(10, speedKmh);
      const oneWayTransitMins = oneWayTransitHours * 60;
      const turnaroundMinsPerTrip = oneWayTransitMins * 2 + 25; // 25 mins load/unload
      const totalTimeForSiteMins = Math.round(tripsNeeded * turnaroundMinsPerTrip);

      return {
        site_id: site.id,
        site_name: site.name,
        allocated_population: allocated,
        distance_km: site.distance_km,
        buses_assigned: siteFleetProportion,
        trips_per_bus: tripsNeeded,
        corridor_clearance_mins: totalTimeForSiteMins
      };
    });

    const maxTime = Math.max(...allocations.map((a) => a.corridor_clearance_mins), 60);
    const totalDistanceDriven = allocations.reduce((sum, a) => sum + a.distance_km * 2 * a.trips_per_bus * a.buses_assigned, 0);
    const fuelLiters = Math.round(totalDistanceDriven * 0.32); // 0.32 L/km for heavy transit buses

    return {
      allocations,
      summary: {
        total_evacuees: totalPop,
        fleet_deployed: fleetCount,
        fleet_capacity_per_bus: busCapacity,
        convoy_speed_kmh: speedKmh,
        max_evacuation_time_mins: maxTime,
        planning_window_mins: scenario.planning_window_mins,
        fuel_consumption_liters: fuelLiters,
        is_within_window: maxTime <= scenario.planning_window_mins
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockBackendService = MockBackendService.getInstance();
