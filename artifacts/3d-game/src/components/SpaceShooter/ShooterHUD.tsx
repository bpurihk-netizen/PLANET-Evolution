import React from 'react';
import { ActiveEffects } from '../../hooks/useShooterState';

const RANK_NAMES = [
  '', 'SPEED UP', 'TWIN', 'MISSILE', 'SPREAD', 'LASER',
  'OPTION×1', 'OPTION×2', 'FULL BURST',
  'RIPPLE', 'BACK FIRE', 'VULCAN', 'SCATTER', 'PLASMA', 'OMEGA',
];
const RANK_COLORS = [
  '', '#22d3ee', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7',
  '#10b981', '#6366f1', '#f97316',
  '#84cc16', '#06b6d4', '#ffffff', '#f472b6', '#8b5cf6', '#ff6b6b',
];

interface ShooterHUDProps {
  playerHP: number;
  score: number;
  killCount: number;
  timeLeft: number;
  victoryKills: number;
  powerRank: number;
  specialGauge: number;
  specialAvailable: boolean;
  bossActive: boolean;
  bossHP: number;
  activeEffects: ActiveEffects;
}

const EFFECT_ICONS: { key: keyof ActiveEffects; label: string; color: string }[] = [
  { key: 'shieldTimer',     label: '🛡 シールド',  color: '#44aaff' },
  { key: 'speedBoostTimer', label: '⚡ 加速',     color: '#ffee00' },
  { key: 'scoreBoostTimer', label: '⭐ 2x得点',   color: '#ffd700' },
  { key: 'autoAimTimer',    label: '🎯 自動照準', color: '#ff6600' },
  { key: 'magnetTimer',     label: '🔮 磁力',     color: '#cc44ff' },
  { key: 'timeSlowTimer',   label: '⏳ 時間遅延', color: '#00ffcc' },
];

export const ShooterHUD: React.FC<ShooterHUDProps> = ({
  playerHP, score, killCount, timeLeft, victoryKills,
  powerRank, specialGauge, specialAvailable, bossActive, bossHP,
  activeEffects,
}) => {
  const hearts = Array.from({ length: 3 }, (_, i) => i < playerHP);
  // Show only the first 9 ranks at a time to avoid overflow
  const visibleRankStart = Math.max(0, Math.min(powerRank - 4, RANK_NAMES.length - 10));
  const visibleRanks = RANK_NAMES.slice(1).map((name, i) => ({ name, rank: i + 1 }));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col font-mono select-none">
      {/* ボスHPバー */}
      {bossActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-60 z-30 pointer-events-none">
          <div className="text-center text-[10px] text-purple-400 font-mono mb-1 drop-shadow-md">⚠ MOTHERSHIP</div>
          <div className="flex gap-2 justify-center drop-shadow-md">
            {['左エンジン', 'コア', '右エンジン'].map((label, i) => {
              const isAlive = i < bossHP;
              return (
                <div key={i}
                  className="flex-1 py-1 text-center text-[9px] font-bold rounded border transition-all"
                  style={{
                    background: isAlive ? 'rgba(150,0,255,0.3)' : 'rgba(255,0,0,0.1)',
                    borderColor: isAlive ? '#a855f7' : '#7f1d1d',
                    color: isAlive ? '#d8b4fe' : '#7f1d1d',
                    boxShadow: isAlive ? '0 0 6px #a855f7' : 'none',
                  }}>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 上部HUD */}
      <div className="flex justify-between items-start p-3">
        <div>
          <div className="text-[10px] text-cyan-400 opacity-70">SCORE</div>
          <div className="text-xl font-bold text-cyan-300">{score.toString().padStart(7, '0')}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-red-400 opacity-70">撃墜</div>
          <div className="text-lg font-bold text-red-300">{killCount} / {victoryKills}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-yellow-400 opacity-70">TIME</div>
          <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
            {timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* 撃墜進捗バー */}
      <div className="px-3">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (killCount / victoryKills) * 100)}%`,
              background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
            }}
          />
        </div>
      </div>

      {/* パワーアップバー（グラディウス風、スクロール表示） */}
      <div className="px-2 mt-2">
        <div className="flex gap-0.5 items-center overflow-hidden">
          {visibleRanks.slice(visibleRankStart, visibleRankStart + 9).map(({ name, rank }) => {
            const isActive = rank <= powerRank;
            const isCurrent = rank === powerRank;
            return (
              <div key={rank} className="flex-1 text-center py-0.5 rounded transition-all duration-300 min-w-0"
                style={{
                  background: isActive ? RANK_COLORS[rank] + '40' : 'rgba(255,255,255,0.05)',
                  border: isCurrent ? `1px solid ${RANK_COLORS[rank]}` : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isCurrent ? `0 0 8px ${RANK_COLORS[rank]}` : 'none',
                }}>
                <div className="text-[7px] font-bold leading-tight truncate"
                  style={{ color: isActive ? RANK_COLORS[rank] : 'rgba(255,255,255,0.2)' }}>
                  {name.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
        {powerRank > 0 && (
          <div className="text-center text-[10px] mt-0.5" style={{ color: RANK_COLORS[Math.min(powerRank, RANK_COLORS.length - 1)] }}>
            ▶ {RANK_NAMES[Math.min(powerRank, RANK_NAMES.length - 1)]}
          </div>
        )}
      </div>

      {/* アクティブ効果バッジ */}
      {EFFECT_ICONS.some(e => {
        const v = activeEffects[e.key];
        return typeof v === 'number' ? v > 0 : v > 0;
      }) && (
        <div className="px-2 mt-1 flex flex-wrap gap-1">
          {EFFECT_ICONS.map(({ key, label, color }) => {
            const val = activeEffects[key];
            if (typeof val !== 'number' || val <= 0) return null;
            return (
              <span key={key} className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: color + '30', border: `1px solid ${color}`, color }}>
                {label} {Math.ceil(val)}s
              </span>
            );
          })}
          {activeEffects.barrierHits > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: '#ffffff30', border: '1px solid #ffffff', color: '#ffffff' }}>
              🔰 バリア×{activeEffects.barrierHits}
            </span>
          )}
        </div>
      )}

      {/* 右サイド: 必殺ゲージ */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-auto">
        <div className="text-[9px] text-white/50 mb-1" style={{ writingMode: 'vertical-rl' }}>必殺</div>
        <div className="w-5 h-36 bg-white/10 rounded-full overflow-hidden flex flex-col-reverse border border-white/20">
          <div className="w-full rounded-full transition-all duration-500"
            style={{
              height: `${specialGauge}%`,
              background: specialAvailable
                ? 'linear-gradient(to top, #f97316, #fbbf24)'
                : 'linear-gradient(to top, #6366f1, #a855f7)',
              boxShadow: specialAvailable ? '0 0 12px #f97316' : 'none',
            }}
          />
        </div>
        {specialAvailable && (
          <div className="text-[9px] text-orange-400 animate-pulse font-bold">TAP!</div>
        )}
      </div>

      {/* 下部: HP + 操作ヒント */}
      <div className="mt-auto p-3 flex justify-between items-center">
        <div className="flex gap-1.5">
          {hearts.map((alive, i) => (
            <span key={i} className={`text-xl transition-all ${alive ? '' : 'opacity-20'}`}>
              {alive ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
        <div className="text-[9px] text-white/30 text-right leading-relaxed">
          左ドラッグ: 移動<br />
          右タップ: 必殺技
        </div>
      </div>
    </div>
  );
};
