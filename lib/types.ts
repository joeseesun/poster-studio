// 类型定义文件
export interface CanvasVersion {
  id: string;
  name: string;
  data: string;              // Fabric.js JSON
  canvasSize?: CanvasSize;   // 当前画布尺寸
  thumbnail?: string;        // Base64
  createdAt: number;
  updatedAt: number;
}

export interface HighlightConfig {
  text: string;
  type: 'marker' | 'underline' | 'box';
  color: string;
  fontSize?: number;
  fontFamily?: string;
  left?: number;
  top?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface FontConfig {
  name: string;
  family: string;
  weight: number[];
  preview: string;  // 预览文字
  loaded?: boolean; // 是否已加载
  customUrl?: string; // 🆕 自定义字体 CDN URL
  cssPath?: string; // 🆕 npm 包的 CSS 路径（相对于 node_modules）
}

export const HIGHLIGHT_COLORS = [
  '#FFEB3B', // 黄色
  '#4CAF50', // 绿色
  '#2196F3', // 蓝色
  '#E91E63', // 粉色
  '#FF5722', // 橙色
];

export const LOCAL_OR_SYSTEM_FONTS = [
  'Noto Sans SC',
  'Noto Serif SC',
  'ZCOOL KuaiLe',
  'Georgia',
  'Playfair Display',
  'Merriweather',
  'Lora',
  'Roboto',
  'Arial, sans-serif',
] as const;

// 精选字体（中文 + 英文）- 按使用频率和热度排序
export const FONTS: FontConfig[] = [
  // 🔥 热门中文字体（第 1 页）
  { name: '霞鹜文楷', family: 'LXGW WenKai', weight: [400, 700], preview: '设计', cssPath: '@chinese-fonts/lxgwwenkai/dist/LXGWWenKai-Regular/result.css' },
  { name: '汇文明朝体', family: 'Huiwen-mincho', weight: [400], preview: '设计', cssPath: '@chinese-fonts/hwmct/dist/汇文明朝体/result.css' },
  { name: '抖音美好体', family: 'Douyin Sans', weight: [700], preview: '设计', cssPath: '@chinese-fonts/dymh/dist/DouyinSansBold/result.css' },

  // 🔥 常用中文字体（第 2-3 页）
  { name: '思源黑体', family: 'Noto Sans SC', weight: [400, 700], preview: '设计' },
  { name: '思源宋体', family: 'Noto Serif SC', weight: [400, 700], preview: '设计' },
  { name: '站酷快乐体', family: 'ZCOOL KuaiLe', weight: [400], preview: '设计' },
  { name: '优设标题黑', family: 'YouSheBiaoTiHei', weight: [400], preview: '设计', cssPath: '@chinese-fonts/ysbth/dist/优设标题黑/result.css' },
  { name: '得意黑', family: 'Smiley Sans Oblique', weight: [400], preview: '设计', cssPath: '@chinese-fonts/dyh/dist/SmileySans-Oblique/result.css' },
  { name: '斗鱼追光体', family: 'DOUYU Font', weight: [400], preview: '设计', cssPath: '@chinese-fonts/dyzgt/dist/斗鱼追光体/result.css' },

  // 🎨 特色中文字体（第 4-5 页）- npm 包
  { name: '上图东观体', family: 'STDongGuanTi Bld', weight: [400], preview: '设计', cssPath: '@chinese-fonts/stdgt/dist/上图东观体-粗体/result.css' },
  { name: '千图笔锋手写体', family: 'qiantubifengshouxieti', weight: [400], preview: '设计', cssPath: '@chinese-fonts/qtbfsxt/dist/千图笔锋手写体/result.css' },
  { name: '鸿雷行书简体', family: 'hongleixingshu', weight: [400], preview: '设计', cssPath: '@chinese-fonts/hlxsjt/dist/鸿雷行书简体/result.css' },
  { name: '全小素', family: 'QuanPixel 8px', weight: [600], preview: '设计', cssPath: '@chinese-fonts/qxs/dist/quan/result.css' },
  { name: '铁蒺藜体', family: 'Tiejili', weight: [400], preview: '设计', cssPath: '@chinese-fonts/tjl/dist/Tiejili_Regular/result.css' },
  { name: '精品點陣體', family: 'BoutiqueBitmap7x7 1.6', weight: [400], preview: '设计', cssPath: '@chinese-fonts/jpdzt/dist/BoutiqueBitmap7x7_1_6/result.css' },

  // 🌟 个性中文字体（第 6 页）- npm 包
  { name: '寒蝉全圆体', family: '寒蝉全圆体', weight: [400], preview: '设计', cssPath: '@chinese-fonts/hcqyt/dist/ChillRoundFRegular/result.css' },
  { name: '悠哉', family: 'Yozai', weight: [400, 700], preview: '设计', cssPath: '@chinese-fonts/yozai/dist/Yozai-Regular/result.css' },
  { name: '小赖体', family: 'Xiaolai SC', weight: [400], preview: '设计', cssPath: '@chinese-fonts/xiaolai/dist/Xiaolai/result.css' },
  { name: '霞鹜漫黑', family: 'LXGW Marker Gothic', weight: [400], preview: '设计', cssPath: '@chinese-fonts/lxgwmanhei/dist/LXGWMarkerGothic/result.css' },
  { name: '猫啃网糖圆体', family: 'MaoKenTangYuan (beta)', weight: [400], preview: '设计', cssPath: '@chinese-fonts/mkwtyt/dist/MaoKenTangYuan/result.css' },
  { name: '演示佛系体', family: 'Slidefu', weight: [400], preview: '设计', cssPath: '@chinese-fonts/ysfxt/dist/Slidefu-Regular/result.css' },
  { name: '演示悠然小楷', family: 'slideyouran', weight: [400], preview: '设计', cssPath: '@chinese-fonts/ysyrxk/dist/slideyouran-Regular2_0/result.css' },
  { name: '字魂扁桃体', family: 'zihunbiantaoti', weight: [400], preview: '设计', cssPath: '@chinese-fonts/zhbtt/dist/字魂扁桃体/result.css' },
  { name: '有字库龙藏体', family: 'Long Cang', weight: [400], preview: '设计', cssPath: '@chinese-fonts/yzklct/dist/有字库龙藏体/result.css' },
  { name: '标小智龙珠体', family: 'LogoSC LongZhuTi', weight: [400], preview: '设计', cssPath: '@chinese-fonts/bxzlzt/dist/标小智龙珠体/result.css' },

  // 🆕 自定义 CDN 字体（第 6 页）
  {
    name: '京华老宋体',
    family: 'KingHwaOldSong',
    weight: [400],
    preview: '设计',
    customUrl: 'https://fontsapi.zeoseven.com/309/main/result.css'
  },
  {
    name: '朱雀仿宋',
    family: 'Zhuque Fangsong (technical preview)',
    weight: [400],
    preview: '设计',
    customUrl: 'https://fontsapi.zeoseven.com/7/main/result.css'
  },
  {
    name: 'Maple Mono',
    family: 'Maple Mono NF CN',
    weight: [400],
    preview: 'Code',
    customUrl: 'https://fontsapi.zeoseven.com/442/main/result.css'
  },

  // 🆕 本地/系统英文字体（第 7-8 页）
  { name: 'Georgia', family: 'Georgia', weight: [400, 700], preview: 'Design' },
  { name: 'Playfair', family: 'Playfair Display', weight: [400, 700], preview: 'Design' },
  { name: 'Merriweather', family: 'Merriweather', weight: [400, 700], preview: 'Design' },
  { name: 'Lora', family: 'Lora', weight: [400, 700], preview: 'Design' },
  { name: 'Roboto', family: 'Roboto', weight: [400, 700], preview: 'Design' },
];

// 画布尺寸配置
export interface CanvasSize {
  name: string;
  width: number;
  height: number;
  ratio: string;
}

export const CANVAS_RATIOS = {
  '3:4': [
    { name: '720×960', width: 720, height: 960, ratio: '3:4' },
    { name: '768×1024', width: 768, height: 1024, ratio: '3:4' },
    { name: '960×1280', width: 960, height: 1280, ratio: '3:4' },
    { name: '1080×1440', width: 1080, height: 1440, ratio: '3:4' },
  ],
  '1:1': [
    { name: '720×720', width: 720, height: 720, ratio: '1:1' },
    { name: '960×960', width: 960, height: 960, ratio: '1:1' },
    { name: '1080×1080', width: 1080, height: 1080, ratio: '1:1' },
  ],
  '4:3': [
    { name: '960×720', width: 960, height: 720, ratio: '4:3' },
    { name: '1024×768', width: 1024, height: 768, ratio: '4:3' },
    { name: '1280×960', width: 1280, height: 960, ratio: '4:3' },
    { name: '1440×1080', width: 1440, height: 1080, ratio: '4:3' },
  ],
  '16:9': [
    { name: '1280×720', width: 1280, height: 720, ratio: '16:9' },
    { name: '1920×1080', width: 1920, height: 1080, ratio: '16:9' },
    { name: '2560×1440', width: 2560, height: 1440, ratio: '16:9' },
  ],
  '21:9': [
    { name: '1680×720', width: 1680, height: 720, ratio: '21:9' },
    { name: '2100×900', width: 2100, height: 900, ratio: '21:9' },
    { name: '2560×1080', width: 2560, height: 1080, ratio: '21:9' },
    { name: '3440×1440', width: 3440, height: 1440, ratio: '21:9' },
    { name: '5120×2160', width: 5120, height: 2160, ratio: '21:9' },
  ],
  '9:16': [
    { name: '720×1280', width: 720, height: 1280, ratio: '9:16' },
    { name: '1080×1920', width: 1080, height: 1920, ratio: '9:16' },
    { name: '1440×2560', width: 1440, height: 2560, ratio: '9:16' },
  ],
};

// 默认画布尺寸（960×1280, 3:4）
export const DEFAULT_CANVAS_SIZE = CANVAS_RATIOS['3:4'][2];
export const CANVAS_WIDTH = DEFAULT_CANVAS_SIZE.width;
export const CANVAS_HEIGHT = DEFAULT_CANVAS_SIZE.height;

// 颜色系统
export const COLORS = {
  primary: '#FF2442',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
  },
  icon: {
    default: '#6B7280',
    hover: '#1F2937',
    active: '#FF2442',
    disabled: '#9CA3AF',
  }
};
