/**
 * deilandSave — Serialisable save format for per-planet Deiland state.
 *
 * THREE.Vector3 is not JSON-safe, so pos/up fields are stored as [x,y,z] tuples.
 * buildTimer is kept so buildings that were mid-animation finish gracefully.
 * civLevel and treeCount are cached summaries for InfoPanel display without
 * deserialising the full save.
 */

import * as THREE from 'three';
import { BuildingType, BuildingInstance } from '../components/Deiland/DeilandBuildings';
import { TreeInstance }                   from '../components/Deiland/DeilandTrees';
import { FarmPlot }                       from '../components/Deiland/DeilandFarms';
import { BiomeType }                      from '../data/celestialBodies';

// ── Serialisable types ────────────────────────────────────────────────────────
export interface DeilandTreeSave {
  id: string;
  pos: [number, number, number];
  up:  [number, number, number];
  growthStage: number;
  growthTimer: number;
  biome:       string;   // BiomeType
  phase:       number;
}

export interface DeilandBuildingSave {
  id:         string;
  type:       BuildingType;
  pos:        [number, number, number];
  up:         [number, number, number];
  buildTimer: number;
}

export interface DeilandFarmSave {
  id:          string;
  pos:         [number, number, number];
  up:          [number, number, number];
  growthStage: number;
  growthTimer: number;
  waterLevel:  number;
  biome:       string;   // BiomeType
}

/** Full serialisable save for one planet */
export interface DeilandPlanetSave {
  bodyId:        string;
  trees:         DeilandTreeSave[];
  buildings:     DeilandBuildingSave[];
  farms:         DeilandFarmSave[];
  inventory:     { wood: number; stone: number; fruit: number };
  foodCount:     number;
  culturePoints: number;
  culture:       { music: number; art: number; science: number };
  /** Cached summary — avoids full deserialisation in InfoPanel */
  civLevel:  number;
  treeCount: number;
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const SAVE_KEY = 'deiland_planet_saves_v1';

export function loadDeilandSaves(): Record<string, DeilandPlanetSave> {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DeilandPlanetSave>;
  } catch {
    return {};
  }
}

export function persistDeilandSaves(saves: Record<string, DeilandPlanetSave>): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  } catch { /* quota exceeded — silent */ }
}

// ── Serialisation ─────────────────────────────────────────────────────────────
export function serializeTree(t: TreeInstance): DeilandTreeSave {
  return {
    id:          t.id,
    pos:         [t.pos.x, t.pos.y, t.pos.z],
    up:          [t.up.x,  t.up.y,  t.up.z ],
    growthStage: t.growthStage,
    growthTimer: t.growthTimer,
    biome:       t.biome,
    phase:       t.phase,
  };
}

export function serializeBuilding(b: BuildingInstance): DeilandBuildingSave {
  return {
    id:         b.id,
    type:       b.type,
    pos:        [b.pos.x, b.pos.y, b.pos.z],
    up:         [b.up.x,  b.up.y,  b.up.z ],
    buildTimer: b.buildTimer,
  };
}

export function serializeFarm(f: FarmPlot): DeilandFarmSave {
  return {
    id:          f.id,
    pos:         [f.pos.x, f.pos.y, f.pos.z],
    up:          [f.up.x,  f.up.y,  f.up.z ],
    growthStage: f.growthStage,
    growthTimer: f.growthTimer,
    waterLevel:  f.waterLevel,
    biome:       f.biome,
  };
}

// ── Deserialisation ───────────────────────────────────────────────────────────
export function deserializeTree(s: DeilandTreeSave): TreeInstance {
  return {
    id:          s.id,
    pos:         new THREE.Vector3(...s.pos),
    up:          new THREE.Vector3(...s.up),
    growthStage: s.growthStage,
    growthTimer: s.growthTimer,
    biome:       s.biome as BiomeType,
    phase:       s.phase,
  };
}

export function deserializeBuilding(s: DeilandBuildingSave): BuildingInstance {
  return {
    id:         s.id,
    type:       s.type,
    pos:        new THREE.Vector3(...s.pos),
    up:         new THREE.Vector3(...s.up),
    buildTimer: s.buildTimer,
  };
}

export function deserializeFarm(s: DeilandFarmSave): FarmPlot {
  return {
    id:          s.id,
    pos:         new THREE.Vector3(...s.pos),
    up:          new THREE.Vector3(...s.up),
    growthStage: s.growthStage,
    growthTimer: s.growthTimer,
    waterLevel:  s.waterLevel,
    biome:       s.biome as BiomeType,
  };
}
