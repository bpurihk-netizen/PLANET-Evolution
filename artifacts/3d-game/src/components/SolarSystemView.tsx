import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SOLAR_SYSTEM, CelestialBody } from '../data/celestialBodies';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { CelestialBodyMesh, AsteroidBeltRing, CometTail } from './CelestialBody';

// ── Stars background ────────────────────────────────────────────────────────
const Stars: React.FC = () => {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const N = 4000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 300 + Math.random() * 300;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      pos[i * 3]     = r * Math.sin(theta) * Math.cos(phi);
      pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = r * Math.cos(theta);
      const t = Math.random();
      const c = t < 0.33 ? [1, 0.9, 0.8] : t < 0.66 ? [0.9, 0.95, 1] : [1, 1, 1];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    return { positions: pos, colors: col };
  }, []);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.002; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.6} vertexColors sizeAttenuation transparent opacity={0.85} />
    </points>
  );
};

// ── Orbit ring ──────────────────────────────────────────────────────────────
const OrbitLine: React.FC<{ radius: number; selected?: boolean }> = ({ radius, selected }) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={selected ? '#88aaff' : '#ffffff'} transparent opacity={selected ? 0.35 : 0.08} />
    </line>
  );
};

// ── Camera controller ────────────────────────────────────────────────────────
interface CameraControllerProps {
  viewMode: 'overview' | 'detail';
  targetRadius: number;
}
const OVERVIEW_CAM = new THREE.Vector3(0, 55, 32);
const OVERVIEW_LOOK = new THREE.Vector3(0, 0, 0);

const CameraController: React.FC<CameraControllerProps> = ({ viewMode, targetRadius }) => {
  const { camera } = useThree();
  const targetCamPos = useRef(OVERVIEW_CAM.clone());
  const targetLookAt = useRef(OVERVIEW_LOOK.clone());
  const currentLook = useRef(OVERVIEW_LOOK.clone());
  // Track whether we are in an active transition (vs. steady state in overview)
  const transitioning = useRef(false);
  const prevMode = useRef(viewMode);

  useEffect(() => {
    if (viewMode === 'overview') {
      targetCamPos.current.copy(OVERVIEW_CAM);
      targetLookAt.current.copy(OVERVIEW_LOOK);
      transitioning.current = true; // animate back to overview position
    } else {
      // Detail mode: planet has moved to world origin (0,0,0)
      // Camera: high above-behind so planet sits in upper 40% of screen
      const yOff = Math.max(targetRadius * 3.0, 2.5);
      const zOff = Math.max(targetRadius * 7.0, 6.0);
      targetCamPos.current.set(0, yOff, zOff);
      // Look at a point below the planet center so planet appears in upper portion
      targetLookAt.current.set(0, -targetRadius * 1.2, 0);
      transitioning.current = true;
    }
    prevMode.current = viewMode;
  }, [viewMode, targetRadius]);

  useFrame(() => {
    if (viewMode === 'detail') {
      // Always drive camera in detail (OrbitControls is disabled)
      camera.position.lerp(targetCamPos.current, 0.07);
      currentLook.current.lerp(targetLookAt.current, 0.07);
      camera.lookAt(currentLook.current);
    } else if (transitioning.current) {
      // overview: animate back to OVERVIEW_CAM, then stop so OrbitControls takes over
      camera.position.lerp(targetCamPos.current, 0.06);
      currentLook.current.lerp(targetLookAt.current, 0.06);
      camera.lookAt(currentLook.current);
      if (camera.position.distanceTo(targetCamPos.current) < 0.5) {
        transitioning.current = false;
      }
    }
    // else: overview + not transitioning → OrbitControls owns the camera freely
  });
  return null;
};

// ── Orbiting body ────────────────────────────────────────────────────────────
interface OrbitingBodyProps {
  body: CelestialBody;
  isSelected: boolean;
  isVisited: boolean;
  viewMode: 'overview' | 'detail';
  onClick: () => void;
  angleRef: React.MutableRefObject<number>;
}

const OrbitingBody: React.FC<OrbitingBodyProps> = ({
  body, isSelected, viewMode, onClick, angleRef
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const isDetail = viewMode === 'detail' && isSelected;

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    if (viewMode === 'overview') {
      angleRef.current += dt * body.orbitSpeed * 0.08;
    }
    if (body.type === 'ASTEROID_BELT') return;
    groupRef.current.position.x = Math.cos(angleRef.current) * body.logOrbitRadius;
    groupRef.current.position.z = Math.sin(angleRef.current) * body.logOrbitRadius;
    if (isDetail) {
      groupRef.current.position.set(0, 0, 0);
    }
  });

  if (body.type === 'ASTEROID_BELT') {
    // Transparent torus hit area so users can tap the asteroid belt
    return (
      <group onClick={onClick}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[body.logOrbitRadius, 2.0, 4, 80]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <AsteroidBeltRing orbitRadius={body.logOrbitRadius} />
      </group>
    );
  }

  const isOverview = viewMode === 'overview';
  const displayR = isDetail ? body.displayRadius * 4 : body.displayRadius;

  return (
    <group ref={groupRef}>
      {/* Clickable hit area */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[Math.max(displayR * 1.3, 0.5), 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <CelestialBodyMesh body={body} radius={displayR} isOverview={isOverview} onClick={onClick} />

      {body.id === 'halley' && !isOverview && <CometTail radius={displayR} />}

      {/* Selected glow ring */}
      {isSelected && isOverview && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[displayR * 1.5, displayR * 1.75, 32]} />
          <meshBasicMaterial color="#88aaff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Label (overview only) */}
      {isOverview && (
        <BodyLabel body={body} radius={displayR} isSelected={isSelected} />
      )}
    </group>
  );
};

// ── Billboard label ───────────────────────────────────────────────────────────
const BodyLabel: React.FC<{ body: CelestialBody; radius: number; isSelected: boolean }> = ({
  body, radius, isSelected
}) => {
  const ref = useRef<THREE.Sprite>(null);
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSelected ? '#aaddff' : 'rgba(255,255,255,0.7)';
    ctx.fillText(body.nameJa, 128, 38);
    return c;
  }, [body.nameJa, isSelected]);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    return t;
  }, [canvas]);

  return (
    <sprite ref={ref} position={[0, radius * 1.8 + 0.5, 0]} scale={[2.5, 0.65, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
};

// ── Sun special glow ───────────────────────────────────────────────────────────
const SunGlow: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(Date.now() * 0.001) * 0.04;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[5.5, 16, 16]} />
      <meshBasicMaterial color="#FFD700" transparent opacity={0.12} side={THREE.FrontSide} depthWrite={false} />
    </mesh>
  );
};

// ── Main Scene ────────────────────────────────────────────────────────────────
interface SceneProps {
  state: SolarSystemState;
}

const Scene: React.FC<SceneProps> = ({ state }) => {
  // Keep angle refs for each body (persistent across renders)
  const angleRefs = useRef<Record<string, React.MutableRefObject<number>>>({});
  SOLAR_SYSTEM.forEach(b => {
    if (!angleRefs.current[b.id]) {
      angleRefs.current[b.id] = { current: b.orbitAngleOffset };
    }
  });

  return (
    <>
      <Stars />
      <CameraController
        viewMode={state.viewMode}
        targetRadius={(state.selectedBody?.displayRadius ?? 0.5) * 4}
      />

      {/* Orbit lines (overview only) */}
      {state.viewMode === 'overview' && SOLAR_SYSTEM.map(b =>
        b.type !== 'ASTEROID_BELT' && b.logOrbitRadius > 0 ? (
          <OrbitLine
            key={`orbit-${b.id}`}
            radius={b.logOrbitRadius}
            selected={state.selectedBodyId === b.id}
          />
        ) : null
      )}

      {/* Sun */}
      <group>
        <CelestialBodyMesh
          body={SOLAR_SYSTEM[0]}
          isOverview={state.viewMode === 'overview'}
          onClick={() => state.enterDetail('sun')}
        />
        {state.viewMode === 'overview' && <SunGlow />}
        {state.viewMode === 'overview' && (
          <BodyLabel body={SOLAR_SYSTEM[0]} radius={SOLAR_SYSTEM[0].displayRadius} isSelected={state.selectedBodyId === 'sun'} />
        )}
      </group>

      {/* Planets & other bodies */}
      {SOLAR_SYSTEM.slice(1).map(body => (
        <OrbitingBody
          key={body.id}
          body={body}
          isSelected={state.selectedBodyId === body.id}
          isVisited={state.visitedBodyIds.includes(body.id)}
          viewMode={state.viewMode}
          angleRef={angleRefs.current[body.id] ?? { current: body.orbitAngleOffset }}
          onClick={() => state.enterDetail(body.id)}
        />
      ))}

      {/* Detail: show moons around selected planet */}
      {state.viewMode === 'detail' && state.selectedBody?.children?.map((moon, i) => {
        const moonAngle = (i / (state.selectedBody!.children!.length)) * Math.PI * 2;
        const moonR = state.selectedBody!.displayRadius * 4 * (1.8 + i * 0.6);
        return (
          <MoonOrbit
            key={moon.id}
            moon={moon}
            orbitRadius={moonR}
            initialAngle={moonAngle}
            onClick={() => state.selectBody(moon.id)}
            isSelected={state.selectedBodyId === moon.id}
          />
        );
      })}

      {/* Ambient lighting */}
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 0, 0]} intensity={6.0} color="#FFF5E0" distance={200} decay={1.2} />
      <directionalLight position={[50, 30, 50]} intensity={0.3} color="#ffffff" />
    </>
  );
};

// ── Moon orbit ────────────────────────────────────────────────────────────────
const MoonOrbit: React.FC<{
  moon: CelestialBody;
  orbitRadius: number;
  initialAngle: number;
  onClick: () => void;
  isSelected: boolean;
}> = ({ moon, orbitRadius, initialAngle, onClick, isSelected }) => {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(initialAngle);

  useFrame((_, dt) => {
    angleRef.current += dt * 0.3;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * orbitRadius;
      groupRef.current.position.z = Math.sin(angleRef.current) * orbitRadius;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[Math.max(moon.displayRadius * 4, 0.3), 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <CelestialBodyMesh body={moon} radius={moon.displayRadius * 4} isOverview={false} onClick={onClick} />
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[moon.displayRadius * 4 * 1.4, moon.displayRadius * 4 * 1.7, 24]} />
          <meshBasicMaterial color="#88aaff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

// ── Outer component ────────────────────────────────────────────────────────────
export const SolarSystemView: React.FC<{ state: SolarSystemState }> = ({ state }) => (
  <Canvas
    camera={{ position: [0, 55, 32], fov: 42, near: 0.1, far: 1000 }}
    gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
    style={{ width: '100%', height: '100%', background: '#020408' }}
  >
    <color attach="background" args={['#020408']} />
    <Scene state={state} />
    {state.viewMode === 'overview' && (
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableDamping
        dampingFactor={0.08}
        minDistance={12}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.2}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    )}
  </Canvas>
);
