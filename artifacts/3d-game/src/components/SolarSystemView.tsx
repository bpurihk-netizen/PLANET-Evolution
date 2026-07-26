import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody } from '../data/celestialBodies';
import { SolarSystemState } from '../hooks/useSolarSystem';
import { CelestialBodyMesh, AsteroidBeltRing, CometTail } from './CelestialBody';
import { SolarFlares } from './SolarFlares';
import { useNoaaSpaceWeather, FlareClass } from '../hooks/useNoaaSpaceWeather';

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
  /** Display radius of the FOCUSED body (parent if a child is selected). */
  targetRadius: number;
  systemId: string;
  zoomRef: React.MutableRefObject<number>;
}
const OVERVIEW_CAM      = new THREE.Vector3(0, 55, 32);
const OVERVIEW_LOOK     = new THREE.Vector3(0, 0, 0);
const MOON_DETAIL_RADIUS = 0.9; // fixed visual radius for any moon in detail mode

const CameraController: React.FC<CameraControllerProps> = ({ viewMode, targetRadius, systemId, zoomRef }) => {
  const { camera } = useThree();
  const targetCamPos  = useRef(OVERVIEW_CAM.clone());
  const targetLookAt  = useRef(OVERVIEW_LOOK.clone());
  const currentLook   = useRef(OVERVIEW_LOOK.clone());
  const transitioning = useRef(false);

  // Reset to overview whenever system changes
  useEffect(() => {
    targetCamPos.current.copy(OVERVIEW_CAM);
    targetLookAt.current.copy(OVERVIEW_LOOK);
    transitioning.current = true;
    zoomRef.current = 1.0;
  }, [systemId, zoomRef]);

  useEffect(() => {
    if (viewMode === 'overview') {
      targetCamPos.current.copy(OVERVIEW_CAM);
      targetLookAt.current.copy(OVERVIEW_LOOK);
      transitioning.current = true;
      zoomRef.current = 1.0;
    } else {
      transitioning.current = true;
    }
  }, [viewMode, targetRadius, zoomRef]);

  useFrame(() => {
    if (viewMode === 'detail') {
      // Recompute both camera position AND lookAt every frame so zoom stays centred.
      // lookAt scales with zoom: at z=1 slightly below origin (leave room for InfoPanel),
      // approaching (0,0,0) as user zooms in so body never drifts off-screen.
      const z = zoomRef.current;
      const yOff   = Math.max(targetRadius * 2.5, 2.0) * z;
      const zOff   = Math.max(targetRadius * 6.5, 5.0) * z;
      const lookY  = -Math.min(targetRadius * 0.5, 2.5) * Math.min(z, 1.0);
      targetCamPos.current.set(0, yOff, zOff);
      targetLookAt.current.set(0, lookY, 0);

      camera.position.lerp(targetCamPos.current, 0.08);
      currentLook.current.lerp(targetLookAt.current, 0.08);
      camera.lookAt(currentLook.current);
    } else if (transitioning.current) {
      camera.position.lerp(targetCamPos.current, 0.06);
      currentLook.current.lerp(targetLookAt.current, 0.06);
      camera.lookAt(currentLook.current);
      if (camera.position.distanceTo(targetCamPos.current) < 0.5) {
        transitioning.current = false;
      }
    }
  });
  return null;
};

// ── Pinch-to-zoom + manual rotation controller ────────────────────────────────
const PinchZoomController: React.FC<{
  enabled: boolean;
  zoomRef: React.MutableRefObject<number>;
  manualRotationRef: React.MutableRefObject<number>;
  rotationPausedRef: React.MutableRefObject<boolean>;
}> = ({ enabled, zoomRef, manualRotationRef, rotationPausedRef }) => {
  const { gl } = useThree();

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;

    let lastDist  = 0;
    let lastTap   = 0;
    let lastDragX = 0;
    let isDragging = false;

    const pinchDist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        lastDist   = pinchDist(e.touches);
        isDragging = false;
      } else if (e.touches.length === 1) {
        lastDragX  = e.touches[0].clientX;
        isDragging = false;
        // Double-tap resets zoom
        const now = Date.now();
        if (now - lastTap < 280) zoomRef.current = 1.0;
        lastTap = now;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        if (!lastDist) return;
        const d = pinchDist(e.touches);
        zoomRef.current = Math.max(0.25, Math.min(4.0, zoomRef.current / (d / lastDist)));
        lastDist = d;
        isDragging = false;
      } else if (e.touches.length === 1 && rotationPausedRef.current) {
        // Single-finger drag → manual rotation when planet is paused
        const dx = e.touches[0].clientX - lastDragX;
        if (Math.abs(dx) > 2) isDragging = true;
        manualRotationRef.current += dx * 0.008;
        lastDragX = e.touches[0].clientX;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) lastDist = 0;
      if (e.touches.length < 1) isDragging = false;
    };

    // Mouse drag for desktop (when rotation is paused)
    let mouseDown = false;
    let lastMouseX = 0;
    const onMouseDown = (e: MouseEvent) => { mouseDown = true; lastMouseX = e.clientX; };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDown || !rotationPausedRef.current) return;
      manualRotationRef.current += (e.clientX - lastMouseX) * 0.006;
      lastMouseX = e.clientX;
    };
    const onMouseUp = () => { mouseDown = false; };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      zoomRef.current = Math.max(0.25, Math.min(4.0, zoomRef.current * factor));
    };

    el.addEventListener('touchstart',  onTouchStart, { passive: true });
    el.addEventListener('touchmove',   onTouchMove,  { passive: true });
    el.addEventListener('touchend',    onTouchEnd,   { passive: true });
    el.addEventListener('mousedown',   onMouseDown);
    el.addEventListener('mousemove',   onMouseMove);
    el.addEventListener('mouseup',     onMouseUp);
    el.addEventListener('wheel',       onWheel,      { passive: false });

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('mousedown',   onMouseDown);
      el.removeEventListener('mousemove',   onMouseMove);
      el.removeEventListener('mouseup',     onMouseUp);
      el.removeEventListener('wheel',       onWheel);
    };
  }, [enabled, gl.domElement, zoomRef, manualRotationRef, rotationPausedRef]);

  return null;
};

// ── Orbiting body ────────────────────────────────────────────────────────────
interface OrbitingBodyProps {
  body: CelestialBody;
  isSelected: boolean;
  viewMode: 'overview' | 'detail';
  onClick: () => void;
  angleRef: React.MutableRefObject<number>;
  rotationPaused?: boolean;
  manualRotationRef?: React.MutableRefObject<number>;
  showAtmosphere?: boolean;
}

const OrbitingBody: React.FC<OrbitingBodyProps> = ({
  body, isSelected, viewMode, onClick, angleRef, rotationPaused, manualRotationRef, showAtmosphere = true
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
      <mesh onClick={onClick}>
        <sphereGeometry args={[Math.max(displayR * 1.3, 0.5), 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <CelestialBodyMesh
        body={body} radius={displayR} isOverview={isOverview} onClick={onClick}
        rotationPaused={isDetail ? rotationPaused : false}
        manualRotationRef={isDetail ? manualRotationRef : undefined}
        showAtmosphere={showAtmosphere}
      />
      {body.id === 'halley' && !isOverview && <CometTail radius={displayR} />}
      {isSelected && isOverview && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[displayR * 1.5, displayR * 1.75, 32]} />
          <meshBasicMaterial color="#88aaff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
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
  // Strip the ★ marker from display labels
  const displayName = body.nameJa.replace(' ★', '');
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSelected ? '#aaddff' : 'rgba(255,255,255,0.7)';
    ctx.fillText(displayName, 128, 38);
    return c;
  }, [displayName, isSelected]);

  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);

  return (
    <sprite ref={ref} position={[0, radius * 1.8 + 0.5, 0]} scale={[2.5, 0.65, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
};

// ── Star glow (generic — any star) ────────────────────────────────────────────
const StarGlow: React.FC<{ color: string; radius: number }> = ({ color, radius }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.10 + Math.sin(Date.now() * 0.001) * 0.04;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius * 2.5, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.10} side={THREE.FrontSide} depthWrite={false} />
    </mesh>
  );
};

// ── Moon orbit (detail view) ────────────────────────────────────────────────
const MoonOrbit: React.FC<{
  moon: CelestialBody;
  orbitRadius: number;
  initialAngle: number;
  onClick: () => void;
  isSelected: boolean;
  showAtmosphere?: boolean;
}> = ({ moon, orbitRadius, initialAngle, onClick, isSelected, showAtmosphere = true }) => {
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
      {/* Invisible hit sphere — generously sized for finger tapping */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[Math.max(moon.displayRadius * 7, 1.2), 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <CelestialBodyMesh body={moon} radius={Math.max(moon.displayRadius * 4, 0.18)} isOverview={false} onClick={onClick} showAtmosphere={showAtmosphere} />
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[moon.displayRadius * 4 * 1.4, moon.displayRadius * 4 * 1.7, 24]} />
          <meshBasicMaterial color="#88aaff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

// ── Main Scene (dynamic — works for any star system) ──────────────────────────
interface SceneProps {
  state: SolarSystemState;
  activityLevel: number;
  showAtmosphere: boolean;
}

const Scene: React.FC<SceneProps> = ({ state, activityLevel, showAtmosphere }) => {
  const bodies = state.currentSystem.bodies;
  const starBody = bodies[0]; // Always the central star
  const orbitBodies = bodies.slice(1);

  // Angle refs persistent across renders, keyed by body id
  const angleRefs = useRef<Record<string, React.MutableRefObject<number>>>({});
  bodies.forEach(b => {
    if (!angleRefs.current[b.id]) {
      angleRefs.current[b.id] = { current: b.orbitAngleOffset };
    }
  });

  // Zoom level for pinch-to-zoom (1.0 = default, <1 = zoomed-in, >1 = zoomed-out)
  const zoomRef = useRef(1.0);
  // Manual rotation accumulator (set by drag when rotation is paused)
  const manualRotationRef = useRef(0);
  // Ref mirror of obsRotationPaused — readable inside closures without re-registering handlers
  const rotationPausedRef = useRef(false);
  useEffect(() => { rotationPausedRef.current = state.obsRotationPaused; }, [state.obsRotationPaused]);

  // Reset zoom + manual rotation when a new body is selected
  const selectedId = state.selectedBodyId;
  useEffect(() => {
    zoomRef.current = 1.0;
    manualRotationRef.current = 0;
  }, [selectedId]);

  // The body centred in detail mode is the FOCUS body (parent when a child is selected)
  const focusBodies = state.focusBody?.children ?? [];

  return (
    <>
      <Stars />
      <PinchZoomController
        enabled={state.viewMode === 'detail'}
        zoomRef={zoomRef}
        manualRotationRef={manualRotationRef}
        rotationPausedRef={rotationPausedRef}
      />
      <CameraController
        viewMode={state.viewMode}
        targetRadius={
          state.moonDetailMode
            ? MOON_DETAIL_RADIUS
            : (state.focusBody?.displayRadius ?? state.selectedBody?.displayRadius ?? 0.5) * 4
        }
        systemId={state.currentSystemId}
        zoomRef={zoomRef}
      />

      {/* Orbit lines (overview only) */}
      {state.viewMode === 'overview' && orbitBodies.map(b =>
        b.type !== 'ASTEROID_BELT' && b.logOrbitRadius > 0 ? (
          <OrbitLine
            key={`orbit-${b.id}`}
            radius={b.logOrbitRadius}
            selected={state.selectedBodyId === b.id}
          />
        ) : null
      )}

      {/* Central star — hidden in detail mode when viewing a planet to prevent it from
           filling the frame. Lighting is provided by pointLight at origin regardless. */}
      {(state.viewMode === 'overview' || state.focusBodyId === starBody.id) && (
        <group>
          <CelestialBodyMesh
            body={starBody}
            isOverview={state.viewMode === 'overview'}
            onClick={() => state.enterDetail(starBody.id)}
            showAtmosphere={showAtmosphere}
          />
          {/* Solar flares + enhanced corona — toggled by atmosphere switch */}
          {showAtmosphere && <SolarFlares sunRadius={starBody.displayRadius} activityLevel={activityLevel} />}
          {showAtmosphere && state.viewMode === 'overview' && (
            <StarGlow color={starBody.colorMain} radius={starBody.displayRadius} />
          )}
          {state.viewMode === 'overview' && (
            <BodyLabel body={starBody} radius={starBody.displayRadius} isSelected={state.selectedBodyId === starBody.id} />
          )}
        </group>
      )}

      {/* Orbiting bodies — isDetail uses focusBodyId so the parent centres when a child is selected */}
      {orbitBodies.map(body => {
        const isSelected = state.focusBodyId === body.id;
        return (
          <OrbitingBody
            key={`${state.currentSystemId}-${body.id}`}
            body={body}
            isSelected={isSelected}
            viewMode={state.viewMode}
            angleRef={angleRefs.current[body.id] ?? { current: body.orbitAngleOffset }}
            onClick={() => state.enterDetail(body.id)}
            rotationPaused={isSelected && state.viewMode === 'detail' ? state.obsRotationPaused : false}
            manualRotationRef={isSelected && state.viewMode === 'detail' ? manualRotationRef : undefined}
            showAtmosphere={showAtmosphere}
          />
        );
      })}

      {/* Moon detail mode: render the selected moon centred at origin */}
      {state.moonDetailMode && state.selectedBody?.type === 'MOON' && (
        <group>
          <CelestialBodyMesh
            body={state.selectedBody}
            radius={MOON_DETAIL_RADIUS}
            isOverview={false}
            rotationPaused={state.obsRotationPaused}
            manualRotationRef={manualRotationRef}
            showAtmosphere={showAtmosphere}
          />
        </group>
      )}

      {/* Detail: show moons orbiting the focused planet (not active in moonDetailMode) */}
      {state.viewMode === 'detail' && !state.moonDetailMode && focusBodies.length > 0 && focusBodies.map((child, i) => {
        const moonAngle = (i / focusBodies.length) * Math.PI * 2;
        const moonR = (state.focusBody!.displayRadius) * 4 * (1.8 + i * 0.6);
        return (
          <MoonOrbit
            key={child.id}
            moon={child}
            orbitRadius={moonR}
            initialAngle={moonAngle}
            onClick={() => state.enterMoonDetail(child.id, state.focusBodyId!)}
            isSelected={state.selectedBodyId === child.id}
            showAtmosphere={showAtmosphere}
          />
        );
      })}

      {/* Lighting — flat mode removes directional shadow for observation/sketching */}
      <ambientLight intensity={state.obsFlatLight ? 1.15 : 0.07} />
      <pointLight
        position={[0, 0, 0]}
        intensity={state.obsFlatLight ? 0 : 5.0}
        color="#FFF5E0" distance={300} decay={1.0}
      />
      {!state.obsFlatLight && state.viewMode === 'detail' && !state.moonDetailMode && (
        <directionalLight position={[8, 2, 4]} intensity={1.6} color="#FFF8E8" />
      )}
      {!state.obsFlatLight && state.moonDetailMode && (
        <directionalLight position={[6, 1, 4]} intensity={1.8} color="#F0F4FF" />
      )}
      {!state.obsFlatLight && (
        <directionalLight position={[50, 30, 50]} intensity={0.15} color="#ffffff" />
      )}
    </>
  );
};

// ── Activity badge colors ────────────────────────────────────────────────────
const BADGE_COLOR: Record<FlareClass, string> = {
  A: '#22c55e', B: '#4ade80', C: '#eab308', M: '#f97316', X: '#ef4444', '?': '#6b7280',
};
const BADGE_BG: Record<FlareClass, string> = {
  A: '#14532d', B: '#166534', C: '#713f12', M: '#7c2d12', X: '#7f1d1d', '?': '#1f2937',
};

// ── Exported canvas component ────────────────────────────────────────────────
export const SolarSystemView: React.FC<{ state: SolarSystemState; showAtmosphere?: boolean }> = ({ state, showAtmosphere = true }) => {
  const weather          = useNoaaSpaceWeather();
  const isSun = state.viewMode === 'detail' && state.currentSystem.bodies[0]?.id === 'sun'
                && state.focusBodyId === 'sun';

  return (
    <div className="relative w-full h-full">
      <Canvas
        key={state.currentSystemId}
        camera={{ position: [0, 55, 32], fov: 42, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ width: '100%', height: '100%', background: '#020408' }}
      >
        <color attach="background" args={['#020408']} />
        <Scene state={state} activityLevel={weather.activityLevel} showAtmosphere={showAtmosphere} />
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

      {/* ── NOAA Solar Activity Badge (sun detail view only) ── */}
      {isSun && !weather.loading && (
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+200px)] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md"
            style={{
              background: BADGE_BG[weather.flareClass] + 'cc',
              borderColor: BADGE_COLOR[weather.flareClass] + '66',
            }}
          >
            {/* Pulsing dot */}
            <span
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
              style={{ background: BADGE_COLOR[weather.flareClass] }}
            />
            <span className="text-white/50 text-[10px] font-mono">現在の太陽活動</span>
            <span
              className="text-xs font-bold font-mono tracking-wider"
              style={{ color: BADGE_COLOR[weather.flareClass] }}
            >
              {weather.label}
            </span>
            {weather.flareClass === 'X' && (
              <span className="text-[10px] text-red-300 font-bold animate-pulse">⚠ 強フレア</span>
            )}
            {weather.flareClass === 'M' && (
              <span className="text-[10px] text-orange-300">中フレア</span>
            )}
            {weather.error && (
              <span className="text-[10px] text-white/30">（オフライン）</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
