import React from 'react';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import { FileText, Printer, Download, ShieldCheck } from 'lucide-react';

interface DdmaDirectiveModalProps {
  scenario: DisasterScenario;
}

export const DdmaDirectiveModal: React.FC<DdmaDirectiveModalProps> = ({ scenario }) => {
  const { ddma_directive, candidate_sanctuaries } = scenario;
  const approvedSites = candidate_sanctuaries.filter((s) => s.status === 'APPROVED');

  const handlePrint = () => {
    window.print();
  };

  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            type: 'Hazard Centroid',
            scenario: scenario.name,
            hazard_type: scenario.hazard_type,
            displaced_population: scenario.displaced_population
          },
          geometry: {
            type: 'Point',
            coordinates: [scenario.centroid.lon, scenario.centroid.lat]
          }
        },
        ...candidate_sanctuaries.map((site) => ({
          type: 'Feature',
          properties: {
            type: 'Candidate Sanctuary',
            name: site.name,
            status: site.status,
            distance_km: site.distance_km,
            capacity: site.sphere_capacity_persons,
            slope_deg: site.slope_deg,
            mcda_score: site.mcda_score
          },
          geometry: {
            type: 'Point',
            coordinates: [site.lon, site.lat]
          }
        }))
      ]
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RAKSHA_${scenario.id}_RFC7946_Evacuation_Plan.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-raksha-accent font-mono text-xs tracking-wider">
            <FileText className="w-4 h-4" />
            GOVERNMENT OF INDIA • DISASTER MANAGEMENT AUTHORITY
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Executive Evacuation Order & Legal Brief</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportGeoJSON}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-mono text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-raksha-accent" />
            Export GeoJSON (RFC 7946)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-raksha-accent text-black font-semibold text-xs hover:bg-raksha-accentLight transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Legal Directive
          </button>
        </div>
      </div>

      {/* Official Government Memorandum Style Document */}
      <div className="p-8 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 shadow-2xl space-y-6 font-serif">
        {/* Emblem & Header */}
        <div className="text-center border-b border-stone-700 pb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-stone-500 font-bold text-lg text-amber-400 font-mono">
            स
          </div>
          <h2 className="text-xl font-bold tracking-widest uppercase text-stone-100">
            DISTRICT DISASTER MANAGEMENT AUTHORITY (DDMA)
          </h2>
          <p className="text-xs tracking-widest uppercase font-mono text-stone-400">
            STATE EMERGENCY OPERATIONS CENTRE (SEOC) • RAPID RELOCATION DIRECTIVE
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs border-b border-stone-700 pb-4 text-stone-300">
          <div>
            <span className="text-stone-500">ORDER NO: </span>
            <span className="text-stone-100 font-bold">{ddma_directive.order_no}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-stone-500">DATE & TIME OF DISPATCH: </span>
            <span className="text-stone-100 font-bold">20 OCT 2026, 21:00 HRS IST</span>
          </div>
          <div>
            <span className="text-stone-500">INCIDENT COMMANDER: </span>
            <span className="text-stone-100 font-bold">{ddma_directive.incident_commander}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-stone-500">STATUTORY LEGAL ACT: </span>
            <span className="text-stone-100 font-bold">{ddma_directive.legal_act}</span>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <h4 className="font-bold font-sans text-sm tracking-wide text-amber-300 uppercase">
            SUBJECT: EMERGENCY EVACUATION AND RE-HABITATION PROTOCOL FOR {scenario.name.toUpperCase()}
          </h4>
          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            In exercise of the powers vested under Section 30 and Section 34 of the Disaster Management Act, 2005, the District Disaster Management Authority hereby commands mandatory immediate evacuation of all inhabitants residing within the designated Dynamic AOI boundary.
          </p>
        </div>

        {/* Executive Directive */}
        <div className="space-y-2 font-sans text-xs">
          <h5 className="font-bold text-stone-200 uppercase font-mono tracking-wider">
            1. SATELLITE EVIDENCE & TECHNICAL REASONING
          </h5>
          <p className="text-stone-300 leading-relaxed">
            Multi-sensor Earth Observation telemetry (Sentinel-1 C-Band SAR radar backscatter at <strong>{scenario.satellite_telemetry.sentinel1_sar.gamma0_backscatter_db} dB</strong> and Sentinel-2 optical imagery) confirms intense surface inundation and acute destabilization potential. Antecedent precipitation of <strong>{scenario.hazard_summary.rainfall_24h_mm} mm</strong> has triggered a critical hazard index of <strong>{scenario.hazard_summary.computed_hazard_index}</strong>.
          </p>
        </div>

        {/* Authorized Actions */}
        <div className="space-y-2 font-sans text-xs">
          <h5 className="font-bold text-stone-200 uppercase font-mono tracking-wider">
            2. MANDATED ACTIONS & FIELD DEPLOYMENT
          </h5>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-300">
            {ddma_directive.authorized_actions.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>

        {/* Approved Sanctuaries Table */}
        <div className="space-y-2 font-sans text-xs">
          <h5 className="font-bold text-stone-200 uppercase font-mono tracking-wider">
            3. DESIGNATED HUMANITARIAN SHELTERS (SPHERE PROJECT COMPLIANT)
          </h5>
          <div className="rounded border border-stone-700 overflow-hidden font-mono text-[11px]">
            <table className="w-full text-left">
              <thead className="bg-stone-800 text-stone-400">
                <tr>
                  <th className="p-2">SANCTUARY NAME</th>
                  <th className="p-2">DISTANCE</th>
                  <th className="p-2">SAFE CAPACITY</th>
                  <th className="p-2">ALLOCATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {approvedSites.map((site) => (
                  <tr key={site.id}>
                    <td className="p-2 text-stone-200">{site.name}</td>
                    <td className="p-2 text-stone-400">{site.distance_km} km</td>
                    <td className="p-2 text-stone-400">{site.sphere_capacity_persons} pax</td>
                    <td className="p-2 text-emerald-400 font-bold">{site.allocated_population} pax</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatory Seal */}
        <div className="pt-8 border-t border-stone-700 flex flex-col sm:flex-row justify-between items-end gap-6 font-mono text-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-emerald-400 border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 rounded">
              <ShieldCheck className="w-4 h-4" />
              <span>DIGITALLY SIGNED & AUTHORIZED FOR EXECUTION</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Public Key Hash: SHA256:4f89d301...b8201a
            </div>
          </div>
          <div className="text-right">
            <div className="text-stone-300 font-bold">{ddma_directive.incident_commander}</div>
            <div className="text-stone-500 text-[11px]">Chairperson, District Disaster Management Authority</div>
          </div>
        </div>
      </div>
    </div>
  );
};
