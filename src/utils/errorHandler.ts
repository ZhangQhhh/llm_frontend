import { ElMessage } from 'element-plus'
import router from '@/router'
import store from '@/store'

/**
 * 统一错误处理工具
 */
export class ErrorHandler {
  /**
   * 处理 HTTP 错误
   * @param error 错误对象
   * @param customMessage 自定义错误消息
   */
  static handleHttpError(error: any, customMessage?: string) {
    console.error('HTTP 错误:', error)
    
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '请求失败'
    
    switch (status) {
      case 401:
        this.handleTokenExpired()
        break
      case 403:
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
  
  /**
   * 处理 Token 过期
   */
  static handleTokenExpired() {
    console.warn('Token 已失效，清除本地存储并跳转登录页')
    
    // 清除所有本地存储
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('multi_turn_chat_jwt')
    localStorage.removeItem('multi_turn_chat_session_id')
    
    // 🔥 关键修复：清除 Vuex store 的用户状态，确保 UI 同步更新
    store.commit('logout')
    
    // 显示友好提示
    ElMessage.warning('登录已过期，请重新登录')
    
    // 延迟跳转，避免在组件渲染过程中跳转导致问题
    setTimeout(() => {
      if (router.currentRoute.value.name !== 'login') {
        router.push({
          name: 'login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
      }
    }, 1000)
  }
  
  /**
   * 处理网络错误
   */
  static handleNetworkError() {
    ElMessage.error('网络连接失败，请检查网络设置')
  }
  
  /**
   * 处理通用错误
   * @param error 错误对象
   * @param customMessage 自定义错误消息
   */
  static handleError(error: any, customMessage?: string) {
    console.error('通用错误:', error)
    
    if (error.code === 'NETWORK_ERROR') {
      this.handleNetworkError()
    } else if (error.response) {
      this.handleHttpError(error, customMessage)
    } else {
      ElMessage.error(customMessage || error.message || '操作失败')
    }
  }
}

/**
 * 错误处理装饰器
 * 自动捕获异步函数中的错误并处理
 */
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
