import { NextRequest, NextResponse } from 'next/server';
import {
  buildImageGenerationPayload,
  requestAIImageUrl,
  resolveAIProviderConfig,
} from '@/lib/server/ai-provider';
import { persistRemoteImageToQiniu } from '@/lib/server/qiniu';
import { checkBuiltInAIRequestAccess } from '@/lib/server/ai-image-access';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, image, size = '2K' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const access = checkBuiltInAIRequestAccess(request, body);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error || '内置 AI 生图服务暂不可用' },
        { status: access.status || 403, headers: access.headers }
      );
    }

    const config = resolveAIProviderConfig(body);
    const payload = buildImageGenerationPayload({
      config,
      prompt,
      image,
      size,
    });

    console.log('代理图片转换请求', {
      provider: config.providerId,
      endpoint: config.endpoint,
      model: config.modelId,
      requestFormat: config.requestFormat,
      imageCount: Array.isArray(image) ? image.length : 1,
      size,
    });

    const originalUrl = await requestAIImageUrl(config, payload);
    const persisted = await persistRemoteImageToQiniu(
      originalUrl,
      'ai-transformed.jpg',
      'xhs-cover'
    );

    return NextResponse.json(
      {
        data: [
          {
            url: persisted.url,
            original_url: persisted.originalUrl,
            persisted: persisted.persisted,
          },
        ],
      },
      { headers: access.headers }
    );
  } catch (error) {
    console.error('图片转换 API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
