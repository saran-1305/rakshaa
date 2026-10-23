import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SYNTHETIC_SCENARIOS, type DisasterScenario } from '../../data/syntheticScenarios';
import { GisSimulationMap } from './GisSimulationMap';
import { EarthObservationStudio } from './EarthObservationStudio';
import { RelocationEngineStudio } from './RelocationEngineStudio';
import { FleetMobilityDispatcher } from './FleetMobilityDispatcher';
import { DdmaDirectiveModal } from './DdmaDirectiveModal';
import {
  Map,
  Radio,
  Shield,
  Truck,
  FileText,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Database
} from 'lucide-react';

interface MissionCommandPageProps {
  initialScenarioId?: string;
}

export const MissionCommandPage: React.FC<MissionCommandPageProps> = ({
  initialScenarioId = 'devgram'
}) => {
  const navigate = useNavigate();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [activeTab, setActiveTab] = useState<'map' | 'eo' | 'relocation' | 'fleet' | 'ddma'>('map');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  const currentScenario: DisasterScenario =
    SYNTHETIC_SCENARIOS[selectedScenarioId] || SYNTHETIC_SCENARIOS['devgram'];

  const handleScenarioChange = (newId: string) => {
    setSelectedScenarioId(newId);
    triggerScanAnimation();
  };

  const triggerScanAnimation = () => {
    setIsScanning(true);
    setScanStep('Querying Sentinel-1 SAR STAC radar backscatter...');
    setTimeout(() => {
      setScanStep('Computing SRTM 30m DEM elevation transect...');
    }, 250);
    setTimeout(() => {
      setScanStep('Applying Zero-Tolerance Hard Veto slope & debris filters...');
    }, 500);
    setTimeout(() => {
      setScanStep('Executing Sphere Project humanitarian knapsack allocation...');
    }, 750);
    setTimeout(() => {
      setIsScanning(false);
    }, 1000);
  };

  const handleExit = () => {
    navigate('/');
  };

  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col bg-[#070B12] text-white overflow-hidden select-none font-sans">
      {/* ─── 1. TOP APPLICATION BAR ─── */}
      <header className="h-14 shrink-0 bg-[#090E17] border-b border-white/10 px-4 lg:px-6 flex items-center justify-between gap-4 z-20">
        {/* Left: Brand Identity & Provenance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-widest text-white leading-none">RAKSHA</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-semibold tracking-wider">
              2.0 COMMAND CENTER
            </span>
          </div>
          <span className="text-white/20 hidden xl:inline">|</span>
          <span className="text-[10px] tracking-[0.2em] text-white/50 font-mono hidden xl:inline">
            EXPLAINABLE GEOSPATIAL RELOCATION ENGINE
          </span>
        </div>

        {/* Center: Provenance Badge (Distinctly shows synthetic/cached archive) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/30 border border-amber-500/30 text-[10px] font-mono text-amber-300">
          <Database className="w-3 h-3 text-amber-400" />
          <span>DATA PIPELINE: CACHED SYNTHETIC ARCHIVE (DEMO)</span>
        </div>

        {/* Right: Operational Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Incident Hotspot Selector */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-sm">
            <span className="text-[11px] font-mono text-white/50 hidden sm:inline">HOTSPOT:</span>
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-cyan-400 focus:outline-none cursor-pointer pr-1"
            >
              <option value="devgram" className="bg-[#090E17] text-white">Devgram (Chamoli, UK)</option>
              <option value="wayanad" className="bg-[#090E17] text-white">Chooralmala (Wayanad, KL)</option>
              <option value="silchar" className="bg-[#090E17] text-white">Silchar (Barak Valley, AS)</option>
              <option value="chamoli" className="bg-[#090E17] text-white">Joshimath Subsidence (UK)</option>
              <option value="munambam" className="bg-[#090E17] text-white">Munambam Surge (KL)</option>
            </select>
          </div>

          {/* Rescan Satellite Telemetry Action */}
          <button
            onClick={triggerScanAnimation}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/50 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
            title="Execute on-demand orbital telemetry scan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rescan Satellite EO</span>
          </button>

          {/* Exit / Return to Landing Page */}
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            title="Return to Landing Page"
            aria-label="Exit Command Center"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
            <span className="hidden sm:inline">Exit to Briefing</span>
          </button>
        </div>
      </header>

      {/* ─── 2. INCIDENT STATUS STRIP ─── */}
      <section className="h-8 shrink-0 bg-[#0A101C] border-b border-white/[0.08] px-4 lg:px-6 flex items-center justify-between text-xs font-mono text-white/70 overflow-x-auto z-10">
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OFFLINE SIMULATION ENGINE: ONLINE
          </span>
          <span className="text-white/20">•</span>
          <span className="text-white/80">
            AOI: <strong className="text-white">{currentScenario.name}</strong>
          </span>
          <span className="text-white/20 hidden md:inline">•</span>
          <span className="text-white/60 hidden md:inline">
            Hazard: <strong className="text-red-400">{currentScenario.hazard_type}</strong> (Index: {currentScenario.hazard_summary.computed_hazard_index})
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-white/50 text-[11px] hidden lg:inline">
            24h Rain: {currentScenario.hazard_summary.rainfall_24h_mm} mm
          </span>
          <span className="text-white/20 hidden lg:inline">•</span>
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DISPLACED POPULATION: {currentScenario.displaced_population.toLocaleString()} PAX</span>
          </div>
        </div>
      </section>

      {/* ─── 3. WORKSPACE NAVIGATION TABS ─── */}
      <nav className="h-11 shrink-0 bg-[#080D18] border-b border-white/10 px-4 lg:px-6 flex items-center gap-1 overflow-x-auto z-10">
        {[
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
            <div className="text-center font-mono space-y-1.5 px-4">
              <p className="text-xs text-cyan-400 tracking-widest font-bold uppercase animate-pulse">
                EXECUTING ORBITAL TELEMETRY SCAN
              </p>
              <p className="text-xs text-white/80">{scanStep}</p>
            </div>
          </div>
        )}

        {/* Workspace 1: Full-Screen GIS Mission Map */}
        {activeTab === 'map' && (
          <div className="w-full h-full min-h-0 min-w-0">
            <GisSimulationMap scenario={currentScenario} />
          </div>
        )}

        {/* Workspace 2: EO Telemetry Studio */}
        {activeTab === 'eo' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <EarthObservationStudio scenario={currentScenario} />
            </div>
          </div>
        )}

        {/* Workspace 3: Relocation Engine & Hard Veto */}
        {activeTab === 'relocation' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <RelocationEngineStudio scenario={currentScenario} />
            </div>
          </div>
        )}

        {/* Workspace 4: Fleet Logistics Dispatch */}
        {activeTab === 'fleet' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <FleetMobilityDispatcher scenario={currentScenario} />
            </div>
          </div>
        )}

        {/* Workspace 5: DDMA Legal Directive */}
        {activeTab === 'ddma' && (
          <div className="w-full h-full overflow-y-auto min-h-0 p-4 lg:p-6">
            <div className="max-w-5xl mx-auto">
              <DdmaDirectiveModal scenario={currentScenario} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
