// Constellation art data: star positions, line connections, and silhouette paths
// Coordinates are in a 0-100 x 0-100 normalized space (top-left origin)
// Stars are the main bright/notable stars in each constellation
// Lines connect stars to form the traditional stick figure shape
// Silhouette is an optional SVG path representing the mythological figure

export interface StarName {
  /** Japanese name / transliteration */
  nameJa: string;
  /** English / Latin name */
  nameEn: string;
  /** Arabic / Greek origin meaning, if notable */
  meaning?: string;
  /** True for the single brightest star in the constellation */
  isBrightest?: boolean;
}

export interface ConstellationArt {
  /** Key star positions [x, y] in 0-100 space */
  stars: [number, number][];
  /** Pairs of star indices to draw lines between */
  lines: [number, number][];
  /** Optional SVG path string for the mythological silhouette */
  silhouette?: string;
  /** Names for each star (null = unnamed). Index aligns with stars[]. */
  starNames?: (StarName | null)[];
}

export const CONSTELLATION_ART: Record<string, ConstellationArt> = {

  // ── オリオン座 (Orion) ──────────────────────────────────────────────────
  ori: {
    stars: [
      [28, 18],  // 0 Betelgeuse (left shoulder)
      [65, 15],  // 1 Bellatrix (right shoulder)
      [72, 75],  // 2 Rigel (right foot)
      [32, 80],  // 3 Saiph (left foot)
      [38, 48],  // 4 Mintaka (left belt)
      [50, 50],  // 5 Alnilam (center belt)
      [62, 52],  // 6 Alnitak (right belt)
      [50, 22],  // 7 Meissa (head)
      [42, 65],  // 8 sword top
      [50, 72],  // 9 sword mid
    ],
    lines: [
      [7, 0], [7, 1], [0, 1],
      [0, 4], [1, 6],
      [4, 5], [5, 6],
      [4, 3], [6, 2],
      [3, 2],
      [5, 8], [8, 9],
    ],
    silhouette: 'M50,8 C55,10 62,12 65,15 C68,20 65,25 60,28 C68,32 72,45 72,55 C72,65 68,72 65,75 C62,78 58,80 55,79 C52,88 50,92 50,92 C48,92 47,88 45,79 C42,80 38,78 35,75 C32,72 28,65 28,55 C28,45 32,32 40,28 C35,25 32,20 35,15 C38,12 45,10 50,8 Z M38,48 C40,46 45,45 50,45 C55,45 60,46 62,48 C60,52 55,53 50,53 C45,53 40,52 38,48 Z',
    starNames: [
      { nameJa: 'ベテルギウス', nameEn: 'Betelgeuse', meaning: 'アラビア語で「巨人の脇の下」', isBrightest: true },
      { nameJa: 'ベラトリックス', nameEn: 'Bellatrix', meaning: 'ラテン語で「女性の戦士」' },
      { nameJa: 'リゲル', nameEn: 'Rigel', meaning: 'アラビア語で「巨人の左足」' },
      { nameJa: 'サイフ', nameEn: 'Saiph', meaning: 'アラビア語で「剣」' },
      { nameJa: 'ミンタカ', nameEn: 'Mintaka', meaning: 'アラビア語で「帯」' },
      { nameJa: 'アルニラム', nameEn: 'Alnilam', meaning: 'アラビア語で「真珠の帯」' },
      { nameJa: 'アルニタク', nameEn: 'Alnitak', meaning: 'アラビア語で「帯」' },
      { nameJa: 'メイッサ', nameEn: 'Meissa', meaning: 'アラビア語で「輝く者」' },
      null,
      null,
    ],
  },

  // ── しし座 (Leo) ─────────────────────────────────────────────────────────
  leo: {
    stars: [
      [78, 62],  // 0 Regulus (heart)
      [20, 35],  // 1 Denebola (tail)
      [58, 50],  // 2 Algieba (mane)
      [35, 42],  // 3 Zosma (hip)
      [68, 38],  // 4 Adhafera (mane)
      [76, 28],  // 5 Rasalas (head top)
      [86, 35],  // 6 Eta Leonis
      [48, 45],  // 7 Chertan
      [28, 38],  // 8 delta
    ],
    lines: [
      [0, 2], [2, 4], [4, 5], [5, 6], [6, 0],
      [0, 7], [7, 3], [3, 8], [8, 1],
      [2, 7],
    ],
    silhouette: 'M85,28 C88,22 85,15 78,12 C72,10 65,14 62,20 C58,15 50,12 42,15 C35,18 30,25 28,32 C20,30 14,35 15,42 C16,48 22,50 28,48 C28,55 30,62 35,65 C38,68 42,68 45,65 C48,70 50,75 50,78 C55,78 60,75 62,70 C65,72 68,75 72,75 C76,75 80,72 82,68 C82,60 78,55 75,52 C80,48 85,42 85,35 Z',
    starNames: [
      { nameJa: 'レグルス', nameEn: 'Regulus', meaning: 'ラテン語で「小さな王」', isBrightest: true },
      { nameJa: 'デネボラ', nameEn: 'Denebola', meaning: 'アラビア語で「ライオンの尾」' },
      { nameJa: 'アルギエバ', nameEn: 'Algieba', meaning: 'アラビア語で「額」' },
      { nameJa: 'ゾスマ', nameEn: 'Zosma', meaning: 'ギリシャ語で「腰帯」' },
      { nameJa: 'アドハフェラ', nameEn: 'Adhafera', meaning: 'アラビア語で「巻き毛」' },
      { nameJa: 'ラサラス', nameEn: 'Rasalas', meaning: 'アラビア語で「頭部の南の星」' },
      null,
      { nameJa: 'ケルタン', nameEn: 'Chertan', meaning: 'アラビア語で「小さな肋骨」' },
      null,
    ],
  },

  // ── さそり座 (Scorpius) ──────────────────────────────────────────────────
  sco: {
    stars: [
      [50, 15],  // 0 Antares (heart)
      [38, 20],  // 1 Graffias (head)
      [30, 25],  // 2 Dschubba
      [42, 22],  // 3 Alniyat
      [48, 30],  // 4 Tau Sco
      [52, 40],  // 5 epsilon
      [54, 50],  // 6 mu
      [56, 60],  // 7 zeta
      [60, 68],  // 8 eta
      [65, 72],  // 9 theta
      [70, 75],  // 10 iota (stinger)
      [75, 70],  // 11 kappa
      [78, 65],  // 12 lambda (tail tip)
      [22, 28],  // 13 nu (claw)
      [18, 35],  // 14 xi (claw)
    ],
    lines: [
      [13, 1], [14, 1],
      [1, 2], [1, 3],
      [2, 0], [3, 0],
      [0, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
      [10, 11], [11, 12],
    ],
    silhouette: 'M22,28 C18,20 20,12 28,10 C35,8 40,12 42,18 C46,14 50,12 50,12 C55,14 60,20 58,28 C62,32 64,42 62,52 C64,60 66,68 70,74 C74,78 78,76 80,70 C82,64 78,58 74,56 C76,50 76,44 72,42 C68,40 64,42 62,44 C58,38 54,30 50,28 C46,30 42,32 38,28 C34,24 30,20 26,22 Z',
    starNames: [
      { nameJa: 'アンタレス', nameEn: 'Antares', meaning: 'ギリシャ語で「火星に対抗するもの」', isBrightest: true },
      { nameJa: 'グラフィアス', nameEn: 'Graffias', meaning: 'ギリシャ語で「かに」' },
      { nameJa: 'ジュバ', nameEn: 'Dschubba', meaning: 'アラビア語で「さそりの額」' },
      { nameJa: 'アルニヤト', nameEn: 'Alniyat', meaning: 'アラビア語で「心臓の近くの星」' },
      null, null, null, null, null, null,
      { nameJa: 'シャウラ', nameEn: 'Shaula', meaning: 'アラビア語で「上げた尻尾」' },
      null,
      { nameJa: 'レサト', nameEn: 'Lesath', meaning: 'アラビア語で「毒液」' },
      null, null,
    ],
  },

  // ── ふたご座 (Gemini) ────────────────────────────────────────────────────
  gem: {
    stars: [
      [30, 15],  // 0 Castor (head of Castor)
      [60, 12],  // 1 Pollux (head of Pollux)
      [28, 30],  // 2 Mebsuda (Castor body)
      [58, 28],  // 3 Wasat (Pollux body)
      [25, 48],  // 4 Mekbuda (Castor waist)
      [55, 45],  // 5 Alzirr (Pollux waist)
      [22, 65],  // 6 Castor foot
      [52, 62],  // 7 Pollux foot
      [35, 75],  // 8 Propus (near foot)
      [62, 72],  // 9 kappa
    ],
    lines: [
      [0, 2], [2, 4], [4, 6], [6, 8],
      [1, 3], [3, 5], [5, 7], [7, 9],
      [0, 1], [2, 3], [4, 5],
    ],
    silhouette: 'M30,8 C24,8 18,12 20,20 C18,28 22,35 26,40 C22,45 20,52 22,60 C24,68 28,75 32,80 C36,82 40,80 42,75 C44,80 46,82 50,82 C54,82 56,78 58,72 C62,76 66,78 70,75 C74,68 72,58 68,50 C72,42 74,32 72,22 C70,14 64,8 58,8 C52,10 48,15 44,20 C40,15 36,10 30,8 Z',
    starNames: [
      { nameJa: 'カストル', nameEn: 'Castor', meaning: 'ギリシャ神話の双子の一人（馬術の名手）' },
      { nameJa: 'ポルックス', nameEn: 'Pollux', meaning: 'ギリシャ神話の双子の一人（拳闘の名手）', isBrightest: true },
      { nameJa: 'メブスダ', nameEn: 'Mebsuda', meaning: 'アラビア語で「伸ばした腕」' },
      { nameJa: 'ワサト', nameEn: 'Wasat', meaning: 'アラビア語で「中央」' },
      { nameJa: 'メクブダ', nameEn: 'Mekbuda', meaning: 'アラビア語で「折り曲げた腕」' },
      { nameJa: 'アルジル', nameEn: 'Alzirr', meaning: 'アラビア語で「ボタン」' },
      null, null,
      { nameJa: 'プロプス', nameEn: 'Propus', meaning: 'ギリシャ語で「前足」' },
      null,
    ],
  },

  // ── おうし座 (Taurus) ────────────────────────────────────────────────────
  tau: {
    stars: [
      [52, 45],  // 0 Aldebaran (eye)
      [68, 28],  // 1 Elnath (tip of horn)
      [38, 32],  // 2 shorter horn
      [58, 38],  // 3 face
      [72, 40],  // 4 zeta
      [28, 52],  // 5 Pleiades area
      [20, 48],  // 6 Pleiades left
      [25, 42],  // 7 Pleiades up
      [65, 55],  // 8 theta (Hyades)
      [72, 60],  // 9 gamma
    ],
    lines: [
      [0, 3], [3, 1], [1, 4],
      [3, 2],
      [0, 8], [8, 9], [9, 4],
      [5, 6], [6, 7], [7, 5],
      [0, 5],
    ],
    silhouette: 'M72,20 C78,16 82,20 80,28 C78,35 70,38 65,35 C62,30 58,25 52,22 C48,25 42,30 38,28 C32,25 25,28 20,35 C15,42 18,50 25,52 C20,58 18,65 22,70 C26,75 32,75 38,70 C40,75 42,80 45,82 C48,80 50,75 52,70 C55,75 58,78 62,75 C66,72 68,65 65,60 C70,58 78,55 82,50 C85,42 82,35 78,30 C82,25 80,18 76,18 Z',
    starNames: [
      { nameJa: 'アルデバラン', nameEn: 'Aldebaran', meaning: 'アラビア語で「追いかけるもの」（プレアデスを追う）', isBrightest: true },
      { nameJa: 'エルナト', nameEn: 'Elnath', meaning: 'アラビア語で「角を突く者」' },
      null,
      null, null,
      { nameJa: 'プレアデス', nameEn: 'Pleiades', meaning: '七姉妹星団（昴）' },
      null, null,
      null, null,
    ],
  },

  // ── うお座 (Pisces) ──────────────────────────────────────────────────────
  psc: {
    stars: [
      [50, 50],  // 0 Al Rischa (knot)
      [32, 40],  // 1 eta
      [22, 35],  // 2 rho
      [18, 28],  // 3 pi
      [25, 22],  // 4 omicron (west fish top)
      [30, 18],  // 5 xi
      [38, 20],  // 6 nu (west fish)
      [68, 62],  // 7 theta
      [75, 55],  // 8 iota
      [82, 48],  // 9 lambda
      [82, 38],  // 10 kappa
      [78, 30],  // 11 gamma
      [70, 25],  // 12 delta (east fish)
      [62, 28],  // 13 epsilon
      [58, 38],  // 14 zeta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],
      [0, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 8],
    ],
    silhouette: 'M25,20 C18,15 12,20 14,28 C16,35 22,38 28,36 C25,42 25,48 28,52 C32,55 38,55 42,52 C44,58 46,62 50,62 C54,62 56,58 58,52 C62,55 68,56 72,52 C76,48 75,42 72,36 C78,38 84,35 86,28 C88,20 82,15 76,18 C72,12 65,10 60,14 C58,10 54,8 50,10 C46,8 42,10 40,14 C35,10 28,12 25,20 Z',
    starNames: [
      { nameJa: 'アル・リシャ', nameEn: 'Al Rischa', meaning: 'アラビア語で「縄」。二匹の魚をつなぐ結び目', isBrightest: true },
      null, null, null, null, null, null, null, null, null, null, null, null, null, null,
    ],
  },

  // ── みずがめ座 (Aquarius) ────────────────────────────────────────────────
  aqr: {
    stars: [
      [35, 30],  // 0 Sadalsuud (shoulder)
      [48, 35],  // 1 Sadalmelik
      [55, 45],  // 2 Sadachbia (water urn)
      [50, 55],  // 3 zeta
      [42, 60],  // 4 eta
      [58, 62],  // 5 theta (water streams)
      [45, 72],  // 6 lambda
      [60, 75],  // 7 phi
      [68, 68],  // 8 chi
      [28, 40],  // 9 alpha (head/arm)
      [20, 50],  // 10 epsilon
    ],
    lines: [
      [9, 0], [0, 1], [1, 2],
      [9, 10],
      [2, 3], [3, 4], [4, 6],
      [3, 5], [5, 7], [5, 8],
    ],
    silhouette: 'M28,15 C22,15 18,20 20,28 C22,35 28,38 35,36 C38,40 40,45 38,50 C35,55 32,60 35,65 C38,70 42,72 45,70 C45,75 48,80 50,82 C52,80 54,75 55,70 C58,72 62,72 65,68 C68,64 65,58 62,55 C65,50 68,45 65,40 C62,35 58,32 55,30 C58,25 60,18 55,14 C50,10 44,12 42,18 C40,12 35,10 28,15 Z',
    starNames: [
      { nameJa: 'サダルスウド', nameEn: 'Sadalsuud', meaning: 'アラビア語で「幸運の中の幸運の星」', isBrightest: true },
      { nameJa: 'サダルメリク', nameEn: 'Sadalmelik', meaning: 'アラビア語で「幸運な星たちの一つ」' },
      { nameJa: 'サダキア', nameEn: 'Sadachbia', meaning: 'アラビア語で「テントの幸運な星」' },
      null, null, null, null, null, null, null, null,
    ],
  },

  // ── やぎ座 (Capricornus) ─────────────────────────────────────────────────
  cap: {
    stars: [
      [20, 35],  // 0 Algedi (left horn)
      [28, 30],  // 1 Dabih (right horn)
      [38, 32],  // 2 beta
      [48, 30],  // 3 top
      [60, 32],  // 4 epsilon
      [70, 38],  // 5 delta (tail)
      [65, 50],  // 6 gamma
      [55, 55],  // 7 iota
      [45, 58],  // 8 theta
      [35, 55],  // 9 zeta
      [25, 50],  // 10 left base
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
      [10, 0], [10, 9], [1, 10],
    ],
    silhouette: 'M20,28 C14,22 12,28 16,36 C12,40 12,48 18,52 C15,58 18,65 24,66 C28,68 32,65 34,60 C38,65 42,68 48,66 C52,64 55,60 55,55 C60,58 65,58 68,54 C72,50 72,42 70,36 C74,32 75,25 72,20 C68,15 62,14 58,18 C55,14 50,12 45,15 C42,10 35,10 30,15 C26,10 20,12 20,20 Z',
    starNames: [
      { nameJa: 'アルゲディ', nameEn: 'Algedi', meaning: 'アラビア語で「山羊の角」' },
      { nameJa: 'ダビ', nameEn: 'Dabih', meaning: 'アラビア語で「幸運な屠殺者」', isBrightest: true },
      null, null, null, null, null, null, null, null, null,
    ],
  },

  // ── いて座 (Sagittarius) ─────────────────────────────────────────────────
  sgr: {
    stars: [
      [50, 30],  // 0 Kaus Media (center bow)
      [42, 22],  // 1 Kaus Borealis (top bow)
      [55, 38],  // 2 Kaus Australis (bottom bow)
      [35, 35],  // 3 Phi Sgr
      [28, 42],  // 4 Sigma (arrow tip)
      [38, 45],  // 5 Lambda (hand)
      [60, 25],  // 6 Nunki (shoulder)
      [68, 35],  // 7 Tau
      [65, 48],  // 8 Zeta (body)
      [72, 55],  // 9 Pi
      [58, 55],  // 10 Eta
      [50, 62],  // 11 Gamma
    ],
    lines: [
      [1, 0], [0, 2],
      [4, 5], [5, 3], [3, 0],
      [6, 1], [6, 7], [7, 8], [8, 9],
      [8, 10], [10, 11],
      [2, 10],
    ],
    silhouette: 'M28,40 C22,35 20,28 25,22 C30,15 38,14 42,20 C46,15 52,12 58,14 C64,16 68,22 68,28 C72,25 78,28 80,35 C82,42 78,50 72,52 C75,58 75,65 70,68 C65,72 58,72 55,68 C52,72 48,75 44,73 C40,71 38,65 40,58 C35,62 28,62 25,58 C22,54 22,46 28,42 Z',
    starNames: [
      { nameJa: 'カウス・メディア', nameEn: 'Kaus Media', meaning: 'アラビア語＋ラテン語で「弓の中央」' },
      { nameJa: 'カウス・ボレアリス', nameEn: 'Kaus Borealis', meaning: 'アラビア語＋ラテン語で「弓の北部」', isBrightest: true },
      { nameJa: 'カウス・アウストラリス', nameEn: 'Kaus Australis', meaning: 'アラビア語＋ラテン語で「弓の南部」' },
      null, null, null,
      { nameJa: 'ヌンキ', nameEn: 'Nunki', meaning: 'バビロニア語で「海の星」' },
      null, null, null, null, null,
    ],
  },

  // ── おとめ座 (Virgo) ─────────────────────────────────────────────────────
  vir: {
    stars: [
      [50, 35],  // 0 Spica (wheat)
      [38, 28],  // 1 Porrima (gamma)
      [30, 22],  // 2 epsilon
      [22, 18],  // 3 zeta (left hand)
      [42, 20],  // 4 delta
      [55, 22],  // 5 Vindemiatrix (right arm)
      [65, 18],  // 6 epsilon-right
      [28, 35],  // 7 eta
      [20, 45],  // 8 beta (left foot)
      [60, 42],  // 9 tau
      [68, 50],  // 10 theta (right foot)
    ],
    lines: [
      [3, 2], [2, 1], [1, 0],
      [2, 4], [4, 5], [5, 6],
      [1, 7], [7, 8],
      [0, 9], [9, 10],
    ],
    silhouette: 'M50,12 C55,10 62,12 65,18 C68,24 65,32 60,35 C65,38 68,44 68,50 C68,58 62,65 55,68 C52,72 50,78 50,82 C48,78 46,72 44,68 C38,66 32,60 30,52 C28,44 32,38 38,35 C32,30 28,22 32,18 C36,14 44,12 50,12 Z',
    starNames: [
      { nameJa: 'スピカ', nameEn: 'Spica', meaning: 'ラテン語で「麦の穂」。秋の夜空に輝く一等星', isBrightest: true },
      { nameJa: 'ポリマ', nameEn: 'Porrima', meaning: 'ローマ神話の予言の女神の名' },
      null,
      null,
      null,
      { nameJa: 'ヴィンデミアトリックス', nameEn: 'Vindemiatrix', meaning: 'ラテン語で「葡萄の収穫者」' },
      null, null, null, null, null,
    ],
  },

  // ── てんびん座 (Libra) ───────────────────────────────────────────────────
  lib: {
    stars: [
      [50, 48],  // 0 center
      [32, 35],  // 1 Zubenelgenubi (SW)
      [68, 32],  // 2 Zubeneschamali (NE bright)
      [38, 55],  // 3 Brachium (S)
      [62, 52],  // 4 upsilon
      [50, 28],  // 5 top beam
    ],
    lines: [
      [5, 1], [5, 2],
      [0, 1], [0, 2], [0, 5],
      [0, 3], [0, 4],
      [1, 3], [2, 4],
    ],
    silhouette: 'M50,18 C52,14 58,12 62,16 C66,20 65,28 60,30 C70,30 78,32 80,38 C80,44 72,48 65,46 C68,52 68,60 62,64 C58,66 52,64 50,60 C48,64 42,66 38,64 C32,60 32,52 35,46 C28,48 20,44 20,38 C22,32 30,30 40,30 C35,28 34,20 38,16 C42,12 48,14 50,18 Z',
    starNames: [
      { nameJa: 'ズベン・エル・ゲヌビ', nameEn: 'Zubenelgenubi', meaning: 'アラビア語で「蠍の南のはさみ」' },
      { nameJa: 'ズベン・エッシャマリ', nameEn: 'Zubeneschamali', meaning: 'アラビア語で「蠍の北のはさみ」。わずかに緑がかった星', isBrightest: true },
      null, null, null, null,
    ],
  },

  // ── かに座 (Cancer) ──────────────────────────────────────────────────────
  cnc: {
    stars: [
      [50, 50],  // 0 Praesepe M44 (center)
      [32, 38],  // 1 Acubens (SW claw)
      [65, 35],  // 2 Al Tarf (NE)
      [35, 62],  // 3 iota (S claw)
      [62, 65],  // 4 delta (SE)
      [48, 28],  // 5 beta (N)
    ],
    lines: [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 3], [2, 4],
    ],
    silhouette: 'M50,15 C56,12 62,15 65,22 C68,28 65,35 58,38 C65,40 72,45 72,52 C72,60 65,65 58,65 C62,70 65,78 62,82 C58,84 52,82 50,78 C48,82 42,84 38,82 C35,78 38,70 42,65 C35,65 28,60 28,52 C28,45 35,40 42,38 C35,35 32,28 35,22 C38,15 44,12 50,15 Z',
    starNames: [
      { nameJa: 'プレセペ（蜂の巣星団）', nameEn: 'Praesepe M44', meaning: 'ラテン語で「飼い葉おけ」。肉眼でも見える散開星団' },
      { nameJa: 'アクベンス', nameEn: 'Acubens', meaning: 'アラビア語で「かにのはさみ」', isBrightest: true },
      { nameJa: 'アル・タルフ', nameEn: 'Al Tarf', meaning: 'アラビア語で「かにの目の先端」' },
      null, null, null,
    ],
  },

  // ── おおぐま座 (Ursa Major) ──────────────────────────────────────────────
  uma: {
    stars: [
      [20, 35],  // 0 Dubhe (lip of dipper)
      [30, 38],  // 1 Merak (base)
      [30, 50],  // 2 Phecda
      [22, 48],  // 3 Megrez
      [15, 40],  // 4 Alioth (handle)
      [8, 35],   // 5 Mizar
      [2, 30],   // 6 Alkaid (end)
      [40, 30],  // 7 Talitha (front leg)
      [48, 25],  // 8 Kappa
      [55, 42],  // 9 Mu (back leg)
      [62, 55],  // 10 Nu
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [3, 4], [4, 5], [5, 6],
      [0, 7], [7, 8],
      [2, 9], [9, 10],
    ],
    silhouette: 'M65,60 C70,55 75,48 72,40 C70,32 62,28 55,30 C58,22 55,15 48,12 C40,10 34,15 32,22 C26,18 18,20 15,28 C12,35 15,42 20,45 C15,50 12,58 15,65 C18,72 26,75 32,72 C28,78 28,85 35,88 C42,90 48,85 50,78 C55,82 62,82 66,78 C70,74 70,66 65,62 Z',
    starNames: [
      { nameJa: 'ドゥブ', nameEn: 'Dubhe', meaning: 'アラビア語で「大熊の背中」', isBrightest: true },
      { nameJa: 'メラク', nameEn: 'Merak', meaning: 'アラビア語で「腰部」' },
      { nameJa: 'フェクダ', nameEn: 'Phecda', meaning: 'アラビア語で「太股」' },
      { nameJa: 'メグレズ', nameEn: 'Megrez', meaning: 'アラビア語で「尾の付け根」' },
      { nameJa: 'アリオト', nameEn: 'Alioth', meaning: 'アラビア語で「黒い馬」' },
      { nameJa: 'ミザール', nameEn: 'Mizar', meaning: 'アラビア語で「腰布」' },
      { nameJa: 'アルカイド', nameEn: 'Alkaid', meaning: 'アラビア語で「嘆く娘たちの首長」' },
      null, null, null, null,
    ],
  },

  // ── こぐま座 (Ursa Minor) ────────────────────────────────────────────────
  umi: {
    stars: [
      [50, 12],  // 0 Polaris (North Star)
      [58, 25],  // 1 delta
      [65, 38],  // 2 epsilon
      [60, 50],  // 3 zeta
      [48, 52],  // 4 eta
      [38, 45],  // 5 beta (Kochab)
      [32, 35],  // 6 gamma (Pherkad)
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 5],
      [4, 3],
    ],
    silhouette: 'M50,5 C55,8 60,12 62,18 C65,15 70,18 70,25 C70,32 65,38 60,40 C65,44 68,50 65,56 C62,62 55,64 50,62 C48,68 48,75 50,80 C45,78 42,70 42,62 C38,65 32,62 30,56 C28,50 32,44 38,40 C32,38 28,32 28,25 C28,18 34,15 38,18 C38,12 44,8 50,5 Z',
    starNames: [
      { nameJa: 'ポラリス', nameEn: 'Polaris', meaning: 'ラテン語で「北極星」。地球の自転軸が指す星', isBrightest: true },
      null,
      null,
      null,
      null,
      { nameJa: 'コカブ', nameEn: 'Kochab', meaning: 'アラビア語で「星」。かつての北極星' },
      { nameJa: 'フェルカド', nameEn: 'Pherkad', meaning: 'アラビア語で「二頭の小熊のうち薄い方」' },
    ],
  },

  // ── カシオペヤ座 (Cassiopeia) ────────────────────────────────────────────
  cas: {
    stars: [
      [12, 45],  // 0 Caph (left of W)
      [28, 30],  // 1 Schedar
      [48, 42],  // 2 Gamma (center dip)
      [65, 28],  // 3 Ruchbah
      [82, 40],  // 4 Segin (right of W)
      [50, 65],  // 5 eta (below)
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [1, 5], [2, 5],
    ],
    silhouette: 'M50,15 C55,12 62,14 65,20 C68,26 65,34 60,38 C65,42 70,48 68,55 C66,62 58,65 52,62 C55,68 55,75 52,80 C48,75 48,68 50,62 C42,65 34,62 32,55 C30,48 35,42 40,38 C35,34 32,26 35,20 C38,14 45,12 50,15 Z M18,42 C15,38 15,32 20,28 C25,25 32,28 34,34 C30,36 26,40 28,46 C24,46 20,44 18,42 Z M82,38 C80,32 78,26 82,22 C86,20 90,25 90,32 C88,38 84,42 80,44 Z',
    starNames: [
      { nameJa: 'カフ', nameEn: 'Caph', meaning: 'アラビア語で「手のひら」' },
      { nameJa: 'シェダル', nameEn: 'Schedar', meaning: 'アラビア語で「胸」', isBrightest: true },
      { nameJa: 'ガンマ・カシオペヤ', nameEn: 'Gamma Cas', meaning: '爆発変光星として有名' },
      { nameJa: 'ルフバ', nameEn: 'Ruchbah', meaning: 'アラビア語で「膝」' },
      { nameJa: 'セギン', nameEn: 'Segin', meaning: '由来不詳' },
      null,
    ],
  },

  // ── はくちょう座 (Cygnus) ────────────────────────────────────────────────
  cyg: {
    stars: [
      [50, 15],  // 0 Deneb (tail)
      [50, 40],  // 1 Sadr (body center)
      [50, 70],  // 2 Albireo (head)
      [25, 40],  // 3 Gienah (left wing)
      [75, 40],  // 4 delta (right wing)
      [15, 45],  // 5 epsilon (left wing tip)
      [85, 45],  // 6 right wing tip
    ],
    lines: [
      [0, 1], [1, 2],
      [3, 1], [1, 4],
      [5, 3], [4, 6],
    ],
    silhouette: 'M50,8 C53,10 56,14 55,20 C58,18 62,18 65,22 C68,26 65,32 60,35 C70,35 80,38 85,44 C88,50 85,56 80,56 C72,56 65,50 58,46 C56,55 54,65 52,72 C55,75 58,80 55,85 C52,88 48,88 45,85 C42,80 45,75 48,72 C46,65 44,55 42,46 C35,50 28,56 20,56 C15,56 12,50 15,44 C20,38 30,35 40,35 C35,32 32,26 35,22 C38,18 42,18 45,20 C44,14 47,10 50,8 Z',
    starNames: [
      { nameJa: 'デネブ', nameEn: 'Deneb', meaning: 'アラビア語で「尾」。夏の大三角の一つ', isBrightest: true },
      { nameJa: 'サドル', nameEn: 'Sadr', meaning: 'アラビア語で「胸」' },
      { nameJa: 'アルビレオ', nameEn: 'Albireo', meaning: '美しい二重星（金と青）。由来は諸説あり' },
      { nameJa: 'ジェナ', nameEn: 'Gienah', meaning: 'アラビア語で「翼」' },
      null, null, null,
    ],
  },

  // ── わし座 (Aquila) ──────────────────────────────────────────────────────
  aql: {
    stars: [
      [50, 38],  // 0 Altair (center)
      [42, 32],  // 1 Tarazed (left of Altair)
      [58, 32],  // 2 Alshain (right of Altair)
      [35, 50],  // 3 zeta (lower left)
      [62, 25],  // 4 theta (upper right)
      [28, 40],  // 5 lambda (left wing)
      [72, 42],  // 6 epsilon (right wing)
      [50, 60],  // 7 eta (tail)
      [45, 72],  // 8 delta (tail)
    ],
    lines: [
      [1, 0], [0, 2],
      [5, 3], [3, 0],
      [0, 6], [6, 4],
      [0, 7], [7, 8],
    ],
    silhouette: 'M50,12 C55,10 60,12 62,18 C65,15 70,18 72,24 C74,30 70,38 65,40 C72,42 78,48 76,55 C74,62 65,65 58,60 C56,68 54,75 50,80 C46,75 44,68 42,60 C35,65 26,62 24,55 C22,48 28,42 35,40 C30,38 26,30 28,24 C30,18 35,15 38,18 C40,12 45,10 50,12 Z',
    starNames: [
      { nameJa: 'アルタイル', nameEn: 'Altair', meaning: 'アラビア語で「飛ぶ鷲」。夏の大三角の一つ', isBrightest: true },
      { nameJa: 'タラゼド', nameEn: 'Tarazed', meaning: 'ペルシャ語で「天秤の梁」' },
      { nameJa: 'アルシャイン', nameEn: 'Alshain', meaning: 'ペルシャ語で「鷹・鷲」' },
      null, null, null, null, null, null,
    ],
  },

  // ── こと座 (Lyra) ────────────────────────────────────────────────────────
  lyr: {
    stars: [
      [50, 18],  // 0 Vega (top)
      [38, 45],  // 1 epsilon1 (left)
      [62, 45],  // 2 zeta (right)
      [40, 62],  // 3 delta (lower left)
      [60, 62],  // 4 gamma (lower right)
      [50, 72],  // 5 beta (bottom)
    ],
    lines: [
      [0, 1], [0, 2],
      [1, 3], [2, 4],
      [1, 2],
      [3, 5], [4, 5],
      [3, 4],
    ],
    silhouette: 'M50,10 C54,8 58,10 60,15 C62,10 68,8 72,12 C76,16 74,24 68,28 C72,32 74,40 70,46 C66,52 60,54 55,52 C58,58 60,65 58,72 C56,78 52,82 50,84 C48,82 44,78 42,72 C40,65 42,58 45,52 C40,54 34,52 30,46 C26,40 28,32 32,28 C26,24 24,16 28,12 C32,8 38,10 40,15 C42,10 46,8 50,10 Z',
    starNames: [
      { nameJa: 'ベガ', nameEn: 'Vega', meaning: 'アラビア語で「急降下する鷲」。夏の大三角の一つ', isBrightest: true },
      { nameJa: 'エプシロン・ライ', nameEn: 'ε Lyrae', meaning: '有名な二重星（ε¹・ε²）' },
      null, null, null,
      { nameJa: 'シェリャク', nameEn: 'Sheliak', meaning: 'アラビア語で「竪琴」' },
    ],
  },

  // ── ヘルクレス座 (Hercules) ──────────────────────────────────────────────
  her: {
    stars: [
      [50, 28],  // 0 Pi (head)
      [40, 38],  // 1 Kornephoros (left shoulder)
      [60, 38],  // 2 beta (right shoulder)
      [35, 52],  // 3 zeta (left hip)
      [62, 52],  // 4 delta (right hip)
      [28, 65],  // 5 mu (left knee)
      [68, 65],  // 6 epsilon (right knee)
      [22, 78],  // 7 left foot
      [72, 78],  // 8 right foot
      [42, 25],  // 9 alpha (torso upper left)
      [25, 42],  // 10 left arm
      [78, 42],  // 11 right arm
    ],
    lines: [
      [0, 1], [0, 2],
      [1, 3], [2, 4],
      [3, 4],
      [3, 5], [4, 6],
      [5, 7], [6, 8],
      [1, 10], [2, 11],
    ],
    silhouette: 'M50,15 C55,12 60,15 62,20 C65,15 70,16 72,22 C74,28 70,35 65,38 C70,42 75,50 72,58 C70,65 62,68 58,65 C62,70 65,78 62,84 C58,88 52,88 50,85 C48,88 42,88 38,84 C35,78 38,70 42,65 C38,68 30,65 28,58 C25,50 30,42 35,38 C30,35 26,28 28,22 C30,16 35,15 38,20 C40,15 45,12 50,15 Z',
    starNames: [
      null,
      { nameJa: 'コルネフォロス', nameEn: 'Kornephoros', meaning: 'ギリシャ語で「棍棒を持つ者」', isBrightest: true },
      null, null, null, null, null, null, null, null, null, null,
    ],
  },

  // ── うしかい座 (Boötes) ──────────────────────────────────────────────────
  boo: {
    stars: [
      [50, 70],  // 0 Arcturus (base)
      [38, 55],  // 1 Izar (left)
      [60, 52],  // 2 epsilon (right)
      [30, 40],  // 3 delta (upper left)
      [68, 38],  // 4 beta (upper right)
      [45, 28],  // 5 gamma (head-left)
      [55, 25],  // 6 rho (head-right)
      [50, 18],  // 7 top
    ],
    lines: [
      [0, 1], [0, 2],
      [1, 3], [2, 4],
      [3, 5], [4, 6],
      [5, 7], [6, 7],
      [5, 6],
    ],
    silhouette: 'M50,10 C55,8 62,10 65,18 C68,12 74,12 76,20 C78,28 74,36 68,40 C72,44 74,52 70,58 C66,64 58,66 52,62 C56,68 58,76 55,82 C52,86 48,86 45,82 C42,76 44,68 48,62 C42,66 34,64 30,58 C26,52 28,44 32,40 C26,36 22,28 24,20 C26,12 32,8 38,12 C40,10 45,8 50,10 Z',
    starNames: [
      { nameJa: 'アークトゥルス', nameEn: 'Arcturus', meaning: 'ギリシャ語で「熊の番人」。北天最明星', isBrightest: true },
      { nameJa: 'イザール', nameEn: 'Izar', meaning: 'アラビア語で「帯」。美しい二重星' },
      null, null, null, null, null, null,
    ],
  },

  // ── ペガスス座 (Pegasus) ─────────────────────────────────────────────────
  peg: {
    stars: [
      [20, 32],  // 0 Scheat (NW of square)
      [20, 58],  // 1 Markab (SW of square)
      [62, 58],  // 2 Algenib (SE of square)
      [62, 32],  // 3 Alpheratz/And shared
      [8, 45],   // 4 epsilon (nose)
      [2, 38],   // 5 theta (muzzle)
      [15, 25],  // 6 eta (neck)
      [10, 18],  // 7 zeta (head)
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 6], [6, 7], [7, 5], [5, 4], [4, 0],
    ],
    silhouette: 'M8,18 C5,15 5,22 8,26 C5,28 3,35 6,42 C3,45 3,52 8,56 C12,60 18,60 22,56 C28,62 35,65 42,62 C48,68 52,72 55,70 C58,68 58,62 55,58 C62,58 68,55 70,50 C72,45 70,38 65,35 C70,32 72,25 68,20 C64,15 58,15 55,20 C52,15 46,12 40,15 C35,12 28,12 25,18 C22,12 15,12 8,18 Z',
    starNames: [
      { nameJa: 'シェアト', nameEn: 'Scheat', meaning: 'アラビア語で「肩」', isBrightest: true },
      { nameJa: 'マルカブ', nameEn: 'Markab', meaning: 'アラビア語で「馬の鞍」' },
      { nameJa: 'アルゲニブ', nameEn: 'Algenib', meaning: 'アラビア語で「翼の側面」' },
      { nameJa: 'アルフェラッツ', nameEn: 'Alpheratz', meaning: 'アラビア語で「馬の臍」。アンドロメダ座と共有' },
      null, null, null, null,
    ],
  },

  // ── アンドロメダ座 (Andromeda) ───────────────────────────────────────────
  and: {
    stars: [
      [78, 58],  // 0 Alpheratz (shared w Peg)
      [62, 48],  // 1 delta
      [48, 38],  // 2 Mirach (hip)
      [32, 28],  // 3 Mu And
      [18, 20],  // 4 Almach (foot)
      [55, 25],  // 5 nu (upper chain)
      [40, 15],  // 6 phi
      [65, 60],  // 7 pi (lower chain)
      [72, 70],  // 8 omicron
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [2, 5], [5, 6],
      [0, 7], [7, 8],
    ],
    silhouette: 'M78,50 C82,45 85,38 82,30 C80,22 74,18 68,20 C65,15 60,12 54,14 C48,16 44,22 44,28 C38,24 30,22 24,26 C18,30 16,38 18,45 C14,48 10,54 12,62 C14,70 22,74 28,72 C25,78 26,85 32,88 C38,90 44,86 46,80 C50,84 55,86 60,84 C66,82 68,76 66,70 C72,72 78,70 82,66 C86,62 84,56 78,52 Z',
    starNames: [
      { nameJa: 'アルフェラッツ', nameEn: 'Alpheratz', meaning: 'アラビア語で「馬の臍」。ペガスス座と共有', isBrightest: true },
      null,
      { nameJa: 'ミラク', nameEn: 'Mirach', meaning: 'アラビア語で「腰帯」' },
      null,
      { nameJa: 'アルマク', nameEn: 'Almach', meaning: 'アラビア語で「砂漠の小動物」。美しい二重星' },
      null, null, null, null,
    ],
  },

  // ── ペルセウス座 (Perseus) ───────────────────────────────────────────────
  per: {
    stars: [
      [50, 22],  // 0 Mirfak (alpha, core)
      [38, 35],  // 1 Algol (beta, demon eye)
      [62, 18],  // 2 delta (right shoulder)
      [30, 20],  // 3 epsilon (left shoulder)
      [40, 48],  // 4 rho (body)
      [55, 42],  // 5 gamma
      [32, 58],  // 6 zeta (left hip)
      [62, 55],  // 7 xi (right leg)
      [25, 68],  // 8 eta (left knee)
      [68, 65],  // 9 omicron
      [50, 8],   // 10 head
    ],
    lines: [
      [10, 0], [0, 3], [0, 2],
      [0, 1], [1, 4],
      [0, 5], [5, 4],
      [4, 6], [5, 7],
      [6, 8], [7, 9],
    ],
    silhouette: 'M50,5 C54,3 58,6 60,12 C65,10 70,12 72,18 C74,24 70,30 65,33 C70,36 74,44 70,52 C66,60 58,62 52,58 C56,65 58,72 55,78 C52,82 48,82 45,78 C42,72 44,65 48,58 C42,62 34,60 30,52 C26,44 30,36 35,33 C30,30 26,24 28,18 C30,12 35,10 40,12 C42,6 46,3 50,5 Z',
    starNames: [
      { nameJa: 'ミルファク', nameEn: 'Mirfak', meaning: 'アラビア語で「肘」', isBrightest: true },
      { nameJa: 'アルゴル', nameEn: 'Algol', meaning: 'アラビア語で「悪魔の頭」。有名な食連星' },
      null, null, null, null, null, null, null, null, null,
    ],
  },

  // ── くじら座 (Cetus) ─────────────────────────────────────────────────────
  cet: {
    stars: [
      [72, 28],  // 0 Menkar (head/jaw)
      [78, 38],  // 1 alpha
      [65, 22],  // 2 lambda
      [55, 32],  // 3 mu
      [45, 38],  // 4 xi
      [35, 48],  // 5 nu (body)
      [25, 42],  // 6 gamma
      [18, 52],  // 7 theta (body)
      [22, 62],  // 8 eta (tail)
      [38, 65],  // 9 Mira (omicron)
      [52, 55],  // 10 zeta (tail)
      [60, 62],  // 11 xi2
    ],
    lines: [
      [0, 1], [0, 2], [2, 3], [3, 4],
      [4, 5], [5, 6], [6, 7],
      [7, 8], [8, 9],
      [9, 10], [10, 11],
      [5, 10],
    ],
    silhouette: 'M80,22 C85,18 88,25 85,32 C90,35 90,45 85,50 C80,55 72,56 68,52 C65,58 60,62 55,60 C50,65 45,70 40,68 C35,72 28,70 25,65 C22,60 24,52 28,48 C22,44 18,36 20,28 C22,20 30,16 38,18 C35,12 38,6 45,6 C52,6 56,12 55,18 C58,14 65,12 70,15 C75,18 78,22 80,22 Z',
    starNames: [
      { nameJa: 'メンカル', nameEn: 'Menkar', meaning: 'アラビア語で「鼻孔」' },
      null, null, null, null, null, null, null, null,
      { nameJa: 'ミラ', nameEn: 'Mira', meaning: 'ラテン語で「驚くべき」。有名な長周期変光星', isBrightest: true },
      null, null,
    ],
  },

  // ── うみへび座 (Hydra) ───────────────────────────────────────────────────
  hya: {
    stars: [
      [10, 30],  // 0 head (west)
      [18, 28],  // 1 zeta (head)
      [25, 32],  // 2 eta
      [35, 38],  // 3 sigma (Alphard area)
      [48, 42],  // 4 Alphard (alpha)
      [58, 45],  // 5 iota
      [65, 50],  // 6 beta
      [72, 55],  // 7 gamma
      [78, 60],  // 8 pi
      [85, 65],  // 9 tail
      [30, 22],  // 10 head branch upper
      [20, 20],  // 11 head branch top
    ],
    lines: [
      [11, 10], [10, 1], [1, 0],
      [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
    ],
    silhouette: 'M10,22 C6,18 5,25 8,30 C5,32 5,40 10,44 C8,48 10,55 15,58 C20,62 28,60 32,55 C35,60 40,65 45,62 C50,65 55,68 60,65 C65,68 70,72 75,68 C80,72 85,70 88,65 C90,58 88,50 83,48 C86,44 86,36 82,32 C78,28 72,28 68,32 C65,28 60,25 55,28 C50,25 44,22 38,25 C35,20 28,18 22,20 Z',
    starNames: [
      null, null, null, null,
      { nameJa: 'アルファルド', nameEn: 'Alphard', meaning: 'アラビア語で「孤独な者」。一帯に明るい星がないため', isBrightest: true },
      null, null, null, null, null, null, null,
    ],
  },

  // ── へびつかい座 (Ophiuchus) ─────────────────────────────────────────────
  oph: {
    stars: [
      [50, 15],  // 0 Rasalhague (head)
      [38, 28],  // 1 Cebalrai (left shoulder)
      [62, 28],  // 2 beta (right shoulder)
      [32, 45],  // 3 delta (left hip)
      [65, 48],  // 4 epsilon (right hip)
      [38, 62],  // 5 zeta (left knee)
      [62, 65],  // 6 eta (right knee)
      [50, 78],  // 7 theta (foot)
      [20, 40],  // 8 nu (snake left)
      [75, 38],  // 9 mu (snake right)
    ],
    lines: [
      [0, 1], [0, 2],
      [1, 3], [2, 4],
      [3, 5], [4, 6],
      [5, 7], [6, 7],
      [1, 8], [2, 9],
    ],
    silhouette: 'M50,8 C55,6 60,8 62,15 C65,10 70,12 72,18 C74,25 70,32 65,35 C70,40 72,50 68,58 C64,66 56,70 50,68 C44,70 36,66 32,58 C28,50 30,40 35,35 C30,32 26,25 28,18 C30,12 35,10 38,15 C40,8 45,6 50,8 Z',
    starNames: [
      { nameJa: 'ラサルハゲ', nameEn: 'Rasalhague', meaning: 'アラビア語で「蛇使いの頭」', isBrightest: true },
      { nameJa: 'ケバルライ', nameEn: 'Cebalrai', meaning: 'アラビア語で「羊飼いの犬」' },
      null, null, null, null, null, null, null, null,
    ],
  },

  // ── りゅう座 (Draco) ─────────────────────────────────────────────────────
  dra: {
    stars: [
      [72, 15],  // 0 Eltanin (head)
      [65, 22],  // 1 Rastaban (head)
      [60, 15],  // 2 Grumium (jaw)
      [55, 10],  // 3 xi (snout)
      [68, 35],  // 4 neck
      [60, 45],  // 5 lambda
      [52, 52],  // 6 mu
      [42, 55],  // 7 nu (body)
      [35, 48],  // 8 beta (Alwaid)
      [30, 38],  // 9 xi
      [25, 30],  // 10 delta
      [20, 22],  // 11 zeta (Aldhibah)
      [15, 28],  // 12 phi
      [18, 38],  // 13 chi
    ],
    lines: [
      [3, 2], [2, 0], [0, 1], [1, 4],
      [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11],
      [11, 12], [12, 13],
    ],
    silhouette: 'M55,5 C60,2 68,5 72,12 C76,8 80,12 80,20 C80,28 74,32 68,30 C72,35 72,45 68,52 C64,58 56,62 50,60 C44,58 38,52 35,45 C30,48 22,48 18,42 C14,36 15,28 20,22 C16,18 14,10 20,8 C26,6 32,10 34,16 C36,10 42,6 48,8 Z',
    starNames: [
      { nameJa: 'エルタニン', nameEn: 'Eltanin', meaning: 'アラビア語で「龍の頭」', isBrightest: true },
      { nameJa: 'ラスタバン', nameEn: 'Rastaban', meaning: 'アラビア語で「龍の頭」' },
      { nameJa: 'グルミウム', nameEn: 'Grumium', meaning: 'アラビア語で「顎」' },
      null, null, null, null, null,
      { nameJa: 'アルワイド', nameEn: 'Alwaid', meaning: 'アラビア語で「母親と幼い子たち」' },
      null, null,
      { nameJa: 'アルディバ', nameEn: 'Aldhibah', meaning: 'アラビア語で「雌の鬣狐」' },
      null, null,
    ],
  },

  // ── かんむり座 (Corona Borealis) ─────────────────────────────────────────
  crb: {
    stars: [
      [50, 55],  // 0 Alphecca (brightest)
      [35, 48],  // 1 theta (left)
      [28, 38],  // 2 beta (upper left)
      [35, 28],  // 3 gamma (top left)
      [50, 22],  // 4 delta (top)
      [65, 28],  // 5 epsilon (top right)
      [72, 38],  // 6 iota (upper right)
      [65, 48],  // 7 rho (right)
    ],
    lines: [
      [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
      [1, 0], [0, 7],
    ],
    silhouette: 'M50,15 C56,10 64,12 70,18 C76,14 82,18 82,26 C82,34 76,42 68,46 C72,52 70,60 64,65 C58,70 50,70 44,65 C38,70 30,68 28,62 C25,56 28,48 32,44 C25,40 18,34 18,26 C18,18 24,14 30,18 C36,12 44,10 50,15 Z',
    starNames: [
      { nameJa: 'アルフェッカ', nameEn: 'Alphecca', meaning: 'アラビア語で「壊れた器の明るい星」。北の冠の宝石', isBrightest: true },
      null, null, null, null, null, null, null,
    ],
  },

  // ── ぎょしゃ座 (Auriga) ──────────────────────────────────────────────────
  aur: {
    stars: [
      [50, 15],  // 0 Capella (top)
      [30, 28],  // 1 Menkalinan (beta, left)
      [68, 28],  // 2 delta (right)
      [22, 48],  // 3 iota (lower left)
      [72, 45],  // 4 theta (lower right)
      [40, 58],  // 5 zeta (Haedus I)
      [55, 62],  // 6 eta (Haedus II)
      [50, 72],  // 7 epsilon (bottom)
    ],
    lines: [
      [0, 1], [0, 2],
      [1, 3], [2, 4],
      [3, 5], [4, 6],
      [5, 7], [6, 7],
      [5, 6],
    ],
    silhouette: 'M50,8 C55,5 62,8 65,15 C70,10 76,12 78,20 C80,28 76,36 70,40 C75,44 78,52 74,60 C70,68 62,72 56,68 C60,74 60,82 56,86 C52,90 48,88 44,84 C40,78 42,70 46,65 C38,68 30,65 26,58 C22,50 26,42 32,38 C26,34 22,26 24,18 C26,10 32,7 38,12 C40,7 45,5 50,8 Z',
    starNames: [
      { nameJa: 'カペラ', nameEn: 'Capella', meaning: 'ラテン語で「小さな山羊」。北天第3位の明るさ', isBrightest: true },
      { nameJa: 'メンカリナン', nameEn: 'Menkalinan', meaning: 'アラビア語で「肩の手綱」' },
      null, null, null, null, null, null,
    ],
  },

  // ── オリオン座以外のみ表示する省略デフォルトパターン ─────────────────────

  // ── いて座 ──────────────────────────────────────────────────────────────
  // already defined above as 'sgr'

  // ── おおいぬ座 (Canis Major) ─────────────────────────────────────────────
  cma: {
    stars: [
      [50, 22],  // 0 Sirius (body)
      [38, 15],  // 1 Omicron2 (shoulder)
      [62, 18],  // 2 epsilon (right shoulder)
      [35, 35],  // 3 delta (Wezea, left)
      [65, 38],  // 4 eta (right)
      [50, 50],  // 5 zeta (waist)
      [38, 62],  // 6 Adhara (left hip)
      [62, 62],  // 7 Aludra (right hip)
      [50, 75],  // 8 beta (tail)
      [25, 28],  // 9 nu (head)
    ],
    lines: [
      [9, 1], [1, 0], [0, 2],
      [0, 3], [0, 4],
      [3, 5], [4, 5],
      [5, 6], [5, 7],
      [7, 8],
    ],
    silhouette: 'M50,12 C56,8 65,10 68,18 C72,12 78,14 80,22 C82,30 78,38 72,42 C76,48 76,58 70,65 C65,70 58,72 52,68 C55,75 56,82 53,88 C50,92 47,90 44,85 C42,78 44,72 48,68 C42,72 35,70 30,65 C24,58 24,48 28,42 C22,38 18,30 20,22 C22,14 28,12 32,18 C35,12 44,8 50,12 Z',
    starNames: [
      { nameJa: 'シリウス', nameEn: 'Sirius', meaning: 'ギリシャ語で「燃えるように輝くもの」。全天最明星', isBrightest: true },
      null, null,
      { nameJa: 'ウェゼン', nameEn: 'Wezen', meaning: 'アラビア語で「重さ」' },
      null, null,
      { nameJa: 'アドハラ', nameEn: 'Adhara', meaning: 'アラビア語で「処女」' },
      null, null, null,
    ],
  },

  // ── こいぬ座 (Canis Minor) ───────────────────────────────────────────────
  cmi: {
    stars: [
      [50, 45],  // 0 Procyon (bright)
      [48, 30],  // 1 Gomeisa (above)
      [55, 35],  // 2 beta
    ],
    lines: [
      [0, 1], [0, 2], [1, 2],
    ],
    silhouette: 'M50,18 C55,14 62,16 65,24 C68,18 74,20 75,28 C76,36 70,44 62,48 C65,54 65,62 60,68 C56,72 50,72 45,68 C40,72 35,70 32,65 C28,58 32,50 38,46 C32,42 28,35 30,26 C32,18 38,15 42,20 C44,16 47,14 50,18 Z',
    starNames: [
      { nameJa: 'プロキオン', nameEn: 'Procyon', meaning: 'ギリシャ語で「犬の前に昇る星」', isBrightest: true },
      { nameJa: 'ゴメイサ', nameEn: 'Gomeisa', meaning: 'アラビア語で「涙目の星」' },
      null,
    ],
  },

  // ── エリダヌス座 (Eridanus) ──────────────────────────────────────────────
  eri: {
    stars: [
      [42, 8],   // 0 Cursa (top, near Orion)
      [50, 18],  // 1 beta
      [60, 25],  // 2 omega
      [68, 35],  // 3 nu
      [72, 45],  // 4 mu
      [65, 55],  // 5 lambda
      [55, 60],  // 6 xi
      [48, 52],  // 7 nu
      [38, 58],  // 8 omicron (bend)
      [30, 68],  // 9 delta
      [22, 75],  // 10 phi
      [18, 82],  // 11 chi
      [25, 88],  // 12 Achernar (bottom)
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
      [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12],
    ],
    silhouette: 'M42,5 C46,3 50,5 52,10 C55,8 60,8 62,14 C64,20 62,28 56,32 C62,35 68,40 68,48 C68,56 62,62 56,62 C58,68 58,75 55,80 C52,85 48,86 45,83 C42,88 38,90 34,87 C30,83 30,76 32,70 C26,72 20,70 17,65 C14,60 15,52 20,48 C16,44 15,36 18,28 C21,20 28,16 34,18 C30,12 32,6 38,5 Z',
    starNames: [
      { nameJa: 'クルサ', nameEn: 'Cursa', meaning: 'アラビア語で「椅子の足台」' },
      null, null, null, null, null, null, null, null, null, null, null,
      { nameJa: 'アケルナル', nameEn: 'Achernar', meaning: 'アラビア語で「川の端」。南天の明星', isBrightest: true },
    ],
  },

  // ── みなみじゅうじ座 (Crux) ──────────────────────────────────────────────
  cru: {
    stars: [
      [50, 12],  // 0 Gacrux (top)
      [50, 78],  // 1 Acrux (bottom)
      [18, 45],  // 2 Delta (left)
      [82, 45],  // 3 Becrux (right)
      [62, 30],  // 4 epsilon (small one off center)
    ],
    lines: [
      [0, 1], [2, 3], [4, 1],
    ],
    silhouette: 'M50,5 C53,5 56,8 56,12 C60,10 64,12 65,16 C66,20 64,25 60,28 C64,30 68,33 68,38 C68,43 64,47 60,48 C64,50 68,54 68,60 C68,65 64,68 60,68 C58,72 56,78 53,82 C51,85 49,85 47,82 C44,78 42,72 40,68 C36,68 32,65 32,60 C32,54 36,50 40,48 C36,47 32,43 32,38 C32,33 36,30 40,28 C36,25 34,20 35,16 C36,12 40,10 44,12 C44,8 47,5 50,5 Z',
    starNames: [
      { nameJa: 'ガクルックス', nameEn: 'Gacrux', meaning: 'ラテン語+略号の混成。縦軸の北端' },
      { nameJa: 'アクルックス', nameEn: 'Acrux', meaning: 'ラテン語+略号の混成。縦軸の南端', isBrightest: true },
      { nameJa: 'デルタ・クルシス', nameEn: 'Delta Cru', meaning: '南十字左端' },
      { nameJa: 'ベクルックス', nameEn: 'Becrux', meaning: 'ラテン語+略号の混成。横軸の明星' },
      null,
    ],
  },

  // ── ケンタウルス座 (Centaurus) ───────────────────────────────────────────
  cen: {
    stars: [
      [55, 22],  // 0 Alpha Centauri (bright)
      [45, 20],  // 1 Beta (Hadar)
      [65, 30],  // 2 theta
      [38, 35],  // 3 epsilon
      [28, 40],  // 4 eta
      [20, 48],  // 5 zeta (right foot / hand)
      [70, 42],  // 6 gamma (left body)
      [78, 55],  // 7 delta (left arm)
      [60, 55],  // 8 iota
      [50, 65],  // 9 mu (body center)
      [42, 75],  // 10 nu (right leg)
      [35, 80],  // 11 phi (right hoof)
      [58, 80],  // 12 xi (left leg)
      [65, 85],  // 13 psi (left hoof)
    ],
    lines: [
      [1, 0], [0, 2], [2, 6], [6, 7],
      [0, 3], [3, 4], [4, 5],
      [6, 8], [8, 9],
      [9, 10], [10, 11],
      [9, 12], [12, 13],
    ],
    silhouette: 'M50,12 C56,8 65,10 68,18 C72,12 78,15 80,22 C82,30 78,38 72,42 C78,45 82,52 80,60 C78,68 70,72 65,68 C62,75 60,82 58,88 C55,92 50,90 48,85 C44,88 42,84 40,80 C38,72 42,65 45,60 C40,62 32,60 28,54 C24,48 26,40 30,35 C24,32 18,26 20,18 C22,10 30,8 36,12 C38,7 44,5 50,12 Z',
    starNames: [
      { nameJa: 'アルファ・ケンタウリ', nameEn: 'Alpha Centauri', meaning: '太陽系に最も近い恒星系。3つの星から構成', isBrightest: true },
      { nameJa: 'ハダル', nameEn: 'Hadar', meaning: 'アラビア語で「地面」または「都市」' },
      null, null, null, null, null, null, null, null, null, null, null, null,
    ],
  },

  // ── さいだん座 (Ara) ─────────────────────────────────────────────────────
  ara: {
    stars: [
      [35, 30],  // 0 beta
      [50, 22],  // 1 alpha
      [65, 30],  // 2 epsilon
      [65, 48],  // 3 zeta
      [50, 55],  // 4 delta (center)
      [35, 48],  // 5 gamma
      [50, 70],  // 6 theta (base)
      [38, 70],  // 7 eta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [4, 6], [6, 7], [7, 5],
    ],
    silhouette: 'M50,12 C56,8 65,10 70,18 C75,14 80,18 80,26 C80,34 74,40 68,42 C72,48 72,56 68,62 C64,68 56,70 50,68 C44,70 36,68 32,62 C28,56 28,48 32,42 C26,40 20,34 20,26 C20,18 25,14 30,18 C35,10 44,8 50,12 Z M35,45 C38,40 45,38 50,40 C55,38 62,40 65,45 C62,52 55,55 50,55 C45,55 38,52 35,45 Z',
  },

  // ── からす座 (Corvus) ────────────────────────────────────────────────────
  crv: {
    stars: [
      [28, 38],  // 0 Alchiba (alpha)
      [38, 28],  // 1 beta
      [55, 25],  // 2 Gienah (gamma, bright)
      [65, 38],  // 3 Kraz (beta)
      [60, 55],  // 4 delta
      [42, 52],  // 5 epsilon
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [1, 5], [2, 4],
    ],
    silhouette: 'M50,12 C56,8 64,10 68,18 C72,12 78,15 80,24 C80,32 74,38 68,40 C72,46 72,55 66,62 C60,68 52,68 47,64 C44,70 40,75 36,73 C32,70 32,62 35,57 C28,58 22,55 20,48 C18,40 23,32 30,28 C24,24 22,15 28,10 C34,5 42,7 45,14 Z',
  },

  // ── コップ座 (Crater) ────────────────────────────────────────────────────
  crt: {
    stars: [
      [50, 62],  // 0 Alkes (alpha, bottom)
      [38, 52],  // 1 beta
      [38, 38],  // 2 gamma
      [50, 28],  // 3 delta
      [62, 38],  // 4 epsilon
      [65, 52],  // 5 zeta
      [55, 65],  // 6 theta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [0, 6], [6, 5],
      [2, 4],
    ],
    silhouette: 'M50,20 C56,16 64,18 68,26 C72,20 78,24 78,32 C78,40 72,48 65,50 C70,56 70,65 65,70 C62,74 58,74 55,72 C55,78 52,84 50,86 C48,84 45,78 45,72 C42,74 38,74 35,70 C30,65 30,56 35,50 C28,48 22,40 22,32 C22,24 28,20 32,26 C36,18 44,16 50,20 Z',
  },

  // ── こぎつね座 (Vulpecula) ───────────────────────────────────────────────
  vul: {
    stars: [
      [35, 45],  // 0 alpha (anser)
      [48, 40],  // 1 1 Vul
      [55, 48],  // 2 2 Vul
      [65, 42],  // 3 5 Vul
    ],
    lines: [
      [0, 1], [1, 2], [2, 3],
    ],
    silhouette: 'M25,35 C20,30 22,22 28,18 C34,14 42,18 45,25 C48,20 55,18 62,22 C68,18 75,20 78,28 C80,36 75,44 68,46 C72,52 72,60 67,66 C62,70 55,68 52,63 C48,68 44,72 38,70 C32,68 30,60 32,55 C26,58 18,55 16,48 C14,40 18,33 25,35 Z',
  },

  // ── いて座はすでに上で定義済み (sgr) ─────────────────────────────────────

  // ── はと座 (Columba) ─────────────────────────────────────────────────────
  col: {
    stars: [
      [42, 42],  // 0 Phact (alpha)
      [55, 50],  // 1 Wazn (beta)
      [35, 55],  // 2 delta
      [28, 48],  // 3 epsilon
      [62, 42],  // 4 gamma (tail)
      [70, 38],  // 5 eta (tail end)
    ],
    lines: [
      [3, 2], [2, 0], [0, 1],
      [0, 4], [4, 5],
    ],
    silhouette: 'M28,35 C22,30 22,22 28,18 C34,14 42,16 46,22 C50,16 58,14 65,18 C72,14 78,18 80,26 C82,34 78,42 72,45 C76,50 76,60 70,65 C65,70 57,68 53,62 C50,68 45,72 40,70 C35,68 32,60 35,55 C28,58 22,54 20,48 C18,42 22,36 28,35 Z',
  },

  // ── かみのけ座 (Coma Berenices) ──────────────────────────────────────────
  com: {
    stars: [
      [50, 45],  // 0 beta
      [35, 32],  // 1 alpha (Diadem)
      [65, 30],  // 2 gamma
      [42, 22],  // 3 upper
      [58, 60],  // 4 lower
    ],
    lines: [
      [0, 1], [0, 2], [1, 3], [0, 4],
    ],
    silhouette: 'M50,10 C55,8 62,10 65,18 C70,12 76,15 78,24 C80,32 75,42 68,46 C72,52 72,62 66,68 C60,74 50,74 44,68 C38,74 30,72 26,65 C22,58 25,48 30,44 C24,40 20,30 24,22 C28,14 36,10 42,15 C44,10 47,8 50,10 Z',
  },

  // ── りょうけん座 (Canes Venatici) ───────────────────────────────────────
  cvn: {
    stars: [
      [40, 40],  // 0 Cor Caroli (alpha, bright)
      [55, 55],  // 1 Chara (beta)
      [30, 50],  // 2 upper
      [48, 28],  // 3 tip
    ],
    lines: [
      [2, 0], [0, 1], [0, 3],
    ],
    silhouette: 'M35,20 C30,15 25,20 25,28 C20,25 15,30 15,38 C15,46 22,52 30,52 C28,58 28,65 32,70 C36,74 42,74 46,70 C48,75 52,78 58,76 C64,74 68,67 65,60 C70,58 75,52 74,44 C73,36 66,30 58,30 C60,24 58,16 52,12 C46,8 38,10 35,20 Z',
  },

  // ── いっかくじゅう座 (Monoceros) ────────────────────────────────────────
  mon: {
    stars: [
      [30, 42],  // 0 alpha
      [45, 35],  // 1 beta
      [58, 28],  // 2 gamma
      [52, 50],  // 3 delta
      [40, 58],  // 4 epsilon
      [65, 42],  // 5 S Mon
    ],
    lines: [
      [0, 1], [1, 2], [1, 3], [3, 4], [3, 5],
    ],
    silhouette: 'M15,42 C12,35 15,25 22,20 C18,15 20,8 28,6 C36,4 42,10 42,18 C46,12 55,10 62,15 C68,10 76,12 78,20 C80,28 75,38 68,42 C74,46 78,55 74,63 C70,72 60,75 52,70 C50,76 48,82 44,85 C40,80 40,74 42,68 C35,72 26,70 22,63 C18,56 18,48 22,42 Z',
  },

  // ── やまねこ座 (Lynx) ────────────────────────────────────────────────────
  lyn: {
    stars: [
      [22, 30],  // 0 alpha
      [32, 38],  // 1 38 Lyn
      [42, 45],  // 2 10 Lyn
      [52, 52],  // 3 2 Lyn
      [62, 58],  // 4 21 Lyn
      [72, 62],  // 5 far
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
    ],
    silhouette: 'M15,22 C10,16 12,8 20,6 C28,4 35,10 35,18 C40,12 48,10 55,14 C62,10 70,12 74,20 C78,28 75,38 68,42 C74,46 78,55 75,63 C72,72 62,76 55,72 C52,78 50,85 46,88 C42,83 42,76 44,70 C38,74 30,74 25,68 C20,62 20,54 25,48 C18,46 12,40 12,32 Z',
  },

  // ── うさぎ座 (Lepus) ─────────────────────────────────────────────────────
  lep: {
    stars: [
      [42, 38],  // 0 Arneb (alpha)
      [55, 45],  // 1 Nihal (beta)
      [65, 38],  // 2 gamma
      [68, 28],  // 3 delta
      [55, 28],  // 4 epsilon
      [40, 50],  // 5 zeta
      [30, 55],  // 6 eta
      [25, 48],  // 7 theta
    ],
    lines: [
      [7, 6], [6, 5], [5, 0], [0, 4], [4, 3], [3, 2], [2, 1],
      [0, 1], [1, 5],
    ],
    silhouette: 'M22,40 C16,35 15,25 22,20 C18,15 20,8 28,6 C34,4 40,10 42,17 C46,12 54,10 60,14 C66,10 74,12 76,20 C78,28 74,36 68,40 C72,46 75,54 72,62 C68,70 58,74 52,70 C50,76 48,84 45,88 C40,85 38,78 40,72 C34,76 26,76 22,70 C18,64 20,55 25,50 Z',
  },

  // ── おおかみ座 (Lupus) ───────────────────────────────────────────────────
  lup: {
    stars: [
      [40, 28],  // 0 alpha (Men)
      [28, 35],  // 1 beta
      [55, 22],  // 2 gamma (head)
      [65, 32],  // 3 delta
      [70, 45],  // 4 epsilon
      [55, 50],  // 5 zeta (body)
      [42, 55],  // 6 eta
      [32, 62],  // 7 theta (leg)
      [60, 65],  // 8 iota (tail)
    ],
    lines: [
      [2, 0], [0, 1], [2, 3], [3, 4], [4, 5], [5, 0],
      [5, 6], [6, 7],
      [5, 8],
    ],
    silhouette: 'M55,12 C62,8 70,12 72,20 C76,15 82,18 84,26 C86,35 80,45 73,48 C78,54 80,64 75,72 C70,78 60,80 54,74 C52,80 50,86 46,88 C42,84 40,76 42,70 C36,74 28,72 24,66 C20,60 22,50 28,45 C22,40 18,30 22,22 C26,14 35,10 40,15 C42,10 48,8 55,12 Z',
  },

  // ── ケフェウス座 (Cepheus) ───────────────────────────────────────────────
  cep: {
    stars: [
      [50, 15],  // 0 Alderamin (alpha, bright)
      [30, 25],  // 1 Alfirk (beta)
      [30, 50],  // 2 Errai (gamma)
      [50, 55],  // 3 delta (Cephei)
      [68, 45],  // 4 epsilon
      [70, 28],  // 5 zeta (head)
    ],
    lines: [
      [1, 0], [0, 5],
      [1, 2], [2, 3], [3, 4], [4, 0],
      [4, 5],
    ],
    silhouette: 'M50,8 C55,5 62,8 65,15 C70,10 76,12 78,20 C80,28 75,35 68,38 C74,42 78,52 74,60 C70,68 60,72 53,66 C56,72 55,80 50,84 C45,80 44,72 47,66 C40,72 30,68 26,60 C22,52 26,42 32,38 C26,35 21,28 22,20 C24,12 30,10 35,15 C38,8 44,5 50,8 Z',
  },

  // ── イルカ座 (Delphinus) ──────────────────────────────────────────────────
  del: {
    stars: [
      [40, 38],  // 0 Sualocin (alpha)
      [52, 32],  // 1 Rotanev (beta)
      [58, 42],  // 2 gamma
      [48, 50],  // 3 delta
      [38, 65],  // 4 epsilon (tail)
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [3, 4],
    ],
    silhouette: 'M38,25 C32,20 28,25 28,32 C25,28 20,32 22,40 C24,48 32,52 40,50 C38,57 38,65 42,72 C46,75 52,72 54,65 C58,70 64,70 68,65 C72,58 68,50 62,46 C68,42 72,34 70,25 C68,16 58,12 52,18 C50,12 44,10 38,15 Z',
  },

  // ── こうま座 (Equuleus) ──────────────────────────────────────────────────
  equ: {
    stars: [
      [45, 45],  // 0 Kitalpha (alpha)
      [55, 38],  // 1 delta
      [62, 50],  // 2 gamma
      [50, 58],  // 3 beta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M38,32 C32,26 32,18 38,14 C44,10 52,12 55,18 C58,12 66,10 72,16 C78,22 78,32 72,38 C78,42 80,52 75,60 C70,68 60,70 54,65 C52,72 50,78 46,80 C42,76 40,68 42,62 C36,66 28,65 25,58 C22,50 25,42 32,38 Z',
  },

  // ── りゅうこつ座 (Carina) ────────────────────────────────────────────────
  car: {
    stars: [
      [22, 45],  // 0 Canopus (alpha, very bright)
      [35, 52],  // 1 beta
      [45, 38],  // 2 Miaplacidus
      [55, 32],  // 3 Avior (epsilon)
      [65, 38],  // 4 theta
      [72, 50],  // 5 iota
      [65, 62],  // 6 upsilon
      [48, 65],  // 7 omega
      [38, 60],  // 8 q Car
    ],
    lines: [
      [0, 1], [1, 8], [8, 7], [7, 6], [6, 5],
      [5, 4], [4, 3], [3, 2], [2, 1],
    ],
    silhouette: 'M15,38 C10,32 12,22 20,18 C25,22 28,30 25,38 C30,32 38,28 45,30 C42,22 48,15 56,15 C64,15 70,22 70,30 C75,25 82,26 84,34 C86,42 82,50 76,52 C80,58 80,68 74,74 C68,80 58,80 52,74 C48,80 42,84 36,82 C30,80 26,72 28,65 C22,68 14,66 10,58 C8,50 10,42 15,38 Z',
  },

  // ── ほ座 (Vela) ──────────────────────────────────────────────────────────
  vel: {
    stars: [
      [40, 38],  // 0 gamma2 (brightest)
      [52, 30],  // 1 delta
      [62, 22],  // 2 kappa
      [68, 35],  // 3 mu
      [62, 48],  // 4 phi
      [50, 55],  // 5 lambda
      [35, 55],  // 6 psi (sail bottom)
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
    ],
    silhouette: 'M30,28 C25,22 28,14 35,10 C42,6 50,10 52,18 C56,12 65,10 72,16 C78,22 78,32 72,38 C78,42 82,52 78,62 C74,72 62,76 54,70 C52,76 48,80 44,78 C40,74 40,66 44,60 C38,64 30,62 26,55 C22,48 24,38 30,32 Z',
  },

  // ── とも座 (Puppis) ──────────────────────────────────────────────────────
  pup: {
    stars: [
      [50, 20],  // 0 Naos (zeta)
      [40, 35],  // 1 rho
      [55, 38],  // 2 xi
      [35, 52],  // 3 pi
      [55, 55],  // 4 nu
      [45, 65],  // 5 sigma (tau)
      [60, 68],  // 6 L2 Pup
    ],
    lines: [
      [0, 1], [0, 2],
      [1, 3], [2, 4],
      [3, 5], [4, 5],
      [5, 6],
    ],
    silhouette: 'M50,12 C56,8 64,10 68,18 C74,14 80,18 82,26 C84,34 80,44 74,48 C80,52 82,62 78,70 C74,78 64,82 56,78 C54,84 52,90 48,92 C44,88 42,82 44,76 C38,80 30,78 26,72 C22,66 24,56 30,50 C24,46 18,38 20,28 C22,18 30,13 36,17 C38,11 44,9 50,12 Z',
  },

  // ── つる座 (Grus) ────────────────────────────────────────────────────────
  gru: {
    stars: [
      [50, 28],  // 0 Alnair (alpha, body)
      [38, 40],  // 1 Gruid (beta)
      [50, 48],  // 2 gamma (body)
      [60, 40],  // 3 delta2
      [35, 55],  // 4 epsilon (leg)
      [45, 65],  // 5 zeta (lower leg)
      [50, 15],  // 6 mu (head/neck)
      [50, 8],   // 7 top (beak)
    ],
    lines: [
      [7, 6], [6, 0],
      [0, 1], [0, 2], [0, 3],
      [2, 4], [4, 5],
    ],
    silhouette: 'M50,5 C53,3 56,5 56,10 C60,8 65,10 66,18 C68,25 64,32 58,35 C62,38 65,45 62,52 C60,58 54,62 50,60 C48,66 48,74 50,80 C46,78 42,72 42,65 C38,70 32,70 28,64 C24,58 26,50 30,44 C24,40 18,35 18,28 C18,20 24,14 30,15 C28,10 32,5 38,5 Z',
    starNames: [
      { nameJa: 'アルナイル', nameEn: 'Alnair', meaning: 'アラビア語で「明るい者」', isBrightest: true },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },

  // ── みなみのさかな座 (Piscis Austrinus) ─────────────────────────────────
  psa: {
    stars: [
      [50, 42],  // 0 Fomalhaut (alpha, bright)
      [38, 35],  // 1 beta
      [28, 42],  // 2 gamma
      [30, 55],  // 3 delta
      [45, 58],  // 4 epsilon
      [60, 52],  // 5 mu
      [65, 38],  // 6 iota
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
    ],
    silhouette: 'M50,28 C56,22 66,24 70,32 C75,26 82,28 84,36 C86,44 82,54 75,58 C80,64 80,74 74,80 C68,86 58,86 52,80 C50,86 48,90 44,88 C40,84 40,76 44,70 C38,74 30,73 26,67 C22,60 24,50 30,44 C24,40 20,32 24,24 C28,16 38,14 44,20 Z',
    starNames: [
      { nameJa: 'フォーマルハウト', nameEn: 'Fomalhaut', meaning: 'アラビア語で「魚の口」。秋の一等星', isBrightest: true },
      null, null, null, null, null, null,
    ],
  },

  // ── きょしちょう座 / とびうお座 など省略パターン ─────────────────────────

  // Fallback pattern for less common constellations
  // (ant, aps, cae, cam, cha, cir, dor, for, gru already have real entries above)

  // ── ほうおう座 (Phoenix) ──────────────────────────────────────────────────
  phe: {
    stars: [
      [50, 38],  // 0 Ankaa (alpha, bright)
      [35, 28],  // 1 beta
      [62, 28],  // 2 gamma
      [38, 50],  // 3 delta
      [60, 50],  // 4 epsilon
      [45, 65],  // 5 zeta (tail)
      [55, 62],  // 6 eta
    ],
    lines: [
      [1, 0], [0, 2],
      [0, 3], [0, 4],
      [3, 5], [4, 6],
      [5, 6],
    ],
    silhouette: 'M50,15 C56,10 65,12 70,20 C75,14 82,16 84,26 C86,36 80,46 72,50 C78,55 80,65 75,72 C70,80 58,82 52,76 C56,82 55,90 50,93 C45,90 44,82 48,76 C42,82 30,80 25,72 C20,65 22,55 28,50 C20,46 14,36 16,26 C18,16 25,14 30,20 C35,12 44,10 50,15 Z',
  },

  // ── くじゃく座 (Pavo) ────────────────────────────────────────────────────
  pav: {
    stars: [
      [50, 22],  // 0 Peacock (alpha, bright)
      [38, 35],  // 1 beta
      [62, 32],  // 2 delta
      [30, 48],  // 3 gamma
      [68, 45],  // 4 epsilon
      [25, 62],  // 5 zeta
      [72, 58],  // 6 xi
      [50, 65],  // 7 body center
      [40, 75],  // 8 left tail
      [60, 75],  // 9 right tail
    ],
    lines: [
      [0, 1], [0, 2],
      [1, 3], [2, 4],
      [3, 5], [4, 6],
      [5, 7], [6, 7], [7, 8], [7, 9],
    ],
    silhouette: 'M50,12 C56,8 65,10 68,18 C74,12 80,16 82,25 C84,34 78,44 70,48 C76,53 80,62 76,70 C72,78 62,82 56,77 C58,83 55,90 50,93 C45,90 42,83 44,77 C38,82 28,78 24,70 C20,62 24,53 30,48 C22,44 16,34 18,25 C20,16 26,12 32,18 C35,10 44,8 50,12 Z',
  },

  // ── おおかみ座 (Tucana) ──────────────────────────────────────────────────
  tuc: {
    stars: [
      [42, 38],  // 0 alpha
      [55, 30],  // 1 beta2 (bright pair)
      [65, 42],  // 2 gamma
      [60, 55],  // 3 delta
      [45, 60],  // 4 epsilon
      [35, 50],  // 5 zeta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    ],
    silhouette: 'M42,22 C35,16 28,20 25,28 C20,24 15,30 16,38 C17,46 24,52 32,52 C28,58 28,66 33,72 C38,77 45,76 50,72 C52,78 55,84 60,84 C65,84 68,78 67,72 C72,72 78,68 80,62 C82,55 78,48 72,44 C78,40 82,32 80,23 C78,14 68,10 60,14 C58,8 52,6 48,10 Z',
  },

  // ── インディアン座 (Indus) ───────────────────────────────────────────────
  ind: {
    stars: [
      [42, 35],  // 0 alpha
      [55, 28],  // 1 beta
      [65, 40],  // 2 delta
      [58, 55],  // 3 theta
      [42, 60],  // 4 eta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
    ],
    silhouette: 'M50,15 C56,10 64,12 68,20 C73,14 80,17 82,26 C84,35 78,46 70,50 C76,56 78,66 72,74 C66,82 55,84 48,78 C46,84 44,90 40,88 C36,84 37,76 40,70 C34,74 26,72 22,65 C18,58 20,48 26,42 C20,38 15,28 18,20 C21,12 30,9 36,15 C38,9 44,7 50,15 Z',
  },

  // ── ちょうこくしつ座 (Sculptor) ─────────────────────────────────────────
  scl: {
    stars: [
      [42, 40],  // 0 alpha
      [55, 32],  // 1 beta
      [65, 45],  // 2 gamma
      [52, 58],  // 3 delta
      [38, 55],  // 4 eta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
    ],
    silhouette: 'M50,22 C56,16 65,18 70,27 C76,20 83,24 84,33 C85,42 79,52 72,55 C76,62 76,72 70,78 C64,84 54,84 48,78 C46,84 44,90 40,88 C36,84 36,76 40,70 C34,73 26,70 23,63 C20,56 23,46 30,41 C24,36 20,26 24,18 C28,10 38,8 44,14 Z',
  },

  // ── ろ座 (Fornax) ────────────────────────────────────────────────────────
  for: {
    stars: [
      [45, 42],  // 0 alpha
      [58, 35],  // 1 beta
      [65, 50],  // 2 nu
      [55, 60],  // 3 eta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M45,28 C38,22 32,26 30,34 C25,30 18,34 18,42 C18,50 26,58 35,58 C32,65 33,74 38,80 C44,85 52,84 56,78 C60,84 66,86 72,82 C78,76 78,68 72,62 C78,58 83,50 82,42 C80,34 73,28 65,30 C62,23 55,20 50,25 Z',
  },

  // ── みつへび座 (Serpens) ─────────────────────────────────────────────────
  ser: {
    stars: [
      [32, 30],  // 0 Unukalhai (alpha, head)
      [40, 22],  // 1 beta (head)
      [28, 22],  // 2 delta (head)
      [42, 38],  // 3 epsilon (neck)
      [50, 48],  // 4 mu (body)
      [58, 55],  // 5 xi (tail end)
      [65, 62],  // 6 nu
      [72, 68],  // 7 omicron
    ],
    lines: [
      [2, 0], [0, 1],
      [0, 3], [3, 4], [4, 5], [5, 6], [6, 7],
    ],
    silhouette: 'M28,14 C22,10 18,16 20,24 C16,22 10,26 12,34 C14,42 22,46 30,44 C28,50 28,58 32,64 C36,70 44,72 50,68 C52,74 54,80 58,82 C62,80 65,74 63,68 C68,70 74,68 76,62 C78,56 75,48 70,44 C74,40 78,32 76,23 C74,14 65,10 58,14 C55,8 48,6 44,10 Z',
  },

  // ── たて座 (Scutum) ──────────────────────────────────────────────────────
  sct: {
    stars: [
      [48, 32],  // 0 alpha
      [40, 45],  // 1 beta
      [52, 50],  // 2 gamma
      [58, 38],  // 3 delta
      [45, 62],  // 4 eta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [1, 4],
    ],
    silhouette: 'M50,18 C56,14 64,16 68,24 C72,18 78,22 80,30 C82,38 77,48 70,52 C75,58 75,68 70,74 C64,80 55,80 50,75 C48,80 45,85 41,83 C37,80 37,72 40,67 C34,70 27,67 24,60 C21,52 24,42 30,37 C24,32 21,22 26,16 C31,10 40,10 44,16 Z',
  },

  // ── さんかく座 (Triangulum) ──────────────────────────────────────────────
  tri: {
    stars: [
      [50, 25],  // 0 beta (top)
      [28, 60],  // 1 alpha (left)
      [72, 55],  // 2 gamma (right)
    ],
    lines: [
      [0, 1], [1, 2], [2, 0],
    ],
    silhouette: 'M50,15 C54,12 58,15 58,20 C65,15 72,18 75,26 C78,34 73,42 65,46 C70,52 70,62 65,68 C60,74 52,74 48,69 C44,74 36,74 31,68 C26,62 26,52 31,46 C23,42 18,34 21,26 C24,18 31,15 38,20 C38,15 46,12 50,15 Z',
  },

  // ── みなみのさんかく座 (Triangulum Australe) ─────────────────────────────
  tra: {
    stars: [
      [50, 25],  // 0 Atria (alpha, bright)
      [30, 62],  // 1 beta
      [70, 62],  // 2 gamma
    ],
    lines: [
      [0, 1], [1, 2], [2, 0],
    ],
    silhouette: 'M50,12 C55,9 60,12 60,18 C68,14 76,18 78,27 C80,36 74,46 65,50 C70,56 70,66 64,72 C58,78 50,78 44,72 C38,78 30,76 26,70 C22,64 22,54 28,48 C20,44 14,35 16,26 C18,17 28,13 35,18 C38,13 44,10 50,12 Z',
  },

  // ── いて座の矢 (Sagitta) ─────────────────────────────────────────────────
  sge: {
    stars: [
      [18, 45],  // 0 gamma (arrowhead)
      [32, 50],  // 1 delta (shaft)
      [50, 50],  // 2 alpha (nock)
      [65, 45],  // 3 beta (one feather)
      [65, 55],  // 4 eta (other feather)
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [2, 4],
    ],
    silhouette: 'M10,45 C8,40 12,34 18,32 C22,28 28,30 30,35 C34,30 42,28 50,30 C55,26 62,26 68,30 C72,25 78,26 80,32 C82,38 78,44 72,46 C78,50 80,58 76,64 C72,70 64,70 60,65 C58,70 55,76 50,78 C45,76 42,70 40,65 C36,70 28,70 24,65 C20,60 22,52 28,48 C22,50 14,50 10,45 Z',
  },

  // ── ポンプ座 (Antlia) ────────────────────────────────────────────────────
  ant: {
    stars: [
      [42, 42],  // 0 alpha
      [56, 38],  // 1 epsilon
      [62, 52],  // 2 eta
      [48, 58],  // 3 theta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M42,25 C35,20 28,24 25,32 C20,28 14,34 15,42 C16,50 24,57 33,56 C30,63 31,72 36,77 C42,82 50,80 54,75 C58,80 64,82 70,78 C76,72 76,63 70,57 C76,53 82,45 81,36 C80,27 71,22 63,26 C60,20 53,17 48,22 Z',
  },

  // ── みなみのかんむり座 (Corona Australis) ────────────────────────────────
  cra: {
    stars: [
      [42, 50],  // 0 Alfecca Meridiana (alpha)
      [35, 42],  // 1 beta
      [30, 35],  // 2 gamma
      [35, 28],  // 3 delta
      [45, 24],  // 4 epsilon
      [55, 28],  // 5 zeta
      [62, 35],  // 6 theta
      [62, 45],  // 7 eta
      [55, 52],  // 8 iota
    ],
    lines: [
      [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
      [1, 0], [0, 8],
    ],
    silhouette: 'M45,15 C52,10 62,13 68,22 C75,16 82,20 83,30 C84,40 77,50 68,53 C72,60 70,70 63,75 C56,80 47,79 42,73 C38,79 30,80 25,74 C20,68 22,58 28,52 C20,49 13,40 14,30 C15,20 23,16 30,20 C32,14 38,11 45,15 Z',
  },

  // ── ろくぶんぎ座 (Sextans) ──────────────────────────────────────────────
  sex: {
    stars: [
      [40, 45],  // 0 alpha
      [52, 38],  // 1 beta
      [60, 52],  // 2 gamma
      [48, 58],  // 3 delta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M50,28 C57,22 66,25 70,33 C76,27 83,31 84,40 C85,49 78,58 70,61 C75,67 74,77 68,83 C62,88 53,87 48,82 C46,87 43,92 38,90 C34,87 33,79 37,73 C30,75 23,72 21,65 C18,57 22,47 28,42 C22,37 18,28 22,21 C26,14 36,13 42,19 Z',
  },

  // ── コンパス座 (Circinus) ────────────────────────────────────────────────
  cir: {
    stars: [
      [45, 45],  // 0 alpha
      [55, 35],  // 1 beta
      [60, 55],  // 2 gamma
    ],
    lines: [
      [0, 1], [1, 2], [2, 0],
    ],
    silhouette: 'M45,30 C38,24 30,28 27,36 C22,32 16,38 18,46 C20,54 30,60 40,58 C37,65 38,74 44,79 C50,83 58,81 62,75 C66,80 72,81 76,76 C80,70 78,61 72,57 C78,52 82,44 80,35 C78,26 68,22 60,27 C57,21 50,18 45,24 Z',
  },

  // ── ふうちょう座 (Apus) ─────────────────────────────────────────────────
  aps: {
    stars: [
      [45, 38],  // 0 alpha
      [55, 30],  // 1 beta
      [62, 45],  // 2 gamma
      [50, 58],  // 3 delta1
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M50,15 C56,10 65,12 70,20 C76,14 83,18 84,27 C85,36 79,46 70,50 C75,56 75,67 68,73 C62,79 52,79 47,73 C45,79 42,86 37,84 C32,82 31,74 35,68 C28,70 21,66 19,59 C16,52 20,42 26,37 C20,32 17,22 21,15 C25,8 35,7 40,13 Z',
  },

  // ── とびうお座 (Volans) ──────────────────────────────────────────────────
  vol: {
    stars: [
      [42, 42],  // 0 gamma2
      [52, 35],  // 1 beta
      [60, 42],  // 2 alpha
      [56, 55],  // 3 delta
      [44, 58],  // 4 epsilon
      [35, 50],  // 5 zeta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    ],
    silhouette: 'M35,28 C28,22 22,28 22,36 C16,32 10,38 12,46 C14,54 23,60 33,58 C30,65 30,74 36,80 C42,85 50,84 55,79 C58,84 63,87 68,84 C73,80 74,72 70,66 C76,62 81,55 80,46 C79,37 70,31 62,34 C60,28 55,24 50,28 Z',
  },

  // ── かじき座 (Dorado) ────────────────────────────────────────────────────
  dor: {
    stars: [
      [42, 38],  // 0 alpha
      [55, 28],  // 1 beta
      [65, 40],  // 2 gamma
      [58, 55],  // 3 delta
      [44, 58],  // 4 epsilon
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
    ],
    silhouette: 'M42,22 C35,15 27,19 24,28 C18,23 12,30 14,39 C16,48 26,54 36,52 C32,60 33,70 39,76 C45,82 55,81 60,75 C64,81 70,83 76,78 C82,73 82,64 76,58 C83,54 88,46 86,37 C84,28 75,22 66,26 C62,20 55,16 50,21 Z',
  },

  // ── みずへび座 (Hydrus) ──────────────────────────────────────────────────
  hyi: {
    stars: [
      [45, 25],  // 0 alpha
      [35, 42],  // 1 beta
      [52, 55],  // 2 gamma
      [60, 40],  // 3 delta
      [65, 28],  // 4 eta
    ],
    lines: [
      [0, 4], [4, 3], [3, 2], [2, 1], [1, 0],
    ],
    silhouette: 'M45,12 C38,8 30,12 26,20 C20,16 13,22 14,31 C15,40 24,47 34,46 C30,53 30,63 36,69 C42,75 52,75 58,70 C62,76 66,80 71,78 C76,75 78,68 75,62 C80,58 84,50 83,41 C82,32 73,26 64,29 C62,22 56,18 50,21 Z',
  },

  // ── カメレオン座 (Chamaeleon) ────────────────────────────────────────────
  cha: {
    stars: [
      [40, 42],  // 0 alpha
      [52, 35],  // 1 beta
      [62, 42],  // 2 gamma
      [55, 55],  // 3 delta2
      [42, 58],  // 4 epsilon
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
    ],
    silhouette: 'M38,25 C30,19 22,23 20,32 C14,28 8,35 10,44 C12,53 22,60 33,58 C29,65 30,75 36,81 C42,87 52,87 58,82 C62,87 68,89 74,85 C80,80 80,71 74,65 C80,61 85,53 83,44 C81,34 72,27 62,30 C60,24 54,20 48,23 Z',
  },

  // ── きりん座 (Camelopardalis) ────────────────────────────────────────────
  cam: {
    stars: [
      [40, 22],  // 0 beta (bright)
      [52, 30],  // 1 alpha
      [60, 18],  // 2 Gamma (head area)
      [68, 28],  // 3 far head
      [35, 38],  // 4 CS Cam (body)
      [28, 50],  // 5 lower body
      [38, 62],  // 6 leg
    ],
    lines: [
      [2, 3], [2, 0], [0, 1], [1, 4], [4, 5], [5, 6],
    ],
    silhouette: 'M65,8 C70,4 76,7 78,14 C82,10 88,14 88,22 C88,30 83,36 76,38 C80,44 80,54 74,62 C68,70 56,72 50,65 C47,72 45,80 41,83 C36,80 35,72 37,65 C30,68 22,66 18,59 C14,52 16,42 22,37 C16,32 12,22 16,14 C20,6 30,4 35,10 C28,14 22,22 22,30 C22,38 28,44 36,46 C34,38 36,28 42,22 C46,17 53,15 58,19 Z',
  },

  // ── ちょうこくぐ座 (Caelum) ──────────────────────────────────────────────
  cae: {
    stars: [
      [45, 42],  // 0 alpha
      [55, 35],  // 1 beta
      [62, 50],  // 2 gamma
      [50, 58],  // 3 delta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M45,28 C38,22 30,26 27,34 C22,30 16,36 16,44 C16,52 24,59 33,58 C30,65 31,74 36,80 C42,85 51,84 56,79 C60,84 66,86 71,82 C76,78 76,70 71,64 C77,60 82,52 81,44 C80,35 71,29 62,32 C59,26 52,23 45,28 Z',
  },

  // ── テーブルさん座 (Mensa) ───────────────────────────────────────────────
  men: {
    stars: [
      [35, 48],  // 0 alpha
      [48, 38],  // 1 beta
      [60, 45],  // 2 gamma
      [55, 60],  // 3 eta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M28,35 C22,28 23,18 30,14 C36,10 44,14 46,22 C50,16 58,14 65,18 C72,14 79,18 81,27 C83,36 78,46 70,50 C75,56 75,66 68,72 C62,78 52,78 47,72 C44,78 40,83 35,81 C30,79 28,72 30,66 C24,68 17,65 15,58 C13,51 16,42 22,38 Z',
  },

  // ── けんびきょう座 (Microscopium) ───────────────────────────────────────
  mic: {
    stars: [
      [42, 40],  // 0 gamma
      [55, 34],  // 1 alpha
      [65, 45],  // 2 epsilon
      [55, 58],  // 3 theta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M42,24 C35,18 27,22 24,30 C18,26 12,32 13,41 C14,50 23,57 33,55 C29,62 30,72 36,78 C42,83 52,83 57,78 C61,83 67,85 73,81 C79,77 79,68 73,62 C79,58 84,50 83,41 C82,32 73,26 63,30 C61,23 53,20 47,25 Z',
  },

  // ── はちぶんぎ座 (Octans) ────────────────────────────────────────────────
  oct: {
    stars: [
      [38, 45],  // 0 nu (brightest)
      [52, 38],  // 1 beta
      [60, 55],  // 2 delta
      [45, 62],  // 3 theta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M38,28 C30,22 22,26 19,35 C13,31 7,38 8,47 C9,56 18,63 28,61 C24,68 25,78 31,84 C38,89 48,89 53,84 C57,89 63,91 68,87 C74,83 74,75 68,69 C74,65 79,57 78,48 C77,39 68,32 58,36 C55,29 48,26 42,31 Z',
  },

  // ── はえ座 (Musca) ───────────────────────────────────────────────────────
  mus: {
    stars: [
      [42, 42],  // 0 alpha
      [54, 35],  // 1 beta
      [62, 45],  // 2 delta
      [52, 56],  // 3 gamma
      [40, 52],  // 4 epsilon
      [30, 45],  // 5 lambda
    ],
    lines: [
      [5, 0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
    ],
    silhouette: 'M42,25 C35,19 26,23 23,32 C17,28 10,34 11,43 C12,52 21,59 31,57 C27,64 28,74 34,80 C40,85 50,85 55,80 C59,85 65,87 70,83 C76,79 76,71 70,65 C76,61 81,53 80,44 C79,35 70,28 60,32 C57,25 50,22 43,26 Z',
  },

  // ── じょうぎ座 (Norma) ──────────────────────────────────────────────────
  nor: {
    stars: [
      [42, 42],  // 0 gamma2
      [54, 35],  // 1 epsilon
      [62, 45],  // 2 delta
      [52, 58],  // 3 eta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [0, 2],
    ],
    silhouette: 'M42,25 C35,18 26,22 22,32 C16,27 9,34 10,43 C11,52 21,60 31,58 C27,65 27,75 33,81 C39,87 50,87 55,82 C59,87 66,89 72,85 C78,80 78,71 72,65 C79,61 84,52 83,43 C82,33 73,26 63,30 C61,23 54,20 47,25 Z',
  },

  // ── とかげ座 (Lacerta) ────────────────────────────────────────────────────
  lac: {
    stars: [
      [30, 35],  // 0 alpha
      [40, 28],  // 1 beta
      [50, 35],  // 2 4 Lac
      [58, 28],  // 3 5 Lac
      [65, 38],  // 4 6 Lac
      [60, 50],  // 5 lower
      [45, 50],  // 6 middle
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 2],
    ],
    silhouette: 'M22,28 C16,22 18,14 26,12 C32,10 40,14 42,22 C46,16 55,14 62,18 C68,14 75,18 77,26 C79,34 75,43 68,47 C73,52 75,62 70,69 C65,76 55,78 49,72 C47,78 44,84 39,83 C35,80 34,72 38,67 C32,70 24,68 21,62 C18,55 20,45 26,40 Z',
  },

  // ── こじし座 (Leo Minor) ─────────────────────────────────────────────────
  lmi: {
    stars: [
      [38, 45],  // 0 46 LMi (brightest)
      [50, 38],  // 1 beta
      [60, 45],  // 2 21 LMi
      [52, 58],  // 3 10 LMi
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M38,25 C30,18 22,22 20,31 C14,27 8,34 10,43 C12,52 22,58 32,56 C28,63 30,73 36,79 C42,84 52,84 57,79 C61,84 68,86 74,82 C80,77 80,68 74,62 C80,58 84,49 82,40 C80,31 70,25 61,28 C58,22 51,19 44,23 Z',
  },

  // ── ポンプ座 etc. – already handled above ────────────────────────────────

  // ── ちょうこくしつ座 (Sculptor) – already above ──────────────────────────

  // ── とびうお座 – already above (vol) ────────────────────────────────────

  // ── かじき座 – already above (dor) ──────────────────────────────────────

  // ── ピクトル座 (Pictor) ──────────────────────────────────────────────────
  pic: {
    stars: [
      [40, 45],  // 0 alpha
      [52, 38],  // 1 beta (bright)
      [62, 48],  // 2 gamma
      [50, 58],  // 3 delta
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 0],
    ],
    silhouette: 'M40,28 C32,22 24,26 21,35 C15,31 9,38 11,47 C13,56 23,62 33,60 C29,67 30,77 36,83 C42,88 52,88 57,83 C61,88 68,90 74,86 C80,81 80,72 74,66 C80,62 85,53 83,44 C81,35 72,28 62,32 C59,26 52,23 45,27 Z',
  },

  // ── ポンプ座 (Antlia) – already above ───────────────────────────────────
};

/** Get art for a constellation, or generate a simple fallback pattern */
export function getConstellationArt(id: string): ConstellationArt {
  if (CONSTELLATION_ART[id]) return CONSTELLATION_ART[id];
  // Generic fallback: 5 stars in a pentagon pattern
  const cx = 50, cy = 50, r = 30;
  const stars: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    stars.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  const lines: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,0]];
  return { stars, lines };
}
