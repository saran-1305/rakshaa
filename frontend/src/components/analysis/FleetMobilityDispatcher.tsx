import React, { useState, useMemo } from 'react';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import { mockBackendService } from '../../services/mockBackendService';
import { Truck, Clock, Gauge, Fuel, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FleetMobilityDispatcherProps {
  scenario: DisasterScenario;
}

export const FleetMobilityDispatcher: React.FC<FleetMobilityDispatcherProps> = ({ scenario }) => {
  const [population, setPopulation] = useState<number>(scenario.displaced_population);
  const [fleetSize, setFleetSize] = useState<number>(scenario.fleet_logistics.default_fleet_size);
  const [speedKmh, setSpeedKmh] = useState<number>(scenario.fleet_logistics.speed_kmh);

  // Re-run dynamic logistics calculations in real time using synthetic engine
  const logisticsResult = useMemo(() => {
    return mockBackendService.computeLogistics({
      scenario,
      totalPop: population,
      fleetCount: fleetSize,
      busCapacity: scenario.fleet_logistics.default_bus_capacity,
      speedKmh
    });
  }, [scenario, population, fleetSize, speedKmh]);

  const { summary, allocations } = logisticsResult;

  return (
    <div className="space-y-6">
      {/* Interactive Controls Panel */}
      <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-raksha-accent" />
            <h4 className="text-sm font-semibold text-white">Dynamic Fleet Mobility & Evacuation Turnaround Simulator</h4>
          </div>
          <span className="text-xs font-mono text-raksha-accent bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/40">
            REAL-TIME DISPATCH ENGINE
          </span>
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
              <span>Default: {scenario.displaced_population}</span>
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
        <div className={`p-4 rounded-xl border ${summary.is_within_window ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">TOTAL CLEARANCE TIME</span>
            <Clock className={`w-4 h-4 ${summary.is_within_window ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 text-white">
            {summary.max_evacuation_time_mins} <span className="text-xs text-white/50 font-normal">Mins</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-1 font-mono font-medium">
            {summary.is_within_window ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Within Safe Limit ({summary.planning_window_mins}m window)
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Exceeds Window ({summary.planning_window_mins}m max)!
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
            {summary.fleet_deployed} <span className="text-xs text-white/50 font-normal">Buses</span>
          </div>
          <div className="text-[11px] text-white/60 mt-1">Instant Lift: {summary.fleet_deployed * summary.fleet_capacity_per_bus} Seats</div>
        </div>

        {/* Metric 3: Fuel Consumed */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">ESTIMATED FUEL</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-2">
            {summary.fuel_consumption_liters} <span className="text-xs text-white/50 font-normal">Liters</span>
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
                <th className="pb-3 font-medium">ASSIGNED BUSES</th>
                <th className="pb-3 font-medium">TRIPS / BUS</th>
                <th className="pb-3 font-medium text-right">CORRIDOR CLEARANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allocations.map((alloc) => (
                <tr key={alloc.site_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-sans font-medium text-white">{alloc.site_name}</td>
                  <td className="py-3 text-white/70">{alloc.distance_km} km</td>
                  <td className="py-3 text-cyan-400 font-bold">{alloc.allocated_population.toLocaleString()} Evacuees</td>
                  <td className="py-3 text-emerald-400 font-bold">{alloc.buses_assigned} Buses</td>
                  <td className="py-3 text-white/70">{alloc.trips_per_bus} Cycles</td>
                  <td className="py-3 text-right font-bold text-white">
                    {alloc.corridor_clearance_mins} Mins
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
