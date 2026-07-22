import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShooterEntity } from '../../hooks/useShooterState';

// 単一敵のコンポーネント
const EnemyMesh: React.FC<{ entity: ShooterEntity }> = ({ entity }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.copy(entity.pos);
      ref.current.rotation.y = state.clock.elapsedTime * (entity.type === 'disc' ? 2 : 0.5);
    }
  });

  if (entity.isDead) return null;

  const color = entity.type === 'scout'  ? new THREE.Color(1.0, 0.2, 0.2)
              : entity.type === 'heavy'  ? new THREE.Color(0.8, 0.1, 0.0)
              :                            new THREE.Color(0.8, 0.5, 0.0);

  return (
    <group ref={ref}>
      {entity.type === 'scout' && (
        <>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.4, 0.9, 5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.7} />
          </mesh>
          <pointLight color={color} intensity={1.5} distance={3} />
        </>
      )}
      {entity.type === 'heavy' && (
        <>
          <mesh>
            <boxGeometry args={[1.2, 0.3, 1.4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, -0.3]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} />
            <meshStandardMaterial color={new THREE.Color(1.0, 0.4, 0.0)} emissive={new THREE.Color(1.0, 0.4, 0.0)} emissiveIntensity={1} />
          </mesh>
          <pointLight color={color} intensity={2} distance={4} />
        </>
      )}
      {entity.type === 'disc' && (
        <>
          <mesh>
            <torusGeometry args={[0.6, 0.2, 8, 24]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.8} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial color={new THREE.Color(1.0, 0.8, 0.0)} emissive={new THREE.Color(1.0, 0.8, 0.0)} emissiveIntensity={2} />
          </mesh>
          <pointLight color={color} intensity={2} distance={3} />
        </>
      )}
    </group>
  );
};

interface EnemyShipsProps {
  enemiesRef: React.MutableRefObject<ShooterEntity[]>;
}

export const EnemyShips: React.FC<EnemyShipsProps> = ({ enemiesRef }) => {
  return (
    <>
      {enemiesRef.current.map(e => (
        <EnemyMesh key={e.id} entity={e} />
      ))}
    </>
  );
};