import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';

export const Particles: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const supernovaPointsRef = useRef<THREE.Points>(null);
  const rainPointsRef = useRef<THREE.Points>(null);
  const firePointsRef = useRef<THREE.Points>(null);
  const icePointsRef = useRef<THREE.Points>(null);

  const SUPERNOVA_COUNT = 5000;
  const RAIN_COUNT = 1000;
  const FIRE_COUNT = 800;
  const ICE_COUNT = 800;

  const [snPositions, snVelocities, snColors] = useMemo(() => {
    const pos = new Float32Array(SUPERNOVA_COUNT * 3);
    const vel = new Float32Array(SUPERNOVA_COUNT * 3);
    const col = new Float32Array(SUPERNOVA_COUNT * 3);
    const color = new THREE.Color();
    for (let i = 0; i < SUPERNOVA_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.1; 
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const speed = 5 + Math.random() * 15;
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;
      color.setHSL(0.05 + Math.random() * 0.1, 1.0, 0.5 + Math.random() * 0.5); 
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
      const r = 2.1 + Math.random() * 0.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos];
  }, []);

  const [firePositions, fireVelocities] = useMemo(() => {
    const pos = new Float32Array(FIRE_COUNT * 3);
    const vel = new Float32Array(FIRE_COUNT * 3);
    for (let i = 0; i < FIRE_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.0;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      vel[i * 3] = Math.sin(phi) * Math.cos(theta);
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      vel[i * 3 + 2] = Math.cos(phi);
    }
    return [pos, vel];
  }, []);

  const [icePositions, iceVelocities] = useMemo(() => {
    const pos = new Float32Array(ICE_COUNT * 3);
    const vel = new Float32Array(ICE_COUNT * 3);
    for (let i = 0; i < ICE_COUNT; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      vel[i * 3] = -Math.sin(phi) * Math.cos(theta);
      vel[i * 3 + 1] = -Math.sin(phi) * Math.sin(theta);
      vel[i * 3 + 2] = -Math.cos(phi);
    }
    return [pos, vel];
  }, []);

  useFrame((state, delta) => {
    const p = gameState.planets[gameState.activeIndex];
    if (p.isPaused) return;

    const dt = delta * p.params.formationSpeed * gameState.globalSpeed;
    const time = p.time;

    // Supernova
    if (supernovaPointsRef.current) {
      const positions = supernovaPointsRef.current.geometry.attributes.position.array as Float32Array;
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
      if (time < 15) {
        for (let i = 0; i < SUPERNOVA_COUNT; i++) {
          positions[i * 3] += snVelocities[i * 3] * dt;
          positions[i * 3 + 1] += snVelocities[i * 3 + 1] * dt;
          positions[i * 3 + 2] += snVelocities[i * 3 + 2] * dt;
        }
        mat.opacity = 1.0 - (time / 15.0);
      } else if (time >= 15 && time < 80) {
        const suckSpeed = 10;
        for (let i = 0; i < SUPERNOVA_COUNT; i++) {
          const px = positions[i * 3];
          const py = positions[i * 3 + 1];
          const pz = positions[i * 3 + 2];
          const dist = Math.sqrt(px*px + py*py + pz*pz);
          if (dist > 1.9) {
            positions[i * 3] -= (px / dist) * suckSpeed * dt;
            positions[i * 3 + 1] -= (py / dist) * suckSpeed * dt;
            positions[i * 3 + 2] -= (pz / dist) * suckSpeed * dt;
          }
        }
        mat.opacity = 1.0 - ((time - 15) / 65.0);
      } else {
        mat.opacity = 0;
      }
      supernovaPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Rain
    if (rainPointsRef.current) {
      const mat = rainPointsRef.current.material as THREE.PointsMaterial;
      if (time >= 180 && time < 320 && p.type !== 'STAR/SUN' && p.type !== 'BLACK HOLE') {
        mat.opacity = (time > 200 && time < 300) ? 0.6 : 0.2; 
        const positions = rainPointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < RAIN_COUNT; i++) {
          const px = positions[i * 3];
          const py = positions[i * 3 + 1];
          const pz = positions[i * 3 + 2];
          const dist = Math.sqrt(px*px + py*py + pz*pz);
          if (dist <= 2.0) {
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

    // Fire Particles
    if (firePointsRef.current) {
      const mat = firePointsRef.current.material as THREE.PointsMaterial;
      const isFire = p.type === 'FIRE PLANET' || p.type === 'STAR/SUN';
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, isFire ? 0.8 : 0, 0.1);
      
      if (mat.opacity > 0.01) {
        const positions = firePointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < FIRE_COUNT; i++) {
          positions[i * 3] += fireVelocities[i * 3] * dt * 0.5;
          positions[i * 3 + 1] += fireVelocities[i * 3 + 1] * dt * 0.5;
          positions[i * 3 + 2] += fireVelocities[i * 3 + 2] * dt * 0.5;
          
          const dist = Math.sqrt(positions[i*3]**2 + positions[i*3+1]**2 + positions[i*3+2]**2);
          if (dist > 2.5) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.0;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
          }
        }
        firePointsRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Ice Particles
    if (icePointsRef.current) {
      const mat = icePointsRef.current.material as THREE.PointsMaterial;
      const isIce = p.type === 'ICE WORLD' || p.type === 'CRYSTAL PLANET';
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, isIce ? 0.8 : 0, 0.1);
      
      if (mat.opacity > 0.01) {
        const positions = icePointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < ICE_COUNT; i++) {
          positions[i * 3] += iceVelocities[i * 3] * dt * 0.2;
          positions[i * 3 + 1] += iceVelocities[i * 3 + 1] * dt * 0.2;
          positions[i * 3 + 2] += iceVelocities[i * 3 + 2] * dt * 0.2;
          
          const dist = Math.sqrt(positions[i*3]**2 + positions[i*3+1]**2 + positions[i*3+2]**2);
          if (dist < 2.0) {
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.5;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
          }
        }
        icePointsRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      <points ref={supernovaPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[snPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[snColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <points ref={rainPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rainPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#aaddff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <points ref={firePointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[firePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#ff5500" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <points ref={icePointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[icePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
};
