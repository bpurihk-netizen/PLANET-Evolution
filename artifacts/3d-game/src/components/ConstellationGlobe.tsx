import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CONSTELLATIONS, Constellation, radec2xyz } from '../data/constellations';
import { ALL_STAR_SYSTEMS } from '../data/starSystems';
import { cn } from '@/lib/utils';
import { ChevronLeft, X, ExternalLink } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const GLOBE_R = 32;

// ── Stars Background ─────────────────────────────────────────────────────────
const StarField: React.FC = () => {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const N = 3000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 400 + Math.random() * 200;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi   = Math.random() * Math.PI * 2;
      pos[i*3]   = r * Math.sin(theta) * Math.cos(phi);
      pos[i*3+1] = r * Math.cos(theta);
      pos[i*3+2] = r * Math.sin(theta) * Math.sin(phi);
      const t = Math.random();
      const c = t < 0.33 ? [1, 0.9, 0.8] : t < 0.66 ? [0.9, 0.95, 1] : [1, 1, 1];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
    }
    return { positions: pos, colors: col };
  }, []);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.001; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.8} vertexColors sizeAttenuation transparent opacity={0.7} />
    </points>
  );
};

// ── Celestial Equator ─────────────────────────────────────────────────────────
const CelestialEquator: React.FC = () => {
  const pts = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      arr.push(new THREE.Vector3(GLOBE_R * 0.99 * Math.cos(a), 0, GLOBE_R * 0.99 * Math.sin(a)));
    }
    return arr;
  }, []);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(pts.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.06} />
    </line>
  );
};

// ── Constellation Node ────────────────────────────────────────────────────────
interface ConstellationNodeProps {
  con: Constellation;
  isSelected: boolean;
  onClick: () => void;
}

const ConstellationNode: React.FC<ConstellationNodeProps> = ({ con, isSelected, onClick }) => {
  const [x, y, z] = radec2xyz(con.raDeg, con.decDeg, GLOBE_R);
  const r = con.areaRank;
  const dotR = r <= 10 ? 0.28 : r <= 30 ? 0.20 : 0.14;
  const isLinked = !!con.linkedSystemId;
  const dotColor = isLinked ? '#22dd88' : isSelected ? '#ffcc44' : '#88ccff';
  const opacity  = isLinked ? 1.0 : isSelected ? 1.0 : 0.55;

  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 48;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 48);
    ctx.font = isSelected ? 'bold 17px sans-serif' : '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isLinked ? '#44ffaa' : isSelected ? '#ffdd88' : 'rgba(160,200,255,0.80)';
    ctx.fillText(con.nameJa, 128, 30);
    return c;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [con.nameJa, isSelected, isLinked]);

  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);
  const norm = useMemo(() => new THREE.Vector3(x, y, z).normalize(), [x, y, z]);
  const labelPos: [number, number, number] = [
    x + norm.x * 1.8, y + norm.y * 1.8, z + norm.z * 1.8,
  ];

  return (
    <group>
      {/* Invisible hit sphere */}
      <mesh position={[x, y, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[Math.max(dotR * 5, 1.0), 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Visible dot */}
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[dotR, 8, 8]} />
        <meshBasicMaterial color={dotColor} transparent opacity={opacity} />
      </mesh>
      {/* Glow ring for selected or linked */}
      {(isSelected || isLinked) && (
        <mesh position={[x, y, z]}>
          <ringGeometry args={[dotR * 2.0, dotR * 2.8, 24]} />
          <meshBasicMaterial
            color={isLinked ? '#22dd88' : '#ffcc44'}
            transparent opacity={0.55}
            side={THREE.DoubleSide} depthWrite={false}
          />
        </mesh>
      )}
      {/* Billboard label */}
      <sprite position={labelPos} scale={[3.0, 0.72, 1]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
};

// ── Star-system Pin ──────────────────────────────────────────────────────────
interface SystemPinProps {
  raDeg: number;
  decDeg: number;
  color: string;
  label: string;
}

const SystemPin: React.FC<SystemPinProps> = ({ raDeg, decDeg, color, label }) => {
  const [x, y, z] = radec2xyz(raDeg, decDeg, GLOBE_R - 0.6);
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(Date.now() * 0.003) * 0.3;
    }
  });
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 48;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 48);
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(`🔭 ${label}`, 128, 30);
    return c;
  }, [label, color]);
  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);
  const norm = useMemo(() => new THREE.Vector3(x, y, z).normalize(), [x, y, z]);
  const labelPos: [number, number, number] = [x + norm.x * 2.5, y + norm.y * 2.5, z + norm.z * 2.5];

  return (
    <group>
      <mesh ref={meshRef} position={[x, y, z]}>
        <sphereGeometry args={[0.45, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <sprite position={labelPos} scale={[3.2, 0.72, 1]}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
};

// ── Known RA/Dec for our star systems ────────────────────────────────────────
const SYSTEM_PINS = [
  { id: 'trappist1',      raDeg: 346.6, decDeg: -5.0,  color: '#ff6644', label: 'TRAPPIST-1' },
  { id: 'alpha-centauri', raDeg: 219.9, decDeg: -60.8, color: '#ffcc44', label: 'αケンタウリ' },
  { id: 'kepler442',      raDeg: 285.3, decDeg: 47.0,  color: '#44ccff', label: 'ケプラー442' },
];

// ── Globe Scene ───────────────────────────────────────────────────────────────
interface GlobeSceneProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const GlobeScene: React.FC<GlobeSceneProps> = ({ selectedId, onSelect }) => (
  <>
    <StarField />
    <CelestialEquator />
    <mesh>
      <sphereGeometry args={[GLOBE_R + 0.2, 32, 32]} />
      <meshBasicMaterial color="#112244" transparent opacity={0.04} side={THREE.BackSide} />
    </mesh>
    {CONSTELLATIONS.map(con => (
      <ConstellationNode
        key={con.id}
        con={con}
        isSelected={selectedId === con.id}
        onClick={() => onSelect(selectedId === con.id ? null : con.id)}
      />
    ))}
    {SYSTEM_PINS.map(pin => (
      <SystemPin key={pin.id} {...pin} />
    ))}
    <ambientLight intensity={0.35} />
  </>
);

// ── Info Panel ────────────────────────────────────────────────────────────────
interface GlobeInfoPanelProps {
  constellation: Constellation | null;
  onClose: () => void;
  onSwitchSystem: (id: string) => void;
}

const GlobeInfoPanel: React.FC<GlobeInfoPanelProps> = ({ constellation, onClose, onSwitchSystem }) => {
  const c = constellation;
  const isVisible = !!c;
  const linkedSystem = c?.linkedSystemId
    ? ALL_STAR_SYSTEMS.find(s => s.id === c.linkedSystemId)
    : null;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-30 transition-transform duration-500 ease-out pointer-events-auto',
      isVisible ? 'translate-y-0' : 'translate-y-full'
    )}>
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="bg-[#080c18]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[50dvh] overflow-y-auto">
        {c && (
          <>
            <div className="sticky top-0 bg-[#080c18]/95 backdrop-blur-xl z-10 px-5 pt-4 pb-3 border-b border-white/8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-2xl">✨</span>
                    <h2 className="text-xl font-bold text-white tracking-wide">{c.nameJa}</h2>
                    <span className="text-white/40 text-sm font-mono">{c.abbr}</span>
                  </div>
                  <div className="text-xs text-white/40 font-mono ml-10">{c.nameEn}</div>
                </div>
                <button
                  onClick={onClose}
                  className="mt-1 p-2.5 rounded-full bg-white/8 active:bg-white/20 text-white/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="px-5 pt-4 pb-6 space-y-4">
              <div className="bg-indigo-900/20 border border-indigo-500/25 rounded-2xl p-4">
                <h3 className="text-xs text-indigo-300/70 font-bold tracking-widest uppercase mb-2">神話・伝説</h3>
                <p className="text-white/80 text-sm leading-relaxed">{c.mythologyJa}</p>
              </div>
              <div className="bg-white/4 rounded-2xl px-4 py-1 border border-white/8">
                {[
                  { label: '面積ランク',   value: `${c.areaRank}位 / 88星座` },
                  { label: '面積',         value: `${c.areaSqDeg.toLocaleString()} 平方度` },
                  { label: '最も明るい星', value: `${c.brightestStarJa}（${c.brightestStarEn}）` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-baseline py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-white/50 text-xs font-mono tracking-wider">{label}</span>
                    <span className="text-white/85 text-xs font-mono text-right ml-2">{value}</span>
                  </div>
                ))}
              </div>
              {linkedSystem && (
                <div className="bg-green-900/25 border border-green-500/40 rounded-2xl p-4">
                  <h3 className="text-xs text-green-400/80 font-bold tracking-widest uppercase mb-2">
                    🔭 この方向にある探索済みの星系
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-200 font-bold text-sm">{linkedSystem.nameJa}</div>
                      <div className="text-green-400/60 text-xs mt-0.5">地球から {linkedSystem.distanceLy.toLocaleString()} 光年</div>
                    </div>
                    <button
                      onClick={() => onSwitchSystem(linkedSystem.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-green-800/50 border border-green-500/50 rounded-xl text-green-200 text-xs font-bold active:bg-green-700/60 transition-all min-h-[44px]"
                    >
                      探索する <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Exported Component ────────────────────────────────────────────────────────
interface ConstellationGlobeProps {
  onExit: () => void;
  onSwitchSystem: (id: string) => void;
}

export const ConstellationGlobe: React.FC<ConstellationGlobeProps> = ({ onExit, onSwitchSystem }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? CONSTELLATIONS.find(c => c.id === selectedId) ?? null : null;

  const handleSwitchSystem = (id: string) => {
    onSwitchSystem(id);
    onExit();
  };

  return (
    <div className="w-full h-full relative bg-[#020408]">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 0.1], fov: 80, near: 0.01, far: 800 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#020408']} />
        <GlobeScene selectedId={selectedId} onSelect={setSelectedId} />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableDamping
          dampingFactor={0.10}
          minDistance={0.01}
          maxDistance={28}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
          rotateSpeed={-0.5}
          zoomSpeed={0.8}
        />
      </Canvas>

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-0 left-0 right-0 pointer-events-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/70 to-transparent gap-2">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-white/10 active:bg-white/20 backdrop-blur-md border border-white/15 rounded-full text-white/80 text-sm font-medium transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
              星系に戻る
            </button>
            <div className="flex items-center gap-2 min-h-[44px] shrink-0">
              <span className="text-xl">🌐</span>
              <span className="text-white/90 font-bold tracking-widest text-xs">天球儀 · 88星座</span>
            </div>
            <div className="px-3 py-2 bg-white/8 backdrop-blur-md border border-white/12 rounded-full min-h-[44px] flex items-center">
              <span className="text-white/50 text-xs font-mono">全天</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-24 right-4 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22dd88]" />
              <span className="text-[10px] text-white/50 font-mono">星系あり</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#88ccff]" />
              <span className="text-[10px] text-white/50 font-mono">一般星座</span>
            </div>
            <div className="h-px bg-white/10 my-0.5" />
            <div className="text-[10px] text-white/30 font-mono whitespace-nowrap">ドラッグで回転</div>
            <div className="text-[10px] text-white/30 font-mono whitespace-nowrap">ピンチでズーム</div>
          </div>
        </div>

        {!selectedId && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
              <span className="text-[11px] text-white/40 font-mono">星座名をタップして詳細を見る</span>
            </div>
          </div>
        )}
      </div>

      {/* Info panel */}
      <GlobeInfoPanel
        constellation={selected}
        onClose={() => setSelectedId(null)}
        onSwitchSystem={handleSwitchSystem}
      />
    </div>
  );
};
