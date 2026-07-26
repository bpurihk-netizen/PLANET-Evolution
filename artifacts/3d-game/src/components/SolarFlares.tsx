/**
 * SolarFlares.tsx
 * Renders solar prominences (arch-shaped flares) + an enhanced corona around the Sun.
 * All animation is GPU-side (shader uniforms) to stay light on mobile.
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Shared noise helpers (GLSL) ───────────────────────────────────────────────
const NOISE_GLSL = `
vec4 mod289v(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permV(vec4 x){return mod289v(((x*34.)+1.)*x);}
float snoise3(vec3 p){
  vec3 a=floor(p),d=p-a;
  d=d*d*(3.-2.*d);
  vec4 b=a.xxyy+vec4(0.,1.,0.,1.);
  vec4 k1=permV(b.xyxy);
  vec4 k2=permV(k1.xyxy+b.zzww);
  vec4 c=k2+a.zzzz;
  vec4 k3=permV(c);
  vec4 k4=permV(c+1.);
  vec4 o1=fract(k3*(1./41.));
  vec4 o2=fract(k4*(1./41.));
  vec4 o3=o2*d.z+o1*(1.-d.z);
  vec2 o4=o3.yw*d.x+o3.xz*(1.-d.x);
  return o4.y*d.y+o4.x*(1.-d.y);
}
`;

// ── Flare shaders ─────────────────────────────────────────────────────────────
const FLARE_VERT = `
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv    = uv;
  vNormal = normalize(normalMatrix * normal);
  // Slow lateral wiggle, strongest at arch apex (sin of u*PI)
  float arch   = sin(uv.x * 3.14159);
  float wiggle = sin(uTime * 0.18 + uSeed * 6.283) * arch * 0.10;
  vec3  pos    = position + normal * wiggle;
  gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FLARE_FRAG = `
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  // uv.x goes 0→1 from foot1 to foot2; arch peaks at 0.5
  float arch  = sin(vUv.x * 3.14159);         // 0 at feet, 1 at apex
  float rim   = 1.0 - abs(vUv.y * 2.0 - 1.0); // 0 at tube edge, 1 at centre

  // Color: bright yellow-orange at feet → deep crimson at apex
  vec3 footCol = vec3(1.00, 0.72, 0.08);
  vec3 apexCol = vec3(0.90, 0.12, 0.01);
  vec3 col     = mix(footCol, apexCol, arch * 0.9);

  // Slow pulse + fast flicker
  float pulse   = 0.82 + 0.18 * sin(uTime * 0.55 + uSeed * 3.71);
  float flicker = 0.93 + 0.07 * sin(uTime * 2.40 + uSeed * 8.13);
  col *= pulse * flicker;

  // Alpha: opaque in mid-arch, transparent at feet, thin at tube rim
  float alpha = arch * rim * 0.88 * pulse;
  gl_FragColor = vec4(col, alpha);
}
`;

// ── Corona shaders ────────────────────────────────────────────────────────────
const CORONA_VERT = `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vNormal  = normalize(normalMatrix * normal);
  vec4 wp  = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CORONA_FRAG = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewDir;
${NOISE_GLSL}
void main() {
  // Fresnel rim: bright at glancing angles
  float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
  fresnel = pow(fresnel, 2.2);

  // Slow FBM noise to break up the plain glow
  float n = snoise3(vNormal * 2.8 + uTime * 0.035) * 0.5 + 0.5;
  float n2 = snoise3(vNormal * 5.5 - uTime * 0.055) * 0.5 + 0.5;
  float noisy = n * 0.7 + n2 * 0.3;

  // Gentle breath
  float breath = 0.88 + 0.12 * sin(uTime * 0.4);

  vec3 col   = mix(vec3(1.0, 0.45, 0.04), vec3(1.0, 0.90, 0.35), noisy);
  float alpha = fresnel * (0.20 + 0.10 * noisy) * breath;

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Geometry helpers ──────────────────────────────────────────────────────────
/** Point on a sphere of radius r at colatitude phi (0=N pole, PI/2=equator) and longitude theta */
function spherePt(r: number, theta: number, phi: number): THREE.Vector3 {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

interface FlareCfg {
  seed:       number;
  theta:      number;   // longitude  (rad)
  phi:        number;   // colatitude (rad) — PI/2 = equator
  height:     number;   // apex lift above surface (world units)
  spread:     number;   // foot-to-foot angular gap (rad)
  tubeR:      number;   // tube cross-section radius (world units)
}

function buildArchGeometry(sunR: number, cfg: FlareCfg): THREE.TubeGeometry {
  const { theta, phi, height, spread } = cfg;
  const foot1 = spherePt(sunR * 0.99, theta - spread * 0.5, phi);
  const ctrl1 = spherePt(sunR + height * 0.55, theta - spread * 0.18, phi);
  const apex  = spherePt(sunR + height,         theta,                 phi);
  const ctrl2 = spherePt(sunR + height * 0.55, theta + spread * 0.18, phi);
  const foot2 = spherePt(sunR * 0.99, theta + spread * 0.5, phi);
  const curve = new THREE.CatmullRomCurve3([foot1, ctrl1, apex, ctrl2, foot2]);
  return new THREE.TubeGeometry(curve, 24, cfg.tubeR, 7, false);
}

// ── Single flare arc ──────────────────────────────────────────────────────────
const FlareArc: React.FC<{ sunR: number; cfg: FlareCfg }> = ({ sunR, cfg }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => buildArchGeometry(sunR, cfg), [sunR, cfg]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSeed: { value: cfg.seed },
  }), [cfg.seed]);

  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={FLARE_VERT}
        fragmentShader={FLARE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// ── Enhanced FBM Corona ───────────────────────────────────────────────────────
const EnhancedCorona: React.FC<{ sunR: number }> = ({ sunR }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += dt;
  });
  return (
    <mesh>
      <sphereGeometry args={[sunR * 1.60, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={CORONA_VERT}
        fragmentShader={CORONA_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// ── SolarFlares — public API ──────────────────────────────────────────────────
export interface SolarFlaresProps {
  sunRadius: number;
}

/** Deterministic flare layout — 6 prominences at varied latitudes/longitudes */
function buildConfigs(sunR: number): FlareCfg[] {
  // [theta, phi, heightRatio, spreadRad, tubeRatio, seed]
  const SPECS: [number, number, number, number, number, number][] = [
    [0.72,  1.25, 0.38, 0.52, 0.040, 1.1],
    [2.31,  0.58, 0.52, 0.38, 0.048, 2.5],
    [3.95,  1.48, 0.29, 0.60, 0.033, 3.8],
    [5.50,  0.92, 0.60, 0.34, 0.052, 5.0],
    [1.48,  1.75, 0.24, 0.48, 0.030, 6.3],
    [4.20,  1.05, 0.44, 0.44, 0.044, 7.4],
  ];
  return SPECS.map(([theta, phi, hR, spread, tR, seed]) => ({
    seed,
    theta,
    phi,
    height:  sunR * hR,
    spread,
    tubeR:   sunR * tR,
  }));
}

export const SolarFlares: React.FC<SolarFlaresProps> = ({ sunRadius }) => {
  const configs = useMemo(() => buildConfigs(sunRadius), [sunRadius]);
  return (
    <group>
      <EnhancedCorona sunR={sunRadius} />
      {configs.map((cfg, i) => (
        <FlareArc key={i} sunR={sunRadius} cfg={cfg} />
      ))}
    </group>
  );
};
