import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OptionOrbsProps {
  orb1Ref: React.MutableRefObject<THREE.Vector3>;
  orb2Ref: React.MutableRefObject<THREE.Vector3>;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  powerRank: number;
}

const OptionShipMesh: React.FC<{ posRef: React.MutableRefObject<THREE.Vector3>; playerPosRef: React.MutableRefObject<THREE.Vector3>; color: string }> = ({ posRef, playerPosRef, color }) => {
  const outerGroupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  const engineFlameL = useRef<THREE.Mesh>(null);
  const engineFlameR = useRef<THREE.Mesh>(null);
  const engineLightRef = useRef<THREE.PointLight>(null);
  const lineGeoRef = useRef<THREE.BufferGeometry>(null);

  const lastPosRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const currentPos = posRef.current;
    
    if (outerGroupRef.current) {
      outerGroupRef.current.position.copy(currentPos);
      const dx = (currentPos.x - lastPosRef.current.x) * 60;
      outerGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        outerGroupRef.current.rotation.z,
        -dx * 0.4,
        0.12
      );
    }
    
    if (innerGroupRef.current) {
      innerGroupRef.current.rotation.x = Math.sin(time * 2) * 0.005;
    }
    
    const pulse = Math.sin(time * 15) * 0.2;
    const s = 0.4 + pulse * 0.1;
    
    if (engineFlameL.current) {
      engineFlameL.current.scale.set(s, s, s);
    }
    if (engineFlameR.current) {
      engineFlameR.current.scale.set(s, s, s);
    }
    
    if (engineLightRef.current) {
      engineLightRef.current.intensity = 2.5 + pulse;
    }
    
    if (lineGeoRef.current) {
      lineGeoRef.current.setFromPoints([posRef.current, playerPosRef.current]);
    }

    lastPosRef.current.copy(currentPos);
  });

  return (
    <>
      <group ref={outerGroupRef} scale={[0.55, 0.55, 0.55]}>
        <group ref={innerGroupRef}>
          {/* Main Fuselage */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1.5, 16]} />
            <meshPhysicalMaterial color={color} metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Nose Cone */}
          <mesh position={[0, 0, -0.95]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.4, 16]} />
            <meshPhysicalMaterial color={color} metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>

          {/* Left Wing */}
          <mesh position={[-0.4, 0, 0.2]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[0.6, 0.05, 0.8]} />
            <meshPhysicalMaterial color={color} metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Right Wing */}
          <mesh position={[0.4, 0, 0.2]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.6, 0.05, 0.8]} />
            <meshPhysicalMaterial color={color} metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Left Rear Fin */}
          <mesh position={[-0.2, 0.15, 0.5]} rotation={[0.2, 0, -0.2]}>
            <boxGeometry args={[0.05, 0.3, 0.4]} />
            <meshPhysicalMaterial color={color} metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Right Rear Fin */}
          <mesh position={[0.2, 0.15, 0.5]} rotation={[0.2, 0, 0.2]}>
            <boxGeometry args={[0.05, 0.3, 0.4]} />
            <meshPhysicalMaterial color={color} metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Belly Thrusters */}
          <mesh position={[-0.1, -0.12, 0.3]}>
            <boxGeometry args={[0.1, 0.05, 0.2]} />
            <meshPhysicalMaterial color="#112244" metalness={0.95} roughness={0.05} />
          </mesh>
          <mesh position={[0.1, -0.12, 0.3]}>
            <boxGeometry args={[0.1, 0.05, 0.2]} />
            <meshPhysicalMaterial color="#112244" metalness={0.95} roughness={0.05} />
          </mesh>

          {/* Engine Nozzle Left */}
          <mesh position={[-0.25, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.06, 0.2, 12]} />
            <meshPhysicalMaterial color="#112244" metalness={0.95} roughness={0.05} />
          </mesh>
          
          {/* Engine Nozzle Right */}
          <mesh position={[0.25, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.06, 0.2, 12]} />
            <meshPhysicalMaterial color="#112244" metalness={0.95} roughness={0.05} />
          </mesh>
          
          {/* Engine Flame Left */}
          <mesh ref={engineFlameL} position={[-0.25, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]} scale={[0.4, 0.4, 0.4]}>
            <coneGeometry args={[0.06, 0.4, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} />
          </mesh>
          
          {/* Engine Flame Right */}
          <mesh ref={engineFlameR} position={[0.25, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]} scale={[0.4, 0.4, 0.4]}>
            <coneGeometry args={[0.06, 0.4, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} />
          </mesh>
          
          {/* Engine Light */}
          <pointLight ref={engineLightRef} color={color} intensity={2.5} distance={2.5} position={[0, 0, 0.8]} />
        </group>
      </group>
      
      {/* Energy Cord (Connection Line) */}
      <line>
        <bufferGeometry ref={lineGeoRef} />
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </line>
    </>
  );
};

export const OptionOrbs: React.FC<OptionOrbsProps> = ({ orb1Ref, orb2Ref, playerPosRef, powerRank }) => {
  if (powerRank < 6) return null;
  return (
    <>
      <OptionShipMesh posRef={orb1Ref} playerPosRef={playerPosRef} color="#0088ff" />
      {powerRank >= 7 && <OptionShipMesh posRef={orb2Ref} playerPosRef={playerPosRef} color="#8844ff" />}
    </>
  );
};
