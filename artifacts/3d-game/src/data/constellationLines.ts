/**
 * Constellation line segments for major constellations.
 * Each entry: [raDeg1, decDeg1, raDeg2, decDeg2]
 * Star positions are real J2000 RA/Dec in decimal degrees.
 */
export interface ConstellationLineSet {
  conId: string;   // IAU abbreviation
  segments: Array<[number, number, number, number]>;
}

export const CONSTELLATION_LINES: ConstellationLineSet[] = [
  // ── Orion ───────────────────────────────────────────────────────────────────
  { conId: 'ori', segments: [
    [88.79, 7.41,  83.00, -0.30],  // Betelgeuse – Mintaka
    [83.00, -0.30, 84.05, -1.20],  // Mintaka – Alnilam
    [84.05, -1.20, 85.19, -1.94],  // Alnilam – Alnitak
    [78.63, -8.20, 83.00, -0.30],  // Rigel – Mintaka
    [85.19, -1.94, 86.94, -9.67],  // Alnitak – Saiph
    [88.79, 7.41,  81.28,  6.35],  // Betelgeuse – Bellatrix
    [81.28,  6.35, 83.00, -0.30],  // Bellatrix – Mintaka
    [86.94, -9.67, 84.05, -1.20],  // Saiph – Alnilam (close shoulder line)
  ]},
  // ── Ursa Major (Big Dipper) ─────────────────────────────────────────────────
  { conId: 'uma', segments: [
    [165.93, 61.75, 165.46, 56.38], // Dubhe – Merak
    [165.46, 56.38, 178.46, 53.69], // Merak – Phecda
    [178.46, 53.69, 183.86, 57.03], // Phecda – Megrez
    [183.86, 57.03, 165.93, 61.75], // Megrez – Dubhe (bowl top)
    [183.86, 57.03, 193.51, 55.96], // Megrez – Alioth
    [193.51, 55.96, 200.98, 54.93], // Alioth – Mizar
    [200.98, 54.93, 206.89, 49.31], // Mizar – Alkaid
  ]},
  // ── Ursa Minor ──────────────────────────────────────────────────────────────
  { conId: 'umi', segments: [
    [37.95, 89.26,  222.68, 86.58], // Polaris – Kochab
    [222.68, 86.58, 236.06, 77.79], // Kochab – Pherkad
    [236.06, 77.79, 262.70, 74.16], // Pherkad – delta
    [262.70, 74.16, 247.74, 71.83], // delta – epsilon
    [247.74, 71.83, 248.52, 65.57], // epsilon – zeta
    [248.52, 65.57, 227.30, 65.96], // zeta – eta
    [37.95, 89.26,  248.52, 65.57], // Polaris – zeta (handle)
  ]},
  // ── Cassiopeia (W shape) ────────────────────────────────────────────────────
  { conId: 'cas', segments: [
    [2.29,  59.15, 10.13, 56.54],   // Caph – Schedar
    [10.13, 56.54, 14.18, 60.72],   // Schedar – Gamma
    [14.18, 60.72, 21.45, 60.24],   // Gamma – Ruchbah
    [21.45, 60.24, 28.60, 63.67],   // Ruchbah – Segin
  ]},
  // ── Cygnus (Northern Cross) ──────────────────────────────────────────────────
  { conId: 'cyg', segments: [
    [310.36, 45.28, 305.56, 40.26], // Deneb – Sadr
    [305.56, 40.26, 292.68, 27.96], // Sadr – Albireo
    [305.56, 40.26, 296.24, 45.13], // Sadr – Delta Cyg
    [305.56, 40.26, 311.55, 33.97], // Sadr – Gienah
    [296.24, 45.13, 318.23, 38.04], // Delta – Epsilon (cross arm)
  ]},
  // ── Scorpius ─────────────────────────────────────────────────────────────────
  { conId: 'sco', segments: [
    [241.36, -19.81, 240.08, -22.62], // Graffias – Dschubba
    [240.08, -22.62, 247.35, -26.43], // Dschubba – Antares
    [247.35, -26.43, 245.38, -25.59], // Antares – Sigma
    [247.35, -26.43, 252.54, -34.29], // Antares – Epsilon
    [252.54, -34.29, 253.65, -42.36], // Epsilon – Zeta
    [253.65, -42.36, 264.33, -43.00], // Zeta – Theta
    [264.33, -43.00, 265.62, -39.02], // Theta – Kappa
    [265.62, -39.02, 263.40, -37.10], // Kappa – Shaula
    [263.40, -37.10, 264.86, -38.02], // Shaula – Lesath
  ]},
  // ── Leo ──────────────────────────────────────────────────────────────────────
  { conId: 'leo', segments: [
    [152.09, 11.97, 154.99, 19.84], // Regulus – Eta
    [154.99, 19.84, 158.43, 23.77], // Eta – Gamma (Algieba)
    [158.43, 23.77, 168.53, 15.43], // Gamma – Zeta
    [168.53, 15.43, 177.26, 14.57], // Zeta – Mu
    [177.26, 14.57, 177.73, 20.52], // Mu – Denebola-area
    [158.43, 23.77, 164.04, 19.84], // Gamma – Delta (sickle)
    [164.04, 19.84, 168.53, 26.01], // Delta – Theta
    [168.53, 26.01, 177.26, 14.57], // Theta – Mu (hindquarter)
    [177.26, 14.57, 182.53, 14.57], // Mu – Denebola
  ]},
  // ── Gemini ───────────────────────────────────────────────────────────────────
  { conId: 'gem', segments: [
    [113.65, 31.89, 116.33, 28.03], // Castor – Pollux
    [113.65, 31.89, 100.98, 25.13], // Castor – Delta
    [116.33, 28.03, 100.43, 16.54], // Pollux – Wasat-area
    [100.98, 25.13,  93.72, 22.51], // Delta – Mebsuda
    [93.72,  22.51,  93.44, 13.22], // Mebsuda – Alhena
    [100.43, 16.54,  93.44, 13.22], // Wasat – Alhena
    [113.65, 31.89, 106.03, 33.96], // Castor – Mu
  ]},
  // ── Taurus ───────────────────────────────────────────────────────────────────
  { conId: 'tau', segments: [
    [68.98, 16.51, 65.74, 17.54],  // Aldebaran – Theta
    [68.98, 16.51, 76.96, 21.14],  // Aldebaran – Ain (ε)
    [76.96, 21.14, 80.19, 20.11],  // Ain – Aldebaran area
    [68.98, 16.51, 60.17, 12.49],  // Aldebaran – Zeta
    [60.17, 12.49, 57.46, 15.87],  // Zeta – El Nath (β)
    [56.87, 24.11, 57.46, 15.87],  // Pleiades center – El Nath
  ]},
  // ── Virgo ───────────────────────────────────────────────────────────────────
  { conId: 'vir', segments: [
    [201.30, -11.16, 195.54,  3.40], // Spica – Heze (Zeta)
    [195.54,  3.40,  190.42, 10.96], // Heze – Porrima (Gamma)
    [190.42, 10.96,  193.90, 14.72], // Porrima – Delta
    [193.90, 14.72,  194.01, 38.84], // Delta – Vindemiatrix (Epsilon)
    [194.01, 38.84,  188.32, 13.28], // Vindemiatrix – Zaniah (Eta)
    [188.32, 13.28,  190.42, 10.96], // Zaniah – Porrima
    [201.30,-11.16,  204.97, -9.55], // Spica – Mu
  ]},
  // ── Sagittarius (Teapot) ─────────────────────────────────────────────────────
  { conId: 'sgr', segments: [
    [283.82, -26.30, 276.04, -29.88], // Nunki – Ascella
    [276.04, -29.88, 275.25, -34.38], // Ascella – Kaus Meridionalis
    [275.25, -34.38, 271.45, -30.42], // Kaus Meridionalis – Kaus Borealis
    [271.45, -30.42, 274.41, -26.99], // Kaus Borealis – Nash
    [274.41, -26.99, 276.04, -29.88], // Nash – Ascella (spout)
    [271.45, -30.42, 274.41, -36.76], // Kaus Borealis – Kaus Australis
    [274.41, -36.76, 275.25, -34.38], // Kaus Australis – Kaus Meridionalis
  ]},
  // ── Lyra ─────────────────────────────────────────────────────────────────────
  { conId: 'lyr', segments: [
    [279.23, 38.78, 284.44, 33.36], // Vega – Epsilon Lyr
    [279.23, 38.78, 282.52, 32.69], // Vega – Zeta
    [282.52, 32.69, 283.63, 36.90], // Zeta – Delta (lozenge)
    [283.63, 36.90, 284.44, 33.36], // Delta – Epsilon
    [284.44, 33.36, 282.52, 32.69], // Epsilon – Zeta (bottom)
  ]},
  // ── Aquila ───────────────────────────────────────────────────────────────────
  { conId: 'aql', segments: [
    [297.70,  8.87, 296.55, 10.61], // Altair – Tarazed
    [297.70,  8.87, 296.97,  6.41], // Altair – Alshain
    [296.55, 10.61, 287.08, 13.86], // Tarazed – Zeta
    [296.97,  6.41, 298.83,  0.34], // Alshain – Theta
    [287.08, 13.86, 282.07,  8.46], // Zeta – Eta
  ]},
  // ── Perseus ──────────────────────────────────────────────────────────────────
  { conId: 'per', segments: [
    [50.69, 47.79, 51.08, 40.96],  // Mirfak – Delta
    [51.08, 40.96, 48.40, 35.79],  // Delta – Algol (Beta)
    [48.40, 35.79, 46.29, 33.19],  // Algol – Rho
    [50.69, 47.79, 55.89, 40.01],  // Mirfak – Gamma
    [55.89, 40.01, 66.87, 49.86],  // Gamma – Zeta
  ]},
  // ── Boötes ───────────────────────────────────────────────────────────────────
  { conId: 'boo', segments: [
    [213.91, 19.18, 218.02, 18.40], // Arcturus – Eta
    [213.91, 19.18, 211.59, 38.31], // Arcturus – Seginus (Gamma)
    [211.59, 38.31, 217.96, 33.31], // Seginus – Delta
    [217.96, 33.31, 221.26, 27.07], // Delta – Beta
    [221.26, 27.07, 218.02, 18.40], // Beta – Eta
    [213.91, 19.18, 208.67, 27.88], // Arcturus – Mu (Alkalurops)
    [208.67, 27.88, 211.59, 38.31], // Mu – Seginus
  ]},
  // ── Aquarius ─────────────────────────────────────────────────────────────────
  { conId: 'aqr', segments: [
    [322.89, -7.78, 321.67, -9.50], // Sadalsuud (β) – Sadalmelik (α)
    [321.67, -9.50, 318.68,-16.66], // Sadalmelik – Zeta
    [318.68,-16.66, 311.91,-15.82], // Zeta – Eta
    [311.91,-15.82, 310.36,-16.22], // Eta – Theta (water jar)
    [322.89, -7.78, 332.15,-20.77], // Sadalsuud – Delta (shoulder)
    [332.15,-20.77, 334.21,-21.17], // Delta – Skat (ε)
  ]},
  // ── Canis Major ──────────────────────────────────────────────────────────────
  { conId: 'cma', segments: [
    [101.29,-16.72,  95.68,-17.96], // Sirius – Mirzam
    [101.29,-16.72, 104.66,-29.30], // Sirius – Wezen
    [104.66,-29.30, 105.43,-26.39], // Wezen – Adhara
    [105.43,-26.39, 101.29,-16.72], // Adhara – Sirius
    [104.66,-29.30, 111.02,-28.97], // Wezen – Aludra
  ]},
  // ── Aries ─────────────────────────────────────────────────────────────────────
  { conId: 'ari', segments: [
    [31.79, 23.46, 28.66, 20.81],  // Hamal (α) – Sheratan (β)
    [28.66, 20.81, 28.38, 19.73],  // Sheratan – Mesarthim (γ)
    [31.79, 23.46, 34.84, 27.26],  // Hamal – 41 Ari (δ direction)
  ]},
  // ── Pisces ────────────────────────────────────────────────────────────────────
  { conId: 'psc', segments: [
    [354.97,  3.82, 345.98,  6.84], // Eta – Gamma
    [345.98,  6.84, 332.81,  6.72], // Gamma – Iota
    [332.81,  6.72, 330.40,  7.89], // Iota – Theta
    [330.40,  7.89, 325.85,  2.76], // Theta – Lambda
    [354.97,  3.82, 357.58,  7.35], // Eta – Kappa
    [357.58,  7.35, 358.00, 13.06], // Kappa – Alrescha (α)
  ]},
  // ── Capricornus ───────────────────────────────────────────────────────────────
  { conId: 'cap', segments: [
    [303.86,-26.92, 305.25,-14.78], // Deneb Algedi (δ) – Nashira (γ)
    [305.25,-14.78, 308.00,-17.00], // Nashira – Theta
    [308.00,-17.00, 311.52,-15.96], // Theta – Zeta
    [300.66,-18.13, 303.86,-26.92], // Al Thalimain (β) – Deneb Algedi
    [300.66,-18.13, 304.51,-12.54], // Al Thalimain – Alpha (al Giedi)
  ]},
  // ── Corona Borealis ───────────────────────────────────────────────────────────
  { conId: 'crb', segments: [
    [233.67, 26.71, 231.96, 29.11], // Alphecca (α) – Beta
    [231.96, 29.11, 229.13, 28.27], // Beta – Gamma
    [229.13, 28.27, 228.52, 25.92], // Gamma – Delta
    [233.67, 26.71, 235.78, 28.27], // Alphecca – Theta
    [235.78, 28.27, 237.31, 30.28], // Theta – Epsilon
  ]},
  // ── Andromeda ─────────────────────────────────────────────────────────────────
  { conId: 'and', segments: [
    [2.06,  29.09,  9.83, 30.86],  // Alpheratz (α) – Delta
    [9.83,  30.86, 17.43, 35.62],  // Delta – Mirach (β)
    [17.43, 35.62, 24.14, 48.63],  // Mirach – Mu
    [24.14, 48.63, 30.93, 42.33],  // Mu – Almach (γ)
    [17.43, 35.62, 19.93, 41.08],  // Mirach – Nu (to M31 direction)
  ]},
  // ── Pegasus (Great Square) ─────────────────────────────────────────────────
  { conId: 'peg', segments: [
    [346.19, 15.21, 328.48, 28.08], // Markab (α) – Scheat (β)
    [328.48, 28.08, 322.37, 33.17], // Scheat – Algenib (to and)
    [346.19, 15.21, 344.41,  9.87], // Markab – Homam (ζ)
    [344.41,  9.87, 342.16, 12.17], // Homam – Matar (η)
    [346.19, 15.21, 341.67, 33.18], // Markab – Algenib area
    [341.67, 33.18, 328.48, 28.08], // γ – Scheat (top line)
  ]},
  // ── Hercules ─────────────────────────────────────────────────────────────────
  { conId: 'her', segments: [
    [258.76, 31.60, 255.07, 14.39], // Kornephoros (β) – Alpha
    [255.07, 14.39, 250.32, 21.49], // Alpha – Sarin (δ)
    [250.32, 21.49, 248.02, 24.84], // Sarin – Pi (π)
    [248.02, 24.84, 245.31, 27.72], // Pi – Eta
    [245.31, 27.72, 258.76, 31.60], // Eta – Kornephoros (belt)
    [255.07, 14.39, 262.69, 26.11], // Alpha – Zeta
    [262.69, 26.11, 258.76, 31.60], // Zeta – Kornephoros
  ]},
];

/** Map from constellation ID to its line segments (fast lookup) */
export const CONSTELLATION_LINE_MAP = new Map<string, ConstellationLineSet>(
  CONSTELLATION_LINES.map(entry => [entry.conId, entry])
);
