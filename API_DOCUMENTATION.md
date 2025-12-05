# LLM Frontend 接口文档

> 本文档描述了前端项目中使用的所有 API 接口，包括请求方式、参数、响应格式等信息。

---

## 目录

1. [基础配置](#基础配置)
2. [用户认证模块](#用户认证模块)
3. [管理员模块](#管理员模块)
4. [超级管理员模块](#超级管理员模块)
5. [知识问答模块](#知识问答模块)
6. [会话管理模块](#会话管理模块)
7. [反馈模块](#反馈模块)
8. [题库管理模块 (MCQ)](#题库管理模块-mcq)
9. [考试模块](#考试模块)
10. [问答日志模块](#问答日志模块)
11. [数据分析模块](#数据分析模块)

---

## 基础配置

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VUE_APP_API_BASE_URL` | 主后端 API 基础 URL | `/api` |
| `VUE_APP_LLM_BASE_URL` | LLM 服务基础 URL | `/llm` |
| `VUE_APP_MCQ_BASE_URL` | MCQ 题库服务基础 URL | `/mcq_public` |
| `VUE_APP_WRITER_URL` | 写作服务 URL | 同 LLM_BASE_URL |
| `VUE_APP_OCR_BASE_URL` | OCR 服务 URL | `http://localhost:9000` |

### HTTP 客户端实例

项目使用三个独立的 Axios 实例：

1. **http** - 主后端服务 (`API_BASE_URL`)
   - 超时时间：30s
   - Token 存储键：`jwt_token`

2. **llmHttp** - LLM 服务 (`LLM_BASE_URL`)
   - 超时时间：90s
   - Token 存储键：`multi_turn_chat_jwt`

3. **mcqHttp** - MCQ 题库服务 (`MCQ_BASE_URL`)
   - 超时时间：60s
   - Token 存储键：`jwt_token`

### 通用请求头

```
Authorization: Bearer {token}
Content-Type: application/json
```

### 通用响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": { ... }
}
```

---

## 用户认证模块

### 1. 用户登录

**POST** `/user/account/token/`

**请求参数：**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应：**
```json
{
  "success": true,
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_string"
  }
}
```

---

### 2. 用户注册

**POST** `/user/account/register/`

**请求参数：**
```json
{
  "username": "string",
  "password": "string",
  "policeId": "string",
  "idCardNumber": "string"
}
```

**响应：**
```json
{
  "success": true,
  "code": 200,
  "message": "注册成功，等待管理员审批",
  "data": null
}
```

---

### 3. 获取用户信息

**GET** `/user/account/info/`

**请求头：**
```
Authorization: Bearer {token}
```

**响应：**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": "string",
    "username": "string",
    "role": "user|admin|super_admin",
    "status": "1|-1|0|-2",
    "email": "string|null",
    "policeId": "string|null",
    "idCardNumber": "string|null",
    "hasChangedName": false
  }
}
```

**状态说明：**
- `1` - 正常
- `0` - 待审核
- `-1` - 已封禁
- `-2` - 审核未通过

---

### 4. 修改密码

**POST** `/auth/change_password`

**请求参数：**
```json
{
  "id": "string",
  "username": "string",
  "oldPassword": "string",
  "newPassword": "string"
}
```

**响应：**
```json
{
  "success": true,
  "code": 200,
  "message": "密码修改成功"
}
```

---

### 5. 重置密码（管理员）

**POST** `/auth/reset_password`

**请求参数：**
```json
{
  "id": "string",
  "username": "string",
  "newPassword": "string"
}
```

---

### 6. 修改用户名

**POST** `/auth/change_username`

**请求参数：**
```json
{
  "id": "string",
  "newUsername": "string"
}
```

---

## 管理员模块

### 1. 获取用户列表

**GET** `/api/admin/users/list/`

**响应：**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "username": "string",
        "email": "string",
        "role": "string",
        "status": 1,
        "created_at": "datetime"
      }
    ]
  }
}
```

---

### 2. 获取待审核用户列表

**GET** `/api/admin/users/pending/`

**响应：**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "username": "string",
        "policeId": "string",
        "idCardNumber": "string",
        "created_at": "datetime"
      }
    ]
  }
}
```

---

### 3. 批准用户

**POST** `/api/admin/users/approve/`

**请求参数：**
```json
{
  "id": "string",
  "username": "string"
}
```

---

### 4. 拒绝用户

**POST** `/api/admin/users/reject/`

**请求参数：**
```json
{
  "id": "string",
  "username": "string"
}
```

---

### 5. 封禁用户

**POST** `/api/admin/users/ban/`

**请求参数：**
```json
{
  "id": "string",
  "username": "string"
}
```

---

### 6. 解封用户

**POST** `/api/admin/users/unban/`

**请求参数：**
```json
{
  "id": "string",
  "username": "string"
}
```

---

## 超级管理员模块

### 1. 创建管理员

**POST** `/api/admin/create-admin/`

**请求参数：**
```json
{
  "username": "string",
  "policeId": "string",
  "idCardNumber": "string",
  "email": "string (可选)",
  "password": "string"
}
```

**响应：**
```json
{
  "success": true,
  "code": 200,
  "message": "管理员创建成功"
}
```

---

### 2. 获取管理员列表

**GET** `/api/admin/list-admins/`

**响应：**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "username": "string",
        "email": "string",
        "role": "admin",
        "created_at": "datetime",
        "status": "string"
      }
    ]
  }
}
```

---

### 3. 降级管理员

**POST** `/api/admin/downgrade-admin/`

**请求参数：**
```json
{
  "id": "string",
  "username": "string"
}
```

---

### 4. 重置管理员密码

**POST** `/api/admin/reset-admin-password/`

**请求参数：**
```json
{
  "id": "string",
  "username": "string",
  "newPassword": "string"
}
```

---

### 5. 提升用户为管理员

**POST** `/api/admin/upgrade-admin/`

**请求参数：**
```json
{
  "username": "string"
}
```

---

## 知识问答模块

### 1. 单轮知识问答（流式）

**POST** `{LLM_BASE_URL}/knowledge_chat`

**请求参数：**
```json
{
  "question": "string",
  "session_id": "string|null",
  "thinking": true,
  "model_id": "string",
  "rerank_top_n": 10,
  "use_insert_block": false,
  "insert_block_llm_id": "string",
  "user_id": "string|number|null"
}
```

**响应格式：** Server-Sent Events (SSE)

**SSE 消息类型：**

| 类型 | 格式 | 说明 |
|------|------|------|
| SESSION | `data: SESSION:{session_id}` | 返回会话 ID |
| THINK | `data: THINK:{content}` | 思考过程（流式） |
| CONTENT | `data: CONTENT:{content}` | 回答内容（流式） |
| SOURCE | `data: SOURCE:{json}` | 参考来源 |
| SUB_QUESTIONS | `data: SUB_QUESTIONS:{json}` | 子问题 |
| KEYWORDS | `data: KEYWORDS:{json}` | 关键词 |
| ERROR | `data: ERROR:{message}` | 错误信息 |
| DONE | `data: DONE:` | 流式完成标记 |

**SOURCE JSON 结构：**
```json
{
  "id": "string",
  "fileName": "string",
  "content": "string",
  "initialScore": 0.85,
  "rerankedScore": 0.92,
  "canAnswer": true,
  "keyPassage": "string",
  "url": "string"
}
```

> **注意：** THINK 和 CONTENT 消息中的 `<NEWLINE>` 标记需要在前端转换为 `\n`

---

### 2. 12367 知识问答（流式）

**POST** `{LLM_BASE_URL}/knowledge_chat_12367`

参数和响应格式同上。

---

### 3. 多轮对话（流式）

**POST** `{LLM_BASE_URL}/knowledge_chat_conversation`

**请求参数：**
```json
{
  "question": "string",
  "session_id": "string",
  "thinking": true,
  "model_id": "string",
  "rerank_top_n": 10
}
```

响应格式同单轮问答。

---

### 4. MCQ 策略判断

**POST** `{LLM_BASE_URL}/mcq_strategy`

**请求参数：**
```json
{
  "question": "string",
  "options": {
    "A": "string",
    "B": "string",
    "C": "string",
    "D": "string"
  }
}
```

---

## 会话管理模块

### 1. 创建新会话

**POST** `{LLM_BASE_URL}/conversation/new`

**响应：**
```json
{
  "session_id": "string",
  "message": "会话创建成功"
}
```

---

### 2. 清空会话

**POST** `{LLM_BASE_URL}/conversation/clear`

**请求参数：**
```json
{
  "session_id": "string"
}
```

---

### 3. 获取会话统计

**POST** `{LLM_BASE_URL}/conversation/statistics`

**请求参数：**
```json
{
  "session_id": "string"
}
```

**响应：**
```json
{
  "data": {
    "session_id": "string",
    "message_count": 10,
    "total_tokens": 1500,
    "create_time": "datetime",
    "last_update_time": "datetime"
  }
}
```

---

### 4. 获取会话列表

**POST** `{LLM_BASE_URL}/conversation/sessions/list`

**请求参数：**
```json
{
  "page": 1,
  "page_size": 20,
  "sort_by": "last_update|create_time"
}
```

**响应：**
```json
{
  "data": {
    "total": 100,
    "sessions": [
      {
        "session_id": "string",
        "user_id": 1,
        "title": "string",
        "first_message": "string",
        "last_message": "string",
        "message_count": 10,
        "total_tokens": 1500,
        "create_time": "datetime",
        "last_update_time": "datetime"
      }
    ],
    "page": 1,
    "page_size": 20
  }
}
```

---

### 5. 获取会话历史

**POST** `{LLM_BASE_URL}/conversation/sessions/{session_id}/history`

**请求参数：**
```json
{
  "limit": 50,
  "offset": 0,
  "order": "asc|desc"
}
```

**响应：**
```json
{
  "data": {
    "session_id": "string",
    "total_messages": 20,
    "messages": [
      {
        "turn_id": "string",
        "user_query": "string",
        "assistant_response": "string",
        "timestamp": "datetime",
        "context_docs": ["string"],
        "token_count": 100
      }
    ]
  }
}
```

---

### 6. 获取会话详情

**POST** `{LLM_BASE_URL}/conversation/sessions/{session_id}/info`

**响应：**
```json
{
  "data": {
    "session_id": "string",
    "user_id": 1,
    "title": "string",
    "message_count": 10,
    "total_tokens": 1500,
    "create_time": "datetime",
    "last_update_time": "datetime",
    "first_message": "string"
  }
}
```

---

### 7. 删除会话

**POST** `{LLM_BASE_URL}/conversation/sessions/{session_id}/delete`

---

### 8. 清除会话缓存

**POST** `{LLM_BASE_URL}/conversation/cache/clear`

---

## 反馈模块

### 1. 提交点赞反馈

**POST** `/feedback/like`

**请求参数：**
```json
{
  "question": "string",
  "answer": "string",
  "modelId": "string",
  "feedbackType": "LIKE",
  "source": [
    {
      "id": "string",
      "fileName": "string",
      "content": "string"
    }
  ]
}
```

---

### 2. 提交点踩反馈

**POST** `/feedback/dislike`

**请求参数：**
```json
{
  "question": "string",
  "answer": "string",
  "source": [],
  "reason": "string",
  "feedbackType": "DISLIKE",
  "modelId": "string",
  "reporterName": "string (可选)",
  "reporterUnit": "string (可选)"
}
```

---

### 3. 获取反馈列表

**GET** `/feedback/show/list`

**响应：**
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "feedbackId": 1,
        "feedbackType": "LIKE|DISLIKE",
        "question": "string",
        "answer": "string",
        "modelId": "string",
        "createAt": "datetime",
        "reporterName": "string",
        "reporterUnit": "string",
        "reason": "string"
      }
    ]
  }
}
```

---

### 4. 获取反馈详情

**GET** `/feedback/show/{feedbackId}`

---

## 题库管理模块 (MCQ)

> 所有 MCQ 接口使用 `MCQ_BASE_URL` 作为基础 URL

### 1. 上传题目文件

**POST** `{MCQ_BASE_URL}/upload`

**请求格式：** `multipart/form-data`

**请求参数：**
- `file`: `.docx` 或 `.txt` 文件

**响应：**
```json
{
  "ok": true,
  "items": [
    {
      "stem": "string",
      "options": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "answer": "A",
      "explain_original": "string"
    }
  ]
}
```

---

### 2. 批量保存题目

**POST** `{MCQ_BASE_URL}/bank/bulk_upsert`

**请求参数：**
```json
{
  "items": [
    {
      "stem": "string",
      "options": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "answer": "A",
      "explain": "string"
    }
  ]
}
```

**响应：**
```json
{
  "ok": true,
  "items": [
    {
      "id": "string",
      "qid": "string",
      "stem": "string",
      "options": {},
      "answer": "A",
      "explain": "string",
      "status": "draft"
    }
  ]
}
```

---

### 3. 获取题库列表

**GET** `{MCQ_BASE_URL}/bank/list`

**响应：**
```json
{
  "ok": true,
  "items": [
    {
      "id": "string",
      "qid": "string",
      "stem": "string",
      "options": {},
      "answer": "A",
      "explain": "string",
      "status": "none|draft|approved|rejected|abnormal"
    }
  ]
}
```

**状态说明：**
- `none` - 无解析
- `draft` - 草稿
- `approved` - 已通过
- `rejected` - 已驳回
- `abnormal` - 异常

---

### 4. 批量更新题目

**POST** `{MCQ_BASE_URL}/bank/bulk_update`

**请求参数：**
```json
{
  "items": [
    {
      "id": "string",
      "status": "approved",
      "explain": "string"
    }
  ]
}
```

---

### 5. 批量驳回题目

**POST** `{MCQ_BASE_URL}/bank/bulk_reject`

**请求参数：**
```json
{
  "ids": ["string"],
  "reason": "string"
}
```

---

### 6. 删除题目

**POST** `{MCQ_BASE_URL}/bank/delete`

**请求头：**
```
X-User-Name: {username}
X-User-Role: {role}
```

**请求参数：**
```json
{
  "ids": ["string"],
  "user": "string",
  "role": "string",
  "permanent": false
}
```

---

### 7. 获取已删除题目

**GET** `{MCQ_BASE_URL}/bank/deleted`

**请求头：**
```
X-User-Name: {username}
X-User-Role: {role}
```

---

### 8. 恢复题目

**POST** `{MCQ_BASE_URL}/bank/restore`

**请求参数：**
```json
{
  "ids": ["string"],
  "user": "string"
}
```

---

### 9. 生成解析

**POST** `{MCQ_BASE_URL}/explain`

**请求参数：**
```json
{
  "items": [
    {
      "qid": "string",
      "stem": "string",
      "options": {}
    }
  ],
  "thinking": false,
  "model_id": "string",
  "rerank_top_n": 10,
  "use_insert_block": false
}
```

**响应：**
```json
{
  "ok": true,
  "results": [
    {
      "qid": "string",
      "explain": "string"
    }
  ]
}
```

---

### 10. 异步批量解析

**POST** `{MCQ_BASE_URL}/explain_batch_async`

**请求参数：**
```json
{
  "model_id": "string",
  "thinking": true,
  "rerank_top_n": 10,
  "use_insert_block": false
}
```

**响应：**
```json
{
  "ok": true,
  "task_id": "string"
}
```

---

### 11. 查询任务状态

**GET** `{MCQ_BASE_URL}/tasks/status?task_id={task_id}`

**响应：**
```json
{
  "ok": true,
  "status": "running|done|failed",
  "done": 50,
  "total": 100,
  "results": []
}
```

---

### 12. 获取参考资料

**GET** `{MCQ_BASE_URL}/bank/sources?qid={qid}`

**响应：**
```json
{
  "ok": true,
  "sources": [
    {
      "fileName": "string",
      "initialScore": 0.85,
      "rerankedScore": 0.92,
      "passages": ["string"]
    }
  ]
}
```

---

### 13. 导出题库

**GET** `{MCQ_BASE_URL}/bank/export_docx`

**响应：** Word 文档文件流

---

### 14. 下载导入模板

**GET** `{MCQ_BASE_URL}/import_template`

**响应：** Word 文档文件流

---

### 15. 生成试卷

**POST** `{MCQ_BASE_URL}/bank/generate_paper`

**请求参数：**
```json
{
  "title": "string"
}
```

---

## 考试模块

### 1. 获取开放试卷列表

**GET** `{MCQ_BASE_URL}/papers/list_open`

**响应：**
```json
[
  {
    "paper_id": "string",
    "title": "string",
    "item_count": 50
  }
]
```

---

### 2. 获取所有试卷列表

**GET** `{MCQ_BASE_URL}/papers/list_all`

---

### 3. 查看试卷详情

**GET** `{MCQ_BASE_URL}/papers/view?paper_id={paper_id}`

**响应：**
```json
{
  "ok": true,
  "items": [
    {
      "qid": "string",
      "stem": "string",
      "qtype": "single|multiple",
      "options": [
        {"label": "A", "text": "string"}
      ]
    }
  ]
}
```

---

### 4. 开始考试

**POST** `{MCQ_BASE_URL}/exam/start`

**请求参数：**
```json
{
  "paper_id": "string",
  "duration_sec": 3600,
  "student_id": "string"
}
```

**响应：**
```json
{
  "ok": true,
  "attempt_id": "string",
  "left_sec": 3600
}
```

---

### 5. 提交答案

**POST** `{MCQ_BASE_URL}/exam/submit`

**请求参数：**
```json
{
  "attempt_id": "string",
  "answers": {
    "qid1": "A",
    "qid2": "BC"
  }
}
```

**响应：**
```json
{
  "ok": true,
  "score": 85,
  "correct": 17,
  "total": 20,
  "details": []
}
```

---

### 6. 查看考试回顾

**GET** `{MCQ_BASE_URL}/exam/review?attempt_id={attempt_id}`

---

### 7. 导出个人成绩报告

**GET** `{MCQ_BASE_URL}/student/export_my_report_docx`

---

### 8. 导出错题报告

**GET** `{MCQ_BASE_URL}/student/export_wrong_report_docx`

---

## 问答日志模块

### 1. 获取日志列表

**GET** `{LLM_BASE_URL}/qa_logs/daily`

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| date | string | 日期，格式 YYYY-MM-DD |
| user_id | string | 用户 ID 筛选 |
| page | number | 页码，默认 1 |
| page_size | number | 每页数量，默认 20 |

**响应：**
```json
{
  "data": {
    "date": "2024-01-01",
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "logs": [
      {
        "id": "string",
        "timestamp": "datetime",
        "type": "knowledge_qa_stream|knowledge_chat|conversation|mcq",
        "question": "string",
        "answer_preview": "string",
        "metadata": {
          "ip": "string",
          "user_id": "string",
          "answer_type": "string",
          "chat_mode": true,
          "insert_block_mode": false
        }
      }
    ]
  }
}
```

---

### 2. 获取日志详情

**GET** `{LLM_BASE_URL}/qa_logs/detail`

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 日志 ID |
| date | string | 日期（可选） |

**响应：**
```json
{
  "data": {
    "id": "string",
    "timestamp": "datetime",
    "type": "string",
    "question": "string",
    "answer": "string",
    "metadata": {}
  }
}
```

---

### 3. 获取有日志的日期列表

**GET** `{LLM_BASE_URL}/qa_logs/dates`

**响应：**
```json
{
  "data": {
    "dates": ["2024-01-01", "2024-01-02"],
    "total": 30
  }
}
```

---

## 数据分析模块

### 1. 生成完整对比报告

**POST** `/entry-exit/generate-full-report`

**请求格式：** `multipart/form-data`

**请求参数：**
- `previousYearFile`: 往年数据 Excel 文件 (.xlsx)
- `currentYearFile`: 今年数据 Excel 文件 (.xlsx)

**响应：** Word 文档文件流 (blob)

**超时时间：** 15 分钟

---

### 2. 生成摘要报告

**POST** `/entryExit/summary-entrance`

**请求格式：** `multipart/form-data`

**请求参数：**
- `previousYearFile`: 往年数据 Excel 文件 (.xlsx)
- `currentYearFile`: 今年数据 Excel 文件 (.xlsx)

**响应：** Word 文档文件流 (blob)

---

## 本地存储键名

| 键名 | 说明 |
|------|------|
| `jwt_token` | 主后端 JWT Token |
| `multi_turn_chat_jwt` | LLM 服务 JWT Token |
| `multi_turn_chat_session_id` | 当前会话 ID |
| `multi_turn_chat_user` | 用户信息 |

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token 过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 更新日志

- **2024-12** - 初始版本，包含所有模块接口文档
