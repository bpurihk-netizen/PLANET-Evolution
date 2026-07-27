import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CONSTELLATIONS, Constellation, radec2xyz } from '../data/constellations';
import { ALL_STAR_SYSTEMS } from '../data/starSystems';
import { CONSTELLATION_LINES } from '../data/constellationLines';
import { NAMED_STARS, NamedStarEntry, STAR_ASTRO_DATA } from '../data/namedStars';
import { cn } from '@/lib/utils';
import { ChevronLeft, X, ExternalLink, Search, Star, Play } from 'lucide-react';

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

// ── FOV-based pinch / wheel zoom ─────────────────────────────────────────────
// Inside-sphere camera: OrbitControls dolly changes camera-to-origin distance
// which has no visual effect from inside a large sphere. We change FOV instead.
const GlobeFovZoom: React.FC = () => {
  const { gl, camera } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    let lastDist = 0;
    const pinchDist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) lastDist = pinchDist(e.touches);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length < 2 || lastDist <= 0) return;
      const d = pinchDist(e.touches);
      const cam = camera as THREE.PerspectiveCamera;
      // pinch apart → lower FOV (zoom in); pinch together → higher FOV (zoom out)
      cam.fov = Math.max(12, Math.min(90, cam.fov * (lastDist / d)));
      cam.updateProjectionMatrix();
      lastDist = d;
    };
    const onTouchEnd = (e: TouchEvent) => { if (e.touches.length < 2) lastDist = 0; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = Math.max(12, Math.min(90, cam.fov * (e.deltaY > 0 ? 1.08 : 1 / 1.08)));
      cam.updateProjectionMatrix();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: true });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    el.addEventListener('wheel',      onWheel,      { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
      el.removeEventListener('wheel',      onWheel);
    };
  }, [gl, camera]);
  return null;
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

// ── Named Star Node ───────────────────────────────────────────────────────────
interface NamedStarNodeProps {
  star: NamedStarEntry;
  isSelected: boolean;
  onClick: () => void;
}

const NamedStarNode: React.FC<NamedStarNodeProps> = ({ star, isSelected, onClick }) => {
  const [x, y, z] = radec2xyz(star.raDeg, star.decDeg, GLOBE_R - 0.05);
  const dotR   = star.isBrightest ? 0.24 : 0.14;
  const hitR   = Math.max(dotR * 5, 0.9);
  const color  = star.isBrightest
    ? (isSelected ? '#ffe066' : '#ffd700')
    : (isSelected ? '#a0dfff' : '#88ccee');
  const opacity = isSelected ? 1.0 : star.isBrightest ? 0.85 : 0.60;

  return (
    <group>
      {/* Invisible hit sphere */}
      <mesh position={[x, y, z]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[hitR, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Visible dot */}
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[dotR, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[x, y, z]}>
          <ringGeometry args={[dotR * 2.2, dotR * 3.2, 24]} />
          <meshBasicMaterial color="#ffe066" transparent opacity={0.70} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
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

// ── Constellation Lines ───────────────────────────────────────────────────────
interface ConstellationLinesProps {
  selectedId: string | null;
  showAllLines: boolean;
  /** -1 = not animating; ≥0 = sequential draw, show only constellations up to this index */
  animConIndex: number;
}

const ConstellationLinesRenderer: React.FC<ConstellationLinesProps> = ({ selectedId, showAllLines, animConIndex }) => {
  const lineObjects = useMemo(() => {
    return CONSTELLATION_LINES.map(({ conId, segments }, conIdx) => {
      const isSelected = selectedId === conId;
      // Respect sequential draw-in animation
      const withinAnim = animConIndex < 0 || conIdx <= animConIndex;
      const visible = withinAnim && (showAllLines || isSelected);
      if (!visible) return null;

      // Newly-drawn constellation gets a brief highlight
      const freshDraw = animConIndex >= 0 && conIdx === animConIndex;
      const opacity = isSelected ? 0.85 : freshDraw ? 0.65 : 0.22;
      const color = isSelected ? '#ffcc44' : freshDraw ? '#ccddff' : '#88ccff';

      return segments.map(([ra1, dec1, ra2, dec2], idx) => {
        const [x1, y1, z1] = radec2xyz(ra1, dec1, GLOBE_R * 0.985);
        const [x2, y2, z2] = radec2xyz(ra2, dec2, GLOBE_R * 0.985);
        const pts = new Float32Array([x1, y1, z1, x2, y2, z2]);
        return (
          <line key={`${conId}-${idx}`}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[pts, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={color} transparent opacity={opacity} />
          </line>
        );
      });
    });
  }, [selectedId, showAllLines, animConIndex]);

  return <>{lineObjects}</>;
};

// ── Globe Scene ───────────────────────────────────────────────────────────────
interface GlobeSceneProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  visibleIds: Set<string> | null; // null = show all
  showLines: boolean;
  selectedStarKey: string | null;
  onSelectStar: (star: NamedStarEntry | null) => void;
  showStarNames: boolean;
  /** null = all constellations; string = show only this conId's stars */
  starNameConFilter: string | null;
  /** Sequential line animation index (-1 = not animating) */
  animConIndex: number;
}

const GlobeScene: React.FC<GlobeSceneProps> = ({
  selectedId, onSelect, visibleIds, showLines,
  selectedStarKey, onSelectStar, showStarNames,
  starNameConFilter, animConIndex,
}) => (
  <>
    <StarField />
    <CelestialEquator />
    <mesh>
      <sphereGeometry args={[GLOBE_R + 0.2, 32, 32]} />
      <meshBasicMaterial color="#112244" transparent opacity={0.04} side={THREE.BackSide} />
    </mesh>
    <ConstellationLinesRenderer selectedId={selectedId} showAllLines={showLines} animConIndex={animConIndex} />
    {CONSTELLATIONS.filter(con => !visibleIds || visibleIds.has(con.id)).map(con => (
      <ConstellationNode
        key={con.id}
        con={con}
        isSelected={selectedId === con.id}
        onClick={() => onSelect(selectedId === con.id ? null : con.id)}
      />
    ))}
    {showStarNames && NAMED_STARS
      .filter(s => !starNameConFilter || s.conId === starNameConFilter)
      .map((star, idx) => {
        const key = `${star.conId}-${star.nameEn}-${idx}`;
        return (
          <NamedStarNode
            key={key}
            star={star}
            isSelected={selectedStarKey === key}
            onClick={() => onSelectStar(selectedStarKey === key ? null : star)}
          />
        );
      })}
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

// ── Star Name Popup ───────────────────────────────────────────────────────────
interface StarNamePopupProps {
  star: NamedStarEntry | null;
  onClose: () => void;
}

const StarNamePopup: React.FC<StarNamePopupProps> = ({ star, onClose }) => {
  const isVisible = !!star;
  const con = star ? CONSTELLATIONS.find(c => c.id === star.conId) : null;

  return (
    <div
      className={cn(
        'fixed bottom-28 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto w-[min(92vw,360px)]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
    >
      {star && (
        <div className="bg-[#0a0f1f]/95 backdrop-blur-xl border border-white/12 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-4 pt-3.5 pb-2.5 border-b border-white/8">
            <div className="flex items-center gap-2.5 min-w-0">
              {star.isBrightest ? (
                <span className="text-yellow-400 shrink-0"><Star size={16} fill="currentColor" /></span>
              ) : (
                <span className="text-sky-400/80 shrink-0">✦</span>
              )}
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-white font-bold text-lg leading-tight">{star.nameJa}</span>
                  {star.isBrightest && (
                    <span className="text-yellow-400/70 text-[10px] font-bold tracking-widest uppercase border border-yellow-400/30 rounded-full px-1.5 py-0.5 shrink-0">
                      主星
                    </span>
                  )}
                </div>
                <div className="text-white/45 text-xs font-mono mt-0.5">{star.nameEn}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/8 active:bg-white/20 text-white/50 transition-colors shrink-0 ml-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
          {/* Body */}
          <div className="px-4 py-3 space-y-2">
            {star.meaning && (
              <p className="text-white/70 text-sm leading-relaxed">{star.meaning}</p>
            )}
            {/* Distance + magnitude (#67) */}
            {(() => {
              const d = STAR_ASTRO_DATA[star.nameEn];
              if (!d) return null;
              return (
                <div className="flex items-stretch bg-white/5 rounded-xl overflow-hidden border border-white/10">
                  <div className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
                    <span className="text-white/80 text-sm font-bold font-mono">
                      {d.distanceLy < 100 ? d.distanceLy.toFixed(1) : d.distanceLy.toLocaleString()}
                    </span>
                    <span className="text-white/30 text-[9px] font-mono">光年先</span>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
                    <span className="text-white/80 text-sm font-bold font-mono">{d.magnitude.toFixed(2)}</span>
                    <span className="text-white/30 text-[9px] font-mono">等級（見かけ）</span>
                  </div>
                </div>
              );
            })()}
            {con && (
              <div className="flex items-center gap-1.5 text-indigo-300/60 text-xs font-mono">
                <span>✦</span>
                <span>{con.nameJa}（{con.nameEn}）</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Exported Component ────────────────────────────────────────────────────────
interface ConstellationGlobeProps {
  onExit: () => void;
  onSwitchSystem: (id: string) => void;
  onConstellationViewed?: (id: string) => void;
}

export const ConstellationGlobe: React.FC<ConstellationGlobeProps> = ({ onExit, onSwitchSystem, onConstellationViewed }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showLines, setShowLines] = useState(false);
  const [showStarNames, setShowStarNames] = useState(false);
  const [selectedStar, setSelectedStar] = useState<NamedStarEntry | null>(null);
  const [selectedStarKey, setSelectedStarKey] = useState<string | null>(null);

  const selected = selectedId ? CONSTELLATIONS.find(c => c.id === selectedId) ?? null : null;

  const isSearching = searchText.trim().length > 0;
  const visibleIds: Set<string> | null = useMemo(() => {
    if (!isSearching) return null; // show all
    const q = searchText.trim().toLowerCase();
    const matched = CONSTELLATIONS
      .filter(c => c.nameJa.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .map(c => c.id);
    return new Set(matched);
  }, [isSearching, searchText]);

  const searchResultCount = visibleIds ? visibleIds.size : CONSTELLATIONS.length;

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    if (id) onConstellationViewed?.(id);
    // Close star popup when selecting a constellation
    if (id) { setSelectedStar(null); setSelectedStarKey(null); }
  };

  const handleSwitchSystem = (id: string) => {
    onSwitchSystem(id);
    onExit();
  };

  const handleSelectStar = useCallback((star: NamedStarEntry | null) => {
    setSelectedStar(star);
    if (star) {
      const idx = NAMED_STARS.indexOf(star);
      setSelectedStarKey(`${star.conId}-${star.nameEn}-${idx}`);
      setSelectedId(null); // close constellation panel
    } else {
      setSelectedStarKey(null);
    }
  }, []);

  // ── #68: Constellation filter for star-name mode ──────────────────────────
  const [starNameConFilter, setStarNameConFilter] = useState<string | null>(null);

  // ── #46: Sequential constellation-line draw animation ────────────────────
  const [animConIndex, setAnimConIndex] = useState(-1);

  useEffect(() => {
    if (animConIndex < 0 || animConIndex >= CONSTELLATION_LINES.length) return;
    const t = setTimeout(() => setAnimConIndex(i => i + 1), 40);
    return () => clearTimeout(t);
  }, [animConIndex]);

  const handleAnimateLines = useCallback(() => {
    setShowLines(true);
    setAnimConIndex(0);
  }, []);

  // Build the list of constellations that have named stars (for filter chips)
  const conFilterOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; nameJa: string }[] = [];
    NAMED_STARS.forEach(s => {
      if (!seen.has(s.conId)) {
        seen.add(s.conId);
        const c = CONSTELLATIONS.find(con => con.id === s.conId);
        if (c) opts.push({ id: s.conId, nameJa: c.nameJa });
      }
    });
    return opts;
  }, []);

  return (
    <div className="w-full h-full relative bg-[#020408]">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 0.1], fov: 80, near: 0.01, far: 800 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#020408']} />
        <GlobeScene
          selectedId={selectedId}
          onSelect={handleSelect}
          visibleIds={visibleIds}
          showLines={showLines}
          selectedStarKey={selectedStarKey}
          onSelectStar={handleSelectStar}
          showStarNames={showStarNames}
          starNameConFilter={starNameConFilter}
          animConIndex={animConIndex}
        />
        {/* FOV zoom: replaces OrbitControls dolly which is useless inside a sphere */}
        <GlobeFovZoom />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.10}
          minDistance={0.01}
          maxDistance={28}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
          rotateSpeed={-0.5}
        />
      </Canvas>

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-0 left-0 right-0 pointer-events-auto">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent gap-2">
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
            {/* Lines toggle + animate button (#46) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowLines(v => !v)}
                className={cn(
                  'px-3 py-2 backdrop-blur-md border rounded-full min-h-[44px] flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold',
                  showLines
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : 'bg-white/8 border-white/12 text-white/40'
                )}
              >
                <span>✦</span>
                <span className="hidden sm:inline">{showLines ? 'ライン表示中' : 'ライン'}</span>
              </button>
              <button
                onClick={handleAnimateLines}
                disabled={animConIndex >= 0}
                className={cn(
                  'p-2.5 backdrop-blur-md border rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-all active:scale-95',
                  animConIndex >= 0
                    ? 'bg-amber-500/30 border-amber-400/60 text-amber-300 animate-pulse'
                    : 'bg-white/8 border-white/12 text-white/40 active:bg-white/15'
                )}
                title="星座ラインをアニメーション描画"
              >
                <Play size={14} />
              </button>
            </div>
          </div>

          {/* Second toolbar row: search + star-names toggle */}
          <div className="px-4 pb-2 pointer-events-auto flex items-center gap-2">
            <div className="relative flex items-center flex-1">
              <Search size={13} className="absolute left-3 text-white/30 pointer-events-none" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="星座名で検索…"
                className="w-full pl-8 pr-8 py-2 bg-black/50 backdrop-blur-md border border-white/12 rounded-xl text-white/80 text-xs placeholder:text-white/25 outline-none focus:border-indigo-400/50 transition-all"
              />
              {searchText && (
                <button
                  onClick={() => { setSearchText(''); }}
                  className="absolute right-2.5 text-white/30 active:text-white/60 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {/* Star names toggle */}
            <button
              onClick={() => {
                setShowStarNames(v => !v);
                if (showStarNames) { setSelectedStar(null); setSelectedStarKey(null); }
              }}
              className={cn(
                'shrink-0 px-3 py-2 backdrop-blur-md border rounded-xl min-h-[36px] flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold',
                showStarNames
                  ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300'
                  : 'bg-white/8 border-white/12 text-white/40'
              )}
              title="星名を表示"
            >
              <Star size={12} fill={showStarNames ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">星名</span>
            </button>
          </div>
          {/* Constellation filter chips — shown in star-name mode (#68) */}
          {showStarNames && !isSearching && (
            <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none pointer-events-auto">
              <button
                onClick={() => setStarNameConFilter(null)}
                className={cn(
                  'shrink-0 px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border transition-all active:scale-95',
                  !starNameConFilter
                    ? 'bg-yellow-500/25 border-yellow-400/50 text-yellow-300'
                    : 'bg-white/6 border-white/12 text-white/40'
                )}
              >
                すべて
              </button>
              {conFilterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStarNameConFilter(prev => prev === opt.id ? null : opt.id)}
                  className={cn(
                    'shrink-0 px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border transition-all active:scale-95',
                    starNameConFilter === opt.id
                      ? 'bg-yellow-500/25 border-yellow-400/50 text-yellow-300'
                      : 'bg-white/6 border-white/12 text-white/40'
                  )}
                >
                  {opt.nameJa}
                </button>
              ))}
            </div>
          )}
          {isSearching && (
            <div className="text-[10px] text-white/30 font-mono px-5 pb-1">
              {searchResultCount > 0 ? `${searchResultCount} 件ヒット` : '一致する星座が見つかりません'}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute top-32 right-4 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22dd88]" />
              <span className="text-[10px] text-white/50 font-mono">星系あり</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#88ccff]" />
              <span className="text-[10px] text-white/50 font-mono">一般星座</span>
            </div>
            {showStarNames && (
              <>
                <div className="h-px bg-white/10 my-0.5" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ffd700]" />
                  <span className="text-[10px] text-white/50 font-mono">主星</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#88ccee]" />
                  <span className="text-[10px] text-white/50 font-mono">恒星</span>
                </div>
              </>
            )}
            <div className="h-px bg-white/10 my-0.5" />
            <div className="text-[10px] text-white/30 font-mono whitespace-nowrap">ドラッグで回転</div>
            <div className="text-[10px] text-white/30 font-mono whitespace-nowrap">ピンチでズーム</div>
          </div>
        </div>

        {!selectedId && !selectedStar && !isSearching && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
              <span className="text-[11px] text-white/40 font-mono">
                {showStarNames ? '星をタップして星名を見る' : '星座名をタップして詳細を見る'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Star name popup */}
      <StarNamePopup
        star={selectedStar}
        onClose={() => { setSelectedStar(null); setSelectedStarKey(null); }}
      />

      {/* Constellation info panel */}
      <GlobeInfoPanel
        constellation={selected}
        onClose={() => setSelectedId(null)}
        onSwitchSystem={handleSwitchSystem}
      />
    </div>
  );
};
