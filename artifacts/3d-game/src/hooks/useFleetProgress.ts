const FLEET_SAVE_KEY = 'fleet_progress_v1';

export type FleetProgress = {
  shipLevel: number;       // 1〜50
  startRank: number;       // 0〜4（初期パワーランク。5レベルごとに+1）
  totalKills: number;      // 累計撃墜数
  bossesDefeated: number;  // ボス撃破数
  totalBattles: number;    // 総戦闘回数
  totalVictories: number;  // 勝利回数
};

const DEFAULT_FLEET: FleetProgress = {
  shipLevel: 1,
  startRank: 0,
  totalKills: 0,
  bossesDefeated: 0,
  totalBattles: 0,
  totalVictories: 0,
};

export const loadFleetProgress = (): FleetProgress => {
  try {
    const raw = localStorage.getItem(FLEET_SAVE_KEY);
    if (!raw) return { ...DEFAULT_FLEET };
    return { ...DEFAULT_FLEET, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_FLEET };
  }
};

export const saveFleetProgress = (progress: FleetProgress): void => {
  try {
    localStorage.setItem(FLEET_SAVE_KEY, JSON.stringify(progress));
  } catch {}
};

export const resetFleetProgress = (): void => {
  try {
    localStorage.removeItem(FLEET_SAVE_KEY);
  } catch {}
};

// 勝利時に呼ぶ更新関数
export const updateFleetOnVictory = (prev: FleetProgress, killsThisBattle: number, bossKilled: boolean): FleetProgress => {
  const newLevel = Math.min(50, prev.shipLevel + 1);
  const updated: FleetProgress = {
    shipLevel: newLevel,
    startRank: Math.min(4, Math.floor(newLevel / 5)),
    totalKills: prev.totalKills + killsThisBattle,
    bossesDefeated: prev.bossesDefeated + (bossKilled ? 1 : 0),
    totalBattles: prev.totalBattles + 1,
    totalVictories: prev.totalVictories + 1,
  };
  saveFleetProgress(updated);
  return updated;
};

// 敗北時に呼ぶ更新関数（惑星が崩壊したらリセット）
export const updateFleetOnDefeat = (prev: FleetProgress): FleetProgress => {
  const updated: FleetProgress = {
    ...prev,
    totalBattles: prev.totalBattles + 1,
  };
  saveFleetProgress(updated);
  return updated;
};
