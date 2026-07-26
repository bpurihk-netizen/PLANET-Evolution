import React, { useMemo, useState } from 'react';
import { ChevronLeft, Moon, Star, Telescope, Clock, ArrowUp, ExternalLink, CalendarDays, MapPin } from 'lucide-react';
import { CONSTELLATIONS } from '../data/constellations';
import { ALL_STAR_SYSTEMS } from '../data/starSystems';
import {
  computeNightSky,
  computeMoonPhase,
  computePlanetsTonight,
  computeAnnualCalendar,
  VisibleConstellation,
  MonthlyCalendarEntry,
  MoonPhase,
  PlanetInfo,
} from '../utils/starVisibility';
import { SEASON_COLORS, getConstellationMeta } from '../data/constellationMeta';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format Japanese date string */
function formatDateJa(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const day = days[date.getDay()];
  return `${m}月${d}日（${day}）`;
}

/** Stars rating display */
function EasyRating({ rating }: { rating: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map(n => (
        <Star
          key={n}
          size={10}
          className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20 fill-white/5'}
        />
      ))}
    </div>
  );
}

/** Transit time badge */
function TransitBadge({ transitJST, isPrime, latDeg = 35 }: { transitJST: string; isPrime: boolean; latDeg?: number }) {
  const transitLabel = latDeg < 0 ? '北中' : '南中';
  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono',
      isPrime
        ? 'bg-sky-900/40 border border-sky-400/30 text-sky-300'
        : 'bg-white/5 border border-white/10 text-white/40',
    )}>
      <Clock size={8} />
      <span>{transitLabel} {transitJST}</span>
    </div>
  );
}

// ── Moon Phase Card ───────────────────────────────────────────────────────────
function MoonPhaseCard({ moon }: { moon: MoonPhase }) {
  const illuminationPct = Math.round(moon.illumination * 100);
  const daysToFull = Math.round(moon.daysToFull * 10) / 10;

  return (
    <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-950/50 to-indigo-950/40 px-4 py-3.5">
      <h2 className="text-white/70 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-1.5">
        <Moon size={12} className="text-sky-300" />
        今夜の月
      </h2>

      <div className="flex items-center gap-4">
        {/* Big emoji */}
        <div className="text-5xl shrink-0 leading-none">{moon.emoji}</div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white/95 font-bold text-lg leading-tight">{moon.nameJa}</span>
            <span className="text-sky-300/70 text-[11px]">
              {moon.isWaxing ? '月齢↑ 満ちていく' : '月齢↓ 欠けていく'}
            </span>
          </div>

          {/* Illumination bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-white rounded-full transition-all"
                style={{ width: `${illuminationPct}%` }}
              />
            </div>
            <span className="text-white/50 text-[10px] font-mono shrink-0">{illuminationPct}%照</span>
          </div>

          {/* Days to full */}
          {moon.phaseKey !== 'full' && (
            <div className="text-white/40 text-[10px]">
              満月まで約{daysToFull}日
            </div>
          )}

          {/* Rise / Set times */}
          {!moon.isVisibleTonight ? (
            <div className="flex items-center gap-1.5 text-white/35 text-[10px]">
              <Moon size={9} className="shrink-0" />
              今夜は月が見えません
            </div>
          ) : moon.riseJST || moon.setJST ? (
            <div className="flex items-center gap-3 flex-wrap">
              {moon.riseJST && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-sky-900/40 border border-sky-400/25 rounded-full">
                  <span className="text-[9px] text-sky-400">🌕↑</span>
                  <span className="text-[10px] font-mono text-sky-300">月の出 {moon.riseJST}</span>
                </div>
              )}
              {moon.setJST && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-900/40 border border-indigo-400/25 rounded-full">
                  <span className="text-[9px] text-indigo-400">🌕↓</span>
                  <span className="text-[10px] font-mono text-indigo-300">月の入り {moon.setJST}</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Hint */}
          <p className="text-white/55 text-[11px] leading-relaxed">{moon.hintJa}</p>
        </div>
      </div>
    </div>
  );
}

// ── Planet Row ────────────────────────────────────────────────────────────────
interface PlanetRowProps {
  planet: PlanetInfo;
  onNavigate: (systemId: string) => void;
}

const VISIBILITY_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  evening:    { bg: 'from-orange-950/50 to-amber-950/30', border: 'border-orange-500/30', text: 'text-orange-300', badge: '夕方' },
  morning:    { bg: 'from-blue-950/50 to-cyan-950/30',   border: 'border-blue-500/30',   text: 'text-blue-300',   badge: '明け方' },
  opposition: { bg: 'from-green-950/50 to-emerald-950/30', border: 'border-green-500/40', text: 'text-green-300', badge: '衝・最高' },
  hidden:     { bg: 'from-slate-950/40 to-slate-900/20', border: 'border-white/8',        text: 'text-white/30',  badge: '観察不可' },
};

const PlanetRow: React.FC<PlanetRowProps> = ({ planet, onNavigate }) => {
  const style = VISIBILITY_STYLE[planet.visibility];
  const isVisible = planet.visibility !== 'hidden';

  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br',
      style.bg, style.border,
      isVisible ? 'opacity-100' : 'opacity-50',
    )}>
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        {/* Planet emoji */}
        <div className="text-2xl shrink-0 leading-none">{planet.emoji}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/90 font-bold text-sm">{planet.nameJa}</span>
            <span className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
              style.text,
              `bg-current/10 border-current/30`,
            )}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <span className={style.text}>{style.badge}</span>
            </span>
          </div>
          <p className="text-white/45 text-[10px] leading-snug mt-0.5 line-clamp-1">{planet.noteJa}</p>
          {isVisible && (
            <div className="text-[10px] font-mono mt-0.5">
              <span className={style.text}>{planet.bestTimeJa}</span>
            </div>
          )}
        </div>

        {/* Navigate button */}
        {isVisible && (
          <button
            onClick={() => onNavigate(planet.systemId)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white/8 border border-white/15 rounded-xl text-white/60 text-[10px] font-bold active:bg-white/15 min-h-[36px]"
          >
            探索
            <ExternalLink size={9} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Top5 Card ─────────────────────────────────────────────────────────────────
interface TopCardProps {
  entry: VisibleConstellation;
  rank: number;
  latDeg: number;
  onOpenEncyclopedia: () => void;
  onSwitchSystem: (id: string) => void;
}

const TopCard: React.FC<TopCardProps> = ({ entry, rank, latDeg, onOpenEncyclopedia, onSwitchSystem }) => {
  const { constellation: con, transitJST, culminAlt, isPrimeTime, easyRating } = entry;
  const meta = getConstellationMeta(con.id);
  const seasonColor = meta ? SEASON_COLORS[meta.season] : '#ffffff';

  // Linked star system
  const linkedSystem = con.linkedSystemId
    ? ALL_STAR_SYSTEMS.find(s => s.id === con.linkedSystemId)
    : null;

  return (
    <div className={cn(
      'relative rounded-2xl border overflow-hidden',
      linkedSystem
        ? 'bg-gradient-to-br from-green-950/60 to-teal-950/40 border-green-500/40'
        : 'bg-white/4 border-white/10',
    )}>
      {/* Rank badge */}
      <div
        className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
        style={{ background: `${seasonColor}30`, color: seasonColor, border: `1px solid ${seasonColor}60` }}
      >
        {rank}
      </div>

      {/* Star system highlight banner */}
      {linkedSystem && (
        <div className="absolute top-0 right-0 flex items-center gap-1 px-2 py-1 bg-green-800/60 border-b border-l border-green-500/40 rounded-bl-xl">
          <Telescope size={9} className="text-green-300" />
          <span className="text-[9px] text-green-300 font-bold">探索可能な星系あり</span>
        </div>
      )}

      <div className="px-4 pt-3 pb-3 ml-7">
        {/* Names */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-white/95 font-bold text-base leading-tight">{con.nameJa}</h3>
          <span className="text-white/35 text-[10px] font-mono">{con.abbr}</span>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <TransitBadge transitJST={transitJST} isPrime={isPrimeTime} latDeg={latDeg} />
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/6 border border-white/10 rounded-full">
            <ArrowUp size={8} className="text-white/40" />
            <span className="text-[10px] font-mono text-white/50">{entry.transitDirection}天 {culminAlt}°</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/6 border border-white/10 rounded-full">
            <EasyRating rating={easyRating} />
            <span className="text-[10px] text-white/40">
              {easyRating === 3 ? '見つけやすい' : easyRating === 2 ? '少し暗い' : '暗い空が必要'}
            </span>
          </div>
        </div>

        {/* One-liner tip */}
        {meta && (
          <p className="text-white/50 text-xs leading-relaxed mt-2 line-clamp-2">{meta.sightingTip}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-2.5 flex-wrap">
          <button
            onClick={() => onOpenEncyclopedia()}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/8 border border-white/15 rounded-xl text-white/70 text-[11px] font-medium active:bg-white/15 min-h-[36px]"
          >
            📚 図鑑で見る
          </button>
          {linkedSystem && (
            <button
              onClick={() => onSwitchSystem(linkedSystem.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-800/50 border border-green-500/50 rounded-xl text-green-200 text-[11px] font-bold active:bg-green-700/60 min-h-[36px]"
            >
              {linkedSystem.nameJa}を探索 <ExternalLink size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Circumpolar Row ───────────────────────────────────────────────────────────
interface CircumpolarRowProps {
  entry: VisibleConstellation;
  onOpenEncyclopedia: (id: string) => void;
}

const CircumpolarRow: React.FC<CircumpolarRowProps> = ({ entry, onOpenEncyclopedia }) => {
  const { constellation: con, easyRating } = entry;
  return (
    <button
      onClick={() => onOpenEncyclopedia(con.id)}
      className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/4 border border-white/10 rounded-xl active:bg-white/8 text-left min-h-[48px]"
    >
      <div className="text-lg shrink-0">⭐</div>
      <div className="flex-1 min-w-0">
        <div className="text-white/80 text-sm font-bold truncate">{con.nameJa}</div>
        <div className="text-white/35 text-[10px] font-mono">{con.abbr}</div>
      </div>
      <div className="shrink-0">
        <EasyRating rating={easyRating} />
      </div>
      <div className="text-white/25 shrink-0">
        <ChevronLeft size={14} className="rotate-180" />
      </div>
    </button>
  );
};

// ── Annual Calendar ───────────────────────────────────────────────────────────

const SEASON_BG: Record<string, string> = {
  '春': 'from-green-950/60 to-emerald-950/40 border-green-500/25',
  '夏': 'from-amber-950/60 to-yellow-950/40 border-amber-500/25',
  '秋': 'from-orange-950/60 to-red-950/40 border-orange-500/25',
  '冬': 'from-sky-950/60 to-blue-950/40 border-sky-500/25',
};

const SEASON_ACCENT: Record<string, string> = {
  '春': 'text-green-300',
  '夏': 'text-amber-300',
  '秋': 'text-orange-300',
  '冬': 'text-sky-300',
};

interface AnnualCalendarProps {
  calendar: MonthlyCalendarEntry[];
  currentMonth: number;
  latDeg: number;
  onOpenEncyclopedia: (conId: string) => void;
}

const AnnualCalendar: React.FC<AnnualCalendarProps> = ({ calendar, currentMonth, latDeg, onOpenEncyclopedia }) => {
  const transitLabel = latDeg < 0 ? '北中' : '南中';
  const [expandedMonth, setExpandedMonth] = useState<number>(currentMonth);

  return (
    <div className="space-y-2.5">
      {calendar.map(entry => {
        const isExpanded = expandedMonth === entry.month;
        const isCurrent = currentMonth === entry.month;
        const bg = SEASON_BG[entry.seasonJa] ?? 'from-white/4 to-white/2 border-white/10';
        const accent = SEASON_ACCENT[entry.seasonJa] ?? 'text-white/70';

        return (
          <div
            key={entry.month}
            className={cn(
              'rounded-2xl border bg-gradient-to-br overflow-hidden transition-all',
              bg,
              isCurrent && 'ring-1 ring-white/20',
            )}
          >
            {/* Month header — tap to expand */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5 min-h-[52px]"
              onClick={() => setExpandedMonth(isExpanded ? -1 : entry.month)}
            >
              {/* Month number */}
              <div className={cn('text-2xl font-black leading-none w-9 shrink-0', accent)}>
                {entry.month}
              </div>

              {/* Month + season label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white/90 font-bold text-sm">{entry.monthJa}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/15 border border-white/20 rounded-full text-white/70">
                      今月
                    </span>
                  )}
                  <span className={cn('text-[10px] font-bold', accent)}>{entry.seasonJa}</span>
                </div>
                {/* Preview of top constellation names */}
                <div className="text-white/35 text-[10px] truncate mt-0.5">
                  {entry.top3.map(v => v.constellation.nameJa).join(' · ')}
                </div>
              </div>

              {/* Event count badge + chevron */}
              <div className="flex items-center gap-2 shrink-0">
                {entry.events.length > 0 && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-900/40 border border-amber-500/30 rounded-full">
                    <span className="text-[9px] text-amber-300 font-bold">☄️ {entry.events.length}</span>
                  </div>
                )}
                <ChevronLeft
                  size={14}
                  className={cn('text-white/30 transition-transform', isExpanded ? '-rotate-90' : 'rotate-180')}
                />
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-3">

                {/* Top 3 constellations */}
                <div>
                  <div className={cn('text-[10px] font-bold tracking-widest uppercase mb-2', accent)}>
                    ⭐ おすすめ Top 3 星座
                  </div>
                  <div className="space-y-2">
                    {entry.top3.map((v, idx) => {
                      const meta = getConstellationMeta(v.constellation.id);
                      const seasonColor = meta ? SEASON_COLORS[meta.season] : '#ffffff';
                      return (
                        <button
                          key={v.constellation.id}
                          onClick={() => onOpenEncyclopedia(v.constellation.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl active:bg-white/10 text-left min-h-[52px]"
                        >
                          {/* Rank badge */}
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{ background: `${seasonColor}28`, color: seasonColor, border: `1px solid ${seasonColor}50` }}
                          >
                            {idx + 1}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white/90 font-bold text-sm">{v.constellation.nameJa}</span>
                              <span className="text-white/30 text-[10px] font-mono">{v.constellation.abbr}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                                <Clock size={8} className="shrink-0" />
                                {transitLabel} {v.transitJST}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                                <ArrowUp size={8} className="shrink-0" />
                                {v.culminAlt}°
                              </div>
                              <EasyRating rating={v.easyRating} />
                            </div>
                            {meta && (
                              <p className="text-white/40 text-[10px] leading-snug mt-1 line-clamp-1">
                                {meta.sightingTip}
                              </p>
                            )}
                          </div>

                          {/* Encyclopedia link */}
                          <div className="shrink-0 text-white/25">
                            <ExternalLink size={12} />
                          </div>
                        </button>
                      );
                    })}
                    {entry.top3.length === 0 && (
                      <div className="text-white/30 text-xs text-center py-3">
                        この月は観察しやすい星座が少ない時期です
                      </div>
                    )}
                  </div>
                </div>

                {/* Astronomical events */}
                {entry.events.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase mb-2 text-amber-300/70">
                      ✨ 天文現象・イベント
                    </div>
                    <div className="space-y-2">
                      {entry.events.map((ev, i) => (
                        <div
                          key={i}
                          className="flex gap-3 px-3 py-2.5 bg-amber-950/25 border border-amber-500/20 rounded-xl"
                        >
                          <div className="text-xl shrink-0 leading-none pt-0.5">{ev.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-amber-200/90 font-bold text-sm">{ev.nameJa}</span>
                            </div>
                            <div className="text-amber-300/50 text-[10px] font-mono mt-0.5">{ev.dateHintJa}</div>
                            <p className="text-white/50 text-[11px] leading-relaxed mt-1">{ev.descJa}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Season summary bar ────────────────────────────────────────────────────────
function getSeasonLabel(date: Date): string {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5)  return '春';
  if (m >= 6 && m <= 8)  return '夏';
  if (m >= 9 && m <= 11) return '秋';
  return '冬';
}

// ── Location Presets ──────────────────────────────────────────────────────────
interface LocationPreset {
  id: string;
  nameJa: string;
  flag: string;
  latDeg: number;
  latLabel: string;   // e.g. "北緯35°"
  circumpolarNote: string; // label for circumpolar section
}

const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'japan',
    nameJa: '日本',
    flag: '🇯🇵',
    latDeg: 35,
    latLabel: '北緯35°',
    circumpolarNote: '北緯35°以上でつねに地平線上',
  },
  {
    id: 'nordic',
    nameJa: '北欧',
    flag: '🇸🇪',
    latDeg: 60,
    latLabel: '北緯60°',
    circumpolarNote: '北緯60°以上でつねに地平線上',
  },
  {
    id: 'uk',
    nameJa: 'イギリス',
    flag: '🇬🇧',
    latDeg: 52,
    latLabel: '北緯52°',
    circumpolarNote: '北緯52°以上でつねに地平線上',
  },
  {
    id: 'hawaii',
    nameJa: 'ハワイ',
    flag: '🌺',
    latDeg: 21,
    latLabel: '北緯21°',
    circumpolarNote: '北緯21°以上でつねに地平線上',
  },
  {
    id: 'equator',
    nameJa: '赤道',
    flag: '🌍',
    latDeg: 0,
    latLabel: '赤道（0°）',
    circumpolarNote: '赤道では周極星座なし',
  },
  {
    id: 'australia',
    nameJa: 'オーストラリア',
    flag: '🇦🇺',
    latDeg: -33,
    latLabel: '南緯33°',
    circumpolarNote: '南緯33°以南でつねに地平線上',
  },
];

// ── Location Selector ─────────────────────────────────────────────────────────
interface LocationSelectorProps {
  selected: LocationPreset;
  onSelect: (preset: LocationPreset) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-violet-950/50 border border-violet-500/30 rounded-2xl active:bg-violet-900/50 min-h-[48px]"
      >
        <MapPin size={14} className="text-violet-300 shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[10px] text-violet-300/60 font-bold tracking-widest uppercase">観察地点</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-white/90 font-bold text-sm">{selected.nameJa}</span>
            <span className="text-violet-300/60 text-[10px] font-mono">({selected.latLabel})</span>
          </div>
        </div>
        <ChevronLeft
          size={14}
          className={cn('text-white/30 transition-transform shrink-0', open ? 'rotate-90' : '-rotate-90')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-1.5 rounded-2xl border border-violet-500/25 bg-[#0a0515]/95 backdrop-blur-lg overflow-hidden shadow-xl z-10 relative">
          {LOCATION_PRESETS.map(preset => {
            const isSelected = preset.id === selected.id;
            return (
              <button
                key={preset.id}
                onClick={() => { onSelect(preset); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5 min-h-[52px] border-b border-white/5 last:border-0',
                  isSelected ? 'bg-violet-900/40' : 'bg-transparent',
                )}
              >
                <span className="text-xl leading-none shrink-0">{preset.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white/90 font-bold text-sm">{preset.nameJa}</div>
                  <div className="text-white/40 text-[10px] font-mono">{preset.latLabel}</div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
interface NightSkyGuideProps {
  onExit: () => void;
  onOpenEncyclopedia: () => void;
  onSwitchSystem: (id: string) => void;
}

type Tab = 'tonight' | 'calendar';

export const NightSkyGuide: React.FC<NightSkyGuideProps> = ({
  onExit, onOpenEncyclopedia, onSwitchSystem,
}) => {
  const today = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<Tab>('tonight');
  const [location, setLocation] = useState<LocationPreset>(LOCATION_PRESETS[0]);

  const result = useMemo(
    () => computeNightSky(CONSTELLATIONS, today, location.latDeg),
    [today, location.latDeg],
  );
  const moon = useMemo(() => computeMoonPhase(today), [today]);
  const planets = useMemo(() => computePlanetsTonight(today), [today]);
  const annualCalendar = useMemo(
    () => computeAnnualCalendar(CONSTELLATIONS, today.getFullYear(), location.latDeg),
    [today, location.latDeg],
  );

  const season = getSeasonLabel(today);
  const currentMonth = today.getMonth() + 1;

  // How many of top5 have linked systems visible tonight?
  const linkedTonight = result.top5.filter(v => !!v.constellation.linkedSystemId);

  // Visible planets tonight (not hidden)
  const visiblePlanets = planets.filter(p => p.visibility !== 'hidden');

  const handleSwitchSystem = (systemId: string) => {
    onSwitchSystem(systemId);
    onExit();
  };

  // Open encyclopedia — optionally navigate to a specific constellation
  const handleOpenEncyclopedia = (_conId?: string) => {
    onOpenEncyclopedia();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#020408] overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-white/10 active:bg-white/20 backdrop-blur-md border border-white/15 rounded-full text-white/80 text-sm font-medium transition-all active:scale-95 shrink-0"
          >
            <ChevronLeft size={18} />
            戻る
          </button>
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-sky-300" />
            <span className="text-white/90 font-bold tracking-widest text-xs">星空ガイド</span>
          </div>
          <div className="px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px] flex items-center shrink-0">
            <span className="text-sky-300 text-xs font-mono">{formatDateJa(today)}</span>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="mx-4 mb-3 flex gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab('tonight')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all min-h-[44px]',
              activeTab === 'tonight'
                ? 'bg-sky-800/70 border border-sky-500/40 text-sky-200'
                : 'text-white/40 active:bg-white/5',
            )}
          >
            <Moon size={14} />
            今夜
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all min-h-[44px]',
              activeTab === 'calendar'
                ? 'bg-indigo-800/70 border border-indigo-500/40 text-indigo-200'
                : 'text-white/40 active:bg-white/5',
            )}
          >
            <CalendarDays size={14} />
            年間カレンダー
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">

        {/* ══════════ TONIGHT TAB ══════════ */}
        {activeTab === 'tonight' && (
          <div className="space-y-5">
            {/* Location selector */}
            <LocationSelector selected={location} onSelect={setLocation} />

            {/* Season context bar */}
            <div className="px-4 py-2.5 bg-indigo-950/50 border border-indigo-500/20 rounded-2xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-indigo-200/70 leading-relaxed">
                  <span className="text-indigo-300 font-bold">{season}の夜空</span>
                  {' '}·{' '}{location.flag} {location.nameJa}（{location.latLabel}）
                  {' '}· 日没後〜夜明け前の観察に最適な時間帯
                  {location.latDeg < 0 && (
                    <span className="text-violet-300/80"> · 北の空が正面（南半球モード）</span>
                  )}
                </div>
                {linkedTonight.length > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-green-900/40 border border-green-500/30 rounded-full">
                    <Telescope size={10} className="text-green-300" />
                    <span className="text-[10px] text-green-300 font-bold">
                      探索可能な星系が{linkedTonight.length}つ今夜見える！
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Hemisphere orientation banner ── */}
            {location.latDeg < 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-violet-950/50 border border-violet-400/25 rounded-2xl">
                <div className="text-xl shrink-0">🧭</div>
                <div>
                  <div className="text-violet-200 text-xs font-bold">南半球モード：北の空が正面</div>
                  <p className="text-violet-300/60 text-[10px] leading-snug mt-0.5">
                    南緯では星は北の空を通って最高点（北中）に達します。星座の高度は北向きで最大になります。
                  </p>
                </div>
              </div>
            )}

            {/* ── Moon Phase ── */}
            <MoonPhaseCard moon={moon} />

            {/* ── Planets Tonight ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-white/80 text-sm font-bold">今夜の惑星</h2>
                <span className="text-white/30 text-[10px]">
                  {visiblePlanets.length > 0
                    ? `${visiblePlanets.length}つの惑星が観察可能`
                    : '今夜は惑星の好機なし'}
                </span>
              </div>
              <div className="space-y-2">
                {planets.map(planet => (
                  <PlanetRow
                    key={planet.id}
                    planet={planet}
                    onNavigate={handleSwitchSystem}
                  />
                ))}
              </div>
            </div>

            {/* ── Top 5 ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-white/80 text-sm font-bold">今夜おすすめ TOP 5</h2>
                <span className="text-white/30 text-[10px]">{location.latDeg < 0 ? '北中' : '南中'}時刻の早い順</span>
              </div>
              {result.top5.length > 0 ? (
                <div className="space-y-2.5">
                  {result.top5.map((entry, i) => (
                    <TopCard
                      key={entry.constellation.id}
                      entry={entry}
                      rank={i + 1}
                      latDeg={location.latDeg}
                      onOpenEncyclopedia={() => handleOpenEncyclopedia()}
                      onSwitchSystem={handleSwitchSystem}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-10 text-white/30 text-sm">
                  データを計算中...
                </div>
              )}
            </div>

            {/* ── Circumpolar ── */}
            {result.circumpolar.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-white/80 text-sm font-bold">周極星座（年中見える）</h2>
                  <span className="text-white/30 text-[10px]">{location.circumpolarNote}</span>
                </div>
                <div className="space-y-1.5">
                  {result.circumpolar.map(entry => (
                    <CircumpolarRow
                      key={entry.constellation.id}
                      entry={entry}
                      onOpenEncyclopedia={() => handleOpenEncyclopedia()}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Educational note ── */}
            <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl px-4 py-3.5 space-y-1.5">
              <h3 className="text-amber-300/80 text-xs font-bold tracking-widest uppercase">📖 星座と季節の関係</h3>
              <p className="text-white/60 text-xs leading-relaxed">
                地球が太陽の周りを公転するにつれ、夜に見える星座は少しずつ変わります。
                今夜見えている星座は、半年後の昼間（太陽の反対方向）にある星座です。
                一つの星座が「見ごろ」を迎えるのは、地球が公転して丁度その星座と正対する時季です。
              </p>
              <p className="text-white/60 text-xs leading-relaxed">
                {location.latDeg < 0
                  ? `北中時刻は毎日約4分ずつ早まります（年間で一周）。今夜の「北中」が深夜の星座も、1か月後には夜9時ごろに北中し、より観察しやすくなります。`
                  : `南中時刻は毎日約4分ずつ早まります（年間で一周）。今夜の「南中」が深夜の星座も、1か月後には夜9時ごろに南中し、より観察しやすくなります。`
                }
              </p>
            </div>

            {/* ── Observation tips ── */}
            <div className="bg-slate-900/50 border border-white/8 rounded-2xl px-4 py-3.5">
              <h3 className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2">🔭 観察のポイント</h3>
              <ul className="space-y-1.5 text-white/50 text-xs">
                <li>• 光害の少ない場所を選ぶと、より多くの星が見える</li>
                <li>• 目が暗さに慣れるまで20〜30分かかる（スマホの画面は最小輝度に）</li>
                <li>• {location.latDeg < 0 ? '北中' : '南中'}前後の1〜2時間が最も高く見えて観察しやすい</li>
                <li>• 双眼鏡（7×50程度）があると星団・星雲まで楽しめる</li>
              </ul>
            </div>
          </div>
        )}

        {/* ══════════ ANNUAL CALENDAR TAB ══════════ */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            {/* Calendar intro */}
            <div className="px-4 py-3 bg-indigo-950/50 border border-indigo-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <CalendarDays size={20} className="text-indigo-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-indigo-200 font-bold text-sm mb-1">12ヶ月の星空変化</div>
                  <p className="text-indigo-300/60 text-[11px] leading-relaxed">
                    各月をタップして、おすすめ星座と天文イベントを確認しよう。
                    星座名をタップすると図鑑に移動します。
                  </p>
                </div>
              </div>
            </div>

            <AnnualCalendar
              calendar={annualCalendar}
              currentMonth={currentMonth}
              latDeg={location.latDeg}
              onOpenEncyclopedia={() => handleOpenEncyclopedia()}
            />

            {/* Footer note */}
            <div className="bg-slate-900/40 border border-white/6 rounded-2xl px-4 py-3">
              <p className="text-white/35 text-[10px] leading-relaxed text-center">
                ※ 見ごろ計算は {location.flag} {location.nameJa}（{location.latLabel}）を基準に、各月15日の午前0時で算出。
                {location.latDeg < 0 ? '北中' : '南中'}時刻は現地の天候・地形により異なります。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
