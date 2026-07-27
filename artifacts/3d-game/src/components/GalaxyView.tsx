/**
 * GalaxyView — 個別銀河（渦巻・楕円など）の3Dビュー
 * 強化版: 銀河種別特殊エフェクト（M87ジェット・M82スターバースト・CenAラジオローブ）
 * + NASA画像オーバーレイ + APOD統合
 */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { getGalaxyById } from '../data/cosmicHierarchy';
import { fetchNasaImage, fetchApod, NasaImage, ApodImage, NASA_OBJECT_QUERIES } from '../utils/nasaApi';

// ── 背景星 ───────────────────────────────────────────────────────────────────
const StarBg: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 4500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 50 + Math.random() * 85;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ddeeff" size={0.1} sizeAttenuation transparent opacity={0.42} />
    </points>
  );
};

// ── 渦巻銀河パーティクル ─────────────────────────────────────────────────────
const SpiralGalaxy: React.FC<{
  color: string; diskColor?: string; bulgColor?: string; numArms?: number;
}> = ({ color, diskColor, bulgColor, numArms = 2 }) => {
  const mainColor  = diskColor  ?? color;
  const bulgeColor = bulgColor ?? '#ffffff';

  const diskGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 28000;
    const pos  = new Float32Array(n * 3);
    const cols = new Float32Array(n * 3);
    const mc = new THREE.Color(mainColor);
    const bc = new THREE.Color(bulgeColor);

    for (let i = 0; i < n; i++) {
      const arm  = Math.floor(Math.random() * numArms);
      const t    = Math.random();
      const r    = 0.3 + t * 5.0;
      const spread = (0.4 + t * 0.8) * (Math.random() - 0.5);
      const spin = t * Math.PI * 3;
      const angle = (arm / numArms) * Math.PI * 2 + spin + spread * 0.3;
      const vy    = (Math.random() - 0.5) * (0.08 + t * 0.12);

      pos[i * 3]     = r * Math.cos(angle) + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = vy;
      pos[i * 3 + 2] = r * Math.sin(angle) + (Math.random() - 0.5) * 0.2;

      const blend = Math.max(0, 1 - r / 3);
      const c = mc.clone().lerp(bc, blend);
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(cols, 3));
    return g;
  }, [mainColor, bulgeColor, numArms]);

  const bulgeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 6000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.random() ** 2 * 1.0;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  // Barred spiral: separate bar geometry
  const barGeo = useMemo(() => {
    if (numArms < 4) return null;
    const g = new THREE.BufferGeometry();
    const n = 3000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 3.0;
      pos[i * 3]     = x;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [numArms]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <group ref={groupRef} rotation={[Math.PI * 0.12, 0, 0]}>
      <points geometry={diskGeo}>
        <pointsMaterial size={0.04} sizeAttenuation vertexColors transparent opacity={0.8} />
      </points>
      <points geometry={bulgeGeo}>
        <pointsMaterial size={0.06} sizeAttenuation color={bulgeColor} transparent opacity={0.9} />
      </points>
      {barGeo && (
        <points geometry={barGeo}>
          <pointsMaterial size={0.055} sizeAttenuation color={bulgeColor} transparent opacity={0.8} />
        </points>
      )}
      <pointLight color={bulgeColor} intensity={2} distance={3} />
    </group>
  );
};

// ── 楕円銀河 ────────────────────────────────────────────────────────────────
const EllipticalGalaxy: React.FC<{ color: string }> = ({ color }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 22000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.random() ** 0.5 * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * 1.4 * Math.sin(phi) * Math.cos(theta);
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
        <pointsMaterial size={0.05} sizeAttenuation color={color} transparent opacity={0.72} />
      </points>
      <pointLight color={color} intensity={1.5} distance={5} />
    </group>
  );
};

// ── 不規則銀河 ──────────────────────────────────────────────────────────────
const IrregularGalaxy: React.FC<{ color: string }> = ({ color }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 14000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const clump = Math.floor(Math.random() * 4);
      const cx = [0, 1.5, -1.2,  0.3][clump];
      const cy = [0, 0.4, -0.3,  0.8][clump];
      const cz = [0, -0.8, 0.9, -0.5][clump];
      const r = Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = cx + r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = cy + r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = cz + r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial size={0.05} sizeAttenuation color={color} transparent opacity={0.76} />
    </points>
  );
};

// ── M87: 相対論的ジェット ───────────────────────────────────────────────────
const RelativisticJet: React.FC = () => {
  const jetRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (jetRef.current) {
      const flicker = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 4.5);
      jetRef.current.scale.setScalar(flicker);
    }
  });
  return (
    <group ref={jetRef}>
      {/* Primary jet — points away from galaxy center */}
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[0.55, 8, 10, 1, true]} />
        <meshBasicMaterial color="#4488FF" transparent opacity={0.42} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Jet core glow */}
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[0.25, 7, 8, 1, true]} />
        <meshBasicMaterial color="#88BBFF" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Jet hotspot */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshBasicMaterial color="#AACCFF" transparent opacity={0.65} />
      </mesh>
      {/* Counter jet (fainter, relativistic beaming) */}
      <mesh position={[0, -3.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.38, 5.5, 8, 1, true]} />
        <meshBasicMaterial color="#2244AA" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color="#6699FF" intensity={2} distance={10} />
    </group>
  );
};

// ── M82: スターバースト強風 ─────────────────────────────────────────────────
const StarburstWind: React.FC = () => {
  const windRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (windRef.current) {
      const pulse = 1 + 0.08 * Math.sin(state.clock.elapsedTime * 2.5);
      windRef.current.scale.setScalar(pulse);
    }
  });

  // Animated H-alpha filaments — particle streams
  const streamGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 1500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const h     = (Math.random() - 0.5) * 12 + (Math.random() > 0.5 ? 4 : -4);
      const r     = Math.abs(h) * 0.15 + Math.random() * 0.8;
      pos[i * 3]     = r * Math.cos(theta);
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = r * Math.sin(theta);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <group>
      <group ref={windRef}>
        {/* Upper wind cone */}
        <mesh position={[0, 5.5, 0]}>
          <coneGeometry args={[2.0, 9, 12, 1, true]} />
          <meshBasicMaterial color="#FF4422" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Lower wind cone */}
        <mesh position={[0, -5.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[2.0, 9, 12, 1, true]} />
          <meshBasicMaterial color="#FF4422" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Bright starburst core */}
        <mesh>
          <sphereGeometry args={[0.7, 12, 12]} />
          <meshBasicMaterial color="#FFCC44" transparent opacity={0.7} />
        </mesh>
        <pointLight color="#FF8833" intensity={3} distance={8} />
      </group>
      {/* H-alpha filament particles */}
      <points geometry={streamGeo}>
        <pointsMaterial size={0.04} sizeAttenuation color="#FF6644" transparent opacity={0.5} />
      </points>
    </group>
  );
};

// ── Centaurus A: 電波ローブ ─────────────────────────────────────────────────
const RadioLobes: React.FC = () => {
  const lobeRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (lobeRef.current) {
      const pulse = 1 + 0.05 * Math.sin(state.clock.elapsedTime * 1.2);
      lobeRef.current.scale.setScalar(pulse);
    }
  });
  return (
    <group ref={lobeRef}>
      {/* Northern radio lobe */}
      <mesh position={[0, 7, 0]} scale={[2.2, 3.5, 2.2]}>
        <sphereGeometry args={[1, 14, 12]} />
        <meshBasicMaterial color="#FF6600" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh position={[0, 7, 0]} scale={[1.5, 2.5, 1.5]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#FF8822" transparent opacity={0.1} wireframe />
      </mesh>
      {/* Southern radio lobe */}
      <mesh position={[0, -7, 0]} scale={[2.2, 3.5, 2.2]}>
        <sphereGeometry args={[1, 14, 12]} />
        <meshBasicMaterial color="#FF6600" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh position={[0, -7, 0]} scale={[1.5, 2.5, 1.5]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#FF8822" transparent opacity={0.1} wireframe />
      </mesh>
      {/* Central jet axis */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 12, 8]} />
        <meshBasicMaterial color="#FFAA44" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <pointLight color="#FF8833" intensity={2.5} distance={14} />
    </group>
  );
};

// ── Large Magellanic Cloud: タランチュラ星雲 ───────────────────────────────
const TarantulaNebulaGlow: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const pulse = 1 + 0.1 * Math.sin(state.clock.elapsedTime * 2);
      ref.current.scale.setScalar(pulse);
    }
  });
  return (
    <group position={[-0.3, 0.2, -0.5]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshBasicMaterial color="#FF8844" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.9, 8, 8]} />
        <meshBasicMaterial color="#FF6622" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <pointLight color="#FF8844" intensity={2} distance={2} />
    </group>
  );
};

// ── 星系マーカー（天の川用） ────────────────────────────────────────────────
const StarSystemMarkers: React.FC<{
  onSelectSystem: (id: string) => void;
  currentSystemId: string;
}> = ({ onSelectSystem, currentSystemId }) => {
  const markers = useMemo(() => [
    { id: 'solar-system',  label: '太陽系',       pos: new THREE.Vector3(2.2,  0.05,  0.8 ), color: '#FFD700' },
    { id: 'alpha-centauri',label: 'α ケンタウリ', pos: new THREE.Vector3(2.18, 0.05,  0.82), color: '#FFDD88' },
    { id: 'trappist1',     label: 'TRAPPIST-1',   pos: new THREE.Vector3(2.5,  0.08,  1.2 ), color: '#FF8866' },
    { id: 'kepler442',     label: 'ケプラー442',  pos: new THREE.Vector3(3.2,  0.1,  -1.5 ), color: '#FF9944' },
  ], []);

  return (
    <>
      {markers.map(m => (
        <group key={m.id} position={m.pos.toArray()}>
          <mesh onClick={(e) => { e.stopPropagation(); onSelectSystem(m.id); }}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={m.id === currentSystemId ? '#FFD700' : m.color} />
          </mesh>
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

      {/* Galaxy body */}
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

      {/* Galaxy-specific special effects */}
      {galaxyId === 'm87'   && <RelativisticJet />}
      {galaxyId === 'm82'   && <StarburstWind   />}
      {galaxyId === 'cen-a' && <RadioLobes      />}
      {galaxyId === 'lmc'   && <TarantulaNebulaGlow />}

      {/* Starburst core for other active galaxies */}
      {(galaxyId === 'ngc253' || galaxyId === 'ic342') && (
        <mesh>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshBasicMaterial color="#FFAA44" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Star system markers for Milky Way */}
      {galaxy.isDrillable && galaxy.starSystemIds.length > 0 && (
        <StarSystemMarkers currentSystemId={currentSystemId} onSelectSystem={onSelectSystem} />
      )}

      <OrbitControls enablePan enableZoom minDistance={3} maxDistance={25} dampingFactor={0.08} enableDamping />
    </>
  );
};

// ── NASA画像モーダル ─────────────────────────────────────────────────────────
const NasaImagePanel: React.FC<{ galaxyId: string; nameJa: string }> = ({ galaxyId, nameJa }) => {
  const [image, setImage] = useState<NasaImage | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const q = NASA_OBJECT_QUERIES[galaxyId] ?? nameJa;
    fetchNasaImage(q).then(setImage);
  }, [galaxyId, nameJa]);

  if (!image) return null;

  return expanded ? (
    <div
      className="absolute top-14 right-2 w-48 rounded-2xl overflow-hidden border border-white/18 shadow-2xl shadow-indigo-900/60 cursor-pointer z-10"
      onClick={() => setExpanded(false)}
    >
      <img src={image.thumbUrl} alt={nameJa} className="w-full aspect-video object-cover" />
      <div className="bg-black/75 px-2 py-1.5">
        <p className="text-white/75 text-[9px] font-bold leading-tight line-clamp-2">{image.title}</p>
        <p className="text-white/30 text-[7px] mt-0.5">Image credit: NASA · タップして閉じる</p>
      </div>
    </div>
  ) : (
    <button
      className="absolute top-14 right-2 w-14 rounded-xl overflow-hidden border border-white/15 shadow-xl cursor-pointer z-10 active:scale-95 transition-transform"
      onClick={() => setExpanded(true)}
      aria-label="NASA画像を表示"
    >
      <img src={image.thumbUrl} alt={nameJa} className="w-full aspect-video object-cover" />
      <div className="bg-black/70 px-1 py-0.5 text-center">
        <p className="text-white/40 text-[7px] font-mono">NASA</p>
      </div>
    </button>
  );
};

// ── 銀河タイプバッジ ──────────────────────────────────────────────────────────
function galaxyTypeBadge(galaxyId: string, type: string): string {
  if (galaxyId === 'm87')   return 'M87 · 相対論的ジェット噴出';
  if (galaxyId === 'm82')   return 'M82 · スターバースト強風';
  if (galaxyId === 'cen-a') return 'Cen A · 電波ローブ活動';
  if (galaxyId === 'lmc')   return 'LMC · タランチュラ星雲';
  if (type === 'barred-spiral') return '棒渦巻銀河';
  if (type === 'spiral')    return '渦巻銀河';
  if (type === 'elliptical')return '楕円銀河';
  if (type === 'irregular') return '不規則銀河';
  if (type === 'lenticular')return 'レンズ状銀河';
  if (type === 'dwarf')     return '矮小銀河';
  return '銀河';
}

// ── メインコンポーネント ─────────────────────────────────────────────────────
interface Props { state: SolarSystemState }

export const GalaxyView: React.FC<Props> = ({ state }) => {
  const galaxy = getGalaxyById(state.currentGalaxyId);
  const [apod, setApod] = useState<ApodImage | null>(null);

  useEffect(() => { fetchApod().then(setApod); }, []);

  const handleSelectSystem = (id: string) => {
    if (id === state.currentSystemId) {
      state.returnToSystemView();
    } else {
      state.switchSystem(id);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#000408]">
      {/* APOD subtle background */}
      {apod && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={apod.url}
            alt=""
            className="w-full h-full object-cover scale-110"
            style={{ opacity: 0.07 }}
          />
          <div className="absolute inset-0 bg-[#000408]/88" />
        </div>
      )}

      <Canvas
        camera={{ position: [0, 8, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#000408']} />
        <GalaxyScene
          galaxyId={state.currentGalaxyId}
          currentSystemId={state.currentSystemId}
          onSelectSystem={handleSelectSystem}
        />
      </Canvas>

      {/* NASA image thumbnail */}
      <NasaImagePanel galaxyId={state.currentGalaxyId} nameJa={galaxy.nameJa} />

      {/* Galaxy info badge */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/62 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: galaxy.color }} />
          <span className="text-white/72 text-xs font-mono">
            {galaxyTypeBadge(state.currentGalaxyId, galaxy.type)}
            {' · '}Ø {galaxy.diameterKly}千光年 · {galaxy.starCount}
          </span>
        </div>
      </div>

      {/* Drill hint for Milky Way */}
      {galaxy.isDrillable && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-20 pointer-events-none">
          <p className="text-white/20 text-xs text-center animate-pulse">
            ★ 星系マーカーをタップして星系ビューへ
          </p>
        </div>
      )}

      {/* APOD credit */}
      {apod && (
        <div className="absolute bottom-28 left-3 pointer-events-none">
          <p className="text-white/18 text-[8px] font-mono">NASA APOD</p>
        </div>
      )}
    </div>
  );
};
