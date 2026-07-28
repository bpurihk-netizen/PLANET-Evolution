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
    const t = state.clock.elapsedTime;
    groupRef.current.position.set(item.pos.x, item.pos.y + Math.sin(t * 3.5 + item.pos.x) * 0.14, item.pos.z);
    groupRef.current.rotation.y = t * 1.8;
    const pulse = 1 + Math.sin(t * 5) * 0.08;
    groupRef.current.scale.setScalar(pulse);
  });

  if (item.isDead) return null;

  return (
    <group ref={groupRef}>
      {/* Hexagonal coin disc — clearly different from round bullet spheres */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.14, 6]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={3}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>

      {/* Inner face inset */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.30, 0.30, 0.02, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.25} />
      </mesh>

      {/* Outer sparkle ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.64, 0.04, 6, 18]} />
        <meshBasicMaterial color={cfg.color} transparent opacity={0.75} />
      </mesh>

      {/* Four corner sparkle dots */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[
          Math.cos((i / 4) * Math.PI * 2) * 0.64,
          0,
          Math.sin((i / 4) * Math.PI * 2) * 0.64,
        ]}>
          <sphereGeometry args={[0.06, 5, 5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      <pointLight color={cfg.color} intensity={4.5} distance={3.5} />
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
