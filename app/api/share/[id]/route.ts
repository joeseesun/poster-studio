import { NextRequest, NextResponse } from 'next/server';
import { getPublicStore } from '@/lib/server/public-store';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const data = await getPublicStore().get(`share:${params.id}`);

    if (!data) {
      return NextResponse.json(
        { error: '分享不存在或已过期' },
        { status: 404 }
      );
    }

    console.log('✅ 获取分享成功:', params.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ 获取分享失败:', error);
    return NextResponse.json(
      { error: '获取分享失败' },
      { status: 500 }
    );
  }
}
