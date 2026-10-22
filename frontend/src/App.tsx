import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroSection } from './components/hero/HeroSection';
import { WhySection } from './components/why/WhySection';
import { DataSection } from './components/ecosystem/DataSection';
import { RainBackground } from './components/hero/RainBackground';
import { MissionCommandModal } from './components/analysis/MissionCommandModal';
import { Radio } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  useEffect(() => {
    if (
      window.location.pathname === '/overview' ||
      window.location.pathname === '/dashboard' ||
      window.location.pathname === '/simulation' ||
      window.location.hash === '#overview'
    ) {
      setIsMissionModalOpen(true);
    }
  }, []);

  return (
    <div className="relative w-full min-h-screen font-sans">
      {/* Global Background Layer */}
      <div className="fixed inset-0 bg-black pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        {/* Drought Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: 'url(/assets/images/drought-bg.jpg)' }}
        />
        {/* Darkening overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Lightning Canvas */}
        <div className="absolute inset-0 mix-blend-screen">
          <RainBackground />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <HeroSection onOpenMissionModal={() => setIsMissionModalOpen(true)} />
        <WhySection />
        <DataSection onOpenMissionModal={() => setIsMissionModalOpen(true)} />
      </div>

      {/* Floating Tactical Launch HUD Trigger */}
      <button
        onClick={() => setIsMissionModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full bg-raksha-accent text-raksha-900 font-bold text-xs tracking-wider font-mono shadow-2xl hover:bg-raksha-accentLight transform hover:scale-105 transition-all cursor-pointer border border-cyan-300"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-raksha-900 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-raksha-900"></span>
        </span>
        <Radio className="w-4 h-4 text-raksha-900" />
        <span>ENTER RAKSHA COMMAND</span>
      </button>

      {/* Full-Featured Mission Command Center (Offline Synthetic Prototype) */}
      <MissionCommandModal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
      />
    </div>
  );
}

export default App;
