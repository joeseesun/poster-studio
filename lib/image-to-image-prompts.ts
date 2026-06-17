// 图片转图片快速提示词管理
const STORAGE_KEY = 'image-to-image-prompts';

export interface ImageToImagePrompt {
  id: string;
  text: string;
  createdAt: number;
}

// 默认提示词（针对图片转换场景）
const DEFAULT_PROMPTS: ImageToImagePrompt[] = [
  {
    id: '1',
    text: '将图1的服装换为图2的服装',
    createdAt: Date.now(),
  },
  {
    id: '2',
    text: '生成狗狗趴在草地上的近景画面',
    createdAt: Date.now(),
  },
  {
    id: '3',
    text: '将背景替换为海滩日落场景',
    createdAt: Date.now(),
  },
  {
    id: '4',
    text: '转换为水彩画风格',
    createdAt: Date.now(),
  },
];

export class ImageToImagePromptsManager {
  private prompts: ImageToImagePrompt[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从localStorage加载
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.prompts = JSON.parse(stored);
      } else {
        // 首次使用,加载默认提示词
        this.prompts = DEFAULT_PROMPTS;
        this.saveToStorage();
      }
    } catch (error) {
      console.error('❌ 图片转换提示词加载失败:', error);
      this.prompts = DEFAULT_PROMPTS;
    }
  }

  /**
   * 保存到localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prompts));
    } catch (error) {
      console.error('❌ 图片转换提示词保存失败:', error);
    }
  }

  /**
   * 获取所有提示词
   */
  getAll(): ImageToImagePrompt[] {
    return [...this.prompts];
  }

  /**
   * 添加提示词（新增的排在前面）
   */
  add(text: string): ImageToImagePrompt {
    const newPrompt: ImageToImagePrompt = {
      id: Date.now().toString(),
      text: text.trim(),
      createdAt: Date.now(),
    };
    this.prompts.unshift(newPrompt); // 使用 unshift 而不是 push，让新增的排在前面
    this.saveToStorage();
    return newPrompt;
  }

  /**
   * 更新提示词
   */
  update(id: string, text: string): boolean {
    const index = this.prompts.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.prompts[index].text = text.trim();
    this.saveToStorage();
    return true;
  }

  /**
   * 删除提示词
   */
  delete(id: string): boolean {
    const index = this.prompts.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.prompts.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * 重置为默认提示词
   */
  reset() {
    this.prompts = DEFAULT_PROMPTS;
    this.saveToStorage();
  }
}

// 单例
let instance: ImageToImagePromptsManager | null = null;

export function getImageToImagePromptsManager(): ImageToImagePromptsManager {
  if (!instance) {
    instance = new ImageToImagePromptsManager();
  }
  return instance;
}
