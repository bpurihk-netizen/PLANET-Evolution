import { useState, useCallback, useMemo } from 'react';
import { CONSTELLATIONS } from '../data/constellations';

const STAMP_RALLY_KEY = 'stamp_rally_v1';

interface StampRallyData {
  earnedIds: string[];
}

function loadStamps(): StampRallyData {
  try {
    const raw = localStorage.getItem(STAMP_RALLY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StampRallyData;
      // Normalize on load: remove any duplicates that may exist from prior bugs
      return { earnedIds: [...new Set(parsed.earnedIds)] };
    }
  } catch {}
  return { earnedIds: [] };
}

function saveStamps(data: StampRallyData) {
  try {
    localStorage.setItem(STAMP_RALLY_KEY, JSON.stringify(data));
  } catch {}
}

export interface StampRallyState {
  earnedIds: string[];
  earnedCount: number;
  totalCount: number;
  isAllEarned: boolean;
  hasStamp: (id: string) => boolean;
  awardStamp: (id: string) => boolean; // returns true if newly earned
  awardStamps: (ids: string[]) => string[]; // returns list of newly earned IDs
}

export function useStampRally(): StampRallyState {
  const [earnedIds, setEarnedIds] = useState<string[]>(() => loadStamps().earnedIds);

  const totalCount = CONSTELLATIONS.length; // 88

  const hasStamp = useCallback((id: string) => earnedIds.includes(id), [earnedIds]);

  const awardStamp = useCallback((id: string): boolean => {
    let earned = false;
    setEarnedIds(prev => {
      if (prev.includes(id)) return prev;
      earned = true;
      const next = [...prev, id];
      saveStamps({ earnedIds: next });
      return next;
    });
    return earned;
  }, []);

  const awardStamps = useCallback((ids: string[]): string[] => {
    // Dedupe the input batch first, then filter against existing state
    const uniqueInput = [...new Set(ids)];
    const newlyEarned: string[] = [];
    setEarnedIds(prev => {
      const prevSet = new Set(prev);
      const toAdd = uniqueInput.filter(id => !prevSet.has(id));
      if (toAdd.length === 0) return prev;
      newlyEarned.push(...toAdd);
      // Build next as a Set to guarantee no duplicates even across concurrent calls
      const next = [...new Set([...prev, ...toAdd])];
      saveStamps({ earnedIds: next });
      return next;
    });
    return newlyEarned;
  }, []);

  const isAllEarned = useMemo(() => earnedIds.length >= totalCount, [earnedIds.length, totalCount]);

  return {
    earnedIds,
    earnedCount: earnedIds.length,
    totalCount,
    isAllEarned,
    hasStamp,
    awardStamp,
    awardStamps,
  };
}
