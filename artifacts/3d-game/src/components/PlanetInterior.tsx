import React from 'react';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';

export const PlanetInterior: React.FC<{ gameState: GameState, clippingPlane: THREE.Plane }> = ({ gameState, clippingPlane }) => {
  const activePlanet = gameState.planets[gameState.activeIndex];
  const type = activePlanet.type;

  if (type === 'GAS GIANT') {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[1.8, 64, 64]} />
          <meshStandardMaterial color="#b87333" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.4, 64, 64]} />
          <meshStandardMaterial color="#8b4513" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#5c4033" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
      </group>
    );
  }

  if (type === 'BLACK HOLE') {
    return (
      <mesh>
        <sphereGeometry args={[1.9, 64, 64]} />
        <meshBasicMaterial color="black" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
    );
  }

  if (type === 'STAR/SUN') {
    return (
      <mesh>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshBasicMaterial color="#ffcc00" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
    );
  }

  // Standard rocky interior
  return (
    <group>
      {/* Ocean layer for Water World */}
      {type === 'WATER WORLD' && (
        <mesh>
          <sphereGeometry args={[1.95, 64, 64]} />
          <meshStandardMaterial color="#0044aa" transparent opacity={0.8} side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
      )}
      
      {/* Mantle */}
      <mesh>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial color="#aa3300" emissive="#441100" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
      
      {/* Outer Core */}
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial color="#ff6600" emissive="#882200" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>

      {/* Inner Core */}
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffaa00" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
    </group>
  );
};
