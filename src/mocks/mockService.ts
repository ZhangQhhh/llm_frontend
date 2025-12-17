/**
 * 模拟数据服务
 * 通过 URL 参数 ?mock=1 启用模拟数据模式
 * 当 API 无法访问时，可以使用模拟数据进行本地开发和演示
 */

// 检查是否启用模拟数据模式
export const isMockEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 检查 URL 参数
  const params = new URLSearchParams(window.location.search);
  if (params.get('mock') === '1') return true;
  
  // 检查 localStorage
  try {
    if (window.localStorage?.getItem('ENABLE_MOCK_DATA') === 'true') return true;
  } catch {
    // 忽略 localStorage 访问异常
  }
  
  // 检查环境变量
  if (process.env.VUE_APP_ENABLE_MOCK === 'true') return true;
  
  return false;
};

// 模拟延迟，使模拟数据更真实
export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 生成随机 ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// 生成随机日期（最近 N 天内）
export const randomDate = (daysAgo: number = 30): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
};

// 格式化文件大小
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
