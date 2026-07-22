import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OptionOrbsProps {
  orb1Ref: React.MutableRefObject<THREE.Vector3>;
  orb2Ref: React.MutableRefObject<THREE.Vector3>;
  powerRank: number;
}

const OrbMesh: React.FC<{ posRef: React.MutableRefObject<THREE.Vector3>; color: THREE.Color }> = ({ posRef, color }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.copy(posRef.current);
      ref.current.rotation.y = state.clock.elapsedTime * 3;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* 周回リング */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.04, 6, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <pointLight color={color} intensity={2} distance={2} />
    </group>
  );
};

export const OptionOrbs: React.FC<OptionOrbsProps> = ({ orb1Ref, orb2Ref, powerRank }) => {
  if (powerRank < 6) return null;
  return (
    <>
      <OrbMesh posRef={orb1Ref} color={new THREE.Color(0.4, 0.8, 1.0)} />
      {powerRank >= 7 && <OrbMesh posRef={orb2Ref} color={new THREE.Color(0.6, 0.4, 1.0)} />}
    </>
  );
};
