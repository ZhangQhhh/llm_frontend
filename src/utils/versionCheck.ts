/**
 * 版本检查工具
 * 用于检测前端是否有新版本，并提示用户刷新
 */

const VERSION_KEY = 'app_version'
const CHECK_INTERVAL = 5 * 60 * 1000 // 每5分钟检查一次

let checkTimer: number | null = null

interface VersionInfo {
  version: string
  buildTime: string
  forceRefresh?: boolean
}

/**
 * 获取当前存储的版本
 */
function getStoredVersion(): string | null {
  return localStorage.getItem(VERSION_KEY)
}

/**
 * 存储版本号
 */
function setStoredVersion(version: string): void {
  localStorage.setItem(VERSION_KEY, version)
}

/**
 * 检查版本更新
 */
async function checkVersion(): Promise<void> {
  try {
    // 添加时间戳避免缓存
    const response = await fetch(`/version.json?t=${Date.now()}`)
    if (!response.ok) return
    
    const versionInfo: VersionInfo = await response.json()
    const storedVersion = getStoredVersion()
    
    // 首次访问，存储版本号
    if (!storedVersion) {
      setStoredVersion(versionInfo.version)
      return
    }
    
    // 版本不同，需要更新
    if (storedVersion !== versionInfo.version) {
      console.log(`检测到新版本: ${storedVersion} -> ${versionInfo.version}`)
      
      if (versionInfo.forceRefresh) {
        // 强制刷新
        setStoredVersion(versionInfo.version)
        window.location.reload()
      } else {
        // 提示用户刷新
        if (confirm('检测到新版本，是否立即刷新页面？')) {
          setStoredVersion(versionInfo.version)
          window.location.reload()
        }
      }
    }
  } catch (error) {
    console.log('版本检查失败:', error)
  }
}

/**
 * 启动版本检查
 */
export function startVersionCheck(): void {
  // 立即检查一次
  checkVersion()
  
  // 定时检查
  if (checkTimer) {
    clearInterval(checkTimer)
  }
  checkTimer = window.setInterval(checkVersion, CHECK_INTERVAL)
  
  // 页面可见时检查
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkVersion()
    }
  })
}

/**
 * 停止版本检查
 */
export function stopVersionCheck(): void {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
}

/**
 * 手动触发版本检查
 */
export function manualVersionCheck(): Promise<void> {
  return checkVersion()
}
