/**
 * 用户活动缓存服务
 * 从问答日志中提取用户的最近登录时间、IP和问答次数
 * 带缓存机制，避免重复请求
 */

import { STORAGE_KEYS } from '@/config/api/api'
import { getQALogsByDate } from '@/utils/chatApi'

export interface UserActivity {
  userId: string
  ip: string
  lastLogin: string
  qaCount: number
}

interface ActivityCache {
  data: Map<string, UserActivity>
  timestamp: number
  loading: boolean
  loadPromise: Promise<Map<string, UserActivity>> | null
}

// 缓存过期时间：10分钟
const CACHE_EXPIRY_MS = 10 * 60 * 1000

// 全局缓存实例
const cache: ActivityCache = {
  data: new Map(),
  timestamp: 0,
  loading: false,
  loadPromise: null
}

/**
 * 检查缓存是否有效
 */
function isCacheValid(): boolean {
  return cache.data.size > 0 && (Date.now() - cache.timestamp) < CACHE_EXPIRY_MS
}

/**
 * 判断是否为有效IP地址
 */
function isValidIP(ip: string | undefined): boolean {
  if (!ip) return false
  // 排除非IP值如 sync、unknown 等
  if (['sync', 'unknown', 'null', 'undefined', ''].includes(ip.toLowerCase())) return false
  // 简单的IP格式检查（IPv4或IPv6）
  return /^[\d.:a-fA-F]+$/.test(ip)
}

/**
 * 从日志加载用户活动数据
 */
async function loadActivityFromLogs(): Promise<Map<string, UserActivity>> {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  if (!token) {
    return new Map()
  }

  const activityMap = new Map<string, UserActivity>()
  const today = new Date()
  
  // 获取最近30天的日志
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)
    
    try {
      const response = await getQALogsByDate(token, { 
        date: dateStr, 
        page_size: 500  // 每天最多500条
      })
      
      if (response?.logs) {
        for (const log of response.logs) {
          const userId = log.metadata?.user_id
          const ip = log.metadata?.ip
          const timestamp = log.timestamp
          
          if (userId) {
            const existing = activityMap.get(userId)
            const currentCount = existing?.qaCount || 0
            
            // 更新问答次数
            const newCount = currentCount + 1
            
            // 判断是否需要更新（首次或时间更新）
            if (!existing || new Date(timestamp) > new Date(existing.lastLogin)) {
              const validIP = isValidIP(ip) ? ip! : (existing?.ip || '')
              activityMap.set(userId, {
                userId,
                ip: validIP,
                lastLogin: timestamp,
                qaCount: newCount
              })
            } else {
              // 只更新问答次数
              existing.qaCount = newCount
            }
          }
        }
      }
    } catch (e) {
      // 某天没有日志，继续
      console.log(`No logs for ${dateStr}`)
    }
  }
  
  return activityMap
}

/**
 * 获取用户活动数据（带缓存）
 */
export async function getUserActivityMap(): Promise<Map<string, UserActivity>> {
  // 如果缓存有效，直接返回
  if (isCacheValid()) {
    return cache.data
  }
  
  // 如果正在加载，等待加载完成
  if (cache.loading && cache.loadPromise) {
    return cache.loadPromise
  }
  
  // 开始加载
  cache.loading = true
  cache.loadPromise = loadActivityFromLogs()
  
  try {
    const data = await cache.loadPromise
    cache.data = data
    cache.timestamp = Date.now()
    return data
  } finally {
    cache.loading = false
    cache.loadPromise = null
  }
}

/**
 * 获取单个用户的活动数据
 */
export async function getUserActivity(userId: string): Promise<UserActivity | null> {
  const map = await getUserActivityMap()
  return map.get(userId) || null
}

/**
 * 强制刷新缓存
 */
export async function refreshActivityCache(): Promise<Map<string, UserActivity>> {
  cache.timestamp = 0 // 使缓存失效
  return getUserActivityMap()
}

/**
 * 获取问答排行榜（前N名）
 */
export async function getQARanking(topN: number = 10): Promise<UserActivity[]> {
  const map = await getUserActivityMap()
  const list = Array.from(map.values())
  list.sort((a, b) => b.qaCount - a.qaCount)
  return list.slice(0, topN)
}

/**
 * 获取缓存状态
 */
export function getActivityCacheStatus(): {
  size: number
  isValid: boolean
  age: number
  loading: boolean
} {
  return {
    size: cache.data.size,
    isValid: isCacheValid(),
    age: Date.now() - cache.timestamp,
    loading: cache.loading
  }
}

/**
 * 清除缓存
 */
export function clearActivityCache(): void {
  cache.data.clear()
  cache.timestamp = 0
}
