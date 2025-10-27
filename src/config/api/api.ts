export const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

// 定义所有API端点
export const API_ENDPOINTS = {
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    // 题库管理
    IMPORT_TEMPLATE: '/admin/import_template/public_file',
    EXPORT_TEACHER_DOCX: '/admin/export_teacher_docx',
    EXPORT_SCORES_ZIP: '/admin/export_scores_zip',
    EXPORT_SCORES_DOCX: '/admin/export_scores_docx',
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
    LIKE: `${API_BASE_URL}/feedback/like`,
    DISLIKE: `${API_BASE_URL}/feedback/dislike`,
  },
  // 认证相关API
  AUTH: {
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change_password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset_password`,
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
