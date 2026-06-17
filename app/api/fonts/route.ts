import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * API 路由：提供 npm 包中的字体 CSS 文件
 *
 * 用法：/api/fonts?path=@chinese-fonts/yozai/dist/Yozai-Regular/result.css
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cssPath = searchParams.get('path');

    console.log('📥 字体 CSS 请求:', cssPath);

    if (!cssPath) {
      console.error('❌ 缺少 path 参数');
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    // 安全检查：只允许 @chinese-fonts/ 开头的路径
    if (!cssPath.startsWith('@chinese-fonts/')) {
      console.error('❌ 非法路径:', cssPath);
      return NextResponse.json(
        { error: 'Invalid path: only @chinese-fonts/ packages are allowed' },
        { status: 403 }
      );
    }

    // 读取 CSS 文件
    const filePath = join(process.cwd(), 'node_modules', cssPath);
    console.log('📂 读取文件:', filePath);

    let cssContent = await readFile(filePath, 'utf-8');
    console.log('✅ 字体 CSS 加载成功:', cssPath, `(${cssContent.length} bytes)`);

    // 🔥 修复相对路径：将 CSS 中的相对路径（如 ./xxx.woff2）替换为绝对路径
    // 例如：@chinese-fonts/dyzgt/dist/斗鱼追光体/result.css
    // 字体文件在同一目录下，需要替换为 /api/fonts/woff2?path=@chinese-fonts/dyzgt/dist/斗鱼追光体/xxx.woff2
    const cssDir = cssPath.substring(0, cssPath.lastIndexOf('/'));
    console.log('📁 CSS 目录:', cssDir);
    console.log('📄 原始 CSS 前 200 字符:', cssContent.substring(0, 200));

    let replacementCount = 0;
    cssContent = cssContent.replace(
      /url\(["']?\.\/([^"')\s]+)["']?\)/g,
      (match, filename) => {
        const woff2Path = `${cssDir}/${filename}`;
        const replacement = `url('/api/fonts/woff2?path=${encodeURIComponent(woff2Path)}')`;
        replacementCount++;
        if (replacementCount <= 3) {
          console.log(`🔄 替换 ${replacementCount}:`, match, '->', replacement);
        }
        return replacement;
      }
    );
    console.log(`🔧 已修复 CSS 中的相对路径，共替换 ${replacementCount} 处`);
    console.log('📄 修复后 CSS 前 500 字符:', cssContent.substring(0, 500));

    // 返回 CSS 内容
    return new NextResponse(cssContent, {
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable', // 缓存 1 年
      },
    });
  } catch (error) {
    console.error('❌ 字体 CSS 加载失败:', error);
    return NextResponse.json(
      { error: 'Font CSS not found', details: error instanceof Error ? error.message : String(error) },
      { status: 404 }
    );
  }
}
