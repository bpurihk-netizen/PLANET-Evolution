import React from 'react';
import { GameState, CYCLE_DURATION } from '../hooks/useGameState';
import { getTypeColor } from '../hooks/usePlanetParams';
import { cn } from '@/lib/utils';

export const PlanetCards: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  return (
    <div className="flex gap-4 pointer-events-auto">
      {gameState.planets.map((p, i) => {
        const isActive = gameState.activeIndex === i;
        const color = getTypeColor(p.type);
        const age = ((p.time / CYCLE_DURATION) * 14.2).toFixed(2);
        
        return (
          <div 
            key={p.id}
            onClick={() => gameState.setActiveIndex(i)}
            className={cn(
              "w-48 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 cursor-pointer transition-all shadow-xl",
              isActive ? "ring-2 ring-white/80 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)]" : "hover:bg-white/5 hover:border-white/30"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500" 
                style={{ backgroundColor: color, color }} 
              />
              <div className="font-bold text-sm truncate text-white/90">{p.name}</div>
            </div>
            <div className="text-[10px] text-white/60 font-mono mb-1 uppercase tracking-wider">{p.type}</div>
            <div className="flex justify-between text-[10px] text-white/40 font-mono">
              <span>AGE: {age}B</span>
              <span>HAB: {p.stats.habitability.toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
