import { NextRequest, NextResponse } from 'next/server';
import {
  AIModelOption,
  getAIProviderPreset,
  HIAPI_MODEL_OPTIONS,
  isAIProviderId,
} from '@/lib/ai-provider-config';

interface HiapiPricingModel {
  model_name?: unknown;
  description?: unknown;
  category?: unknown;
  subcategory?: unknown;
  output_type?: unknown;
  supported_endpoint_types?: unknown;
  base_usd_value?: unknown;
  base_display_unit?: unknown;
}

interface ParsedHiapiModel extends AIModelOption {
  category?: unknown;
  outputType?: unknown;
  supportedEndpointTypes?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const providerId = isAIProviderId(body.providerId) ? body.providerId : 'hiapi';
    const preset = getAIProviderPreset(providerId);

    if (providerId !== 'hiapi') {
      return NextResponse.json({
        success: true,
        providerId,
        source: 'preset',
        models: preset.modelOptions || [],
      });
    }

    try {
      const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : process.env.HIAPI_API_KEY || '';
      if (apiKey) {
        try {
          const models = await fetchHiapiV1Models({
            apiKey,
            apiEndpoint: typeof body.apiEndpoint === 'string' ? body.apiEndpoint : preset.endpoint,
          });
          return NextResponse.json({
            success: true,
            providerId,
            source: 'hiapi-models',
            models,
          });
        } catch (error) {
          console.warn('HiAPI /v1/models 不可用，回退公开模型列表:', error);
        }
      }

      const models = await fetchHiapiTaskImageModels(preset.modelsUrl || 'https://www.hiapi.ai/api/pricing');
      return NextResponse.json({
        success: true,
        providerId,
        source: 'hiapi-pricing',
        models,
      });
    } catch (error) {
      console.warn('获取 HiAPI 模型列表失败，使用本地默认列表:', error);
      return NextResponse.json({
        success: true,
        providerId,
        source: 'fallback',
        models: HIAPI_MODEL_OPTIONS,
        warning: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    console.error('获取 AI 模型列表失败:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '获取模型列表失败' },
      { status: 500 }
    );
  }
}

async function fetchHiapiV1Models({
  apiKey,
  apiEndpoint,
}: {
  apiKey: string;
  apiEndpoint: string;
}): Promise<AIModelOption[]> {
  const response = await fetch(toHiapiModelsEndpoint(apiEndpoint), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HiAPI /v1/models 错误 (${response.status})`);
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(typeof payload.error?.message === 'string' ? payload.error.message : 'HiAPI /v1/models 返回错误');
  }

  const rawModels = Array.isArray(payload?.data) ? payload.data : [];
  const models: AIModelOption[] = rawModels
    .map((model: { id?: unknown; model_name?: unknown; description?: unknown; category?: unknown; output_type?: unknown; supported_endpoint_types?: unknown }) => {
      const value = String(model.id || model.model_name || '').trim();
      return {
        value,
        label: toModelLabel(value),
        description: buildHiapiModelDescription(model),
        category: model.category,
        outputType: model.output_type,
        supportedEndpointTypes: model.supported_endpoint_types,
      };
    })
    .filter((model: ParsedHiapiModel) => {
      if (!model.value) return false;
      const endpoints = Array.isArray(model.supportedEndpointTypes) ? model.supportedEndpointTypes : [];
      if (model.category === 'image' || model.outputType === 'image') return endpoints.length === 0 || endpoints.includes('task');
      return /image|banana|flux/i.test(model.value);
    })
    .map((model: ParsedHiapiModel) => ({
      value: model.value,
      label: model.label,
      description: model.description,
    }));

  if (models.length === 0) {
    throw new Error('HiAPI /v1/models 未返回图片任务模型');
  }

  return models;
}

async function fetchHiapiTaskImageModels(modelsUrl: string): Promise<AIModelOption[]> {
  const response = await fetch(modelsUrl, {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`HiAPI 模型接口错误 (${response.status})`);
  }

  const payload = await response.json();
  const rawModels = Array.isArray(payload?.data) ? (payload.data as HiapiPricingModel[]) : [];
  const fallbackOrder = new Map(HIAPI_MODEL_OPTIONS.map((option, index) => [option.value, index]));

  const models = rawModels
    .filter((model) => {
      const endpoints = Array.isArray(model.supported_endpoint_types) ? model.supported_endpoint_types : [];
      return model.category === 'image' && endpoints.includes('task');
    })
    .map((model) => {
      const value = String(model.model_name || '').trim();
      return {
        value,
        label: toModelLabel(value),
        description: buildHiapiModelDescription(model),
      };
    })
    .filter((model) => model.value)
    .sort((a, b) => {
      const aOrder = fallbackOrder.get(a.value) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = fallbackOrder.get(b.value) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.label.localeCompare(b.label);
    });

  return models.length > 0 ? models : HIAPI_MODEL_OPTIONS;
}

function toHiapiModelsEndpoint(apiEndpoint: string): string {
  const endpoint = apiEndpoint || 'https://api.hiapi.ai/v1/tasks';
  const trimmed = endpoint.replace(/\/+$/, '');
  if (trimmed.endsWith('/v1/models')) return trimmed;
  if (trimmed.endsWith('/v1/tasks')) return `${trimmed.replace(/\/v1\/tasks$/i, '')}/v1/models`;
  if (trimmed.endsWith('/v1/images/generations')) return `${trimmed.replace(/\/v1\/images\/generations$/i, '')}/v1/models`;
  if (trimmed.endsWith('/v1')) return `${trimmed}/models`;
  return `${trimmed}/v1/models`;
}

function buildHiapiModelDescription(model: HiapiPricingModel): string {
  const description = parseLocalizedDescription(model.description);
  const subcategory = typeof model.subcategory === 'string' ? model.subcategory : '';
  const price =
    typeof model.base_usd_value === 'number'
      ? `$${model.base_usd_value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`
      : '';
  const unit =
    typeof model.base_display_unit === 'object' && model.base_display_unit !== null
      ? (model.base_display_unit as { zh?: unknown }).zh
      : '';

  return [description, subcategory, price ? `${price}${typeof unit === 'string' ? ` / ${unit}` : ''}` : '']
    .filter(Boolean)
    .join(' · ');
}

function parseLocalizedDescription(description: unknown): string {
  if (typeof description !== 'string') return '';
  try {
    const parsed = JSON.parse(description) as { zh?: unknown; en?: unknown };
    if (typeof parsed.zh === 'string') return parsed.zh;
    if (typeof parsed.en === 'string') return parsed.en;
  } catch {
    return description;
  }
  return description;
}

function toModelLabel(value: string): string {
  const fallback = HIAPI_MODEL_OPTIONS.find((option) => option.value === value);
  if (fallback) return fallback.label;
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bGpt\b/g, 'GPT');
}
