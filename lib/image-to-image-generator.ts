import {
  AI_PROVIDER_STORAGE_KEYS,
  isAIProviderModelId,
  isBuiltInAIProvider,
  resolveBrowserAIProviderId,
} from './ai-provider-config';
import { createAndPollAIImageJob } from './ai-image-job-client';

// 图片转图片生成器 - 通过Next.js API路由调用
export class ImageToImageGenerator {
  private endpoint: string;

  constructor() {
    // 使用后台任务路由，避免长连接中断
    this.endpoint = '/api/image-to-image/jobs';
  }

  // 从 localStorage 获取配置
  private getConfig() {
    if (typeof window === 'undefined') return {};

    const providerId = resolveBrowserAIProviderId(localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.providerId));

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

  /**
   * 生成图片 - 单张图片输入
   * @param prompt 提示词
   * @param imageUrl 输入图片URL
   * @param size 图片尺寸 (1K/2K/4K)
   * @returns 生成的图片URL
   */
  async generateFromSingleImage(
    prompt: string,
    imageUrl: string,
    size: '1K' | '2K' | '4K' = '2K'
  ): Promise<string> {
    try {
      const config = this.getConfig();
      return await createAndPollAIImageJob(
        this.endpoint,
        {
          prompt,
          image: imageUrl,
          size,
          ...config, // 传递自定义配置
        }
      );
    } catch (error) {
      console.error('❌ 图片转换失败:', error);
      throw error;
    }
  }

  /**
   * 生成图片 - 多张图片输入
   * @param prompt 提示词
   * @param imageUrls 输入图片URL数组
   * @param size 图片尺寸 (1K/2K/4K)
   * @returns 生成的图片URL
   */
  async generateFromMultipleImages(
    prompt: string,
    imageUrls: string[],
    size: '1K' | '2K' | '4K' = '2K'
  ): Promise<string> {
    try {
      const config = this.getConfig();
      return await createAndPollAIImageJob(
        this.endpoint,
        {
          prompt,
          image: imageUrls,
          size,
          ...config, // 传递自定义配置
        }
      );
    } catch (error) {
      console.error('❌ 图片转换失败:', error);
      throw error;
    }
  }
}
