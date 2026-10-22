import React, { useState } from 'react';
import { SYNTHETIC_SCENARIOS, type DisasterScenario } from '../../data/syntheticScenarios';
import { GisSimulationMap } from './GisSimulationMap';
import { EarthObservationStudio } from './EarthObservationStudio';
import { RelocationEngineStudio } from './RelocationEngineStudio';
import { FleetMobilityDispatcher } from './FleetMobilityDispatcher';
import { DdmaDirectiveModal } from './DdmaDirectiveModal';
import { X, Map, Radio, Shield, Truck, FileText, RefreshCw, Sparkles } from 'lucide-react';

interface MissionCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScenarioId?: string;
}

export const MissionCommandModal: React.FC<MissionCommandModalProps> = ({
  isOpen,
  onClose,
  initialScenarioId = 'devgram'
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [activeTab, setActiveTab] = useState<'map' | 'eo' | 'relocation' | 'fleet' | 'ddma'>('map');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-7xl max-h-[92vh] flex flex-col bg-raksha-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Top Mission Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-widest text-white leading-none">RAKSHA</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-raksha-accent/20 border border-raksha-accent/50 text-raksha-accent">
                  2.0 LIVE DEMO
                </span>
              </div>
              <span className="text-[10px] tracking-[0.2em] text-white/50 font-mono mt-1">
                EXPLAINABLE GEOSPATIAL RELOCATION ENGINE
              </span>
            </div>
          </div>

          {/* Scenario Selector & Scanner CTA */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-xs font-mono text-white/60">HOTSPOT:</span>
              <select
                value={selectedScenarioId}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-raksha-accent focus:outline-none cursor-pointer"
              >
                <option value="devgram" className="bg-neutral-900 text-white">Devgram (Chamoli, UK)</option>
                <option value="wayanad" className="bg-neutral-900 text-white">Chooralmala (Wayanad, KL)</option>
                <option value="silchar" className="bg-neutral-900 text-white">Silchar (Barak Valley, AS)</option>
                <option value="chamoli" className="bg-neutral-900 text-white">Joshimath Subsidence (UK)</option>
                <option value="munambam" className="bg-neutral-900 text-white">Munambam Coastal Surge (KL)</option>
              </select>
            </div>

            <button
              onClick={triggerScanAnimation}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-raksha-accent/20 border border-raksha-accent/40 text-raksha-accent hover:bg-raksha-accent/30 text-xs font-mono transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Rescan Satellite EO</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tactical Sub-Header & Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-black/60 border-b border-white/10 text-xs font-mono text-white/70">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYNTHETIC ORBITAL ENGINE: ONLINE
            </span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="text-white/60 hidden sm:inline">
              AOI: {currentScenario.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-raksha-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DISPLACED POPULATION: {currentScenario.displaced_population.toLocaleString()} PAX</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/10 bg-black/20 overflow-x-auto">
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
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'text-raksha-accent border-raksha-accent bg-white/5 font-bold'
                    : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Body */}
        <div className="relative flex-1 p-6 overflow-y-auto">
          {/* Simulated Satellite Scanning HUD Overlay */}
          {isScanning && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-raksha-accent animate-spin" />
                <Radio className="w-8 h-8 text-raksha-accent animate-pulse" />
              </div>
              <div className="text-center font-mono space-y-1">
                <p className="text-xs text-raksha-accent tracking-widest font-bold uppercase animate-pulse">
                  EXECUTING ORBITAL TELEMETRY SCAN
                </p>
                <p className="text-xs text-white/80">{scanStep}</p>
              </div>
            </div>
          )}

          {activeTab === 'map' && <GisSimulationMap scenario={currentScenario} />}
          {activeTab === 'eo' && <EarthObservationStudio scenario={currentScenario} />}
          {activeTab === 'relocation' && <RelocationEngineStudio scenario={currentScenario} />}
          {activeTab === 'fleet' && <FleetMobilityDispatcher scenario={currentScenario} />}
          {activeTab === 'ddma' && <DdmaDirectiveModal scenario={currentScenario} />}
        </div>
      </div>
    </div>
  );
};
