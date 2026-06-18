import { NextRequest, NextResponse } from 'next/server';
import {
  AIImageJobRequestBody,
  createAIImageJob,
  getAIImageJob,
  validateAIImageJobInput,
} from '@/lib/server/ai-image-jobs';
import { checkBuiltInAIRequestAccess } from '@/lib/server/ai-image-access';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AIImageJobRequestBody;
    const validationError = validateAIImageJobInput('image-to-image', body);

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
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

    const job = createAIImageJob('image-to-image', body);
    return NextResponse.json({ job }, { status: 202, headers: access.headers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')?.trim();

  if (!jobId) {
    return NextResponse.json(
      { error: '缺少 jobId' },
      { status: 400 }
    );
  }

  const job = getAIImageJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: '任务不存在或已过期' },
      { status: 404 }
    );
  }

  return NextResponse.json({ job });
}
