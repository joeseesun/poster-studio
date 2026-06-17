// AI 改图快捷提示词管理
const STORAGE_KEY = 'ai-transform-prompts';

export interface AITransformPrompt {
  id: string;
  text: string;
  createdAt: number;
}

// 默认提示词（针对图片属性面板的 AI 改图场景）
const DEFAULT_PROMPTS: AITransformPrompt[] = [
  {
    id: '1',
    text: 'cartoon style, vibrant colors, clean lines, animated look',
    createdAt: Date.now(),
  },
  {
    id: '2',
    text: 'white background, simple, clean edges',
    createdAt: Date.now(),
  },
  {
    id: '3',
    text: 'watercolor painting style, soft colors, artistic brush strokes',
    createdAt: Date.now(),
  },
  {
    id: '4',
    text: 'minimalist style, simple composition, clean aesthetic',
    createdAt: Date.now(),
  },
  {
    id: '5',
    text: 'oil painting style, rich textures, classic art',
    createdAt: Date.now(),
  },
  {
    id: '6',
    text: 'sketch drawing style, pencil lines, artistic sketch',
    createdAt: Date.now(),
  },
  {
    id: '7',
    text: 'vintage retro style, nostalgic colors, classic look',
    createdAt: Date.now(),
  },
  {
    id: '8',
    text: 'modern digital art, vibrant neon colors, futuristic',
    createdAt: Date.now(),
  },
  {
    id: '9',
    text: 'black and white photography, high contrast, dramatic',
    createdAt: Date.now(),
  },
  {
    id: '10',
    text: 'pastel colors, soft lighting, dreamy atmosphere',
    createdAt: Date.now(),
  },
];

export class AITransformPromptsManager {
  private prompts: AITransformPrompt[] = [];

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
      console.error('❌ AI 改图提示词加载失败:', error);
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
      console.error('❌ AI 改图提示词保存失败:', error);
    }
  }

  /**
   * 获取所有提示词
   */
  getAll(): AITransformPrompt[] {
    return [...this.prompts];
  }

  /**
   * 添加提示词（新增的排在前面）
   */
  add(text: string): AITransformPrompt {
    const newPrompt: AITransformPrompt = {
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
let instance: AITransformPromptsManager | null = null;

export function getAITransformPromptsManager(): AITransformPromptsManager {
  if (!instance) {
    instance = new AITransformPromptsManager();
  }
  return instance;
}
