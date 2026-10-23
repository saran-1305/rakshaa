import React from 'react';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Users, Activity, Radar } from 'lucide-react';

interface RelocationEngineStudioProps {
  scenario: DisasterScenario;
  relocationDecision?: any;
}

export const RelocationEngineStudio: React.FC<RelocationEngineStudioProps> = ({ 
  scenario,
  relocationDecision 
}) => {
  const activeRadiusKm = relocationDecision?.final_search_radius_km ?? 15.0;
  const approvedSites = scenario.candidate_sanctuaries.filter(
    (s) => s.status === 'APPROVED' && s.distance_km <= activeRadiusKm
  );
  const totalApprovedCapacity = relocationDecision?.total_safe_capacity_discovered ?? 
    approvedSites.reduce((sum, s) => sum + s.sphere_capacity_persons, 0);
  const shortfall = relocationDecision?.capacity_shortfall ?? 
    Math.max(0, scenario.displaced_population - totalApprovedCapacity);
  const coveragePercent = relocationDecision?.coverage_pct ?? 
    Math.min(100, Math.round((totalApprovedCapacity / Math.max(1, scenario.displaced_population)) * 100));

  const stoppingStatus = relocationDecision?.completion_status || (
    coveragePercent >= 100 ? 'SUFFICIENT_SAFE_CAPACITY_FOUND' : 'OPERATIONAL_EVALUATION_ACTIVE'
  );
  const statusExplanation = relocationDecision?.status_explanation || (
    coveragePercent >= 100
      ? `Sufficient safe capacity (${totalApprovedCapacity.toLocaleString()} persons) found within ${activeRadiusKm} km active search boundary.`
      : `Search evaluated up to ${activeRadiusKm} km. Shortfall: ${shortfall.toLocaleString()} persons.`
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">DISPLACED COHORT</span>
            <Users className="w-4 h-4 text-raksha-accent" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {scenario.displaced_population.toLocaleString()} <span className="text-xs text-white/50 font-normal">Persons</span>
          </div>
          <div className="text-[11px] text-white/60 mt-1">Hazard: {scenario.hazard_type}</div>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">SAFE SPHERE CAPACITY</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-2">
            {totalApprovedCapacity.toLocaleString()} <span className="text-xs text-white/50 font-normal">Persons</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">45 m² humanitarian Sphere layout standard</div>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/50">ALLOCATION COVERAGE</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-2">
            {coveragePercent}%
          </div>
          <div className="text-[11px] text-cyan-200/80 mt-1">
            {coveragePercent >= 100 ? '✓ ZERO-DEFICIT ACHIEVED' : `⚠️ DEFICIT: ${shortfall.toLocaleString()} PERSONS`}
          </div>
        </div>
      </div>

      {/* Progressive Search Expansion Telemetry Banner */}
      <div className="p-4 rounded-xl bg-[#090E17] border border-cyan-500/30 space-y-2 font-mono text-xs shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-white font-bold text-xs uppercase tracking-wider">
              Concentric Relocation Search Status:
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              stoppingStatus === 'SUFFICIENT_SAFE_CAPACITY_FOUND'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
            }`}>
              {stoppingStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 text-white/70 text-[11px]">
            <span>Active Radius: <strong className="text-cyan-300">{activeRadiusKm} km</strong></span>
            <span>•</span>
            <span>Max Limit: <strong className="text-white/90">{relocationDecision?.max_operational_radius_km ?? 25} km</strong></span>
          </div>
        </div>

        <p className="text-white/70 text-xs font-sans leading-relaxed">
          {statusExplanation}
        </p>

        {shortfall > 0 && (
          <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px] font-sans flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>PLAN INCOMPLETE:</strong> An evacuation capacity shortfall of{' '}
              <strong>{shortfall.toLocaleString()} citizens</strong> remains. Additional safe relocation parcels or secondary operational corridors must be evaluated.
            </span>
          </div>
        )}
      </div>

      {/* Zero-Tolerance Hard Veto Audit Table */}
      <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-raksha-hazard" />
            <h4 className="text-sm font-semibold text-white">Progressive 5km Ring Candidate Evaluation & Zero-Tolerance Hard Veto</h4>
          </div>
          <span className="text-xs font-mono text-white/50">Axiom: Unsafe sites are vetoed, never down-scored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="pb-3 font-medium">CANDIDATE SITE NAME</th>
                <th className="pb-3 font-medium">SEARCH RING</th>
                <th className="pb-3 font-medium">DISTANCE</th>
                <th className="pb-3 font-medium">TERRAIN SLOPE</th>
                <th className="pb-3 font-medium">SPHERE CAP</th>
                <th className="pb-3 font-medium">MCDA SCORE</th>
                <th className="pb-3 font-medium text-right">AUDIT DECISION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {scenario.candidate_sanctuaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-lg mx-auto">
                      <ShieldAlert className="w-8 h-8 text-amber-400" />
                      <span className="text-white font-bold text-xs uppercase tracking-wider">
                        No Pre-Indexed Candidate Sanctuaries For Live Incident Sector
                      </span>
                      <p className="text-white/60 text-[11px] leading-relaxed">
                        This sourced incident (<strong>{scenario.name}</strong>) is situated at{' '}
                        <span className="text-cyan-300 font-mono">
                          {scenario.centroid.lat.toFixed(4)}° N, {scenario.centroid.lon.toFixed(4)}° E
                        </span>
                        . To maintain safety integrity without fabricating data, RAKSHA requires local OSM facility ingestion or verified regional benchmark presets (Devgram, Wayanad, Silchar, Chamoli, Munambam).
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                scenario.candidate_sanctuaries.map((site) => {
                const isApproved = site.status === 'APPROVED';
                return (
                  <tr key={site.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-sans font-medium text-white">
                      <div className="flex items-center gap-2">
                        {isApproved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span>{site.name}</span>
                      </div>
                      {site.veto_reasons && (
                        <div className="text-[11px] text-red-300 font-mono pl-6 mt-0.5">
                          VETO REASON: {site.veto_reasons.join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-white/70">{site.ring}</td>
                    <td className="py-3 text-white/70">{site.distance_km} km</td>
                    <td className="py-3 text-white/70">
                      <span className={site.slope_deg > 14 || site.slope_deg < 2 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {site.slope_deg}°
                      </span>
                    </td>
                    <td className="py-3 text-white/70">{site.sphere_capacity_persons}</td>
                    <td className="py-3 text-raksha-accent font-bold">{site.mcda_score} / 100</td>
                    <td className="py-3 text-right">
                      {isApproved ? (
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                          site.distance_km <= activeRadiusKm
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/5 border-white/20 text-white/50'
                        }`}>
                          {site.distance_km <= activeRadiusKm ? 'APPROVED' : 'OUT OF RADIUS'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-bold">
                          HARD VETO
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Humanitarian Sphere Camp Layout Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
          <h4 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-raksha-accent" />
            Humanitarian Sphere Camp Allocation Model
          </h4>
          <p className="text-white/60 font-sans text-xs">
            Calculated pursuant to Sphere Project International Humanitarian Standards:
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">Camp Standard Footprint:</span>
              <span className="text-white font-bold">45.0 m² / person</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">Usable Ground Ratio:</span>
              <span className="text-white font-bold">60% Net Layout (40% firebreaks & access)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">Temporary Family Shelters:</span>
              <span className="text-white font-bold">{Math.ceil(scenario.displaced_population / 5)} Units (5 persons/unit)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-white/60">Emergency Water Requirement:</span>
              <span className="text-white font-bold">{scenario.displaced_population * 15} Liters / Day (15 L/person)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Approved Master Plan Sites
            </h4>
            <span className="text-[11px] text-white/50">Active Radius: {activeRadiusKm} km</span>
          </div>

          <div className="space-y-3 pt-1">
            {approvedSites.length === 0 ? (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center text-white/50 text-xs">
                No approved sites found within active search radius.
              </div>
            ) : (
              approvedSites.map((site, index) => (
                <div key={site.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-white text-xs">#{index + 1} {site.name}</span>
                    <span className="text-emerald-400 font-bold">{site.allocated_population} Evacuees</span>
                  </div>
                  <div className="text-[11px] text-white/60 mt-1">
                    Water: {site.infrastructure.water_tanks} Tanks • Power: {site.infrastructure.power_backup} • Medical: {site.infrastructure.medical_distance_km} km
                  </div>
                </div>
              ))
            )}

            {shortfall > 0 && (
              <div className="p-2.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-[11px] font-sans">
                ⚠️ <strong>Unallocated Population:</strong> {shortfall.toLocaleString()} persons exceed approved capacity within {activeRadiusKm} km.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
