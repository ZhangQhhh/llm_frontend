/**
 * 聊天API相关工具函数
 */

import { API_ENDPOINTS } from '@/config/api/api';
import http from '@/config/api/http';
import llmHttp from '@/config/api/llmHttp';
import { davHttp } from '@/config/api/http';
import { isMockEnabled } from '@/mocks/mockService';
import { createModuleLogger, LogModules } from '@/utils/logger';

const log = createModuleLogger(LogModules.CHAT_API);

import {
  mockGetQALogsByDate,
  mockGetQALogDetail,
  mockGetQALogDates,
} from '@/mocks/qaLogsMocks';
import {
  mockGetWritingLogsByDate,
  mockGetWritingLogDetail,
  mockGetWritingLogDates,
  mockGetWritingLogStatistics,
} from '@/mocks/writingLogsMocks';

/**
 * SSE流式响应处理器
 */
export interface StreamMessage {
  type: 'SESSION' | 'THINK' | 'CONTENT' | 'SOURCE' | 'SUB_QUESTIONS' | 'KEYWORDS' | 'ERROR' | 'DONE' | 'UNKNOWN';
  data: string;
}

export function parseSSEMessage(raw: string): StreamMessage {
  let data = raw.replace(/\r$/, '');
  if (data.startsWith("data:")) {
    data = data.substring(5);
    if (data.startsWith(" ")) {
      data = data.substring(1);
    }
  }

  if (data.startsWith("SESSION:")) {
    const sessionId = data.substring(8).trim();
    log.debug('收到 SESSION:', sessionId);
    return { type: 'SESSION', data: sessionId };
  } else if (data.startsWith("THINK:")) {
    const rawData = data.substring(6);
    log.debug('收到 THINK，长度:', rawData.length, '前200字符:', rawData.substring(0, 200));
    return { type: 'THINK', data: rawData.replace(/<NEWLINE>/g, "\n") };
  } else if (data.startsWith("CONTENT:")) {
    const rawData = data.substring(8);
    if (rawData.length < 100) {
      log.debug('收到 CONTENT:', rawData);
    } else {
      log.debug('收到 CONTENT，长度:', rawData.length);
    }
    return { type: 'CONTENT', data: rawData.replace(/<NEWLINE>/g, "\n") };
  } else if (data.startsWith("SOURCE:")) {
    const sourceData = data.substring(7).trim();
    log.debug('收到 SOURCE');
    return { type: 'SOURCE', data: sourceData };
  } else if (data.startsWith("SUB_QUESTIONS:")) {
    const subQuestions = data.substring(14).trim();
    log.debug('收到 SUB_QUESTIONS');
    return { type: 'SUB_QUESTIONS', data: subQuestions };
  } else if (data.startsWith("KEYWORDS:")) {
    const keywords = data.substring(9).trim();
    log.debug('收到 KEYWORDS');
    return { type: 'KEYWORDS', data: keywords };
  } else if (data.startsWith("ERROR:")) {
    const errorMsg = data.substring(6).trim();
    log.error('收到 ERROR:', errorMsg);
    return { type: 'ERROR', data: errorMsg };
  } else if (data.startsWith("DONE:")) {
    log.debug('收到 DONE');
    return { type: 'DONE', data: '' };
  }
  
  log.debug('收到 UNKNOWN 消息:', data.substring(0, 100));
  return { type: 'UNKNOWN', data };
}

/**
 * 关键词数据结构
 */
export interface KeywordsData {
  question: string[];   // 从用户问题中提取的关键词
  document: string[];   // 从文档中匹配的关键词
}

/**
 * 参考来源的元数据
 */
export interface ReferenceMetadata {
  retrieval_sources?: string[] | string;
  vector_rank?: number;
  bm25_rank?: number;
  vector_score?: number;
  bm25_score?: number;
}

/**
 * 参考来源数据结构
 */
export interface ReferenceSource {
  id: string | number;
  fileName: string;
  content: string;
  initialScore?: number | string;
  rerankedScore?: number | string;
  canAnswer?: boolean;
  keyPassage?: string;
  url?: string;
  
  // 新增字段
  retrievalSources?: string[];      // 检索来源: ["vector"], ["keyword"], 或 ["vector", "keyword"]
  vectorScore?: number | string;    // 向量检索分数
  bm25Score?: number | string;      // BM25 检索分数
  vectorRank?: number;              // 向量检索排名（可选，仅当 retrievalSources 包含 "vector" 时）
  bm25Rank?: number;                // BM25 检索排名（可选，仅当 retrievalSources 包含 "keyword" 时）
  matchedKeywords?: string[];       // 匹配的关键词（仅当 retrievalSources 包含 "keyword" 时）
  
  // 隐藏节点相关字段
  isHidden?: boolean;               // 标记为隐藏节点
  hiddenKbName?: string;            // 隐藏知识库名称
  
  metadata?: ReferenceMetadata;
  node?: {
    metadata?: ReferenceMetadata;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * 聊天请求参数
 */
export interface ChatRequest {
  question: string;
  session_id?: string | null;
  thinking?: boolean;
  model_id?: string;
  rerank_top_n?: number;
  use_insert_block?: boolean;
  insert_block_llm_id?: string;
  user_id?: string | number | null;  // 可选，请求用户ID
}

/**
 * 发送流式聊天请求
 */
export async function sendStreamChatRequest(
  endpoint: string,
  payload: ChatRequest,
  token: string,
  onMessage: (message: StreamMessage) => void,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok) {
    throw new Error(`服务器返回错误: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法获取响应流");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const normalized = part.replace(/[\r\n]+$/, '');
      if (!normalized.trim()) continue;

      const message = parseSSEMessage(normalized);
      onMessage(message);
    }
  }
}

/**
 * 创建新会话
 */
export async function createNewSession(token: string): Promise<{ session_id: string; message: string }> {
  const response = await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE.CONVERSATION_NEW,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
}

/**
 * 清空会话
 */
export async function clearSession(sessionId: string, token: string): Promise<void> {
  await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE.CONVERSATION_CLEAR,
    { session_id: sessionId },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
}

/**
 * 获取会话统计信息
 */
export interface SessionStatistics {
  session_id: string;
  message_count: number;
  total_tokens: number;
  create_time: string;
  last_update_time: string;
}

export async function getSessionStatistics(sessionId: string, token: string): Promise<SessionStatistics> {
  const response = await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE.CONVERSATION_STATISTICS,
    { session_id: sessionId },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data.data;
}

/**
 * 会话列表项
 */
export interface SessionListItem {
  session_id: string;
  user_id: number;
  title: string;
  first_message: string;
  last_message: string;
  message_count: number;
  total_tokens: number;
  create_time: string;
  last_update_time: string;
}

/**
 * 获取用户会话列表
 */
export interface SessionListParams {
  page?: number;
  page_size?: number;
  sort_by?: 'last_update' | 'create_time';
}

export interface SessionListResponse {
  total: number;
  sessions: SessionListItem[];
  page: number;
  page_size: number;
}

export async function getSessionList(
  token: string,
  params: SessionListParams = {}
): Promise<SessionListResponse> {
  const response = await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE.CONVERSATION_SESSIONS_LIST,
    {
      page: params.page || 1,
      page_size: params.page_size || 20,
      sort_by: params.sort_by || 'last_update'
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data.data;
}

/**
 * 会话历史消息
 */
export interface HistoryMessage {
  turn_id: string;
  user_query: string;
  assistant_response: string;
  timestamp: string;
  context_docs: string[];
  token_count: number;
}

export interface SessionHistoryParams {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export interface SessionHistoryResponse {
  session_id: string;
  total_messages: number;
  messages: HistoryMessage[];
}

/**
 * 获取会话历史消息
 */
export async function getSessionHistory(
  sessionId: string,
  token: string,
  params: SessionHistoryParams = {}
): Promise<SessionHistoryResponse> {
  const response = await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE.CONVERSATION_SESSION_HISTORY(sessionId),
    {
      limit: params.limit || 50,
      offset: params.offset || 0,
      order: params.order || 'asc'
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data.data;
}

/**
 * 会话详细信息
 */
export interface SessionInfo {
  session_id: string;
  user_id: number;
  title: string;
  message_count: number;
  total_tokens: number;
  create_time: string;
  last_update_time: string;
  first_message: string;
}

/**
 * 获取会话详细信息
 */
export async function getSessionInfo(sessionId: string, token: string): Promise<SessionInfo> {
  const response = await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE.CONVERSATION_SESSION_INFO(sessionId),
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data.data;
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string, token: string): Promise<void> {
  await llmHttp.post(
    API_ENDPOINTS.KNOWLEDGE.CONVERSATION_SESSION_DELETE(sessionId),
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
}

/**
 * 提交点赞反馈
 */
export async function submitLikeFeedback(
  question: string,
  answer: string,
  modelId: string,
  feedbackType: string,
  sources: ReferenceSource[]
): Promise<void> {
  try {
    await http.post(API_ENDPOINTS.FEEDBACK.LIKE, {
      question,
      answer,
      modelId,
      feedbackType,
      source: sources
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || `提交失败: ${error.response?.status || 'unknown'}`);
  }
}

/**
 * 提交点踩反馈
 */
export async function submitDislikeFeedback(
  question: string,
  answer: string,
  sources: ReferenceSource[],
  reason: string,
  feedbackType: string,
  modelId: string,
  reporterName?: string,
  reporterUnit?: string
): Promise<void> {
  try {
    await http.post(API_ENDPOINTS.FEEDBACK.DISLIKE, {
      question,
      answer,
      source: sources,
      reason,
      feedbackType,
      modelId,
      reporterName,
      reporterUnit
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || `提交失败: ${error.response?.status || 'unknown'}`);
  }
}

// ==================== 问答日志相关 API ====================

/**
 * 日志记录项
 */
export interface QALogItem {
  id: string;
  timestamp: string;
  type: string;
  question: string;
  answer_preview: string;
  metadata: {
    ip?: string;
    user_id?: string;
    answer_type?: string;
    chat_mode?: boolean;
    insert_block_mode?: boolean;
    [key: string]: unknown;
  };
}

/**
 * 日志详情
 */
export interface QALogDetail {
  id: string;
  timestamp: string;
  type: string;
  question: string;
  answer: string;
  metadata: {
    ip?: string;
    user_id?: string;
    answer_type?: string;
    chat_mode?: boolean;
    insert_block_mode?: boolean;
    [key: string]: unknown;
  };
}

/**
 * 日志列表查询参数
 */
export interface QALogListParams {
  date?: string;       // 日期，格式 YYYY-MM-DD，默认今天
  user_id?: string;    // 按用户ID筛选
  username?: string;   // 按用户名筛选（需要后端支持）
  page?: number;       // 页码，默认1
  page_size?: number;  // 每页数量，默认20，最大100
}

/**
 * 日志列表响应
 */
export interface QALogListResponse {
  date: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: QALogItem[];
}

/**
 * 日期列表响应
 */
export interface QALogDatesResponse {
  dates: string[];
  total: number;
}

/**
 * 获取某天的所有日志记录
 */
export async function getQALogsByDate(
  token: string,
  params: QALogListParams = {}
): Promise<QALogListResponse> {
  // 模拟数据模式
  if (isMockEnabled()) {
    return mockGetQALogsByDate(token, params) as Promise<QALogListResponse>;
  }
  
  const queryParams = new URLSearchParams();
  if (params.date) queryParams.append('date', params.date);
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.username) queryParams.append('username', params.username);
  if (params.page) queryParams.append('page', String(params.page));
  if (params.page_size) queryParams.append('page_size', String(params.page_size));

  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.QA_LOGS.DAILY}${queryString ? '?' + queryString : ''}`;

  const response = await llmHttp.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

/**
 * 获取单条日志详情
 */
export async function getQALogDetail(
  token: string,
  id: string,
  date?: string
): Promise<QALogDetail> {
  // 模拟数据模式
  if (isMockEnabled()) {
    return mockGetQALogDetail(token, id, date || new Date().toISOString().split('T')[0]) as Promise<QALogDetail>;
  }
  
  const queryParams = new URLSearchParams();
  queryParams.append('id', id);
  if (date) queryParams.append('date', date);

  const url = `${API_ENDPOINTS.QA_LOGS.DETAIL}?${queryParams.toString()}`;

  const response = await llmHttp.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

/**
 * 获取有日志的日期列表
 */
export async function getQALogDates(token: string): Promise<QALogDatesResponse> {
  // 模拟数据模式
  if (isMockEnabled()) {
    return mockGetQALogDates(token) as Promise<QALogDatesResponse>;
  }
  
  const response = await llmHttp.get(API_ENDPOINTS.QA_LOGS.DATES, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

// ==================== 写作日志相关 API ====================

/**
 * 写作日志记录项
 */
export type WritingType = 'official_document' | 'data_analysis_report' | 'general_writing';

/**
 * Writing log item
 */
export interface WritingLogItem {
  id?: string;
  timestamp: string;
  type: string;
  writing_type?: WritingType;
  session_id?: string;
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
  [key: string]: unknown;
}

/**
 * Writing log detail
 */
export interface WritingLogDetail extends WritingLogItem {
  user_instruction?: string;
  generated_content?: string;
}

/**
 * Writing log list params
 */
export interface WritingLogListParams {
  date?: string;
  writing_type?: WritingType;
  session_id?: string;
  page?: number;
  page_size?: number;
}

/**
 * Writing log list response
 */
export interface WritingLogListResponse {
  date?: string;
  total: number;
  page: number;
  page_size: number;
  total_pages?: number;
  logs: WritingLogItem[];
}

/**
 * Writing log dates response
 */
export interface WritingLogDatesResponse {
  dates: string[];
  total: number;
}

export interface WritingLogStatisticsResponse {
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
  daily_stats: Array<{
    date: string;
    total: number;
    success: number;
    errors: number;
  }>;
}

/**
 * Get writing logs by date
 */
export async function getWritingLogsByDate(
  token: string,
  params: WritingLogListParams = {}
): Promise<WritingLogListResponse> {
  if (isMockEnabled()) {
    return mockGetWritingLogsByDate(token, params) as Promise<WritingLogListResponse>;
  }

  const queryParams = new URLSearchParams();
  if (params.date) queryParams.append('date', params.date);
  if (params.writing_type) queryParams.append('writing_type', params.writing_type);
  if (params.session_id) queryParams.append('session_id', params.session_id);
  if (params.page) queryParams.append('page', String(params.page));
  if (params.page_size) queryParams.append('page_size', String(params.page_size));

  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.WRITING_LOGS.DAILY}${queryString ? '?' + queryString : ''}`;

  const response = await llmHttp.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

/**
 * Get writing log detail
 */
export async function getWritingLogDetail(
  token: string,
  id: string,
  date?: string
): Promise<WritingLogDetail> {
  if (isMockEnabled()) {
    return mockGetWritingLogDetail(token, id, date) as Promise<WritingLogDetail>;
  }

  const queryParams = new URLSearchParams();
  queryParams.append('id', id);
  if (date) queryParams.append('date', date);

  const url = `${API_ENDPOINTS.WRITING_LOGS.DETAIL}?${queryParams.toString()}`;

  const response = await llmHttp.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

/**
 * Get writing log dates
 */
export async function getWritingLogDates(token: string): Promise<WritingLogDatesResponse> {
  if (isMockEnabled()) {
    return mockGetWritingLogDates(token) as Promise<WritingLogDatesResponse>;
  }

  const response = await llmHttp.get(API_ENDPOINTS.WRITING_LOGS.DATES, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

/**
 * Get writing log statistics
 */
export async function getWritingLogStatistics(
  token: string,
  days = 7
): Promise<WritingLogStatisticsResponse> {
  if (isMockEnabled()) {
    return mockGetWritingLogStatistics(token, days) as Promise<WritingLogStatisticsResponse>;
  }

  const queryParams = new URLSearchParams();
  queryParams.append('days', String(days));
  const url = `${API_ENDPOINTS.WRITING_LOGS.STATISTICS}?${queryParams.toString()}`;

  const response = await llmHttp.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

export interface ReportLogItem {
  job_id: string;
  username?: string;
  report_type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  file_info?: Record<string, unknown>;
  error_message?: string | null;
  [key: string]: unknown;
}

export interface ReportLogDetail extends ReportLogItem {}

export interface ReportLogListParams {
  page?: number;
  page_size?: number;
  username?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface ReportLogListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: ReportLogItem[];
}

export async function getReportLogs(
  token: string,
  params: ReportLogListParams = {}
): Promise<ReportLogListResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', String(params.page));
  if (params.page_size) queryParams.append('page_size', String(params.page_size));
  if (params.username) queryParams.append('username', params.username);
  if (params.status) queryParams.append('status', params.status);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);

  const queryString = queryParams.toString();
  const url = `${API_ENDPOINTS.REPORT_LOGS.LIST}${queryString ? '?' + queryString : ''}`;

  const response = await davHttp.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}

export async function getReportLogDetail(
  token: string,
  jobId: string
): Promise<ReportLogDetail> {
  const response = await davHttp.get(API_ENDPOINTS.REPORT_LOGS.DETAIL(jobId), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.data;
}
