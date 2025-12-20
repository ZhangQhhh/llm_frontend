/**
 * 知识库管理模拟数据
 */

import type { KBFile, KBListResponse, KBStatusItem, KBStatusResponse, KBUploadResponse, KBDeleteResponse, KBIsUpdatingResponse, KBRebuildResponse } from '@/utils/knowledgeBaseApi';
import { mockDelay, randomDate } from './mockService';

// 模拟文件列表
const MOCK_FILES: Record<string, KBFile[]> = {
  general: [
    { name: '边检政策手册-2024.pdf', size: 2456789, modified: randomDate(5) },
    { name: '出入境管理条例.docx', size: 1234567, modified: randomDate(10) },
    { name: '签证类型说明.md', size: 45678, modified: randomDate(15) },
    { name: '常见问题解答.txt', size: 23456, modified: randomDate(20) },
    { name: '业务流程指南.pdf', size: 3456789, modified: randomDate(25) },
  ],
  visa_free: [
    { name: '免签国家列表-2024.xlsx', size: 567890, modified: randomDate(3) },
    { name: '过境免签政策.pdf', size: 1890123, modified: randomDate(7) },
    { name: '144小时免签说明.docx', size: 890123, modified: randomDate(12) },
  ],
  airline: [
    { name: '航司机组人员政策.pdf', size: 2345678, modified: randomDate(2) },
    { name: '国际航班检查手册.docx', size: 1567890, modified: randomDate(8) },
    { name: '机组签证规定.md', size: 78901, modified: randomDate(14) },
  ],
  general_b: [
    { name: '备用知识库文档1.pdf', size: 1234567, modified: randomDate(6) },
    { name: '备用知识库文档2.docx', size: 987654, modified: randomDate(11) },
  ],
  hidden: [
    { name: '题库辅助资料.pdf', size: 4567890, modified: randomDate(1) },
    { name: '答题参考指南.docx', size: 2345678, modified: randomDate(4) },
  ],
};

// 模拟知识库状态
const MOCK_STATUS: Record<string, KBStatusItem> = {
  general: {
    kb_type: 'general',
    updating: false,
    progress: '',
    file_count: 5,
    last_error: '',
  },
  visa_free: {
    kb_type: 'visa_free',
    updating: false,
    progress: '',
    file_count: 3,
    last_error: '',
  },
  airline: {
    kb_type: 'airline',
    updating: false,
    progress: '',
    file_count: 3,
    last_error: '',
  },
  general_b: {
    kb_type: 'general_b',
    updating: false,
    progress: '',
    file_count: 2,
    last_error: '',
  },
  hidden: {
    kb_type: 'hidden',
    updating: false,
    progress: '',
    file_count: 2,
    last_error: '',
  },
};

// 模拟列出文件
export const mockListFiles = async (kbType: string = 'general'): Promise<KBListResponse> => {
  await mockDelay(300);
  const files = MOCK_FILES[kbType] || [];
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  
  return {
    ok: true,
    kb_type: kbType,
    kb_name: getKBName(kbType),
    files: files,
    total_count: files.length,
    total_size: totalSize,
  };
};

// 模拟上传文件
export const mockUploadFile = async (
  file: File,
  kbType: string = 'general',
  _autoRebuild: boolean = true,
  _kbPassword: string
): Promise<KBUploadResponse> => {
  await mockDelay(800);
  
  // 模拟添加文件到列表
  if (!MOCK_FILES[kbType]) {
    MOCK_FILES[kbType] = [];
  }
  
  MOCK_FILES[kbType].push({
    name: file.name,
    size: file.size,
    modified: new Date().toISOString(),
  });
  
  // 更新状态中的文件数量
  if (MOCK_STATUS[kbType]) {
    MOCK_STATUS[kbType].file_count = MOCK_FILES[kbType].length;
  }
  
  return {
    ok: true,
    message: `文件 ${file.name} 上传成功`,
    file_name: file.name,
    kb_type: kbType,
  };
};

// 模拟删除文件
export const mockDeleteFile = async (
  fileName: string,
  kbType: string = 'general',
  _kbPassword: string
): Promise<KBDeleteResponse> => {
  await mockDelay(400);
  
  // 模拟从列表中删除文件
  if (MOCK_FILES[kbType]) {
    const index = MOCK_FILES[kbType].findIndex(f => f.name === fileName);
    if (index > -1) {
      MOCK_FILES[kbType].splice(index, 1);
      // 更新状态中的文件数量
      if (MOCK_STATUS[kbType]) {
        MOCK_STATUS[kbType].file_count = MOCK_FILES[kbType].length;
      }
    }
  }
  
  return {
    ok: true,
    message: `文件 ${fileName} 已删除`,
    need_rebuild: true,
    kb_type: kbType,
    kb_name: getKBName(kbType),
  };
};

// 模拟获取更新状态
export const mockGetUpdateStatus = async (_kbType?: string): Promise<KBStatusResponse> => {
  await mockDelay(200);
  
  return {
    ok: true,
    data: { ...MOCK_STATUS },
  };
};

// 模拟检查是否更新中
export const mockIsUpdating = async (_kbType?: string): Promise<KBIsUpdatingResponse> => {
  await mockDelay(100);
  
  const updatingKbs = Object.entries(MOCK_STATUS)
    .filter(([_, status]) => status.updating)
    .map(([kbType, _]) => kbType);
  
  return {
    ok: true,
    updating: updatingKbs.length > 0,
    updating_kbs: updatingKbs,
  };
};

// 模拟触发重建
export const mockTriggerRebuild = async (
  kbType: string = 'general',
  _kbPassword: string
): Promise<KBRebuildResponse> => {
  await mockDelay(300);
  
  // 模拟开始重建
  if (MOCK_STATUS[kbType]) {
    MOCK_STATUS[kbType].updating = true;
    MOCK_STATUS[kbType].progress = '正在重建索引...';
    
    // 模拟重建完成（3秒后）
    setTimeout(() => {
      if (MOCK_STATUS[kbType]) {
        MOCK_STATUS[kbType].updating = false;
        MOCK_STATUS[kbType].progress = '';
        MOCK_STATUS[kbType].duration_seconds = 3.5;
      }
    }, 3000);
  }
  
  return {
    ok: true,
    message: `知识库 ${getKBName(kbType)} 开始重建索引`,
  };
};

// 获取知识库名称
const getKBName = (kbType: string): string => {
  const names: Record<string, string> = {
    general: '通用知识库',
    visa_free: '免签知识库',
    airline: '航司知识库',
    general_b: '通用知识库B',
    hidden: '隐藏知识库',
  };
  return names[kbType] || kbType;
};
