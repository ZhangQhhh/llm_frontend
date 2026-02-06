/**
 * 用户活动缓存服务
 * 从问答日志中提取用户的最近登录时间、IP和问答次数
 * 带缓存机制，避免重复请求
 */

import { STORAGE_KEYS } from '@/config/api/api'
import {
  getQALogDates,
  getQALogsByDate,
  getReportLogs,
  getWritingLogDates,
  getWritingLogsByDate
} from '@/utils/chatApi'
import { ensureUserCacheLoaded, getAllCachedUsers } from '@/utils/userCache'

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
const LOOKBACK_DAYS = 30
const MAX_PAGE_SIZE = 500

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


function normalizeId(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const str = String(value).trim()
  return str ? str : undefined
}

function buildLookbackDates(days: number): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().slice(0, 10))
  }
  return dates
}

function pickFirstString(values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return undefined
}

function extractTimestamp(log: Record<string, any>): string | undefined {
  return pickFirstString([
    log.timestamp,
    log.created_at,
    log.updated_at,
    log.createdAt,
    log.updatedAt,
    log.time,
    log.datetime,
    log.date
  ])
}

function extractIP(log: Record<string, any>): string | undefined {
  return pickFirstString([
    log.metadata?.ip,
    log.metadata?.client_ip,
    log.metadata?.remote_ip,
    log.ip,
    log.client_ip,
    log.remote_ip,
    log.user_ip
  ])
}

function buildUsernameIndex(): Map<string, string> {
  const index = new Map<string, string>()
  const users = getAllCachedUsers()
  for (const user of users) {
    const username = user.username?.toLowerCase()
    if (username && !index.has(username)) {
      index.set(username, user.id)
    }
  }
  return index
}

function extractUserId(
  log: Record<string, any>,
  usernameIndex: Map<string, string>
): string | undefined {
  const direct = normalizeId(
    log.user_id ??
      log.userId ??
      log.userid ??
      log.uid ??
      log.user?.id ??
      log.metadata?.user_id ??
      log.metadata?.userId ??
      log.metadata?.uid
  )
  if (direct) return direct

  const username = pickFirstString([
    log.username,
    log.user_name,
    log.metadata?.username,
    log.metadata?.user_name
  ])
  if (!username) return undefined
  return usernameIndex.get(username.toLowerCase())
}

function updateActivityFromLog(
  activityMap: Map<string, UserActivity>,
  log: Record<string, any>,
  usernameIndex: Map<string, string>,
  options: { countQA?: boolean } = {}
): void {
  const userId = extractUserId(log, usernameIndex)
  const timestamp = extractTimestamp(log)
  if (!userId || !timestamp) return

  const ip = extractIP(log)
  const existing = activityMap.get(userId)
  const shouldCountQA = options.countQA === true
  const nextQaCount = (existing?.qaCount || 0) + (shouldCountQA ? 1 : 0)

  if (!existing) {
    activityMap.set(userId, {
      userId,
      ip: isValidIP(ip) ? ip! : '',
      lastLogin: timestamp,
      qaCount: nextQaCount
    })
    return
  }

  existing.qaCount = nextQaCount
  const existingTime = Date.parse(existing.lastLogin)
  const newTime = Date.parse(timestamp)
  if (!Number.isNaN(newTime) && (Number.isNaN(existingTime) || newTime > existingTime)) {
    const validIP = isValidIP(ip) ? ip! : (existing.ip || '')
    activityMap.set(userId, {
      ...existing,
      ip: validIP,
      lastLogin: timestamp,
      qaCount: existing.qaCount
    })
  }
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
  const lookbackDates = buildLookbackDates(LOOKBACK_DAYS)
  const lookbackSet = new Set(lookbackDates)

  await ensureUserCacheLoaded()
  const usernameIndex = buildUsernameIndex()

  // QA logs
  let qaDates = lookbackDates
  try {
    const qaResult = await getQALogDates(token)
    if (qaResult?.dates?.length) {
      qaDates = qaResult.dates.filter((date) => lookbackSet.has(date))
    }
  } catch (e) {
    console.log('Failed to load QA log dates, fallback to lookback range')
  }

  for (const dateStr of qaDates) {
    try {
      const response = await getQALogsByDate(token, {
        date: dateStr,
        page_size: MAX_PAGE_SIZE
      })

      if (response?.logs) {
        for (const log of response.logs) {
          updateActivityFromLog(activityMap, log as Record<string, any>, usernameIndex, {
            countQA: true
          })
        }
      }
    } catch (e) {
      console.log(`No QA logs for ${dateStr}`)
    }
  }

  // Writing logs
  let writingDates = lookbackDates
  try {
    const writingResult = await getWritingLogDates(token)
    if (writingResult?.dates?.length) {
      writingDates = writingResult.dates.filter((date) => lookbackSet.has(date))
    }
  } catch (e) {
    console.log('Failed to load writing log dates, fallback to lookback range')
  }

  for (const dateStr of writingDates) {
    try {
      const response = await getWritingLogsByDate(token, {
        date: dateStr,
        page_size: MAX_PAGE_SIZE
      })

      if (response?.logs) {
        for (const log of response.logs) {
          updateActivityFromLog(activityMap, log as Record<string, any>, usernameIndex, { countQA: false })
        }
      }
    } catch (e) {
      console.log(`No writing logs for ${dateStr}`)
    }
  }

  // 不处理 Report logs，只从 QA 和 Writing 日志提取数据

  return activityMap
}

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
  const list = Array.from(map.values()).filter((item) => item.qaCount > 0)
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
