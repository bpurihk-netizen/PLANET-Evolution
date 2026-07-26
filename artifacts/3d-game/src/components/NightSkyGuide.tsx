import React, { useMemo } from 'react';
import { ChevronLeft, Moon, Star, Telescope, Clock, ArrowUp, ExternalLink } from 'lucide-react';
import { CONSTELLATIONS } from '../data/constellations';
import { ALL_STAR_SYSTEMS } from '../data/starSystems';
import { computeNightSky, VisibleConstellation, getEasyRating } from '../utils/starVisibility';
import { CONSTELLATION_META, SEASON_COLORS, getConstellationMeta } from '../data/constellationMeta';
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
function TransitBadge({ transitJST, isPrime }: { transitJST: string; isPrime: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono',
      isPrime
        ? 'bg-sky-900/40 border border-sky-400/30 text-sky-300'
        : 'bg-white/5 border border-white/10 text-white/40',
    )}>
      <Clock size={8} />
      <span>南中 {transitJST}</span>
    </div>
  );
}

// ── Top5 Card ─────────────────────────────────────────────────────────────────
interface TopCardProps {
  entry: VisibleConstellation;
  rank: number;
  onOpenEncyclopedia: () => void;
  onSwitchSystem: (id: string) => void;
}

const TopCard: React.FC<TopCardProps> = ({ entry, rank, onOpenEncyclopedia, onSwitchSystem }) => {
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
          <TransitBadge transitJST={transitJST} isPrime={isPrimeTime} />
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/6 border border-white/10 rounded-full">
            <ArrowUp size={8} className="text-white/40" />
            <span className="text-[10px] font-mono text-white/50">最大高度 {culminAlt}°</span>
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

// ── Season summary bar ────────────────────────────────────────────────────────
function getSeasonLabel(date: Date): string {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5)  return '春';
  if (m >= 6 && m <= 8)  return '夏';
  if (m >= 9 && m <= 11) return '秋';
  return '冬';
}

// ── Main Component ────────────────────────────────────────────────────────────
interface NightSkyGuideProps {
  onExit: () => void;
  onOpenEncyclopedia: () => void;
  onSwitchSystem: (id: string) => void;
}

export const NightSkyGuide: React.FC<NightSkyGuideProps> = ({
  onExit, onOpenEncyclopedia, onSwitchSystem,
}) => {
  const today = useMemo(() => new Date(), []);
  const result = useMemo(() => computeNightSky(CONSTELLATIONS, today), [today]);

  const season = getSeasonLabel(today);

  // How many of top5 have linked systems visible tonight?
  const linkedTonight = result.top5.filter(v => !!v.constellation.linkedSystemId);

  const handleSwitchSystem = (systemId: string) => {
    onSwitchSystem(systemId);
    onExit();
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
            <span className="text-white/90 font-bold tracking-widest text-xs">今夜の星空</span>
          </div>
          <div className="px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px] flex items-center shrink-0">
            <span className="text-sky-300 text-xs font-mono">{formatDateJa(today)}</span>
          </div>
        </div>

        {/* Season context bar */}
        <div className="mx-4 mb-3 px-4 py-2.5 bg-indigo-950/50 border border-indigo-500/20 rounded-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-indigo-200/70 leading-relaxed">
              <span className="text-indigo-300 font-bold">{season}の夜空</span>
              {' '}· 日本全国（北緯35°）基準
              {' '}· 日没後〜夜明け前の観察に最適な時間帯
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
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">

        {/* ── Top 5 ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-white/80 text-sm font-bold">今夜おすすめ TOP 5</h2>
            <span className="text-white/30 text-[10px]">南中時刻の早い順</span>
          </div>
          {result.top5.length > 0 ? (
            <div className="space-y-2.5">
              {result.top5.map((entry, i) => (
                <TopCard
                  key={entry.constellation.id}
                  entry={entry}
                  rank={i + 1}
                  onOpenEncyclopedia={() => onOpenEncyclopedia()}
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
              <span className="text-white/30 text-[10px]">北緯35°以上でつねに地平線上</span>
            </div>
            <div className="space-y-1.5">
              {result.circumpolar.map(entry => (
                <CircumpolarRow
                  key={entry.constellation.id}
                  entry={entry}
                  onOpenEncyclopedia={() => onOpenEncyclopedia()}
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
            南中時刻は毎日約4分ずつ早まります（年間で一周）。
            今夜の「南中」が深夜の星座も、1か月後には夜9時ごろに南中し、より観察しやすくなります。
          </p>
        </div>

        {/* ── Observation tips ── */}
        <div className="bg-slate-900/50 border border-white/8 rounded-2xl px-4 py-3.5">
          <h3 className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2">🔭 観察のポイント</h3>
          <ul className="space-y-1.5 text-white/50 text-xs">
            <li>• 光害の少ない場所を選ぶと、より多くの星が見える</li>
            <li>• 目が暗さに慣れるまで20〜30分かかる（スマホの画面は最小輝度に）</li>
            <li>• 南中前後の1〜2時間が最も高く見えて観察しやすい</li>
            <li>• 双眼鏡（7×50程度）があると星団・星雲まで楽しめる</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
