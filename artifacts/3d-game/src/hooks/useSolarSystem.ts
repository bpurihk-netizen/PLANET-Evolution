import { useState, useCallback, useEffect } from 'react';
import { CelestialBody } from '../data/celestialBodies';
import { StarSystem, ALL_STAR_SYSTEMS, getSystemById, getAnyBodyById } from '../data/starSystems';

export type ViewMode = 'overview' | 'detail';
export type ShooterMode = 'off' | 'prompt' | 'playing' | 'victory' | 'defeat';

export interface SolarSystemState {
  // Globe mode (celestial globe view — all 88 constellations)
  globeMode: boolean;

  // Current star system
  currentSystemId: string;
  currentSystem: StarSystem;

  // Navigation
  selectedBodyId: string | null;
  viewMode: ViewMode;

  // focusBodyId = body that gets centred at origin in detail mode.
  // If selectedBodyId is a top-level body → same as selectedBodyId.
  // If selectedBodyId is a child (moon/sub-planet) → its parent's id.
  focusBodyId: string | null;
  focusBody: CelestialBody | null;

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
  switchSystem: (id: string) => void;
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
  // Is it a top-level body?
  if (systemBodies.some(b => b.id === id)) return id;
  // Is it a child of a top-level body?
  const parent = systemBodies.find(b => b.children?.some(c => c.id === id));
  if (parent) return parent.id;
  // Fallback: itself
  return id;
}

export function useSolarSystem(): SolarSystemState {
  const [save] = useState(() => loadSave());
  const [globeMode, setGlobeMode] = useState(false);
  const [currentSystemId, setCurrentSystemId] = useState<string>('solar-system');
  const [visitedBySystem, setVisitedBySystem] = useState<Record<string, string[]>>(save.visitedBySystem);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [deilandMode, setDeilandMode] = useState(false);
  const [deilandBodyId, setDeilandBodyId] = useState<string | null>(null);
  const [shooterMode, setShooterMode] = useState<ShooterMode>('off');

  const currentSystem = getSystemById(currentSystemId);
  const visitedBodyIds = visitedBySystem[currentSystemId] ?? [];

  // Persist visited bodies
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
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const exitGlobe = useCallback(() => {
    setGlobeMode(false);
  }, []);

  const switchSystem = useCallback((id: string) => {
    setCurrentSystemId(id);
    setSelectedBodyId(null);
    setViewMode('overview');
    setDeilandMode(false);
    setDeilandBodyId(null);
    setShooterMode('off');
    setGlobeMode(false);
  }, []);

  const selectBody = useCallback((id: string | null) => {
    setSelectedBodyId(id);
    if (id) markVisited(id, currentSystemId);
  }, [markVisited, currentSystemId]);

  const enterDetail = useCallback((id: string) => {
    setSelectedBodyId(id);
    setViewMode('detail');
    markVisited(id, currentSystemId);
  }, [markVisited, currentSystemId]);

  const backToOverview = useCallback(() => {
    setViewMode('overview');
    setSelectedBodyId(null);
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

  // Resolve focus: if selectedBody is a child, focus on its parent
  const focusBodyId = selectedBodyId ? resolveFocusId(selectedBodyId, systemBodies) : null;
  const focusBody   = focusBodyId ? (getAnyBodyById(focusBodyId, systemBodies) ?? null) : null;

  return {
    globeMode,
    currentSystemId,
    currentSystem,
    selectedBodyId,
    viewMode,
    focusBodyId,
    focusBody,
    deilandMode,
    deilandBodyId,
    shooterMode,
    visitedBodyIds,
    selectedBody,
    deilandBody,
    enterGlobe,
    exitGlobe,
    switchSystem,
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
