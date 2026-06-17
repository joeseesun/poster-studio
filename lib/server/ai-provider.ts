import {
  AIAuthHeader,
  AIProviderId,
  AIRequestFormat,
  DEFAULT_AI_PROVIDER_ID,
  getAIProviderPreset,
  isAIAuthHeader,
  isBuiltInAIProvider,
  isAIProviderId,
  isAIProviderModelId,
  isAIRequestFormat,
} from '@/lib/ai-provider-config';

export interface AIProviderRequestBody {
  providerId?: string;
  apiKey?: string;
  apiEndpoint?: string;
  modelId?: string;
  authHeader?: string;
  requestFormat?: string;
}

export interface ResolvedAIProviderConfig {
  providerId: AIProviderId;
  apiKey: string;
  endpoint: string;
  modelId: string;
  authHeader: AIAuthHeader;
  requestFormat: AIRequestFormat;
}

export function resolveAIProviderConfig(body: AIProviderRequestBody): ResolvedAIProviderConfig {
  const providerId = resolveProviderId(body.providerId || process.env.AI_IMAGE_PROVIDER_ID);
  const preset = getAIProviderPreset(providerId);
  const providerEnv = getProviderEnvPrefix(providerId);
  const useBuiltInProvider = isBuiltInAIProvider(providerId) && !clean(body.apiKey);

  const apiKey = clean(
    useBuiltInProvider
      ? process.env[`${providerEnv}_API_KEY`]
      : body.apiKey ||
          process.env[`${providerEnv}_API_KEY`] ||
          process.env.AI_IMAGE_API_KEY ||
          process.env.HIAPI_API_KEY ||
          process.env.JIMENG_API_KEY ||
          process.env.ARK_API_KEY
  );
  const endpoint = normalizeImageEndpoint(
    clean(
      (useBuiltInProvider ? '' : body.apiEndpoint) ||
        process.env[`${providerEnv}_API_ENDPOINT`] ||
        process.env[`${providerEnv}_BASE_URL`] ||
        process.env.AI_IMAGE_API_ENDPOINT ||
        preset.endpoint
    )
  );
  const requestedModelId = clean(body.modelId);
  if (useBuiltInProvider && requestedModelId && !isAIProviderModelId(providerId, requestedModelId)) {
    throw new Error(`不支持的 ${preset.label} 模型: ${requestedModelId}`);
  }

  const modelId = clean(
    (useBuiltInProvider ? requestedModelId : body.modelId) ||
      process.env[`${providerEnv}_MODEL_ID`] ||
      process.env.AI_IMAGE_MODEL_ID ||
      preset.modelId
  );
  const authHeader = resolveAuthHeader(
    (useBuiltInProvider ? '' : body.authHeader) ||
      process.env[`${providerEnv}_AUTH_HEADER`] ||
      process.env.AI_IMAGE_AUTH_HEADER ||
      preset.authHeader
  );
  const requestFormat = resolveRequestFormat(
    (useBuiltInProvider ? '' : body.requestFormat) ||
      process.env[`${providerEnv}_REQUEST_FORMAT`] ||
      process.env.AI_IMAGE_REQUEST_FORMAT ||
      preset.requestFormat
  );

  if (!apiKey) {
    if (useBuiltInProvider) {
      throw new Error(`服务端未配置 ${providerEnv}_API_KEY，内置 ${preset.label} 暂不可用`);
    }
    throw new Error('缺少 AI API Key，请在设置中填写，或配置服务端 AI_IMAGE_API_KEY');
  }

  if (!endpoint) {
    throw new Error('缺少 AI API 端点');
  }

  if (!modelId) {
    throw new Error('缺少模型 ID，请在设置中填写对应服务商的模型名');
  }

  return {
    providerId,
    apiKey,
    endpoint,
    modelId,
    authHeader,
    requestFormat,
  };
}

export function buildAIHeaders(config: ResolvedAIProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.authHeader === 'x-api-key') {
    headers['X-API-Key'] = config.apiKey;
  } else {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  return headers;
}

export function buildImageGenerationPayload({
  config,
  prompt,
  size,
  image,
}: {
  config: ResolvedAIProviderConfig;
  prompt: string;
  size: string;
  image?: string | string[];
}): Record<string, unknown> {
  if (config.requestFormat === 'openai-image') {
    if (image) {
      throw new Error('当前 OpenAI Images 请求格式仅支持文生图；图生图请切换到 Seedream 或即梦兼容格式');
    }

    return {
      model: config.modelId,
      prompt,
      response_format: 'url',
      size,
    };
  }

  if (config.requestFormat === 'jimeng') {
    const jimengSize = toJimengSize(size);
    return {
      model: config.modelId,
      prompt,
      ...(image ? { image } : {}),
      response_format: 'url',
      ratio: jimengSize.ratio,
      resolution: jimengSize.quality.toLowerCase(),
    };
  }

  return {
    model: config.modelId,
    prompt,
    ...(image ? { image } : {}),
    sequential_image_generation: 'disabled',
    response_format: 'url',
    size,
    stream: false,
    watermark: false,
  };
}

export function extractImageUrl(result: unknown): string {
  if (!result || typeof result !== 'object') {
    throw new Error('AI API 返回数据格式错误');
  }

  const apiCode = (result as { code?: unknown }).code;
  if (typeof apiCode === 'number' && apiCode !== 0) {
    const message = (result as { message?: unknown }).message;
    throw new Error(typeof message === 'string' && message ? message : `AI API 返回错误 code=${apiCode}`);
  }

  const data = (result as { data?: unknown }).data;
  if (Array.isArray(data)) {
    const first = data[0] as { url?: unknown; b64_json?: unknown } | undefined;
    if (typeof first?.url === 'string' && first.url) {
      return first.url;
    }
    if (typeof first?.b64_json === 'string' && first.b64_json) {
      return `data:image/png;base64,${first.b64_json}`;
    }
  }

  throw new Error('返回数据中没有图片 URL');
}

function clean(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveProviderId(value: string | undefined): AIProviderId {
  return isAIProviderId(value) ? value : DEFAULT_AI_PROVIDER_ID;
}

function resolveAuthHeader(value: string | undefined): AIAuthHeader {
  return isAIAuthHeader(value) ? value : 'bearer';
}

function resolveRequestFormat(value: string | undefined): AIRequestFormat {
  return isAIRequestFormat(value) ? value : 'openai-image';
}

function getProviderEnvPrefix(providerId: AIProviderId): string {
  if (providerId === 'hiapi') return 'HIAPI';
  if (providerId === 'jimeng') return 'JIMENG';
  if (providerId === 'volc-seedream') return 'ARK';
  return 'AI_IMAGE';
}

function normalizeImageEndpoint(endpoint: string): string {
  if (!endpoint) return '';
  const trimmed = endpoint.replace(/\/+$/, '');
  if (/\/(images\/generations|chat\/completions)$/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.endsWith('/v1')) {
    return `${trimmed}/images/generations`;
  }
  if (trimmed.endsWith('/jimeng-auth')) {
    return `${trimmed}/v1/images/generations`;
  }
  if (trimmed === 'https://api.hiapi.ai') {
    return `${trimmed}/v1/images/generations`;
  }
  return trimmed;
}

function toJimengSize(size: string): { quality: '1K' | '2K' | '4K'; ratio: string } {
  if (size === '1K' || size === '2K' || size === '4K') {
    return { quality: size, ratio: '1:1' };
  }

  const [width, height] = size.split('x').map((part) => Number(part));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { quality: '2K', ratio: '1:1' };
  }

  const maxSide = Math.max(width, height);
  const quality = maxSide <= 1280 ? '1K' : maxSide <= 2048 ? '2K' : '4K';
  const divisor = gcd(width, height);
  return {
    quality,
    ratio: `${Math.round(width / divisor)}:${Math.round(height / divisor)}`,
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}
