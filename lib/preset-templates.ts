/**
 * 预设模板数据
 * 引用卡片风格模板（按画布尺寸分类）
 */

import { Template } from './template-manager';

// 生成缩略图 URL
function getThumbnailUrl(templateName: string): string {
  const fileName = templateName
    .replace(/·/g, '-')
    .replace(/:/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase() + '.png';
  return `/templates/${fileName}`;
}

// 创建引用卡片模板的辅助函数
function createQuoteCard(
  name: string,
  category: '3:4 竖版' | '1:1 方形' | '4:3 横版' | '16:9 横版' | '9:16 竖版' | '21:9 超宽',
  width: number,
  height: number,
  quoteColor: string,
  textColor: string,
  lineColor: string
): Omit<Template, 'id' | 'createdAt'> {
  // 根据画布尺寸计算比例（基准：960×1280）
  const scale = Math.min(width / 960, height / 1280);

  return {
    name,
    category,
    canvasSize: { width, height },
    isPreset: true,
    thumbnail: getThumbnailUrl(name),
    canvasJSON: JSON.stringify({
      version: '5.3.0',
      objects: [
        // 圆角卡片背景
        {
          type: 'rect',
          left: 60 * scale,
          top: 60 * scale,
          width: (width - 120 * scale),
          height: (height - 120 * scale),
          fill: 'rgba(255, 255, 255, 0.75)',
          rx: 32 * scale,
          ry: 32 * scale,
        },
        // 引号装饰（抖音美好体，400字号）
        {
          type: 'i-text',
          left: 100 * scale,
          top: 150 * scale,
          fontSize: 400 * scale,
          fontFamily: '抖音美好体, DouyinSansBold, PingFang SC, Microsoft YaHei, sans-serif',
          fill: quoteColor,
          fontWeight: 'bold',
          text: '"',
        },
        // 主文字（抖音美好体）
        {
          type: 'i-text',
          left: 120 * scale,
          top: 500 * scale,
          fontSize: 80 * scale,
          fontFamily: '抖音美好体, DouyinSansBold, PingFang SC, Microsoft YaHei, sans-serif',
          fill: textColor,
          fontWeight: 'bold',
          text: '点击修改\n文字内容',
          lineHeight: 1.4,
        },
        // 装饰短线（粗细17）
        {
          type: 'line',
          left: width - 200 * scale,
          top: height - 120 * scale,
          x1: 0,
          y1: 0,
          x2: 120 * scale,
          y2: 0,
          stroke: lineColor,
          strokeWidth: 17 * scale,
        },
      ],
    }),
  };
}

// 预设模板列表 - 支持所有画布尺寸的引用卡片
export const PRESET_TEMPLATES: Omit<Template, 'id' | 'createdAt'>[] = [
  // ========== 3:4 竖版 ==========
  createQuoteCard('引用卡片·720×960', '3:4 竖版', 720, 960, '#90CAF9', '#1565C0', '#64B5F6'),
  createQuoteCard('引用卡片·768×1024', '3:4 竖版', 768, 1024, '#90CAF9', '#1565C0', '#64B5F6'),
  createQuoteCard('引用卡片·960×1280', '3:4 竖版', 960, 1280, '#90CAF9', '#1565C0', '#64B5F6'),
  createQuoteCard('引用卡片·1080×1440', '3:4 竖版', 1080, 1440, '#90CAF9', '#1565C0', '#64B5F6'),

  // ========== 1:1 方形 ==========
  createQuoteCard('引用卡片·720×720', '1:1 方形', 720, 720, '#A5D6A7', '#2E7D32', '#81C784'),
  createQuoteCard('引用卡片·960×960', '1:1 方形', 960, 960, '#A5D6A7', '#2E7D32', '#81C784'),
  createQuoteCard('引用卡片·1080×1080', '1:1 方形', 1080, 1080, '#A5D6A7', '#2E7D32', '#81C784'),

  // ========== 4:3 横版 ==========
  createQuoteCard('引用卡片·960×720', '4:3 横版', 960, 720, '#F48FB1', '#C2185B', '#F06292'),
  createQuoteCard('引用卡片·1024×768', '4:3 横版', 1024, 768, '#F48FB1', '#C2185B', '#F06292'),
  createQuoteCard('引用卡片·1280×960', '4:3 横版', 1280, 960, '#F48FB1', '#C2185B', '#F06292'),
  createQuoteCard('引用卡片·1440×1080', '4:3 横版', 1440, 1080, '#F48FB1', '#C2185B', '#F06292'),

  // ========== 16:9 横版 ==========
  createQuoteCard('引用卡片·1280×720', '16:9 横版', 1280, 720, '#FFAB91', '#E64A19', '#FF8A65'),
  createQuoteCard('引用卡片·1920×1080', '16:9 横版', 1920, 1080, '#FFAB91', '#E64A19', '#FF8A65'),
  createQuoteCard('引用卡片·2560×1440', '16:9 横版', 2560, 1440, '#FFAB91', '#E64A19', '#FF8A65'),

  // ========== 9:16 竖版 ==========
  createQuoteCard('引用卡片·720×1280', '9:16 竖版', 720, 1280, '#CE93D8', '#7B1FA2', '#BA68C8'),
  createQuoteCard('引用卡片·1080×1920', '9:16 竖版', 1080, 1920, '#CE93D8', '#7B1FA2', '#BA68C8'),
  createQuoteCard('引用卡片·1440×2560', '9:16 竖版', 1440, 2560, '#CE93D8', '#7B1FA2', '#BA68C8'),

  // ========== 21:9 超宽 ==========
  createQuoteCard('引用卡片·1680×720', '21:9 超宽', 1680, 720, '#80DEEA', '#00838F', '#4DD0E1'),
  createQuoteCard('引用卡片·2100×900', '21:9 超宽', 2100, 900, '#80DEEA', '#00838F', '#4DD0E1'),
  createQuoteCard('引用卡片·2560×1080', '21:9 超宽', 2560, 1080, '#80DEEA', '#00838F', '#4DD0E1'),
  createQuoteCard('引用卡片·3440×1440', '21:9 超宽', 3440, 1440, '#80DEEA', '#00838F', '#4DD0E1'),
  createQuoteCard('引用卡片·5120×2160', '21:9 超宽', 5120, 2160, '#80DEEA', '#00838F', '#4DD0E1'),
];
