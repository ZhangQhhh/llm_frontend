/**
 * 聊天API相关工具函数
 */

import { API_ENDPOINTS, STORAGE_KEYS } from '@/config/api/api';

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
    return { type: 'THINK', data: data.substring(6) };
  } else if (data.startsWith("CONTENT:")) {
    return { type: 'CONTENT', data: data.substring(8).replace(/\u2029/g, "\n") };
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
 * 清空会话
 */
export async function clearSession(sessionId: string, token: string): Promise<void> {
  const response = await fetch(API_ENDPOINTS.KNOWLEDGE.CONVERSATION_CLEAR, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ session_id: sessionId })
  });

  if (!response.ok) {
    throw new Error(`清空会话失败: ${response.status}`);
  }
}

/**
 * 提交点赞反馈
 */
export async function submitLikeFeedback(
  question: string,
  answer: string,
  sources: ReferenceSource[]
): Promise<void> {
  const response = await fetch(API_ENDPOINTS.FEEDBACK.LIKE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      answer,
      source: JSON.stringify(sources)
    })
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || `提交失败: ${response.status}`);
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
  reporterName?: string,
  reporterUnit?: string
): Promise<void> {
  const response = await fetch(API_ENDPOINTS.FEEDBACK.DISLIKE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      answer,
      source: JSON.stringify(sources),
      reason,
      reporterName,
      reporterUnit
    })
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || `提交失败: ${response.status}`);
  }
}
