import React, { useState } from 'react';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import { Radio, Eye, ShieldCheck, Database, Layers } from 'lucide-react';

interface EarthObservationStudioProps {
  scenario: DisasterScenario;
}

export const EarthObservationStudio: React.FC<EarthObservationStudioProps> = ({ scenario }) => {
  const [wipePosition, setWipePosition] = useState<number>(50);
  const { sentinel1_sar, sentinel2_optical, cartosat3_highres, isro_bhuvan, worldpop } = scenario.satellite_telemetry;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-raksha-accent font-mono text-xs tracking-wider">
            <Radio className="w-4 h-4 animate-pulse" />
            MULTI-SENSOR SATELLITE EARTH OBSERVATION (EO) TELEMETRY
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Four-Pillar Orbital Intelligence & Ground Validation</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs">
            DATA PIPELINE: SYNTHETIC LIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Sentinel-1 C-Band SAR (DETECT) */}
        <div className="p-5 rounded-xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Sentinel-1 C-Band SAR (DETECT)</h4>
                <p className="text-[11px] text-white/50 font-mono">Planetary Computer STAC • Microwave Radar</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              ALL-WEATHER
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Scene ID:</span>
              <span className="text-white truncate max-w-[210px] text-right">{sentinel1_sar.scene_id}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Orbit / Pass:</span>
              <span className="text-white">Orbit #{sentinel1_sar.orbit} ({sentinel1_sar.pass})</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Instrument Mode & Pol:</span>
              <span className="text-white">{sentinel1_sar.mode} • {sentinel1_sar.polarization}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Radar Backscatter (γ°):</span>
              <span className={`font-bold ${sentinel1_sar.gamma0_backscatter_db < -16.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                {sentinel1_sar.gamma0_backscatter_db} dB {sentinel1_sar.gamma0_backscatter_db < -16.5 ? '(Specular Inundation Alert)' : '(Normal)'}
              </span>
            </div>
            <div className="p-2.5 rounded bg-red-950/30 border border-red-500/30 text-[11px] text-red-200 mt-2">
              🚨 Active radar specular reflection confirms standing water and debris runoff despite thick mountain cloud cover.
            </div>
          </div>
        </div>

        {/* Card 2: Sentinel-2 L2A Optical (UNDERSTAND) */}
        <div className="p-5 rounded-xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Sentinel-2 L2A Optical (UNDERSTAND)</h4>
                <p className="text-[11px] text-white/50 font-mono">Copernicus Multispectral 10m Imagery</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              MULTISPECTRAL
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">MGRS Tile Code:</span>
              <span className="text-white font-bold">{sentinel2_optical.tile}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Cloud Coverage Mask:</span>
              <span className="text-white">{sentinel2_optical.cloud_coverage_pct}%</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">NDWI (Water Index):</span>
              <span className="text-cyan-400 font-bold">{sentinel2_optical.ndwi_water_index} (High Surface Water)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">NDVI (Vegetation Index):</span>
              <span className="text-emerald-400">{sentinel2_optical.ndvi_vegetation}</span>
            </div>
            <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-200 mt-2">
              🌿 Environmental baseline cross-calibrated against optical spectral reflectance bands (B2, B3, B4, B8).
            </div>
          </div>
        </div>

        {/* Card 3: ISRO Cartosat-3 Sub-Meter (VALIDATE) */}
        <div className="p-5 rounded-xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">ISRO Cartosat-3 Sub-Meter (VALIDATE)</h4>
                <p className="text-[11px] text-white/50 font-mono">0.28m High-Res Site Verification</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              0.28m GSD
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Unblocked Open Grounds:</span>
              <span className="text-raksha-accent font-bold">{cartosat3_highres.unblocked_open_ground_sqm.toLocaleString()} m²</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Building Footprint Density:</span>
              <span className="text-emerald-400 font-bold">{cartosat3_highres.structural_footprint_density_pct}% (&lt; 25% threshold)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Emergency Helipad Clearance:</span>
              <span className="text-emerald-400 font-bold">{cartosat3_highres.helipad_clearance_45m}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Sensor Specification:</span>
              <span className="text-white">{cartosat3_highres.sensor}</span>
            </div>
            <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-200 mt-2">
              ✓ Sub-meter physical space verified: site accommodates full temporary tent camp without structural obstruction.
            </div>
          </div>
        </div>

        {/* Card 4: ISRO Bhuvan & WorldPop (ANCHOR & POPULATION) */}
        <div className="p-5 rounded-xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">ISRO Bhuvan & WorldPop (DEMOGRAPHICS)</h4>
                <p className="text-[11px] text-white/50 font-mono">1:50,000 LULC & 100m Gridded Exposure</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              NATIONAL DATA
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Bhuvan LULC Layer:</span>
              <span className="text-white truncate max-w-[210px] text-right">{isro_bhuvan.lulc_classification}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Historical Disaster Tier:</span>
              <span className="text-white">{isro_bhuvan.historical_disaster_tier}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">WorldPop Exposure:</span>
              <span className="text-raksha-accent font-bold">{worldpop.estimated_aoi_exposure} Individuals in AOI</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-white/60">Vulnerable Demographic:</span>
              <span className="text-white">
                Elderly: {worldpop.vulnerable_demographics.elderly_pct}% | Infants: {worldpop.vulnerable_demographics.infants_pct}%
              </span>
            </div>
            <div className="p-2.5 rounded bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-200 mt-2">
              👥 Automated cohort sizing enables zero-deficit medical triage allocation and prioritized bus boarding.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Optical vs SAR Cloud-Penetrating Comparison Wipe */}
      <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">
                Multi-Sensor Imagery Wipe: Optical (Visible) vs SAR Radar (All-Weather Penetration)
              </h4>
              <p className="text-[11px] text-white/50 font-mono">
                Compare cloud-blinded Sentinel-2 optical scene with Sentinel-1 C-Band SAR radar backscatter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-white/60">Wipe Position:</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{wipePosition}%</span>
          </div>
        </div>

        {/* Wipe Slider Controls */}
        <div className="space-y-1.5 font-mono text-xs">
          <input
            type="range"
            min={0}
            max={100}
            value={wipePosition}
            onChange={(e) => setWipePosition(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/40">
            <span>◄ 100% Optical (Sentinel-2)</span>
            <span>50/50 Dual-Band Overlay</span>
            <span>100% SAR Radar (Sentinel-1) ►</span>
          </div>
        </div>

        {/* Visual Imagery Canvas Display */}
        <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden border border-white/20 select-none">
          {/* Base Layer: SAR Radar Inundation View */}
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
            {/* Simulated Radar Runoff Path Overlay */}
            <div className="absolute inset-x-0 top-1/3 h-20 bg-cyan-500/20 blur-md transform -rotate-6 border-y border-cyan-400/50 pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/50">
                SENTINEL-1 C-BAND SAR ACTIVE RADAR (100% CLOUD PENETRATION)
              </span>
              <p className="text-xs text-cyan-200/80 font-mono max-w-md mx-auto">
                Radar Backscatter γ° = {sentinel1_sar.gamma0_backscatter_db} dB. Active specular reflection detects flooded debris channel unobstructed by dense cloud cover.
              </p>
            </div>
          </div>

          {/* Top Layer: Optical Multispectral View (Clipped by wipePosition) */}
          <div
            className="absolute inset-y-0 left-0 bg-emerald-950/90 border-r-2 border-cyan-400 overflow-hidden transition-all duration-75 flex flex-col items-center justify-center p-6 text-center shadow-2xl"
            style={{ width: `${wipePosition}%` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            {/* Cloud mask visual obstruction */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] pointer-events-none" />
            <div className="relative z-10 space-y-2 whitespace-nowrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50">
                SENTINEL-2 L2A OPTICAL (CLOUD MASK: {sentinel2_optical.cloud_coverage_pct}%)
              </span>
              <p className="text-xs text-white/70 font-mono">
                Multispectral NDWI: {sentinel2_optical.ndwi_water_index} • NDVI: {sentinel2_optical.ndvi_vegetation}
              </p>
            </div>
          </div>

          {/* Wipe Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] pointer-events-none flex items-center justify-center"
            style={{ left: `${wipePosition}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500 text-black font-bold text-[10px] flex items-center justify-center border border-white shadow-lg">
              ↔
            </div>
          </div>
        </div>

        {/* Sensor Probe Telemetry Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-1">
          <div className="p-2.5 rounded bg-white/5 border border-white/5">
            <div className="text-[10px] text-white/50">SAR BACKSCATTER</div>
            <div className="text-cyan-400 font-bold text-sm mt-0.5">{sentinel1_sar.gamma0_backscatter_db} dB</div>
            <div className="text-[10px] text-cyan-300">Specular Runout Alert</div>
          </div>

          <div className="p-2.5 rounded bg-white/5 border border-white/5">
            <div className="text-[10px] text-white/50">WATER INDEX (NDWI)</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">{sentinel2_optical.ndwi_water_index}</div>
            <div className="text-[10px] text-emerald-300">High Surface Moisture</div>
          </div>

          <div className="p-2.5 rounded bg-white/5 border border-white/5">
            <div className="text-[10px] text-white/50">VEGETATION (NDVI)</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5">{sentinel2_optical.ndvi_vegetation}</div>
            <div className="text-[10px] text-white/60">Canopy Baseline</div>
          </div>

          <div className="p-2.5 rounded bg-white/5 border border-white/5">
            <div className="text-[10px] text-white/50">OPTICAL CLOUD COVER</div>
            <div className="text-red-400 font-bold text-sm mt-0.5">{sentinel2_optical.cloud_coverage_pct}%</div>
            <div className="text-[10px] text-red-300">Optical Blind Zone</div>
          </div>
        </div>
      </div>

      {/* SRTM Elevation Transect Profile */}
      <div className="p-5 rounded-xl bg-black/60 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-raksha-accent" />
          <h4 className="text-sm font-semibold text-white">SRTM 30m Digital Elevation Model (DEM) Transect Along Evacuation Corridor</h4>
        </div>
        <p className="text-xs text-white/60 mb-4">
          Route: <strong className="text-white">{scenario.primary_route_name}</strong> • Min Elevation: {scenario.srtm_transect.min_elevation_m}m • Max Elevation: {scenario.srtm_transect.max_elevation_m}m • Max Road Gradient: {scenario.srtm_transect.max_gradient_pct}%
        </p>

        {/* Transect Bar Chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {scenario.srtm_transect.points.map((pt, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center font-mono">
              <div className="text-raksha-accent text-base font-bold">{pt.elevation_m} m</div>
              <div className="text-[10px] text-white/50">{pt.dist_km} km • Slope {pt.slope_pct}%</div>
              <div className="text-[11px] text-white/90 mt-1 font-sans font-medium truncate">{pt.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

