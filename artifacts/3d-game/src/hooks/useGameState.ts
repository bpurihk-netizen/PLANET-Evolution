import { useState, useEffect, useRef } from 'react';

export type Phase = 
  | 'SUPERNOVA'
  | 'FORMATION'
  | 'COOLING'
  | 'WATER'
  | 'LIFE'
  | 'CIVILIZATION'
  | 'CRISIS'
  | 'COLLAPSE';

export interface GameState {
  time: number; // 0 to 108
  phase: Phase;
  phaseProgress: number; // 0 to 1 within the current phase
  timeToNext: number; // seconds
  ageBillionYears: number;
  lifeProgress: number; // 0 to 100
  civProgress: number; // 0 to 100
  speedMultiplier: number;
  setSpeedMultiplier: (val: number) => void;
}

const PHASE_TIMINGS = [
  { name: 'SUPERNOVA', start: 0, end: 5 },
  { name: 'FORMATION', start: 5, end: 20 },
  { name: 'COOLING', start: 20, end: 35 },
  { name: 'WATER', start: 35, end: 50 },
  { name: 'LIFE', start: 50, end: 70 },
  { name: 'CIVILIZATION', start: 70, end: 90 },
  { name: 'CRISIS', start: 90, end: 100 },
  { name: 'COLLAPSE', start: 100, end: 108 },
] as const;

export const CYCLE_DURATION = 108;

export function useGameState() {
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [time, setTime] = useState(0);

  const lastUpdateRef = useRef<number>(performance.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const deltaMs = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      const deltaSec = (deltaMs / 1000) * speedMultiplier;

      setTime((prevTime) => {
        let newTime = prevTime + deltaSec;
        if (newTime >= CYCLE_DURATION) {
          newTime = newTime % CYCLE_DURATION;
        }
        return newTime;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    lastUpdateRef.current = performance.now();
    frameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameRef.current);
  }, [speedMultiplier]);

  let currentPhaseInfo: typeof PHASE_TIMINGS[number] = PHASE_TIMINGS[0];
  for (const p of PHASE_TIMINGS) {
    if (time >= p.start && time < p.end) {
      currentPhaseInfo = p;
      break;
    }
  }

  const phaseDuration = currentPhaseInfo.end - currentPhaseInfo.start;
  const phaseTime = time - currentPhaseInfo.start;
  const phaseProgress = phaseTime / phaseDuration;
  const timeToNext = currentPhaseInfo.end - time;

  // Derive age
  // From 0 to 108 represents 0 to ~14 billion years
  const ageBillionYears = (time / CYCLE_DURATION) * 14.2;

  // Derive life progress
  let lifeProgress = 0;
  if (time >= 50 && time < 70) {
    lifeProgress = ((time - 50) / 20) * 100; // 0 to 100
  } else if (time >= 70 && time < 90) {
    lifeProgress = 100;
  } else if (time >= 90 && time < 100) {
    lifeProgress = 100 - ((time - 90) / 10) * 100; // 100 to 0
  }

  // Derive civ progress
  let civProgress = 0;
  if (time >= 70 && time < 90) {
    civProgress = ((time - 70) / 20) * 100;
  } else if (time >= 90 && time < 100) {
    civProgress = 100 - ((time - 90) / 10) * 100;
  }

  return {
    time,
    phase: currentPhaseInfo.name as Phase,
    phaseProgress,
    timeToNext,
    ageBillionYears,
    lifeProgress,
    civProgress,
    speedMultiplier,
    setSpeedMultiplier,
  };
}
