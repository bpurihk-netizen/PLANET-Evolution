import React, { useState, useMemo } from 'react';
import { CONSTELLATIONS, Constellation } from '../data/constellations';
import { CONSTELLATION_META, getConstellationMeta, SEASON_LABELS, SEASON_COLORS } from '../data/constellationMeta';
import {
  MYTHOLOGY_DATA, MythologyEntry, MythologyOrigin,
  ORIGIN_LABELS, ORIGIN_COLORS, getMythologyData,
} from '../data/mythologyData';
import { ALL_STAR_SYSTEMS } from '../data/starSystems';
import { ConstellationSilhouette } from './ConstellationSilhouette';
import { cn } from '@/lib/utils';
import { ChevronLeft, X, BookOpen, ExternalLink, Star, ChevronDown, ChevronUp } from 'lucide-react';

// ── Persistence ───────────────────────────────────────────────────────────────
const STORYBOOK_KEY = 'mythology_storybook_v1';

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(STORYBOOK_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}
function saveRead(ids: Set<string>) {
  try { localStorage.setItem(STORYBOOK_KEY, JSON.stringify([...ids])); } catch {}
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const ORIGIN_ORDER: (MythologyOrigin | 'all')[] = ['all', 'greek', 'arabic', 'chinese', 'modern'];
const ORIGIN_ALL_LABEL = 'すべて';

// ── Decorative glyphs per constellation id (reuse from encyclopedia) ──────────
function getGlyph(id: string): string {
  const glyphs: Record<string, string> = {
    ori:'⚔️', leo:'🦁', sco:'🦂', gem:'👥', tau:'🐂', psc:'🐟',
    aqr:'🏺', cap:'🐐', sgr:'🏹', vir:'🌾', lib:'⚖️', cnc:'🦀',
    uma:'🐻', umi:'🧭', cas:'👑', cyg:'🦢', aql:'🦅', lyr:'🎵',
    cma:'🐕', cmi:'🐕', boo:'🌟', her:'💪', peg:'🐴', and:'⛓️',
    per:'🗡️', cet:'🐋', hya:'🐍', oph:'🐍', dra:'🐲', crb:'💍',
    sge:'🏹', del:'🐬', equ:'🐴', col:'🕊️', crv:'🐦', crt:'🏺',
    cru:'✝️', car:'⚓', vel:'⛵', pup:'⛵', pyx:'🧭', aur:'🎭',
    cep:'👑', vul:'🦊', lup:'🐺', cen:'🏇', ara:'🔥', gru:'🦩',
    phe:'🔥', pav:'🦚', tuc:'🦜', psa:'🐟', ind:'🏹', scl:'🗿',
    for:'⛏️', mon:'🦄', eri:'🌊', tri:'📐', tra:'📐', lep:'🐰',
    cvn:'🐕', com:'💇', sct:'🛡️', ser:'🐍',
    pic:'🎨', nor:'📏', men:'⛰️', mic:'🔬', oct:'🧭', mus:'🪰',
    lac:'🦎', lmi:'🦁', vol:'🐟', dor:'🐟', hyi:'🐍', cha:'🦎',
    cir:'📐', aps:'🦜', cae:'🗿', cam:'🦒', ant:'⚗️', cra:'💍',
    sex:'📐',
  };
  return glyphs[id] || '✨';
}

// ── Storybook Card ────────────────────────────────────────────────────────────
interface StoryCardProps {
  con: Constellation;
  entry: MythologyEntry;
  isRead: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSwitchSystem: (id: string) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({
  con, entry, isRead, isExpanded, onToggle, onSwitchSystem
}) => {
  const meta = getConstellationMeta(con.id);
  const originColor = ORIGIN_COLORS[entry.origin];
  const linkedSystem = entry.linkedSystemId
    ? ALL_STAR_SYSTEMS.find(s => s.id === entry.linkedSystemId)
    : null;

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all overflow-hidden',
        isExpanded
          ? 'bg-white/6 border-white/18'
          : 'bg-white/3 border-white/10',
      )}
    >
      {/* ── Card Header (always visible) ── */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 active:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Glyph */}
          <div
            className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${originColor}18`, border: `1px solid ${originColor}30` }}
          >
            {getGlyph(con.id)}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/90 text-sm font-bold leading-tight">{con.nameJa}</span>
              {/* Origin badge */}
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: `${originColor}22`,
                  color: originColor,
                  border: `1px solid ${originColor}44`,
                }}
              >
                {ORIGIN_LABELS[entry.origin]}
              </span>
              {/* Read badge */}
              {isRead && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                  読了
                </span>
              )}
            </div>
            <div className="text-white/40 text-[10px] font-mono mt-0.5">{con.nameEn}</div>
            {/* Character name */}
            <div className="text-white/55 text-xs mt-1 flex items-center gap-1">
              <span className="text-[9px] text-white/30">登場：</span>
              <span className="font-medium">{entry.character}</span>
            </div>
          </div>

          {/* Expand arrow */}
          <div className="shrink-0 text-white/30 mt-1">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Short mythology preview (collapsed) */}
        {!isExpanded && (
          <p className="text-white/45 text-[11px] leading-relaxed mt-2.5 line-clamp-2 pr-2">
            {con.mythologyJa}
          </p>
        )}
      </button>

      {/* ── Expanded content ── */}
      {isExpanded && (
        <div className="px-4 pb-5 space-y-4">
          {/* Divider */}
          <div className="h-px bg-white/8" />

          {/* ── Constellation silhouette diagram ── */}
          <div
            className="rounded-xl overflow-hidden relative"
            style={{ background: `${originColor}08`, border: `1px solid ${originColor}20` }}
          >
            {/* Header label */}
            <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
              <span
                className="text-[9px] font-bold tracking-widest uppercase"
                style={{ color: originColor }}
              >
                ✦ 星座図
              </span>
              <span className="text-[9px] text-white/25 font-mono">{con.nameEn}</span>
            </div>

            {/* SVG silhouette centered */}
            <div className="flex justify-center pb-2">
              <ConstellationSilhouette
                constellationId={con.id}
                accentColor={originColor}
                size={180}
              />
            </div>

            {/* Brightest star label */}
            <div className="px-3 pb-2.5 flex items-center gap-1.5">
              <span className="text-[9px] text-white/30">最明星：</span>
              <span className="text-[10px] font-mono text-white/60">{con.brightestStarJa}</span>
              <span className="text-[9px] text-white/20 font-mono">/ {con.brightestStarEn}</span>
            </div>
          </div>

          {/* Full mythology story */}
          <div
            className="rounded-xl p-4"
            style={{ background: `${originColor}10`, border: `1px solid ${originColor}25` }}
          >
            <h3
              className="text-[10px] font-bold tracking-widest uppercase mb-2"
              style={{ color: originColor }}
            >
              📖 {ORIGIN_LABELS[entry.origin]}神話ストーリー
            </h3>
            <p className="text-white/80 text-[13px] leading-relaxed">
              {entry.mythologyFull}
            </p>
          </div>

          {/* Constellation data */}
          {meta && (
            <div className="bg-white/4 rounded-xl px-4 py-1 border border-white/8">
              <h3 className="text-[10px] text-white/40 font-bold tracking-widest uppercase py-2 border-b border-white/6">
                ★ 星座データ
              </h3>
              {[
                { label: '面積ランク', value: `${con.areaRank}位 / 88星座` },
                { label: '面積', value: `${con.areaSqDeg.toLocaleString()} 平方度` },
                { label: '見ごろ', value: SEASON_LABELS[meta.season] },
                { label: '最明星', value: con.brightestStarJa },
                { label: '略号（IAU）', value: con.abbr },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-baseline py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-[11px] font-mono tracking-wider">{label}</span>
                  <span className="text-white/80 text-[11px] font-mono text-right ml-2">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Linked star system CTA */}
          {linkedSystem && (
            <div className="bg-green-900/25 border border-green-500/40 rounded-xl p-4">
              <h3 className="text-[10px] text-green-400/80 font-bold tracking-widest uppercase mb-3">
                🔭 この星座の方向にある星系
              </h3>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-green-200 font-bold text-sm">{linkedSystem.nameJa}</div>
                  <div className="text-green-400/60 text-xs mt-0.5">
                    地球から {linkedSystem.distanceLy.toLocaleString()} 光年
                  </div>
                  <div className="text-green-400/50 text-[10px] mt-0.5">{linkedSystem.starTypeJa}</div>
                </div>
                <button
                  onClick={() => onSwitchSystem(linkedSystem.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-green-800/50 border border-green-500/50 rounded-xl text-green-200 text-xs font-bold active:bg-green-700/60 transition-all min-h-[44px]"
                >
                  探索する <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
interface MythologyStorybookProps {
  onExit: () => void;
  onSwitchSystem: (id: string) => void;
}

export const MythologyStorybook: React.FC<MythologyStorybookProps> = ({
  onExit, onSwitchSystem,
}) => {
  const [activeOrigin, setActiveOrigin] = useState<MythologyOrigin | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadRead());

  // Build a map: id → {con, entry}
  const entries = useMemo(() => {
    const map = new Map<string, { con: Constellation; entry: MythologyEntry }>();
    MYTHOLOGY_DATA.forEach(entry => {
      const con = CONSTELLATIONS.find(c => c.id === entry.id);
      if (con) map.set(entry.id, { con, entry });
    });
    return map;
  }, []);

  // Count per origin
  const originCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MYTHOLOGY_DATA.length };
    MYTHOLOGY_DATA.forEach(e => {
      counts[e.origin] = (counts[e.origin] ?? 0) + 1;
    });
    return counts;
  }, []);

  // Filtered + sorted list
  const filteredList = useMemo(() => {
    const all = [...entries.values()];
    const filtered = activeOrigin === 'all'
      ? all
      : all.filter(({ entry }) => entry.origin === activeOrigin);
    // Sort: linked systems first, then alphabetically by nameJa
    return filtered.sort((a, b) => {
      const aLinked = !!a.entry.linkedSystemId ? 0 : 1;
      const bLinked = !!b.entry.linkedSystemId ? 0 : 1;
      if (aLinked !== bLinked) return aLinked - bLinked;
      return a.con.nameJa.localeCompare(b.con.nameJa, 'ja');
    });
  }, [activeOrigin, entries]);

  const handleToggle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Mark as read
      setReadIds(prev => {
        const next = new Set(prev);
        next.add(id);
        saveRead(next);
        return next;
      });
    }
  };

  const handleSwitchSystem = (systemId: string) => {
    onSwitchSystem(systemId);
    onExit();
  };

  const linkedCount = MYTHOLOGY_DATA.filter(e => e.linkedSystemId).length;

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
            <BookOpen size={16} className="text-rose-300" />
            <span className="text-white/90 font-bold tracking-widest text-xs">星座神話</span>
          </div>
          {/* Read progress */}
          <div className="flex items-center gap-1 px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px] shrink-0">
            <span className="text-rose-300 text-sm font-mono font-bold">{readIds.size}</span>
            <span className="text-white/40 text-xs">/{MYTHOLOGY_DATA.length}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(readIds.size / MYTHOLOGY_DATA.length) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-white/30 font-mono text-right mt-0.5">
            {readIds.size === MYTHOLOGY_DATA.length
              ? '🏆 全神話制覇！'
              : `あと ${MYTHOLOGY_DATA.length - readIds.size} 話`}
          </div>
        </div>

        {/* ── Origin filter tabs ── */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-3 gap-1.5">
          {ORIGIN_ORDER.map(origin => {
            const isActive = activeOrigin === origin;
            const color = origin === 'all' ? '#c084fc' : ORIGIN_COLORS[origin];
            const label = origin === 'all' ? ORIGIN_ALL_LABEL : ORIGIN_LABELS[origin];
            const count = originCounts[origin] ?? 0;
            return (
              <button
                key={origin}
                onClick={() => { setActiveOrigin(origin); setExpandedId(null); }}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all min-h-[34px] shrink-0',
                  isActive ? 'text-white' : 'text-white/40 border-white/10 bg-white/4 active:bg-white/8',
                )}
                style={isActive ? {
                  background: `${color}22`,
                  borderColor: `${color}66`,
                  color,
                } : {}}
              >
                <span>{label}</span>
                <span className="text-white/30 font-normal text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Intro banner ── */}
      {activeOrigin === 'all' && readIds.size === 0 && (
        <div className="mx-4 mb-3 px-4 py-3 bg-rose-900/20 border border-rose-500/20 rounded-xl shrink-0">
          <p className="text-rose-300/80 text-[11px] leading-relaxed">
            📖 各カードをタップするとその星座の神話全文と星座データが展開されます。
            {linkedCount}つの星座には探索できる星系へのリンクがあります。
          </p>
        </div>
      )}

      {/* ── Story Cards ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            この分類の神話は現在準備中です
          </div>
        ) : (
          filteredList.map(({ con, entry }) => (
            <StoryCard
              key={con.id}
              con={con}
              entry={entry}
              isRead={readIds.has(con.id)}
              isExpanded={expandedId === con.id}
              onToggle={() => handleToggle(con.id)}
              onSwitchSystem={handleSwitchSystem}
            />
          ))
        )}
      </div>
    </div>
  );
};
