/**
 * CosmicImageView — NASA画像を使った宇宙階層ビュー
 * R3Fアニメーションの代わりに、NASA Image Library の実際の天文画像でコンテンツを表示する。
 * lss / supercluster / cluster / group / galaxy レベルすべてを処理する。
 * 追加: 系外惑星系の軌道図SVG・LSS大規模構造フィラメントアニメーション
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SolarSystemState, CosmicLevel } from '../hooks/useSolarSystem';
import {
  ALL_LSS_FEATURES, ALL_SUPERCLUSTERS, ALL_GALAXY_CLUSTERS,
  ALL_GALAXY_GROUPS, ALL_COSMIC_GALAXIES,
  getClustersForSupercluster, getGroupsForCluster, getGalaxiesForGroup,
  getSuperclusterById, getClusterById, getGroupById, getGalaxyById,
} from '../data/cosmicHierarchy';
import {
  fetchNasaImage, NasaImage,
  NASA_OBJECT_QUERIES, NASA_LEVEL_BG_QUERIES,
} from '../utils/nasaApi';

// ── Types ────────────────────────────────────────────────────────────────────

interface CosmicCard {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  distanceStr: string;
  sizeStr: string;
  countStr?: string;
  targetLevel: CosmicLevel;
  isDrillable: boolean;
  isHome: boolean;
  nasaQuery: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDist(mly: number): string {
  if (mly === 0) return '私たちの場所';
  if (mly < 0.01) return `${(mly * 1_000_000).toFixed(0)} 光年`;
  if (mly < 1)    return `${(mly * 1000).toFixed(0)} 千光年`;
  if (mly < 1000) return `${mly.toLocaleString()} 百万光年`;
  return `${(mly / 1000).toFixed(1)} 十億光年`;
}

function fmtSize(mly: number): string {
  if (mly < 1) return `${(mly * 1000).toFixed(0)} 千光年`;
  if (mly < 1000) return `${mly.toLocaleString()} 百万光年`;
  return `${(mly / 1000).toFixed(1)} 十億光年`;
}

function getChildCards(state: SolarSystemState): CosmicCard[] {
  const { cosmicLevel, currentSuperclusterId, currentClusterId, currentGroupId, currentGalaxyId } = state;

  switch (cosmicLevel) {
    case 'lss':
      return ALL_LSS_FEATURES.map(f => {
        const sc = f.type === 'supercluster' ? ALL_SUPERCLUSTERS.find(s => s.id === f.id) : undefined;
        return {
          id: f.id,
          nameJa: sc?.nameJa ?? f.nameJa,
          nameEn: sc?.nameEn ?? f.nameEn,
          descriptionJa: sc?.descriptionJa ?? f.descriptionJa,
          distanceStr: fmtDist(f.distanceMLy),
          sizeStr: fmtSize(f.sizeMLy),
          countStr: sc ? `銀河 ${sc.galaxyCount}` : FEATURE_TYPE_LABELS[f.type],
          targetLevel: 'supercluster' as CosmicLevel,
          isDrillable: f.type === 'supercluster' && !!f.superclusterId,
          isHome: !!f.isHome,
          nasaQuery: NASA_OBJECT_QUERIES[f.id] ?? f.nameEn,
        };
      });

    case 'supercluster':
      return getClustersForSupercluster(currentSuperclusterId).map(c => ({
        id: c.id,
        nameJa: c.nameJa,
        nameEn: c.nameEn,
        descriptionJa: c.descriptionJa,
        distanceStr: fmtDist(c.distanceMLy),
        sizeStr: fmtSize(c.diameterMLy),
        countStr: `銀河 ${c.galaxyCount.toLocaleString()}個`,
        targetLevel: 'cluster' as CosmicLevel,
        isDrillable: (c.groupIds?.length ?? 0) > 0,
        isHome: !!c.isHome,
        nasaQuery: NASA_OBJECT_QUERIES[c.id] ?? c.nameEn,
      }));

    case 'cluster':
      return getGroupsForCluster(currentClusterId).map(g => ({
        id: g.id,
        nameJa: g.nameJa,
        nameEn: g.nameEn,
        descriptionJa: g.descriptionJa,
        distanceStr: fmtDist(g.distanceMLy),
        sizeStr: fmtSize(g.diameterMLy),
        countStr: `銀河 ${g.galaxyCount}個`,
        targetLevel: 'group' as CosmicLevel,
        isDrillable: (g.galaxyIds?.length ?? 0) > 0,
        isHome: !!g.isHome,
        nasaQuery: NASA_OBJECT_QUERIES[g.id] ?? g.nameEn,
      }));

    case 'group':
      return getGalaxiesForGroup(currentGroupId).map(gx => ({
        id: gx.id,
        nameJa: gx.nameJa,
        nameEn: gx.nameEn,
        descriptionJa: gx.descriptionJa,
        distanceStr: fmtDist(gx.distanceMLy),
        sizeStr: `直径 ${gx.diameterKly.toLocaleString()} 千光年`,
        countStr: `恒星 ${gx.starCount}`,
        targetLevel: 'galaxy' as CosmicLevel,
        isDrillable: gx.isDrillable,
        isHome: !!gx.isHome,
        nasaQuery: NASA_OBJECT_QUERIES[gx.id] ?? gx.nameEn,
      }));

    case 'galaxy': {
      const gx = ALL_COSMIC_GALAXIES.find(g => g.id === currentGalaxyId);
      if (!gx || !gx.isDrillable || gx.starSystemIds.length === 0) return [];
      return gx.starSystemIds.map(sid => ({
        id: sid,
        nameJa: SYSTEM_NAMES[sid]?.ja ?? sid,
        nameEn: SYSTEM_NAMES[sid]?.en ?? sid,
        descriptionJa: SYSTEM_NAMES[sid]?.desc ?? '',
        distanceStr: SYSTEM_NAMES[sid]?.dist ?? '',
        sizeStr: '',
        countStr: SYSTEM_NAMES[sid]?.count,
        targetLevel: 'system' as CosmicLevel,
        isDrillable: true,
        isHome: sid === 'solar-system',
        nasaQuery: NASA_OBJECT_QUERIES[sid] ?? sid,
      }));
    }

    default:
      return [];
  }
}

const FEATURE_TYPE_LABELS: Record<string, string> = {
  supercluster: '超銀河団',
  void: '宇宙の空洞（ボイド）',
  filament: 'フィラメント',
  wall: 'グレートウォール',
  node: 'ノード',
};

const SYSTEM_NAMES: Record<string, { ja: string; en: string; desc: string; dist: string; count?: string }> = {
  'solar-system': {
    ja: '太陽系', en: 'Solar System',
    desc: '太陽と8つの惑星からなる私たちの星系。地球はここにある。',
    dist: '私たちの場所', count: '惑星8個',
  },
  'alpha-centauri': {
    ja: 'アルファ・ケンタウリ', en: 'Alpha Centauri',
    desc: '太陽系に最も近い恒星系（約4.37光年）。3つの恒星からなる連星系。',
    dist: '4.37 光年', count: '恒星3個',
  },
  'trappist1': {
    ja: 'TRAPPIST-1', en: 'TRAPPIST-1',
    desc: '7つの地球サイズの惑星を持つ赤色矮星。うち3つがハビタブルゾーンにある。',
    dist: '39.5 光年', count: '惑星7個',
  },
  'kepler442': {
    ja: 'ケプラー442', en: 'Kepler-442',
    desc: 'ハビタブルゾーンにある地球サイズの惑星を持つ恒星系。',
    dist: '1206 光年', count: '惑星1個以上',
  },
};

// ── Context header info ──────────────────────────────────────────────────────

interface ContextInfo {
  levelLabel: string;
  levelEmoji: string;
  contextLine: string;
  description: string;
}

function getContextInfo(state: SolarSystemState): ContextInfo {
  const { cosmicLevel, currentSuperclusterId, currentClusterId, currentGroupId, currentGalaxyId } = state;
  switch (cosmicLevel) {
    case 'lss':
      return {
        levelLabel: '宇宙の大規模構造',
        levelEmoji: '🌐',
        contextLine: '観測可能な宇宙全体',
        description: '超銀河団・ボイド・フィラメントが織りなす「宇宙の大きな網（コズミックウェブ）」',
      };
    case 'supercluster': {
      const sc = getSuperclusterById(currentSuperclusterId);
      return {
        levelLabel: '超銀河団',
        levelEmoji: '🌌',
        contextLine: sc.nameJa,
        description: `${sc.galaxyCount} の銀河を含む超銀河団の内部。直径 ${sc.sizeMLy.toLocaleString()} 百万光年。`,
      };
    }
    case 'cluster': {
      const sc = getSuperclusterById(currentSuperclusterId);
      const cl = getClusterById(currentClusterId);
      return {
        levelLabel: '銀河団',
        levelEmoji: '✨',
        contextLine: `${sc.nameJa} ▸ ${cl.nameJa}`,
        description: `直径 ${cl.diameterMLy} 百万光年、銀河 ${cl.galaxyCount.toLocaleString()} 個を含む銀河団`,
      };
    }
    case 'group': {
      const cl = getClusterById(currentClusterId);
      const gr = getGroupById(currentGroupId);
      return {
        levelLabel: '銀河群',
        levelEmoji: '🔭',
        contextLine: `${cl.nameJa} ▸ ${gr.nameJa}`,
        description: `直径 ${gr.diameterMLy} 百万光年、銀河 ${gr.galaxyCount} 個を含む銀河群`,
      };
    }
    case 'galaxy': {
      const gr = getGroupById(currentGroupId);
      const gx = getGalaxyById(currentGalaxyId);
      return {
        levelLabel: '銀河',
        levelEmoji: '🌀',
        contextLine: `${gr.nameJa} ▸ ${gx.nameJa}`,
        description: `直径 ${gx.diameterKly} 千光年、恒星 ${gx.starCount}`,
      };
    }
    default:
      return { levelLabel: '', levelEmoji: '', contextLine: '', description: '' };
  }
}

// ── Hooks ────────────────────────────────────────────────────────────────────

function useNasaImage(query: string | undefined) {
  const [image, setImage] = useState<NasaImage | null>(null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetchNasaImage(query).then(img => {
      if (mounted.current) {
        setImage(img);
        setLoading(false);
      }
    });
  }, [query]);

  return { image, loading };
}

// ── Exoplanet orbital diagram (SVG) ──────────────────────────────────────────

interface OrbitDef { r: number; period: number; habitable?: boolean; colorClass: string; label: string; }

const EXOPLANET_ORBITS: Record<string, { star: string; starColor: string; planets: OrbitDef[] }> = {
  trappist1: {
    star: 'TRAPPIST-1',
    starColor: '#e05030',
    planets: [
      { r: 22, period: 1.51, colorClass: '#e07850', label: 'b' },
      { r: 30, period: 2.42, colorClass: '#e8a060', label: 'c' },
      { r: 39, period: 4.05, colorClass: '#a0c8f0', label: 'd' },
      { r: 50, period: 6.10, colorClass: '#68c080', habitable: true, label: 'e' },
      { r: 61, period: 9.21, colorClass: '#88d078', habitable: true, label: 'f' },
      { r: 73, period: 12.4, colorClass: '#78b860', habitable: true, label: 'g' },
      { r: 87, period: 18.8, colorClass: '#8890c0', label: 'h' },
    ],
  },
  kepler442: {
    star: 'Kepler-442',
    starColor: '#f0a050',
    planets: [
      { r: 55, period: 112.3, colorClass: '#68b870', habitable: true, label: 'b' },
    ],
  },
  'alpha-centauri': {
    star: 'α Cen',
    starColor: '#ffe8a0',
    planets: [
      { r: 40, period: 3.24, colorClass: '#e07850', label: 'B b?' },
    ],
  },
};

const ExoplanetOrbitalDiagram: React.FC<{ systemId: string }> = ({ systemId }) => {
  const def = EXOPLANET_ORBITS[systemId];
  const timeRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !def) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2;

    ctx.clearRect(0, 0, W, H);
    // Background
    ctx.fillStyle = '#050912';
    ctx.fillRect(0, 0, W, H);

    // Habitable zone ring
    const habPlanets = def.planets.filter(p => p.habitable);
    if (habPlanets.length >= 1) {
      const innerR = Math.min(...habPlanets.map(p => p.r)) - 8;
      const outerR = Math.max(...habPlanets.map(p => p.r)) + 8;
      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      grad.addColorStop(0, 'rgba(60,200,80,0)');
      grad.addColorStop(0.3, 'rgba(60,200,80,0.12)');
      grad.addColorStop(0.7, 'rgba(60,200,80,0.12)');
      grad.addColorStop(1, 'rgba(60,200,80,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Orbit circles
    def.planets.forEach(p => {
      ctx.beginPath();
      ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160,180,255,0.20)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Central star
    const starGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
    starGrad.addColorStop(0, def.starColor);
    starGrad.addColorStop(0.6, def.starColor + 'aa');
    starGrad.addColorStop(1, def.starColor + '00');
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = starGrad;
    ctx.fill();

    // Planets
    const t = timeRef.current;
    def.planets.forEach(p => {
      const ang = (t / (p.period * 0.6)) % (Math.PI * 2);
      const px = cx + Math.cos(ang) * p.r;
      const py = cy + Math.sin(ang) * p.r;
      ctx.beginPath();
      ctx.arc(px, py, p.habitable ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = p.colorClass;
      ctx.fill();
      // Planet label
      ctx.fillStyle = 'rgba(200,220,255,0.65)';
      ctx.font = '7px monospace';
      ctx.fillText(p.label, px + 4, py - 3);
    });

    // Star name
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(def.star, 6, H - 6);

    // Habitable zone label
    if (habPlanets.length > 0) {
      ctx.fillStyle = 'rgba(80,220,100,0.55)';
      ctx.font = '7px sans-serif';
      ctx.fillText('HZ', W - 20, H - 6);
    }
  }, [def]);

  useEffect(() => {
    if (!def) return;
    let last = 0;
    const loop = (ts: number) => {
      const dt = (ts - last) / 1000;
      last = ts;
      timeRef.current += dt;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [def, draw]);

  if (!def) return null;
  return <canvas ref={canvasRef} width={200} height={120} className="w-full h-full" />;
};

// ── LSS cosmic web filament animation ────────────────────────────────────────

const LSSCosmicWebCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width, H = cv.height;

    // Generate stable filament nodes using fixed seed
    type Node = { x: number; y: number; r: number; bright: number };
    const nodes: Node[] = [];
    let s = 12345;
    const rand = () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < 60; i++) {
      nodes.push({ x: rand() * W, y: rand() * H, r: rand() * 2.5 + 0.5, bright: rand() });
    }

    const draw = (t: number) => {
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, W, H);

      // Filaments (connect nearby nodes with dim lines)
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < W * 0.28) {
            const alpha = (1 - dist / (W * 0.28)) * 0.20;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(160,180,255,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // Nodes (galaxy cluster halos pulsing gently)
      nodes.forEach((n, i) => {
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.3 + i * 0.7);
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3 * pulse);
        grad.addColorStop(0, `rgba(180,200,255,${(0.7 * n.bright * pulse).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(120,140,255,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Voids (dark circular regions)
      [[W * 0.2, H * 0.35, 28], [W * 0.7, H * 0.6, 22], [W * 0.5, H * 0.15, 18]].forEach(([vx, vy, vr]) => {
        const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, vr);
        g.addColorStop(0, 'rgba(0,2,8,0.45)');
        g.addColorStop(1, 'rgba(0,2,8,0)');
        ctx.beginPath();
        ctx.arc(vx, vy, vr, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
    };

    let last = 0;
    const loop = (ts: number) => {
      const dt = (ts - last) / 1000;
      last = ts;
      timeRef.current += dt;
      draw(timeRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} width={200} height={120} className="w-full h-full" />;
};

// ── Sub-components ───────────────────────────────────────────────────────────

interface CardProps {
  card: CosmicCard;
  onDrillDown: (card: CosmicCard) => void;
}

// IDs that should show procedural orbital diagram when NASA image fails
const ORBITAL_DIAGRAM_IDS = new Set(Object.keys(EXOPLANET_ORBITS));
// IDs (LSS features) that show cosmic web canvas when NASA image fails
const LSS_PROCEDURAL_IDS = new Set(['bootes-void', 'sloan-great-wall', 'hercules-corona', 'pisces-cetus', 'sculptor-wall', 'cfa2-great-wall', 'vela-supercluster']);

const NasaImageCard: React.FC<CardProps> = ({ card, onDrillDown }) => {
  const { image, loading } = useNasaImage(card.nasaQuery);
  const showOrbital = !loading && !image && ORBITAL_DIAGRAM_IDS.has(card.id);
  const showCosmicWeb = !loading && !image && LSS_PROCEDURAL_IDS.has(card.id);

  return (
    <button
      onClick={() => card.isDrillable && onDrillDown(card)}
      className={[
        'group flex flex-col rounded-2xl overflow-hidden border transition-all text-left w-full',
        card.isDrillable
          ? 'active:scale-[0.97] hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-900/40 cursor-pointer border-white/12 bg-white/5'
          : 'cursor-default border-white/8 bg-white/3',
      ].join(' ')}
    >
      {/* Image / procedural thumbnail */}
      <div className="relative w-full aspect-video bg-indigo-950/60 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}
        {image ? (
          <img
            src={image.thumbUrl}
            alt={card.nameJa}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : showOrbital ? (
          <ExoplanetOrbitalDiagram systemId={card.id} />
        ) : showCosmicWeb ? (
          <LSSCosmicWebCanvas />
        ) : !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-20">🌌</span>
          </div>
        )}

        {/* Home badge */}
        {card.isHome && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/90 rounded-full text-[9px] font-bold text-amber-950">
            ここ
          </div>
        )}
        {/* NASA credit */}
        {image && (
          <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/70 text-white/35 text-[7px] rounded-tl">
            NASA
          </div>
        )}
        {/* Drill-down overlay */}
        {card.isDrillable && (
          <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors duration-300 flex items-center justify-center">
            <span className="text-white/0 group-hover:text-white/80 text-2xl transition-all duration-300 drop-shadow-lg">
              →
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-white text-xs font-bold leading-tight line-clamp-2">{card.nameJa}</p>
        {card.countStr && (
          <p className="text-indigo-300/65 text-[10px]">{card.countStr}</p>
        )}
        <p className="text-white/40 text-[10px]">{card.distanceStr}</p>
        <p className="text-white/30 text-[9px] line-clamp-2 mt-0.5 leading-relaxed">
          {card.descriptionJa}
        </p>
        {card.isDrillable && (
          <p className="text-indigo-400/70 text-[9px] font-semibold mt-1">
            → 探索する
          </p>
        )}
      </div>
    </button>
  );
};

// Background image (level-specific NASA image, blurred)
const CosmicBackground: React.FC<{ level: string; objectQuery?: string }> = ({ level, objectQuery }) => {
  const bgQuery = objectQuery ?? NASA_LEVEL_BG_QUERIES[level] ?? 'universe galaxy space';
  const { image } = useNasaImage(bgQuery);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[#03050f]" />
      {image && (
        <img
          src={image.thumbUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[3px] scale-105"
        />
      )}
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
    </div>
  );
};

// ── Empty state for non-drillable galaxies ───────────────────────────────────

const GalaxyFactsView: React.FC<{ state: SolarSystemState }> = ({ state }) => {
  const gx = getGalaxyById(state.currentGalaxyId);
  const { image } = useNasaImage(NASA_OBJECT_QUERIES[gx.id] ?? gx.nameEn);

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-lg mx-auto">
      {image && (
        <div className="w-full max-w-xs rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-indigo-900/50">
          <img src={image.thumbUrl} alt={gx.nameJa} className="w-full aspect-video object-cover" />
          <div className="bg-black/60 px-2 py-1">
            <p className="text-white/30 text-[7px] text-right">Image credit: NASA</p>
          </div>
        </div>
      )}
      <div className="space-y-3 text-center">
        <h3 className="text-white text-base font-bold">{gx.nameJa}</h3>
        <p className="text-white/55 text-xs leading-relaxed">{gx.descriptionJa}</p>
        <div className="flex gap-4 justify-center text-center">
          <div>
            <p className="text-indigo-300 text-sm font-bold">{gx.diameterKly}千光年</p>
            <p className="text-white/35 text-[9px]">直径</p>
          </div>
          <div>
            <p className="text-indigo-300 text-sm font-bold">{gx.starCount}</p>
            <p className="text-white/35 text-[9px]">恒星数</p>
          </div>
        </div>
        {gx.facts?.length > 0 && (
          <ul className="space-y-2 text-left">
            {gx.facts.map((f, i) => (
              <li key={i} className="flex gap-2 text-xs text-white/50 leading-relaxed">
                <span className="text-indigo-400 shrink-0">•</span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ── Scale comparison bar (#74) ───────────────────────────────────────────────
const SCALE_ENTRIES: Array<{ level: CosmicLevel; labelJa: string; emoji: string; sizeStr: string }> = [
  { level: 'lss',          labelJa: '大規模構造', emoji: '🌌', sizeStr: '930億光年' },
  { level: 'supercluster', labelJa: '超銀河団',   emoji: '✨', sizeStr: '5億光年' },
  { level: 'cluster',      labelJa: '銀河団',     emoji: '🌠', sizeStr: '1000万光年' },
  { level: 'group',        labelJa: '銀河群',     emoji: '💫', sizeStr: '300万光年' },
  { level: 'galaxy',       labelJa: '銀河',       emoji: '🌀', sizeStr: '10万光年' },
];

const ScaleComparisonBar: React.FC<{ currentLevel: CosmicLevel; onJump?: (level: CosmicLevel) => void }> = ({ currentLevel, onJump }) => (
  <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5 scrollbar-none">
    {SCALE_ENTRIES.map((sl, idx) => {
      const isActive = sl.level === currentLevel;
      return (
        <React.Fragment key={sl.level}>
          <button
            onClick={() => onJump?.(sl.level)}
            className={[
              'shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all active:opacity-70',
              isActive
                ? 'bg-indigo-500/30 border border-indigo-400/50'
                : 'bg-white/4 border border-white/8',
            ].join(' ')}
          >
            <span className="text-base leading-none">{sl.emoji}</span>
            <span className={['text-[8px] font-mono whitespace-nowrap', isActive ? 'text-indigo-200' : 'text-white/30'].join(' ')}>
              {sl.labelJa}
            </span>
            {isActive && (
              <span className="text-[7px] text-indigo-300/60 font-mono whitespace-nowrap">{sl.sizeStr}</span>
            )}
          </button>
          {idx < SCALE_ENTRIES.length - 1 && (
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-3 h-px bg-white/15" />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  state: SolarSystemState;
  panelCollapsed: boolean;
}

export const CosmicImageView: React.FC<Props> = ({ state, panelCollapsed }) => {
  const { cosmicLevel } = state;
  const cards = getChildCards(state);
  const ctx = getContextInfo(state);
  const leftPad = panelCollapsed ? 'pl-14' : 'pl-[148px]';

  // For galaxy level with no drillable systems
  const gx = cosmicLevel === 'galaxy' ? ALL_COSMIC_GALAXIES.find(g => g.id === state.currentGalaxyId) : undefined;
  const showGalaxyFacts = cosmicLevel === 'galaxy' && (!gx?.isDrillable || cards.length === 0);

  // Drill-down handler
  const handleDrillDown = (card: CosmicCard) => {
    if (card.targetLevel === 'system') {
      if (card.id === state.currentSystemId) {
        state.returnToSystemView();
      } else {
        state.switchSystem(card.id);
      }
    } else {
      state.drillDown(card.targetLevel, card.id);
    }
  };

  return (
    <div className={`absolute inset-0 overflow-hidden transition-[padding-left] duration-200 ${leftPad}`}>
      {/* Background */}
      <CosmicBackground level={cosmicLevel} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* ── Header ── */}
        <div className="shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{ctx.levelEmoji}</span>
            <h2 className="text-white text-sm font-black tracking-wide">{ctx.levelLabel}</h2>
          </div>
          <p className="text-indigo-300/80 text-[10px] font-medium mb-1 line-clamp-1">
            {ctx.contextLine}
          </p>
          <p className="text-white/35 text-[9px] leading-snug line-clamp-2 mb-3">{ctx.description}</p>
          {/* Scale comparison bar (#74) — only for non-system levels */}
          {cosmicLevel !== 'system' && (
            <ScaleComparisonBar
              currentLevel={cosmicLevel}
              onJump={state.goToCosmicLevel}
            />
          )}
        </div>

        {/* ── Divider ── */}
        <div className="shrink-0 mx-4 h-px bg-white/8 mb-3" />

        {/* ── Cards or facts ── */}
        <div className="flex-1 overflow-y-auto px-3 pb-8">
          {showGalaxyFacts ? (
            <GalaxyFactsView state={state} />
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <span className="text-4xl opacity-30">🔭</span>
              <p className="text-white/30 text-xs text-center">この領域のデータはありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {cards.map(card => (
                <NasaImageCard
                  key={card.id}
                  card={card}
                  onDrillDown={handleDrillDown}
                />
              ))}
            </div>
          )}

          {/* NASA attribution footer */}
          <div className="mt-6 text-center">
            <p className="text-white/15 text-[8px]">
              画像提供: NASA Image and Video Library
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
