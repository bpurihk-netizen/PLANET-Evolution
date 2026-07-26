/**
 * Named stars for the celestial globe (天球儀).
 * RA/Dec are real J2000 coordinates in decimal degrees.
 * These match the star names defined in constellationArt.ts.
 */

export interface NamedStarEntry {
  /** Constellation IAU abbreviation */
  conId: string;
  /** Japanese name / transliteration */
  nameJa: string;
  /** English / Latin name */
  nameEn: string;
  /** Arabic / Greek origin meaning, if notable */
  meaning?: string;
  /** True for the brightest / most notable star in the constellation */
  isBrightest?: boolean;
  /** Right Ascension in decimal degrees (J2000) */
  raDeg: number;
  /** Declination in decimal degrees (J2000) */
  decDeg: number;
}

export const NAMED_STARS: NamedStarEntry[] = [
  // ── Orion ──────────────────────────────────────────────────────────────────
  { conId:'ori', nameJa:'ベテルギウス',   nameEn:'Betelgeuse', meaning:'アラビア語で「巨人の脇の下」',    isBrightest:true, raDeg:88.79,  decDeg: 7.41  },
  { conId:'ori', nameJa:'ベラトリックス', nameEn:'Bellatrix',  meaning:'ラテン語で「女性の戦士」',                      raDeg:81.28,  decDeg: 6.35  },
  { conId:'ori', nameJa:'リゲル',         nameEn:'Rigel',      meaning:'アラビア語で「巨人の左足」',                     raDeg:78.63,  decDeg:-8.20  },
  { conId:'ori', nameJa:'サイフ',         nameEn:'Saiph',      meaning:'アラビア語で「剣」',                             raDeg:86.94,  decDeg:-9.67  },
  { conId:'ori', nameJa:'ミンタカ',       nameEn:'Mintaka',    meaning:'アラビア語で「帯」',                             raDeg:83.00,  decDeg:-0.30  },
  { conId:'ori', nameJa:'アルニラム',     nameEn:'Alnilam',    meaning:'アラビア語で「真珠の帯」',                       raDeg:84.05,  decDeg:-1.20  },
  { conId:'ori', nameJa:'アルニタク',     nameEn:'Alnitak',    meaning:'アラビア語で「帯」',                             raDeg:85.19,  decDeg:-1.94  },
  { conId:'ori', nameJa:'メイッサ',       nameEn:'Meissa',     meaning:'アラビア語で「輝く者」',                         raDeg:83.78,  decDeg: 9.93  },

  // ── Ursa Major ─────────────────────────────────────────────────────────────
  { conId:'uma', nameJa:'ドゥブ',   nameEn:'Dubhe',  meaning:'アラビア語で「大熊の背中」', isBrightest:true, raDeg:165.93, decDeg:61.75 },
  { conId:'uma', nameJa:'メラク',   nameEn:'Merak',  meaning:'アラビア語で「腰部」',                         raDeg:165.46, decDeg:56.38 },
  { conId:'uma', nameJa:'フェクダ', nameEn:'Phecda', meaning:'アラビア語で「太股」',                         raDeg:178.46, decDeg:53.69 },
  { conId:'uma', nameJa:'メグレズ', nameEn:'Megrez', meaning:'アラビア語で「尾の付け根」',                   raDeg:183.86, decDeg:57.03 },
  { conId:'uma', nameJa:'アリオト', nameEn:'Alioth', meaning:'アラビア語で「黒い馬」',                       raDeg:193.51, decDeg:55.96 },
  { conId:'uma', nameJa:'ミザール', nameEn:'Mizar',  meaning:'アラビア語で「腰布」',                         raDeg:200.98, decDeg:54.93 },
  { conId:'uma', nameJa:'アルカイド',nameEn:'Alkaid', meaning:'アラビア語で「嘆く娘たちの首長」',            raDeg:206.89, decDeg:49.31 },

  // ── Ursa Minor ─────────────────────────────────────────────────────────────
  { conId:'umi', nameJa:'ポラリス',   nameEn:'Polaris', meaning:'ラテン語で「北極星」。地球の自転軸が指す星', isBrightest:true, raDeg: 37.95, decDeg:89.26 },
  { conId:'umi', nameJa:'コカブ',     nameEn:'Kochab',  meaning:'アラビア語で「星」。かつての北極星',                             raDeg:222.68, decDeg:86.58 },
  { conId:'umi', nameJa:'フェルカド', nameEn:'Pherkad', meaning:'アラビア語で「二頭の小熊のうち薄い方」',                         raDeg:236.06, decDeg:77.79 },

  // ── Cassiopeia ─────────────────────────────────────────────────────────────
  { conId:'cas', nameJa:'カフ',           nameEn:'Caph',      meaning:'アラビア語で「手のひら」',                          raDeg:  2.29, decDeg:59.15 },
  { conId:'cas', nameJa:'シェダル',       nameEn:'Schedar',   meaning:'アラビア語で「胸」', isBrightest:true,             raDeg: 10.13, decDeg:56.54 },
  { conId:'cas', nameJa:'ガンマ・カシオペヤ',nameEn:'Gamma Cas',meaning:'爆発変光星として有名',                           raDeg: 14.18, decDeg:60.72 },
  { conId:'cas', nameJa:'ルフバ',         nameEn:'Ruchbah',   meaning:'アラビア語で「膝」',                                raDeg: 21.45, decDeg:60.24 },
  { conId:'cas', nameJa:'セギン',         nameEn:'Segin',     meaning:'由来不詳',                                          raDeg: 28.60, decDeg:63.67 },

  // ── Leo ────────────────────────────────────────────────────────────────────
  { conId:'leo', nameJa:'レグルス',         nameEn:'Regulus',   meaning:'ラテン語で「小さな王」', isBrightest:true, raDeg:152.09, decDeg:11.97 },
  { conId:'leo', nameJa:'デネボラ',         nameEn:'Denebola',  meaning:'アラビア語で「ライオンの尾」',                   raDeg:177.26, decDeg:14.57 },
  { conId:'leo', nameJa:'アルギエバ',       nameEn:'Algieba',   meaning:'アラビア語で「額」',                             raDeg:154.91, decDeg:19.84 },
  { conId:'leo', nameJa:'ゾスマ',           nameEn:'Zosma',     meaning:'ギリシャ語で「腰帯」',                           raDeg:164.04, decDeg:20.52 },
  { conId:'leo', nameJa:'アドハフェラ',     nameEn:'Adhafera',  meaning:'アラビア語で「巻き毛」',                         raDeg:154.17, decDeg:23.42 },
  { conId:'leo', nameJa:'ラサラス',         nameEn:'Rasalas',   meaning:'アラビア語で「頭部の南の星」',                   raDeg:148.19, decDeg:26.01 },
  { conId:'leo', nameJa:'ケルタン',         nameEn:'Chertan',   meaning:'アラビア語で「小さな肋骨」',                     raDeg:168.53, decDeg:15.43 },

  // ── Scorpius ───────────────────────────────────────────────────────────────
  { conId:'sco', nameJa:'アンタレス',   nameEn:'Antares',  meaning:'ギリシャ語で「火星に対抗するもの」', isBrightest:true, raDeg:247.35, decDeg:-26.43 },
  { conId:'sco', nameJa:'グラフィアス', nameEn:'Graffias', meaning:'ギリシャ語で「かに」',                              raDeg:241.36, decDeg:-19.81 },
  { conId:'sco', nameJa:'ジュバ',       nameEn:'Dschubba', meaning:'アラビア語で「さそりの額」',                        raDeg:240.08, decDeg:-22.62 },
  { conId:'sco', nameJa:'アルニヤト',   nameEn:'Alniyat',  meaning:'アラビア語で「心臓の近くの星」',                    raDeg:245.38, decDeg:-25.59 },
  { conId:'sco', nameJa:'シャウラ',     nameEn:'Shaula',   meaning:'アラビア語で「上げた尻尾」',                        raDeg:263.40, decDeg:-37.10 },
  { conId:'sco', nameJa:'レサト',       nameEn:'Lesath',   meaning:'アラビア語で「毒液」',                              raDeg:264.86, decDeg:-38.02 },

  // ── Gemini ─────────────────────────────────────────────────────────────────
  { conId:'gem', nameJa:'カストル',   nameEn:'Castor',  meaning:'ギリシャ神話の双子の一人（馬術の名手）',             raDeg:113.65, decDeg:31.89 },
  { conId:'gem', nameJa:'ポルックス', nameEn:'Pollux',  meaning:'ギリシャ神話の双子の一人（拳闘の名手）', isBrightest:true, raDeg:116.33, decDeg:28.03 },
  { conId:'gem', nameJa:'メブスダ',   nameEn:'Mebsuda', meaning:'アラビア語で「伸ばした腕」',                         raDeg: 93.72, decDeg:22.51 },
  { conId:'gem', nameJa:'ワサト',     nameEn:'Wasat',   meaning:'アラビア語で「中央」',                               raDeg:100.98, decDeg:21.98 },
  { conId:'gem', nameJa:'メクブダ',   nameEn:'Mekbuda', meaning:'アラビア語で「折り曲げた腕」',                       raDeg: 99.42, decDeg:20.57 },
  { conId:'gem', nameJa:'アルジル',   nameEn:'Alzirr',  meaning:'アラビア語で「ボタン」',                             raDeg:100.43, decDeg:16.54 },
  { conId:'gem', nameJa:'プロプス',   nameEn:'Propus',  meaning:'ギリシャ語で「前足」',                               raDeg: 95.74, decDeg:22.51 },

  // ── Taurus ─────────────────────────────────────────────────────────────────
  { conId:'tau', nameJa:'アルデバラン', nameEn:'Aldebaran', meaning:'アラビア語で「追いかけるもの」（プレアデスを追う）', isBrightest:true, raDeg:68.98, decDeg:16.51 },
  { conId:'tau', nameJa:'エルナト',     nameEn:'Elnath',    meaning:'アラビア語で「角を突く者」',                                            raDeg:81.57, decDeg:28.61 },
  { conId:'tau', nameJa:'プレアデス（昴）',nameEn:'Pleiades',meaning:'七姉妹星団',                                                           raDeg:56.87, decDeg:24.11 },

  // ── Pisces ─────────────────────────────────────────────────────────────────
  { conId:'psc', nameJa:'アル・リシャ', nameEn:'Al Rischa', meaning:'アラビア語で「縄」。二匹の魚をつなぐ結び目', isBrightest:true, raDeg:358.00, decDeg:2.76 },

  // ── Aquarius ───────────────────────────────────────────────────────────────
  { conId:'aqr', nameJa:'サダルスウド',   nameEn:'Sadalsuud',  meaning:'アラビア語で「幸運の中の幸運の星」', isBrightest:true, raDeg:322.89, decDeg: -7.78 },
  { conId:'aqr', nameJa:'サダルメリク',   nameEn:'Sadalmelik', meaning:'アラビア語で「幸運な星たちの一つ」',               raDeg:321.67, decDeg: -9.50 },
  { conId:'aqr', nameJa:'サダキア',       nameEn:'Sadachbia',  meaning:'アラビア語で「テントの幸運な星」',                 raDeg:332.88, decDeg: -1.39 },

  // ── Capricornus ────────────────────────────────────────────────────────────
  { conId:'cap', nameJa:'アルゲディ', nameEn:'Algedi', meaning:'アラビア語で「山羊の角」',                     raDeg:304.51, decDeg:-12.54 },
  { conId:'cap', nameJa:'ダビ',       nameEn:'Dabih',  meaning:'アラビア語で「幸運な屠殺者」', isBrightest:true, raDeg:305.25, decDeg:-14.78 },

  // ── Sagittarius ────────────────────────────────────────────────────────────
  { conId:'sgr', nameJa:'カウス・メディア',    nameEn:'Kaus Media',     meaning:'アラビア語＋ラテン語で「弓の中央」',                    raDeg:275.25, decDeg:-34.38 },
  { conId:'sgr', nameJa:'カウス・ボレアリス',  nameEn:'Kaus Borealis',  meaning:'アラビア語＋ラテン語で「弓の北部」', isBrightest:true, raDeg:271.45, decDeg:-30.42 },
  { conId:'sgr', nameJa:'カウス・アウストラリス',nameEn:'Kaus Australis',meaning:'アラビア語＋ラテン語で「弓の南部」',                    raDeg:274.41, decDeg:-36.76 },
  { conId:'sgr', nameJa:'ヌンキ',              nameEn:'Nunki',          meaning:'バビロニア語で「海の星」',                               raDeg:283.82, decDeg:-26.30 },

  // ── Virgo ──────────────────────────────────────────────────────────────────
  { conId:'vir', nameJa:'スピカ',               nameEn:'Spica',        meaning:'ラテン語で「麦の穂」。秋の夜空に輝く一等星', isBrightest:true, raDeg:201.30, decDeg:-11.16 },
  { conId:'vir', nameJa:'ポリマ',               nameEn:'Porrima',      meaning:'ローマ神話の予言の女神の名',                              raDeg:190.42, decDeg: 10.96 },
  { conId:'vir', nameJa:'ヴィンデミアトリックス',nameEn:'Vindemiatrix', meaning:'ラテン語で「葡萄の収穫者」',                             raDeg:194.01, decDeg: 38.84 },

  // ── Libra ──────────────────────────────────────────────────────────────────
  { conId:'lib', nameJa:'ズベン・エル・ゲヌビ', nameEn:'Zubenelgenubi',  meaning:'アラビア語で「蠍の南のはさみ」',                          raDeg:222.72, decDeg:-16.04 },
  { conId:'lib', nameJa:'ズベン・エッシャマリ', nameEn:'Zubeneschamali', meaning:'アラビア語で「蠍の北のはさみ」。わずかに緑がかった星', isBrightest:true, raDeg:229.25, decDeg: -9.38 },

  // ── Cancer ─────────────────────────────────────────────────────────────────
  { conId:'cnc', nameJa:'プレセペ（蜂の巣星団）',nameEn:'Praesepe M44', meaning:'ラテン語で「飼い葉おけ」。肉眼でも見える散開星団', raDeg:130.10, decDeg:19.67 },
  { conId:'cnc', nameJa:'アクベンス',            nameEn:'Acubens',      meaning:'アラビア語で「かにのはさみ」', isBrightest:true,       raDeg:134.62, decDeg:11.86 },
  { conId:'cnc', nameJa:'アル・タルフ',          nameEn:'Al Tarf',      meaning:'アラビア語で「かにの目の先端」',                        raDeg:124.13, decDeg: 9.19 },

  // ── Cygnus ─────────────────────────────────────────────────────────────────
  { conId:'cyg', nameJa:'デネブ',   nameEn:'Deneb',  meaning:'アラビア語で「尾」。夏の大三角の一つ', isBrightest:true, raDeg:310.36, decDeg:45.28 },
  { conId:'cyg', nameJa:'サドル',   nameEn:'Sadr',   meaning:'アラビア語で「胸」',                              raDeg:305.56, decDeg:40.26 },
  { conId:'cyg', nameJa:'アルビレオ',nameEn:'Albireo',meaning:'美しい二重星（金と青）。由来は諸説あり',          raDeg:292.68, decDeg:27.96 },
  { conId:'cyg', nameJa:'ジェナ',   nameEn:'Gienah', meaning:'アラビア語で「翼」',                              raDeg:311.55, decDeg:33.97 },

  // ── Aquila ─────────────────────────────────────────────────────────────────
  { conId:'aql', nameJa:'アルタイル',   nameEn:'Altair',  meaning:'アラビア語で「飛ぶ鷲」。夏の大三角の一つ', isBrightest:true, raDeg:297.70, decDeg: 8.87 },
  { conId:'aql', nameJa:'タラゼド',     nameEn:'Tarazed', meaning:'ペルシャ語で「天秤の梁」',                              raDeg:296.55, decDeg:10.61 },
  { conId:'aql', nameJa:'アルシャイン', nameEn:'Alshain', meaning:'ペルシャ語で「鷹・鷲」',                                raDeg:296.97, decDeg: 6.41 },

  // ── Lyra ───────────────────────────────────────────────────────────────────
  { conId:'lyr', nameJa:'ベガ',         nameEn:'Vega',    meaning:'アラビア語で「急降下する鷲」。夏の大三角の一つ', isBrightest:true, raDeg:279.23, decDeg:38.78 },
  { conId:'lyr', nameJa:'エプシロン・ライ',nameEn:'ε Lyrae',meaning:'有名な二重星（ε¹・ε²）',                               raDeg:284.44, decDeg:33.36 },
  { conId:'lyr', nameJa:'シェリャク',   nameEn:'Sheliak', meaning:'アラビア語で「竪琴」',                                 raDeg:282.52, decDeg:33.36 },

  // ── Hercules ───────────────────────────────────────────────────────────────
  { conId:'her', nameJa:'コルネフォロス',nameEn:'Kornephoros',meaning:'ギリシャ語で「棍棒を持つ者」', isBrightest:true, raDeg:258.76, decDeg:31.60 },

  // ── Boötes ─────────────────────────────────────────────────────────────────
  { conId:'boo', nameJa:'アークトゥルス',nameEn:'Arcturus',meaning:'ギリシャ語で「熊の番人」。北天最明星', isBrightest:true, raDeg:213.91, decDeg:19.18 },
  { conId:'boo', nameJa:'イザール',      nameEn:'Izar',    meaning:'アラビア語で「帯」。美しい二重星',                    raDeg:221.26, decDeg:27.07 },

  // ── Pegasus ────────────────────────────────────────────────────────────────
  { conId:'peg', nameJa:'シェアト',     nameEn:'Scheat',    meaning:'アラビア語で「肩」', isBrightest:true, raDeg:328.48, decDeg:28.08 },
  { conId:'peg', nameJa:'マルカブ',     nameEn:'Markab',    meaning:'アラビア語で「馬の鞍」',               raDeg:346.19, decDeg:15.21 },
  { conId:'peg', nameJa:'アルゲニブ',   nameEn:'Algenib',   meaning:'アラビア語で「翼の側面」',             raDeg:322.37, decDeg:33.17 },
  { conId:'peg', nameJa:'アルフェラッツ',nameEn:'Alpheratz', meaning:'アラビア語で「馬の臍」。アンドロメダ座と共有', raDeg:2.06, decDeg:29.09 },

  // ── Andromeda ──────────────────────────────────────────────────────────────
  { conId:'and', nameJa:'アルフェラッツ',nameEn:'Alpheratz',meaning:'アラビア語で「馬の臍」。ペガスス座と共有', isBrightest:true, raDeg:  2.06, decDeg:29.09 },
  { conId:'and', nameJa:'ミラク',        nameEn:'Mirach',   meaning:'アラビア語で「腰帯」',                              raDeg: 17.43, decDeg:35.62 },
  { conId:'and', nameJa:'アルマク',      nameEn:'Almach',   meaning:'アラビア語で「砂漠の小動物」。美しい二重星',        raDeg: 30.93, decDeg:42.33 },

  // ── Perseus ────────────────────────────────────────────────────────────────
  { conId:'per', nameJa:'ミルファク', nameEn:'Mirfak', meaning:'アラビア語で「肘」', isBrightest:true, raDeg:50.69, decDeg:47.79 },
  { conId:'per', nameJa:'アルゴル',   nameEn:'Algol',  meaning:'アラビア語で「悪魔の頭」。有名な食連星',   raDeg:48.40, decDeg:35.79 },

  // ── Cetus ──────────────────────────────────────────────────────────────────
  { conId:'cet', nameJa:'メンカル', nameEn:'Menkar',meaning:'アラビア語で「鼻孔」',                               raDeg: 45.57, decDeg: 4.09 },
  { conId:'cet', nameJa:'ミラ',     nameEn:'Mira',  meaning:'ラテン語で「驚くべき」。有名な長周期変光星', isBrightest:true, raDeg: 34.84, decDeg:-2.98 },

  // ── Hydra ──────────────────────────────────────────────────────────────────
  { conId:'hya', nameJa:'アルファルド',nameEn:'Alphard',meaning:'アラビア語で「孤独な者」。一帯に明るい星がないため', isBrightest:true, raDeg:141.90, decDeg:-8.66 },

  // ── Ophiuchus ──────────────────────────────────────────────────────────────
  { conId:'oph', nameJa:'ラサルハゲ',nameEn:'Rasalhague',meaning:'アラビア語で「蛇使いの頭」', isBrightest:true, raDeg:263.73, decDeg:12.56 },
  { conId:'oph', nameJa:'ケバルライ',nameEn:'Cebalrai',  meaning:'アラビア語で「羊飼いの犬」',               raDeg:265.87, decDeg: 4.57 },

  // ── Draco ──────────────────────────────────────────────────────────────────
  { conId:'dra', nameJa:'エルタニン',nameEn:'Eltanin',  meaning:'アラビア語で「龍の頭」', isBrightest:true, raDeg:269.15, decDeg:51.49 },
  { conId:'dra', nameJa:'ラスタバン',nameEn:'Rastaban', meaning:'アラビア語で「龍の頭」',                    raDeg:262.61, decDeg:52.30 },
  { conId:'dra', nameJa:'グルミウム',nameEn:'Grumium',  meaning:'アラビア語で「顎」',                        raDeg:261.34, decDeg:51.49 },
  { conId:'dra', nameJa:'アルワイド',nameEn:'Alwaid',   meaning:'アラビア語で「母親と幼い子たち」',          raDeg:244.58, decDeg:75.66 },
  { conId:'dra', nameJa:'アルディバ',nameEn:'Aldhibah', meaning:'アラビア語で「雌の鬣狐」',                  raDeg:225.49, decDeg:61.51 },

  // ── Corona Borealis ────────────────────────────────────────────────────────
  { conId:'crb', nameJa:'アルフェッカ',nameEn:'Alphecca',meaning:'アラビア語で「壊れた器の明るい星」。北の冠の宝石', isBrightest:true, raDeg:233.67, decDeg:26.71 },

  // ── Auriga ─────────────────────────────────────────────────────────────────
  { conId:'aur', nameJa:'カペラ',       nameEn:'Capella',    meaning:'ラテン語で「小さな山羊」。北天第3位の明るさ', isBrightest:true, raDeg: 79.17, decDeg:45.99 },
  { conId:'aur', nameJa:'メンカリナン', nameEn:'Menkalinan', meaning:'アラビア語で「肩の手綱」',                               raDeg: 89.88, decDeg:44.95 },

  // ── Canis Major ────────────────────────────────────────────────────────────
  { conId:'cma', nameJa:'シリウス', nameEn:'Sirius',meaning:'ギリシャ語で「燃えるように輝くもの」。全天最明星', isBrightest:true, raDeg:101.29, decDeg:-16.72 },
  { conId:'cma', nameJa:'ウェゼン', nameEn:'Wezen', meaning:'アラビア語で「重さ」',                                         raDeg:104.66, decDeg:-29.30 },
  { conId:'cma', nameJa:'アドハラ', nameEn:'Adhara',meaning:'アラビア語で「処女」',                                         raDeg:105.43, decDeg:-28.97 },

  // ── Canis Minor ────────────────────────────────────────────────────────────
  { conId:'cmi', nameJa:'プロキオン',nameEn:'Procyon',meaning:'ギリシャ語で「犬の前に昇る星」', isBrightest:true, raDeg:114.83, decDeg: 5.22 },
  { conId:'cmi', nameJa:'ゴメイサ',  nameEn:'Gomeisa',meaning:'アラビア語で「涙目の星」',                      raDeg:111.79, decDeg: 8.29 },

  // ── Eridanus ───────────────────────────────────────────────────────────────
  { conId:'eri', nameJa:'クルサ',     nameEn:'Cursa',   meaning:'アラビア語で「椅子の足台」',                           raDeg: 76.96, decDeg:-5.09 },
  { conId:'eri', nameJa:'アケルナル', nameEn:'Achernar',meaning:'アラビア語で「川の端」。南天の明星', isBrightest:true, raDeg: 24.43, decDeg:-57.24 },

  // ── Crux ───────────────────────────────────────────────────────────────────
  { conId:'cru', nameJa:'ガクルックス',    nameEn:'Gacrux',   meaning:'ラテン語+略号の混成。縦軸の北端',                   raDeg:187.79, decDeg:-57.11 },
  { conId:'cru', nameJa:'アクルックス',    nameEn:'Acrux',    meaning:'ラテン語+略号の混成。縦軸の南端', isBrightest:true, raDeg:186.65, decDeg:-63.10 },
  { conId:'cru', nameJa:'デルタ・クルシス',nameEn:'Delta Cru', meaning:'南十字左端',                                       raDeg:183.79, decDeg:-58.75 },
  { conId:'cru', nameJa:'ベクルックス',    nameEn:'Becrux',   meaning:'ラテン語+略号の混成。横軸の明星',                   raDeg:191.93, decDeg:-59.69 },

  // ── Centaurus ──────────────────────────────────────────────────────────────
  { conId:'cen', nameJa:'アルファ・ケンタウリ',nameEn:'Alpha Centauri',meaning:'太陽系に最も近い恒星系。3つの星から構成', isBrightest:true, raDeg:219.90, decDeg:-60.83 },
  { conId:'cen', nameJa:'ハダル',              nameEn:'Hadar',          meaning:'アラビア語で「地面」または「都市」',                           raDeg:210.96, decDeg:-60.37 },

  // ── Aries ──────────────────────────────────────────────────────────────────
  { conId:'ari', nameJa:'ハマル',   nameEn:'Hamal',   meaning:'アラビア語で「羊の頭」', isBrightest:true, raDeg:31.79, decDeg:23.46 },
  { conId:'ari', nameJa:'シェラタン',nameEn:'Sheratan',meaning:'アラビア語で「二つのしるし」',             raDeg:28.66, decDeg:20.81 },
];
