import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { GameState } from '../hooks/useGameState';

export const PlanetInterior: React.FC<{ gameState: GameState, clippingPlane: THREE.Plane }> = ({ gameState, clippingPlane }) => {
  const activePlanet = gameState.planets[gameState.activeIndex];
  const type = activePlanet.type;
  
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const mantleConvectionRef = useRef<THREE.InstancedMesh>(null);

  const MANTLE_BLOBS = 50;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const blobData = useMemo(() => {
    const data = [];
    for (let i = 0; i < MANTLE_BLOBS; i++) {
      data.push({
        angle: Math.random() * Math.PI * 2,
        r: 1.2 + Math.random() * 0.5,
        speed: 0.1 + Math.random() * 0.2,
        offset: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (innerCoreRef.current) {
      const pulse = 1.0 + Math.sin(time * (Math.PI * 2 / 1.5)) * 0.05;
      innerCoreRef.current.scale.setScalar(pulse);
    }
    
    if (mantleConvectionRef.current) {
      blobData.forEach((b, i) => {
        // Only show on the cut plane for visibility (x/y plane, z=0)
        const currentR = 1.2 + ((Math.sin(time * b.speed + b.offset) + 1) / 2) * 0.5;
        dummy.position.set(Math.cos(b.angle) * currentR, Math.sin(b.angle) * currentR, 0);
        dummy.scale.setScalar(0.15 + Math.sin(time * 2 + i) * 0.05);
        dummy.updateMatrix();
        mantleConvectionRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mantleConvectionRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (type === 'GAS GIANT') {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[1.8, 64, 64]} />
          <meshStandardMaterial color="#b87333" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.4, 64, 64]} />
          <meshStandardMaterial color="#8b4513" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#5c4033" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
      </group>
    );
  }

  if (type === 'BLACK HOLE') {
    return (
      <mesh>
        <sphereGeometry args={[1.9, 64, 64]} />
        <meshBasicMaterial color="black" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
    );
  }

  if (type === 'STAR/SUN') {
    return (
      <mesh>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshBasicMaterial color="#ffcc00" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
    );
  }

  // Standard rocky interior
  return (
    <group>
      {/* Ocean layer for Water World */}
      {type === 'WATER WORLD' && (
        <mesh>
          <sphereGeometry args={[1.95, 64, 64]} />
          <meshStandardMaterial color="#0044aa" transparent opacity={0.8} side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
        </mesh>
      )}
      
      {/* Mantle */}
      <mesh>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial color="#aa3300" emissive="#441100" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
      
      {/* Mantle Convection Blobs */}
      <instancedMesh ref={mantleConvectionRef} args={[undefined, undefined, MANTLE_BLOBS]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ff5500" emissive="#aa2200" />
      </instancedMesh>
      
      {/* Outer Core */}
      <mesh>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial color="#ff6600" emissive="#882200" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>

      {/* Inner Core */}
      <mesh ref={innerCoreRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffaa00" side={THREE.DoubleSide} clippingPlanes={[clippingPlane]} />
      </mesh>
      
      {/* Labels */}
      <Html position={[1.5, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-white/90 text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded border border-white/20 whitespace-nowrap">
          マントル対流
        </div>
      </Html>
      <Html position={[0.9, -0.6, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-amber-200 text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
          外核
        </div>
      </Html>
      <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-white text-xs font-bold bg-black/50 px-2 py-0.5 rounded border border-white/50 whitespace-nowrap">
          内核
        </div>
      </Html>
    </group>
  );
};
