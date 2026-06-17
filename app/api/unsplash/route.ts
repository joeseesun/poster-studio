/**
 * Unsplash API 代理
 * 避免在客户端暴露 Access Key
 */

import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_API_BASE = 'https://api.unsplash.com';

export async function GET(request: NextRequest) {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json(
        { error: '缺少 UNSPLASH_ACCESS_KEY 环境变量' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    console.log('🔍 [Unsplash Proxy] 收到请求:', { action });

    if (action === 'random') {
      // 获取随机图片
      const count = searchParams.get('count') || '10';
      const query = searchParams.get('query');

      const url = new URL(`${UNSPLASH_API_BASE}/photos/random`);
      url.searchParams.append('count', count);
      if (query) {
        url.searchParams.append('query', query);
      }

      console.log('🎲 [Unsplash Proxy] 获取随机图片:', { count, query, url: url.toString() });

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      });

      console.log('📡 [Unsplash Proxy] 响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Unsplash Proxy] 错误:', errorText);
        return NextResponse.json(
          { error: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);

    } else if (action === 'search') {
      // 搜索图片
      const query = searchParams.get('query');
      const page = searchParams.get('page') || '1';
      const perPage = searchParams.get('per_page') || '20';

      if (!query) {
        return NextResponse.json(
          { error: 'Missing query parameter' },
          { status: 400 }
        );
      }

      const url = new URL(`${UNSPLASH_API_BASE}/search/photos`);
      url.searchParams.append('query', query);
      url.searchParams.append('page', page);
      url.searchParams.append('per_page', perPage);

      console.log('🔍 [Unsplash Proxy] 搜索图片:', { query, page, perPage });

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      });

      console.log('📡 [Unsplash Proxy] 响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Unsplash Proxy] 错误:', errorText);
        return NextResponse.json(
          { error: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);

    } else if (action === 'download') {
      // 触发下载统计
      const downloadLocation = searchParams.get('url');

      if (!downloadLocation) {
        return NextResponse.json(
          { error: 'Missing url parameter' },
          { status: 400 }
        );
      }

      await fetch(downloadLocation, {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      });

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ [Unsplash Proxy] 异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
