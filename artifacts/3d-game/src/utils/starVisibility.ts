// Star visibility calculator — Japan (latitude 35°N) based
// Pure math, no external APIs.  Accuracy: ±15 min on transit times, adequate for educational use.

import { Constellation } from '../data/constellations';

// Japan's standard latitude and longitude
export const JAPAN_LAT = 35.0;    // degrees N
export const JAPAN_LON = 135.0;   // degrees E  (JST meridian)

// ── Day/year helpers ──────────────────────────────────────────────────────────

/** Day of year: Jan 1 = 1, Dec 31 = 365/366 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Approximate Sun's Right Ascension in degrees for a given day of year.
 *  Uses the simple mean-sun model (accuracy ~1°).
 *  Vernal equinox ≈ day 80 (March 21), RA_sun = 0°. */
export function getSunRADeg(date: Date): number {
  const doy = getDayOfYear(date);
  // Approximate ecliptic longitude (degrees)
  const lambda = ((doy - 80) / 365.25) * 360;
  // Convert ecliptic longitude to RA (simplified: obliquity ε=23.44°)
  const eps = 23.44 * (Math.PI / 180);
  const lambdaRad = lambda * (Math.PI / 180);
  const raRad = Math.atan2(Math.cos(eps) * Math.sin(lambdaRad), Math.cos(lambdaRad));
  let ra = raRad * (180 / Math.PI);
  if (ra < 0) ra += 360;
  return ra;
}

/** Local Sidereal Time at local midnight for Japan (degrees).
 *  At local midnight, the point OPPOSITE the Sun is on the meridian. */
export function getMidnightLSTDeg(date: Date): number {
  const sunRA = getSunRADeg(date);
  // Midnight LST = sunRA + 180°
  return (sunRA + 180) % 360;
}

// ── Visibility math ────────────────────────────────────────────────────────────

/** Normalise an angle to [-180, 180]. */
function normHA(deg: number): number {
  let h = ((deg % 360) + 360) % 360;
  if (h > 180) h -= 360;
  return h;
}

/** Meridian altitude (degrees above S horizon) at culmination.
 *  If result < 0, the star never rises at this latitude. */
export function getCulmAltitudeDeg(decDeg: number, latDeg = JAPAN_LAT): number {
  // Upper culmination altitude = 90 - |lat - dec|
  return 90 - Math.abs(latDeg - decDeg);
}

/** Is this constellation above the horizon at Japan? */
export function isAboveHorizon(decDeg: number, latDeg = JAPAN_LAT): boolean {
  // A star rises if its upper culmination altitude > 0, i.e. dec > lat - 90
  return decDeg > latDeg - 90;
}

/** Is this constellation circumpolar (never sets) at Japan? */
export function isCircumpolar(decDeg: number, latDeg = JAPAN_LAT): boolean {
  return decDeg > 90 - latDeg; // dec > 55°
}

/** Hour angle of constellation at midnight (degrees).
 *  HA > 0 → west of meridian (already transited, setting)
 *  HA < 0 → east of meridian (rising, will transit later) */
export function getHAatMidnight(conRA: number, lstDeg: number): number {
  return normHA(lstDeg - conRA);
}

/** Approximate local transit (南中) time as hours from midnight JST.
 *  Negative = before midnight, positive = after midnight.
 *  E.g. -2.5 → transit at 21:30. */
export function getTransitHoursFromMidnight(conRA: number, lstDeg: number): number {
  const ha = getHAatMidnight(conRA, lstDeg);
  // Transit is when HA=0; time offset = -HA / 15 hours/degree
  return -(ha / 15);
}

/** Format hours-from-midnight as JST string, e.g. "21:30" or "01:15". */
export function formatTransitJST(hoursFromMidnight: number): string {
  const totalHours = 0 + hoursFromMidnight; // 0 = midnight = 0:00
  // Map to 0–24 range
  let h = ((totalHours % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

/** Is the transit in an "evening prime-time" window (18:00 ~ 02:00 local)? */
export function isPrimeTime(hoursFromMidnight: number): boolean {
  // Prime time: -6h to +2h from midnight (i.e. 18:00 to 02:00)
  return hoursFromMidnight >= -6 && hoursFromMidnight <= 2;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/** 見つけやすさ rating based on area rank and declination from zenith. */
export function getEasyRating(con: Constellation): 1 | 2 | 3 {
  // Larger constellations (low area rank) are easier to find
  const altScore = con.areaRank <= 25 ? 3 : con.areaRank <= 55 ? 2 : 1;
  return altScore;
}

/** Compute a visibility score [0–100] for a constellation on the given date.
 *  Higher = better viewing conditions tonight at Japan. */
export function computeVisibilityScore(
  con: Constellation,
  lstDeg: number,
  latDeg = JAPAN_LAT,
): number {
  if (!isAboveHorizon(con.decDeg, latDeg)) return 0;

  const ha = getHAatMidnight(con.raDeg, lstDeg); // -180 to 180
  const hoursFromMid = -(ha / 15);

  // If transit is in prime-time window (18:00–02:00), high score
  const inWindow = hoursFromMid >= -6 && hoursFromMid <= 2;
  if (!inWindow) return 0;

  // Proximity to midnight meridian → higher score (HA → 0 is best)
  const absHA = Math.abs(ha);
  const proximityScore = Math.max(0, 100 - absHA * 1.2); // 0 at HA=83°

  // Altitude bonus: constellations near zenith (dec ≈ 35°) score higher
  const culminAlt = getCulmAltitudeDeg(con.decDeg, latDeg);
  const altBonus = Math.min(culminAlt / 90, 1) * 20;

  return Math.round(Math.min(100, proximityScore + altBonus));
}

// ── Moon Phase ────────────────────────────────────────────────────────────────

/** Known new moon reference: Jan 6, 2000 18:14 UTC → JD 2451549.729 */
const KNOWN_NEW_MOON_JD = 2451549.729;
/** Mean synodic period (days) */
const LUNAR_CYCLE = 29.53058867;

/** Julian Date from a JS Date */
function toJD(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

export type MoonPhaseKey =
  | 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export interface MoonPhase {
  phase: number;          // 0–1 (0 = new, 0.5 = full)
  phaseKey: MoonPhaseKey;
  emoji: string;
  nameJa: string;
  /** Illumination fraction 0–1 */
  illumination: number;
  /** Days until next full moon (≥0) */
  daysToFull: number;
  /** True if waxing (phase < 0.5) */
  isWaxing: boolean;
  /** Brief observation hint */
  hintJa: string;
}

export function computeMoonPhase(date: Date): MoonPhase {
  const jd = toJD(date);
  const daysSinceNew = jd - KNOWN_NEW_MOON_JD;
  const raw = ((daysSinceNew % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const phase = raw / LUNAR_CYCLE; // [0, 1)

  // Illumination: cos-based formula
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

  const isWaxing = phase < 0.5;

  // Days remaining to full (phase = 0.5)
  let daysToFull = (0.5 - phase) * LUNAR_CYCLE;
  if (daysToFull < 0) daysToFull += LUNAR_CYCLE;

  // Phase key (8-phase system)
  let phaseKey: MoonPhaseKey;
  if (phase < 0.0625 || phase >= 0.9375)      phaseKey = 'new';
  else if (phase < 0.1875)                    phaseKey = 'waxing_crescent';
  else if (phase < 0.3125)                    phaseKey = 'first_quarter';
  else if (phase < 0.4375)                    phaseKey = 'waxing_gibbous';
  else if (phase < 0.5625)                    phaseKey = 'full';
  else if (phase < 0.6875)                    phaseKey = 'waning_gibbous';
  else if (phase < 0.8125)                    phaseKey = 'last_quarter';
  else                                         phaseKey = 'waning_crescent';

  const PHASE_DATA: Record<MoonPhaseKey, { emoji: string; nameJa: string; hintJa: string }> = {
    new:             { emoji: '🌑', nameJa: '新月',     hintJa: '月が見えず、星空観察に最適な夜' },
    waxing_crescent: { emoji: '🌒', nameJa: '三日月',   hintJa: '日没後、西の空に細い月が輝く' },
    first_quarter:   { emoji: '🌓', nameJa: '上弦の月', hintJa: '半月。夕方南中し夜半に沈む' },
    waxing_gibbous:  { emoji: '🌔', nameJa: '十三夜月', hintJa: 'ほぼ満月。夜の大半を照らす' },
    full:            { emoji: '🌕', nameJa: '満月',     hintJa: '一晩中明るく輝く。星雲観察には不向き' },
    waning_gibbous:  { emoji: '🌖', nameJa: '十六夜',   hintJa: '夜半過ぎに昇り、明け方に輝く' },
    last_quarter:    { emoji: '🌗', nameJa: '下弦の月', hintJa: '夜中に昇り、夜明けに南中' },
    waning_crescent: { emoji: '🌘', nameJa: '有明月',   hintJa: '夜明け前の東の空に細い月が見える' },
  };

  const data = PHASE_DATA[phaseKey];
  return { phase, phaseKey, illumination, isWaxing, daysToFull, ...data };
}

// ── Planet Visibility ─────────────────────────────────────────────────────────

/** Simplified mean orbital elements at J2000.0 (Jan 1.5, 2000) */
const PLANET_ELEMENTS: Record<string, { L0: number; rate: number }> = {
  venus:   { L0: 181.98, rate: 1.6021318 },
  mars:    { L0: 355.43, rate: 0.5240208 },
  jupiter: { L0: 34.40,  rate: 0.0830853 },
  saturn:  { L0: 49.94,  rate: 0.0334985 },
};
const EARTH_ELEMENTS = { L0: 100.46, rate: 0.9856474 };

/** J2000 epoch as Julian Date */
const J2000 = 2451545.0;

/** Compute ecliptic longitude (degrees, mod 360) for a planet/Earth at given JD */
function eclipticLon(elements: { L0: number; rate: number }, jd: number): number {
  const days = jd - J2000;
  return ((elements.L0 + elements.rate * days) % 360 + 360) % 360;
}

/** Normalize angle to [-180, 180] */
function normAngle(deg: number): number {
  let d = ((deg % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

export type PlanetVisibility =
  | 'evening'   // visible in evening western sky (elongation 18–170°)
  | 'morning'   // visible in morning eastern sky (elongation -170–-18°)
  | 'opposition' // near opposition (outer planet, elongation ~180°)
  | 'hidden';    // too close to Sun

export interface PlanetInfo {
  id: string;
  nameJa: string;
  emoji: string;
  /** Elongation from Sun in degrees (-180..180). + = east = evening */
  elongationDeg: number;
  visibility: PlanetVisibility;
  /** Best viewing time (approximate JST) */
  bestTimeJa: string;
  /** One-line viewing note */
  noteJa: string;
  /** System id to navigate to */
  systemId: string;
}

/** Inner planet (Venus): max elongation ~47° */
function innerPlanetVisibility(elong: number): PlanetVisibility {
  const absE = Math.abs(elong);
  if (absE < 18) return 'hidden';
  return elong > 0 ? 'evening' : 'morning';
}

/** Outer planet: full range visible */
function outerPlanetVisibility(elong: number): PlanetVisibility {
  const absE = Math.abs(elong);
  if (absE < 18) return 'hidden';
  if (absE > 160) return 'opposition';
  return elong > 0 ? 'evening' : 'morning';
}

function elongToBestTime(elong: number, isInner: boolean): string {
  const absE = Math.abs(elong);
  if (absE < 18) return '観察不可';
  if (absE > 160) return '22:00ごろ南中';
  if (elong > 0) {
    // Evening sky: Sun sets ~18:00, planet is elong/15 hours after Sun
    const hoursAfterSunset = absE / 15;
    const h = Math.min(Math.round(18 + hoursAfterSunset), 23);
    return `${h}:00ごろ見ごろ`;
  } else {
    // Morning sky
    const hoursBeforeSunrise = absE / 15;
    const h = Math.max(Math.round(6 - hoursBeforeSunrise), 1);
    return `${h.toString().padStart(2,'0')}:00ごろ見ごろ`;
  }
}

function elongToNoteJa(nameJa: string, visibility: PlanetVisibility, elongDeg: number): string {
  const absE = Math.round(Math.abs(elongDeg));
  switch (visibility) {
    case 'hidden':    return `${nameJa}は太陽に近く、今夜は観察できない`;
    case 'opposition': return `${nameJa}は衝に近く、一晩中観察できる最高の好機！`;
    case 'evening':   return `${nameJa}は日没後の西の空に輝く（太陽から${absE}°東）`;
    case 'morning':   return `${nameJa}は夜明け前の東の空に輝く（太陽から${absE}°西）`;
  }
}

export function computePlanetsTonight(date: Date): PlanetInfo[] {
  const jd = toJD(date);
  const earthLon = eclipticLon(EARTH_ELEMENTS, jd);
  const sunLon = (earthLon + 180) % 360; // Sun's apparent longitude from Earth

  const PLANETS: Array<{
    id: string; nameJa: string; emoji: string; systemId: string; isInner: boolean;
  }> = [
    { id: 'venus',   nameJa: '金星', emoji: '✨', systemId: 'solar-system', isInner: true },
    { id: 'mars',    nameJa: '火星', emoji: '🔴', systemId: 'solar-system', isInner: false },
    { id: 'jupiter', nameJa: '木星', emoji: '🟠', systemId: 'solar-system', isInner: false },
    { id: 'saturn',  nameJa: '土星', emoji: '🪐', systemId: 'solar-system', isInner: false },
  ];

  return PLANETS.map(({ id, nameJa, emoji, systemId, isInner }) => {
    const planetLon = eclipticLon(PLANET_ELEMENTS[id], jd);
    const elongationDeg = normAngle(planetLon - sunLon);

    const visibility = isInner
      ? innerPlanetVisibility(elongationDeg)
      : outerPlanetVisibility(elongationDeg);

    const bestTimeJa = elongToBestTime(elongationDeg, isInner);
    const noteJa = elongToNoteJa(nameJa, visibility, elongationDeg);

    return { id, nameJa, emoji, elongationDeg, visibility, bestTimeJa, noteJa, systemId };
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface VisibleConstellation {
  constellation: Constellation;
  score: number;
  transitHours: number;     // Hours from midnight (negative = before midnight)
  transitJST: string;       // e.g. "21:30"
  culminAlt: number;        // Degrees above S horizon at transit
  isPrimeTime: boolean;
  isCircumpolar: boolean;
  easyRating: 1 | 2 | 3;   // ★ to ★★★ findability
}

export interface NightSkyResult {
  date: Date;
  lstDeg: number;
  sunRADeg: number;
  top5: VisibleConstellation[];         // Best tonight (prime-time, highest score)
  circumpolar: VisibleConstellation[];  // Always-visible (dec > 55°)
}

export function computeNightSky(
  constellations: Constellation[],
  date: Date = new Date(),
): NightSkyResult {
  const lstDeg = getMidnightLSTDeg(date);
  const sunRADeg = getSunRADeg(date);

  const scored: VisibleConstellation[] = constellations
    .map(con => {
      const score = computeVisibilityScore(con, lstDeg);
      const transitHours = getTransitHoursFromMidnight(con.raDeg, lstDeg);
      return {
        constellation: con,
        score,
        transitHours,
        transitJST: formatTransitJST(transitHours),
        culminAlt: Math.round(getCulmAltitudeDeg(con.decDeg)),
        isPrimeTime: isPrimeTime(transitHours),
        isCircumpolar: isCircumpolar(con.decDeg),
        easyRating: getEasyRating(con),
      };
    })
    .filter(v => v.score > 0 || v.isCircumpolar);

  // Top 5: prime-time, sorted by score desc
  const top5 = scored
    .filter(v => v.isPrimeTime && !v.isCircumpolar)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Circumpolar: always visible (dec > 55°), sorted by area rank
  const circumpolar = scored
    .filter(v => v.isCircumpolar)
    .sort((a, b) => a.constellation.areaRank - b.constellation.areaRank)
    .slice(0, 6);

  return { date, lstDeg, sunRADeg, top5, circumpolar };
}
