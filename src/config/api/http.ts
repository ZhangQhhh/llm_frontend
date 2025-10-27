import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './api';

// 创建 Axios 实例
const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加 token
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // 可以在这里统一处理错误，比如 token 过期跳转登录等
    if (error.response?.status === 401) {
      // Token 过期或未授权
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      // 可以在这里跳转到登录页，但为了避免循环依赖，建议在组件中处理
    }
    return Promise.reject(error);
  }
);

export default http;
