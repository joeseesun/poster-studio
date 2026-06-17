/**
 * 最近使用颜色管理工具
 * 全局共享，存储在 localStorage
 */

const STORAGE_KEY = 'poster_studio_recent_colors';
const MAX_RECENT_COLORS = 10;

/**
 * 获取最近使用的颜色列表
 */
export function getRecentColors(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const colors = JSON.parse(stored);
    return Array.isArray(colors) ? colors : [];
  } catch (error) {
    console.error('Failed to load recent colors:', error);
    return [];
  }
}

/**
 * 添加颜色到最近使用列表
 * @param color 颜色值（HEX格式，如 #FF0000）
 */
export function addRecentColor(color: string): void {
  if (typeof window === 'undefined') return;

  try {
    // 标准化颜色格式（转大写）
    const normalizedColor = color.toUpperCase();

    // 获取当前列表
    let recentColors = getRecentColors();

    // 移除已存在的相同颜色
    recentColors = recentColors.filter(c => c.toUpperCase() !== normalizedColor);

    // 添加到列表开头
    recentColors.unshift(normalizedColor);

    // 限制数量
    if (recentColors.length > MAX_RECENT_COLORS) {
      recentColors = recentColors.slice(0, MAX_RECENT_COLORS);
    }

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentColors));
  } catch (error) {
    console.error('Failed to save recent color:', error);
  }
}

/**
 * 清空最近使用的颜色列表
 */
export function clearRecentColors(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recent colors:', error);
  }
}
