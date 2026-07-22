import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec3 uColor1;   // ネビュラ主色
uniform vec3 uColor2;   // ネビュラ副色
uniform vec3 uColor3;   // 星雲中心色（明るい部分）
uniform float uSpeed;   // スクロール速度係数

varying vec2 vUv;

// ハッシュ関数
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// 2D ノイズ
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y
  );
}

// fBm (fractal Brownian motion)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.1;
    amplitude *= 0.48;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  // 縦スクロール（プレイヤーが前進する方向に合わせて上へ）
  float scroll = uTime * uSpeed * 0.04;
  
  // 2層の fBm でガス雲を作る
  float cloud1 = fbm(uv * 3.0 + vec2(scroll * 0.3, scroll));
  float cloud2 = fbm(uv * 5.0 + vec2(-scroll * 0.2, scroll * 1.3) + vec2(3.7, 1.2));
  
  // ドメインワーピング（雲が渦を巻く）
  vec2 warp = vec2(fbm(uv * 2.5 + scroll * 0.1), fbm(uv * 2.5 + vec2(5.2, 1.3) + scroll * 0.1));
  float warpedCloud = fbm(uv * 4.0 + warp * 1.2 + scroll * 0.5);
  
  // 最終的なネビュラ密度
  float nebula = cloud1 * 0.4 + cloud2 * 0.3 + warpedCloud * 0.3;
  nebula = smoothstep(0.3, 0.8, nebula);
  
  // 色のブレンド（密度に応じて）
  vec3 col = mix(uColor1 * 0.15, uColor2 * 0.4, nebula);
  col = mix(col, uColor3 * 0.7, nebula * nebula);
  
  // 周辺を暗くして中心を明るく（ビネット）
  float vignette = 1.0 - length((vUv - 0.5) * 1.4);
  col *= smoothstep(0.0, 0.6, vignette);
  
  // アルファ: 宇宙黒をベースに、ネビュラ部分だけ可視
  float alpha = nebula * 0.55 * vignette;
  
  gl_FragColor = vec4(col, alpha);
}
`;

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

  // ShaderMaterial を useMemo で生成
  const nebulaMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: theme.nebulaColor1 },
      uColor2: { value: theme.nebulaColor2 },
      uColor3: { value: new THREE.Color(1.0, 1.0, 1.0).multiplyScalar(0.3) },
      uSpeed: { value: theme.starSpeed },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [theme]);

  // 第2ネビュラプレーン用の別の uniforms を持つマテリアル
  const nebulaMat2 = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: theme.nebulaColor2 }, // 順序を逆にして変化をつける
      uColor2: { value: theme.nebulaColor1 },
      uColor3: { value: new THREE.Color(1.0, 1.0, 1.0).multiplyScalar(0.3) },
      uSpeed: { value: theme.starSpeed },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [theme]);

  useFrame((_, delta) => {
    nebulaMat.uniforms.uTime.value += delta;
    nebulaMat2.uniforms.uTime.value += delta;
    
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
      {/* ネビュラプレーン（最後尾の遠景） */}
      <mesh position={[0, 0, -28]} material={nebulaMat}>
        <planeGeometry args={[40, 30]} />
      </mesh>
      {/* 第2ネビュラプレーン（別の位置・別uniforms） */}
      <mesh position={[0, 0, -22]} rotation={[0, 0, 0.3]} material={nebulaMat2}>
        <planeGeometry args={[30, 25]} />
      </mesh>
    </>
  );
};
