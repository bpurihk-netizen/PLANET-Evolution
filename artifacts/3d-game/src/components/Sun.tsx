import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SunProps {
  distanceParam: number; // 0-100
  binaryStarInfluence: number; // 0-100
}

export const Sun: React.FC<SunProps> = ({ distanceParam, binaryStarInfluence }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // distanceParam=0 → 太陽が近くて大きく見える
  // distanceParam=100 → 太陽が遠くて小さく見える
  const t = distanceParam / 100;

  // 固定方向: 左上 (-3, 4, -4) から (-6, 8, -20) まで
  const sunX = -3 - t * 3;
  const sunY = 4 + t * 4;
  const sunZ = -4 - t * 16;

  const sunScale = 0.8 + (1 - t) * 2.5;

  // 連星系の影響で青白く変化
  const bAmt = binaryStarInfluence / 100;
  const baseColor = new THREE.Color().lerpColors(new THREE.Color(1.0, 0.85, 0.4), new THREE.Color(0.6, 0.8, 1.0), bAmt);
  const emissiveColor = new THREE.Color().lerpColors(new THREE.Color(1.0, 0.85, 0.4), new THREE.Color(0.5, 0.7, 1.0), bAmt);
  const glowColor = new THREE.Color().lerpColors(new THREE.Color(1.0, 0.7, 0.2), new THREE.Color(0.4, 0.6, 1.0), bAmt);
  const glowEmissive = new THREE.Color().lerpColors(new THREE.Color(1.0, 0.6, 0.1), new THREE.Color(0.3, 0.5, 1.0), bAmt);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
      if (glowRef.current) {
        const s = 1.0 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
        glowRef.current.scale.setScalar(s);
      }
    }
  });

  return (
    <group position={[sunX, sunY, sunZ]}>
      {/* 太陽本体 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[sunScale, 32, 32]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={2.0}
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>
      {/* コロナ */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[sunScale * 1.4, 24, 24]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowEmissive}
          emissiveIntensity={0.8}
          transparent
          opacity={0.25}
          side={THREE.BackSide}
        />
      </mesh>
      {/* 点光源 */}
      <pointLight
        color={new THREE.Color(1.0, 0.9, 0.7)}
        intensity={3 * (1 - t * 0.6)}
        distance={60}
        decay={2}
      />
    </group>
  );
};
