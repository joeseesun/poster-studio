import { NextRequest, NextResponse } from 'next/server';
import { uploadBlobToQiniu } from '@/lib/server/qiniu';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, apiKey } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少图片 URL' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 Remove.bg API Key' },
        { status: 400 }
      );
    }

    console.log('🎨 开始去除背景:', imageUrl);

    // 1. 调用 Remove.bg API
    const formData = new FormData();
    formData.append('image_url', imageUrl);
    formData.append('size', 'auto');

    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error('❌ Remove.bg API 失败:', errorText);

      // 解析错误信息
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.errors?.[0]?.title || 'Remove.bg API 调用失败' },
          { status: removeBgResponse.status }
        );
      } catch {
        return NextResponse.json(
          { error: `Remove.bg API 调用失败: ${removeBgResponse.status}` },
          { status: removeBgResponse.status }
        );
      }
    }

    console.log('✅ 背景去除成功');

    // 2. 获取去背景后的图片并上传到七牛云
    const imageBlob = await removeBgResponse.blob();
    console.log('✅ 图片下载成功，大小:', (imageBlob.size / 1024).toFixed(2), 'KB');

    const qiniuUrl = await uploadBlobToQiniu({
      blob: imageBlob,
      fileName: 'no-bg.png',
      storagePath: 'xhs-cover',
    });
    console.log('✅ 上传到七牛云成功:', qiniuUrl);

    // 返回七牛云 URL
    return NextResponse.json({
      success: true,
      url: qiniuUrl,
    });
  } catch (error) {
    console.error('❌ 去背景处理失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
