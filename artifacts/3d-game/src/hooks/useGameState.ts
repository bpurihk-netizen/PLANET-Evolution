import { useState, useEffect, useRef } from 'react';
import { PlanetParams, PlanetType, calculatePlanetType, calculateStats, detectTransformation } from './usePlanetParams';

export type Phase = 'SUPERNOVA' | 'FORMATION' | 'COOLING' | 'WATER' | 'LIFE' | 'CIVILIZATION' | 'CRISIS' | 'COLLAPSE';

export const CYCLE_DURATION = 900;

export const PHASE_TIMINGS = [
  { name: '超新星爆発', start: 0, end: 15 },
  { name: '惑星形成', start: 15, end: 80 },
  { name: '冷却期', start: 80, end: 180 },
  { name: '大海洋の誕生', start: 180, end: 320 },
  { name: '生命の誕生', start: 320, end: 500 },
  { name: '文明の時代', start: 500, end: 680 },
  { name: '危機の時代', start: 680, end: 820 },
  { name: '崩壊', start: 820, end: 900 },
] as const;

export const getPhaseInfo = (time: number): typeof PHASE_TIMINGS[number] => {
  let current: typeof PHASE_TIMINGS[number] = PHASE_TIMINGS[0];
  for (const p of PHASE_TIMINGS) {
    if (time >= p.start && time < p.end) {
      current = p; break;
    }
  }
  return current;
};

export interface PlanetState {
  id: number;
  name: string;
  params: PlanetParams;
  time: number;
  isPaused: boolean;
  type: PlanetType;
  stats: ReturnType<typeof calculateStats>;
  prevType: PlanetType;
  typeBlend: number;
  transformation: string;
  transformationBlend: number;
  failureType: string | null;
  venusTimer: number;
  ecoTimer: number;
  lastParamChange: number;
  freezeTimer: number;
  gravityTimer: number;
  nuclearTimer: number;
  asteroidTimer: number;
  asteroidStrikes: number;
  milestones: {
    ocean: boolean;
    life: boolean;
    civilization: boolean;
    stable: boolean;
  };
  succeeded: boolean;
  spawnSeed: boolean;
  acknowledgedSuccess: boolean;
}

export interface GameState {
  planets: PlanetState[];
  activeIndex: number;
  globalSpeed: number;
  zoomLevel: 0 | 1 | 2;
  setZoomLevel: (z: 0|1|2) => void;
  setGlobalSpeed: (s: number) => void;
  setActiveIndex: (i: number) => void;
  updatePlanetParams: (index: number, params: Partial<PlanetParams>) => void;
  updatePlanetName: (index: number, name: string) => void;
  togglePause: (index: number) => void;
  resetPlanet: (index: number) => void;
  resetAllPlanets: () => void;
  dismissSuccessOverlay: (index: number) => void;
}

const SAVE_KEY = 'planet_evolution_save_v2';

type SaveData = {
  planets: Array<Omit<PlanetState, never>>;
  activeIndex: number;
  globalSpeed: number;
  zoomLevel: 0 | 1 | 2;
  savedAt: number;
};

const loadSave = (): SaveData | null => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (!Array.isArray(data.planets) || data.planets.length !== 3) return null;
    return data;
  } catch {
    return null;
  }
};

const defaultParams: PlanetParams = {
  temperature: 20,
  waterAmount: 50,
  nitrogen: 60,
  oxygen: 20,
  co2: 20,
  distance: 50,
  size: 50,
  species: 'None',
  formationSpeed: 1.0,
  tectonicActivity: 50,
  coreRotationSpeed: 50,
  metallicCoreRatio: 50,
  mantleViscosity: 50,
  initialVolatiles: 50,
  orbitalEccentricity: 10,
  axialTilt: 23,
  binaryStarInfluence: 0,
  satelliteCount: 1,
  asteroidBeltDensity: 20,
  methaneConcentration: 10,
  ozoneLayerThickness: 50,
  sulfurCompounds: 5,
  oceanSalinity: 35,
  cloudAlbedo: 30,
  averageIntelligence: 50,
  societalOrientation: 50,
  biomeDiversity: 50,
  energyEfficiency: 30,
  spiritualityCulture: 20,
};

const createPlanet = (id: number, useRandom: boolean = false): PlanetState => {
  const time = id * 200; // Offset initial times so they look distinct
  
  let params: PlanetParams = { ...defaultParams };

  if (useRandom) {
    const failureBias = Math.floor(Math.random() * 5); // 0-4
    
    // First, completely randomize everything to give an unstable starting point
    params = {
      ...params,
      temperature: -50 + Math.random() * 120,
      waterAmount: Math.random() * 100,
      nitrogen: Math.random() * 100,
      oxygen: Math.random() * 50,
      co2: Math.random() * 100,
      distance: 10 + Math.random() * 80,
      size: 20 + Math.random() * 60,
      tectonicActivity: Math.random() * 100,
      coreRotationSpeed: Math.random() * 100,
      metallicCoreRatio: Math.random() * 100,
      mantleViscosity: Math.random() * 100,
      initialVolatiles: Math.random() * 100,
      orbitalEccentricity: Math.random() * 100,
      axialTilt: Math.random() * 90,
      binaryStarInfluence: Math.random() * 100,
      satelliteCount: Math.floor(Math.random() * 6),
      asteroidBeltDensity: Math.random() * 100,
      methaneConcentration: Math.random() * 100,
      ozoneLayerThickness: Math.random() * 100,
      sulfurCompounds: Math.random() * 100,
      oceanSalinity: Math.random() * 100,
      cloudAlbedo: Math.random() * 100,
      averageIntelligence: Math.random() * 100,
      societalOrientation: Math.random() * 100,
      biomeDiversity: Math.random() * 100,
      energyEfficiency: Math.random() * 100,
      spiritualityCulture: Math.random() * 100,
    };

    switch (failureBias) {
      case 0: // Venus Collapse
        params.temperature = 65 + Math.random() * 25;
        params.waterAmount = Math.random() * 30;
        params.nitrogen = 20 + Math.random() * 40;
        params.oxygen = Math.random() * 10;
        params.co2 = 70 + Math.random() * 25;
        params.distance = 15 + Math.random() * 20;
        params.size = 30 + Math.random() * 60;
        params.methaneConcentration = 40 + Math.random() * 40;
        params.cloudAlbedo = Math.random() * 20;
        break;
      case 1: // Ecosystem Collapse
        params.temperature = 40 + Math.random() * 30;
        params.waterAmount = 30 + Math.random() * 40;
        params.nitrogen = 40 + Math.random() * 30;
        params.oxygen = Math.random() * 8;
        params.co2 = 50 + Math.random() * 40;
        params.distance = 40 + Math.random() * 30;
        params.size = 40 + Math.random() * 40;
        params.ozoneLayerThickness = Math.random() * 15;
        params.sulfurCompounds = 50 + Math.random() * 40;
        params.biomeDiversity = Math.random() * 20;
        break;
      case 2: // Nuclear Collapse (Induces neglect)
        params.temperature = 10 + Math.random() * 40;
        params.waterAmount = 30 + Math.random() * 40;
        params.nitrogen = 50 + Math.random() * 30;
        params.oxygen = 15 + Math.random() * 20;
        params.co2 = 20 + Math.random() * 30;
        params.distance = 40 + Math.random() * 20;
        params.size = 40 + Math.random() * 40;
        params.averageIntelligence = 70 + Math.random() * 28;
        params.societalOrientation = Math.random() * 20;
        params.asteroidBeltDensity = 50 + Math.random() * 40;
        break;
      case 3: // Thermal Death (Freeze)
        params.temperature = -90 + Math.random() * 30;
        params.waterAmount = Math.random() * 15;
        params.nitrogen = 30 + Math.random() * 50;
        params.oxygen = Math.random() * 15;
        params.co2 = Math.random() * 20;
        params.distance = 75 + Math.random() * 20;
        params.size = 20 + Math.random() * 50;
        params.methaneConcentration = Math.random() * 10;
        params.cloudAlbedo = 60 + Math.random() * 35;
        params.binaryStarInfluence = Math.random() * 15;
        break;
      case 4: // Gravity Collapse
        params.temperature = -20 + Math.random() * 60;
        params.waterAmount = 10 + Math.random() * 40;
        params.nitrogen = 20 + Math.random() * 50;
        params.oxygen = Math.random() * 20;
        params.co2 = 10 + Math.random() * 50;
        params.distance = 30 + Math.random() * 40;
        params.size = 85 + Math.random() * 13;
        params.metallicCoreRatio = 70 + Math.random() * 28;
        params.tectonicActivity = 70 + Math.random() * 28;
        params.mantleViscosity = 10 + Math.random() * 20;
        break;
    }
  }

  const type = calculatePlanetType(params);
  const stats = calculateStats(params, time, 0);

  return {
    id,
    name: `惑星0${id + 1}`,
    params,
    time,
    isPaused: false,
    type,
    stats,
    prevType: type,
    typeBlend: 1.0,
    transformation: 'green',
    transformationBlend: 1.0,
    failureType: null,
    venusTimer: 0,
    ecoTimer: 0,
    freezeTimer: 0,
    gravityTimer: 0,
    nuclearTimer: 0,
    asteroidTimer: 0,
    asteroidStrikes: 0,
    lastParamChange: Date.now(),
    milestones: {
      ocean: false,
      life: false,
      civilization: false,
      stable: false,
    },
    succeeded: false,
    spawnSeed: false,
    acknowledgedSuccess: false,
  };
};

export function useGameState(): GameState {
  const initialSave = useRef(loadSave());

  const [planets, setPlanets] = useState<PlanetState[]>(() => {
    const save = initialSave.current;
    if (save) {
      return save.planets.map(p => ({ ...p, lastParamChange: Date.now() }));
    }
    // No save data -> first boot -> create random unstable planets
    return [createPlanet(0, true), createPlanet(1, true), createPlanet(2, true)];
  });
  
  const [activeIndex, setActiveIndex] = useState(() => initialSave.current?.activeIndex ?? 0);
  const [globalSpeed, setGlobalSpeed] = useState(() => initialSave.current?.globalSpeed ?? 1);
  const [zoomLevel, setZoomLevel] = useState<0|1|2>(() => (initialSave.current?.zoomLevel as 0|1|2) ?? 0);

  const lastUpdateRef = useRef<number>(performance.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data: SaveData = {
        planets,
        activeIndex,
        globalSpeed,
        zoomLevel,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      } catch (e) {}
    }, 2000);
    return () => clearTimeout(timer);
  }, [planets, activeIndex, globalSpeed, zoomLevel]);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const dt = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      setPlanets(prev => {
        let spawnedParents: PlanetState[] = [];
        
        const nextPlanets = prev.map(p => {
          let newTime = p.time;
          if (!p.isPaused) {
            newTime += dt * p.params.formationSpeed * globalSpeed;
          }

          const phaseInfo = getPhaseInfo(newTime);
          
          if (phaseInfo.name === '危機の時代' && newTime >= 819 && !p.failureType) {
            newTime = 819;
          }

          const newStats = calculateStats(p.params, newTime, p.asteroidStrikes);

          let newFailure = p.failureType;
          let newVenusTimer = p.venusTimer;
          let newEcoTimer = p.ecoTimer;
          let newFreezeTimer = p.freezeTimer;
          let newGravityTimer = p.gravityTimer;
          let newNuclearTimer = p.nuclearTimer || 0;
          let newAsteroidTimer = p.asteroidTimer || 0;
          let newAsteroidStrikes = p.asteroidStrikes || 0;

          if (!newFailure) {
            let venusSpeed = p.params.methaneConcentration > 50 ? 1.5 : 1.0;
            if (p.params.co2 > 85 && p.params.temperature > 80) newVenusTimer += dt * venusSpeed; else newVenusTimer = 0;
            if (newVenusTimer > 90) newFailure = 'venus';

            if (newTime >= 500 && p.params.oxygen < 8 && newStats.biomass < 0.05) newEcoTimer += dt; else newEcoTimer = 0;
            if (newEcoTimer > 60) newFailure = 'ecosystem';

            if (newTime >= 680) {
              let nuclearSpeed = (p.params.societalOrientation < 25 && p.params.averageIntelligence > 70) ? 1.5 : 1.0;
              newNuclearTimer += dt * nuclearSpeed;
              if (newNuclearTimer > 120) newFailure = 'nuclear';
            } else {
              newNuclearTimer = 0;
            }

            if (newTime >= 320 && p.params.temperature < -60 && p.params.distance > 85) newFreezeTimer += dt; else newFreezeTimer = 0;
            if (newFreezeTimer > 120) newFailure = 'freeze';

            if (newTime <= 180 && p.params.size > 88) newGravityTimer += dt; else newGravityTimer = 0;
            if (newGravityTimer > 60) newFailure = 'gravity';

            if (p.params.asteroidBeltDensity > 60 && newTime >= 320) {
              newAsteroidTimer += dt;
              if (newAsteroidTimer > 200) { // On average 1 strike every 200 real-time seconds = 0.5% per sec
                 newAsteroidTimer = 0;
                 newAsteroidStrikes += 1;
              }
            }

            if (newFailure && newTime < 820) {
              newTime = 820; // jump to collapse
            }
          }

          let newMilestones = { ...p.milestones };
          let newSucceeded = p.succeeded;
          let newSpawnSeed = p.spawnSeed;

          if (p.time < 320 && newTime >= 320) {
            newMilestones.ocean = p.params.waterAmount > 30;
          }
          if (p.time < 500 && newTime >= 500) {
            newMilestones.life = newStats.lifeProb > 50 && newStats.biomass > 0.20;
          }
          if (p.time < 680 && newTime >= 680) {
            newMilestones.civilization = newStats.civLevel > 0.40 && newStats.habitability > 55;
          }

          if (newTime === 819) {
            const finalStable = (
              newStats.habitability > 65 &&
              newStats.biomass > 0.50 &&
              newStats.atmStability > 60 &&
              newStats.civLevel > 0.50
            );
            if (finalStable && !newSucceeded) {
              newSucceeded = true;
              newMilestones.stable = true;
              newSpawnSeed = true;
            }
          }

          const { transformationId } = detectTransformation(p.params, getPhaseInfo(newTime).name, newStats, newFailure);
          
          let newTransformation = p.transformation;
          let newTransformationBlend = p.transformationBlend;

          if (newTransformation !== transformationId) {
            newTransformation = transformationId;
            newTransformationBlend = 0.0;
          } else if (newTransformationBlend < 1.0) {
            newTransformationBlend = Math.min(1.0, newTransformationBlend + dt * 0.5); // 2s transition
          }

          let newBlend = p.typeBlend;
          if (newBlend < 1.0) {
            newBlend = Math.min(1.0, newBlend + dt * 2.0); // 0.5s transition
          }

          const updatedP = { 
            ...p, 
            time: newTime, 
            stats: newStats,
            typeBlend: newBlend,
            failureType: newFailure,
            venusTimer: newVenusTimer,
            ecoTimer: newEcoTimer,
            freezeTimer: newFreezeTimer,
            gravityTimer: newGravityTimer,
            nuclearTimer: newNuclearTimer,
            asteroidTimer: newAsteroidTimer,
            asteroidStrikes: newAsteroidStrikes,
            transformation: newTransformation,
            transformationBlend: newTransformationBlend,
            milestones: newMilestones,
            succeeded: newSucceeded,
            spawnSeed: newSpawnSeed
          };

          if (newSpawnSeed) {
            spawnedParents.push(updatedP);
            updatedP.spawnSeed = false;
          }

          return updatedP;
        });

        if (spawnedParents.length > 0) {
          for (const parent of spawnedParents) {
            let targetIndex = nextPlanets.findIndex(p => p.id !== parent.id && (p.succeeded || p.failureType !== null));
            if (targetIndex === -1) {
              let oldestTime = -1;
              let oldestIndex = -1;
              for (let i = 0; i < nextPlanets.length; i++) {
                if (nextPlanets[i].id !== parent.id && nextPlanets[i].time > oldestTime) {
                  oldestTime = nextPlanets[i].time;
                  oldestIndex = i;
                }
              }
              targetIndex = oldestIndex;
            }
            
            if (targetIndex !== -1) {
              const offset = () => Math.floor(Math.random() * 31) - 15;
              const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
              const newParams: PlanetParams = {
                ...parent.params,
                waterAmount: clamp(parent.params.waterAmount + offset(), 0, 100),
                temperature: clamp(parent.params.temperature + offset(), -100, 100),
                nitrogen: clamp(parent.params.nitrogen + offset(), 0, 100),
                oxygen: clamp(parent.params.oxygen + offset(), 0, 100),
                co2: clamp(parent.params.co2 + offset(), 0, 100),
                distance: clamp(parent.params.distance + offset(), 0, 100),
                size: clamp(parent.params.size + offset(), 0, 100),
              };
              
              const newPlanet = createPlanet(nextPlanets[targetIndex].id, false); // No random failure bias for offspring
              newPlanet.params = newParams;
              newPlanet.name = `${parent.name}の子孫 🌱`;
              newPlanet.time = 0;
              
              nextPlanets[targetIndex] = newPlanet;
            }
          }
        }

        return nextPlanets;
      });
      
      frameRef.current = requestAnimationFrame(loop);
    };
    
    lastUpdateRef.current = performance.now();
    frameRef.current = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(frameRef.current);
  }, [globalSpeed]);

  const updatePlanetParams = (index: number, newParams: Partial<PlanetParams>) => {
    setPlanets(prev => {
      const p = [...prev];
      const nextParams = { ...p[index].params, ...newParams };
      const newType = calculatePlanetType(nextParams);
      const newStats = calculateStats(nextParams, p[index].time, p[index].asteroidStrikes);
      
      let prevType = p[index].type;
      let blend = p[index].typeBlend;
      
      if (newType !== prevType) {
        prevType = p[index].type;
        blend = 0.0;
      }

      p[index] = { 
        ...p[index], 
        params: nextParams, 
        type: newType, 
        stats: newStats,
        prevType,
        typeBlend: blend,
        lastParamChange: Date.now(),
        nuclearTimer: 0 // Reset neglect timer on interaction
      };
      return p;
    });
  };

  const updatePlanetName = (index: number, name: string) => {
    setPlanets(prev => {
       const p = [...prev];
       p[index] = { ...p[index], name };
       return p;
    });
  };

  const togglePause = (index: number) => {
    setPlanets(prev => {
       const p = [...prev];
       p[index] = { ...p[index], isPaused: !p[index].isPaused, lastParamChange: Date.now(), nuclearTimer: 0 };
       return p;
    });
  };

  const resetPlanet = (index: number) => {
    setPlanets(prev => {
       const p = [...prev];
       p[index] = createPlanet(index, true); // Generate new random biased planet
       return p;
    });
  };

  const resetAllPlanets = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
    setPlanets([createPlanet(0, true), createPlanet(1, true), createPlanet(2, true)]);
    setActiveIndex(0);
    setGlobalSpeed(1);
    setZoomLevel(0);
  };

  const dismissSuccessOverlay = (index: number) => {
    setPlanets(prev => {
      const p = [...prev];
      p[index] = { ...p[index], acknowledgedSuccess: true };
      return p;
    });
  };

  return {
    planets,
    activeIndex,
    globalSpeed,
    zoomLevel,
    setZoomLevel,
    setGlobalSpeed,
    setActiveIndex,
    updatePlanetParams,
    updatePlanetName,
    togglePause,
    resetPlanet,
    resetAllPlanets,
    dismissSuccessOverlay
  };
}
