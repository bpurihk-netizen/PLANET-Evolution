import React from 'react';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { StampRallyState } from '../hooks/useStampRally';
import { ALL_STAR_SYSTEMS } from '../data/starSystems';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplorerHUDProps {
  state: SolarSystemState;
  stampRally: StampRallyState;
  onOpenStampBook: () => void;
}

// System emoji icons
const SYSTEM_ICONS: Record<string, string> = {
  'solar-system':  '☀️',
  'trappist1':     '🔴',
  'alpha-centauri':'⭐',
  'kepler442':     '🟠',
};

export const ExplorerHUD: React.FC<ExplorerHUDProps> = ({ state, stampRally, onOpenStampBook }) => {
  const body         = state.selectedBody;
  const systemBodies = state.currentSystem.bodies;

  // Only count non-star, non-asteroid-belt bodies as "explorable" for the counter
  const explorable    = systemBodies.flatMap(b => b.children ? [b, ...b.children] : [b]);
  const totalCount    = explorable.filter(b => b.type !== 'ASTEROID_BELT').length;
  const visitedCount  = state.visitedBodyIds.length;

  // Minimap: main bodies of current system (excluding children which appear in detail)
  const minimapBodies = systemBodies.filter(b => b.type !== 'ASTEROID_BELT' || b.hasAsteroids);

  return (
    <div className="absolute inset-0 pointer-events-none z-20">

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent gap-2">
          {/* Back button (detail mode) or app title (overview) */}
          {state.viewMode === 'detail' ? (
            <button
              onClick={state.backToOverview}
              className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-white/10 active:bg-white/20 backdrop-blur-md border border-white/15 rounded-full text-white/80 text-sm font-medium transition-all active:scale-95 shrink-0"
            >
              <ChevronLeft size={18} />
              <span className="whitespace-nowrap">{state.currentSystem.nameJa}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 min-h-[44px] shrink-0">
              <span className="text-2xl">🔭</span>
              <span className="text-white/90 font-bold tracking-widest text-sm">SOLAR EXPLORER</span>
            </div>
          )}

          {/* Current body name (detail mode) */}
          {body && state.viewMode === 'detail' && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px] min-w-0">
              <span className="text-white/90 text-sm font-bold truncate">{body.nameJa.replace(' ★', '')}</span>
            </div>
          )}

          {/* Exploration counter */}
          <div className="flex items-center gap-1 px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px] shrink-0">
            <span className="text-amber-400 text-sm font-mono font-bold">{visitedCount}/{totalCount}</span>
            <span className="text-white/50 text-xs">探索</span>
          </div>
        </div>

        {/* ── System switcher + Globe button (always visible) ── */}
        <div className="pointer-events-auto px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {ALL_STAR_SYSTEMS.map(sys => {
              const isActive = state.currentSystemId === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => state.switchSystem(sys.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[36px]',
                    isActive
                      ? 'bg-amber-500/25 border-amber-400/60 text-amber-200'
                      : 'bg-white/5 border-white/15 text-white/50 active:bg-white/10'
                  )}
                >
                  <span>{SYSTEM_ICONS[sys.id]}</span>
                  <span>{sys.nameJa}</span>
                  {sys.distanceLy > 0 && (
                    <span className="text-white/30 font-normal">
                      {sys.distanceLy >= 1000
                        ? `${(sys.distanceLy / 1000).toFixed(1)}k`
                        : sys.distanceLy.toFixed(2)}
                      ly
                    </span>
                  )}
                </button>
              );
            })}
            {/* ── 天球儀ボタン ── */}
            <button
              onClick={state.enterGlobe}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[36px] bg-indigo-500/15 border-indigo-400/40 text-indigo-200 active:bg-indigo-500/30"
            >
              <span>🌐</span>
              <span>天球儀</span>
            </button>
            {/* ── 星座図鑑ボタン ── */}
            <button
              onClick={state.enterEncyclopedia}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[36px] bg-violet-500/15 border-violet-400/40 text-violet-200 active:bg-violet-500/30"
            >
              <span>📚</span>
              <span>図鑑</span>
            </button>
            {/* ── 今夜の星空ボタン ── */}
            <button
              onClick={state.enterNightSky}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[36px] bg-sky-500/15 border-sky-400/40 text-sky-200 active:bg-sky-500/30"
            >
              <span>🌙</span>
              <span>今夜</span>
            </button>
            {/* ── 星座神話ボタン ── */}
            <button
              onClick={state.enterStorybook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[36px] bg-rose-500/15 border-rose-400/40 text-rose-200 active:bg-rose-500/30"
            >
              <span>📖</span>
              <span>星座神話</span>
            </button>
            {/* ── スタンプ帳ボタン ── */}
            <button
              onClick={onOpenStampBook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[36px] bg-amber-500/15 border-amber-400/40 text-amber-200 active:bg-amber-500/30 relative"
            >
              <span>🎫</span>
              <span>スタンプ帳</span>
              {stampRally.earnedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {stampRally.earnedCount > 9 ? '9+' : stampRally.earnedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Minimap — clickable body dots (overview only) ── */}
      {state.viewMode === 'overview' && (
        <div className="absolute bottom-6 left-3 right-3 flex justify-center pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md border border-white/12 rounded-2xl px-3 py-2.5 flex flex-col gap-2 max-w-full">
            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase text-center">
              TAP TO EXPLORE · {state.currentSystem.nameJa}
            </span>
            <div className="flex items-end justify-center gap-2 flex-wrap">
              {minimapBodies.map(b => {
                const isVisited  = state.visitedBodyIds.includes(b.id);
                const isSelected = state.selectedBodyId === b.id;
                const sz = b.type === 'STAR' ? 18 : b.displayRadius > 0.5 ? 15 : 10;
                const isHabitable = b.nameJa.includes('★');
                return (
                  <button
                    key={b.id}
                    onClick={() => state.enterDetail(b.id)}
                    className="flex flex-col items-center gap-0.5 group"
                  >
                    <div
                      className={cn(
                        'rounded-full transition-all duration-200 relative',
                        isSelected
                          ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-transparent scale-125'
                          : 'group-active:scale-110',
                        !isVisited && 'opacity-40'
                      )}
                      style={{
                        width: sz, height: sz, background: b.colorMain,
                        boxShadow: b.type === 'STAR' ? `0 0 ${sz}px ${b.colorMain}60` : undefined,
                      }}
                    >
                      {isHabitable && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-black/30" />
                      )}
                    </div>
                    <span className={cn(
                      'text-[9px] font-mono max-w-[28px] truncate text-center',
                      isSelected ? 'text-white' : 'text-white/40'
                    )}>
                      {b.nameJa.replace(' ★', '').replace('TRAPPIST-1 ', '').replace('ケプラー', 'K-').replace('ケンタウリ', '')}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Habitable zone legend */}
            {state.currentSystem.id !== 'solar-system' && (
              <div className="flex items-center gap-1.5 justify-center mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[9px] text-green-400/70 font-mono">ハビタブルゾーン</span>
              </div>
            )}
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
