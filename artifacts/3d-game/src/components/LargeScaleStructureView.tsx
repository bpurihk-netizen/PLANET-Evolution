/**
 * LargeScaleStructureView — 宇宙の大規模構造（LSS）3Dビュー
 * フィラメント粒子フロー・ボイド演出・NASA APOD背景を追加
 */
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { ALL_LSS_FEATURES, LSSFeature } from '../data/cosmicHierarchy';
import { fetchApod, ApodImage } from '../utils/nasaApi';

// ── 背景星フィールド ─────────────────────────────────────────────────────────
const StarBackground: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 4000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#cce8ff" size={0.14} sizeAttenuation transparent opacity={0.5} />
    </points>
  );
};

// ── フィラメント構造セグメント ────────────────────────────────────────────────
interface FilamentSeg {
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  len: number;
}

function buildFilamentSegs(): FilamentSeg[] {
  const nodes = ALL_LSS_FEATURES.filter(f => f.type === 'supercluster' || f.type === 'node');
  const segs: FilamentSeg[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].pos, b = nodes[j].pos;
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 14) segs.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, len });
    }
  }
  return segs;
}

// ── フィラメント粒子フロー ────────────────────────────────────────────────────
const FilamentFlowParticles: React.FC = () => {
  const COUNT = 1800;
  const posArr = useMemo(() => new Float32Array(COUNT * 3), []);
  const dataRef = useRef<Array<{ seg: number; t: number; speed: number; spread: THREE.Vector3 }>>([]);
  const pointsRef = useRef<THREE.Points>(null);

  const segs = useMemo(buildFilamentSegs, []);

  useEffect(() => {
    if (segs.length === 0) return;
    const data: typeof dataRef.current = [];
    for (let i = 0; i < COUNT; i++) {
      const si = Math.floor(Math.random() * segs.length);
      const t = Math.random();
      const s = segs[si];
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
      );
      data.push({ seg: si, t, speed: 0.025 + Math.random() * 0.06, spread });
      posArr[i * 3]     = s.ax + (s.bx - s.ax) * t + spread.x;
      posArr[i * 3 + 1] = s.ay + (s.by - s.ay) * t + spread.y;
      posArr[i * 3 + 2] = s.az + (s.bz - s.az) * t + spread.z;
    }
    dataRef.current = data;
  }, [segs, posArr]);

  useFrame((_, dt) => {
    if (segs.length === 0 || dataRef.current.length === 0) return;
    const pos = posArr;
    for (let i = 0; i < COUNT; i++) {
      const d = dataRef.current[i];
      if (!d) continue;
      d.t += d.speed * dt;
      if (d.t > 1) {
        d.t = 0;
        d.seg = Math.floor(Math.random() * segs.length);
        d.spread.set(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
        );
      }
      const s = segs[d.seg];
      pos[i * 3]     = s.ax + (s.bx - s.ax) * d.t + d.spread.x;
      pos[i * 3 + 1] = s.ay + (s.by - s.ay) * d.t + d.spread.y;
      pos[i * 3 + 2] = s.az + (s.bz - s.az) * d.t + d.spread.z;
    }
    const pts = pointsRef.current;
    if (pts) {
      (pts.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posArr, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#88AAFF" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
};

// ── グロー粒子（宇宙の霧） ───────────────────────────────────────────────────
const CosmicHaze: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 3000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // Scatter along filaments with more spread
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 20;
      pos[i * 3]     = Math.cos(angle) * r * (0.5 + Math.random());
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = Math.sin(angle) * r * (0.5 + Math.random());
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#4455AA" size={0.09} sizeAttenuation transparent opacity={0.18} />
    </points>
  );
};

// ── フィラメント線 ─────────────────────────────────────────────────────────
const Filaments: React.FC = () => {
  const geo = useMemo(() => {
    const segs = buildFilamentSegs();
    const pts: number[] = [];
    segs.forEach(s => pts.push(s.ax, s.ay, s.az, s.bx, s.by, s.bz));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#2244AA" transparent opacity={0.5} />
    </lineSegments>
  );
};

// ── ボイド（宇宙の暗黒領域） ──────────────────────────────────────────────
const VoidMesh: React.FC<{ feature: LSSFeature }> = ({ feature }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + 0.04 * Math.sin(state.clock.elapsedTime * 0.4);
      meshRef.current.scale.setScalar(pulse);
    }
  });
  const { pos, sizeMLy } = feature;
  const scale = Math.max(1.5, sizeMLy / 200);
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Outer dim shell */}
      <mesh ref={meshRef} scale={scale}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#050a1a" transparent opacity={0.18} wireframe />
      </mesh>
      {/* Inner dark core */}
      <mesh scale={scale * 0.7}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshBasicMaterial color="#020408" transparent opacity={0.35} />
      </mesh>
      <Html center position={[0, scale * 1.5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#335566',
          fontSize: '8px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          {feature.nameJa.substring(0, 12)}
        </div>
      </Html>
    </group>
  );
};

// ── フィラメント・ウォール ──────────────────────────────────────────────────
const FilamentWallMesh: React.FC<{ feature: LSSFeature }> = ({ feature }) => {
  const { pos, color } = feature;
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Elongated cylinder representing a filament or wall */}
      <mesh rotation={[0.3, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 3.0, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.55} />
      </mesh>
      <Html center position={[0, 2.2, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#8899AA', fontSize: '8px', fontFamily: 'monospace', whiteSpace: 'nowrap', userSelect: 'none' }}>
          {feature.nameJa.substring(0, 10)}
        </div>
      </Html>
    </group>
  );
};

// ── 個別LSSフィーチャーメッシュ ─────────────────────────────────────────────
const LSSFeatureMesh: React.FC<{
  feature: LSSFeature;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ feature, isSelected, onSelect }) => {
  const meshRef  = useRef<THREE.Mesh>(null);
  const ringRef  = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current && feature.isHome) meshRef.current.rotation.y = t * 0.2;
    if (isSelected && ringRef.current) {
      ringRef.current.rotation.z = t * 0.9;
      ringRef.current.rotation.x = t * 0.3;
    }
    if (glowRef.current) {
      const pulse = 1 + 0.07 * Math.sin(t * 1.8);
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const { pos, color, type, sizeMLy } = feature;

  if (type === 'void') return <VoidMesh feature={feature} />;
  if (type === 'filament' || type === 'wall') return <FilamentWallMesh feature={feature} />;

  const scale = Math.max(0.55, Math.min(3.0, sizeMLy / 200));
  const isInteractive = type === 'supercluster';

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={isInteractive ? (e) => { e.stopPropagation(); onSelect(feature.id); } : undefined}
      >
        <sphereGeometry args={[0.65, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={feature.isHome ? 1.2 : 0.7}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>

      {/* Outer glow halo */}
      <mesh ref={glowRef} scale={scale * 1.65}>
        <sphereGeometry args={[0.65, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={feature.isHome ? 0.18 : 0.08} />
      </mesh>

      {/* Extended dim halo for superclusters */}
      {isInteractive && (
        <mesh scale={scale * 2.8}>
          <sphereGeometry args={[0.65, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.04} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && isInteractive && (
        <mesh ref={ringRef} scale={scale * 1.85}>
          <torusGeometry args={[0.9, 0.05, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>
      )}

      {/* Point light */}
      {isInteractive && (
        <pointLight color={color} intensity={feature.isHome ? 3.5 : 1.8} distance={12} />
      )}

      {/* HTML label */}
      {isInteractive && (
        <Html center position={[0, scale * 0.65 + 0.55, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: feature.isHome ? '#FFD700' : '#aaccff',
            fontSize: '9px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textShadow: '0 0 8px rgba(100,150,255,0.9)',
            userSelect: 'none',
          }}>
            {feature.isHome ? '★ ' : ''}{feature.nameJa.split('（')[0].substring(0, 12)}
          </div>
        </Html>
      )}
    </group>
  );
};

// ── 選択時カメラフォーカス ────────────────────────────────────────────────────
const CameraFocusOnSelect: React.FC<{ selectedId: string | null }> = ({ selectedId }) => {
  const { camera, controls } = useThree();

  React.useEffect(() => {
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!selectedId) return;
    const feature = ALL_LSS_FEATURES.find(f => f.id === selectedId);
    if (!feature) return;
    const orb = controls as any;
    const { x, y, z } = feature.pos;
    const scale = Math.max(0.55, Math.min(3.0, feature.sizeMLy / 200));
    const dist = scale * 5 + 8;
    camera.position.set(x, y + scale * 2, z + dist);
    camera.lookAt(x, y, z);
    if (orb?.target) { orb.target.set(x, y, z); orb.update(); }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

// ── 3Dシーン ─────────────────────────────────────────────────────────────────
const LSSScene: React.FC<{
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ selectedId, onSelect }) => {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 20, 10]} intensity={0.5} color="#8899cc" />
      <StarBackground />
      <CosmicHaze />
      <Filaments />
      <FilamentFlowParticles />
      {ALL_LSS_FEATURES.map(f => (
        <LSSFeatureMesh
          key={f.id}
          feature={f}
          isSelected={selectedId === f.id}
          onSelect={onSelect}
        />
      ))}
      <CameraFocusOnSelect selectedId={selectedId} />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        minDistance={3}
        maxDistance={65}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
};

// ── NASA APOD 背景 ────────────────────────────────────────────────────────────
const APODBackground: React.FC = () => {
  const [apod, setApod] = useState<ApodImage | null>(null);
  useEffect(() => { fetchApod().then(setApod); }, []);
  if (!apod) return null;
  return (
    <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
      <img
        src={apod.url}
        alt="NASA APOD"
        className="w-full h-full object-cover opacity-8 blur-sm scale-110"
        style={{ opacity: 0.08 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#010510]/92 via-[#010510]/55 to-[#010510]/92" />
    </div>
  );
};

// ── メインコンポーネント ─────────────────────────────────────────────────────
interface Props { state: SolarSystemState }

export const LargeScaleStructureView: React.FC<Props> = ({ state }) => {
  const [apod, setApod] = useState<ApodImage | null>(null);
  useEffect(() => { fetchApod().then(setApod); }, []);

  return (
    <div className="absolute inset-0 bg-[#010510]">
      {/* APOD background layer */}
      <APODBackground />

      <Canvas
        camera={{ position: [0, 18, 28], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#010510']} />
        <LSSScene
          selectedId={state.selectedCosmicId}
          onSelect={state.selectCosmicObject}
        />
      </Canvas>

      {/* 操作ヒント */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-14 pointer-events-none">
        {!state.selectedCosmicId && (
          <p className="text-white/22 text-xs text-center animate-pulse">
            超銀河団をタップして探索 · 2本指で回転
          </p>
        )}
      </div>

      {/* APOD クレジット */}
      {apod && (
        <div className="absolute bottom-28 right-3 pointer-events-none">
          <p className="text-white/20 text-[8px] font-mono">NASA APOD: {apod.title.substring(0, 28)}…</p>
        </div>
      )}
    </div>
  );
};
