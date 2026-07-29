import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DeilandPlanet, getPlanetRadius } from './DeilandPlanet';
import { CelestialBody, BiomeType } from '../../data/celestialBodies';
import { BuildingInstance, BuildingType, BUILD_RECIPES } from './DeilandBuildings';
import {
  TreeInstance, GrowingTree,
  getHarvestYield, STAGE_DURATION,
} from './DeilandTrees';
import { DeilandNPCs } from './DeilandNPCs';
import {
  DeilandFarmsRenderer, FarmPlot,
  FARM_STAGE_DURATION, WATER_SPEED_MULT, WATER_DECAY_RATE,
  FARM_WATER_MAX, FARM_FOOD_YIELD,
} from './DeilandFarms';
import {
  DeilandPlanetSave,
  serializeTree, serializeBuilding, serializeFarm,
  deserializeTree, deserializeBuilding, deserializeFarm,
} from '../../hooks/deilandSave';

type Inventory = { wood: number; stone: number; fruit: number };

type CultureCategory = 'music' | 'art' | 'science';
type Culture = Record<CultureCategory, number>; // invested level per branch (0–5)
/** Cost to advance a culture branch TO level n (index = current level 0–4) */
const CULTURE_INVEST_COSTS = [20, 40, 80, 160, 320] as const;

const CHAR_OFFSET      = 0.15;
const MOVE_SPEED       = 0.55;
const TURN_SPEED       = 1.8;
const DESCENT_DURATION = 3.5;
const ACTION_DURATION  = 0.55;   // seconds for one action swing
const DAY_SPEED        = 1 / 180; // 3-minute full day cycle

// ── Jump & Dash constants ──────────────────────────────────────────────────────
const JUMP_INIT_VEL     = 1.6;  // radial m/s at g=1.0
const JUMP_GRAVITY_MULT = 4.0;  // gravity acceleration coefficient (×body.gravityG)
const DASH_HOLD_TIME    = 0.08; // seconds joystick must stay > DASH_THRESHOLD
const DASH_THRESHOLD    = 0.85; // joystick magnitude to arm dash
const DUST_BURST_DUR    = 0.42; // seconds for landing dust ring

// ── Biome → character outfit colours ──────────────────────────────────────────
function getBiomeCharColors(biome: BiomeType) {
  switch (biome) {
    case 'TEMPERATE': return { body: '#4a8fd4', pants: '#2c5f8a', hat: '#7a3a10', shoe: '#3a2810' };
    case 'OCEAN':     return { body: '#1a6ab0', pants: '#0a3a6a', hat: '#204080', shoe: '#101830' };
    case 'DESERT':    return { body: '#d4a86a', pants: '#8b6530', hat: '#b06820', shoe: '#6a3a10' };
    case 'ICE':       return { body: '#c8e8ff', pants: '#6090c0', hat: '#4070a0', shoe: '#305070' };
    case 'VOLCANIC':  return { body: '#8b3020', pants: '#5a1a00', hat: '#3a0a00', shoe: '#2a0800' };
    case 'TOXIC':     return { body: '#80b020', pants: '#506010', hat: '#406000', shoe: '#283808' };
    case 'AIRLESS':   return { body: '#8a8aa0', pants: '#505060', hat: '#404050', shoe: '#282830' };
    case 'GAS':       return { body: '#8060a0', pants: '#503070', hat: '#302050', shoe: '#201030' };
    case 'METHANE':   return { body: '#c07030', pants: '#804020', hat: '#503010', shoe: '#301808' };
    default:          return { body: '#707080', pants: '#404050', hat: '#303040', shoe: '#202028' };
  }
}

// ── Biome → initial environment values ───────────────────────────────────────
function getBiomeEnvDefaults(biome: BiomeType): { temp: number; co2: number; water: number } {
  switch (biome) {
    case 'TEMPERATE':   return { temp: 22,  co2: 400, water: 60 };
    case 'OCEAN':       return { temp: 18,  co2: 380, water: 90 };
    case 'DESERT':      return { temp: 45,  co2: 450, water: 10 };
    case 'ICE':         return { temp: -25, co2: 300, water: 30 };
    case 'VOLCANIC':    return { temp: 80,  co2: 900, water: 5  };
    case 'TOXIC':       return { temp: 65,  co2: 950, water: 15 };
    case 'AIRLESS':     return { temp: 10,  co2: 100, water: 0  };
    case 'GAS':         return { temp: 30,  co2: 700, water: 40 };
    case 'METHANE':     return { temp: -20, co2: 600, water: 20 };
    case 'FROZEN_ROCK': return { temp: -60, co2: 200, water: 10 };
    default:            return { temp: 20,  co2: 400, water: 50 };
  }
}

// ── Day/night sky helpers ─────────────────────────────────────────────────────
function getBiomeDaySky(biome: BiomeType): string {
  switch (biome) {
    case 'TEMPERATE': return '#5588cc';
    case 'OCEAN':     return '#1840a0';
    case 'DESERT':    return '#e8c080';
    case 'ICE':       return '#a0c8e8';
    case 'VOLCANIC':  return '#200500';
    case 'TOXIC':     return '#604000';
    case 'AIRLESS':   return '#080808';
    case 'GAS':       return '#302050';
    case 'METHANE':   return '#804010';
    default:          return '#080810';
  }
}

interface SkyStop { t: number; sky: THREE.Color; ambInt: number; sunInt: number }

/** Animated sky dome + starfield + dynamic sun/moon lights */
const DeilandSky: React.FC<{
  biome:      BiomeType;
  dayTimeRef: React.MutableRefObject<number>;
}> = ({ biome, dayTimeRef }) => {
  const skyMatRef   = useRef<THREE.MeshBasicMaterial>(null);
  const ambRef      = useRef<THREE.AmbientLight>(null);
  const sunRef      = useRef<THREE.DirectionalLight>(null);
  const moonRef     = useRef<THREE.DirectionalLight>(null);
  const starsMatRef = useRef<THREE.PointsMaterial>(null);

  const bSky = getBiomeDaySky(biome);

  const stops = useMemo<SkyStop[]>(() => [
    { t: 0.00, sky: new THREE.Color('#ff9060'), ambInt: 0.32, sunInt: 0.08 }, // dawn
    { t: 0.10, sky: new THREE.Color(bSky),      ambInt: 0.52, sunInt: 0.80 }, // morning
    { t: 0.38, sky: new THREE.Color(bSky),      ambInt: 0.62, sunInt: 1.10 }, // noon
    { t: 0.52, sky: new THREE.Color('#dd5820'), ambInt: 0.42, sunInt: 0.28 }, // dusk
    { t: 0.62, sky: new THREE.Color('#1a0606'), ambInt: 0.20, sunInt: 0.00 }, // late dusk
    { t: 0.72, sky: new THREE.Color('#050818'), ambInt: 0.13, sunInt: 0.00 }, // night
    { t: 0.90, sky: new THREE.Color('#050818'), ambInt: 0.13, sunInt: 0.00 }, // deep night
    { t: 1.00, sky: new THREE.Color('#ff9060'), ambInt: 0.32, sunInt: 0.08 }, // wrap → dawn
  ], [bSky]);

  // Pre-built star geometry (stable across frames)
  const starGeometry = useMemo(() => {
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const u  = (Math.abs(Math.sin(i * 127.1 + 0.3)) % 1) * 2 - 1;
      const th = Math.acos(Math.max(-1, Math.min(1, u)));
      const ph = (Math.abs(Math.sin(i * 311.7)) % 1) * Math.PI * 2;
      pos[i*3]   = 72 * Math.sin(th) * Math.cos(ph);
      pos[i*3+1] = 72 * Math.cos(th);
      pos[i*3+2] = 72 * Math.sin(th) * Math.sin(ph);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return geo;
  }, []);

  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const t = dayTimeRef.current;

    // Piecewise interpolation between stops
    let lo = stops[0], hi = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].t && t <= stops[i + 1].t) { lo = stops[i]; hi = stops[i + 1]; break; }
    }
    const f = hi.t > lo.t ? (t - lo.t) / (hi.t - lo.t) : 0;

    // Sky dome colour
    if (skyMatRef.current) {
      tmpColor.copy(lo.sky).lerp(hi.sky, f);
      skyMatRef.current.color.copy(tmpColor);
    }

    // Ambient
    if (ambRef.current) ambRef.current.intensity = lo.ambInt + (hi.ambInt - lo.ambInt) * f;

    // Sun arc: t=0 → east horizon (sunX=+20,Y=0), t=0.25 → overhead (X=0,Y=+20),
    //          t=0.5 → west horizon (X=-20,Y=0), t=0.75 → underground (X=0,Y=-20)
    const angle = t * Math.PI * 2;
    const sunX  = Math.cos(angle) * 20;  // cos & sin are orthogonal → true arc
    const sunY  = Math.sin(angle) * 20;
    const sunInt = lo.sunInt + (hi.sunInt - lo.sunInt) * f;
    if (sunRef.current) {
      sunRef.current.position.set(sunX, sunY, 6);
      sunRef.current.intensity = sunInt;
    }

    // Moon (opposite hemisphere, dim blue)
    if (moonRef.current) {
      moonRef.current.position.set(-sunX, -sunY, -6);
      moonRef.current.intensity = Math.max(0, -Math.sin(angle)) * 0.28;
    }

    // Stars: fade in at dusk, fade out at dawn
    let starOp = 0;
    if (t >= 0.72 && t <= 0.90)    starOp = 1.0;
    else if (t > 0.60 && t < 0.72) starOp = (t - 0.60) / 0.12;
    else if (t > 0.90 && t < 1.00) starOp = (1.00 - t) / 0.10;
    if (starsMatRef.current) starsMatRef.current.opacity = starOp * 0.92;
  });

  return (
    <>
      {/* Sky dome */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial ref={skyMatRef} color={bSky} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Starfield */}
      <points geometry={starGeometry} renderOrder={-2}>
        <pointsMaterial ref={starsMatRef} size={0.45} color="#ffffff" transparent opacity={0} sizeAttenuation depthWrite={false} />
      </points>
      {/* Lights */}
      <ambientLight ref={ambRef} intensity={0.52} />
      <directionalLight
        ref={sunRef}
        position={[0, 20, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-15} shadow-camera-right={15}
        shadow-camera-top={15}  shadow-camera-bottom={-15}
      />
      <directionalLight ref={moonRef} color="#405880" intensity={0} position={[0, -20, -6]} />
      <pointLight position={[0, 0, 0]} intensity={0.12} color="#ffffff" />
    </>
  );
};

/** Semi-transparent box preview that follows the character in build mode */
const GhostBuildingWrapper: React.FC<{
  type:    BuildingType;
  posRef:  React.MutableRefObject<THREE.Vector3>;
  quatRef: React.MutableRefObject<THREE.Quaternion>;
}> = ({ type, posRef, quatRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      groupRef.current.quaternion.copy(quatRef.current);
    }
  });
  const ghostSizes: Record<BuildingType, [number, number, number]> = {
    hut:      [0.65, 0.60, 0.55],
    farm:     [0.75, 0.25, 0.75],
    workshop: [0.82, 0.65, 0.66],
    shrine:   [0.92, 0.85, 0.92],
  };
  const [w, h, d] = ghostSizes[type];
  return (
    <group ref={groupRef}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w + 0.06, h + 0.06, d + 0.06]} />
        <meshLambertMaterial color="#60c8ff" transparent opacity={0.38} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ── Landing dust ring ─────────────────────────────────────────────────────────
const DustBurst: React.FC<{
  triggerRef: React.MutableRefObject<boolean>;
  posRef:     React.MutableRefObject<THREE.Vector3>;
  upRef:      React.MutableRefObject<THREE.Vector3>;
}> = ({ triggerRef, posRef, upRef }) => {
  const ringRef  = useRef<THREE.Mesh>(null);
  const timerRef = useRef(0);

  useFrame((_, dt) => {
    if (triggerRef.current) { timerRef.current = DUST_BURST_DUR; triggerRef.current = false; }
    const mesh = ringRef.current;
    if (!mesh) return;
    if (timerRef.current > 0) {
      timerRef.current -= dt;
      const t  = 1 - timerRef.current / DUST_BURST_DUR;
      const s  = 0.06 + t * 0.72;
      const op = Math.max(0, 0.80 * (1 - t * 1.6));
      mesh.position.copy(posRef.current);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), upRef.current.clone().normalize(),
      );
      mesh.scale.set(s, s, s);
      (mesh.material as THREE.MeshBasicMaterial).opacity = op;
      mesh.visible = op > 0.005;
    } else {
      mesh.visible = false;
    }
  });

  return (
    <mesh ref={ringRef} visible={false} renderOrder={1}>
      <ringGeometry args={[0.12, 0.50, 20]} />
      <meshBasicMaterial color="#c8b080" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ── Auto-navigate target ──────────────────────────────────────────────────────
interface AutoMoveTarget { theta: number; phi: number; interact: boolean }

/** Pulsing nav-target ring rendered at the tap destination */
const NavMarker: React.FC<{
  targetRef: React.MutableRefObject<AutoMoveTarget | null>;
  radius: number;
}> = ({ targetRef, radius }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const tgt  = targetRef.current;
    const mesh = ringRef.current;
    if (!mesh) return;
    if (!tgt) { mesh.visible = false; return; }
    const n = new THREE.Vector3(
      Math.sin(tgt.theta) * Math.cos(tgt.phi),
      Math.cos(tgt.theta),
      Math.sin(tgt.theta) * Math.sin(tgt.phi),
    ).normalize();
    mesh.position.copy(n.clone().multiplyScalar(radius + 0.08));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const pulse = 0.80 + 0.20 * Math.sin(clock.elapsedTime * 5.0);
    mesh.scale.set(pulse, 1.0, pulse);
    mesh.visible = true;
  });
  return (
    <mesh ref={ringRef} visible={false} renderOrder={2}>
      <ringGeometry args={[0.14, 0.28, 20]} />
      <meshBasicMaterial color="#50e8ff" transparent opacity={0.82} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

interface DeilandWorldProps {
  body:               CelestialBody;
  joystickRef:        React.MutableRefObject<{ x: number; y: number }>;
  cameraYawRef:       React.MutableRefObject<number>;
  isTpsMode:          boolean;
  jumpRef:            React.MutableRefObject<boolean>;
  // tree system
  plantCallbackRef:   React.MutableRefObject<(() => void) | null>;
  harvestCallbackRef: React.MutableRefObject<((id: string) => void) | null>;
  setInventory:       React.Dispatch<React.SetStateAction<Inventory>>;
  setNearbyHarvestId: (id: string | null) => void;
  // building system
  buildings:               BuildingInstance[];
  setBuildings:            React.Dispatch<React.SetStateAction<BuildingInstance[]>>;
  buildMode:               BuildingType | null;
  confirmBuildCallbackRef: React.MutableRefObject<(() => void) | null>;
  onBuildComplete:         () => void;
  // NPC / culture
  population:   number;
  cultureLevel: number;
  // Context interaction
  cutCallbackRef:        React.MutableRefObject<((id: string) => void) | null>;
  setNearbyYoungTreeId:  (id: string | null) => void;
  // Environment
  envMultiplierRef:  React.MutableRefObject<number>;
  onTreePlanted:     () => void;
  onBuildingPlaced:  () => void;
  // Farming
  seedCallbackRef:        React.MutableRefObject<(() => void) | null>;
  waterCallbackRef:       React.MutableRefObject<((id: string) => void) | null>;
  harvestFarmCallbackRef: React.MutableRefObject<((id: string) => void) | null>;
  setNearbyFarmBuilding:  (v: boolean) => void;
  setNearbyWaterPlotId:   (id: string | null) => void;
  setNearbyHarvestFarmId: (id: string | null) => void;
  setFoodCount:           React.Dispatch<React.SetStateAction<number>>;
  // Auto-navigation
  tapNavRef:     React.MutableRefObject<{ x: number; y: number } | null>;
  setAutoMoving: (v: boolean) => void;
  // Save refs (updated from outer DeilandScene, read by save logic)
  treeDataForSaveRef: React.MutableRefObject<TreeInstance[]>;
  farmDataForSaveRef: React.MutableRefObject<FarmPlot[]>;
  // Initial data from save
  initialTrees: TreeInstance[];
  initialFarms: FarmPlot[];
  /** Planet rendering radius computed from body.diameterKm — varies per planet */
  planetRadius: number;
}

function DeilandWorld({
  body, joystickRef, cameraYawRef, isTpsMode, jumpRef,
  plantCallbackRef, harvestCallbackRef,
  setInventory, setNearbyHarvestId,
  buildings, setBuildings,
  buildMode, confirmBuildCallbackRef, onBuildComplete,
  population, cultureLevel,
  cutCallbackRef, setNearbyYoungTreeId,
  envMultiplierRef, onTreePlanted, onBuildingPlaced,
  seedCallbackRef, waterCallbackRef, harvestFarmCallbackRef,
  setNearbyFarmBuilding, setNearbyWaterPlotId, setNearbyHarvestFarmId,
  setFoodCount,
  tapNavRef, setAutoMoving,
  treeDataForSaveRef, farmDataForSaveRef,
  initialTrees, initialFarms,
  planetRadius,
}: DeilandWorldProps) {
  /** Local alias for brevity — equals getPlanetRadius(body.diameterKm) */
  const R = planetRadius;
  const { camera, gl } = useThree();

  const thetaRef    = useRef(0.35);
  const phiRef      = useRef(0);
  const facingRef   = useRef(0);
  const walkTimeRef = useRef(0);
  const descentRef  = useRef(0);
  const keysRef     = useRef(new Set<string>());
  const charRef     = useRef<THREE.Group>(null);
  // animation extras
  const sprintRef        = useRef(0);   // 0→1 smooth sprint blend
  const actionTimerRef   = useRef(0);   // countdown for action swing (seconds)
  const dayTimeRef       = useRef(0.08); // 0→1 day cycle; start at morning
  // Tree growth system
  const treeDataRef      = useRef<TreeInstance[]>([]);
  const [treeVersion, setTreeVersion] = useState(0); // bump to trigger re-renders
  const nearbyHarvestRef    = useRef<string | null>(null);
  const nearbyYoungTreeRef  = useRef<string | null>(null);
  const plantCounterRef     = useRef(0);
  // Farming
  const farmPlotsRef          = useRef<FarmPlot[]>([]);
  const [farmVersion, setFarmVersion] = useState(0);
  const farmPlotCounterRef    = useRef(0);
  const nearbyFarmBuildingRef  = useRef(false);
  const nearbyWaterPlotIdRef   = useRef<string | null>(null);
  const nearbyHarvestFarmIdRef = useRef<string | null>(null);

  // Jump physics
  const radialOffRef   = useRef(0);               // height above surface (0 = grounded)
  const radialVelRef   = useRef(0);               // radial velocity (+ = rising)
  const isGroundedRef  = useRef(true);
  const spaceWasHeld   = useRef(false);           // for "just pressed" Space detection
  // Dash
  const dashHoldRef    = useRef(0);               // time with jMag > DASH_THRESHOLD
  const isDashingRef   = useRef(false);
  // Landing dust
  const dustTriggerRef    = useRef(false);
  const dustLandingPosRef = useRef(new THREE.Vector3());
  const dustLandingUpRef  = useRef(new THREE.Vector3(0, 1, 0));

  // Auto-navigation
  const autoMoveTargetRef     = useRef<AutoMoveTarget | null>(null);
  const autoInteractPendingRef = useRef(false);

  // Joystick inertia — velocity decays after finger lifts (gives "weight" to movement)
  const joyVelRef = useRef({ x: 0, y: 0 });

  // Ghost-building preview position refs (updated each frame during build mode)
  const ghostPosRef  = useRef(new THREE.Vector3());
  const ghostUpRef   = useRef(new THREE.Vector3(0, 1, 0));
  const ghostQuatRef = useRef(new THREE.Quaternion());

  // ── Restore from save on first mount ────────────────────────────────────────
  useEffect(() => {
    // Extract trailing integer from an ID string, regardless of prefix
    const trailingInt = (id: string) => { const m = id.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0; };

    if (initialTrees.length > 0) {
      treeDataRef.current = initialTrees;
      // Set counter past the highest existing ID to prevent collision on next plant
      plantCounterRef.current = Math.max(0, ...initialTrees.map(t => trailingInt(t.id)));
      setTreeVersion(v => v + 1);
    }
    if (initialFarms.length > 0) {
      farmPlotsRef.current = initialFarms;
      // Farm IDs are "farm-N" (not "farm-plot-N") — use trailingInt to be prefix-agnostic
      farmPlotCounterRef.current = Math.max(0, ...initialFarms.map(f => trailingInt(f.id)));
      setFarmVersion(v => v + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only: initialTrees/initialFarms are stable for this component's lifetime

  // ── Keep parent save refs in sync ────────────────────────────────────────────
  useEffect(() => { treeDataForSaveRef.current = treeDataRef.current; }, [treeVersion, treeDataForSaveRef]);
  useEffect(() => { farmDataForSaveRef.current = farmPlotsRef.current; }, [farmVersion, farmDataForSaveRef]);

  // Register plant / harvest callbacks so the outer HUD can call them
  useEffect(() => {
    plantCallbackRef.current = () => {
      const θ = thetaRef.current, φ = phiRef.current;
      const up = new THREE.Vector3(
        Math.sin(θ) * Math.cos(φ), Math.cos(θ), Math.sin(θ) * Math.sin(φ),
      ).normalize();
      treeDataRef.current = [
        ...treeDataRef.current,
        {
          id:          `tree-${++plantCounterRef.current}`,
          pos:         up.clone().multiplyScalar(R + 0.05),
          up:          up.clone(),
          growthStage: 0,
          growthTimer: 0,
          biome:       body.biome,
          phase:       Math.random() * Math.PI * 2,
        },
      ];
      setTreeVersion(v => v + 1);
      onTreePlanted(); // notify env system
      actionTimerRef.current = ACTION_DURATION; // planting animation
    };

    harvestCallbackRef.current = (id: string) => {
      const tree = treeDataRef.current.find(t => t.id === id);
      if (!tree || tree.growthStage < 4) return;
      treeDataRef.current = treeDataRef.current.filter(t => t.id !== id);
      nearbyHarvestRef.current = null;
      setNearbyHarvestId(null);
      setTreeVersion(v => v + 1);
      const yld = getHarvestYield(tree.biome);
      setInventory(inv => ({ ...inv, wood: inv.wood + yld.wood, fruit: inv.fruit + yld.fruit }));
      actionTimerRef.current = ACTION_DURATION; // harvest swing animation
    };

    // Cut any tree (even young ones) for wood; triggered from context button
    cutCallbackRef.current = (id: string) => {
      const tree = treeDataRef.current.find(t => t.id === id);
      if (!tree) return;
      treeDataRef.current = treeDataRef.current.filter(t => t.id !== id);
      // Clear both proximity refs so buttons disappear immediately
      if (nearbyHarvestRef.current === id) { nearbyHarvestRef.current = null; setNearbyHarvestId(null); }
      if (nearbyYoungTreeRef.current === id) { nearbyYoungTreeRef.current = null; setNearbyYoungTreeId(null); }
      setTreeVersion(v => v + 1);
      // Yield depends on growth stage
      if (tree.growthStage >= 4) {
        const yld = getHarvestYield(tree.biome);
        setInventory(inv => ({ ...inv, wood: inv.wood + yld.wood, fruit: inv.fruit + yld.fruit }));
      } else {
        const woodYield = tree.growthStage >= 2 ? 1 : 0; // saplings give 1 wood; seeds give 0
        if (woodYield > 0) setInventory(inv => ({ ...inv, wood: inv.wood + woodYield }));
      }
      actionTimerRef.current = ACTION_DURATION; // chop animation
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body.biome, setInventory, setNearbyHarvestId]);

  // Register confirm-build callback so the outer HUD button can trigger placement
  useEffect(() => {
    confirmBuildCallbackRef.current = () => {
      if (!buildMode) return;
      const recipe = BUILD_RECIPES[buildMode];
      setBuildings(prev => [
        ...prev,
        {
          id:         `building-${Date.now()}`,
          type:       buildMode,
          pos:        ghostPosRef.current.clone(),
          up:         ghostUpRef.current.clone(),
          buildTimer: 0,
        },
      ]);
      setInventory(inv => ({
        ...inv,
        wood:  inv.wood  - recipe.wood,
        stone: inv.stone - recipe.stone,
      }));
      onBuildComplete();
      onBuildingPlaced(); // notify env system
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildMode, setBuildings, setInventory, onBuildComplete, onBuildingPlaced]);

  // Register farm callbacks
  useEffect(() => {
    seedCallbackRef.current = () => {
      if (!nearbyFarmBuildingRef.current) return;
      const θ = thetaRef.current, φ = phiRef.current;
      const up = new THREE.Vector3(
        Math.sin(θ) * Math.cos(φ), Math.cos(θ), Math.sin(θ) * Math.sin(φ),
      ).normalize();
      farmPlotsRef.current = [
        ...farmPlotsRef.current,
        {
          id:          `farm-${++farmPlotCounterRef.current}`,
          pos:         up.clone().multiplyScalar(R + 0.04),
          up:          up.clone(),
          growthStage: 1,
          growthTimer: 0,
          waterLevel:  0,
          biome:       body.biome,
        },
      ];
      setFarmVersion(v => v + 1);
      actionTimerRef.current = ACTION_DURATION;
    };

    waterCallbackRef.current = (id: string) => {
      const plot = farmPlotsRef.current.find(p => p.id === id);
      if (!plot) return;
      plot.waterLevel = Math.min(FARM_WATER_MAX, plot.waterLevel + 1);
      setFarmVersion(v => v + 1);
      actionTimerRef.current = ACTION_DURATION;
    };

    harvestFarmCallbackRef.current = (id: string) => {
      const plot = farmPlotsRef.current.find(p => p.id === id);
      if (!plot || plot.growthStage < 4) return;
      // Reset plot to bare (ready for re-seeding), don't remove it
      plot.growthStage = 0;
      plot.growthTimer = 0;
      plot.waterLevel  = 0;
      nearbyHarvestFarmIdRef.current = null;
      setNearbyHarvestFarmId(null);
      setFarmVersion(v => v + 1);
      setFoodCount(prev => prev + FARM_FOOD_YIELD);
      actionTimerRef.current = ACTION_DURATION;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body.biome, setFoodCount, setNearbyHarvestFarmId]);

  useEffect(() => {
    camera.up.set(0, 1, 0);
    camera.position.set(0, R * 6, R * 2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const up   = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Desktop click → tap-navigate (mobile taps come via tapNavRef from DeilandHUD)
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      // Only primary mouse button; ignore if a HUD DOM element was clicked
      if (e.button !== 0) return;
      tapNavRef.current = { x: e.clientX, y: e.clientY };
    };
    gl.domElement.addEventListener('pointerdown', handler);
    return () => gl.domElement.removeEventListener('pointerdown', handler);
  }, [gl, tapNavRef]);

  useFrame((state, dt) => {
    const elapsed = state.clock.elapsedTime;

    // Advance day/night cycle
    dayTimeRef.current = (dayTimeRef.current + dt * DAY_SPEED) % 1;

    // Descent animation
    if (descentRef.current < 1) {
      descentRef.current = Math.min(1, descentRef.current + dt / DESCENT_DURATION);
    }
    const d = descentRef.current;
    const ease = d * d * (3 - 2 * d);

    // Camera yaw from keyboard Q / E
    const keys = keysRef.current;
    if (keys.has('KeyQ')) cameraYawRef.current += dt * 1.4;
    if (keys.has('KeyE')) cameraYawRef.current -= dt * 1.4;

    // ── Jump input (HUD button OR Space key, "just-pressed" for Space) ─────────
    const spaceDown = keys.has('Space');
    const spaceJustPressed = spaceDown && !spaceWasHeld.current;
    spaceWasHeld.current = spaceDown;
    if ((jumpRef.current || spaceJustPressed) && isGroundedRef.current && ease > 0.95) {
      const gForJump = Math.max(0.38, Math.min(3.0, (body.gravityG ?? 1.0)));
      radialVelRef.current = JUMP_INIT_VEL / Math.sqrt(gForJump);
      isGroundedRef.current = false;
    }
    jumpRef.current = false; // consume every frame

    // ── Jump physics ─────────────────────────────────────────────────────────────
    if (!isGroundedRef.current) {
      const gForJump = Math.max(0.38, Math.min(3.0, (body.gravityG ?? 1.0)));
      radialVelRef.current -= JUMP_GRAVITY_MULT * gForJump * dt;
      radialOffRef.current += radialVelRef.current * dt;
      if (radialOffRef.current <= 0) {
        radialOffRef.current = 0;
        radialVelRef.current = 0;
        isGroundedRef.current = true;
        // Landing dust — store surface-normal at landing spot
        const θl = thetaRef.current, φl = phiRef.current;
        const upLand = new THREE.Vector3(
          Math.sin(θl) * Math.cos(φl), Math.cos(θl), Math.sin(θl) * Math.sin(φl),
        ).normalize();
        dustLandingPosRef.current.copy(upLand.clone().multiplyScalar(R + CHAR_OFFSET - 0.02));
        dustLandingUpRef.current.copy(upLand);
        dustTriggerRef.current = true;
      }
    }

    // ── Process tap-navigate (screen coords → spherical target) ───────────────
    if (tapNavRef.current !== null) {
      if (ease > 0.95 && isGroundedRef.current) {
        const { x: sx, y: sy } = tapNavRef.current;
        const ndcX =  (sx / window.innerWidth)  * 2 - 1;
        const ndcY = -(sy / window.innerHeight) * 2 + 1;
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        const sphere  = new THREE.Sphere(new THREE.Vector3(0, 0, 0), R + 0.01);
        const hitPt   = new THREE.Vector3();
        if (ray.ray.intersectSphere(sphere, hitPt)) {
          const n      = hitPt.clone().normalize();
          const tTheta = Math.acos(Math.max(-1, Math.min(1, n.y)));
          const tPhi   = Math.atan2(n.z, n.x);
          // detect if tap is near any interactable
          let interact = false;
          const TAP_R  = 1.0;
          treeDataRef.current.forEach(t => { if (hitPt.distanceTo(t.pos) < TAP_R) interact = true; });
          buildings.forEach(b => { if (hitPt.distanceTo(b.pos) < 1.3) interact = true; });
          farmPlotsRef.current.forEach(p => { if (hitPt.distanceTo(p.pos) < TAP_R) interact = true; });
          autoMoveTargetRef.current = { theta: tTheta, phi: tPhi, interact };
          setAutoMoving(true);
        }
      }
      tapNavRef.current = null; // consume regardless
    }

    // Input — joystick inertia (accelerates toward input, decays after release)
    const joy  = joystickRef.current;
    const jMag = Math.sqrt(joy.x * joy.x + joy.y * joy.y);
    if (jMag > 0.01) {
      // Lerp velocity toward joystick target (12 units/s convergence)
      const t = Math.min(1, 12.0 * dt);
      joyVelRef.current.x += (joy.x - joyVelRef.current.x) * t;
      joyVelRef.current.y += (joy.y - joyVelRef.current.y) * t;
    } else {
      // Inertia decay after finger lifts (8 units/s — brief coast feeling)
      const decay = Math.max(0, 1 - 8.0 * dt);
      joyVelRef.current.x *= decay;
      joyVelRef.current.y *= decay;
    }
    let mx = joyVelRef.current.x, my = joyVelRef.current.y;
    if (keys.has('KeyA') || keys.has('ArrowLeft'))  mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp'))    my += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown'))  my -= 1;
    mx = Math.max(-1, Math.min(1, mx));
    my = Math.max(-1, Math.min(1, my));
    const isMoving = (Math.abs(mx) > 0.05 || Math.abs(my) > 0.05) && ease > 0.95;

    // Dash detection — sustained jMag > DASH_THRESHOLD while grounded
    if (jMag >= DASH_THRESHOLD && isGroundedRef.current && ease > 0.95) {
      dashHoldRef.current += dt;
      if (dashHoldRef.current >= DASH_HOLD_TIME) isDashingRef.current = true;
    } else {
      if (jMag < 0.55) { dashHoldRef.current = 0; isDashingRef.current = false; }
    }
    // Also cancel dash on keyboard if no held key
    if (!isMoving && !isDashingRef.current) dashHoldRef.current = 0;

    // Sprint smoothing (fast when |my| > 0.75)
    const wantSprint = Math.abs(my) > 0.75 && isMoving;
    sprintRef.current += (wantSprint ? 1 : -1) * dt * 5;
    sprintRef.current  = Math.max(0, Math.min(1, sprintRef.current));
    const sp = sprintRef.current;

    // Air control — reduced steering and speed while airborne
    const airControl = isGroundedRef.current ? 1.0 : 0.28;

    // ── Cancel auto-nav on joystick input or Escape ────────────────────────
    if (autoMoveTargetRef.current && (jMag > 0.12 || keys.has('Escape'))) {
      autoMoveTargetRef.current = null;
      setAutoMoving(false);
    }

    const isAutoNav = !!autoMoveTargetRef.current && ease > 0.95 && isGroundedRef.current;

    if (isAutoNav && autoMoveTargetRef.current) {
      // ── Auto-nav: steer + move toward target on the sphere surface ────────
      const { theta: tθ, phi: tφ, interact } = autoMoveTargetRef.current;
      const sinT   = Math.max(Math.abs(Math.sin(thetaRef.current)), 0.05);
      const dθ     = tθ - thetaRef.current;
      const rawDφ  = tφ - phiRef.current;
      const dφ     = ((rawDφ + Math.PI * 3) % (Math.PI * 2)) - Math.PI; // normalise to [-π, π]
      const dφSc   = dφ * sinT;
      const dist   = Math.sqrt(dθ * dθ + dφSc * dφSc);

      const ARRIVE_DIST = interact ? 0.10 : 0.045;
      if (dist < ARRIVE_DIST) {
        // Arrived — schedule context-action trigger (proximity refs updated later this frame)
        if (interact) autoInteractPendingRef.current = true;
        autoMoveTargetRef.current = null;
        setAutoMoving(false);
      } else {
        const facing     = Math.atan2(dφSc, dθ);
        facingRef.current = facing;
        const slowFactor  = Math.min(1.0, dist / 0.20);
        const dAngle      = MOVE_SPEED * slowFactor * dt / R;
        thetaRef.current += Math.cos(facing) * dAngle;
        phiRef.current   += Math.sin(facing) * dAngle / sinT;
        thetaRef.current  = Math.max(0.12, Math.min(Math.PI - 0.12, thetaRef.current));
        walkTimeRef.current += dt * slowFactor;
      }
    } else {
      // Character movement (dashing/sprinting applies only when grounded)
      if (ease > 0.95) {
        facingRef.current += mx * TURN_SPEED * dt * airControl;
        if (Math.abs(my) > 0.01) {
          const dashMult  = isDashingRef.current ? 1.8 : 1.0;
          const speedMult = (1 + sp * 0.7) * dashMult * airControl;
          const dAngle = my * MOVE_SPEED * speedMult * dt / R;
          thetaRef.current += Math.cos(facingRef.current) * dAngle;
          phiRef.current   += Math.sin(facingRef.current) * dAngle /
                              Math.max(Math.abs(Math.sin(thetaRef.current)), 0.05);
          thetaRef.current  = Math.max(0.12, Math.min(Math.PI - 0.12, thetaRef.current));
        }
      }
      if (isMoving) walkTimeRef.current += dt * (1 + sp * 0.5); // walk timer also speeds up
    }

    // World positions
    const θ = thetaRef.current, φ = phiRef.current;
    const up = new THREE.Vector3(
      Math.sin(θ) * Math.cos(φ), Math.cos(θ), Math.sin(θ) * Math.sin(φ)
    );
    const charPos = up.clone().multiplyScalar(R + CHAR_OFFSET + radialOffRef.current);

    // Forward direction
    const northT = new THREE.Vector3(
      Math.cos(θ) * Math.cos(φ), -Math.sin(θ), Math.cos(θ) * Math.sin(φ)
    ).normalize();
    const eastT = new THREE.Vector3(-Math.sin(φ), 0, Math.cos(φ)).normalize();
    const fc    = facingRef.current;
    const forward = northT.clone().multiplyScalar(Math.cos(fc))
                    .add(eastT.clone().multiplyScalar(Math.sin(fc))).normalize();

    // Update character mesh
    if (charRef.current) {
      charRef.current.position.copy(charPos);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      const m = new THREE.Matrix4().makeBasis(right, up, forward.clone().negate());
      charRef.current.quaternion.setFromRotationMatrix(m);

      const wt = walkTimeRef.current;

      // ── Walk-cycle parameters (scale up for sprint) ──────────────────────
      const walkFreq = 8 + sp * 4;                 // 8 Hz walk → 12 Hz sprint
      const swingAmp = 0.28 + sp * 0.24;           // 0.28 → 0.52 rad stride
      const bobAmp   = 0.018 + sp * 0.010;         // vertical bounce

      // ── Idle breathing (fades out once walking starts) ───────────────────
      const idleBlend = isMoving ? Math.max(0, 1 - wt * 4) : 1;
      const breath    = Math.sin(elapsed * Math.PI) * 0.005 * idleBlend;

      // ── Bob & limb angles ────────────────────────────────────────────────
      //  Natural cross-body walk: right leg forward → left arm forward, and vice-versa
      const phase = Math.sin(wt * walkFreq);
      const bob   = isMoving ? phase * bobAmp : breath;
      const legR  =  phase * swingAmp;         // right leg: forward on +phase
      const legL  = -phase * swingAmp;         // left  leg: backward on +phase (opposite)
      const armR  = -phase * swingAmp * 0.55;  // right arm: cross-body = opposite to right leg
      const armL  =  phase * swingAmp * 0.55;  // left  arm: same direction as right leg

      // ── Sprint forward-lean on torso ─────────────────────────────────────
      const sprintLean = sp * 0.22;

      // Children layout:
      //   c[0] = torso group   c[1] = head group
      //   c[2] = right leg     c[3] = left leg
      //   c[4] = right arm     c[5] = left arm
      const c = charRef.current.children;
      if (c[0]) {
        c[0].position.y = 0.22 + bob;
        (c[0] as THREE.Group).rotation.x = isMoving ? sprintLean : 0;
        // Breathing: subtle torso scale when idle
        if (!isMoving) {
          const breathScale = 1 + Math.sin(elapsed * Math.PI) * 0.018;
          c[0].scale.set(breathScale, 1, breathScale);
        } else {
          c[0].scale.set(1, 1, 1);
        }
      }
      if (c[1]) {
        c[1].position.y = 0.38 + bob;
        // head follows torso lean slightly (half amplitude)
        (c[1] as THREE.Group).rotation.x = isMoving ? sprintLean * 0.4 : 0;
      }
      if (c[2]) { c[2].position.y = 0.08 + bob; (c[2] as THREE.Group).rotation.x = isMoving ? legR : 0; }
      if (c[3]) { c[3].position.y = 0.08 + bob; (c[3] as THREE.Group).rotation.x = isMoving ? legL : 0; }
      if (c[4]) { c[4].position.y = 0.22 + bob; (c[4] as THREE.Group).rotation.x = isMoving ? armR : 0; }
      if (c[5]) { c[5].position.y = 0.22 + bob; (c[5] as THREE.Group).rotation.x = isMoving ? armL : 0; }

      // ── Jump pose override (airborne only) ───────────────────────────────
      if (!isGroundedRef.current) {
        const airBlend = Math.min(1.0, radialOffRef.current / 0.10);
        // Rising: legs tuck, arms forward-up  /  Falling: legs spread, arms back
        const rising = radialVelRef.current > 0;
        const legAng = rising ? -0.50 * airBlend :  0.30 * airBlend;
        const armAng = rising ?  0.60 * airBlend : -0.35 * airBlend;
        if (c[2]) (c[2] as THREE.Group).rotation.x = legAng;
        if (c[3]) (c[3] as THREE.Group).rotation.x = legAng;
        if (c[4]) (c[4] as THREE.Group).rotation.x = armAng;
        if (c[5]) (c[5] as THREE.Group).rotation.x = armAng;
        if (c[0]) c[0].position.y = 0.22 + radialOffRef.current * 0.04;
      }

      // ── Action animation (right-arm chopping swing) ───────────────────────
      if (actionTimerRef.current > 0) {
        actionTimerRef.current = Math.max(0, actionTimerRef.current - dt);
        const t = 1 - actionTimerRef.current / ACTION_DURATION; // 0 → 1
        const actionSwing = Math.sin(t * Math.PI) * 1.1;        // arc up and back
        if (c[4]) (c[4] as THREE.Group).rotation.x = -actionSwing; // override right arm
      }

      // Fade-in during descent
      charRef.current.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshLambertMaterial;
          mat.transparent = true;
          mat.opacity = Math.min(1, ease * 3 - 1);
        }
      });
    }

    // ── Camera (TPS / top-down) ──────────────────────────────────────────────
    let camSurface: THREE.Vector3;
    let lookSurface: THREE.Vector3;

    if (isTpsMode) {
      // Arm base = behind character, rotated by cameraYaw around planet normal
      const backDir = forward.clone().negate();
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(up, cameraYawRef.current);
      const armHoriz = backDir.clone().applyQuaternion(yawQuat);
      // Elevate 25° upward around the horizontal-arm's right axis
      const armRight = new THREE.Vector3().crossVectors(armHoriz, up).normalize();
      const elevQuat = new THREE.Quaternion().setFromAxisAngle(armRight, -Math.PI * 25 / 180);
      const armDir   = armHoriz.clone().applyQuaternion(elevQuat).normalize();

      const CAM_DIST = 3.0;
      camSurface  = charPos.clone().add(armDir.multiplyScalar(CAM_DIST));
      // Ground clipping — keep camera above planet surface
      if (camSurface.length() < R + 0.55)
        camSurface.setLength(R + 0.55);
      lookSurface = charPos.clone().add(up.clone().multiplyScalar(0.35));
    } else {
      // Top-down overview — directly above character
      camSurface  = charPos.clone().add(up.clone().multiplyScalar(5.5));
      lookSurface = charPos.clone().add(up.clone().multiplyScalar(0.15));
    }

    const camSpace     = new THREE.Vector3(0, R * 6, R * 2);
    const lookSpace    = new THREE.Vector3(0, 0, 0);
    const targetCamPos = new THREE.Vector3().lerpVectors(camSpace, camSurface, ease);
    const targetLook   = new THREE.Vector3().lerpVectors(lookSpace, lookSurface, ease);

    const worldUp  = new THREE.Vector3(0, 1, 0);
    const targetUp = worldUp.clone().lerp(up, ease);
    camera.up.lerp(targetUp.normalize(), 0.08);
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(targetLook);

    // ── Ghost-building position (follows character forward) ────────────────────
    if (buildMode) {
      const ghostSurface = charPos.clone().add(forward.clone().multiplyScalar(1.6));
      const ghostUp = ghostSurface.clone().normalize();
      ghostPosRef.current.copy(ghostUp.clone().multiplyScalar(R + 0.06));
      ghostUpRef.current.copy(ghostUp);
      ghostQuatRef.current.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ghostUp);
    }

    // ── Tree growth ────────────────────────────────────────────────────────────
    const envMult = envMultiplierRef.current;
    let treeChanged = false;
    treeDataRef.current.forEach(tree => {
      if (tree.growthStage < 4) {
        tree.growthTimer += dt * envMult;
        if (tree.growthTimer >= STAGE_DURATION) {
          tree.growthTimer -= STAGE_DURATION;
          tree.growthStage = Math.min(4, tree.growthStage + 1);
          treeChanged = true;
        }
      }
    });
    if (treeChanged) setTreeVersion(v => v + 1);

    // ── Nearby harvestable-tree detection ──────────────────────────────────────
    let nearestId: string | null = null;
    let nearestDist = 0.85; // world-unit proximity threshold
    treeDataRef.current.forEach(tree => {
      if (tree.growthStage >= 4) {
        const dist = charPos.distanceTo(tree.pos);
        if (dist < nearestDist) { nearestId = tree.id; nearestDist = dist; }
      }
    });
    if (nearestId !== nearbyHarvestRef.current) {
      nearbyHarvestRef.current = nearestId;
      setNearbyHarvestId(nearestId);
    }

    // ── Nearby young-tree detection (stage 1–3 → can cut for wood) ────────
    const INTERACTION_RADIUS = 1.5;
    let nearYoungId: string | null = null;
    let nearYoungDist = INTERACTION_RADIUS;
    treeDataRef.current.forEach(tree => {
      if (tree.growthStage >= 1 && tree.growthStage < 4) {
        const dist = charPos.distanceTo(tree.pos);
        if (dist < nearYoungDist) { nearYoungId = tree.id; nearYoungDist = dist; }
      }
    });
    if (nearYoungId !== nearbyYoungTreeRef.current) {
      nearbyYoungTreeRef.current = nearYoungId;
      setNearbyYoungTreeId(nearYoungId);
    }

    // ── Farm growth ────────────────────────────────────────────────────────
    let farmChanged = false;
    farmPlotsRef.current.forEach(plot => {
      if (plot.growthStage >= 1 && plot.growthStage < 4) {
        if (plot.waterLevel > 0) {
          plot.waterLevel = Math.max(0, plot.waterLevel - WATER_DECAY_RATE * dt);
        }
        const speed = (plot.waterLevel > 0.05 ? WATER_SPEED_MULT : 1.0) * envMult;
        plot.growthTimer += dt * speed;
        if (plot.growthTimer >= FARM_STAGE_DURATION) {
          plot.growthTimer -= FARM_STAGE_DURATION;
          plot.growthStage = Math.min(4, plot.growthStage + 1);
          farmChanged = true;
        }
      }
    });
    if (farmChanged) setFarmVersion(v => v + 1);

    // ── Farm proximity ─────────────────────────────────────────────────────
    let nearFarm = false;
    buildings.forEach(b => {
      if (b.type === 'farm' && charPos.distanceTo(b.pos) < 1.8) nearFarm = true;
    });
    if (nearFarm !== nearbyFarmBuildingRef.current) {
      nearbyFarmBuildingRef.current = nearFarm;
      setNearbyFarmBuilding(nearFarm);
    }

    let nearWaterId: string | null = null;
    let nearWaterDist = 1.1;
    let nearHarvestFarmId: string | null = null;
    let nearHarvestFarmDist = 1.1;
    farmPlotsRef.current.forEach(plot => {
      const dist = charPos.distanceTo(plot.pos);
      if (plot.growthStage >= 1 && plot.growthStage < 4 &&
          plot.waterLevel < FARM_WATER_MAX - 0.1 && dist < nearWaterDist) {
        nearWaterId = plot.id; nearWaterDist = dist;
      }
      if (plot.growthStage >= 4 && dist < nearHarvestFarmDist) {
        nearHarvestFarmId = plot.id; nearHarvestFarmDist = dist;
      }
    });
    if (nearWaterId !== nearbyWaterPlotIdRef.current) {
      nearbyWaterPlotIdRef.current = nearWaterId;
      setNearbyWaterPlotId(nearWaterId);
    }
    if (nearHarvestFarmId !== nearbyHarvestFarmIdRef.current) {
      nearbyHarvestFarmIdRef.current = nearHarvestFarmId;
      setNearbyHarvestFarmId(nearHarvestFarmId);
    }

    // ── Auto-interact on arrival (runs after proximity refs are updated) ────
    if (autoInteractPendingRef.current) {
      autoInteractPendingRef.current = false;
      if (nearbyHarvestRef.current)
        harvestCallbackRef.current?.(nearbyHarvestRef.current);
      else if (nearbyYoungTreeRef.current)
        cutCallbackRef.current?.(nearbyYoungTreeRef.current);
      else if (nearbyHarvestFarmIdRef.current)
        harvestFarmCallbackRef.current?.(nearbyHarvestFarmIdRef.current);
      else if (nearbyWaterPlotIdRef.current)
        waterCallbackRef.current?.(nearbyWaterPlotIdRef.current);
      else if (nearbyFarmBuildingRef.current)
        seedCallbackRef.current?.();
    }
  });

  const colors = getBiomeCharColors(body.biome);
  const skin  = <meshLambertMaterial color="#f4c4a1" />;
  const body_ = <meshLambertMaterial color={colors.body} />;
  const pants = <meshLambertMaterial color={colors.pants} />;
  const hat_  = <meshLambertMaterial color={colors.hat} />;
  const shoe_ = <meshLambertMaterial color={colors.shoe} />;
  const eye_  = <meshLambertMaterial color="#1a1a2e" />;
  const cheek = <meshLambertMaterial color="#e88080" transparent opacity={0.75} />;
  const white = <meshLambertMaterial color="#ffffff" />;

  return (
    <>
      <DeilandSky biome={body.biome} dayTimeRef={dayTimeRef} />

      <DeilandPlanet body={body} seed={body.id.charCodeAt(0) + body.id.length + 1} buildings={buildings} cultureLevel={cultureLevel} radius={R} />

      {/* ── Auto-nav target ring ──────────────────────────────────── */}
      <NavMarker targetRef={autoMoveTargetRef} radius={R} />

      {/* ── NPC citizens ─────────────────────────────────────────── */}
      <DeilandNPCs population={population} biome={body.biome} />

      {/* ── Build-mode ghost ──────────────────────────────────────── */}
      {buildMode && (
        <GhostBuildingWrapper type={buildMode} posRef={ghostPosRef} quatRef={ghostQuatRef} />
      )}

      {/* ── Farm plots ───────────────────────────────────────────── */}
      <DeilandFarmsRenderer farmPlotsRef={farmPlotsRef} version={farmVersion} />

      {/* ── Growing trees */}
      {treeDataRef.current.map(tree => {
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), tree.up,
        );
        return (
          <group key={tree.id} position={tree.pos} quaternion={q}>
            <GrowingTree instance={tree} />
          </group>
        );
      })}

      {/* ── Character ─────────────────────────────────────────── */}
      <group ref={charRef}>

        {/* c[0] Torso */}
        <group position={[0, 0.22, 0]}>
          {/* torso capsule */}
          <mesh castShadow>{body_}<capsuleGeometry args={[0.055, 0.07, 4, 8]} /></mesh>
          {/* collar band */}
          <mesh position={[0, 0.06, 0]}>{white}<torusGeometry args={[0.046, 0.009, 6, 14]} /></mesh>
        </group>

        {/* c[1] Head group (eyes, cheeks, hat all live inside so they bob together) */}
        <group position={[0, 0.38, 0]}>
          {/* head sphere */}
          <mesh castShadow>{skin}<sphereGeometry args={[0.058, 14, 12]} /></mesh>

          {/* right eye white */}
          <mesh position={[0.024, 0.006, 0.051]}>{white}<sphereGeometry args={[0.013, 7, 7]} /></mesh>
          {/* left eye white */}
          <mesh position={[-0.024, 0.006, 0.051]}>{white}<sphereGeometry args={[0.013, 7, 7]} /></mesh>
          {/* right iris */}
          <mesh position={[0.024, 0.006, 0.062]}>{eye_}<sphereGeometry args={[0.009, 6, 6]} /></mesh>
          {/* left iris */}
          <mesh position={[-0.024, 0.006, 0.062]}>{eye_}<sphereGeometry args={[0.009, 6, 6]} /></mesh>
          {/* right eye shine */}
          <mesh position={[0.027, 0.010, 0.065]}>{white}<sphereGeometry args={[0.003, 4, 4]} /></mesh>
          {/* left eye shine */}
          <mesh position={[-0.021, 0.010, 0.065]}>{white}<sphereGeometry args={[0.003, 4, 4]} /></mesh>

          {/* right cheek blush */}
          <mesh position={[0.044, -0.010, 0.040]}>{cheek}<sphereGeometry args={[0.016, 7, 6]} /></mesh>
          {/* left cheek blush */}
          <mesh position={[-0.044, -0.010, 0.040]}>{cheek}<sphereGeometry args={[0.016, 7, 6]} /></mesh>

          {/* hat cylinder */}
          <mesh position={[0, 0.082, 0]} castShadow>{hat_}<cylinderGeometry args={[0.042, 0.046, 0.068, 7]} /></mesh>
          {/* hat brim */}
          <mesh position={[0, 0.050, 0]}>{hat_}<cylinderGeometry args={[0.072, 0.068, 0.012, 10]} /></mesh>
          {/* hat band */}
          <mesh position={[0, 0.054, 0]}>{white}<torusGeometry args={[0.047, 0.006, 5, 12]} /></mesh>
        </group>

        {/* c[2] Right leg */}
        <group position={[0.028, 0.08, 0]}>
          <mesh castShadow>{pants}<capsuleGeometry args={[0.022, 0.058, 4, 7]} /></mesh>
          {/* shoe */}
          <mesh position={[0, -0.048, 0.010]} castShadow>{shoe_}<capsuleGeometry args={[0.019, 0.022, 4, 6]} /></mesh>
        </group>

        {/* c[3] Left leg */}
        <group position={[-0.028, 0.08, 0]}>
          <mesh castShadow>{pants}<capsuleGeometry args={[0.022, 0.058, 4, 7]} /></mesh>
          {/* shoe */}
          <mesh position={[0, -0.048, 0.010]} castShadow>{shoe_}<capsuleGeometry args={[0.019, 0.022, 4, 6]} /></mesh>
        </group>

        {/* c[4] Right arm */}
        <group position={[0.098, 0.22, 0]}>
          <mesh castShadow>{body_}<capsuleGeometry args={[0.019, 0.068, 4, 6]} /></mesh>
          {/* hand */}
          <mesh position={[0, -0.052, 0]}>{skin}<sphereGeometry args={[0.02, 7, 6]} /></mesh>
        </group>

        {/* c[5] Left arm */}
        <group position={[-0.098, 0.22, 0]}>
          <mesh castShadow>{body_}<capsuleGeometry args={[0.019, 0.068, 4, 6]} /></mesh>
          {/* hand */}
          <mesh position={[0, -0.052, 0]}>{skin}<sphereGeometry args={[0.02, 7, 6]} /></mesh>
        </group>

      </group>
      {/* ── Landing dust burst ───────────────────────────────────── */}
      <DustBurst triggerRef={dustTriggerRef} posRef={dustLandingPosRef} upRef={dustLandingUpRef} />

      {/* ────────────────────────────────────────────────────────── */}
    </>
  );
}

// ── Environment gauge HUD panel ───────────────────────────────────────────────
const EnvGauges: React.FC<{
  temp: number; co2: number; water: number; isGood: boolean;
}> = ({ temp, co2, water, isGood }) => {
  // Normalize for bar rendering
  const tempNorm  = Math.max(0, Math.min(1, (temp + 80) / 180));   // -80 → +100 range
  const co2Norm   = Math.max(0, Math.min(1, co2 / 1000));          // 0 → 1000 ppm
  const waterNorm = Math.max(0, Math.min(1, water / 100));

  const tempColor  = temp > 50 ? '#ff5020' : temp < -40 ? '#60c8ff' : '#60d860';
  const co2Color   = co2 > 700 ? '#ff6030' : co2 > 450 ? '#f0c840' : '#60d860';
  const waterColor = water < 10 ? '#e08020' : '#40a8ff';

  const isTempWarn = temp > 50 || temp < -50;
  const isCO2Warn  = co2 > 700;

  return (
    <div style={{
      position: 'absolute', top: 76, left: 12, zIndex: 10,
      background: 'rgba(0,0,0,0.55)', borderRadius: 8,
      padding: '6px 12px', color: '#fff', fontFamily: 'sans-serif',
      fontSize: 11, minWidth: 148, userSelect: 'none', pointerEvents: 'none',
    }}>
      {/* Good-env bonus indicator */}
      {isGood && (
        <div style={{ color: '#7eff90', fontSize: 10, marginBottom: 3, letterSpacing: 0.5 }}>
          🌿 環境良好 成長速度 ×1.5
        </div>
      )}
      {/* Temperature */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <span style={{ width: 14 }}>🌡️</span>
        <div style={{ flex: 1, background: '#333', borderRadius: 2, height: 5, overflow: 'hidden' }}>
          <div style={{ background: tempColor, height: '100%', width: `${Math.round(tempNorm * 100)}%` }} />
        </div>
        <span style={{ width: 44, textAlign: 'right', color: isTempWarn ? '#ff7040' : '#ccc' }}>
          {temp > 0 ? '+' : ''}{Math.round(temp)}℃{isTempWarn ? ' ⚠' : ''}
        </span>
      </div>
      {/* CO2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <span style={{ width: 14 }}>🌿</span>
        <div style={{ flex: 1, background: '#333', borderRadius: 2, height: 5, overflow: 'hidden' }}>
          <div style={{ background: co2Color, height: '100%', width: `${Math.round(co2Norm * 100)}%` }} />
        </div>
        <span style={{ width: 44, textAlign: 'right', color: isCO2Warn ? '#ff9040' : '#ccc' }}>
          {Math.round(co2)}ppm{isCO2Warn ? ' ⚠' : ''}
        </span>
      </div>
      {/* Water */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 14 }}>💧</span>
        <div style={{ flex: 1, background: '#333', borderRadius: 2, height: 5, overflow: 'hidden' }}>
          <div style={{ background: waterColor, height: '100%', width: `${Math.round(waterNorm * 100)}%` }} />
        </div>
        <span style={{ width: 44, textAlign: 'right', color: '#ccc' }}>{Math.round(water)}%</span>
      </div>
    </div>
  );
};

export const DeilandScene: React.FC<{
  body:            CelestialBody;
  joystickRef:     React.MutableRefObject<{ x: number; y: number }>;
  cameraYawRef:    React.MutableRefObject<number>;
  jumpRef:         React.MutableRefObject<boolean>;
  tapNavRef:       React.MutableRefObject<{ x: number; y: number } | null>;
  onStatsUpdate?:  (civLevel: number, foodCount: number, scienceLevel: number) => void;
  initialSave?:    DeilandPlanetSave;
  onSaveDeiland?:  (save: DeilandPlanetSave) => void;
}> = ({ body, joystickRef, cameraYawRef, jumpRef, tapNavRef, onStatsUpdate, initialSave, onSaveDeiland }) => {
  const [isTpsMode, setIsTpsMode] = useState(true);
  const [isAutoMoving, setIsAutoMoving] = useState(false);
  const setAutoMoving = useCallback((v: boolean) => setIsAutoMoving(v), []);

  // ── Initialise from save (lazy initialiser runs once on mount) ───────────────
  const [inventory, setInventory] = useState<Inventory>(() =>
    initialSave?.inventory ?? { wood: 0, stone: 5, fruit: 0 });
  const [buildings, setBuildings] = useState<BuildingInstance[]>(() =>
    initialSave?.buildings.map(deserializeBuilding) ?? []);
  const [buildMode, setBuildMode]             = useState<BuildingType | null>(null);
  const [buildMenuOpen, setBuildMenuOpen]     = useState(false);
  const [stoneCooldown, setStoneCooldown]     = useState(0);
  const [nearbyHarvestId, setNearbyHarvestId]         = useState<string | null>(null);
  const [nearbyYoungTreeId, setNearbyYoungTreeId]     = useState<string | null>(null);

  // Farming
  const [foodCount, setFoodCount] = useState(() => initialSave?.foodCount ?? 0);
  const [nearbyFarmBuilding, setNearbyFarmBuilding]       = useState(false);
  const [nearbyWaterPlotId, setNearbyWaterPlotId]         = useState<string | null>(null);
  const [nearbyHarvestFarmId, setNearbyHarvestFarmId]     = useState<string | null>(null);

  // Culture system
  const [culturePoints, setCulturePoints] = useState(() => initialSave?.culturePoints ?? 0);
  const [culture, setCulture] = useState<Culture>(() =>
    initialSave?.culture ?? { music: 0, art: 0, science: 0 });
  const [culturePanelOpen, setCulturePanelOpen] = useState(false);

  // ── Save infrastructure ──────────────────────────────────────────────────────
  // Refs that DeilandWorld keeps in sync so we can read them during save
  const treeDataForSaveRef = useRef<TreeInstance[]>([]);
  const farmDataForSaveRef = useRef<FarmPlot[]>([]);
  // Always-current snapshot of React state (safe to read in cleanup/interval)
  const latestValuesRef = useRef({ buildings, inventory, foodCount, culturePoints, culture });
  useEffect(() => {
    latestValuesRef.current = { buildings, inventory, foodCount, culturePoints, culture };
  }); // no deps — runs every render to keep ref fresh
  const onSaveDeilandRef = useRef(onSaveDeiland);
  useEffect(() => { onSaveDeilandRef.current = onSaveDeiland; });

  const CIV_STEPS_SAVE = [0, 10, 30, 60, 100, 150] as const;
  const performSave = useCallback(() => {
    const cb = onSaveDeilandRef.current;
    if (!cb) return;
    const { buildings: bldgs, inventory: inv, foodCount: fc, culturePoints: cp, culture: cul }
      = latestValuesRef.current;
    const trees = treeDataForSaveRef.current.map(serializeTree);
    const farms = farmDataForSaveRef.current.map(serializeFarm);
    const civPts = bldgs.reduce((s, b) => s + BUILD_RECIPES[b.type].civPoints, 0);
    const civLevelVal = Math.max(1, CIV_STEPS_SAVE.filter(t => civPts >= t).length);
    cb({
      bodyId:        body.id,
      trees, farms,
      buildings:     bldgs.map(serializeBuilding),
      inventory:     inv,
      foodCount:     fc,
      culturePoints: cp,
      culture:       cul,
      civLevel:      civLevelVal,
      treeCount:     trees.length,
    });
  }, [body.id]); // body.id is stable for this component's lifetime

  // Autosave every 30 s + save on unmount
  useEffect(() => {
    const timer = setInterval(performSave, 30_000);
    return () => { clearInterval(timer); performSave(); };
  }, [performSave]);

  // Memoised initial data for DeilandWorld (avoids re-creating Vector3 on each outer render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialTrees = useMemo(() => initialSave?.trees.map(deserializeTree) ?? [], []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialFarms = useMemo(() => initialSave?.farms.map(deserializeFarm) ?? [], []);

  // Planet-specific rendering radius — Earth=4 units, smaller bodies proportionally less
  const planetRadius = useMemo(() => getPlanetRadius(body.diameterKm), [body.diameterKm]);

  // Derived
  const populationCap = 20 + Math.floor(foodCount / 5); // food extends cap beyond 20
  const population    = Math.min(buildings.length * 2, populationCap, 30);
  const cultureLevel  = culture.music + culture.art + culture.science;

  // Environment indicators (derived from biome, mutated by player actions)
  const envDefaults = useMemo(() => getBiomeEnvDefaults(body.biome), [body.biome]);
  const [envTemp,  setEnvTemp]  = useState(envDefaults.temp);
  const [envCO2,   setEnvCO2]   = useState(envDefaults.co2);
  const [envWater, setEnvWater] = useState(envDefaults.water);

  // Derived: good environment → growth speed ×1.5
  const envIsGood = envCO2 < 450 && envWater >= 25 && envWater <= 85;
  const envMultiplierRef = useRef(envIsGood ? 1.5 : 1.0);
  useEffect(() => { envMultiplierRef.current = envIsGood ? 1.5 : 1.0; }, [envIsGood]);

  const onTreePlanted = useCallback(() => {
    setEnvCO2(v => Math.max(0, v - 0.5));
    setEnvWater(v => Math.min(100, v + 0.3));
  }, []);

  const onBuildingPlaced = useCallback(() => {
    setEnvTemp(v => v + 0.3);
    setEnvCO2(v => v + 1.2);
  }, []);

  const plantCallbackRef        = useRef<(() => void) | null>(null);
  const harvestCallbackRef      = useRef<((id: string) => void) | null>(null);
  const cutCallbackRef          = useRef<((id: string) => void) | null>(null);
  const confirmBuildCallbackRef = useRef<(() => void) | null>(null);
  const seedCallbackRef         = useRef<(() => void) | null>(null);
  const waterCallbackRef        = useRef<((id: string) => void) | null>(null);
  const harvestFarmCallbackRef  = useRef<((id: string) => void) | null>(null);

  // Civilisation gauge
  const civPoints = buildings.reduce((s, b) => s + BUILD_RECIPES[b.type].civPoints, 0);
  const CIV_STEPS = [0, 10, 30, 60, 100, 150] as const;
  const civLevel  = Math.max(1, CIV_STEPS.filter(t => civPoints >= t).length);
  const prevPts   = CIV_STEPS[civLevel - 1] ?? 0;
  const nextPts   = civLevel < CIV_STEPS.length ? CIV_STEPS[civLevel] : prevPts + 50;
  const civBar    = Math.min(1, (civPoints - prevPts) / Math.max(1, nextPts - prevPts));

  // Report stats to parent so the shooter can use them as bonuses
  useEffect(() => {
    onStatsUpdate?.(civLevel, foodCount, culture.science);
  }, [civLevel, foodCount, culture.science, onStatsUpdate]);

  // Culture point accumulation — population/2 pts/sec when citizens exist
  useEffect(() => {
    if (population <= 0) return;
    const rate = Math.max(1, Math.floor(population / 2));
    const timer = setInterval(() => setCulturePoints(p => p + rate), 1000);
    return () => clearInterval(timer);
  }, [population]);

  // Stone-gathering cooldown countdown
  useEffect(() => {
    if (stoneCooldown <= 0) return;
    const t = setTimeout(() => setStoneCooldown(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [stoneCooldown]);

  const handleGatherStone = () => {
    if (stoneCooldown > 0) return;
    setInventory(inv => ({ ...inv, stone: inv.stone + 3 }));
    setStoneCooldown(8);
  };

  const investCulture = (cat: CultureCategory) => {
    const level = culture[cat];
    if (level >= 5) return;
    const cost = CULTURE_INVEST_COSTS[level];
    if (culturePoints < cost) return;
    setCulturePoints(p => p - cost);
    setCulture(prev => ({ ...prev, [cat]: prev[cat] + 1 }));
  };

  const CULTURE_CATS: Array<{ key: CultureCategory; label: string; emoji: string }> = [
    { key: 'music',   label: '音楽', emoji: '🎵' },
    { key: 'art',     label: '芸術', emoji: '🎨' },
    { key: 'science', label: '科学', emoji: '🔬' },
  ];

  const buildLabels: Record<BuildingType, string> = {
    hut: '🏠 小屋', farm: '🌾 農地', workshop: '⚒️ 工房', shrine: '⛩️ 祠',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        camera={{ fov: 55, near: 0.05, far: 300, position: [0, planetRadius * 6, planetRadius * 2] }}
        gl={{ antialias: true }}
        style={{ width: '100%', height: '100%', background: '#050510' }}
      >
        <DeilandWorld
          body={body} joystickRef={joystickRef}
          cameraYawRef={cameraYawRef} isTpsMode={isTpsMode} jumpRef={jumpRef}
          tapNavRef={tapNavRef} setAutoMoving={setAutoMoving}
          plantCallbackRef={plantCallbackRef}
          harvestCallbackRef={harvestCallbackRef}
          cutCallbackRef={cutCallbackRef}
          confirmBuildCallbackRef={confirmBuildCallbackRef}
          setInventory={setInventory}
          setNearbyHarvestId={setNearbyHarvestId}
          setNearbyYoungTreeId={setNearbyYoungTreeId}
          buildings={buildings} setBuildings={setBuildings}
          buildMode={buildMode}
          onBuildComplete={() => setBuildMode(null)}
          population={population}
          cultureLevel={cultureLevel}
          envMultiplierRef={envMultiplierRef}
          onTreePlanted={onTreePlanted}
          onBuildingPlaced={onBuildingPlaced}
          seedCallbackRef={seedCallbackRef}
          waterCallbackRef={waterCallbackRef}
          harvestFarmCallbackRef={harvestFarmCallbackRef}
          setNearbyFarmBuilding={setNearbyFarmBuilding}
          setNearbyWaterPlotId={setNearbyWaterPlotId}
          setNearbyHarvestFarmId={setNearbyHarvestFarmId}
          setFoodCount={setFoodCount}
          treeDataForSaveRef={treeDataForSaveRef}
          farmDataForSaveRef={farmDataForSaveRef}
          initialTrees={initialTrees}
          initialFarms={initialFarms}
          planetRadius={planetRadius}
        />
      </Canvas>

      {/* ── Auto-nav status banner ───────────────────────────────── */}
      {isAutoMoving && (
        <div
          style={{
            position: 'absolute', bottom: 160, left: '50%', transform: 'translateX(-50%)',
            zIndex: 15, pointerEvents: 'auto', cursor: 'pointer',
            background: 'rgba(0,0,0,0.68)', borderRadius: 20,
            padding: '6px 16px', color: '#80e8ff',
            fontFamily: 'sans-serif', fontSize: 13, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 0 10px rgba(80,200,255,0.35)',
            border: '1px solid rgba(80,200,255,0.30)',
          }}
          onClick={() => setIsAutoMoving(false)}
        >
          <span style={{ animation: 'pulse 1s infinite' }}>🚶</span>
          移動中… タップでキャンセル
        </div>
      )}

      {/* ── Civ gauge (top-left) ─────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        background: 'rgba(0,0,0,0.55)', borderRadius: 8,
        padding: '6px 12px', color: '#fff', fontFamily: 'sans-serif',
        fontSize: 13, minWidth: 128, userSelect: 'none', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 11, color: '#ccc', marginBottom: 2 }}>文明 Lv.{civLevel}</div>
        <div style={{ background: '#333', borderRadius: 3, height: 6, overflow: 'hidden' }}>
          <div style={{ background: '#f0c840', height: '100%', width: `${Math.round(civBar * 100)}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
          {civPoints} pt ｜ 人口 {population}人
        </div>
      </div>

      {/* ── Inventory HUD (top-right) ────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(0,0,0,0.55)', borderRadius: 8,
        padding: '6px 14px', color: '#fff', fontFamily: 'sans-serif',
        fontSize: 14, display: 'flex', gap: 12,
        userSelect: 'none', pointerEvents: 'none',
      }}>
        <span>🪵 {inventory.wood}</span>
        <span>🪨 {inventory.stone}</span>
        <span>🍎 {inventory.fruit}</span>
        <span>🍞 {foodCount}</span>
      </div>

      {/* ── Environment gauges (below civ gauge, top-left) ──────── */}
      <EnvGauges temp={envTemp} co2={envCO2} water={envWater} isGood={envIsGood} />

      {/* ── Extreme-temperature overlay ───────────────────────────── */}
      {(envTemp > 50 || envTemp < -50) && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
          background: envTemp > 50
            ? 'rgba(200,50,0,0.12)'
            : 'rgba(50,120,210,0.14)',
          mixBlendMode: 'overlay',
        }} />
      )}

      {/* ── Culture panel ────────────────────────────────────────── */}
      {culturePanelOpen && (
        <div style={{
          position: 'absolute', top: 76, left: 12, zIndex: 20,
          background: 'rgba(8,10,28,0.93)', borderRadius: 10,
          border: '1px solid #4050a0', padding: '10px 14px',
          color: '#fff', fontFamily: 'sans-serif', fontSize: 13, minWidth: 210,
        }}>
          <div style={{ fontSize: 12, color: '#aac0ff', marginBottom: 8 }}>
            🎭 文化ポイント: <b>{culturePoints}</b> pt
            {population > 0 && (
              <span style={{ color: '#7890aa', marginLeft: 6 }}>
                (+{Math.max(1, Math.floor(population / 2))}/s)
              </span>
            )}
          </div>
          {CULTURE_CATS.map(({ key, label, emoji }) => {
            const lv   = culture[key];
            const cost = lv < 5 ? CULTURE_INVEST_COSTS[lv] : null;
            const canI = cost !== null && culturePoints >= cost;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <span style={{ flex: 1 }}>{label} Lv.{lv}</span>
                <span style={{ fontSize: 10, color: '#dda', letterSpacing: 1 }}>
                  {'★'.repeat(lv)}{'☆'.repeat(5 - lv)}
                </span>
                <button
                  disabled={!canI}
                  onClick={() => investCulture(key)}
                  style={{
                    background:   canI ? 'rgba(60,80,200,0.9)' : 'rgba(35,35,60,0.6)',
                    color:        canI ? '#fff' : '#666',
                    border:       `1px solid ${canI ? '#6080e0' : '#444'}`,
                    borderRadius: 6, padding: '3px 8px', fontSize: 11,
                    cursor:       canI ? 'pointer' : 'not-allowed',
                    fontFamily:   'sans-serif',
                  }}
                >
                  {cost !== null ? `↑ ${cost}pt` : '✓MAX'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Build menu (pops above action row) ───────────────────── */}
      {buildMenuOpen && !buildMode && (
        <div style={{
          position: 'absolute', bottom: 150, left: '50%',
          transform: 'translateX(-50%)', zIndex: 20,
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          maxWidth: 400,
        }}>
          {(['hut', 'farm', 'workshop', 'shrine'] as BuildingType[]).map(type => {
            const r = BUILD_RECIPES[type];
            const canAfford = inventory.wood >= r.wood && inventory.stone >= r.stone;
            return (
              <button key={type}
                disabled={!canAfford}
                onClick={() => { setBuildMode(type); setBuildMenuOpen(false); }}
                style={{
                  background:   canAfford ? 'rgba(30,60,20,0.93)' : 'rgba(35,35,35,0.72)',
                  color:        canAfford ? '#fff' : '#777',
                  border:       `1px solid ${canAfford ? '#6abb5a' : '#555'}`,
                  borderRadius: 10, padding: '8px 12px', fontSize: 13,
                  cursor:       canAfford ? 'pointer' : 'not-allowed',
                  fontFamily:   'sans-serif', textAlign: 'center', minWidth: 76,
                }}
              >
                <div>{buildLabels[type]}</div>
                {r.wood  > 0 && <div style={{ fontSize: 11 }}>🪵 {r.wood}</div>}
                {r.stone > 0 && <div style={{ fontSize: 11 }}>🪨 {r.stone}</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Build mode hint (centre of screen) ───────────────────── */}
      {buildMode && (
        <div style={{
          position: 'absolute', top: '46%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.52)', color: '#90d8ff',
          fontFamily: 'sans-serif', fontSize: 14,
          padding: '7px 18px', borderRadius: 8, zIndex: 10,
          pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap',
        }}>
          {buildLabels[buildMode]} — 設置場所に移動して「確定」
        </div>
      )}

      {/* ── Context action layer ──────────────────────────────────── */}
      {(() => {
        // Determine highest-priority context action
        type CtxAction = { emoji: string; label: string; bg: string; border: string; glow: string; onClick: () => void };
        let ctx: CtxAction;
        if (nearbyHarvestId) {
          ctx = { emoji: '🍎', label: '収穫', bg: 'rgba(130,70,10,0.94)', border: '#e8b455', glow: '#e8b45555',
            onClick: () => harvestCallbackRef.current?.(nearbyHarvestId) };
        } else if (nearbyYoungTreeId) {
          ctx = { emoji: '🪓', label: '切る', bg: 'rgba(90,45,10,0.94)', border: '#d09050', glow: '#d0905055',
            onClick: () => cutCallbackRef.current?.(nearbyYoungTreeId) };
        } else if (nearbyHarvestFarmId) {
          ctx = { emoji: '🧺', label: `作物収穫 +${FARM_FOOD_YIELD}🍞`, bg: 'rgba(90,55,10,0.94)', border: '#e0b040', glow: '#e0b04055',
            onClick: () => harvestFarmCallbackRef.current?.(nearbyHarvestFarmId) };
        } else if (nearbyWaterPlotId) {
          ctx = { emoji: '💧', label: '水やり', bg: 'rgba(10,55,130,0.94)', border: '#55aaff', glow: '#55aaff55',
            onClick: () => waterCallbackRef.current?.(nearbyWaterPlotId) };
        } else if (nearbyFarmBuilding) {
          ctx = { emoji: '🌾', label: '種まき', bg: 'rgba(65,95,10,0.94)', border: '#b8e040', glow: '#b8e04055',
            onClick: () => seedCallbackRef.current?.() };
        } else {
          ctx = { emoji: '🌱', label: '植える', bg: 'rgba(22,85,32,0.94)', border: '#5acd7a', glow: '#5acd7a55',
            onClick: () => plantCallbackRef.current?.() };
        }

        return (
          <>
            {/* Primary context button (large, glowing) */}
            {!buildMode && (
              <div style={{ position: 'absolute', bottom: 150, left: '50%', transform: 'translateX(-50%)', zIndex: 12 }}>
                <button
                  onClick={ctx.onClick}
                  style={{
                    background: ctx.bg, color: '#fff',
                    border: `2px solid ${ctx.border}`,
                    borderRadius: 30, padding: '11px 28px',
                    fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'sans-serif',
                    boxShadow: `0 0 16px ${ctx.glow}, 0 2px 8px rgba(0,0,0,0.6)`,
                    letterSpacing: '0.02em',
                    transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
                  }}
                >
                  {ctx.emoji} {ctx.label}
                </button>
              </div>
            )}

            {/* Build-mode confirm/cancel (replaces context button) */}
            {buildMode && (
              <div style={{ position: 'absolute', bottom: 150, left: '50%', transform: 'translateX(-50%)', zIndex: 12, display: 'flex', gap: 10 }}>
                <button onClick={() => setBuildMode(null)}
                  style={{ background: 'rgba(90,22,22,0.94)', color: '#fff', border: '2px solid #c85858', borderRadius: 26, padding: '10px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', boxShadow: '0 0 10px #c8585855' }}>
                  ✕ キャンセル
                </button>
                <button onClick={() => confirmBuildCallbackRef.current?.()}
                  style={{ background: 'rgba(18,88,62,0.94)', color: '#fff', border: '2px solid #46d09a', borderRadius: 26, padding: '10px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'sans-serif', boxShadow: '0 0 10px #46d09a55' }}>
                  ✅ 確定
                </button>
              </div>
            )}
          </>
        );
      })()}

      {/* ── Secondary action strip (persistent) ─────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 96, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 7, zIndex: 10,
        flexWrap: 'wrap', justifyContent: 'center', maxWidth: 380,
      }}>
        {/* Mine stone */}
        {!buildMode && (
          <button onClick={handleGatherStone} disabled={stoneCooldown > 0}
            style={{ background: stoneCooldown > 0 ? 'rgba(40,40,40,0.7)' : 'rgba(62,52,20,0.88)', color: stoneCooldown > 0 ? '#777' : '#fff', border: `1px solid ${stoneCooldown > 0 ? '#555' : '#a09040'}`, borderRadius: 22, padding: '8px 14px', fontSize: 13, cursor: stoneCooldown > 0 ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif' }}>
            ⛏️{stoneCooldown > 0 ? ` ${stoneCooldown}s` : ' 採掘'}
          </button>
        )}
        {/* View toggle: TPS ↔ top-down */}
        <button onClick={() => setIsTpsMode(m => !m)}
          style={{ background: isTpsMode ? 'rgba(10,40,80,0.88)' : 'rgba(40,20,80,0.88)', color: '#fff', border: `1px solid ${isTpsMode ? '#4488cc' : '#8844cc'}`, borderRadius: 22, padding: '8px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>
          {isTpsMode ? '👁 TPS' : '🗺 俯瞰'}
        </button>
        {/* Build menu toggle */}
        {!buildMode && (
          <button onClick={() => setBuildMenuOpen(o => !o)}
            style={{ background: buildMenuOpen ? 'rgba(60,80,20,0.95)' : 'rgba(40,60,10,0.88)', color: '#fff', border: `1px solid ${buildMenuOpen ? '#aacc44' : '#88aa33'}`, borderRadius: 22, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>
            🏗️{buildMenuOpen ? ' ▲' : ' 建設'}
          </button>
        )}
        {/* Culture panel toggle */}
        <button onClick={() => setCulturePanelOpen(o => !o)}
          style={{ background: culturePanelOpen ? 'rgba(30,40,110,0.95)' : 'rgba(18,22,70,0.88)', color: '#fff', border: `1px solid ${culturePanelOpen ? '#7080e0' : '#5060c0'}`, borderRadius: 22, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}>
          🎭{population > 0 ? ` +${Math.max(1, Math.floor(population / 2))}` : ' 文化'}
        </button>
      </div>
    </div>
  );
};
