import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState, PlanetState } from '../hooks/useGameState';
import { PLANET_TYPE_IDS } from '../hooks/usePlanetParams';
import { SurfaceAnimations, SurfaceLabels } from './SurfaceAnimations';
import { transformations, FAILURE_TRANSFORMATIONS } from '../data/transformations';
import { Satellites } from './Satellites';

interface PlanetProps {
  planetState: PlanetState;
  gameState: GameState;
  clippingPlane: THREE.Plane;
  index: number;
  isActive: boolean;
}

const EFFECT_IDS: Record<string, number> = {
  retro: 1, ink: 2, cyber: 3, ghost: 4, angel: 5, fractal: 6, flower: 7, whitehole: 8, cracked: 9
};

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
  
  float formPhase = smoothstep(15.0, 30.0, phaseTime) * (1.0 - smoothstep(60.0, 80.0, phaseTime));
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

uniform vec3 uTransformColor;
uniform vec3 uTransformGlow;
uniform float uTransformBlend;
uniform int uTransformType;

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
    float wave = fbm(pos * 15.0 + time * 1.5);
    col = mix(vec3(0.0, 0.1, 0.3), vec3(0.2, 0.5, 0.9), terrain + wave * 0.3);
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

  float earlyLava = smoothstep(15.0, 40.0, phaseTime) * (1.0 - smoothstep(150.0, 180.0, phaseTime));
  float matureW = smoothstep(150.0, 180.0, phaseTime);
  float hidePlanetW = 1.0 - smoothstep(0.0, 15.0, phaseTime);
  float collapseW = smoothstep(820.0, 900.0, phaseTime);
  float crisisW = smoothstep(680.0, 750.0, phaseTime) * (1.0 - smoothstep(820.0, 900.0, phaseTime));

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

  vec3 baseColor = finalColor;
  vec3 tColor = uTransformColor;
  vec3 tGlow = uTransformGlow;

  if (uTransformBlend > 0.01) {
    if (uTransformType == 1) { // retro
      baseColor = floor(baseColor * 8.0) / 8.0;
      tColor = floor(tColor * 8.0) / 8.0;
    } else if (uTransformType == 2) { // ink
      float gray = dot(baseColor, vec3(0.299, 0.587, 0.114));
      float edge = smoothstep(0.4, 0.5, n1);
      baseColor = vec3(gray) * (1.0 - edge);
    } else if (uTransformType == 3) { // cyber
      if (mod(vUv.y * 100.0, 2.0) < 1.0) {
        baseColor *= 0.8;
        tColor *= 0.8;
      }
    } else if (uTransformType == 4) { // ghost
      baseColor = baseColor + vec3(0.3, 0.3, 0.6) * 0.5;
    } else if (uTransformType == 6) { // fractal
      baseColor *= fbm(vPosition * 10.0);
    } else if (uTransformType == 8) { // whitehole
      float d = length(vPosition.xy);
      tColor = mix(vec3(1.0), vec3(0.0), smoothstep(0.0, 1.5, d));
      tGlow = vec3(2.0) * (1.0 - d);
    } else if (uTransformType == 9) { // cracked
      float crack = smoothstep(0.0, 0.05, abs(fbm(vPosition * 20.0)));
      baseColor *= crack;
      tColor *= crack;
    }

    vec3 mixColor = mix(baseColor, tColor, uTransformBlend);

    if (uTransformType == 5) { // angel
       mixColor += vec3(1.0) * uTransformBlend; 
    } else if (uTransformType == 7) { // flower
       float c = cos(time);
       float s = sin(time);
       mat3 hueRot = mat3(
         0.213 + 0.787*c - 0.213*s, 0.715 - 0.715*c - 0.715*s, 0.072 - 0.072*c + 0.928*s,
         0.213 - 0.213*c + 0.143*s, 0.715 + 0.285*c + 0.140*s, 0.072 - 0.072*c - 0.283*s,
         0.213 - 0.213*c - 0.787*s, 0.715 - 0.715*c + 0.715*s, 0.072 + 0.928*c + 0.072*s
       );
       mixColor = mixColor * hueRot;
    }

    mixColor += tGlow * uTransformBlend * 0.5;
    finalColor = mixColor;
  }
  
  finalColor *= (1.0 - hidePlanetW);

  gl_FragColor = vec4(finalColor, 1.0 - hidePlanetW);
}
`;

const atmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragmentShader = `
varying vec3 vNormal;
varying vec3 vPosition;
uniform float phaseTime;
uniform int currentType;
uniform int prevType;
uniform float blendFactor;

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
  
  float matureW = smoothstep(150.0, 180.0, phaseTime) * (1.0 - smoothstep(820.0, 850.0, phaseTime));
  float crisisW = smoothstep(680.0, 750.0, phaseTime) * (1.0 - smoothstep(820.0, 900.0, phaseTime));
  
  atmColor = mix(vec3(0.5, 0.5, 0.5), atmColor, matureW);
  atmColor = mix(atmColor, vec3(0.4, 0.3, 0.1), crisisW);
  
  float clouds = fbm(vPosition * 3.0 + phaseTime * 0.05);
  atmColor = mix(atmColor, vec3(1.0), smoothstep(0.4, 0.7, clouds) * 0.5);
  
  float alpha = intensity * (matureW * 0.8 + 0.2); 
  
  float hide = (1.0 - smoothstep(15.0, 30.0, phaseTime)) + smoothstep(820.0, 900.0, phaseTime);
  alpha *= (1.0 - hide);

  if (currentType >= 9 || prevType >= 9) {
     alpha = intensity;
  }

  gl_FragColor = vec4(atmColor, alpha);
}
`;

export const Planet: React.FC<PlanetProps> = ({ planetState: p, gameState, clippingPlane, index, isActive }) => {
  const groupRef = useRef<THREE.Group>(null);
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const atmosMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const planetUniforms = useMemo(() => ({
    time: { value: 0 },
    phaseTime: { value: 0 },
    currentType: { value: 0 },
    prevType: { value: 0 },
    blendFactor: { value: 1.0 },
    uTransformColor: { value: new THREE.Color(1, 1, 1) },
    uTransformGlow: { value: new THREE.Color(0, 0, 0) },
    uTransformBlend: { value: 0.0 },
    uTransformType: { value: 0 }
  }), []);

  const atmosUniforms = useMemo(() => ({
    phaseTime: { value: 0 },
    currentType: { value: 0 },
    prevType: { value: 0 },
    blendFactor: { value: 1.0 },
  }), []);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    const currentP = gameState.planets[index];

    const t = transformations.find(t => t.id === currentP.transformation) || FAILURE_TRANSFORMATIONS.find(t => t.id === currentP.transformation);
    const tColor = t ? t.color : [1, 1, 1];
    const tGlow = t ? t.glowColor : [0, 0, 0];
    const effId = EFFECT_IDS[currentP.transformation] || 0;

    if (planetMaterialRef.current) {
      planetMaterialRef.current.uniforms.time.value = elapsed;
      planetMaterialRef.current.uniforms.phaseTime.value = currentP.time;
      planetMaterialRef.current.uniforms.currentType.value = PLANET_TYPE_IDS[currentP.type];
      planetMaterialRef.current.uniforms.prevType.value = PLANET_TYPE_IDS[currentP.prevType];
      planetMaterialRef.current.uniforms.blendFactor.value = currentP.typeBlend;
      
      planetMaterialRef.current.uniforms.uTransformColor.value.setRGB(tColor[0], tColor[1], tColor[2]);
      planetMaterialRef.current.uniforms.uTransformGlow.value.setRGB(tGlow[0], tGlow[1], tGlow[2]);
      planetMaterialRef.current.uniforms.uTransformBlend.value = currentP.transformationBlend;
      planetMaterialRef.current.uniforms.uTransformType.value = effId;
    }
    
    if (atmosMaterialRef.current) {
      atmosMaterialRef.current.uniforms.phaseTime.value = currentP.time;
      atmosMaterialRef.current.uniforms.currentType.value = PLANET_TYPE_IDS[currentP.type];
      atmosMaterialRef.current.uniforms.prevType.value = PLANET_TYPE_IDS[currentP.prevType];
      atmosMaterialRef.current.uniforms.blendFactor.value = currentP.typeBlend;
    }
    
    if (meshRef.current && !currentP.isPaused) {
      meshRef.current.rotation.y += delta * 0.1 * currentP.params.formationSpeed * gameState.globalSpeed;
    }

    if (groupRef.current) {
      let targetPos = new THREE.Vector3();
      let targetScale = 1.0;
      
      if (isActive) {
        targetPos.set(0, 0, 0);
        targetScale = 1.2 / 2.0;
      } else {
        const isRight = (gameState.activeIndex + 1) % 3 === index;
        targetPos.set(isRight ? 3.5 : -3.5, -0.5, -5);
        targetScale = 0.55 / 2.0;
      }

      groupRef.current.position.lerp(targetPos, 0.1);
      
      const currentScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
      groupRef.current.scale.setScalar(newScale);
    }
  });

  return (
    <group ref={groupRef} onClick={() => !isActive && gameState.setActiveIndex(index)}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, isActive ? 128 : 64, isActive ? 128 : 64]} />
        <shaderMaterial
          ref={planetMaterialRef}
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={planetUniforms}
          transparent
          clipping={true}
          clippingPlanes={[clippingPlane]}
        />
        {isActive && gameState.zoomLevel === 1 && <SurfaceAnimations p={p} />}
      </mesh>

      <mesh>
        <sphereGeometry args={[2.08, isActive ? 64 : 32, isActive ? 64 : 32]} />
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
      
      {isActive && gameState.zoomLevel === 1 && <SurfaceLabels p={p} />}

      {isActive && (
        <mesh>
          <sphereGeometry args={[2.15, 64, 64]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.05} 
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 衛星の描画 */}
      <Satellites 
        satelliteCount={p.params.satelliteCount}
        planetRadius={2.0} // Base sphere radius inside this group
        planetPosition={[0, 0, 0]}
        isActive={isActive}
        zoomLevel={gameState.zoomLevel}
      />
    </group>
  );
};
