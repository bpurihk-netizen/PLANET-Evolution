// Stamp Rally — trigger mappings and quiz questions for the 88 constellation stamp system

export interface QuizQuestion {
  question: string;
  choices: [string, string, string];
  correctIndex: 0 | 1 | 2;
}

/** Maps body IDs to constellation stamp IDs awarded on first visit */
export const BODY_STAMP_TRIGGERS: Record<string, string[]> = {
  // ── 太陽系 ── (各惑星 → 対応する黄道星座)
  'sun':           ['leo'],   // 太陽 → しし座
  'mercury':       ['gem'],   // 水星 → ふたご座
  'venus':         ['tau'],   // 金星 → おうし座
  'earth':         ['vir'],   // 地球 → おとめ座
  'moon':          ['cnc'],   // 月  → かに座
  'mars':          ['ari'],   // 火星 → おひつじ座
  'jupiter':       ['sgr'],   // 木星 → いて座
  'saturn':        ['cap'],   // 土星 → やぎ座
  'uranus':        ['aqr'],   // 天王星 → みずがめ座
  'neptune':       ['psc'],   // 海王星 → うお座
  'asteroid-belt': ['sco'],   // 小惑星帯 → さそり座
  'pluto':         ['lib'],   // 冥王星 → てんびん座

  // ── TRAPPIST-1 系 ──
  'trappist1-star': ['boo'],
  'trappist1-b':    ['boo'],
  'trappist1-c':    ['boo'],
  'trappist1-d':    ['boo'],
  'trappist1-e':    ['boo'],
  'trappist1-f':    ['boo'],
  'trappist1-g':    ['boo'],
  'trappist1-h':    ['boo'],

  // ── αケンタウリ系 ──
  'centauri-a':       ['cen'],
  'centauri-b':       ['cen'],
  'proxima-centauri': ['cen'],
  'proxima-b':        ['cen'],

  // ── ケプラー442系 ──
  'kepler442-star': ['lyr'],
  'kepler442-b':    ['lyr'],
};

/** Maps system IDs to stamps awarded when first entering the system */
export const SYSTEM_STAMP_TRIGGERS: Record<string, string[]> = {
  'trappist1':     ['boo'],
  'alpha-centauri': ['cen'],
  'kepler442':     ['lyr'],
};

/** All 12 zodiac stamp IDs (awarded when all solar system main planets are visited) */
export const ZODIAC_STAMP_IDS = ['ari','tau','gem','cnc','leo','vir','lib','sco','sgr','cap','aqr','psc'] as const;

/** Solar system main planet body IDs (excluding dwarf planets/moons) */
export const SOLAR_MAIN_PLANET_IDS = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];

// ── Quiz questions per constellation ────────────────────────────────────────
export const CONSTELLATION_QUIZ: Record<string, QuizQuestion[]> = {
  // 黄道星座
  ari: [
    { question: 'おひつじ座の一番明るい星の名前は？', choices: ['ハマル', 'シリウス', 'アークトゥルス'], correctIndex: 0 },
    { question: 'おひつじ座は何月生まれの人の星座？', choices: ['3月21日〜4月19日', '5月21日〜6月20日', '2月19日〜3月20日'], correctIndex: 0 },
  ],
  tau: [
    { question: 'おうし座に含まれる有名な星団は？', choices: ['プレアデス星団（すばる）', 'プレセペ星団', 'ヒアデス星団だけ'], correctIndex: 0 },
    { question: 'おうし座の一番明るい星（赤色巨星）の名前は？', choices: ['アルデバラン', 'ベテルギウス', 'アンタレス'], correctIndex: 0 },
  ],
  gem: [
    { question: 'ふたご座の双子の兄弟の名前は？', choices: ['カストルとポルックス', 'ロムルスとレムス', 'アポロンとアルテミス'], correctIndex: 0 },
    { question: 'ふたご座は冬の何という形の一部？', choices: ['冬の六角形', '冬の大三角', '夏の大三角'], correctIndex: 0 },
  ],
  cnc: [
    { question: 'かに座のプレセペ星団の別名は？', choices: ['蜂の巣星団', 'すばる', 'ヒアデス'], correctIndex: 0 },
    { question: 'かに座でヘラクレスに踏まれた生き物は？', choices: ['蟹', '蛇', '蠍'], correctIndex: 0 },
  ],
  leo: [
    { question: 'しし座の一番明るい星の名前は？', choices: ['レグルス', 'デネボラ', 'アルジェバ'], correctIndex: 0 },
    { question: 'しし座はどの季節に見やすい？', choices: ['春', '夏', '冬'], correctIndex: 0 },
  ],
  vir: [
    { question: 'おとめ座の一番明るい星の名前は？', choices: ['スピカ', 'アークトゥルス', 'レグルス'], correctIndex: 0 },
    { question: '「春の大曲線」の終点はどの星？', choices: ['スピカ', 'アルクトゥルス', 'デネボラ'], correctIndex: 0 },
  ],
  lib: [
    { question: 'てんびん座はかつてどの星座の一部だった？', choices: ['さそり座', 'おとめ座', 'いて座'], correctIndex: 0 },
    { question: 'てんびん座が表すものは？', choices: ['正義の天秤', '料理の秤', '商人の秤'], correctIndex: 0 },
  ],
  sco: [
    { question: 'さそり座の赤超巨星の名前は？', choices: ['アンタレス', 'ベテルギウス', 'アルデバラン'], correctIndex: 0 },
    { question: 'さそり座とオリオン座が同時に見えないのはなぜ？', choices: ['神話で対立するため空の反対側に置かれた', '同じ明るさで重なって見える', '季節が全く違うから'], correctIndex: 0 },
  ],
  sgr: [
    { question: 'いて座の方向には何がある？', choices: ['銀河系の中心', '天の北極', '天の南極'], correctIndex: 0 },
    { question: 'いて座が表す姿は？', choices: ['弓を引くケンタウルス', '鷲', '獅子'], correctIndex: 0 },
  ],
  cap: [
    { question: 'やぎ座が表す不思議な姿は？', choices: ['魚の尻尾を持つ山羊', '角が2本の普通の山羊', '翼を持つ山羊'], correctIndex: 0 },
    { question: 'やぎ座の神話で山羊に変身したのは誰？', choices: ['パーン', 'ゼウス', 'ヘルメス'], correctIndex: 0 },
  ],
  aqr: [
    { question: 'みずがめ座が表すものは？', choices: ['壺から水を注ぐ若者', '泳ぐ魚', '波に揺れる船'], correctIndex: 0 },
    { question: 'TRAPPIST-1系がある星座は？', choices: ['みずがめ座（うしかい座）', 'こと座', 'ケンタウルス座'], correctIndex: 0 },
  ],
  psc: [
    { question: 'うお座に現在ある春分点は、2000年前どこにあった？', choices: ['おひつじ座', 'おうし座', 'ふたご座'], correctIndex: 0 },
    { question: 'うお座の2匹の魚は何でつながれている？', choices: ['リボン', '鎖', 'ひも'], correctIndex: 0 },
  ],

  // 探索星座
  boo: [
    { question: 'うしかい座の一番明るい星（北天最輝星）は？', choices: ['アークトゥルス', 'シリウス', 'カノープス'], correctIndex: 0 },
    { question: 'TRAPPIST-1系がある方向の星座は？', choices: ['うしかい座', 'こと座', 'ケンタウルス座'], correctIndex: 0 },
    { question: 'TRAPPIST-1系には地球サイズの惑星がいくつある？', choices: ['7つ', '3つ', '4つ'], correctIndex: 0 },
  ],
  cen: [
    { question: 'αケンタウリ系は地球から何光年？', choices: ['約4.37光年', '約39光年', '約1200光年'], correctIndex: 0 },
    { question: 'αケンタウリ系で太陽系に最も近い恒星は？', choices: ['プロキシマ・ケンタウリ', 'ケンタウリA', 'ケンタウリB'], correctIndex: 0 },
    { question: 'ケンタウルス座の一番明るい星の通称は？', choices: ['リギル・ケンタウルス', 'アルタイル', 'ベガ'], correctIndex: 0 },
  ],
  lyr: [
    { question: 'こと座の一番明るい星の名前は？', choices: ['ベガ（織女星）', 'アルタイル（牽牛星）', 'デネブ'], correctIndex: 0 },
    { question: 'ケプラー442系はどの星座の方向？', choices: ['こと座', 'うしかい座', 'ケンタウルス座'], correctIndex: 0 },
    { question: 'ケプラー442bの地球類似指数（ESI）は？', choices: ['0.84', '0.50', '0.99'], correctIndex: 0 },
  ],
};

/** Pick a random quiz question for a given constellation */
export function pickQuiz(constellationId: string): QuizQuestion | null {
  const qs = CONSTELLATION_QUIZ[constellationId];
  if (!qs || qs.length === 0) return null;
  return qs[Math.floor(Math.random() * qs.length)];
}
