/**
 * SolarFlares.tsx — High-quality solar prominences, corona streamers & chromosphere
 *
 * Layers (back → front):
 *  1. EnhancedCorona     — FBM-noisy Fresnel shell (~1.6 × R)
 *  2. CoronaStreamers    — ~40 radial wisp quads imitating helmet streamers
 *  3. Chromosphere       — thin pinkish ring at limb (H-alpha style)
 *  4. ProminenceRibbon   — flat ribbon arches (6 prominences)
 *
 * All animation is GPU-side.  Geometry is created once per mount.
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Shared noise GLSL ─────────────────────────────────────────────────────────
const NOISE_GLSL = `
vec4 _m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 _perm(vec4 x){return _m289(((x*34.)+1.)*x);}
float snz(vec3 p){
  vec3 a=floor(p),d=p-a;d=d*d*(3.-2.*d);
  vec4 b=a.xxyy+vec4(0.,1.,0.,1.);
  vec4 k1=_perm(b.xyxy);vec4 k2=_perm(k1.xyxy+b.zzww);
  vec4 c=k2+a.zzzz;
  vec4 k3=_perm(c);vec4 k4=_perm(c+1.);
  vec4 o1=fract(k3*(1./41.));vec4 o2=fract(k4*(1./41.));
  vec4 o3=o2*d.z+o1*(1.-d.z);vec2 o4=o3.yw*d.x+o3.xz*(1.-d.x);
  return o4.y*d.y+o4.x*(1.-d.y);
}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*snz(p);p*=2.02;a*=.5;}return v;}
`;

// ── 1. Enhanced FBM Corona ─────────────────────────────────────────────────────
const CORONA_VERT = `
varying vec3 vN; varying vec3 vV;
void main(){
  vN=normalize(normalMatrix*normal);
  vec4 wp=modelMatrix*vec4(position,1.);
  vV=normalize(cameraPosition-wp.xyz);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;
const CORONA_FRAG = `
uniform float uTime;
uniform float uActivity;
varying vec3 vN; varying vec3 vV;
${NOISE_GLSL}
void main(){
  float fr=1.-max(dot(vN,vV),0.);fr=pow(fr,2.0);
  float n=fbm(vN*2.5+uTime*.03)*.5+.5;
  float n2=fbm(vN*5.5-uTime*.05)*.5+.5;
  float nm=n*.65+n2*.35;
  float breath=.9+.1*sin(uTime*.35);
  // Higher activity → hotter corona (more white-yellow, brighter)
  vec3 quietCol=mix(vec3(1.,.4,.03),vec3(1.,.88,.30),nm);
  vec3 activeCol=mix(vec3(1.,.65,.10),vec3(1.,.98,.60),nm);
  vec3 col=mix(quietCol,activeCol,uActivity);
  float baseA=0.22+0.12*nm;
  float a=fr*baseA*breath*(0.70+0.55*uActivity);
  gl_FragColor=vec4(col,a);
}`;

const EnhancedCorona: React.FC<{ sunR: number; activity: number }> = ({ sunR, activity }) => {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const uni = useMemo(() => ({ uTime: { value: 0 }, uActivity: { value: activity } }), [activity]);
  useFrame((_,dt) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value += dt;
      ref.current.uniforms.uActivity.value = activity;
    }
  });
  return (
    <mesh>
      <sphereGeometry args={[sunR * 1.65, 48, 48]} />
      <shaderMaterial ref={ref} vertexShader={CORONA_VERT} fragmentShader={CORONA_FRAG}
        uniforms={uni} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} side={THREE.BackSide} />
    </mesh>
  );
};

// ── 2. Corona Helmet Streamers ────────────────────────────────────────────────
// Long thin wisps (quads) radiating outward in the equatorial plane + mid-latitudes
const STREAMER_VERT = `
uniform float uTime;
attribute float aLen;   // 0 = base, 1 = tip
attribute float aSeed;
varying float vLen;
varying float vSeed;
void main(){
  vLen=aLen; vSeed=aSeed;
  // Slow lateral sway, max at tip
  vec3 pos=position;
  float sway=sin(uTime*0.20+aSeed*6.28)*aLen*0.07;
  pos.x+=sway;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
}`;
const STREAMER_FRAG = `
uniform float uTime;
uniform float uActivity;
varying float vLen;
varying float vSeed;
void main(){
  float breath=.88+.12*sin(uTime*.4+vSeed*3.1);
  vec3 col=mix(vec3(1.,.88,.45),vec3(1.,.96,.75),vLen);
  // Active sun → more visible, brighter streamers
  float a=(1.-vLen)*(1.-vLen)*(0.15+0.28*uActivity)*breath;
  gl_FragColor=vec4(col,a);
}`;

function buildStreamersGeo(sunR: number): THREE.BufferGeometry {
  const COUNT  = 42;
  const W      = sunR * 0.06;   // half-width at base
  const LMIN   = sunR * 0.7;
  const LMAX   = sunR * 1.8;
  const SEGS   = 8;

  const pos: number[] = [];
  const uvs: number[] = [];
  const lens: number[] = [];
  const seeds: number[] = [];
  const idx: number[] = [];

  const rng = (seed: number) => {
    // deterministic "random"
    let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let s = 0; s < COUNT; s++) {
    const seed   = s + 0.5;
    const az     = rng(seed * 1.1) * Math.PI * 2;
    const lat    = (rng(seed * 2.3) - 0.5) * Math.PI * 0.7; // ±63°
    const len    = LMIN + rng(seed * 3.7) * (LMAX - LMIN);
    // Direction of streamer: radial from sun centre at this az/lat
    const cosLat = Math.cos(lat);
    const dir    = new THREE.Vector3(
      cosLat * Math.cos(az),
      Math.sin(lat),
      cosLat * Math.sin(az),
    ).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = dir.clone().cross(up).normalize();
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);

    const vBase = dir.clone().multiplyScalar(sunR);

    for (let j = 0; j <= SEGS; j++) {
      const t = j / SEGS;
      const cx = vBase.x + dir.x * len * t;
      const cy = vBase.y + dir.y * len * t;
      const cz = vBase.z + dir.z * len * t;
      const hw = W * (1 - t * 0.8); // taper to tip
      const base = (s * (SEGS + 1) + j) * 2;
      pos.push(cx - right.x*hw, cy - right.y*hw, cz - right.z*hw);
      pos.push(cx + right.x*hw, cy + right.y*hw, cz + right.z*hw);
      uvs.push(t, 0, t, 1);
      lens.push(t, t);
      seeds.push(seed, seed);
      if (j < SEGS) {
        idx.push(base,base+1,base+2, base+1,base+3,base+2);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aLen',     new THREE.Float32BufferAttribute(lens, 1));
  geo.setAttribute('aSeed',    new THREE.Float32BufferAttribute(seeds, 1));
  geo.setIndex(idx);
  return geo;
}

const CoronaStreamers: React.FC<{ sunR: number; activity: number }> = ({ sunR, activity }) => {
  const ref  = useRef<THREE.ShaderMaterial>(null);
  const geo  = useMemo(() => buildStreamersGeo(sunR), [sunR]);
  const uni  = useMemo(() => ({ uTime: { value: 0 }, uActivity: { value: activity } }), [activity]);
  useFrame((_,dt) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value += dt;
      ref.current.uniforms.uActivity.value = activity;
    }
  });
  return (
    <mesh geometry={geo}>
      <shaderMaterial ref={ref}
        vertexShader={STREAMER_VERT} fragmentShader={STREAMER_FRAG}
        uniforms={uni} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ── 3. Chromosphere Ring (H-alpha pink limb) ──────────────────────────────────
const CHROM_VERT = `
varying vec3 vN; varying vec3 vV;
void main(){
  vN=normalize(normalMatrix*normal);
  vec4 wp=modelMatrix*vec4(position,1.);
  vV=normalize(cameraPosition-wp.xyz);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;
const CHROM_FRAG = `
uniform float uTime;
uniform float uActivity;
varying vec3 vN; varying vec3 vV;
${NOISE_GLSL}
void main(){
  float fr=1.-max(dot(vN,vV),0.);
  fr=pow(fr,4.5);
  float n=fbm(vN*8.+uTime*.06)*.5+.5;
  float pulse=.85+.15*sin(uTime*.8);
  // H-alpha pink/crimson; active sun adds bright flare spicules
  vec3 col=mix(vec3(.95,.15,.12),vec3(1.,.45,.25),n);
  vec3 flareCol=mix(col,vec3(1.,.7,.3),uActivity*0.5);
  float a=fr*(0.20+0.28*uActivity+0.10*n)*pulse;
  gl_FragColor=vec4(flareCol,a);
}`;

const Chromosphere: React.FC<{ sunR: number; activity: number }> = ({ sunR, activity }) => {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const uni = useMemo(() => ({ uTime: { value: 0 }, uActivity: { value: activity } }), [activity]);
  useFrame((_,dt) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value += dt;
      ref.current.uniforms.uActivity.value = activity;
    }
  });
  return (
    <mesh>
      <sphereGeometry args={[sunR * 1.025, 64, 64]} />
      <shaderMaterial ref={ref} vertexShader={CHROM_VERT} fragmentShader={CHROM_FRAG}
        uniforms={uni} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} side={THREE.FrontSide} />
    </mesh>
  );
};

// ── 4. Prominence Ribbons ─────────────────────────────────────────────────────
// Each prominence = a flat ribbon bent along a CatmullRom arch + a thin inner glow strip
const PROM_VERT = `
uniform float uTime;
uniform float uSeed;
uniform float uActivity;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vUv=uv;
  float arch=sin(uv.x*3.14159);
  vec3 p=position;
  // More turbulent at higher activity
  float speed=0.12+0.18*uActivity;
  float turb=fbm(p*1.8+uTime*speed+uSeed)*(0.10+0.10*uActivity)*arch;
  p+=normal*turb;
  float sway=sin(uTime*(0.15+0.12*uActivity)+uSeed*6.28)*arch*0.08;
  p.x+=sway; p.z+=sway*0.3;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const PROM_FRAG = `
uniform float uTime;
uniform float uSeed;
uniform float uActivity;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  float along=vUv.x;
  float arch=sin(along*3.14159);
  float rim =1.-abs(vUv.y*2.-1.);

  float speed=0.06+0.08*uActivity;
  vec2 nuv=vUv*vec2(4.,1.)+vec2(uTime*speed+uSeed,uTime*speed*.5);
  float n=fbm(vec3(nuv,uSeed))*.5+.5;
  float n2=fbm(vec3(nuv*2.1,uSeed+1.))*.5+.5;

  // Color: hot footpoints (yellow) → cool apex (crimson H-alpha)
  // Active sun adds flare brightening (white-yellow surge)
  vec3 footCol=mix(vec3(1.00,0.78,0.10),vec3(1.00,0.95,0.55),uActivity*0.6);
  vec3 midCol =vec3(1.00,0.35,0.05);
  vec3 apexCol=vec3(0.85,0.08,0.15);
  vec3 col=mix(footCol,midCol,arch*.6);
  col=mix(col,apexCol,arch*arch*(n*.4+.6));
  col=mix(col,col*1.4,n2*.3);

  float pulse  =0.80+0.20*sin(uTime*(0.50+0.30*uActivity)+uSeed*3.7);
  float flicker=0.92+0.08*sin(uTime*(3.10+1.5*uActivity)+uSeed*7.3);
  col*=pulse*flicker;

  float edgeA=arch*(0.5+0.5*arch);
  float rimA =pow(rim,0.7);
  // More opaque / larger at higher activity
  float a=edgeA*rimA*(0.60+0.30*uActivity+0.12*n)*pulse;
  gl_FragColor=vec4(col,a);
}`;

function spherePt(r: number, theta: number, phi: number): THREE.Vector3 {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

interface FlareCfg {
  seed:   number;
  theta:  number;   // longitude  (rad)
  phi:    number;   // colatitude (rad) — PI/2 = equator
  height: number;   // lift above surface (world units)
  spread: number;   // foot-to-foot gap (rad)
  width:  number;   // ribbon width (world units)
}

function buildRibbonGeo(sunR: number, cfg: FlareCfg): THREE.BufferGeometry {
  const { theta, phi, height, spread, width } = cfg;
  const SEGS = 32;
  const STRIPS = 2; // two ribbon layers slightly offset in angle for depth

  const allPos:  number[] = [];
  const allUvs:  number[] = [];
  const allNorm: number[] = [];
  const allIdx:  number[] = [];

  for (let strip = 0; strip < STRIPS; strip++) {
    const angleOff = (strip / STRIPS) * 0.18 - 0.09; // ±0.09 rad tilt per strip
    const foot1 = spherePt(sunR * 0.98, theta - spread * 0.5, phi + angleOff);
    const ctrl1 = spherePt(sunR + height * 0.55, theta - spread * 0.20, phi + angleOff * 0.5);
    const apex  = spherePt(sunR + height,         theta,                 phi + angleOff * 0.2);
    const ctrl2 = spherePt(sunR + height * 0.55, theta + spread * 0.20, phi + angleOff * 0.5);
    const foot2 = spherePt(sunR * 0.98, theta + spread * 0.5, phi + angleOff);
    const curve = new THREE.CatmullRomCurve3([foot1, ctrl1, apex, ctrl2, foot2]);
    const pts   = curve.getPoints(SEGS);
    const baseV = allPos.length / 3;

    for (let i = 0; i <= SEGS; i++) {
      const t   = i / SEGS;
      const pt  = pts[i];
      const rad = pt.clone().normalize(); // radial direction (from sun centre)
      const tan = i < SEGS
        ? pts[i + 1].clone().sub(pt).normalize()
        : pt.clone().sub(pts[i - 1]).normalize();
      const wDir = new THREE.Vector3().crossVectors(tan, rad).normalize();
      // Taper ribbon: full width at mid-arch, 40% at feet
      const arch = Math.sin(t * Math.PI);
      const hw   = width * (0.4 + 0.6 * arch) * 0.5;

      const v1 = pt.clone().addScaledVector(wDir, -hw);
      const v2 = pt.clone().addScaledVector(wDir,  hw);
      // Normal: average of ribbon normal (wDir×tan) and radial
      const nrm = new THREE.Vector3().crossVectors(wDir, tan).normalize();
      nrm.addScaledVector(rad, 0.3).normalize();

      allPos.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      allUvs.push(t, 0, t, 1);
      allNorm.push(nrm.x, nrm.y, nrm.z, nrm.x, nrm.y, nrm.z);

      if (i < SEGS) {
        const b = baseV + i * 2;
        allIdx.push(b, b+1, b+2, b+1, b+3, b+2);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(allPos,  3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(allUvs,  2));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(allNorm, 3));
  geo.setIndex(allIdx);
  return geo;
}

const ProminenceRibbon: React.FC<{ sunR: number; cfg: FlareCfg; activity: number }> = ({ sunR, cfg, activity }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geo    = useMemo(() => buildRibbonGeo(sunR, cfg), [sunR, cfg]);
  const uni    = useMemo(() => ({
    uTime:     { value: 0 },
    uSeed:     { value: cfg.seed },
    uActivity: { value: activity },
  }), [cfg.seed, activity]);
  useFrame((_,dt) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      matRef.current.uniforms.uActivity.value = activity;
    }
  });
  return (
    <mesh geometry={geo}>
      <shaderMaterial ref={matRef}
        vertexShader={PROM_VERT} fragmentShader={PROM_FRAG}
        uniforms={uni} transparent depthWrite={false}
        blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ── Public export ─────────────────────────────────────────────────────────────
export interface SolarFlaresProps {
  sunRadius: number;
  /** 0.0–1.0 activity level from NOAA (default 0.2 = quiet sun) */
  activityLevel?: number;
}

function buildConfigs(sunR: number): FlareCfg[] {
  // [theta, phi, heightRatio, spreadRad, widthRatio, seed]
  const SPECS: [number, number, number, number, number, number][] = [
    [0.72,  1.25, 0.40, 0.50, 0.30, 1.1],
    [2.31,  0.60, 0.56, 0.36, 0.26, 2.5],
    [3.95,  1.48, 0.31, 0.58, 0.22, 3.8],
    [5.50,  0.92, 0.64, 0.32, 0.28, 5.0],
    [1.48,  1.75, 0.26, 0.46, 0.20, 6.3],
    [4.20,  1.05, 0.48, 0.42, 0.24, 7.4],
  ];
  return SPECS.map(([theta, phi, hR, spread, wR, seed]) => ({
    seed,
    theta,
    phi,
    height: sunR * hR,
    spread,
    width:  sunR * wR,
  }));
}

export const SolarFlares: React.FC<SolarFlaresProps> = ({ sunRadius, activityLevel = 0.2 }) => {
  const configs = useMemo(() => buildConfigs(sunRadius), [sunRadius]);
  return (
    <group>
      <EnhancedCorona    sunR={sunRadius} activity={activityLevel} />
      <CoronaStreamers   sunR={sunRadius} activity={activityLevel} />
      <Chromosphere      sunR={sunRadius} activity={activityLevel} />
      {configs.map((cfg, i) => (
        <ProminenceRibbon key={i} sunR={sunRadius} cfg={cfg} activity={activityLevel} />
      ))}
    </group>
  );
};
