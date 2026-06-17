import { NextResponse } from 'next/server';

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

    // 尝试导入 @vercel/kv
    let kvImportSuccess = false;
    let kvError = null;
    try {
      const { kv } = await import('@vercel/kv');
      kvImportSuccess = true;

      // 尝试简单的 KV 操作
      try {
        await kv.set('test-key', 'test-value', { ex: 10 });
        const value = await kv.get('test-key');
        await kv.del('test-key');

        return NextResponse.json({
          success: true,
          message: 'Vercel KV 配置正确',
          envCheck,
          kvTest: {
            set: true,
            get: value === 'test-value',
            del: true,
          },
        });
      } catch (kvOpError) {
        return NextResponse.json({
          success: false,
          message: 'Vercel KV 操作失败',
          envCheck,
          error: kvOpError instanceof Error ? kvOpError.message : String(kvOpError),
        }, { status: 500 });
      }
    } catch (importError) {
      kvError = importError instanceof Error ? importError.message : String(importError);
    }

    return NextResponse.json({
      success: false,
      message: 'Vercel KV 导入失败',
      envCheck,
      kvImportSuccess,
      kvError,
    }, { status: 500 });
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
