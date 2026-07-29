/**
 * DeilandTrees — tree instance data + GrowingTree visual component.
 *
 * Growth stages 0-4:
 *   0 = seedling  (tiny green sprout)
 *   1 = sprout    (very small tree)
 *   2 = sapling   (small tree)
 *   3 = young     (medium tree)
 *   4 = mature    (full tree — can harvest)
 *
 * Each stage takes STAGE_DURATION real-time seconds to complete.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeType } from '../../data/celestialBodies';
import { TreeMesh } from './DeilandPlanet';

// ── Constants ─────────────────────────────────────────────────────────────────
export const STAGE_DURATION = 20; // real-time seconds per stage (5 stages → 100 s total)

/** Visual scale of the group at each growth stage */
const STAGE_SCALES = [0.12, 0.26, 0.45, 0.70, 1.0] as const;

// ── Types ─────────────────────────────────────────────────────────────────────
export type PlantKind = 'round' | 'cactus' | 'crystal' | 'palm' | 'dead';

export interface TreeInstance {
  id:          string;
  pos:         THREE.Vector3;
  up:          THREE.Vector3;
  growthStage: number;   // 0 – 4 (mutated in-place by useFrame)
  growthTimer: number;   // accumulated seconds at current stage (mutated in-place)
  biome:       BiomeType;
  phase:       number;   // animation phase offset
}

// ── Biome → tree kind mapping ─────────────────────────────────────────────────
export function getBiomePlantKind(biome: BiomeType): PlantKind {
  switch (biome) {
    case 'TEMPERATE': return 'round';
    case 'OCEAN':     return 'palm';
    case 'DESERT':    return 'cactus';
    case 'ICE':       return 'crystal';
    default:          return 'dead';
  }
}

// ── Biome → harvest yield ────────────────────────────────────────────────────
export function getHarvestYield(biome: BiomeType): { wood: number; fruit: number } {
  switch (biome) {
    case 'TEMPERATE': return { wood: 2, fruit: 2 };
    case 'OCEAN':     return { wood: 1, fruit: 3 };
    case 'DESERT':    return { wood: 1, fruit: 2 };  // cacti yield 1 clay-equiv (粘土)
    case 'ICE':       return { wood: 2, fruit: 0 };
    default:          return { wood: 1, fruit: 0 };
  }
}

// ── GrowingTree visual component ──────────────────────────────────────────────
interface GrowingTreeProps {
  instance: TreeInstance;
}

/**
 * Renders a tree at its current growth stage with smooth scale interpolation.
 * The group scale lerps from its current visual size toward the target stage scale
 * every frame, so growth feels continuous rather than instant.
 */
export const GrowingTree: React.FC<GrowingTreeProps> = ({ instance }) => {
  const groupRef  = useRef<THREE.Group>(null);
  // Start from the current stage scale so re-mounts don't pop
  const scaleRef  = useRef(STAGE_SCALES[Math.min(4, instance.growthStage)]);
  const kind      = getBiomePlantKind(instance.biome);

  useFrame((_, dt) => {
    const target = STAGE_SCALES[Math.min(4, instance.growthStage)];
    // Smooth growth — converge toward target at ~2x speed per second
    scaleRef.current += (target - scaleRef.current) * Math.min(1, dt * 2);
    if (groupRef.current) {
      const s = scaleRef.current;
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef}>
      {instance.growthStage === 0 ? (
        /* Seedling: a tiny luminous green sprout */
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshLambertMaterial
            color="#3aad4a"
            emissive="#1a7a20"
            emissiveIntensity={0.35}
            flatShading
          />
        </mesh>
      ) : (
        /* Stages 1–4: standard biome tree, scaled by the group */
        <TreeMesh scale={1} kind={kind} biome={instance.biome} phase={instance.phase} />
      )}

      {/* Harvest indicator: warm glow when fully grown */}
      {instance.growthStage >= 4 && (
        <pointLight
          position={[0, 1.4, 0]}
          color="#ffd080"
          intensity={0.5}
          distance={2.2}
          decay={2}
        />
      )}
    </group>
  );
};
