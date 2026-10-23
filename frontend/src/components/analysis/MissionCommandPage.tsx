import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  SYNTHETIC_SCENARIOS,
  type DisasterScenario,
  createScenarioFromGlobalIncident
} from '../../data/syntheticScenarios';
import {
  apiClient,
  type BackendHealthResponse,
  type BackendPreset,
  type BackendAnalysisResponse,
  type GlobalIncident
} from '../../services/apiClient';
import { GisSimulationMap } from './GisSimulationMap';
import { EarthObservationStudio } from './EarthObservationStudio';
import { RelocationEngineStudio } from './RelocationEngineStudio';
import { FleetMobilityDispatcher } from './FleetMobilityDispatcher';
import { DdmaDirectiveModal } from './DdmaDirectiveModal';
import { GlobalIntelligenceMap } from '../global/GlobalIntelligenceMap';
import { AiTacticalCommander } from './AiTacticalCommander';
import {
  Map,
  Radio,
  Shield,
  Truck,
  FileText,
  Sparkles,
  ArrowLeft,
  Database,
  Activity,
  AlertCircle,
  AlertTriangle,
  Globe,
  Play
} from 'lucide-react';

interface MissionCommandPageProps {
  initialScenarioId?: string;
}

export const MissionCommandPage: React.FC<MissionCommandPageProps> = ({
  initialScenarioId = 'devgram'
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { incidentId: routeIncidentId } = useParams<{ incidentId?: string }>();
  const incidentFromUrl = routeIncidentId || searchParams.get('incident');

  // If URL explicitly requests an incident, default to 'map'; otherwise open on 'global' world map
  const [activeTab, setActiveTab] = useState<'global' | 'map' | 'eo' | 'relocation' | 'fleet' | 'ddma'>(
    incidentFromUrl ? 'map' : 'global'
  );

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    incidentFromUrl || initialScenarioId
  );
  const [customScenario, setCustomScenario] = useState<DisasterScenario | null>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Backend Health & Provenance
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [presets, setPresets] = useState<BackendPreset[]>([
    { id: 'devgram', name: 'Devgram (Chamoli, UK)', lat: 30.3207, lon: 79.2163, hazard_type: 'Glacial Inundation & Landslide Runoff', default_population: 720, description: '' },
    { id: 'wayanad', name: 'Chooralmala (Wayanad, KL)', lat: 11.5126, lon: 76.1287, hazard_type: 'Landslide & Torrential Inundation', default_population: 2450, description: '' },
    { id: 'silchar', name: 'Silchar (Barak Valley, AS)', lat: 24.8333, lon: 92.7789, hazard_type: 'Riverine Inundation & Embankment Breach', default_population: 14800, description: '' },
    { id: 'chamoli', name: 'Joshimath Subsidence (UK)', lat: 30.5574, lon: 79.5670, hazard_type: 'Land Subsidence & Slope Destabilization', default_population: 2800, description: '' },
    { id: 'munambam', name: 'Munambam Coastal Surge (KL)', lat: 10.1792, lon: 76.1738, hazard_type: 'Coastal Storm Surge & Sea Ingress', default_population: 3500, description: '' }
  ]);
  const [liveAnalysis, setLiveAnalysis] = useState<BackendAnalysisResponse | null>(null);
  const [stressFactors, setStressFactors] = useState<{ rainShockPct: number; corridorBlocked: boolean; fleetReductionPct: number }>({
    rainShockPct: 0,
    corridorBlocked: false,
    fleetReductionPct: 0
  });

  // Probe backend health & presets on mount
  useEffect(() => {
    let mounted = true;

    async function probeBackend() {
      try {
        const health = await apiClient.getHealth();
        if (mounted) {
          setBackendHealth(health);
        }
      } catch {
        if (mounted) {
          setBackendHealth(null);
        }
      }

      try {
        const fetchedPresets = await apiClient.getPresets();
        if (mounted && Array.isArray(fetchedPresets) && fetchedPresets.length > 0) {
          setPresets(fetchedPresets);
        }
      } catch {
        // Fallback to static presets if backend presets endpoint is unreachable
      }
    }

    probeBackend();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync if URL query param or route param changes
  useEffect(() => {
    if (incidentFromUrl) {
      if (SYNTHETIC_SCENARIOS[incidentFromUrl]) {
        setSelectedScenarioId(incidentFromUrl);
        setCustomScenario(null);
      } else {
        // Fetch or resolve the incident from the backend if it's an external incident ID
        apiClient.getGlobalIncident(incidentFromUrl).then((incident) => {
          if (incident) {
            const dynamic = createScenarioFromGlobalIncident(incident);
            setCustomScenario(dynamic);
            setSelectedScenarioId(incident.id);
          }
        }).catch(() => {
          // Fallback to standard scenario if unresolvable
        });
      }
    }
  }, [incidentFromUrl]);

  // Handle drill-down selection from Global Intelligence Map
  const handleSelectGlobalIncident = (incident: GlobalIncident) => {
    if (incident.is_demo_preset && SYNTHETIC_SCENARIOS[incident.id]) {
      setSelectedScenarioId(incident.id);
      setCustomScenario(null);
    } else {
      const dynamic = createScenarioFromGlobalIncident(incident);
      setCustomScenario(dynamic);
      setSelectedScenarioId(incident.id);
    }
    setLiveAnalysis(null);
    setActiveTab('map');
    setSearchParams({ incident: incident.id });
  };

  const handleScenarioChange = (newId: string) => {
    setCustomScenario(null);
    setSelectedScenarioId(newId);
    setLiveAnalysis(null);
    setSearchParams({ incident: newId });
    if (activeTab === 'global') {
      setActiveTab('map');
    }
    triggerScanAnimation(newId);
  };

  const baseScenario: DisasterScenario = useMemo(() => {
    if (customScenario) return customScenario;
    return SYNTHETIC_SCENARIOS[selectedScenarioId] || SYNTHETIC_SCENARIOS['devgram'];
  }, [customScenario, selectedScenarioId]);

  const triggerScanAnimation = async (scenarioIdToScan: string = selectedScenarioId) => {
    setIsScanning(true);
    setApiNotice(null);
    const targetScenario = customScenario || SYNTHETIC_SCENARIOS[scenarioIdToScan] || baseScenario;

    setScanStep('Querying Sentinel-1 C-Band SAR STAC radar backscatter...');

    const timer1 = setTimeout(() => {
      setScanStep('Sampling SRTM 30m Digital Elevation Model (DEM) transect...');
    }, 300);

    const timer2 = setTimeout(() => {
      setScanStep('Evaluating OpenStreetMap candidates against Zero-Tolerance Hard Veto...');
    }, 600);

    const timer3 = setTimeout(() => {
      setScanStep('Computing Sphere Project international humanitarian shelter knapsack...');
    }, 900);

    try {
      // Call actual FastAPI backend analysis endpoint
      const result = await apiClient.runAnalysis({
        lat: targetScenario.centroid.lat,
        lon: targetScenario.centroid.lon,
        displaced_population: targetScenario.displaced_population,
        hazard_type: targetScenario.hazard_type
      });

      setLiveAnalysis(result);
      setApiNotice(`Live analysis complete. Provenance: ${result.data_provenance?.overall_mode || 'LIVE'}`);
    } catch (err: any) {
      setApiNotice(`Analysis notice: Running with baseline parameters (${err.message || 'Offline mode'})`);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsScanning(false);
    }
  };

  const handleExit = () => {
    navigate('/');
  };

  // Merge live analysis results with scenario if available
  const currentScenario: DisasterScenario = useMemo(() => {
    if (!liveAnalysis) return baseScenario;

    const merged = { ...baseScenario };
    if (liveAnalysis.location_name) {
      merged.name = liveAnalysis.location_name;
    }
    if (liveAnalysis.precipitation_telemetry?.rainfall_mm) {
      merged.hazard_summary.rainfall_24h_mm = liveAnalysis.precipitation_telemetry.rainfall_mm;
    }
    if (liveAnalysis.precipitation_telemetry?.computed_hazard_index) {
      merged.hazard_summary.computed_hazard_index = liveAnalysis.precipitation_telemetry.computed_hazard_index;
    }

    // Synchronize candidate sanctuaries from backend progressive search
    const decision = liveAnalysis.relocation_decision;
    if (decision?.all_evaluated_candidates && decision.all_evaluated_candidates.length > 0) {
      merged.candidate_sanctuaries = decision.all_evaluated_candidates.map((c: any) => ({
        id: c.id,
        name: c.name,
        ring: c.ring_label || `Ring ${c.ring}`,
        lat: c.coordinates.lat,
        lon: c.coordinates.lon,
        distance_km: c.distance_km,
        gross_area_sqm: c.gross_area_sqm,
        usable_area_sqm: c.estimated_usable_area_sqm || 0,
        sphere_capacity_persons: c.shelter_capacity_persons,
        allocated_population: c.allocated_population || 0,
        slope_deg: c.slope_deg,
        status: c.passed_hard_veto ? 'APPROVED' : 'HARD_VETO',
        in_active_radius: c.in_active_radius,
        veto_reasons: c.veto_reasons,
        mcda_score: c.suitability?.score || 0,
        infrastructure: {
          water_tanks: c.infrastructure?.water === 'AVAILABLE' ? 12 : 2,
          power_backup: c.infrastructure?.power || 'DG Backup',
          medical_distance_km: c.infrastructure?.nearestHospitalKm || 2.5,
          helipad: c.gross_area_sqm >= 35000
        }
      }));
    }

    return merged;
  }, [baseScenario, liveAnalysis]);

  const provenanceBadge = liveAnalysis?.data_provenance
    ? `DATA PROVENANCE: ${liveAnalysis.data_provenance.overall_mode} • SENTINEL: ${liveAnalysis.data_provenance.sentinel1}`
    : backendHealth
    ? `DATA PIPELINE: FASTAPI ONLINE (${backendHealth.overall_status.toUpperCase()})`
    : `DATA PIPELINE: CACHED SYNTHETIC ARCHIVE (DEMO)`;

  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col bg-[#070B12] text-white overflow-hidden select-none font-sans">
      {/* ─── 1. TOP APPLICATION BAR ─── */}
      <header className="h-14 shrink-0 bg-[#090E17] border-b border-white/10 px-4 lg:px-6 flex items-center justify-between gap-4 z-20">
        {/* Left: Brand Identity & Provenance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-widest text-white leading-none">RAKSHA</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-semibold tracking-wider">
              2.0 GLOBAL INTELLIGENCE
            </span>
          </div>
          <span className="text-white/20 hidden xl:inline">|</span>
          <span className="text-[10px] tracking-[0.2em] text-white/50 font-mono hidden xl:inline">
            DISASTER OBSERVATION & EXPLAINABLE RELOCATION
          </span>
        </div>

        {/* Center: Real Data Provenance Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/15 text-[10px] font-mono">
          <Database className="w-3 h-3 text-cyan-400" />
          <span className="text-white/80">{provenanceBadge}</span>
        </div>

        {/* Right: Operational Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick toggle to Global Map if in detailed workspace */}
          {activeTab !== 'global' && (
            <button
              onClick={() => setActiveTab('global')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
              title="Return to World Map discovery"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">World Map</span>
            </button>
          )}

          {/* Regional Benchmark Presets Selector */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-sm">
            <span className="text-[11px] font-mono text-white/50 hidden sm:inline">PRESET:</span>
            <select
              value={customScenario ? '' : selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-cyan-400 focus:outline-none cursor-pointer pr-1"
            >
              {customScenario && (
                <option value="" disabled className="bg-[#090E17] text-amber-300">
                  Live: {customScenario.name.slice(0, 22)}...
                </option>
              )}
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id} className="bg-[#090E17] text-white">
                  {preset.name.length > 28 ? `${preset.name.slice(0, 28)}...` : preset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Run Analysis / Rescan Action */}
          <button
            onClick={() => triggerScanAnimation()}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/50 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
            title="Execute on-demand orbital telemetry scan & relocation analysis with FastAPI backend"
          >
            <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Run Analysis</span>
          </button>

          {/* Exit / Return to Landing Page */}
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            title="Return to Landing Page"
            aria-label="Exit Command Center"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
            <span className="hidden sm:inline">Briefing</span>
          </button>
        </div>
      </header>

      {/* ─── 2. INCIDENT STATUS STRIP ─── */}
      <section className="h-8 shrink-0 bg-[#0A101C] border-b border-white/[0.08] px-4 lg:px-6 flex items-center justify-between text-xs font-mono text-white/70 overflow-x-auto z-10">
        {activeTab === 'global' ? (
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GLOBAL SURVEILLANCE ACTIVE
            </span>
            <span className="text-white/20">•</span>
            <span className="text-white/80">
              Select or hover over any disaster event on the world map to inspect intelligence or drill down
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {backendHealth ? `BACKEND: ${backendHealth.overall_status.toUpperCase()}` : 'OFFLINE ENGINE: READY'}
            </span>
            <span className="text-white/20">•</span>
            <span className="text-white/80">
              INCIDENT: <strong className="text-white">{currentScenario.name.split(' (')[0]}</strong>
            </span>
            <span className="text-white/20 hidden md:inline">•</span>
            <span className="text-white/60 hidden md:inline">
              Hazard: <strong className="text-red-400">{currentScenario.hazard_type}</strong> (Index: {currentScenario.hazard_summary.computed_hazard_index})
            </span>
            <span className="text-white/20 hidden lg:inline">•</span>
            <span className="text-cyan-300 hidden lg:inline">
              Coords: {currentScenario.centroid.lat.toFixed(4)}° N, {currentScenario.centroid.lon.toFixed(4)}° E
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {stressFactors && (stressFactors.rainShockPct > 0 || stressFactors.corridorBlocked || stressFactors.fleetReductionPct > 0) && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              STRESS TEST: {stressFactors.rainShockPct > 0 ? `+${stressFactors.rainShockPct}% RAIN ` : ''}{stressFactors.corridorBlocked ? 'ROUTE BLOCKED ' : ''}{stressFactors.fleetReductionPct > 0 ? `-${stressFactors.fleetReductionPct}% FLEET` : ''}
            </span>
          )}
          {apiNotice && (
            <span className="text-amber-300 text-[11px] hidden xl:flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              {apiNotice}
            </span>
          )}
          {activeTab !== 'global' && (
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DISPLACED POP: {currentScenario.displaced_population.toLocaleString()} PAX</span>
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. WORKSPACE NAVIGATION TABS ─── */}
      <nav className="h-11 shrink-0 bg-[#080D18] border-b border-white/10 px-4 lg:px-6 flex items-center gap-1 overflow-x-auto z-10">
        {[
          { id: 'global', label: '🌍 Global Intel Map', icon: Globe },
          { id: 'map', label: 'GIS Mission Map', icon: Map },
          { id: 'eo', label: 'EO Telemetry Studio', icon: Radio },
          { id: 'relocation', label: 'Relocation & Hard Veto', icon: Shield },
          { id: 'fleet', label: 'Fleet Logistics Dispatch', icon: Truck },
          { id: 'ddma', label: 'DDMA Legal Directive', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 h-full text-xs font-mono font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-cyan-400 border-cyan-400 bg-white/[0.04] font-bold shadow-sm'
                  : 'text-white/60 border-transparent hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ─── 4. MAIN WORKSPACE CONTAINER ─── */}
      <main className="flex-1 min-h-0 min-w-0 relative w-full h-full overflow-hidden bg-[#05080E]">
        {/* Simulated Satellite Scanning HUD Overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md space-y-4 animate-fade-in pointer-events-auto">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 animate-spin" />
              <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-center font-mono space-y-1.5 px-4 max-w-lg">
              <p className="text-xs text-cyan-400 tracking-widest font-bold uppercase animate-pulse flex items-center justify-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>EXECUTING ORBITAL TELEMETRY & RELOCATION PIPELINE</span>
              </p>
              <p className="text-xs text-white/90 bg-white/5 py-1 px-3 rounded border border-white/10">{scanStep}</p>
            </div>
          </div>
        )}

        {/* Tab 0: Global Intelligence World Map */}
        {activeTab === 'global' && (
          <div className="w-full h-full min-h-0 min-w-0">
            <GlobalIntelligenceMap onSelectIncident={handleSelectGlobalIncident} />
          </div>
        )}

        {/* Tab 1: Full-Screen GIS Mission Map (Incident Drill-Down) */}
        {activeTab === 'map' && (
          <div className="w-full h-full min-h-0 min-w-0">
            <GisSimulationMap 
              scenario={currentScenario} 
              relocationDecision={liveAnalysis?.relocation_decision}
            />
          </div>
        )}

        {/* Tab 2: EO Telemetry Studio */}
        {activeTab === 'eo' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6 pb-28">
            <div className="max-w-7xl mx-auto">
              <EarthObservationStudio scenario={currentScenario} />
            </div>
          </div>
        )}

        {/* Tab 3: Relocation Engine & Hard Veto */}
        {activeTab === 'relocation' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6 pb-28">
            <div className="max-w-7xl mx-auto">
              <RelocationEngineStudio 
                scenario={currentScenario} 
                relocationDecision={liveAnalysis?.relocation_decision}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Fleet Logistics Dispatch */}
        {activeTab === 'fleet' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6 pb-28">
            <div className="max-w-7xl mx-auto">
              <FleetMobilityDispatcher scenario={currentScenario} />
            </div>
          </div>
        )}

        {/* Tab 5: DDMA Legal Directive */}
        {activeTab === 'ddma' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6 pb-28">
            <div className="max-w-5xl mx-auto">
              <DdmaDirectiveModal scenario={currentScenario} />
            </div>
          </div>
        )}

        {/* Floating AI Tactical Commander Intelligence Hub (Available on all workspace tabs) */}
        {activeTab !== 'global' && (
          <AiTacticalCommander
            scenarioId={currentScenario.id}
            scenarioName={currentScenario.name}
            hazardType={currentScenario.hazard_type}
            displacedPopulation={currentScenario.displaced_population}
            planningWindowMins={currentScenario.planning_window_mins}
            activeSearchRadiusKm={liveAnalysis?.relocation_decision?.final_search_radius_km || 10.0}
            approvedCapacity={liveAnalysis?.relocation_decision?.approved_capacity || 1040}
            weatherHazardIndex={currentScenario.hazard_summary.computed_hazard_index}
            corridorSpeedKmh={currentScenario.fleet_logistics.speed_kmh}
            onApplyStressFactors={setStressFactors}
          />
        )}
      </main>
    </div>
  );
};
