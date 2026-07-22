import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BossState } from '../../hooks/useShooterState';

const WeakPointMesh: React.FC<{
  offset: THREE.Vector3;
  hp: number;
  maxHp: number;
  isDead: boolean;
}> = ({ offset, hp, maxHp, isDead }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 3;
      ref.current.rotation.x = state.clock.elapsedTime * 2;
    }
  });
  if (isDead) return null;
  const ratio = hp / maxHp;
  const color = ratio > 0.6
    ? new THREE.Color(0.0, 1.0, 0.5)
    : ratio > 0.3
    ? new THREE.Color(1.0, 0.8, 0.0)
    : new THREE.Color(1.0, 0.2, 0.0);
  return (
    <mesh ref={ref} position={offset.toArray()}>
      <octahedronGeometry args={[0.5]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.0}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

export const BossShip: React.FC<{ bossRef: React.MutableRefObject<BossState | null> }> = ({ bossRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const boss = bossRef.current;
    if (!boss || boss.isDead) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) {
      groupRef.current.visible = true;
      groupRef.current.position.copy(boss.pos);
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
    }
    if (wingLRef.current) wingLRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.08;
    if (wingRRef.current) wingRRef.current.rotation.z = -Math.sin(state.clock.elapsedTime * 2) * 0.08;
  });

  const boss = bossRef.current;
  if (!boss) return null;

  return (
    <group ref={groupRef}>
      {/* 本体中央 */}
      <mesh>
        <cylinderGeometry args={[0.6, 1.2, 1.8, 8]} />
        <meshStandardMaterial
          color={new THREE.Color(0.3, 0.1, 0.4)}
          emissive={new THREE.Color(0.2, 0.0, 0.3)}
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* 左翼 */}
      <mesh ref={wingLRef} position={[-2.5, 0, 0.2]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[2.5, 0.15, 1.5]} />
        <meshStandardMaterial color={new THREE.Color(0.25, 0.08, 0.35)} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 右翼 */}
      <mesh ref={wingRRef} position={[2.5, 0, 0.2]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[2.5, 0.15, 1.5]} />
        <meshStandardMaterial color={new THREE.Color(0.25, 0.08, 0.35)} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 艦橋 */}
      <mesh position={[0, 0.8, -0.3]}>
        <boxGeometry args={[0.6, 0.4, 0.8]} />
        <meshStandardMaterial
          color={new THREE.Color(0.5, 0.1, 0.6)}
          emissive={new THREE.Color(0.4, 0.0, 0.5)}
          emissiveIntensity={1.0}
        />
      </mesh>
      {/* エンジンノズル（後部） */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0, 1.0]}>
          <cylinderGeometry args={[0.18, 0.28, 0.4, 8]} />
          <meshBasicMaterial color={new THREE.Color(0.8, 0.3, 1.0)} />
        </mesh>
      ))}
      {/* ボス光源 */}
      <pointLight color={new THREE.Color(0.6, 0.0, 1.0)} intensity={4} distance={8} />

      {/* 弱点コア（生存時のみ） */}
      {boss.weakPoints.map((wp) => (
        <WeakPointMesh
          key={wp.id}
          offset={wp.offset}
          hp={wp.hp}
          maxHp={wp.maxHp}
          isDead={wp.isDead}
        />
      ))}
    </group>
  );
};
