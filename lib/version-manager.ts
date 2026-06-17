// 版本管理器
import { CanvasVersion } from './types';

export class VersionManager {
  private versions: CanvasVersion[] = [];
  private activeId = '';
  private storageKey = 'xhs_cover_versions';

  constructor() {
    this.load();
    if (this.versions.length === 0) {
      this.create('画布 1');
    }
    this.activeId = this.versions[0].id;
  }

  // 创建新版本
  create(name?: string) {
    if (this.versions.length >= 5) {
      throw new Error('最多支持 5 个画布');
    }
    const version: CanvasVersion = {
      id: Date.now().toString(),
      name: name || `画布 ${this.versions.length + 1}`,
      data: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.versions.push(version);
    this.save();
    return version;
  }

  // 复制版本
  duplicate(sourceId: string, data: string) {
    const source = this.versions.find((v) => v.id === sourceId);
    if (!source) {
      throw new Error('源版本不存在');
    }
    const newVersion = this.create(`${source.name} - 副本`);
    newVersion.data = data;
    this.save();
    return newVersion;
  }

  // 更新版本
  update(id: string, data: string, thumbnail?: string) {
    const version = this.versions.find((v) => v.id === id);
    if (version) {
      version.data = data;
      version.updatedAt = Date.now();
      if (thumbnail) {
        version.thumbnail = thumbnail;
      }
      this.save();
    }
  }

  // 重命名版本
  rename(id: string, newName: string) {
    const version = this.versions.find((v) => v.id === id);
    if (version) {
      version.name = newName;
      version.updatedAt = Date.now();
      this.save();
    }
  }

  // 删除画布
  delete(id: string) {
    if (this.versions.length === 1) {
      throw new Error('至少需要保留 1 个画布');
    }
    this.versions = this.versions.filter((v) => v.id !== id);
    if (this.activeId === id) {
      this.activeId = this.versions[0].id;
    }
    this.save();
  }

  // 获取所有版本
  getAll() {
    return this.versions;
  }

  // 获取当前激活版本
  getActive() {
    return this.versions.find((v) => v.id === this.activeId);
  }

  // 根据 ID 获取版本
  getById(id: string) {
    return this.versions.find((v) => v.id === id);
  }

  // 设置激活版本
  setActive(id: string) {
    this.activeId = id;
    this.save();
  }

  // 保存到 localStorage
  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({
            versions: this.versions,
            activeId: this.activeId,
          })
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.error('localStorage 已满，尝试清理...');

          // 策略 1: 删除所有缩略图
          let cleaned = false;
          this.versions.forEach(v => {
            if (v.thumbnail) {
              delete v.thumbnail;
              cleaned = true;
            }
          });

          if (cleaned) {
            console.warn('已删除所有缩略图以释放空间');
            try {
              localStorage.setItem(
                this.storageKey,
                JSON.stringify({
                  versions: this.versions,
                  activeId: this.activeId,
                })
              );
              return; // 保存成功，返回
            } catch (e) {
              // 继续尝试策略 2
            }
          }

          // 策略 2: 删除最旧的版本（除了当前激活的）
          const oldestVersion = this.versions
            .filter(v => v.id !== this.activeId)
            .sort((a, b) => a.updatedAt - b.updatedAt)[0];

          if (oldestVersion) {
            console.warn(`自动删除最旧的版本: ${oldestVersion.name}`);
            this.delete(oldestVersion.id);
            // 重试保存
            this.save();
          } else {
            throw error; // 如果没有可删除的版本，抛出错误
          }
        } else {
          throw error;
        }
      }
    }
  }

  // 从 localStorage 加载
  private load() {
    if (typeof window !== 'undefined') {
      const json = localStorage.getItem(this.storageKey);
      if (json) {
        try {
          const data = JSON.parse(json);
          this.versions = data.versions || [];
          this.activeId = data.activeId || '';
        } catch (error) {
          console.error('Failed to load versions:', error);
        }
      }
    }
  }
}
