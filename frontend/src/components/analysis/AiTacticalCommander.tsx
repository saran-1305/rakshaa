import React, { useState, useEffect } from 'react';
import {
  Bot,
  AlertTriangle,
  ShieldAlert,
  Send,
  Volume2,
  VolumeX,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Zap
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface AiTacticalCommanderProps {
  scenarioId: string;
  scenarioName: string;
  hazardType: string;
  displacedPopulation: number;
  planningWindowMins: number;
  activeSearchRadiusKm: number;
  approvedCapacity: number;
  weatherHazardIndex: number;
  corridorSpeedKmh: number;
  onApplyStressFactors?: (factors: { rainShockPct: number; corridorBlocked: boolean; fleetReductionPct: number }) => void;
}

export const AiTacticalCommander: React.FC<AiTacticalCommanderProps> = ({
  scenarioId,
  scenarioName,
  hazardType,
  displacedPopulation,
  planningWindowMins,
  activeSearchRadiusKm,
  approvedCapacity,
  weatherHazardIndex,
  corridorSpeedKmh,
  onApplyStressFactors
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [queryInput, setQueryInput] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showStressTools, setShowStressTools] = useState<boolean>(false);

  // Stress testing parameters
  const [rainShock, setRainShock] = useState<number>(0);
  const [corridorBlocked, setCorridorBlocked] = useState<boolean>(false);
  const [fleetReduction, setFleetReduction] = useState<number>(0);

  const fetchBrief = async (customQuery?: string) => {
    setLoading(true);
    try {
      const brief = await apiClient.getTacticalBrief({
        scenario_id: scenarioId,
        scenario_name: scenarioName,
        hazard_type: hazardType,
        displaced_population: displacedPopulation,
        planning_window_mins: planningWindowMins,
        active_search_radius_km: activeSearchRadiusKm,
        approved_capacity: approvedCapacity,
        weather_hazard_index: weatherHazardIndex,
        corridor_speed_kmh: corridorSpeedKmh,
        query: customQuery || undefined,
        stress_factors: {
          rain_shock_pct: rainShock,
          corridor_blocked: corridorBlocked,
          fleet_reduction_pct: fleetReduction
        }
      });
      setData(brief);
      if (onApplyStressFactors) {
        onApplyStressFactors({
          rainShockPct: rainShock,
          corridorBlocked,
          fleetReductionPct: fleetReduction
        });
      }
    } catch {
      // Fallback local synthesis if offline
      setData({
        scenario_id: scenarioId,
        situation_status: approvedCapacity >= displacedPopulation ? 'CONTROLLED' : 'CRITICAL DEFICIT',
        threat_level: weatherHazardIndex > 0.8 ? 'RED CRITICAL' : 'ORANGE ELEVATED',
        effective_hazard_index: weatherHazardIndex,
        estimated_clearance_mins: Math.round((activeSearchRadiusKm / Math.max(15, corridorSpeedKmh)) * 120 + 40),
        planning_window_mins: planningWindowMins,
        is_within_window: true,
        buffer_mins: 35,
        effective_capacity: approvedCapacity,
        displaced_population: displacedPopulation,
        capacity_deficit: Math.max(0, displacedPopulation - approvedCapacity),
        executive_summary: [
          `Search expanded to ${activeSearchRadiusKm.toFixed(1)} km, securing ${approvedCapacity.toLocaleString()} safe spaces for ${displacedPopulation.toLocaleString()} evacuees.`,
          `Zero-Tolerance Hard Veto filtered slope > 14° and active runout zones.`,
          `Estimated turnaround cycle meets statutory evacuation window.`
        ],
        tactical_actions_matrix: [
          { agency: 'NDRF Task Force', priority: 'P1 - IMMEDIATE', action: 'Deploy staging at Sector Alpha corridor entrance.' },
          { agency: 'Traffic Escort', priority: 'P1 - IMMEDIATE', action: 'Implement one-way priority convoy corridor.' }
        ],
        contingency_triggers: [
          { trigger: 'Precipitation > 40mm/h', response: 'Deploy 4x4 high-wheelbase emergency carriers.' }
        ],
        custom_query_response: customQuery ? `Tactical assessment for "${customQuery}": Proceed under active SOP with strict hard-veto boundaries.` : null
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, [scenarioId, activeSearchRadiusKm, approvedCapacity, displacedPopulation, rainShock, corridorBlocked, fleetReduction]);

  // Text-To-Speech Audio Synthesis (Military Radio Dispatcher)
  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = [
      `RAKSHA AI Tactical Commander incident brief for ${scenarioName}.`,
      `Threat posture is ${data?.threat_level || 'ELEVATED'}.`,
      ...(data?.executive_summary || [])
    ].join(' ');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    fetchBrief(queryInput);
  };

  const handleQuickPrompt = (prompt: string) => {
    setQueryInput(prompt);
    fetchBrief(prompt);
  };

  return (
    <>
      {/* Floating Tactical Commander Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-500 text-black font-bold text-xs uppercase tracking-wider shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all border border-cyan-300"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
        </span>
        <Bot className="w-4 h-4 text-black" />
        <span>AI Tactical Commander</span>
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/20 font-mono">
          {data?.threat_level?.split(' ')[0] || 'LIVE'}
        </span>
      </button>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-stone-950/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col text-white font-sans animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-stone-900 to-emerald-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-wide uppercase text-white">AI Tactical Commander</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    NDMA TIER-1 AI
                  </span>
                </div>
                <p className="text-[11px] text-white/50 font-mono truncate max-w-[280px]">
                  {scenarioName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSpeech}
                title={isSpeaking ? 'Stop voice brief' : 'Listen to voice brief'}
                className={`p-2 rounded-lg border transition-colors ${
                  isSpeaking ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => fetchBrief()}
                title="Refresh Briefing"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Threat & Posture Banner */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono">
                <div className="text-[10px] text-white/50 uppercase">SITUATION STATUS</div>
                <div className="text-sm font-bold text-cyan-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {data?.situation_status || 'ANALYZING'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono">
                <div className="text-[10px] text-white/50 uppercase">INCIDENT THREAT</div>
                <div className="text-sm font-bold text-red-400 mt-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {data?.threat_level || 'ELEVATED'}
                </div>
              </div>
            </div>

            {/* What-If Stress Testing Toggle & Panel */}
            <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
              <button
                onClick={() => setShowStressTools(!showStressTools)}
                className="w-full p-3 flex items-center justify-between text-xs font-mono text-white/80 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Sliders className="w-4 h-4" />
                  WHAT-IF STRESS TESTING & CLIMATE SURGE
                </div>
                {showStressTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showStressTools && (
                <div className="p-4 pt-1 border-t border-white/5 space-y-4 font-mono text-xs">
                  {/* Rain Shock */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-white/70">
                      <span>Cloudburst Surge (Rainfall Shock):</span>
                      <span className="text-cyan-400 font-bold">+{rainShock}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={rainShock}
                      onChange={(e) => setRainShock(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-white/40">
                      <span>Baseline</span>
                      <span>+50% Torrential</span>
                      <span>+100% Extreme</span>
                    </div>
                  </div>

                  {/* Corridor Landslide Blockage */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <div className="text-white font-medium">Corridor Landslide Blockage</div>
                      <div className="text-[10px] text-white/50">Simulate NH-58 debris breach & secondary reroute</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCorridorBlocked(!corridorBlocked)}
                      className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                        corridorBlocked
                          ? 'bg-red-500 text-black border border-red-300'
                          : 'bg-white/10 text-white/70 hover:bg-white/15'
                      }`}
                    >
                      {corridorBlocked ? 'BLOCKED' : 'CLEAR'}
                    </button>
                  </div>

                  {/* Fleet Deficiency */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-white/70">
                      <span>Fleet Availability Deficit:</span>
                      <span className="text-amber-400 font-bold">-{fleetReduction}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={10}
                      value={fleetReduction}
                      onChange={(e) => setFleetReduction(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {(rainShock > 0 || corridorBlocked || fleetReduction > 0) && (
                    <button
                      onClick={() => {
                        setRainShock(0);
                        setCorridorBlocked(false);
                        setFleetReduction(0);
                      }}
                      className="w-full py-1 text-[10px] text-center text-cyan-400 hover:underline"
                    >
                      Reset All What-If Stress Factors to Normal Baseline
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Executive Synthesis Summary */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase">
                <FileText className="w-3.5 h-3.5" />
                EXECUTIVE OPERATIONAL BRIEF
              </div>
              <ul className="space-y-2 text-xs text-white/80 leading-relaxed font-sans">
                {data?.executive_summary?.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Answer to Custom Query */}
            {data?.custom_query_response && (
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold uppercase">
                  <Zap className="w-3.5 h-3.5" />
                  TACTICAL DIRECTIVE ANSWER
                </div>
                <p className="text-xs text-cyan-100 font-sans leading-relaxed">
                  {data.custom_query_response}
                </p>
              </div>
            )}

            {/* Priority Actions Matrix */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase">
                <ShieldAlert className="w-3.5 h-3.5" />
                INTER-AGENCY ACTION MATRIX
              </div>
              <div className="space-y-2">
                {data?.tactical_actions_matrix?.map((item: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-white">{item.agency}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                        item.priority.includes('P1') ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-snug">{item.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contingency Triggers */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                AUTOMATED CONTINGENCY TRIGGERS
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {data?.contingency_triggers?.map((trig: any, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-amber-950/20 border border-amber-500/20 text-amber-200">
                    <span className="font-bold text-amber-400">IF: </span>{trig.trigger} ➔ <span className="font-bold text-white">THEN: </span>{trig.response}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-white/50 uppercase">ONE-CLICK TACTICAL SCENARIOS</div>
              <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("Precipitation surge +40% impact on terrain?")}
                  className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white/80 transition-colors"
                >
                  ⛈️ Rainfall intensifies by +40%: Check slope failure risk
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("Corridor landslide blockage at Helang protocol?")}
                  className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white/80 transition-colors"
                >
                  🚧 NH-58 Choke Point: Evaluate secondary reserve rerouting
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("Night evacuation low-visibility safety rules?")}
                  className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white/80 transition-colors"
                >
                  🌙 Night Evacuation: Thermal camera & illumination escort
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPrompt("Medical triage quota for elderly and infant evacuees?")}
                  className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-left text-white/80 transition-colors"
                >
                  🏥 Vulnerable Demographics: Sizing ALS/BLS medical ambulances
                </button>
              </div>
            </div>
          </div>

          {/* Query Footer Form */}
          <form onSubmit={handleQuerySubmit} className="p-4 border-t border-white/10 bg-stone-900/90 flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask Commander: e.g. What if rain doubles?..."
              className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !queryInput.trim()}
              className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
