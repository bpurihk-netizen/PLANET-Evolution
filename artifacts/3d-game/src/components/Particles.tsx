import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';

interface ParticlesProps {
  gameState: GameState;
}

export const Particles: React.FC<ParticlesProps> = ({ gameState }) => {
  const supernovaPointsRef = useRef<THREE.Points>(null);
  const rainPointsRef = useRef<THREE.Points>(null);

  const SUPERNOVA_COUNT = 5000;
  const RAIN_COUNT = 1000;

  // Initialize geometries and materials
  const [snPositions, snVelocities, snColors] = useMemo(() => {
    const pos = new Float32Array(SUPERNOVA_COUNT * 3);
    const vel = new Float32Array(SUPERNOVA_COUNT * 3);
    const col = new Float32Array(SUPERNOVA_COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < SUPERNOVA_COUNT; i++) {
      // Start in a tight core
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.1; // near origin
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Explosive outward velocity
      const speed = 5 + Math.random() * 15;
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;

      color.setHSL(0.05 + Math.random() * 0.1, 1.0, 0.5 + Math.random() * 0.5); // gold/orange/white
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, vel, col];
  }, []);

  const [rainPositions] = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.1 + Math.random() * 0.5; // just above surface
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos];
  }, []);

  // Update loops
  useFrame((state, delta) => {
    const dt = delta * gameState.speedMultiplier;
    const time = gameState.time;

    // SUPERNOVA LOGIC
    if (supernovaPointsRef.current) {
      const positions = supernovaPointsRef.current.geometry.attributes.position.array as Float32Array;
      
      // Reset logic for cycle start
      if (time < 0.1) {
        for (let i = 0; i < SUPERNOVA_COUNT; i++) {
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          const speed = 5 + Math.random() * 15;
          snVelocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
          snVelocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
          snVelocities[i * 3 + 2] = Math.cos(phi) * speed;
          
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        }
      }

      const mat = supernovaPointsRef.current.material as THREE.PointsMaterial;
      
      if (time < 5) {
        // Explode outward
        for (let i = 0; i < SUPERNOVA_COUNT; i++) {
          positions[i * 3] += snVelocities[i * 3] * dt;
          positions[i * 3 + 1] += snVelocities[i * 3 + 1] * dt;
          positions[i * 3 + 2] += snVelocities[i * 3 + 2] * dt;
        }
        mat.opacity = 1.0 - (time / 5.0);
      } else if (time >= 5 && time < 20) {
        // Suck inward to form planet
        const suckSpeed = 10;
        for (let i = 0; i < SUPERNOVA_COUNT; i++) {
          const px = positions[i * 3];
          const py = positions[i * 3 + 1];
          const pz = positions[i * 3 + 2];
          
          // Move towards origin
          const dist = Math.sqrt(px*px + py*py + pz*pz);
          if (dist > 1.9) {
            positions[i * 3] -= (px / dist) * suckSpeed * dt;
            positions[i * 3 + 1] -= (py / dist) * suckSpeed * dt;
            positions[i * 3 + 2] -= (pz / dist) * suckSpeed * dt;
          }
        }
        // Fade out
        mat.opacity = 1.0 - ((time - 5) / 15.0);
      } else {
        mat.opacity = 0;
      }
      
      supernovaPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // RAIN LOGIC
    if (rainPointsRef.current) {
      const mat = rainPointsRef.current.material as THREE.PointsMaterial;
      if (time >= 30 && time < 50) {
        mat.opacity = (time > 35 && time < 45) ? 0.6 : 0.2; // Fade in and out
        const positions = rainPointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < RAIN_COUNT; i++) {
          // move inward towards center
          const px = positions[i * 3];
          const py = positions[i * 3 + 1];
          const pz = positions[i * 3 + 2];
          const dist = Math.sqrt(px*px + py*py + pz*pz);
          
          if (dist <= 2.0) {
            // reset
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.4;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
          } else {
            positions[i * 3] -= (px / dist) * 0.5 * dt;
            positions[i * 3 + 1] -= (py / dist) * 0.5 * dt;
            positions[i * 3 + 2] -= (pz / dist) * 0.5 * dt;
          }
        }
        rainPointsRef.current.geometry.attributes.position.needsUpdate = true;
      } else {
        mat.opacity = 0;
      }
    }
  });

  return (
    <group>
      {/* Supernova Particles */}
      <points ref={supernovaPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[snPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[snColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Rain Particles */}
      <points ref={rainPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[rainPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#aaddff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
