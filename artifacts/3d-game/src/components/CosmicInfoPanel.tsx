/**
 * CosmicInfoPanel — 銀河・銀河群・銀河団・超銀河団の情報パネル
 *
 * ★ロジックの注意★
 * 各cosmicLevelで「タップされる」のは一段階下のレベルのオブジェクト:
 *   lss          → タップ = 超銀河団(LSSFeature)
 *   supercluster → タップ = 銀河団(GalaxyCluster)
 *   cluster      → タップ = 銀河群(GalaxyGroup)
 *   group        → タップ = 銀河(CosmicGalaxy)
 *   galaxy       → GalaxyView内で直接switchSystemするのでここには来ない
 */
import React, { useCallback, useEffect } from 'react';
import { SolarSystemState, CosmicLevel } from '../hooks/useSolarSystem';
import {
  ALL_LSS_FEATURES, ALL_SUPERCLUSTERS, ALL_GALAXY_CLUSTERS,
  ALL_GALAXY_GROUPS, ALL_COSMIC_GALAXIES,
} from '../data/cosmicHierarchy';
import { X, ChevronDown, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  state: SolarSystemState;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface CosmicInfo {
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  distanceStr: string;
  sizeStr: string;
  countStr?: string;
  facts?: string[];
  targetLevel: CosmicLevel;
  targetId: string;
  isDrillable: boolean;
  isHome: boolean;
}

function fmtDist(mly: number): string {
  if (mly === 0) return '私たちの場所';
  if (mly < 0.01) return `${(mly * 1_000_000).toFixed(0)} 光年`;
  if (mly < 1)    return `${(mly * 1000).toFixed(0)} 千光年`;
  if (mly < 1000) return `${mly.toLocaleString()} 百万光年`;
  return `${(mly / 1000).toFixed(1)} 十億光年`;
}

function getInfo(level: CosmicLevel, id: string): CosmicInfo | null {
  switch (level) {
    // ── lss レベル: タップされたのは LSSFeature (超銀河団・ボイドなど)
    case 'lss': {
      const f = ALL_LSS_FEATURES.find(x => x.id === id);
      if (!f) return null;
      const sc = ALL_SUPERCLUSTERS.find(x => x.id === id);
      return {
        nameJa: sc?.nameJa ?? f.nameJa,
        nameEn: sc?.nameEn ?? f.nameEn,
        descriptionJa: sc?.descriptionJa ?? f.descriptionJa,
        distanceStr: fmtDist(f.distanceMLy),
        sizeStr: `約 ${f.sizeMLy.toLocaleString()} 百万光年`,
        countStr: sc?.galaxyCount ? `銀河 ${sc.galaxyCount}` : undefined,
        targetLevel: 'supercluster',
        targetId: f.superclusterId ?? id,
        isDrillable: f.type === 'supercluster' && !!f.superclusterId,
        isHome: !!f.isHome,
        facts: [],
      };
    }

    // ── supercluster レベル: CosmicLevelView が表示したのは銀河団 (GalaxyCluster)
    case 'supercluster': {
      const c = ALL_GALAXY_CLUSTERS.find(x => x.id === id);
      if (!c) return null;
      return {
        nameJa: c.nameJa,
        nameEn: c.nameEn,
        descriptionJa: c.descriptionJa,
        distanceStr: fmtDist(c.distanceMLy),
        sizeStr: `約 ${c.diameterMLy.toLocaleString()} 百万光年`,
        countStr: `銀河 ${c.galaxyCount.toLocaleString()} 個`,
        targetLevel: 'cluster',
        targetId: c.id,                        // 同じIDで次レベルへ
        isDrillable: c.groupIds.length > 0,
        isHome: !!c.isHome,
        facts: [],
      };
    }

    // ── cluster レベル: CosmicLevelView が表示したのは銀河群 (GalaxyGroup)
    case 'cluster': {
      const g = ALL_GALAXY_GROUPS.find(x => x.id === id);
      if (!g) return null;
      return {
        nameJa: g.nameJa,
        nameEn: g.nameEn,
        descriptionJa: g.descriptionJa,
        distanceStr: fmtDist(g.distanceMLy),
        sizeStr: `約 ${g.diameterMLy.toLocaleString()} 百万光年`,
        countStr: `銀河 約 ${g.galaxyCount} 個`,
        targetLevel: 'group',
        targetId: g.id,                        // 同じIDで次レベルへ
        isDrillable: g.galaxyIds.length > 0,
        isHome: !!g.isHome,
        facts: [],
      };
    }

    // ── group レベル: CosmicLevelView が表示したのは銀河 (CosmicGalaxy)
    case 'group': {
      const gx = ALL_COSMIC_GALAXIES.find(x => x.id === id);
      if (!gx) return null;
      return {
        nameJa: gx.nameJa,
        nameEn: gx.nameEn,
        descriptionJa: gx.descriptionJa,
        distanceStr: fmtDist(gx.distanceMLy),
        sizeStr: `直径 ${gx.diameterKly.toLocaleString()} 千光年`,
        countStr: `恒星 ${gx.starCount}`,
        targetLevel: 'galaxy',
        targetId: gx.id,                       // 同じIDで次レベルへ
        isDrillable: true,                     // 全銀河をGalaxyViewで閲覧可能
        isHome: !!gx.isHome,
        facts: gx.facts ?? [],
      };
    }

    // ── galaxy レベル: GalaxyViewが直接switchSystemするためここには来ない
    default:
      return null;
  }
}

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-baseline py-1.5 border-b border-white/5 last:border-0">
    <span className="text-white/50 text-xs font-mono">{label}</span>
    <span className="text-white/90 text-xs font-mono text-right ml-2">{value}</span>
  </div>
);

export const CosmicInfoPanel: React.FC<Props> = ({ state, collapsed = false, onToggleCollapse }) => {
  const { selectedCosmicId, cosmicLevel } = state;

  useEffect(() => {
    // no-op; collapse state handled by parent
  }, [selectedCosmicId]);

  const info = selectedCosmicId ? getInfo(cosmicLevel, selectedCosmicId) : null;
  const isVisible = !!selectedCosmicId && !!info;

  const translateClass = !isVisible
    ? 'translate-y-full'
    : collapsed
      ? 'translate-y-[calc(100%-52px)]'
      : 'translate-y-0';

  const drillLabel = !info ? '' :
    info.targetLevel === 'supercluster' ? 'この超銀河団をワープして探索' :
    info.targetLevel === 'cluster'      ? 'この銀河団をワープして探索' :
    info.targetLevel === 'group'        ? 'この銀河群をワープして探索' :
    info.targetLevel === 'galaxy'       ? 'この銀河を探索する' : '';

  const handleDrillDown = useCallback(() => {
    if (!info) return;
    state.drillDown(info.targetLevel, info.targetId);
  }, [info, state]);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out',
        translateClass,
      )}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* Pull handle */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex flex-col items-center pt-2 pb-1 justify-center gap-1 active:opacity-70 transition-opacity"
        style={{ minHeight: 52 }}
      >
        <div className="w-10 h-1 rounded-full bg-white/25" />
        <ChevronDown
          size={14}
          className={cn('text-white/35 transition-transform duration-300', collapsed ? 'rotate-180' : '')}
        />
      </button>

      <div
        className="bg-[#07091a]/96 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: '62dvh', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {info && (
          <>
            {/* ── Header ── */}
            <div className="sticky top-0 bg-[#07091a]/96 backdrop-blur-xl z-10 px-5 pt-4 pb-3 border-b border-white/8">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-2xl" aria-hidden>
                      {cosmicLevel === 'lss'          && '🌌'}
                      {cosmicLevel === 'supercluster' && '✨'}
                      {cosmicLevel === 'cluster'      && '🔵'}
                      {cosmicLevel === 'group'        && '🌀'}
                      {cosmicLevel === 'galaxy'       && '⭐'}
                    </span>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      {info.nameJa.split('（')[0]}
                    </h2>
                    {info.isHome && (
                      <span className="px-2 py-0.5 bg-amber-900/60 border border-amber-500/50 rounded-full text-amber-300 text-[10px] font-bold whitespace-nowrap">
                        🏠 私たちの場所
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-[11px] font-mono ml-9 truncate">{info.nameEn}</p>
                </div>
                <button
                  onClick={() => state.selectCosmicObject(null)}
                  className="mt-0.5 p-2.5 rounded-full bg-white/8 active:bg-white/20 text-white/60 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-5 pt-4 pb-6 space-y-4">
              {/* Description */}
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4">
                <p className="text-white/75 text-sm leading-relaxed">{info.descriptionJa}</p>
              </div>

              {/* Stats */}
              <div className="bg-white/4 rounded-2xl px-4 py-1.5 border border-white/8">
                <StatRow label="距離" value={info.distanceStr} />
                <StatRow label="サイズ" value={info.sizeStr} />
                {info.countStr && <StatRow label="構成" value={info.countStr} />}
              </div>

              {/* Facts */}
              {info.facts && info.facts.length > 0 && (
                <div>
                  <p className="text-amber-400/70 text-[10px] font-bold tracking-widest uppercase mb-2">豆知識</p>
                  <div className="space-y-2">
                    {info.facts.map((fact, i) => (
                      <div key={i} className="flex gap-3 bg-white/3 rounded-xl p-3 border border-white/6">
                        <span className="text-amber-400 font-bold text-sm mt-0.5 flex-shrink-0">{i + 1}</span>
                        <p className="text-white/70 text-sm leading-relaxed">{fact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drill-down button */}
              {info.isDrillable && drillLabel && (
                <button
                  onClick={handleDrillDown}
                  className="w-full py-4 bg-indigo-900/50 active:bg-indigo-800/70 border border-indigo-500/50 rounded-2xl text-indigo-200 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <Rocket size={16} />
                  {drillLabel}
                </button>
              )}

              {!info.isDrillable && (
                <p className="text-white/25 text-xs text-center">
                  探索データが現在準備されていません
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
