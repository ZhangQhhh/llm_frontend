import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { STORAGE_KEYS } from './api'; // 假设 api.ts 导出了 STORAGE_KEYS

// 为你的 LLM/Knowledge API 定义单独的 baseURL
// 你需要将这个环境变量添加到你的 .env 文件中
// 例如：VUE_APP_LLM_BASE_URL=/llm
const LLM_API_BASE_URL = process.env.VUE_APP_LLM_BASE_URL;

// 创建一个专门用于 LLM 服务的 Axios 实例
const llmHttp: AxiosInstance = axios.create({
    baseURL: LLM_API_BASE_URL,
    timeout: 90000, // LLM 请求可能需要更长时间
    headers: {
        'Content-Type': 'application/json',
    },
});

// 为 LLM 实例设置请求拦截器
llmHttp.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // LLM 服务可能使用不同的 token，例如 CHAT_TOKEN
        const token = localStorage.getItem(STORAGE_KEYS.CHAT_TOKEN);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // 添加用户角色信息（用于视频中心等功能的权限校验）
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

// 为 LLM 实例设置响应拦截器
llmHttp.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // 如果 token 过期，移除对应的 token
            localStorage.removeItem(STORAGE_KEYS.CHAT_TOKEN);
        }
        return Promise.reject(error);
    }
);

export default llmHttp;
