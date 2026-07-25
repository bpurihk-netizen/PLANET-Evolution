import React from 'react';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { ALL_BODIES, SOLAR_SYSTEM } from '../data/celestialBodies';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplorerHUDProps {
  state: SolarSystemState;
}

// Minimap planet data (in orbital order)
const MINIMAP_BODIES = [
  { id: 'mercury',      label: '水', color: '#B5B5B5', size: 10 },
  { id: 'venus',        label: '金', color: '#E8C97E', size: 10 },
  { id: 'earth',        label: '地', color: '#2B6CB0', size: 10 },
  { id: 'mars',         label: '火', color: '#C1440E', size: 10 },
  { id: 'asteroid-belt',label: '帯', color: '#9E8A6E', size: 10 },
  { id: 'jupiter',      label: '木', color: '#C88B3A', size: 14 },
  { id: 'saturn',       label: '土', color: '#E8D5A3', size: 13 },
  { id: 'uranus',       label: '天', color: '#7DE8E8', size: 10 },
  { id: 'neptune',      label: '海', color: '#3F54BA', size: 10 },
  { id: 'pluto',        label: '冥', color: '#CCAA88', size: 10 },
];

export const ExplorerHUD: React.FC<ExplorerHUDProps> = ({ state }) => {
  const body = state.selectedBody;
  const visitedCount = state.visitedBodyIds.length;
  const totalCount = ALL_BODIES.filter(b => b.type !== 'ASTEROID_BELT').length;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 bg-gradient-to-b from-black/70 to-transparent">
          {/* Back button (detail mode) or title (overview) */}
          {state.viewMode === 'detail' ? (
            <button
              onClick={state.backToOverview}
              className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-white/10 active:bg-white/20 backdrop-blur-md border border-white/15 rounded-full text-white/80 text-sm font-medium transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
              太陽系マップ
            </button>
          ) : (
            <div className="flex items-center gap-2 min-h-[44px]">
              <span className="text-2xl">🔭</span>
              <span className="text-white/90 font-bold tracking-widest text-base">SOLAR EXPLORER</span>
            </div>
          )}

          {/* Current body name (detail mode) */}
          {body && state.viewMode === 'detail' && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px]">
              <span className="text-white/90 text-sm font-bold">{body.nameJa}</span>
              <span className="text-white/40 text-xs">{body.nameEn}</span>
            </div>
          )}

          {/* Exploration counter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px]">
            <span className="text-amber-400 text-sm font-mono font-bold">{visitedCount}/{totalCount}</span>
            <span className="text-white/50 text-xs">探索</span>
          </div>
        </div>
      </div>

      {/* ── Minimap (overview only) — clickable planet dots ── */}
      {state.viewMode === 'overview' && (
        <div className="absolute bottom-6 left-3 right-3 flex justify-center pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md border border-white/12 rounded-2xl px-3 py-2.5 flex flex-col gap-2">
            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase text-center">
              TAP TO EXPLORE
            </span>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {MINIMAP_BODIES.map(({ id, label, color, size }) => {
                const isVisited = state.visitedBodyIds.includes(id);
                const isSelected = state.selectedBodyId === id;
                return (
                  <button
                    key={id}
                    onClick={() => state.enterDetail(id)}
                    className="flex flex-col items-center gap-0.5 group"
                  >
                    <div
                      className={cn(
                        'rounded-full transition-all duration-200',
                        isSelected
                          ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-transparent scale-125'
                          : 'group-active:scale-110',
                        !isVisited && 'opacity-50'
                      )}
                      style={{
                        width: size,
                        height: size,
                        background: color,
                      }}
                    />
                    <span
                      className={cn(
                        'text-[9px] font-mono',
                        isSelected ? 'text-white' : 'text-white/40'
                      )}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── First-visit hint ── */}
      {state.viewMode === 'overview' && visitedCount === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-20 pointer-events-none">
          <div className="text-white/40 text-sm text-center animate-pulse whitespace-nowrap">
            天体をタップして詳細を見る
          </div>
        </div>
      )}
    </div>
  );
};
