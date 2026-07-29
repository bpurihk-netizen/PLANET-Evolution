/**
 * DeilandNPCs — autonomous NPC citizens that walk the planet surface.
 *
 * Population grows with the number of buildings; each NPC is a miniature
 * character (0.42× player scale) that random-walks on the sphere using the
 * same spherical-coordinate system as the player character.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BiomeType } from '../../data/celestialBodies';
import { PLANET_RADIUS } from './DeilandPlanet';

// ── NPC data ──────────────────────────────────────────────────────────────────
export interface NpcInstance {
  id:       string;
  theta:    number;   // spherical polar angle
  phi:      number;   // spherical azimuthal angle
  facing:   number;   // surface heading (radians)
  walkTime: number;   // cumulative walk time (for leg-swing animation)
  changeIn: number;   // seconds until next direction change
  phase:    number;   // random phase offset
}

const NPC_MOVE_SPEED = 0.06; // radians / sec on sphere surface
const NPC_CHANGE_MIN = 3.0;
const NPC_CHANGE_MAX = 8.0;
const NPC_MAX        = 20;

let _npcCounter = 0;

/** Colour palettes for NPC outfits — 5 presets cycle by NPC index */
const NPC_PALETTES: Array<{ body: string; pants: string; hat: string }> = [
  { body: '#e87060', pants: '#603020', hat: '#a04020' },
  { body: '#60a880', pants: '#204840', hat: '#305840' },
  { body: '#8060c0', pants: '#302060', hat: '#503080' },
  { body: '#c09040', pants: '#604820', hat: '#806030' },
  { body: '#4090c0', pants: '#204860', hat: '#306080' },
];

function spawnNpc(index: number): NpcInstance {
  const s = ((index + 1) * 0.618034) % 1; // golden-ratio shuffle
  return {
    id:       `npc-${++_npcCounter}`,
    theta:    0.25 + s * (Math.PI * 0.55),
    phi:      s * Math.PI * 2,
    facing:   s * Math.PI * 2,
    walkTime: 0,
    changeIn: NPC_CHANGE_MIN + s * (NPC_CHANGE_MAX - NPC_CHANGE_MIN),
    phase:    s * Math.PI * 2,
  };
}

// ── NPCFigure ─────────────────────────────────────────────────────────────────
/**
 * A simplified 3-part character (body + head + hat + 2 legs) at 0.42× scale.
 * Position & orientation are updated every frame from the shared NpcInstance ref.
 */
const NPCFigure: React.FC<{ npc: NpcInstance; paletteIdx: number }> = ({ npc, paletteIdx }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pal = NPC_PALETTES[paletteIdx % NPC_PALETTES.length];

  useFrame(() => {
    if (!groupRef.current) return;

    const { theta, phi, facing } = npc;
    const sinT = Math.sin(theta), cosT = Math.cos(theta);
    const sinP = Math.sin(phi),   cosP = Math.cos(phi);

    // Surface normal (up) at NPC position
    const up = new THREE.Vector3(sinT * cosP, cosT, sinT * sinP);
    groupRef.current.position.copy(up.clone().multiplyScalar(PLANET_RADIUS + 0.09));

    // Orientation matrix: right, up, -forward
    const north  = new THREE.Vector3(cosT * cosP, -sinT, cosT * sinP).normalize();
    const east   = new THREE.Vector3(-sinP, 0, cosP).normalize();
    const fwd    = north.clone().multiplyScalar(Math.cos(facing))
                   .add(east.clone().multiplyScalar(Math.sin(facing))).normalize();
    const right  = new THREE.Vector3().crossVectors(fwd, up).normalize();
    const mat    = new THREE.Matrix4().makeBasis(right, up, fwd.clone().negate());
    groupRef.current.quaternion.setFromRotationMatrix(mat);

    // Leg swing animation (children: 0=body, 1=head, 2=rightLeg, 3=leftLeg, 4=hat)
    const swing = Math.sin(npc.walkTime * 6 + npc.phase) * 0.28;
    const c = groupRef.current.children;
    if (c[2]) (c[2] as THREE.Object3D).rotation.x =  swing;
    if (c[3]) (c[3] as THREE.Object3D).rotation.x = -swing;
  });

  // Render at 42% player scale
  const sc = 0.42;
  return (
    <group ref={groupRef} scale={[sc, sc, sc]}>
      {/* c[0] Body */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.07, 4, 8]} />
        <meshLambertMaterial color={pal.body} />
      </mesh>
      {/* c[1] Head */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.058, 8, 8]} />
        <meshLambertMaterial color="#f4c4a1" />
      </mesh>
      {/* c[2] Right leg */}
      <group position={[0.028, 0.08, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.022, 0.058, 4, 7]} />
          <meshLambertMaterial color={pal.pants} />
        </mesh>
      </group>
      {/* c[3] Left leg */}
      <group position={[-0.028, 0.08, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.022, 0.058, 4, 7]} />
          <meshLambertMaterial color={pal.pants} />
        </mesh>
      </group>
      {/* c[4] Hat */}
      <group position={[0, 0.46, 0]}>
        <mesh>
          <cylinderGeometry args={[0.038, 0.044, 0.06, 7]} />
          <meshLambertMaterial color={pal.hat} />
        </mesh>
      </group>
    </group>
  );
};

// ── DeilandNPCs ───────────────────────────────────────────────────────────────
/**
 * Manages all NPC instances.  Rendered inside the R3F Canvas (inside DeilandWorld).
 *
 * Props:
 *   population  — target NPC count (capped at NPC_MAX = 20)
 *   biome       — used for future biome-specific behaviour
 */
export const DeilandNPCs: React.FC<{
  population: number;
  biome:      BiomeType;
}> = ({ population }) => {
  const npcDataRef = useRef<NpcInstance[]>([]);
  const [npcCount, setNpcCount] = useState(0);

  // Sync NPC array length with population target
  useEffect(() => {
    const target = Math.min(population, NPC_MAX);
    const current = npcDataRef.current.length;
    if (target > current) {
      const added: NpcInstance[] = [];
      for (let i = current; i < target; i++) added.push(spawnNpc(i));
      npcDataRef.current = [...npcDataRef.current, ...added];
    } else if (target < current) {
      npcDataRef.current = npcDataRef.current.slice(0, target);
    }
    if (target !== current) setNpcCount(target);
  }, [population]);

  // Autonomous movement: advance each NPC forward + random direction changes
  useFrame((_, dt) => {
    npcDataRef.current.forEach(npc => {
      npc.walkTime += dt;

      const speed = NPC_MOVE_SPEED * dt / PLANET_RADIUS;
      npc.theta += Math.cos(npc.facing) * speed;
      npc.phi   += Math.sin(npc.facing) * speed /
                   Math.max(Math.abs(Math.sin(npc.theta)), 0.05);
      npc.theta  = Math.max(0.10, Math.min(Math.PI - 0.10, npc.theta));

      npc.changeIn -= dt;
      if (npc.changeIn <= 0) {
        // Pseudo-random from current state (deterministic, no Math.random stutter)
        npc.facing   = (npc.facing + 1.9 + Math.abs(Math.sin(npc.walkTime * 13.7)) * 4.0) % (Math.PI * 2);
        npc.changeIn = NPC_CHANGE_MIN + Math.abs(Math.sin(npc.walkTime * 7.3)) * (NPC_CHANGE_MAX - NPC_CHANGE_MIN);
      }
    });
  });

  // npcCount in JSX forces a re-render when NPCs are added/removed
  return (
    <>
      {npcDataRef.current.map((npc, i) => (
        <NPCFigure key={npc.id} npc={npc} paletteIdx={i} />
      ))}
    </>
  );
};
