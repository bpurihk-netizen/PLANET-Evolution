import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameItem, GameItemType } from '../../hooks/useShooterState';

// Color/appearance map per item type
const ITEM_CONFIG: Record<GameItemType, { color: string; emissive: string; label: string }> = {
  shield:     { color: '#44aaff', emissive: '#2266cc', label: '🛡' },
  bomb:       { color: '#ff3300', emissive: '#cc1100', label: '💣' },
  heal:       { color: '#22ff44', emissive: '#11aa22', label: '❤️' },
  speedBoost: { color: '#ffee00', emissive: '#bb9900', label: '⚡' },
  scoreBoost: { color: '#ffd700', emissive: '#aa8800', label: '⭐' },
  autoAim:    { color: '#ff6600', emissive: '#cc3300', label: '🎯' },
  magnet:     { color: '#cc44ff', emissive: '#882299', label: '🔮' },
  timeSlow:   { color: '#00ffcc', emissive: '#009966', label: '⏳' },
  barrier:    { color: '#ffffff', emissive: '#aaaacc', label: '🔰' },
  overdrive:  { color: '#ff44aa', emissive: '#cc1177', label: '🌟' },
};

const GameItemMesh: React.FC<{ item: GameItem }> = ({ item }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cfg = ITEM_CONFIG[item.itemType];

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(item.pos);
    groupRef.current.rotation.y = state.clock.elapsedTime * 2.5;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.12;
    groupRef.current.scale.setScalar(pulse);
  });

  if (item.isDead) return null;

  return (
    <group ref={groupRef}>
      {/* Diamond shape */}
      <mesh>
        <octahedronGeometry args={[0.38]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={2.5}
          transparent
          opacity={0.92}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.04, 6, 18]} />
        <meshBasicMaterial color={cfg.color} transparent opacity={0.6} />
      </mesh>
      <pointLight color={cfg.color} intensity={3} distance={3} />
    </group>
  );
};

interface GameItemsProps {
  gameItemsRef: React.MutableRefObject<GameItem[]>;
}

export const GameItems: React.FC<GameItemsProps> = ({ gameItemsRef }) => (
  <>
    {gameItemsRef.current.map(item => (
      <GameItemMesh key={item.id} item={item} />
    ))}
  </>
);
