import {
  AI_PROVIDER_STORAGE_KEYS,
  DEFAULT_AI_PROVIDER_ID,
  isAIProviderId,
  isAIProviderModelId,
  isBuiltInAIProvider,
} from './ai-provider-config';
import { createAndPollAIImageJob } from './ai-image-job-client';

// AI 生图服务
export class AIImageGenerator {
  private apiUrl = '/api/ai-image/jobs'; // 使用后台任务路由，避免长连接中断

  // 从 localStorage 获取配置
  private getConfig() {
    if (typeof window === 'undefined') return {};

    const savedProviderId = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.providerId);
    const providerId = isAIProviderId(savedProviderId) ? savedProviderId : DEFAULT_AI_PROVIDER_ID;

    if (isBuiltInAIProvider(providerId)) {
      const savedModelId = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.modelId);
      return {
        providerId,
        modelId: isAIProviderModelId(providerId, savedModelId) ? savedModelId || undefined : undefined,
      };
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

      const imageUrl = await createAndPollAIImageJob(
        this.apiUrl,
        {
          prompt: prompt,
          size: size,
          ...config, // 传递自定义配置
        }
      );
      console.log('✅ 图片生成成功:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('❌ AI 生图失败:', error);
      throw error;
    }
  }
}
