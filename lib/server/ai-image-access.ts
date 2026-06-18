import 'server-only';

import { NextRequest } from 'next/server';
import {
  AIProviderRequestBody,
  isServerBuiltInAIProviderEnabled,
  isServerOwnedAIProviderRequest,
  resolveAIProviderId,
} from '@/lib/server/ai-provider';

interface AccessResult {
  allowed: boolean;
  status?: number;
  error?: string;
  headers?: Record<string, string>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_LIMIT = 20;
const rateBuckets = new Map<string, RateLimitEntry>();

export function checkBuiltInAIRequestAccess(
  request: NextRequest,
  body: AIProviderRequestBody
): AccessResult {
  if (!isServerOwnedAIProviderRequest(body)) {
    return { allowed: true };
  }

  const providerId = resolveAIProviderId(body);
  if (!isServerBuiltInAIProviderEnabled(providerId)) {
    return {
      allowed: false,
      status: 403,
      error: '服务端未启用内置即梦。开源自部署请配置自己的服务端 Key，或在设置中切换到 HiAPI / Seedream / 自定义接口。',
    };
  }

  const originResult = checkOrigin(request);
  if (!originResult.allowed) {
    return originResult;
  }

  return checkRateLimit(request, body);
}

function checkOrigin(request: NextRequest): AccessResult {
  const origin = normalizeOrigin(request.headers.get('origin'));
  const requireOrigin = parseBoolean(process.env.AI_BUILTIN_IMAGE_REQUIRE_ORIGIN);

  if (!origin) {
    return requireOrigin
      ? {
          allowed: false,
          status: 403,
          error: '内置 AI 生图服务要求同源请求',
        }
      : { allowed: true };
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.has(origin)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    status: 403,
    error: '当前来源不允许调用内置 AI 生图服务',
  };
}

function checkRateLimit(request: NextRequest, body: AIProviderRequestBody): AccessResult {
  const limit = parsePositiveInt(process.env.AI_BUILTIN_IMAGE_RATE_LIMIT_PER_HOUR, DEFAULT_LIMIT);
  if (limit <= 0) {
    return { allowed: true };
  }

  const now = Date.now();
  const providerId = resolveAIProviderId(body);
  const ip = getClientIp(request);
  const key = `${providerId}:${ip}`;
  const existing = rateBuckets.get(key);
  const entry = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + DEFAULT_WINDOW_MS };

  cleanupExpiredBuckets(now);

  if (entry.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: false,
      status: 429,
      error: `内置 AI 生图服务使用过于频繁，请 ${Math.ceil(retryAfter / 60)} 分钟后再试，或在设置中配置自己的 API。`,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      },
    };
  }

  entry.count += 1;
  rateBuckets.set(key, entry);

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(Math.max(0, limit - entry.count)),
      'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
    },
  };
}

function getAllowedOrigins(): Set<string> {
  const values = [
    process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.AI_BUILTIN_IMAGE_ALLOWED_ORIGINS || '').split(','),
  ];

  if (process.env.NODE_ENV !== 'production') {
    values.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }

  return new Set(values.map((value) => normalizeOrigin(value)).filter(Boolean));
}

function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || 'unknown';
}

function normalizeOrigin(value?: string | null): string {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined | null): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value || '').trim().toLowerCase());
}

function cleanupExpiredBuckets(now: number): void {
  for (const [key, entry] of rateBuckets) {
    if (entry.resetAt <= now) {
      rateBuckets.delete(key);
    }
  }
}
