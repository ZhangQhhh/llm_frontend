import llmHttp from '@/config/api/llmHttp';
import { API_ENDPOINTS } from '@/config/api/api';

// 知识库类型定义
export interface KBFile {
  name: string;
  size: number;
  modified: string;
}

export interface KBListResponse {
  ok: boolean;
  kb_type: string;
  kb_name: string;
  files: KBFile[];
  total_count: number;
  total_size: number;
}

export interface KBUploadResponse {
  ok: boolean;
  message: string;
  file_name?: string;
  kb_type?: string;
}

export interface KBDeleteResponse {
  ok: boolean;
  message: string;
  need_rebuild?: boolean;
  kb_type?: string;
  kb_name?: string;
}

export interface KBStatusItem {
  kb_type: string;
  updating: boolean;
  progress: string;
  file_count: number;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  last_error: string;
}

export interface KBStatusResponse {
  ok: boolean;
  data: Record<string, KBStatusItem>;
}

export interface KBIsUpdatingResponse {
  ok: boolean;
  updating: boolean;
  updating_kbs: string[];
}

export interface KBRebuildResponse {
  ok: boolean;
  message: string;
}

// 知识库类型配置
export const KB_TYPES = [
  { value: 'general', label: '通用知识库', description: '默认知识库，存放通用业务文档' },
  { value: 'visa_free', label: '免签知识库', description: '各国免签政策、签证规定' },
  { value: 'airline', label: '航司知识库', description: '航空公司规定、机组人员政策' },
  { value: 'general_b', label: '通用知识库B', description: '备用通用知识库' },
  { value: 'hidden', label: '隐藏知识库', description: '题库相关知识，用于辅助答题' },
];

// 支持的文件格式
export const SUPPORTED_FILE_TYPES = ['txt', 'md', 'docx', 'doc', 'pdf', 'csv', 'json', 'html', 'htm'];

// 知识库口令存储键
const KB_PASSWORD_KEY = 'kb_password';

// 获取知识库口令
export const getKBPassword = (): string => {
  return localStorage.getItem(KB_PASSWORD_KEY) || '';
};

// 设置知识库口令
export const setKBPassword = (password: string): void => {
  localStorage.setItem(KB_PASSWORD_KEY, password);
};

// 列出文件
export const listFiles = async (kbType: string = 'general'): Promise<KBListResponse> => {
  const response = await llmHttp.get(API_ENDPOINTS.KNOWLEDGE_BASE.LIST_FILES, {
    params: { kb: kbType }
  });
  return response.data;
};

// 上传文件
export const uploadFile = async (
  file: File,
  kbType: string = 'general',
  autoRebuild: boolean = true,
  kbPassword: string
): Promise<KBUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kb', kbType);
  formData.append('auto_rebuild', autoRebuild.toString());

  const response = await llmHttp.post(API_ENDPOINTS.KNOWLEDGE_BASE.UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-KB-PASSWORD': kbPassword
    }
  });
  return response.data;
};

// 删除文件
export const deleteFile = async (
  fileName: string,
  kbType: string = 'general',
  kbPassword: string
): Promise<KBDeleteResponse> => {
  const response = await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE_BASE.DELETE_FILE,
    { kb: kbType, file_name: fileName },
    {
      headers: {
        'X-KB-PASSWORD': kbPassword
      }
    }
  );
  return response.data;
};

// 查询更新状态
export const getUpdateStatus = async (kbType?: string): Promise<KBStatusResponse> => {
  const response = await llmHttp.get(API_ENDPOINTS.KNOWLEDGE_BASE.UPDATE_STATUS, {
    params: kbType ? { kb: kbType } : {}
  });
  return response.data;
};

// 快速检查是否更新中
export const isUpdating = async (kbType?: string): Promise<KBIsUpdatingResponse> => {
  const response = await llmHttp.get(API_ENDPOINTS.KNOWLEDGE_BASE.IS_UPDATING, {
    params: kbType ? { kb: kbType } : {}
  });
  return response.data;
};

// 手动触发重建
export const triggerRebuild = async (
  kbType: string = 'general',
  kbPassword: string
): Promise<KBRebuildResponse> => {
  const response = await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE_BASE.REBUILD,
    { kb: kbType },
    {
      headers: {
        'X-KB-PASSWORD': kbPassword
      }
    }
  );
  return response.data;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期时间
export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 获取文件扩展名
export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

// 检查文件类型是否支持
export const isFileTypeSupported = (fileName: string): boolean => {
  const ext = getFileExtension(fileName);
  return SUPPORTED_FILE_TYPES.includes(ext);
};
