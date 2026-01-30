import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// 单独的 MCQ 后端 baseURL
const MCQ_API_BASE_URL = process.env.VUE_APP_MCQ_BASE_URL;

const mcqHttp: AxiosInstance = axios.create({
  baseURL: MCQ_API_BASE_URL,
  timeout: 300000, // 5分钟，格式化大文档需要更长时间
  headers: { 'Content-Type': 'application/json' },
});

mcqHttp.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 如需携带主站 token，可按需从 localStorage 取并塞给 headers
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

mcqHttp.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(error)
);

export default mcqHttp;
