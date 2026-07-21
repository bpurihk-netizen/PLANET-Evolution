import { useState, useEffect, useRef } from 'react';
import { PlanetParams, PlanetType, calculatePlanetType, calculateStats } from './usePlanetParams';

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

export const getPhaseInfo = (time: number) => {
  let current = PHASE_TIMINGS[0];
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
  temperature: 50,
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
  const type = calculatePlanetType(defaultParams);
  return {
    id,
    name: `惑星0${id + 1}`,
    params: { ...defaultParams },
    time: id * 200, // Offset initial times so they look distinct
    isPaused: false,
    type,
    stats: calculateStats(defaultParams),
    prevType: type,
    typeBlend: 1.0,
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
        let newBlend = p.typeBlend;
        if (newBlend < 1.0) {
          newBlend = Math.min(1.0, newBlend + dt * 2.0); // blend over 0.5s
        }

        if (p.isPaused) {
          return { ...p, typeBlend: newBlend };
        }
        
        let newTime = p.time + dt * p.params.formationSpeed * globalSpeed;
        if (newTime >= CYCLE_DURATION) newTime = newTime % CYCLE_DURATION;
        return { ...p, time: newTime, typeBlend: newBlend };
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
      const newStats = calculateStats(nextParams);
      
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
        typeBlend: blend
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
