import { PlanetParams, calculateStats } from '../hooks/usePlanetParams';

export type Transformation = {
  id: string;
  name: string;
  description: string;
  uiTheme: string;
  color: [number, number, number];
  glowColor: [number, number, number];
  trigger: (params: PlanetParams, phase: string, stats: ReturnType<typeof calculateStats>) => boolean;
  failureType?: string;
};

export const transformations: Transformation[] = [
  {
    id: 'green', name: '緑の惑星', description: '標準的な生命居住可能惑星。',
    uiTheme: 'green', color: [0.2, 0.7, 0.2], glowColor: [0.4, 1.0, 0.4],
    trigger: (p, ph, s) => s.habitability > 60
  },
  {
    id: 'dyson', name: '中空惑星', description: 'ダイソンシェルに覆われた高度な人工天体。',
    uiTheme: 'dyson', color: [0.4, 0.4, 0.5], glowColor: [0.8, 0.9, 1.0],
    trigger: (p, ph, s) => s.civLevel > 0.9 && p.temperature >= 50 && p.temperature <= 60 && p.size > 70
  },
  {
    id: 'fractal', name: 'フラクタル結晶惑星', description: '幾何学的な結晶構造が無限に続く美しい世界。',
    uiTheme: 'fractal', color: [0.5, 0.8, 1.0], glowColor: [0.3, 0.6, 1.0],
    trigger: (p, ph, s) => s.gravity < 0.5 && p.temperature < -80
  },
  {
    id: 'mobius', name: 'メビウスの輪惑星', description: '重力が捻じれ、裏表のない特異な形状に変化した。',
    uiTheme: 'mobius', color: [0.6, 0.2, 0.8], glowColor: [1.0, 0.5, 1.0],
    trigger: (p, ph, s) => p.size > 90 && s.civLevel > 0.7
  },
  {
    id: 'slime', name: '流体スライム惑星', description: '高温の海がゼリー状に変質した不定形惑星。',
    uiTheme: 'slime', color: [0.4, 0.9, 0.3], glowColor: [0.2, 1.0, 0.4],
    trigger: (p, ph, s) => p.temperature > 80 && p.waterAmount > 90
  },
  {
    id: 'sandart', name: 'サンドアート惑星', description: '枯渇した大気と砂が織りなす芸術的な世界。',
    uiTheme: 'sandart', color: [0.9, 0.7, 0.4], glowColor: [1.0, 0.85, 0.5],
    trigger: (p, ph, s) => p.waterAmount < 3 && s.atmStability < 10 && p.distance > 80
  },
  {
    id: 'retro', name: 'レトロゲーム惑星', description: '進化が早すぎた結果、世界が低解像度にバグってしまった。',
    uiTheme: 'retro', color: [0.0, 1.0, 0.0], glowColor: [0.0, 1.0, 0.5],
    trigger: (p, ph, s) => p.formationSpeed > 8 && ph === '文明の時代'
  },
  {
    id: 'comic', name: 'アメコミ・ポップアート惑星', description: '哺乳類の生命力が爆発し、色彩がポップになった。',
    uiTheme: 'comic', color: [1.0, 0.9, 0.1], glowColor: [1.0, 0.5, 0.0],
    trigger: (p, ph, s) => p.species === 'Mammal' && s.biomass > 0.8
  },
  {
    id: 'ink', name: '水墨画・和紙惑星', description: '静寂に包まれた和紙のような世界。',
    uiTheme: 'ink', color: [0.1, 0.1, 0.1], glowColor: [0.5, 0.5, 0.5],
    trigger: (p, ph, s) => s.civLevel < 0.1 && s.atmStability > 80 && s.biomass > 0.5
  },
  {
    id: 'ghost', name: 'ゴースト惑星', description: '実体を持たないエネルギー生命体の住処。',
    uiTheme: 'ghost', color: [0.7, 0.7, 1.0], glowColor: [0.5, 0.5, 1.0],
    trigger: (p, ph, s) => s.civLevel > 0.8 && s.atmStability < 30
  },
  {
    id: 'steampunk', name: 'スチームパンク・歯車惑星', description: '蒸気機関で駆動する歯車仕掛けの世界。',
    uiTheme: 'steampunk', color: [0.6, 0.4, 0.2], glowColor: [1.0, 0.7, 0.2],
    trigger: (p, ph, s) => p.nitrogen > 70 && s.atmStability >= 70 && s.atmStability <= 90 && ph === '文明の時代' && s.civLevel < 0.6
  },
  {
    id: 'spore', name: '巨大菌糸類・胞子惑星', description: '惑星全土がひとつの巨大な菌糸ネットワーク。',
    uiTheme: 'spore', color: [0.5, 0.9, 0.2], glowColor: [0.7, 1.0, 0.3],
    trigger: (p, ph, s) => p.waterAmount > 80 && p.temperature >= 20 && p.temperature <= 40 && p.species === 'Plant'
  },
  {
    id: 'cyber', name: 'サイバーグリッド惑星', description: '機械文明によって完全に電脳化された世界。',
    uiTheme: 'cyber', color: [0.0, 0.5, 0.8], glowColor: [0.0, 1.0, 1.0],
    trigger: (p, ph, s) => p.species === 'Machine' && p.co2 > 80 && p.oxygen < 10
  },
  {
    id: 'hive', name: 'インセクト・ハイヴ惑星', description: '昆虫群が作り上げた巨大な巣窟惑星。',
    uiTheme: 'hive', color: [0.7, 0.5, 0.0], glowColor: [1.0, 0.8, 0.0],
    trigger: (p, ph, s) => s.biomass > 0.9 && p.temperature >= 30 && p.temperature <= 50 && p.species === 'Insect'
  },
  {
    id: 'jungle', name: '食虫植物の楽園惑星', description: '文明を飲み込むほどに植物が繁茂した世界。',
    uiTheme: 'jungle', color: [0.1, 0.5, 0.1], glowColor: [0.5, 1.0, 0.2],
    trigger: (p, ph, s) => p.waterAmount >= 70 && p.waterAmount <= 90 && p.temperature >= 40 && p.temperature <= 60 && s.biomass > 0.5 && s.civLevel < 0.3
  },
  {
    id: 'angel', name: 'エンジェル・ヘイロー惑星', description: '精神文明の極致。至高の平和が訪れた。',
    uiTheme: 'angel', color: [1.0, 1.0, 0.9], glowColor: [1.0, 1.0, 1.0],
    trigger: (p, ph, s) => s.civLevel > 0.95 && s.habitability > 90 && s.atmStability > 90
  },
  {
    id: 'cracked', name: '砕けかけのパズル惑星', description: '崩壊寸前のバランスで辛うじて形状を保っている。',
    uiTheme: 'cracked', color: [0.6, 0.4, 0.3], glowColor: [1.0, 0.6, 0.3],
    trigger: (p, ph, s) => p.size >= 80 && p.size <= 88 && s.atmStability < 20
  },
  {
    id: 'whitehole', name: 'ホワイトホール・コア', description: '無限のエネルギーを放つ光の中心。',
    uiTheme: 'whitehole', color: [1.0, 0.95, 0.8], glowColor: [1.0, 1.0, 1.0],
    trigger: (p, ph, s) => ph === '危機の時代' && s.civLevel > 0.8 && p.size > 80
  },
  {
    id: 'ark', name: 'ノアの箱舟惑星', description: '限界を迎えた環境から新天地へ旅立つ準備が整った。',
    uiTheme: 'ark', color: [0.3, 0.5, 0.8], glowColor: [0.5, 0.7, 1.0],
    trigger: (p, ph, s) => ph === '危機の時代' && s.lifeProb > 80 && s.civLevel > 0.9 && s.habitability < 40
  },
  {
    id: 'flower', name: 'ギャラクシー・フラワー惑星', description: '生命と環境が完璧な調和を見せ、宇宙に咲く花となった。',
    uiTheme: 'flower', color: [0.9, 0.3, 0.7], glowColor: [1.0, 0.5, 1.0],
    trigger: (p, ph, s) => ph === '危機の時代' && s.habitability > 85 && s.biomass > 0.9 && s.atmStability > 85
  }
];

export const FAILURE_TRANSFORMATIONS: Transformation[] = [
  {
    id: 'failure_venus', name: '金星化崩壊', description: '温室効果が制御不能になった',
    uiTheme: 'collapse', color: [0.8, 0.6, 0.0], glowColor: [1.0, 0.4, 0.0],
    trigger: () => false, failureType: 'venus'
  },
  {
    id: 'failure_ecosystem', name: '生態系崩壊', description: '文明の暴走が生命を滅ぼした',
    uiTheme: 'collapse', color: [0.5, 0.4, 0.3], glowColor: [0.6, 0.4, 0.2],
    trigger: () => false, failureType: 'ecosystem'
  },
  {
    id: 'failure_nuclear', name: '核戦争崩壊', description: '誰も止めなかった。文明は自らを滅ぼした',
    uiTheme: 'collapse', color: [0.4, 0.4, 0.4], glowColor: [0.5, 0.5, 0.3],
    trigger: () => false, failureType: 'nuclear'
  },
  {
    id: 'failure_freeze', name: '熱的死', description: '熱エネルギーが尽き、全ての活動が永遠に止まった',
    uiTheme: 'collapse', color: [0.9, 0.95, 1.0], glowColor: [0.7, 0.9, 1.0],
    trigger: () => false, failureType: 'freeze'
  },
  {
    id: 'failure_gravity', name: '重力崩壊', description: '自らの重力に潰された',
    uiTheme: 'collapse', color: [0.0, 0.0, 0.0], glowColor: [0.3, 0.0, 0.5],
    trigger: () => false, failureType: 'gravity'
  }
];

export const EMOJI_MAP: Record<string, string> = {
  green: '🌍', dyson: '🔮', fractal: '💎', mobius: '🌀', slime: '🫧', sandart: '🏜️',
  retro: '👾', comic: '💥', ink: '🎨', ghost: '👻', steampunk: '⚙️', spore: '🍄',
  cyber: '🤖', hive: '🐝', jungle: '🌿', angel: '👼', cracked: '💫', whitehole: '☀️',
  ark: '🚀', flower: '🌸',
  failure_venus: '🔥', failure_ecosystem: '☠️', failure_nuclear: '☢️', failure_freeze: '❄️', failure_gravity: '🕳️'
};
