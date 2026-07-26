import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CONSTELLATIONS, Constellation } from '../data/constellations';
import {
  CONSTELLATION_META, ConstellationMeta, Season,
  SEASON_LABELS, SEASON_COLORS, getConstellationMeta
} from '../data/constellationMeta';
import { ALL_STAR_SYSTEMS } from '../data/starSystems';
import { cn } from '@/lib/utils';
import { ChevronLeft, X, ExternalLink, Star, BookOpen, Search } from 'lucide-react';

// ── Persistence ───────────────────────────────────────────────────────────────
const ENCYCLOPEDIA_KEY = 'stellar_encyclopedia_v1';

function loadViewed(): Set<string> {
  try {
    const raw = localStorage.getItem(ENCYCLOPEDIA_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function saveViewed(ids: Set<string>) {
  try {
    localStorage.setItem(ENCYCLOPEDIA_KEY, JSON.stringify([...ids]));
  } catch {}
}

// ── Season order ──────────────────────────────────────────────────────────────
const SEASON_ORDER: Season[] = ['circumpolar', 'spring', 'summer', 'autumn', 'winter', 'southern'];

// ── Decorative pattern per constellation ─────────────────────────────────────
// Generates a consistent "star glyph" based on the constellation id
function getConstellationGlyph(id: string): string {
  const glyphs: Record<string, string> = {
    ori:'⚔️', leo:'🦁', sco:'🦂', gem:'👥', tau:'🐂', psc:'🐟',
    aqr:'🏺', cap:'🐐', sgr:'🏹', vir:'🌾', lib:'⚖️', cnc:'🦀',
    uma:'🐻', umi:'🧭', cas:'👑', cyg:'🦢', aql:'🦅', lyr:'🎵',
    cma:'🐕', cmi:'🐕', boo:'🌟', her:'💪', peg:'🐴', and:'⛓️',
    per:'🗡️', cet:'🐋', hya:'🐍', oph:'🐍', dra:'🐲', crb:'💍',
    sge:'🏹', del:'🐬', equ:'🐴', col:'🕊️', crv:'�crow', crt:'🏺',
    cru:'✝️', car:'⚓', vel:'⛵', pup:'⛵', pyx:'🧭',  aur:'🎭',
    cep:'👑', vul:'🦊', lup:'🐺', cen:'🏇', ara:'🔥', gru:'🦩',
    phe:'🔥', pav:'🦚', tuc:'🦜', psa:'🐟', ind:'🏹', scl:'🗿',
    for:'🔥', mon:'🦄', eri:'🌊', tri:'📐', tra:'📐', lep:'🐰',
  };
  return glyphs[id] || '✨';
}

// ── Constellation Card ────────────────────────────────────────────────────────
interface ConstellationCardProps {
  con: Constellation;
  meta: ConstellationMeta;
  isViewed: boolean;
  onClick: () => void;
}

const ConstellationCard: React.FC<ConstellationCardProps> = ({ con, meta, isViewed, onClick }) => {
  const seasonColor = SEASON_COLORS[meta.season];
  const isLinked = !!con.linkedSystemId;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-2 p-3 rounded-2xl border transition-all active:scale-[0.97] text-left w-full',
        'bg-white/4 border-white/10 active:bg-white/8',
        isLinked && 'border-green-500/30 bg-green-900/10',
      )}
    >
      {/* Viewed badge */}
      {isViewed && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
      )}
      {/* Linked system indicator */}
      {isLinked && (
        <div className="absolute top-2 left-2 text-[8px] text-green-400 font-bold bg-green-900/50 px-1.5 py-0.5 rounded-full border border-green-500/30">
          🔭 星系あり
        </div>
      )}

      {/* Glyph + rank */}
      <div className="flex items-start justify-between mt-1">
        <span className="text-2xl leading-none">{getConstellationGlyph(con.id)}</span>
        <span
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${seasonColor}22`, color: seasonColor, border: `1px solid ${seasonColor}44` }}
        >
          {con.areaRank}位
        </span>
      </div>

      {/* Names */}
      <div>
        <div className="text-white/90 text-sm font-bold leading-tight">{con.nameJa}</div>
        <div className="text-white/35 text-[10px] font-mono leading-tight mt-0.5">{con.nameEn}</div>
      </div>

      {/* One-liner mythology */}
      <p className="text-white/50 text-[10px] leading-relaxed line-clamp-2">{con.mythologyJa}</p>
    </button>
  );
};

// ── Detail Panel ──────────────────────────────────────────────────────────────
interface DetailPanelProps {
  con: Constellation | null;
  meta: ConstellationMeta | null;
  onClose: () => void;
  onSwitchSystem: (id: string) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ con, meta, onClose, onSwitchSystem }) => {
  const isVisible = !!(con && meta);
  const linkedSystem = con?.linkedSystemId
    ? ALL_STAR_SYSTEMS.find(s => s.id === con.linkedSystemId)
    : null;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-out pointer-events-auto',
      isVisible ? 'translate-y-0' : 'translate-y-full'
    )}>
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      <div className="bg-[#080c18]/97 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[70dvh] overflow-y-auto">
        {con && meta && (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-[#080c18]/97 backdrop-blur-xl z-10 px-5 pt-4 pb-3 border-b border-white/8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getConstellationGlyph(con.id)}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-white">{con.nameJa}</h2>
                      <span className="text-white/40 text-sm font-mono">{con.abbr}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${SEASON_COLORS[meta.season]}22`,
                          color: SEASON_COLORS[meta.season],
                          border: `1px solid ${SEASON_COLORS[meta.season]}44`
                        }}
                      >
                        {SEASON_LABELS[meta.season]}の星座
                      </span>
                    </div>
                    <div className="text-white/40 text-xs font-mono">{con.nameEn}</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="mt-1 p-2.5 rounded-full bg-white/8 active:bg-white/20 text-white/60 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pt-4 pb-8 space-y-4">
              {/* Mythology */}
              <div className="bg-indigo-900/20 border border-indigo-500/25 rounded-2xl p-4">
                <h3 className="text-xs text-indigo-300/70 font-bold tracking-widest uppercase mb-2">神話・伝説</h3>
                <p className="text-white/80 text-sm leading-relaxed">{con.mythologyJa}</p>
              </div>

              {/* How to find */}
              <div className="bg-amber-900/15 border border-amber-500/20 rounded-2xl p-4">
                <h3 className="text-xs text-amber-400/70 font-bold tracking-widest uppercase mb-2">🔍 観察のコツ</h3>
                <p className="text-white/75 text-sm leading-relaxed">{meta.sightingTip}</p>
              </div>

              {/* Main stars */}
              <div>
                <h3 className="text-xs text-sky-400/80 font-bold tracking-widest uppercase mb-2 flex items-center gap-1">
                  <Star size={10} /> 主な星
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-900/25 border border-amber-500/30 rounded-full">
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="text-white/80 text-xs">{con.brightestStarJa}</span>
                    <span className="text-white/35 text-[10px]">（最も明るい）</span>
                  </div>
                  {meta.mainStarsJa.filter(s => s !== con.brightestStarJa).map(star => (
                    <div key={star} className="px-3 py-2 bg-white/5 border border-white/10 rounded-full">
                      <span className="text-white/65 text-xs">{star}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/4 rounded-2xl px-4 py-1 border border-white/8">
                {[
                  { label: '面積ランク', value: `${con.areaRank}位 / 88星座` },
                  { label: '面積',       value: `${con.areaSqDeg.toLocaleString()} 平方度` },
                  { label: '見ごろ',     value: `${SEASON_LABELS[meta.season]}` },
                  { label: '略号（IAU）',value: con.abbr },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-baseline py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-white/50 text-xs font-mono tracking-wider">{label}</span>
                    <span className="text-white/85 text-xs font-mono text-right ml-2">{value}</span>
                  </div>
                ))}
              </div>

              {/* Linked star system */}
              {linkedSystem && (
                <div className="bg-green-900/25 border border-green-500/40 rounded-2xl p-4">
                  <h3 className="text-xs text-green-400/80 font-bold tracking-widest uppercase mb-3">
                    🔭 この星座の方向にある探索済みの星系
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-200 font-bold text-sm">{linkedSystem.nameJa}</div>
                      <div className="text-green-400/60 text-xs mt-0.5">地球から {linkedSystem.distanceLy.toLocaleString()} 光年</div>
                      <div className="text-green-400/50 text-[10px] mt-0.5">{linkedSystem.starTypeJa}</div>
                    </div>
                    <button
                      onClick={() => onSwitchSystem(linkedSystem.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-green-800/50 border border-green-500/50 rounded-xl text-green-200 text-xs font-bold active:bg-green-700/60 transition-all min-h-[44px]"
                    >
                      探索する <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Achievement Badge ─────────────────────────────────────────────────────────
const AchievementBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count < 88) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-br from-amber-600/90 to-yellow-400/90 backdrop-blur-xl border border-amber-300/50 rounded-3xl px-8 py-6 text-center shadow-2xl animate-bounce pointer-events-auto">
        <div className="text-5xl mb-2">🏆</div>
        <div className="text-white font-bold text-lg">宇宙博士 達成！</div>
        <div className="text-white/80 text-sm mt-1">全88星座を制覇しました</div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
interface ConstellationEncyclopediaProps {
  onExit: () => void;
  onSwitchSystem: (id: string) => void;
  onConstellationViewed?: (id: string) => void;
}

export const ConstellationEncyclopedia: React.FC<ConstellationEncyclopediaProps> = ({
  onExit, onSwitchSystem, onConstellationViewed
}) => {
  const [activeSeason, setActiveSeason] = useState<Season>('circumpolar');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => loadViewed());
  const [showAchievement, setShowAchievement] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Build lookup map: id → {con, meta}
  const constellationMap = useMemo(() => {
    const map = new Map<string, { con: Constellation; meta: ConstellationMeta }>();
    CONSTELLATIONS.forEach(con => {
      const meta = getConstellationMeta(con.id);
      if (meta) map.set(con.id, { con, meta });
    });
    return map;
  }, []);

  const isSearching = searchText.trim().length > 0;

  // Filter by active season OR by search query (search overrides season tab)
  const filteredEntries = useMemo(() => {
    if (isSearching) {
      const q = searchText.trim().toLowerCase();
      return [...constellationMap.values()]
        .filter(({ con }) =>
          con.nameJa.toLowerCase().includes(q) ||
          con.nameEn.toLowerCase().includes(q) ||
          con.id.toLowerCase().includes(q) ||
          con.mythologyJa.toLowerCase().includes(q)
        )
        .sort((a, b) => a.con.areaRank - b.con.areaRank);
    }
    return CONSTELLATION_META
      .filter(m => m.season === activeSeason)
      .map(m => constellationMap.get(m.id))
      .filter((e): e is { con: Constellation; meta: ConstellationMeta } => !!e)
      .sort((a, b) => a.con.areaRank - b.con.areaRank);
  }, [activeSeason, constellationMap, searchText, isSearching]);

  // Season tab counts
  const seasonCounts = useMemo(() => {
    const counts: Record<Season, number> = {} as Record<Season, number>;
    SEASON_ORDER.forEach(s => {
      counts[s] = CONSTELLATION_META.filter(m => m.season === s).length;
    });
    return counts;
  }, []);

  const selectedEntry = selectedId ? constellationMap.get(selectedId) : null;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setViewedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveViewed(next);
      if (next.size === 88) setShowAchievement(true);
      return next;
    });
    // Award stamp for viewing this constellation
    onConstellationViewed?.(id);
  };

  const handleSwitchSystem = (systemId: string) => {
    onSwitchSystem(systemId);
    onExit();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#020408] overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="shrink-0 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-white/10 active:bg-white/20 backdrop-blur-md border border-white/15 rounded-full text-white/80 text-sm font-medium transition-all active:scale-95 shrink-0"
          >
            <ChevronLeft size={18} />
            戻る
          </button>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-300" />
            <span className="text-white/90 font-bold tracking-widest text-xs">星座図鑑</span>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-1 px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px] shrink-0">
            <span className="text-amber-400 text-sm font-mono font-bold">{viewedIds.size}</span>
            <span className="text-white/40 text-xs">/88</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(viewedIds.size / 88) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-white/30 font-mono text-right mt-0.5">
            {viewedIds.size === 88 ? '🏆 全星座制覇！' : `あと ${88 - viewedIds.size} 星座`}
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="px-4 pb-2">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-white/30 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="星座名・神話キーワードで検索…"
              className="w-full pl-8 pr-8 py-2 bg-white/6 border border-white/12 rounded-xl text-white/80 text-xs placeholder:text-white/25 outline-none focus:border-indigo-400/50 focus:bg-white/8 transition-all"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-2.5 text-white/30 active:text-white/60 p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {isSearching && (
            <div className="text-[10px] text-white/30 font-mono mt-1 pl-1">
              {filteredEntries.length} 件ヒット
            </div>
          )}
        </div>

        {/* ── Season Tabs (hidden during search) ── */}
        {!isSearching && (
        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-3 gap-1.5">
          {SEASON_ORDER.map(season => {
            const isActive = activeSeason === season;
            const color = SEASON_COLORS[season];
            return (
              <button
                key={season}
                onClick={() => setActiveSeason(season)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all min-h-[34px] shrink-0',
                  isActive ? 'text-white' : 'text-white/40 border-white/10 bg-white/4 active:bg-white/8',
                )}
                style={isActive ? {
                  background: `${color}22`,
                  borderColor: `${color}66`,
                  color: color,
                } : {}}
              >
                <span>{SEASON_LABELS[season]}</span>
                <span className="text-white/30 font-normal text-[10px]">({seasonCounts[season]})</span>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* ── Card Grid ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {!isSearching && activeSeason === 'southern' && (
          <div className="mb-3 px-3 py-2.5 bg-purple-900/20 border border-purple-500/20 rounded-xl">
            <p className="text-purple-300/70 text-[11px] leading-relaxed">
              🌏 南天の星座は日本からほぼ見えません。南半球（オーストラリア・南米など）を旅するときに楽しめます。
            </p>
          </div>
        )}
        {isSearching && filteredEntries.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">🔭</span>
            <p className="text-white/35 text-sm">「{searchText}」に一致する星座が見つかりませんでした</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          {filteredEntries.map(({ con, meta }) => (
            <ConstellationCard
              key={con.id}
              con={con}
              meta={meta}
              isViewed={viewedIds.has(con.id)}
              onClick={() => handleSelect(con.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <DetailPanel
        con={selectedEntry?.con ?? null}
        meta={selectedEntry?.meta ?? null}
        onClose={() => setSelectedId(null)}
        onSwitchSystem={handleSwitchSystem}
      />

      {/* ── Achievement ── */}
      {showAchievement && (
        <AchievementBadge count={viewedIds.size} />
      )}
    </div>
  );
};
