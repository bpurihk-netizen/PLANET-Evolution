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

// ── Hemisphere orientation helpers ────────────────────────────────────────────

/**
 * For a given latitude, returns the compass direction of the meridian at upper
 * culmination (the point of highest altitude).
 *
 * Northern hemisphere (lat > 0): stars culminate due **south** (azimuth 180°).
 * Southern hemisphere (lat < 0): stars culminate due **north** (azimuth 0°).
 * Equator (lat = 0): stars pass the zenith; direction is undefined — treat as south.
 *
 * This is the core orientation flag used throughout the UI to switch "南中" ↔ "北中",
 * "南の空" ↔ "北の空", and "南天" ↔ "北天" for southern-hemisphere users.
 */
export function getTransitDirectionLabel(latDeg: number): '南' | '北' {
  return latDeg < 0 ? '北' : '南';
}

/** Full transit label: "南中" for northern hemisphere, "北中" for southern. */
export function getTransitLabel(latDeg: number): string {
  return `${getTransitDirectionLabel(latDeg)}中`;
}

/** Sky direction phrase: "南の空" (northern hemisphere) or "北の空" (southern). */
export function getSkyDirectionLabel(latDeg: number): string {
  return `${getTransitDirectionLabel(latDeg)}の空`;
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

/** Is this constellation above the horizon at the given latitude?
 *  Upper culmination altitude = 90 - |lat - dec|.
 *  Star is ever above horizon when that altitude > 0, i.e. |lat - dec| < 90. */
export function isAboveHorizon(decDeg: number, latDeg = JAPAN_LAT): boolean {
  return Math.abs(latDeg - decDeg) < 90;
}

/** Is this constellation circumpolar (never sets) at the given latitude?
 *  Northern hemisphere (lat > 0): circumpolar when dec > 90 - lat
 *  Southern hemisphere (lat < 0): circumpolar when dec < -90 - lat (i.e. close to south pole)
 *  Unified: sign(lat) × dec > 90 - |lat|   (at equator lat=0: 0 > 90, always false) */
export function isCircumpolar(decDeg: number, latDeg = JAPAN_LAT): boolean {
  if (latDeg === 0) return false; // no circumpolar stars at equator
  return Math.sign(latDeg) * decDeg > 90 - Math.abs(latDeg);
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
  /** Moonrise time as JST "HH:MM", or null if moon doesn't rise tonight */
  riseJST: string | null;
  /** Moonset time as JST "HH:MM", or null if moon doesn't set tonight */
  setJST: string | null;
  /** False when moon is too close to new moon to be observable */
  isVisibleTonight: boolean;
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

  // ── Moon rise/set times ────────────────────────────────────────────────────
  // New moon is invisible (illumination < ~3%)
  const isVisibleTonight = phase >= 0.033 && phase <= 0.967;

  let riseJST: string | null = null;
  let setJST: string | null = null;

  if (isVisibleTonight) {
    // Approximate Moon's ecliptic longitude: Sun's lon + phase*360
    const doy = getDayOfYear(date);
    const sunLon = ((doy - 80) / 365.25) * 360; // ecliptic lon, 0° at vernal equinox
    const moonLon = ((sunLon + phase * 360) % 360 + 360) % 360;

    // Ecliptic → equatorial (obliquity ε = 23.44°)
    const eps = 23.44 * (Math.PI / 180);
    const lonRad = moonLon * (Math.PI / 180);
    const moonRARaw = Math.atan2(Math.cos(eps) * Math.sin(lonRad), Math.cos(lonRad)) * (180 / Math.PI);
    const moonRA = ((moonRARaw % 360) + 360) % 360;
    const moonDecRad = Math.asin(Math.sin(eps) * Math.sin(lonRad));
    const moonDec = moonDecRad * (180 / Math.PI);

    // Hour angle at rise/set: cos(H) = (sin(h0) - sin(lat)·sin(dec)) / (cos(lat)·cos(dec))
    // h0 = −0.833° accounts for standard refraction + limb
    const h0Rad = -0.833 * (Math.PI / 180);
    const latRad = JAPAN_LAT * (Math.PI / 180);
    const cosH =
      (Math.sin(h0Rad) - Math.sin(latRad) * Math.sin(moonDecRad)) /
      (Math.cos(latRad) * Math.cos(moonDecRad));

    if (cosH <= 1 && cosH >= -1) {
      // Moon rises and sets today
      const H = Math.acos(cosH) * (180 / Math.PI) / 15; // half-day arc in hours

      // Transit time from midnight (hours)
      const lstDeg = getMidnightLSTDeg(date);
      const haAtMidnight = normHA(lstDeg - moonRA);
      const transitHours = -(haAtMidnight / 15);

      riseJST = formatTransitJST(transitHours - H);
      setJST  = formatTransitJST(transitHours + H);
    }
    // If cosH > 1: moon never rises at this latitude (rare edge case)
    // If cosH < -1: moon is circumpolar (stays above horizon all day)
  }

  return { phase, phaseKey, illumination, isWaxing, daysToFull, ...data, riseJST, setJST, isVisibleTonight };
}

// ── Planet Visibility ─────────────────────────────────────────────────────────

/** J2000 epoch as Julian Date */
const J2000 = 2451545.0;

/**
 * Keplerian orbital elements at J2000.0, with secular rates per Julian century.
 * Source: Meeus, "Astronomical Algorithms" 2nd ed., Table 31.a.
 *
 * L0   = mean longitude at J2000 (degrees)
 * Lc   = mean longitude rate (degrees per Julian century)
 * e0   = eccentricity at J2000 (dimensionless)
 * ec   = eccentricity rate (per Julian century)
 * w0   = longitude of perihelion at J2000 (degrees)  [ω̄ = ω + Ω]
 * wc   = longitude of perihelion rate (degrees per Julian century)
 * a    = semi-major axis (AU) — assumed constant for the accuracy window we need
 */
interface KeplerElements {
  L0: number; Lc: number;   // mean longitude
  e0: number; ec: number;   // eccentricity
  w0: number; wc: number;   // longitude of perihelion
  a:  number;               // semi-major axis (AU)
}

const KEPLER_ELEMENTS: Record<string, KeplerElements> = {
  // Earth (heliocentric; used to derive Sun's geocentric position)
  earth:   { L0: 100.46457, Lc: 36000.76983, e0: 0.01670862, ec: -0.00004204, w0: 102.93735, wc:  0.71953, a: 1.00000 },
  // Inner planets
  mercury: { L0: 252.25084, Lc: 149472.67411, e0: 0.20563069, ec:  0.00002527, w0:  77.45645, wc:  0.15969, a: 0.38710 },
  venus:   { L0: 181.97973, Lc: 58517.81539, e0: 0.00677188, ec: -0.00004777, w0: 131.53298, wc:  0.96935, a: 0.72333 },
  // Outer planets
  mars:    { L0: 355.43296, Lc: 19141.69631, e0: 0.09339410, ec:  0.00009149, w0: 336.04084, wc:  1.06612, a: 1.52366 },
  jupiter: { L0:  34.35148, Lc:  3034.90567, e0: 0.04849485, ec:  0.00016322, w0:  14.33131, wc:  0.21764, a: 5.20290 },
  saturn:  { L0:  50.07747, Lc:  1222.11494, e0: 0.05550825, ec: -0.00032044, w0:  93.05723, wc:  0.56046, a: 9.53707 },
};

/**
 * Equation of center — converts mean anomaly M (radians) and eccentricity e
 * into the true-anomaly correction (radians).
 *
 * v − M ≈ (2e − e³/4) sin M + (5e²/4) sin 2M + (13e³/12) sin 3M
 *
 * Accurate to ~0.01° for e < 0.2 (all solar-system planets qualify).
 */
function equationOfCenter(M: number, e: number): number {
  return (2 * e - (e ** 3) / 4) * Math.sin(M)
       + (5 / 4) * (e ** 2) * Math.sin(2 * M)
       + (13 / 12) * (e ** 3) * Math.sin(3 * M);
}

/**
 * Compute heliocentric ecliptic position (longitude in degrees 0–360, distance in AU)
 * for a body described by Keplerian elements at the given Julian Date.
 *
 * Algorithm (Meeus Ch. 25 / Ch. 33):
 *   T  = Julian centuries from J2000
 *   L  = mean longitude (L0 + Lc·T)
 *   e  = eccentricity  (e0 + ec·T)
 *   ω̄  = longitude of perihelion (w0 + wc·T)
 *   M  = mean anomaly = L − ω̄
 *   C  = equation of center = eoc(M, e)         [radians]
 *   ν  = true anomaly = M + C
 *   λ  = true heliocentric longitude = ω̄ + ν   (= L + C converted to degrees)
 *   r  = heliocentric distance = a(1−e²)/(1+e·cos ν)
 */
function keplerPos(key: string, jd: number): { lon: number; r: number } {
  const el = KEPLER_ELEMENTS[key];
  const T = (jd - J2000) / 36525.0;            // Julian centuries

  const L = el.L0 + el.Lc * T;                 // mean longitude (degrees)
  const e = el.e0 + el.ec * T;                 // eccentricity
  const w = el.w0 + el.wc * T;                 // longitude of perihelion (degrees)

  const Mrad = ((L - w) % 360 + 360) % 360 * (Math.PI / 180);   // mean anomaly (rad)
  const C    = equationOfCenter(Mrad, e);       // equation of center (radians)
  const nuRad = Mrad + C;                       // true anomaly (radians)

  // Heliocentric distance (AU)
  const r = el.a * (1 - e * e) / (1 + e * Math.cos(nuRad));

  // True heliocentric longitude (degrees, 0–360)
  const lonDeg = ((L + C * (180 / Math.PI)) % 360 + 360) % 360;

  return { lon: lonDeg, r };
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

  // Earth's heliocentric position (ecliptic plane, AU)
  const earth = keplerPos('earth', jd);
  const eRad  = earth.lon * (Math.PI / 180);
  const ex = earth.r * Math.cos(eRad);
  const ey = earth.r * Math.sin(eRad);

  const PLANETS: Array<{
    id: string; nameJa: string; emoji: string; systemId: string; isInner: boolean;
  }> = [
    { id: 'mercury', nameJa: '水星', emoji: '⚫', systemId: 'solar-system', isInner: true },
    { id: 'venus',   nameJa: '金星', emoji: '✨', systemId: 'solar-system', isInner: true },
    { id: 'mars',    nameJa: '火星', emoji: '🔴', systemId: 'solar-system', isInner: false },
    { id: 'jupiter', nameJa: '木星', emoji: '🟠', systemId: 'solar-system', isInner: false },
    { id: 'saturn',  nameJa: '土星', emoji: '🪐', systemId: 'solar-system', isInner: false },
  ];

  return PLANETS.map(({ id, nameJa, emoji, systemId, isInner }) => {
    // Planet's heliocentric position
    const planet = keplerPos(id, jd);
    const pRad   = planet.lon * (Math.PI / 180);
    const px = planet.r * Math.cos(pRad);
    const py = planet.r * Math.sin(pRad);

    // Geocentric vector: planet relative to Earth
    const gx = px - ex;
    const gy = py - ey;

    // Sun's geocentric direction from Earth (opposite of Earth's heliocentric pos)
    const sx = -ex;
    const sy = -ey;

    // Elongation = signed angle between geocentric Sun direction and geocentric planet
    // Sign: positive (east) when planet is east of Sun (evening sky), negative = morning
    const elongationDeg = Math.atan2(
      sx * gy - sy * gx,   // cross product (sin of angle, with sign)
      sx * gx + sy * gy,   // dot product   (cos of angle)
    ) * (180 / Math.PI);

    const visibility = isInner
      ? innerPlanetVisibility(elongationDeg)
      : outerPlanetVisibility(elongationDeg);

    const bestTimeJa = elongToBestTime(elongationDeg, isInner);
    const noteJa = elongToNoteJa(nameJa, visibility, elongationDeg);

    return { id, nameJa, emoji, elongationDeg, visibility, bestTimeJa, noteJa, systemId };
  });
}

// ── Annual Calendar ───────────────────────────────────────────────────────────

/** An astronomical event tied to a specific month */
export interface AstronomicalEvent {
  nameJa: string;       // Event name in Japanese
  dateHintJa: string;   // Approximate date/peak hint e.g. "極大：1月3〜4日ごろ"
  descJa: string;       // Short description in Japanese
  emoji: string;
}

/** One month's calendar entry */
export interface MonthlyCalendarEntry {
  month: number;                       // 1–12
  monthJa: string;                     // e.g. "1月"
  seasonJa: string;                    // 春/夏/秋/冬
  top3: VisibleConstellation[];        // Top 3 recommended constellations
  events: AstronomicalEvent[];         // Notable astronomical events this month
}

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function getSeasonJa(month: number): string {
  if (month >= 3 && month <= 5)  return '春';
  if (month >= 6 && month <= 8)  return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

/** Static notable astronomical events per month */
const MONTHLY_EVENTS: Record<number, AstronomicalEvent[]> = {
  1: [
    { nameJa: 'しぶんぎ座流星群', dateHintJa: '極大：1月3〜4日ごろ', descJa: '三大流星群のひとつ。放射点は北天のため、北を向いて観察。1時間に最大120個。', emoji: '☄️' },
    { nameJa: '冬の大三角が南中', dateHintJa: '20:00〜22:00ごろ', descJa: 'オリオン・おおいぬ・こいぬの3星座が夜空の中央に輝く冬の見ごろ。', emoji: '⭐' },
  ],
  2: [
    { nameJa: '冬の星座シーズン最盛期', dateHintJa: '19:00〜23:00ごろ', descJa: 'オリオン・ふたご・おうし座が高くなり、冬の星座が一番見やすい時期。', emoji: '🌟' },
    { nameJa: '木星・土星が見やすい年も', dateHintJa: '年による', descJa: '2月は夕方の西天や明け方の東天に外惑星が現れることがある。惑星情報を確認しよう。', emoji: '🪐' },
  ],
  3: [
    { nameJa: '春分', dateHintJa: '3月20〜21日ごろ', descJa: '昼夜の長さが等しくなる日。太陽がみずがめ座方向を通過し、春の星座が夜に登場し始める。', emoji: '🌸' },
    { nameJa: 'うみへび座南中', dateHintJa: '21:00〜22:00ごろ', descJa: '全天最大の星座うみへびが南の空を長く横切る。アルファルドが孤独に輝く。', emoji: '🐍' },
  ],
  4: [
    { nameJa: 'こと座流星群', dateHintJa: '極大：4月22〜23日ごろ', descJa: '春の流星群。1時間に10〜20個程度。ベガ近くの放射点から飛び出す優雅な流れ星。', emoji: '☄️' },
    { nameJa: '春の大曲線が見ごろ', dateHintJa: '22:00ごろ', descJa: '北斗七星の柄→アークトゥルス→スピカへ続く「春の大曲線」が天頂付近に輝く。', emoji: '🌿' },
  ],
  5: [
    { nameJa: 'みずがめ座η流星群', dateHintJa: '極大：5月6〜7日ごろ', descJa: 'ハレー彗星のかけらが引き起こす流星群。南半球では年最大級。日本でも夜明け前に見やすい。', emoji: '☄️' },
    { nameJa: 'おとめ座・しし座が見ごろ', dateHintJa: '21:00〜23:00ごろ', descJa: 'スピカとレグルスが夜空を彩る春の絶好シーズン。天の川銀河の方向を楽しもう。', emoji: '🦁' },
  ],
  6: [
    { nameJa: '夏至', dateHintJa: '6月21〜22日ごろ', descJa: '最も夜が短い日。夜が短いが、さそり座・いて座が南東の空に昇り始める夏の星座シーズン開幕。', emoji: '☀️' },
    { nameJa: '夏の大三角が昇り始める', dateHintJa: '22:00〜深夜', descJa: 'ベガ・デネブ・アルタイルの夏の大三角が東の空に現れ、銀河観察の季節が近づく。', emoji: '✨' },
  ],
  7: [
    { nameJa: '七夕', dateHintJa: '7月7日（旧暦は8月ごろ）', descJa: 'ベガ（織女星）とアルタイル（牽牛星）が天の川を挟んで輝く。夏の大三角も見ごろ。', emoji: '🎋' },
    { nameJa: 'やぎ座α流星群', dateHintJa: '極大：7月30日ごろ', descJa: '夏の流星群のひとつ。南の空のやぎ座付近から飛び出す。火球が多いことで知られる。', emoji: '☄️' },
  ],
  8: [
    { nameJa: 'ペルセウス座流星群', dateHintJa: '極大：8月12〜13日ごろ', descJa: '三大流星群で最も観察しやすい。1時間に最大100個以上。夏休みの夜空観察に最適！', emoji: '☄️' },
    { nameJa: 'さそり・いて座が南中', dateHintJa: '21:00〜23:00ごろ', descJa: '赤いアンタレスを持つさそり座が南の空の低いところに。天の川の中心方向を楽しもう。', emoji: '🦂' },
  ],
  9: [
    { nameJa: '中秋の名月（十五夜）', dateHintJa: '9月中旬〜10月初旬（年による）', descJa: '農歴8月15日の満月。ススキとお月見の日本の伝統行事。月明かりが明るく星座観察には不向き。', emoji: '🎑' },
    { nameJa: '秋分', dateHintJa: '9月22〜23日ごろ', descJa: '昼夜の長さが等しくなる日。秋の星座（ペガスス・アンドロメダ）が夜空の主役に。', emoji: '🍂' },
  ],
  10: [
    { nameJa: 'オリオン座流星群', dateHintJa: '極大：10月21〜22日ごろ', descJa: 'ハレー彗星のかけら。1時間に20〜25個。速くて明るい流れ星が特徴的。', emoji: '☄️' },
    { nameJa: '秋の四辺形が南中', dateHintJa: '22:00ごろ', descJa: 'ペガスス座の「秋の大四辺形」が天頂付近へ。アンドロメダ銀河の肉眼観察に最適な時期。', emoji: '⬛' },
  ],
  11: [
    { nameJa: 'しし座流星群', dateHintJa: '極大：11月17〜18日ごろ', descJa: '33年周期で「流星嵐」となる三大流星群。通常でも1時間10〜15個。深夜から明け方が見やすい。', emoji: '☄️' },
    { nameJa: 'フォーマルハウトが南中', dateHintJa: '21:00ごろ', descJa: '秋の一つ星・フォーマルハウトが南に輝く。みなみのうお座の唯一の一等星。', emoji: '🐟' },
  ],
  12: [
    { nameJa: 'ふたご座流星群', dateHintJa: '極大：12月13〜14日ごろ', descJa: '年間最多の流星群。1時間に最大150個。彗星ではなく小惑星ファエトンが母天体の珍しい流星群。', emoji: '☄️' },
    { nameJa: '冬至', dateHintJa: '12月21〜22日ごろ', descJa: '最も夜が長い日。オリオン座が深夜に南中し、冬の星座シーズン本格開幕。', emoji: '❄️' },
  ],
};

/** Compute the top 3 observable constellations for a given calendar month (1–12).
 *  Uses the 15th of each month as the representative date. */
export function computeMonthlyTop3(
  constellations: Constellation[],
  month: number,
  year = new Date().getFullYear(),
  latDeg = JAPAN_LAT,
): VisibleConstellation[] {
  const date = new Date(year, month - 1, 15); // 15th of the month
  const lstDeg = getMidnightLSTDeg(date);

  const scored: VisibleConstellation[] = constellations
    .map(con => {
      const score = computeVisibilityScore(con, lstDeg, latDeg);
      const transitHours = getTransitHoursFromMidnight(con.raDeg, lstDeg);
      return {
        constellation: con,
        score,
        transitHours,
        transitJST: formatTransitJST(transitHours),
        culminAlt: Math.round(getCulmAltitudeDeg(con.decDeg, latDeg)),
        transitDirection: getTransitDirectionLabel(latDeg),
        isPrimeTime: isPrimeTime(transitHours),
        isCircumpolar: isCircumpolar(con.decDeg, latDeg),
        easyRating: getEasyRating(con),
      };
    })
    .filter(v => v.score > 0);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/** Build a full 12-month annual calendar */
export function computeAnnualCalendar(
  constellations: Constellation[],
  year = new Date().getFullYear(),
  latDeg = JAPAN_LAT,
): MonthlyCalendarEntry[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      month,
      monthJa: MONTH_LABELS[i],
      seasonJa: getSeasonJa(month),
      top3: computeMonthlyTop3(constellations, month, year, latDeg),
      events: MONTHLY_EVENTS[month] ?? [],
    };
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface VisibleConstellation {
  constellation: Constellation;
  score: number;
  transitHours: number;     // Hours from midnight (negative = before midnight)
  transitJST: string;       // e.g. "21:30"
  culminAlt: number;        // Degrees above horizon at transit
  /** Compass direction of culmination: '南' for northern hemisphere, '北' for southern */
  transitDirection: '南' | '北';
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
  latDeg = JAPAN_LAT,
): NightSkyResult {
  const lstDeg = getMidnightLSTDeg(date);
  const sunRADeg = getSunRADeg(date);

  const scored: VisibleConstellation[] = constellations
    .map(con => {
      const score = computeVisibilityScore(con, lstDeg, latDeg);
      const transitHours = getTransitHoursFromMidnight(con.raDeg, lstDeg);
      return {
        constellation: con,
        score,
        transitHours,
        transitJST: formatTransitJST(transitHours),
        culminAlt: Math.round(getCulmAltitudeDeg(con.decDeg, latDeg)),
        transitDirection: getTransitDirectionLabel(latDeg),
        isPrimeTime: isPrimeTime(transitHours),
        isCircumpolar: isCircumpolar(con.decDeg, latDeg),
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
