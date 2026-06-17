import { NextResponse } from 'next/server';
import { getPublicStore } from '@/lib/server/public-store';

export async function GET() {
  try {
    // 检查环境变量
    const envCheck = {
      KV_URL: !!process.env.KV_URL,
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT_SET',
    };

    console.log('🔍 环境变量检查:', envCheck);

    const store = getPublicStore();
    const testKey = `test-key-${Date.now()}`;
    await store.set(testKey, 'test-value', { ex: 10 });
    const value = await store.get<string>(testKey);
    await store.del(testKey);

    return NextResponse.json({
      success: value === 'test-value',
      message: value === 'test-value' ? '公开分享存储可用' : '公开分享存储读写异常',
      envCheck,
      storeProvider: store.provider,
      storageTest: {
        set: true,
        get: value === 'test-value',
        del: true,
      },
    }, { status: value === 'test-value' ? 200 : 500 });
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
