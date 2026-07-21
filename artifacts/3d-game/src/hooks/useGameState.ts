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
}

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
};

const createPlanet = (id: number): PlanetState => {
  const time = id * 200; // Offset initial times so they look distinct
  const type = calculatePlanetType(defaultParams);
  const stats = calculateStats(defaultParams, time);
  return {
    id,
    name: `惑星0${id + 1}`,
    params: { ...defaultParams },
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
    lastParamChange: Date.now(),
    freezeTimer: 0,
    gravityTimer: 0,
  };
};

export function useGameState(): GameState {
  const [planets, setPlanets] = useState<PlanetState[]>([createPlanet(0), createPlanet(1), createPlanet(2)]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [globalSpeed, setGlobalSpeed] = useState(1);
  const [zoomLevel, setZoomLevel] = useState<0|1|2>(0);

  const lastUpdateRef = useRef<number>(performance.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const dt = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      setPlanets(prev => prev.map(p => {
        let newTime = p.time;
        if (!p.isPaused) {
          newTime += dt * p.params.formationSpeed * globalSpeed;
        }

        const phaseInfo = getPhaseInfo(newTime);
        
        // Time stop for waiting user interaction if crisis phase ends without failure
        if (phaseInfo.name === '危機の時代' && newTime >= 819 && !p.failureType) {
          newTime = 819;
        }
        if (newTime >= CYCLE_DURATION) newTime = newTime % CYCLE_DURATION;

        const newStats = calculateStats(p.params, newTime);

        let newFailure = p.failureType;
        let newVenusTimer = p.venusTimer;
        let newEcoTimer = p.ecoTimer;
        let newFreezeTimer = p.freezeTimer;
        let newGravityTimer = p.gravityTimer;

        if (!newFailure) {
          if (p.params.co2 > 85 && p.params.temperature > 80) newVenusTimer += dt; else newVenusTimer = 0;
          if (newVenusTimer > 90) newFailure = 'venus';

          if (newTime >= 500 && p.params.oxygen < 8 && newStats.biomass < 0.05) newEcoTimer += dt; else newEcoTimer = 0;
          if (newEcoTimer > 60) newFailure = 'ecosystem';

          const idleTime = (Date.now() - p.lastParamChange) / 1000;
          if (newTime >= 680 && idleTime > 120) newFailure = 'nuclear';

          if (newTime >= 320 && p.params.temperature < -60 && p.params.distance > 85) newFreezeTimer += dt; else newFreezeTimer = 0;
          if (newFreezeTimer > 120) newFailure = 'freeze';

          if (newTime <= 180 && p.params.size > 88) newGravityTimer += dt; else newGravityTimer = 0;
          if (newGravityTimer > 60) newFailure = 'gravity';

          if (newFailure && newTime < 820) {
            newTime = 820; // jump to collapse
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

        return { 
          ...p, 
          time: newTime, 
          stats: newStats,
          typeBlend: newBlend,
          failureType: newFailure,
          venusTimer: newVenusTimer,
          ecoTimer: newEcoTimer,
          freezeTimer: newFreezeTimer,
          gravityTimer: newGravityTimer,
          transformation: newTransformation,
          transformationBlend: newTransformationBlend
        };
      }));
      
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
      const newStats = calculateStats(nextParams, p[index].time);
      
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
        lastParamChange: Date.now()
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
       p[index] = { ...p[index], isPaused: !p[index].isPaused };
       return p;
    });
  };

  const resetPlanet = (index: number) => {
    setPlanets(prev => {
       const p = [...prev];
       p[index] = createPlanet(index);
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
    resetPlanet
  };
}
