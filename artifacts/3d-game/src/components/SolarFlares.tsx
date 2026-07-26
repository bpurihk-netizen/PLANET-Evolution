/**
 * SolarFlares.tsx — Realistic static solar corona + optical lens flare
 *
 * Layers:
 *  1. StaticCorona    — Fresnel-based glow shell (view-angle only, no time animation)
 *  2. Chromosphere    — thin H-alpha limb rim (Fresnel only, no time animation)
 *  3. SunLensflare    — Three.js camera-space optical lens flare (canvas-generated textures)
 *
 * All "animation" is optical (camera-angle driven), not shader time-based.
 * Bloom is handled by EffectComposer in SolarSystemView.tsx.
 */
import React, { useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';

// ── Shared vertex shader (Fresnel: N·V) ───────────────────────────────────────
const FRESNEL_VERT = `
varying vec3 vN;
varying vec3 vV;
void main(){
  vN = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// ── 1. Static Fresnel corona ───────────────────────────────────────────────────
// No uTime — glow changes only when the camera angle changes (physically correct).
const CORONA_FRAG = `
varying vec3 vN;
varying vec3 vV;
uniform float uActivity;
void main(){
  float fr = 1.0 - max(dot(vN, vV), 0.0);
  fr = pow(fr, 1.6);
  // Quiet sun: deep orange → amber limb
  // Active sun: warmer, more luminous (scales toward white-yellow)
  vec3 innerCol = mix(vec3(1.00, 0.38, 0.02), vec3(1.00, 0.68, 0.14), uActivity);
  vec3 outerCol = mix(vec3(1.00, 0.78, 0.22), vec3(1.00, 0.97, 0.62), uActivity);
  vec3 col = mix(innerCol, outerCol, fr);
  // Broader, brighter halo at high activity
  float a = fr * fr * (0.32 + 0.24 * uActivity);
  gl_FragColor = vec4(col, a);
}`;

const StaticCorona: React.FC<{ sunR: number; activity: number }> = ({ sunR, activity }) => {
  const uni = useMemo(() => ({ uActivity: { value: activity } }), []);
  uni.uActivity.value = activity;
  return (
    <mesh>
      <sphereGeometry args={[sunR * 1.65, 48, 48]} />
      <shaderMaterial
        vertexShader={FRESNEL_VERT}
        fragmentShader={CORONA_FRAG}
        uniforms={uni}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// ── 2. Static chromosphere (H-alpha limb) ─────────────────────────────────────
const CHROM_FRAG = `
varying vec3 vN;
varying vec3 vV;
uniform float uActivity;
void main(){
  float fr = 1.0 - max(dot(vN, vV), 0.0);
  fr = pow(fr, 5.5);
  // H-alpha crimson → warmer orange at high activity
  vec3 col = mix(vec3(0.96, 0.10, 0.08), vec3(1.0, 0.40, 0.16), uActivity * 0.7);
  float a = fr * (0.20 + 0.22 * uActivity);
  gl_FragColor = vec4(col, a);
}`;

const StaticChromosphere: React.FC<{ sunR: number; activity: number }> = ({ sunR, activity }) => {
  const uni = useMemo(() => ({ uActivity: { value: activity } }), []);
  uni.uActivity.value = activity;
  return (
    <mesh>
      <sphereGeometry args={[sunR * 1.022, 64, 64]} />
      <shaderMaterial
        vertexShader={FRESNEL_VERT}
        fragmentShader={CHROM_FRAG}
        uniforms={uni}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
};

// ── 3. Lens flare textures ────────────────────────────────────────────────────
/** Radial gradient disc — the main "sun glow" sprite. */
function makeGlowTexture(size: number, r: number, g: number, b: number): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0,  `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.15, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.5,  `rgba(${r},${g},${b},0.3)`);
  grad.addColorStop(1.0,  'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/** Hexagonal aperture ghost — mimics 6-blade camera aperture. */
function makeHexTexture(size: number): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const half = size / 2;
  ctx.save();
  ctx.translate(half, half);
  // Hex path
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    i === 0
      ? ctx.moveTo(Math.cos(a) * half * 0.95, Math.sin(a) * half * 0.95)
      : ctx.lineTo(Math.cos(a) * half * 0.95, Math.sin(a) * half * 0.95);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, half);
  grad.addColorStop(0.0, 'rgba(255,230,160,0.85)');
  grad.addColorStop(0.6, 'rgba(255,180,60,0.35)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
  return new THREE.CanvasTexture(c);
}

/** Thin ring — mimics circular aperture diffraction ring. */
function makeRingTexture(size: number, r: number, g: number, b: number): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const half = size / 2;
  ctx.beginPath();
  ctx.arc(half, half, half * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
  ctx.lineWidth = half * 0.12;
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

// ── 4. Lens flare scene object ────────────────────────────────────────────────
const SunLensflare: React.FC<{ sunR: number }> = ({ sunR }) => {
  const { scene } = useThree();

  const lensflare = useMemo(() => {
    const lf = new Lensflare();

    // ① Main warm glow — centred on sun, largest element
    const mainGlow = makeGlowTexture(512, 255, 235, 180);
    lf.addElement(new LensflareElement(mainGlow, sunR * 20, 0,
      new THREE.Color(1.0, 0.92, 0.68)));

    // ② Secondary soft halo — slightly smaller, same centre
    const halo = makeGlowTexture(256, 255, 190, 90);
    lf.addElement(new LensflareElement(halo, sunR * 10, 0.0,
      new THREE.Color(1.0, 0.75, 0.30)));

    // ③ Diffraction ring — centred
    const ring = makeRingTexture(256, 255, 220, 140);
    lf.addElement(new LensflareElement(ring, sunR * 14, 0.0,
      new THREE.Color(1.0, 0.88, 0.55)));

    // ④ Hexagonal aperture ghosts at increasing distances from sun → screen centre
    const hex = makeHexTexture(128);
    lf.addElement(new LensflareElement(hex, sunR * 3.2, 0.30,
      new THREE.Color(0.72, 0.55, 1.0)));
    lf.addElement(new LensflareElement(hex, sunR * 2.4, 0.50,
      new THREE.Color(1.0, 0.68, 0.28)));
    lf.addElement(new LensflareElement(hex, sunR * 1.8, 0.68,
      new THREE.Color(0.35, 0.80, 1.0)));
    lf.addElement(new LensflareElement(hex, sunR * 1.2, 0.85,
      new THREE.Color(0.90, 1.0, 0.60)));

    // ⑤ Bright point at the 1:1 reflection (lens axis mirror)
    const dot = makeGlowTexture(64, 255, 255, 255);
    lf.addElement(new LensflareElement(dot, sunR * 1.4, 1.0,
      new THREE.Color(0.85, 0.92, 1.0)));

    // Position at origin (sun is always at origin in this scene)
    lf.position.set(0, 0, 0);
    return lf;
  }, [sunR]);

  useEffect(() => {
    scene.add(lensflare);
    return () => {
      scene.remove(lensflare);
      lensflare.dispose();
    };
  }, [scene, lensflare]);

  return null;
};

// ── Public API ────────────────────────────────────────────────────────────────
export interface SolarFlaresProps {
  sunRadius: number;
  /** 0–1 NOAA activity level (default 0.2 = quiet sun) */
  activityLevel?: number;
}

export const SolarFlares: React.FC<SolarFlaresProps> = ({
  sunRadius,
  activityLevel = 0.2,
}) => (
  <group>
    <StaticCorona      sunR={sunRadius} activity={activityLevel} />
    <StaticChromosphere sunR={sunRadius} activity={activityLevel} />
    <SunLensflare      sunR={sunRadius} />
  </group>
);
