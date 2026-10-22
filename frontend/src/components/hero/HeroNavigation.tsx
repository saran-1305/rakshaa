import React from 'react';
import { Menu, ArrowRight } from 'lucide-react';

interface HeroNavigationProps {
  onOpenMissionModal?: () => void;
}

export const HeroNavigation: React.FC<HeroNavigationProps> = ({ onOpenMissionModal }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-8 lg:px-12 py-4">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-6 py-3">
        
        {/* Left: Logo & Subtitle */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-widest text-white leading-none">RAKSHA</span>
            <span className="text-[10px] tracking-[0.2em] text-raksha-accent mt-1">GEOSPATIAL INTELLIGENCE</span>
          </div>
        </div>

        {/* Center: Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'About', 'Technology', 'Impact', 'Solution'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-raksha-textMuted hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right: CTA & Menu */}
        <div className="flex items-center gap-6">
          <button 
            onClick={onOpenMissionModal}
            className="hidden sm:flex items-center gap-2 text-sm font-semibold text-raksha-accent hover:text-raksha-accentLight transition-colors cursor-pointer"
          >
            ENTER RAKSHA
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onOpenMissionModal}
            className="text-white hover:text-raksha-accent transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

      </div>
    </nav>
  );
};
