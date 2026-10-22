import React, { useRef, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DataLayout } from './DataLayout';

interface DataSectionProps {
  onOpenMissionModal?: () => void;
}

export const DataSection: React.FC<DataSectionProps> = ({ onOpenMissionModal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create a master ScrollTrigger for the entire 500vh section
    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[500vh] bg-transparent font-sans z-30"
      id="data-ecosystem"
    >
      <DataLayout progress={scrollProgress} onOpenMissionModal={onOpenMissionModal} />
    </section>
  );
};
