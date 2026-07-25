import { useState, useCallback, useEffect } from 'react';
import { CelestialBody, getBodyById, ALL_BODIES } from '../data/celestialBodies';

export type ViewMode = 'overview' | 'detail';
export type ShooterMode = 'off' | 'prompt' | 'playing' | 'victory' | 'defeat';

export interface SolarSystemState {
  // Navigation
  selectedBodyId: string | null;
  viewMode: ViewMode;

  // Deiland surface mode
  deilandMode: boolean;
  deilandBodyId: string | null;

  // SpaceShooter
  shooterMode: ShooterMode;

  // Exploration tracking
  visitedBodyIds: string[];

  // Derived helpers
  selectedBody: CelestialBody | null;
  deilandBody: CelestialBody | null;

  // Actions
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

const SAVE_KEY = 'solar_explorer_v1';

interface SaveData {
  visitedBodyIds: string[];
  lastBodyId: string | null;
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as SaveData;
  } catch {}
  return { visitedBodyIds: [], lastBodyId: null };
}

function savePersist(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function useSolarSystem(): SolarSystemState {
  const [save] = useState(() => loadSave());
  const [visitedBodyIds, setVisitedBodyIds] = useState<string[]>(save.visitedBodyIds);
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [deilandMode, setDeilandMode] = useState(false);
  const [deilandBodyId, setDeilandBodyId] = useState<string | null>(null);
  const [shooterMode, setShooterMode] = useState<ShooterMode>('off');

  // Persist visited bodies
  useEffect(() => {
    const timer = setTimeout(() => {
      savePersist({ visitedBodyIds, lastBodyId: selectedBodyId });
    }, 1000);
    return () => clearTimeout(timer);
  }, [visitedBodyIds, selectedBodyId]);

  const markVisited = useCallback((id: string) => {
    setVisitedBodyIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const selectBody = useCallback((id: string | null) => {
    setSelectedBodyId(id);
    if (id) markVisited(id);
  }, [markVisited]);

  const enterDetail = useCallback((id: string) => {
    setSelectedBodyId(id);
    setViewMode('detail');
    markVisited(id);
  }, [markVisited]);

  const backToOverview = useCallback(() => {
    setViewMode('overview');
    setSelectedBodyId(null);
  }, []);

  const activateDeiland = useCallback((bodyId: string) => {
    setDeilandBodyId(bodyId);
    setDeilandMode(true);
    markVisited(bodyId);
  }, [markVisited]);

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

  const selectedBody = selectedBodyId ? (getBodyById(selectedBodyId) ?? null) : null;
  const deilandBody = deilandBodyId ? (getBodyById(deilandBodyId) ?? null) : null;

  return {
    selectedBodyId,
    viewMode,
    deilandMode,
    deilandBodyId,
    shooterMode,
    visitedBodyIds,
    selectedBody,
    deilandBody,
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
