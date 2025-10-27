/**
 * 本地存储工具函数
 */

/**
 * 获取本地存储的值
 */
export function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`获取存储项失败: ${key}`, error);
    return null;
  }
}

/**
 * 设置本地存储的值
 */
export function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`设置存储项失败: ${key}`, error);
  }
}

/**
 * 删除本地存储的值
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`删除存储项失败: ${key}`, error);
  }
}

/**
 * 清空所有本地存储
 */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('清空存储失败', error);
  }
}
