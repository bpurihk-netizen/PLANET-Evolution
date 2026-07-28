import { useRef, useMemo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerShipProps {
  posRef: MutableRefObject<THREE.Vector3>;
  powerRank?: number;
}

const TRAIL_LENGTH = 50;

export const PlayerShip: React.FC<PlayerShipProps> = ({ posRef, powerRank = 0 }) => {
  const tier = powerRank >= 9 ? 3 : powerRank >= 6 ? 2 : powerRank >= 3 ? 1 : 0;
  const engineColors = ['#44aaff', '#00ffcc', '#cc44ff', '#ff88ff'] as const;
  const engineColor = engineColors[tier];
  const outerGroupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  
  const engineFlameL = useRef<THREE.Mesh>(null);
  const engineFlameR = useRef<THREE.Mesh>(null);
  const engineLightRef = useRef<THREE.PointLight>(null);
  
  const lastPosRef = useRef(new THREE.Vector3());
  
  const trailRef1 = useRef<THREE.BufferGeometry>(null);
  const trailRef2 = useRef<THREE.BufferGeometry>(null);
  const trailRef3 = useRef<THREE.BufferGeometry>(null);
  
  const history = useRef<THREE.Vector3[]>([]);
  
  useMemo(() => {
    const arr = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      arr.push(new THREE.Vector3(0, 0, 1000)); 
    }
    history.current = arr;
  }, []);

  const trailColors = useMemo(() => {
    const colors = new Float32Array(TRAIL_LENGTH * 3);
    const tierColorHex = ['#2266ff', '#00ffcc', '#aa44ff', '#ff88ff'];
    const baseColor = new THREE.Color(tierColorHex[tier]);
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const ratio = i / (TRAIL_LENGTH - 1); 
      colors[i * 3] = baseColor.r * ratio;
      colors[i * 3 + 1] = baseColor.g * ratio;
      colors[i * 3 + 2] = baseColor.b * ratio;
    }
    return colors;
  }, [tier]);

  const trailPositions1 = useMemo(() => new Float32Array(TRAIL_LENGTH * 3), []);
  const trailPositions2 = useMemo(() => new Float32Array(TRAIL_LENGTH * 3), []);
  const trailPositions3 = useMemo(() => new Float32Array(TRAIL_LENGTH * 3), []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const currentPos = posRef.current;
    
    let dx = 0;
    if (outerGroupRef.current) {
      outerGroupRef.current.position.copy(currentPos);
      dx = (currentPos.x - lastPosRef.current.x) * 60;
      outerGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        outerGroupRef.current.rotation.z,
        -dx * 0.4,
        0.12
      );
    }
    
    const moveDist = currentPos.distanceTo(lastPosRef.current);
    const speed = delta > 0 ? moveDist / delta : 0; 
    const enginePower = THREE.MathUtils.clamp(speed * 0.05, 0, 1);
    
    if (innerGroupRef.current) {
      innerGroupRef.current.rotation.x = Math.sin(time * 2) * 0.005;
    }
    
    const pulse = Math.sin(time * 15) * 0.2;
    const flameScaleZ = 1.0 + pulse + enginePower * 1.5;
    const flameScaleXY = 1.0 + pulse * 0.5;
    
    if (engineFlameL.current) {
      engineFlameL.current.scale.set(flameScaleXY, flameScaleXY, flameScaleZ);
    }
    if (engineFlameR.current) {
      engineFlameR.current.scale.set(flameScaleXY, flameScaleXY, flameScaleZ);
    }
    
    if (engineLightRef.current) {
      engineLightRef.current.intensity = 2.0 + (pulse + 0.2) * 3 + enginePower * 2;
    }
    
    history.current.shift();
    history.current.push(currentPos.clone());
    
    if (trailRef1.current && trailRef2.current && trailRef3.current) {
      const pos1 = trailRef1.current.attributes.position as THREE.BufferAttribute;
      const pos2 = trailRef2.current.attributes.position as THREE.BufferAttribute;
      const pos3 = trailRef3.current.attributes.position as THREE.BufferAttribute;
      
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const p = history.current[i];
        pos1.setXYZ(i, p.x, p.y, p.z + 0.2);
        pos2.setXYZ(i, p.x, p.y + 0.05, p.z + 0.2);
        pos3.setXYZ(i, p.x, p.y - 0.05, p.z + 0.2);
      }
      
      pos1.needsUpdate = true;
      pos2.needsUpdate = true;
      pos3.needsUpdate = true;
    }

    lastPosRef.current.copy(currentPos);
  });

  return (
    <>
      <group ref={outerGroupRef}>
        <group ref={innerGroupRef}>
          {/* Main Fuselage */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1.5, 16]} />
            <meshPhysicalMaterial color="#1a3a6a" metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Nose Cone */}
          <mesh position={[0, 0, -0.95]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.4, 16]} />
            <meshPhysicalMaterial color="#1a3a6a" metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Cockpit Glass Dome */}
          <mesh position={[0, 0.15, -0.2]} rotation={[-0.1, 0, 0]}>
            <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial 
              color="#88ccff" 
              transmission={0.65} 
              thickness={0.4} 
              roughness={0.0} 
              emissive="#224488" 
              emissiveIntensity={0.5} 
            />
          </mesh>
          <pointLight color="#88ccff" intensity={1} distance={2} position={[0, 0.2, -0.4]} />

          {/* Left Wing */}
          <mesh position={[-0.4, 0, 0.2]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[0.6, 0.05, 0.8]} />
            <meshPhysicalMaterial color="#1a3a6a" metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Right Wing */}
          <mesh position={[0.4, 0, 0.2]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.6, 0.05, 0.8]} />
            <meshPhysicalMaterial color="#1a3a6a" metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Left Rear Fin */}
          <mesh position={[-0.2, 0.15, 0.5]} rotation={[0.2, 0, -0.2]}>
            <boxGeometry args={[0.05, 0.3, 0.4]} />
            <meshPhysicalMaterial color="#1a3a6a" metalness={1.0} roughness={0.08} reflectivity={1.0} />
          </mesh>
          
          {/* Right Rear Fin */}
          <mesh position={[0.2, 0.15, 0.5]} rotation={[0.2, 0, 0.2]}>
            <boxGeometry args={[0.05, 0.3, 0.4]} />
            <meshPhysicalMaterial color="#1a3a6a" metalness={1.0} roughness={0.08} reflectivity={1.0} />
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
          <mesh ref={engineFlameL} position={[-0.25, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.06, 0.4, 8]} />
            <meshBasicMaterial color={engineColor} transparent opacity={0.85} />
          </mesh>
          
          {/* Engine Flame Right */}
          <mesh ref={engineFlameR} position={[0.25, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.06, 0.4, 8]} />
            <meshBasicMaterial color={engineColor} transparent opacity={0.85} />
          </mesh>
          
          {/* Engine Light */}
          <pointLight ref={engineLightRef} color={engineColor} intensity={2} distance={3} position={[0, 0, 0.8]} />

          {/* ── 強化ビジュアル tier 1 (rank 3+): ウィング先端ゴールドライト ── */}
          {tier >= 1 && (
            <>
              <mesh position={[-0.67, 0, 0.15]}>
                <sphereGeometry args={[0.07, 6, 6]} />
                <meshStandardMaterial color="#ffdd44" emissive="#ffcc00" emissiveIntensity={4} />
              </mesh>
              <mesh position={[0.67, 0, 0.15]}>
                <sphereGeometry args={[0.07, 6, 6]} />
                <meshStandardMaterial color="#ffdd44" emissive="#ffcc00" emissiveIntensity={4} />
              </mesh>
              <pointLight color="#ffcc00" intensity={1.8} distance={2.5} position={[0, 0.1, 0]} />
            </>
          )}

          {/* ── 強化ビジュアル tier 2 (rank 6+): サイドキャノン + エンジンリング ── */}
          {tier >= 2 && (
            <>
              <mesh position={[-0.52, -0.08, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.035, 0.55, 6]} />
                <meshPhysicalMaterial color="#5522bb" metalness={1} roughness={0.05} emissive="#4400aa" emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0.52, -0.08, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.035, 0.55, 6]} />
                <meshPhysicalMaterial color="#5522bb" metalness={1} roughness={0.05} emissive="#4400aa" emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0, 0, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.24, 0.028, 6, 22]} />
                <meshBasicMaterial color="#dd44ff" transparent opacity={0.9} />
              </mesh>
            </>
          )}

          {/* ── 強化ビジュアル tier 3 (rank 9+): オーラリング + 外殻グロー ── */}
          {tier >= 3 && (
            <>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.92, 0.045, 6, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.65} />
              </mesh>
              <mesh>
                <sphereGeometry args={[1.05, 8, 8]} />
                <meshBasicMaterial color="#4488ff" transparent opacity={0.045} />
              </mesh>
              <pointLight color="#00ffff" intensity={3} distance={4} position={[0, 0, 0]} />
            </>
          )}
        </group>
      </group>
      
      {/* Trails */}
      <line>
        <bufferGeometry ref={trailRef1}>
          <bufferAttribute attach="attributes-position" args={[trailPositions1, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.5} />
      </line>
      <line>
        <bufferGeometry ref={trailRef2}>
          <bufferAttribute attach="attributes-position" args={[trailPositions2, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.5} />
      </line>
      <line>
        <bufferGeometry ref={trailRef3}>
          <bufferAttribute attach="attributes-position" args={[trailPositions3, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.5} />
      </line>
    </>
  );
};
