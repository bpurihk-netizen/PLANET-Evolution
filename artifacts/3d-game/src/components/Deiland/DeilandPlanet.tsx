import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CelestialBody, BiomeType } from '../../data/celestialBodies';

export const PLANET_RADIUS = 4;

function valueNoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const h = (a: number, b: number, c: number) =>
    Math.abs(Math.sin(a * 127.1 + b * 311.7 + c * 74.7));
  return (
    h(xi,   yi,   zi)   * (1-u)*(1-v)*(1-w) +
    h(xi+1, yi,   zi)   * u    *(1-v)*(1-w) +
    h(xi,   yi+1, zi)   * (1-u)*v    *(1-w) +
    h(xi+1, yi+1, zi)   * u    *v    *(1-w) +
    h(xi,   yi,   zi+1) * (1-u)*(1-v)*w     +
    h(xi+1, yi,   zi+1) * u    *(1-v)*w     +
    h(xi,   yi+1, zi+1) * (1-u)*v    *w     +
    h(xi+1, yi+1, zi+1) * u    *v    *w
  );
}

function fbm(x: number, y: number, z: number, seed: number): number {
  let val = 0, amp = 0.5, f = 1.0;
  const sx = seed * 0.37, sy = seed * 0.13;
  for (let i = 0; i < 5; i++) {
    val += amp * valueNoise(x * f + sx, y * f + sy, z * f);
    f *= 2.0; amp *= 0.5;
  }
  return Math.min(1, Math.max(0, val));
}

// Biome → palette mapping
interface Palette {
  deep: THREE.Color;
  shallow: THREE.Color;
  beach: THREE.Color;
  low: THREE.Color;
  mid: THREE.Color;
  peak: THREE.Color;
  sky: string;
  fog: string;
  treeN: number;
  flowerN: number;
  treeKind: 'round' | 'pine' | 'palm' | 'crystal' | 'dead' | 'cactus';
  waterLevel: number;
}

function getBiomePalette(biome: BiomeType): Palette {
  switch (biome) {
    case 'TEMPERATE':
      return {
        deep: new THREE.Color('#1a4fa0'), shallow: new THREE.Color('#3a8fc0'),
        beach: new THREE.Color('#d4b483'), low: new THREE.Color('#4a9e3a'),
        mid: new THREE.Color('#2d7a28'), peak: new THREE.Color('#c8d8e0'),
        sky: '#5588cc', fog: '#a0c4e8', treeN: 30, flowerN: 50,
        treeKind: 'round', waterLevel: -0.06,
      };
    case 'OCEAN':
      return {
        deep: new THREE.Color('#0a2a6a'), shallow: new THREE.Color('#1a5ab0'),
        beach: new THREE.Color('#4080d0'), low: new THREE.Color('#3070c0'),
        mid: new THREE.Color('#2060b0'), peak: new THREE.Color('#4090d0'),
        sky: '#1840a0', fog: '#3070c0', treeN: 5, flowerN: 0,
        treeKind: 'round', waterLevel: 0.15,
      };
    case 'DESERT':
      return {
        deep: new THREE.Color('#8b5e2a'), shallow: new THREE.Color('#c8904a'),
        beach: new THREE.Color('#e0c080'), low: new THREE.Color('#c8a850'),
        mid: new THREE.Color('#d4a040'), peak: new THREE.Color('#f0d080'),
        sky: '#e8c080', fog: '#f0d8a0', treeN: 6, flowerN: 0,
        treeKind: 'cactus', waterLevel: -0.20,
      };
    case 'ICE':
      return {
        deep: new THREE.Color('#2060a0'), shallow: new THREE.Color('#60a8d0'),
        beach: new THREE.Color('#d0e8f0'), low: new THREE.Color('#b0d8f0'),
        mid: new THREE.Color('#e8f4ff'), peak: new THREE.Color('#ffffff'),
        sky: '#a0c8e8', fog: '#d0e8f8', treeN: 8, flowerN: 0,
        treeKind: 'crystal', waterLevel: -0.04,
      };
    case 'VOLCANIC':
      return {
        deep: new THREE.Color('#3a0a00'), shallow: new THREE.Color('#7a1500'),
        beach: new THREE.Color('#5a2000'), low: new THREE.Color('#8b2a00'),
        mid: new THREE.Color('#c03800'), peak: new THREE.Color('#ff6020'),
        sky: '#200500', fog: '#5a1500', treeN: 0, flowerN: 0,
        treeKind: 'dead', waterLevel: -0.20,
      };
    case 'TOXIC':
      return {
        deep: new THREE.Color('#4a3a00'), shallow: new THREE.Color('#8a6a00'),
        beach: new THREE.Color('#c09020'), low: new THREE.Color('#a07010'),
        mid: new THREE.Color('#806000'), peak: new THREE.Color('#d0a030'),
        sky: '#604000', fog: '#907020', treeN: 0, flowerN: 0,
        treeKind: 'dead', waterLevel: -0.15,
      };
    case 'AIRLESS':
      return {
        deep: new THREE.Color('#303030'), shallow: new THREE.Color('#505050'),
        beach: new THREE.Color('#707070'), low: new THREE.Color('#606060'),
        mid: new THREE.Color('#787878'), peak: new THREE.Color('#909090'),
        sky: '#080808', fog: '#181818', treeN: 0, flowerN: 0,
        treeKind: 'dead', waterLevel: -0.20,
      };
    case 'GAS':
      return {
        deep: new THREE.Color('#3a2060'), shallow: new THREE.Color('#5040a0'),
        beach: new THREE.Color('#806090'), low: new THREE.Color('#906080'),
        mid: new THREE.Color('#a07090'), peak: new THREE.Color('#c0a0c0'),
        sky: '#302050', fog: '#605080', treeN: 0, flowerN: 0,
        treeKind: 'dead', waterLevel: -0.20,
      };
    case 'METHANE':
      return {
        deep: new THREE.Color('#8b4a10'), shallow: new THREE.Color('#c07020'),
        beach: new THREE.Color('#e09040'), low: new THREE.Color('#d08030'),
        mid: new THREE.Color('#b86020'), peak: new THREE.Color('#e0a050'),
        sky: '#804010', fog: '#c06020', treeN: 0, flowerN: 0,
        treeKind: 'dead', waterLevel: 0.0,
      };
    case 'FROZEN_ROCK':
    default:
      return {
        deep: new THREE.Color('#2a2a3a'), shallow: new THREE.Color('#4a4a5a'),
        beach: new THREE.Color('#7a7a8a'), low: new THREE.Color('#6a6a7a'),
        mid: new THREE.Color('#8a8a9a'), peak: new THREE.Color('#c8c8d8'),
        sky: '#080810', fog: '#181825', treeN: 0, flowerN: 0,
        treeKind: 'dead', waterLevel: -0.18,
      };
  }
}

interface DeilandPlanetProps {
  body: CelestialBody;
  seed: number;
}

export const DeilandPlanet: React.FC<DeilandPlanetProps> = ({ body, seed }) => {
  const palette = useMemo(() => getBiomePalette(body.biome), [body.biome]);

  const { geometry, treeCount, flowerCount } = useMemo(() => {
    const { deep, shallow, beach, low, mid, peak, waterLevel } = palette;
    const base = new THREE.IcosahedronGeometry(PLANET_RADIUS, 4);
    const geo = base.toNonIndexed();
    base.dispose();

    const posAttr = geo.attributes.position;
    const newPositions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < posAttr.count; i += 3) {
      const vs = [0, 1, 2].map(j => new THREE.Vector3(
        posAttr.getX(i + j), posAttr.getY(i + j), posAttr.getZ(i + j)
      ));
      const ns = vs.map(v => v.clone().normalize());
      const heights = ns.map(n => (fbm(n.x * 1.8, n.y * 1.8, n.z * 1.8, seed) - 0.5) * 0.5);

      ns.forEach((n, j) => {
        const r = PLANET_RADIUS + heights[j];
        newPositions.push(n.x * r, n.y * r, n.z * r);
      });

      const avgH = (heights[0] + heights[1] + heights[2]) / 3;
      let col: THREE.Color;
      if (avgH < waterLevel - 0.06)         col = deep.clone();
      else if (avgH < waterLevel)            col = deep.clone().lerp(shallow, (avgH - (waterLevel - 0.06)) / 0.06);
      else if (avgH < waterLevel + 0.06)     col = shallow.clone().lerp(beach, (avgH - waterLevel) / 0.06);
      else if (avgH < waterLevel + 0.13)     col = beach.clone().lerp(low, (avgH - waterLevel - 0.06) / 0.07);
      else if (avgH < waterLevel + 0.22)     col = low.clone().lerp(mid, (avgH - waterLevel - 0.13) / 0.09);
      else                                    col = mid.clone().lerp(peak, Math.min(1, (avgH - waterLevel - 0.22) / 0.08));

      const rng = Math.abs(Math.sin(seed * 13.7 + i * 0.5));
      col.r = Math.min(1, col.r + (rng - 0.5) * 0.04);
      col.g = Math.min(1, col.g + (rng - 0.5) * 0.04);
      col.b = Math.min(1, col.b + (rng - 0.5) * 0.04);
      colors.push(col.r, col.g, col.b, col.r, col.g, col.b, col.r, col.g, col.b);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo, treeCount: palette.treeN, flowerCount: palette.flowerN };
  }, [seed, palette]);

  const objects = useMemo(() => {
    const rng = (n: number) => Math.abs(Math.sin(seed * 9.7 + n * 1234.567)) % 1;
    const waterLevel = palette.waterLevel;
    const kind = palette.treeKind;

    const trees: Array<{ pos: THREE.Vector3; up: THREE.Vector3; scale: number }> = [];
    const rocks: Array<{ pos: THREE.Vector3; up: THREE.Vector3; scale: number; rotY: number }> = [];
    const flowers: Array<{ pos: THREE.Vector3; up: THREE.Vector3; color: string }> = [];

    for (let i = 0; i < treeCount; i++) {
      const theta = Math.acos(1 - 2 * rng(i * 3));
      const phi   = rng(i * 3 + 1) * Math.PI * 2;
      const n     = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
      const h     = (fbm(n.x * 1.8, n.y * 1.8, n.z * 1.8, seed) - 0.5) * 0.5;
      if (h < waterLevel + 0.06) continue;
      trees.push({ pos: n.clone().multiplyScalar(PLANET_RADIUS + h + 0.05), up: n.clone(), scale: 0.5 + rng(i * 3 + 2) * 0.9 });
    }

    for (let i = 0; i < 20; i++) {
      const theta = Math.acos(1 - 2 * rng(i * 7 + 100));
      const phi   = rng(i * 7 + 101) * Math.PI * 2;
      const n     = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
      const h     = (fbm(n.x * 1.8, n.y * 1.8, n.z * 1.8, seed) - 0.5) * 0.5;
      rocks.push({ pos: n.clone().multiplyScalar(PLANET_RADIUS + Math.max(h, waterLevel) + 0.04), up: n.clone(), scale: 0.4 + rng(i * 7 + 102) * 1.2, rotY: rng(i * 7 + 103) * Math.PI * 2 });
    }

    const flowerColors = ['#ff6b6b','#ffd93d','#ff9f43','#a29bfe','#fd79a8','#55efc4','#74b9ff'];
    for (let i = 0; i < flowerCount; i++) {
      const theta = Math.acos(1 - 2 * rng(i * 11 + 200));
      const phi   = rng(i * 11 + 201) * Math.PI * 2;
      const n     = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
      const h     = (fbm(n.x * 1.8, n.y * 1.8, n.z * 1.8, seed) - 0.5) * 0.5;
      if (h < waterLevel + 0.08) continue;
      flowers.push({ pos: n.clone().multiplyScalar(PLANET_RADIUS + h + 0.04), up: n.clone(), color: flowerColors[Math.floor(rng(i * 11 + 202) * flowerColors.length)] });
    }

    return { trees, rocks, flowers, kind };
  }, [seed, palette, treeCount, flowerCount]);

  const TreeMesh: React.FC<{ scale: number; kind: typeof objects.kind }> = ({ scale, kind }) => {
    if (kind === 'dead' || kind === undefined) return (
      <mesh position={[0, 0.15 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.04 * scale, 0.07 * scale, 0.3 * scale, 4]} />
        <meshLambertMaterial color="#4a3a2a" flatShading />
      </mesh>
    );
    if (kind === 'cactus') return (<>
      <mesh position={[0, 0.2 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.06 * scale, 0.08 * scale, 0.4 * scale, 5]} />
        <meshLambertMaterial color="#3a7a2a" flatShading />
      </mesh>
      <mesh position={[0.12 * scale, 0.25 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.04 * scale, 0.04 * scale, 0.2 * scale, 4]} />
        <meshLambertMaterial color="#3a7a2a" flatShading />
      </mesh>
    </>);
    if (kind === 'crystal') return (<>
      <mesh position={[0, 0.15 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.03 * scale, 0.05 * scale, 0.3 * scale, 4]} />
        <meshLambertMaterial color="#80c0e0" flatShading />
      </mesh>
      <mesh position={[0, 0.55 * scale, 0]} castShadow>
        <coneGeometry args={[0.12 * scale, 0.6 * scale, 4]} />
        <meshLambertMaterial color="#80d8f0" flatShading transparent opacity={0.8} />
      </mesh>
    </>);
    if (kind === 'pine') return (<>
      <mesh position={[0, 0.2 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.04 * scale, 0.07 * scale, 0.4 * scale, 5]} />
        <meshLambertMaterial color="#6b4226" flatShading />
      </mesh>
      <mesh position={[0, 0.5 * scale, 0]} castShadow>
        <coneGeometry args={[0.28 * scale, 0.45 * scale, 5]} />
        <meshLambertMaterial color="#1a6b35" flatShading />
      </mesh>
      <mesh position={[0, 0.82 * scale, 0]} castShadow>
        <coneGeometry args={[0.17 * scale, 0.38 * scale, 5]} />
        <meshLambertMaterial color="#1a7a3a" flatShading />
      </mesh>
    </>);
    if (kind === 'palm') return (<>
      <mesh position={[0, 0.2 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.04 * scale, 0.07 * scale, 0.4 * scale, 5]} />
        <meshLambertMaterial color="#6b4226" flatShading />
      </mesh>
      <mesh position={[0, 0.55 * scale, 0]} castShadow>
        <coneGeometry args={[0.32 * scale, 0.2 * scale, 6]} />
        <meshLambertMaterial color="#3aad5c" flatShading />
      </mesh>
    </>);
    // round (default)
    return (<>
      <mesh position={[0, 0.2 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.04 * scale, 0.07 * scale, 0.4 * scale, 5]} />
        <meshLambertMaterial color="#6b4226" flatShading />
      </mesh>
      <mesh position={[0, 0.65 * scale, 0]} castShadow>
        <icosahedronGeometry args={[0.28 * scale, 0]} />
        <meshLambertMaterial color="#2d8b45" flatShading />
      </mesh>
    </>);
  };

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color={palette.sky} side={THREE.BackSide} />
      </mesh>

      {/* Clouds (temperate only) */}
      {(body.biome === 'TEMPERATE' || body.biome === 'OCEAN') && [0,1,2,3,4,5].map(i => {
        const rng2 = (n: number) => Math.abs(Math.sin(seed * 3.3 + n * 77.7)) % 1;
        const theta = 0.4 + rng2(i) * 1.2;
        const phi   = rng2(i + 10) * Math.PI * 2;
        const r     = PLANET_RADIUS + 0.9 + rng2(i + 20) * 0.3;
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.cos(theta);
        const z = r * Math.sin(theta) * Math.sin(phi);
        const s = 0.25 + rng2(i + 30) * 0.2;
        return (
          <mesh key={i} position={[x, y, z]} scale={[s * 1.8, s, s * 1.4]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color={palette.fog} transparent opacity={0.65} />
          </mesh>
        );
      })}

      {/* Trees */}
      {objects.trees.map((t, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), t.up);
        return (
          <group key={`t${i}`} position={t.pos} quaternion={q}>
            <TreeMesh scale={t.scale} kind={objects.kind} />
          </group>
        );
      })}

      {/* Rocks */}
      {objects.rocks.map((r, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), r.up);
        return (
          <group key={`r${i}`} position={r.pos} quaternion={q}>
            <mesh position={[0, 0.09 * r.scale, 0]} rotation={[0.3, r.rotY, 0.2]} castShadow>
              <icosahedronGeometry args={[0.17 * r.scale, 0]} />
              <meshLambertMaterial color="#8a7a6a" flatShading />
            </mesh>
          </group>
        );
      })}

      {/* Flowers */}
      {objects.flowers.map((f, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), f.up);
        return (
          <group key={`f${i}`} position={f.pos} quaternion={q}>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.08, 3]} />
              <meshLambertMaterial color="#2a6b20" />
            </mesh>
            <mesh position={[0, 0.085, 0]}>
              <sphereGeometry args={[0.035, 5, 4]} />
              <meshLambertMaterial color={f.color} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
