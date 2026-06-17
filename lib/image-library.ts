/**
 * 图片库管理器
 * 管理所有上传到七牛云的图片URL
 */

export interface ImageLibraryItem {
  url: string;
  uploadedAt: number;
  thumbnail?: string; // 缩略图URL(可选)
  filename?: string;
}

const STORAGE_KEY = 'image-library';

export class ImageLibrary {
  private items: ImageLibraryItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从localStorage加载图片库
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
        console.log('📚 图片库加载成功:', this.items.length, '张图片');
      }
    } catch (error) {
      console.error('❌ 图片库加载失败:', error);
      this.items = [];
    }
  }

  /**
   * 保存图片库到localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      console.log('💾 图片库保存成功:', this.items.length, '张图片');
    } catch (error) {
      console.error('❌ 图片库保存失败:', error);
    }
  }

  /**
   * 添加图片到图库
   * @param url 图片URL
   * @param filename 文件名(可选)
   * @returns 是否是新图片(true=新添加, false=已存在)
   */
  addImage(url: string, filename?: string): boolean {
    // 检查是否已存在
    const exists = this.items.some(item => item.url === url);
    if (exists) {
      console.log('ℹ️ 图片已在图库中:', url);
      return false;
    }

    // 添加新图片
    const newItem: ImageLibraryItem = {
      url,
      uploadedAt: Date.now(),
      filename,
    };

    this.items.unshift(newItem); // 添加到开头(最新的在前面)
    this.saveToStorage();
    console.log('✅ 图片已添加到图库:', url);
    return true;
  }

  /**
   * 获取所有图片
   * @returns 图片列表(按上传时间倒序)
   */
  getImages(): ImageLibraryItem[] {
    return [...this.items];
  }

  /**
   * 删除图片
   * @param url 图片URL
   */
  removeImage(url: string) {
    const index = this.items.findIndex(item => item.url === url);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.saveToStorage();
      console.log('🗑️ 图片已从图库删除:', url);
    }
  }

  /**
   * 清空图库
   */
  clear() {
    this.items = [];
    this.saveToStorage();
    console.log('🗑️ 图片库已清空');
  }

  /**
   * 获取图片数量
   */
  getCount(): number {
    return this.items.length;
  }
}

// 单例模式
let instance: ImageLibrary | null = null;

export function getImageLibrary(): ImageLibrary {
  if (!instance) {
    instance = new ImageLibrary();
  }
  return instance;
}
