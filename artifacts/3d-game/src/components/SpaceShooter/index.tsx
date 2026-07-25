import React, { useState, useEffect } from 'react';
import { SpaceShooterScene } from './SpaceShooterScene';
import { SolarSystemState } from '../../hooks/useSolarSystem';
import { loadFleetProgress, updateFleetOnVictory, updateFleetOnDefeat } from '../../hooks/useFleetProgress';

interface SpaceShooterProps {
  state: SolarSystemState;
}

export const SpaceShooter: React.FC<SpaceShooterProps> = ({ state }) => {
  const [fleetProgress, setFleetProgress] = useState(loadFleetProgress);

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

  if (state.shooterMode === 'prompt') {
    return (
      <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-7xl mb-4 animate-bounce">🚀</div>
        <h2 className="text-3xl text-cyan-300 font-bold mb-2 text-center">小惑星帯を突破しますか？</h2>
        <p className="text-white/60 text-sm text-center mb-5 px-8 leading-relaxed">
          木星と火星の間に広がる小惑星帯で<br />迫りくる岩石を撃ち落とせ！
        </p>
        {/* Fleet status */}
        <div className="bg-white/5 border border-cyan-800/60 rounded-xl px-6 py-3 mb-6 font-mono text-sm">
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
        <div className="flex gap-4">
          <button onClick={state.startShooter}
            className="px-8 py-4 bg-cyan-600/80 hover:bg-cyan-500 border border-cyan-400 rounded-full text-white font-bold text-lg transition-all active:scale-95">
            🚀 出撃！
          </button>
          <button onClick={state.declineShooter}
            className="px-6 py-4 bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded-full text-white/70 font-bold transition-all active:scale-95">
            戻る
          </button>
        </div>
      </div>
    );
  }

  if (state.shooterMode === 'playing') {
    return (
      <SpaceShooterScene
        onVictory={handleVictory}
        onDefeat={handleDefeat}
        // Fixed values for asteroid belt context
        civLevel={0.7}
        metallicCoreRatio={80}
        energyEfficiency={50}
        averageIntelligence={50}
        satelliteCount={0}
        startRank={fleetProgress.startRank}
        temperature={-100}
        waterAmount={5}
        co2={0}
        transformation="asteroid"
      />
    );
  }

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
        <button onClick={() => state.endShooter('victory')}
          className="px-8 py-3 bg-yellow-500/30 hover:bg-yellow-500/50 border border-yellow-400 rounded-full text-white font-bold transition-all">
          太陽系マップに戻る
        </button>
      </div>
    );
  }

  if (state.shooterMode === 'defeat') {
    return (
      <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center pointer-events-auto">
        <div className="text-7xl mb-3">💥</div>
        <h2 className="text-4xl text-red-400 font-bold mb-2">撃墜された...</h2>
        <button onClick={() => state.endShooter('defeat')}
          className="px-8 py-3 bg-red-900/30 hover:bg-red-800/50 border border-red-600 rounded-full text-white font-bold transition-all">
          太陽系マップに戻る
        </button>
      </div>
    );
  }

  return null;
};
