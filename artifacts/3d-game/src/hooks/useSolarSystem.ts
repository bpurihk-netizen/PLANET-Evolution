import { useState, useCallback, useEffect } from 'react';
import { CelestialBody } from '../data/celestialBodies';
import { StarSystem, ALL_STAR_SYSTEMS, getSystemById, getAnyBodyById } from '../data/starSystems';

export interface WarpTarget {
  systemId: string;
  nameJa: string;
  distanceLy: number;
}

export type ViewMode = 'overview' | 'detail';
export type ShooterMode = 'off' | 'prompt' | 'playing' | 'victory' | 'defeat';

export interface SolarSystemState {
  // Globe mode (3D celestial globe — all 88 constellations)
  globeMode: boolean;

  // Encyclopedia mode (2D constellation encyclopedia)
  encyclopediaMode: boolean;

  // Night sky guide mode
  nightSkyMode: boolean;

  // Current star system
  currentSystemId: string;
  currentSystem: StarSystem;

  // Warp animation
  isWarping: boolean;
  warpTarget: WarpTarget | null;

  // Navigation
  selectedBodyId: string | null;
  viewMode: ViewMode;

  // focusBodyId = body that gets centred at origin in detail mode.
  // If selectedBodyId is a top-level body → same as selectedBodyId.
  // If selectedBodyId is a child (moon/sub-planet) → its parent's id.
  focusBodyId: string | null;
  focusBody: CelestialBody | null;

  // Moon detail mode — selected moon centred at origin like a planet
  moonDetailMode: boolean;
  moonDetailParentId: string | null;

  // Deiland surface mode (solar system only)
  deilandMode: boolean;
  deilandBodyId: string | null;

  // SpaceShooter
  shooterMode: ShooterMode;

  // Exploration tracking (per-system, keyed by systemId)
  visitedBodyIds: string[];

  // Derived helpers
  selectedBody: CelestialBody | null;
  deilandBody: CelestialBody | null;

  // Actions
  enterGlobe: () => void;
  exitGlobe: () => void;
  enterEncyclopedia: () => void;
  exitEncyclopedia: () => void;
  enterNightSky: () => void;
  exitNightSky: () => void;
  enterMoonDetail: (moonId: string, parentId: string) => void;
  exitMoonDetail: () => void;
  switchSystem: (id: string) => void;
  completeWarp: () => void;
  selectBody: (id: string | null) => void;
  enterDetail: (id: string) => void;
  backToOverview: () => void;
  activateDeiland: (bodyId: string) => void;
  exitDeiland: () => void;
  promptShooter: () => void;
  startShooter: () => void;
  declineShooter: () => void;
  endShooter: (result: 'victory' | 'defeat') => void;
}

const SAVE_KEY = 'solar_explorer_v2';

interface SaveData {
  visitedBySystem: Record<string, string[]>;
  lastSystemId: string;
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as SaveData;
  } catch {}
  return { visitedBySystem: {}, lastSystemId: 'solar-system' };
}

function savePersist(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

/** Given a body id, return the top-level parent body id (or the id itself if already top-level). */
function resolveFocusId(id: string, systemBodies: CelestialBody[]): string {
  if (systemBodies.some(b => b.id === id)) return id;
  const parent = systemBodies.find(b => b.children?.some(c => c.id === id));
  if (parent) return parent.id;
  return id;
}

export function useSolarSystem(): SolarSystemState {
  const [save] = useState(() => loadSave());
  const [globeMode, setGlobeMode] = useState(false);
  const [encyclopediaMode, setEncyclopediaMode] = useState(false);
  const [nightSkyMode, setNightSkyMode] = useState(false);
  const [currentSystemId, setCurrentSystemId] = useState<string>('solar-system');
  const [visitedBySystem, setVisitedBySystem] = useState<Record<string, string[]>>(save.visitedBySystem);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [deilandMode, setDeilandMode] = useState(false);
  const [deilandBodyId, setDeilandBodyId] = useState<string | null>(null);
  const [shooterMode, setShooterMode] = useState<ShooterMode>('off');
  const [warpTarget, setWarpTarget] = useState<WarpTarget | null>(null);
  const [moonDetailMode, setMoonDetailMode] = useState(false);
  const [moonDetailParentId, setMoonDetailParentId] = useState<string | null>(null);

  const currentSystem = getSystemById(currentSystemId);
  const visitedBodyIds = visitedBySystem[currentSystemId] ?? [];

  useEffect(() => {
    const timer = setTimeout(() => {
      savePersist({ visitedBySystem, lastSystemId: currentSystemId });
    }, 1000);
    return () => clearTimeout(timer);
  }, [visitedBySystem, currentSystemId]);

  const markVisited = useCallback((id: string, systemId: string) => {
    setVisitedBySystem(prev => {
      const existing = prev[systemId] ?? [];
      if (existing.includes(id)) return prev;
      return { ...prev, [systemId]: [...existing, id] };
    });
  }, []);

  const enterGlobe = useCallback(() => {
    setGlobeMode(true);
    setEncyclopediaMode(false);
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const exitGlobe = useCallback(() => {
    setGlobeMode(false);
  }, []);

  const enterEncyclopedia = useCallback(() => {
    setEncyclopediaMode(true);
    setGlobeMode(false);
    setNightSkyMode(false);
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const exitEncyclopedia = useCallback(() => {
    setEncyclopediaMode(false);
  }, []);

  const enterNightSky = useCallback(() => {
    setNightSkyMode(true);
    setGlobeMode(false);
    setEncyclopediaMode(false);
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const exitNightSky = useCallback(() => {
    setNightSkyMode(false);
  }, []);

  const switchSystem = useCallback((id: string) => {
    // No-op while a warp is already in progress — prevents mid-warp retargeting
    setWarpTarget(prev => {
      if (prev !== null) return prev;
      if (id === currentSystemId) return null;
      const target = getSystemById(id);
      return { systemId: id, nameJa: target.nameJa, distanceLy: target.distanceLy };
    });
    setSelectedBodyId(null);
    setViewMode('overview');
    setDeilandMode(false);
    setDeilandBodyId(null);
    setShooterMode('off');
    setGlobeMode(false);
    setEncyclopediaMode(false);
    setNightSkyMode(false);
  }, [currentSystemId]);

  const completeWarp = useCallback(() => {
    if (!warpTarget) return;
    setCurrentSystemId(warpTarget.systemId);
    setWarpTarget(null);
  }, [warpTarget]);

  const selectBody = useCallback((id: string | null) => {
    setSelectedBodyId(id);
    if (id) markVisited(id, currentSystemId);
  }, [markVisited, currentSystemId]);

  const enterDetail = useCallback((id: string) => {
    setSelectedBodyId(id);
    setViewMode('detail');
    setMoonDetailMode(false);
    setMoonDetailParentId(null);
    markVisited(id, currentSystemId);
  }, [markVisited, currentSystemId]);

  const enterMoonDetail = useCallback((moonId: string, parentId: string) => {
    setSelectedBodyId(moonId);
    setViewMode('detail');
    setMoonDetailMode(true);
    setMoonDetailParentId(parentId);
    markVisited(moonId, currentSystemId);
  }, [markVisited, currentSystemId]);

  const exitMoonDetail = useCallback(() => {
    setMoonDetailMode(false);
    setSelectedBodyId(moonDetailParentId);
    setMoonDetailParentId(null);
    // stay in detail viewMode — returns to parent planet detail
  }, [moonDetailParentId]);

  const backToOverview = useCallback(() => {
    setViewMode('overview');
    setSelectedBodyId(null);
    setMoonDetailMode(false);
    setMoonDetailParentId(null);
  }, []);

  const activateDeiland = useCallback((bodyId: string) => {
    setDeilandBodyId(bodyId);
    setDeilandMode(true);
    markVisited(bodyId, currentSystemId);
  }, [markVisited, currentSystemId]);

  const exitDeiland = useCallback(() => {
    setDeilandMode(false);
    setDeilandBodyId(null);
  }, []);

  const promptShooter = useCallback(() => setShooterMode('prompt'), []);
  const startShooter = useCallback(() => setShooterMode('playing'), []);
  const declineShooter = useCallback(() => setShooterMode('off'), []);
  const endShooter = useCallback((_result: 'victory' | 'defeat') => {
    setShooterMode(_result);
    setTimeout(() => setShooterMode('off'), 100);
  }, []);

  const systemBodies = currentSystem.bodies;
  const selectedBody = selectedBodyId ? (getAnyBodyById(selectedBodyId, systemBodies) ?? null) : null;
  const deilandBody  = deilandBodyId  ? (getAnyBodyById(deilandBodyId)  ?? null) : null;
  // In moonDetailMode the moon itself is the focus (not the parent planet)
  const focusBodyId  = selectedBodyId
    ? (moonDetailMode ? selectedBodyId : resolveFocusId(selectedBodyId, systemBodies))
    : null;
  const focusBody    = focusBodyId    ? (getAnyBodyById(focusBodyId, systemBodies) ?? null) : null;

  return {
    globeMode,
    encyclopediaMode,
    nightSkyMode,
    currentSystemId,
    currentSystem,
    isWarping: warpTarget !== null,
    warpTarget,
    selectedBodyId,
    viewMode,
    focusBodyId,
    focusBody,
    moonDetailMode,
    moonDetailParentId,
    deilandMode,
    deilandBodyId,
    shooterMode,
    visitedBodyIds,
    selectedBody,
    deilandBody,
    enterGlobe,
    exitGlobe,
    enterEncyclopedia,
    exitEncyclopedia,
    enterNightSky,
    exitNightSky,
    enterMoonDetail,
    exitMoonDetail,
    switchSystem,
    completeWarp,
    selectBody,
    enterDetail,
    backToOverview,
    activateDeiland,
    exitDeiland,
    promptShooter,
    startShooter,
    declineShooter,
    endShooter,
  };
}
