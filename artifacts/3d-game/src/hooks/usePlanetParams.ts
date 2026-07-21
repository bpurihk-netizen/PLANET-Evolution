import { transformations, FAILURE_TRANSFORMATIONS, Transformation } from '../data/transformations';

export type Species = 'Aquatic' | 'Plant' | 'Insect' | 'Mammal' | 'Crystal' | 'Machine' | 'None';

export interface PlanetParams {
  temperature: number; // -100 to 100
  waterAmount: number; // 0-100
  nitrogen: number; // 0-100
  oxygen: number; // 0-100
  co2: number; // 0-100
  distance: number; // 0-100
  size: number; // 0-100
  species: Species;
  formationSpeed: number; // 0.5-10
  
  // A. 地質・内核
  tectonicActivity: number;     // 0-100
  coreRotationSpeed: number;    // 0-100
  metallicCoreRatio: number;    // 0-100
  mantleViscosity: number;      // 0-100
  initialVolatiles: number;     // 0-100
  // B. 宇宙環境・軌道
  orbitalEccentricity: number;  // 0-100
  axialTilt: number;            // 0-90
  binaryStarInfluence: number;  // 0-100
  satelliteCount: number;       // 0-5
  asteroidBeltDensity: number;  // 0-100
  // C. 大気・海洋
  methaneConcentration: number; // 0-100
  ozoneLayerThickness: number;  // 0-100
  sulfurCompounds: number;      // 0-100
  oceanSalinity: number;        // 0-100
  cloudAlbedo: number;          // 0-100
  // D. 文明・生態系
  averageIntelligence: number;  // 0-100
  societalOrientation: number;  // 0-100
  biomeDiversity: number;       // 0-100
  energyEfficiency: number;     // 0-100
  spiritualityCulture: number;  // 0-100
}

export type PlanetType = 'HABITABLE' | 'ICE WORLD' | 'WATER WORLD' | 'GREEN PLANET' | 'DESERT PLANET' | 'FIRE PLANET' | 'GAS GIANT' | 'CRYSTAL PLANET' | 'GLOWING PLANET' | 'BLACK HOLE' | 'STAR/SUN';

export const PLANET_TYPE_IDS: Record<PlanetType, number> = {
  'HABITABLE': 0,
  'ICE WORLD': 1,
  'WATER WORLD': 2,
  'GREEN PLANET': 3,
  'DESERT PLANET': 4,
  'FIRE PLANET': 5,
  'GAS GIANT': 6,
  'CRYSTAL PLANET': 7,
  'GLOWING PLANET': 8,
  'BLACK HOLE': 9,
  'STAR/SUN': 10,
};

export const PLANET_TYPE_JA: Record<PlanetType, string> = {
  'HABITABLE': '居住可能惑星',
  'ICE WORLD': '氷の惑星',
  'WATER WORLD': '水の惑星',
  'GREEN PLANET': '緑の惑星',
  'DESERT PLANET': '砂漠の惑星',
  'FIRE PLANET': '火の惑星',
  'GAS GIANT': 'ガス惑星',
  'CRYSTAL PLANET': '水晶惑星',
  'GLOWING PLANET': '発光惑星',
  'BLACK HOLE': 'ブラックホール',
  'STAR/SUN': '恒星',
};

export const SPECIES_JA: Record<Species, string> = {
  'None': 'なし',
  'Aquatic': '水生生物',
  'Plant': '植物',
  'Insect': '昆虫',
  'Mammal': '哺乳類',
  'Crystal': '水晶生命体',
  'Machine': '機械文明',
};

export const calculatePlanetType = (params: PlanetParams): PlanetType => {
  const { temperature, waterAmount, size, co2, oxygen, distance } = params;
  if (size > 95 && temperature < -80) return 'BLACK HOLE';
  if (temperature > 80 && distance < 10) return 'STAR/SUN';
  if (size > 80) return 'GAS GIANT';
  if (temperature > 60) return 'FIRE PLANET';
  if (co2 > 60 && waterAmount < 10) return 'CRYSTAL PLANET';
  if (temperature < -20) return 'ICE WORLD';
  if (waterAmount > 70 && temperature >= -10 && temperature <= 50) return 'WATER WORLD';
  if (waterAmount >= 30 && waterAmount <= 70 && temperature >= -20 && temperature <= 40 && oxygen > 15) return 'GREEN PLANET';
  if (oxygen > 35) return 'GLOWING PLANET';
  if (waterAmount < 20 && temperature >= -20 && temperature <= 50) return 'DESERT PLANET';
  return 'HABITABLE';
};

export const calculateStats = (params: PlanetParams, time: number, asteroidStrikes: number = 0) => {
  const { 
    temperature, waterAmount, nitrogen, oxygen, co2, size,
    ozoneLayerThickness, cloudAlbedo, oceanSalinity, biomeDiversity, orbitalEccentricity,
    tectonicActivity, initialVolatiles, sulfurCompounds, methaneConcentration, asteroidBeltDensity,
    coreRotationSpeed, binaryStarInfluence, mantleViscosity,
    averageIntelligence, societalOrientation, energyEfficiency, spiritualityCulture
  } = params;
  
  // Habitability
  let tempScore = Math.max(0, 100 - Math.abs(temperature - 20) * 1.5);
  let waterScore = 100 - Math.abs(waterAmount - 50) * 2;
  let habitability = Math.max(0, Math.min(100, (tempScore + waterScore) / 2));
  
  habitability += (ozoneLayerThickness - 50) * 0.2;
  habitability -= Math.abs(cloudAlbedo - 30) * 0.1;
  habitability -= Math.abs(oceanSalinity - 35) * 0.05;
  habitability += biomeDiversity * 0.1;
  habitability -= orbitalEccentricity * 0.2;
  habitability = Math.max(0, Math.min(100, habitability));

  // Life Prob
  let lifeProb = Math.max(0, Math.min(100, habitability * (oxygen / 20)));
  lifeProb -= Math.abs(tectonicActivity - 45) * 0.15;
  lifeProb += initialVolatiles * 0.1;
  lifeProb -= sulfurCompounds * 0.3;
  lifeProb += methaneConcentration < 30 ? methaneConcentration * 0.2 : -(methaneConcentration - 30) * 0.5;
  lifeProb -= asteroidBeltDensity * 0.15;
  lifeProb = Math.max(0, Math.min(100, lifeProb));
  
  // ATM Stability
  const totalGas = nitrogen + oxygen + co2;
  let atmStability = Math.max(0, Math.min(100, 100 - Math.abs(totalGas - 100)));
  atmStability -= Math.abs(coreRotationSpeed - 45) * 0.2;
  if (coreRotationSpeed < 15 || coreRotationSpeed > 85) atmStability -= 15;
  atmStability -= sulfurCompounds * 0.4;
  atmStability -= binaryStarInfluence * 0.3;
  atmStability -= Math.abs(mantleViscosity - 50) * 0.1;
  atmStability = Math.max(0, Math.min(100, atmStability));
  
  const gravity = size * 0.15;

  let biomass = 0;
  if (time >= 320 && time < 500) biomass = (time - 320) / 180;
  else if (time >= 500 && time < 820) biomass = 1;
  else if (time >= 820 && time < 900) biomass = Math.max(0, 1 - (time - 820) / 80);

  // Apply asteroid damage continuously (only if biomass exists)
  if (biomass > 0) {
    biomass -= asteroidStrikes * 0.05;
    biomass = Math.max(0, biomass);
  }

  let civLevel = 0;
  if (time >= 500 && time < 680) civLevel = (time - 500) / 180;
  else if (time >= 680 && time < 820) civLevel = Math.max(0, 1 - (time - 680) / 140);

  if (civLevel > 0) {
    civLevel += averageIntelligence * 0.003;
    civLevel += societalOrientation * 0.002;
    civLevel += energyEfficiency * 0.002;
    civLevel += spiritualityCulture * 0.001;
    civLevel = Math.max(0, Math.min(1, civLevel));
  }

  return { habitability, lifeProb, atmStability, gravity, biomass, civLevel };
};

export const getTypeColor = (type: PlanetType) => {
  switch (type) {
    case 'ICE WORLD': return '#aaddff';
    case 'WATER WORLD': return '#0044ff';
    case 'GREEN PLANET': return '#00ff44';
    case 'DESERT PLANET': return '#ffaa00';
    case 'FIRE PLANET': return '#ff3300';
    case 'GAS GIANT': return '#cc8844';
    case 'CRYSTAL PLANET': return '#aa44ff';
    case 'GLOWING PLANET': return '#44ffaa';
    case 'BLACK HOLE': return '#000000';
    case 'STAR/SUN': return '#ffff00';
    default: return '#4488ff';
  }
};

export const detectTransformation = (
  params: PlanetParams,
  phase: string,
  stats: ReturnType<typeof calculateStats>,
  failureType: string | null
): { transformationId: string, transformation: Transformation } => {
  if (failureType) {
    const t = FAILURE_TRANSFORMATIONS.find(t => t.failureType === failureType);
    if (t) return { transformationId: t.id, transformation: t };
  }

  const priorityOrder = ['flower', 'whitehole', 'ark', 'angel'];
  for (const id of priorityOrder) {
    const t = transformations.find(t => t.id === id);
    if (t && t.trigger(params, phase, stats)) return { transformationId: id, transformation: t };
  }

  const speciesOrder = ['cyber', 'hive', 'spore', 'comic'];
  for (const id of speciesOrder) {
    const t = transformations.find(t => t.id === id);
    if (t && t.trigger(params, phase, stats)) return { transformationId: id, transformation: t };
  }

  for (const t of transformations) {
    if (![...priorityOrder, ...speciesOrder, 'green'].includes(t.id)) {
      if (t.trigger(params, phase, stats)) return { transformationId: t.id, transformation: t };
    }
  }

  const green = transformations.find(t => t.id === 'green')!;
  if (green.trigger(params, phase, stats)) return { transformationId: 'green', transformation: green };

  return { transformationId: 'green', transformation: green };
};
