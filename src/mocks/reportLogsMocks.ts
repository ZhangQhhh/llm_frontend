/**
 * Report log mock data
 */

import { formatBytes, mockDelay } from './mockService';

export type MockReportType = 'comprehensive' | 'people_only';
export type MockReportStatus = 'started' | 'completed' | 'failed';

export interface MockReportLogItem {
  job_id: string;
  username?: string;
  report_type?: MockReportType;
  status?: MockReportStatus;
  created_at?: string;
  updated_at?: string;
  file_info?: Record<string, unknown>;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MockReportLogDetail extends MockReportLogItem {}

export interface MockReportLogListParams {
  page?: number;
  page_size?: number;
  username?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface MockReportLogListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: MockReportLogItem[];
}

const REPORT_LOGS: MockReportLogDetail[] = [
  {
    job_id: 'RPT-20260301-001',
    username: '张晓宁',
    report_type: 'comprehensive',
    status: 'completed',
    created_at: '2026-03-01T09:12:18',
    updated_at: '2026-03-01T09:20:46',
    file_info: {
      base_file: '2025年1-2月旅客吞吐量.xlsx',
      compare_file: '2026年1-2月旅客吞吐量.xlsx',
      flights_prev: '2025年春运航班计划.xlsx',
      flights_curr: '2026年春运航班计划.xlsx',
      months: '1,2',
      output_file: '2026年春运口岸客流综合分析报告.docx',
      file_size: 1843200,
      file_size_display: formatBytes(1843200)
    },
    metadata: {
      section_count: 9,
      chart_count: 6,
      duration_seconds: 508,
      source_rows: 12840
    },
    error_message: null
  },
  {
    job_id: 'RPT-20260301-002',
    username: '刘雨桐',
    report_type: 'people_only',
    status: 'started',
    created_at: '2026-03-01T11:03:25',
    updated_at: '2026-03-01T11:05:02',
    file_info: {
      base_file: '2025年重点旅客画像.xlsx',
      compare_file: '2026年重点旅客画像.xlsx',
      months: '1,2',
      task_stage: '章节汇总生成中'
    },
    metadata: {
      progress: 62,
      current_stage: '汇总人员结构分析',
      estimated_remaining_seconds: 96
    },
    error_message: null
  },
  {
    job_id: 'RPT-20260301-003',
    username: '王一帆',
    report_type: 'comprehensive',
    status: 'failed',
    created_at: '2026-03-01T14:16:11',
    updated_at: '2026-03-01T14:18:39',
    file_info: {
      base_file: '2025年出入境总量.xlsx',
      compare_file: '2026年出入境总量.xlsx',
      flights_prev: '2025年国际航线计划.xlsx',
      flights_curr: '2026年国际航线计划.xlsx',
      months: '1,2'
    },
    metadata: {
      failed_stage: '同比图表生成',
      retried: 1,
      template_version: 'v2.3'
    },
    error_message: '图表数据列缺失：未找到“航班执行架次”字段，报告已中止。'
  },
  {
    job_id: 'RPT-20260228-001',
    username: '张晓宁',
    report_type: 'people_only',
    status: 'completed',
    created_at: '2026-02-28T10:22:40',
    updated_at: '2026-02-28T10:27:11',
    file_info: {
      base_file: '2025年重点人员统计.xlsx',
      compare_file: '2026年重点人员统计.xlsx',
      months: '2',
      output_file: '2月重点人员分析简报.docx',
      file_size: 962560,
      file_size_display: formatBytes(962560)
    },
    metadata: {
      section_count: 5,
      chart_count: 3,
      duration_seconds: 271
    },
    error_message: null
  },
  {
    job_id: 'RPT-20260228-002',
    username: '陈思源',
    report_type: 'comprehensive',
    status: 'completed',
    created_at: '2026-02-28T16:08:53',
    updated_at: '2026-02-28T16:18:44',
    file_info: {
      base_file: '2025年口岸业务总览.xlsx',
      compare_file: '2026年口岸业务总览.xlsx',
      flights_prev: '2025年重点口岸运力.xlsx',
      flights_curr: '2026年重点口岸运力.xlsx',
      months: '1,2',
      output_file: '2026年2月口岸业务综合报告.docx',
      file_size: 2154496,
      file_size_display: formatBytes(2154496)
    },
    metadata: {
      section_count: 11,
      chart_count: 8,
      duration_seconds: 591
    },
    error_message: null
  },
  {
    job_id: 'RPT-20260227-001',
    username: '李沐宸',
    report_type: 'comprehensive',
    status: 'failed',
    created_at: '2026-02-27T08:42:19',
    updated_at: '2026-02-27T08:44:01',
    file_info: {
      base_file: '2025年客流分项统计.xlsx',
      compare_file: '2026年客流分项统计.xlsx',
      months: '2'
    },
    metadata: {
      failed_stage: '模板渲染',
      retried: 0,
      template_version: 'v2.2'
    },
    error_message: '模板渲染失败：输入文件中的月份筛选结果为空，请检查月份参数。'
  },
  {
    job_id: 'RPT-20260227-002',
    username: '刘雨桐',
    report_type: 'people_only',
    status: 'completed',
    created_at: '2026-02-27T13:20:10',
    updated_at: '2026-02-27T13:24:36',
    file_info: {
      base_file: '2025年重点旅客标签.xlsx',
      compare_file: '2026年重点旅客标签.xlsx',
      months: '1,2',
      output_file: '重点旅客结构变化报告.docx',
      file_size: 786432,
      file_size_display: formatBytes(786432)
    },
    metadata: {
      section_count: 4,
      chart_count: 2,
      duration_seconds: 246
    },
    error_message: null
  },
  {
    job_id: 'RPT-20260226-001',
    username: '王一帆',
    report_type: 'comprehensive',
    status: 'started',
    created_at: '2026-02-26T19:30:55',
    updated_at: '2026-02-26T19:33:41',
    file_info: {
      base_file: '2025年重点口岸对比.xlsx',
      compare_file: '2026年重点口岸对比.xlsx',
      flights_prev: '2025年周航班计划.xlsx',
      flights_curr: '2026年周航班计划.xlsx',
      months: '1,2',
      task_stage: '图表排版中'
    },
    metadata: {
      progress: 77,
      current_stage: '输出文档整合',
      estimated_remaining_seconds: 54
    },
    error_message: null
  }
];

const sortByDateDesc = (logs: MockReportLogItem[]): MockReportLogItem[] =>
  [...logs].sort((a, b) => {
    const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
    const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
    return bTime - aTime;
  });

const toDateOnly = (value?: string): string => String(value || '').split('T')[0];

export const getMockReportLogDates = (): string[] => {
  const dates = sortByDateDesc(REPORT_LOGS)
    .map((log) => toDateOnly(log.created_at || log.updated_at))
    .filter(Boolean);

  return Array.from(new Set(dates));
};

export const getLatestMockReportLogDate = (): string => {
  return getMockReportLogDates()[0] || '';
};

const matchesDateRange = (log: MockReportLogItem, startDate?: string, endDate?: string): boolean => {
  const createdAt = log.created_at || log.updated_at;
  if (!createdAt) return false;

  const current = new Date(createdAt).getTime();
  if (startDate && current < new Date(startDate).getTime()) {
    return false;
  }
  if (endDate && current > new Date(endDate).getTime()) {
    return false;
  }
  return true;
};

export const mockGetReportLogs = async (
  _token: string,
  params: MockReportLogListParams = {}
): Promise<MockReportLogListResponse> => {
  await mockDelay(350);

  const { page = 1, page_size = 20 } = params;
  let logs = sortByDateDesc(REPORT_LOGS);

  if (params.username) {
    const keyword = params.username.trim().toLowerCase();
    logs = logs.filter((log) => (log.username || '').toLowerCase().includes(keyword));
  }

  if (params.status) {
    logs = logs.filter((log) => log.status === params.status);
  }

  if (params.start_date || params.end_date) {
    logs = logs.filter((log) => matchesDateRange(log, params.start_date, params.end_date));
  }

  const total = logs.length;
  const total_pages = Math.max(1, Math.ceil(total / page_size));
  const start = (page - 1) * page_size;

  return {
    total,
    page,
    page_size,
    total_pages,
    logs: logs.slice(start, start + page_size)
  };
};

export const mockGetReportLogDetail = async (
  _token: string,
  jobId: string
): Promise<MockReportLogDetail> => {
  await mockDelay(220);

  const log = REPORT_LOGS.find((item) => item.job_id === jobId);
  if (!log) {
    throw new Error('Log not found');
  }

  return {
    ...log,
    metadata: {
      ...(log.metadata || {}),
      fetched_from_mock: true
    }
  };
};
