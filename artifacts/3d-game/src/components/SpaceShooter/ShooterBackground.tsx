import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 背景テーマを決定する関数
const getBackgroundTheme = (temperature: number, waterAmount: number, co2: number, transformation: string) => {
  // 変形形態ごとの特別背景
  if (transformation === 'fractal') return {
    starColor: '#88bbff',
    nebulaColor1: new THREE.Color(0.1, 0.2, 0.8),
    nebulaColor2: new THREE.Color(0.3, 0.0, 0.9),
    starSpeed: 5, asteroidTint: new THREE.Color(0.2, 0.2, 0.6),
  };
  if (transformation === 'cyber') return {
    starColor: '#00ffff',
    nebulaColor1: new THREE.Color(0.0, 0.3, 0.5),
    nebulaColor2: new THREE.Color(0.0, 0.1, 0.4),
    starSpeed: 8, asteroidTint: new THREE.Color(0.0, 0.4, 0.3),
  };
  if (transformation === 'angel') return {
    starColor: '#ffffee',
    nebulaColor1: new THREE.Color(0.6, 0.5, 0.8),
    nebulaColor2: new THREE.Color(0.8, 0.7, 0.9),
    starSpeed: 4, asteroidTint: new THREE.Color(0.8, 0.8, 0.9),
  };

  // パラメーターベース
  if (temperature > 70) return {  // 高温: 赤いネビュラ
    starColor: '#ffaa66',
    nebulaColor1: new THREE.Color(0.5, 0.1, 0.0),
    nebulaColor2: new THREE.Color(0.4, 0.0, 0.0),
    starSpeed: 9, asteroidTint: new THREE.Color(0.5, 0.2, 0.0),
  };
  if (temperature < -50) return {  // 極寒: 青白い
    starColor: '#aaccff',
    nebulaColor1: new THREE.Color(0.0, 0.1, 0.5),
    nebulaColor2: new THREE.Color(0.1, 0.2, 0.8),
    starSpeed: 5, asteroidTint: new THREE.Color(0.3, 0.4, 0.6),
  };
  if (waterAmount > 80) return {  // 大洋: 深い青
    starColor: '#66aaff',
    nebulaColor1: new THREE.Color(0.0, 0.15, 0.5),
    nebulaColor2: new THREE.Color(0.0, 0.05, 0.35),
    starSpeed: 6, asteroidTint: new THREE.Color(0.1, 0.2, 0.4),
  };
  if (co2 > 70) return {  // CO2高: 黄色がかった不穏
    starColor: '#ddcc88',
    nebulaColor1: new THREE.Color(0.3, 0.2, 0.0),
    nebulaColor2: new THREE.Color(0.2, 0.15, 0.0),
    starSpeed: 7, asteroidTint: new THREE.Color(0.3, 0.25, 0.0),
  };
  // デフォルト: 標準の宇宙
  return {
    starColor: '#ffffff',
    nebulaColor1: new THREE.Color(0.15, 0.0, 0.4),
    nebulaColor2: new THREE.Color(0.0, 0.08, 0.35),
    starSpeed: 6, asteroidTint: new THREE.Color(0.4, 0.3, 0.2),
  };
};

interface ShooterBackgroundProps {
  temperature: number;
  waterAmount: number;
  co2: number;
  transformation: string;
}

export const ShooterBackground: React.FC<ShooterBackgroundProps> = ({
  temperature, waterAmount, co2, transformation
}) => {
  const starsRef = useRef<THREE.Points>(null);
  const theme = useMemo(
    () => getBackgroundTheme(temperature, waterAmount, co2, transformation),
    [temperature, waterAmount, co2, transformation]
  );

  const starGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const starCol = new THREE.Color(theme.starColor);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 42;
      // 少し色にばらつきを持たせる
      colors[i * 3]     = starCol.r * (0.7 + Math.random() * 0.3);
      colors[i * 3 + 1] = starCol.g * (0.7 + Math.random() * 0.3);
      colors[i * 3 + 2] = starCol.b * (0.7 + Math.random() * 0.3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [theme]);

  useFrame((_, delta) => {
    if (starsRef.current) {
      const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += delta * theme.starSpeed;
        if (positions[i + 2] > 7) positions[i + 2] -= 42;
      }
      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={starsRef} geometry={starGeo}>
        <pointsMaterial size={0.07} vertexColors transparent opacity={0.9} />
      </points>
      {/* ネビュラ1 */}
      <mesh position={[-4.5, 0, -18]}>
        <sphereGeometry args={[5.5, 12, 12]} />
        <meshBasicMaterial color={theme.nebulaColor1} transparent opacity={0.18} />
      </mesh>
      {/* ネビュラ2 */}
      <mesh position={[5.5, 0, -24]}>
        <sphereGeometry args={[6.5, 12, 12]} />
        <meshBasicMaterial color={theme.nebulaColor2} transparent opacity={0.14} />
      </mesh>
      {/* 遠景の漂う岩石（背景装飾） */}
      {[-3, 3, -1.5, 1.5, 0].map((x, i) => (
        <mesh key={i} position={[x, 0, -18 - i * 2]} rotation={[i, i * 0.5, 0]}>
          <icosahedronGeometry args={[0.3 + i * 0.15, 1]} />
          <meshBasicMaterial color={theme.asteroidTint} transparent opacity={0.3} />
        </mesh>
      ))}
    </>
  );
};
