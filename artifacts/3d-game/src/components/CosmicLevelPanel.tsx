/**
 * CosmicLevelPanel — 画面左側の6段階宇宙階層ナビゲーションパネル
 * ON/OFFトグル付き。どの画面からでも任意の階層に直接ジャンプできる。
 */
import React from 'react';
import { SolarSystemState, CosmicLevel } from '../hooks/useSolarSystem';

interface LevelDef {
  level: CosmicLevel;
  label: string;
  emoji: string;
  sub: string;
}

const LEVELS: LevelDef[] = [
  { level: 'lss',         label: '大規模構造', emoji: '🌐', sub: 'フィラメント・ボイド' },
  { level: 'supercluster',label: '超銀河団',   emoji: '🌌', sub: '数万銀河の巨大集団' },
  { level: 'cluster',     label: '銀河団',     emoji: '✨', sub: '数百〜数千の銀河' },
  { level: 'group',       label: '銀河群',     emoji: '🔭', sub: '数個〜数十の銀河' },
  { level: 'galaxy',      label: '銀河',       emoji: '🌀', sub: '数千億の恒星' },
  { level: 'system',      label: '星系',       emoji: '⭐', sub: '恒星と惑星の世界' },
];

interface Props {
  state: SolarSystemState;
  collapsed: boolean;
  onToggle: () => void;
}

export const CosmicLevelPanel: React.FC<Props> = ({ state, collapsed, onToggle }) => {
  const current = state.cosmicLevel;

  const handleClick = (level: CosmicLevel) => {
    if (level === 'system') {
      state.returnToSystemView();
    } else {
      state.goToCosmicLevel(level);
    }
  };

  const panelW = collapsed ? 'w-14' : 'w-[148px]';

  return (
    <div
      className={`absolute left-0 top-0 bottom-0 z-30 flex flex-col pointer-events-auto transition-[width] duration-200 ${panelW}`}
    >
      {/* Frosted background */}
      <div className="absolute inset-0 bg-black/72 backdrop-blur-md border-r border-white/10" />

      {/* Toggle button */}
      <div className="relative z-10 flex justify-end p-2 shrink-0">
        <button
          onClick={onToggle}
          title={collapsed ? 'ナビを開く' : 'ナビを閉じる'}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15
                     flex items-center justify-center text-white/60 text-[11px] transition-all active:scale-90"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Header label */}
      {!collapsed && (
        <div className="relative z-10 px-3 mb-2 shrink-0">
          <p className="text-white/25 text-[9px] font-mono tracking-widest uppercase">宇宙の階層</p>
        </div>
      )}

      {/* Level buttons */}
      <div className="relative z-10 flex flex-col gap-1 px-2 flex-1 overflow-y-auto">
        {LEVELS.map(({ level, label, emoji, sub }) => {
          const isActive = current === level;
          return (
            <button
              key={level}
              onClick={() => handleClick(level)}
              title={collapsed ? label : undefined}
              className={[
                'flex items-center gap-2 rounded-xl border transition-all active:scale-95 w-full text-left',
                collapsed ? 'px-2 py-3 justify-center' : 'px-2.5 py-3',
                isActive
                  ? 'bg-indigo-500/30 border-indigo-400/55 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-white/5 border-white/8 text-white/55 hover:bg-white/10 hover:text-white/80 hover:border-white/20',
              ].join(' ')}
            >
              <span className={`shrink-0 ${collapsed ? 'text-xl' : 'text-lg'}`}>{emoji}</span>
              {!collapsed && (
                <div className="min-w-0 leading-tight">
                  <div className="text-[11px] font-bold truncate">{label}</div>
                  <div className="text-[8.5px] text-white/35 truncate">{sub}</div>
                </div>
              )}
              {/* Active indicator dot */}
              {isActive && collapsed && (
                <div className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
