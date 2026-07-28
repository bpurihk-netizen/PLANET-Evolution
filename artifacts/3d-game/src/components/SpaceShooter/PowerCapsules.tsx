import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PowerCapsule } from '../../hooks/useShooterState';

// Classic Gradius-style "P" power capsule — pill-shaped, teal/cyan, clearly distinct from items
const CapsuleMesh: React.FC<{ capsule: PowerCapsule }> = ({ capsule }) => {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.copy(capsule.pos);
      ref.current.rotation.y = state.clock.elapsedTime * 1.8;
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.12;
      glowRef.current.scale.setScalar(s);
    }
  });

  if (capsule.isDead) return null;

  return (
    <group ref={ref}>
      {/* Classic pill / capsule body */}
      <mesh>
        <capsuleGeometry args={[0.28, 0.38, 8, 16]} />
        <meshStandardMaterial
          color={new THREE.Color(0.0, 1.0, 0.78)}
          emissive={new THREE.Color(0.0, 0.7, 0.55)}
          emissiveIntensity={2.8}
          metalness={0.3}
          roughness={0.1}
        />
      </mesh>
      {/* Bright white inner core */}
      <mesh scale={[0.55, 0.55, 0.55]}>
        <capsuleGeometry args={[0.28, 0.38, 6, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
      </mesh>
      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.30, 0.04, 6, 20]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.9} />
      </mesh>
      {/* Pulsing outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.54, 8, 8]} />
        <meshBasicMaterial color={new THREE.Color(0.0, 1.0, 0.78)} transparent opacity={0.10} />
      </mesh>
      <pointLight color={new THREE.Color(0.0, 1.0, 0.78)} intensity={5} distance={3.2} />
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
