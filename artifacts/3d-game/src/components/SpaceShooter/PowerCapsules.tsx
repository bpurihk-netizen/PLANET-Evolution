import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PowerCapsule } from '../../hooks/useShooterState';

const CapsuleMesh: React.FC<{ capsule: PowerCapsule }> = ({ capsule }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.copy(capsule.pos);
      ref.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });
  if (capsule.isDead) return null;
  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[0.35]} />
        <meshStandardMaterial
          color={new THREE.Color(0.2, 1.0, 0.8)}
          emissive={new THREE.Color(0.0, 0.8, 0.6)}
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight color={new THREE.Color(0.2, 1.0, 0.8)} intensity={3} distance={2.5} />
    </group>
  );
};

export const PowerCapsules: React.FC<{
  capsulesRef: React.MutableRefObject<PowerCapsule[]>;
  count: number;
}> = ({ capsulesRef }) => {
  return (
    <>
      {capsulesRef.current.map(c => <CapsuleMesh key={c.id} capsule={c} />)}
    </>
  );
};
