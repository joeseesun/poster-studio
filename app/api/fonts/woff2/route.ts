import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * API 路由：提供 npm 包中的 WOFF2 字体文件
 *
 * 用法：/api/fonts/woff2?path=@chinese-fonts/yozai/dist/Yozai-Regular/xxx.woff2
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const woff2Path = searchParams.get('path');

    console.log('📥 WOFF2 字体文件请求:', woff2Path);

    if (!woff2Path) {
      console.error('❌ 缺少 path 参数');
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    // 安全检查：只允许 @chinese-fonts/ 开头的路径
    if (!woff2Path.startsWith('@chinese-fonts/')) {
      console.error('❌ 非法路径:', woff2Path);
      return NextResponse.json(
        { error: 'Invalid path: only @chinese-fonts/ packages are allowed' },
        { status: 403 }
      );
    }

    // 安全检查：只允许 .woff2 文件
    if (!woff2Path.endsWith('.woff2')) {
      console.error('❌ 非法文件类型:', woff2Path);
      return NextResponse.json(
        { error: 'Invalid file type: only .woff2 files are allowed' },
        { status: 403 }
      );
    }

    // 读取 WOFF2 文件
    const filePath = join(process.cwd(), 'node_modules', woff2Path);
    console.log('📂 读取文件:', filePath);

    const fileBuffer = await readFile(filePath);
    console.log('✅ WOFF2 文件加载成功:', woff2Path, `(${fileBuffer.length} bytes)`);

    // 返回 WOFF2 文件（将 Buffer 转换为 Uint8Array）
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'font/woff2',
        'Cache-Control': 'public, max-age=31536000, immutable', // 缓存 1 年
        'Access-Control-Allow-Origin': '*', // 允许跨域
      },
    });
  } catch (error) {
    console.error('❌ WOFF2 文件加载失败:', error);
    return NextResponse.json(
      { error: 'WOFF2 file not found', details: error instanceof Error ? error.message : String(error) },
      { status: 404 }
    );
  }
}
