import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PlanetState } from '../hooks/useGameState';

export const SurfaceAnimations: React.FC<{ p: PlanetState }> = ({ p }) => {
  const isLife = p.time >= 320 && p.time < 500;
  const isCiv = p.time >= 500 && p.time < 820;
  const isCrisis = p.time >= 680 && p.time < 820;

  // 200 random points for LIFE
  const [lifePoints] = useMemo(() => {
    const pts = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.02; 
      pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pts[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pts[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pts];
  }, []);

  // 80 city light clusters
  const [cityPoints, cityScales] = useMemo(() => {
    const pts = new Float32Array(80 * 3);
    const scales = new Float32Array(80);
    for (let i = 0; i < 80; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.03;
      pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pts[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pts[i * 3 + 2] = r * Math.cos(phi);
      scales[i] = Math.random();
    }
    return [pts, scales];
  }, []);

  const lifeRef = useRef<THREE.Points>(null);
  const cityRef = useRef<THREE.Points>(null);
  const smokeRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (lifeRef.current) {
      const mat = lifeRef.current.material as THREE.PointsMaterial;
      mat.size = 0.05 + Math.sin(time * 3) * 0.02;
    }

    if (cityRef.current) {
      const mat = cityRef.current.material as THREE.PointsMaterial;
      mat.size = isCrisis ? 0.06 : 0.04 + Math.sin(time * 5) * 0.01;
      if (isCrisis) {
        mat.color.lerp(new THREE.Color('#ff0000'), 0.05);
      } else {
        mat.color.lerp(new THREE.Color('#FDE68A'), 0.05);
      }
    }
  });

  return (
    <group>
      {isLife && (
        <points ref={lifeRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[lifePoints, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#10b981" size={0.05} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      )}

      {(isCiv || isCrisis) && (
        <points ref={cityRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[cityPoints, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#FDE68A" size={0.04} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      )}
    </group>
  );
};

export const SurfaceLabels: React.FC<{ p: PlanetState }> = ({ p }) => {
  const isLife = p.time >= 320 && p.time < 500;
  const isCiv = p.time >= 500 && p.time < 820;
  const isCrisis = p.time >= 680 && p.time < 820;

  return (
    <group>
      {isLife && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-black/50 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 whitespace-nowrap animate-pulse">
            生命体が誕生
          </div>
        </Html>
      )}
      
      {isCiv && !isCrisis && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-black/50 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 whitespace-nowrap animate-pulse">
            文明が発展中
          </div>
        </Html>
      )}

      {isCrisis && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center gap-1">
            <div className="bg-red-900/80 text-white px-3 py-1 rounded-full text-xs font-bold border border-red-500 whitespace-nowrap animate-pulse">
              大気崩壊が進行中！
            </div>
            <div className="bg-red-900/80 text-white px-3 py-1 rounded-full text-[10px] font-bold border border-red-500 whitespace-nowrap">
              大量絶滅イベント！
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};