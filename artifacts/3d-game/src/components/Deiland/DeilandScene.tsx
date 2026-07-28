import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DeilandPlanet, PLANET_RADIUS } from './DeilandPlanet';
import { CelestialBody, BiomeType } from '../../data/celestialBodies';
import { BuildingInstance, BuildingType } from './DeilandBuildings';

const CHAR_OFFSET      = 0.15;
const MOVE_SPEED       = 0.55;
const TURN_SPEED       = 1.8;
const DESCENT_DURATION = 3.5;
const ACTION_DURATION  = 0.55;   // seconds for one action swing

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

// ── Sphere surface position helper ───────────────────────────────────────────
function makeBuildingAt(id: string, type: BuildingType, theta: number, phi: number): BuildingInstance {
  const up = new THREE.Vector3(
    Math.sin(theta) * Math.cos(phi),
    Math.cos(theta),
    Math.sin(theta) * Math.sin(phi),
  ).normalize();
  return { id, type, pos: up.clone().multiplyScalar(PLANET_RADIUS + 0.06), up };
}

interface DeilandWorldProps {
  body: CelestialBody;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
}

function DeilandWorld({ body, joystickRef }: DeilandWorldProps) {
  const { camera } = useThree();

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

  // Demo buildings — placed near spawn so all 4 types are visible.
  // Task #86 (building construction) will replace this with gameplay-driven state.
  const buildings = useMemo<BuildingInstance[]>(() => [
    makeBuildingAt('demo-hut',      'hut',      0.27,  0.38),
    makeBuildingAt('demo-farm',     'farm',     0.44,  0.22),
    makeBuildingAt('demo-workshop', 'workshop', 0.25, -0.34),
    makeBuildingAt('demo-shrine',   'shrine',   0.37,  0.58),
  ], []);

  useEffect(() => {
    camera.up.set(0, 1, 0);
    camera.position.set(0, PLANET_RADIUS * 6, PLANET_RADIUS * 2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const up   = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((state, dt) => {
    const elapsed = state.clock.elapsedTime;

    // Descent animation
    if (descentRef.current < 1) {
      descentRef.current = Math.min(1, descentRef.current + dt / DESCENT_DURATION);
    }
    const d = descentRef.current;
    const ease = d * d * (3 - 2 * d);

    // Input
    const keys = keysRef.current;
    const joy  = joystickRef.current;
    let mx = joy.x, my = joy.y;
    if (keys.has('KeyA') || keys.has('ArrowLeft'))  mx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp'))    my += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown'))  my -= 1;
    mx = Math.max(-1, Math.min(1, mx));
    my = Math.max(-1, Math.min(1, my));
    const isMoving = (Math.abs(mx) > 0.05 || Math.abs(my) > 0.05) && ease > 0.95;

    // Sprint smoothing (fast when |my| > 0.75)
    const wantSprint = Math.abs(my) > 0.75 && isMoving;
    sprintRef.current += (wantSprint ? 1 : -1) * dt * 5;
    sprintRef.current  = Math.max(0, Math.min(1, sprintRef.current));
    const sp = sprintRef.current;

    // Character movement (sprinting moves faster)
    if (ease > 0.95) {
      facingRef.current += mx * TURN_SPEED * dt;
      if (Math.abs(my) > 0.01) {
        const speedMult = 1 + sp * 0.7;
        const dAngle = my * MOVE_SPEED * speedMult * dt / PLANET_RADIUS;
        thetaRef.current += Math.cos(facingRef.current) * dAngle;
        phiRef.current   += Math.sin(facingRef.current) * dAngle /
                            Math.max(Math.abs(Math.sin(thetaRef.current)), 0.05);
        thetaRef.current  = Math.max(0.12, Math.min(Math.PI - 0.12, thetaRef.current));
      }
    }
    if (isMoving) walkTimeRef.current += dt * (1 + sp * 0.5); // walk timer also speeds up

    // World positions
    const θ = thetaRef.current, φ = phiRef.current;
    const up = new THREE.Vector3(
      Math.sin(θ) * Math.cos(φ), Math.cos(θ), Math.sin(θ) * Math.sin(φ)
    );
    const charPos = up.clone().multiplyScalar(PLANET_RADIUS + CHAR_OFFSET);

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

    // Camera
    const back = forward.clone().negate();
    const camSurface = charPos.clone()
      .add(up.clone().multiplyScalar(1.1))
      .add(back.multiplyScalar(3.2));
    const camSpace = new THREE.Vector3(0, PLANET_RADIUS * 6, PLANET_RADIUS * 2);
    const targetCamPos = new THREE.Vector3().lerpVectors(camSpace, camSurface, ease);
    const lookSurface = charPos.clone().add(up.clone().multiplyScalar(0.25));
    const lookSpace   = new THREE.Vector3(0, 0, 0);
    const targetLook  = new THREE.Vector3().lerpVectors(lookSpace, lookSurface, ease);

    const worldUp  = new THREE.Vector3(0, 1, 0);
    const targetUp = worldUp.clone().lerp(up, ease);
    camera.up.lerp(targetUp.normalize(), 0.08);
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(targetLook);
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
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[8, 12, 6]} intensity={1.1} castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-15} shadow-camera-right={15}
        shadow-camera-top={15}  shadow-camera-bottom={-15}
      />
      <pointLight position={[0, 0, 0]} intensity={0.15} color="#ffffff" />

      <DeilandPlanet body={body} seed={body.id.charCodeAt(0) + body.id.length + 1} buildings={buildings} />

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
      {/* ────────────────────────────────────────────────────────── */}
    </>
  );
}

export const DeilandScene: React.FC<{
  body: CelestialBody;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
}> = ({ body, joystickRef }) => (
  <Canvas
    shadows
    camera={{ fov: 55, near: 0.05, far: 300, position: [0, PLANET_RADIUS * 6, PLANET_RADIUS * 2] }}
    gl={{ antialias: true }}
    style={{ width: '100%', height: '100%', background: '#050510' }}
  >
    <DeilandWorld body={body} joystickRef={joystickRef} />
  </Canvas>
);
