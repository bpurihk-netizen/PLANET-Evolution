// ── 宇宙の階層構造データ (教育コンテンツ・日本語) ────────────────────────────

export type CosmicLevel = 'lss' | 'supercluster' | 'cluster' | 'group' | 'galaxy' | 'system';

export interface CosmicPos { x: number; y: number; z: number }

// ── 大規模構造フィーチャー（LSS ビューに表示する物体）──────────────────────────
export interface LSSFeature {
  id: string;
  nameJa: string;
  nameEn: string;
  type: 'supercluster' | 'void' | 'filament' | 'wall' | 'node';
  descriptionJa: string;
  sizeMLy: number;   // 百万光年
  distanceMLy: number; // 天の川銀河からの距離（百万光年）
  pos: CosmicPos;    // 表示用の3D座標（単位: 任意スケール）
  color: string;
  superclusterId?: string; // type='supercluster'の場合、ドリルダウン先ID
  isHome?: boolean;
}

export const ALL_LSS_FEATURES: LSSFeature[] = [
  {
    id: 'laniakea', nameJa: 'ラニアケア超銀河団', nameEn: 'Laniakea Supercluster',
    type: 'supercluster', superclusterId: 'laniakea',
    descriptionJa: '天の川銀河が属する超銀河団。ハワイ語で「広大な天」を意味する。約10万個の銀河を含み、直径は5億2000万光年。2014年に発見された。',
    sizeMLy: 520, distanceMLy: 0,
    pos: { x: 0, y: 0, z: 0 }, color: '#FFD700', isHome: true,
  },
  {
    id: 'perseus-pisces', nameJa: 'ペルセウス座・うお座超銀河団', nameEn: 'Perseus-Pisces Supercluster',
    type: 'supercluster', superclusterId: 'perseus-pisces',
    descriptionJa: 'ラニアケアの対側に位置する巨大な超銀河団。ペルセウス座銀河団を中心とし、長さ約1億光年に及ぶ細長い「フィラメント」構造を持つ。',
    sizeMLy: 250, distanceMLy: 250,
    pos: { x: 4.5, y: 0.5, z: -2.5 }, color: '#7B9FFF',
  },
  {
    id: 'coma', nameJa: 'かみのけ座超銀河団', nameEn: 'Coma Supercluster',
    type: 'supercluster', superclusterId: 'coma',
    descriptionJa: 'かみのけ座銀河団（Abell 1656）を中心に持つ超銀河団。約3億2000万光年先にある。銀河の分布研究の歴史的舞台となった領域。',
    sizeMLy: 200, distanceMLy: 320,
    pos: { x: 1.5, y: 3.0, z: 2.0 }, color: '#FF7B7B',
  },
  {
    id: 'shapley', nameJa: 'シェープリー超銀河団集中', nameEn: 'Shapley Supercluster',
    type: 'supercluster', superclusterId: 'shapley',
    descriptionJa: '宇宙で最も巨大な構造の一つ。約6億光年の範囲に数十個の銀河団が密集し、ラニアケアに強い重力引力を及ぼしている「グレートアトラクター」の背後にある。',
    sizeMLy: 650, distanceMLy: 650,
    pos: { x: -6.5, y: 0.8, z: 1.5 }, color: '#FF9EFF',
  },
  {
    id: 'bootes-void', nameJa: 'うしかい座ボイド', nameEn: 'Boötes Void',
    type: 'void',
    descriptionJa: '宇宙の「泡」構造の中の暗黒領域。直径約3億3000万光年の巨大な「虚空」で、銀河がほとんど存在しない。1981年に発見された最初期の宇宙大空洞。',
    sizeMLy: 330, distanceMLy: 700,
    pos: { x: 0.5, y: 5.5, z: 3.5 }, color: '#112244',
  },
  {
    id: 'sloan-great-wall', nameJa: 'スローン・グレートウォール', nameEn: 'Sloan Great Wall',
    type: 'wall',
    descriptionJa: '銀河のフィラメントが集積した巨大な「宇宙の壁」。長さ約13億7000万光年で、発見当時（2003年）は宇宙最大の構造だった。スローン・デジタル・スカイ・サーベイで発見。',
    sizeMLy: 1370, distanceMLy: 1000,
    pos: { x: 6.0, y: 7.5, z: 1.0 }, color: '#99CCFF',
  },
  {
    id: 'hercules-corona', nameJa: 'ヘルクレス座・かんむり座大規模構造', nameEn: 'Hercules-Corona Borealis',
    type: 'filament',
    descriptionJa: '現在知られている中で最大規模の宇宙構造。直径約100億光年に及び、宇宙の観測可能な範囲の一定割合を占める。2013〜2015年に発見。',
    sizeMLy: 10000, distanceMLy: 10000,
    pos: { x: -4.0, y: 6.5, z: -3.0 }, color: '#66FFAA',
  },
];

// ── 超銀河団 ────────────────────────────────────────────────────────────────
export interface Supercluster {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  sizeMLy: number;
  distanceMLy: number;
  galaxyCount: string;
  massStr: string;
  pos: CosmicPos;
  color: string;
  clusterIds: string[];
  isHome?: boolean;
}

export const ALL_SUPERCLUSTERS: Supercluster[] = [
  {
    id: 'laniakea', nameJa: 'ラニアケア超銀河団', nameEn: 'Laniakea Supercluster',
    descriptionJa: '天の川銀河を含む超銀河団。2014年にブレント・タリーらが発見・命名。銀河の運動（独自の速度）を使ってその境界を定義した。ビルカトラ超銀河団やヒュドラ・ケンタウルス超銀河団、おとめ座銀河団などを包含する。',
    sizeMLy: 520, distanceMLy: 0, galaxyCount: '約10万個', massStr: '10¹⁷ 太陽質量',
    pos: { x: 0, y: 0, z: 0 }, color: '#FFD700', isHome: true,
    clusterIds: ['virgo-cluster', 'hydra-centaurus', 'fornax-cluster', 'local-group-area', 'antlia-cluster'],
  },
  {
    id: 'perseus-pisces', nameJa: 'ペルセウス座・うお座超銀河団', nameEn: 'Perseus-Pisces Supercluster',
    descriptionJa: 'ラニアケアの反対方向にある巨大な超銀河団。ペルセウス座銀河団（Abell 426）を中心に、うお座の方向まで細長く伸びる。宇宙の大規模構造を示す重要な事例。',
    sizeMLy: 250, distanceMLy: 250, galaxyCount: '約1,000個の銀河団', massStr: '10¹⁶ 太陽質量',
    pos: { x: 4.5, y: 0.5, z: -2.5 }, color: '#7B9FFF',
    clusterIds: ['perseus-cluster', 'pisces-cluster'],
  },
  {
    id: 'coma', nameJa: 'かみのけ座超銀河団', nameEn: 'Coma Supercluster',
    descriptionJa: 'かみのけ座の方向にある密度の高い超銀河団。かみのけ座銀河団（Abell 1656）としし座銀河団（Abell 1367）の2大銀河団を含む。宇宙の大規模構造の研究に重要な役割を果たす。',
    sizeMLy: 200, distanceMLy: 320, galaxyCount: '約3,000個', massStr: '10¹⁶ 太陽質量',
    pos: { x: 1.5, y: 3.0, z: 2.0 }, color: '#FF7B7B',
    clusterIds: ['coma-cluster', 'leo-cluster'],
  },
  {
    id: 'shapley', nameJa: 'シェープリー超銀河団集中', nameEn: 'Shapley Supercluster',
    descriptionJa: '数十億光年の宇宙で最も重力的に濃密な領域の一つ。ラニアケア超銀河団を「大引力体（グレートアトラクター）」方向へ引き寄せる原因の一部。ハーロウ・シェープリーが20世紀初頭に発見。',
    sizeMLy: 650, distanceMLy: 650, galaxyCount: '約500個の銀河団', massStr: '10¹⁸ 太陽質量',
    pos: { x: -6.5, y: 0.8, z: 1.5 }, color: '#FF9EFF',
    clusterIds: ['a3558', 'a3571'],
  },
];

// ── 銀河団 ───────────────────────────────────────────────────────────────────
export interface GalaxyCluster {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  superclusterId: string;
  distanceMLy: number;
  diameterMLy: number;
  galaxyCount: number;
  pos: CosmicPos;
  color: string;
  groupIds: string[];
  isHome?: boolean;
}

export const ALL_GALAXY_CLUSTERS: GalaxyCluster[] = [
  // ── ラニアケア内 ──
  {
    id: 'local-group-area', nameJa: '局所銀河群エリア', nameEn: 'Local Group Region',
    descriptionJa: '天の川銀河・アンドロメダ銀河を含む局所銀河群と、その周辺の小さな銀河群が点在する領域。最近傍の宇宙領域で、もっとも詳しく研究されている。',
    superclusterId: 'laniakea', distanceMLy: 0, diameterMLy: 15,
    galaxyCount: 80, pos: { x: 0, y: 0, z: 0 }, color: '#FFD700', isHome: true,
    groupIds: ['local-group', 'sculptor-group', 'ic342-group'],
  },
  {
    id: 'virgo-cluster', nameJa: 'おとめ座銀河団', nameEn: 'Virgo Cluster',
    descriptionJa: 'ラニアケア超銀河団の心臓部。直径約800万光年、約1,300個の銀河を含む最近傍の巨大銀河団。M87（巨大楕円銀河・ブラックホール撮影で有名）が中心に位置する。',
    superclusterId: 'laniakea', distanceMLy: 54, diameterMLy: 8,
    galaxyCount: 1300, pos: { x: 1.5, y: 0.5, z: 0.3 }, color: '#FF9EFF',
    groupIds: ['virgo-a-group', 'virgo-b-group', 'm81-group'],
  },
  {
    id: 'fornax-cluster', nameJa: 'ろ座銀河団', nameEn: 'Fornax Cluster',
    descriptionJa: '局所銀河群から約6200万光年の距離にある比較的小さな銀河団。NGC 1399（楕円銀河）が中心。暗黒物質の研究でも重要な銀河団。',
    superclusterId: 'laniakea', distanceMLy: 62, diameterMLy: 2,
    galaxyCount: 200, pos: { x: -1.8, y: -1.2, z: 0.5 }, color: '#88FFCC',
    groupIds: ['fornax-group'],
  },
  {
    id: 'hydra-centaurus', nameJa: 'うみへび座・ケンタウルス座超銀河団', nameEn: 'Hydra-Centaurus Supercluster',
    descriptionJa: 'ラニアケア超銀河団の一部。「グレートアトラクター」の正体の一部であり、局所群を含む数千の銀河がこの方向に引き寄せられている。セントーラス座Aなど特徴的な天体を含む。',
    superclusterId: 'laniakea', distanceMLy: 150, diameterMLy: 20,
    galaxyCount: 3000, pos: { x: -2.5, y: -0.5, z: -1.0 }, color: '#FFB88C',
    groupIds: ['cen-a-group'],
  },
  {
    id: 'antlia-cluster', nameJa: 'ポンプ座銀河団', nameEn: 'Antlia Cluster',
    descriptionJa: '約1億3200万光年に位置する銀河団。豊富な銀河群を持ち、ラニアケア超銀河団の外縁部に位置する比較的小さな集団。',
    superclusterId: 'laniakea', distanceMLy: 132, diameterMLy: 3,
    galaxyCount: 250, pos: { x: -0.5, y: 2.0, z: -2.0 }, color: '#AADDFF',
    groupIds: ['antlia-group'],
  },
  // ── ペルセウス-うお座内 ──
  {
    id: 'perseus-cluster', nameJa: 'ペルセウス座銀河団', nameEn: 'Perseus Cluster (Abell 426)',
    descriptionJa: 'X線で宇宙最大の輝度を持つ銀河団の一つ。約2億4000万光年先。銀河団内のX線ガスが奏でる「音」（振動）がNASAチャンドラ望遠鏡で検出されたことで有名。',
    superclusterId: 'perseus-pisces', distanceMLy: 240, diameterMLy: 10,
    galaxyCount: 500, pos: { x: 0, y: 0, z: 0 }, color: '#7B9FFF',
    groupIds: ['perseus-group'],
  },
  {
    id: 'pisces-cluster', nameJa: 'うお座銀河団', nameEn: 'Pisces-Perseus Filament',
    descriptionJa: 'ペルセウス座銀河団から南西に延びる銀河のフィラメント構造。宇宙の「網」（コズミックウェブ）の典型的な例として教科書に登場する。',
    superclusterId: 'perseus-pisces', distanceMLy: 250, diameterMLy: 5,
    galaxyCount: 200, pos: { x: 2.0, y: -1.5, z: 1.0 }, color: '#AACCFF',
    groupIds: [],
  },
  // ── かみのけ座内 ──
  {
    id: 'coma-cluster', nameJa: 'かみのけ座銀河団', nameEn: 'Coma Cluster (Abell 1656)',
    descriptionJa: '約3億2000万光年先の最も有名な銀河団の一つ。1933年にフリッツ・ツビッキーが「ダークマター」の存在を初めて指摘した歴史的な舞台。約3,000個の銀河を含む。',
    superclusterId: 'coma', distanceMLy: 320, diameterMLy: 20,
    galaxyCount: 3000, pos: { x: 0, y: 0, z: 0 }, color: '#FF7B7B',
    groupIds: ['coma-group'],
  },
  {
    id: 'leo-cluster', nameJa: 'しし座銀河団', nameEn: 'Leo Cluster (Abell 1367)',
    descriptionJa: 'かみのけ座銀河団と共にかみのけ座超銀河団を形成する銀河団。約3億光年先、しし座の方向にある活発な銀河団で、銀河の合体が頻繁に観測される。',
    superclusterId: 'coma', distanceMLy: 300, diameterMLy: 10,
    galaxyCount: 300, pos: { x: -2.5, y: 1.5, z: -0.5 }, color: '#FFAA77',
    groupIds: [],
  },
  // ── シェープリー内 ──
  {
    id: 'a3558', nameJa: 'シェープリー中心銀河団 (A3558)', nameEn: 'Abell 3558',
    descriptionJa: 'シェープリー超銀河団集中の中心に位置する巨大銀河団。複数の銀河団が合体している痕跡を持ち、X線観測で非常に明るく輝く。',
    superclusterId: 'shapley', distanceMLy: 650, diameterMLy: 15,
    galaxyCount: 1000, pos: { x: 0, y: 0, z: 0 }, color: '#FF9EFF',
    groupIds: [],
  },
  {
    id: 'a3571', nameJa: 'A3571 銀河団', nameEn: 'Abell 3571',
    descriptionJa: 'シェープリー超銀河団の主要メンバーの一つ。非常に高温のX線放射ガスを持つ銀河団で、ダークマター研究の対象として重要。',
    superclusterId: 'shapley', distanceMLy: 660, diameterMLy: 8,
    galaxyCount: 500, pos: { x: 3.0, y: 1.0, z: -2.0 }, color: '#FFCCFF',
    groupIds: [],
  },
];

// ── 銀河群 ────────────────────────────────────────────────────────────────────
export interface GalaxyGroup {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  clusterId: string;
  distanceMLy: number;   // 天の川からの距離
  diameterMLy: number;
  galaxyCount: number;
  pos: CosmicPos;        // 銀河団内の相対位置
  color: string;
  galaxyIds: string[];
  isHome?: boolean;
}

export const ALL_GALAXY_GROUPS: GalaxyGroup[] = [
  {
    id: 'local-group', nameJa: '局所銀河群', nameEn: 'Local Group',
    descriptionJa: '天の川銀河とアンドロメダ銀河を中心とする、私たちの銀河群。直径約1000万光年の範囲に約80個の銀河が集まっている。40億年後には天の川とアンドロメダが合体する予定。',
    clusterId: 'local-group-area', distanceMLy: 0, diameterMLy: 10,
    galaxyCount: 80, pos: { x: 0, y: 0, z: 0 }, color: '#FFD700', isHome: true,
    galaxyIds: ['milky-way', 'andromeda', 'triangulum', 'lmc', 'smc', 'sagittarius-dwarf', 'ic1613'],
  },
  {
    id: 'sculptor-group', nameJa: 'ちょうこくしつ座銀河群', nameEn: 'Sculptor Group',
    descriptionJa: '局所銀河群に最も近い銀河群の一つ。南天の「ちょうこくしつ座」方向に位置し、NGC 253（彫刻家銀河）が最も明るいメンバー。約1000〜1300万光年先。',
    clusterId: 'local-group-area', distanceMLy: 12, diameterMLy: 5,
    galaxyCount: 15, pos: { x: -2.0, y: -1.5, z: 0.5 }, color: '#88DDFF',
    galaxyIds: ['ngc253', 'ngc55'],
  },
  {
    id: 'ic342-group', nameJa: 'IC 342/マッフェイ銀河群', nameEn: 'IC 342/Maffei Group',
    descriptionJa: '局所銀河群の近傍にある銀河群。天の川銀河の「塵（ダスト）」に隠れているため発見が遅れたが、実は局所群と同程度の規模を持つ。IC 342は天の川に似た渦巻銀河。',
    clusterId: 'local-group-area', distanceMLy: 11, diameterMLy: 6,
    galaxyCount: 20, pos: { x: 2.5, y: 1.0, z: -1.5 }, color: '#FFAA88',
    galaxyIds: ['ic342', 'maffei1'],
  },
  {
    id: 'virgo-a-group', nameJa: 'おとめ座A銀河群（M87グループ）', nameEn: 'Virgo A Subgroup',
    descriptionJa: 'おとめ座銀河団の中心核。M87（乙女座A）を中心とし、巨大楕円銀河が密集する。M87のブラックホールはイベント・ホライズン・テレスコープが2019年に初撮影した歴史的天体。',
    clusterId: 'virgo-cluster', distanceMLy: 54, diameterMLy: 4,
    galaxyCount: 200, pos: { x: 0, y: 0, z: 0 }, color: '#FF9EFF',
    galaxyIds: ['m87', 'm84', 'm86'],
  },
  {
    id: 'virgo-b-group', nameJa: 'おとめ座B銀河群（M49グループ）', nameEn: 'Virgo B Subgroup',
    descriptionJa: 'おとめ座銀河団の南側のサブグループ。M49（おとめ座で最も明るい銀河）を中心とする。',
    clusterId: 'virgo-cluster', distanceMLy: 57, diameterMLy: 3,
    galaxyCount: 100, pos: { x: 2.0, y: -1.5, z: 0.8 }, color: '#DDBBFF',
    galaxyIds: ['m49', 'm58'],
  },
  {
    id: 'm81-group', nameJa: 'M81銀河群', nameEn: 'M81 Group',
    descriptionJa: '天の川から約1170万光年の距離にある銀河群。M81（ボーデの銀河）とM82（葉巻銀河）が有名なペアを形成する。NGC 3077との3重合体が進行中。',
    clusterId: 'virgo-cluster', distanceMLy: 12, diameterMLy: 4,
    galaxyCount: 35, pos: { x: -2.5, y: 2.0, z: 1.0 }, color: '#FFDDAA',
    galaxyIds: ['m81', 'm82'],
  },
  {
    id: 'fornax-group', nameJa: 'ろ座銀河群', nameEn: 'Fornax Group',
    descriptionJa: 'ろ座銀河団の中心部。NGC 1399を中心に、球状星団が多数存在することで知られる。ダークマターと通常の物質の比率が研究されている。',
    clusterId: 'fornax-cluster', distanceMLy: 62, diameterMLy: 3,
    galaxyCount: 50, pos: { x: 0, y: 0, z: 0 }, color: '#88FFCC',
    galaxyIds: ['ngc1399', 'ngc1316'],
  },
  {
    id: 'cen-a-group', nameJa: 'ケンタウルスA銀河群', nameEn: 'Centaurus A Group',
    descriptionJa: '南天で最も有名な電波銀河NGC 5128（ケンタウルスA）を含む銀河群。ブラックホールが作る巨大なジェットが観測されている。天の川から約1300万光年。',
    clusterId: 'hydra-centaurus', distanceMLy: 13, diameterMLy: 5,
    galaxyCount: 30, pos: { x: 0, y: 0, z: 0 }, color: '#FFB88C',
    galaxyIds: ['cen-a', 'm83'],
  },
];

// ── 銀河 ──────────────────────────────────────────────────────────────────────
export interface CosmicGalaxy {
  id: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  type: 'spiral' | 'barred-spiral' | 'elliptical' | 'irregular' | 'lenticular' | 'dwarf';
  groupId: string;
  distanceMLy: number;
  diameterKly: number;  // 直径（千光年）
  starCount: string;
  pos: CosmicPos;       // 銀河群内の相対位置
  color: string;        // 代表色
  diskColor?: string;   // 渦巻腕の色
  bulgColor?: string;   // バルジの色
  starSystemIds: string[]; // ドリルダウンで到達できる星系ID
  isDrillable: boolean; // 星系ビューまでドリルダウン可能か
  isHome?: boolean;
  facts: string[];
}

export const ALL_COSMIC_GALAXIES: CosmicGalaxy[] = [
  // ── 局所銀河群 ──
  {
    id: 'milky-way', nameJa: '天の川銀河（銀河系）', nameEn: 'Milky Way',
    descriptionJa: '太陽系を含む私たちの銀河。棒渦巻銀河（SBbc型）で、直径約10万光年。中心には超大質量ブラックホール「いて座A*」（約400万太陽質量）が鎮座する。',
    type: 'barred-spiral', groupId: 'local-group', distanceMLy: 0,
    diameterKly: 100, starCount: '2000〜4000億個',
    pos: { x: 0, y: 0, z: 0 }, color: '#FFE860', diskColor: '#FFCC44', bulgColor: '#FFE8A0',
    starSystemIds: ['solar-system', 'alpha-centauri', 'trappist1', 'kepler442'],
    isDrillable: true, isHome: true,
    facts: [
      '太陽系は天の川銀河の中心から約2万6千光年離れた「オリオン腕」という渦巻腕の内側に位置する',
      '銀河の中心「いて座A*」は2022年にイベント・ホライズン・テレスコープが初めて撮影した',
      '天の川銀河とアンドロメダ銀河は約37億年後から衝突・合体を始め、約60億年後に「ミルコメダ」という楕円銀河になる予測がある',
    ],
  },
  {
    id: 'andromeda', nameJa: 'アンドロメダ銀河 (M31)', nameEn: 'Andromeda Galaxy',
    descriptionJa: '肉眼で見える最遠の天体（晴れた夜なら肉眼でかすかに見える）。約250万光年先にある棒渦巻銀河で、局所銀河群最大の銀河。天の川銀河に向かって秒速110kmで接近中。',
    type: 'barred-spiral', groupId: 'local-group', distanceMLy: 2.537,
    diameterKly: 220, starCount: '約1兆個（天の川の2〜5倍）',
    pos: { x: 1.5, y: 0.3, z: 0.2 }, color: '#FFDDCC', diskColor: '#FFBB88', bulgColor: '#FFE8D0',
    starSystemIds: [],
    isDrillable: false,
    facts: [
      '約250万光年の距離にある最近傍の大型銀河。満月の6倍の見かけの大きさがあるが、暗すぎて中心部しか見えない',
      '1920年代の「大論争」でエドウィン・ハッブルが本銀河中の変光星を使って初めて「天の川の外の銀河」と証明した',
      '核内にも超大質量ブラックホール「M31*」が存在し、質量は1億太陽質量を超えると推定されている',
    ],
  },
  {
    id: 'triangulum', nameJa: '三角座銀河 (M33)', nameEn: 'Triangulum Galaxy',
    descriptionJa: '局所銀河群3番目の大きさの渦巻銀河。約270万光年先。非常に低い表面輝度のため、肉眼では見えないが、最も遠い肉眼可能天体という説もある。活発な星形成領域を持つ。',
    type: 'spiral', groupId: 'local-group', distanceMLy: 2.73,
    diameterKly: 60, starCount: '約400億個',
    pos: { x: 1.8, y: 0.8, z: -0.3 }, color: '#AADDFF', diskColor: '#88BBFF', bulgColor: '#CCEEFF',
    starSystemIds: [],
    isDrillable: false,
    facts: [
      '局所銀河群で3番目に大きい銀河。核（中心）にブラックホールがほとんどない珍しい銀河として注目される',
      '非常に分散した構造を持ち、表面輝度が低い。暗い場所でも肉眼で見るのは困難',
      '活発な星生成領域を持ち、その一つ「NGC 604」は天の川のオリオン星雲の1500倍の大きさがある',
    ],
  },
  {
    id: 'lmc', nameJa: '大マゼラン雲 (LMC)', nameEn: 'Large Magellanic Cloud',
    descriptionJa: '天の川銀河の衛星銀河の中で最大のもの。約16万光年先。南天でしか見えず、マゼランら探検家が1519年に記録したことから「マゼラン雲」と呼ばれる。超新星1987Aが観測された銀河。',
    type: 'irregular', groupId: 'local-group', distanceMLy: 0.16,
    diameterKly: 14, starCount: '約300億個',
    pos: { x: 0.1, y: -0.2, z: 0.05 }, color: '#FFBBAA',
    starSystemIds: [],
    isDrillable: false,
    facts: [
      '1987年に観測された超新星爆発「SN 1987A」の舞台。約40万年ぶりの肉眼超新星として天文学者を興奮させた',
      '天の川に重力的に捕らわれた衛星銀河。将来的には天の川に飲み込まれると考えられている',
      '活発な星形成領域「タランチュラ星雲（30 Doradus）」を持つ。局所銀河群で最も活発な星形成領域のひとつ',
    ],
  },
  {
    id: 'smc', nameJa: '小マゼラン雲 (SMC)', nameEn: 'Small Magellanic Cloud',
    descriptionJa: '大マゼラン雲とセットになって南天に見える天の川の衛星銀河。約20万光年先。大マゼラン雲とは「マゼラン橋」と呼ばれるガス流でつながっている。',
    type: 'irregular', groupId: 'local-group', distanceMLy: 0.2,
    diameterKly: 7, starCount: '約30億個',
    pos: { x: 0.05, y: -0.25, z: -0.05 }, color: '#BBBBDD',
    starSystemIds: [],
    isDrillable: false,
    facts: [
      '大マゼラン雲の「妹」銀河。南半球でしか肉眼で見えない不規則銀河',
      '100年前、ヘンリエッタ・スワン・リービットがこの銀河の変光星（セファイド変光星）を研究して「宇宙の距離はしご」の基礎を作った',
    ],
  },
  {
    id: 'sagittarius-dwarf', nameJa: 'いて座矮小楕円銀河', nameEn: 'Sagittarius Dwarf Elliptical Galaxy',
    descriptionJa: '天の川銀河に最も近い衛星銀河の一つ（約7万光年）。現在進行中で天の川に飲み込まれている途中にあり、「潮汐ストリーム」と呼ばれる星の流れが天の川を取り巻いている。',
    type: 'dwarf', groupId: 'local-group', distanceMLy: 0.07,
    diameterKly: 10, starCount: '数千万個',
    pos: { x: -0.05, y: 0.05, z: 0.02 }, color: '#CC9955',
    starSystemIds: [],
    isDrillable: false,
    facts: [
      '天の川銀河に「食べられている」最中の銀河。過去に何度も天の川の中心を通過し、ばらばらになってきている',
      '1994年に発見された。天の川に非常に近く、銀河系の「ディスク」に隠れて長年見つからなかった',
    ],
  },
  {
    id: 'ic1613', nameJa: 'IC 1613', nameEn: 'IC 1613',
    descriptionJa: '局所銀河群の外縁に位置する不規則矮小銀河。約240万光年先。セファイド変光星の研究で宇宙の距離スケール確定に貢献した歴史的な銀河。',
    type: 'irregular', groupId: 'local-group', distanceMLy: 2.4,
    diameterKly: 10, starCount: '約1億個',
    pos: { x: -1.8, y: 0.6, z: 0.4 }, color: '#99BBFF',
    starSystemIds: [], isDrillable: false,
    facts: ['1906年にマックス・ウォルフが発見。1970年代のセファイド変光星研究で距離測定の精度向上に貢献した'],
  },
  // ── おとめ座銀河団 ──
  {
    id: 'm87', nameJa: 'M87（乙女座A）', nameEn: 'Messier 87',
    descriptionJa: 'おとめ座銀河団の中心に位置する巨大楕円銀河。2019年に史上初めてブラックホールの「影」が撮影された。ブラックホールの質量は太陽の約65億倍。巨大なジェットを噴出している。',
    type: 'elliptical', groupId: 'virgo-a-group', distanceMLy: 54,
    diameterKly: 120, starCount: '約1兆個',
    pos: { x: 0, y: 0, z: 0 }, color: '#FFCCAA',
    starSystemIds: [], isDrillable: false,
    facts: [
      '2019年にイベント・ホライズン・テレスコープ（EHT）が初めてブラックホールの影を撮影した歴史的な銀河',
      '銀河の中心から5000光年の巨大なジェット（プラズマの流れ）を噴出している',
      '5000個以上の球状星団を持つ（天の川の100倍以上）',
    ],
  },
  {
    id: 'm81', nameJa: 'M81（ボーデの銀河）', nameEn: 'Bode\'s Galaxy (M81)',
    descriptionJa: '天の川から約1170万光年の距離にある明るい渦巻銀河。ヨハン・エレルト・ボーデが1774年に発見。隣のM82（葉巻銀河）と重力的に相互作用しており、M82での活発な星形成の原因となっている。',
    type: 'spiral', groupId: 'm81-group', distanceMLy: 11.7,
    diameterKly: 90, starCount: '約2500億個',
    pos: { x: 0, y: 0, z: 0 }, color: '#FFDD99',
    starSystemIds: [], isDrillable: false,
    facts: [
      '1774年にヨハン・エレルト・ボーデが発見した「ボーデの銀河」。北半球の夜空で最も美しい渦巻銀河の一つ',
      '隣のM82（葉巻銀河）と重力で引き合っており、M82に強力な星の爆発的生成（スターバースト）を引き起こしている',
    ],
  },
  {
    id: 'm82', nameJa: 'M82（葉巻銀河）', nameEn: 'Cigar Galaxy (M82)',
    descriptionJa: 'M81との重力相互作用で引き起こされたスターバースト（爆発的星形成）が進行中の不規則銀河。葉巻のような形と、銀河面から噴き出す赤い水素ガスの流れが特徴的。',
    type: 'irregular', groupId: 'm81-group', distanceMLy: 11.5,
    diameterKly: 37, starCount: '約300億個',
    pos: { x: 0.5, y: 0.2, z: 0.1 }, color: '#FF5500',
    starSystemIds: [], isDrillable: false,
    facts: [
      '活発な「スターバースト銀河」。中心部では天の川の10倍の速さで新しい星が生まれている',
      '2014年にM82内で超新星SN 2014Jが観測された。近年最もよく観測された超新星の一つ',
    ],
  },
  // ── ろ座銀河群 ──
  {
    id: 'ngc1399', nameJa: 'NGC 1399', nameEn: 'NGC 1399',
    descriptionJa: 'ろ座銀河団の中心楕円銀河。多数の球状星団を持ち、超大質量ブラックホールを内包する。',
    type: 'elliptical', groupId: 'fornax-group', distanceMLy: 62,
    diameterKly: 60, starCount: '約2000億個',
    pos: { x: 0, y: 0, z: 0 }, color: '#FFEECC',
    starSystemIds: [], isDrillable: false, facts: ['ろ座銀河団の中心銀河。6000個以上の球状星団を持つ'],
  },
  {
    id: 'ngc1316', nameJa: 'NGC 1316（ろ座A）', nameEn: 'NGC 1316 (Fornax A)',
    descriptionJa: '強力な電波源。複数の銀河が合体した痕跡を持ち、不規則な構造と巨大なシェル状構造が特徴的。',
    type: 'lenticular', groupId: 'fornax-group', distanceMLy: 62,
    diameterKly: 80, starCount: '約5000億個',
    pos: { x: 1.5, y: -1.0, z: 0.3 }, color: '#FFDDAA',
    starSystemIds: [], isDrillable: false,
    facts: ['複数銀河の合体で生まれた巨大レンズ状銀河。電波望遠鏡での観測で有名な「ろ座A」'],
  },
  // ── ケンタウルスA群 ──
  {
    id: 'cen-a', nameJa: 'ケンタウルスA（NGC 5128）', nameEn: 'Centaurus A',
    descriptionJa: '天の川から約1300万光年。南天で最も明るい電波源の一つ。中心の超大質量ブラックホール（太陽の5500万倍）から2本の巨大ジェットが噴出している異形の楕円銀河。',
    type: 'elliptical', groupId: 'cen-a-group', distanceMLy: 13,
    diameterKly: 60, starCount: '約1000億個',
    pos: { x: 0, y: 0, z: 0 }, color: '#FF8844',
    starSystemIds: [], isDrillable: false,
    facts: [
      '全天で5番目に明るい電波源。X線や電波で観測すると、銀河から噴き出す巨大なジェットが見える',
      '楕円銀河に渦巻銀河が衝突・吸収された結果と考えられており、中心部に暗い塵の帯がある',
    ],
  },
  {
    id: 'm83', nameJa: 'M83（南風車銀河）', nameEn: 'Southern Pinwheel Galaxy (M83)',
    descriptionJa: '天の川から約1500万光年の明るい棒渦巻銀河。南天の「風車銀河」と呼ばれ、鮮明な渦巻腕と中心の棒構造が特徴。近年6つの超新星が観測された超新星多発銀河。',
    type: 'barred-spiral', groupId: 'cen-a-group', distanceMLy: 15,
    diameterKly: 55, starCount: '約400億個',
    pos: { x: 1.5, y: 0.5, z: -0.3 }, color: '#FFEE77',
    starSystemIds: [], isDrillable: false,
    facts: ['近年100年間に6個の超新星爆発が観測された「超新星多発銀河」。明るく美しい渦巻腕が特徴的'],
  },
  // ── ちょうこくしつ座群 ──
  {
    id: 'ngc253', nameJa: 'NGC 253（彫刻家銀河）', nameEn: 'Sculptor Galaxy (NGC 253)',
    descriptionJa: 'ちょうこくしつ座銀河群の最も明るいメンバー。スターバースト銀河として活発な星形成が進む。約1000万光年先。南天で最も観測しやすい銀河の一つ。',
    type: 'spiral', groupId: 'sculptor-group', distanceMLy: 11,
    diameterKly: 70, starCount: '約400億個',
    pos: { x: 0, y: 0, z: 0 }, color: '#AADDFF',
    starSystemIds: [], isDrillable: false,
    facts: ['「彫刻家銀河」の愛称。ほぼ真横から見た渦巻銀河の美しい形が特徴。中心でスターバーストが進行中'],
  },
  {
    id: 'ngc55', nameJa: 'NGC 55', nameEn: 'NGC 55',
    descriptionJa: 'ちょうこくしつ座銀河群のメンバー。不規則銀河で、大マゼラン雲に似た形をしている。約700万光年先。',
    type: 'irregular', groupId: 'sculptor-group', distanceMLy: 7,
    diameterKly: 50, starCount: '約100億個',
    pos: { x: -1.0, y: 0.5, z: 0.2 }, color: '#99CCDD',
    starSystemIds: [], isDrillable: false, facts: ['大マゼラン雲に似た不規則銀河。局所銀河群とちょうこくしつ群の境界付近にある'],
  },
  // ── IC342/マッフェイ群 ──
  {
    id: 'ic342', nameJa: 'IC 342（隠れた銀河）', nameEn: 'IC 342',
    descriptionJa: '天の川銀河の塵と星間物質に隠れた「幻の銀河」。透過できれば局所銀河群に次ぐ明るさになるはず。天の川に非常に似た棒渦巻銀河で、直径は約5万光年。約1100万光年先。',
    type: 'barred-spiral', groupId: 'ic342-group', distanceMLy: 11,
    diameterKly: 50, starCount: '約300億個',
    pos: { x: 0, y: 0, z: 0 }, color: '#FFDDAA',
    starSystemIds: [], isDrillable: false,
    facts: [
      '天の川の塵に隠れているため、可視光では見えにくい。赤外線観測で初めてその全貌が明らかになった',
      'もし天の川の塵がなければ、夜空でアンドロメダ銀河に匹敵する明るさで見えていたはず',
    ],
  },
  {
    id: 'maffei1', nameJa: 'マッフェイ1', nameEn: 'Maffei 1',
    descriptionJa: '1968年にパオロ・マッフェイが赤外線観測で発見した楕円銀河。天の川の塵に完全に隠れており、可視光では見えない。実は局所銀河群の近傍に位置する。',
    type: 'elliptical', groupId: 'ic342-group', distanceMLy: 10,
    diameterKly: 75, starCount: '約500億個',
    pos: { x: 1.0, y: -0.5, z: 0.3 }, color: '#FFBB88',
    starSystemIds: [], isDrillable: false,
    facts: ['1968年まで発見されなかった「隠れた銀河」。天の川の塵が99.5%の可視光を吸収している'],
  },
  // ── 参照用（おとめ座銀河団中心部） ──
  {
    id: 'm49', nameJa: 'M49', nameEn: 'Messier 49',
    descriptionJa: 'おとめ座銀河団で最も明るい銀河。楕円銀河で、巨大な球状星団システムを持つ。',
    type: 'elliptical', groupId: 'virgo-b-group', distanceMLy: 57,
    diameterKly: 150, starCount: '約8000億個',
    pos: { x: 0, y: 0, z: 0 }, color: '#FFEEAA',
    starSystemIds: [], isDrillable: false, facts: ['おとめ座銀河団で初めて見つかった銀河（1771年）。最も明るいメンバー'],
  },
  {
    id: 'm58', nameJa: 'M58', nameEn: 'Messier 58',
    descriptionJa: 'おとめ座銀河団の中で数少ない棒渦巻銀河の一つ。中心に活動銀河核（AGN）を持つ。',
    type: 'barred-spiral', groupId: 'virgo-b-group', distanceMLy: 62,
    diameterKly: 100, starCount: '約4000億個',
    pos: { x: 2.0, y: 0.5, z: -0.5 }, color: '#FFCC99',
    starSystemIds: [], isDrillable: false, facts: ['おとめ座銀河団の中で最も明るい渦巻銀河の一つ'],
  },
  {
    id: 'm84', nameJa: 'M84', nameEn: 'Messier 84',
    descriptionJa: 'おとめ座銀河団中心部の大型楕円銀河。中心に強力なX線源と活動銀河核を持つ。',
    type: 'elliptical', groupId: 'virgo-a-group', distanceMLy: 54,
    diameterKly: 80, starCount: '約3000億個',
    pos: { x: 0.8, y: 0.3, z: 0.1 }, color: '#FFEEDD',
    starSystemIds: [], isDrillable: false, facts: ['M87と共におとめ座銀河団の中心部を形成する楕円銀河'],
  },
  {
    id: 'm86', nameJa: 'M86', nameEn: 'Messier 86',
    descriptionJa: 'おとめ座銀河団中心部の楕円銀河。地球に向かって移動している（青方偏移）数少ない銀河の一つ。',
    type: 'elliptical', groupId: 'virgo-a-group', distanceMLy: 54,
    diameterKly: 135, starCount: '約3000億個',
    pos: { x: -0.6, y: 0.4, z: -0.2 }, color: '#FFE8CC',
    starSystemIds: [], isDrillable: false, facts: ['青方偏移を示す珍しい銀河。おとめ座銀河団の重力に引き寄せられながら移動中'],
  },
];

// ── ルックアップ関数 ─────────────────────────────────────────────────────────

export const getGalaxyById = (id: string) =>
  ALL_COSMIC_GALAXIES.find(g => g.id === id) ?? ALL_COSMIC_GALAXIES[0];

export const getGroupById = (id: string) =>
  ALL_GALAXY_GROUPS.find(g => g.id === id) ?? ALL_GALAXY_GROUPS[0];

export const getClusterById = (id: string) =>
  ALL_GALAXY_CLUSTERS.find(c => c.id === id) ?? ALL_GALAXY_CLUSTERS[0];

export const getSuperclusterById = (id: string) =>
  ALL_SUPERCLUSTERS.find(s => s.id === id) ?? ALL_SUPERCLUSTERS[0];

export const getLSSFeatureById = (id: string) =>
  ALL_LSS_FEATURES.find(f => f.id === id) ?? ALL_LSS_FEATURES[0];

export const getGroupsForCluster = (clusterId: string) =>
  ALL_GALAXY_GROUPS.filter(g => g.clusterId === clusterId);

export const getClustersForSupercluster = (superclusterId: string) =>
  ALL_GALAXY_CLUSTERS.filter(c => c.superclusterId === superclusterId);

export const getGalaxiesForGroup = (groupId: string) =>
  ALL_COSMIC_GALAXIES.filter(g => g.groupId === groupId);

// パンくずリスト生成
export function getCosmicBreadcrumb(
  level: CosmicLevel,
  superclusterId: string,
  clusterId: string,
  groupId: string,
  galaxyId: string,
): Array<{ label: string; level: CosmicLevel }> {
  const crumbs: Array<{ label: string; level: CosmicLevel }> = [
    { label: '🌌 宇宙', level: 'lss' },
  ];
  if (level === 'lss') return crumbs;

  const sc = ALL_SUPERCLUSTERS.find(s => s.id === superclusterId);
  crumbs.push({ label: sc?.nameJa ?? '超銀河団', level: 'supercluster' });
  if (level === 'supercluster') return crumbs;

  const cl = ALL_GALAXY_CLUSTERS.find(c => c.id === clusterId);
  crumbs.push({ label: cl?.nameJa ?? '銀河団', level: 'cluster' });
  if (level === 'cluster') return crumbs;

  const gr = ALL_GALAXY_GROUPS.find(g => g.id === groupId);
  crumbs.push({ label: gr?.nameJa ?? '銀河群', level: 'group' });
  if (level === 'group') return crumbs;

  const gx = ALL_COSMIC_GALAXIES.find(g => g.id === galaxyId);
  crumbs.push({ label: gx?.nameJa ?? '銀河', level: 'galaxy' });
  return crumbs;
}
