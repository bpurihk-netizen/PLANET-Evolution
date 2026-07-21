import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';
import { Planet } from './Planet';
import { StarField } from './StarField';
import { Particles } from './Particles';

interface PlanetSceneProps {
  gameState: GameState;
}

const LightController: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  useFrame(() => {
    const time = gameState.time;
    if (!dirLightRef.current || !ambientLightRef.current) return;

    // Adjust lighting based on phase
    // Supernova: intense light
    // Formation/Cooling: darker, lit by lava
    // Water/Life/Civ: normal sun
    // Crisis: harsh red light
    // Collapse: dim

    let intensity = 1.0;
    let ambIntensity = 0.1;
    let color = new THREE.Color(0xffffff);

    if (time < 5) {
      intensity = 5.0 - (time); // Flash and fade
      ambIntensity = 2.0;
    } else if (time >= 5 && time < 35) {
      intensity = 0.5; // Dimmer during formation, planet glows itself
      ambIntensity = 0.1;
    } else if (time >= 35 && time < 90) {
      intensity = 1.5; // Normal sun
      ambIntensity = 0.2;
    } else if (time >= 90 && time < 100) {
      intensity = 2.0;
      ambIntensity = 0.3;
      color.setHex(0xffaa88); // Reddish/Orange harsh light
    } else if (time >= 100) {
      intensity = Math.max(0, 1.5 - (time - 100) * 0.2); // Fading out
      ambIntensity = Math.max(0.01, 0.2 - (time - 100) * 0.05);
    }

    dirLightRef.current.intensity = intensity;
    dirLightRef.current.color.copy(color);
    ambientLightRef.current.intensity = ambIntensity;
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

export const PlanetScene: React.FC<PlanetSceneProps> = ({ gameState }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#010008']} />
      
      <LightController gameState={gameState} />
      
      <StarField gameState={gameState} />
      <Planet gameState={gameState} />
      <Particles gameState={gameState} />

      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={3} 
        maxDistance={15}
        autoRotate={false} // We handle rotation on the planet itself
      />
    </Canvas>
  );
};
