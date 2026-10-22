import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { createHeroEntrance } from './animations/heroTimeline';
import type { HeroRefs } from './animations/heroTimeline';
import { HeroVideo } from './HeroVideo';
import { HeroNavigation } from './HeroNavigation';
import { HeroContent } from './HeroContent';

interface HeroSectionProps {
  onOpenMissionModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenMissionModal }) => {
  const refs: HeroRefs = {
    container: useRef<HTMLDivElement | null>(null),
    video: useRef<HTMLVideoElement | null>(null),
    initialText: useRef<HTMLDivElement | null>(null),
    finalText: useRef<HTMLDivElement | null>(null),
    ctas: useRef<HTMLDivElement | null>(null),
    hudStats: useRef<HTMLDivElement | null>(null),
    cardDetect: useRef<HTMLDivElement | null>(null),
    cardAssess: useRef<HTMLDivElement | null>(null),
    cardPlan: useRef<HTMLDivElement | null>(null),
    cardResilient: useRef<HTMLDivElement | null>(null),
  };

  useLayoutEffect(() => {
    if (!refs.container.current) return;

    const ctx = gsap.context(() => {
      createHeroEntrance(refs);
    }, refs.container);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={refs.container} 
      className="relative w-full min-h-screen font-sans overflow-hidden flex flex-col"
    >
      <HeroNavigation onOpenMissionModal={onOpenMissionModal} />
      
      {/* Video Background - Merged into the right side */}
      <div className="absolute inset-0 lg:left-1/3 z-0 pointer-events-none overflow-hidden">
        <HeroVideo refs={refs} />
      </div>

      {/* Content - Constrained to left side */}
      <div className="relative z-10 flex-grow max-w-[1920px] mx-auto w-full px-6 sm:px-8 lg:px-12 flex items-center">
        <div className="w-full lg:w-1/2">
          <HeroContent refs={refs} onOpenMissionModal={onOpenMissionModal} />
        </div>
      </div>
    </section>
  );
};
