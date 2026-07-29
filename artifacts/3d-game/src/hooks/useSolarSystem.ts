import { useState, useCallback, useEffect } from 'react';
import { CelestialBody } from '../data/celestialBodies';
import { StarSystem, ALL_STAR_SYSTEMS, getSystemById, getAnyBodyById } from '../data/starSystems';
import {
  CosmicLevel,
  ALL_SUPERCLUSTERS, ALL_GALAXY_CLUSTERS, ALL_GALAXY_GROUPS, ALL_COSMIC_GALAXIES,
  getSuperclusterById, getClusterById, getGroupById, getGalaxyById,
} from '../data/cosmicHierarchy';
export type { CosmicLevel };

export interface WarpTarget {
  systemId: string;
  nameJa: string;
  distanceLy: number;
}

export interface CosmicWarpTarget {
  targetLevel: CosmicLevel;
  targetId: string;
  nameJa: string;
  distanceMLy: number; // millions of light years
}

export type ViewMode = 'overview' | 'detail';
export type ShooterMode = 'off' | 'prompt' | 'playing' | 'victory' | 'defeat';

// Re-export save types so consumers only need one import
export type { DeilandPlanetSave } from './deilandSave';

import { DeilandPlanetSave, loadDeilandSaves, persistDeilandSaves } from './deilandSave';

/** Stats reported by DeilandScene when the player exits or when values change. */
export interface DeilandStats {
  bodyId:        string;
  bodyNameJa:    string;
  civLevel:      number; // 1–6 (from CIV_STEPS milestones)
  foodCount:     number; // cumulative food harvested
  scienceLevel:  number; // culture.science 0–5
}

export interface SolarSystemState {
  // Globe mode (3D celestial globe — all 88 constellations)
  globeMode: boolean;

  // Encyclopedia mode (2D constellation encyclopedia)
  encyclopediaMode: boolean;

  // Night sky guide mode
  nightSkyMode: boolean;

  // Mythology storybook mode
  storybookMode: boolean;

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

  // Deiland civilisation stats (updated live while in Deiland mode)
  deilandStats: DeilandStats | null;
  // Per-planet persistent saves (loaded from / written to localStorage)
  deilandSaves: Record<string, DeilandPlanetSave>;

  // Actions
  enterGlobe: () => void;
  exitGlobe: () => void;
  enterEncyclopedia: () => void;
  exitEncyclopedia: () => void;
  enterNightSky: () => void;
  exitNightSky: () => void;
  enterStorybook: () => void;
  exitStorybook: () => void;
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

  updateDeilandStats:  (stats: DeilandStats) => void;
  saveDeilandPlanet:   (save: DeilandPlanetSave) => void;

  // Observation / sketching mode
  obsRotationPaused: boolean;
  obsFlatLight: boolean;
  showAtmosphere: boolean;
  toggleObsRotation: () => void;
  toggleObsFlatLight: () => void;
  toggleShowAtmosphere: () => void;

  // Per-body view mode (e.g. 'default' | 'surface' | 'infrared')
  bodyViewModes: Record<string, string>;
  setBodyViewMode: (bodyId: string, mode: string) => void;

  // ── Cosmic hierarchy navigation ──────────────────────────────────────────
  cosmicLevel: CosmicLevel;
  currentSuperclusterId: string;
  currentClusterId: string;
  currentGroupId: string;
  currentGalaxyId: string;
  selectedCosmicId: string | null;
  isCosmicWarping: boolean;
  cosmicWarpTarget: CosmicWarpTarget | null;
  enterLSS: () => void;
  drillDown: (targetLevel: CosmicLevel, targetId: string) => void;
  drillUp: () => void;
  goToCosmicLevel: (level: CosmicLevel) => void;  // direct jump (no warp)
  returnToSystemView: () => void;                 // exit cosmic mode → current system
  completeCosmicWarp: () => void;
  selectCosmicObject: (id: string | null) => void;
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
  const [storybookMode, setStorybookMode] = useState(false);
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
  const [obsRotationPaused, setObsRotationPaused] = useState(false);
  const [obsFlatLight, setObsFlatLight] = useState(false);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [bodyViewModes, setBodyViewModesState] = useState<Record<string, string>>({});
  const [deilandStats, setDeilandStats] = useState<DeilandStats | null>(null);
  const [deilandSaves, setDeilandSaves] = useState<Record<string, DeilandPlanetSave>>(loadDeilandSaves);

  // Persist to localStorage whenever saves change
  useEffect(() => { persistDeilandSaves(deilandSaves); }, [deilandSaves]);

  const saveDeilandPlanet = useCallback((save: DeilandPlanetSave) => {
    setDeilandSaves(prev => ({ ...prev, [save.bodyId]: save }));
  }, []);

  const updateDeilandStats = useCallback((stats: DeilandStats) => {
    setDeilandStats(prev => {
      // Skip state update when nothing changed — prevents render loops from inline callbacks
      if (prev &&
          prev.bodyId      === stats.bodyId      &&
          prev.civLevel    === stats.civLevel    &&
          prev.foodCount   === stats.foodCount   &&
          prev.scienceLevel === stats.scienceLevel) {
        return prev;
      }
      return stats;
    });
  }, []);

  const setBodyViewMode = useCallback((bodyId: string, mode: string) => {
    setBodyViewModesState(prev => ({ ...prev, [bodyId]: mode }));
  }, []);

  // ── Cosmic hierarchy state ───────────────────────────────────────────────
  const [cosmicLevel, setCosmicLevel] = useState<CosmicLevel>('system');
  const [currentSuperclusterId, setCurrentSuperclusterId] = useState('laniakea');
  const [currentClusterId, setCurrentClusterId] = useState('local-group-area');
  const [currentGroupId, setCurrentGroupId] = useState('local-group');
  const [currentGalaxyId, setCurrentGalaxyId] = useState('milky-way');
  const [selectedCosmicId, setSelectedCosmicId] = useState<string | null>(null);
  const [cosmicWarpTarget, setCosmicWarpTarget] = useState<CosmicWarpTarget | null>(null);

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
    setStorybookMode(false);
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const exitNightSky = useCallback(() => {
    setNightSkyMode(false);
  }, []);

  const enterStorybook = useCallback(() => {
    setStorybookMode(true);
    setGlobeMode(false);
    setEncyclopediaMode(false);
    setNightSkyMode(false);
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const exitStorybook = useCallback(() => {
    setStorybookMode(false);
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
    setStorybookMode(false);
  }, [currentSystemId]);

  const completeWarp = useCallback(() => {
    if (!warpTarget) return;
    setCurrentSystemId(warpTarget.systemId);
    setWarpTarget(null);
    setCosmicLevel('system'); // always return to system level after star-system warp
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
    setObsRotationPaused(false);
    setObsFlatLight(false);
  }, []);

  const toggleObsRotation     = useCallback(() => setObsRotationPaused(v => !v), []);
  const toggleObsFlatLight    = useCallback(() => setObsFlatLight(v => !v), []);
  const toggleShowAtmosphere  = useCallback(() => setShowAtmosphere(v => !v), []);

  // ── Cosmic navigation actions ────────────────────────────────────────────
  const enterLSS = useCallback(() => {
    setCosmicLevel('lss');
    setSelectedCosmicId(null);
    setGlobeMode(false);
    setEncyclopediaMode(false);
    setNightSkyMode(false);
    setStorybookMode(false);
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const drillDown = useCallback((targetLevel: CosmicLevel, targetId: string) => {
    let nameJa = '';
    let distanceMLy = 0;
    if (targetLevel === 'supercluster') {
      const sc = ALL_SUPERCLUSTERS.find(s => s.id === targetId);
      nameJa = sc?.nameJa ?? targetId; distanceMLy = sc?.distanceMLy ?? 0;
    } else if (targetLevel === 'cluster') {
      const cl = ALL_GALAXY_CLUSTERS.find(c => c.id === targetId);
      nameJa = cl?.nameJa ?? targetId; distanceMLy = cl?.distanceMLy ?? 0;
    } else if (targetLevel === 'group') {
      const gr = ALL_GALAXY_GROUPS.find(g => g.id === targetId);
      nameJa = gr?.nameJa ?? targetId; distanceMLy = gr?.distanceMLy ?? 0;
    } else if (targetLevel === 'galaxy') {
      const gx = ALL_COSMIC_GALAXIES.find(g => g.id === targetId);
      nameJa = gx?.nameJa ?? targetId; distanceMLy = gx?.distanceMLy ?? 0;
    } else if (targetLevel === 'system') {
      // handled by switchSystem
      return;
    }
    setCosmicWarpTarget({ targetLevel, targetId, nameJa, distanceMLy });
    setSelectedCosmicId(null);
  }, []);

  const completeCosmicWarp = useCallback(() => {
    if (!cosmicWarpTarget) return;
    const { targetLevel, targetId } = cosmicWarpTarget;
    if (targetLevel === 'supercluster') {
      setCurrentSuperclusterId(targetId);
    } else if (targetLevel === 'cluster') {
      const cl = ALL_GALAXY_CLUSTERS.find(c => c.id === targetId);
      if (cl) setCurrentSuperclusterId(cl.superclusterId);
      setCurrentClusterId(targetId);
    } else if (targetLevel === 'group') {
      const gr = ALL_GALAXY_GROUPS.find(g => g.id === targetId);
      if (gr) setCurrentClusterId(gr.clusterId);
      setCurrentGroupId(targetId);
    } else if (targetLevel === 'galaxy') {
      const gx = ALL_COSMIC_GALAXIES.find(g => g.id === targetId);
      if (gx) setCurrentGroupId(gx.groupId);
      setCurrentGalaxyId(targetId);
    }
    setCosmicLevel(targetLevel);
    setSelectedCosmicId(null);
    setCosmicWarpTarget(null);
  }, [cosmicWarpTarget]);

  const drillUp = useCallback(() => {
    setSelectedCosmicId(null);
    setCosmicWarpTarget(null);
    switch (cosmicLevel) {
      case 'supercluster': setCosmicLevel('lss'); break;
      case 'cluster': setCosmicLevel('supercluster'); break;
      case 'group': setCosmicLevel('cluster'); break;
      case 'galaxy': setCosmicLevel('group'); break;
      case 'system': setCosmicLevel('galaxy'); break;
      default: break;
    }
  }, [cosmicLevel]);

  const selectCosmicObject = useCallback((id: string | null) => {
    setSelectedCosmicId(id);
  }, []);

  // Jump directly to a cosmic level without a warp animation.
  // Also resets all full-screen special modes so the panel works from anywhere.
  const goToCosmicLevel = useCallback((level: CosmicLevel) => {
    setGlobeMode(false);
    setEncyclopediaMode(false);
    setNightSkyMode(false);
    setStorybookMode(false);
    setViewMode('overview');
    setSelectedBodyId(null);
    setCosmicLevel(level);
    setSelectedCosmicId(null);
    setCosmicWarpTarget(null);
  }, []);

  // Exit cosmic mode and return to the currently selected star system view
  const returnToSystemView = useCallback(() => {
    setCosmicLevel('system');
    setSelectedCosmicId(null);
    setCosmicWarpTarget(null);
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
    storybookMode,
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
    enterStorybook,
    exitStorybook,
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
    obsRotationPaused,
    obsFlatLight,
    showAtmosphere,
    toggleObsRotation,
    toggleObsFlatLight,
    toggleShowAtmosphere,
    deilandStats,
    deilandSaves,
    updateDeilandStats,
    saveDeilandPlanet,
    bodyViewModes,
    setBodyViewMode,
    cosmicLevel,
    currentSuperclusterId,
    currentClusterId,
    currentGroupId,
    currentGalaxyId,
    selectedCosmicId,
    isCosmicWarping: cosmicWarpTarget !== null,
    cosmicWarpTarget,
    enterLSS,
    drillDown,
    drillUp,
    goToCosmicLevel,
    returnToSystemView,
    completeCosmicWarp,
    selectCosmicObject,
  };
}
