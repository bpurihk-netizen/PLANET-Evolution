import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShooterEntity } from '../../hooks/useShooterState';

const AsteroidMesh: React.FC<{ asteroid: ShooterEntity }> = ({ asteroid }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.copy(asteroid.pos);
      ref.current.rotation.x += delta * 0.8;
      ref.current.rotation.z += delta * 0.5;
    }
  });
  if (asteroid.isDead) return null;
  const color = asteroid.hp > 1
    ? new THREE.Color(0.5, 0.4, 0.3)
    : new THREE.Color(0.7, 0.3, 0.1); // ダメージ時に赤くなる
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[asteroid.radius, 1]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
};

export const AsteroidField: React.FC<{ asteroidsRef: React.MutableRefObject<ShooterEntity[]> }> = ({ asteroidsRef }) => {
  return (
    <>
      {asteroidsRef.current.map(a => <AsteroidMesh key={a.id} asteroid={a} />)}
    </>
  );
};