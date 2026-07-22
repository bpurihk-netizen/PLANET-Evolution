import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type Explosion = {
  id: number;
  pos: THREE.Vector3;
  time: number;
  color: THREE.Color;
  scale: number;
  isDead: boolean;
};

interface ExplosionSystemProps {
  explosionsRef: React.MutableRefObject<Explosion[]>;
}

const ExplosionMesh: React.FC<{ explosion: Explosion }> = ({ explosion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, () => {
      return new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(0.5 + Math.random() * 0.5);
    });
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: explosion.color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [explosion.color]);

  const torusMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: explosion.color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [explosion.color]);

  useFrame((_, delta) => {
    if (explosion.isDead) return;
    explosion.time += delta;

    if (explosion.time >= 1.0) {
      explosion.isDead = true;
      return;
    }

    const t = explosion.time;
    const currentScale = Math.sin(t * Math.PI) * 1.5;

    if (groupRef.current) {
      const children = groupRef.current.children;
      for (let i = 0; i < particles.length; i++) {
        const mesh = children[i] as THREE.Mesh;
        if (mesh) {
          mesh.position.copy(particles[i]).multiplyScalar(t * explosion.scale * 3.0);
          mesh.scale.setScalar(currentScale);
        }
      }
    }

    material.opacity = 1.0 - t;

    if (torusRef.current) {
      const s = 1 + t * 3;
      torusRef.current.scale.set(s, s, 1);
    }
    
    torusMaterial.opacity = Math.max(0, 0.8 - t * 2);
  });

  if (explosion.isDead) return null;

  return (
    <group position={explosion.pos}>
      <group ref={groupRef}>
        {particles.map((_, i) => (
          <mesh key={i} material={material}>
            <sphereGeometry args={[0.08, 4, 4]} />
          </mesh>
        ))}
      </group>
      <mesh ref={torusRef} material={torusMaterial}>
        <torusGeometry args={[0.4 * explosion.scale, 0.04, 4, 24]} />
      </mesh>
    </group>
  );
};

export const ExplosionSystem: React.FC<ExplosionSystemProps> = ({ explosionsRef }) => {
  useFrame(() => {
    for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
      if (explosionsRef.current[i].isDead) {
        explosionsRef.current.splice(i, 1);
      }
    }
  });

  return (
    <>
      {explosionsRef.current.map(ex => (
        !ex.isDead && <ExplosionMesh key={ex.id} explosion={ex} />
      ))}
    </>
  );
};
