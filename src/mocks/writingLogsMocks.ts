/**
 * Writing log mock data
 */

import { mockDelay, generateId } from './mockService';

export type MockWritingType = 'official_document' | 'data_analysis_report' | 'general_writing';
export type MockWritingLogType = 'writing_start' | 'retrieval_result' | 'writing_result' | 'writing_error';

export interface MockWritingLogItem {
  id: string;
  timestamp: string;
  type: MockWritingLogType;
  session_id?: string;
  writing_type?: MockWritingType;
  instruction_preview?: string;
  content_preview?: string;
  content_length?: number;
  source_count?: number;
  generation_time?: number;
  retrieved_count?: number;
  reranked_count?: number;
  avg_score?: number;
  source_files_preview?: string;
  error_type?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export interface MockWritingLogDetail extends MockWritingLogItem {
  user_instruction?: string;
  generated_content?: string;
}

export interface MockWritingLogListResponse {
  date: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: MockWritingLogItem[];
}

export interface MockWritingLogDatesResponse {
  dates: string[];
  total: number;
}

export interface MockWritingLogStatisticsResponse {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  summary: {
    total_entries: number;
    total_sessions: number;
    success_count: number;
    error_count: number;
    avg_generation_time: number;
    avg_content_length: number;
  };
  writing_types: Record<string, number>;
  daily_stats: Array<{ date: string; total: number; success: number; errors: number }>;
}

const MOCK_INSTRUCTIONS = [
  'Please draft a safety inspection notice.',
  'Please draft a procurement request for equipment.',
  'Please draft a quarterly work report.',
  'Please write a meeting minutes summary.',
  'Please complete an external briefing note.',
];

const MOCK_RESULTS = [
  'According to the work plan, the key items are as follows...',
  'To ensure smooth execution, the request is as follows...',
  'The quarterly work summary is as follows...',
  'Meeting minutes: 1) Time and attendees...',
  'After review, the briefing is as follows...',
];

const MOCK_ERRORS = [
  { type: 'backend_error', message: 'Generation failed. Please retry later.' },
  { type: 'timeout', message: 'Generation timeout. Try a shorter input.' },
  { type: 'invalid_request', message: 'Parameter validation failed.' },
];

const WRITING_TYPES: MockWritingType[] = [
  'official_document',
  'data_analysis_report',
  'general_writing',
];

const LOG_TYPES: MockWritingLogType[] = [
  'writing_start',
  'retrieval_result',
  'writing_result',
  'writing_error',
];

const generateMockLogs = (date: string, count: number = 12): MockWritingLogItem[] => {
  const logs: MockWritingLogItem[] = [];

  for (let i = 0; i < count; i++) {
    const type = LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)];
    const instructionIndex = Math.floor(Math.random() * MOCK_INSTRUCTIONS.length);
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    const timestamp = `${date}T${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    const id = `${timestamp}_${generateId()}`;
    const writingType = WRITING_TYPES[Math.floor(Math.random() * WRITING_TYPES.length)];

    const baseLog: MockWritingLogItem = {
      id,
      timestamp,
      type,
      session_id: `session_${Math.floor(Math.random() * 10000)}`,
      writing_type: writingType,
      metadata: {
        user_id: `user_${Math.floor(Math.random() * 50)}`,
        write_mode: 'generate',
        enable_thinking: Math.random() > 0.5,
        use_kb: Math.random() > 0.3,
        ocr_used: Math.random() > 0.8,
      }
    };

    if (type === 'writing_start') {
      logs.push({
        ...baseLog,
        instruction_preview: MOCK_INSTRUCTIONS[instructionIndex],
      });
      continue;
    }

    if (type === 'retrieval_result') {
      logs.push({
        ...baseLog,
        retrieved_count: 10 + Math.floor(Math.random() * 20),
        reranked_count: 5 + Math.floor(Math.random() * 10),
        avg_score: Number((Math.random() * 0.5 + 0.5).toFixed(2)),
        source_files_preview: 'KB/Policy.pdf; KB/Templates.docx',
      });
      continue;
    }

    if (type === 'writing_result') {
      const contentLength = 800 + Math.floor(Math.random() * 1200);
      logs.push({
        ...baseLog,
        content_length: contentLength,
        source_count: 1 + Math.floor(Math.random() * 5),
        generation_time: Number((Math.random() * 20 + 5).toFixed(1)),
        content_preview: MOCK_RESULTS[instructionIndex],
      });
      continue;
    }

    const error = MOCK_ERRORS[Math.floor(Math.random() * MOCK_ERRORS.length)];
    logs.push({
      ...baseLog,
      error_type: error.type,
      error_message: error.message,
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

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const mockGetWritingLogsByDate = async (
  _token: string,
  params: {
    date?: string;
    writing_type?: MockWritingType;
    session_id?: string;
    page?: number;
    page_size?: number;
  }
): Promise<MockWritingLogListResponse> => {
  await mockDelay(400);

  const { page = 1, page_size = 20 } = params;
  const date = params.date || formatDate(new Date());
  let logs = getLogsForDate(date);

  if (params.writing_type) {
    logs = logs.filter((log) => log.writing_type === params.writing_type);
  }

  if (params.session_id) {
    logs = logs.filter((log) => log.session_id === params.session_id);
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
  logId: string,
  _date?: string
): Promise<MockWritingLogDetail> => {
  await mockDelay(300);

  const allLogs = Object.values(logsCache).flat();
  const log = allLogs.find((item) => item.id === logId);
  if (!log) {
    throw new Error('Log not found');
  }

  return {
    ...log,
    user_instruction: log.instruction_preview || MOCK_INSTRUCTIONS[0],
    generated_content: log.content_preview || MOCK_RESULTS[0],
  };
};

export const mockGetWritingLogDates = async (_token: string): Promise<MockWritingLogDatesResponse> => {
  await mockDelay(200);
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDate(d));
  }
  return { dates, total: dates.length };
};

export const mockGetWritingLogStatistics = async (
  _token: string,
  days = 7
): Promise<MockWritingLogStatisticsResponse> => {
  await mockDelay(200);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  const daily_stats: MockWritingLogStatisticsResponse['daily_stats'] = [];
  let totalEntries = 0;
  let successCount = 0;
  let errorCount = 0;
  let totalSessions = 0;
  let totalContentLength = 0;
  let totalGenerationTime = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const total = 8 + Math.floor(Math.random() * 10);
    const errors = Math.floor(Math.random() * 3);
    const success = total - errors;
    daily_stats.push({ date: formatDate(d), total, success, errors });
    totalEntries += total;
    successCount += success;
    errorCount += errors;
    totalSessions += 2 + Math.floor(Math.random() * 5);
    totalContentLength += 800 * success;
    totalGenerationTime += 10 * success;
  }

  return {
    period: {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      days,
    },
    summary: {
      total_entries: totalEntries,
      total_sessions: totalSessions,
      success_count: successCount,
      error_count: errorCount,
      avg_generation_time: successCount ? Number((totalGenerationTime / successCount).toFixed(1)) : 0,
      avg_content_length: successCount ? Math.round(totalContentLength / successCount) : 0,
    },
    writing_types: {
      official_document: Math.floor(totalEntries * 0.4),
      data_analysis_report: Math.floor(totalEntries * 0.35),
      general_writing: Math.floor(totalEntries * 0.25),
    },
    daily_stats,
  };
};
