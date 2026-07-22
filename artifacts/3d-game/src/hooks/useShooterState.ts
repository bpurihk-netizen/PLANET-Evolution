import { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export type ShooterEntity = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  hp: number;
  maxHp: number;
  radius: number;
  type: 'scout' | 'heavy' | 'disc' | 'asteroid';
  isDead: boolean;
};

export type BulletType = 'normal' | 'twin' | 'missile' | 'spread' | 'laser' | 'special';

export type Bullet = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isDead: boolean;
  type: BulletType;
  penetrate: boolean;
  homingTargetId?: number;
};

export type PowerCapsule = {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isDead: boolean;
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
  // ゲームオブジェクト
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 3.5));
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<ShooterEntity[]>([]);
  const asteroidsRef = useRef<ShooterEntity[]>([]);
  const nextIdRef = useRef(1);
  const onKillRef = useRef<((pos: THREE.Vector3, type: string) => void) | null>(null);

  // パワーアップ
  const powerRankRef = useRef(startRank); // 0-8
  const [powerRank, setPowerRank] = useState(startRank);
  const powerCapsulesRef = useRef<PowerCapsule[]>([]);
  const capsuleCountRef = useRef(0);

  // OPTIONオーブ
  const playerHistoryRef = useRef<THREE.Vector3[]>([]);
  const MAX_HISTORY = 200;
  const OPTION_DELAY_1 = 60;
  const OPTION_DELAY_2 = 120;
  const optionOrb1PosRef = useRef(new THREE.Vector3(0, 0, 5));
  const optionOrb2PosRef = useRef(new THREE.Vector3(0, 0, 7));

  // 必殺技
  const specialGaugeRef = useRef(0);
  const [specialGauge, setSpecialGauge] = useState(0);
  const specialActiveRef = useRef(false);
  const specialTimerRef = useRef(0);
  const [specialAvailable, setSpecialAvailable] = useState(false);
  const lastGaugeFloorRef = useRef(0);

  // ボス
  const BOSS_TRIGGER_KILLS = 15;
  const [bossKilled, setBossKilled] = useState(false);
  const bossKilledRef = useRef(false);
  const bossRef = useRef<BossState | null>(null);
  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState(0);

  // タイマー
  const autoFireTimerRef = useRef(0);
  const enemySpawnTimerRef = useRef(0);
  const asteroidSpawnTimerRef = useRef(0);
  const gameTimerRef = useRef(60);

  // ゲーム状態
  const [playerHP, setPlayerHP] = useState(3);
  const [score, setScore] = useState(0);
  const [killCount, setKillCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);

  const playerHPRef = useRef(3);
  const scoreRef = useRef(0);
  const killCountRef = useRef(0);
  const isGameOverRef = useRef(false);

  const BULLET_SPEED = 12 + civLevel * 4;
  const BULLET_DAMAGE = 1 + (metallicCoreRatio / 100);
  const AUTO_FIRE_INTERVAL = 0.25;
  const VICTORY_KILLS = 20;
  const PLAYER_RADIUS = 0.6;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const playerTargetXRef = useRef(0);
  const playerTargetZRef = useRef(3.5);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth / 2) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
    // 右半分タップ: 必殺技発動
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
      const dx = (touch.clientX - touchStartRef.current.x) / 80;
      const dy = (touch.clientY - touchStartRef.current.y) / 120;
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

    // プレイヤー軌跡記録
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

    playerPosRef.current.x = THREE.MathUtils.lerp(playerPosRef.current.x, playerTargetXRef.current, 0.2);
    playerPosRef.current.z = THREE.MathUtils.lerp(playerPosRef.current.z, playerTargetZRef.current, 0.2);

    const spawnBullet = (pos: THREE.Vector3, vel: THREE.Vector3, type: BulletType, penetrate: boolean): Bullet => {
      const b: Bullet = { id: nextIdRef.current++, pos, vel, isDead: false, type, penetrate };
      bulletsRef.current.push(b);
      return b;
    };

    let shouldFire = false;
    autoFireTimerRef.current -= delta;
    const rank = powerRankRef.current;
    const fireInterval = rank >= 1
      ? Math.max(0.12, AUTO_FIRE_INTERVAL - rank * 0.015)
      : AUTO_FIRE_INTERVAL;

    if (autoFireTimerRef.current <= 0) {
      autoFireTimerRef.current = fireInterval;
      shouldFire = true;
      const baseSpeed = BULLET_SPEED + (rank >= 1 ? 4 : 0);
      const pPos = playerPosRef.current;

      if (rank <= 1) {
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'normal', false);
      } else if (rank === 2) {
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'twin', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'twin', false);
      } else if (rank === 3) {
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'twin', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'twin', false);
        
        const nearestEnemy = enemiesRef.current.reduce<ShooterEntity | null>((nearest, e) => {
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
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'spread', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(-baseSpeed * 0.3, 0, -baseSpeed * 0.95), 'spread', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(baseSpeed * 0.3, 0, -baseSpeed * 0.95), 'spread', false);
      } else {
        spawnBullet(pPos.clone().add(new THREE.Vector3(0, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'laser', true);
        spawnBullet(pPos.clone().add(new THREE.Vector3(-0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'spread', false);
        spawnBullet(pPos.clone().add(new THREE.Vector3(0.3, 0, -0.5)), new THREE.Vector3(0, 0, -baseSpeed), 'spread', false);
      }

      if (rank >= 6) {
        spawnBullet(optionOrb1PosRef.current.clone(), new THREE.Vector3(0, 0, -baseSpeed), 'normal', false);
      }
      if (rank >= 7) {
        spawnBullet(optionOrb2PosRef.current.clone(), new THREE.Vector3(0, 0, -baseSpeed), 'normal', false);
      }
    }

    enemySpawnTimerRef.current -= delta;
    const spawnInterval = Math.max(1.5, 3.0 - (60 - gameTimerRef.current) * 0.02);
    if (enemySpawnTimerRef.current <= 0) {
      enemySpawnTimerRef.current = spawnInterval;
      const types: ShooterEntity['type'][] = ['scout', 'scout', 'heavy', 'disc'];
      const t = types[Math.floor(Math.random() * types.length)];
      const xPos = (Math.random() - 0.5) * 6;
      enemiesRef.current.push({
        id: nextIdRef.current++,
        pos: new THREE.Vector3(xPos, 0, -12),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0,
          t === 'scout' ? 4.0 : t === 'heavy' ? 2.5 : 3.0
        ),
        hp: t === 'heavy' ? 3 : 1,
        maxHp: t === 'heavy' ? 3 : 1,
        radius: t === 'heavy' ? 1.0 : 0.7,
        type: t,
        isDead: false,
      });
    }

    asteroidSpawnTimerRef.current -= delta;
    if (asteroidSpawnTimerRef.current <= 0) {
      asteroidSpawnTimerRef.current = 4 + Math.random() * 3;
      asteroidsRef.current.push({
        id: nextIdRef.current++,
        pos: new THREE.Vector3((Math.random() - 0.5) * 7, 0, -14),
        vel: new THREE.Vector3((Math.random() - 0.5) * 1.0, 0, 2.5 + Math.random() * 1.5),
        hp: 2,
        maxHp: 2,
        radius: 0.9 + Math.random() * 0.6,
        type: 'asteroid',
        isDead: false,
      });
    }

    for (const b of bulletsRef.current) {
      if (b.isDead) continue;
      if (b.type === 'missile' && b.homingTargetId !== undefined) {
        const target = enemiesRef.current.find(e => e.id === b.homingTargetId && !e.isDead);
        if (target) {
          const dir = target.pos.clone().sub(b.pos).normalize();
          b.vel.lerp(dir.multiplyScalar(b.vel.length()), 0.08 * (averageIntelligence / 100));
        }
      }
      b.pos.addScaledVector(b.vel, delta);
      if (b.pos.z < -18 || b.pos.z > 8 || Math.abs(b.pos.x) > 10) b.isDead = true;
    }

    let newKills = 0;
    let newScore = 0;

    // ボス出現
    if (killCountRef.current >= BOSS_TRIGGER_KILLS && !bossRef.current && !bossKilledRef.current) {
      bossRef.current = {
        pos: new THREE.Vector3(0, 0, -15),
        vel: new THREE.Vector3(0, 0, 1.2),
        phase: 1,
        phaseTimer: 0,
        isDead: false,
        appeared: false,
        weakPoints: [
          { id: nextIdRef.current++, offset: new THREE.Vector3(-1.5, 0, 0), hp: 5, maxHp: 5, radius: 0.7, isDead: false },
          { id: nextIdRef.current++, offset: new THREE.Vector3(0, 0, -0.5), hp: 8, maxHp: 8, radius: 0.8, isDead: false },
          { id: nextIdRef.current++, offset: new THREE.Vector3(1.5, 0, 0), hp: 5, maxHp: 5, radius: 0.7, isDead: false },
        ],
      };
      setBossActive(true);
      setBossHP(3);
    }

    // ボスの更新
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
          if (b.isDead) continue;
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
        playerHPRef.current = Math.max(0, playerHPRef.current - 1);
        setPlayerHP(playerHPRef.current);
        if (playerHPRef.current <= 0 && !isGameOverRef.current) {
          isGameOverRef.current = true;
          setIsGameOver(true);
          onDefeat(killCountRef.current);
        }
      }
    }

    for (const e of enemiesRef.current) {
      if (e.isDead) continue;
      e.pos.addScaledVector(e.vel, delta);
      if (e.type === 'disc') {
        e.vel.x = Math.sin((60 - gameTimerRef.current) * 2 + e.id) * 2;
      }
      if (e.pos.z > 6) { e.isDead = true; continue; }

      for (const b of bulletsRef.current) {
        if (b.isDead) continue;
        if (e.pos.distanceTo(b.pos) < e.radius) {
          if (!b.penetrate) b.isDead = true;
          e.hp -= BULLET_DAMAGE;
          if (e.hp <= 0) {
            e.isDead = true;
            onKillRef.current?.(e.pos.clone(), e.type);
            newKills++;
            newScore += e.type === 'heavy' ? 300 : e.type === 'disc' ? 200 : 100;
            specialGaugeRef.current += 15;
            
            if (Math.random() < 0.3) {
              powerCapsulesRef.current.push({
                id: nextIdRef.current++,
                pos: e.pos.clone(),
                vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, 1.5),
                isDead: false,
              });
            }
          }
        }
      }

      if (!e.isDead && e.pos.distanceTo(playerPosRef.current) < e.radius + PLAYER_RADIUS) {
        e.isDead = true;
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

    for (const a of asteroidsRef.current) {
      if (a.isDead) continue;
      a.pos.addScaledVector(a.vel, delta);
      if (a.pos.z > 6) { a.isDead = true; continue; }

      for (const b of bulletsRef.current) {
        if (b.isDead) continue;
        if (a.pos.distanceTo(b.pos) < a.radius) {
          if (!b.penetrate) b.isDead = true;
          a.hp -= BULLET_DAMAGE;
          if (a.hp <= 0) {
            a.isDead = true;
            onKillRef.current?.(a.pos.clone(), a.type);
            newScore += 50;
            
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

    for (const cap of powerCapsulesRef.current) {
      if (cap.isDead) continue;
      cap.pos.addScaledVector(cap.vel, delta);
      if (cap.pos.z > 6) { cap.isDead = true; continue; }
      const distToCap = cap.pos.distanceTo(playerPosRef.current);
      if (distToCap < 2.0) {
        const attract = playerPosRef.current.clone().sub(cap.pos).normalize().multiplyScalar(8);
        cap.vel.lerp(attract, 0.15);
      }
      if (distToCap < 0.8) {
        cap.isDead = true;
        capsuleCountRef.current++;
        if (capsuleCountRef.current >= 5) {
          capsuleCountRef.current = 0;
          const newRank = Math.min(8, powerRankRef.current + 1);
          powerRankRef.current = newRank;
          setPowerRank(newRank);
        }
      }
    }
    powerCapsulesRef.current = powerCapsulesRef.current.filter(c => !c.isDead);

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
    }

    bulletsRef.current = bulletsRef.current.filter(b => !b.isDead);
    if (bulletsRef.current.length > 200) bulletsRef.current = bulletsRef.current.slice(-200);
    enemiesRef.current = enemiesRef.current.filter(e => !e.isDead);
    asteroidsRef.current = asteroidsRef.current.filter(a => !a.isDead);

  }, [onVictory, onDefeat, BULLET_SPEED, BULLET_DAMAGE, AUTO_FIRE_INTERVAL, averageIntelligence, energyEfficiency, bossActive]);

  return {
    onKillRef,
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
  };
};
