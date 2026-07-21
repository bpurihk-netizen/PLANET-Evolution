import React, { useState } from 'react';
import { GameState, getPhaseInfo, CYCLE_DURATION } from '../hooks/useGameState';
import { ParameterPanel } from './ParameterPanel';
import { Pause, Play, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANET_TYPE_JA, SPECIES_JA } from '../hooks/usePlanetParams';

export const HUD: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const p = gameState.planets[gameState.activeIndex];
  const phaseInfo = getPhaseInfo(p.time);
  const ageBillionYears = p.time * 0.1; // 1s = 0.1B years
  const timeRemaining = Math.max(0, phaseInfo.end - p.time);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // LIFE phase: 320 - 500
  let lifeProgress = 0;
  if (p.time >= 320 && p.time < 500) lifeProgress = ((p.time - 320) / 180) * 100;
  else if (p.time >= 500 && p.time < 820) lifeProgress = 100;
  else if (p.time >= 820 && p.time < 900) lifeProgress = 100 - ((p.time - 820) / 80) * 100;

  // CIV phase: 500 - 680
  let civProgress = 0;
  if (p.time >= 500 && p.time < 680) civProgress = ((p.time - 500) / 180) * 100;
  else if (p.time >= 680 && p.time < 820) civProgress = 100 - ((p.time - 680) / 140) * 100;

  const isCrisis = p.time >= 680 && p.time < 820;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      {isCrisis && gameState.zoomLevel === 1 && (
        <div className="absolute inset-0 z-0 pointer-events-none shadow-[inset_0_0_100px_rgba(255,0,0,0.3)] animate-pulse mix-blend-screen bg-red-500/10" />
      )}
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-xl font-bold tracking-widest text-white/90">惑星育成ゲーム</h1>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-md border border-white/20 text-white/80 active:bg-white/20 transition-colors"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Center Phase Info (Just below planets) */}
      <div className="absolute top-[45%] left-0 right-0 flex flex-col items-center pointer-events-none drop-shadow-md">
        <h2 
          key={phaseInfo.name}
          className="text-3xl font-light tracking-[0.2em] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in-95 duration-1000"
        >
          {phaseInfo.name}
        </h2>
        <div className="text-white/60 font-mono mt-1 text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          次のイベントまで: {timeRemaining.toFixed(0)}s
        </div>
      </div>

      {/* Bottom Area */}
      <div className="flex flex-col gap-3 p-4 pb-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-auto">
        
        {/* Stats Row */}
        <div className="flex justify-between items-end mb-2">
          <div className="flex flex-col">
            <span className="text-white/50 text-xs font-mono">惑星年齢</span>
            <span className="text-2xl font-light tracking-widest text-white/90">{ageBillionYears.toFixed(1)} <span className="text-sm">億年</span></span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">居住適性</span>
              <span className={p.stats.habitability > 60 ? "text-green-400 font-mono text-base" : "text-amber-400 font-mono text-base"}>{p.stats.habitability.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">生命確率</span>
              <span className="text-white/90 font-mono text-base">{p.stats.lifeProb.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">大気安定性</span>
              <span className="text-white/90 font-mono text-base">{p.stats.atmStability.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">重力</span>
              <span className="text-white/90 font-mono text-base">{p.stats.gravity.toFixed(2)}G</span>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-20 font-mono text-white/60 tracking-wider">生命バイオマス</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${lifeProgress}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-20 font-mono text-white/60 tracking-wider">文明の発展</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <div className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${civProgress}%` }} />
            </div>
          </div>
          {p.params.species !== 'None' && civProgress > 10 && (
            <div className="text-[10px] text-amber-200 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 inline-block">
              支配種族: {SPECIES_JA[p.params.species]}
            </div>
          )}
        </div>

        {/* Controls: Zoom & Speed */}
        <div className="flex gap-2">
          {/* Zoom Buttons */}
          <div className="flex flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1">
            {[0, 1, 2].map(z => (
              <button 
                key={z} 
                onClick={() => gameState.setZoomLevel(z as any)}
                className={cn(
                  "flex-1 h-12 flex items-center justify-center rounded-xl transition-colors text-sm font-bold", 
                  gameState.zoomLevel === z ? "bg-white/20 text-white shadow-inner" : "text-white/50 active:bg-white/10"
                )}
              >
                {z === 0 ? '宇宙' : z === 1 ? '地表' : '内部'}
              </button>
            ))}
          </div>

          {/* Speed Buttons */}
          <div className="flex flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1">
             <button 
                onClick={() => gameState.togglePause(gameState.activeIndex)} 
                className={cn("w-12 h-12 flex items-center justify-center rounded-xl transition-colors", p.isPaused ? "bg-amber-500/20 text-amber-200" : "text-white/50 active:bg-white/10")}
             >
               {p.isPaused ? <Play size={20} /> : <Pause size={20} />}
             </button>
             <div className="w-px h-8 bg-white/10 mx-1 self-center" />
             <div className="flex-1 flex overflow-x-auto custom-scrollbar snap-x">
               {[0.5, 1, 3, 10].map(s => (
                 <button 
                   key={s} 
                   onClick={() => gameState.setGlobalSpeed(s)}
                   className={cn("min-w-[48px] h-12 flex items-center justify-center rounded-xl text-xs font-mono transition-colors snap-center shrink-0", gameState.globalSpeed === s ? "bg-white/20 text-white shadow-inner" : "text-white/50 active:bg-white/10")}
                 >
                   x{s}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Settings Bottom Sheet */}
      <div className={cn(
        "fixed inset-0 z-50 pointer-events-auto bg-black/60 backdrop-blur-sm transition-opacity duration-300",
        isSettingsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsSettingsOpen(false)}>
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-[#0a0a0f] border-t border-white/10 rounded-t-3xl p-6 transition-transform duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar",
            isSettingsOpen ? "translate-y-0" : "translate-y-full"
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white/90">設定</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-white/10 rounded-full text-white/70 active:bg-white/20">
              <X size={24} />
            </button>
          </div>
          <ParameterPanel gameState={gameState} />
        </div>
      </div>
    </div>
  );
};
