# 皖美智脑 - API 接口开发文档

> **文档版本**: v2.0  
> **更新日期**: 2026-01-29  
> **适用范围**: 前端项目 API 接口说明，用于后端迁移和项目理解

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [环境配置](#环境配置)
4. [认证与授权](#认证与授权)
5. [用户认证模块](#用户认证模块)
6. [管理员模块](#管理员模块)
7. [超级管理员模块](#超级管理员模块)
8. [知识问答模块](#知识问答模块)
9. [多轮对话模块](#多轮对话模块)
10. [反馈模块](#反馈模块)
11. [题库管理模块(MCQ)](#题库管理模块mcq)
12. [考试模块](#考试模块)
13. [知识库管理模块](#知识库管理模块)
14. [问答日志模块](#问答日志模块)
15. [写作日志模块](#写作日志模块)
16. [视频中心模块](#视频中心模块)
17. [用户部门管理](#用户部门管理)
18. [分组权限管理](#分组权限管理)
19. [数据分析模块](#数据分析模块)
20. [错误处理规范](#错误处理规范)

---

## 项目概述

**皖美智脑**是基于大语言模型的智能问答系统，为安徽出入境边防检查总站提供专业知识库问答服务。

### 核心功能

- 🔍 **业务问答** - 基于知识库的智能问答
- 💬 **智能对话** - 支持上下文的多轮对话
- 📚 **边检智学** - 在线考试与学习系统
- 📝 **公文助手** - 智能写作辅助
- 📞 **12367助手** - 专门的咨询问答
- 📊 **数研报告** - 数据分析报告生成

---

## 技术架构

### 前端技术栈

- **框架**: Vue 3 + TypeScript
- **UI库**: Element Plus
- **状态管理**: Vuex
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **构建工具**: Vue CLI

### 后端服务架构

项目采用**微服务架构**，包含三个独立的后端服务：

| 服务名称 | 端口 | 用途 | HTTP实例 |
|---------|------|------|----------|
| 主后端服务 | 3000 | 用户管理、权限、反馈等 | `http` |
| LLM服务 | 8000 | 知识问答、对话、日志等 | `llmHttp` |
| MCQ服务 | 9000 | 题库管理、考试系统 | `mcqHttp` |

### Nginx反向代理配置

```nginx
# 主后端服务
location /api {
    proxy_pass http://localhost:3000;
}

# LLM服务
location /llm {
    proxy_pass http://localhost:5000;
}

# MCQ服务
location /mcq_public {
    proxy_pass http://localhost:9000;
}
```

---

## 环境配置

### 环境变量

**开发环境** (`.env.development`):
```bash
VUE_APP_API_BASE_URL=/api
VUE_APP_LLM_BASE_URL=/llm/api
VUE_APP_MCQ_BASE_URL=/mcq_public
VUE_APP_WRITER_URL=/llm/api
VUE_APP_OCR_BASE_URL=http://53.3.1.2:9000
VUE_APP_SHOW_HIDDEN_NODES=false
```

**生产环境** (`.env.production`):
```bash
VUE_APP_API_BASE_URL=/api
VUE_APP_LLM_BASE_URL=/llm/api
VUE_APP_MCQ_BASE_URL=/mcq_public
```

### HTTP客户端配置

#### 1. http - 主后端服务

```typescript
// 文件: src/config/api/http.ts
baseURL: /api
timeout: 30000
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {jwt_token}',
  'X-User-Role': '{user.role}',
  'X-User-Name': '{user.username}'
}
```

#### 2. llmHttp - LLM服务

```typescript
// 文件: src/config/api/llmHttp.ts
baseURL: /llm/api
timeout: 90000
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {multi_turn_chat_jwt}',
  'X-User-Role': '{user.role}',
  'X-User-Name': '{user.username}'
}
```

#### 3. mcqHttp - MCQ服务

```typescript
// 文件: src/config/api/mcqHttp.ts
baseURL: /mcq_public
timeout: 60000
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {jwt_token}'
}
```

---

## 认证与授权

### Token管理

| Token类型 | 存储键 | 用途 | 有效期 |
|----------|--------|------|--------|
| 主Token | `jwt_token` | 主后端、MCQ服务认证 | 7天 |
| 对话Token | `multi_turn_chat_jwt` | LLM服务认证 | 7天 |

### 用户角色

| 角色 | 权限说明 |
|------|---------|
| `USER` | 普通用户，基础问答功能 |
| `ADMIN` | 管理员，用户管理、题库管理 |
| `SUPER_ADMIN` | 超级管理员，所有权限 |
| `BJZX_ADMIN` | 边检智学管理员，题库和考试管理 |

### 用户状态

| 状态值 | 说明 |
|-------|------|
| `1` | 正常 |
| `0` | 待审核 |
| `-1` | 已封禁 |
| `-2` | 审核未通过 |

---

## 用户认证模块

### 1. 用户登录

**接口**: `POST /user/account/token/`  
**HTTP实例**: `http`  
**认证**: 无需

**请求参数**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "zq",
      "role": "SUPER_ADMIN",
      "status": 1
    }
  }
}
```

**业务逻辑**:
1. 验证用户名密码
2. 检查用户状态（status=0返回"待审核"，status=-1返回"已封禁"）
3. 生成JWT Token
4. 返回用户信息和Token

---

### 2. 用户注册

**接口**: `POST /user/account/register/`  
**HTTP实例**: `http`  
**认证**: 无需

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "policeId": "string",
  "idCardNumber": "string"
}
```

**响应**:
```json
{
  "success": true,
  "code": 200,
  "message": "注册成功，等待管理员审批",
  "data": {}
}
```

**业务逻辑**:
1. 验证用户名唯一性
2. 验证警号和身份证号格式
3. 密码加密存储（bcrypt）
4. **默认status=0（待审核）**
5. 返回注册成功提示

---

### 3. 获取用户信息

**接口**: `GET /user/account/info/`  
**HTTP实例**: `http`  
**认证**: 需要（Bearer Token）

**响应**:
```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": 1,
    "username": "zq",
    "role": "SUPER_ADMIN",
    "status": 1,
    "email": null,
    "policeId": "123456",
    "idCardNumber": "320106199001011234",
    "hasChangedName": false,
    "department": "出入境管理局",
    "groups": ["admin_group"]
  }
}
```

---

### 4. 修改密码

**接口**: `POST /auth/change_password`  
**HTTP实例**: `http`  
**认证**: 需要

**请求参数**:
```json
{
  "id": "string",
  "username": "string",
  "oldPassword": "string",
  "newPassword": "string"
}
```

---

### 5. 修改用户名

**接口**: `POST /auth/change_username`  
**HTTP实例**: `http`  
**认证**: 需要

**请求参数**:
```json
{
  "id": "string",
  "newUsername": "string"
}
```

**业务逻辑**:
- 用户只能修改一次用户名
- 修改后设置 `hasChangedName=true`

---

### 6. 忘记密码

**接口**: `POST /auth/forget`  
**HTTP实例**: `http`  
**认证**: 无需

---

## 管理员模块

### 1. 获取用户列表

**接口**: `GET /api/admin/users/list/`  
**HTTP实例**: `http`  
**权限**: ADMIN 或 SUPER_ADMIN

**响应**:
```json
{
  "success": true,
  "code": 200,
  "data": {
    "list": [
      {
        "id": 123,
        "username": "user01",
        "email": "user@example.com",
        "role": "USER",
        "status": 1,
        "created_at": "2025-01-20 10:30:00",
        "policeId": "123456",
        "department": "出入境管理局"
      }
    ]
  }
}
```

---

### 2. 获取待审核用户列表

**接口**: `GET /api/admin/users/pending/`  
**HTTP实例**: `http`  
**权限**: ADMIN 或 SUPER_ADMIN

**响应**:
```json
{
  "success": true,
  "code": 200,
  "data": {
    "list": [
      {
        "id": 124,
        "username": "newuser",
        "policeId": "262841",
        "idCardNumber": "320106199001011234",
        "created_at": "2025-01-29 10:00:00",
        "status": 0
      }
    ]
  }
}
```

---

### 3. 批准用户

**接口**: `POST /api/admin/users/approve/`  
**HTTP实例**: `http`  
**权限**: ADMIN 或 SUPER_ADMIN

**请求参数**:
```json
{
  "id": 124,
  "username": "newuser"
}
```

**业务逻辑**:
- 将用户status从0改为1
- 记录审批日志

---

### 4. 拒绝用户

**接口**: `POST /api/admin/users/reject/`  
**HTTP实例**: `http`  
**权限**: ADMIN 或 SUPER_ADMIN

**请求参数**:
```json
{
  "id": 124,
  "username": "newuser"
}
```

**业务逻辑**:
- 删除用户记录或设置status=-2
- 记录拒绝日志

---

### 5. 封禁用户

**接口**: `POST /api/admin/users/ban/`  
**HTTP实例**: `http`  
**权限**: ADMIN 或 SUPER_ADMIN

**请求参数**:
```json
{
  "id": 123,
  "username": "user01"
}
```

---

### 6. 解封用户

**接口**: `POST /api/admin/users/unban/`  
**HTTP实例**: `http`  
**权限**: ADMIN 或 SUPER_ADMIN

---

## 超级管理员模块

### 1. 创建管理员

**接口**: `POST /api/admin/create-admin/`  
**HTTP实例**: `http`  
**权限**: SUPER_ADMIN

**请求参数**:
```json
{
  "username": "admin01",
  "password": "password123",
  "policeId": "123456",
  "idCardNumber": "320106199001011234",
  "email": "admin@example.com"
}
```

---

### 2. 获取管理员列表

**接口**: `GET /api/admin/list-admins/`  
**HTTP实例**: `http`  
**权限**: SUPER_ADMIN

---

### 3. 降级管理员

**接口**: `POST /api/admin/downgrade-admin/`  
**HTTP实例**: `http`  
**权限**: SUPER_ADMIN

---

### 4. 提升用户为管理员

**接口**: `POST /api/admin/upgrade-admin/`  
**HTTP实例**: `http`  
**权限**: SUPER_ADMIN

---

### 5. 设置边检智学管理员

**接口**: `POST /api/admin/users/set-bjzx-admin/`  
**HTTP实例**: `http`  
**权限**: SUPER_ADMIN

---

## 知识问答模块

### 1. 单轮知识问答（流式）

**接口**: `POST {LLM_BASE_URL}/knowledge_chat`  
**完整URL**: `http://domain/llm/api/knowledge_chat`  
**HTTP实例**: 使用原生fetch（流式响应）  
**认证**: 可选

**请求参数**:
```json
{
  "question": "护照办理需要什么材料？",
  "session_id": null,
  "thinking": true,
  "model_id": "qwen3-32b",
  "rerank_top_n": 10,
  "use_insert_block": false,
  "insert_block_llm_id": null,
  "user_id": 123
}
```

**响应格式**: Server-Sent Events (SSE)

**SSE消息类型**:

| 前缀 | 格式 | 说明 |
|------|------|------|
| SESSION | `data: SESSION:{session_id}` | 会话ID |
| THINK | `data: THINK:{content}` | 思考过程（流式） |
| CONTENT | `data: CONTENT:{content}` | 回答内容（流式） |
| SOURCE | `data: SOURCE:{json}` | 参考来源 |
| SUB_QUESTIONS | `data: SUB_QUESTIONS:{json}` | 子问题 |
| KEYWORDS | `data: KEYWORDS:{json}` | 关键词 |
| ERROR | `data: ERROR:{message}` | 错误信息 |
| DONE | `data: DONE:` | 流式完成 |

**SOURCE JSON结构**:
```json
{
  "id": "chunk_123",
  "fileName": "护照办理指南.pdf",
  "content": "护照办理需要以下材料...",
  "initialScore": 0.85,
  "rerankedScore": 0.92,
  "canAnswer": true,
  "keyPassage": "关键段落",
  "url": "http://...",
  "retrievalSources": ["vector", "keyword"],
  "vectorScore": 0.85,
  "bm25Score": 0.78,
  "vectorRank": 1,
  "bm25Rank": 2,
  "matchedKeywords": ["护照", "办理"],
  "isHidden": false,
  "hiddenKbName": null
}
```

**前端调用示例**:
```javascript
const response = await fetch('/llm/api/knowledge_chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    question: "护照办理需要什么材料？",
    thinking: true,
    model_id: "qwen3-32b"
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  // 处理SSE消息
}
```

---

### 2. 12367知识问答

**接口**: `POST {LLM_BASE_URL}/knowledge_chat_12367`  
**说明**: 参数和响应格式同单轮问答

---

### 3. MCQ策略判断

**接口**: `POST {LLM_BASE_URL}/mcq_strategy`  
**用途**: 判断题目类型和答题策略

---

### 4. MCQ格式化

**接口**: `POST {LLM_BASE_URL}/mcq_format`  
**用途**: 格式化题目文本

---

### 5. MCQ答案总结

**接口**: `POST {LLM_BASE_URL}/mcq_summarize`  
**用途**: 总结答案要点

---

## 多轮对话模块

### 1. 创建新会话

**接口**: `POST /conversation/new`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

**响应**:
```json
{
  "session_id": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "新会话创建成功"
}
```

**会话ID格式**: `{user_id}_{uuid}`

---

### 2. 多轮对话问答（流式）

**接口**: `POST {LLM_BASE_URL}/knowledge_chat_conversation`  
**HTTP实例**: 使用原生fetch  
**认证**: 需要

**请求参数**:
```json
{
  "question": "护照办理需要什么材料？",
  "session_id": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "thinking": true,
  "model_id": "qwen3-32b",
  "rerank_top_n": 10
}
```

**响应格式**: SSE（同单轮问答）

---

### 3. 清空会话

**接口**: `POST /conversation/clear`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

**请求参数**:
```json
{
  "session_id": "123_uuid"
}
```

---

### 4. 获取会话统计

**接口**: `POST /conversation/statistics`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

**响应**:
```json
{
  "data": {
    "session_id": "123_uuid",
    "message_count": 10,
    "total_tokens": 5432,
    "create_time": "2025-01-20T10:30:00",
    "last_update_time": "2025-01-20T11:45:00"
  }
}
```

---

### 5. 获取会话列表

**接口**: `POST /conversation/sessions/list`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

**请求参数**:
```json
{
  "page": 1,
  "page_size": 20,
  "sort_by": "last_update"
}
```

**响应**:
```json
{
  "data": {
    "total": 50,
    "sessions": [
      {
        "session_id": "123_uuid-1",
        "user_id": 123,
        "title": "关于护照办理的咨询",
        "first_message": "我想问一下护照办理...",
        "last_message": "好的，谢谢",
        "message_count": 5,
        "total_tokens": 1234,
        "create_time": "2025-01-20T10:30:00",
        "last_update_time": "2025-01-20T11:00:00"
      }
    ],
    "page": 1,
    "page_size": 20
  }
}
```

---

### 6. 获取会话历史

**接口**: `POST /conversation/sessions/{session_id}/history`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

**请求参数**:
```json
{
  "limit": 50,
  "offset": 0,
  "order": "asc"
}
```

**响应**:
```json
{
  "data": {
    "session_id": "123_uuid",
    "total_messages": 10,
    "messages": [
      {
        "turn_id": "turn_uuid_1",
        "user_query": "护照办理需要什么材料？",
        "assistant_response": "护照办理需要以下材料：...",
        "timestamp": "2025-01-20T10:30:15",
        "context_docs": ["护照办理规定.pdf"],
        "token_count": 245
      }
    ]
  }
}
```

---

### 7. 获取会话详情

**接口**: `POST /conversation/sessions/{session_id}/info`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

### 8. 删除会话

**接口**: `POST /conversation/sessions/{session_id}/delete`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

### 9. 清除会话缓存

**接口**: `POST /conversation/cache/clear`  
**HTTP实例**: `llmHttp`  
**权限**: 管理员

---

## 反馈模块

### 1. 提交点赞反馈

**接口**: `POST /feedback/like`  
**HTTP实例**: `http`  
**认证**: 需要

**请求参数**:
```json
{
  "question": "护照办理需要什么材料？",
  "answer": "护照办理需要以下材料：...",
  "modelId": "qwen3-32b",
  "feedbackType": "LIKE",
  "source": [
    {
      "id": "chunk_123",
      "fileName": "护照办理指南.pdf",
      "content": "..."
    }
  ]
}
```

---

### 2. 提交点踩反馈

**接口**: `POST /feedback/dislike`  
**HTTP实例**: `http`  
**认证**: 需要

**请求参数**:
```json
{
  "question": "string",
  "answer": "string",
  "source": [],
  "reason": "回答不准确",
  "feedbackType": "DISLIKE",
  "modelId": "qwen3-32b",
  "reporterName": "张三",
  "reporterUnit": "出入境管理局"
}
```

---

### 3. 获取反馈列表

**接口**: `GET /feedback/show/list`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 4. 获取反馈详情

**接口**: `GET /feedback/show/{feedbackId}`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

## 题库管理模块(MCQ)

### 1. 上传题目文件

**接口**: `POST /upload`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

**请求格式**: `multipart/form-data`

**Form Data**:
- `file`: .docx 或 .txt 文件

**响应**:
```json
{
  "ok": true,
  "items": [
    {
      "stem": "题目内容",
      "options": {
        "A": "选项A",
        "B": "选项B",
        "C": "选项C",
        "D": "选项D"
      },
      "answer": "A",
      "explain_original": "原始解析"
    }
  ]
}
```

---

### 2. 批量保存题目

**接口**: `POST /bank/bulk_upsert`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

---

### 3. 批量更新题目

**接口**: `POST /bank/bulk_update`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

---

### 4. 批量拒绝题目

**接口**: `POST /bank/bulk_reject`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

---

### 5. 获取题库列表

**接口**: `GET /bank/list`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

**Query参数**:
- `status`: 题目状态（pending/approved/rejected）
- `source`: 来源
- `page`: 页码
- `page_size`: 每页数量

---

### 6. 导出题库为Word

**接口**: `POST /bank/export_docx`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

---

### 7. 生成试卷

**接口**: `POST /bank/generate_paper`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

---

### 8. 获取题目来源列表

**接口**: `GET /bank/sources`  
**HTTP实例**: `mcqHttp`  
**认证**: 需要

---

## 考试模块

### 1. 获取开放试卷列表

**接口**: `GET /papers/list_open`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 2. 获取所有试卷列表

**接口**: `GET /papers/list_all`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 3. 查看试卷详情

**接口**: `GET /papers/view`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 4. 创建试卷

**接口**: `POST /papers/create`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 5. 开始考试

**接口**: `POST /exam/start`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 6. 提交考试

**接口**: `POST /exam/submit`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 7. 查看考试结果

**接口**: `GET /exam/review`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 8. 发布考试

**接口**: `POST /exam/publish`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 9. 获取已发布考试列表

**接口**: `GET /exam/published`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 10. 取消已发布考试

**接口**: `POST /exam/cancel`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 11. 获取考试通知（学生端）

**接口**: `GET /exam/notifications`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 12. 获取成绩统计

**接口**: `GET /exam/grades_stats`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

## 知识库管理模块

### 1. 上传文件

**接口**: `POST /knowledge/upload`  
**HTTP实例**: `llmHttp`  
**认证**: 需要 + 知识库口令

**Headers**:
```
Authorization: Bearer {token}
X-KB-PASSWORD: {kb_password}
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: 文件（支持txt, md, docx, doc, pdf, csv, json, html, htm）
- `kb`: 知识库类型（general/visa_free/airline/general_b/hidden）
- `auto_rebuild`: 是否自动重建（true/false）

**响应**:
```json
{
  "ok": true,
  "message": "已接收，开始重建",
  "file_name": "边检业务规范.docx",
  "kb_type": "general"
}
```

---

### 2. 列出文件

**接口**: `GET /knowledge/list_files?kb=general`  
**HTTP实例**: `llmHttp`  
**认证**: 无需

**响应**:
```json
{
  "ok": true,
  "kb_type": "general",
  "kb_name": "通用知识库",
  "files": [
    {
      "name": "边检业务规范.docx",
      "size": 102400,
      "modified": "2025-01-15T10:30:00"
    }
  ],
  "total_count": 2,
  "total_size": 358400
}
```

---

### 3. 删除文件

**接口**: `POST /knowledge/delete_file`  
**HTTP实例**: `llmHttp`  
**认证**: 需要 + 知识库口令

**请求参数**:
```json
{
  "kb": "general",
  "file_name": "边检业务规范.docx"
}
```

**响应**:
```json
{
  "ok": true,
  "message": "文件及对应向量已删除，即时生效。",
  "need_rebuild": false,
  "kb_type": "general",
  "kb_name": "通用知识库"
}
```

---

### 4. 查询更新状态

**接口**: `GET /knowledge/update_status?kb=general`  
**HTTP实例**: `llmHttp`  
**认证**: 无需

**响应**:
```json
{
  "ok": true,
  "data": {
    "general": {
      "kb_type": "general",
      "updating": false,
      "progress": "更新完成",
      "file_count": 50,
      "started_at": "2025-01-15T10:00:00",
      "finished_at": "2025-01-15T10:05:30",
      "duration_seconds": 330.5,
      "last_error": ""
    }
  }
}
```

---

### 5. 快速检查更新中

**接口**: `GET /knowledge/is_updating?kb=general`  
**HTTP实例**: `llmHttp`  
**认证**: 无需

**响应**:
```json
{
  "ok": true,
  "updating": false,
  "updating_kbs": []
}
```

---

### 6. 手动触发重建

**接口**: `POST /knowledge/rebuild`  
**HTTP实例**: `llmHttp`  
**认证**: 需要 + 知识库口令

**请求参数**:
```json
{
  "kb": "general"
}
```

---

## 问答日志模块

### 1. 获取某天的日志记录

**接口**: `GET /qa_logs/daily?date=2025-01-29&page=1&page_size=20`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

**Query参数**:
- `date`: 日期（YYYY-MM-DD）
- `user_id`: 用户ID（可选）
- `username`: 用户名（可选）
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "data": {
    "date": "2025-01-29",
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "logs": [
      {
        "id": "log_123",
        "timestamp": "2025-01-29T10:30:00",
        "type": "knowledge_qa",
        "question": "护照办理需要什么材料？",
        "answer_preview": "护照办理需要以下材料：...",
        "metadata": {
          "ip": "192.168.1.100",
          "user_id": "123",
          "answer_type": "normal",
          "chat_mode": false,
          "insert_block_mode": false
        }
      }
    ]
  }
}
```

---

### 2. 获取日志详情

**接口**: `GET /qa_logs/detail?id=log_123&date=2025-01-29`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

**响应**:
```json
{
  "data": {
    "id": "log_123",
    "timestamp": "2025-01-29T10:30:00",
    "type": "knowledge_qa",
    "question": "护照办理需要什么材料？",
    "answer": "完整的回答内容...",
    "metadata": {
      "ip": "192.168.1.100",
      "user_id": "123",
      "answer_type": "normal",
      "sources": [...]
    }
  }
}
```

---

### 3. 获取有日志的日期列表

**接口**: `GET /qa_logs/dates`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

**响应**:
```json
{
  "data": {
    "dates": ["2025-01-29", "2025-01-28", "2025-01-27"],
    "total": 3
  }
}
```

---

## 写作日志模块

### 1. 获取某天的写作日志

**接口**: `GET /writing_logs/daily?date=2025-01-29`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

---

### 2. 获取写作日志详情

**接口**: `GET /writing_logs/detail?id=log_123`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

---

## 视频中心模块

### 1. 获取视频列表

**接口**: `GET /videos/list`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

### 2. 上传视频

**接口**: `POST /videos/upload`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

---

### 3. 获取视频信息

**接口**: `GET /videos/{videoId}/info`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

### 4. 下载视频

**接口**: `GET /videos/{videoId}/download`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

### 5. 流式播放

**接口**: `GET /videos/{videoId}/stream`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

### 6. 删除视频

**接口**: `POST /videos/{videoId}/delete`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

---

### 7. 更新视频信息

**接口**: `POST /videos/{videoId}/update`  
**HTTP实例**: `llmHttp`  
**权限**: ADMIN

---

## 用户部门管理

### 1. 获取用户部门信息

**接口**: `GET /user/department`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 2. 更新用户部门

**接口**: `POST /user/department`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 3. 获取部门列表

**接口**: `GET /departments`  
**HTTP实例**: `http`  
**认证**: 需要

---

### 4. 检查是否需要设置部门

**接口**: `GET /user/department/check`  
**HTTP实例**: `http`  
**认证**: 需要

---

## 分组权限管理

### 1. 获取分组列表

**接口**: `GET /api/admin/groups`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 2. 创建分组

**接口**: `POST /api/admin/groups`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 3. 获取分组详情

**接口**: `GET /api/admin/groups/{groupId}`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 4. 获取分组权限

**接口**: `GET /api/admin/groups/{groupId}/permissions`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

### 5. 更新用户分组

**接口**: `PUT /api/admin/groups/users/{userId}`  
**HTTP实例**: `http`  
**权限**: ADMIN

---

## 数据分析模块

### 1. 生成完整报告

**接口**: `POST /entry-exit/generate-full-report`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

### 2. 生成综合摘要

**接口**: `POST /entryExit/summary-entrance-comprehensive`  
**HTTP实例**: `llmHttp`  
**认证**: 需要

---

## 错误处理规范

### HTTP状态码

| 状态码 | 说明 | 处理方式 |
|-------|------|---------|
| 200 | 成功 | 正常处理 |
| 400 | 请求参数错误 | 检查请求参数 |
| 401 | 未认证/Token失效 | 重新登录 |
| 403 | 权限不足 | 提示无权限 |
| 404 | 资源不存在 | 提示资源不存在 |
| 409 | 冲突（如用户名已存在） | 提示冲突信息 |
| 460 | 自定义封禁状态码 | 强制登出 |
| 500 | 服务器内部错误 | 提示系统错误 |

### 错误响应格式

**标准格式**:
```json
{
  "success": false,
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

**认证错误**:
```json
{
  "detail": "未提供认证令牌"
}
```

**业务错误**:
```json
{
  "type": "error",
  "content": "业务错误描述"
}
```

### 前端错误处理

```typescript
// 文件: src/utils/errorHandler.ts
// 统一错误处理工具
export class ErrorHandler {
  static handleHttpError(error: AxiosError) {
    const status = error.response?.status;
    const bizCode = (error.response?.data as any)?.code;
    
    // 401/460/BANNED: 强制登出
    if (status === 401 || status === 460 || bizCode === 'BANNED') {
      forceLogout('登录已失效或账号已被封禁，请重新登录');
    }
    
    // 其他错误提示
    ElMessage.error(error.message);
  }
}
```

---

## 附录

### A. 知识库类型

| kb值 | 名称 | 说明 |
|------|------|------|
| `general` | 通用知识库 | 默认知识库，存放通用业务文档 |
| `visa_free` | 免签知识库 | 各国免签政策、签证规定 |
| `airline` | 航司知识库 | 航空公司规定、机组人员政策 |
| `general_b` | 通用知识库B | 备用通用知识库 |
| `hidden` | 隐藏知识库 | 题库相关知识，用于辅助答题 |

### B. 支持的文件格式

**知识库上传**: txt, md, docx, doc, pdf, csv, json, html, htm  
**题库上传**: docx, txt  
**数据分析**: xlsx, xls

### C. 本地存储键名

| 键名 | 用途 |
|-----|------|
| `jwt_token` | 主Token |
| `multi_turn_chat_jwt` | 对话Token |
| `multi_turn_chat_session_id` | 会话ID |
| `multi_turn_chat_user` | 用户信息 |
| `kb_password` | 知识库口令 |

---

## 文档维护

**维护者**: 前端开发团队  
**联系方式**: zq@zqsee.com  
**最后更新**: 2026-01-29

---

**注意事项**:

1. 所有涉及流式响应的接口必须使用原生fetch，不能使用axios
2. LLM服务的超时时间设置为90秒，因为AI推理需要较长时间
3. 知识库写操作需要双重认证：Bearer Token + X-KB-PASSWORD
4. 用户注册后默认status=0，需要管理员审批
5. 会话ID格式为 `{user_id}_{uuid}`，由后端生成
6. SSE消息中的 `<NEWLINE>` 需要在前端转换为 `\n`
7. 所有时间格式使用ISO 8601标准

---

**文档结束**
