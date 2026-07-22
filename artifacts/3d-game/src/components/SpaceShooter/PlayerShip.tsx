import { useRef, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerShipProps {
  posRef: MutableRefObject<THREE.Vector3>;
}

export const PlayerShip: React.FC<PlayerShipProps> = ({ posRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const engineRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
      // 移動方向に傾く（バンク効果）
      const dx = posRef.current.x - (groupRef.current.position.x || 0);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -dx * 0.3, 0.1);
    }
    // エンジン炎の脈動
    if (engineRef.current) {
      const s = 1.0 + Math.sin(state.clock.elapsedTime * 12) * 0.15;
      engineRef.current.scale.y = s;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 機体本体 */}
      <mesh>
        <coneGeometry args={[0.4, 1.0, 6]} />
        <meshStandardMaterial color={new THREE.Color(0.4, 0.7, 1.0)} emissive={new THREE.Color(0.1, 0.3, 0.6)} emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 左翼 */}
      <mesh position={[-0.6, 0, 0.2]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.6, 0.08, 0.4]} />
        <meshStandardMaterial color={new THREE.Color(0.3, 0.6, 0.9)} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* 右翼 */}
      <mesh position={[0.6, 0, 0.2]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.6, 0.08, 0.4]} />
        <meshStandardMaterial color={new THREE.Color(0.3, 0.6, 0.9)} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* エンジン炎 */}
      <mesh ref={engineRef} position={[0, 0, 0.7]}>
        <coneGeometry args={[0.15, 0.5, 8]} />
        <meshBasicMaterial color={new THREE.Color(0.3, 0.7, 1.0)} transparent opacity={0.8} />
      </mesh>
      {/* コックピット光 */}
      <pointLight color={new THREE.Color(0.3, 0.7, 1.0)} intensity={2} distance={3} />
    </group>
  );
};