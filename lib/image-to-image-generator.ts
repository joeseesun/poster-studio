import {
  AI_PROVIDER_STORAGE_KEYS,
  DEFAULT_AI_PROVIDER_ID,
  isAIProviderId,
  isBuiltInAIProvider,
} from './ai-provider-config';

// 图片转图片生成器 - 通过Next.js API路由调用
export class ImageToImageGenerator {
  private endpoint: string;

  constructor() {
    // 使用Next.js API路由,避免CORS问题
    this.endpoint = '/api/image-to-image';
  }

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
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image: imageUrl,
          size,
          ...config, // 传递自定义配置
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API请求失败: ${response.status}`);
      }

      const data = await response.json();

      // 检查返回数据格式
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('API返回数据格式错误');
      }

      return data.data[0].url;
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
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image: imageUrls,
          size,
          ...config, // 传递自定义配置
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API请求失败: ${response.status}`);
      }

      const data = await response.json();

      // 检查返回数据格式
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('API返回数据格式错误');
      }

      return data.data[0].url;
    } catch (error) {
      console.error('❌ 图片转换失败:', error);
      throw error;
    }
  }
}
