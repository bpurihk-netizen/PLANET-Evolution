import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bullet } from '../../hooks/useShooterState';

const BulletMesh: React.FC<{ bullet: Bullet }> = ({ bullet }) => {
  const ref = useRef<THREE.Object3D>(null);
  
  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(bullet.pos);
    }
  });
  
  if (bullet.isDead) return null;

  if (bullet.type === 'laser') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <capsuleGeometry args={[0.04, 1.2, 4, 8]} />
        <meshBasicMaterial color={new THREE.Color(0.0, 1.0, 1.0)} />
      </mesh>
    );
  }
  if (bullet.type === 'missile') {
    return (
      <group ref={ref as React.RefObject<THREE.Group>}>
        <mesh>
          <coneGeometry args={[0.08, 0.5, 6]} />
          <meshStandardMaterial color={new THREE.Color(1.0, 0.6, 0.0)} emissive={new THREE.Color(1.0, 0.4, 0.0)} emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, 0, 0.3]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color={new THREE.Color(1.0, 0.8, 0.2)} />
        </mesh>
      </group>
    );
  }
  if (bullet.type === 'spread') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
        <meshBasicMaterial color={new THREE.Color(0.5, 0.9, 1.0)} />
      </mesh>
    );
  }
  if (bullet.type === 'special') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color={new THREE.Color(1.0, 0.9, 0.2)} />
      </mesh>
    );
  }
  
  // normal / twin
  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>}>
      <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
      <meshBasicMaterial color={new THREE.Color(0.3, 0.9, 1.0)} />
    </mesh>
  );
};

export const Projectiles: React.FC<{ bulletsRef: React.MutableRefObject<Bullet[]> }> = ({ bulletsRef }) => {
  return (
    <>
      {bulletsRef.current.map(b => <BulletMesh key={b.id} bullet={b} />)}
    </>
  );
};
