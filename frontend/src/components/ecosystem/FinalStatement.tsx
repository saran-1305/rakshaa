import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface FinalStatementProps {
  progress: number;
  onOpenMissionModal?: () => void;
}

export const FinalStatement: React.FC<FinalStatementProps> = ({ progress, onOpenMissionModal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!containerRef.current || !line1Ref.current || !line2Ref.current) return;
    
    // Appear at the very end of the scroll
    const shouldShow = progress > 0.92;
    
    if (shouldShow) {
      gsap.to(containerRef.current, { opacity: 1, pointerEvents: 'auto', duration: 0.5 });
      gsap.to(line1Ref.current, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
      gsap.to(line2Ref.current, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
      gsap.to(btnRef.current, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.5 });
    } else {
      gsap.to(containerRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.5 });
      gsap.to(line1Ref.current, { opacity: 0, y: 20, duration: 0.5 });
      gsap.to(line2Ref.current, { opacity: 0, y: 20, duration: 0.5 });
      gsap.to(btnRef.current, { opacity: 0, y: 20, duration: 0.5 });
    }
  }, [progress]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center opacity-0 absolute inset-0 z-50 bg-[#02060B]/80 backdrop-blur-sm"
    >
      <div 
        ref={line1Ref}
        className="font-space-grotesk text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight uppercase opacity-0 translate-y-5"
      >
        DATA IS NOT THE DECISION.
      </div>
      <div 
        ref={line2Ref}
        className="font-space-grotesk text-4xl md:text-6xl lg:text-7xl font-bold text-raksha-accent tracking-tight uppercase mt-4 opacity-0 translate-y-5"
      >
        RAKSHA CONNECTS THE TWO.
      </div>
      
      <button 
        ref={btnRef}
        onClick={onOpenMissionModal}
        className="mt-16 px-10 py-4 border-2 border-raksha-accent bg-raksha-accent/10 hover:bg-raksha-accent hover:text-black font-space-grotesk font-bold text-xl md:text-2xl tracking-widest uppercase text-white transition-all duration-300 pointer-events-auto opacity-0 translate-y-5 cursor-pointer shadow-lg shadow-cyan-500/20"
      >
        EXPLORE NOW
      </button>
    </div>
  );
};
