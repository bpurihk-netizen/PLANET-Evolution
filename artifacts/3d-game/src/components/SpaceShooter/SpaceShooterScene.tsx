import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShooterBackground } from './ShooterBackground';
import { PlayerShip } from './PlayerShip';
import { EnemyShips } from './EnemyShips';
import { Projectiles } from './Projectiles';
import { AsteroidField } from './AsteroidField';
import { ShooterHUD } from './ShooterHUD';
import { PowerCapsules } from './PowerCapsules';
import { OptionOrbs } from './OptionOrbs';
import { BossShip } from './BossShip';
import { useShooterState } from '../../hooks/useShooterState';

// ゲームループコンポーネント（Canvas内）
const GameLoop: React.FC<{ tick: (delta: number) => void }> = ({ tick }) => {
  useFrame((_, delta) => {
    tick(Math.min(delta, 0.05)); // 最大deltaを制限
  });
  return null;
};

interface SpaceShooterSceneProps {
  onVictory: (kills: number, bossKilled: boolean) => void;
  onDefeat: (kills: number) => void;
  civLevel: number;
  metallicCoreRatio: number;
  energyEfficiency: number;
  averageIntelligence: number;
  satelliteCount: number;
  startRank: number;
  temperature: number;
  waterAmount: number;
  co2: number;
  transformation: string;
}

export const SpaceShooterScene: React.FC<SpaceShooterSceneProps> = ({
  onVictory, onDefeat, civLevel, metallicCoreRatio,
  energyEfficiency, averageIntelligence, satelliteCount,
  startRank, temperature, waterAmount, co2, transformation
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    playerPosRef,
    bulletsRef,
    enemiesRef,
    asteroidsRef,
    playerHP,
    score,
    killCount,
    timeLeft,
    isGameOver,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    tick,
    VICTORY_KILLS,
    powerCapsules,
    powerRank,
    specialGauge,
    specialAvailable,
    optionOrb1PosRef,
    optionOrb2PosRef,
    bossRef,
    bossActive,
    bossHP
  } = useShooterState({ 
    onVictory, onDefeat, civLevel, metallicCoreRatio,
    energyEfficiency, averageIntelligence, satelliteCount, startRank
  });

  // タッチイベント登録
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={canvasRef} className="absolute inset-0 z-30 touch-none">
      <Canvas
        camera={{ position: [0, 10, 5], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, -2);
        }}
      >
        <color attach="background" args={['#010812']} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[0, 5, 5]} intensity={1.2} color="#88ccff" />

        <GameLoop tick={tick} />
        <ShooterBackground 
          temperature={temperature}
          waterAmount={waterAmount}
          co2={co2}
          transformation={transformation}
        />
        <PlayerShip posRef={playerPosRef} />
        <BossShip bossRef={bossRef} />
        {/* killCount変化時に再レンダー → 敵配列が更新される */}
        <EnemyShips key={killCount} enemiesRef={enemiesRef} />
        <Projectiles bulletsRef={bulletsRef} />
        <AsteroidField asteroidsRef={asteroidsRef} />
        <PowerCapsules capsulesRef={powerCapsules} count={killCount} />
        <OptionOrbs orb1Ref={optionOrb1PosRef} orb2Ref={optionOrb2PosRef} powerRank={powerRank} />
      </Canvas>

      {/* HTML HUD オーバーレイ */}
      <ShooterHUD
        playerHP={playerHP}
        score={score}
        killCount={killCount}
        timeLeft={timeLeft}
        victoryKills={VICTORY_KILLS}
        powerRank={powerRank}
        specialGauge={specialGauge}
        specialAvailable={specialAvailable}
        bossActive={bossActive}
        bossHP={bossHP}
      />
    </div>
  );
};
