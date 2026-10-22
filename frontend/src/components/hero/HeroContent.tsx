import React from 'react';
import type { HeroRefs } from './animations/heroTimeline';
import { HeroCapabilities } from './HeroCapabilities';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroContentProps {
  refs: HeroRefs;
  onOpenMissionModal?: () => void;
}

export const HeroContent: React.FC<HeroContentProps> = ({ refs, onOpenMissionModal }) => {
  return (
    <div className="w-full flex flex-col justify-center pt-32 lg:pt-0 pb-16 lg:pb-0 z-10">
      <div ref={refs.initialText} className="flex flex-col gap-6">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 text-raksha-textMuted font-mono text-sm tracking-widest">
          <div className="w-8 h-[1px] bg-raksha-accent"></div>
          AI-DRIVEN RELOCATION
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
          <span className="block text-white">DETECT RISK</span>
          <span className="block text-white">PRIORITIZE PEOPLE</span>
          <span className="block text-raksha-accent mt-2">FIND SAFER GROUND</span>
        </h1>

        {/* Description */}
        <p className="text-lg text-raksha-textMuted/90 max-w-lg leading-relaxed mt-2">
          RAKSHA converts hazard intelligence, population exposure, and terrain evidence into explainable relocation decisions.
        </p>

        {/* Capabilities */}
        <HeroCapabilities refs={refs} />

        {/* CTAs */}
        <div ref={refs.ctas} className="flex items-center gap-4 mt-8 flex-wrap">
          <button 
            onClick={onOpenMissionModal}
            className="flex items-center gap-2 bg-raksha-accent text-raksha-900 px-8 py-4 text-sm font-semibold tracking-wide hover:bg-raksha-accentLight transition-all duration-300 transform hover:-translate-y-1 rounded cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            ENTER RAKSHA
            <ArrowRight className="w-4 h-4" />
          </button>
          <a 
            href="#why"
            className="flex items-center gap-2 bg-black/20 backdrop-blur-sm border border-raksha-textMuted/30 text-white px-8 py-4 text-sm font-medium tracking-wide hover:bg-white/10 hover:border-raksha-accent/50 transition-all duration-300 transform hover:-translate-y-1 rounded cursor-pointer"
          >
            EXPLORE ARCHITECTURE
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      {/* Final State Message */}
      <div ref={refs.finalText} className="hidden opacity-0 pointer-events-none mt-12">
        <p className="text-raksha-textMuted font-mono text-sm tracking-widest">FROM RISK TO RESILIENCE</p>
      </div>
    </div>
  );
};
