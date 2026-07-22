import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PlanetType } from '../../hooks/usePlanetParams';

export const PLANET_RADIUS = 4;

// Value noise (deterministic, returns [0,1])
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

interface DeilandPlanetProps {
  seed: number;
  planetType: PlanetType;
  waterAmount: number;
  temperature: number;
  biomass: number;
}

export const DeilandPlanet: React.FC<DeilandPlanetProps> = ({
  seed, planetType, waterAmount, biomass,
}) => {
  const { geometry, skyColor, fogColor, treeCount, flowerCount } = useMemo(() => {
    // --- Palette by planet type ---
    let deep    = new THREE.Color('#1a4fa0');
    let shallow = new THREE.Color('#3a8fc0');
    let beach   = new THREE.Color('#d4b483');
    let low     = new THREE.Color('#4a9e3a');
    let mid     = new THREE.Color('#2d7a28');
    let peak    = new THREE.Color('#c8d8e0');
    let skyCol  = '#5588cc';
    let fogCol  = '#a0c4e8';
    let treeN   = Math.round(25 + biomass * 20);
    let flowerN = Math.round(40 + biomass * 40);

    if (planetType === 'FIRE PLANET' || planetType === 'GLOWING PLANET') {
      deep = new THREE.Color('#3a0a00'); shallow = new THREE.Color('#7a1500');
      beach = new THREE.Color('#5a2000'); low = new THREE.Color('#8b2a00');
      mid = new THREE.Color('#c03800'); peak = new THREE.Color('#ff6020');
      skyCol = '#200500'; fogCol = '#5a1500'; treeN = 0; flowerN = 0;
    } else if (planetType === 'ICE WORLD') {
      deep = new THREE.Color('#2060a0'); shallow = new THREE.Color('#60a8d0');
      beach = new THREE.Color('#d0e8f0'); low = new THREE.Color('#b0d8f0');
      mid = new THREE.Color('#e8f4ff'); peak = new THREE.Color('#ffffff');
      skyCol = '#a0c8e8'; fogCol = '#d0e8f8'; treeN = 12; flowerN = 0;
    } else if (planetType === 'DESERT PLANET') {
      deep = new THREE.Color('#8b5e2a'); shallow = new THREE.Color('#c8904a');
      beach = new THREE.Color('#e0c080'); low = new THREE.Color('#c8a850');
      mid = new THREE.Color('#d4a040'); peak = new THREE.Color('#f0d080');
      skyCol = '#e8c080'; fogCol = '#f0d8a0'; treeN = 8; flowerN = 0;
    } else if (planetType === 'GAS GIANT') {
      deep = new THREE.Color('#3a2060'); shallow = new THREE.Color('#5040a0');
      beach = new THREE.Color('#806090'); low = new THREE.Color('#906080');
      mid = new THREE.Color('#a07090'); peak = new THREE.Color('#c0a0c0');
      skyCol = '#302050'; fogCol = '#605080'; treeN = 0; flowerN = 0;
    } else if (planetType === 'CRYSTAL PLANET') {
      deep = new THREE.Color('#204060'); shallow = new THREE.Color('#408090');
      beach = new THREE.Color('#80b0d0'); low = new THREE.Color('#60c0e0');
      mid = new THREE.Color('#80d8f0'); peak = new THREE.Color('#c0f0ff');
      skyCol = '#204060'; fogCol = '#406090'; treeN = 10; flowerN = 30;
    } else if (planetType === 'WATER WORLD') {
      deep = new THREE.Color('#0a3070'); shallow = new THREE.Color('#1a60c0');
      beach = new THREE.Color('#80c0e0');
      skyCol = '#3070b0'; fogCol = '#80b0e0'; treeN = 20; flowerN = 30;
    }

    // Water level: if low water amount, reduce deep-water areas
    const waterLevel = -0.12 * (waterAmount / 100);

    // --- Build terrain geometry ---
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

      // Displaced vertex positions
      ns.forEach((n, j) => {
        const r = PLANET_RADIUS + heights[j];
        newPositions.push(n.x * r, n.y * r, n.z * r);
      });

      // Face color by average height
      const avgH = (heights[0] + heights[1] + heights[2]) / 3;
      let col: THREE.Color;
      if (avgH < waterLevel - 0.06) {
        col = deep.clone();
      } else if (avgH < waterLevel) {
        col = deep.clone().lerp(shallow, (avgH - (waterLevel - 0.06)) / 0.06);
      } else if (avgH < waterLevel + 0.06) {
        col = shallow.clone().lerp(beach, (avgH - waterLevel) / 0.06);
      } else if (avgH < waterLevel + 0.13) {
        col = beach.clone().lerp(low, (avgH - waterLevel - 0.06) / 0.07);
      } else if (avgH < waterLevel + 0.22) {
        col = low.clone().lerp(mid, (avgH - waterLevel - 0.13) / 0.09);
      } else {
        col = mid.clone().lerp(peak, Math.min(1, (avgH - waterLevel - 0.22) / 0.08));
      }

      // Slight random variation per face for visual richness
      const rng = Math.abs(Math.sin(seed * 13.7 + i * 0.5));
      col.r = Math.min(1, col.r + (rng - 0.5) * 0.04);
      col.g = Math.min(1, col.g + (rng - 0.5) * 0.04);
      col.b = Math.min(1, col.b + (rng - 0.5) * 0.04);

      colors.push(col.r, col.g, col.b, col.r, col.g, col.b, col.r, col.g, col.b);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo, skyColor: skyCol, fogColor: fogCol, treeCount: treeN, flowerCount: flowerN };
  }, [seed, planetType, waterAmount, biomass]);

  // --- Scattered objects (trees, rocks, flowers) ---
  const objects = useMemo(() => {
    const rng = (n: number) => Math.abs(Math.sin(seed * 9.7 + n * 1234.567)) % 1;

    const trees: Array<{ pos: THREE.Vector3; up: THREE.Vector3; scale: number; kind: 'round' | 'pine' | 'palm' | 'crystal' }> = [];
    const rocks: Array<{ pos: THREE.Vector3; up: THREE.Vector3; scale: number; rotY: number }> = [];
    const flowers: Array<{ pos: THREE.Vector3; up: THREE.Vector3; color: string }> = [];

    const treeKind = ((): 'round' | 'pine' | 'palm' | 'crystal' => {
      if (planetType === 'ICE WORLD') return 'pine';
      if (planetType === 'DESERT PLANET') return 'palm';
      if (planetType === 'CRYSTAL PLANET') return 'crystal';
      return 'round';
    })();

    const waterLevel = -0.12 * (waterAmount / 100);

    for (let i = 0; i < treeCount; i++) {
      const theta = Math.acos(1 - 2 * rng(i * 3));
      const phi   = rng(i * 3 + 1) * Math.PI * 2;
      const n     = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
      const h     = (fbm(n.x * 1.8, n.y * 1.8, n.z * 1.8, seed) - 0.5) * 0.5;
      if (h < waterLevel + 0.06) continue; // skip water
      const pos   = n.clone().multiplyScalar(PLANET_RADIUS + h + 0.05);
      const scale = 0.5 + rng(i * 3 + 2) * 0.9;
      trees.push({ pos, up: n.clone(), scale, kind: treeKind });
    }

    for (let i = 0; i < 20; i++) {
      const theta = Math.acos(1 - 2 * rng(i * 7 + 100));
      const phi   = rng(i * 7 + 101) * Math.PI * 2;
      const n     = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
      const h     = (fbm(n.x * 1.8, n.y * 1.8, n.z * 1.8, seed) - 0.5) * 0.5;
      const pos   = n.clone().multiplyScalar(PLANET_RADIUS + Math.max(h, waterLevel) + 0.04);
      rocks.push({ pos, up: n.clone(), scale: 0.4 + rng(i * 7 + 102) * 1.2, rotY: rng(i * 7 + 103) * Math.PI * 2 });
    }

    const flowerColors = ['#ff6b6b','#ffd93d','#ff9f43','#a29bfe','#fd79a8','#55efc4','#74b9ff'];
    for (let i = 0; i < flowerCount; i++) {
      const theta = Math.acos(1 - 2 * rng(i * 11 + 200));
      const phi   = rng(i * 11 + 201) * Math.PI * 2;
      const n     = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
      const h     = (fbm(n.x * 1.8, n.y * 1.8, n.z * 1.8, seed) - 0.5) * 0.5;
      if (h < waterLevel + 0.08) continue;
      const pos   = n.clone().multiplyScalar(PLANET_RADIUS + h + 0.04);
      flowers.push({ pos, up: n.clone(), color: flowerColors[Math.floor(rng(i * 11 + 202) * flowerColors.length)] });
    }

    return { trees, rocks, flowers };
  }, [seed, planetType, waterAmount, treeCount, flowerCount]);

  return (
    <group>
      {/* Planet surface */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshLambertMaterial vertexColors flatShading />
      </mesh>

      {/* Sky dome (inside face) */}
      <mesh>
        <sphereGeometry args={[80, 16, 16]} />
        <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
      </mesh>

      {/* Clouds */}
      {[0,1,2,3,4,5].map(i => {
        const rng = (n: number) => Math.abs(Math.sin(seed * 3.3 + n * 77.7)) % 1;
        const theta = 0.4 + rng(i) * 1.2;
        const phi   = rng(i + 10) * Math.PI * 2;
        const r     = PLANET_RADIUS + 0.9 + rng(i + 20) * 0.3;
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.cos(theta);
        const z = r * Math.sin(theta) * Math.sin(phi);
        const s = 0.25 + rng(i + 30) * 0.2;
        return (
          <mesh key={i} position={[x, y, z]} scale={[s * 1.8, s, s * 1.4]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color={fogColor} transparent opacity={0.65} />
          </mesh>
        );
      })}

      {/* Trees */}
      {objects.trees.map((t, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), t.up);
        return (
          <group key={`t${i}`} position={t.pos} quaternion={q}>
            {/* Trunk */}
            <mesh position={[0, 0.2 * t.scale, 0]} castShadow>
              <cylinderGeometry args={[0.04 * t.scale, 0.07 * t.scale, 0.4 * t.scale, 5]} />
              <meshLambertMaterial color={t.kind === 'crystal' ? '#80c0e0' : '#6b4226'} flatShading />
            </mesh>
            {/* Canopy */}
            {t.kind === 'round' && (
              <mesh position={[0, 0.65 * t.scale, 0]} castShadow>
                <icosahedronGeometry args={[0.28 * t.scale, 0]} />
                <meshLambertMaterial color="#2d8b45" flatShading />
              </mesh>
            )}
            {t.kind === 'pine' && (<>
              <mesh position={[0, 0.5 * t.scale, 0]} castShadow>
                <coneGeometry args={[0.28 * t.scale, 0.45 * t.scale, 5]} />
                <meshLambertMaterial color="#1a6b35" flatShading />
              </mesh>
              <mesh position={[0, 0.82 * t.scale, 0]} castShadow>
                <coneGeometry args={[0.17 * t.scale, 0.38 * t.scale, 5]} />
                <meshLambertMaterial color="#1a7a3a" flatShading />
              </mesh>
            </>)}
            {t.kind === 'palm' && (
              <mesh position={[0, 0.55 * t.scale, 0]} castShadow>
                <coneGeometry args={[0.32 * t.scale, 0.2 * t.scale, 6]} />
                <meshLambertMaterial color="#3aad5c" flatShading />
              </mesh>
            )}
            {t.kind === 'crystal' && (
              <mesh position={[0, 0.55 * t.scale, 0]} castShadow>
                <coneGeometry args={[0.12 * t.scale, 0.6 * t.scale, 4]} />
                <meshLambertMaterial color="#80d8f0" flatShading transparent opacity={0.8} />
              </mesh>
            )}
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
            {/* Stem */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.08, 3]} />
              <meshLambertMaterial color="#2a6b20" />
            </mesh>
            {/* Petals */}
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
