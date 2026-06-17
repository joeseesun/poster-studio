/**
 * 最近使用图标管理工具
 * 全局共享，存储在 localStorage
 */

const STORAGE_KEY = 'poster_studio_recent_icons';
const MAX_RECENT_ICONS = 8;

/**
 * 获取最近使用的图标列表
 */
export function getRecentIcons(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const icons = JSON.parse(stored);
    return Array.isArray(icons) ? icons : [];
  } catch (error) {
    console.error('Failed to load recent icons:', error);
    return [];
  }
}

/**
 * 添加图标到最近使用列表
 * @param iconName 图标名称（如 'ArrowUp'）
 */
export function addRecentIcon(iconName: string): void {
  if (typeof window === 'undefined') return;

  try {
    // 获取当前列表
    let recentIcons = getRecentIcons();

    // 移除已存在的相同图标
    recentIcons = recentIcons.filter(name => name !== iconName);

    // 添加到列表开头
    recentIcons.unshift(iconName);

    // 限制数量
    if (recentIcons.length > MAX_RECENT_ICONS) {
      recentIcons = recentIcons.slice(0, MAX_RECENT_ICONS);
    }

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentIcons));
  } catch (error) {
    console.error('Failed to save recent icon:', error);
  }
}

/**
 * 清空最近使用的图标列表
 */
export function clearRecentIcons(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recent icons:', error);
  }
}
