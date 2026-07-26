import React from 'react';
import { CelestialBody } from '../data/celestialBodies';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { cn } from '@/lib/utils';
import { X, Footprints, Swords } from 'lucide-react';

interface InfoPanelProps {
  state: SolarSystemState;
}

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
    default: return '🌍';
  }
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ state }) => {
  const body = state.selectedBody;
  if (!body) return null;

  const isVisible  = state.viewMode === 'detail' || state.selectedBodyId !== null;
  const isExo      = state.currentSystemId !== 'solar-system';
  const isHabitable = body.nameJa.includes('★');
  const displayName = body.nameJa.replace(' ★', '');

  // Distance label depends on system
  const distLabel = isExo ? '恒星からの距離' : '太陽からの距離';

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out',
      isVisible ? 'translate-y-0' : 'translate-y-full'
    )}>
      {/* Handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      <div
        className="bg-[#080c18]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[55dvh] overflow-y-scroll"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        onTouchStart={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="sticky top-0 bg-[#080c18]/95 backdrop-blur-xl z-10 px-5 pt-4 pb-3 border-b border-white/8">
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
              {/* System context badge for exoplanets */}
              {isExo && (
                <div className="ml-10 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-white/30 font-mono">
                    {state.currentSystem.nameJa} · 地球から {state.currentSystem.distanceLy.toLocaleString()} 光年
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={state.backToOverview}
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

          {/* Children (moons / sub-bodies) — enterDetail so scene centres on parent */}
          {body.children && body.children.length > 0 && (
            <div>
              <h3 className="text-xs text-sky-400/80 font-bold tracking-widest uppercase mb-2">
                {body.type === 'STAR' ? '惑星' : '主要衛星'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {body.children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => state.enterDetail(child.id)}
                    className="px-3 py-2 bg-sky-900/30 border border-sky-500/30 rounded-full text-sky-200 text-xs font-mono active:bg-sky-800/40 transition-colors min-h-[36px]"
                  >
                    {typeIcon(child.type)} {child.nameJa.replace(' ★', '')}
                    {child.nameJa.includes('★') && <span className="ml-1 text-green-400">★</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-1">
            {body.canLand && state.currentSystemId === 'solar-system' && (
              <button
                onClick={() => state.activateDeiland(body.id)}
                className="w-full py-3.5 bg-emerald-900/50 active:bg-emerald-800/70 border border-emerald-500/50 rounded-2xl text-emerald-200 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]"
              >
                <Footprints size={16} />
                {displayName}の表面を探索する
              </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};
