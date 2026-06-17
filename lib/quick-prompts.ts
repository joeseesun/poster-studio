// 快速提示词管理
const STORAGE_KEY = 'quick-prompts';

export interface QuickPrompt {
  id: string;
  text: string;
  createdAt: number;
}

// 默认提示词
const DEFAULT_PROMPTS: QuickPrompt[] = [
  {
    id: '1',
    text: '"向阳乔木"，纸雕风格融合水彩层次美学，字体结构立体精致如水彩纸雕工艺，边缘细腻带水彩渐变与阴影效果，柔和红色与淡蓝水彩背景中营造纸艺空间，点缀立体几何图形与水彩装饰元素，文字表面呈现高级纸张与水彩光泽质感，字形排列层次分明如精美纸雕作品，整体营造出精致工艺与艺术学习的优雅层次，温和而富有艺术感的教学氛围中透出水彩的精致美感，高级水彩工艺视觉',
    createdAt: Date.now(),
  },
  {
    id: '2',
    text: '生成极简风格海报背景，几何图案，柔和色彩渐变，现代简约设计',
    createdAt: Date.now(),
  },
  {
    id: '3',
    text: '极简风格海报背景，抽象几何形状，莫兰迪色系，高级质感',
    createdAt: Date.now(),
  },
  {
    id: '4',
    text: '简约几何图案背景，线条与圆形组合，清新配色，留白设计',
    createdAt: Date.now(),
  },
];

export class QuickPromptsManager {
  private prompts: QuickPrompt[] = [];

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
      console.error('❌ 快速提示词加载失败:', error);
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
      console.error('❌ 快速提示词保存失败:', error);
    }
  }

  /**
   * 获取所有提示词
   */
  getAll(): QuickPrompt[] {
    return [...this.prompts];
  }

  /**
   * 添加提示词（新增的排在前面）
   */
  add(text: string): QuickPrompt {
    const newPrompt: QuickPrompt = {
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
let instance: QuickPromptsManager | null = null;

export function getQuickPromptsManager(): QuickPromptsManager {
  if (!instance) {
    instance = new QuickPromptsManager();
  }
  return instance;
}
