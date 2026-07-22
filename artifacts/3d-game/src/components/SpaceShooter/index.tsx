import React, { useState, useEffect } from 'react';
import { SpaceShooterScene } from './SpaceShooterScene';
import { GameState } from '../../hooks/useGameState';
import { loadFleetProgress, updateFleetOnVictory, updateFleetOnDefeat } from '../../hooks/useFleetProgress';

interface SpaceShooterProps {
  gameState: GameState;
}

export const SpaceShooter: React.FC<SpaceShooterProps> = ({ gameState }) => {
  const [fleetProgress, setFleetProgress] = useState(loadFleetProgress);
  const activePlanet = gameState.planets[gameState.activeIndex];

  // Reload fleet progress when shooter opens
  useEffect(() => {
    if (gameState.shooterMode !== 'off') {
      setFleetProgress(loadFleetProgress());
    }
  }, [gameState.shooterMode]);

  // 勝利・敗北時に艦隊データ更新
  const handleVictory = (killsThisBattle: number, bossKilled: boolean) => {
    const updated = updateFleetOnVictory(fleetProgress, killsThisBattle, bossKilled);
    setFleetProgress(updated);
    gameState.endShooter('victory');
  };

  const handleDefeat = (killsThisBattle: number) => {
    const updated = updateFleetOnDefeat(fleetProgress);
    setFleetProgress(updated);
    gameState.endShooter('defeat');
  };

  // プロンプト画面に艦隊レベルを表示
  if (gameState.shooterMode === 'prompt') {
    return (
      <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-6xl mb-4 animate-bounce">🚀</div>
        <h2 className="text-3xl text-cyan-300 font-bold mb-3 text-center">銀河侵略を開始しますか？</h2>
        {/* 艦隊ステータス表示 */}
        <div className="bg-white/5 border border-cyan-800 rounded-xl px-6 py-3 mb-4 font-mono text-sm">
          <div className="text-cyan-400 text-center mb-2 text-xs">── 艦隊ステータス ──</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-white/70">
            <span>艦隊レベル</span><span className="text-cyan-300 font-bold">Lv.{fleetProgress.shipLevel}</span>
            <span>初期ランク</span><span className="text-yellow-300 font-bold">{fleetProgress.startRank > 0 ? ['SPEED UP','TWIN SHOT','MISSILE','SPREAD'][fleetProgress.startRank-1] : 'なし'}</span>
            <span>累計撃墜</span><span className="text-red-300">{fleetProgress.totalKills.toLocaleString()}</span>
            <span>ボス撃破</span><span className="text-purple-300">{fleetProgress.bossesDefeated}</span>
          </div>
        </div>
        <p className="text-cyan-400/80 text-xs text-center mb-6 px-8">
          20機撃墜 or 60秒生き残りで勝利 → 最終安定ルートへ<br/>
          15機でマザーシップが出現します
        </p>
        <div className="flex gap-4">
          <button onClick={gameState.startShooter}
            className="px-8 py-4 bg-cyan-600/80 hover:bg-cyan-500 border border-cyan-400 rounded-full text-white font-bold text-lg transition-all active:scale-95">
            🚀 侵略開始
          </button>
          <button onClick={gameState.declineShooter}
            className="px-6 py-4 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full text-white/70 font-bold transition-all active:scale-95">
            拒否する
          </button>
        </div>
      </div>
    );
  }

  // プレイ中画面
  if (gameState.shooterMode === 'playing') {
    return (
      <SpaceShooterScene
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        civLevel={activePlanet.stats.civLevel}
        metallicCoreRatio={activePlanet.params.metallicCoreRatio}
        energyEfficiency={activePlanet.params.energyEfficiency}
        averageIntelligence={activePlanet.params.averageIntelligence}
        satelliteCount={activePlanet.params.satelliteCount}
        startRank={fleetProgress.startRank}
        temperature={activePlanet.params.temperature}
        waterAmount={activePlanet.params.waterAmount}
        co2={activePlanet.params.co2}
        transformation={activePlanet.transformation}
      />
    );
  }

  // 勝利画面に艦隊成長を表示
  if (gameState.shooterMode === 'victory') {
    return (
      <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-7xl mb-3">🏆</div>
        <h2 className="text-4xl text-yellow-300 font-bold mb-2">侵略成功！</h2>
        <div className="bg-white/5 border border-yellow-800 rounded-xl px-6 py-3 mb-6 font-mono text-sm">
          <div className="text-yellow-400 text-center mb-1 text-xs">── 艦隊成長 ──</div>
          <div className="text-center text-white/80">
            Lv.{Math.max(1, fleetProgress.shipLevel - 1)} → <span className="text-yellow-300 font-bold">Lv.{fleetProgress.shipLevel}</span>
          </div>
          {fleetProgress.startRank > 0 && (
            <div className="text-center text-xs text-cyan-400 mt-1">
              次回初期ランク: {['SPEED UP','TWIN SHOT','MISSILE','SPREAD'][fleetProgress.startRank - 1]}
            </div>
          )}
        </div>
        <button onClick={() => gameState.endShooter('victory')}
          className="px-8 py-3 bg-yellow-500/30 hover:bg-yellow-500/50 border border-yellow-400 rounded-full text-white font-bold transition-all">
          育成画面に戻る
        </button>
      </div>
    );
  }

  // 敗北画面
  if (gameState.shooterMode === 'defeat') {
    return (
      <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-7xl mb-3">💥</div>
        <h2 className="text-4xl text-red-400 font-bold mb-2">艦隊壊滅...</h2>
        <p className="text-white/70 text-center mb-6 px-8 text-sm">
          惑星が崩壊すると艦隊データはリセットされます
        </p>
        <button onClick={() => gameState.endShooter('defeat')}
          className="px-8 py-3 bg-red-900/30 hover:bg-red-800/50 border border-red-600 rounded-full text-white font-bold transition-all">
          育成画面に戻る
        </button>
      </div>
    );
  }

  return null;
};
