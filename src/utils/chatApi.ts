/**
 * 聊天API相关工具函数
 */

import { API_ENDPOINTS } from '@/config/api/api';
import http from '@/config/api/http';
import llmHttp from '@/config/api/llmHttp';

/**
 * SSE流式响应处理器
 */
export interface StreamMessage {
  type: 'SESSION' | 'THINK' | 'CONTENT' | 'SOURCE' | 'ERROR' | 'DONE' | 'UNKNOWN';
  data: string;
}

export function parseSSEMessage(raw: string): StreamMessage {
  let data = raw.trim();
  if (data.startsWith("data:")) {
    data = data.substring(5).trim();
  }

  if (data.startsWith("SESSION:")) {
    return { type: 'SESSION', data: data.substring(8).trim() };
  } else if (data.startsWith("THINK:")) {
    const rawData = data.substring(6);
    // 调试日志：查看原始数据
    if (rawData.length < 100) {
      console.log('[DEBUG] THINK 原始数据:', JSON.stringify(rawData));
    }
    return { type: 'THINK', data: rawData.replace(/\\n/g, "\n") };
  } else if (data.startsWith("CONTENT:")) {
    const rawData = data.substring(8);
    // 调试日志：查看原始数据（只显示前100个字符）
    if (rawData.length < 100) {
      console.log('[DEBUG] CONTENT 原始数据:', JSON.stringify(rawData));
    }
    return { type: 'CONTENT', data: rawData.replace(/\\n/g, "\n") };
  } else if (data.startsWith("SOURCE:")) {
    return { type: 'SOURCE', data: data.substring(7).trim() };
  } else if (data.startsWith("ERROR:")) {
    return { type: 'ERROR', data: data.substring(6).trim() };
  } else if (data.startsWith("DONE:")) {
    return { type: 'DONE', data: '' };
  }
  
  return { type: 'UNKNOWN', data };
}

/**
 * 参考来源数据结构
 */
export interface ReferenceSource {
  id: string | number;
  fileName: string;
  content: string;
  initialScore?: number;
  rerankedScore?: number;
  canAnswer?: boolean;
  keyPassage?: string;
  url?: string;
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
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
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
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      const message = parseSSEMessage(trimmed);
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
