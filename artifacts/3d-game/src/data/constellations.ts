// 88 IAU Constellations — educational content in Japanese
// raDeg = Right Ascension in degrees (0-360), decDeg = Declination in degrees (-90 to +90)

export interface Constellation {
  id: string;           // 3-letter IAU abbreviation (lowercase)
  abbr: string;         // 3-letter IAU abbreviation (uppercase)
  nameJa: string;       // Japanese name
  nameEn: string;       // Latin name
  raDeg: number;        // Center RA in degrees
  decDeg: number;       // Center Dec in degrees
  areaRank: number;     // 1 = largest, 88 = smallest
  areaSqDeg: number;    // Area in square degrees
  brightestStarJa: string; // Brightest star Japanese name
  brightestStarEn: string; // Brightest star English name
  mythologyJa: string;  // Japanese mythology summary
  linkedSystemId?: string; // Links to an app star system
}

/** Convert RA/Dec to 3D point on a unit sphere */
export function radec2xyz(raDeg: number, decDeg: number, radius = 1): [number, number, number] {
  const phi   = (raDeg * Math.PI) / 180;
  const theta = ((90 - decDeg) * Math.PI) / 180;
  return [
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.cos(theta),
    radius * Math.sin(theta) * Math.sin(phi),
  ];
}

export const CONSTELLATIONS: Constellation[] = [
  // ── アンドロメダ ─────────────────────────────────────────
  { id:'and', abbr:'AND', nameJa:'アンドロメダ座', nameEn:'Andromeda',
    raDeg:12.5,  decDeg:37,   areaRank:19, areaSqDeg:722,
    brightestStarJa:'アルフェラッツ', brightestStarEn:'Alpheratz',
    mythologyJa:'エチオピア王女アンドロメダが鎖に繋がれ、英雄ペルセウスに救出された神話。天球に200万光年先の銀河を抱く。' },

  // ── ポンプ座 ──────────────────────────────────────────────
  { id:'ant', abbr:'ANT', nameJa:'ポンプ座', nameEn:'Antlia',
    raDeg:154.5, decDeg:-32,  areaRank:62, areaSqDeg:239,
    brightestStarJa:'アルファ・アンティリアエ', brightestStarEn:'α Antliae',
    mythologyJa:'18世紀フランスの天文学者ラカイユが考案した近代星座。空気ポンプを表す。' },

  // ── 風鳥座 ───────────────────────────────────────────────
  { id:'aps', abbr:'APS', nameJa:'ふうちょう座', nameEn:'Apus',
    raDeg:242.5, decDeg:-75,  areaRank:67, areaSqDeg:206,
    brightestStarJa:'アルファ・アピス', brightestStarEn:'α Apodis',
    mythologyJa:'大航海時代にオランダの航海士が考案した南天の星座。極楽鳥（ふうちょう）を表す。' },

  // ── みずがめ座 ───────────────────────────────────────────
  { id:'aqr', abbr:'AQR', nameJa:'みずがめ座', nameEn:'Aquarius',
    raDeg:335,   decDeg:-11,  areaRank:10, areaSqDeg:980,
    brightestStarJa:'サダルスード', brightestStarEn:'Sadalsuud',
    mythologyJa:'壺から水を注ぐ若者の姿。バビロニア時代から知られる古い星座で、洪水と豊穣の神話を持つ。',
    linkedSystemId: 'trappist1' },

  // ── わし座 ───────────────────────────────────────────────
  { id:'aql', abbr:'AQL', nameJa:'わし座', nameEn:'Aquila',
    raDeg:295,   decDeg:3,    areaRank:22, areaSqDeg:652,
    brightestStarJa:'アルタイル', brightestStarEn:'Altair',
    mythologyJa:'ゼウスの使いである大鷲。七夕の牽牛星（アルタイル）として日本でも親しまれる。' },

  // ── 祭壇座 ───────────────────────────────────────────────
  { id:'ara', abbr:'ARA', nameJa:'さいだん座', nameEn:'Ara',
    raDeg:260.9, decDeg:-57,  areaRank:63, areaSqDeg:237,
    brightestStarJa:'ベータ・アラエ', brightestStarEn:'β Arae',
    mythologyJa:'神々がゼウスに誓いを立てた祭壇。ケンタウルス座の近くに位置する南天の星座。' },

  // ── おひつじ座 ───────────────────────────────────────────
  { id:'ari', abbr:'ARI', nameJa:'おひつじ座', nameEn:'Aries',
    raDeg:39.5,  decDeg:21,   areaRank:39, areaSqDeg:441,
    brightestStarJa:'ハマル', brightestStarEn:'Hamal',
    mythologyJa:'黄金の毛皮を持つ神聖な羊。古代ギリシャ・バビロニアで春分点（牡羊宮）を示す。' },

  // ── ぎょしゃ座 ───────────────────────────────────────────
  { id:'aur', abbr:'AUR', nameJa:'ぎょしゃ座', nameEn:'Auriga',
    raDeg:90,    decDeg:42,   areaRank:21, areaSqDeg:657,
    brightestStarJa:'カペラ', brightestStarEn:'Capella',
    mythologyJa:'馬を操る御者の姿。輝星カペラは太陽の3倍の大きさを持つ連星。' },

  // ── うしかい座 ───────────────────────────────────────────
  { id:'boo', abbr:'BOO', nameJa:'うしかい座', nameEn:'Boötes',
    raDeg:220.8, decDeg:31,   areaRank:13, areaSqDeg:907,
    brightestStarJa:'アークトゥルス', brightestStarEn:'Arcturus',
    mythologyJa:'牛飼い（または熊を追う猟師）の姿。アークトゥルスは北天で最も明るい星。',
    linkedSystemId: 'trappist1' },

  // ── ちょうこくぐ座 ──────────────────────────────────────
  { id:'cae', abbr:'CAE', nameJa:'ちょうこくぐ座', nameEn:'Caelum',
    raDeg:70.5,  decDeg:-38,  areaRank:81, areaSqDeg:125,
    brightestStarJa:'アルファ・カエリ', brightestStarEn:'α Caeli',
    mythologyJa:'18世紀ラカイユが考案した彫刻道具（ノミ）を表す近代星座。' },

  // ── きりん座 ─────────────────────────────────────────────
  { id:'cam', abbr:'CAM', nameJa:'きりん座', nameEn:'Camelopardalis',
    raDeg:132.75,decDeg:70,   areaRank:18, areaSqDeg:757,
    brightestStarJa:'ベータ・カメロパルダリス', brightestStarEn:'β Camelopardalis',
    mythologyJa:'17世紀に考案された北天の近代星座。キリンを表すが明るい星が少ない。' },

  // ── かに座 ───────────────────────────────────────────────
  { id:'cnc', abbr:'CNC', nameJa:'かに座', nameEn:'Cancer',
    raDeg:129.75,decDeg:20,   areaRank:31, areaSqDeg:506,
    brightestStarJa:'アルタルフ', brightestStarEn:'Altarf',
    mythologyJa:'ヘルクレスに踏み潰された蟹。プレセペ散開星団（蜂の巣星団）で有名。' },

  // ── りょうけん座 ─────────────────────────────────────────
  { id:'cvn', abbr:'CVN', nameJa:'りょうけん座', nameEn:'Canes Venatici',
    raDeg:196.5, decDeg:40,   areaRank:38, areaSqDeg:465,
    brightestStarJa:'コル・カロリ', brightestStarEn:'Cor Caroli',
    mythologyJa:'うしかい座が引き連れる2匹の猟犬の姿。17世紀ポーランドの天文学者ヘヴェリウスが考案。' },

  // ── おおいぬ座 ───────────────────────────────────────────
  { id:'cma', abbr:'CMA', nameJa:'おおいぬ座', nameEn:'Canis Major',
    raDeg:102.5, decDeg:-22,  areaRank:43, areaSqDeg:380,
    brightestStarJa:'シリウス', brightestStarEn:'Sirius',
    mythologyJa:'オリオンの大型猟犬。シリウスは全天で最も明るい恒星（-1.5等星）。' },

  // ── こいぬ座 ─────────────────────────────────────────────
  { id:'cmi', abbr:'CMI', nameJa:'こいぬ座', nameEn:'Canis Minor',
    raDeg:114.75,decDeg:5,    areaRank:71, areaSqDeg:183,
    brightestStarJa:'プロキオン', brightestStarEn:'Procyon',
    mythologyJa:'オリオンの小型猟犬。プロキオンは冬の大三角の一角をなす。' },

  // ── やぎ座 ───────────────────────────────────────────────
  { id:'cap', abbr:'CAP', nameJa:'やぎ座', nameEn:'Capricornus',
    raDeg:315.5, decDeg:-20,  areaRank:40, areaSqDeg:414,
    brightestStarJa:'ダニア', brightestStarEn:'Deneb Algedi',
    mythologyJa:'パーンが恐怖から魚の尻尾を持つ山羊に変身した神話。バビロニアでも「魚山羊」として知られる。' },

  // ── りゅうこつ座 ─────────────────────────────────────────
  { id:'car', abbr:'CAR', nameJa:'りゅうこつ座', nameEn:'Carina',
    raDeg:130.5, decDeg:-63,  areaRank:34, areaSqDeg:494,
    brightestStarJa:'カノープス', brightestStarEn:'Canopus',
    mythologyJa:'アルゴ船の船底部分。カノープスは全天第2位の明るさを持つ星。' },

  // ── カシオペヤ座 ─────────────────────────────────────────
  { id:'cas', abbr:'CAS', nameJa:'カシオペヤ座', nameEn:'Cassiopeia',
    raDeg:19.75, decDeg:62,   areaRank:25, areaSqDeg:598,
    brightestStarJa:'シェダル', brightestStarEn:'Schedar',
    mythologyJa:'エチオピアの女王カシオペヤ。W字形が特徴的で北極星を挟んで北斗七星の対面にある。' },

  // ── ケンタウルス座 ───────────────────────────────────────
  { id:'cen', abbr:'CEN', nameJa:'ケンタウルス座', nameEn:'Centaurus',
    raDeg:196,   decDeg:-47,  areaRank:9,  areaSqDeg:1060,
    brightestStarJa:'リギル・ケンタウルス', brightestStarEn:'Rigil Kentaurus',
    mythologyJa:'賢者ケイロンの姿。リギル・ケンタウルス（αケンタウリ）は太陽系に最も近い恒星系。',
    linkedSystemId: 'alpha-centauri' },

  // ── ケフェウス座 ─────────────────────────────────────────
  { id:'cep', abbr:'CEP', nameJa:'ケフェウス座', nameEn:'Cepheus',
    raDeg:38,    decDeg:71,   areaRank:27, areaSqDeg:588,
    brightestStarJa:'アルデラミン', brightestStarEn:'Alderamin',
    mythologyJa:'エチオピア王ケフェウス。デルタ星は変光星の基準となった「ケフェイド変光星」の原型。' },

  // ── くじら座 ─────────────────────────────────────────────
  { id:'cet', abbr:'CET', nameJa:'くじら座', nameEn:'Cetus',
    raDeg:26,    decDeg:-11,  areaRank:4,  areaSqDeg:1231,
    brightestStarJa:'ディフダ', brightestStarEn:'Diphda',
    mythologyJa:'アンドロメダを狙う海の怪物。ミラ（オミクロン星）は長周期変光星の代表的存在。' },

  // ── カメレオン座 ─────────────────────────────────────────
  { id:'cha', abbr:'CHA', nameJa:'カメレオン座', nameEn:'Chamaeleon',
    raDeg:160.5, decDeg:-80,  areaRank:79, areaSqDeg:132,
    brightestStarJa:'アルファ・カメレオンティス', brightestStarEn:'α Chamaeleontis',
    mythologyJa:'大航海時代に考案された南天の近代星座。カメレオンを表す。' },

  // ── コンパス座 ───────────────────────────────────────────
  { id:'cir', abbr:'CIR', nameJa:'コンパス座', nameEn:'Circinus',
    raDeg:218.5, decDeg:-63,  areaRank:85, areaSqDeg:93,
    brightestStarJa:'アルファ・サーカニ', brightestStarEn:'α Circini',
    mythologyJa:'ラカイユが考案した製図用コンパスを表す星座。南天の小さな近代星座。' },

  // ── はと座 ───────────────────────────────────────────────
  { id:'col', abbr:'COL', nameJa:'はと座', nameEn:'Columba',
    raDeg:87.75, decDeg:-35,  areaRank:54, areaSqDeg:270,
    brightestStarJa:'ファクト', brightestStarEn:'Phact',
    mythologyJa:'ノアの箱舟から放たれたオリーブの葉を持つ鳩、またはアルゴ船の偵察鳥。' },

  // ── かみのけ座 ───────────────────────────────────────────
  { id:'com', abbr:'COM', nameJa:'かみのけ座', nameEn:'Coma Berenices',
    raDeg:191.75,decDeg:23,   areaRank:42, areaSqDeg:386,
    brightestStarJa:'ベータ・コマエ', brightestStarEn:'β Comae Berenices',
    mythologyJa:'エジプト女王ベレニケの髪。銀河団「かみのけ座銀河団」が多数存在する方向。' },

  // ── みなみのかんむり座 ───────────────────────────────────
  { id:'cra', abbr:'CRA', nameJa:'みなみのかんむり座', nameEn:'Corona Australis',
    raDeg:279.5, decDeg:-41,  areaRank:80, areaSqDeg:128,
    brightestStarJa:'アルフェッカ・メリディアナ', brightestStarEn:'Alfecca Meridiana',
    mythologyJa:'射手座の足元に落ちた冠。古代ギリシャから知られる小さな南天の星座。' },

  // ── かんむり座 ───────────────────────────────────────────
  { id:'crb', abbr:'CRB', nameJa:'かんむり座', nameEn:'Corona Borealis',
    raDeg:237.5, decDeg:33,   areaRank:73, areaSqDeg:179,
    brightestStarJa:'アルフェッカ', brightestStarEn:'Alphecca',
    mythologyJa:'英雄テセウスと恋に落ちたアリアドネが王冠を天に投げ上げた神話から。' },

  // ── からす座 ─────────────────────────────────────────────
  { id:'crv', abbr:'CRV', nameJa:'からす座', nameEn:'Corvus',
    raDeg:186.5, decDeg:-18,  areaRank:70, areaSqDeg:184,
    brightestStarJa:'ガイエナ', brightestStarEn:'Gienah',
    mythologyJa:'アポロンの使いだったカラス。怠けた罰として空腹のまま座らされた神話を持つ。' },

  // ── コップ座 ─────────────────────────────────────────────
  { id:'crt', abbr:'CRT', nameJa:'コップ座', nameEn:'Crater',
    raDeg:170.75,decDeg:-16,  areaRank:53, areaSqDeg:282,
    brightestStarJa:'アラフ', brightestStarEn:'Alkes',
    mythologyJa:'アポロンがカラスに水汲みを命じた際のコップ（混酒器）を表す古代星座。' },

  // ── みなみじゅうじ座 ─────────────────────────────────────
  { id:'cru', abbr:'CRU', nameJa:'みなみじゅうじ座', nameEn:'Crux',
    raDeg:186.75,decDeg:-60,  areaRank:88, areaSqDeg:68,
    brightestStarJa:'アクルックス', brightestStarEn:'Acrux',
    mythologyJa:'全天で最も小さい星座。南十字星として南半球の道しるべ。オーストラリア・ニュージーランドの国旗にも描かれる。' },

  // ── はくちょう座 ─────────────────────────────────────────
  { id:'cyg', abbr:'CYG', nameJa:'はくちょう座', nameEn:'Cygnus',
    raDeg:309.25,decDeg:44,   areaRank:16, areaSqDeg:804,
    brightestStarJa:'デネブ', brightestStarEn:'Deneb',
    mythologyJa:'白鳥に変身したゼウス、または琴を奏でる楽士オルフェウスの姿。夏の大三角の一角。' },

  // ── いるか座 ─────────────────────────────────────────────
  { id:'del', abbr:'DEL', nameJa:'いるか座', nameEn:'Delphinus',
    raDeg:310.5, decDeg:12,   areaRank:69, areaSqDeg:189,
    brightestStarJa:'ロタネフ', brightestStarEn:'Rotanev',
    mythologyJa:'ポセイドンの使いとして海の女神アンフィトリテを説得したイルカ。小さいが特徴的な形。' },

  // ── かじき座 ─────────────────────────────────────────────
  { id:'dor', abbr:'DOR', nameJa:'かじき座', nameEn:'Dorado',
    raDeg:85.5,  decDeg:-60,  areaRank:72, areaSqDeg:179,
    brightestStarJa:'アルファ・ドラデュース', brightestStarEn:'α Doradus',
    mythologyJa:'大航海時代に考案された南天の近代星座。大マゼラン雲を抱く方向にある。' },

  // ── りゅう座 ─────────────────────────────────────────────
  { id:'dra', abbr:'DRA', nameJa:'りゅう座', nameEn:'Draco',
    raDeg:226.5, decDeg:67,   areaRank:8,  areaSqDeg:1083,
    brightestStarJa:'エルタニン', brightestStarEn:'Eltanin',
    mythologyJa:'ヘルクレスに倒された100頭の龍ラドン。北極を囲むように大きく蛇行する星座。' },

  // ── こうま座 ─────────────────────────────────────────────
  { id:'equ', abbr:'EQU', nameJa:'こうま座', nameEn:'Equuleus',
    raDeg:317.5, decDeg:8,    areaRank:87, areaSqDeg:72,
    brightestStarJa:'キタルファ', brightestStarEn:'Kitalpha',
    mythologyJa:'ヘルメスが弟カストルに贈った小馬。全天で2番目に小さい星座。' },

  // ── エリダヌス座 ─────────────────────────────────────────
  { id:'eri', abbr:'ERI', nameJa:'エリダヌス座', nameEn:'Eridanus',
    raDeg:48.75, decDeg:-29,  areaRank:6,  areaSqDeg:1138,
    brightestStarJa:'アケルナル', brightestStarEn:'Achernar',
    mythologyJa:'ギリシャ神話の大河。パエトンが太陽の馬車を操れず墜落した川。全天で6番目の大星座。' },

  // ── ろ座 ─────────────────────────────────────────────────
  { id:'for', abbr:'FOR', nameJa:'ろ座', nameEn:'Fornax',
    raDeg:41.75, decDeg:-31,  areaRank:41, areaSqDeg:398,
    brightestStarJa:'アルファ・フォルナキス', brightestStarEn:'α Fornacis',
    mythologyJa:'化学実験室の炉を表すラカイユ考案の近代星座。' },

  // ── ふたご座 ─────────────────────────────────────────────
  { id:'gem', abbr:'GEM', nameJa:'ふたご座', nameEn:'Gemini',
    raDeg:106,   decDeg:23,   areaRank:30, areaSqDeg:514,
    brightestStarJa:'ポルックス', brightestStarEn:'Pollux',
    mythologyJa:'双子の兄弟カストルとポルックス。冬の六角形の一角を成し、見つけやすい星座。' },

  // ── つる座 ───────────────────────────────────────────────
  { id:'gru', abbr:'GRU', nameJa:'つる座', nameEn:'Grus',
    raDeg:337,   decDeg:-47,  areaRank:45, areaSqDeg:366,
    brightestStarJa:'アルナイル', brightestStarEn:'Alnair',
    mythologyJa:'大航海時代に考案された鶴を表す南天の近代星座。' },

  // ── ヘルクレス座 ─────────────────────────────────────────
  { id:'her', abbr:'HER', nameJa:'ヘルクレス座', nameEn:'Hercules',
    raDeg:260.75,decDeg:28,   areaRank:5,  areaSqDeg:1225,
    brightestStarJa:'コルネフォロス', brightestStarEn:'Kornephoros',
    mythologyJa:'12の難業を達成した英雄ヘラクレスの姿。M13球状星団を含む全天5番目の大星座。' },

  // ── とけい座 ─────────────────────────────────────────────
  { id:'hor', abbr:'HOR', nameJa:'とけい座', nameEn:'Horologium',
    raDeg:49.25, decDeg:-53,  areaRank:58, areaSqDeg:249,
    brightestStarJa:'アルファ・ホロロギ', brightestStarEn:'α Horologii',
    mythologyJa:'振り子時計を表すラカイユ考案の近代星座。' },

  // ── うみへび座 ───────────────────────────────────────────
  { id:'hya', abbr:'HYA', nameJa:'うみへび座', nameEn:'Hydra',
    raDeg:157,   decDeg:-20,  areaRank:1,  areaSqDeg:1303,
    brightestStarJa:'アルファルド', brightestStarEn:'Alphard',
    mythologyJa:'9つの頭を持つ怪物ヒュドラ。ヘラクレスに退治された。全天最大の星座。' },

  // ── みずへび座 ───────────────────────────────────────────
  { id:'hyi', abbr:'HYI', nameJa:'みずへび座', nameEn:'Hydrus',
    raDeg:41,    decDeg:-70,  areaRank:61, areaSqDeg:243,
    brightestStarJa:'ベータ・ヒドリ', brightestStarEn:'β Hydri',
    mythologyJa:'大航海時代に考案された南天の小型の水蛇を表す近代星座。' },

  // ── インディアン座 ───────────────────────────────────────
  { id:'ind', abbr:'IND', nameJa:'インディアン座', nameEn:'Indus',
    raDeg:329.5, decDeg:-60,  areaRank:49, areaSqDeg:294,
    brightestStarJa:'アルファ・インディ', brightestStarEn:'α Indi',
    mythologyJa:'大航海時代に考案された南天の近代星座。アメリカやアジアの先住民族を表すとされる。' },

  // ── とかげ座 ─────────────────────────────────────────────
  { id:'lac', abbr:'LAC', nameJa:'とかげ座', nameEn:'Lacerta',
    raDeg:337,   decDeg:47,   areaRank:68, areaSqDeg:201,
    brightestStarJa:'アルファ・ラセルテ', brightestStarEn:'α Lacertae',
    mythologyJa:'17世紀ヘヴェリウスが考案した小さなトカゲを表す北天の星座。' },

  // ── しし座 ───────────────────────────────────────────────
  { id:'leo', abbr:'LEO', nameJa:'しし座', nameEn:'Leo',
    raDeg:160,   decDeg:15,   areaRank:12, areaSqDeg:947,
    brightestStarJa:'レグルス', brightestStarEn:'Regulus',
    mythologyJa:'ヘラクレスが最初の難業で退治したネメアの獅子。春の夜空に輝く。' },

  // ── こじし座 ─────────────────────────────────────────────
  { id:'lmi', abbr:'LMI', nameJa:'こじし座', nameEn:'Leo Minor',
    raDeg:153.5, decDeg:32,   areaRank:64, areaSqDeg:232,
    brightestStarJa:'46レオニス・ミノリス', brightestStarEn:'46 Leonis Minoris',
    mythologyJa:'ヘヴェリウスが考案した小さな獅子を表す北天の近代星座。' },

  // ── うさぎ座 ─────────────────────────────────────────────
  { id:'lep', abbr:'LEP', nameJa:'うさぎ座', nameEn:'Lepus',
    raDeg:83.75, decDeg:-20,  areaRank:51, areaSqDeg:290,
    brightestStarJa:'アルネブ', brightestStarEn:'Arneb',
    mythologyJa:'オリオンが追う野ウサギ。古代から知られる南天の星座。' },

  // ── てんびん座 ───────────────────────────────────────────
  { id:'lib', abbr:'LIB', nameJa:'てんびん座', nameEn:'Libra',
    raDeg:227.75,decDeg:-16,  areaRank:29, areaSqDeg:538,
    brightestStarJa:'ズベン・エル・シャマリ', brightestStarEn:'Zubeneschamali',
    mythologyJa:'正義の女神アストライアの天秤。かつてはさそり座の爪とされていた。' },

  // ── おおかみ座 ───────────────────────────────────────────
  { id:'lup', abbr:'LUP', nameJa:'おおかみ座', nameEn:'Lupus',
    raDeg:227.5, decDeg:-43,  areaRank:46, areaSqDeg:334,
    brightestStarJa:'メン', brightestStarEn:'Men',
    mythologyJa:'ケンタウルスが神々への生贄として捧げる狼の姿。古代から知られる南天の星座。' },

  // ── やまねこ座 ───────────────────────────────────────────
  { id:'lyn', abbr:'LYN', nameJa:'やまねこ座', nameEn:'Lynx',
    raDeg:120,   decDeg:47,   areaRank:28, areaSqDeg:545,
    brightestStarJa:'アルファ・リンキス', brightestStarEn:'α Lyncis',
    mythologyJa:'ヘヴェリウスが考案。「見つけるのに山猫のような目が必要」ほど暗い星しかない。' },

  // ── こと座 ───────────────────────────────────────────────
  { id:'lyr', abbr:'LYR', nameJa:'こと座', nameEn:'Lyra',
    raDeg:283,   decDeg:36,   areaRank:52, areaSqDeg:286,
    brightestStarJa:'ベガ', brightestStarEn:'Vega',
    mythologyJa:'オルフェウスが奏でた竪琴。ベガ（織女星）は七夕の星。ケプラー442の方向に位置する。',
    linkedSystemId: 'kepler442' },

  // ── テーブルさん座 ──────────────────────────────────────
  { id:'men', abbr:'MEN', nameJa:'テーブルさん座', nameEn:'Mensa',
    raDeg:82.5,  decDeg:-77,  areaRank:75, areaSqDeg:153,
    brightestStarJa:'アルファ・メンサエ', brightestStarEn:'α Mensae',
    mythologyJa:'南アフリカのテーブル山にちなんだ近代星座。大マゼラン雲の一部が掛かる。' },

  // ── けんびきょう座 ──────────────────────────────────────
  { id:'mic', abbr:'MIC', nameJa:'けんびきょう座', nameEn:'Microscopium',
    raDeg:314.5, decDeg:-37,  areaRank:66, areaSqDeg:210,
    brightestStarJa:'ガンマ・ミクロスコピ', brightestStarEn:'γ Microscopii',
    mythologyJa:'ラカイユが考案した顕微鏡を表す南天の近代星座。' },

  // ── いっかくじゅう座 ────────────────────────────────────
  { id:'mon', abbr:'MON', nameJa:'いっかくじゅう座', nameEn:'Monoceros',
    raDeg:107,   decDeg:-3,   areaRank:35, areaSqDeg:482,
    brightestStarJa:'ベータ・モノケロティス', brightestStarEn:'β Monocerotis',
    mythologyJa:'17世紀に考案された一角獣（ユニコーン）を表す星座。バラ星雲など美しい天体が多い。' },

  // ── はえ座 ───────────────────────────────────────────────
  { id:'mus', abbr:'MUS', nameJa:'はえ座', nameEn:'Musca',
    raDeg:188.75,decDeg:-70,  areaRank:77, areaSqDeg:138,
    brightestStarJa:'アルファ・ムスカエ', brightestStarEn:'α Muscae',
    mythologyJa:'大航海時代に考案された南天の近代星座。ハエを表すが現在もその名を保つ。' },

  // ── じょうぎ座 ───────────────────────────────────────────
  { id:'nor', abbr:'NOR', nameJa:'じょうぎ座', nameEn:'Norma',
    raDeg:241.75,decDeg:-51,  areaRank:74, areaSqDeg:165,
    brightestStarJa:'ガンマ2・ノルマエ', brightestStarEn:'γ² Normae',
    mythologyJa:'ラカイユが考案した直角定規を表す南天の近代星座。' },

  // ── はちぶんぎ座 ─────────────────────────────────────────
  { id:'oct', abbr:'OCT', nameJa:'はちぶんぎ座', nameEn:'Octans',
    raDeg:341.5, decDeg:-85,  areaRank:50, areaSqDeg:291,
    brightestStarJa:'ニュー・オクタンティス', brightestStarEn:'ν Octantis',
    mythologyJa:'南天の星座儀（八分儀）を表す近代星座。南天極を含む方向にある。' },

  // ── へびつかい座 ─────────────────────────────────────────
  { id:'oph', abbr:'OPH', nameJa:'へびつかい座', nameEn:'Ophiuchus',
    raDeg:260.75,decDeg:-8,   areaRank:11, areaSqDeg:948,
    brightestStarJa:'ラス・アルハゲ', brightestStarEn:'Rasalhague',
    mythologyJa:'医神アスクレピオスが蛇を操る姿。黄道上に位置するが12宮には含まれない「13番目の星座」。' },

  // ── オリオン座 ───────────────────────────────────────────
  { id:'ori', abbr:'ORI', nameJa:'オリオン座', nameEn:'Orion',
    raDeg:83.5,  decDeg:5,    areaRank:26, areaSqDeg:594,
    brightestStarJa:'リゲル', brightestStarEn:'Rigel',
    mythologyJa:'狩人オリオン。三つ星が特徴的で、冬の大三角・冬のダイヤモンドを形成する全天随一の星座。' },

  // ── くじゃく座 ───────────────────────────────────────────
  { id:'pav', abbr:'PAV', nameJa:'くじゃく座', nameEn:'Pavo',
    raDeg:294.5, decDeg:-66,  areaRank:44, areaSqDeg:378,
    brightestStarJa:'ピーコック', brightestStarEn:'Peacock',
    mythologyJa:'大航海時代に考案された孔雀を表す南天の近代星座。' },

  // ── ペガスス座 ───────────────────────────────────────────
  { id:'peg', abbr:'PEG', nameJa:'ペガスス座', nameEn:'Pegasus',
    raDeg:340.25,decDeg:19,   areaRank:7,  areaSqDeg:1121,
    brightestStarJa:'エニフ', brightestStarEn:'Enif',
    mythologyJa:'英雄ペルセウスを助けた翼ある白馬。四辺形「ペガススの大四辺形」が目印。' },

  // ── ペルセウス座 ─────────────────────────────────────────
  { id:'per', abbr:'PER', nameJa:'ペルセウス座', nameEn:'Perseus',
    raDeg:51.25, decDeg:45,   areaRank:24, areaSqDeg:615,
    brightestStarJa:'ミルファク', brightestStarEn:'Mirfak',
    mythologyJa:'アンドロメダを救った英雄。アルゴル（変光星）はメドゥーサの生首を持つ姿を表す。' },

  // ── ほうおう座 ───────────────────────────────────────────
  { id:'phe', abbr:'PHE', nameJa:'ほうおう座', nameEn:'Phoenix',
    raDeg:14,    decDeg:-48,  areaRank:37, areaSqDeg:469,
    brightestStarJa:'アンカア', brightestStarEn:'Ankaa',
    mythologyJa:'炎の中から再生する不死鳥（フェニックス）を表す近代星座。' },

  // ── がか座 ───────────────────────────────────────────────
  { id:'pic', abbr:'PIC', nameJa:'がか座', nameEn:'Pictor',
    raDeg:85.5,  decDeg:-53,  areaRank:59, areaSqDeg:247,
    brightestStarJa:'アルファ・ピクトリス', brightestStarEn:'α Pictoris',
    mythologyJa:'ラカイユが考案した画家のイーゼルを表す南天の近代星座。' },

  // ── うお座 ───────────────────────────────────────────────
  { id:'psc', abbr:'PSC', nameJa:'うお座', nameEn:'Pisces',
    raDeg:7.25,  decDeg:13,   areaRank:14, areaSqDeg:889,
    brightestStarJa:'エタ・ピスキウム', brightestStarEn:'η Piscium',
    mythologyJa:'2匹の魚がリボンで繋がれた姿。現在の春分点はここにある。現代の「春分点のしし座入り」はここから。' },

  // ── みなみのうお座 ───────────────────────────────────────
  { id:'psa', abbr:'PSA', nameJa:'みなみのうお座', nameEn:'Piscis Austrinus',
    raDeg:334.25,decDeg:-32,  areaRank:60, areaSqDeg:245,
    brightestStarJa:'フォーマルハウト', brightestStarEn:'Fomalhaut',
    mythologyJa:'みずがめ座の水を飲む南の魚。フォーマルハウトは惑星系が確認されている有名な星。' },

  // ── とも座 ───────────────────────────────────────────────
  { id:'pup', abbr:'PUP', nameJa:'とも座', nameEn:'Puppis',
    raDeg:109.5, decDeg:-31,  areaRank:20, areaSqDeg:673,
    brightestStarJa:'ナオス', brightestStarEn:'Naos',
    mythologyJa:'アルゴ船の船尾部分。かつてはりゅうこつ・帆と合わせた大きなアルゴ座を構成していた。' },

  // ── らしんばん座 ─────────────────────────────────────────
  { id:'pyx', abbr:'PYX', nameJa:'らしんばん座', nameEn:'Pyxis',
    raDeg:134.5, decDeg:-27,  areaRank:65, areaSqDeg:221,
    brightestStarJa:'アルファ・ピキシディス', brightestStarEn:'α Pyxidis',
    mythologyJa:'ラカイユが考案した羅針盤（コンパス）を表す南天の近代星座。' },

  // ── レチクル座 ───────────────────────────────────────────
  { id:'ret', abbr:'RET', nameJa:'レチクル座', nameEn:'Reticulum',
    raDeg:58.75, decDeg:-60,  areaRank:82, areaSqDeg:114,
    brightestStarJa:'アルファ・レティクリ', brightestStarEn:'α Reticuli',
    mythologyJa:'ラカイユが望遠鏡の接眼部に使う網目板（レティクル）を表して考案した南天の星座。' },

  // ── や座 ─────────────────────────────────────────────────
  { id:'sge', abbr:'SGE', nameJa:'や座', nameEn:'Sagitta',
    raDeg:294.75,decDeg:18,   areaRank:86, areaSqDeg:80,
    brightestStarJa:'ガンマ・サジッタエ', brightestStarEn:'γ Sagittae',
    mythologyJa:'ヘラクレスが鷲に打ち込んだ矢、またはアポロンの矢。全天で3番目に小さい星座。' },

  // ── いて座 ───────────────────────────────────────────────
  { id:'sgr', abbr:'SGR', nameJa:'いて座', nameEn:'Sagittarius',
    raDeg:285.75,decDeg:-28,  areaRank:15, areaSqDeg:867,
    brightestStarJa:'カウス・アウストラリス', brightestStarEn:'Kaus Australis',
    mythologyJa:'弓を引くケンタウルスの姿。銀河系中心（いて座A*）の方向を向く、天の川で最も濃い領域。' },

  // ── さそり座 ─────────────────────────────────────────────
  { id:'sco', abbr:'SCO', nameJa:'さそり座', nameEn:'Scorpius',
    raDeg:254,   decDeg:-27,  areaRank:33, areaSqDeg:497,
    brightestStarJa:'アンタレス', brightestStarEn:'Antares',
    mythologyJa:'オリオンを刺した蠍。赤超巨星アンタレスは太陽の700倍の大きさ。夏の南天の代表星座。' },

  // ── ちょうこくしつ座 ────────────────────────────────────
  { id:'scl', abbr:'SCL', nameJa:'ちょうこくしつ座', nameEn:'Sculptor',
    raDeg:6.5,   decDeg:-32,  areaRank:36, areaSqDeg:475,
    brightestStarJa:'アルファ・スカルプトリス', brightestStarEn:'α Sculptoris',
    mythologyJa:'ラカイユが考案した彫刻家の工房を表す近代星座。南天銀河団の方向にある。' },

  // ── たて座 ───────────────────────────────────────────────
  { id:'sct', abbr:'SCT', nameJa:'たて座', nameEn:'Scutum',
    raDeg:280,   decDeg:-10,  areaRank:84, areaSqDeg:109,
    brightestStarJa:'アルファ・スキュティ', brightestStarEn:'α Scuti',
    mythologyJa:'ヘヴェリウスがポーランド王を称えて考案した盾を表す星座。ちなみに全天で4番目に小さい。' },

  // ── へび座 ───────────────────────────────────────────────
  { id:'ser', abbr:'SER', nameJa:'へび座', nameEn:'Serpens',
    raDeg:237,   decDeg:10,   areaRank:23, areaSqDeg:637,
    brightestStarJa:'ウヌカルハイ', brightestStarEn:'Unukalhai',
    mythologyJa:'医神アスクレピオスが手にする蛇。へびつかい座で2つに分断された唯一の星座。' },

  // ── ろくぶんぎ座 ─────────────────────────────────────────
  { id:'sex', abbr:'SEX', nameJa:'ろくぶんぎ座', nameEn:'Sextans',
    raDeg:154,   decDeg:-2,   areaRank:47, areaSqDeg:314,
    brightestStarJa:'アルファ・セクスタンティス', brightestStarEn:'α Sextantis',
    mythologyJa:'ヘヴェリウスが愛用した六分儀（セキスタント）を表す近代星座。' },

  // ── おうし座 ─────────────────────────────────────────────
  { id:'tau', abbr:'TAU', nameJa:'おうし座', nameEn:'Taurus',
    raDeg:70.5,  decDeg:16,   areaRank:17, areaSqDeg:797,
    brightestStarJa:'アルデバラン', brightestStarEn:'Aldebaran',
    mythologyJa:'ゼウスが変身した白い牡牛。プレアデス星団（すばる）とヒアデス星団を含む冬の名星座。' },

  // ── ぼうえんきょう座 ────────────────────────────────────
  { id:'tel', abbr:'TEL', nameJa:'ぼうえんきょう座', nameEn:'Telescopium',
    raDeg:285,   decDeg:-51,  areaRank:57, areaSqDeg:252,
    brightestStarJa:'アルファ・テレスコピ', brightestStarEn:'α Telescopii',
    mythologyJa:'ラカイユが望遠鏡を表して考案した南天の近代星座。' },

  // ── さんかく座 ───────────────────────────────────────────
  { id:'tri', abbr:'TRI', nameJa:'さんかく座', nameEn:'Triangulum',
    raDeg:32.75, decDeg:31,   areaRank:78, areaSqDeg:132,
    brightestStarJa:'ベータ・トライアングリ', brightestStarEn:'β Trianguli',
    mythologyJa:'ナイル川デルタや文字Δを表すとも言われる三角形の古代星座。' },

  // ── みなみのさんかく座 ───────────────────────────────────
  { id:'tra', abbr:'TRA', nameJa:'みなみのさんかく座', nameEn:'Triangulum Australe',
    raDeg:239.75,decDeg:-66,  areaRank:83, areaSqDeg:110,
    brightestStarJa:'アトリア', brightestStarEn:'Atria',
    mythologyJa:'大航海時代に考案された南天の三角形の近代星座。南の三角形として知られる。' },

  // ── きょしちょう座 ───────────────────────────────────────
  { id:'tuc', abbr:'TUC', nameJa:'きょしちょう座', nameEn:'Tucana',
    raDeg:355.75,decDeg:-66,  areaRank:48, areaSqDeg:295,
    brightestStarJa:'アルファ・トゥカナエ', brightestStarEn:'α Tucanae',
    mythologyJa:'大航海時代に考案された南天の鳥オオハシを表す近代星座。小マゼラン雲を含む。' },

  // ── おおぐま座 ───────────────────────────────────────────
  { id:'uma', abbr:'UMA', nameJa:'おおぐま座', nameEn:'Ursa Major',
    raDeg:169.75,decDeg:51,   areaRank:3,  areaSqDeg:1280,
    brightestStarJa:'アリオス', brightestStarEn:'Alioth',
    mythologyJa:'ゼウスに愛され熊に変えられたカリスト。北斗七星はこの星座の胴体と尾。全天3番目の大星座。' },

  // ── こぐま座 ─────────────────────────────────────────────
  { id:'umi', abbr:'UMI', nameJa:'こぐま座', nameEn:'Ursa Minor',
    raDeg:235.75,decDeg:78,   areaRank:56, areaSqDeg:256,
    brightestStarJa:'ポラリス', brightestStarEn:'Polaris',
    mythologyJa:'おおぐま座のカリストの息子アルカス。北極星ポラリスを末端に持ち、方位の目安となる。' },

  // ── 帆座 ─────────────────────────────────────────────────
  { id:'vel', abbr:'VEL', nameJa:'帆座', nameEn:'Vela',
    raDeg:143.5, decDeg:-47,  areaRank:32, areaSqDeg:500,
    brightestStarJa:'ガンマ・ベロルム', brightestStarEn:'γ Velorum',
    mythologyJa:'アルゴ船の帆部分。かつてはりゅうこつ・とも座と合わせた大アルゴ座を構成した。' },

  // ── おとめ座 ─────────────────────────────────────────────
  { id:'vir', abbr:'VIR', nameJa:'おとめ座', nameEn:'Virgo',
    raDeg:201.75,decDeg:-4,   areaRank:2,  areaSqDeg:1294,
    brightestStarJa:'スピカ', brightestStarEn:'Spica',
    mythologyJa:'穀物の女神デメテル。スピカは春の大曲線の先端。銀河団「おとめ座銀河団」の方向。' },

  // ── とびうお座 ───────────────────────────────────────────
  { id:'vol', abbr:'VOL', nameJa:'とびうお座', nameEn:'Volans',
    raDeg:117,   decDeg:-69,  areaRank:76, areaSqDeg:141,
    brightestStarJa:'ベータ・ボランティス', brightestStarEn:'β Volantis',
    mythologyJa:'大航海時代に考案された南天の近代星座。熱帯に生息する飛び魚を表す。' },

  // ── こぎつね座 ───────────────────────────────────────────
  { id:'vul', abbr:'VUL', nameJa:'こぎつね座', nameEn:'Vulpecula',
    raDeg:303.75,decDeg:24,   areaRank:55, areaSqDeg:268,
    brightestStarJa:'アナセル', brightestStarEn:'Anser',
    mythologyJa:'ヘヴェリウスが考案した狐と鵞鳥の星座。現在は狐単独。亜鈴状星雲（M27）を含む。' },
];

// Fast lookup by id
export const getConstellationById = (id: string): Constellation | undefined =>
  CONSTELLATIONS.find(c => c.id === id);

// Find constellation that links to a given star system
export const getConstellationForSystem = (systemId: string): Constellation | undefined =>
  CONSTELLATIONS.find(c => c.linkedSystemId === systemId);
