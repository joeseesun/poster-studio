/**
 * 模板管理器
 * 负责模板的增删改查、应用模板、保存模板等功能
 */

import { fabric } from 'fabric';

// 模板类型定义
export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  canvasSize: {
    width: number;
    height: number;
  };
  canvasJSON: string; // Fabric.js canvas.toJSON() 的 JSON 字符串
  thumbnail?: string; // 缩略图 base64 或 URL
  isPreset: boolean; // 是否为预设模板
  isPublic?: boolean; // 是否公开分享
  createdAt: number;
}

// 模板分类（按画布尺寸）
export type TemplateCategory =
  | '3:4 竖版'
  | '1:1 方形'
  | '4:3 横版'
  | '16:9 横版'
  | '9:16 竖版'
  | '21:9 超宽'
  | '自定义';

// 模板管理器类
export class TemplateManager {
  private static instance: TemplateManager;
  private templates: Template[] = [];
  private readonly STORAGE_KEY = 'canvas-templates';

  private constructor() {
    this.loadFromStorage();
  }

  // 单例模式
  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  // 从 localStorage 加载模板
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.templates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ 加载模板失败:', error);
      this.templates = [];
    }
  }

  // 保存到 localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.templates));
    } catch (error) {
      console.error('❌ 保存模板失败:', error);
    }
  }

  // 获取所有模板
  getAll(): Template[] {
    return [...this.templates];
  }

  // 按分类获取模板
  getByCategory(category: TemplateCategory): Template[] {
    return this.templates.filter(t => t.category === category);
  }

  // 🆕 按画布尺寸获取模板（根据比例匹配）
  getByCanvasSize(width: number, height: number): Template[] {
    // 计算当前画布的比例
    const currentRatio = width / height;

    return this.templates.filter(t => {
      const templateRatio = t.canvasSize.width / t.canvasSize.height;
      // 允许 5% 的误差范围
      return Math.abs(currentRatio - templateRatio) < 0.05;
    });
  }

  // 获取单个模板
  getById(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }

  // 添加模板
  add(template: Omit<Template, 'id' | 'createdAt'>): Template {
    const newTemplate: Template = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };

    this.templates.push(newTemplate);
    this.saveToStorage();
    return newTemplate;
  }

  // 更新模板
  update(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
    };
    this.saveToStorage();
    return true;
  }

  // 删除模板
  delete(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // 从画布保存为模板
  async saveFromCanvas(
    canvas: fabric.Canvas,
    name: string,
    category: TemplateCategory = '自定义',
    isPublic: boolean = false
  ): Promise<Template> {
    // 获取画布 JSON
    const canvasJSON = JSON.stringify(canvas.toJSON());

    // 生成缩略图
    const thumbnail = await this.generateThumbnail(canvas);

    // 创建模板
    const template = this.add({
      name,
      category,
      canvasSize: {
        width: canvas.width || 1242,
        height: canvas.height || 1660,
      },
      canvasJSON,
      thumbnail,
      isPreset: false,
      isPublic,
    });

    return template;
  }

  // 应用模板到画布
  async applyToCanvas(templateId: string, canvas: fabric.Canvas): Promise<void> {
    const template = this.getById(templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('🎨 开始应用模板:', template.name);

        // 清空画布
        canvas.clear();
        console.log('✅ 画布已清空');

        // 设置画布尺寸
        canvas.setWidth(template.canvasSize.width);
        canvas.setHeight(template.canvasSize.height);
        console.log('✅ 画布尺寸已设置:', template.canvasSize);

        // 加载模板 JSON
        const canvasData = JSON.parse(template.canvasJSON);
        console.log('📦 模板数据:', canvasData);

        // 🆕 从模板数据中移除背景矩形，改用画布背景
        // 根据模板名称设置背景色
        const backgroundColorMap: Record<string, string> = {
          // 3:4 竖版
          '便签纸·黄色': '#FFFBEA',
          '引用卡片·蓝色': '#E3F2FD',
          '极简文字·白色': '#FFFFFF',
          '便签纸·粉色': '#FFF0F5',
          '引用卡片·绿色': '#E8F5E9',
          // 4:3 横版
          '便签纸·黄色·横版': '#FFFBEA',
          '引用卡片·蓝色·横版': '#E3F2FD',
          // 1:1 方形
          '极简文字·白色·方形': '#FFFFFF',
          '便签纸·粉色·方形': '#FFF0F5',
          // 16:9 横版
          '极简文字·白色·16:9': '#FFFFFF',
          // 9:16 竖版
          '便签纸·黄色·9:16': '#FFFBEA',
        };

        let backgroundColor = backgroundColorMap[template.name] || '#ffffff'; // 默认白色

        // 查找并移除背景矩形
        if (canvasData.objects && Array.isArray(canvasData.objects)) {
          const backgroundIndex = canvasData.objects.findIndex((obj: any) =>
            obj.type === 'rect' &&
            obj.left === 0 &&
            obj.top === 0 &&
            obj.width === template.canvasSize.width &&
            obj.height === template.canvasSize.height
          );

          if (backgroundIndex !== -1) {
            const bgRect = canvasData.objects[backgroundIndex];
            // 提取背景色（如果没有在映射表中）
            if (!backgroundColorMap[template.name]) {
              if (typeof bgRect.fill === 'string') {
                backgroundColor = bgRect.fill;
              } else if (bgRect.fill && bgRect.fill.type === 'linear') {
                // 如果是渐变，使用第一个颜色
                backgroundColor = bgRect.fill.colorStops?.[0]?.color || '#ffffff';
              }
            }
            // 移除背景矩形
            canvasData.objects.splice(backgroundIndex, 1);
            console.log('🎨 已移除背景矩形，提取背景色:', backgroundColor);
          }
        }

        canvas.loadFromJSON(canvasData, () => {
          console.log('✅ JSON 加载完成');

          // 🆕 设置画布背景色（在 loadFromJSON 之后，避免被重置）
          canvas.setBackgroundColor(backgroundColor, () => {
            console.log('✅ 画布背景色已设置:', backgroundColor);
            canvas.renderAll();
          });

          // 🆕 修复加载后的对象，确保所有必要属性都存在
          const objects = canvas.getObjects();
          const objectsToReplace: Array<{ oldObj: any; newObj: any }> = [];

          objects.forEach((obj: any, index: number) => {
            if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
              // 确保文本对象有 styles 属性
              if (!obj.styles) {
                obj.styles = {};
              }

              // 🆕 如果是普通 text，转换为可编辑的 IText
              if (obj.type === 'text') {
                console.log(`🔄 将 text 对象转换为 IText:`, obj.text);
                const itext = new fabric.IText(obj.text || '', {
                  left: obj.left,
                  top: obj.top,
                  fontSize: obj.fontSize,
                  fontFamily: obj.fontFamily,
                  fontWeight: obj.fontWeight,
                  fontStyle: obj.fontStyle,
                  fill: obj.fill,
                  textAlign: obj.textAlign,
                  selectable: obj.selectable !== false,
                  evented: obj.evented !== false,
                });

                objectsToReplace.push({ oldObj: obj, newObj: itext });
              }
            }
          });

          // 替换对象
          objectsToReplace.forEach(({ oldObj, newObj }) => {
            canvas.remove(oldObj);
            canvas.add(newObj);
          });

          canvas.renderAll();
          console.log('✅ 画布渲染完成，已转换 text 为 IText');

          // 等待多帧确保完全渲染
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              console.log('✅ 模板应用完成');
              resolve();
            });
          });
        });
      } catch (error) {
        console.error('❌ 应用模板失败:', error);
        reject(error);
      }
    });
  }

  // 生成缩略图
  private async generateThumbnail(canvas: fabric.Canvas): Promise<string> {
    try {
      // 使用 canvas.toDataURL 生成缩略图
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.2, // 缩小到 20% 尺寸
      });
      return dataURL;
    } catch (error) {
      console.error('❌ 生成缩略图失败:', error);
      return '';
    }
  }

  // 从 JSON 生成缩略图（用于预设模板）
  async generateThumbnailFromJSON(
    canvasJSON: string,
    width: number,
    height: number,
    templateName?: string
  ): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        console.log('⚠️ 服务端环境，跳过缩略图生成');
        resolve('');
        return;
      }

      try {
        console.log('🎨 开始生成缩略图:', templateName, `${width}x${height}`);

        // 创建离屏 canvas
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        console.log('✅ 离屏 canvas 创建成功');

        const fabricCanvas = new fabric.Canvas(offscreenCanvas);
        fabricCanvas.setWidth(width);
        fabricCanvas.setHeight(height);
        console.log('✅ Fabric canvas 初始化成功');

        // 加载 JSON
        const canvasData = JSON.parse(canvasJSON);
        console.log('✅ JSON 解析成功，对象数量:', canvasData.objects?.length || 0);

        // 🆕 根据模板名称设置背景色
        const backgroundColorMap: Record<string, string> = {
          // 3:4 竖版
          '便签纸·黄色': '#FFFBEA',
          '引用卡片·蓝色': '#E3F2FD',
          '极简文字·白色': '#FFFFFF',
          '便签纸·粉色': '#FFF0F5',
          '引用卡片·绿色': '#E8F5E9',
          // 4:3 横版
          '便签纸·黄色·横版': '#FFFBEA',
          '引用卡片·蓝色·横版': '#E3F2FD',
          // 1:1 方形
          '极简文字·白色·方形': '#FFFFFF',
          '便签纸·粉色·方形': '#FFF0F5',
          // 16:9 横版
          '极简文字·白色·16:9': '#FFFFFF',
          // 9:16 竖版
          '便签纸·黄色·9:16': '#FFFBEA',
        };

        const backgroundColor = templateName ? (backgroundColorMap[templateName] || '#ffffff') : '#ffffff';
        console.log('🎨 背景色:', backgroundColor);

        fabricCanvas.loadFromJSON(canvasData, () => {
          console.log('✅ loadFromJSON 完成');

          // 设置背景色
          fabricCanvas.setBackgroundColor(backgroundColor, () => {
            console.log('✅ 背景色设置完成');
            fabricCanvas.renderAll();
            console.log('✅ 渲染完成');

            // 生成缩略图
            const thumbnail = fabricCanvas.toDataURL({
              format: 'png',
              quality: 0.8,
              multiplier: 0.2,
            });

            console.log('✅ 缩略图生成成功，长度:', thumbnail.length, '前50字符:', thumbnail.substring(0, 50));

            // 清理
            fabricCanvas.dispose();
            resolve(thumbnail);
          });
        });
      } catch (error) {
        console.error('❌ 从 JSON 生成缩略图失败:', error);
        resolve('');
      }
    });
  }

  // 批量添加预设模板
  addPresetTemplates(templates: Omit<Template, 'id' | 'createdAt'>[]): void {
    templates.forEach(template => {
      // 检查是否已存在同名预设模板
      const existing = this.templates.find(
        t => t.isPreset && t.name === template.name
      );

      if (existing) {
        // 🆕 如果已存在，更新 thumbnail（确保使用最新的缩略图 URL）
        this.update(existing.id, { thumbnail: template.thumbnail });
      } else {
        // 不存在则添加
        this.add(template);
      }
    });
  }

  // 重置为预设模板（删除所有自定义模板）
  resetToPresets(): void {
    this.templates = this.templates.filter(t => t.isPreset);
    this.saveToStorage();
  }

  // 获取所有分类
  getCategories(): TemplateCategory[] {
    const categories = new Set<TemplateCategory>();
    this.templates.forEach(t => categories.add(t.category));
    return Array.from(categories);
  }
}

// 导出单例实例
export function getTemplateManager(): TemplateManager {
  return TemplateManager.getInstance();
}
