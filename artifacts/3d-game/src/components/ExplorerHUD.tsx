import React from 'react';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { ALL_BODIES } from '../data/celestialBodies';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplorerHUDProps {
  state: SolarSystemState;
}

export const ExplorerHUD: React.FC<ExplorerHUDProps> = ({ state }) => {
  const body = state.selectedBody;
  const visitedCount = state.visitedBodyIds.length;
  const totalCount = ALL_BODIES.filter(b => b.type !== 'ASTEROID_BELT').length;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/70 to-transparent">
          {/* Back button (detail mode only) */}
          {state.viewMode === 'detail' ? (
            <button
              onClick={state.backToOverview}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/18 backdrop-blur-md border border-white/15 rounded-full text-white/80 text-sm font-medium transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
              太陽系マップ
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl">🔭</span>
              <span className="text-white/90 font-bold tracking-widest text-base">SOLAR EXPLORER</span>
            </div>
          )}

          {/* Breadcrumb / current body */}
          {body && state.viewMode === 'detail' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 backdrop-blur-md border border-white/12 rounded-full">
              <span className="text-white/90 text-sm font-bold">{body.nameJa}</span>
              <span className="text-white/40 text-xs">{body.nameEn}</span>
            </div>
          )}

          {/* Exploration counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 backdrop-blur-md border border-white/12 rounded-full">
            <span className="text-amber-400 text-xs font-mono font-bold">
              {visitedCount}/{totalCount}
            </span>
            <span className="text-white/50 text-xs">探索</span>
          </div>
        </div>
      </div>

      {/* Mini-map / orbit position indicator (overview mode) */}
      {state.viewMode === 'overview' && (
        <div className="absolute bottom-6 left-4 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/12 rounded-xl p-2 flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase px-1">太陽系</span>
            <div className="flex items-center gap-1.5 px-1">
              {['水', '金', '地', '火', '帯', '木', '土', '天', '海', '冥'].map((label, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all',
                    'text-[7px] text-white/70'
                  )}
                  style={{
                    background: i === 0 ? '#B5B5B5' :
                      i === 1 ? '#E8C97E' :
                      i === 2 ? '#2B6CB0' :
                      i === 3 ? '#C1440E' :
                      i === 4 ? '#9E8A6E' :
                      i === 5 ? '#C88B3A' :
                      i === 6 ? '#E8D5A3' :
                      i === 7 ? '#7DE8E8' :
                      i === 8 ? '#3F54BA' : '#CCAA88',
                    opacity: 0.8,
                    width: i === 5 ? 14 : i === 6 ? 13 : 10,
                    height: i === 5 ? 14 : i === 6 ? 13 : 10,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hint text (first visit, overview) */}
      {state.viewMode === 'overview' && visitedCount === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none mt-32">
          <div className="text-white/40 text-sm text-center animate-pulse">
            天体をタップして詳細を見る
          </div>
        </div>
      )}

      {/* Detail view: orbit data strip */}
      {state.viewMode === 'detail' && body && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="h-[48vh]" /> {/* Space for InfoPanel */}
        </div>
      )}
    </div>
  );
};
