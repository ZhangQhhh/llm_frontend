export const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;
export const LLM_BASE_URL = process.env.VUE_APP_LLM_BASE_URL;
// 定义所有API端点
export const API_ENDPOINTS = {
  ADMIN: {
    USERS: `/admin/users`,
    USER_LIST: `/api/admin/users/`,
    USER_BAN: `/api/admin/users/ban/`,
    USER_UNBAN: `/api/admin/users/unban/`,
    // 账号审核
    PENDING_USERS: `/api/admin/users/pending/`,
    APPROVE_USER: `/api/admin/users/approve/`,
    REJECT_USER: `/api/admin/users/reject/`,
    // 题库管理
    IMPORT_TEMPLATE: '/admin/import_template/public_file',
    EXPORT_TEACHER_DOCX: '/admin/export_teacher_docx',
    EXPORT_SCORES_ZIP: '/admin/export_scores_zip',
    EXPORT_SCORES_DOCX: '/admin/export_scores_docx',
  },
  SUPER_ADMIN: {
    CREATE_ADMIN: `/api/admin/create-admin/`,
    LIST_ADMINS: `/api/admin/list-admins/`,
    DOWNGRADE_ADMIN: `/api/admin/downgrade-admin/`,
    RESET_ADMIN_PASSWORD: `/api/admin/reset-admin-password/`,
  },
  USER: {
    LOGIN: `/user/account/token/`,
    REGISTER: `/user/account/register/`,
    INFO: `/user/account/info/`,
  },
  // 知识问答相关API
  KNOWLEDGE: {
    // 单轮对话（无会话）- 使用完整URL（用于fetch流式请求）
    CHAT: `${LLM_BASE_URL}/knowledge_chat`,
    CONVERSATION_CHAT: `${LLM_BASE_URL}/knowledge_chat_conversation`,
    // 会话管理 - 使用相对路径（用于llmHttp）
    CONVERSATION_NEW: `/conversation/new`,
    CONVERSATION_CLEAR: `/conversation/clear`,
    CONVERSATION_STATISTICS: `/conversation/statistics`,
    CONVERSATION_SESSIONS_LIST: `/conversation/sessions/list`,
    CONVERSATION_SESSION_HISTORY: (sessionId: string) => `/conversation/sessions/${sessionId}/history`,
    CONVERSATION_SESSION_INFO: (sessionId: string) => `/conversation/sessions/${sessionId}/info`,
    CONVERSATION_SESSION_DELETE: (sessionId: string) => `/conversation/sessions/${sessionId}/delete`,
    CONVERSATION_CACHE_CLEAR: `/conversation/cache/clear`,
  },
  // 反馈相关API（在 3000 端口的主后端）
  FEEDBACK: {
    LIKE: `/feedback/like`,
    DISLIKE: `/feedback/dislike`,
  },
  // 认证相关API
  AUTH: {
    CHANGE_PASSWORD: `/auth/change_password`,
    RESET_PASSWORD: `/auth/reset_password`,
  },
  // 题库管理API
  QUESTIONS: {
    UPLOAD: '/questions/upload',
    EXPLAIN: '/questions/explain',
    REVIEW: '/questions/review',
    REJECT: '/questions/reject',
    APPROVE_ALL: '/questions/approve_all',
    DEBUG_QUESTIONS: '/debug/questions',
    DEBUG_ANALYSES: '/debug/analyses',
  },
  // 试卷管理API
  PAPERS: {
    LIST_OPEN: '/papers/list_open',
    LIST_ALL: '/papers/list_all',
    VIEW: '/papers/view',
    CREATE: '/papers/create',
  },
  // 考试相关API
  EXAM: {
    START: '/exam/start',
    SUBMIT: '/exam/submit',
    REVIEW: '/exam/review',
  },
  // 学生端API
  STUDENT: {
    EXPORT_MY_REPORT_DOCX: '/student/export_my_report_docx',
  },
  // 公开API
  PUBLIC: {
    EXPLAIN_FROM_TEXT: '/public/explain_from_text',
    SERVER_INFO: '/',
  },
  // 任务状态API
  TASKS: {
    STATUS: '/tasks/status',
  },
};

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'jwt_token',
  CHAT_TOKEN: 'multi_turn_chat_jwt',
  SESSION_ID: 'multi_turn_chat_session_id',
  USER: 'multi_turn_chat_user',
};
