import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState } from '../hooks/useGameState';

interface PlanetProps {
  gameState: GameState;
}

// Complex planet shader to handle all phases via interpolation
const planetVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
uniform float time;
uniform float phaseTime;

// Simplex 3D Noise 
// by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0.0 + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  // Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

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

  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // Base position
  vec3 pos = position;
  
  // Add a slight "breathing" / shifting displacement based on noise for formation/molten phases
  float n = snoise(pos * 2.0 + time * 0.2);
  
  // Displacement amount
  // phaseTime represents time in cycle. 
  // Formation (5-20s): high displacement
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

// Colors
vec3 colSupernovaWhite = vec3(1.0, 1.0, 1.0);
vec3 colLava = vec3(0.9, 0.2, 0.0);
vec3 colRock = vec3(0.2, 0.2, 0.25);
vec3 colWaterDeep = vec3(0.05, 0.2, 0.6);
vec3 colWaterShallow = vec3(0.2, 0.5, 0.8);
vec3 colLife = vec3(0.1, 0.6, 0.2);
vec3 colDead = vec3(0.15, 0.15, 0.15);

// Noise functions (same as vertex)
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

void main() {
  float n1 = fbm(vPosition * 2.0); // Continents/elevation noise
  float n2 = fbm(vPosition * 5.0 + time * 0.05); // Detail noise
  
  // Combine noise for a rich terrain map
  float terrainMap = smoothstep(-0.2, 0.4, n1 + n2 * 0.3); // 0 = lowest, 1 = highest
  
  vec3 color = vec3(0.0);
  vec3 emissive = vec3(0.0);

  // SUPERNOVA (0-5s): Nothing to render for planet, but we can make it a tiny white dot that expands
  // FORMATION (5-20s): Lava
  // COOLING (20-35s): Lava -> Rock
  // WATER (35-50s): Rock -> Oceans
  // LIFE (50-70s): Rock -> Life (Green)
  // CIVILIZATION (70-90s): Life -> City Lights
  // CRISIS (90-100s): City Lights red, life dies, water recedes/changes
  // COLLAPSE (100-108s): Everything turns to dark rock
  
  float formationW = smoothstep(5.0, 15.0, phaseTime) * (1.0 - smoothstep(30.0, 40.0, phaseTime));
  float coolingW = smoothstep(20.0, 30.0, phaseTime) * (1.0 - smoothstep(40.0, 50.0, phaseTime));
  float waterW = smoothstep(35.0, 45.0, phaseTime) * (1.0 - smoothstep(100.0, 105.0, phaseTime));
  float lifeW = smoothstep(50.0, 60.0, phaseTime) * (1.0 - smoothstep(90.0, 100.0, phaseTime));
  float civW = smoothstep(70.0, 80.0, phaseTime) * (1.0 - smoothstep(100.0, 105.0, phaseTime));
  float crisisW = smoothstep(90.0, 95.0, phaseTime) * (1.0 - smoothstep(100.0, 108.0, phaseTime));
  float collapseW = smoothstep(100.0, 108.0, phaseTime);
  float hidePlanetW = 1.0 - smoothstep(0.0, 5.0, phaseTime); // Hidden during early supernova

  // Base rock layer
  vec3 rockColor = mix(colRock, colDead, collapseW);
  color = rockColor;
  
  // Lava layer
  float lavaMask = smoothstep(0.3, 0.6, n1 + n2*0.5) * formationW; 
  // Add some lava cracks during cooling
  lavaMask = max(lavaMask, smoothstep(0.7, 0.8, fbm(vPosition * 10.0)) * (1.0 - waterW));
  color = mix(color, colLava, lavaMask);
  emissive += colLava * lavaMask * 2.0;
  
  // Water layer (only in low terrain)
  float waterMask = (1.0 - smoothstep(0.3, 0.45, terrainMap)) * waterW;
  vec3 waterColor = mix(colWaterDeep, colWaterShallow, terrainMap / 0.4);
  // Crisis reduces water / changes color
  waterColor = mix(waterColor, vec3(0.1, 0.3, 0.3), crisisW * 0.5);
  color = mix(color, waterColor, waterMask);
  
  // Life layer (on land)
  float landMask = smoothstep(0.4, 0.5, terrainMap);
  float lifeMask = landMask * lifeW * (0.5 + 0.5 * fbm(vPosition * 8.0));
  color = mix(color, colLife, lifeMask);
  
  // Civilization lights (night side mostly, but we'll use a global mask for now)
  // Cluster around coasts/plains
  float civMask = smoothstep(0.45, 0.6, terrainMap) * smoothstep(0.6, 0.8, fbm(vPosition * 15.0)) * civW;
  vec3 civColor = mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.0, 0.0), crisisW); // Turn red during crisis
  emissive += civColor * civMask * 3.0;

  // Combine Lighting (simple directional + ambient)
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(dot(vNormal, lightDir), 0.0);
  float ambient = 0.1;
  vec3 finalColor = color * (diff + ambient) + emissive;
  
  // Early supernova fade-in
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

void main() {
  // Edge glow (fresnel)
  float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
  
  vec3 atmColor = vec3(0.3, 0.6, 1.0); // Earth-like blue
  
  float waterW = smoothstep(35.0, 45.0, phaseTime) * (1.0 - smoothstep(100.0, 105.0, phaseTime));
  float crisisW = smoothstep(90.0, 95.0, phaseTime) * (1.0 - smoothstep(100.0, 108.0, phaseTime));
  
  // Mix atmosphere based on phase
  // Pre-water: thin grey/white steam
  atmColor = mix(vec3(0.5, 0.5, 0.5), atmColor, waterW);
  // Crisis: toxic green/brown
  atmColor = mix(atmColor, vec3(0.4, 0.3, 0.1), crisisW);
  
  float alpha = intensity * (waterW * 0.8 + 0.2); // Thicker with water
  
  // Hide during supernova/collapse
  float hide = (1.0 - smoothstep(5.0, 10.0, phaseTime)) + smoothstep(100.0, 108.0, phaseTime);
  alpha *= (1.0 - hide);

  gl_FragColor = vec4(atmColor, alpha);
}
`;

export const Planet: React.FC<PlanetProps> = ({ gameState }) => {
  const planetMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const atmosMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const planetUniforms = useMemo(() => ({
    time: { value: 0 },
    phaseTime: { value: 0 },
  }), []);

  const atmosUniforms = useMemo(() => ({
    phaseTime: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    const elapsed = state.clock.getElapsedTime();
    if (planetMaterialRef.current) {
      planetMaterialRef.current.uniforms.time.value = elapsed;
      planetMaterialRef.current.uniforms.phaseTime.value = gameState.time;
    }
    if (atmosMaterialRef.current) {
      atmosMaterialRef.current.uniforms.phaseTime.value = gameState.time;
    }
    
    // Auto rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1 * gameState.speedMultiplier;
    }
  });

  return (
    <group>
      {/* Main Planet */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 128, 128]} />
        <shaderMaterial
          ref={planetMaterialRef}
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={planetUniforms}
          transparent
        />
      </mesh>

      {/* Atmosphere Glow */}
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
        />
      </mesh>
    </group>
  );
};
