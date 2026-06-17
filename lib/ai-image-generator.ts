import {
  AI_PROVIDER_STORAGE_KEYS,
  DEFAULT_AI_PROVIDER_ID,
  isAIProviderId,
  isBuiltInAIProvider,
} from './ai-provider-config';

// AI 生图服务
export class AIImageGenerator {
  private apiUrl = '/api/ai-image'; // 使用本地 API 路由，避免 CORS 问题

  // 从 localStorage 获取配置
  private getConfig() {
    if (typeof window === 'undefined') return {};

    const savedProviderId = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.providerId);
    const providerId = isAIProviderId(savedProviderId) ? savedProviderId : DEFAULT_AI_PROVIDER_ID;

    if (isBuiltInAIProvider(providerId)) {
      return { providerId };
    }

    return {
      providerId,
      apiKey: localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiKey) || undefined,
      apiEndpoint: localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiEndpoint) || undefined,
      modelId: localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.modelId) || undefined,
      authHeader: localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.authHeader) || undefined,
      requestFormat: localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.requestFormat) || undefined,
    };
  }

  // 生成图片
  async generateImage(prompt: string, size: string = '1024x1024'): Promise<string> {
    try {
      const config = this.getConfig();
      console.log('🎨 开始生成图片...', {
        prompt,
        size,
        hasCustomConfig: !!(config.apiKey || config.apiEndpoint || config.modelId)
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          size: size,
          ...config, // 传递自定义配置
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('❌ 生成图片失败:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || `生成图片失败 (${response.status})`);
      }

      const result = await response.json();

      // 提取图片 URL
      if (result.data && result.data.length > 0 && result.data[0].url) {
        const imageUrl = result.data[0].url;
        console.log('✅ 图片生成成功:', imageUrl);
        return imageUrl;
      } else {
        console.error('❌ 返回数据格式错误:', result);
        throw new Error('返回数据中没有图片 URL');
      }
    } catch (error) {
      console.error('❌ AI 生图失败:', error);
      throw error;
    }
  }
}
