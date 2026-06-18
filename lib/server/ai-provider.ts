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
  const providerId = resolveAIProviderId(body);
  const preset = getAIProviderPreset(providerId);
  const providerEnv = getProviderEnvPrefix(providerId);
  const useBuiltInProvider = isBuiltInAIProvider(providerId) && !clean(body.apiKey);

  if (useBuiltInProvider && !isServerBuiltInAIProviderEnabled(providerId)) {
    throw new Error(`服务端未启用内置 ${preset.label}。开源自部署请配置自己的服务端 Key，或在设置中切换到 HiAPI / Seedream / 自定义接口。`);
  }

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
    ),
    providerId
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
  const requestFormat = providerId === 'hiapi'
    ? 'hiapi-task'
    : resolveRequestFormat(
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

export function resolveAIProviderId(body: AIProviderRequestBody): AIProviderId {
  return resolveProviderId(body.providerId || process.env.AI_IMAGE_PROVIDER_ID);
}

export function isServerOwnedAIProviderRequest(body: AIProviderRequestBody): boolean {
  const providerId = resolveAIProviderId(body);
  return isBuiltInAIProvider(providerId) && !clean(body.apiKey);
}

export function isServerBuiltInAIProviderEnabled(providerId: AIProviderId): boolean {
  if (providerId === 'jimeng') {
    return parseBoolean(
      process.env.JIMENG_BUILT_IN_ENABLED ||
        process.env.AI_BUILTIN_JIMENG_ENABLED ||
        process.env.QIAOMU_BUILT_IN_JIMENG_ENABLED
    );
  }
  return true;
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

  if (config.requestFormat === 'hiapi-task') {
    return {
      model: config.modelId,
      input: buildHiapiTaskInput({
        modelId: config.modelId,
        prompt,
        size,
        image,
      }),
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

export async function requestAIImageUrl(
  config: ResolvedAIProviderConfig,
  payload: Record<string, unknown>
): Promise<string> {
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
    throw new Error(`AI API 错误 (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (config.requestFormat === 'hiapi-task') {
    return pollHiapiTaskImageUrl(config, result);
  }

  return extractImageUrl(result);
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

function parseBoolean(value: string | undefined | null): boolean {
  return ['1', 'true', 'yes', 'on'].includes(clean(value).toLowerCase());
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

function normalizeImageEndpoint(endpoint: string, providerId: AIProviderId): string {
  if (!endpoint) return '';
  const trimmed = endpoint.replace(/\/+$/, '');

  if (providerId === 'hiapi') {
    if (trimmed.endsWith('/v1/tasks')) {
      return trimmed;
    }
    if (trimmed.endsWith('/v1/images/generations')) {
      return `${trimmed.replace(/\/v1\/images\/generations$/i, '')}/v1/tasks`;
    }
    if (trimmed.endsWith('/v1')) {
      return `${trimmed}/tasks`;
    }
    if (trimmed === 'https://api.hiapi.ai' || trimmed === 'https://www.hiapi.ai') {
      return `${trimmed}/v1/tasks`;
    }
  }

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

function buildHiapiTaskInput({
  modelId,
  prompt,
  size,
  image,
}: {
  modelId: string;
  prompt: string;
  size: string;
  image?: string | string[];
}): Record<string, unknown> {
  const model = modelId.toLowerCase();
  const imageUrls = normalizeImageUrls(image);

  if (model.includes('qwen-image')) {
    return {
      prompt,
      size: toQwenImageSize(size),
      prompt_extend: true,
      watermark: false,
    };
  }

  if (model.includes('beta')) {
    return {
      prompt,
      size: toPixelSize(size),
    };
  }

  if (model.includes('flux')) {
    const ratio = toAspectRatio(size);
    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: isFluxRatio(ratio) ? ratio : 'custom',
      output_format: 'webp',
      output_quality: 85,
      prompt_upsampling: false,
      safety_tolerance: 2,
    };
    if (imageUrls.length > 0) {
      input.image_prompt = imageUrls[0];
    }
    if (input.aspect_ratio === 'custom') {
      const dimensions = parseDimensions(size) || { width: 1024, height: 1024 };
      input.width = clamp(Math.round(dimensions.width), 256, 1440);
      input.height = clamp(Math.round(dimensions.height), 256, 1440);
    }
    return input;
  }

  if (model.includes('banana')) {
    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: toAspectRatio(size),
      output_format: 'png',
    };
    if (model.includes('-2') || model.includes('pro')) {
      input.resolution = toResolution(size);
    }
    if (imageUrls.length > 0) {
      input.input_urls = imageUrls;
    }
    return input;
  }

  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: toAspectRatio(size),
    resolution: toResolution(size),
  };

  if (imageUrls.length > 0) {
    input.input_urls = imageUrls;
  }

  return input;
}

async function pollHiapiTaskImageUrl(
  config: ResolvedAIProviderConfig,
  createResult: unknown
): Promise<string> {
  const taskId = extractHiapiTaskId(createResult);
  const detailUrl = `${config.endpoint.replace(/\/+$/, '')}/${encodeURIComponent(taskId)}`;
  const headers = buildAIHeaders(config);

  for (let attempt = 0; attempt < 45; attempt += 1) {
    if (attempt > 0) {
      await sleep(2000);
    }

    const response = await fetch(detailUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HiAPI 任务查询失败 (${response.status}): ${errorText}`);
    }

    const detail = await response.json();
    const data = typeof detail === 'object' && detail !== null ? (detail as { data?: unknown }).data : null;
    const status = typeof data === 'object' && data !== null ? (data as { status?: unknown }).status : null;

    if (status === 'success') {
      return extractHiapiOutputUrl(data);
    }

    if (status === 'fail') {
      const error = (data as { error?: { message?: unknown; code?: unknown } }).error;
      const message = typeof error?.message === 'string' ? error.message : 'HiAPI 任务失败';
      const code = typeof error?.code === 'string' ? ` (${error.code})` : '';
      throw new Error(`${message}${code}`);
    }
  }

  throw new Error(`HiAPI 任务超时，请稍后在 HiAPI 后台查看任务: ${taskId}`);
}

function extractHiapiTaskId(result: unknown): string {
  if (!result || typeof result !== 'object') {
    throw new Error('HiAPI 创建任务返回格式错误');
  }

  const data = (result as { data?: unknown }).data;
  const taskId =
    typeof data === 'object' && data !== null
      ? (data as { taskId?: unknown; id?: unknown }).taskId || (data as { id?: unknown }).id
      : null;

  if (typeof taskId === 'string' && taskId) {
    return taskId;
  }

  throw new Error('HiAPI 创建任务返回中没有 taskId');
}

function extractHiapiOutputUrl(data: unknown): string {
  if (!data || typeof data !== 'object') {
    throw new Error('HiAPI 任务详情格式错误');
  }

  const output = (data as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    throw new Error('HiAPI 任务成功但没有 output');
  }

  const imageOutput =
    output.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const type = (item as { type?: unknown }).type;
      return type === 'image' || type === 'thumbnail' || type === 'first_frame';
    }) || output[0];
  const url = imageOutput && typeof imageOutput === 'object' ? (imageOutput as { url?: unknown }).url : null;

  if (typeof url === 'string' && url) {
    return url;
  }

  throw new Error('HiAPI output 中没有图片 URL');
}

function normalizeImageUrls(image?: string | string[]): string[] {
  if (!image) return [];
  return (Array.isArray(image) ? image : [image]).filter((url) => typeof url === 'string' && url.trim());
}

function toPixelSize(size: string): string {
  if (/^\d+x\d+$/i.test(size)) return size.toLowerCase();
  if (size === '1K') return '1024x1024';
  if (size === '2K') return '2048x2048';
  if (size === '4K') return '4096x4096';
  return 'auto';
}

function toQwenImageSize(size: string): string {
  const dimensions = parseDimensions(size);
  if (!dimensions) {
    return size === '2K' || size === '4K' ? '2048*2048' : '1328*1328';
  }

  const ratio = dimensions.width / dimensions.height;
  if (ratio > 1.55) return '1664*928';
  if (ratio > 1.15) return '1472*1104';
  if (ratio < 0.65) return '928*1664';
  if (ratio < 0.9) return '1104*1472';
  return '1328*1328';
}

function toAspectRatio(size: string): string {
  const dimensions = parseDimensions(size);
  if (!dimensions) {
    return '1:1';
  }

  const divisor = gcd(dimensions.width, dimensions.height);
  return `${Math.round(dimensions.width / divisor)}:${Math.round(dimensions.height / divisor)}`;
}

function toResolution(size: string): '1K' | '2K' | '4K' {
  if (size === '1K' || size === '2K' || size === '4K') return size;
  const dimensions = parseDimensions(size);
  if (!dimensions) return '1K';
  const maxSide = Math.max(dimensions.width, dimensions.height);
  if (maxSide >= 3000) return '4K';
  if (maxSide >= 1800) return '2K';
  return '1K';
}

function parseDimensions(size: string): { width: number; height: number } | null {
  const match = size.match(/^(\d+)[x*](\d+)$/i);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

function isFluxRatio(ratio: string): boolean {
  return ['1:1', '16:9', '3:2', '2:3', '4:5', '5:4', '9:16', '3:4', '4:3'].includes(ratio);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
