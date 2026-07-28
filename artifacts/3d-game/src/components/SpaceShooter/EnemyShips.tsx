import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShooterEntity } from '../../hooks/useShooterState';

// ─── Original enemy types ────────────────────────────────────────────────────

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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.25, 1.0, 6]} />
        {bodyMaterial}
      </mesh>
      <mesh position={[-0.55, 0, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.35]} />
        {bodyMaterial}
      </mesh>
      <mesh position={[0.55, 0, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.9, 0.06, 0.35]} />
        {bodyMaterial}
      </mesh>
      <mesh position={[-0.25, 0, -0.5]}>
        <boxGeometry args={[0.35, 0.05, 0.2]} />
        {bodyMaterial}
      </mesh>
      <mesh position={[0.25, 0, -0.5]}>
        <boxGeometry args={[0.35, 0.05, 0.2]} />
        {bodyMaterial}
      </mesh>
      <mesh position={[-0.3, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.2, 6]} />
        {bodyMaterial}
      </mesh>
      <mesh position={[0.3, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.2, 6]} />
        {bodyMaterial}
      </mesh>
      <mesh ref={flameLeftRef} position={[-0.3, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.3, 6]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>
      <mesh ref={flameRightRef} position={[0.3, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 0.3, 6]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>
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
      <mesh><boxGeometry args={[1.4, 0.35, 1.6]} />{hullMat}</mesh>
      <mesh position={[0, 0.25, 0]}><boxGeometry args={[1.0, 0.15, 1.2]} />{armorMat}</mesh>
      <mesh position={[-0.8, 0, 0]}><boxGeometry args={[0.2, 0.4, 1.4]} />{armorMat}</mesh>
      <mesh position={[0.8, 0, 0]}><boxGeometry args={[0.2, 0.4, 1.4]} />{armorMat}</mesh>
      <group ref={turretRef} position={[0, 0.15, -0.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.5, 8]} />
          {turretMat}
        </mesh>
        <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.6, 6]} />
          {turretMat}
        </mesh>
      </group>
      <mesh position={[-0.55, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        {hullMat}
      </mesh>
      <mesh position={[0.55, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        {hullMat}
      </mesh>
      <mesh position={[-0.55, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>
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
    groupRef.current.position.copy(entity.pos);
    if (outerRingRef.current) outerRingRef.current.rotation.z += delta * 3.0;
    if (innerRingRef.current) innerRingRef.current.rotation.z -= delta * 4.0;
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 6) * 0.1;
      coreRef.current.scale.set(s, s, s);
    }
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.1, 8, 32]} />
        <meshStandardMaterial color="#664400" metalness={0.9} emissive="#443300" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.12, 8, 24]} />
        <meshStandardMaterial color="#886600" emissive="#664400" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={4} />
      </mesh>
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
      <mesh position={[0, 0.15, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.22, 10, 6]} />
        <meshPhysicalMaterial transmission={0.5} color="#ffcc88" roughness={0} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.35, 0.3, 0.08, 16]} />
        <meshStandardMaterial color="#444444" metalness={0.9} />
      </mesh>
      <pointLight color="#ffcc00" intensity={3} distance={4} />
    </group>
  );
};

// ─── New enemy types ──────────────────────────────────────────────────────────

const BomberShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.08;
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 6) * 0.2;
      coreRef.current.scale.set(s, s, s);
    }
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef}>
      {/* Dark purple squashed body */}
      <mesh scale={[1, 0.55, 1.2]}>
        <sphereGeometry args={[0.75, 12, 8]} />
        <meshStandardMaterial color="#3a005a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Orange glow core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>
      {/* Bomb indicators */}
      <mesh position={[-0.5, 0, 0.3]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.5, 0, 0.3]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#ff4400" intensity={3} distance={4} />
    </group>
  );
};

const EliteShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const engineL = useRef<THREE.Mesh>(null);
  const engineR = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = Math.sin(t * 2) * 0.12;
    const fs = 1 + Math.sin(t * 12) * 0.2;
    if (engineL.current) engineL.current.scale.setScalar(fs);
    if (engineR.current) engineR.current.scale.setScalar(fs);
  });

  if (entity.isDead) return null;
  const hull = <meshStandardMaterial color="#660000" metalness={0.95} roughness={0.05} />;
  const accent = <meshStandardMaterial color="#cc0000" emissive="#880000" emissiveIntensity={1} metalness={0.9} roughness={0.1} />;

  return (
    <group ref={groupRef}>
      {/* Sleek elongated body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.28, 1.6, 6]} />
        {hull}
      </mesh>
      {/* Twin wings */}
      <mesh position={[-0.7, 0, 0.1]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[1.0, 0.05, 0.5]} />
        {hull}
      </mesh>
      <mesh position={[0.7, 0, 0.1]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[1.0, 0.05, 0.5]} />
        {hull}
      </mesh>
      {/* Accent stripe */}
      <mesh position={[0, 0.05, -0.2]}>
        <boxGeometry args={[0.15, 0.06, 1.0]} />
        {accent}
      </mesh>
      {/* Engine left */}
      <mesh ref={engineL} position={[-0.45, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.4, 6]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
      {/* Engine right */}
      <mesh ref={engineR} position={[0.45, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.4, 6]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
      <pointLight color="#ff0000" intensity={3} distance={5} />
    </group>
  );
};

const SwarmShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + entity.id;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = t * 4;
    groupRef.current.rotation.x = t * 2;
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef}>
      <mesh>
        <tetrahedronGeometry args={[0.3]} />
        <meshStandardMaterial color="#ffee00" emissive="#ffcc00" emissiveIntensity={3} metalness={0.4} />
      </mesh>
      <pointLight color="#ffff00" intensity={1.5} distance={2} />
    </group>
  );
};

const SplitterShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.x = Math.sin(t * 1.5) * 0.2;
    groupRef.current.rotation.z = Math.cos(t * 1.2) * 0.15;
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef}>
      {/* Orange diamond (octahedron) */}
      <mesh>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#ff6600" emissive="#cc4400" emissiveIntensity={1.5} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Inner core */}
      <mesh scale={[0.5, 0.5, 0.5]}>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={3} />
      </mesh>
      <pointLight color="#ff6600" intensity={2.5} distance={4} />
    </group>
  );
};

const CarrierShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.05;
  });

  if (entity.isDead) return null;
  const hull = <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.15} />;
  const detail = <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />;

  return (
    <group ref={groupRef}>
      {/* Wide flat body */}
      <mesh><boxGeometry args={[2.6, 0.3, 1.8]} />{hull}</mesh>
      {/* Upper bridge */}
      <mesh position={[0, 0.3, -0.3]}><boxGeometry args={[0.8, 0.35, 0.9]} />{detail}</mesh>
      {/* Hangar bay (rectangular indent) */}
      <mesh position={[0, -0.1, 0.4]}><boxGeometry args={[1.6, 0.15, 0.8]} />{hull}</mesh>
      {/* Side hull thickeners */}
      <mesh position={[-1.0, 0, 0]}><boxGeometry args={[0.6, 0.4, 1.6]} />{detail}</mesh>
      <mesh position={[1.0, 0, 0]}><boxGeometry args={[0.6, 0.4, 1.6]} />{detail}</mesh>
      {/* Engine pods */}
      <mesh position={[-0.9, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        {hull}
      </mesh>
      <mesh position={[0.9, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        {hull}
      </mesh>
      {/* Engine flames */}
      <mesh position={[-0.9, 0, 1.25]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.14, 0.35, 8]} />
        <meshStandardMaterial color="#4488ff" emissive="#2266ff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.9, 0, 1.25]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.14, 0.35, 8]} />
        <meshStandardMaterial color="#4488ff" emissive="#2266ff" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#4466ff" intensity={2} distance={6} />
    </group>
  );
};

const RamjetShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    const charged = entity.charged ?? false;
    if (flameRef.current) {
      const s = charged ? (1.5 + Math.sin(t * 20) * 0.3) : (0.7 + Math.sin(t * 8) * 0.1);
      flameRef.current.scale.set(s, s, s);
    }
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      {/* Narrow spike/torpedo body */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.25, 1.6, 8]} />
        <meshStandardMaterial color="#ccccdd" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Nose spike */}
      <mesh position={[0, -0.95, 0]}>
        <coneGeometry args={[0.05, 0.4, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaaaff" emissiveIntensity={1} />
      </mesh>
      {/* Engine flame */}
      <mesh ref={flameRef} position={[0, 0.95, 0]}>
        <coneGeometry args={[0.22, 0.5, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} />
      </mesh>
      <pointLight color="#aaaaff" intensity={3} distance={4} />
    </group>
  );
};

const SentinelShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.08;
    if (turretRef.current) {
      turretRef.current.rotation.y = t * 1.5;
    }
  });

  if (entity.isDead) return null;
  const hex = <meshStandardMaterial color="#224422" metalness={0.9} roughness={0.1} />;

  return (
    <group ref={groupRef}>
      {/* Hexagonal base */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.35, 6]} />
        {hex}
      </mesh>
      {/* Upper platform */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.2, 6]} />
        <meshStandardMaterial color="#336633" metalness={0.8} roughness={0.15} />
      </mesh>
      {/* Rotating turret */}
      <group ref={turretRef} position={[0, 0.45, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.4, 8]} />
          <meshStandardMaterial color="#114411" metalness={0.95} roughness={0.05} />
        </mesh>
        {/* Barrel */}
        <mesh position={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
          <meshStandardMaterial color="#00aa00" emissive="#004400" emissiveIntensity={1} />
        </mesh>
      </group>
      {/* Stabilizer legs */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos((i / 3) * Math.PI * 2) * 0.7, -0.15, Math.sin((i / 3) * Math.PI * 2) * 0.7]}>
          <boxGeometry args={[0.1, 0.3, 0.1]} />
          {hex}
        </mesh>
      ))}
      <pointLight color="#00ff44" intensity={2} distance={5} />
    </group>
  );
};

const PhantomShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current || !bodyRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = Math.sin(t * 2) * 0.2;
    // flicker opacity based on entity.visible
    const targetOpacity = entity.visible !== false ? 0.75 : 0.15;
    const mat = bodyRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef}>
      {/* Translucent blue ghost body */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial
          color="#4466ff" emissive="#2244cc" emissiveIntensity={2}
          transparent opacity={0.75} depthWrite={false}
        />
      </mesh>
      {/* Ghost tendrils */}
      {[-0.3, 0, 0.3].map((xo, i) => (
        <mesh key={i} position={[xo, -0.5, 0]} scale={[0.5, 1, 0.5]}>
          <coneGeometry args={[0.1, 0.4, 4]} />
          <meshStandardMaterial color="#2233ff" emissive="#1122cc" emissiveIntensity={2} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
      <pointLight color="#4488ff" intensity={2} distance={4} />
    </group>
  );
};

const CrystalShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.x += delta * 0.7;
    groupRef.current.rotation.y += delta * 1.1;
  });

  if (entity.isDead) return null;

  return (
    <group ref={groupRef}>
      {/* Cyan icosahedron */}
      <mesh>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#00eeff" emissive="#00ccdd" emissiveIntensity={2} metalness={0.2} roughness={0.0} transparent opacity={0.85} />
      </mesh>
      {/* Inner sparkle */}
      <mesh scale={[0.5, 0.5, 0.5]}>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaffff" emissiveIntensity={5} transparent opacity={0.7} />
      </mesh>
      <pointLight color="#00ffff" intensity={3.5} distance={6} />
    </group>
  );
};

const DreadnoughtShip: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const groupRef = useRef<THREE.Group>(null);
  const turret1Ref = useRef<THREE.Group>(null);
  const turret2Ref = useRef<THREE.Group>(null);
  const turret3Ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.copy(entity.pos);
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.05;
    const tr = t * 0.8;
    if (turret1Ref.current) turret1Ref.current.rotation.y = Math.sin(tr) * 0.5;
    if (turret2Ref.current) turret2Ref.current.rotation.y = Math.sin(tr + 1) * 0.5;
    if (turret3Ref.current) turret3Ref.current.rotation.y = Math.sin(tr + 2) * 0.5;
  });

  if (entity.isDead) return null;
  const hull = <meshStandardMaterial color="#222233" metalness={0.95} roughness={0.08} />;
  const armor = <meshStandardMaterial color="#333344" metalness={0.9} roughness={0.12} />;
  const glow = <meshStandardMaterial color="#660066" emissive="#440044" emissiveIntensity={2} />;

  const Turret = ({ pos, gRef }: { pos: [number, number, number]; gRef: React.RefObject<THREE.Group | null> }) => (
    <group ref={gRef} position={pos}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.5, 8]} />
        {armor}
      </mesh>
      <mesh position={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 6]} />
        {glow}
      </mesh>
      <mesh position={[0, 0, -0.45]} scale={[1, 1, 0.3]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#ff00ff" emissive="#cc00cc" emissiveIntensity={4} />
      </mesh>
    </group>
  );

  return (
    <group ref={groupRef}>
      {/* Main hull */}
      <mesh><boxGeometry args={[2.8, 0.5, 3.0]} />{hull}</mesh>
      {/* Upper superstructure */}
      <mesh position={[0, 0.4, -0.5]}><boxGeometry args={[1.8, 0.4, 1.5]} />{armor}</mesh>
      <mesh position={[0, 0.65, -0.5]}><boxGeometry args={[1.0, 0.25, 1.0]} />{armor}</mesh>
      {/* Side hull extensions */}
      <mesh position={[-1.3, 0, 0.3]}><boxGeometry args={[0.25, 0.6, 2.4]} />{armor}</mesh>
      <mesh position={[1.3, 0, 0.3]}><boxGeometry args={[0.25, 0.6, 2.4]} />{armor}</mesh>
      {/* Turrets */}
      <Turret pos={[-0.8, 0.6, -0.3]} gRef={turret1Ref} />
      <Turret pos={[0, 0.75, -0.8]} gRef={turret2Ref} />
      <Turret pos={[0.8, 0.6, -0.3]} gRef={turret3Ref} />
      {/* Engine trail */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.18, 0.55, 8]} />
          <meshStandardMaterial color="#9900ff" emissive="#7700cc" emissiveIntensity={3} />
        </mesh>
      ))}
      <pointLight color="#aa00ff" intensity={4} distance={8} />
    </group>
  );
};

// ─── EnemyShips aggregator ────────────────────────────────────────────────────

interface EnemyShipsProps {
  enemiesRef: React.MutableRefObject<ShooterEntity[]>;
}

// Scale factors per enemy type — keeps them clearly smaller than the player ship
const ENEMY_SCALE: Record<string, number> = {
  scout: 0.52, heavy: 0.48, disc: 0.52, bomber: 0.48, elite: 0.52,
  swarm: 0.38, splitter: 0.46, carrier: 0.40, ramjet: 0.52,
  sentinel: 0.46, phantom: 0.52, crystal: 0.46, dreadnought: 0.34,
};

export const EnemyShips: React.FC<EnemyShipsProps> = ({ enemiesRef }) => {
  return (
    <>
      {enemiesRef.current.map(e => {
        const scale = ENEMY_SCALE[e.type] ?? 0.5;
        let ship: React.ReactNode = null;
        if (e.type === 'scout')       ship = <ScoutShip key={e.id} entity={e} />;
        else if (e.type === 'heavy')  ship = <HeavyShip key={e.id} entity={e} />;
        else if (e.type === 'disc')   ship = <DiscShip key={e.id} entity={e} />;
        else if (e.type === 'bomber') ship = <BomberShip key={e.id} entity={e} />;
        else if (e.type === 'elite')  ship = <EliteShip key={e.id} entity={e} />;
        else if (e.type === 'swarm')  ship = <SwarmShip key={e.id} entity={e} />;
        else if (e.type === 'splitter')    ship = <SplitterShip key={e.id} entity={e} />;
        else if (e.type === 'carrier')     ship = <CarrierShip key={e.id} entity={e} />;
        else if (e.type === 'ramjet')      ship = <RamjetShip key={e.id} entity={e} />;
        else if (e.type === 'sentinel')    ship = <SentinelShip key={e.id} entity={e} />;
        else if (e.type === 'phantom')     ship = <PhantomShip key={e.id} entity={e} />;
        else if (e.type === 'crystal')     ship = <CrystalShip key={e.id} entity={e} />;
        else if (e.type === 'dreadnought') ship = <DreadnoughtShip key={e.id} entity={e} />;
        if (!ship) return null;
        // Outer scale group: inner component still positions itself via useFrame on its own groupRef
        return <group key={e.id} scale={scale}>{ship}</group>;
      })}
    </>
  );
};
