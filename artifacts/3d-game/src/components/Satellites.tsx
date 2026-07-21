import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SatellitesProps {
  satelliteCount: number; // 0-5
  planetRadius: number;   // Base radius of the planet mesh
  planetPosition: [number, number, number];
  isActive: boolean;
  zoomLevel: number;
}

export const Satellites: React.FC<SatellitesProps> = ({ satelliteCount, planetRadius, planetPosition, isActive, zoomLevel }) => {
  // Pre-calculate satellite orbital mechanics
  const satellitesData = useMemo(() => {
    return [
      { radius: planetRadius * 2.3, speed: 0.6, size: planetRadius * 0.12, inclination: 5, phase: Math.random() * Math.PI * 2 },
      { radius: planetRadius * 3.2, speed: 0.4, size: planetRadius * 0.08, inclination: 15, phase: Math.random() * Math.PI * 2 },
      { radius: planetRadius * 4.1, speed: 0.25, size: planetRadius * 0.10, inclination: -8, phase: Math.random() * Math.PI * 2 },
      { radius: planetRadius * 5.0, speed: 0.15, size: planetRadius * 0.07, inclination: 25, phase: Math.random() * Math.PI * 2 },
      { radius: planetRadius * 6.0, speed: 0.10, size: planetRadius * 0.06, inclination: -20, phase: Math.random() * Math.PI * 2 },
    ];
  }, [planetRadius]);

  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    if (!isActive || zoomLevel === 2) return;
    for (let i = 0; i < satelliteCount; i++) {
      if (refs.current[i]) {
        refs.current[i]!.rotation.y += delta * satellitesData[i].speed;
      }
    }
  });

  // Only show for the active planet and not in interior view
  if (!isActive || zoomLevel === 2 || satelliteCount === 0) return null;

  return (
    <group position={planetPosition}>
      {satellitesData.slice(0, satelliteCount).map((sat, i) => (
        <group 
          key={i} 
          ref={el => refs.current[i] = el}
          rotation={[sat.inclination * Math.PI / 180, sat.phase, 0]}
        >
          <mesh position={[sat.radius, 0, 0]}>
            <sphereGeometry args={[sat.size, 16, 16]} />
            <meshStandardMaterial 
              color={new THREE.Color(0.6, 0.6, 0.7)} 
              roughness={0.9} 
              metalness={0.1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
