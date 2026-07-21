import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';
import { PLANET_TYPE_IDS } from '../hooks/usePlanetParams';

interface PlanetProps {
  gameState: GameState;
  clippingPlane: THREE.Plane;
}

const planetVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
uniform float time;
uniform float phaseTime;

// Simplex 3D Noise 
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 1.0/7.0; 
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  vec3 pos = position;
  float n = snoise(pos * 2.0 + time * 0.2);
  
  float formPhase = smoothstep(5.0, 10.0, phaseTime) * (1.0 - smoothstep(15.0, 25.0, phaseTime));
  float disp = n * 0.2 * formPhase;
  
  pos += normal * disp;
  vPosition = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const planetFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform float time;
uniform float phaseTime; // 0 to 108
uniform int currentType;
uniform int prevType;
uniform float blendFactor;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 1.0/7.0; 
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

float fbm(vec3 x) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100);
  for (int i = 0; i < 5; ++i) {
    v += a * snoise(x);
    x = x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void getPlanetAppearance(int type, vec3 pos, float n1, float n2, float terrain, out vec3 col, out vec3 em) {
  col = vec3(0.5);
  em = vec3(0.0);
  
  if (type == 0) { // HABITABLE
    float land = smoothstep(0.4, 0.5, terrain);
    col = mix(vec3(0.05, 0.2, 0.6), vec3(0.1, 0.6, 0.2), land);
    float civ = smoothstep(0.6, 0.8, n1) * land;
    em = vec3(1.0, 0.8, 0.2) * civ * 1.5;
  } else if (type == 1) { // ICE
    float crack = smoothstep(0.4, 0.45, abs(fbm(pos * 15.0)));
    col = mix(vec3(0.8, 0.9, 1.0), vec3(0.4, 0.6, 0.9), crack);
  } else if (type == 2) { // WATER
    col = mix(vec3(0.0, 0.1, 0.3), vec3(0.1, 0.4, 0.8), terrain);
  } else if (type == 3) { // GREEN
    float land = smoothstep(0.2, 0.3, terrain);
    col = mix(vec3(0.1, 0.5, 0.7), vec3(0.1, 0.8, 0.3), land);
  } else if (type == 4) { // DESERT
    col = mix(vec3(0.8, 0.4, 0.1), vec3(0.9, 0.7, 0.3), terrain);
  } else if (type == 5) { // FIRE
    float lava = smoothstep(0.4, 0.6, n1 + n2);
    col = mix(vec3(0.1), vec3(0.8, 0.2, 0.0), lava);
    em = vec3(1.0, 0.3, 0.0) * lava * 2.0;
  } else if (type == 6) { // GAS
    float bands = fbm(vec3(pos.x * 2.0, pos.y * 15.0, pos.z * 2.0));
    col = mix(vec3(0.6, 0.3, 0.1), vec3(0.9, 0.7, 0.5), bands);
  } else if (type == 7) { // CRYSTAL
    float sharp = abs(fract(n1 * 5.0) - 0.5) * 2.0;
    col = mix(vec3(0.2, 0.0, 0.4), vec3(0.4, 0.8, 0.8), sharp);
    em = col * 0.5;
  } else if (type == 8) { // GLOWING
    col = vec3(0.05, 0.1, 0.05);
    float glow = smoothstep(0.5, 0.6, n1 * n2);
    em = vec3(0.2, 1.0, 0.5) * glow * 2.0;
  } else if (type == 9) { // BLACK HOLE
    col = vec3(0.0);
    float ring = smoothstep(0.05, 0.0, abs(pos.y)) * smoothstep(1.8, 2.0, length(pos.xz));
    em = vec3(1.0, 0.8, 0.5) * ring * 5.0;
  } else if (type == 10) { // STAR
    col = vec3(1.0, 0.8, 0.2);
    em = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.8), terrain) * 3.0;
  }
}

void main() {
  float n1 = fbm(vPosition * 2.0);
  float n2 = fbm(vPosition * 5.0 + time * 0.05);
  float terrainMap = smoothstep(-0.2, 0.4, n1 + n2 * 0.3);

  vec3 col1, em1, col2, em2;
  getPlanetAppearance(prevType, vPosition, n1, n2, terrainMap, col1, em1);
  getPlanetAppearance(currentType, vPosition, n1, n2, terrainMap, col2, em2);
  
  vec3 targetCol = mix(col1, col2, blendFactor);
  vec3 targetEm = mix(em1, em2, blendFactor);

  float earlyLava = smoothstep(5.0, 15.0, phaseTime) * (1.0 - smoothstep(30.0, 40.0, phaseTime));
  float matureW = smoothstep(35.0, 45.0, phaseTime);
  float hidePlanetW = 1.0 - smoothstep(0.0, 5.0, phaseTime);
  float collapseW = smoothstep(100.0, 108.0, phaseTime);
  float crisisW = smoothstep(90.0, 95.0, phaseTime) * (1.0 - smoothstep(100.0, 108.0, phaseTime));

  if (currentType >= 9 || prevType >= 9) {
      matureW = 1.0; 
      earlyLava = 0.0;
  }

  vec3 lavaCol = vec3(0.9, 0.2, 0.0);
  vec3 rockCol = vec3(0.2, 0.2, 0.25);
  
  vec3 currentCol = mix(rockCol, targetCol, matureW);
  currentCol = mix(currentCol, lavaCol, earlyLava * smoothstep(0.3, 0.6, n1 + n2));
  currentCol = mix(currentCol, vec3(0.1, 0.05, 0.05), crisisW * 0.5); 
  currentCol = mix(currentCol, vec3(0.15), collapseW);
  
  vec3 currentEm = mix(vec3(0.0), targetEm, matureW);
  currentEm += lavaCol * earlyLava * smoothstep(0.3, 0.6, n1 + n2) * 2.0;
  currentEm = mix(currentEm, vec3(1.0, 0.0, 0.0) * smoothstep(0.5, 0.8, n1), crisisW * matureW);

  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(dot(vNormal, lightDir), 0.0);
  float ambient = 0.1;
  vec3 finalColor = currentCol * (diff + ambient) + currentEm;
  
  finalColor *= (1.0 - hidePlanetW);

  gl_FragColor = vec4(finalColor, 1.0 - hidePlanetW);
}
`;


const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragmentShader = `
varying vec3 vNormal;
uniform float phaseTime;
uniform int currentType;
uniform int prevType;
uniform float blendFactor;

vec3 getAtmColor(int type) {
  if (type == 1) return vec3(0.8, 0.9, 1.0); // ICE
  if (type == 4) return vec3(0.8, 0.5, 0.2); // DESERT
  if (type == 5) return vec3(1.0, 0.2, 0.0); // FIRE
  if (type == 6) return vec3(0.7, 0.5, 0.3); // GAS
  if (type == 7) return vec3(0.4, 0.1, 0.6); // CRYSTAL
  if (type == 8) return vec3(0.1, 0.8, 0.4); // GLOWING
  if (type == 9) return vec3(0.0, 0.0, 0.0); // BLACK HOLE
  if (type == 10) return vec3(1.0, 0.6, 0.1); // STAR
  return vec3(0.3, 0.6, 1.0); // HABITABLE/WATER/GREEN
}

void main() {
  float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
  
  vec3 col1 = getAtmColor(prevType);
  vec3 col2 = getAtmColor(currentType);
  vec3 atmColor = mix(col1, col2, blendFactor);
  
  float matureW = smoothstep(35.0, 45.0, phaseTime) * (1.0 - smoothstep(100.0, 105.0, phaseTime));
  float crisisW = smoothstep(90.0, 95.0, phaseTime) * (1.0 - smoothstep(100.0, 108.0, phaseTime));
  
  atmColor = mix(vec3(0.5, 0.5, 0.5), atmColor, matureW);
  atmColor = mix(atmColor, vec3(0.4, 0.3, 0.1), crisisW);
  
  float alpha = intensity * (matureW * 0.8 + 0.2); 
  
  float hide = (1.0 - smoothstep(5.0, 10.0, phaseTime)) + smoothstep(100.0, 108.0, phaseTime);
  alpha *= (1.0 - hide);

  if (currentType >= 9 || prevType >= 9) {
     alpha = intensity;
  }

  gl_FragColor = vec4(atmColor, alpha);
}
`;

export const Planet: React.FC<PlanetProps> = ({ gameState, clippingPlane }) => {
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const atmosMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const planetUniforms = useMemo(() => ({
    time: { value: 0 },
    phaseTime: { value: 0 },
    currentType: { value: 0 },
    prevType: { value: 0 },
    blendFactor: { value: 1.0 },
  }), []);

  const atmosUniforms = useMemo(() => ({
    phaseTime: { value: 0 },
    currentType: { value: 0 },
    prevType: { value: 0 },
    blendFactor: { value: 1.0 },
  }), []);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const p = gameState.planets[gameState.activeIndex];

    if (planetMaterialRef.current) {
      planetMaterialRef.current.uniforms.time.value = elapsed;
      planetMaterialRef.current.uniforms.phaseTime.value = p.time;
      planetMaterialRef.current.uniforms.currentType.value = PLANET_TYPE_IDS[p.type];
      planetMaterialRef.current.uniforms.prevType.value = PLANET_TYPE_IDS[p.prevType];
      planetMaterialRef.current.uniforms.blendFactor.value = p.typeBlend;
    }
    
    if (atmosMaterialRef.current) {
      atmosMaterialRef.current.uniforms.phaseTime.value = p.time;
      atmosMaterialRef.current.uniforms.currentType.value = PLANET_TYPE_IDS[p.type];
      atmosMaterialRef.current.uniforms.prevType.value = PLANET_TYPE_IDS[p.prevType];
      atmosMaterialRef.current.uniforms.blendFactor.value = p.typeBlend;
    }
    
    if (meshRef.current && !p.isPaused) {
      meshRef.current.rotation.y += delta * 0.1 * p.params.formationSpeed * gameState.globalSpeed;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <shaderMaterial
          ref={planetMaterialRef}
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={planetUniforms}
          transparent
          clipping={true}
          clippingPlanes={[clippingPlane]}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[2.08, 64, 64]} />
        <shaderMaterial
          ref={atmosMaterialRef}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosUniforms}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          clipping={true}
          clippingPlanes={[clippingPlane]}
        />
      </mesh>
    </group>
  );
};
