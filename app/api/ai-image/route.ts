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
    const { prompt, size = '1024x1024' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少提示词' },
        { status: 400 }
      );
    }

    const config = resolveAIProviderConfig(body);
    const payload = buildImageGenerationPayload({
      config,
      prompt,
      size,
    });

    console.log('开始调用 AI 生图 API', {
      provider: config.providerId,
      endpoint: config.endpoint,
      model: config.modelId,
      requestFormat: config.requestFormat,
      size,
    });

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: buildAIHeaders(config),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API 返回错误', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return NextResponse.json(
        { error: `AI API 错误 (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    const aiImageUrl = extractImageUrl(result);
    const persisted = await persistRemoteImageToQiniu(
      aiImageUrl,
      'ai-generated.jpg',
      'ai-images'
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
    console.error('AI 生图处理失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
