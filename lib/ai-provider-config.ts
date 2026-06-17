export type AIProviderId = 'volc-seedream' | 'hiapi' | 'jimeng' | 'custom';
export type AIAuthHeader = 'bearer' | 'x-api-key';
export type AIRequestFormat = 'seedream' | 'openai-image' | 'jimeng';

export interface AIProviderPreset {
  id: AIProviderId;
  label: string;
  description: string;
  endpoint: string;
  modelId: string;
  authHeader: AIAuthHeader;
  requestFormat: AIRequestFormat;
  docsUrl?: string;
}

export const AI_PROVIDER_STORAGE_KEYS = {
  providerId: 'ai_provider_id',
  apiKey: 'ai_api_key',
  apiEndpoint: 'ai_api_endpoint',
  modelId: 'ai_model_id',
  authHeader: 'ai_auth_header',
  requestFormat: 'ai_request_format',
} as const;

export const DEFAULT_AI_PROVIDER_ID: AIProviderId = 'volc-seedream';

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'volc-seedream',
    label: '火山方舟 / Seedream',
    description: '兼容现有火山方舟图片生成链路，支持参考图改图。',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
    modelId: '',
    authHeader: 'bearer',
    requestFormat: 'seedream',
    docsUrl: 'https://www.volcengine.com/docs/85621/1616429',
  },
  {
    id: 'hiapi',
    label: 'HiAPI',
    description: 'OpenAI Images API 兼容接口，适合 Qwen Image 等模型。',
    endpoint: 'https://api.hiapi.ai/v1/images/generations',
    modelId: 'qwen-image-2.0',
    authHeader: 'bearer',
    requestFormat: 'openai-image',
    docsUrl: 'https://docs.hiapi.ai/zh/guides/image-generation/',
  },
  {
    id: 'jimeng',
    label: '即梦 API',
    description: '即梦兼容接口，支持 1K / 2K / 4K 与参考图改图。',
    endpoint: 'https://api.qiaomu.ai/jimeng-auth/v1/images/generations',
    modelId: 'jimeng-4.5',
    authHeader: 'x-api-key',
    requestFormat: 'jimeng',
  },
  {
    id: 'custom',
    label: '自定义兼容接口',
    description: '手动填写 OpenAI-compatible 或其他兼容服务商配置。',
    endpoint: '',
    modelId: '',
    authHeader: 'bearer',
    requestFormat: 'openai-image',
  },
];

export const AI_AUTH_HEADER_OPTIONS: Array<{
  value: AIAuthHeader;
  label: string;
  description: string;
}> = [
  {
    value: 'bearer',
    label: 'Authorization: Bearer',
    description: 'OpenAI、HiAPI、火山方舟等常见格式。',
  },
  {
    value: 'x-api-key',
    label: 'X-API-Key',
    description: '部分自建代理或私有网关使用。',
  },
];

export const AI_REQUEST_FORMAT_OPTIONS: Array<{
  value: AIRequestFormat;
  label: string;
  description: string;
}> = [
  {
    value: 'openai-image',
    label: 'OpenAI Images',
    description: 'model / prompt / size，主要用于文生图。',
  },
  {
    value: 'seedream',
    label: 'Seedream',
    description: '兼容火山方舟图片生成与参考图参数。',
  },
  {
    value: 'jimeng',
    label: '即梦兼容',
    description: '自动转换比例与 1K / 2K / 4K 清晰度。',
  },
];

export function getAIProviderPreset(providerId?: string | null): AIProviderPreset {
  return (
    AI_PROVIDER_PRESETS.find((preset) => preset.id === providerId) ||
    AI_PROVIDER_PRESETS.find((preset) => preset.id === DEFAULT_AI_PROVIDER_ID)!
  );
}

export function isAIProviderId(value: string | null | undefined): value is AIProviderId {
  return AI_PROVIDER_PRESETS.some((preset) => preset.id === value);
}

export function isAIAuthHeader(value: string | null | undefined): value is AIAuthHeader {
  return value === 'bearer' || value === 'x-api-key';
}

export function isAIRequestFormat(value: string | null | undefined): value is AIRequestFormat {
  return value === 'seedream' || value === 'openai-image' || value === 'jimeng';
}
