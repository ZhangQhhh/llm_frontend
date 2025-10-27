export const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
export const WS_URL = process.env.VUE_APP_WS_URL;
export const WS_API_BASE_URL = process.env.NODE_ENV === 'production' ? '/websocket' : 'http://localhost:3000/websocket';

// 定义所有API端点
export const API_ENDPOINTS = {
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
  },
  USER: {
    LOGIN: `${API_BASE_URL}/user/account/token/`,
    REGISTER: `${API_BASE_URL}/user/account/register/`,
    INFO: `${API_BASE_URL}/user/account/info/`,
  },
  // 知识问答相关API
  KNOWLEDGE: {
    CHAT: '/api/knowledge_chat',
    CONVERSATION_CHAT: '/llm/api/knowledge_chat_conversation',
    CONVERSATION_CLEAR: '/llm/api/conversation/clear',
  },
  // 反馈相关API
  FEEDBACK: {
    LIKE: '/api/feedback/like',
    DISLIKE: '/api/feedback/dislike',
  },
};

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'jwt_token',
  CHAT_TOKEN: 'multi_turn_chat_jwt',
  SESSION_ID: 'multi_turn_chat_session_id',
  USER: 'multi_turn_chat_user',
};
