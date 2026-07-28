import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bullet } from '../../hooks/useShooterState';

const BulletMesh: React.FC<{ bullet: Bullet }> = ({ bullet }) => {
  const ref = useRef<THREE.Object3D>(null);
  const colorRef = useRef(new THREE.Color(1, 0.9, 0.2));

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.copy(bullet.pos);
    }
    // omega rainbow cycling
    if (bullet.type === 'omega' && ref.current) {
      const t = state.clock.elapsedTime * 3;
      colorRef.current.setHSL((t + bullet.id * 0.05) % 1, 1, 0.6);
      const mesh = ref.current as THREE.Mesh;
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.color.copy(colorRef.current);
      }
    }
  });

  if (bullet.isDead) return null;

  // ── Enemy bullets — bright red/danger look, clearly NOT collectible ─────────
  if (bullet.isEnemy) {
    if (bullet.type === 'mine') {
      return (
        <group ref={ref as React.RefObject<THREE.Group>}>
          {/* Dark red pulsing sphere */}
          <mesh>
            <sphereGeometry args={[0.20, 8, 8]} />
            <meshStandardMaterial
              color="#cc0022"
              emissive="#ff0033"
              emissiveIntensity={3.5}
              transparent opacity={0.92}
            />
          </mesh>
          {/* Danger spike ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.32, 0.038, 4, 12]} />
            <meshBasicMaterial color="#ff0044" transparent opacity={0.85} />
          </mesh>
          <pointLight color="#ff0033" intensity={2.5} distance={2.2} />
        </group>
      );
    }
    // Normal enemy bullet — sharp red capsule (looks like a shot, not a coin)
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <capsuleGeometry args={[0.055, 0.44, 4, 8]} />
        <meshBasicMaterial color={new THREE.Color(1.0, 0.07, 0.07)} />
      </mesh>
    );
  }

  // ── Player bullets ──────────────────────────────────────────────────────────
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
  if (bullet.type === 'ripple') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.04, 4, 12]} />
        <meshBasicMaterial color={new THREE.Color(0.7, 1.0, 0.1)} blending={THREE.AdditiveBlending} transparent />
      </mesh>
    );
  }
  if (bullet.type === 'backShot') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
        <meshBasicMaterial color={new THREE.Color(0.1, 1.0, 0.3)} />
      </mesh>
    );
  }
  if (bullet.type === 'vulcan') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <capsuleGeometry args={[0.02, 0.15, 4, 8]} />
        <meshBasicMaterial color={new THREE.Color(1.0, 1.0, 1.0)} />
      </mesh>
    );
  }
  if (bullet.type === 'scatter') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial color={new THREE.Color(1.0, 0.4, 0.8)} />
      </mesh>
    );
  }
  if (bullet.type === 'plasma') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <sphereGeometry args={[0.4, 10, 10]} />
        <meshStandardMaterial
          color={new THREE.Color(0.3, 0.1, 1.0)}
          emissive={new THREE.Color(0.5, 0.0, 1.0)}
          emissiveIntensity={3}
          transparent
          opacity={0.85}
        />
      </mesh>
    );
  }
  if (bullet.type === 'omega') {
    return (
      <mesh ref={ref as React.RefObject<THREE.Mesh>}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color={colorRef.current} />
      </mesh>
    );
  }

  // normal / twin — cyan capsule
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
