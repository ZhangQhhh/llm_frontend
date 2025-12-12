import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './api';
import { ErrorHandler } from '@/utils/errorHandler';
import { forceLogout } from '@/utils/userStatusChecker';

// 创建 Axios 实例
const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加 token 和用户信息
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 添加用户角色和用户名（后端权限校验需要）
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (userStr && config.headers) {
      try {
        const user = JSON.parse(userStr);
        if (user.role) {
          config.headers['X-User-Role'] = user.role;
        }
        if (user.username) {
          config.headers['X-User-Name'] = encodeURIComponent(user.username);
        }
      } catch (e) {
        // ignore parse error
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理响应
http.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const bizCode = (error.response?.data as any)?.code;

    // 只在明确的认证失败或封禁时才强制登出
    // 401: token 无效/过期
    // 460: 自定义的封禁状态码
    // BANNED: 业务层封禁标识
    // 注意：403 是权限不足，不应该强制登出（例如普通用户访问管理员接口）
    if (status === 401 || status === 460 || bizCode === 'BANNED') {
      forceLogout('登录已失效或账号已被封禁，请重新登录');
    }

    // 使用统一错误处理工具
    ErrorHandler.handleHttpError(error);
    return Promise.reject(error);
  }
);

export default http;
