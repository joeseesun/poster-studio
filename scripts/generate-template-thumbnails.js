/**
 * 生成预设模板缩略图到 public/templates/ 目录
 * 使用 node-canvas 在服务端生成缩略图
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 导入预设模板（需要转换为 CommonJS）
const PRESET_TEMPLATES = require('./preset-templates-data.json');

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '../public/templates');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 背景色映射
const backgroundColorMap = {
  // 3:4 竖版
  '便签纸·黄色': '#FFFBEA',
  '引用卡片·蓝色': '#E3F2FD',
  '极简文字·白色': '#FFFFFF',
  '便签纸·粉色': '#FFF0F5',
  '引用卡片·绿色': '#E8F5E9',
  // 4:3 横版
  '便签纸·黄色·横版': '#FFFBEA',
  '引用卡片·蓝色·横版': '#E3F2FD',
  // 1:1 方形
  '极简文字·白色·方形': '#FFFFFF',
  '便签纸·粉色·方形': '#FFF0F5',
  // 16:9 横版
  '极简文字·白色·16:9': '#FFFFFF',
  // 9:16 竖版
  '便签纸·黄色·9:16': '#FFFBEA',
};

// 生成文件名（安全的文件名）
function getTemplateFileName(templateName) {
  return templateName
    .replace(/·/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase() + '.png';
}

// 简化版渲染（只渲染背景色和基本形状）
function generateSimpleThumbnail(template) {
  const { width, height } = template.canvasSize;
  const scale = 0.2; // 缩略图缩放比例

  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext('2d');

  // 设置背景色
  const bgColor = backgroundColorMap[template.name] || '#FFFFFF';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 解析 JSON 并渲染基本元素
  try {
    // canvasJSON 可能已经是对象或字符串
    const canvasData = typeof template.canvasJSON === 'string'
      ? JSON.parse(template.canvasJSON)
      : template.canvasJSON;

    if (canvasData.objects && Array.isArray(canvasData.objects)) {
      canvasData.objects.forEach(obj => {
        ctx.save();

        // 应用缩放
        const left = (obj.left || 0) * scale;
        const top = (obj.top || 0) * scale;

        if (obj.type === 'rect') {
          // 绘制矩形
          const rectWidth = (obj.width || 0) * scale;
          const rectHeight = (obj.height || 0) * scale;

          if (obj.fill && obj.fill !== 'transparent') {
            ctx.fillStyle = obj.fill;
            if (obj.opacity) ctx.globalAlpha = obj.opacity;

            if (obj.rx || obj.ry) {
              // 圆角矩形
              const radius = (obj.rx || obj.ry || 0) * scale;
              ctx.beginPath();
              ctx.roundRect(left, top, rectWidth, rectHeight, radius);
              ctx.fill();
            } else {
              ctx.fillRect(left, top, rectWidth, rectHeight);
            }
          }

          if (obj.stroke) {
            ctx.strokeStyle = obj.stroke;
            ctx.lineWidth = (obj.strokeWidth || 1) * scale;
            if (obj.opacity) ctx.globalAlpha = obj.opacity;

            if (obj.rx || obj.ry) {
              const radius = (obj.rx || obj.ry || 0) * scale;
              ctx.beginPath();
              ctx.roundRect(left, top, rectWidth, rectHeight, radius);
              ctx.stroke();
            } else {
              ctx.strokeRect(left, top, rectWidth, rectHeight);
            }
          }
        } else if (obj.type === 'i-text' || obj.type === 'text') {
          // 绘制文本
          const fontSize = (obj.fontSize || 16) * scale;
          const fontFamily = obj.fontFamily || 'Arial';
          const fontWeight = obj.fontWeight || 'normal';

          ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = obj.fill || '#000000';
          ctx.textAlign = obj.textAlign || 'left';

          const text = obj.text || '';
          const lines = text.split('\n');
          const lineHeight = fontSize * (obj.lineHeight || 1.2);

          lines.forEach((line, index) => {
            ctx.fillText(line, left, top + fontSize + (index * lineHeight));
          });
        }

        ctx.restore();
      });
    }
  } catch (error) {
    console.error('❌ 渲染模板失败:', template.name, error.message);
  }

  return canvas;
}

// 生成所有缩略图
async function generateAllThumbnails() {
  console.log('🎨 开始生成预设模板缩略图...\n');

  let successCount = 0;
  let failCount = 0;

  for (const template of PRESET_TEMPLATES) {
    try {
      const fileName = getTemplateFileName(template.name);
      const filePath = path.join(OUTPUT_DIR, fileName);

      console.log(`📝 生成: ${template.name} -> ${fileName}`);

      // 生成缩略图
      const canvas = generateSimpleThumbnail(template);

      // 保存为 PNG
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filePath, buffer);

      console.log(`✅ 成功: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ 失败: ${template.name}`, error.message, '\n');
      failCount++;
    }
  }

  console.log('━'.repeat(50));
  console.log(`✅ 生成完成！成功: ${successCount}, 失败: ${failCount}`);
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
}

// 执行
generateAllThumbnails().catch(console.error);
