import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { name, dataURL } = await request.json();

    if (!name || !dataURL) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成文件名（与 getThumbnailUrl 保持一致）
    const fileName = name
      .replace(/·/g, '-')      // 中文间隔号 → 连字符
      .replace(/:/g, '-')      // 冒号 → 连字符（用于 16:9, 9:16 等比例）
      .replace(/\s+/g, '-')    // 空格 → 连字符
      .toLowerCase() + '.png';

    // 确保 public/templates 目录存在
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // 将 base64 转换为 Buffer
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 保存文件
    const filePath = path.join(templatesDir, fileName);
    fs.writeFileSync(filePath, buffer);

    console.log(`✅ 缩略图已保存: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`);

    return NextResponse.json({
      success: true,
      fileName,
      size: buffer.length,
    });
  } catch (error) {
    console.error('❌ 保存缩略图失败:', error);
    return NextResponse.json(
      { error: '保存失败', details: String(error) },
      { status: 500 }
    );
  }
}
