import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';
import { Planet } from './Planet';
import { PlanetInterior } from './PlanetInterior';
import { StarField } from './StarField';
import { Particles } from './Particles';

const CameraController: React.FC<{ zoomLevel: number }> = ({ zoomLevel }) => {
  useFrame((state) => {
    // Active planet radius is 1.2
    // zoom=0 (Space): 5.0
    // zoom=1 (Surface): 1.6
    // zoom=2 (Interior): 3.0
    const targetZ = zoomLevel === 1 ? 1.6 : (zoomLevel === 2 ? 3.0 : 5.0);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
  });
  return null;
};

const LightController: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  useFrame(() => {
    const p = gameState.planets[gameState.activeIndex];
    const time = p.time;
    if (!dirLightRef.current || !ambientLightRef.current) return;

    let intensity = 1.5;
    let ambIntensity = 0.2;
    let color = new THREE.Color(0xffffff);

    if (time < 15) {
      intensity = 5.0 - (time / 3); 
      ambIntensity = 2.0;
    } else if (time >= 15 && time < 180) {
      intensity = 0.5;
      ambIntensity = 0.1;
    } else if (time >= 180 && time < 680) {
      intensity = 1.5;
      ambIntensity = 0.2;
    } else if (time >= 680 && time < 820) {
      intensity = 2.0;
      ambIntensity = 0.3;
      color.setHex(0xffaa88);
    } else if (time >= 820) {
      intensity = Math.max(0, 1.5 - (time - 820) * 0.05);
      ambIntensity = Math.max(0.01, 0.2 - (time - 820) * 0.01);
    }

    dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, intensity, 0.1);
    dirLightRef.current.color.lerp(color, 0.1);
    ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, ambIntensity, 0.1);
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.1} color="#ffffff" />
      <directionalLight
        ref={dirLightRef}
        position={[5, 3, 5]}
        intensity={1.5}
        color="#ffffff"
      />
    </>
  );
};

export const PlanetScene: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const clippingPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, localClippingEnabled: true }}
    >
      <color attach="background" args={['#030014']} />
      
      <CameraController zoomLevel={gameState.zoomLevel} />
      <LightController gameState={gameState} />
      
      <StarField gameState={gameState} />

      <group>
        {gameState.planets.map((p, index) => {
          const isActive = index === gameState.activeIndex;
          return (
            <Planet 
              key={p.id}
              planetState={p}
              gameState={gameState} 
              clippingPlane={clippingPlane}
              index={index}
              isActive={isActive}
            />
          );
        })}
        {gameState.zoomLevel === 2 && (
          <group scale={1.2 / 2.0}>
            <PlanetInterior gameState={gameState} clippingPlane={clippingPlane} />
          </group>
        )}
      </group>
      
      <group scale={1.2 / 2.0}>
        <Particles gameState={gameState} />
      </group>

      <OrbitControls 
        enablePan={false} 
        enableZoom={false}
        enableDamping={true}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        minDistance={1} 
        maxDistance={15}
        autoRotate={false}
      />
    </Canvas>
  );
};
