import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CelestialBody } from '../data/celestialBodies';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { StampRallyState } from '../hooks/useStampRally';
import { BODY_STAMP_TRIGGERS, pickQuiz, QuizQuestion } from '../data/stampData';
import { useNoaaSpaceWeather } from '../hooks/useNoaaSpaceWeather';
import { cn } from '@/lib/utils';
import { X, Footprints, Swords, ChevronLeft, ChevronDown, HelpCircle, CheckCircle, XCircle, Layers, Thermometer } from 'lucide-react';

// ── Moon phase & rise/set utilities ──────────────────────────────────────────
function getMoonPhaseInfo(now: Date): { phaseJa: string; emoji: string } {
  const knownNew = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const lunation = 29.53058867;
  const p = (((now.getTime() - knownNew.getTime()) / 86400000 % lunation) + lunation) % lunation;
  const pn = p / lunation;
  const emoji  = pn < 0.0625||pn>=0.9375 ? '🌑' : pn<0.1875 ? '🌒' : pn<0.3125 ? '🌓' :
                 pn < 0.4375 ? '🌔' : pn<0.5625 ? '🌕' : pn<0.6875 ? '🌖' : pn<0.8125 ? '🌗' : '🌘';
  const phaseJa = pn < 0.0625||pn>=0.9375 ? '新月' : pn<0.1875 ? '三日月' : pn<0.3125 ? '上弦の月' :
                  pn < 0.4375 ? '十三夜'  : pn<0.5625 ? '満月'  : pn<0.6875 ? '居待ち月':
                  pn < 0.8125 ? '下弦の月' : '有明の月';
  return { phaseJa, emoji };
}
function getMoonRiseSet(now: Date): { rise: string; set: string } {
  const knownNew = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const lunation = 29.53058867;
  const p = (((now.getTime() - knownNew.getTime()) / 86400000 % lunation) + lunation) % lunation;
  // New moon rises ~6h, advances ~48min/day, JST = UTC+9
  const riseH = ((6 + (p / lunation) * 24 + 9) % 24);
  const setH  = (riseH + 12.4) % 24;
  const fmt = (h: number) => {
    const hr = Math.floor(h), mn = Math.round((h - hr) * 60) % 60;
    return `${String(hr).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;
  };
  return { rise: fmt(riseH), set: fmt(setH) };
}

interface InfoPanelProps {
  state: SolarSystemState;
  stampRally: StampRallyState;
  onStampEarned?: (constellationId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ── Quiz sub-component ────────────────────────────────────────────────────────
interface QuizWidgetProps {
  quiz: QuizQuestion;
  onCorrect: () => void;
  onReset: () => void;
}
type QuizPhase = 'idle' | 'answering' | 'correct' | 'wrong';

const QuizWidget: React.FC<QuizWidgetProps> = ({ quiz, onCorrect, onReset }) => {
  const [phase, setPhase] = useState<QuizPhase>('answering');
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);

  const handleChoice = useCallback((idx: number) => {
    if (phase !== 'answering') return;
    setChosenIdx(idx);
    if (idx === quiz.correctIndex) {
      setPhase('correct');
      onCorrect();
    } else {
      setPhase('wrong');
    }
  }, [phase, quiz.correctIndex, onCorrect]);

  return (
    <div className="bg-indigo-950/60 border border-indigo-400/30 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <HelpCircle size={16} className="text-indigo-300 shrink-0 mt-0.5" />
        <p className="text-white/85 text-sm leading-relaxed font-medium">{quiz.question}</p>
      </div>

      <div className="space-y-2">
        {quiz.choices.map((choice, i) => {
          const isCorrect = i === quiz.correctIndex;
          const isChosen = i === chosenIdx;
          let btnClass = 'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px] border ';
          if (phase === 'answering') {
            btnClass += 'bg-white/5 border-white/10 text-white/80 active:bg-indigo-800/50';
          } else if (isCorrect) {
            btnClass += 'bg-green-900/50 border-green-500/50 text-green-200';
          } else if (isChosen) {
            btnClass += 'bg-red-900/40 border-red-500/40 text-red-200';
          } else {
            btnClass += 'bg-white/3 border-white/6 text-white/30';
          }

          return (
            <button key={i} className={btnClass} onClick={() => handleChoice(i)} disabled={phase !== 'answering'}>
              <span className="flex items-center gap-2">
                {phase !== 'answering' && isCorrect && <CheckCircle size={14} className="text-green-400 shrink-0" />}
                {phase !== 'answering' && isChosen && !isCorrect && <XCircle size={14} className="text-red-400 shrink-0" />}
                {choice}
              </span>
            </button>
          );
        })}
      </div>

      {phase === 'correct' && (
        <div className="flex items-center gap-2 text-green-300 text-sm font-bold">
          <span>🎉 正解！スタンプをゲットしました！</span>
        </div>
      )}
      {phase === 'wrong' && (
        <div className="flex flex-col gap-2">
          <p className="text-red-300 text-sm">😢 残念！もう一度チャレンジしてみよう</p>
          <button
            onClick={onReset}
            className="text-xs text-indigo-300 underline"
          >
            別の問題に挑戦する
          </button>
        </div>
      )}
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string; unit?: string }> = ({ label, value, unit }) => (
  <div className="flex justify-between items-baseline py-1.5 border-b border-white/5">
    <span className="text-white/50 text-xs font-mono tracking-wider">{label}</span>
    <span className="text-white/90 text-sm font-mono">
      {value}
      {unit && <span className="text-white/40 text-xs ml-1">{unit}</span>}
    </span>
  </div>
);

function formatMass(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(0)}k`;
  if (m >= 1) return m.toFixed(2);
  if (m >= 0.001) return m.toFixed(4);
  return m.toExponential(2);
}
function formatTemp(t: number): string { return `${t > 0 ? '+' : ''}${t}°C`; }
function formatPeriod(y: number): string {
  if (y === 0) return '—';
  if (y >= 1) return `${y.toFixed(2)} 年`;
  if (y * 365.25 >= 1) return `${(y * 365.25).toFixed(1)} 日`;
  return `${(y * 365.25 * 24).toFixed(1)} 時間`;
}
function formatRotation(h: number): string {
  const a = Math.abs(h);
  const r = h < 0 ? '（逆）' : '';
  if (a >= 24) return `${(a / 24).toFixed(2)} 日${r}`;
  return `${a.toFixed(2)} 時間${r}`;
}
function formatDistance(au: number): string {
  if (au === 0) return '中心星';
  if (au < 0.01) return `${(au * 149_597_871).toFixed(0)} km`;
  if (au < 0.1) return `${(au * 149_597_871 / 1000).toFixed(0)}万 km`;
  return `${au.toFixed(4)} AU`;
}
function typeIcon(t: string): string {
  switch (t) {
    case 'STAR': return '⭐';
    case 'ROCKY': return '🪨';
    case 'GAS_GIANT': return '🌀';
    case 'ICE_GIANT': return '🧊';
    case 'DWARF_PLANET': return '🔵';
    case 'MOON': return '🌕';
    case 'ASTEROID_BELT': return '🪨';
    case 'COMET': return '☄️';
    case 'STATION': return '🛸';
    case 'SATELLITE': return '🛰️';
    default: return '🌍';
  }
}

// Immutable quiz session — constellation ID is locked in when quiz starts,
// so switching bodies mid-quiz cannot award the wrong stamp.
interface QuizSession {
  question: QuizQuestion;
  constellationId: string;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ state, stampRally, onStampEarned, collapsed = false, onToggleCollapse }) => {
  const body = state.selectedBody;
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizKey, setQuizKey] = useState(0);

  // Reset quiz whenever the selected body changes
  const bodyId = body?.id ?? null;
  useEffect(() => {
    setQuizSession(null);
    setQuizKey(k => k + 1);
  }, [bodyId]);

  // Award is always bound to the session's locked constellation ID — never to the current body
  // Must be before early return to satisfy Rules of Hooks
  const handleQuizCorrect = useCallback(() => {
    if (quizSession?.constellationId) {
      onStampEarned?.(quizSession.constellationId);
    }
  }, [quizSession, onStampEarned]);

  // ── #61: Solar activity (called unconditionally to satisfy Rules of Hooks) ─
  const weather = useNoaaSpaceWeather();

  // ── #48: Moon phase & rise/set ────────────────────────────────────────────
  const moonPhase   = useMemo(() => getMoonPhaseInfo(new Date()), []);
  const moonRiseSet = useMemo(() => getMoonRiseSet(new Date()), []);

  if (!body) return null;

  // Which constellation stamps does this body trigger?
  const triggerIds = BODY_STAMP_TRIGGERS[body.id] ?? [];
  // Pick first unearned constellation for quiz, or any if all earned
  const quizConstellationId = triggerIds.find(id => !stampRally.hasStamp(id)) ?? triggerIds[0] ?? null;
  const hasQuiz = quizConstellationId !== null;

  const handleShowQuiz = () => {
    if (!quizConstellationId) return;
    const q = pickQuiz(quizConstellationId);
    if (!q) return;
    setQuizSession({ question: q, constellationId: quizConstellationId });
    setQuizKey(k => k + 1);
  };

  const handleQuizReset = () => {
    if (!quizConstellationId) return;
    const q = pickQuiz(quizConstellationId);
    if (!q) return;
    setQuizSession({ question: q, constellationId: quizConstellationId });
    setQuizKey(k => k + 1);
  };

  const isVisible  = state.viewMode === 'detail' || state.selectedBodyId !== null;
  const isExo      = state.currentSystemId !== 'solar-system';
  // Translate class: hidden → full slide-out, visible+collapsed → peek 48px, visible → normal
  const translateClass = !isVisible
    ? 'translate-y-full'
    : collapsed
      ? 'translate-y-[calc(100%-48px)]'
      : 'translate-y-0';
  const isHabitable = body.nameJa.includes('★');
  const displayName = body.nameJa.replace(' ★', '');
  const isMoonView  = state.moonDetailMode && body.type === 'MOON';
  const parentBody  = isMoonView && state.moonDetailParentId
    ? state.currentSystem.bodies.find(b => b.id === state.moonDetailParentId) ?? null
    : null;

  // Distance label depends on system
  const distLabel = isExo ? '恒星からの距離' : '太陽からの距離';

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out pointer-events-auto',
      translateClass
    )}>
      {/* Handle — tap to collapse / expand */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex flex-col items-center pt-2 pb-0.5 min-h-[48px] justify-center gap-1 active:opacity-70 transition-opacity"
        aria-label={collapsed ? '情報を表示' : '情報を隠す'}
      >
        <div className="w-10 h-1 rounded-full bg-white/25" />
        <ChevronDown
          size={14}
          className={cn(
            'text-white/35 transition-transform duration-300',
            collapsed ? 'rotate-180' : ''
          )}
        />
      </button>

      <div
        className="bg-[#080c18]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[55dvh] overflow-y-scroll"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >

        {/* ── Header ── */}
        <div className="sticky top-0 bg-[#080c18]/95 backdrop-blur-xl z-10 px-5 pt-4 pb-3 border-b border-white/8">
          {/* Moon detail: back-to-parent breadcrumb */}
          {isMoonView && parentBody && (
            <button
              onClick={state.exitMoonDetail}
              className="flex items-center gap-1 mb-2 text-sky-400/80 text-xs font-mono active:text-sky-300 transition-colors min-h-[32px]"
            >
              <ChevronLeft size={14} />
              <span>{parentBody.nameJa}の衛星</span>
            </button>
          )}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-2xl">{typeIcon(body.type)}</span>
                <h2 className="text-xl font-bold text-white tracking-wide">{displayName}</h2>
                {isHabitable && (
                  <span className="px-2 py-0.5 bg-green-900/60 border border-green-500/50 rounded-full text-green-300 text-[10px] font-bold tracking-wider whitespace-nowrap">
                    🌱 ハビタブルゾーン
                  </span>
                )}
              </div>
              <div className="text-xs text-white/40 font-mono ml-10 truncate">{body.nameEn} — {body.classification}</div>
              {isExo && (
                <div className="ml-10 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-white/30 font-mono">
                    {state.currentSystem.nameJa} · 地球から {state.currentSystem.distanceLy.toLocaleString()} 光年
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={isMoonView ? state.exitMoonDetail : state.backToOverview}
              className="mt-1 ml-2 p-2.5 rounded-full bg-white/8 active:bg-white/20 text-white/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 pt-4 pb-6 space-y-4">

          {/* Star system overview (for star bodies in exo systems) */}
          {body.type === 'STAR' && isExo && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-3">
              <h3 className="text-xs text-amber-400/80 font-bold tracking-widest uppercase mb-1">この星系について</h3>
              <p className="text-white/65 text-xs leading-relaxed">{state.currentSystem.descriptionJa}</p>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white/4 rounded-2xl px-4 py-1 border border-white/8">
            {body.diameterKm > 0 && <StatRow label="直径" value={body.diameterKm.toLocaleString()} unit="km" />}
            <StatRow label="質量（地球比）" value={formatMass(body.massEarths)} unit="M⊕" />
            <StatRow label="重力（地球比）" value={body.gravityG.toFixed(3)} unit="G" />
            <StatRow label="軸傾斜" value={`${Math.abs(body.axialTiltDeg).toFixed(2)}`} unit="°" />
            <StatRow label="自転周期" value={formatRotation(body.rotationPeriodHours)} />
            {body.distanceAU > 0 && body.distanceAU < 10_000 && (
              <StatRow label={distLabel} value={formatDistance(body.distanceAU)} />
            )}
            {body.orbitalPeriodYears > 0 && (
              <StatRow label="公転周期" value={formatPeriod(body.orbitalPeriodYears)} />
            )}
            <StatRow label="表面温度（平均）" value={formatTemp(body.surfaceTempC.avg)} />
            <StatRow label="表面温度（最大）" value={formatTemp(body.surfaceTempC.max)} />
            {body.moonCount > 0 && <StatRow label="衛星数" value={`${body.moonCount}`} unit="個" />}
          </div>

          {/* Facts */}
          <div>
            <h3 className="text-xs text-amber-400/80 font-bold tracking-widest uppercase mb-2">豆知識</h3>
            <div className="space-y-2">
              {body.facts.map((fact, i) => (
                <div key={i} className="flex gap-3 bg-white/3 rounded-xl p-3 border border-white/6">
                  <span className="text-amber-400 font-bold text-sm mt-0.5 shrink-0">{i + 1}</span>
                  <p className="text-white/75 text-sm leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Children (moons / sub-bodies) */}
          {body.children && body.children.length > 0 && (
            <div>
              <h3 className="text-xs text-sky-400/80 font-bold tracking-widest uppercase mb-2">
                {body.type === 'STAR' ? '惑星' : '主要衛星'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {body.children.map(child => (
                  <button
                    key={child.id}
                    onClick={() =>
                      body.type === 'STAR'
                        ? state.enterDetail(child.id)
                        : state.enterMoonDetail(child.id, body.id)
                    }
                    className="px-3 py-2 bg-sky-900/30 border border-sky-500/30 rounded-full text-sky-200 text-xs font-mono active:bg-sky-800/40 transition-colors min-h-[36px]"
                  >
                    {typeIcon(child.type)} {child.nameJa.replace(' ★', '')}
                    {child.nameJa.includes('★') && <span className="ml-1 text-green-400">★</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── #61 Solar activity panel ── */}
          {body.id === 'sun' && (
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-4">
              <h3 className="text-xs text-orange-400/80 font-bold tracking-widest uppercase mb-3">🌞 現在の太陽活動</h3>
              <div className="divide-y divide-white/5">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">フレアレベル</span>
                  <span className={[
                    'text-xs font-bold font-mono px-2 py-0.5 rounded-full',
                    weather.activityLevel > 0.8 ? 'bg-red-500/30 text-red-300'    :
                    weather.activityLevel > 0.5 ? 'bg-orange-500/30 text-orange-300' :
                    weather.activityLevel > 0.3 ? 'bg-yellow-500/30 text-yellow-300' :
                                                   'bg-green-500/30 text-green-300',
                  ].join(' ')}>
                    {weather.loading ? '読み込み中…' : weather.label}
                  </span>
                </div>
                {!weather.loading && weather.flareClass !== '?' && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-white/50 text-xs font-mono">X線フラックス</span>
                    <span className="text-orange-200 text-xs font-mono">{weather.fluxWm2.toExponential(1)} W/m²</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">活動周期</span>
                  <span className="text-white/70 text-xs font-mono">第25周期（2019年〜）</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">次の極大期予測</span>
                  <span className="text-yellow-300/80 text-xs font-mono">2025年頃（ピーク越え）</span>
                </div>
              </div>
              {weather.timeTag && (
                <p className="text-white/20 text-[9px] font-mono mt-2">
                  更新: {new Date(weather.timeTag).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })} UTC
                </p>
              )}
            </div>
          )}

          {/* ── #59 Saturn ring timing ── */}
          {body.id === 'saturn' && (
            <div className="bg-sky-900/20 border border-sky-500/30 rounded-2xl p-4">
              <h3 className="text-xs text-sky-400/80 font-bold tracking-widest uppercase mb-3">💍 土星の輪カレンダー</h3>
              <div className="divide-y divide-white/5">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">現在の輪の傾き</span>
                  <span className="text-sky-300 text-xs font-bold font-mono">~5°（edge-on 後）</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">edge-on（輪消失）</span>
                  <span className="text-white/45 text-xs font-mono">2025年3月（通過済み）</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">次の最良シーズン</span>
                  <span className="text-yellow-300 text-xs font-bold font-mono">2032年頃（26.7°）</span>
                </div>
              </div>
              <p className="text-white/40 text-xs leading-relaxed mt-3">
                2025年3月に輪が地球方向でほぼ真横になりました。今後ゆっくり開き始め、2032年頃に最大傾角26.7°となり最高の見ごろを迎えます。
              </p>
            </div>
          )}

          {/* ── #48 Moon rise / set ── */}
          {body.id === 'moon' && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-4">
              <h3 className="text-xs text-indigo-400/80 font-bold tracking-widest uppercase mb-3">🌙 今日の月の情報</h3>
              <div className="divide-y divide-white/5">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">今日の月相</span>
                  <span className="text-white/80 text-xs font-bold">{moonPhase.emoji} {moonPhase.phaseJa}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">月の出（東京）</span>
                  <span className="text-amber-300 text-xs font-bold font-mono">{moonRiseSet.rise}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50 text-xs font-mono">月の入り（東京）</span>
                  <span className="text-sky-300 text-xs font-bold font-mono">{moonRiseSet.set}</span>
                </div>
              </div>
              <p className="text-white/20 text-[9px] mt-2">※平均軌道による概算。地域・地形で実際の時刻は異なります。</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-1">
            {/* ── Venus surface mode toggle ── */}
            {body.id === 'venus' && (
              <button
                onClick={() => {
                  const current = state.bodyViewModes?.['venus'] ?? 'default';
                  state.setBodyViewMode('venus', current === 'surface' ? 'default' : 'surface');
                }}
                className={[
                  'w-full py-3.5 border rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]',
                  (state.bodyViewModes?.['venus'] === 'surface')
                    ? 'bg-orange-700/60 border-orange-400/60 text-orange-200 active:bg-orange-600/70'
                    : 'bg-yellow-900/40 border-yellow-500/40 text-yellow-200 active:bg-yellow-800/50',
                ].join(' ')}
              >
                <Layers size={16} />
                {(state.bodyViewModes?.['venus'] === 'surface')
                  ? '雲の表示に戻す'
                  : 'マゼラン レーダー地形を表示'}
              </button>
            )}
            {/* ── Titan infrared mode toggle ── */}
            {body.id === 'titan' && (
              <button
                onClick={() => {
                  const current = state.bodyViewModes?.['titan'] ?? 'default';
                  state.setBodyViewMode('titan', current === 'infrared' ? 'default' : 'infrared');
                }}
                className={[
                  'w-full py-3.5 border rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]',
                  (state.bodyViewModes?.['titan'] === 'infrared')
                    ? 'bg-amber-700/60 border-amber-400/60 text-amber-200 active:bg-amber-600/70'
                    : 'bg-orange-900/40 border-orange-500/40 text-orange-200 active:bg-orange-800/50',
                ].join(' ')}
              >
                <Thermometer size={16} />
                {(state.bodyViewModes?.['titan'] === 'infrared')
                  ? '可視光表示に戻す'
                  : 'カッシーニ 赤外線地形を表示'}
              </button>
            )}
            {body.canLand && state.currentSystemId === 'solar-system' && (
              <>
                <button
                  onClick={() => state.activateDeiland(body.id)}
                  className="w-full py-3.5 bg-emerald-900/50 active:bg-emerald-800/70 border border-emerald-500/50 rounded-2xl text-emerald-200 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]"
                >
                  <Footprints size={16} />
                  {displayName}の表面を探索する
                </button>
                {/* ── Civilisation summary (shown after first visit) ── */}
                {(() => {
                  const ds = state.deilandSaves?.[body.id];
                  if (!ds) return null;
                  return (
                    <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl px-4 py-3">
                      <div className="text-emerald-400/80 text-xs tracking-widest font-mono mb-2">🏗️ 惑星文明サマリー</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className="text-white/50">文明レベル</span>
                        <span className="text-emerald-300 font-bold">Lv.{ds.civLevel}</span>
                        <span className="text-white/50">木の本数</span>
                        <span className="text-emerald-300">{ds.treeCount} 本</span>
                        <span className="text-white/50">建設物</span>
                        <span className="text-white/80">{ds.buildings.length} 棟</span>
                        {ds.foodCount > 0 && (
                          <>
                            <span className="text-white/50">食料収穫</span>
                            <span className="text-yellow-300">{ds.foodCount} 食</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
            {body.hasAsteroids && (
              <button
                onClick={state.promptShooter}
                className="w-full py-3.5 bg-cyan-900/50 active:bg-cyan-800/70 border border-cyan-500/50 rounded-2xl text-cyan-200 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]"
              >
                <Swords size={16} />
                小惑星帯を突破する
              </button>
            )}
            {/* ── Quiz button ── */}
            {hasQuiz && !quizSession && (
              <button
                onClick={handleShowQuiz}
                className="w-full py-3.5 bg-indigo-900/50 active:bg-indigo-800/70 border border-indigo-500/50 rounded-2xl text-indigo-200 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]"
              >
                <HelpCircle size={16} />
                ⭐ 星座クイズでスタンプをゲット！
              </button>
            )}
          </div>

          {/* ── Quiz widget — session is immutable: constellation ID locked at start ── */}
          {quizSession && (
            <QuizWidget
              key={quizKey}
              quiz={quizSession.question}
              onCorrect={handleQuizCorrect}
              onReset={handleQuizReset}
            />
          )}
        </div>
      </div>
    </div>
  );
};
