/**
 * CosmicInfoPanel — 宇宙階層オブジェクトの詳細情報パネル（大幅強化版）
 *
 * ロジックの注意:
 *   lss          → タップ = LSSFeature / 超銀河団
 *   supercluster → タップ = GalaxyCluster（銀河団）
 *   cluster      → タップ = GalaxyGroup（銀河群）
 *   group        → タップ = CosmicGalaxy（銀河）
 *   galaxy       → GalaxyView内で直接drillDown
 */
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { SolarSystemState, CosmicLevel } from '../hooks/useSolarSystem';
import {
  ALL_LSS_FEATURES, ALL_SUPERCLUSTERS, ALL_GALAXY_CLUSTERS,
  ALL_GALAXY_GROUPS, ALL_COSMIC_GALAXIES,
} from '../data/cosmicHierarchy';
import { fetchNasaImage, NasaImage, NASA_OBJECT_QUERIES } from '../utils/nasaApi';
import { X, ChevronDown, ChevronUp, Rocket, Star, Layers, Info, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── 型 ────────────────────────────────────────────────────────────────────────
interface Props {
  state: SolarSystemState;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface CosmicInfo {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  distanceStr: string;
  sizeStr: string;
  countStr?: string;
  typeLabel?: string;
  massStr?: string;
  facts: string[];
  targetLevel: CosmicLevel;
  targetId: string;
  isDrillable: boolean;
  isHome: boolean;
  nasaQueries: string[]; // 複数クエリ → 複数画像
}

// ── ヘルパー ──────────────────────────────────────────────────────────────────
function fmtDist(mly: number): string {
  if (mly === 0) return '私たちの場所';
  if (mly < 0.001) return `${(mly * 1_000_000).toFixed(0)} 光年`;
  if (mly < 0.01)  return `${(mly * 1_000_000).toFixed(0)} 光年`;
  if (mly < 1)     return `${(mly * 1000).toFixed(0)} 千光年`;
  if (mly < 1000)  return `${mly.toLocaleString()} 百万光年`;
  return `${(mly / 1000).toFixed(1)} 十億光年`;
}

const GALAXY_TYPE_LABELS: Record<string, string> = {
  'spiral':       '渦巻銀河',
  'barred-spiral':'棒渦巻銀河',
  'elliptical':   '楕円銀河',
  'lenticular':   'レンズ状銀河',
  'irregular':    '不規則銀河',
  'dwarf':        '矮小銀河',
};

function buildNasaQueries(id: string, nameEn: string, extraQuery?: string): string[] {
  const primary = NASA_OBJECT_QUERIES[id] ?? nameEn;
  const queries: string[] = [primary];
  if (extraQuery && extraQuery !== primary) queries.push(extraQuery);
  return queries.slice(0, 3);
}

function getInfo(level: CosmicLevel, id: string): CosmicInfo | null {
  switch (level) {
    case 'lss': {
      const f = ALL_LSS_FEATURES.find(x => x.id === id);
      if (!f) return null;
      const sc = ALL_SUPERCLUSTERS.find(x => x.id === id);
      return {
        id,
        nameJa: sc?.nameJa ?? f.nameJa,
        nameEn: sc?.nameEn ?? f.nameEn,
        descriptionJa: sc?.descriptionJa ?? f.descriptionJa,
        distanceStr: fmtDist(f.distanceMLy),
        sizeStr: `約 ${f.sizeMLy.toLocaleString()} 百万光年`,
        countStr: sc?.galaxyCount ? `銀河 ${sc.galaxyCount}` : undefined,
        massStr: sc?.massStr,
        typeLabel: { supercluster: '超銀河団', void: 'コズミックボイド', filament: 'フィラメント', wall: '宇宙の壁', node: '交差点' }[f.type],
        facts: [],
        targetLevel: 'supercluster',
        targetId: f.superclusterId ?? id,
        isDrillable: f.type === 'supercluster' && !!f.superclusterId,
        isHome: !!f.isHome,
        nasaQueries: buildNasaQueries(id, f.nameEn),
      };
    }
    case 'supercluster': {
      const c = ALL_GALAXY_CLUSTERS.find(x => x.id === id);
      if (!c) return null;
      return {
        id,
        nameJa: c.nameJa,
        nameEn: c.nameEn,
        descriptionJa: c.descriptionJa,
        distanceStr: fmtDist(c.distanceMLy),
        sizeStr: `約 ${c.diameterMLy.toLocaleString()} 百万光年`,
        countStr: `銀河 ${c.galaxyCount.toLocaleString()} 個`,
        typeLabel: '銀河団',
        facts: [],
        targetLevel: 'cluster',
        targetId: c.id,
        isDrillable: c.groupIds.length > 0,
        isHome: !!c.isHome,
        nasaQueries: buildNasaQueries(id, c.nameEn),
      };
    }
    case 'cluster': {
      const g = ALL_GALAXY_GROUPS.find(x => x.id === id);
      if (!g) return null;
      return {
        id,
        nameJa: g.nameJa,
        nameEn: g.nameEn,
        descriptionJa: g.descriptionJa,
        distanceStr: fmtDist(g.distanceMLy),
        sizeStr: `約 ${g.diameterMLy.toLocaleString()} 百万光年`,
        countStr: `銀河 約 ${g.galaxyCount} 個`,
        typeLabel: '銀河群',
        facts: [],
        targetLevel: 'group',
        targetId: g.id,
        isDrillable: g.galaxyIds.length > 0,
        isHome: !!g.isHome,
        nasaQueries: buildNasaQueries(id, g.nameEn),
      };
    }
    case 'group': {
      const gx = ALL_COSMIC_GALAXIES.find(x => x.id === id);
      if (!gx) return null;
      return {
        id,
        nameJa: gx.nameJa,
        nameEn: gx.nameEn,
        descriptionJa: gx.descriptionJa,
        distanceStr: fmtDist(gx.distanceMLy),
        sizeStr: `直径 ${gx.diameterKly.toLocaleString()} 千光年`,
        countStr: `恒星 ${gx.starCount}`,
        typeLabel: GALAXY_TYPE_LABELS[gx.type] ?? gx.type,
        facts: gx.facts ?? [],
        targetLevel: 'galaxy',
        targetId: gx.id,
        isDrillable: true,
        isHome: !!gx.isHome,
        nasaQueries: buildNasaQueries(id, gx.nameEn),
      };
    }
    default:
      return null;
  }
}

// ── NASA 画像ギャラリー ────────────────────────────────────────────────────────
const NasaImageGallery: React.FC<{ queries: string[]; nameJa: string }> = ({ queries, nameJa }) => {
  const [images, setImages] = useState<(NasaImage | null)[]>([]);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImages([]);
    setActive(0);
    setLoaded(false);
    let cancelled = false;
    (async () => {
      const results = await Promise.all(queries.map(q => fetchNasaImage(q)));
      if (!cancelled) {
        setImages(results);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [queries.join(',')]);

  const valid = images.filter(Boolean) as NasaImage[];
  if (!loaded) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }
  if (valid.length === 0) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-white/4 border border-white/8 flex flex-col items-center justify-center gap-2">
        <Image size={20} className="text-white/20" />
        <p className="text-white/25 text-xs">画像取得中…</p>
      </div>
    );
  }

  const cur = valid[active];
  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/12 shadow-xl shadow-black/60">
        <img
          src={cur.thumbUrl}
          alt={cur.title}
          className="w-full aspect-video object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Credit overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
          <p className="text-white/60 text-[9px] font-mono line-clamp-1">📷 {cur.title}</p>
          <p className="text-white/35 text-[8px] font-mono">Image Credit: NASA</p>
        </div>
      </div>

      {/* Thumbnails row */}
      {valid.length > 1 && (
        <div className="flex gap-2">
          {valid.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'flex-1 aspect-video rounded-xl overflow-hidden border-2 transition-all active:scale-95',
                i === active ? 'border-indigo-400' : 'border-white/10 opacity-55',
              )}
            >
              <img src={img.thumbUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── ステータス行 ─────────────────────────────────────────────────────────────
const StatRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-baseline py-2 border-b border-white/5 last:border-0">
    <span className="text-white/45 text-xs">{label}</span>
    <span className={cn('text-xs font-mono text-right ml-2', highlight ? 'text-amber-300 font-bold' : 'text-white/85')}>{value}</span>
  </div>
);

// ── レベル別アイコン ─────────────────────────────────────────────────────────
function levelIcon(level: CosmicLevel): string {
  return { lss: '🌌', supercluster: '✨', cluster: '🔵', group: '🌀', galaxy: '⭐', system: '☀️' }[level] ?? '🔭';
}

function drillLabel(targetLevel: CosmicLevel): string {
  return {
    supercluster: 'この超銀河団をワープ探索',
    cluster:      'この銀河団の内部へ',
    group:        'この銀河群の内部へ',
    galaxy:       'この銀河を3Dで探索する',
    system:       'この星系を探索する',
    lss:          '大規模構造を探索',
  }[targetLevel] ?? '探索する';
}

// ── メインコンポーネント ─────────────────────────────────────────────────────
export const CosmicInfoPanel: React.FC<Props> = ({ state, collapsed = false, onToggleCollapse }) => {
  const { selectedCosmicId, cosmicLevel } = state;
  const [tab, setTab] = useState<'info' | 'image'>('image');
  const scrollRef = useRef<HTMLDivElement>(null);

  const info = selectedCosmicId ? getInfo(cosmicLevel, selectedCosmicId) : null;
  const isVisible = !!selectedCosmicId && !!info;

  // Reset to image tab whenever a new object is selected
  useEffect(() => {
    if (isVisible) {
      setTab('image');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCosmicId, isVisible]);

  const handleDrillDown = useCallback(() => {
    if (!info) return;
    state.drillDown(info.targetLevel, info.targetId);
  }, [info, state]);

  const translateClass = !isVisible
    ? 'translate-y-full'
    : collapsed
      ? 'translate-y-[calc(100%-56px)]'
      : 'translate-y-0';

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out',
        translateClass,
      )}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      {/* ── Pull handle ── */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex flex-col items-center pt-2 pb-1 justify-center gap-1 bg-[#07091a]/92 active:opacity-70 transition-opacity"
        style={{ minHeight: 56 }}
      >
        <div className="w-10 h-1 rounded-full bg-white/25" />
        {collapsed ? (
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs font-medium">{info?.nameJa.split('（')[0].substring(0, 18)}</span>
            <ChevronUp size={12} className="text-white/35" />
          </div>
        ) : (
          <ChevronDown size={14} className="text-white/35" />
        )}
      </button>

      <div
        ref={scrollRef}
        className="bg-[#07091a]/96 backdrop-blur-xl border-t border-white/10 overflow-y-auto"
        style={{ maxHeight: '70dvh', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {info && (
          <>
            {/* ── Header ── */}
            <div className="sticky top-0 bg-[#07091a]/98 backdrop-blur-xl z-10 px-4 pt-3 pb-2 border-b border-white/8">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Type badge */}
                  {info.typeLabel && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-lg" aria-hidden>{levelIcon(cosmicLevel)}</span>
                      <span className="px-2 py-0.5 bg-indigo-900/60 border border-indigo-500/40 rounded-full text-indigo-300 text-[10px] font-bold tracking-wide">
                        {info.typeLabel}
                      </span>
                      {info.isHome && (
                        <span className="px-2 py-0.5 bg-amber-900/60 border border-amber-500/50 rounded-full text-amber-300 text-[10px] font-bold">
                          🏠 私たちの場所
                        </span>
                      )}
                    </div>
                  )}
                  {/* Name */}
                  <h2 className="text-base font-bold text-white leading-snug">
                    {info.nameJa.split('（')[0]}
                  </h2>
                  <p className="text-white/38 text-[10px] font-mono mt-0.5 truncate">{info.nameEn}</p>
                </div>
                <button
                  onClick={() => state.selectCosmicObject(null)}
                  className="p-2.5 rounded-full bg-white/8 active:bg-white/20 text-white/50 flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center mt-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 mt-2">
                {[
                  { key: 'image' as const, icon: <Image size={12} />, label: 'NASA画像' },
                  { key: 'info'  as const, icon: <Info  size={12} />, label: '詳細情報' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all',
                      tab === t.key
                        ? 'bg-indigo-500/30 border border-indigo-400/50 text-indigo-200'
                        : 'bg-white/5 border border-white/10 text-white/40 active:bg-white/10',
                    )}
                  >
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-4 pt-4 pb-4 space-y-4">

              {/* ── IMAGE TAB ── */}
              {tab === 'image' && (
                <>
                  <NasaImageGallery queries={info.nasaQueries} nameJa={info.nameJa} />

                  {/* Quick stats under image */}
                  <div className="bg-white/4 rounded-2xl px-4 py-1 border border-white/8">
                    <StatRow label="距離" value={info.distanceStr} highlight={info.isHome} />
                    <StatRow label="大きさ" value={info.sizeStr} />
                    {info.countStr && <StatRow label="構成" value={info.countStr} />}
                    {info.massStr  && <StatRow label="質量" value={info.massStr}  />}
                  </div>

                  {/* Drill button */}
                  {info.isDrillable && (
                    <button
                      onClick={handleDrillDown}
                      className="w-full py-4 bg-indigo-900/55 active:bg-indigo-700/70 border border-indigo-500/60 rounded-2xl text-indigo-100 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px] shadow-lg shadow-indigo-900/30"
                    >
                      <Rocket size={16} className="text-indigo-300" />
                      {drillLabel(info.targetLevel)}
                    </button>
                  )}
                  {!info.isDrillable && (
                    <p className="text-white/22 text-xs text-center py-2">探索データが準備されていません</p>
                  )}
                </>
              )}

              {/* ── INFO TAB ── */}
              {tab === 'info' && (
                <>
                  {/* Description */}
                  <div className="bg-indigo-950/45 border border-indigo-500/20 rounded-2xl p-4">
                    <p className="text-white/80 text-sm leading-relaxed">{info.descriptionJa}</p>
                  </div>

                  {/* Stats table */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={12} className="text-white/30" />
                      <span className="text-white/30 text-[10px] font-bold tracking-widest uppercase">基本データ</span>
                    </div>
                    <div className="bg-white/4 rounded-2xl px-4 py-1 border border-white/8">
                      <StatRow label="距離" value={info.distanceStr} highlight={info.isHome} />
                      <StatRow label="大きさ" value={info.sizeStr} />
                      {info.countStr && <StatRow label="構成天体数" value={info.countStr} />}
                      {info.massStr  && <StatRow label="推定質量"  value={info.massStr}  />}
                    </div>
                  </div>

                  {/* Facts */}
                  {info.facts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={12} className="text-amber-400/70" />
                        <span className="text-amber-400/70 text-[10px] font-bold tracking-widest uppercase">豆知識</span>
                      </div>
                      <div className="space-y-2">
                        {info.facts.map((fact, i) => (
                          <div key={i} className="flex gap-3 bg-white/3 rounded-xl p-3 border border-white/6">
                            <span className="text-amber-400 font-black text-sm mt-0.5 flex-shrink-0 w-4">{i + 1}</span>
                            <p className="text-white/72 text-xs leading-relaxed">{fact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drill button */}
                  {info.isDrillable && (
                    <button
                      onClick={handleDrillDown}
                      className="w-full py-4 bg-indigo-900/55 active:bg-indigo-700/70 border border-indigo-500/60 rounded-2xl text-indigo-100 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px] shadow-lg shadow-indigo-900/30"
                    >
                      <Rocket size={16} className="text-indigo-300" />
                      {drillLabel(info.targetLevel)}
                    </button>
                  )}
                  {!info.isDrillable && (
                    <p className="text-white/22 text-xs text-center py-2">探索データが準備されていません</p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
