/**
 * GalaxyView — 個別銀河（渦巻・楕円など）の3Dビュー
 * 天の川銀河では内部の星系マーカーも表示
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { getGalaxyById } from '../data/cosmicHierarchy';

// ── 背景星 ───────────────────────────────────────────────────────────────────
const StarBg: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 4000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 50 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ddeeff" size={0.1} sizeAttenuation transparent opacity={0.4} />
    </points>
  );
};

// ── 渦巻銀河パーティクル ─────────────────────────────────────────────────────
const SpiralGalaxy: React.FC<{ color: string; diskColor?: string; bulgColor?: string; numArms?: number }> = ({
  color, diskColor, bulgColor, numArms = 2,
}) => {
  const mainColor = diskColor ?? color;
  const bulgeColor = bulgColor ?? '#ffffff';

  // ディスク（渦巻腕）
  const diskGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 25000;
    const pos = new Float32Array(n * 3);
    const cols = new Float32Array(n * 3);
    const mc = new THREE.Color(mainColor);
    const bc = new THREE.Color(bulgeColor);

    for (let i = 0; i < n; i++) {
      const arm = Math.floor(Math.random() * numArms);
      const t = Math.random();
      const r = 0.3 + t * 5.0;
      const spread = (0.4 + t * 0.8) * (Math.random() - 0.5);
      const spin = t * Math.PI * 3; // 渦巻の巻数
      const angle = (arm / numArms) * Math.PI * 2 + spin + spread * 0.3;
      const vy = (Math.random() - 0.5) * (0.08 + t * 0.12);

      pos[i * 3] = r * Math.cos(angle) + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = vy;
      pos[i * 3 + 2] = r * Math.sin(angle) + (Math.random() - 0.5) * 0.2;

      // 中心に近いほど白っぽく
      const blend = Math.max(0, 1 - r / 3);
      const c = mc.clone().lerp(bc, blend);
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  }, [mainColor, bulgeColor, numArms]);

  // バルジ（中心核）
  const bulgeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 5000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.random() ** 2 * 1.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <group ref={groupRef} rotation={[Math.PI * 0.12, 0, 0]}>
      <points geometry={diskGeo}>
        <pointsMaterial size={0.04} sizeAttenuation vertexColors transparent opacity={0.8} />
      </points>
      <points geometry={bulgeGeo}>
        <pointsMaterial size={0.06} sizeAttenuation color={bulgeColor} transparent opacity={0.9} />
      </points>
      <pointLight color={bulgeColor} intensity={2} distance={3} />
    </group>
  );
};

// ── 楕円銀河 ────────────────────────────────────────────────────────────────
const EllipticalGalaxy: React.FC<{ color: string }> = ({ color }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 20000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.random() ** 0.5 * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * 1.4 * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * 0.8 * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <group ref={groupRef}>
      <points geometry={geo}>
        <pointsMaterial size={0.05} sizeAttenuation color={color} transparent opacity={0.7} />
      </points>
      <pointLight color={color} intensity={1.5} distance={5} />
    </group>
  );
};

// ── 不規則銀河 ──────────────────────────────────────────────────────────────
const IrregularGalaxy: React.FC<{ color: string }> = ({ color }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 12000;
    const pos = new Float32Array(n * 3);
    const seed = Math.random() * 100;
    for (let i = 0; i < n; i++) {
      const clump = Math.floor(Math.random() * 4);
      const cx = [0, 1.5, -1.2, 0.3][clump] + seed * 0.001;
      const cy = [0, 0.4, -0.3, 0.8][clump];
      const cz = [0, -0.8, 0.9, -0.5][clump];
      const r = Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = cx + r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = cy + r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = cz + r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial size={0.05} sizeAttenuation color={color} transparent opacity={0.75} />
    </points>
  );
};

// ── 星系マーカー（天の川用） ────────────────────────────────────────────────
const StarSystemMarkers: React.FC<{
  onSelectSystem: (id: string) => void;
  currentSystemId: string;
}> = ({ onSelectSystem, currentSystemId }) => {
  // 天の川内の既知星系の概念的な位置
  const markers = useMemo(() => [
    { id: 'solar-system', label: '太陽系', pos: new THREE.Vector3(2.2, 0.05, 0.8), color: '#FFD700' },
    { id: 'alpha-centauri', label: 'α ケンタウリ', pos: new THREE.Vector3(2.18, 0.05, 0.82), color: '#FFDD88' },
    { id: 'trappist1', label: 'TRAPPIST-1', pos: new THREE.Vector3(2.5, 0.08, 1.2), color: '#FF8866' },
    { id: 'kepler442', label: 'ケプラー442', pos: new THREE.Vector3(3.2, 0.1, -1.5), color: '#FF9944' },
  ], []);

  return (
    <>
      {markers.map(m => (
        <group key={m.id} position={m.pos.toArray()}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectSystem(m.id); }}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={m.id === currentSystemId ? '#FFD700' : m.color} />
          </mesh>
          {/* Glow */}
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color={m.color} transparent opacity={0.3} />
          </mesh>
          <pointLight color={m.color} intensity={0.8} distance={1.0} />
          <Html center position={[0, 0.18, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              color: m.id === currentSystemId ? '#FFD700' : '#ccddff',
              fontSize: '7px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              textShadow: '0 0 4px rgba(0,100,255,0.8)',
              fontWeight: 'bold',
            }}>
              {m.id === currentSystemId ? '★ ' : ''}{m.label}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
};

// ── 3Dシーン ─────────────────────────────────────────────────────────────────
const GalaxyScene: React.FC<{
  galaxyId: string;
  currentSystemId: string;
  onSelectSystem: (id: string) => void;
}> = ({ galaxyId, currentSystemId, onSelectSystem }) => {
  const galaxy = getGalaxyById(galaxyId);
  const { camera } = useThree();

  React.useEffect(() => {
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <StarBg />
      {(galaxy.type === 'spiral' || galaxy.type === 'barred-spiral') && (
        <SpiralGalaxy
          color={galaxy.color}
          diskColor={galaxy.diskColor}
          bulgColor={galaxy.bulgColor}
          numArms={galaxy.type === 'barred-spiral' ? 4 : 2}
        />
      )}
      {(galaxy.type === 'elliptical' || galaxy.type === 'lenticular') && (
        <EllipticalGalaxy color={galaxy.color} />
      )}
      {(galaxy.type === 'irregular' || galaxy.type === 'dwarf') && (
        <IrregularGalaxy color={galaxy.color} />
      )}
      {/* 天の川銀河のみ星系マーカーを表示 */}
      {galaxy.isDrillable && galaxy.starSystemIds.length > 0 && (
        <StarSystemMarkers
          currentSystemId={currentSystemId}
          onSelectSystem={onSelectSystem}
        />
      )}
      <OrbitControls
        enablePan enableZoom
        minDistance={3}
        maxDistance={25}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
};

// ── メインコンポーネント ─────────────────────────────────────────────────────
interface Props { state: SolarSystemState }

export const GalaxyView: React.FC<Props> = ({ state }) => {
  const galaxy = getGalaxyById(state.currentGalaxyId);

  const handleSelectSystem = (id: string) => {
    if (id === state.currentSystemId) {
      // 既にこの星系を表示中 → ワープ不要、宇宙モードを終了して星系ビューへ
      state.returnToSystemView();
    } else {
      // 別の星系へワープ → completeWarp 完了後に cosmicLevel が 'system' に自動リセット
      state.switchSystem(id);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#000408]">
      <Canvas
        camera={{ position: [0, 8, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000408']} />
        <GalaxyScene
          galaxyId={state.currentGalaxyId}
          currentSystemId={state.currentSystemId}
          onSelectSystem={handleSelectSystem}
        />
      </Canvas>

      {/* 銀河情報バッジ */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: galaxy.color }} />
          <span className="text-white/70 text-xs font-mono">
            {galaxy.type === 'barred-spiral' ? '棒渦巻銀河' :
             galaxy.type === 'spiral' ? '渦巻銀河' :
             galaxy.type === 'elliptical' ? '楕円銀河' :
             galaxy.type === 'irregular' ? '不規則銀河' :
             galaxy.type === 'dwarf' ? '矮小銀河' : '銀河'} · Ø {galaxy.diameterKly}千光年 · {galaxy.starCount}
          </span>
        </div>
      </div>

      {galaxy.isDrillable && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-20 pointer-events-none">
          <p className="text-white/20 text-xs text-center animate-pulse">
            ★ 星系マーカーをタップして星系ビューへ
          </p>
        </div>
      )}
    </div>
  );
};
