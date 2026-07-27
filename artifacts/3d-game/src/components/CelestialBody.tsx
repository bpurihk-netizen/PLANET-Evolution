import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CelestialBody as CelestialBodyData } from '../data/celestialBodies';

// ── Shared noise functions (GLSL) ──────────────────────────────────────────
const NOISE_GLSL = `
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return mod289(((x*34.)+1.)*x);}
float noise(vec3 p){
  vec3 a=floor(p),d=p-a;
  d=d*d*(3.-2.*d);
  vec4 b=a.xxyy+vec4(0.,1.,0.,1.);
  vec4 k1=perm(b.xyxy);
  vec4 k2=perm(k1.xyxy+b.zzww);
  vec4 c=k2+a.zzzz;
  vec4 k3=perm(c);
  vec4 k4=perm(c+1.);
  vec4 o1=fract(k3*(1./41.));
  vec4 o2=fract(k4*(1./41.));
  vec4 o3=o2*d.z+o1*(1.-d.z);
  vec2 o4=o3.yw*d.x+o3.xz*(1.-d.x);
  return o4.y*d.y+o4.x*(1.-d.y);
}
float fbm(vec3 p){
  float v=0.,a=.5;
  for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02;a*=.5;}
  return v;
}
`;

// ── Vertex shader ──────────────────────────────────────────────────────────
const vertexShader = `
uniform float uTime;
uniform float uDisplace;
varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vUv=uv;
  vec3 p=position;
  if(uDisplace>0.0){
    float n=fbm(normalize(p)*3.0+uTime*0.05);
    p+=normal*n*uDisplace;
  }
  vPos=p;
  vNormal=normalize(normalMatrix*normal);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}
`;

// ── Fragment shaders per type ──────────────────────────────────────────────
// ── Realistic G-type star shader (Sun / Alpha Centauri A) ─────────────────
// Physical effects: limb darkening, granulation, supergranulation, sunspots, faculae
const FRAG_STAR = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}

void main(){
  vec3 n = normalize(vPos);

  // ── 1. Limb darkening (most important realism feature) ──────────────────
  // mu = cosine of angle between surface normal and camera direction (view-space)
  // Center of disk: mu ≈ 1 (normal faces camera) → bright, hot, white-yellow
  // Limb of disk:   mu ≈ 0 (normal grazes camera) → dark, cool, orange-red
  float mu = clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  // Solar limb darkening law: I(mu) = 1 - u*(1-mu), u≈0.6 for 5800K G-star
  float ld = 1.0 - 0.62 * (1.0 - mu);

  // ── 2. Color temperature gradient ───────────────────────────────────────
  // Center ~5800K: near-white with warm tint  rgb(1.00, 0.97, 0.86)
  // Limb   ~4200K: deep orange-red           rgb(0.95, 0.40, 0.06)
  vec3 centerCol = vec3(1.00, 0.97, 0.86);
  vec3 limbCol   = vec3(0.95, 0.40, 0.06);
  vec3 col = mix(limbCol, centerCol, pow(mu, 0.45));
  col *= ld * 1.15 + 0.02;

  // ── 3. Supergranulation (large-scale convective cells, ~30Mm, very slow) ─
  float superG = fbm(n * 3.8 + vec3(uTime * 0.0025, 0.0, 0.0));
  col *= 0.90 + superG * 0.13;

  // ── 4. Solar granulation (convection cells ~1Mm, bright centres/dark lanes) ─
  float gran  = fbm(n * 24.0 + vec3(uTime * 0.022, 0.0, 0.0));
  float gran2 = fbm(n * 48.0 - vec3(uTime * 0.014, 0.0, 0.0));
  float granMask = smoothstep(0.36, 0.64, gran + gran2 * 0.30);
  // Bright granule cores (hot rising plasma) vs dark intergranular lanes (cooling descent)
  col *= mix(0.76, 1.10, granMask);

  // ── 5. Sunspots (active regions near equator, magnetic flux suppresses convection) ─
  float equatorBias = clamp(1.0 - abs(n.y) * 2.6, 0.0, 1.0);
  float spotA = fbm(n * 3.1 + vec3(29.3, 7.5, 14.1));
  float spotB = fbm(n * 6.2 + vec3(14.1, 29.3, 7.5));
  // Penumbra: moderately dark outer ring
  float penumbra = smoothstep(0.630, 0.660, spotA * equatorBias);
  // Umbra: very dark magnetic core
  float umbra    = smoothstep(0.660, 0.685, spotB * equatorBias * spotA);
  col = mix(col, col * 0.52, penumbra * 0.60);
  col = mix(col, col * 0.20, umbra    * 0.82);

  // ── 6. Faculae (bright active regions; most visible near limb) ──────────
  float faculaeBase = smoothstep(0.595, 0.625, spotA) * (1.0 - penumbra);
  float limbFactor  = pow(1.0 - mu, 1.2);  // Faculae more visible at limb
  col += vec3(0.10, 0.055, 0.012) * faculaeBase * limbFactor * 1.3;

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

const FRAG_EARTH = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  // Terrain
  float t=fbm(n*3.0);
  float t2=fbm(n*6.0+vec3(10.0));
  float land=smoothstep(0.45,0.55,t+t2*0.2);
  // Ocean: deep blue to light blue
  vec3 ocean=mix(vec3(0.05,0.15,0.55),vec3(0.18,0.45,0.82),t2);
  // Land: green lowlands, brown highlands, white peaks
  float elev=smoothstep(0.5,0.8,t);
  vec3 lowland=mix(vec3(0.12,0.48,0.15),vec3(0.35,0.28,0.12),elev);
  vec3 highland=mix(lowland,vec3(0.85,0.82,0.80),smoothstep(0.7,0.9,elev));
  // Polar ice — narrow cap confined to pole tips
  float polar=smoothstep(0.90,0.97,abs(n.y));
  highland=mix(highland,vec3(0.95,0.97,1.0),polar);
  ocean=mix(ocean,vec3(0.95,0.97,1.0),polar);
  vec3 col=mix(ocean,highland,land);
  // Clouds
  float cloud=smoothstep(0.52,0.62,fbm(n*4.0+uTime*0.02));
  col=mix(col,vec3(1.0),cloud*0.75);
  // Simple lighting
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.8+0.2;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_MARS = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.0);
  float t2=fbm(n*7.0+vec3(5.));
  // Base red/orange surface
  vec3 col=mix(vec3(0.72,0.28,0.08),vec3(0.88,0.52,0.32),t);
  col=mix(col,vec3(0.55,0.22,0.08),t2*0.4);
  // Darker volcanic regions
  float dark=smoothstep(0.6,0.7,t2);
  col=mix(col,vec3(0.3,0.1,0.05),dark*0.5);
  // Polar ice caps — narrow, confined to pole tips
  float polar=smoothstep(0.90,0.97,abs(n.y));
  col=mix(col,vec3(0.9,0.92,0.95),polar);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.8+0.2;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_MOON = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*4.0);
  float t2=fbm(n*12.0+vec3(7.));
  // Grey rocky with slight brown tint
  vec3 col=mix(vec3(0.55,0.52,0.50),vec3(0.75,0.72,0.70),t);
  // Darker lowlands (mare)
  float mare=smoothstep(0.55,0.65,fbm(n*1.5));
  col=mix(col,vec3(0.28,0.27,0.26),mare*0.8);
  // Crater highlights
  float craterR=abs(t2-0.5)*2.0;
  col=mix(col,vec3(0.85,0.83,0.82),smoothstep(0.85,0.95,craterR)*0.5);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.85+0.15;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_VENUS = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  // Thick yellow-orange cloud bands
  float band=fbm(vec3(n.x*2.0,n.y*6.0,n.z*2.0)+uTime*0.01);
  float band2=fbm(n*3.0-uTime*0.008);
  vec3 col=mix(vec3(0.88,0.72,0.30),vec3(0.95,0.88,0.55),band);
  col=mix(col,vec3(0.70,0.55,0.20),band2*0.4);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.6+0.4;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_MERCURY = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*4.0);
  float crater=fbm(n*10.0+vec3(3.));
  vec3 col=mix(vec3(0.60,0.58,0.56),vec3(0.75,0.73,0.70),t);
  // Craters
  float craterEdge=abs(crater-0.5)*2.0;
  col=mix(col,vec3(0.40,0.38,0.36),smoothstep(0.7,0.8,crater)*0.6);
  col=mix(col,vec3(0.85,0.83,0.80),smoothstep(0.9,0.95,craterEdge)*0.3);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.9+0.1;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_JUPITER = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  // Horizontal bands
  float bandFreq=14.0;
  float turbulence=fbm(n*3.0+vec3(uTime*0.01,0,0))*0.15;
  float band=sin((n.y+turbulence)*bandFreq)+0.5*sin((n.y+turbulence)*bandFreq*2.3+0.7);
  band=band*0.5+0.5;
  vec3 warm=mix(vec3(0.82,0.52,0.22),vec3(0.92,0.75,0.52),band);
  vec3 cool=mix(vec3(0.65,0.42,0.28),vec3(0.80,0.68,0.55),1.0-band);
  vec3 col=mix(warm,cool,step(0.5,band)*0.6);
  // Great Red Spot (near equator, fixed UV)
  float spotX=fract(atan(n.z,n.x)/(2.*3.14159)+0.5);
  float spotY=n.y;
  float spot=smoothstep(0.12,0.0,length(vec2(fract(spotX-0.3)*2.0-1.0,spotY*3.0)));
  col=mix(col,vec3(0.70,0.25,0.15),spot*0.85);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.75+0.25;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_SATURN = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float turbulence=fbm(n*2.0+vec3(uTime*0.008,0,0))*0.12;
  float band=sin((n.y+turbulence)*10.0)+0.4*sin((n.y+turbulence)*22.0);
  band=band*0.5+0.5;
  vec3 col=mix(vec3(0.78,0.68,0.42),vec3(0.92,0.85,0.62),band);
  col=mix(col,vec3(0.70,0.60,0.38),fbm(n*5.0)*0.2);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.75+0.25;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_ICE_GIANT = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float turbulence=fbm(n*1.5+vec3(uTime*0.006,0,0))*0.1;
  float band=sin((n.y+turbulence)*8.0)*0.5+0.5;
  vec3 col=mix(uColor1,uColor2,band);
  col=mix(col,uColor1*0.85,fbm(n*4.0)*0.2);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.7+0.3;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_DWARF = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.5);
  float t2=fbm(n*8.0+vec3(4.));
  vec3 col=mix(uColor1,uColor2,t);
  // Heart region for Pluto
  float heartX=n.x*1.0;
  float heartY=n.y-0.1;
  float heart=smoothstep(0.45,0.2,length(vec2(heartX*1.5,heartY)));
  col=mix(col,vec3(0.95,0.90,0.82),heart*0.8);
  col=mix(col,col*0.85,t2*0.3);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.8+0.2;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_VOLCANIC = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float lava=fbm(n*4.0+uTime*0.08);
  float lava2=fbm(n*8.0-uTime*0.06);
  vec3 col=mix(vec3(0.08,0.04,0.02),vec3(0.85,0.35,0.0),smoothstep(0.4,0.7,lava));
  col=mix(col,vec3(1.0,0.72,0.0),smoothstep(0.6,0.8,lava2)*0.7);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.6+0.4;
  gl_FragColor=vec4(col,1.0);
}
`;

const FRAG_MOON_ICE = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*5.0);
  float crack=fbm(n*12.0+vec3(2.));
  // White ice base
  vec3 col=mix(vec3(0.88,0.85,0.80),vec3(0.96,0.95,0.92),t);
  // Brown/orange linear cracks
  float crackLine=smoothstep(0.48,0.52,abs(crack-0.5)*2.0);
  col=mix(col,vec3(0.55,0.35,0.22),crackLine*0.7);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.75+0.25;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_TITAN = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*2.0+uTime*0.005);
  float t2=fbm(n*4.0);
  // Orange-brown smoggy atmosphere
  vec3 col=mix(vec3(0.70,0.40,0.12),vec3(0.85,0.58,0.22),t);
  col=mix(col,vec3(0.55,0.30,0.10),t2*0.4);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.65+0.35;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_FROZEN = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.0);
  float t2=fbm(n*7.0+vec3(5.));
  vec3 col=mix(uColor1,uColor2,t);
  col=mix(col,vec3(0.95,0.92,0.88),fbm(n*1.5)*0.3);
  col=mix(col,col*0.8,t2*0.3);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.75+0.25;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

const FRAG_COMET = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*6.0);
  vec3 col=mix(vec3(0.35,0.32,0.28),vec3(0.55,0.52,0.48),t);
  float bright=smoothstep(0.6,0.7,fbm(n*12.0+uTime*0.1));
  col=mix(col,vec3(0.85,0.90,0.95),bright*0.5);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.8+0.2;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Atmosphere shader ──────────────────────────────────────────────────────
const ATM_VERT = `
varying vec3 vNormal;
void main(){
  vNormal=normalize(normalMatrix*normal);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}
`;
const ATM_FRAG = `
uniform vec3 uAtmColor;
uniform float uOpacity;
varying vec3 vNormal;
void main(){
  float rim=1.0-max(dot(vNormal,normalize(vec3(0,0,1))),0.0);
  float alpha=pow(rim,2.5)*uOpacity;
  gl_FragColor=vec4(uAtmColor,alpha);
}
`;

// ── Enhanced Fresnel atmosphere ─────────────────────────────────────────────
const ENH_ATM_VERT = `
varying vec3 vNormal;
varying vec3 vViewPos;
void main(){
  vNormal=normalize(normalMatrix*normal);
  vec4 mvPos=modelViewMatrix*vec4(position,1.0);
  vViewPos=mvPos.xyz;
  gl_Position=projectionMatrix*mvPos;
}
`;
const ENH_ATM_FRAG = `
uniform vec3 uAtmColor;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vViewPos;
void main(){
  vec3 viewDir=normalize(-vViewPos);
  float rim=1.0-max(dot(vNormal,viewDir),0.0);
  float fresnel=pow(rim,4.5);
  float alpha=uOpacity*fresnel*1.3;
  gl_FragColor=vec4(uAtmColor*1.05,clamp(alpha,0.0,0.60));
}
`;

// ── Ring shader ────────────────────────────────────────────────────────────
const RING_VERT = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
const RING_FRAG = `
uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float r=vUv.x; // 0=inner, 1=outer
  float alpha=smoothstep(0.0,0.08,r)*smoothstep(1.0,0.92,r);
  // Cassini division (Saturn) at ~0.55
  float div=smoothstep(0.02,0.0,abs(r-0.55));
  alpha*=(1.0-div*0.85);
  // Band variation
  float band=sin(r*80.0)*0.15+0.85;
  alpha*=band;
  gl_FragColor=vec4(uColor,alpha*0.75);
}
`;

// ── Red dwarf shader (TRAPPIST-1, Proxima Centauri) ───────────────────────
const FRAG_RED_DWARF = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float f=fbm(n*3.0+uTime*0.06);
  float f2=fbm(n*6.0-uTime*0.04);
  float spot=smoothstep(0.55,0.65,f2);
  vec3 col=mix(vec3(0.85,0.15,0.02),vec3(0.60,0.08,0.01),f);
  col=mix(col,vec3(0.20,0.02,0.00),spot*0.8);
  float flare=smoothstep(0.7,0.8,fbm(n*8.0+uTime*0.2));
  col+=vec3(1.0,0.3,0.1)*flare*0.4;
  // Limb brightening
  float limb=1.0-max(dot(vNormal,normalize(vec3(0,0,1))),0.0);
  col+=vec3(1.0,0.2,0.05)*pow(limb,3.0)*0.8;
  gl_FragColor=vec4(col,1.0);
}
`;

// ── Orange dwarf shader (Centauri B, Kepler-442) ───────────────────────────
const FRAG_ORANGE_DWARF = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float f=fbm(n*2.5+uTime*0.035);
  float f2=fbm(n*5.0-uTime*0.05);
  vec3 col=mix(vec3(1.0,0.52,0.10),vec3(0.90,0.36,0.06),f);
  col=mix(col,vec3(0.75,0.28,0.04),f2*0.4);
  float granule=smoothstep(0.58,0.65,fbm(n*9.0+uTime*0.12));
  col=mix(col,vec3(1.0,0.70,0.35),granule*0.3);
  float limb=1.0-max(dot(vNormal,normalize(vec3(0,0,1))),0.0);
  col+=vec3(1.0,0.55,0.1)*pow(limb,3.0)*1.0;
  gl_FragColor=vec4(col,1.0);
}
`;

// ── Exoplanet habitable (TRAPPIST-1e/f/g, Kepler-442b, Proxima b) ─────────
const FRAG_HABITABLE_EXOPLANET = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.5);
  float t2=fbm(n*7.0+vec3(8.0));
  float land=smoothstep(0.42,0.52,t+t2*0.15);
  // More reddish ocean (red dwarf light environment)
  vec3 ocean=mix(vec3(0.10,0.20,0.55),vec3(0.20,0.40,0.72),t2);
  float elev=smoothstep(0.5,0.8,t);
  vec3 ground=mix(vec3(0.35,0.45,0.22),vec3(0.50,0.38,0.20),elev);
  ground=mix(ground,vec3(0.80,0.78,0.76),smoothstep(0.75,0.92,elev));
  float polar=smoothstep(0.90,0.97,abs(n.y));
  ground=mix(ground,vec3(0.95,0.95,1.0),polar);
  ocean=mix(ocean,vec3(0.95,0.95,1.0),polar);
  vec3 col=mix(ocean,ground,land);
  // Sparse clouds
  float cloud=smoothstep(0.55,0.65,fbm(n*5.0+uTime*0.015));
  col=mix(col,vec3(0.9,0.9,0.95),cloud*0.55);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.8+0.2;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Tidally locked rocky (TRAPPIST-1b/c/d/h) ─────────────────────────────
const FRAG_TIDALLY_LOCKED = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*4.0);
  float t2=fbm(n*9.0+vec3(3.));
  // Dark basaltic rock
  vec3 col=mix(vec3(0.38,0.28,0.22),vec3(0.55,0.42,0.32),t);
  col=mix(col,vec3(0.22,0.16,0.12),t2*0.4);
  // Bright-side vs dark-side gradient
  float brightSide=max(dot(n,vec3(0,0,1)),0.0);
  float glowing=smoothstep(0.6,0.8,brightSide);
  col=mix(col,vec3(0.70,0.28,0.08),glowing*0.5);
  // Crater edges
  float crater=abs(t2-0.5)*2.0;
  col=mix(col,vec3(0.65,0.50,0.40),smoothstep(0.88,0.95,crater)*0.3);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.85+0.15;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Ganymede: dark cratered terrain + bright icy grooves ─────────────────
const FRAG_GANYMEDE = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.0);
  float t2=fbm(n*8.0+vec3(5.));
  vec3 dark=mix(vec3(0.28,0.26,0.23),vec3(0.42,0.40,0.36),t);
  vec3 bright=mix(vec3(0.68,0.66,0.64),vec3(0.82,0.80,0.78),t2);
  float iceRegion=smoothstep(0.42,0.58,fbm(n*1.8+vec3(3.)));
  vec3 col=mix(dark,bright,iceRegion);
  float crater=abs(t2-0.5)*2.0;
  col=mix(col,vec3(0.88,0.85,0.82),smoothstep(0.88,0.95,crater)*0.35);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.85+0.15;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Triton: pinkish nitrogen ice + dark geyser streaks ────────────────────
const FRAG_TRITON = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*4.0);
  float t2=fbm(n*9.0+vec3(7.));
  vec3 col=mix(vec3(0.78,0.65,0.58),vec3(0.88,0.76,0.70),t);
  col=mix(col,vec3(0.42,0.36,0.32),smoothstep(0.55,0.72,t2)*0.55);
  float streak=fbm(n*16.0+vec3(uTime*0.01));
  col=mix(col,vec3(0.12,0.10,0.09),smoothstep(0.62,0.68,streak)*0.45);
  // Southern polar nitrogen frost
  float polar=smoothstep(0.55,0.80,-n.y);
  col=mix(col,vec3(0.95,0.91,0.88),polar*0.65);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.80+0.20;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Uranus: seasonal bands + polar brightening (Hubble 2023 season) ──────
const FRAG_URANUS = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float turbulence=fbm(n*1.2+vec3(uTime*0.005,0,0))*0.08;
  float lat=n.y+turbulence;
  float band=sin(lat*6.0)*0.5+0.5;
  // Rich cyan-teal gradient
  vec3 col=mix(vec3(0.42,0.84,0.86),vec3(0.62,0.94,0.95),band);
  // Faint mid-latitude bands (Hubble 2023 shows subtle banding in equinox season)
  float midBand=smoothstep(0.35,0.45,abs(lat))*smoothstep(0.65,0.55,abs(lat));
  col=mix(col,vec3(0.74,0.98,0.97),midBand*0.28);
  // North polar brightening (currently in sunlit season 2007-2028)
  float polar=smoothstep(0.50,0.88,n.y);
  col=mix(col,vec3(0.86,1.0,1.0),polar*0.22);
  // Subtle methane cloud wisps
  float wisps=smoothstep(0.64,0.70,fbm(n*5.0+vec3(uTime*0.008,0,0)));
  col=mix(col,vec3(0.90,0.98,0.98),wisps*0.18);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.65+0.35;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Neptune: cobalt blue with dark spot + methane streamers ───────────────
const FRAG_NEPTUNE = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float turbulence=fbm(n*2.0+vec3(uTime*0.012,0,0))*0.12;
  float band=sin((n.y+turbulence)*7.0)*0.5+0.5;
  // Rich cobalt blue
  vec3 col=mix(vec3(0.10,0.20,0.72),vec3(0.20,0.36,0.88),band);
  // 2021 Hubble dark spot (Northern Hemisphere, near 50°N)
  float phi=atan(n.z,n.x)/(2.*3.14159);
  float darkSpotDist=length(vec2(fract(phi-0.18+0.5)*2.0-1.0,(n.y-0.65)*3.5));
  col=mix(col,vec3(0.04,0.07,0.30),smoothstep(0.20,0.0,darkSpotDist)*0.80);
  // Scooter cloud (bright methane, orbits faster than the dark spot)
  float scooterPhi=fract(phi+uTime*0.006+0.5);
  float scooterDist=length(vec2(fract(scooterPhi-0.28)*2.8-1.4,(n.y-0.62)*7.0));
  col=mix(col,vec3(0.82,0.92,1.0),smoothstep(0.08,0.0,scooterDist)*0.95);
  // Fast mid-latitude streaks
  float streak=smoothstep(0.60,0.66,fbm(n*5.0+vec3(uTime*0.04,0,0)));
  float midLat=smoothstep(0.30,0.0,abs(n.y-0.3));
  col=mix(col,vec3(0.65,0.80,0.98),streak*midLat*0.45);
  // Southern polar methane haze
  float sPolar=smoothstep(0.55,0.85,-n.y);
  col=mix(col,vec3(0.14,0.28,0.80),sPolar*0.18);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.70+0.30;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Miranda: complex chaotic terrain + Verona Rupes cliff band ───────────
const FRAG_MIRANDA = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.5);
  float t2=fbm(n*8.0+vec3(6.));
  float t3=fbm(n*16.0+vec3(3.));
  // Greyish-white icy base
  vec3 col=mix(vec3(0.60,0.58,0.55),vec3(0.82,0.80,0.78),t);
  // Chaotic coronae terrain (the famous jumbled landscape)
  float chaos=smoothstep(0.30,0.70,fbm(n*2.0+vec3(1.5)));
  vec3 chaosCol=mix(vec3(0.36,0.33,0.30),vec3(0.70,0.68,0.65),t2);
  col=mix(col,chaosCol,chaos*0.65);
  // Verona Rupes cliff band — sharp albedo boundary near south pole
  float cliffY=n.y+0.55+fbm(n*5.0)*0.08;
  float cliffBand=smoothstep(0.025,0.0,abs(cliffY));
  col=mix(col,vec3(0.12,0.11,0.10),cliffBand*0.85);
  col=mix(col,vec3(0.95,0.93,0.90),cliffBand*0.25); // frost along cliff face
  // Grooves and ridges (parallel features from ice tectonics)
  float groove=abs(sin(fbm(n*6.0)*18.0))*smoothstep(0.52,0.72,fbm(n*4.0+vec3(7.)));
  col=mix(col,vec3(0.24,0.22,0.20),groove*0.45);
  // Bright impact craters
  float crater=abs(t3-0.5)*2.0;
  col=mix(col,vec3(0.92,0.90,0.88),smoothstep(0.88,0.95,crater)*0.45);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.85+0.15;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Charon: Mordor Macula polar cap + Argo Chasma (New Horizons 2015) ─────
const FRAG_CHARON = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.5);
  float t2=fbm(n*9.0+vec3(4.));
  // Base: mid-grey rocky-icy surface
  vec3 col=mix(vec3(0.50,0.48,0.45),vec3(0.72,0.70,0.68),t);
  // Mordor Macula — dark reddish-brown north polar cap
  // (tholins from Pluto's nitrogen atmosphere, transported to Charon)
  float mordor=smoothstep(0.52,0.84,n.y);
  col=mix(col,vec3(0.28,0.13,0.08),mordor*0.90);
  // Argo Chasma — great canyon near equator
  float chasmaY=abs(n.y-0.05+fbm(n*8.0)*0.06);
  col=mix(col,vec3(0.18,0.16,0.14),smoothstep(0.030,0.0,chasmaY)*0.80);
  col=mix(col,vec3(0.90,0.88,0.85),smoothstep(0.025,0.0,chasmaY)*0.25); // bright canyon walls
  // Craters (Serenity Chasma, Vulcan Planum, etc.)
  float crater=abs(t2-0.5)*2.0;
  col=mix(col,vec3(0.85,0.83,0.80),smoothstep(0.88,0.95,crater)*0.40);
  col=mix(col,vec3(0.10,0.09,0.08),smoothstep(0.78,0.85,t2)*0.50);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.85+0.15;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Eris: extremely high albedo methane ice (whitest body in solar system) ─
const FRAG_BRIGHT_ICE = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.0);
  float t2=fbm(n*7.0+vec3(5.));
  // Very bright white (albedo ~0.96, brightest known solar system body)
  vec3 col=mix(vec3(0.88,0.87,0.84),vec3(0.97,0.96,0.94),t);
  // Pale cream patches (fresh nitrogen/methane ice)
  col=mix(col,vec3(1.0,0.98,0.92),t2*0.14);
  // Subtle darker substrate exposed in low spots
  float dark=smoothstep(0.60,0.72,fbm(n*4.5+vec3(3.)));
  col=mix(col,vec3(0.68,0.66,0.62),dark*0.22);
  // Shallow craters (ice-softened topography)
  float crater=abs(t2-0.5)*2.0;
  col=mix(col,vec3(0.78,0.77,0.75),smoothstep(0.88,0.95,crater)*0.35);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.80+0.20;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Haumea: elongated fast-rotator, light icy surface with dark red spot ──
const FRAG_HAUMEA = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*4.0);
  float t2=fbm(n*10.0+vec3(3.));
  // Bright whitish crystalline ice
  vec3 col=mix(vec3(0.80,0.78,0.75),vec3(0.94,0.93,0.90),t);
  // Dark red spot (Hubble photometry — large tholin-rich region)
  float spotX=n.x*1.2;
  float spotY=n.y*0.8;
  float spot=smoothstep(0.30,0.10,length(vec2(spotX-0.3,spotY+0.2)));
  col=mix(col,vec3(0.35,0.12,0.06),spot*0.75);
  // Subtle darker band (slight compositional variation)
  float band=smoothstep(0.05,0.0,abs(n.y+0.05+fbm(n*3.0)*0.1));
  col=mix(col,vec3(0.60,0.55,0.50),band*0.30);
  float crack=abs(t2-0.5)*2.0;
  col=mix(col,vec3(0.88,0.85,0.82),smoothstep(0.88,0.95,crack)*0.30);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.82+0.18;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Makemake: dark reddish-brown tholins + methane ice patches ───────────
const FRAG_DARK_KBO = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.5);
  float t2=fbm(n*8.0+vec3(5.));
  // Dark reddish-brown (Hubble color: V-I ~ 0.56, deep red)
  vec3 col=mix(vec3(0.38,0.20,0.10),vec3(0.54,0.30,0.16),t);
  // Bright methane/ethane ice deposits (Spitzer: patchy distribution)
  float bright=smoothstep(0.58,0.70,t2);
  col=mix(col,vec3(0.80,0.74,0.62),bright*0.55);
  // Very dark equatorial dust band
  float eq=smoothstep(0.06,0.0,abs(n.y+fbm(n*5.0)*0.10));
  col=mix(col,vec3(0.15,0.07,0.03),eq*0.55);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.82+0.18;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Venus surface mode: Magellan radar-derived elevation color map ────────
const FRAG_VENUS_SURFACE = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float elev=fbm(n*2.8+vec3(5.0))*0.7+fbm(n*6.5+vec3(2.0))*0.3;
  // Magellan false-color ramp: deep basins=dark blue → lowlands=khaki → highlands=orange → peaks=white
  vec3 basins=vec3(0.10,0.18,0.42);
  vec3 plains=vec3(0.52,0.42,0.22);
  vec3 highlands=vec3(0.76,0.40,0.10);
  vec3 peaks=vec3(0.94,0.90,0.86);
  vec3 col=basins;
  col=mix(col,plains,smoothstep(0.28,0.44,elev));
  col=mix(col,highlands,smoothstep(0.56,0.72,elev));
  col=mix(col,peaks,smoothstep(0.78,0.88,elev));
  // Tessera terrain (chaotic high-plateau, appears rougher)
  float tessera=smoothstep(0.58,0.72,fbm(n*5.0+vec3(8.)));
  col=mix(col,vec3(0.60,0.36,0.16),tessera*0.28);
  // Volcanic features (lava channels)
  float lava=smoothstep(0.68,0.74,fbm(n*9.0+vec3(uTime*0.002)));
  col=mix(col,vec3(0.82,0.42,0.08),lava*0.30);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.85+0.15;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Titan infrared mode: Cassini VIMS composite surface (2.0/1.3μm) ──────
const FRAG_TITAN_IR = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float t=fbm(n*3.5+vec3(4.0));
  float t2=fbm(n*7.0+vec3(2.0));
  // Xanadu Regio — bright highland/continent (VIMS bright in 2μm channel)
  float xanadu=smoothstep(0.50,0.68,fbm(n*1.8+vec3(0.5,1.2,0.3)));
  // Kraken Mare + Ligeia Mare (methane seas near north pole)
  float nSea=smoothstep(0.68,0.88,n.y);
  // Base: gold/tan (IR penetrates haze, shows water ice + organic sediment)
  vec3 col=mix(vec3(0.48,0.30,0.10),vec3(0.70,0.50,0.22),t);
  col=mix(col,vec3(0.85,0.76,0.55),xanadu*0.62);          // Xanadu: bright
  col=mix(col,vec3(0.06,0.05,0.04),nSea*0.90);             // Methane seas: very dark
  // Dune fields (equatorial dark linear features)
  float dunes=smoothstep(0.53,0.63,fbm(vec3(n.x*6.0,n.y*2.0,n.z*6.0)+vec3(3.)));
  float eqBias=smoothstep(0.22,0.0,abs(n.y));
  col=mix(col,vec3(0.20,0.12,0.05),dunes*eqBias*0.55);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.72+0.28;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Station/Satellite: metallic with gold solar panel strips ─────────────
const FRAG_STATION = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vUv;
${NOISE_GLSL}
void main(){
  // Solar panel stripes (alternating dark/gold)
  float panelStripe=step(0.5,fract(vUv.x*8.0));
  vec3 solarPanel=mix(vec3(0.10,0.08,0.05),vec3(0.72,0.50,0.06),panelStripe);
  // Module body (white/silver)
  float moduleMask=smoothstep(0.25,0.35,abs(vUv.y-0.5)*2.0);
  vec3 col=mix(solarPanel,vec3(0.88,0.87,0.85),moduleMask*0.90);
  // Subtle metallic noise
  float noise=fbm(normalize(vPos)*12.0)*0.06;
  col=col*(0.96+noise);
  float diff=max(dot(vNormal,normalize(vec3(1,1,0.5))),0.0)*0.80+0.20;
  gl_FragColor=vec4(col*diff,1.0);
}
`;

// ── Helper: choose frag shader by id ──────────────────────────────────────
function getFragShader(body: CelestialBodyData, bodyViewMode?: string): string {
  // View-mode overrides (surface / infrared modes)
  if (body.id === 'venus' && bodyViewMode === 'surface') return FRAG_VENUS_SURFACE;
  if (body.id === 'titan' && bodyViewMode === 'infrared') return FRAG_TITAN_IR;

  switch (body.id) {
    case 'sun':
    case 'centauri-a':
      return FRAG_STAR;
    case 'earth': return FRAG_EARTH;
    case 'mars': return FRAG_MARS;
    case 'moon': return FRAG_MOON;
    case 'venus': return FRAG_VENUS;
    case 'mercury': return FRAG_MERCURY;
    case 'jupiter': return FRAG_JUPITER;
    case 'saturn': return FRAG_SATURN;
    case 'uranus': return FRAG_URANUS;   // upgraded from FRAG_ICE_GIANT
    case 'neptune': return FRAG_NEPTUNE; // upgraded from FRAG_ICE_GIANT
    case 'pluto': return FRAG_DWARF;
    case 'io': return FRAG_VOLCANIC;
    case 'europa': return FRAG_MOON_ICE;
    case 'titan': return FRAG_TITAN;
    case 'ganymede': return FRAG_GANYMEDE;
    case 'callisto': return FRAG_MOON;
    case 'phobos': return FRAG_MOON;
    case 'deimos': return FRAG_MOON;
    case 'miranda': return FRAG_MIRANDA;  // upgraded: Verona Rupes cliff terrain
    case 'triton': return FRAG_TRITON;
    case 'charon': return FRAG_CHARON;    // upgraded: Mordor Macula + Argo Chasma
    case 'halley': return FRAG_COMET;
    // New dwarf planets
    case 'eris': return FRAG_BRIGHT_ICE;
    case 'haumea': return FRAG_HAUMEA;
    case 'makemake': return FRAG_DARK_KBO;
    // Artificial satellites
    case 'iss':
    case 'hubble': return FRAG_STATION;
    // Exoplanet systems
    case 'trappist1-star':
    case 'proxima-centauri':
      return FRAG_RED_DWARF;
    case 'centauri-b':
    case 'kepler442-star':
      return FRAG_ORANGE_DWARF;
    case 'trappist1-e':
    case 'trappist1-f':
    case 'trappist1-g':
    case 'kepler442-b':
    case 'proxima-b':
      return FRAG_HABITABLE_EXOPLANET;
    case 'trappist1-b':
    case 'trappist1-c':
    case 'trappist1-d':
    case 'trappist1-h':
      return FRAG_TIDALLY_LOCKED;
    default: return FRAG_FROZEN;
  }
}

function getExtraUniforms(body: CelestialBodyData): Record<string, THREE.IUniform> {
  const c1 = new THREE.Color(body.colorMain);
  const c2 = new THREE.Color(body.colorSecondary);
  return {
    uColor1: { value: c1 },
    uColor2: { value: c2 },
    uAtmColor: { value: new THREE.Color(body.atmosphereColor) },
  };
}

function getDisplace(body: CelestialBodyData): number {
  switch (body.type) {
    case 'ROCKY': return 0.06;
    case 'MOON': return 0.04;
    case 'DWARF_PLANET': return 0.05;
    case 'COMET': return 0.12;
    default: return 0.0;
  }
}

// ── Real texture map (Solar System Scope CC-BY 4.0 textures) ─────────────
const TEXTURE_FILENAMES: Record<string, string> = {
  // sun_8k.jpg = Solar System Scope equirectangular texture (4096×2048) — proper sphere mapping
  sun: 'sun_8k.jpg',
  'centauri-a': 'sun_8k.jpg', // Alpha Centauri A ≈ G-type, reuse solar texture
  mercury: 'mercury.jpg',
  venus: 'venus.jpg',
  earth: 'earth.jpg',
  moon: 'moon.jpg',
  mars: 'mars.jpg',
  io: 'io.jpg',
  jupiter: 'jupiter.jpg',
  saturn: 'saturn.jpg',
  uranus: 'uranus.jpg',
  neptune: 'neptune.jpg',
  pluto: 'pluto.jpg',
};

function texturePath(filename: string): string {
  const base = (import.meta.env.BASE_URL as string) ?? '/';
  return `${base}textures/${filename}`;
}

// ── Textured planet mesh (MeshStandardMaterial + real textures) ────────────
interface TexturedProps {
  body: CelestialBodyData;
  radius: number;
  isOverview: boolean;
  onClick?: () => void;
  rotationPaused?: boolean;
  manualRotationRef?: React.MutableRefObject<number>;
  showAtmosphere?: boolean;
}

const TexturedPlanetMesh: React.FC<TexturedProps> = ({ body, radius, isOverview, onClick, rotationPaused, manualRotationRef, showAtmosphere = true }) => {
  const meshRef  = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const [diffuseTex, setDiffuseTex] = useState<THREE.Texture | null>(null);
  const [cloudsTex,  setCloudsTex]  = useState<THREE.Texture | null>(null);
  const [ready, setReady]           = useState(false);

  useEffect(() => {
    const filename = TEXTURE_FILENAMES[body.id];
    if (!filename) { setReady(true); return; }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      texturePath(filename),
      (tex) => {
        if (cancelled) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        setDiffuseTex(tex);
        setReady(true);
      },
      undefined,
      () => setReady(true),
    );
    if (body.id === 'earth') {
      loader.load(texturePath('earth_clouds.jpg'), (tex) => {
        if (cancelled) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        setCloudsTex(tex);
      });
    }
    return () => { cancelled = true; };
  }, [body.id]);

  useFrame((_, dt) => {
    if (meshRef.current) {
      if (rotationPaused && manualRotationRef) {
        meshRef.current.rotation.y = manualRotationRef.current;
      } else if (!rotationPaused) {
        meshRef.current.rotation.y += dt * (body.id === 'sun' ? 0.005 : 0.08);
        if (manualRotationRef) manualRotationRef.current = meshRef.current.rotation.y;
      }
    }
    if (cloudRef.current) {
      if (rotationPaused && manualRotationRef) {
        cloudRef.current.rotation.y = manualRotationRef.current; // Sync clouds to manual drag
      } else if (!rotationPaused) {
        cloudRef.current.rotation.y += dt * 0.095; // Slightly faster than earth for realism
      }
    }
  });

  // Show procedural shader while texture loads (seamless transition)
  if (!diffuseTex) {
    return <ShaderBodyMesh body={body} radius={radius} isOverview={isOverview} onClick={onClick} />;
  }

  const isStar   = body.type === 'STAR';
  const segments = isOverview ? 32 : 96;
  const halfSeg  = Math.floor(segments / 2);

  return (
    <group onClick={onClick}>
      {/* Main sphere — stars use BasicMaterial (unlit); planets use StandardMaterial */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, segments, halfSeg]} />
        {isStar ? (
          <meshBasicMaterial map={diffuseTex} />
        ) : (
          <meshStandardMaterial
            map={diffuseTex}
            roughness={body.id === 'earth' ? 0.62 : 0.88}
            metalness={0}
          />
        )}
      </mesh>

      {/* Earth: cloud layer */}
      {body.id === 'earth' && cloudsTex && !isOverview && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[radius * 1.013, segments, halfSeg]} />
          <meshStandardMaterial
            map={cloudsTex}
            alphaMap={cloudsTex}
            transparent
            opacity={0.88}
            roughness={1.0}
            metalness={0}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Enhanced Fresnel atmosphere */}
      {showAtmosphere && body.hasAtmosphere && body.atmosphereOpacity > 0 && !isOverview && (
        <mesh>
          <sphereGeometry args={[radius * 1.12, 32, 32]} />
          <shaderMaterial
            vertexShader={ENH_ATM_VERT}
            fragmentShader={ENH_ATM_FRAG}
            uniforms={{
              uAtmColor: { value: new THREE.Color(body.atmosphereColor) },
              uOpacity:  { value: body.atmosphereOpacity },
            }}
            transparent
            side={THREE.FrontSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Rings */}
      {body.hasRings && <SaturnRings body={body} radius={radius} isOverview={isOverview} />}

      {/* Sun corona (overview) */}
      {showAtmosphere && isStar && isOverview && (
        <mesh>
          <sphereGeometry args={[radius * 1.6, 16, 16]} />
          <meshBasicMaterial color={body.colorMain} transparent opacity={0.15} side={THREE.FrontSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

// ── CelestialBody component ────────────────────────────────────────────────
interface Props {
  body: CelestialBodyData;
  radius?: number;      // Override display radius
  isOverview?: boolean; // Simplified rendering for overview map
  onClick?: () => void;
  rotationPaused?: boolean;
  manualRotationRef?: React.MutableRefObject<number>;
  showAtmosphere?: boolean; // Global atmosphere toggle
  bodyViewMode?: string;    // Per-body view override ('surface' | 'infrared' | 'default')
}

// Internal shader renderer (procedural GLSL — used for exoplanets, moons, fallback)
const ShaderBodyMesh: React.FC<Props> = ({ body, radius, isOverview = false, onClick, rotationPaused, manualRotationRef, showAtmosphere = true, bodyViewMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const r = radius ?? body.displayRadius;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDisplace: { value: isOverview ? 0 : getDisplace(body) },
    ...getExtraUniforms(body),
  }), [body, isOverview]);

  const fragShader = useMemo(() => getFragShader(body, bodyViewMode), [body, bodyViewMode]);

  useFrame((_, dt) => {
    if (!rotationPaused) {
      timeRef.current += dt;
      uniforms.uTime.value = timeRef.current;
    }
    if (meshRef.current) {
      if (rotationPaused && manualRotationRef) {
        meshRef.current.rotation.y = manualRotationRef.current;
      } else if (!rotationPaused) {
        const speed = body.id === 'sun' ? 0.005 : 0.12;
        meshRef.current.rotation.y += dt * speed;
        if (manualRotationRef) manualRotationRef.current = meshRef.current.rotation.y;
      }
    }
  });

  const detail = isOverview ? 16 : 64;

  // Haumea is triaxially elongated — scale the group to approximate 2200×1500×1000 km ratio
  const isHaumea = body.id === 'haumea';
  const haumeaScale: [number, number, number] = isHaumea ? [1.0, 0.60, 0.72] : [1, 1, 1];

  return (
    <group onClick={onClick} scale={haumeaScale}>
      {/* Planet sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[r, isOverview ? 3 : 6]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragShader}
          uniforms={uniforms}
          key={body.id + fragShader}
        />
      </mesh>

      {/* Enhanced Fresnel atmosphere glow */}
      {showAtmosphere && body.hasAtmosphere && body.atmosphereOpacity > 0 && !isOverview && (
        <mesh>
          <sphereGeometry args={[r * 1.11, 32, 32]} />
          <shaderMaterial
            vertexShader={ENH_ATM_VERT}
            fragmentShader={ENH_ATM_FRAG}
            uniforms={{
              uAtmColor: { value: new THREE.Color(body.atmosphereColor) },
              uOpacity: { value: body.atmosphereOpacity },
            }}
            transparent
            side={THREE.FrontSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Rings */}
      {body.hasRings && (
        <SaturnRings body={body} radius={r} isOverview={isOverview} />
      )}

      {/* Sun corona handled by SolarFlares component in SolarSystemView */}
    </group>
  );
};

// ── Public dispatcher: real texture when available, shader fallback ────────
export const CelestialBodyMesh: React.FC<Props> = ({ body, radius, isOverview = false, onClick, rotationPaused, manualRotationRef, showAtmosphere = true, bodyViewMode }) => {
  const r = radius ?? body.displayRadius;
  // Surface/infrared mode overrides always use the shader (bypass texture)
  const forceShader = (body.id === 'venus' && bodyViewMode === 'surface') ||
                      (body.id === 'titan' && bodyViewMode === 'infrared');
  if (!forceShader && TEXTURE_FILENAMES[body.id]) {
    return <TexturedPlanetMesh body={body} radius={r} isOverview={isOverview} onClick={onClick} rotationPaused={rotationPaused} manualRotationRef={manualRotationRef} showAtmosphere={showAtmosphere} />;
  }
  return <ShaderBodyMesh body={body} radius={r} isOverview={isOverview} onClick={onClick} rotationPaused={rotationPaused} manualRotationRef={manualRotationRef} showAtmosphere={showAtmosphere} bodyViewMode={bodyViewMode} />;
};

// ── Saturn-style rings ─────────────────────────────────────────────────────
const SaturnRings: React.FC<{ body: CelestialBodyData; radius: number; isOverview: boolean }> = ({
  body, radius, isOverview
}) => {
  const inner = radius * body.ringInnerRatio;
  const outer = radius * body.ringOuterRatio;
  const ringColor = new THREE.Color(body.colorSecondary);

  return (
    <mesh rotation={[Math.PI / 2.2, 0, 0.3]}>
      <ringGeometry args={[inner, outer, isOverview ? 32 : 64, 1]} />
      {isOverview ? (
        <meshBasicMaterial color={ringColor} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      ) : (
        <shaderMaterial
          vertexShader={RING_VERT}
          fragmentShader={RING_FRAG}
          uniforms={{ uColor: { value: ringColor } }}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      )}
    </mesh>
  );
};

// ── Asteroid belt ring ────────────────────────────────────────────────────
export const AsteroidBeltRing: React.FC<{ orbitRadius: number }> = ({ orbitRadius }) => {
  const points = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 800; i++) {
      const angle = (i / 800) * Math.PI * 2;
      const r = orbitRadius + (Math.random() - 0.5) * 3.5;
      const y = (Math.random() - 0.5) * 0.4;
      pts.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
    }
    return new Float32Array(pts);
  }, [orbitRadius]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#9E8A6E" sizeAttenuation transparent opacity={0.6} />
    </points>
  );
};

// ── Comet with tail ────────────────────────────────────────────────────────
export const CometTail: React.FC<{ radius: number }> = ({ radius }) => (
  <group>
    {/* Ion tail */}
    <mesh position={[0, 0, radius * 3]} rotation={[0, 0, 0]}>
      <coneGeometry args={[radius * 0.3, radius * 8, 8, 1, true]} />
      <meshBasicMaterial color="#aaddff" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
    {/* Dust tail */}
    <mesh position={[0, 0, radius * 2.5]} rotation={[0.05, 0, 0]}>
      <coneGeometry args={[radius * 0.5, radius * 6, 8, 1, true]} />
      <meshBasicMaterial color="#ffffcc" transparent opacity={0.10} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  </group>
);
