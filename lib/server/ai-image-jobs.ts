import 'server-only';

import { randomUUID } from 'crypto';
import {
  AIProviderRequestBody,
  buildImageGenerationPayload,
  requestAIImageUrl,
  resolveAIProviderConfig,
} from '@/lib/server/ai-provider';
import { persistRemoteImageToQiniu } from '@/lib/server/qiniu';

export type AIImageJobKind = 'text-to-image' | 'image-to-image';
export type AIImageJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface AIImageJobRequestBody extends AIProviderRequestBody {
  prompt?: string;
  size?: string;
  image?: string | string[];
}

export interface AIImageJobResult {
  url: string;
  original_url: string;
  persisted: boolean;
}

export interface PublicAIImageJob {
  id: string;
  kind: AIImageJobKind;
  status: AIImageJobStatus;
  createdAt: number;
  updatedAt: number;
  result?: AIImageJobResult;
  error?: string;
}

const JOB_TTL_MS = 30 * 60 * 1000;
const jobs = new Map<string, PublicAIImageJob>();

export function createAIImageJob(
  kind: AIImageJobKind,
  body: AIImageJobRequestBody
): PublicAIImageJob {
  cleanupExpiredJobs();

  const job: PublicAIImageJob = {
    id: randomUUID(),
    kind,
    status: 'queued',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  jobs.set(job.id, job);
  void runAIImageJob(job.id, kind, body);

  return cloneJob(job);
}

export function getAIImageJob(jobId: string): PublicAIImageJob | null {
  cleanupExpiredJobs();
  const job = jobs.get(jobId);
  return job ? cloneJob(job) : null;
}

export function validateAIImageJobInput(
  kind: AIImageJobKind,
  body: AIImageJobRequestBody
): string | null {
  if (!body.prompt?.trim()) {
    return kind === 'text-to-image' ? '缺少提示词' : 'Prompt is required';
  }

  if (kind === 'image-to-image' && !body.image) {
    return 'Image is required';
  }

  return null;
}

async function runAIImageJob(
  jobId: string,
  kind: AIImageJobKind,
  body: AIImageJobRequestBody
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  updateJob(job, { status: 'running' });

  try {
    const config = resolveAIProviderConfig(body);
    const size = body.size || (kind === 'image-to-image' ? '2K' : '1024x1024');
    const payload = buildImageGenerationPayload({
      config,
      prompt: body.prompt!.trim(),
      image: body.image,
      size,
    });

    console.log(kind === 'text-to-image' ? '开始调用 AI 生图任务' : '开始调用 AI 图生图任务', {
      jobId,
      provider: config.providerId,
      endpoint: config.endpoint,
      model: config.modelId,
      requestFormat: config.requestFormat,
      imageCount: Array.isArray(body.image) ? body.image.length : body.image ? 1 : 0,
      size,
    });

    const originalUrl = await requestAIImageUrl(config, payload);
    const persisted = await persistRemoteImageToQiniu(
      originalUrl,
      kind === 'text-to-image' ? 'ai-generated.jpg' : 'ai-transformed.jpg',
      kind === 'text-to-image' ? 'ai-images' : 'xhs-cover'
    );

    updateJob(job, {
      status: 'succeeded',
      result: {
        url: persisted.url,
        original_url: persisted.originalUrl,
        persisted: persisted.persisted,
      },
    });
  } catch (error) {
    console.error(kind === 'text-to-image' ? 'AI 生图任务失败:' : 'AI 图生图任务失败:', {
      jobId,
      error,
    });
    updateJob(job, {
      status: 'failed',
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
}

function updateJob(
  job: PublicAIImageJob,
  updates: Partial<Pick<PublicAIImageJob, 'status' | 'result' | 'error'>>
): void {
  Object.assign(job, updates, { updatedAt: Date.now() });
}

function cleanupExpiredJobs(): void {
  const now = Date.now();
  for (const [jobId, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(jobId);
    }
  }
}

function cloneJob(job: PublicAIImageJob): PublicAIImageJob {
  return {
    ...job,
    result: job.result ? { ...job.result } : undefined,
  };
}
