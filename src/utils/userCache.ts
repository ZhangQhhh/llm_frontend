/**
 * 用户信息缓存服务
 * 提供用户ID到用户名的映射，带缓存和过期机制
 */

import { API_ENDPOINTS } from '@/config/api/api';
import { fetchWithAuth, getApiUrl } from '@/utils/request';

export interface CachedUser {
  id: string;
  username: string;
  email?: string;
  role?: string;
}

interface UserCache {
  data: Map<string, CachedUser>;
  timestamp: number;
  loading: boolean;
  loadPromise: Promise<void> | null;
}

// 缓存过期时间：5分钟
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

// 全局缓存实例
const cache: UserCache = {
  data: new Map(),
  timestamp: 0,
  loading: false,
  loadPromise: null
};

/**
 * 检查缓存是否有效
 */
function isCacheValid(): boolean {
  return cache.data.size > 0 && (Date.now() - cache.timestamp) < CACHE_EXPIRY_MS;
}

/**
 * 加载用户列表到缓存
 */
async function loadUserCache(): Promise<void> {
  // 如果正在加载，等待加载完成
  if (cache.loading && cache.loadPromise) {
    return cache.loadPromise;
  }

  // 如果缓存有效，直接返回
  if (isCacheValid()) {
    return;
  }

  cache.loading = true;
  cache.loadPromise = (async () => {
    try {
      const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_LIST));
      if (response.ok) {
        const raw = response.data?.data?.list || response.data?.data?.users || response.data || [];
        const list = Array.isArray(raw) ? raw : (raw.items || []);
        
        // 更新缓存
        cache.data.clear();
        for (const user of list) {
          const rawId = user.id ?? user.user_id ?? user.userId;
          if (rawId !== undefined && rawId !== null) {
            const id = String(rawId);
            cache.data.set(id, {
              id,
              username: user.username || id,
              email: user.email,
              role: user.role
            });
          }
        }
        cache.timestamp = Date.now();
      }
    } catch (err) {
      console.error('加载用户缓存失败:', err);
    } finally {
      cache.loading = false;
      cache.loadPromise = null;
    }
  })();

  return cache.loadPromise;
}

/**
 * 获取用户名（根据用户ID）
 * @param userId 用户ID
 * @returns 用户名，如果未找到则返回用户ID本身
 */
export function getUserNameById(userId?: string | number): string {
  if (userId === undefined || userId === null || userId === '') return '-';
  const normalizedId = String(userId);
  const user = cache.data.get(normalizedId);
  return user?.username || normalizedId;
}

/**
 * 获取用户信息（根据用户ID）
 * @param userId 用户ID
 * @returns 用户信息对象，如果未找到则返回 null
 */
export function getUserById(userId: string | number): CachedUser | null {
  const normalizedId = String(userId);
  return cache.data.get(normalizedId) || null;
}

/**
 * 获取所有缓存的用户
 */
export function getAllCachedUsers(): CachedUser[] {
  return Array.from(cache.data.values());
}

/**
 * 获取用户ID到用户名的映射Map
 */
export function getUserNameMap(): Map<string, string> {
  const map = new Map<string, string>();
  cache.data.forEach((user, id) => {
    map.set(id, user.username);
  });
  return map;
}

/**
 * 确保缓存已加载（异步）
 * 在需要使用缓存前调用此方法
 */
export async function ensureUserCacheLoaded(): Promise<void> {
  await loadUserCache();
}

/**
 * 强制刷新缓存
 */
export async function refreshUserCache(): Promise<void> {
  cache.timestamp = 0; // 使缓存失效
  await loadUserCache();
}

/**
 * 清除缓存
 */
export function clearUserCache(): void {
  cache.data.clear();
  cache.timestamp = 0;
}

/**
 * 获取缓存状态信息
 */
export function getCacheStatus(): { 
  size: number; 
  isValid: boolean; 
  age: number;
  loading: boolean;
} {
  return {
    size: cache.data.size,
    isValid: isCacheValid(),
    age: Date.now() - cache.timestamp,
    loading: cache.loading
  };
}
