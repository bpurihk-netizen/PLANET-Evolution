import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShooterEntity } from '../../hooks/useShooterState';

const ScoutShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const flameLeftRef = useRef<THREE.Mesh>(null);
  const flameRightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = Math.sin(t * 1.5) * 0.1;
    
    const flameScale = 1 + Math.sin(t * 10) * 0.15;
    if (flameLeftRef.current) flameLeftRef.current.scale.set(1, flameScale, 1);
    if (flameRightRef.current) flameRightRef.current.scale.set(1, flameScale, 1);
  });

  if (entity.isDead) return null;

  const bodyMaterial = <meshStandardMaterial color="#550000" metalness={0.9} roughness={0.1} />;

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.25, 1.0, 6]} />
        {bodyMaterial}
      </mesh>
      
      {/* Left wing */}
      <mesh position={[-0.55, 0, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.35]} />
        {bodyMaterial}
      </mesh>

      {/* Right wing */}
      <mesh position={[0.55, 0, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.35]} />
        {bodyMaterial}
      </mesh>

      {/* Front wing left */}
      <mesh position={[-0.25, 0, -0.5]}>
        <boxGeometry args={[0.35, 0.05, 0.2]} />
        {bodyMaterial}
      </mesh>

      {/* Front wing right */}
      <mesh position={[0.25, 0, -0.5]}>
        <boxGeometry args={[0.35, 0.05, 0.2]} />
        {bodyMaterial}
      </mesh>

      {/* Engine left */}
      <mesh position={[-0.3, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.2, 6]} />
        {bodyMaterial}
      </mesh>

      {/* Engine right */}
      <mesh position={[0.3, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.2, 6]} />
        {bodyMaterial}
      </mesh>

      {/* Engine flame left */}
      <mesh ref={flameLeftRef} position={[-0.3, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.3, 6]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>

      {/* Engine flame right */}
      <mesh ref={flameRightRef} position={[0.3, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.3, 6]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.08, -0.3]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={3} />
      </mesh>

      <pointLight color="#ff3300" intensity={2} distance={3.5} />
    </group>
  );
};

const HeavyShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.15;

    if (turretRef.current) {
      turretRef.current.rotation.y = Math.sin(t * 2) * 0.1;
    }
  });

  if (entity.isDead) return null;

  const hullMat = <meshStandardMaterial color="#331100" metalness={0.95} roughness={0.05} />;
  const armorMat = <meshStandardMaterial color="#442200" metalness={0.95} roughness={0.05} />;
  const turretMat = <meshStandardMaterial color="#221100" emissive="#330000" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />;

  return (
    <group ref={groupRef}>
      {/* Main hull */}
      <mesh>
        <boxGeometry args={[1.4, 0.35, 1.6]} />
        {hullMat}
      </mesh>

      {/* Upper armor */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.0, 0.15, 1.2]} />
        {armorMat}
      </mesh>

      {/* Left armor */}
      <mesh position={[-0.8, 0, 0]}>
        <boxGeometry args={[0.2, 0.4, 1.4]} />
        {armorMat}
      </mesh>

      {/* Right armor */}
      <mesh position={[0.8, 0, 0]}>
        <boxGeometry args={[0.2, 0.4, 1.4]} />
        {armorMat}
      </mesh>

      {/* Turret */}
      <group ref={turretRef} position={[0, 0.15, -0.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.5, 8]} />
          {turretMat}
        </mesh>
        {/* Cannon */}
        <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 6]} />
          {turretMat}
        </mesh>
      </group>

      {/* Engine pod left */}
      <mesh position={[-0.55, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        {hullMat}
      </mesh>

      {/* Engine pod right */}
      <mesh position={[0.55, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        {hullMat}
      </mesh>

      {/* Engine flame left */}
      <mesh position={[-0.55, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>

      {/* Engine flame right */}
      <mesh position={[0.55, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>

      <pointLight color="#ff4400" intensity={2.5} distance={5} />
    </group>
  );
};

const DiscShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    
    // Position tracks entity. Disc movement (sway) is already in entity.vel.x
    groupRef.current.position.copy(entity.pos);

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 3.0;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 4.0;
    }
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 6) * 0.1;
      coreRef.current.scale.set(s, s, s);
    }
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef}>
      {/* Outer ring */}
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.1, 8, 32]} />
        <meshStandardMaterial color="#664400" metalness={0.9} emissive="#443300" emissiveIntensity={0.5} />
      </mesh>

      {/* Inner ring */}
      <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.12, 8, 24]} />
        <meshStandardMaterial color="#886600" emissive="#664400" emissiveIntensity={0.8} />
      </mesh>

      {/* Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={4} />
      </mesh>

      {/* Spikes */}
      <mesh position={[0.75, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.06, 0.4, 4]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.06, 0.4, 4]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.4, 4]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0, 0, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.4, 4]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={1} />
      </mesh>

      {/* Upper dome */}
      <mesh position={[0, 0.15, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.22, 10, 6]} />
        <meshPhysicalMaterial transmission={0.5} color="#ffcc88" roughness={0} />
      </mesh>

      {/* Bottom disc */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.35, 0.3, 0.08, 16]} />
        <meshStandardMaterial color="#444444" metalness={0.9} />
      </mesh>

      <pointLight color="#ffcc00" intensity={3} distance={4} />
    </group>
  );
};

interface EnemyShipsProps {
  enemiesRef: React.MutableRefObject<ShooterEntity[]>;
}

export const EnemyShips: React.FC<EnemyShipsProps> = ({ enemiesRef }) => {
  return (
    <>
      {enemiesRef.current.map(e => {
        if (e.type === 'scout') return <ScoutShip key={e.id} entity={e} />;
        if (e.type === 'heavy') return <HeavyShip key={e.id} entity={e} />;
        if (e.type === 'disc') return <DiscShip key={e.id} entity={e} />;
        return null;
      })}
    </>
  );
};
