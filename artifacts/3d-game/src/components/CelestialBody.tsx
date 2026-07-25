import React, { useRef, useMemo } from 'react';
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
const FRAG_STAR = `
uniform float uTime;
varying vec3 vPos;
varying vec3 vNormal;
${NOISE_GLSL}
void main(){
  vec3 n=normalize(vPos);
  float f=fbm(n*2.5+uTime*0.04);
  float f2=fbm(n*5.0-uTime*0.06);
  vec3 col=mix(vec3(1.0,0.42,0.0),vec3(1.0,0.92,0.35),f);
  col=mix(col,vec3(1.0,1.0,0.9),f2*0.4);
  // Corona glow at limb
  float limb=1.0-max(dot(vNormal,normalize(vec3(0,0,1))),0.0);
  col+=vec3(1.0,0.5,0.1)*pow(limb,3.0)*1.5;
  gl_FragColor=vec4(col,1.0);
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
  // Polar ice
  float polar=smoothstep(0.75,0.85,abs(n.y));
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
  // Polar ice caps
  float polar=smoothstep(0.78,0.88,abs(n.y));
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

// ── Helper: choose frag shader by id ──────────────────────────────────────
function getFragShader(body: CelestialBodyData): string {
  switch (body.id) {
    case 'sun': return FRAG_STAR;
    case 'earth': return FRAG_EARTH;
    case 'mars': return FRAG_MARS;
    case 'moon': return FRAG_MOON;
    case 'venus': return FRAG_VENUS;
    case 'mercury': return FRAG_MERCURY;
    case 'jupiter': return FRAG_JUPITER;
    case 'saturn': return FRAG_SATURN;
    case 'uranus': return FRAG_ICE_GIANT;
    case 'neptune': return FRAG_ICE_GIANT;
    case 'pluto': return FRAG_DWARF;
    case 'io': return FRAG_VOLCANIC;
    case 'europa': return FRAG_MOON_ICE;
    case 'titan': return FRAG_TITAN;
    case 'halley': return FRAG_COMET;
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

// ── CelestialBody component ────────────────────────────────────────────────
interface Props {
  body: CelestialBodyData;
  radius?: number;      // Override display radius
  isOverview?: boolean; // Simplified rendering for overview map
  onClick?: () => void;
}

export const CelestialBodyMesh: React.FC<Props> = ({ body, radius, isOverview = false, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const r = radius ?? body.displayRadius;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDisplace: { value: isOverview ? 0 : getDisplace(body) },
    ...getExtraUniforms(body),
  }), [body, isOverview]);

  const fragShader = useMemo(() => getFragShader(body), [body]);

  useFrame((_, dt) => {
    timeRef.current += dt;
    uniforms.uTime.value = timeRef.current;
    if (meshRef.current) {
      const speed = body.id === 'sun' ? 0.005 : 0.12;
      meshRef.current.rotation.y += dt * speed;
    }
  });

  const detail = isOverview ? 16 : 64;

  return (
    <group onClick={onClick}>
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

      {/* Atmosphere glow */}
      {body.hasAtmosphere && body.atmosphereOpacity > 0 && !isOverview && (
        <mesh>
          <sphereGeometry args={[r * 1.08, 32, 32]} />
          <shaderMaterial
            vertexShader={ATM_VERT}
            fragmentShader={ATM_FRAG}
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

      {/* Sun glow corona (overview) */}
      {body.id === 'sun' && isOverview && (
        <mesh>
          <sphereGeometry args={[r * 1.6, 16, 16]} />
          <meshBasicMaterial
            color={body.colorMain}
            transparent
            opacity={0.15}
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
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
