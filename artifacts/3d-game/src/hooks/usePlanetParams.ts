export type Species = 'Aquatic' | 'Plant' | 'Insect' | 'Mammal' | 'Crystal' | 'Machine' | 'None';

export interface PlanetParams {
  temperature: number; // 0-100
  waterAmount: number; // 0-100
  nitrogen: number; // 0-80
  oxygen: number; // 0-40
  co2: number; // 0-80
  distance: number; // 0-100
  size: number; // 0-100
  species: Species;
  formationSpeed: number; // 0.5-10
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

export const calculatePlanetType = (params: PlanetParams): PlanetType => {
  const { temperature, waterAmount, size, co2, oxygen, distance } = params;
  if (size > 95 && temperature < 10) return 'BLACK HOLE';
  if (temperature > 90 && distance < 10) return 'STAR/SUN';
  if (size > 80) return 'GAS GIANT';
  if (temperature > 75) return 'FIRE PLANET';
  if (co2 > 60 && waterAmount < 10) return 'CRYSTAL PLANET';
  if (temperature < 20) return 'ICE WORLD';
  if (waterAmount > 70 && temperature >= 30 && temperature <= 70) return 'WATER WORLD';
  if (waterAmount >= 30 && waterAmount <= 70 && temperature >= 40 && temperature <= 65 && oxygen > 15) return 'GREEN PLANET';
  if (oxygen > 35) return 'GLOWING PLANET';
  if (waterAmount < 20 && temperature >= 40 && temperature <= 70) return 'DESERT PLANET';
  return 'HABITABLE';
};

export const calculateStats = (params: PlanetParams) => {
  const { temperature, waterAmount, nitrogen, oxygen, co2, size } = params;
  
  const tempScore = 100 - Math.abs(temperature - 50) * 2;
  const waterScore = 100 - Math.abs(waterAmount - 50) * 2;
  const habitability = Math.max(0, Math.min(100, (tempScore + waterScore) / 2));

  const lifeProb = Math.max(0, Math.min(100, habitability * (oxygen / 20)));
  
  const totalGas = nitrogen + oxygen + co2;
  const atmStability = Math.max(0, Math.min(100, 100 - Math.abs(totalGas - 100)));
  
  const gravity = size * 0.15;

  return { habitability, lifeProb, atmStability, gravity };
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
