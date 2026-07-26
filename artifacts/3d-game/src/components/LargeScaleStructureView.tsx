import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { ALL_LSS_FEATURES, LSSFeature } from '../data/cosmicHierarchy';

// ── 背景星フィールド ─────────────────────────────────────────────────────────
const StarBackground: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 3000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 80 + Math.random() * 120;
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
      <pointsMaterial color="#ffffff" size={0.15} sizeAttenuation transparent opacity={0.5} />
    </points>
  );
};

// ── フィラメント線 ──────────────────────────────────────────────────────────
const Filaments: React.FC = () => {
  const geo = useMemo(() => {
    // 超銀河団同士をつなぐ仮想フィラメント
    const nodes = ALL_LSS_FEATURES.filter(f => f.type === 'supercluster' || f.type === 'node');
    const pts: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i].pos, b = nodes[j].pos;
        const dist = Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2);
        if (dist < 14) {
          pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#334466" transparent opacity={0.4} />
    </lineSegments>
  );
};

// ── 個別LSSフィーチャーメッシュ ─────────────────────────────────────────────
const LSSFeatureMesh: React.FC<{
  feature: LSSFeature;
  isSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ feature, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    if (feature.isHome) {
      meshRef.current.rotation.y = t * 0.2;
    }
    if (isSelected && ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.rotation.x = t * 0.3;
    }
  });

  const { pos, color, type, sizeMLy } = feature;
  const scale = type === 'void' ? Math.max(1.5, sizeMLy / 200)
    : type === 'filament' || type === 'wall' ? 0.6
    : Math.max(0.6, Math.min(3.0, sizeMLy / 200));

  const isInteractive = type === 'supercluster';

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* Main body */}
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={isInteractive ? (e) => { e.stopPropagation(); onSelect(feature.id); } : undefined}
      >
        {type === 'void'
          ? <sphereGeometry args={[1.2, 16, 16]} />
          : type === 'filament' || type === 'wall'
          ? <cylinderGeometry args={[0.15, 0.15, 2.5, 8]} />
          : <sphereGeometry args={[0.65, 24, 24]} />
        }
        {type === 'void' ? (
          <meshStandardMaterial color="#050a1a" transparent opacity={0.25} wireframe />
        ) : type === 'filament' || type === 'wall' ? (
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.6} />
        ) : (
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={feature.isHome ? 1.2 : 0.6}
            metalness={0.1}
            roughness={0.3}
          />
        )}
      </mesh>

      {/* Glow for superclusters */}
      {isInteractive && (
        <mesh scale={scale * 1.6}>
          <sphereGeometry args={[0.65, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && isInteractive && (
        <mesh ref={ringRef} scale={scale * 1.8}>
          <torusGeometry args={[0.9, 0.05, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Point light for superclusters */}
      {isInteractive && (
        <pointLight color={color} intensity={feature.isHome ? 3 : 1.5} distance={10} />
      )}

      {/* HTML label */}
      {isInteractive && (
        <Html center position={[0, scale * 0.65 + 0.5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: feature.isHome ? '#FFD700' : '#aaccff',
            fontSize: '9px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textShadow: '0 0 8px rgba(100,150,255,0.8)',
            userSelect: 'none',
          }}>
            {feature.isHome ? '★ ' : ''}{feature.nameJa.split('（')[0].substring(0, 12)}
          </div>
        </Html>
      )}
    </group>
  );
};

// ── 3Dシーン ─────────────────────────────────────────────────────────────────
const LSSScene: React.FC<{
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ selectedId, onSelect }) => {
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 20, 10]} intensity={0.5} color="#8899cc" />
      <StarBackground />
      <Filaments />
      {ALL_LSS_FEATURES.map(f => (
        <LSSFeatureMesh
          key={f.id}
          feature={f}
          isSelected={selectedId === f.id}
          onSelect={onSelect}
        />
      ))}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={5}
        maxDistance={60}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
};

// ── メインコンポーネント ─────────────────────────────────────────────────────
interface Props { state: SolarSystemState }

export const LargeScaleStructureView: React.FC<Props> = ({ state }) => {
  return (
    <div className="absolute inset-0 bg-[#010510]">
      <Canvas
        camera={{ position: [0, 18, 28], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#010510']} />
        <LSSScene
          selectedId={state.selectedCosmicId}
          onSelect={state.selectCosmicObject}
        />
      </Canvas>

      {/* 説明オーバーレイ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 pointer-events-none">
        {!state.selectedCosmicId && (
          <p className="text-white/25 text-xs text-center animate-pulse">
            超銀河団をタップして探索
          </p>
        )}
      </div>
    </div>
  );
};
