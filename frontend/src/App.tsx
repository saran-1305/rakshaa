import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroSection } from './components/hero/HeroSection';
import { WhySection } from './components/why/WhySection';
import { DataSection } from './components/ecosystem/DataSection';
import { RainBackground } from './components/hero/RainBackground';
import { MissionCommandPage } from './components/analysis/MissionCommandPage';
import { Radio } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/**
 * LandingPage component:
 * Preserves the full cinematic landing experience, Lenis smooth scrolling,
 * and passes navigation handlers to launch the full-screen Command Center.
 */
function LandingPage() {
  const navigate = useNavigate();

  const handleOpenCommand = () => {
    navigate('/command-center');
  };

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

    const rafHandler = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(rafHandler);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(rafHandler);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen font-sans bg-black">
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

      {/* Main Content Sections */}
      <div className="relative z-10">
        <HeroSection onOpenMissionModal={handleOpenCommand} />
        <WhySection />
        <DataSection onOpenMissionModal={handleOpenCommand} />
      </div>

      {/* Floating Tactical Launch HUD Trigger */}
      <button
        onClick={handleOpenCommand}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3 rounded-full bg-raksha-accent text-raksha-900 font-bold text-xs tracking-wider font-mono shadow-2xl hover:bg-raksha-accentLight transform hover:scale-105 transition-all cursor-pointer border border-cyan-300"
        aria-label="Open RAKSHA Command Center"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-raksha-900 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-raksha-900"></span>
        </span>
        <Radio className="w-4 h-4 text-raksha-900" />
        <span>ENTER RAKSHA COMMAND</span>
      </button>
    </div>
  );
}

/**
 * App:
 * Standalone SPA routing with dedicated `/command-center` full-screen page,
 * preserving legacy aliases (`/simulation`, `/overview`, `/dashboard`).
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cinematic Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Full-Screen Standalone Disaster Management Command Center & Global Discovery */}
        <Route path="/command-center" element={<MissionCommandPage />} />
        <Route path="/global" element={<MissionCommandPage />} />
        <Route path="/incidents/:incidentId" element={<MissionCommandPage />} />

        {/* Legacy / Compatibility Entry Routes */}
        <Route path="/simulation" element={<Navigate to="/command-center" replace />} />
        <Route path="/overview" element={<Navigate to="/command-center" replace />} />
        <Route path="/dashboard" element={<Navigate to="/command-center" replace />} />

        {/* Catch-all fallback to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
