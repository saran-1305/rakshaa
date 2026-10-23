import React, { useState, useRef, useEffect } from 'react';
import type { DisasterScenario } from '../../data/syntheticScenarios';
import { Radio, Eye, ShieldCheck, Database, Layers, Play, Pause } from 'lucide-react';

interface EarthObservationStudioProps {
  scenario: DisasterScenario;
}

export const EarthObservationStudio: React.FC<EarthObservationStudioProps> = ({ scenario }) => {
  const [wipePosition, setWipePosition] = useState<number>(50);
  const [isAutoSweeping, setIsAutoSweeping] = useState<boolean>(false);
  const [sweepDirection, setSweepDirection] = useState<'forward' | 'backward'>('forward');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Auto-sweep animation loop
  useEffect(() => {
    if (!isAutoSweeping) return;
    const interval = setInterval(() => {
      setWipePosition((prev) => {
        if (prev >= 88) {
          setSweepDirection('backward');
          return 87;
        }
        if (prev <= 12) {
          setSweepDirection('forward');
          return 13;
        }
        return sweepDirection === 'forward' ? prev + 1 : prev - 1;
      });
    }, 35);
    return () => clearInterval(interval);
  }, [isAutoSweeping, sweepDirection]);

  // Pointer drag event handlers on the canvas
  const updateWipeFromPointer = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = Math.round((x / rect.width) * 100);
    setWipePosition(pct);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setIsAutoSweeping(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateWipeFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateWipeFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

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
        {/* Header & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Multi-Sensor Imagery Wipe: Optical vs. SAR Radar
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  ALL-WEATHER PENETRATION
                </span>
              </div>
              <p className="text-[11px] text-white/50 font-mono mt-0.5">
                Drag divider or click presets to evaluate cloud penetration over flooded debris channels
              </p>
            </div>
          </div>

          {/* Quick Presets & Auto-Sweep Controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10 gap-1">
              <button
                type="button"
                onClick={() => { setIsAutoSweeping(false); setWipePosition(100); }}
                className={`px-2 py-1 rounded text-[11px] transition-all ${
                  wipePosition === 100 && !isAutoSweeping ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40' : 'text-white/60 hover:text-white'
                }`}
              >
                100% Optical
              </button>
              <button
                type="button"
                onClick={() => { setIsAutoSweeping(false); setWipePosition(50); }}
                className={`px-2 py-1 rounded text-[11px] transition-all ${
                  wipePosition === 50 && !isAutoSweeping ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40' : 'text-white/60 hover:text-white'
                }`}
              >
                50/50 Split
              </button>
              <button
                type="button"
                onClick={() => { setIsAutoSweeping(false); setWipePosition(0); }}
                className={`px-2 py-1 rounded text-[11px] transition-all ${
                  wipePosition === 0 && !isAutoSweeping ? 'bg-blue-500/30 text-blue-300 font-bold border border-blue-500/40' : 'text-white/60 hover:text-white'
                }`}
              >
                100% SAR Radar
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAutoSweeping(!isAutoSweeping)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                isAutoSweeping
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {isAutoSweeping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isAutoSweeping ? 'PAUSE SWEEP' : 'AUTO-SWEEP'}</span>
            </button>
          </div>
        </div>

        {/* Range Slider Track */}
        <div className="space-y-1 font-mono text-xs">
          <div className="flex justify-between items-center text-[11px] text-white/60">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Eye className="w-3.5 h-3.5" />
              ◄ Sentinel-2 Optical Scene
            </span>
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-cyan-400 font-bold text-xs">
              WIPE POSITION: {wipePosition}%
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              Sentinel-1 SAR Penetration ►
              <Radio className="w-3.5 h-3.5" />
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={wipePosition}
            onChange={(e) => {
              setIsAutoSweeping(false);
              setWipePosition(Number(e.target.value));
            }}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg"
          />
        </div>

        {/* Interactive Visual Imagery Canvas */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative h-72 sm:h-80 rounded-xl overflow-hidden border border-white/20 select-none cursor-ew-resize shadow-2xl touch-none"
        >
          {/* ─── BASE LAYER: Sentinel-1 C-Band SAR Active Radar View (Right/Full) ─── */}
          <div className="absolute inset-0 bg-[#070b14] overflow-hidden">
            {/* Radar Grid Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />
            
            {/* Concentric Radar Range Rings */}
            <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full border border-cyan-500/10 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-[450px] h-[450px] rounded-full border border-cyan-500/15 pointer-events-none" />
            <div className="absolute top-10 right-10 w-[300px] h-[300px] rounded-full border border-cyan-500/20 pointer-events-none" />

            {/* Simulated Active Specular Water Runoff & Debris Flow Channel */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 300">
              <defs>
                <linearGradient id="sarRiver" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Surrounding Debris Flow Inundation Polygon */}
              <path
                d="M 50 180 Q 250 140 450 190 T 800 130 L 800 230 Q 550 260 300 220 Z"
                fill="#0891b2"
                opacity="0.18"
              />
              {/* Primary High-Velocity Flood Channel (Piercing Clouds) */}
              <path
                d="M 0 170 Q 220 120 440 180 T 800 140"
                fill="none"
                stroke="url(#sarRiver)"
                strokeWidth="28"
                filter="url(#glow)"
              />
              <path
                d="M 0 170 Q 220 120 440 180 T 800 140"
                fill="none"
                stroke="#ecfeff"
                strokeWidth="4"
                strokeDasharray="8 6"
                className="animate-pulse"
              />
            </svg>

            {/* Radar Coordinates & Telemetry Overlay */}
            <div className="absolute bottom-3 right-4 z-10 pointer-events-none font-mono text-[10px] text-cyan-400/70 text-right">
              <div>LAT 30.552° N • LON 79.524° E • ALT 1,840m</div>
              <div>C-BAND 5.405 GHz • INCIDENCE ANGLE 38.2°</div>
            </div>

            {/* DOCKED BADGE: Sentinel-1 SAR (Top-Right, NEVER overlaps optical) */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none max-w-[260px] p-2.5 rounded-lg bg-black/85 backdrop-blur-md border border-cyan-500/50 shadow-xl text-right">
              <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-cyan-300">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                SENTINEL-1 C-BAND SAR
              </div>
              <div className="text-[11px] font-mono text-white/90 mt-1">
                Backscatter γ° = <span className="font-bold text-cyan-400">{sentinel1_sar.gamma0_backscatter_db} dB</span>
              </div>
              <p className="text-[10px] text-cyan-200/80 font-mono mt-0.5 leading-snug">
                ✓ 100% Cloud Penetration: Active specular water reflections reveal flooded channel.
              </p>
            </div>
          </div>

          {/* ─── TOP LAYER: Sentinel-2 L2A Optical View (Left, Clipped by wipePosition) ─── */}
          <div
            className="absolute inset-y-0 left-0 bg-[#0a1f14] overflow-hidden border-r-2 border-cyan-400 shadow-2xl transition-all duration-75"
            style={{ width: `${wipePosition}%` }}
          >
            {/* Topographic Contour Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            
            {/* Natural Forest & Mountain Ridges Relief */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/70 via-stone-900/60 to-emerald-900/80 pointer-events-none" />

            {/* Obscuring Monsoon Cloud Cover Deck (Visualizing Why Optical is Blinded) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-6 left-10 w-80 h-44 bg-white/20 rounded-full blur-2xl transform -rotate-12" />
              <div className="absolute top-20 left-48 w-96 h-48 bg-slate-200/25 rounded-full blur-3xl transform rotate-6" />
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[3px]" />
            </div>

            {/* Optical Sensor Coordinates HUD */}
            <div className="absolute bottom-3 left-4 z-10 pointer-events-none font-mono text-[10px] text-emerald-400/80">
              <div>COPERNICUS SENTINEL-2 L2A • TILE {sentinel2_optical.tile}</div>
              <div>B2/B3/B4/B8A MULTISPECTRAL • 10m RESOLUTION</div>
            </div>

            {/* DOCKED BADGE: Sentinel-2 Optical (Top-Left, NEVER overlaps SAR) */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none max-w-[260px] p-2.5 rounded-lg bg-black/85 backdrop-blur-md border border-emerald-500/50 shadow-xl text-left">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                SENTINEL-2 L2A OPTICAL
              </div>
              <div className="text-[11px] font-mono text-white/90 mt-1">
                Cloud Mask: <span className="font-bold text-red-400">{sentinel2_optical.cloud_coverage_pct}% Obscuration</span>
              </div>
              <p className="text-[10px] text-amber-200/80 font-mono mt-0.5 leading-snug">
                ⚠️ Optical Blindness: Dense monsoon clouds obstruct visible detection of valley floor.
              </p>
            </div>
          </div>

          {/* ─── WIPER DIVIDER HANDLE (Laser Line with Center Grab Badge) ─── */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] pointer-events-none z-30 flex items-center justify-center"
            style={{ left: `${wipePosition}%` }}
          >
            <div className="px-2 py-1 rounded-full bg-cyan-400 text-black font-black text-[10px] font-mono flex items-center gap-1 shadow-2xl border-2 border-white select-none whitespace-nowrap">
              <span>◄</span>
              <span>{wipePosition}%</span>
              <span>►</span>
            </div>
          </div>
        </div>

        {/* Sensor Probe Telemetry Details Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-1">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
            <div className="text-[10px] text-white/50 uppercase">SAR Radar Backscatter</div>
            <div className="text-cyan-400 font-bold text-base mt-0.5">{sentinel1_sar.gamma0_backscatter_db} dB</div>
            <div className="text-[10px] text-cyan-300 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Specular Runout Alert
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors">
            <div className="text-[10px] text-white/50 uppercase">Water Index (NDWI)</div>
            <div className="text-emerald-400 font-bold text-base mt-0.5">{sentinel2_optical.ndwi_water_index}</div>
            <div className="text-[10px] text-emerald-300 mt-0.5">High Surface Moisture</div>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
            <div className="text-[10px] text-white/50 uppercase">Vegetation (NDVI)</div>
            <div className="text-amber-400 font-bold text-base mt-0.5">{sentinel2_optical.ndvi_vegetation}</div>
            <div className="text-[10px] text-white/60 mt-0.5">Canopy Baseline</div>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
            <div className="text-[10px] text-white/50 uppercase">Optical Cloud Cover</div>
            <div className="text-red-400 font-bold text-base mt-0.5">{sentinel2_optical.cloud_coverage_pct}%</div>
            <div className="text-[10px] text-red-300 mt-0.5">Optical Blind Zone</div>
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

