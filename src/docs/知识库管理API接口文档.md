# 知识库管理 API 接口文档

> **前端调用说明**：所有接口需添加统一前缀 `/llm`（Nginx反向代理配置）

---

## 目录

1. [通用说明](#通用说明)
2. [上传文件](#1-上传文件)
3. [列出文件](#2-列出文件)
4. [删除文件](#3-删除文件)
5. [查询更新状态](#4-查询更新状态)
6. [快速检查更新中](#5-快速检查更新中)
7. [手动触发重建](#6-手动触发重建)
8. [知识库类型说明](#知识库类型说明)
9. [前端调用示例](#前端调用示例)
10. [错误码说明](#错误码说明)

---

## 通用说明

### 基础URL
```
https://your-domain.com/llm
```

### 认证方式

所有**写操作**（上传、删除、重建）需要两层认证：

| Header | 说明 | 必填 |
|--------|------|------|
| `Authorization` | Bearer Token，格式：`Bearer <token>` | 是 |
| `X-KB-PASSWORD` | 知识库操作口令 | 是（写操作） |

**读操作**（列出文件、查询状态）无需认证。

### 响应格式

所有接口返回 JSON 格式，统一包含 `ok` 字段：

```json
{
  "ok": true,   // 操作是否成功
  "message": "...",  // 提示信息
  "data": {}   // 具体数据（部分接口）
}
```

---

## 1. 上传文件

上传文档到指定知识库。

### 请求

```http
POST /llm/api/knowledge/upload
```

### Headers

| Header | 值 | 必填 |
|--------|---|------|
| `Authorization` | `Bearer <token>` | 是 |
| `X-KB-PASSWORD` | `<上传口令>` | 是 |
| `Content-Type` | `multipart/form-data` | 是 |

### Form Data

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|-----|-------|------|
| `file` | File | 是 | - | 上传的文件 |
| `kb` | String | 否 | `general` | 知识库类型，见[知识库类型说明](#知识库类型说明) |
| `auto_rebuild` | String | 否 | `true` | 是否自动触发索引重建 |

### 支持的文件格式

`txt`, `md`, `docx`, `doc`, `pdf`, `csv`, `json`, `html`, `htm`

### 文件大小限制

最大 50MB（可配置）

### 响应示例

**成功（自动重建）**：
```json
{
  "ok": true,
  "message": "已接收，开始重建",
  "file_name": "边检业务规范.docx",
  "kb_type": "general"
}
```

**成功（重建任务已在执行）**：
```json
{
  "ok": true,
  "message": "文件已保存，但重建任务已在执行中，请稍后手动触发",
  "file_name": "边检业务规范.docx",
  "kb_type": "general"
}
```

**失败**：
```json
{
  "ok": false,
  "message": "不支持的文件类型，允许的类型: txt, md, docx, doc, pdf, csv, json, html, htm"
}
```

---

## 2. 列出文件

获取指定知识库中的所有文件列表。

### 请求

```http
GET /llm/api/knowledge/list_files?kb=general
```

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|-----|------|-----|-------|------|
| `kb` | String | 否 | `general` | 知识库类型 |

### 响应示例

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
    },
    {
      "name": "证件管理办法.pdf",
      "size": 256000,
      "modified": "2025-01-14T15:20:00"
    }
  ],
  "total_count": 2,
  "total_size": 358400
}
```

---

## 3. 删除文件

删除知识库中的指定文件。

> **注意**：删除操作会同步清理 Qdrant 向量数据库中的对应向量，即时生效。

### 请求

```http
POST /llm/api/knowledge/delete_file
```

### Headers

| Header | 值 | 必填 |
|--------|---|------|
| `Authorization` | `Bearer <token>` | 是 |
| `X-KB-PASSWORD` | `<上传口令>` | 是 |
| `Content-Type` | `application/json` | 是 |

### Body

```json
{
  "kb": "general",
  "file_name": "边检业务规范.docx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `kb` | String | 否 | 知识库类型，默认 `general` |
| `file_name` | String | 是 | 要删除的文件名（与列表中的 `name` 一致） |

### 响应示例

**成功（向量同步删除）**：
```json
{
  "ok": true,
  "message": "文件及对应向量已删除，即时生效。",
  "need_rebuild": false,
  "kb_type": "general",
  "kb_name": "通用知识库"
}
```

**成功（向量删除失败，需手动重建）**：
```json
{
  "ok": true,
  "message": "文件已删除，但向量清理失败(connection error)，建议手动重建。",
  "need_rebuild": true,
  "kb_type": "general",
  "kb_name": "通用知识库"
}
```

---

## 4. 查询更新状态

获取知识库的更新状态详情。

### 请求

```http
GET /llm/api/knowledge/update_status?kb=general
```

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `kb` | String | 否 | 知识库类型，不传则返回所有知识库状态 |

### 响应示例

**查询单个知识库**：
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

**查询所有知识库**：
```json
{
  "ok": true,
  "data": {
    "general": {
      "kb_type": "general",
      "updating": false,
      "progress": "更新完成",
      "file_count": 50,
      "duration_seconds": 330.5,
      "last_error": ""
    },
    "visa_free": {
      "kb_type": "visa_free",
      "updating": true,
      "progress": "正在切分文档...",
      "file_count": 30,
      "duration_seconds": null,
      "last_error": ""
    }
  }
}
```

### 状态字段说明

| 字段 | 类型 | 说明 |
|-----|------|------|
| `updating` | Boolean | 是否正在更新 |
| `progress` | String | 当前进度描述 |
| `file_count` | Integer | 文档数量 |
| `started_at` | String | 开始时间（ISO格式） |
| `finished_at` | String | 完成时间（ISO格式） |
| `duration_seconds` | Float | 耗时（秒） |
| `last_error` | String | 最后一次错误信息 |

---

## 5. 快速检查更新中

快速检查是否有知识库正在更新（轻量接口，适合轮询）。

### 请求

```http
GET /llm/api/knowledge/is_updating?kb=general
```

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `kb` | String | 否 | 知识库类型，不传则检查所有 |

### 响应示例

**无更新任务**：
```json
{
  "ok": true,
  "updating": false,
  "updating_kbs": []
}
```

**有更新任务**：
```json
{
  "ok": true,
  "updating": true,
  "updating_kbs": ["general", "visa_free"]
}
```

---

## 6. 手动触发重建

手动触发指定知识库的索引重建。

### 请求

```http
POST /llm/api/knowledge/rebuild
```

### Headers

| Header | 值 | 必填 |
|--------|---|------|
| `Authorization` | `Bearer <token>` | 是 |
| `X-KB-PASSWORD` | `<上传口令>` | 是 |
| `Content-Type` | `application/json` | 是 |

### Body

```json
{
  "kb": "general"
}
```

### 响应示例

**成功**：
```json
{
  "ok": true,
  "message": "重建任务已启动: 通用知识库"
}
```

**失败（已有任务在执行）**：
```json
{
  "ok": false,
  "message": "已有重建任务在执行中"
}
```

---

## 知识库类型说明

| kb 值 | 名称 | 说明 |
|-------|------|------|
| `general` | 通用知识库 | 默认知识库，存放通用业务文档 |
| `visa_free` | 免签知识库 | 各国免签政策、签证规定 |
| `airline` | 航司知识库 | 航空公司规定、机组人员政策 |
| `general_b` | 通用知识库B | 备用通用知识库 |
| `hidden` | 隐藏知识库 | 题库相关知识，用于辅助答题 |

---

## 前端调用示例

### JavaScript (Fetch API)

#### 上传文件

```javascript
async function uploadKBFile(file, kbType = 'general', autoRebuild = true) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kb', kbType);
  formData.append('auto_rebuild', autoRebuild.toString());

  const response = await fetch('/llm/api/knowledge/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'X-KB-PASSWORD': getKBPassword()
    },
    body: formData
  });

  return await response.json();
}
```

#### 列出文件

```javascript
async function listKBFiles(kbType = 'general') {
  const response = await fetch(`/llm/api/knowledge/list_files?kb=${kbType}`);
  return await response.json();
}
```

#### 删除文件

```javascript
async function deleteKBFile(fileName, kbType = 'general') {
  const response = await fetch('/llm/api/knowledge/delete_file', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'X-KB-PASSWORD': getKBPassword(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      kb: kbType,
      file_name: fileName
    })
  });

  return await response.json();
}
```

#### 轮询更新状态

```javascript
async function waitForRebuildComplete(kbType, intervalMs = 2000, maxWaitMs = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`/llm/api/knowledge/is_updating?kb=${kbType}`);
    const result = await response.json();
    
    if (!result.updating) {
      // 获取详细状态
      const statusResponse = await fetch(`/llm/api/knowledge/update_status?kb=${kbType}`);
      return await statusResponse.json();
    }
    
    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('重建超时');
}
```

### Vue 3 组合式 API 示例

```javascript
import { ref } from 'vue';

export function useKnowledgeBase() {
  const loading = ref(false);
  const files = ref([]);
  const updateStatus = ref(null);

  const API_BASE = '/llm/api/knowledge';

  async function fetchFiles(kbType = 'general') {
    loading.value = true;
    try {
      const res = await fetch(`${API_BASE}/list_files?kb=${kbType}`);
      const data = await res.json();
      if (data.ok) {
        files.value = data.files;
      }
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function uploadFile(file, kbType = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kb', kbType);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-KB-PASSWORD': localStorage.getItem('kb_password')
      },
      body: formData
    });

    const data = await res.json();
    if (data.ok) {
      await fetchFiles(kbType);
    }
    return data;
  }

  async function deleteFile(fileName, kbType = 'general') {
    const res = await fetch(`${API_BASE}/delete_file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-KB-PASSWORD': localStorage.getItem('kb_password'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ kb: kbType, file_name: fileName })
    });

    const data = await res.json();
    if (data.ok) {
      await fetchFiles(kbType);
    }
    return data;
  }

  async function checkUpdating(kbType) {
    const res = await fetch(`${API_BASE}/is_updating${kbType ? `?kb=${kbType}` : ''}`);
    return await res.json();
  }

  return {
    loading,
    files,
    updateStatus,
    fetchFiles,
    uploadFile,
    deleteFile,
    checkUpdating
  };
}
```

---

## 错误码说明

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 成功 |
| 400 | 请求参数错误（文件类型不支持、参数缺失等） |
| 401 | 认证失败（Token 无效或过期） |
| 403 | 权限不足（口令错误） |
| 404 | 资源不存在（文件不存在） |
| 409 | 冲突（已有重建任务在执行） |
| 500 | 服务器内部错误 |

---

## 最佳实践

### 1. 上传流程

```
1. 调用 /is_updating 检查是否有更新任务
   ↓
2. 如果 updating=true，提示用户等待
   ↓
3. 调用 /upload 上传文件（auto_rebuild=true）
   ↓
4. 轮询 /is_updating 直到 updating=false
   ↓
5. 调用 /update_status 获取结果，检查 last_error
```

### 2. 删除流程

```
1. 调用 /delete_file 删除文件
   ↓
2. 检查响应中的 need_rebuild
   ↓
3. 如果 need_rebuild=true，调用 /rebuild 重建索引
   ↓
4. 轮询 /is_updating 直到完成
```

### 3. 状态轮询建议

- 轮询间隔：2-3 秒
- 最大等待时间：5 分钟
- 超时后提示用户刷新页面查看状态

---

## 更新日志

| 日期 | 版本 | 说明 |
|-----|------|------|
| 2025-01-15 | v1.0 | 初始版本 |
