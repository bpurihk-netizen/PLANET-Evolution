/**
 * DeilandBuildings — reusable building mesh components for the Deiland surface.
 *
 * Each BuildingMesh is a self-contained R3F group.  The caller is responsible
 * for positioning and orienting it (typically: position=worldPos, quaternion=
 * fromUnitVectors(UP_Y, sphereNormal)).
 *
 * Building types:  'hut' | 'farm' | 'workshop' | 'shrine'
 * Biome theming:   wall / roof / door / accent / light colours via getBiomeBuildingColors()
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeType } from '../../data/celestialBodies';

// ── Public types ──────────────────────────────────────────────────────────────
export type BuildingType = 'hut' | 'farm' | 'workshop' | 'shrine';

export interface BuildingInstance {
  id:         string;
  type:       BuildingType;
  /** World-space position on planet surface */
  pos:        THREE.Vector3;
  /** Surface normal (for orientation) */
  up:         THREE.Vector3;
  /** Seconds since placed; 0 = brand-new (animating in); ≥ BUILD_ANIM_DUR = fully built */
  buildTimer: number;
}

/** Duration of the scale-in build animation (seconds) */
export const BUILD_ANIM_DUR = 0.8;

export interface BuildRecipe {
  wood:      number;
  stone:     number;
  civPoints: number;
}

export const BUILD_RECIPES: Record<BuildingType, BuildRecipe> = {
  hut:      { wood: 5, stone: 3, civPoints: 10 },
  farm:     { wood: 2, stone: 0, civPoints:  8 },
  workshop: { wood: 8, stone: 5, civPoints: 20 },
  shrine:   { wood: 3, stone: 6, civPoints: 15 },
};

// ── Biome → material colour palette ──────────────────────────────────────────
interface BiomeBuildingColors {
  wall:   string;
  roof:   string;
  door:   string;
  accent: string;
  glass:  string;
  light:  string;
}

function getBiomeBuildingColors(biome: BiomeType): BiomeBuildingColors {
  switch (biome) {
    case 'TEMPERATE': return { wall: '#c8a870', roof: '#8b4513', door: '#5a3010', accent: '#d4b896', glass: '#b0d8f8', light: '#ffe0a0' };
    case 'OCEAN':     return { wall: '#4a7090', roof: '#2a5070', door: '#1a3050', accent: '#6090b0', glass: '#80c8ff', light: '#80c0ff' };
    case 'DESERT':    return { wall: '#d4b880', roof: '#c09050', door: '#8b6030', accent: '#e8d0a0', glass: '#ffe8a0', light: '#ffd080' };
    case 'ICE':       return { wall: '#c0e0f8', roof: '#80c0e8', door: '#4090c0', accent: '#e0f4ff', glass: '#c0f0ff', light: '#a0d8ff' };
    case 'VOLCANIC':  return { wall: '#3a1a10', roof: '#5a2010', door: '#1a0800', accent: '#8b2a00', glass: '#ff6020', light: '#ff6020' };
    case 'TOXIC':     return { wall: '#607020', roof: '#405010', door: '#202800', accent: '#90a030', glass: '#c0e040', light: '#a0d020' };
    case 'AIRLESS':   return { wall: '#606070', roof: '#505060', door: '#303040', accent: '#808090', glass: '#8090c0', light: '#8090ff' };
    case 'GAS':       return { wall: '#604880', roof: '#483070', door: '#201838', accent: '#8060a0', glass: '#c090ff', light: '#c090ff' };
    case 'METHANE':   return { wall: '#906040', roof: '#704020', door: '#402010', accent: '#c08050', glass: '#ffc080', light: '#ffa060' };
    default:          return { wall: '#907060', roof: '#605040', door: '#302010', accent: '#b09070', glass: '#b0d0f0', light: '#ffcc80' };
  }
}

// ── Gently-pulsing lantern point light ────────────────────────────────────────
const BuildingLight: React.FC<{
  position: [number, number, number];
  color: string;
  phase: number;
}> = ({ position, color, phase }) => {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.intensity = 0.5 + Math.sin(clock.elapsedTime * 1.5 + phase) * 0.15;
    }
  });
  return <pointLight ref={ref} position={position} color={color} intensity={0.55} distance={2.5} decay={2} />;
};

// ── Main component ────────────────────────────────────────────────────────────
interface BuildingMeshProps {
  type:    BuildingType;
  biome:   BiomeType;
  /** Used to desync lantern pulses across multiple buildings */
  phase?:  number;
}

export const BuildingMesh: React.FC<BuildingMeshProps> = ({ type, biome, phase = 0 }) => {
  const c = getBiomeBuildingColors(biome);

  const mWall   = <meshLambertMaterial color={c.wall}   flatShading />;
  const mRoof   = <meshLambertMaterial color={c.roof}   flatShading />;
  const mDoor   = <meshLambertMaterial color={c.door}   flatShading />;
  const mAccent = <meshLambertMaterial color={c.accent} flatShading />;
  const mGlass  = <meshLambertMaterial color={c.glass}  transparent opacity={0.65} />;
  const mGlow   = <meshLambertMaterial color={c.light}  emissive={c.light} emissiveIntensity={0.8} />;

  // ── Hut ─────────────────────────────────────────────────────────────────────
  if (type === 'hut') return (
    <group>
      {/* Foundation step */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.08, 0.56]} />{mAccent}
      </mesh>
      {/* Walls */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.58, 0.32, 0.48]} />{mWall}
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <coneGeometry args={[0.46, 0.34, 4]} />{mRoof}
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.19, 0.245]}>
        <boxGeometry args={[0.14, 0.22, 0.01]} />{mDoor}
      </mesh>
      {/* Door arch */}
      <mesh position={[0, 0.305, 0.246]}>
        <cylinderGeometry args={[0.07, 0.07, 0.012, 6, 1, false, 0, Math.PI]} />
        {mDoor}
      </mesh>
      {/* Left window */}
      <mesh position={[-0.17, 0.26, 0.245]}>
        <boxGeometry args={[0.10, 0.10, 0.01]} />{mGlass}
      </mesh>
      {/* Right window */}
      <mesh position={[0.17, 0.26, 0.245]}>
        <boxGeometry args={[0.10, 0.10, 0.01]} />{mGlass}
      </mesh>
      {/* Back window */}
      <mesh position={[0, 0.28, -0.245]}>
        <boxGeometry args={[0.12, 0.10, 0.01]} />{mGlass}
      </mesh>
      {/* Lantern sphere above door */}
      <mesh position={[0, 0.46, 0.20]}>
        <sphereGeometry args={[0.04, 5, 4]} />{mGlow}
      </mesh>
      <BuildingLight position={[0, 0.50, 0.22]} color={c.light} phase={phase} />
    </group>
  );

  // ── Farm ─────────────────────────────────────────────────────────────────────
  if (type === 'farm') return (
    <group>
      {/* Four garden beds */}
      {([ [-0.22,-0.22], [0.22,-0.22], [-0.22,0.22], [0.22,0.22] ] as [number,number][]).map(([x,z],i) => (
        <group key={i}>
          <mesh position={[x, 0.06, z]} castShadow receiveShadow>
            <boxGeometry args={[0.30, 0.12, 0.30]} />{mWall}
          </mesh>
          {/* Soil fill */}
          <mesh position={[x, 0.128, z]}>
            <boxGeometry args={[0.26, 0.01, 0.26]} />
            <meshLambertMaterial color="#5a3a20" flatShading />
          </mesh>
          {/* Crop sprouts */}
          {([ [-0.07,-0.07],[0.07,-0.07],[-0.07,0.07],[0.07,0.07] ] as [number,number][]).map(([cx,cz],j) => (
            <mesh key={j} position={[x+cx, 0.175, z+cz]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 3]} />
              <meshLambertMaterial color="#3aad4a" emissive="#1a7a20" emissiveIntensity={0.18} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Cross-path */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[0.14, 0.02, 0.72]} />{mAccent}
      </mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[0.72, 0.02, 0.14]} />{mAccent}
      </mesh>
      {/* Scarecrow post */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.44, 4]} />{mRoof}
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[0.34, 0.04, 0.04]} />{mRoof}
      </mesh>
      {/* Lantern on scarecrow top */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.06, 0.07, 0.06]} />{mGlow}
      </mesh>
      <BuildingLight position={[0, 0.52, 0]} color={c.light} phase={phase} />
    </group>
  );

  // ── Workshop ─────────────────────────────────────────────────────────────────
  if (type === 'workshop') return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.10, 0.66]} />{mAccent}
      </mesh>
      {/* Walls */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.44, 0.58]} />{mWall}
      </mesh>
      {/* Flat roof with slight overhang */}
      <mesh position={[0, 0.57, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.07, 0.66]} />{mRoof}
      </mesh>
      {/* Chimney */}
      <mesh position={[0.22, 0.76, 0.10]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.34, 5]} />{mRoof}
      </mesh>
      {/* Chimney cap */}
      <mesh position={[0.22, 0.945, 0.10]}>
        <cylinderGeometry args={[0.08, 0.06, 0.04, 6]} />{mAccent}
      </mesh>
      {/* Large door */}
      <mesh position={[0, 0.26, 0.298]}>
        <boxGeometry args={[0.22, 0.34, 0.01]} />{mDoor}
      </mesh>
      {/* Side windows */}
      <mesh position={[-0.372, 0.33, 0.12]}>
        <boxGeometry args={[0.01, 0.16, 0.22]} />{mGlass}
      </mesh>
      <mesh position={[-0.372, 0.33, -0.12]}>
        <boxGeometry args={[0.01, 0.14, 0.16]} />{mGlass}
      </mesh>
      <mesh position={[0.372, 0.33, 0.12]}>
        <boxGeometry args={[0.01, 0.16, 0.22]} />{mGlass}
      </mesh>
      {/* Exterior lamp post */}
      <mesh position={[0.30, 0.25, 0.34]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.50, 4]} />{mAccent}
      </mesh>
      <mesh position={[0.30, 0.52, 0.34]}>
        <sphereGeometry args={[0.045, 5, 4]} />{mGlow}
      </mesh>
      <BuildingLight position={[0.30, 0.55, 0.34]} color={c.light} phase={phase} />
    </group>
  );

  // ── Shrine ───────────────────────────────────────────────────────────────────
  return (
    <group>
      {/* Stepped platform — 3 tiers */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.90, 0.08, 0.90]} />{mAccent}
      </mesh>
      <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.06, 0.74]} />{mWall}
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.60, 0.06, 0.60]} />{mWall}
      </mesh>
      {/* Four corner pillars */}
      {([ [-0.22,-0.22],[0.22,-0.22],[-0.22,0.22],[0.22,0.22] ] as [number,number][]).map(([x,z],i) => (
        <mesh key={i} position={[x, 0.44, z]} castShadow>
          <cylinderGeometry args={[0.044, 0.054, 0.54, 6]} />{mAccent}
        </mesh>
      ))}
      {/* Lower roof tier */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.54, 0.50, 0.06, 8]} />{mRoof}
      </mesh>
      <mesh position={[0, 0.68, 0]} castShadow>
        <coneGeometry args={[0.52, 0.16, 8]} />{mRoof}
      </mesh>
      {/* Upper roof tier */}
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.40, 0.36, 0.06, 8]} />{mRoof}
      </mesh>
      <mesh position={[0, 0.83, 0]} castShadow>
        <coneGeometry args={[0.38, 0.20, 8]} />{mRoof}
      </mesh>
      {/* Finial */}
      <mesh position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.05, 6, 5]} />{mGlow}
      </mesh>
      {/* Central altar orb */}
      <mesh position={[0, 0.30, 0]}>
        <sphereGeometry args={[0.075, 8, 7]} />{mGlow}
      </mesh>
      {/* Torii gate in front */}
      <mesh position={[-0.18, 0.29, 0.54]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.58, 5]} />{mRoof}
      </mesh>
      <mesh position={[0.18, 0.29, 0.54]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.58, 5]} />{mRoof}
      </mesh>
      {/* Torii lintel */}
      <mesh position={[0, 0.60, 0.54]} castShadow>
        <boxGeometry args={[0.52, 0.06, 0.06]} />{mRoof}
      </mesh>
      <mesh position={[0, 0.53, 0.54]}>
        <boxGeometry args={[0.42, 0.04, 0.04]} />{mRoof}
      </mesh>
      {/* Side hanging lanterns */}
      {([ [-0.22, 0.22],[0.22, 0.22] ] as [number,number][]).map(([x,z],i) => (
        <mesh key={i} position={[x, 0.57, z]}>
          <boxGeometry args={[0.048, 0.06, 0.048]} />{mGlow}
        </mesh>
      ))}
      {/* Central shrine light */}
      <BuildingLight position={[0, 0.42, 0]} color={c.light} phase={phase} />
      {/* Torii gate lantern */}
      <mesh position={[0, 0.67, 0.54]}>
        <sphereGeometry args={[0.04, 5, 4]} />{mGlow}
      </mesh>
    </group>
  );
};
