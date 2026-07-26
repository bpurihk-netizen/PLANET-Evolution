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
