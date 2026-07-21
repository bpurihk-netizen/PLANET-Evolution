import React from 'react';
import { GameState } from '../hooks/useGameState';
import { Play, FastForward, Gauge, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HUDProps {
  gameState: GameState;
}

const PHASE_DESCRIPTIONS = {
  SUPERNOVA: { icon: '💥', label: 'SUPERNOVA', desc: 'A star dies, seeding the cosmos.' },
  FORMATION: { icon: '🌋', label: 'FORMATION', desc: 'Dust and gas coalesce into a molten core.' },
  COOLING: { icon: '🌑', label: 'COOLING', desc: 'The surface hardens. Steam fills the atmosphere.' },
  WATER: { icon: '🌊', label: 'WATER', desc: 'Oceans form. The crucible of potential.' },
  LIFE: { icon: '🌿', label: 'LIFE', desc: 'The great greening begins.' },
  CIVILIZATION: { icon: '🏙️', label: 'CIVILIZATION', desc: 'Intelligence emerges and shapes the world.' },
  CRISIS: { icon: '🔥', label: 'CRISIS', desc: 'Systems destabilize under pressure.' },
  COLLAPSE: { icon: '☠️', label: 'COLLAPSE', desc: 'The fading of the light.' },
};

const PHASE_TITLES = {
  SUPERNOVA: 'THE END AND THE BEGINNING',
  FORMATION: 'THE BIRTH OF A WORLD',
  COOLING: 'THE GREAT CHILL',
  WATER: 'THE PRIMORDIAL SEAS',
  LIFE: 'THE BLOOMING AGE',
  CIVILIZATION: 'THE AGE OF LIGHT',
  CRISIS: 'THE GREAT UNRAVELING',
  COLLAPSE: 'THE SILENCE',
};

export const HUD: React.FC<HUDProps> = ({ gameState }) => {
  const {
    phase,
    timeToNext,
    ageBillionYears,
    lifeProgress,
    civProgress,
    speedMultiplier,
    setSpeedMultiplier,
  } = gameState;

  const phaseInfo = PHASE_DESCRIPTIONS[phase];
  const phaseTitle = PHASE_TITLES[phase];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden font-mono text-white selection:bg-white/20">
      
      {/* Top Center: Phase Title */}
      <div className="mt-12 w-full text-center flex flex-col items-center">
        <h1 
          className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-in fade-in duration-1000"
          key={phaseTitle}
        >
          {phaseTitle}
        </h1>
      </div>

      {/* Bottom Controls & Info Panel */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-end gap-6 w-full max-w-7xl mx-auto">
        
        {/* Left Panel */}
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-5 min-w-[320px] flex flex-col gap-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3 text-xl">
              <span>{phaseInfo.icon}</span>
              <span className="font-semibold tracking-wider text-white/90">{phaseInfo.label}</span>
            </div>
            <div className="text-right text-xs text-white/50">
              NEXT EVENT IN<br />
              <span className="text-lg font-medium text-white/90">{timeToNext.toFixed(1)}s</span>
            </div>
          </div>
          
          <div className="text-sm text-white/70 italic">
            {phaseInfo.desc}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-white/50 uppercase tracking-wider">Age</span>
              <span className="text-lg text-white/90">{ageBillionYears.toFixed(2)} BYrs</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-400">LIFE BIOMASS</span>
                <span className="text-white/70">{lifeProgress.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-300"
                  style={{ width: `${lifeProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-amber-400">CIVILIZATION</span>
                <span className="text-white/70">{civProgress.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-300"
                  style={{ width: `${civProgress}%` }}
                />
              </div>
            </div>
          </div>

          {phase === 'CRISIS' && (
            <div className="mt-2 p-3 bg-red-500/20 border border-red-500/50 rounded flex items-center gap-3 animate-pulse">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <div className="text-xs text-red-200 font-bold tracking-wider">
                CRITICAL DESTABILIZATION DETECTED
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Time Controls */}
        <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1.5">
          <button
            onClick={() => setSpeedMultiplier(1)}
            className={cn(
              "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors",
              speedMultiplier === 1 ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            <Play size={16} /> 1x
          </button>
          <button
            onClick={() => setSpeedMultiplier(5)}
            className={cn(
              "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors",
              speedMultiplier === 5 ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            <FastForward size={16} /> 5x
          </button>
          <button
            onClick={() => setSpeedMultiplier(10)}
            className={cn(
              "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors",
              speedMultiplier === 10 ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            <Gauge size={16} /> 10x
          </button>
        </div>
      </div>
    </div>
  );
};
