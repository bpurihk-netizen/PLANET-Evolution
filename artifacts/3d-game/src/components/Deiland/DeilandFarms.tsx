/**
 * DeilandFarms — Farm plot system for the Deiland surface mode.
 *
 * Lifecycle:
 *   Stage 0 → bare tilled soil (newly seeded OR just harvested — replant-ready)
 *   Stage 1 → seed sown      (grows automatically; water doubles speed)
 *   Stage 2 → sprout
 *   Stage 3 → growing
 *   Stage 4 → ripe           (harvest for food)
 *
 * Water mechanic:
 *   Each 💧 water action adds +1 charge (max FARM_WATER_MAX = 3).
 *   While waterLevel > 0 the plot grows at WATER_SPEED_MULT × base speed.
 *   Water evaporates at WATER_DECAY_RATE charges/second (~1 per 90 s).
 */

import React from 'react';
import * as THREE from 'three';
import { BiomeType } from '../../data/celestialBodies';

// ── Data ─────────────────────────────────────────────────────────────────────
export interface FarmPlot {
  id:          string;
  pos:         THREE.Vector3;  // world-space surface position
  up:          THREE.Vector3;  // surface normal
  growthStage: number;         // 0 bare | 1 seed | 2 sprout | 3 growing | 4 ripe
  growthTimer: number;         // seconds elapsed in current stage
  waterLevel:  number;         // 0–3 float (decays over time)
  biome:       BiomeType;
}

export const FARM_STAGE_DURATION = 45;    // base seconds per stage
export const WATER_SPEED_MULT    = 2.2;   // speed multiplier when watered
export const WATER_DECAY_RATE    = 1 / 90; // charges/sec lost
export const FARM_WATER_MAX      = 3;
export const FARM_FOOD_YIELD     = 5;     // food gained per harvest

/** Localised crop name for the HUD */
export function getCropLabel(biome: BiomeType): string {
  switch (biome) {
    case 'TEMPERATE': return '🌾 穀物';
    case 'OCEAN':     return '🌿 海草';
    case 'DESERT':    return '🌵 サボテン';
    case 'ICE':       return '💎 氷結晶';
    case 'VOLCANIC':  return '🍄 燃えキノコ';
    case 'TOXIC':     return '🍄 毒キノコ';
    case 'GAS':       return '🌸 ガス花';
    case 'METHANE':   return '🍋 メタン果';
    case 'AIRLESS':   return '🪨 岩石苔';
    default:          return '🌿 野草';
  }
}

// ── Biome crop colours ────────────────────────────────────────────────────────
const CROP_PALETTE: Partial<Record<BiomeType, { main: string; emissive: string }>> = {
  TEMPERATE:   { main: '#88cc44', emissive: '#446620' },
  OCEAN:       { main: '#44bb88', emissive: '#226644' },
  DESERT:      { main: '#ddaa44', emissive: '#886620' },
  ICE:         { main: '#88ccff', emissive: '#4488cc' },
  VOLCANIC:    { main: '#cc4422', emissive: '#882200' },
  TOXIC:       { main: '#88cc22', emissive: '#446600' },
  GAS:         { main: '#cc88ff', emissive: '#884488' },
  METHANE:     { main: '#ddaa33', emissive: '#886622' },
  AIRLESS:     { main: '#aabbcc', emissive: '#445566' },
  FROZEN_ROCK: { main: '#99bbcc', emissive: '#334455' },
};

// ── CropMesh ─────────────────────────────────────────────────────────────────
/** Renders one crop at its current growth stage, oriented upright relative to surface normal. */
const CropMesh: React.FC<{ plot: FarmPlot }> = ({ plot }) => {
  if (plot.growthStage === 0) return null;

  const stageScale = [0, 0.14, 0.36, 0.68, 1.0][plot.growthStage] ?? 1.0;
  const pal        = CROP_PALETTE[plot.biome] ?? { main: '#88bb44', emissive: '#446622' };
  const isRipe     = plot.growthStage >= 4;
  const hasWater   = plot.waterLevel >= 0.1;

  return (
    <group>
      {/* Tilled-soil disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[0.26, 8]} />
        <meshLambertMaterial color={isRipe ? '#503015' : '#3d2510'} />
      </mesh>

      {/* Crop body — scaled by stage */}
      <group scale={[stageScale, stageScale, stageScale]}>
        {/* Stem */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.025, 0.032, 0.28, 4]} />
          <meshLambertMaterial color="#7a5535" />
        </mesh>

        {/* Crown */}
        <mesh position={[0, 0.30, 0]}>
          <sphereGeometry args={[0.13, 7, 6]} />
          <meshLambertMaterial
            color={pal.main}
            emissive={pal.emissive}
            emissiveIntensity={isRipe ? 0.45 : 0.08}
          />
        </mesh>

        {/* Ripe extras: second fruit cluster + glow */}
        {isRipe && (
          <>
            <mesh position={[0.11, 0.26, 0.06]}>
              <sphereGeometry args={[0.07, 5, 5]} />
              <meshLambertMaterial color={pal.main} emissive={pal.emissive} emissiveIntensity={0.55} />
            </mesh>
            <pointLight
              position={[0, 0.30, 0]}
              color={pal.main}
              intensity={0.22}
              distance={0.95}
              decay={2}
            />
          </>
        )}

        {/* Water droplet indicator — visible while watered and still growing */}
        {hasWater && !isRipe && (
          <mesh position={[0.19, 0.22, 0]}>
            <sphereGeometry args={[0.045, 5, 5]} />
            <meshLambertMaterial color="#60aaff" emissive="#2060ff" emissiveIntensity={0.55} />
          </mesh>
        )}
      </group>
    </group>
  );
};

// ── DeilandFarmsRenderer ──────────────────────────────────────────────────────
/**
 * Renders all farm plots inside the R3F Canvas.
 * Must live inside DeilandWorld. Pass `version` (bumped externally when plot
 * data changes) to force re-renders when refs mutate.
 */
export const DeilandFarmsRenderer: React.FC<{
  farmPlotsRef: React.MutableRefObject<FarmPlot[]>;
  version:      number;
}> = ({ farmPlotsRef }) => (
  <>
    {farmPlotsRef.current.map(plot => {
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), plot.up,
      );
      return (
        <group key={plot.id} position={plot.pos} quaternion={q}>
          <CropMesh plot={plot} />
        </group>
      );
    })}
  </>
);
