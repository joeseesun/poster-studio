import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { getPublicStore } from '@/lib/server/public-store';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, title } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: '图片 URL 不能为空' },
        { status: 400 }
      );
    }

    // 生成 6 位短 ID
    const id = nanoid(6);

    const store = getPublicStore();

    // 存储到公开分享存储（60 天过期）
    await store.set(`share:${id}`, {
      imageUrl,
      title: title || `我的海报${id}`,
      createdAt: Date.now(),
    }, {
      ex: 60 * 60 * 24 * 60, // 60 天过期
    });

    // 生成分享 URL（生产环境用域名，本地用相对地址）
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const shareUrl = `${baseUrl}/share/${id}`;

    console.log('✅ 分享创建成功:', { id, shareUrl, title, store: store.provider });

    return NextResponse.json({
      id,
      url: shareUrl,
    });
  } catch (error) {
    console.error('❌ 创建分享失败:', error);
    return NextResponse.json(
      { error: '创建分享失败' },
      { status: 500 }
    );
  }
}
