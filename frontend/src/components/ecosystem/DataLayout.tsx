import React, { useState, useEffect } from 'react';
import { EcosystemVisual } from './EcosystemVisual';
import { DataInfoPanel } from './DataInfoPanel';
import { SourceExplorerModal } from './SourceExplorerModal';
import { dataSources } from './dataSources';
import type { DataSource } from './dataSources';
import { FinalStatement } from './FinalStatement';
import gsap from 'gsap';

interface DataLayoutProps {
  progress: number;
  onOpenMissionModal?: () => void;
}

export const DataLayout: React.FC<DataLayoutProps> = ({ progress, onOpenMissionModal }) => {
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [exploringSource, setExploringSource] = useState<DataSource | null>(null);

  const handleSourceHover = (id: string | null) => {
    // Only update if hovering a new node. Don't clear on mouse leave.
    if (id) {
      setActiveSourceId(id);
    }
  };

  // Clear active source if we scroll out of the active zone
  useEffect(() => {
    if (progress <= 0.05 || progress >= 0.95) {
      setActiveSourceId(null);
    }
  }, [progress]);

  const activeSource = activeSourceId ? dataSources.find(s => s.id === activeSourceId) || null : null;

  // We define 5 scroll stages based on progress (0 to 1)
  // Stage 1: 0.0 - 0.2 (Intro)
  // Stage 2: 0.2 - 0.4 (Environmental)
  // Stage 3: 0.4 - 0.6 (Context)
  // Stage 4: 0.6 - 0.8 (Advanced)
  // Stage 5: 0.8 - 1.0 (Convergence)
  
  let currentStage = 1;
  if (progress > 0.8) currentStage = 5;
  else if (progress > 0.6) currentStage = 4;
  else if (progress > 0.4) currentStage = 3;
  else if (progress > 0.2) currentStage = 2;

  // Header animation based on progress
  useEffect(() => {
    // Intro header fade in
    gsap.to('.ecosystem-header', {
      opacity: progress > 0.02 ? 1 : 0,
      y: progress > 0.02 ? 0 : 30,
      duration: 0.8,
      ease: 'power3.out'
    });
  }, [progress]);

  return (
    <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col pointer-events-none bg-[#02060B]">
      
      {/* Ecosystem Container - scales and blurs when exploring */}
      <div 
        className="absolute inset-0 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: exploringSource ? 'scale(0.97)' : 'scale(1)',
          filter: exploringSource ? 'blur(8px) brightness(0.4)' : 'blur(0px) brightness(1)'
        }}
      >
        {/* Absolute positioning for UI layers, pointer-events-auto where we need interaction */}
        
        {/* 1. Background / Master Visuals Layer (Behind everything) */}
        <div className="absolute inset-0 pointer-events-auto">
          <EcosystemVisual 
            progress={progress} 
            currentStage={currentStage}
            activeSourceId={activeSourceId}
            onSourceHover={handleSourceHover}
          />
        </div>

        {/* 2. Top Header Layer - Strictly top 20% */}
        <div className="absolute top-0 left-0 w-full pt-32 pb-8 z-20 flex flex-col items-center justify-start pointer-events-none ecosystem-header opacity-0 translate-y-8">
          <div className="font-mono text-[10px] tracking-[0.25em] text-white/50 uppercase mb-4">
            DATA INTEGRITY & PROVENANCE
          </div>
          <h2 className="font-space-grotesk text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4 text-center">
            <span className="text-white">DATA INTELLIGENCE</span> <span className="text-raksha-accent">ECOSYSTEM</span>
          </h2>
          <p className="font-inter text-sm text-raksha-textMuted max-w-xl text-center leading-relaxed">
            RAKSHA connects diverse, trusted data sources into a unified intelligence system for safer, faster and more informed decisions.
          </p>
        </div>

        {/* 3. Left Information Panel (Active when hovering RIGHT-side nodes) */}
        <div className="absolute top-1/2 left-8 md:left-12 lg:left-20 -translate-y-1/2 z-20 pointer-events-none hidden md:block">
          <DataInfoPanel 
            activeSource={activeSource && activeSource.x >= 50 ? activeSource : null} 
            align="left"
            onExplore={() => setExploringSource(activeSource)}
          />
        </div>

        {/* 4. Right Information Panel (Active when hovering LEFT-side nodes) */}
        <div className="absolute top-1/2 right-8 md:right-12 lg:right-20 -translate-y-1/2 z-20 pointer-events-none">
          <DataInfoPanel 
            activeSource={activeSource && activeSource.x < 50 ? activeSource : null} 
            align="right"
            onExplore={() => setExploringSource(activeSource)}
          />
        </div>

        {/* 5. Final Statement Layer */}
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <FinalStatement progress={progress} onOpenMissionModal={onOpenMissionModal} />
        </div>
      </div>

      {/* Explorer Modal overlaying everything */}
      <SourceExplorerModal 
        source={exploringSource} 
        onClose={() => setExploringSource(null)} 
      />

    </div>
  );
};
