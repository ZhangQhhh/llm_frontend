# 多轮对话系统 - 后端API文档

## 📌 概述

本文档描述了多轮对话知识问答系统的后端API接口。所有需要认证的接口都需要在请求头中携带JWT Token。

**基础URL**: `http://your-domain/llm/api`

---

## 🔐 认证说明

### 认证方式
所有需要认证的接口必须在请求头中携带JWT Token：

```http
Authorization: Bearer <your_jwt_token>
```

### 白名单接口（无需认证）
- `/api/knowledge_chat` - 单轮知识问答
- `/api/test` - 测试接口

### 认证错误响应
```json
{
  "detail": "未提供认证令牌"
}
```
状态码: `401 Unauthorized`

---

## 📋 接口列表

### 1. 创建新会话 ✨ NEW

**用途**: 用户主动创建新会话，获取会话ID。这是多轮对话的第一步。

**路径**: `POST /conversation/new`

**认证**: ✅ 需要

**请求体**: 无需请求体（用户信息从Token中获取）

**响应示例**:
```json
{
  "session_id": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "新会话创建成功"
}
```

**状态码**: `200 OK`

**前端调用示例**:
```javascript
const response = await fetch('/llm/api/conversation/new', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
const sessionId = data.session_id;  // 保存到 localStorage
localStorage.setItem('session_id', sessionId);
```

**重要说明**:
- 会话ID格式：`{user_id}_{uuid}`
- 前端应将会话ID保存到 localStorage，以便持续使用同一会话
- 只有用户点击"新建会话"按钮时才调用此接口
- 页面刷新后，从 localStorage 读取会话ID继续使用

---

### 2. 多轮对话问答 🔥 核心接口

**用途**: 发送问题并获取流式响应，支持多轮对话上下文。

**路径**: `POST /knowledge_chat_conversation`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**响应类型**: `text/event-stream` (Server-Sent Events 流式响应)

**请求体**:
```json
{
  "question": "护照办理需要什么材料？",
  "session_id": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "thinking": true,
  "model_id": "qwen3-32b",
  "rerank_top_n": 10,
  "use_insert_block": false,
  "insert_block_llm_id": null
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| question | string | ✅ 是 | - | 用户问题 |
| session_id | string | ✅ 是 | - | 会话ID（必须提供，使用 `/conversation/new` 创建） |
| thinking | boolean/string | ❌ 否 | true | 是否启用思考模式 |
| model_id | string | ❌ 否 | 配置默认值 | 使用的模型ID |
| rerank_top_n | integer | ❌ 否 | 10 | 重排序后返回的文档数量（1-15） |
| use_insert_block | boolean/string | ❌ 否 | false | 是否使用精准检索模式 |
| insert_block_llm_id | string | ❌ 否 | null | InsertBlock模式使用的模型ID |

**SSE流式响应格式**:

响应数据以SSE格式返回，每行格式为 `data: <prefix>:<content>`

支持的前缀类型：

1. **SESSION** - 会话ID（首次返回）
   ```
   data: SESSION:123_a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

2. **THINK** - 思考过程（当 thinking=true 时）
   ```
   data: THINK:让我分析一下这个问题...
   ```

3. **CONTENT** - 正文内容
   ```
   data: CONTENT:护照办理需要以下材料：
   ```

4. **SOURCE** - 参考来源（JSON格式）
   ```json
   data: SOURCE:{"file_name":"护照办理指南.pdf","chunk_id":"chunk_123","score":0.95,"content":"护照办理材料包括..."}
   ```

5. **ERROR** - 错误信息
   ```
   data: ERROR:缺少会话ID，请先创建会话或使用现有会话
   ```

6. **DONE** - 流结束标记
   ```
   data: DONE:
   ```

**前端调用示例**:
```javascript
const response = await fetch('/llm/api/knowledge_chat_conversation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: "护照办理需要什么材料？",
    session_id: sessionId,  // 从 localStorage 获取
    thinking: true,
    model_id: "qwen3-32b",
    rerank_top_n: 10
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const content = line.substring(6);
      
      if (content.startsWith('THINK:')) {
        // 处理思考内容
        const think = content.substring(6);
        appendToThinkingArea(think);
      } else if (content.startsWith('CONTENT:')) {
        // 处理正文内容
        const text = content.substring(8);
        appendToAnswerArea(text);
      } else if (content.startsWith('SOURCE:')) {
        // 处理参考来源
        const source = JSON.parse(content.substring(7));
        addReference(source);
      } else if (content.startsWith('ERROR:')) {
        // 处理错误
        const error = content.substring(6);
        showError(error);
      }
    }
  }
}
```

**错误响应**:

1. 缺少会话ID：
```json
{
  "type": "error",
  "content": "缺少会话ID，请先创建会话或使用现有会话"
}
```
状态码: `400 Bad Request`

2. 无权访问会话：
```json
{
  "type": "error",
  "content": "无权访问该会话"
}
```
状态码: `403 Forbidden`

---

### 3. 清空当前会话

**用途**: 清空指定会话的所有对话历史（不删除会话ID）。

**路径**: `POST /conversation/clear`

**认证**: ✅ 需要

**请求体**:
```json
{
  "session_id": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**成功响应**:
```json
{
  "type": "success",
  "message": "会话 123_a1b2c3d4-e5f6-7890-abcd-ef1234567890 已清空"
}
```

**错误响应**:
```json
{
  "type": "error",
  "content": "清空会话失败"
}
```

**前端调用示例**:
```javascript
// 用户点击"清空会话"按钮
const response = await fetch('/llm/api/conversation/clear', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_id: sessionId
  })
});

// 注意：清空后会话ID仍然有效，可以继续使用
```

---

### 4. 获取会话统计信息

**用途**: 获取指定会话的统计数据（消息数量、Token使用等）。

**路径**: `POST /conversation/statistics`

**认证**: ✅ 需要

**请求体**:
```json
{
  "session_id": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**响应示例**:
```json
{
  "type": "success",
  "data": {
    "session_id": "123_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "message_count": 10,
    "total_tokens": 5432,
    "create_time": "2025-01-20T10:30:00",
    "last_update_time": "2025-01-20T11:45:00"
  }
}
```

---

### 5. 获取用户会话列表

**用途**: 获取当前用户的所有会话列表（支持分页和排序）。

**路径**: `POST /conversation/sessions/list`

**认证**: ✅ 需要

**请求体**:
```json
{
  "page": 1,
  "page_size": 20,
  "sort_by": "last_update"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | ❌ 否 | 1 | 页码（从1开始） |
| page_size | integer | ❌ 否 | 20 | 每页数量（最大100） |
| sort_by | string | ❌ 否 | last_update | 排序方式：`last_update` 或 `create_time` |

**响应示例**:
```json
{
  "type": "success",
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
      },
      {
        "session_id": "123_uuid-2",
        "user_id": 123,
        "title": "签证申请流程",
        "first_message": "签证怎么办理？",
        "last_message": "明白了",
        "message_count": 8,
        "total_tokens": 2456,
        "create_time": "2025-01-19T14:20:00",
        "last_update_time": "2025-01-19T15:30:00"
      }
    ],
    "page": 1,
    "page_size": 20
  }
}
```

**前端调用示例**:
```javascript
// 获取会话列表（用于左侧会话列表展示）
const response = await fetch('/llm/api/conversation/sessions/list', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    page: 1,
    page_size: 20,
    sort_by: 'last_update'
  })
});

const data = await response.json();
const sessions = data.data.sessions;
// 渲染会话列表
```

---

### 6. 获取会话历史消息

**用途**: 获取指定会话的所有历史消息（用于恢复会话显示）。

**路径**: `POST /conversation/sessions/<session_id>/history`

**认证**: ✅ 需要

**URL参数**: `session_id` - 会话ID

**请求体**:
```json
{
  "limit": 50,
  "offset": 0,
  "order": "asc"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | integer | ❌ 否 | 50 | 返回消息数量（最大200） |
| offset | integer | ❌ 否 | 0 | 偏移量（用于分页） |
| order | string | ❌ 否 | asc | 排序顺序：`asc`(旧→新) 或 `desc`(新→旧) |

**响应示例**:
```json
{
  "type": "success",
  "data": {
    "session_id": "123_uuid",
    "total_messages": 10,
    "messages": [
      {
        "turn_id": "turn_uuid_1",
        "user_query": "护照办理需要什么材料？",
        "assistant_response": "护照办理需要以下材料：1. 身份证原件...",
        "timestamp": "2025-01-20T10:30:15",
        "context_docs": ["护照办理规定.pdf"],
        "token_count": 245
      },
      {
        "turn_id": "turn_uuid_2",
        "user_query": "办理需要多久？",
        "assistant_response": "根据您之前咨询的护照办理，一般需要10-15个工作日...",
        "timestamp": "2025-01-20T10:32:00",
        "context_docs": ["护照办理时效说明.pdf"],
        "token_count": 198
      }
    ]
  }
}
```

**前端调用示例**:
```javascript
// 用户点击某个会话，加载历史消息
const sessionId = "123_uuid";
const response = await fetch(`/llm/api/conversation/sessions/${sessionId}/history`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    limit: 50,
    offset: 0,
    order: 'asc'
  })
});

const data = await response.json();
const messages = data.data.messages;
// 渲染历史消息到聊天区域
```

---

### 7. 获取会话详细信息

**用途**: 获取单个会话的详细元数据。

**路径**: `GET|POST /conversation/sessions/<session_id>/info`

**认证**: ✅ 需要

**URL参数**: `session_id` - 会话ID

**请求体**: 无（GET请求）或 空JSON（POST请求）

**响应示例**:
```json
{
  "type": "success",
  "data": {
    "session_id": "123_uuid",
    "user_id": 123,
    "title": "关于护照办理的咨询",
    "message_count": 10,
    "total_tokens": 2456,
    "create_time": "2025-01-20T10:30:00",
    "last_update_time": "2025-01-20T11:00:00",
    "first_message": "我想问一下护照办理需要什么材料？"
  }
}
```

---

### 8. 删除会话

**用途**: 彻底删除指定会话及其所有历史记录。

**路径**: `DELETE|POST /conversation/sessions/<session_id>/delete`

**认证**: ✅ 需要

**URL参数**: `session_id` - 会话ID

**请求体**: 无

**成功响应**:
```json
{
  "type": "success",
  "message": "会话 123_uuid 已删除"
}
```

**前端调用示例**:
```javascript
// 用户点击"删除会话"按钮
const sessionId = "123_uuid";
const response = await fetch(`/llm/api/conversation/sessions/${sessionId}/delete`, {
  method: 'POST',  // 或 DELETE
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// 删除后需要创建新会话或切换到其他会话
```

---

### 9. 清空对话缓存（管理员）

**用途**: 清空服务器端的对话缓存（管理功能）。

**路径**: `POST /conversation/cache/clear`

**认证**: ✅ 需要

**请求体**:
```json
{
  "admin_token": "optional_admin_token"
}
```

**响应示例**:
```json
{
  "type": "success",
  "message": "对话缓存已清空"
}
```

---

### 10. 单轮知识问答（无会话）

**用途**: 不依赖会话的单次问答（无上下文记忆）。

**路径**: `POST /knowledge_chat`

**认证**: ❌ 无需认证（白名单接口）

**请求体**:
```json
{
  "question": "护照办理需要什么材料？",
  "thinking": true,
  "model_id": "qwen3-32b",
  "rerank_top_n": 10,
  "use_insert_block": false
}
```

**响应**: SSE流式响应（格式同多轮对话接口）

**注意**: 此接口不保存对话历史，不支持多轮上下文。

---

## 🔄 会话管理完整流程

### 场景1: 用户首次使用

```javascript
// 1. 用户登录后，创建新会话
const createResp = await fetch('/llm/api/conversation/new', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
const { session_id } = await createResp.json();

// 2. 保存会话ID到 localStorage
localStorage.setItem('current_session_id', session_id);

// 3. 发送第一个问题
await sendMessage("护照办理需要什么材料？", session_id);
```

### 场景2: 用户刷新页面

```javascript
// 页面加载时，从 localStorage 读取会话ID
const sessionId = localStorage.getItem('current_session_id');

if (sessionId) {
  // 验证会话是否有效，加载历史消息
  const historyResp = await fetch(
    `/llm/api/conversation/sessions/${sessionId}/history`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ limit: 50, order: 'asc' })
    }
  );
  
  if (historyResp.ok) {
    const { data } = await historyResp.json();
    renderHistory(data.messages);
  } else {
    // 会话无效，创建新会话
    createNewSession();
  }
} else {
  // 没有会话，创建新会话
  createNewSession();
}
```

### 场景3: 用户点击"新建会话"

```javascript
// 用户主动创建新会话
async function handleNewSession() {
  const resp = await fetch('/llm/api/conversation/new', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { session_id } = await resp.json();
  
  // 更新 localStorage
  localStorage.setItem('current_session_id', session_id);
  
  // 清空聊天区域
  clearChatArea();
  
  // 更新UI显示
  updateSessionDisplay(session_id);
}
```

### 场景4: 用户清空会话

```javascript
// 用户点击"清空会话"按钮
async function handleClearSession() {
  const sessionId = localStorage.getItem('current_session_id');
  
  await fetch('/llm/api/conversation/clear', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ session_id: sessionId })
  });
  
  // 清空UI显示（但保留会话ID）
  clearChatArea();
  
  // 注意：session_id 仍然有效，可以继续使用
}
```

---

## 📊 会话ID格式说明

### 格式
```
{user_id}_{uuid}
```

### 示例
```
123_a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 说明
- **user_id**: 用户ID（从JWT Token中获取）
- **uuid**: 唯一标识符（UUID v4格式）
- 会话ID由后端生成，前端不应自行构造
- 会话ID确保了用户只能访问自己的会话

---

## ⚠️ 错误处理

### 常见错误码

| 状态码 | 说明 | 处理方式 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式 |
| 401 | 未认证 | 重新登录获取Token |
| 403 | 无权访问 | 用户尝试访问其他用户的会话 |
| 404 | 会话不存在 | 创建新会话 |
| 500 | 服务器内部错误 | 联系管理员 |

### 错误响应格式

```json
{
  "type": "error",
  "content": "错误描述信息"
}
```

或

```json
{
  "detail": "认证相关错误信息"
}
```

---

## 🎯 前端集成建议

### 1. 会话ID持久化
```javascript
// 使用 localStorage 存储当前会话ID
const SESSION_KEY = 'multi_turn_chat_session_id';

function saveSessionId(sessionId) {
  localStorage.setItem(SESSION_KEY, sessionId);
}

function getSessionId() {
  return localStorage.getItem(SESSION_KEY);
}

function clearSessionId() {
  localStorage.removeItem(SESSION_KEY);
}
```

### 2. 页面初始化逻辑
```javascript
async function initializePage() {
  const token = getAuthToken();
  if (!token) {
    showLoginModal();
    return;
  }
  
  const sessionId = getSessionId();
  if (sessionId) {
    // 尝试加载历史消息
    try {
      await loadSessionHistory(sessionId);
    } catch (error) {
      // 会话无效，创建新会话
      await createNewSession();
    }
  } else {
    // 没有会话，创建新会话
    await createNewSession();
  }
}
```

### 3. 新建会话按钮
```javascript
document.getElementById('newSessionBtn').addEventListener('click', async () => {
  const resp = await fetch('/llm/api/conversation/new', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { session_id } = await resp.json();
  saveSessionId(session_id);
  clearChatArea();
  showMessage('✨ 新会话已创建');
});
```

### 4. 发送消息
```javascript
async function sendMessage(question) {
  const sessionId = getSessionId();
  if (!sessionId) {
    alert('请先创建会话');
    return;
  }
  
  const response = await fetch('/llm/api/knowledge_chat_conversation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question,
      session_id: sessionId,
      thinking: true,
      model_id: 'qwen3-32b',
      rerank_top_n: 10
    })
  });
  
  // 处理SSE流式响应
  await handleSSEResponse(response);
}
```

---

## 📝 重要注意事项

### ✅ 必须遵守的规则

1. **会话ID必须提供**: 调用 `/knowledge_chat_conversation` 时，`session_id` 是必填参数
2. **先创建后使用**: 首次使用时，必须先调用 `/conversation/new` 创建会话
3. **持久化存储**: 将会话ID保存到 localStorage，页面刷新后继续使用
4. **用户主动控制**: 只有用户点击"新建会话"按钮时才创建新会话
5. **权限验证**: 用户只能访问自己的会话，后端会验证会话所有权

### ⚡ 性能优化建议

1. **缓存历史消息**: 加载过的历史消息可以缓存到内存中
2. **懒加载**: 会话列表支持分页，避免一次加载过多数据
3. **流式渲染**: SSE响应逐块渲染，提升用户体验
4. **Token管理**: 及时刷新过期的JWT Token

---

## 🔧 调试技巧

### 查看当前会话ID
```javascript
console.log('当前会话ID:', localStorage.getItem('multi_turn_chat_session_id'));
```

### 测试会话是否有效
```javascript
async function testSession(sessionId) {
  const resp = await fetch(`/llm/api/conversation/sessions/${sessionId}/info`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (resp.ok) {
    const data = await resp.json();
    console.log('会话信息:', data);
  } else {
    console.error('会话无效或不存在');
  }
}
```

---

## 📮 联系方式

如有问题或建议，请联系开发团队。

**文档版本**: v1.0  
**更新日期**: 2025-01-29  
**作者**: RAG系统开发团队

