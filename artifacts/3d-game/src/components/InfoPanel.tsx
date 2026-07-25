import React from 'react';
import { CelestialBody } from '../data/celestialBodies';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { cn } from '@/lib/utils';
import { X, Footprints, Swords, ChevronDown } from 'lucide-react';

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

function formatMass(massEarths: number): string {
  if (massEarths >= 1000) return `${(massEarths / 1000).toFixed(0)}k`;
  if (massEarths >= 1) return `${massEarths.toFixed(2)}`;
  if (massEarths >= 0.001) return `${massEarths.toFixed(4)}`;
  return `${massEarths.toExponential(2)}`;
}

function formatTemp(t: number): string {
  return `${t > 0 ? '+' : ''}${t}°C`;
}

function formatPeriod(years: number): string {
  if (years === 0) return '—';
  if (years >= 1) return `${years.toFixed(2)} 年`;
  return `${(years * 365.25).toFixed(1)} 日`;
}

function formatRotation(hours: number): string {
  const abs = Math.abs(hours);
  const retro = hours < 0 ? '（逆）' : '';
  if (abs >= 24) return `${(abs / 24).toFixed(2)} 日${retro}`;
  return `${abs.toFixed(2)} 時間${retro}`;
}

function formatDistance(au: number): string {
  if (au === 0) return '中心';
  if (au < 0.1) return `${(au * 149_597_871).toFixed(0)} km`;
  return `${au.toFixed(3)} AU`;
}

function typeIcon(type: string): string {
  switch (type) {
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

  const isVisible = state.viewMode === 'detail' || state.selectedBodyId !== null;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out',
      isVisible ? 'translate-y-0' : 'translate-y-full'
    )}>
      {/* Handle bar */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      <div className="bg-[#080c18]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[50dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#080c18]/95 backdrop-blur-xl z-10 px-5 pt-4 pb-3 border-b border-white/8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-2xl">{typeIcon(body.type)}</span>
                <h2 className="text-2xl font-bold text-white tracking-wide">{body.nameJa}</h2>
              </div>
              <div className="text-xs text-white/40 font-mono ml-10">{body.nameEn} — {body.classification}</div>
            </div>
            <button
              onClick={state.backToOverview}
              className="mt-1 p-2 rounded-full bg-white/8 hover:bg-white/15 text-white/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-6 space-y-5">
          {/* Stats grid */}
          <div className="bg-white/4 rounded-2xl px-4 py-1 border border-white/8">
            <StatRow label="直径" value={body.diameterKm.toLocaleString()} unit="km" />
            <StatRow label="質量（地球比）" value={formatMass(body.massEarths)} unit="M⊕" />
            <StatRow label="重力（地球比）" value={`${body.gravityG.toFixed(3)}`} unit="G" />
            <StatRow label="軸傾斜" value={`${Math.abs(body.axialTiltDeg).toFixed(2)}`} unit="°" />
            <StatRow label="自転周期" value={formatRotation(body.rotationPeriodHours)} />
            {body.distanceAU > 0 && (
              <StatRow label="太陽からの距離" value={formatDistance(body.distanceAU)} />
            )}
            {body.orbitalPeriodYears > 0 && (
              <StatRow label="公転周期" value={formatPeriod(body.orbitalPeriodYears)} />
            )}
            <StatRow label="表面温度（平均）" value={formatTemp(body.surfaceTempC.avg)} />
            <StatRow label="表面温度（最大）" value={formatTemp(body.surfaceTempC.max)} />
            {body.moonCount > 0 && (
              <StatRow label="衛星数" value={`${body.moonCount}`} unit="個" />
            )}
          </div>

          {/* Facts */}
          <div>
            <h3 className="text-xs text-amber-400/80 font-bold tracking-widest uppercase mb-3">豆知識</h3>
            <div className="space-y-2.5">
              {body.facts.map((fact, i) => (
                <div key={i} className="flex gap-3 bg-white/3 rounded-xl p-3 border border-white/6">
                  <span className="text-amber-400 font-bold text-sm mt-0.5 shrink-0">{i + 1}</span>
                  <p className="text-white/75 text-sm leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Moons section */}
          {body.children && body.children.length > 0 && (
            <div>
              <h3 className="text-xs text-sky-400/80 font-bold tracking-widest uppercase mb-3">主要衛星</h3>
              <div className="flex flex-wrap gap-2">
                {body.children.map(moon => (
                  <button
                    key={moon.id}
                    onClick={() => state.selectBody(moon.id)}
                    className="px-3 py-1.5 bg-sky-900/30 border border-sky-500/30 rounded-full text-sky-200 text-xs font-mono hover:bg-sky-800/40 transition-colors"
                  >
                    🌕 {moon.nameJa}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-2">
            {body.canLand && (
              <button
                onClick={() => state.activateDeiland(body.id)}
                className="w-full py-3.5 bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-500/50 rounded-2xl text-emerald-200 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Footprints size={16} />
                {body.nameJa}の表面を探索する
              </button>
            )}
            {body.hasAsteroids && (
              <button
                onClick={state.promptShooter}
                className="w-full py-3.5 bg-cyan-900/50 hover:bg-cyan-800/70 border border-cyan-500/50 rounded-2xl text-cyan-200 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
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
