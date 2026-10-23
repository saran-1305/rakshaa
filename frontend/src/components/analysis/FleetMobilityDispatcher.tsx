import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import { mockBackendService, type DynamicLogisticsResult } from '../../services/mockBackendService';
import { apiClient, type BackendLogisticsResponse } from '../../services/apiClient';
import { Truck, Clock, Gauge, Fuel, AlertTriangle, CheckCircle2, Database, ShieldAlert } from 'lucide-react';

interface FleetMobilityDispatcherProps {
  scenario: DisasterScenario;
}

export const FleetMobilityDispatcher: React.FC<FleetMobilityDispatcherProps> = ({ scenario }) => {
  const [population, setPopulation] = useState<number>(scenario.displaced_population);
  const [fleetSize, setFleetSize] = useState<number>(scenario.fleet_logistics.default_fleet_size);
  const [speedKmh, setSpeedKmh] = useState<number>(scenario.fleet_logistics.speed_kmh);

  const [backendResult, setBackendResult] = useState<BackendLogisticsResponse | null>(null);
  const [provenance, setProvenance] = useState<'FASTAPI_LIVE' | 'LOCAL_SYNTHETIC'>('LOCAL_SYNTHETIC');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  // Local fallback calculation (instantaneous response)
  const localFallbackResult: DynamicLogisticsResult = useMemo(() => {
    return mockBackendService.computeLogistics({
      scenario,
      totalPop: population,
      fleetCount: fleetSize,
      busCapacity: scenario.fleet_logistics.default_bus_capacity,
      speedKmh
    });
  }, [scenario, population, fleetSize, speedKmh]);

  // Query actual backend logistics endpoint with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsQuerying(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const approvedSites = scenario.candidate_sanctuaries.filter((s) => s.status === 'APPROVED');
        const totalApprovedCapacity = approvedSites.reduce((sum, s) => sum + s.sphere_capacity_persons, 0) || 1;

        let allocatedTotal = 0;
        const allocations = approvedSites.map((site, index) => {
          const isLast = index === approvedSites.length - 1;
          const proportion = site.sphere_capacity_persons / totalApprovedCapacity;
          const allocated = isLast ? Math.max(0, population - allocatedTotal) : Math.round(population * proportion);
          allocatedTotal += allocated;
          return {
            site_id: site.id,
            site_name: site.name,
            allocated_population: allocated,
            distance_km: site.distance_km,
            capacity: site.sphere_capacity_persons
          };
        });

        const res = await apiClient.calculateLogistics({
          allocations,
          scenario: scenario.id,
          vehicle_capacity: scenario.fleet_logistics.default_bus_capacity,
          available_fleet: fleetSize,
          speed_kmh: speedKmh,
          planning_window_mins: scenario.planning_window_mins
        });

        setBackendResult(res);
        setProvenance('FASTAPI_LIVE');
      } catch {
        // Transparent fallback to local synthetic calculator if backend is unavailable
        setBackendResult(null);
        setProvenance('LOCAL_SYNTHETIC');
      } finally {
        setIsQuerying(false);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [scenario, population, fleetSize, speedKmh]);

  // Unified data mapping
  const maxClearanceTime = backendResult
    ? backendResult.derived_metrics.estimated_operational_mins
    : localFallbackResult.summary.max_evacuation_time_mins;

  const isWithinWindow = backendResult
    ? backendResult.derived_metrics.is_within_planning_window
    : localFallbackResult.summary.is_within_window;

  const fuelDisplay = backendResult
    ? `${Math.round(backendResult.derived_metrics.fuel_cost_inr / 95)} Liters (₹${backendResult.derived_metrics.fuel_cost_inr.toLocaleString()})`
    : `${localFallbackResult.summary.fuel_consumption_liters} Liters`;

  const siteRows = backendResult
    ? backendResult.site_allocations.map((alloc) => ({
        site_id: alloc.site_id,
        site_name: alloc.site_name,
        distance_km: alloc.distance_km,
        allocated_population: alloc.allocated_population,
        loads_required: alloc.loads_required,
        clearance_mins: alloc.round_trip_cycle_mins,
        vehicle_hours: alloc.vehicle_hours
      }))
    : localFallbackResult.allocations.map((alloc) => ({
        site_id: alloc.site_id,
        site_name: alloc.site_name,
        distance_km: alloc.distance_km,
        allocated_population: alloc.allocated_population,
        loads_required: alloc.buses_assigned * alloc.trips_per_bus,
        clearance_mins: alloc.corridor_clearance_mins,
        vehicle_hours: Math.round((alloc.corridor_clearance_mins / 60) * alloc.buses_assigned)
      }));

  return (
    <div className="space-y-6">
      {/* Interactive Controls Panel */}
      <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-raksha-accent" />
            <h4 className="text-sm font-semibold text-white">Dynamic Fleet Mobility & Evacuation Turnaround Simulator</h4>
          </div>

          {/* Honest Provenance Badge */}
          <div className="flex items-center gap-2">
            {isQuerying ? (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/40 animate-pulse">
                RECALCULATING...
              </span>
            ) : provenance === 'FASTAPI_LIVE' ? (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/40">
                <Database className="w-3 h-3 text-emerald-400" />
                DISPATCH ENGINE: FASTAPI LIVE API
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-500/30">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                DISPATCH ENGINE: OFFLINE SYNTHETIC FALLBACK
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: Population */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60">Displaced Cohort Size:</span>
              <span className="text-raksha-accent font-bold">{population.toLocaleString()} Evacuees</span>
            </div>
            <input
              type="range"
              min={100}
              max={Math.max(20000, scenario.displaced_population * 2)}
              step={50}
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>100</span>
              <span>Default: {scenario.displaced_population.toLocaleString()}</span>
              <span>{Math.max(20000, scenario.displaced_population * 2).toLocaleString()}</span>
            </div>
          </div>

          {/* Slider 2: Fleet Size */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60">Available Bus Fleet:</span>
              <span className="text-emerald-400 font-bold">{fleetSize} Units (55-seater)</span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={1}
              value={fleetSize}
              onChange={(e) => setFleetSize(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>5 buses</span>
              <span>Default: {scenario.fleet_logistics.default_fleet_size}</span>
              <span>120 buses</span>
            </div>
          </div>

          {/* Slider 3: Speed */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60">Convoy Speed:</span>
              <span className="text-amber-400 font-bold">{speedKmh} km/h (Corridor Speed)</span>
            </div>
            <input
              type="range"
              min={15}
              max={75}
              step={1}
              value={speedKmh}
              onChange={(e) => setSpeedKmh(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>15 km/h</span>
              <span>Default: {scenario.fleet_logistics.speed_kmh}</span>
              <span>75 km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Outcome Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Clearance Time */}
        <div className={`p-4 rounded-xl border ${isWithinWindow ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">TOTAL CLEARANCE TIME</span>
            <Clock className={`w-4 h-4 ${isWithinWindow ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 text-white">
            {maxClearanceTime} <span className="text-xs text-white/50 font-normal">Mins</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-1 font-mono font-medium">
            {isWithinWindow ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Within Safe Window ({scenario.planning_window_mins}m limit)
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Exceeds Window ({scenario.planning_window_mins}m max)!
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Fleet Deployed */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">MOBILIZED VEHICLES</span>
            <Gauge className="w-4 h-4 text-raksha-accent" />
          </div>
          <div className="text-2xl font-bold text-raksha-accent font-mono mt-2">
            {fleetSize} <span className="text-xs text-white/50 font-normal">Buses</span>
          </div>
          <div className="text-[11px] text-white/60 mt-1">Instant Lift: {fleetSize * scenario.fleet_logistics.default_bus_capacity} Seats</div>
        </div>

        {/* Metric 3: Fuel Consumed */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">ESTIMATED FUEL & EXPENSE</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-400 font-mono mt-2 truncate">
            {fuelDisplay}
          </div>
          <div className="text-[11px] text-white/60 mt-1">High-Speed Diesel (HSD) reserve</div>
        </div>

        {/* Metric 4: Route Lifeline */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">PRIMARY CORRIDOR</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xs font-bold text-white font-sans mt-2 truncate">
            {scenario.primary_route_name}
          </div>
          <div className="text-[11px] text-white/60 mt-1 font-mono">
            Traffic Police Escort Certified
          </div>
        </div>
      </div>

      {/* Per-Sanctuary Fleet Allocation Table */}
      <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-4">
        <h4 className="text-sm font-semibold text-white">Multi-Site Bus Convoy Schedule & Turnaround Calculation</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="pb-3 font-medium">APPROVED SANCTUARY</th>
                <th className="pb-3 font-medium">DISTANCE</th>
                <th className="pb-3 font-medium">ALLOCATED COHORT</th>
                <th className="pb-3 font-medium">LOAD TRIPS REQUIRED</th>
                <th className="pb-3 font-medium">ESTIMATED VEHICLE HOURS</th>
                <th className="pb-3 font-medium text-right">CORRIDOR CYCLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {siteRows.map((site) => (
                <tr key={site.site_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-sans font-medium text-white">{site.site_name}</td>
                  <td className="py-3 text-white/70">{site.distance_km} km</td>
                  <td className="py-3 text-cyan-400 font-bold">{site.allocated_population.toLocaleString()} Evacuees</td>
                  <td className="py-3 text-emerald-400 font-bold">{site.loads_required} Vehicle Loads</td>
                  <td className="py-3 text-white/70">{site.vehicle_hours} Veh-Hours</td>
                  <td className="py-3 text-right font-bold text-white">
                    {site.clearance_mins} Mins
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {backendResult?.explainable_derivation && (
          <div className="p-3 rounded bg-white/[0.03] border border-white/10 text-[11px] font-mono text-white/60">
            <span className="text-cyan-400 font-bold">DERIVATION FORMULA: </span>
            {backendResult.explainable_derivation}
          </div>
        )}
      </div>
    </div>
  );
};
