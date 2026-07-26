/**
 * CosmicLevelView — 超銀河団・銀河団・銀河群の各レベルに対応した汎用3Dビュー
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SolarSystemState, CosmicLevel } from '../hooks/useSolarSystem';
import {
  ALL_SUPERCLUSTERS, ALL_GALAXY_CLUSTERS, ALL_GALAXY_GROUPS,
  getClustersForSupercluster, getGroupsForCluster, getGalaxiesForGroup,
  CosmicPos,
} from '../data/cosmicHierarchy';

// ── 背景星 ───────────────────────────────────────────────────────────────────
const StarBg: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 2500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 60 + Math.random() * 100;
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
      <pointsMaterial color="#cce0ff" size={0.12} sizeAttenuation transparent opacity={0.45} />
    </points>
  );
};

// ── 個別オブジェクトメッシュ ──────────────────────────────────────────────────
interface CosmicObject {
  id: string;
  nameJa: string;
  pos: CosmicPos;
  color: string;
  size: number;        // 相対サイズ（半径）
  isHome?: boolean;
  isDrillable: boolean;
}

const CosmicObjectMesh: React.FC<{
  obj: CosmicObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ obj, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
    }
    if (isSelected && ringRef.current) {
      ringRef.current.rotation.z = t * 1.0;
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.08;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const r = obj.size;
  const { pos, color } = obj;

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
      >
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={obj.isHome ? 1.2 : (isSelected ? 1.0 : 0.5)}
          metalness={0.15}
          roughness={0.35}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.5}>
        <sphereGeometry args={[r, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={obj.isHome ? 0.2 : 0.08} />
      </mesh>

      {/* Home indicator ring */}
      {obj.isHome && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 1.8, r * 0.06, 8, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh ref={ringRef}>
          <torusGeometry args={[r * 2.0, r * 0.08, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Point light */}
      <pointLight color={color} intensity={obj.isHome ? 2.5 : 1.2} distance={r * 12} />

      {/* HTML label */}
      <Html center position={[0, r + 0.35, 0]} style={{ pointerEvents: 'none' }}>
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
}> = ({ objects, selectedId, onSelect, cameraPos }) => {
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
      {objects.map(obj => (
        <CosmicObjectMesh
          key={obj.id}
          obj={obj}
          isSelected={selectedId === obj.id}
          onSelect={onSelect}
        />
      ))}
      <OrbitControls
        enablePan enableZoom
        minDistance={3}
        maxDistance={40}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
};

// ── データ変換ヘルパー ─────────────────────────────────────────────────────────
function buildObjects(level: CosmicLevel, state: SolarSystemState): { objects: CosmicObject[]; hint: string } {
  if (level === 'supercluster') {
    // Show clusters within current supercluster
    const clusters = getClustersForSupercluster(state.currentSuperclusterId);
    return {
      objects: clusters.map(cl => ({
        id: cl.id,
        nameJa: cl.nameJa,
        pos: cl.pos,
        color: cl.color,
        size: Math.max(0.35, Math.min(1.2, Math.log10(cl.galaxyCount + 1) * 0.4)),
        isHome: cl.id === state.currentClusterId,
        isDrillable: true,
      })),
      hint: '銀河団をタップして探索',
    };
  }

  if (level === 'cluster') {
    // Show groups within current cluster
    const groups = getGroupsForCluster(state.currentClusterId);
    return {
      objects: groups.map(gr => ({
        id: gr.id,
        nameJa: gr.nameJa,
        pos: gr.pos,
        color: gr.color,
        size: Math.max(0.3, Math.min(0.9, Math.log10(gr.galaxyCount + 1) * 0.35)),
        isHome: gr.id === state.currentGroupId,
        isDrillable: true,
      })),
      hint: '銀河群をタップして探索',
    };
  }

  if (level === 'group') {
    // Show galaxies within current group
    const galaxies = getGalaxiesForGroup(state.currentGroupId);
    return {
      objects: galaxies.map(gx => ({
        id: gx.id,
        nameJa: gx.nameJa,
        pos: gx.pos,
        color: gx.color,
        size: Math.max(0.2, Math.min(0.8, Math.log10(gx.diameterKly + 1) * 0.25)),
        isHome: gx.id === state.currentGalaxyId,
        isDrillable: gx.isDrillable,
      })),
      hint: '銀河をタップして探索',
    };
  }

  return { objects: [], hint: '' };
}

function getLevelLabel(level: CosmicLevel): string {
  if (level === 'supercluster') return '銀河団ビュー';
  if (level === 'cluster') return '銀河群ビュー';
  if (level === 'group') return '銀河ビュー';
  return '';
}

// ── メインコンポーネント ─────────────────────────────────────────────────────
interface Props {
  state: SolarSystemState;
  level: 'supercluster' | 'cluster' | 'group';
}

export const CosmicLevelView: React.FC<Props> = ({ state, level }) => {
  const { objects, hint } = buildObjects(level, state);

  const cameraPos: [number, number, number] =
    level === 'supercluster' ? [0, 12, 18] :
    level === 'cluster' ? [0, 8, 14] :
    [0, 6, 10];

  return (
    <div className="absolute inset-0 bg-[#010813]">
      <Canvas
        camera={{ position: cameraPos, fov: 48 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#010813']} />
        <CosmicScene
          objects={objects}
          selectedId={state.selectedCosmicId}
          onSelect={state.selectCosmicObject}
          cameraPos={cameraPos}
        />
      </Canvas>

      {/* 中央ヒント */}
      {!state.selectedCosmicId && objects.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-16 pointer-events-none">
          <p className="text-white/25 text-xs text-center animate-pulse">{hint}</p>
        </div>
      )}

      {/* オブジェクトなしのフォールバック */}
      {objects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/30 text-sm">このレベルにはデータがありません</p>
        </div>
      )}
    </div>
  );
};
