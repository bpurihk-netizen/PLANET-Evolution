/**
 * useNoaaSpaceWeather.ts
 * Fetches real-time solar X-ray flux from NOAA SWPC (free, no API key, CORS-enabled).
 * Data source: GOES satellite 0.1–0.8 nm long-wave X-ray channel.
 * Refreshes every 5 minutes.
 */
import { useState, useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type FlareClass = 'A' | 'B' | 'C' | 'M' | 'X' | '?';

export interface SpaceWeatherData {
  /** X-ray flux in W/m² (0.1–0.8 nm GOES channel) */
  fluxWm2:    number;
  /** Flare class letter: A B C M X */
  flareClass: FlareClass;
  /** Numeric class magnitude, e.g. M4.5 → 4.5 */
  flareNum:   number;
  /** 0.0–1.0 normalized activity (A→0.05, B→0.2, C→0.45, M→0.75, X→1.0) */
  activityLevel: number;
  /** Human-readable label, e.g. "M4.5" */
  label: string;
  /** ISO timestamp of the measurement */
  timeTag: string | null;
  loading: boolean;
  error:   boolean;
}

// ── Flux → class conversion ───────────────────────────────────────────────────
function classifyFlux(flux: number): { cls: FlareClass; num: number; level: number } {
  // GOES X-ray classes (0.1–0.8 nm):
  //   A < 1e-7,  B < 1e-6,  C < 1e-5,  M < 1e-4,  X >= 1e-4
  if (flux >= 1e-4) {
    const num   = flux / 1e-4;
    // X1 = 0.75, X10 = 1.0 (capped)
    const level = Math.min(0.75 + 0.025 * Math.log10(num + 1), 1.0);
    return { cls: 'X', num: Math.round(num * 10) / 10, level };
  }
  if (flux >= 1e-5) {
    const num   = flux / 1e-5;
    const level = 0.55 + 0.20 * (Math.log10(flux / 1e-5) / 1); // 0.55→0.75
    return { cls: 'M', num: Math.round(num * 10) / 10, level };
  }
  if (flux >= 1e-6) {
    const num   = flux / 1e-6;
    const level = 0.30 + 0.25 * (Math.log10(flux / 1e-6)); // 0.30→0.55
    return { cls: 'C', num: Math.round(num * 10) / 10, level };
  }
  if (flux >= 1e-7) {
    const num   = flux / 1e-7;
    const level = 0.10 + 0.20 * (Math.log10(flux / 1e-7)); // 0.10→0.30
    return { cls: 'B', num: Math.round(num * 10) / 10, level };
  }
  const num   = Math.max(flux / 1e-8, 0.1);
  const level = 0.03 + 0.07 * Math.min(Math.log10(num + 1), 1);
  return { cls: 'A', num: Math.round(num * 10) / 10, level };
}

// ── NOAA GOES X-ray record ────────────────────────────────────────────────────
interface GoesRecord {
  time_tag:  string;
  flux:      number;
  energy:    string;
}

const NOAA_URL =
  'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json';

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

// ── Hook ──────────────────────────────────────────────────────────────────────
const DEFAULT: SpaceWeatherData = {
  fluxWm2:      0,
  flareClass:   '?',
  flareNum:     0,
  activityLevel: 0.2,   // typical quiet-sun default (low B class)
  label:        '読み込み中…',
  timeTag:      null,
  loading:      true,
  error:        false,
};

export function useNoaaSpaceWeather(): SpaceWeatherData {
  const [data, setData] = useState<SpaceWeatherData>(DEFAULT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    try {
      const res  = await fetch(NOAA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: GoesRecord[] = await res.json();

      // Filter to long-wave channel (0.1–0.8 nm) and take the latest entry
      const longWave = json.filter(r => r.energy === '0.1-0.8nm' && r.flux > 0);
      if (longWave.length === 0) throw new Error('No data');
      const latest = longWave[longWave.length - 1];

      const { cls, num, level } = classifyFlux(latest.flux);
      setData({
        fluxWm2:       latest.flux,
        flareClass:    cls,
        flareNum:      num,
        activityLevel: level,
        label:         cls === '?' ? '不明' : `${cls}${num.toFixed(1)}`,
        timeTag:       latest.time_tag,
        loading:       false,
        error:         false,
      });
    } catch {
      setData(prev => ({ ...prev, loading: false, error: true, label: '取得失敗' }));
    }
  };

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}
