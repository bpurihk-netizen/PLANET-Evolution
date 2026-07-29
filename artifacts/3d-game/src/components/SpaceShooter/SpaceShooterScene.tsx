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
import { GameItems } from './GameItems';
import { useShooterState } from '../../hooks/useShooterState';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { ExplosionSystem, Explosion } from './ExplosionSystem';

// ゲームループコンポーネント（Canvas内）
const GameLoop: React.FC<{ tick: (delta: number) => void }> = ({ tick }) => {
  useFrame((_, delta) => {
    tick(Math.min(delta, 0.05));
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
  deilandHpBonus: number;
  temperature: number;
  waterAmount: number;
  co2: number;
  transformation: string;
}

export const SpaceShooterScene: React.FC<SpaceShooterSceneProps> = ({
  onVictory, onDefeat, civLevel, metallicCoreRatio,
  energyEfficiency, averageIntelligence, satelliteCount,
  startRank, deilandHpBonus, temperature, waterAmount, co2, transformation
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const explosionsRef = useRef<Explosion[]>([]);

  const {
    playerPosRef,
    bulletsRef,
    enemiesRef,
    asteroidsRef,
    gameItemsRef,
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
    bossHP,
    onKillRef,
    activeEffects,
  } = useShooterState({
    onVictory, onDefeat, civLevel, metallicCoreRatio,
    energyEfficiency, averageIntelligence, satelliteCount, startRank, deilandHpBonus,
  });

  useEffect(() => {
    onKillRef.current = (pos, type) => {
      if (explosionsRef.current.length >= 12) explosionsRef.current.shift();
      // Color by enemy type
      const colorMap: Record<string, THREE.Color> = {
        scout:       new THREE.Color(1, 0.3, 0.1),
        heavy:       new THREE.Color(1, 0.5, 0.1),
        disc:        new THREE.Color(1, 0.8, 0.1),
        bomber:      new THREE.Color(0.6, 0.1, 1.0),
        elite:       new THREE.Color(1, 0.1, 0.1),
        swarm:       new THREE.Color(1, 1, 0.1),
        splitter:    new THREE.Color(1, 0.5, 0.0),
        carrier:     new THREE.Color(0.4, 0.4, 0.4),
        ramjet:      new THREE.Color(0.9, 0.9, 1.0),
        sentinel:    new THREE.Color(0.3, 0.8, 0.3),
        phantom:     new THREE.Color(0.2, 0.4, 1.0),
        crystal:     new THREE.Color(0.0, 1.0, 1.0),
        dreadnought: new THREE.Color(0.8, 0.0, 1.0),
      };
      const scaleMap: Record<string, number> = {
        carrier: 2.2, dreadnought: 3.0, heavy: 1.8,
        disc: 1.3, splitter: 1.4, sentinel: 1.4,
      };
      explosionsRef.current.push({
        id: Date.now() + Math.random(),
        pos,
        time: 0,
        color: colorMap[type] ?? new THREE.Color(1, 0.8, 0.1),
        scale: scaleMap[type] ?? 1.0,
        isDead: false,
      });
    };
  }, [onKillRef]);

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
        onCreated={({ camera }) => { camera.lookAt(0, 0, -2); }}
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
        <PlayerShip posRef={playerPosRef} powerRank={powerRank} />
        <BossShip bossRef={bossRef} />
        <EnemyShips key={killCount} enemiesRef={enemiesRef} />
        <ExplosionSystem explosionsRef={explosionsRef} />
        <Projectiles bulletsRef={bulletsRef} />
        <AsteroidField asteroidsRef={asteroidsRef} />
        <PowerCapsules capsulesRef={powerCapsules} count={killCount} />
        <GameItems gameItemsRef={gameItemsRef} />
        <OptionOrbs orb1Ref={optionOrb1PosRef} orb2Ref={optionOrb2PosRef} playerPosRef={playerPosRef} powerRank={powerRank} />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.9}
            intensity={1.2}
            blendFunction={BlendFunction.ADD}
          />
        </EffectComposer>
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
        activeEffects={activeEffects}
      />
    </div>
  );
};
