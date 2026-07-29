import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpaceShooterScene } from './SpaceShooterScene';
import { SolarSystemState } from '../../hooks/useSolarSystem';
import { loadFleetProgress, updateFleetOnVictory, updateFleetOnDefeat } from '../../hooks/useFleetProgress';

interface SpaceShooterProps {
  state: SolarSystemState;
}

// ── Bonus computation from Deiland stats ──────────────────────────────────────
function computeDeilandBonuses(stats: SolarSystemState['deilandStats']) {
  if (!stats) return { startRankBonus: 0, hpBonus: 0 };
  const startRankBonus = Math.min(10, (stats.civLevel - 1) * 2); // civLv1=0, 6=10
  const hpBonus        = Math.min(2, Math.floor(stats.foodCount / 20)); // 0/+1/+2
  return { startRankBonus, hpBonus };
}

export const SpaceShooter: React.FC<SpaceShooterProps> = ({ state }) => {
  const [fleetProgress, setFleetProgress] = useState(loadFleetProgress);
  const [showWarmup, setShowWarmup]       = useState(false);
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending warmup timer on unmount or mode change
  useEffect(() => {
    return () => {
      if (warmupTimerRef.current !== null) {
        clearTimeout(warmupTimerRef.current);
        warmupTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (state.shooterMode !== 'off') {
      setFleetProgress(loadFleetProgress());
    }
  }, [state.shooterMode]);

  const handleVictory = (killsThisBattle: number, bossKilled: boolean) => {
    const updated = updateFleetOnVictory(fleetProgress, killsThisBattle, bossKilled);
    setFleetProgress(updated);
    state.endShooter('victory');
  };

  const handleDefeat = (killsThisBattle: number) => {
    const updated = updateFleetOnDefeat(fleetProgress);
    setFleetProgress(updated);
    state.endShooter('defeat');
  };

  const { deilandStats } = state;
  const { startRankBonus, hpBonus } = computeDeilandBonuses(deilandStats);
  const effectiveStartRank = Math.max(fleetProgress.startRank, startRankBonus);
  const hasDeilandBonus    = deilandStats && (startRankBonus > 0 || hpBonus > 0);

  // Launch: show warmup for 1.5s if Deiland bonuses exist, then start game
  const handleLaunch = useCallback(() => {
    if (hasDeilandBonus) {
      setShowWarmup(true);
      warmupTimerRef.current = setTimeout(() => {
        warmupTimerRef.current = null;
        setShowWarmup(false);
        state.startShooter();
      }, 1500);
    } else {
      state.startShooter();
    }
  }, [hasDeilandBonus, state]);

  // ── Warmup overlay (shown before game starts) ─────────────────────────────
  if (showWarmup && deilandStats) {
    return (
      <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
        <div className="text-5xl mb-3 animate-bounce">🚀</div>
        <h2 className="text-2xl text-cyan-200 font-bold mb-1 text-center">
          惑星 <span className="text-yellow-300">{deilandStats.bodyNameJa}</span> の力を借りて出撃！
        </h2>
        <p className="text-white/50 text-xs mb-5 tracking-widest">DEILAND CIVILIZATION BOOST</p>
        <div className="bg-white/5 border border-cyan-600/40 rounded-2xl px-8 py-4 flex flex-col gap-3 min-w-[260px]">
          {startRankBonus > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-cyan-300 font-bold text-sm">火力ランク +{startRankBonus}</div>
                <div className="text-white/50 text-xs">文明 Lv.{deilandStats.civLevel} の恩恵</div>
              </div>
            </div>
          )}
          {hpBonus > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-2xl">❤️</span>
              <div>
                <div className="text-green-300 font-bold text-sm">HP +{hpBonus}</div>
                <div className="text-white/50 text-xs">農業収穫 {deilandStats.foodCount} 食分</div>
              </div>
            </div>
          )}
          {deilandStats.scienceLevel >= 2 && (
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔬</span>
              <div>
                <div className="text-purple-300 font-bold text-sm">武器精度アップ</div>
                <div className="text-white/50 text-xs">科学文化 Lv.{deilandStats.scienceLevel}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Prompt screen ─────────────────────────────────────────────────────────
  if (state.shooterMode === 'prompt') {
    return (
      <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-7xl mb-4 animate-bounce">🚀</div>
        <h2 className="text-3xl text-cyan-300 font-bold mb-2 text-center">小惑星帯を突破しますか？</h2>
        <p className="text-white/60 text-sm text-center mb-4 px-8 leading-relaxed">
          木星と火星の間に広がる小惑星帯で<br />迫りくる岩石を撃ち落とせ！
        </p>

        {/* Fleet status */}
        <div className="bg-white/5 border border-cyan-800/60 rounded-xl px-6 py-3 mb-3 font-mono text-sm">
          <div className="text-cyan-400/80 text-center mb-2 text-xs tracking-widest">── 艦隊ステータス ──</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-white/60">
            <span>艦隊レベル</span>
            <span className="text-cyan-300 font-bold">Lv.{fleetProgress.shipLevel}</span>
            <span>累計撃墜</span>
            <span className="text-red-300">{fleetProgress.totalKills.toLocaleString()}</span>
            <span>ボス撃破</span>
            <span className="text-purple-300">{fleetProgress.bossesDefeated}</span>
          </div>
        </div>

        {/* Deiland bonus panel (only if planet was cultivated) */}
        {hasDeilandBonus && deilandStats && (
          <div className="bg-yellow-900/20 border border-yellow-500/40 rounded-xl px-6 py-3 mb-4 font-mono text-sm min-w-[260px]">
            <div className="text-yellow-400/90 text-center mb-2 text-xs tracking-widest">
              ⚡ {deilandStats.bodyNameJa} 文明ボーナス
            </div>
            <div className="flex flex-col gap-1 text-white/70">
              {startRankBonus > 0 && (
                <div className="flex justify-between">
                  <span>🔥 火力ランク</span>
                  <span className="text-yellow-300 font-bold">+{startRankBonus} → Rank {effectiveStartRank}</span>
                </div>
              )}
              {hpBonus > 0 && (
                <div className="flex justify-between">
                  <span>❤️ 初期HP</span>
                  <span className="text-green-300 font-bold">+{hpBonus} → {3 + hpBonus}</span>
                </div>
              )}
              {deilandStats.scienceLevel >= 2 && (
                <div className="flex justify-between">
                  <span>🔬 武器精度</span>
                  <span className="text-purple-300 font-bold">+{deilandStats.scienceLevel * 5}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleLaunch}
            className="px-8 py-4 bg-cyan-600/80 hover:bg-cyan-500 border border-cyan-400 rounded-full text-white font-bold text-lg transition-all active:scale-95"
          >
            🚀 出撃！
          </button>
          <button
            onClick={state.declineShooter}
            className="px-6 py-4 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full text-white/70 font-bold transition-all active:scale-95"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  if (state.shooterMode === 'playing') {
    return (
      <SpaceShooterScene
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        civLevel={0.7}
        metallicCoreRatio={80}
        energyEfficiency={50}
        averageIntelligence={50}
        satelliteCount={0}
        startRank={effectiveStartRank}
        deilandHpBonus={hpBonus}
        temperature={-100}
        waterAmount={5}
        co2={0}
        transformation="asteroid"
      />
    );
  }

  // ── Victory ───────────────────────────────────────────────────────────────
  if (state.shooterMode === 'victory') {
    return (
      <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-7xl mb-3">🏆</div>
        <h2 className="text-4xl text-yellow-300 font-bold mb-2">突破成功！</h2>
        <div className="bg-white/5 border border-yellow-800/60 rounded-xl px-6 py-3 mb-6 font-mono text-sm">
          <div className="text-yellow-400/80 text-center mb-1 text-xs">── 艦隊成長 ──</div>
          <div className="text-center text-white/80">
            Lv.{Math.max(1, fleetProgress.shipLevel - 1)} → <span className="text-yellow-300 font-bold">Lv.{fleetProgress.shipLevel}</span>
          </div>
        </div>
        <button
          onClick={() => state.endShooter('victory')}
          className="px-8 py-3 bg-yellow-500/30 hover:bg-yellow-500/50 border border-yellow-400 rounded-full text-white font-bold transition-all"
        >
          太陽系マップに戻る
        </button>
      </div>
    );
  }

  // ── Defeat ────────────────────────────────────────────────────────────────
  if (state.shooterMode === 'defeat') {
    return (
      <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-7xl mb-3">💥</div>
        <h2 className="text-4xl text-red-400 font-bold mb-2">撃墜された...</h2>
        <button
          onClick={() => state.endShooter('defeat')}
          className="px-8 py-3 bg-red-900/30 hover:bg-red-800/50 border border-red-600 rounded-full text-white font-bold transition-all"
        >
          太陽系マップに戻る
        </button>
      </div>
    );
  }

  return null;
};
