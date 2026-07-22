import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DeilandPlanet, PLANET_RADIUS } from './DeilandPlanet';
import { PlanetState } from '../../hooks/useGameState';

const CHAR_OFFSET = 0.15;
const MOVE_SPEED  = 0.55; // units/s along arc
const TURN_SPEED  = 1.8;  // rad/s
const DESCENT_DURATION = 3.5; // seconds

interface DeilandWorldProps {
  planet: PlanetState;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
}

function DeilandWorld({ planet, joystickRef }: DeilandWorldProps) {
  const { camera } = useThree();

  // Start near the top of the sphere (small θ) so the default camera up=(0,1,0) is correct
  const thetaRef   = useRef(0.35);
  const phiRef     = useRef(0);
  const facingRef  = useRef(0);
  const walkTimeRef = useRef(0);
  const descentRef  = useRef(0);
  const keysRef    = useRef(new Set<string>());
  const charRef    = useRef<THREE.Group>(null);

  // Set initial camera position (high above, aligned with world up)
  useEffect(() => {
    camera.up.set(0, 1, 0);
    camera.position.set(0, PLANET_RADIUS * 6, PLANET_RADIUS * 2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const up   = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((_, dt) => {
    // ── Descent animation ──────────────────────────────────────────────
    if (descentRef.current < 1) {
      descentRef.current = Math.min(1, descentRef.current + dt / DESCENT_DURATION);
    }
    const d = descentRef.current;
    const ease = d * d * (3 - 2 * d); // smoothstep

    // ── Input ──────────────────────────────────────────────────────────
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

    // ── Character movement (only after descent) ────────────────────────
    if (ease > 0.95) {
      facingRef.current += mx * TURN_SPEED * dt;
      if (Math.abs(my) > 0.01) {
        const dAngle = my * MOVE_SPEED * dt / PLANET_RADIUS;
        thetaRef.current += Math.cos(facingRef.current) * dAngle;
        phiRef.current   += Math.sin(facingRef.current) * dAngle /
                            Math.max(Math.abs(Math.sin(thetaRef.current)), 0.05);
        thetaRef.current  = Math.max(0.12, Math.min(Math.PI - 0.12, thetaRef.current));
      }
    }
    if (isMoving) walkTimeRef.current += dt;

    // ── World positions ────────────────────────────────────────────────
    const θ = thetaRef.current, φ = phiRef.current;
    const up = new THREE.Vector3(
      Math.sin(θ) * Math.cos(φ), Math.cos(θ), Math.sin(θ) * Math.sin(φ)
    );
    const charPos = up.clone().multiplyScalar(PLANET_RADIUS + CHAR_OFFSET);

    // Forward direction in tangent plane
    const northT = new THREE.Vector3(
      Math.cos(θ) * Math.cos(φ), -Math.sin(θ), Math.cos(θ) * Math.sin(φ)
    ).normalize();
    const eastT = new THREE.Vector3(-Math.sin(φ), 0, Math.cos(φ)).normalize();
    const fc    = facingRef.current;
    const forward = northT.clone().multiplyScalar(Math.cos(fc))
                    .add(eastT.clone().multiplyScalar(Math.sin(fc))).normalize();

    // ── Update character mesh imperatively ─────────────────────────────
    if (charRef.current) {
      charRef.current.position.copy(charPos);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      const m = new THREE.Matrix4().makeBasis(right, up, forward.clone().negate());
      charRef.current.quaternion.setFromRotationMatrix(m);

      // Walking animation (child index order: body0, head1, eyeL2, eyeR3, legL4, legR5, armL6, armR7, hat8)
      const wt = walkTimeRef.current;
      const bob  = isMoving ? Math.sin(wt * 8) * 0.018 : 0;
      const swing = isMoving ? Math.sin(wt * 8) * 0.28 : 0;
      const c = charRef.current.children;
      if (c[0]) c[0].position.y = 0.22 + bob;
      if (c[1]) c[1].position.y = 0.38 + bob;
      if (c[2]) c[2].position.y = 0.39 + bob;
      if (c[3]) c[3].position.y = 0.39 + bob;
      if (c[4]) { c[4].position.y = 0.1 + bob; (c[4] as THREE.Mesh).rotation.x =  swing; }
      if (c[5]) { c[5].position.y = 0.1 + bob; (c[5] as THREE.Mesh).rotation.x = -swing; }
      if (c[6]) { c[6].position.y = 0.22 + bob; (c[6] as THREE.Mesh).rotation.x =  swing * 0.5; }
      if (c[7]) { c[7].position.y = 0.22 + bob; (c[7] as THREE.Mesh).rotation.x = -swing * 0.5; }
      if (c[8]) c[8].position.y = 0.46 + bob;

      // Fade character in during descent
      charRef.current.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
          ((obj as THREE.Mesh).material as THREE.MeshLambertMaterial).transparent = true;
          ((obj as THREE.Mesh).material as THREE.MeshLambertMaterial).opacity = Math.min(1, ease * 3 - 1);
        }
      });
    }

    // ── Camera ─────────────────────────────────────────────────────────
    const back = forward.clone().negate();
    const camSurface = charPos.clone()
      .add(up.clone().multiplyScalar(1.1))
      .add(back.multiplyScalar(3.2));
    const camSpace = new THREE.Vector3(0, PLANET_RADIUS * 6, PLANET_RADIUS * 2);
    const targetCamPos = new THREE.Vector3().lerpVectors(camSpace, camSurface, ease);

    const lookSurface = charPos.clone().add(up.clone().multiplyScalar(0.25));
    const lookSpace   = new THREE.Vector3(0, 0, 0);
    const targetLook  = new THREE.Vector3().lerpVectors(lookSpace, lookSurface, ease);

    // Smoothly rotate camera's up vector from world-up to sphere-normal as we descend
    const worldUp = new THREE.Vector3(0, 1, 0);
    const targetUp = worldUp.clone().lerp(up, ease);
    camera.up.lerp(targetUp.normalize(), 0.08);

    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(targetLook);
  });

  // Lambert material color helper
  const mat = (color: string) => <meshLambertMaterial color={color} flatShading />;
  const matO = (color: string, opacity: number) =>
    <meshLambertMaterial color={color} flatShading transparent opacity={opacity} />;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-15} shadow-camera-right={15}
        shadow-camera-top={15}  shadow-camera-bottom={-15}
      />
      <pointLight position={[0, 0, 0]} intensity={0.15} color="#ffffff" />

      {/* Planet */}
      <DeilandPlanet
        seed={planet.id + 1}
        planetType={planet.type}
        waterAmount={planet.params.waterAmount}
        temperature={planet.params.temperature}
        biomass={planet.stats.biomass}
      />

      {/* Character */}
      <group ref={charRef}>
        {/* 0 – body */}
        <mesh position={[0, 0.22, 0]} castShadow>{mat('#3a7bd5')}<boxGeometry args={[0.12, 0.16, 0.08]} /></mesh>
        {/* 1 – head */}
        <mesh position={[0, 0.38, 0]} castShadow>{mat('#f4c4a1')}<boxGeometry args={[0.1, 0.1, 0.1]} /></mesh>
        {/* 2 – left eye */}
        <mesh position={[0.027, 0.39, 0.051]}>{mat('#1a1a2e')}<boxGeometry args={[0.014, 0.014, 0.01]} /></mesh>
        {/* 3 – right eye */}
        <mesh position={[-0.027, 0.39, 0.051]}>{mat('#1a1a2e')}<boxGeometry args={[0.014, 0.014, 0.01]} /></mesh>
        {/* 4 – left leg */}
        <mesh position={[0.034, 0.1, 0]} castShadow>{mat('#2c3e50')}<boxGeometry args={[0.048, 0.12, 0.048]} /></mesh>
        {/* 5 – right leg */}
        <mesh position={[-0.034, 0.1, 0]} castShadow>{mat('#2c3e50')}<boxGeometry args={[0.048, 0.12, 0.048]} /></mesh>
        {/* 6 – left arm */}
        <mesh position={[0.1, 0.22, 0]} castShadow>{mat('#3a7bd5')}<boxGeometry args={[0.04, 0.1, 0.04]} /></mesh>
        {/* 7 – right arm */}
        <mesh position={[-0.1, 0.22, 0]} castShadow>{mat('#3a7bd5')}<boxGeometry args={[0.04, 0.1, 0.04]} /></mesh>
        {/* 8 – hat */}
        <mesh position={[0, 0.46, 0]}>{mat('#8B4513')}<cylinderGeometry args={[0.058, 0.066, 0.06, 6]} /></mesh>
      </group>
    </>
  );
}

interface DeilandSceneProps {
  planet: PlanetState;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
}

export const DeilandScene: React.FC<DeilandSceneProps> = ({ planet, joystickRef }) => (
  <Canvas
    shadows
    camera={{ fov: 55, near: 0.05, far: 300, position: [0, PLANET_RADIUS * 6, PLANET_RADIUS * 2] }}
    gl={{ antialias: true }}
    style={{ width: '100%', height: '100%', background: '#050510' }}
  >
    <DeilandWorld planet={planet} joystickRef={joystickRef} />
  </Canvas>
);
