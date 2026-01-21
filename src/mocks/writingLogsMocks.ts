/**
 * 写作日志模拟数据
 */

import { mockDelay, generateId } from './mockService';

export interface MockWritingLogItem {
  id: string;
  timestamp: string;
  type: string;
  operation: string;
  user_id?: string;
  session_id?: string;
  writing_type?: string;
  instruction?: string;
  result?: string;
}

export interface MockWritingLogDetail extends MockWritingLogItem {
  detail?: string;
}

export interface MockWritingLogListResponse {
  date: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: MockWritingLogItem[];
}

const MOCK_INSTRUCTIONS = [
  '请写一份关于安全检查的通知',
  '请拟写一份设备采购的请示',
  '请起草一份季度工作报告',
  '请撰写一份会议纪要',
  '请完成一份对外通报',
];

const MOCK_RESULTS = [
  '根据工作安排，现将有关事项通知如下……',
  '为保障工作顺利开展，特此请示如下……',
  '现将本季度工作开展情况报告如下……',
  '会议纪要如下：一、会议时间……',
  '经研究决定，现将有关通报如下……',
];

const generateMockLogs = (date: string, count: number = 12): MockWritingLogItem[] => {
  const logs: MockWritingLogItem[] = [];
  const types = ['writing_start', 'writing_result'];
  const operations = ['generate', 'edit'];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const instructionIndex = Math.floor(Math.random() * MOCK_INSTRUCTIONS.length);
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    const timestamp = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    const id = `${timestamp}_${generateId()}`;

    logs.push({
      id,
      timestamp,
      type,
      operation,
      user_id: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
      session_id: `session_${Math.floor(Math.random() * 10000)}`,
      writing_type: 'official_document',
      instruction: type === 'writing_start' ? MOCK_INSTRUCTIONS[instructionIndex] : undefined,
      result: type === 'writing_result' ? MOCK_RESULTS[instructionIndex] : undefined,
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const logsCache: Record<string, MockWritingLogItem[]> = {};

const getLogsForDate = (date: string): MockWritingLogItem[] => {
  if (!logsCache[date]) {
    logsCache[date] = generateMockLogs(date, 8 + Math.floor(Math.random() * 10));
  }
  return logsCache[date];
};

export const mockGetWritingLogsByDate = async (
  _token: string,
  params: {
    date?: string;
    writing_type?: string;
    page?: number;
    page_size?: number;
  }
): Promise<MockWritingLogListResponse> => {
  await mockDelay(400);

  const { page = 1, page_size = 20 } = params;
  const date = params.date || new Date().toISOString().split('T')[0];
  let logs = getLogsForDate(date);

  if (params.writing_type) {
    logs = logs.filter((log) => log.writing_type === params.writing_type);
  }

  const total = logs.length;
  const total_pages = Math.ceil(total / page_size);
  const start = (page - 1) * page_size;
  const paginatedLogs = logs.slice(start, start + page_size);

  return {
    date,
    total,
    page,
    page_size,
    total_pages,
    logs: paginatedLogs,
  };
};

export const mockGetWritingLogDetail = async (
  _token: string,
  logId: string
): Promise<MockWritingLogDetail> => {
  await mockDelay(300);

  const allLogs = Object.values(logsCache).flat();
  const log = allLogs.find((item) => item.id === logId);
  if (!log) {
    throw new Error('日志不存在');
  }

  return {
    ...log,
    detail: log.result || log.instruction || '',
  };
};
