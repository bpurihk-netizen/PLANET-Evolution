import { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export type EnemyType =
  | 'scout' | 'heavy' | 'disc' | 'asteroid'
  | 'bomber' | 'elite' | 'swarm' | 'splitter' | 'carrier'
  | 'ramjet' | 'sentinel' | 'phantom' | 'crystal' | 'dreadnought';

export type ShooterEntity = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  hp: number;
  maxHp: number;
  radius: number;
  type: EnemyType;
  isDead: boolean;
  // special behavior timers
  spawnTimer?: number;
  chargeTimer?: number;
  fireTimer?: number;
  visibleTimer?: number;
  visible?: boolean;
  charged?: boolean;
};

export type BulletType =
  | 'normal' | 'twin' | 'missile' | 'spread' | 'laser' | 'special'
  | 'ripple' | 'backShot' | 'vulcan' | 'scatter' | 'plasma' | 'omega'
  | 'mine';

export type Bullet = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isDead: boolean;
  type: BulletType;
  penetrate: boolean;
  homingTargetId?: number;
  isEnemy?: boolean;
};

export type PowerCapsule = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isDead: boolean;
};

export type GameItemType =
  | 'shield' | 'bomb' | 'heal' | 'speedBoost' | 'scoreBoost'
  | 'autoAim' | 'magnet' | 'timeSlow' | 'barrier' | 'overdrive';

export type GameItem = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isDead: boolean;
  itemType: GameItemType;
};

export type BossWeakPoint = {
  id: number;
  offset: THREE.Vector3;
  hp: number;
  maxHp: number;
  radius: number;
  isDead: boolean;
};

export type BossState = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  weakPoints: BossWeakPoint[];
  phase: 1 | 2 | 3;
  phaseTimer: number;
  isDead: boolean;
  appeared: boolean;
};

export type ActiveEffects = {
  shieldTimer: number;
  speedBoostTimer: number;
  scoreBoostTimer: number;
  autoAimTimer: number;
  magnetTimer: number;
  timeSlowTimer: number;
  barrierHits: number;
};

type UseShooterStateProps = {
  onVictory: (kills: number, bossKilled: boolean) => void;
  onDefeat: (kills: number) => void;
  civLevel: number;
  metallicCoreRatio: number;
  energyEfficiency: number;
  averageIntelligence: number;
  satelliteCount: number;
  startRank: number;
};

export const useShooterState = ({
  onVictory, onDefeat, civLevel, metallicCoreRatio,
  energyEfficiency, averageIntelligence, satelliteCount,
  startRank
}: UseShooterStateProps) => {
  // game objects
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 3.5));
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<ShooterEntity[]>([]);
  const asteroidsRef = useRef<ShooterEntity[]>([]);
  const gameItemsRef = useRef<GameItem[]>([]);
  const nextIdRef = useRef(1);
  const onKillRef = useRef<((pos: THREE.Vector3, type: string) => void) | null>(null);

  // power-up
  const powerRankRef = useRef(startRank); // 0-14
  const [powerRank, setPowerRank] = useState(startRank);
  const powerCapsulesRef = useRef<PowerCapsule[]>([]);
  const capsuleCountRef = useRef(0);

  // OPTION orbs
  const playerHistoryRef = useRef<THREE.Vector3[]>([]);
  const MAX_HISTORY = 200;
  const OPTION_DELAY_1 = 60;
  const OPTION_DELAY_2 = 120;
  const optionOrb1PosRef = useRef(new THREE.Vector3(0, 0, 5));
  const optionOrb2PosRef = useRef(new THREE.Vector3(0, 0, 7));

  // special
  const specialGaugeRef = useRef(0);
  const [specialGauge, setSpecialGauge] = useState(0);
  const specialActiveRef = useRef(false);
  const specialTimerRef = useRef(0);
  const [specialAvailable, setSpecialAvailable] = useState(false);
  const lastGaugeFloorRef = useRef(0);

  // boss
  const BOSS_TRIGGER_KILLS = 15;
  const [bossKilled, setBossKilled] = useState(false);
  const bossKilledRef = useRef(false);
  const bossRef = useRef<BossState | null>(null);
  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState(0);

  // timers
  const autoFireTimerRef = useRef(0);
  const enemySpawnTimerRef = useRef(0);
  const asteroidSpawnTimerRef = useRef(0);
  const gameTimerRef = useRef(60);

  // game state
  const [playerHP, setPlayerHP] = useState(3);
  const [score, setScore] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);

  const playerHPRef = useRef(3);
  const scoreRef = useRef(0);
  const killCountRef = useRef(0);
  const isGameOverRef = useRef(false);

  // active effects
  const shieldTimerRef = useRef(0);
  const speedBoostTimerRef = useRef(0);
  const scoreBoostTimerRef = useRef(0);
  const autoAimTimerRef = useRef(0);
  const magnetTimerRef = useRef(0);
  const timeSlowTimerRef = useRef(0);
  const barrierHitsRef = useRef(0);

  const [activeEffects, setActiveEffects] = useState<ActiveEffects>({
    shieldTimer: 0, speedBoostTimer: 0, scoreBoostTimer: 0,
    autoAimTimer: 0, magnetTimer: 0, timeSlowTimer: 0, barrierHits: 0,
  });
  const lastEffectFloorRef = useRef(0);

  const BULLET_SPEED = 12 + civLevel * 4;
  const BULLET_DAMAGE = 1 + (metallicCoreRatio / 100);
  const AUTO_FIRE_INTERVAL = 0.25;
  const VICTORY_KILLS = 20;
  const PLAYER_RADIUS = 0.6;
  const ITEM_COLLECT_RADIUS = 1.0;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const playerTargetXRef = useRef(0);
  const playerTargetZRef = useRef(3.5);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth / 2) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
    if (touch.clientX >= window.innerWidth / 2) {
      if (specialGaugeRef.current >= 100 && !specialActiveRef.current) {
        specialGaugeRef.current = 0;
        specialActiveRef.current = true;
        specialTimerRef.current = 2.0;
        setSpecialGauge(0);
        setSpecialAvailable(false);
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth / 2 && touchStartRef.current) {
      const divisorX = speedBoostTimerRef.current > 0 ? 19.4 : 35;
      const divisorZ = speedBoostTimerRef.current > 0 ? 26.7 : 48;
      const dx = (touch.clientX - touchStartRef.current.x) / divisorX;
      const dy = (touch.clientY - touchStartRef.current.y) / divisorZ;
      playerTargetXRef.current = Math.max(-3.5, Math.min(3.5, playerPosRef.current.x + dx));
      playerTargetZRef.current = Math.max(1.5, Math.min(4.5, playerPosRef.current.z + dy));
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  const tick = useCallback((delta: number) => {
    if (isGameOverRef.current) return;

    gameTimerRef.current -= delta;
    if (Math.floor(gameTimerRef.current) !== Math.floor(gameTimerRef.current + delta)) {
      setTimeLeft(Math.max(0, Math.ceil(gameTimerRef.current)));
    }
    if (gameTimerRef.current <= 0 && !isGameOverRef.current) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      onVictory(killCountRef.current, bossKilledRef.current);
      return;
    }

    // update active effect timers
    if (shieldTimerRef.current > 0) shieldTimerRef.current = Math.max(0, shieldTimerRef.current - delta);
    if (speedBoostTimerRef.current > 0) speedBoostTimerRef.current = Math.max(0, speedBoostTimerRef.current - delta);
    if (scoreBoostTimerRef.current > 0) scoreBoostTimerRef.current = Math.max(0, scoreBoostTimerRef.current - delta);
    if (autoAimTimerRef.current > 0) autoAimTimerRef.current = Math.max(0, autoAimTimerRef.current - delta);
    if (magnetTimerRef.current > 0) magnetTimerRef.current = Math.max(0, magnetTimerRef.current - delta);
    if (timeSlowTimerRef.current > 0) timeSlowTimerRef.current = Math.max(0, timeSlowTimerRef.current - delta);

    const newFloor = Math.floor(shieldTimerRef.current + speedBoostTimerRef.current + scoreBoostTimerRef.current + autoAimTimerRef.current + magnetTimerRef.current + timeSlowTimerRef.current + barrierHitsRef.current);
    if (newFloor !== lastEffectFloorRef.current) {
      lastEffectFloorRef.current = newFloor;
      setActiveEffects({
        shieldTimer: shieldTimerRef.current,
        speedBoostTimer: speedBoostTimerRef.current,
        scoreBoostTimer: scoreBoostTimerRef.current,
        autoAimTimer: autoAimTimerRef.current,
        magnetTimer: magnetTimerRef.current,
        timeSlowTimer: timeSlowTimerRef.current,
        barrierHits: barrierHitsRef.current,
      });
    }

    // player history
    playerHistoryRef.current.push(playerPosRef.current.clone());
    if (playerHistoryRef.current.length > MAX_HISTORY) {
      playerHistoryRef.current.shift();
    }

    const hist = playerHistoryRef.current;
    if (powerRankRef.current >= 6 && hist.length > OPTION_DELAY_1) {
      optionOrb1PosRef.current.copy(hist[Math.max(0, hist.length - OPTION_DELAY_1 - 1)]);
    }
    if (powerRankRef.current >= 7 && hist.length > OPTION_DELAY_2) {
      optionOrb2PosRef.current.copy(hist[Math.max(0, hist.length - OPTION_DELAY_2 - 1)]);
    }

    playerPosRef.current.x = THREE.MathUtils.lerp(playerPosRef.current.x, playerTargetXRef.current, 0.38);
    playerPosRef.current.z = THREE.MathUtils.lerp(playerPosRef.current.z, playerTargetZRef.current, 0.38);

    const spawnBullet = (pos: THREE.Vector3, vel: THREE.Vector3, type: BulletType, penetrate: boolean, isEnemy = false): Bullet => {
      const b: Bullet = { id: nextIdRef.current++, pos, vel, isDead: false, type, penetrate, isEnemy };
      bulletsRef.current.push(b);
      return b;
    };

    let shouldFire = false;
    autoFireTimerRef.current -= delta;
    const rank = powerRankRef.current;

    let fireInterval: number;
    if (rank === 11) {
      fireInterval = 0.07;
    } else if (rank >= 1) {
      fireInterval = Math.max(0.12, AUTO_FIRE_INTERVAL - rank * 0.015);
    } else {
      fireInterval = AUTO_FIRE_INTERVAL;
    }

    if (autoFireTimerRef.current <= 0) {
      autoFireTimerRef.current = fireInterval;
      shouldFire = true;
      const baseSpeed = BULLET_SPEED + (rank >= 1 ? 4 : 0);
      const pPos = playerPosRef.current;

      // auto-aim: all bullets home like missiles
      const autoAimActive = autoAimTimerRef.current > 0;
      const nearestEnemyForAim = autoAimActive
        ? enemiesRef.current.reduce<ShooterEntity | null>((nearest, e) => {
            if (e.isDead) return nearest;
            if (!nearest) return e;
            return e.pos.distanceTo(pPos) < nearest.pos.distanceTo(pPos) ? e : nearest;
          }, null)
        : null;

      const makeVel = (vel: THREE.Vector3): THREE.Vector3 => {
        if (nearestEnemyForAim) {
          return nearestEnemyForAim.pos.clone().sub(pPos).normalize().multiplyScalar(vel.length());
        }
        return vel;
      };

      if (rank <= 1) {
        const b = spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'normal', false);
        if (nearestEnemyForAim) b.homingTargetId = nearestEnemyForAim.id;
      } else if (rank === 2) {
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'twin', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'twin', false);
      } else if (rank === 3) {
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'twin', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'twin', false);

        const nearestEnemy = nearestEnemyForAim ?? enemiesRef.current.reduce<ShooterEntity | null>((nearest, e) => {
          if (e.isDead) return nearest;
          if (!nearest) return e;
          return e.pos.distanceTo(pPos) < nearest.pos.distanceTo(pPos) ? e : nearest;
        }, null);

        const missileVel = nearestEnemy
          ? nearestEnemy.pos.clone().sub(pPos).normalize().multiplyScalar(baseSpeed * 0.8)
          : new THREE.Vector3(0, 0, -baseSpeed * 0.8);

        const b = spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), missileVel, 'missile', false);
        if (nearestEnemy) b.homingTargetId = nearestEnemy.id;
      } else if (rank === 4) {
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'spread', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), makeVel(new THREE.Vector3(-baseSpeed * 0.3, 0, -baseSpeed * 0.95)), 'spread', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), makeVel(new THREE.Vector3(baseSpeed * 0.3, 0, -baseSpeed * 0.95)), 'spread', false);
      } else if (rank <= 8) {
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'laser', true);
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'spread', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), makeVel(new THREE.Vector3(0, 0, -baseSpeed)), 'spread', false);
      } else if (rank === 9) {
        // RIPPLE: 8 bullets in all directions
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          spawnBullet(pPos.clone(), new THREE.Vector3(Math.sin(angle) * baseSpeed, 0, -Math.cos(angle) * baseSpeed), 'ripple', false);
        }
      } else if (rank === 10) {
        // BACK FIRE: forward + backward
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'normal', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'twin', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'twin', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, 0.5)), new THREE.Vector3(0, 0, baseSpeed), 'backShot', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, 0.5)), new THREE.Vector3(0, 0, baseSpeed), 'backShot', false);
      } else if (rank === 11) {
        // VULCAN: 3 tight bullets
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.1, 0, -0.5)), new THREE.Vector3(-0.3, 0, -baseSpeed), 'vulcan', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'vulcan', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.1, 0, -0.5)), new THREE.Vector3(0.3, 0, -baseSpeed), 'vulcan', false);
      } else if (rank === 12) {
        // SCATTER: bullets that split on impact
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'scatter', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), new THREE.Vector3(-1, 0, -baseSpeed), 'scatter', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), new THREE.Vector3(1, 0, -baseSpeed), 'scatter', false);
      } else if (rank === 13) {
        // PLASMA: large slow plasma balls
        const plasmaSpeed = baseSpeed * 0.45;
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.5, 0, -0.5)), new THREE.Vector3(-0.5, 0, -plasmaSpeed), 'plasma', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.5, 0, -0.5)), new THREE.Vector3(0.5, 0, -plasmaSpeed), 'plasma', false);
      } else {
        // OMEGA: laser + spread + ripple + missile + all options
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'laser', true);
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), new THREE.Vector3(-baseSpeed * 0.3, 0, -baseSpeed * 0.95), 'spread', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), new THREE.Vector3(baseSpeed * 0.3, 0, -baseSpeed * 0.95), 'spread', false);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          spawnBullet(pPos.clone(), new THREE.Vector3(Math.sin(angle) * baseSpeed * 0.6, 0, -Math.cos(angle) * baseSpeed * 0.6), 'omega', false);
        }
        const nearestOmega = enemiesRef.current.reduce<ShooterEntity | null>((nearest, e) => {
          if (e.isDead) return nearest;
          if (!nearest) return e;
          return e.pos.distanceTo(pPos) < nearest.pos.distanceTo(pPos) ? e : nearest;
        }, null);
        const omegaMissileVel = nearestOmega
          ? nearestOmega.pos.clone().sub(pPos).normalize().multiplyScalar(baseSpeed)
          : new THREE.Vector3(0, 0, -baseSpeed);
        const bOmega = spawnBullet(pPos.clone(), omegaMissileVel, 'missile', false);
        if (nearestOmega) bOmega.homingTargetId = nearestOmega.id;
      }

      if (rank >= 6) {
        spawnBullet(optionOrb1PosRef.current.clone(), new THREE.Vector3(0, 0, -baseSpeed), 'normal', false);
      }
      if (rank >= 7) {
        spawnBullet(optionOrb2PosRef.current.clone(), new THREE.Vector3(0, 0, -baseSpeed), 'normal', false);
      }
    }

    // enemy spawn
    enemySpawnTimerRef.current -= delta;
    const spawnInterval = Math.max(1.5, 3.0 - (60 - gameTimerRef.current) * 0.02);
    if (enemySpawnTimerRef.current <= 0) {
      enemySpawnTimerRef.current = spawnInterval;
      const allTypes: EnemyType[] = [
        'scout', 'scout', 'heavy', 'disc',
        'bomber', 'elite', 'swarm', 'splitter', 'carrier',
        'ramjet', 'sentinel', 'phantom', 'crystal', 'dreadnought'
      ];
      const t = allTypes[Math.floor(Math.random() * allTypes.length)];
      const xPos = (Math.random() - 0.5) * 6;

      if (t === 'swarm') {
        // spawn 5 at once in tight cluster
        for (let si = 0; si < 5; si++) {
          enemiesRef.current.push({
            id: nextIdRef.current++,
            pos: new THREE.Vector3(xPos + (Math.random() - 0.5) * 1.5, 0, -12),
            vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, 5.5),
            hp: 1, maxHp: 1, radius: 0.4,
            type: 'swarm', isDead: false,
          });
        }
      } else {
        const configs: Record<EnemyType, { hp: number; radius: number; velZ: number }> = {
          scout:       { hp: 1,  radius: 0.7,  velZ: 4.0 },
          heavy:       { hp: 3,  radius: 1.0,  velZ: 2.5 },
          disc:        { hp: 1,  radius: 0.7,  velZ: 3.0 },
          asteroid:    { hp: 2,  radius: 0.9,  velZ: 2.5 },
          bomber:      { hp: 2,  radius: 0.9,  velZ: 2.2 },
          elite:       { hp: 4,  radius: 0.8,  velZ: 4.5 },
          splitter:    { hp: 3,  radius: 0.95, velZ: 2.0 },
          carrier:     { hp: 8,  radius: 1.4,  velZ: 1.2 },
          ramjet:      { hp: 2,  radius: 0.7,  velZ: 1.5 },
          sentinel:    { hp: 5,  radius: 1.1,  velZ: 0.3 },
          phantom:     { hp: 2,  radius: 0.65, velZ: 3.5 },
          crystal:     { hp: 6,  radius: 1.0,  velZ: 2.0 },
          dreadnought: { hp: 12, radius: 1.6,  velZ: 1.0 },
          swarm:       { hp: 1,  radius: 0.4,  velZ: 5.5 },
        };
        const cfg = configs[t] ?? configs['scout'];
        const entity: ShooterEntity = {
          id: nextIdRef.current++,
          pos: new THREE.Vector3(xPos, 0, -12),
          vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, cfg.velZ),
          hp: cfg.hp, maxHp: cfg.hp, radius: cfg.radius,
          type: t, isDead: false,
          spawnTimer: 0, chargeTimer: 0, fireTimer: 0, visibleTimer: 0,
          visible: true, charged: false,
        };
        enemiesRef.current.push(entity);
      }
    }

    // asteroids
    asteroidSpawnTimerRef.current -= delta;
    if (asteroidSpawnTimerRef.current <= 0) {
      asteroidSpawnTimerRef.current = 4 + Math.random() * 3;
      asteroidsRef.current.push({
        id: nextIdRef.current++,
        pos: new THREE.Vector3((Math.random() - 0.5) * 7, 0, -14),
        vel: new THREE.Vector3((Math.random() - 0.5) * 1.0, 0, 2.5 + Math.random() * 1.5),
        hp: 2, maxHp: 2,
        radius: 0.9 + Math.random() * 0.6,
        type: 'asteroid', isDead: false,
      });
    }

    // bullet movement
    for (const b of bulletsRef.current) {
      if (b.isDead) continue;
      if (!b.isEnemy && b.type === 'missile' && b.homingTargetId !== undefined) {
        const target = enemiesRef.current.find(e => e.id === b.homingTargetId && !e.isDead);
        if (target) {
          const dir = target.pos.clone().sub(b.pos).normalize();
          b.vel.lerp(dir.multiplyScalar(b.vel.length()), 0.08 * (averageIntelligence / 100));
        }
      }
      // mine: home toward player
      if (b.isEnemy && b.type === 'mine') {
        const dir = playerPosRef.current.clone().sub(b.pos).normalize();
        b.vel.lerp(dir.multiplyScalar(6), 0.06);
      }
      b.pos.addScaledVector(b.vel, delta);
      if (b.pos.z < -18 || b.pos.z > 8 || Math.abs(b.pos.x) > 10) b.isDead = true;
    }

    let newKills = 0;
    let newScore = 0;

    // boss spawn
    if (killCountRef.current >= BOSS_TRIGGER_KILLS && !bossRef.current && !bossKilledRef.current) {
      bossRef.current = {
        pos: new THREE.Vector3(0, 0, -15),
        vel: new THREE.Vector3(0, 0, 1.2),
        phase: 1, phaseTimer: 0,
        isDead: false, appeared: false,
        weakPoints: [
          { id: nextIdRef.current++, offset: new THREE.Vector3(-1.5, 0, 0), hp: 5, maxHp: 5, radius: 0.7, isDead: false },
          { id: nextIdRef.current++, offset: new THREE.Vector3(0, 0, -0.5), hp: 8, maxHp: 8, radius: 0.8, isDead: false },
          { id: nextIdRef.current++, offset: new THREE.Vector3(1.5, 0, 0), hp: 5, maxHp: 5, radius: 0.7, isDead: false },
        ],
      };
      setBossActive(true);
      setBossHP(3);
    }

    // boss update
    if (bossRef.current && !bossRef.current.isDead) {
      const boss = bossRef.current;
      boss.phaseTimer += delta;
      if (boss.phase === 1) {
        if (boss.pos.z < -2) {
          boss.pos.addScaledVector(boss.vel, delta);
        } else {
          boss.vel.z = 0;
          boss.appeared = true;
        }
        boss.vel.x = Math.sin(boss.phaseTimer * 0.8) * 1.5;
        boss.pos.x = Math.max(-3, Math.min(3, boss.pos.x + boss.vel.x * delta));
      } else if (boss.phase === 2) {
        boss.pos.x = Math.sin(boss.phaseTimer * 1.5) * 3.5;
        boss.pos.z = THREE.MathUtils.lerp(boss.pos.z, -1, 0.02);
      } else {
        boss.pos.x = Math.sin(boss.phaseTimer * 2.5 + 1.2) * 3.8;
        boss.pos.z = Math.sin(boss.phaseTimer * 1.0) * 1.5 - 1;
      }

      let deadWpCount = 0;
      for (const wp of boss.weakPoints) {
        if (wp.isDead) { deadWpCount++; continue; }
        const wpWorldPos = boss.pos.clone().add(wp.offset);
        for (const b of bulletsRef.current) {
          if (b.isDead || b.isEnemy) continue;
          if (wpWorldPos.distanceTo(b.pos) < wp.radius) {
            if (!b.penetrate) b.isDead = true;
            wp.hp -= BULLET_DAMAGE;
            if (wp.hp <= 0) {
              wp.isDead = true;
              deadWpCount++;
              newScore += 1000;
              setBossHP(prev => Math.max(0, prev - 1));
              if (deadWpCount === 1) boss.phase = 2;
              if (deadWpCount === 2) boss.phase = 3;
            }
          }
        }
      }

      if (deadWpCount >= 3) {
        boss.isDead = true;
        bossKilledRef.current = true;
        setBossKilled(true);
        setBossActive(false);
        newKills += 5;
        newScore += 5000;
        if (!isGameOverRef.current) {
          isGameOverRef.current = true;
          setIsGameOver(true);
          onVictory(killCountRef.current + newKills, true);
        }
      }

      if (!boss.isDead && boss.pos.distanceTo(playerPosRef.current) < 2.5) {
        if (shieldTimerRef.current <= 0) {
          playerHPRef.current = Math.max(0, playerHPRef.current - 1);
          setPlayerHP(playerHPRef.current);
          if (playerHPRef.current <= 0 && !isGameOverRef.current) {
            isGameOverRef.current = true;
            setIsGameOver(true);
            onDefeat(killCountRef.current);
          }
        }
      }
    }

    // score multiplier
    const scoreMult = scoreBoostTimerRef.current > 0 ? 2 : 1;
    // time slow multiplier for enemies
    const timeSlowMult = timeSlowTimerRef.current > 0 ? 0.35 : 1.0;

    // helper: drop game item
    const dropItem = (pos: THREE.Vector3, chance: number) => {
      if (Math.random() < chance) {
        const types: GameItemType[] = ['shield','bomb','heal','speedBoost','scoreBoost','autoAim','magnet','timeSlow','barrier','overdrive'];
        const itemType = types[Math.floor(Math.random() * types.length)];
        gameItemsRef.current.push({
          id: nextIdRef.current++,
          pos: pos.clone(),
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, 1.5),
          isDead: false,
          itemType,
        });
      }
    };

    // enemy update
    for (const e of enemiesRef.current) {
      if (e.isDead) continue;

      // apply time slow
      const effDelta = delta * timeSlowMult;

      // special behavior per type
      if (e.type === 'disc') {
        e.vel.x = Math.sin((60 - gameTimerRef.current) * 2 + e.id) * 2;
      } else if (e.type === 'ramjet') {
        e.chargeTimer = (e.chargeTimer ?? 0) + delta;
        if (!e.charged && (e.chargeTimer ?? 0) >= 1.5) {
          e.charged = true;
          e.vel.z = 8;
        }
      } else if (e.type === 'carrier') {
        e.spawnTimer = (e.spawnTimer ?? 0) + delta;
        if ((e.spawnTimer ?? 0) >= 4) {
          e.spawnTimer = 0;
          enemiesRef.current.push({
            id: nextIdRef.current++,
            pos: e.pos.clone().add(new THREE.Vector3((Math.random()-0.5)*1, 0, 0.5)),
            vel: new THREE.Vector3((Math.random()-0.5)*1.5, 0, 4.0),
            hp: 1, maxHp: 1, radius: 0.7,
            type: 'scout', isDead: false,
          });
        }
      } else if (e.type === 'elite') {
        e.fireTimer = (e.fireTimer ?? 0) + delta;
        if ((e.fireTimer ?? 0) >= 2) {
          e.fireTimer = 0;
          const dir = playerPosRef.current.clone().sub(e.pos).normalize().multiplyScalar(5);
          spawnBullet(e.pos.clone(), dir, 'normal', false, true);
        }
      } else if (e.type === 'sentinel') {
        e.fireTimer = (e.fireTimer ?? 0) + delta;
        if ((e.fireTimer ?? 0) >= 1.5) {
          e.fireTimer = 0;
          const base = playerPosRef.current.clone().sub(e.pos).normalize();
          for (let si = -1; si <= 1; si++) {
            const angle = si * 0.3;
            const vel = new THREE.Vector3(
              base.x * Math.cos(angle) - base.z * Math.sin(angle),
              0,
              base.x * Math.sin(angle) + base.z * Math.cos(angle)
            ).multiplyScalar(4);
            spawnBullet(e.pos.clone(), vel, 'normal', false, true);
          }
        }
      } else if (e.type === 'phantom') {
        e.visibleTimer = (e.visibleTimer ?? 0) + delta;
        if ((e.visibleTimer ?? 0) >= 1.5) {
          e.visibleTimer = 0;
          e.visible = !e.visible;
          if (e.visible === false) {
            // fire when turning invisible
            const dir = playerPosRef.current.clone().sub(e.pos).normalize().multiplyScalar(5);
            spawnBullet(e.pos.clone(), dir, 'normal', false, true);
          }
        }
      } else if (e.type === 'dreadnought') {
        // sine wave movement
        e.vel.x = Math.sin((60 - gameTimerRef.current) * 1.5 + e.id * 0.5) * 2.5;
        e.fireTimer = (e.fireTimer ?? 0) + delta;
        if ((e.fireTimer ?? 0) >= 2) {
          e.fireTimer = 0;
          const base = playerPosRef.current.clone().sub(e.pos).normalize();
          for (let si = -2; si <= 2; si++) {
            const angle = si * 0.25;
            const vel = new THREE.Vector3(
              base.x * Math.cos(angle) - base.z * Math.sin(angle),
              0,
              base.x * Math.sin(angle) + base.z * Math.cos(angle)
            ).multiplyScalar(5);
            spawnBullet(e.pos.clone(), vel, 'normal', false, true);
          }
        }
      }

      e.pos.addScaledVector(e.vel, effDelta);
      if (e.pos.z > 6) { e.isDead = true; continue; }

      // bullet collisions
      for (const b of bulletsRef.current) {
        if (b.isDead || b.isEnemy) continue;
        if (e.pos.distanceTo(b.pos) < e.radius) {
          if (!b.penetrate) b.isDead = true;
          let dmg = BULLET_DAMAGE;
          // crystal: only laser does full damage
          if (e.type === 'crystal' && b.type !== 'laser') dmg = 0.1;
          e.hp -= dmg;
          if (e.hp <= 0) {
            e.isDead = true;
            onKillRef.current?.(e.pos.clone(), e.type);
            newKills++;
            const scoreMap: Record<EnemyType, number> = {
              scout: 100, heavy: 300, disc: 200, asteroid: 50,
              bomber: 250, elite: 400, swarm: 80, splitter: 350, carrier: 800,
              ramjet: 200, sentinel: 350, phantom: 300, crystal: 500, dreadnought: 2000,
            };
            newScore += (scoreMap[e.type] ?? 100) * scoreMult;
            specialGaugeRef.current += 15;

            // on-death effects
            if (e.type === 'bomber') {
              for (let mi = 0; mi < 2; mi++) {
                spawnBullet(e.pos.clone(), new THREE.Vector3((Math.random()-0.5)*2, 0, (Math.random()-0.5)*2), 'mine', false, true);
              }
            }
            if (e.type === 'splitter') {
              for (let si = 0; si < 2; si++) {
                enemiesRef.current.push({
                  id: nextIdRef.current++,
                  pos: e.pos.clone().add(new THREE.Vector3((Math.random()-0.5)*0.5, 0, 0)),
                  vel: new THREE.Vector3((Math.random()-0.5)*2, 0, 4.0),
                  hp: 1, maxHp: 1, radius: 0.7,
                  type: 'scout', isDead: false,
                });
              }
            }

            // power capsule drop
            if (Math.random() < 0.3) {
              powerCapsulesRef.current.push({
                id: nextIdRef.current++,
                pos: e.pos.clone(),
                vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, 1.5),
                isDead: false,
              });
            }

            // item drop
            const itemDropChance: Partial<Record<EnemyType, number>> = {
              elite: 0.15, carrier: 0.30, dreadnought: 0.50,
            };
            dropItem(e.pos, itemDropChance[e.type] ?? 0.08);
          }
        }
      }

      // player collision
      if (!e.isDead && e.pos.distanceTo(playerPosRef.current) < e.radius + PLAYER_RADIUS) {
        e.isDead = true;
        if (shieldTimerRef.current <= 0) {
          playerHPRef.current = Math.max(0, playerHPRef.current - 1);
          setPlayerHP(playerHPRef.current);

          const newRank = Math.max(0, powerRankRef.current - 2);
          powerRankRef.current = newRank;
          setPowerRank(newRank);
          capsuleCountRef.current = 0;

          if (playerHPRef.current <= 0 && !isGameOverRef.current) {
            isGameOverRef.current = true;
            setIsGameOver(true);
            onDefeat(killCountRef.current);
          }
        }
      }
    }

    // asteroids
    for (const a of asteroidsRef.current) {
      if (a.isDead) continue;
      a.pos.addScaledVector(a.vel, delta);
      if (a.pos.z > 6) { a.isDead = true; continue; }

      for (const b of bulletsRef.current) {
        if (b.isDead || b.isEnemy) continue;
        if (a.pos.distanceTo(b.pos) < a.radius) {
          if (!b.penetrate) b.isDead = true;
          a.hp -= BULLET_DAMAGE;
          if (a.hp <= 0) {
            a.isDead = true;
            onKillRef.current?.(a.pos.clone(), a.type);
            newScore += 50 * scoreMult;

            if (Math.random() < 0.1) {
              powerCapsulesRef.current.push({
                id: nextIdRef.current++,
                pos: a.pos.clone(),
                vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, 1.5),
                isDead: false,
              });
            }
          }
        }
      }

      if (!a.isDead && a.pos.distanceTo(playerPosRef.current) < a.radius + PLAYER_RADIUS) {
        a.isDead = true;
        if (shieldTimerRef.current <= 0) {
          playerHPRef.current = Math.max(0, playerHPRef.current - 1);
          setPlayerHP(playerHPRef.current);

          const newRank = Math.max(0, powerRankRef.current - 2);
          powerRankRef.current = newRank;
          setPowerRank(newRank);
          capsuleCountRef.current = 0;

          if (playerHPRef.current <= 0 && !isGameOverRef.current) {
            isGameOverRef.current = true;
            setIsGameOver(true);
            onDefeat(killCountRef.current);
          }
        }
      }
    }

    // enemy bullet vs player
    for (const b of bulletsRef.current) {
      if (b.isDead || !b.isEnemy) continue;
      if (b.pos.distanceTo(playerPosRef.current) < PLAYER_RADIUS + 0.2) {
        b.isDead = true;
        if (shieldTimerRef.current > 0) continue;
        if (barrierHitsRef.current > 0) {
          barrierHitsRef.current--;
          continue;
        }
        playerHPRef.current = Math.max(0, playerHPRef.current - 1);
        setPlayerHP(playerHPRef.current);
        if (playerHPRef.current <= 0 && !isGameOverRef.current) {
          isGameOverRef.current = true;
          setIsGameOver(true);
          onDefeat(killCountRef.current);
        }
      }
    }

    // power capsules
    const magnetRadius = magnetTimerRef.current > 0 ? 5.0 : 2.0;
    for (const cap of powerCapsulesRef.current) {
      if (cap.isDead) continue;
      cap.pos.addScaledVector(cap.vel, delta);
      if (cap.pos.z > 6) { cap.isDead = true; continue; }
      const distToCap = cap.pos.distanceTo(playerPosRef.current);
      if (distToCap < magnetRadius) {
        const attract = playerPosRef.current.clone().sub(cap.pos).normalize().multiplyScalar(8);
        cap.vel.lerp(attract, 0.15);
      }
      if (distToCap < 0.8) {
        cap.isDead = true;
        capsuleCountRef.current++;
        if (capsuleCountRef.current >= 5) {
          capsuleCountRef.current = 0;
          const newRank = Math.min(14, powerRankRef.current + 1);
          powerRankRef.current = newRank;
          setPowerRank(newRank);
        }
      }
    }
    powerCapsulesRef.current = powerCapsulesRef.current.filter(c => !c.isDead);

    // game items
    for (const item of gameItemsRef.current) {
      if (item.isDead) continue;
      item.pos.addScaledVector(item.vel, delta);
      if (item.pos.z > 6) { item.isDead = true; continue; }

      // magnet attraction
      const distToItem = item.pos.distanceTo(playerPosRef.current);
      if (magnetTimerRef.current > 0 && distToItem < 5.0) {
        const attract = playerPosRef.current.clone().sub(item.pos).normalize().multiplyScalar(6);
        item.vel.lerp(attract, 0.12);
      }

      if (distToItem < ITEM_COLLECT_RADIUS) {
        item.isDead = true;
        // apply effect
        switch (item.itemType) {
          case 'shield':
            shieldTimerRef.current = 5;
            break;
          case 'bomb':
            for (const e of enemiesRef.current) {
              if (!e.isDead) {
                e.isDead = true;
                newScore += 50 * scoreMult;
                newKills++;
              }
            }
            break;
          case 'heal':
            playerHPRef.current = Math.min(3, playerHPRef.current + 1);
            setPlayerHP(playerHPRef.current);
            break;
          case 'speedBoost':
            speedBoostTimerRef.current = 12;
            break;
          case 'scoreBoost':
            scoreBoostTimerRef.current = 20;
            break;
          case 'autoAim':
            autoAimTimerRef.current = 15;
            break;
          case 'magnet':
            magnetTimerRef.current = 15;
            break;
          case 'timeSlow':
            timeSlowTimerRef.current = 8;
            break;
          case 'barrier':
            barrierHitsRef.current = 3;
            break;
          case 'overdrive':
            specialGaugeRef.current = 100;
            break;
        }
        setActiveEffects({
          shieldTimer: shieldTimerRef.current,
          speedBoostTimer: speedBoostTimerRef.current,
          scoreBoostTimer: scoreBoostTimerRef.current,
          autoAimTimer: autoAimTimerRef.current,
          magnetTimer: magnetTimerRef.current,
          timeSlowTimer: timeSlowTimerRef.current,
          barrierHits: barrierHitsRef.current,
        });
      }
    }
    gameItemsRef.current = gameItemsRef.current.filter(i => !i.isDead);

    specialGaugeRef.current = Math.min(100, specialGaugeRef.current + delta * (0.5 + energyEfficiency * 0.03));
    const newGaugeFloor = Math.floor(specialGaugeRef.current);
    if (lastGaugeFloorRef.current !== newGaugeFloor) {
      lastGaugeFloorRef.current = newGaugeFloor;
      if (newGaugeFloor % 5 === 0 || newGaugeFloor >= 100) {
        setSpecialGauge(newGaugeFloor);
        setSpecialAvailable(specialGaugeRef.current >= 100);
      }
    }

    if (specialActiveRef.current) {
      specialTimerRef.current -= delta;
      if (specialTimerRef.current <= 0) {
        specialActiveRef.current = false;
      } else if (shouldFire) {
        for (let sx = -2; sx <= 2; sx++) {
          spawnBullet(
            playerPosRef.current.clone().add(new THREE.Vector3(sx * 0.4, 0, 0)),
            new THREE.Vector3(0, 0, -(BULLET_SPEED * 1.5)),
            'special',
            true
          );
        }
      }
    }

    if (newKills > 0) {
      killCountRef.current += newKills;
      scoreRef.current += newScore;
      setKillCount(killCountRef.current);
      setScore(scoreRef.current);
      if (killCountRef.current >= VICTORY_KILLS && !bossActive && !bossKilledRef.current && !isGameOverRef.current) {
        isGameOverRef.current = true;
        setIsGameOver(true);
        onVictory(killCountRef.current, bossKilledRef.current);
      }
    } else if (newScore > 0) {
      scoreRef.current += newScore;
      setScore(scoreRef.current);
    }

    bulletsRef.current = bulletsRef.current.filter(b => !b.isDead);
    if (bulletsRef.current.length > 300) bulletsRef.current = bulletsRef.current.slice(-300);
    enemiesRef.current = enemiesRef.current.filter(e => !e.isDead);
    asteroidsRef.current = asteroidsRef.current.filter(a => !a.isDead);

  }, [onVictory, onDefeat, BULLET_SPEED, BULLET_DAMAGE, AUTO_FIRE_INTERVAL, averageIntelligence, energyEfficiency, bossActive]);

  return {
    onKillRef,
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
    powerCapsules: powerCapsulesRef,
    powerRank,
    specialGauge,
    specialAvailable,
    optionOrb1PosRef,
    optionOrb2PosRef,
    bossRef,
    bossActive,
    bossHP,
    bossKilled: bossKilledRef,
    activeEffects,
  };
};
