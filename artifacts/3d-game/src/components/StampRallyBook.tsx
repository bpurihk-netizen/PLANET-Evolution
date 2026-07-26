import React, { useState } from 'react';
import { X, Star, Trophy } from 'lucide-react';
import { CONSTELLATIONS } from '../data/constellations';
import { StampRallyState } from '../hooks/useStampRally';
import { cn } from '@/lib/utils';

interface StampRallyBookProps {
  stampRally: StampRallyState;
  onClose: () => void;
}

// Season groupings for constellation categories
const SEASON_GROUPS = [
  { label: '春の星座', ids: ['leo','vir','boo','cvn','com','crb','uma','lmi','cnc','her'] },
  { label: '夏の星座', ids: ['sco','sgr','lyr','cyg','aql','oph','ser','sct','crv','crt','lib','lup','ara','cor','cra','sge','vul','del','equ','sge'] },
  { label: '秋の星座', ids: ['peg','and','cas','per','ari','tri','psc','aqr','psa','cep','lac','cap','cet','for','scl','mic'] },
  { label: '冬の星座', ids: ['ori','tau','gem','aur','cma','cmi','lep','col','mon','eri','leo'] },
  { label: '南天・近代星座', ids: [] }, // catch-all
];

// Emoji icons per area (for visual variety)
function stampIcon(id: string): string {
  const icons: Record<string, string> = {
    ori: '🏹', leo: '🦁', sco: '🦂', tau: '🐂', gem: '♊',
    aqr: '🏺', psc: '🐟', cap: '🐐', sgr: '🏹', arl: '🐏',
    vir: '🌾', lib: '⚖️', cnc: '🦀', lyr: '🎵', cyg: '🦢',
    aql: '🦅', her: '💪', boo: '🌟', cen: '🐴', cru: '✝️',
    uma: '🐻', cas: '👑', per: '⚔️', peg: '🐎', and: '⛓️',
    crb: '👑', dra: '🐉', ser: '🐍', oph: '🩺', sge: '➡️',
    del: '🐬', cma: '🐕', cmi: '🐕', lep: '🐰', col: '🕊️',
    crt: '🏺', crv: '🐦', hya: '🐍', hyb: '🐍',
  };
  return icons[id] ?? '⭐';
}

const StampSlot: React.FC<{ constId: string; earned: boolean; name: string; abbr: string }> = ({ constId, earned, name, abbr }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-2xl p-1.5 gap-0.5 transition-all duration-300 relative',
      earned
        ? 'bg-gradient-to-b from-amber-500/25 to-amber-900/20 border border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.25)]'
        : 'bg-white/3 border border-white/8'
    )}
    style={{ minWidth: 0 }}
  >
    {/* Star icon */}
    <div className={cn(
      'text-lg leading-none transition-all',
      earned ? 'opacity-100' : 'opacity-20 grayscale'
    )}>
      {earned ? stampIcon(constId) : '☆'}
    </div>

    {/* Constellation name */}
    <span className={cn(
      'text-[8px] font-bold leading-tight text-center truncate w-full',
      earned ? 'text-amber-200' : 'text-white/25'
    )} style={{ fontSize: '7px' }}>
      {earned ? name.replace('座', '') : abbr}
    </span>

    {/* Earned badge */}
    {earned && (
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full flex items-center justify-center">
        <Star size={7} className="text-amber-900 fill-amber-900" />
      </div>
    )}
  </div>
);

export const StampRallyBook: React.FC<StampRallyBookProps> = ({ stampRally, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'earned' | 'missing'>('all');

  const filtered = CONSTELLATIONS.filter(c => {
    if (filter === 'earned') return stampRally.hasStamp(c.id);
    if (filter === 'missing') return !stampRally.hasStamp(c.id);
    return true;
  });

  const progressPct = (stampRally.earnedCount / stampRally.totalCount) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#05080f]/97 backdrop-blur-xl"
      style={{ touchAction: 'pan-y' }}
    >
      {/* ── Header ── */}
      <div className="flex-none px-4 pt-safe pt-4 pb-3 border-b border-white/10 bg-[#05080f]/90">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎫</span>
            <div>
              <h1 className="text-white font-bold text-base leading-tight tracking-wide">スタンプ帳</h1>
              <p className="text-white/40 text-[10px] font-mono">88星座コレクション</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/8 active:bg-white/20 text-white/60 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-amber-300 font-bold text-sm">{stampRally.earnedCount} <span className="text-white/40 text-xs font-normal">/ {stampRally.totalCount} 枚</span></span>
            <span className="text-white/40 text-[10px] font-mono">{progressPct.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* 宇宙博士バッジ */}
        {stampRally.isAllEarned && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 rounded-xl">
            <Trophy size={16} className="text-amber-300 shrink-0" />
            <span className="text-amber-200 text-xs font-bold">🏆 宇宙博士 — 全88星座制覇おめでとう！</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 mt-2">
          {(['all', 'earned', 'missing'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-full text-[10px] font-bold transition-all min-h-[28px]',
                filter === f
                  ? 'bg-amber-500/30 border border-amber-400/60 text-amber-200'
                  : 'bg-white/5 border border-white/10 text-white/40'
              )}
            >
              {f === 'all' ? `すべて(${stampRally.totalCount})` : f === 'earned' ? `取得済み(${stampRally.earnedCount})` : `未取得(${stampRally.totalCount - stampRally.earnedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stamp grid ── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm">
            {filter === 'earned' ? '🎯 まだスタンプが0枚です。星系を探索して集めよう！' : '✨ 全星座を制覇しました！'}
          </div>
        ) : (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {filtered.map(c => (
              <StampSlot
                key={c.id}
                constId={c.id}
                earned={stampRally.hasStamp(c.id)}
                name={c.nameJa}
                abbr={c.abbr}
              />
            ))}
          </div>
        )}

        {/* Hint section */}
        {stampRally.earnedCount < stampRally.totalCount && (
          <div className="mt-4 p-3 bg-white/3 rounded-2xl border border-white/8">
            <p className="text-white/50 text-[11px] font-bold mb-1.5 tracking-wider uppercase">スタンプの集め方</p>
            <ul className="space-y-1">
              {[
                '🔴 TRAPPIST-1系を探索する → うしかい座スタンプ',
                '⭐ αケンタウリ系を探索する → ケンタウルス座スタンプ',
                '🟠 ケプラー442系を探索する → こと座スタンプ',
                '☀️ 太陽系の惑星を探索する → 黄道12星座スタンプ',
                '❓ InfoPanelのクイズに正解する → 星座スタンプ',
              ].map((hint, i) => (
                <li key={i} className="text-white/40 text-[10px] leading-relaxed">{hint}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
};
