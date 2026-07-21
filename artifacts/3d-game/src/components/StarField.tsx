import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';

const STARS_COUNT = 3000;

export const StarField: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(STARS_COUNT * 3);
    const sz = new Float32Array(STARS_COUNT);
    const col = new Float32Array(STARS_COUNT * 3);
    
    const color = new THREE.Color();

    for (let i = 0; i < STARS_COUNT; i++) {
      // spherical distribution
      const r = 100 + Math.random() * 200;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      sz[i] = Math.random() * 1.5;

      // white / blueish / yellowish stars
      const cType = Math.random();
      if (cType > 0.9) color.setHex(0xaabfff); // blueish
      else if (cType > 0.7) color.setHex(0xffddaa); // yellowish
      else color.setHex(0xffffff); // white
      
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, sz, col];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02 * gameState.speedMultiplier;
      pointsRef.current.rotation.z += delta * 0.01 * gameState.speedMultiplier;
    }
  });

  // Base nebula shift slightly based on phase, though mostly static space background
  // We'll manage nebula feel with lighting and fog in the main scene.

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        sizeAttenuation={true}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
