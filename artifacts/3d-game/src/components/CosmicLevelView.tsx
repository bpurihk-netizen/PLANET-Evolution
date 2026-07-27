/**
 * CosmicLevelView — 超銀河団・銀河団・銀河群の各レベルに対応した汎用3Dビュー
 * 強化版: 超銀河団→コズミックウェブスレッド, 銀河団→X線熱ガス光, 銀河群→銀河形状スプライト
 */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SolarSystemState, CosmicLevel } from '../hooks/useSolarSystem';
import {
  ALL_SUPERCLUSTERS, ALL_GALAXY_CLUSTERS, ALL_GALAXY_GROUPS, ALL_COSMIC_GALAXIES,
  getClustersForSupercluster, getGroupsForCluster, getGalaxiesForGroup,
  CosmicPos,
} from '../data/cosmicHierarchy';
import { fetchNasaImage, NasaImage, NASA_OBJECT_QUERIES } from '../utils/nasaApi';

// ── 背景星 ───────────────────────────────────────────────────────────────────
const StarBg: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 2800;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 65 + Math.random() * 100;
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
      <pointsMaterial color="#cce0ff" size={0.12} sizeAttenuation transparent opacity={0.45} />
    </points>
  );
};

// ── オブジェクト共通型 ────────────────────────────────────────────────────────
interface CosmicObject {
  id: string;
  nameJa: string;
  pos: CosmicPos;
  color: string;
  size: number;
  isHome?: boolean;
  isDrillable: boolean;
  galaxyType?: string; // group level only
}

// ── 超銀河団レベル: コズミックウェブスレッド ─────────────────────────────────
const CosmicWebThreads: React.FC<{ objects: CosmicObject[] }> = ({ objects }) => {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i].pos, b = objects[j].pos;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 10) pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, [objects]);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#334477" transparent opacity={0.35} />
    </lineSegments>
  );
};

// ── 銀河団レベル: X線熱ガス（ICM）ハロー ────────────────────────────────────
const ICMGlowHalo: React.FC<{ obj: CosmicObject }> = ({ obj }) => {
  const ref1 = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + 0.06 * Math.sin(t * 1.5 + obj.pos.x);
    if (ref1.current) ref1.current.scale.setScalar(pulse);
    if (ref2.current) ref2.current.scale.setScalar(pulse * 0.9);
  });

  const { pos, size } = obj;
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Outer X-ray halo */}
      <mesh ref={ref1}>
        <sphereGeometry args={[size * 2.8, 16, 16]} />
        <meshBasicMaterial color="#FF6633" transparent opacity={0.055} depthWrite={false} />
      </mesh>
      {/* Inner hot core */}
      <mesh ref={ref2}>
        <sphereGeometry args={[size * 1.9, 12, 12]} />
        <meshBasicMaterial color="#FFAA44" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {/* X-ray flash ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 2.0, size * 0.15, 8, 32]} />
        <meshBasicMaterial color="#FF8844" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ── 銀河群レベル: 銀河形状スプライト ─────────────────────────────────────────
const GalaxyShapeSprite: React.FC<{
  obj: CosmicObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ obj, isSelected, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef  = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y = t * 0.1 + obj.pos.x * 0.3;
    if (isSelected && ringRef.current) ringRef.current.rotation.z = t * 1.0;
  });

  const { pos, color, size, galaxyType, isHome } = obj;
  const isSpiral = (galaxyType ?? '').includes('spiral') || !(galaxyType ?? '').includes('ell') && !(galaxyType ?? '').includes('irr');
  const isElliptical = (galaxyType ?? '').includes('ellip') || (galaxyType ?? '').includes('lent');
  const isDwarf = (galaxyType ?? '').includes('dwarf') || (galaxyType ?? '').includes('irr');

  const diskGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 1200;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const arm  = Math.floor(Math.random() * 2);
      const t_   = Math.random();
      const r    = 0.1 + t_ * size;
      const spin = t_ * Math.PI * 2.5;
      const ang  = (arm / 2) * Math.PI * 2 + spin + (Math.random() - 0.5) * 0.4;
      const vy   = (Math.random() - 0.5) * size * 0.12;
      positions[i * 3]     = r * Math.cos(ang) + (Math.random() - 0.5) * size * 0.15;
      positions[i * 3 + 1] = vy;
      positions[i * 3 + 2] = r * Math.sin(ang) + (Math.random() - 0.5) * size * 0.15;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [size]);

  const ellGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 800;
    const positions = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.random() ** 0.4 * size;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * 1.35 * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * 0.75 * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [size]);

  return (
    <group
      ref={groupRef}
      position={[pos.x, pos.y, pos.z]}
      rotation={[Math.PI * 0.12, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
    >
      {/* Galaxy particle cloud */}
      {isDwarf ? (
        <points>
          <bufferGeometry attributes={{ position: ellGeo.attributes.position }} />
          <pointsMaterial size={0.04} color={color} sizeAttenuation transparent opacity={0.7} />
        </points>
      ) : isElliptical ? (
        <points geometry={ellGeo}>
          <pointsMaterial size={0.044} sizeAttenuation color={color} transparent opacity={0.72} />
        </points>
      ) : (
        <points geometry={diskGeo}>
          <pointsMaterial size={0.038} sizeAttenuation color={color} transparent opacity={0.75} />
        </points>
      )}

      {/* Central bulge */}
      <mesh>
        <sphereGeometry args={[size * 0.18, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>

      {/* Glow */}
      <mesh>
        <sphereGeometry args={[size * 0.35, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={isHome ? 0.22 : 0.08} />
      </mesh>

      {/* Home ring */}
      {isHome && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.6, size * 0.06, 8, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.9, size * 0.07, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Point light */}
      <pointLight color={color} intensity={isHome ? 2.2 : 1.0} distance={size * 14} />

      {/* Label */}
      <Html center position={[0, size + 0.35, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: isHome ? '#FFD700' : (isSelected ? '#ffffff' : '#aac8ff'),
          fontSize: '9px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          textShadow: '0 0 6px rgba(100,180,255,0.9)',
          userSelect: 'none',
        }}>
          {isHome ? '★ ' : ''}{obj.nameJa.replace('（', '\n（').split('\n')[0].substring(0, 14)}
        </div>
      </Html>
    </group>
  );
};

// ── 個別オブジェクトメッシュ（超銀河団・銀河団レベル）────────────────────────
const CosmicObjectMesh: React.FC<{
  obj: CosmicObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  level: CosmicLevel;
}> = ({ obj, isSelected, onSelect, level }) => {
  const meshRef  = useRef<THREE.Mesh>(null);
  const ringRef  = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) meshRef.current.rotation.y = t * 0.15;
    if (isSelected && ringRef.current) ringRef.current.rotation.z = t * 1.0;
    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 2 + obj.pos.x) * 0.07;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const { pos, color, size } = obj;

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* X-ray ICM halo for cluster level */}
      {level === 'cluster' && <ICMGlowHalo obj={obj} />}

      {/* Core */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={obj.isHome ? 1.2 : (isSelected ? 1.0 : 0.55)}
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.55}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={obj.isHome ? 0.2 : 0.08} />
      </mesh>

      {/* Home ring */}
      {obj.isHome && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.8, size * 0.06, 8, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={ringRef}>
          <torusGeometry args={[size * 2.1, size * 0.08, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      <pointLight color={color} intensity={obj.isHome ? 2.5 : 1.2} distance={size * 12} />

      <Html center position={[0, size + 0.35, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: obj.isHome ? '#FFD700' : (isSelected ? '#ffffff' : '#aac8ff'),
          fontSize: '9px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          textShadow: '0 0 6px rgba(100,180,255,0.9)',
          userSelect: 'none',
        }}>
          {obj.isHome ? '★ ' : ''}{obj.nameJa.replace('（', '\n（').split('\n')[0].substring(0, 14)}
        </div>
      </Html>
    </group>
  );
};

// ── シーン ────────────────────────────────────────────────────────────────────
const CosmicScene: React.FC<{
  objects: CosmicObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cameraPos: [number, number, number];
  level: CosmicLevel;
}> = ({ objects, selectedId, onSelect, cameraPos, level }) => {
  const { camera } = useThree();

  React.useEffect(() => {
    camera.position.set(...cameraPos);
    camera.lookAt(0, 0, 0);
  }, [camera, cameraPos]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[8, 12, 8]} intensity={0.6} color="#99aadd" />
      <StarBg />
      {/* Cosmic web threads for supercluster level */}
      {level === 'supercluster' && <CosmicWebThreads objects={objects} />}
      {objects.map(obj =>
        level === 'group' ? (
          <GalaxyShapeSprite
            key={obj.id}
            obj={obj}
            isSelected={selectedId === obj.id}
            onSelect={onSelect}
          />
        ) : (
          <CosmicObjectMesh
            key={obj.id}
            obj={obj}
            isSelected={selectedId === obj.id}
            onSelect={onSelect}
            level={level}
          />
        )
      )}
      <OrbitControls
        enablePan enableZoom
        minDistance={3}
        maxDistance={42}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
};

// ── データ変換ヘルパー ─────────────────────────────────────────────────────────
function buildObjects(level: CosmicLevel, state: SolarSystemState): { objects: CosmicObject[]; hint: string } {
  if (level === 'supercluster') {
    const clusters = getClustersForSupercluster(state.currentSuperclusterId);
    return {
      objects: clusters.map(cl => ({
        id: cl.id,
        nameJa: cl.nameJa,
        pos: cl.pos,
        color: cl.color,
        size: Math.max(0.35, Math.min(1.2, Math.log10(cl.galaxyCount + 1) * 0.4)),
        isHome: cl.id === state.currentClusterId || cl.isHome,
        isDrillable: true,
      })),
      hint: '銀河団をタップして探索',
    };
  }

  if (level === 'cluster') {
    const groups = getGroupsForCluster(state.currentClusterId);
    return {
      objects: groups.map(gr => ({
        id: gr.id,
        nameJa: gr.nameJa,
        pos: gr.pos,
        color: gr.color,
        size: Math.max(0.3, Math.min(0.9, Math.log10(gr.galaxyCount + 1) * 0.35)),
        isHome: gr.id === state.currentGroupId || gr.isHome,
        isDrillable: true,
      })),
      hint: '銀河群をタップして探索',
    };
  }

  if (level === 'group') {
    const galaxies = getGalaxiesForGroup(state.currentGroupId);
    return {
      objects: galaxies.map(gx => ({
        id: gx.id,
        nameJa: gx.nameJa,
        pos: gx.pos,
        color: gx.color,
        size: Math.max(0.22, Math.min(0.8, Math.log10(gx.diameterKly + 1) * 0.26)),
        isHome: gx.id === state.currentGalaxyId || gx.isHome,
        isDrillable: gx.isDrillable,
        galaxyType: gx.type,
      })),
      hint: '銀河をタップして探索',
    };
  }

  return { objects: [], hint: '' };
}

function getLevelLabel(level: CosmicLevel): string {
  if (level === 'supercluster') return '銀河団ビュー';
  if (level === 'cluster')      return '銀河群ビュー';
  if (level === 'group')        return '銀河ビュー';
  return '';
}

// ── NASA画像サムネイルオーバーレイ ───────────────────────────────────────────
const NasaThumb: React.FC<{ id: string; nameJa: string }> = ({ id, nameJa }) => {
  const [img, setImg] = useState<NasaImage | null>(null);
  useEffect(() => {
    const q = NASA_OBJECT_QUERIES[id] ?? nameJa;
    fetchNasaImage(q).then(setImg);
  }, [id, nameJa]);
  if (!img) return null;
  return (
    <div className="absolute bottom-28 right-3 w-[72px] rounded-xl overflow-hidden border border-white/12 shadow-xl pointer-events-none">
      <img src={img.thumbUrl} alt={nameJa} className="w-full aspect-video object-cover opacity-85" />
      <div className="bg-black/70 px-1 py-0.5 text-center">
        <p className="text-white/35 text-[7px]">NASA</p>
      </div>
    </div>
  );
};

// ── メインコンポーネント ─────────────────────────────────────────────────────
interface Props {
  state: SolarSystemState;
  level: 'supercluster' | 'cluster' | 'group';
}

export const CosmicLevelView: React.FC<Props> = ({ state, level }) => {
  const { objects, hint } = buildObjects(level, state);

  const cameraPos: [number, number, number] =
    level === 'supercluster' ? [0, 12, 18] :
    level === 'cluster'      ? [0, 8,  14] :
                               [0, 6,  10];

  // Background color per level
  const bgColor =
    level === 'supercluster' ? '#010a1a' :
    level === 'cluster'      ? '#080410' :
                               '#020810';

  const selectedObj = objects.find(o => o.id === state.selectedCosmicId);

  return (
    <div className="absolute inset-0" style={{ background: bgColor }}>
      <Canvas
        camera={{ position: cameraPos, fov: 48 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[bgColor]} />
        <CosmicScene
          objects={objects}
          selectedId={state.selectedCosmicId}
          onSelect={state.selectCosmicObject}
          cameraPos={cameraPos}
          level={level}
        />
      </Canvas>

      {/* NASA image for selected object */}
      {selectedObj && (
        <NasaThumb id={selectedObj.id} nameJa={selectedObj.nameJa} />
      )}

      {/* Level badge */}
      <div className="absolute top-2 right-3 pointer-events-none">
        <div className="px-2 py-0.5 bg-black/50 border border-white/12 rounded-full">
          <span className="text-white/30 text-[9px] font-mono">{getLevelLabel(level)}</span>
        </div>
      </div>

      {/* Hint */}
      {!state.selectedCosmicId && objects.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-16 pointer-events-none">
          <p className="text-white/25 text-xs text-center animate-pulse">{hint}</p>
        </div>
      )}

      {/* No data fallback */}
      {objects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/30 text-sm">このレベルにはデータがありません</p>
        </div>
      )}
    </div>
  );
};
