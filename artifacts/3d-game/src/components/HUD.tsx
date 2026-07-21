import React from 'react';
import { GameState, getPhaseInfo, CYCLE_DURATION } from '../hooks/useGameState';
import { ParameterPanel } from './ParameterPanel';
import { PlanetCards } from './PlanetCards';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export const HUD: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const p = gameState.planets[gameState.activeIndex];
  const phaseInfo = getPhaseInfo(p.time);
  const ageBillionYears = (p.time / CYCLE_DURATION) * 14.2;
  
  let lifeProgress = 0;
  if (p.time >= 50 && p.time < 70) lifeProgress = ((p.time - 50) / 20) * 100;
  else if (p.time >= 70 && p.time < 90) lifeProgress = 100;
  else if (p.time >= 90 && p.time < 100) lifeProgress = 100 - ((p.time - 90) / 10) * 100;

  let civProgress = 0;
  if (p.time >= 70 && p.time < 90) civProgress = ((p.time - 70) / 20) * 100;
  else if (p.time >= 90 && p.time < 100) civProgress = 100 - ((p.time - 90) / 10) * 100;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
      <div className="flex justify-between items-start">
        <ParameterPanel gameState={gameState} />

        <div className="flex-1 flex flex-col items-center mt-6">
          <h1 
            key={phaseInfo.name}
            className="text-3xl md:text-5xl font-light tracking-[0.2em] uppercase text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-in fade-in zoom-in-95 duration-1000"
          >
            {phaseInfo.name}
          </h1>
          <p className="text-white/50 font-mono mt-2 tracking-widest text-sm">
            CYCLE {p.time.toFixed(1)} / {CYCLE_DURATION}
          </p>
        </div>

        <div className="flex flex-col gap-4 pointer-events-auto">
          <div className="flex gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-2xl">
             {[0, 1, 2].map(z => (
               <button 
                 key={z} 
                 onClick={() => gameState.setZoomLevel(z as any)}
                 className={cn("p-2.5 rounded-lg transition-colors text-lg", gameState.zoomLevel === z ? "bg-white/20 text-white shadow-inner" : "text-white/50 hover:bg-white/10")}
                 title={z === 0 ? "Space View" : z === 1 ? "Surface View" : "Interior View"}
               >
                 {z === 0 ? '🌌' : z === 1 ? '🌍' : '🔬'}
               </button>
             ))}
          </div>

          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-2xl">
             <button 
                onClick={() => gameState.togglePause(gameState.activeIndex)} 
                className={cn("p-2 rounded-lg transition-colors", p.isPaused ? "bg-amber-500/20 text-amber-200" : "text-white/50 hover:bg-white/10")}
             >
               {p.isPaused ? <Play size={18} /> : <Pause size={18} />}
             </button>
             <div className="w-px h-6 bg-white/10 mx-1" />
             {[0.5, 1, 5, 10].map(s => (
               <button 
                 key={s} 
                 onClick={() => gameState.setGlobalSpeed(s)}
                 className={cn("px-3 py-2 rounded-lg text-xs font-mono transition-colors", gameState.globalSpeed === s ? "bg-white/20 text-white shadow-inner" : "text-white/50 hover:bg-white/10")}
               >
                 {s}x
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <PlanetCards gameState={gameState} />

        <div className="w-72 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-5 pointer-events-auto shadow-2xl">
          <div className="text-xl text-white/90 mb-4 tracking-widest font-light">{ageBillionYears.toFixed(2)} BYrs</div>
          
          <div className="space-y-3 font-mono text-xs">
             <div className="flex justify-between">
               <span className="text-white/50">Habitability</span>
               <span className={p.stats.habitability > 60 ? "text-green-400" : "text-amber-400"}>{p.stats.habitability.toFixed(0)}%</span>
             </div>
             <div className="flex justify-between">
               <span className="text-white/50">Life Prob</span>
               <span className="text-white/90">{p.stats.lifeProb.toFixed(0)}%</span>
             </div>
             <div className="flex justify-between">
               <span className="text-white/50">Atmosphere</span>
               <span className="text-white/90">{p.stats.atmStability.toFixed(0)}%</span>
             </div>
             <div className="flex justify-between">
               <span className="text-white/50">Gravity</span>
               <span className="text-white/90">{p.stats.gravity.toFixed(2)}G</span>
             </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 space-y-4">
             <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-white/60 tracking-wider">
                  <span>LIFE BIOMASS</span><span>{lifeProgress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${lifeProgress}%` }} />
                </div>
             </div>
             <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-white/60 tracking-wider">
                  <span>CIVILIZATION</span><span>{civProgress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${civProgress}%` }} />
                </div>
             </div>
             
             {p.params.species !== 'None' && civProgress > 10 && (
                <div className="mt-3 text-xs text-amber-200 font-mono bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  Dominant: {p.params.species}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
