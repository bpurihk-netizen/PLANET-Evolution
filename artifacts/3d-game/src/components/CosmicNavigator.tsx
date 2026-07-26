/**
 * CosmicNavigator — 宇宙階層パンくずリストとナビゲーションボタン
 */
import React from 'react';
import { SolarSystemState, CosmicLevel } from '../hooks/useSolarSystem';
import { getCosmicBreadcrumb } from '../data/cosmicHierarchy';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  state: SolarSystemState;
}

const LEVEL_LABELS: Record<CosmicLevel, string> = {
  lss: '大規模構造',
  supercluster: '超銀河団',
  cluster: '銀河団',
  group: '銀河群',
  galaxy: '銀河',
  system: '星系',
};

export const CosmicNavigator: React.FC<Props> = ({ state }) => {
  const { cosmicLevel } = state;
  if (cosmicLevel === 'system') return null;

  const crumbs = getCosmicBreadcrumb(
    cosmicLevel,
    state.currentSuperclusterId,
    state.currentClusterId,
    state.currentGroupId,
    state.currentGalaxyId,
  );

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-auto">
      {/* ── 上部ナビバー ── */}
      <div className="flex items-center gap-0 px-3 pt-3 pb-2 bg-gradient-to-b from-black/80 to-transparent">

        {/* ← 上の階層へ ボタン */}
        <button
          onClick={state.drillUp}
          className="flex items-center gap-1 min-h-[44px] px-3 py-2 bg-white/10 active:bg-white/20 backdrop-blur-md border border-white/15 rounded-full text-white/80 text-xs font-medium transition-all active:scale-95 shrink-0 mr-2"
        >
          <ChevronLeft size={16} />
          <span className="hidden xs:inline">上の階層</span>
        </button>

        {/* パンくずリスト */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0 flex-1">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={crumb.level}>
                <button
                  onClick={() => {
                    if (!isLast) {
                      // 直接そのレベルにジャンプ（drillUp を複数回呼ぶ代わりに goToCosmicLevel を使用）
                      state.goToCosmicLevel(crumb.level);
                    }
                  }}
                  disabled={isLast}
                  className={[
                    'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all min-h-[32px]',
                    isLast
                      ? 'text-white/90 bg-white/10 border border-white/20 cursor-default'
                      : 'text-white/45 hover:text-white/70 active:bg-white/10 cursor-pointer',
                  ].join(' ')}
                >
                  <span>{crumb.label}</span>
                </button>
                {!isLast && (
                  <ChevronRight size={10} className="text-white/25 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* 現在のレベルタグ */}
        <div className="shrink-0 ml-2 px-2 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full">
          <span className="text-indigo-200 text-[9px] font-bold tracking-wider">
            {LEVEL_LABELS[cosmicLevel]}
          </span>
        </div>
      </div>

      {/* ── 階層説明バー ── */}
      <div className="mx-3 mb-1">
        <div className="bg-black/40 backdrop-blur-sm border border-white/8 rounded-xl px-3 py-1.5 flex items-center justify-between">
          <span className="text-white/40 text-[10px] font-mono">
            {cosmicLevel === 'lss' && '宇宙の大規模構造 — フィラメントとボイドの宇宙の網'}
            {cosmicLevel === 'supercluster' && '超銀河団の内部 — 数百〜数千の銀河団が集まる'}
            {cosmicLevel === 'cluster' && '銀河団の内部 — 数十〜数百の銀河群が集まる'}
            {cosmicLevel === 'group' && '銀河群の内部 — 数個〜数十個の銀河が集まる'}
            {cosmicLevel === 'galaxy' && '銀河の内部 — 数百〜数千億の恒星が渦を巻く'}
          </span>
        </div>
      </div>
    </div>
  );
};
