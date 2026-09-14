import { MediaItem, SeasonInfo } from '../types';

export const DEMO_SAMPLE_STREAMS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

export const DEMO_MEDIA_ITEMS: MediaItem[] = [
  {
    Id: 'demo-movie-1',
    Name: '星际穿越 (Interstellar)',
    OriginalTitle: 'Interstellar',
    Type: 'Movie',
    ProductionYear: 2014,
    CommunityRating: 9.4,
    RunTimeTicks: 101400000000, // 169 mins
    Overview: '近未来的地球黄沙遍野，小麦、秋葵等基础农作物相继因枯萎病灭绝，人类不再为科学进步所动，只求生存。前NASA宇航员库珀在女儿墨菲的房间发现了奇特重力异常，随后被指引前往秘密实验室，参加一项穿越虫洞寻找人类新家园的绝密计划。',
    Taglines: ['人类生于地球，但绝不应该在这里消亡。'],
    Genres: ['科幻', '冒险', '剧情'],
    PrimaryImageTag: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    BackdropImageTags: ['https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80'],
    UserData: {
      PlaybackPositionTicks: 25400000000, // ~42 mins
      PlayCount: 2,
      Played: false,
      IsFavorite: true,
    },
    MediaStreams: [
      { Type: 'Video', Codec: 'HEVC 10-bit', DisplayTitle: '4K HDR (3840x2160)', Index: 0, Width: 3840, Height: 2160 },
      { Type: 'Audio', Codec: 'TrueHD Atmos', DisplayTitle: 'English Dolby Atmos 7.1', Language: 'eng', Index: 1 },
      { Type: 'Audio', Codec: 'AAC', DisplayTitle: '国语配音 DD 5.1', Language: 'chi', Index: 2 },
      { Type: 'Subtitle', DisplayTitle: '简体中文 (特效)', Language: 'chi', Index: 3 },
      { Type: 'Subtitle', DisplayTitle: '中英双语 (ASS)', Language: 'chi', Index: 4 },
    ],
    StreamUrl: DEMO_SAMPLE_STREAMS[0],
  },
  {
    Id: 'demo-movie-2',
    Name: '奥本海默 (Oppenheimer)',
    OriginalTitle: 'Oppenheimer',
    Type: 'Movie',
    ProductionYear: 2023,
    CommunityRating: 8.9,
    RunTimeTicks: 108000000000, // 180 mins
    Overview: '讲述了美国理论物理学家罗伯特·奥本海默主导制造出世界上第一颗原子弹“曼哈顿计划”的历史故事，以及战后他在听证会上面临的严峻政治审判与良心冲突。',
    Taglines: ['如今我成为死神，世界的毁灭者。'],
    Genres: ['传记', '历史', '剧情'],
    PrimaryImageTag: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    BackdropImageTags: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80'],
    UserData: {
      PlaybackPositionTicks: 45000000000, // 75 mins
      PlayCount: 1,
      Played: false,
      IsFavorite: true,
    },
    MediaStreams: [
      { Type: 'Video', Codec: 'HEVC', DisplayTitle: '4K IMAX (3840x1714)', Index: 0, Width: 3840, Height: 1714 },
      { Type: 'Audio', Codec: 'DTS-HD MA', DisplayTitle: 'English DTS-HD 5.1', Language: 'eng', Index: 1 },
      { Type: 'Subtitle', DisplayTitle: '官方中字 (SUP)', Language: 'chi', Index: 2 },
    ],
    StreamUrl: DEMO_SAMPLE_STREAMS[1],
  },
  {
    Id: 'demo-movie-3',
    Name: '流浪地球 2 (The Wandering Earth II)',
    OriginalTitle: 'The Wandering Earth II',
    Type: 'Movie',
    ProductionYear: 2023,
    CommunityRating: 8.8,
    RunTimeTicks: 103800000000,
    Overview: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出，展开争分夺秒的生死之战。',
    Taglines: ['危难当前，唯有责任。'],
    Genres: ['科幻', '灾难', '动作'],
    PrimaryImageTag: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    BackdropImageTags: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80'],
    UserData: {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      Played: false,
      IsFavorite: false,
    },
    MediaStreams: [
      { Type: 'Video', Codec: 'H.264', DisplayTitle: '1080P 高清 (1920x1080)', Index: 0, Width: 1920, Height: 1080 },
      { Type: 'Audio', Codec: 'Dolby Digital', DisplayTitle: '普通话 Atmos', Language: 'chi', Index: 1 },
      { Type: 'Subtitle', DisplayTitle: '中英双语', Language: 'chi', Index: 2 },
    ],
    StreamUrl: DEMO_SAMPLE_STREAMS[2],
  },
  {
    Id: 'demo-series-1',
    Name: '三体 (Three-Body)',
    OriginalTitle: 'Three-Body',
    Type: 'Series',
    ProductionYear: 2023,
    CommunityRating: 8.7,
    Overview: '2007年，地球基础科学出现了异常的扰动，科学界人心惶惶。纳米科学家汪淼与刑警史强联手调查数十名顶尖物理学家离奇自杀之谜，逐步揭开名为“三体”的地外文明与全人类存亡的惊天浩劫。',
    Genres: ['科幻', '悬疑', '剧情'],
    PrimaryImageTag: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    BackdropImageTags: ['https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80'],
    UserData: {
      Played: false,
      IsFavorite: true,
    },
    MediaStreams: [
      { Type: 'Video', Codec: 'HEVC', DisplayTitle: '4K 超清 60FPS', Index: 0 },
      { Type: 'Audio', Codec: 'AAC', DisplayTitle: '国语原声', Language: 'chi', Index: 1 },
    ],
    StreamUrl: DEMO_SAMPLE_STREAMS[3],
  },
  {
    Id: 'demo-movie-4',
    Name: '攻壳机动队 (Ghost in the Shell)',
    OriginalTitle: 'Ghost in the Shell',
    Type: 'Movie',
    ProductionYear: 1995,
    CommunityRating: 9.1,
    RunTimeTicks: 49200000000, // 82 mins
    Overview: '在公元2029年的高科技未来，全世界被巨大的电子网络连结在一起。公安九课生化人队长草薙素子在追查神秘黑客“傀儡师”的过程中，开始反思自己存在与灵魂的本质。',
    Taglines: ['信息网络的汪洋大海无边无际。'],
    Genres: ['动画', '赛博朋克', '科幻'],
    PrimaryImageTag: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    BackdropImageTags: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80'],
    UserData: {
      PlaybackPositionTicks: 12000000000,
      PlayCount: 3,
      Played: true,
      IsFavorite: true,
    },
    MediaStreams: [
      { Type: 'Video', Codec: 'AVC', DisplayTitle: '1080P BDRip', Index: 0 },
      { Type: 'Audio', Codec: 'FLAC', DisplayTitle: '日语原声 5.1', Language: 'jpn', Index: 1 },
      { Type: 'Subtitle', DisplayTitle: '简体中文特效', Language: 'chi', Index: 2 },
    ],
    StreamUrl: DEMO_SAMPLE_STREAMS[0],
  },
];

export const DEMO_SEASONS: SeasonInfo[] = [
  { Id: 'demo-season-1', Name: '第 1 季 (全30集)', IndexNumber: 1, SeriesId: 'demo-series-1' },
];

export const DEMO_EPISODES: MediaItem[] = [
  {
    Id: 'demo-ep-1',
    Name: '第 1 集：科学边界',
    Type: 'Episode',
    SeriesName: '三体',
    SeriesId: 'demo-series-1',
    SeasonName: '第 1 季',
    SeasonId: 'demo-season-1',
    IndexNumber: 1,
    ParentIndexNumber: 1,
    RunTimeTicks: 27000000000, // 45 mins
    Overview: '多名顶尖物理学家接连自杀，常伟思将军与史强找上纳米学者汪淼，邀请其加入军方针对“科学边界”学会的秘密调查。汪淼在杨冬墓前偶遇丁仪，首次触碰“物理学不存在了”的残酷假说。',
    PrimaryImageTag: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    UserData: {
      PlaybackPositionTicks: 18000000000, // 30 mins (Continue Watching)
      Played: false,
    },
    StreamUrl: DEMO_SAMPLE_STREAMS[3],
  },
  {
    Id: 'demo-ep-2',
    Name: '第 2 集：幽灵倒计时',
    Type: 'Episode',
    SeriesName: '三体',
    SeriesId: 'demo-series-1',
    SeasonName: '第 1 季',
    SeasonId: 'demo-season-1',
    IndexNumber: 2,
    ParentIndexNumber: 1,
    RunTimeTicks: 28200000000, // 47 mins
    Overview: '汪淼的眼睛和胶片照片中突然出现了神秘诡异的幽灵倒计时，申玉菲告知他若停止纳米实验倒计时便会停止。汪淼在震惊与恐慌中目睹倒计时如影随形。',
    PrimaryImageTag: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    UserData: {
      PlaybackPositionTicks: 0,
      Played: false,
    },
    StreamUrl: DEMO_SAMPLE_STREAMS[0],
  },
  {
    Id: 'demo-ep-3',
    Name: '第 3 集：宇宙为你闪烁',
    Type: 'Episode',
    SeriesName: '三体',
    SeriesId: 'demo-series-1',
    SeasonName: '第 1 季',
    SeasonId: 'demo-season-1',
    IndexNumber: 3,
    ParentIndexNumber: 1,
    RunTimeTicks: 27600000000,
    Overview: '汪淼根据提示前往射电天文观测基地，在漫天繁星下亲眼见证了宇宙微波背景辐射如同霓虹灯般整齐闪烁，世界观彻底崩溃。',
    PrimaryImageTag: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    UserData: {
      PlaybackPositionTicks: 0,
      Played: false,
    },
    StreamUrl: DEMO_SAMPLE_STREAMS[1],
  },
  {
    Id: 'demo-ep-4',
    Name: '第 4 集：乱纪元与恒纪元',
    Type: 'Episode',
    SeriesName: '三体',
    SeriesId: 'demo-series-1',
    SeasonName: '第 1 季',
    SeasonId: 'demo-season-1',
    IndexNumber: 4,
    ParentIndexNumber: 1,
    RunTimeTicks: 28800000000,
    Overview: '汪淼戴上V装具进入《三体》虚拟现实游戏，身处周文王时代的三体世界，见识到了金字塔下的脱水复活与严酷诡谲的三日凌空。',
    PrimaryImageTag: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    UserData: {
      PlaybackPositionTicks: 0,
      Played: false,
    },
    StreamUrl: DEMO_SAMPLE_STREAMS[2],
  },
];
