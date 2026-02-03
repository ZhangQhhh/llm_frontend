/**
 * 统一的HTTP请求工具
 */

import { STORAGE_KEYS } from '@/config/api/api'
import http, { mcqHttp } from '@/config/api/http'

/**
 * 带认证的Axios请求（用于 /api 前缀的接口）
 */
export const fetchWithAuth = async (url: string, options: any = {}) => {
  try {
    const response = await http.request({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.data || options.body
    })
    
    return { 
      data: response.data, 
      ok: true, 
      status: response.status 
    }
  } catch (error: any) {
    return {
      data: error.response?.data || {},
      ok: false,
      status: error.response?.status || 500
    }
  }
}

/**
 * 带认证的MCQ请求（用于 /llm 前缀的接口，不经过 /api）
 */
export const fetchMcqWithAuth = async (url: string, options: any = {}) => {
  try {
    const response = await mcqHttp.request({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.data || options.body
    })
    
    return { 
      data: response.data, 
      ok: true, 
      status: response.status 
    }
  } catch (error: any) {
    return {
      data: error.response?.data || {},
      ok: false,
      status: error.response?.status || 500
    }
  }
}

/**
 * 获取完整的API URL
 */
export const getApiUrl = (path: string): string => {
  return `${window.location.origin}${path}`
}

/**
 * 下载文件
 */
export const downloadFile = (url: string, filename?: string) => {
  const link = document.createElement('a')
  link.href = url
  if (filename) {
    link.download = filename
  }
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 在新窗口打开URL
 */
export const openInNewTab = (url: string) => {
  window.open(url, '_blank')
}
