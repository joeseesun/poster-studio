import { NextRequest, NextResponse } from 'next/server';
import {
  buildAIHeaders,
  buildImageGenerationPayload,
  extractImageUrl,
  resolveAIProviderConfig,
} from '@/lib/server/ai-provider';
import { persistRemoteImageToQiniu } from '@/lib/server/qiniu';

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

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: buildAIHeaders(config),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI 图生图 API 错误', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return NextResponse.json(
        { error: `API请求失败: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const originalUrl = extractImageUrl(data);
    const persisted = await persistRemoteImageToQiniu(
      originalUrl,
      'ai-transformed.jpg',
      'xhs-cover'
    );

    return NextResponse.json({
      data: [
        {
          url: persisted.url,
          original_url: persisted.originalUrl,
          persisted: persisted.persisted,
        },
      ],
    });
  } catch (error) {
    console.error('图片转换 API 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
