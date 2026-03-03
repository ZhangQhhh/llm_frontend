import { ElMessage } from 'element-plus'
import router from '@/router'
import store from '@/store'

const IP_BLOCKED_MESSAGE_KEY = 'ip_blocked_message'
const DEFAULT_IP_BLOCKED_MESSAGE = '当前IP已被禁止访问'

const getErrorMessage = (error: any): string => {
  return error?.response?.data?.message || error?.message || '请求失败'
}

const isIpBlockedError = (error: any): boolean => {
  const status = error?.response?.status
  const payload = error?.response?.data || {}
  const bizCode = payload.code
  const message = String(payload.message || getErrorMessage(error) || '')

  if (status !== 403) return false

  return bizCode === 403 && message === DEFAULT_IP_BLOCKED_MESSAGE
}

const redirectToIpBlockedPage = (message?: string) => {
  try {
    sessionStorage.setItem(IP_BLOCKED_MESSAGE_KEY, message || DEFAULT_IP_BLOCKED_MESSAGE)
  } catch {
    // ignore sessionStorage errors
  }

  if (router.currentRoute.value.name !== 'ip-blocked') {
    router.push({ name: 'ip-blocked' })
  }
}

export class ErrorHandler {
  static handleHttpError(error: any, customMessage?: string) {
    console.error('HTTP 错误:', error)

    const status = error?.response?.status
    const message = getErrorMessage(error)

    switch (status) {
      case 401:
        this.handleTokenExpired()
        break
      case 403:
        if (isIpBlockedError(error)) {
          redirectToIpBlockedPage(message)
          break
        }
        ElMessage.error(message || '无权访问，权限不足')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误，请稍后重试')
        break
      case 502:
      case 503:
      case 504:
        ElMessage.error('服务暂时不可用，请稍后重试')
        break
      default:
        ElMessage.error(customMessage || message)
    }
  }

  static handleTokenExpired() {
    console.warn('Token 已失效，清除本地存储并跳转登录页')

    localStorage.removeItem('jwt_token')
    localStorage.removeItem('multi_turn_chat_jwt')
    localStorage.removeItem('multi_turn_chat_session_id')

    store.commit('logout')

    ElMessage.warning('登录已过期，请重新登录')

    setTimeout(() => {
      if (router.currentRoute.value.name !== 'login') {
        router.push({
          name: 'login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
      }
    }, 1000)
  }

  static handleNetworkError() {
    ElMessage.error('网络连接失败，请检查网络设置')
  }

  static handleError(error: any, customMessage?: string) {
    console.error('通用错误:', error)

    if (error?.code === 'NETWORK_ERROR') {
      this.handleNetworkError()
    } else if (error?.response) {
      this.handleHttpError(error, customMessage)
    } else {
      ElMessage.error(customMessage || error?.message || '操作失败')
    }
  }
}

export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  customMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      ErrorHandler.handleError(error, customMessage)
      throw error
    }
  }) as T
}

export default ErrorHandler
export { DEFAULT_IP_BLOCKED_MESSAGE, IP_BLOCKED_MESSAGE_KEY, isIpBlockedError, redirectToIpBlockedPage }
