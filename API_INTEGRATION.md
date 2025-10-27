# API 集成文档

## 概述

所有API端点已统一集成到 `src/config/api/api.ts` 文件中，并通过 `src/utils/request.ts` 提供统一的请求工具函数。

## 文件结构

```
src/
├── config/
│   └── api/
│       └── api.ts           # API端点配置
├── utils/
│   └── request.ts           # 统一请求工具
└── views/
    ├── ExamView.vue         # 使用统一API
    ├── AdminView.vue        # 使用统一API
    └── TestExplainView.vue  # 使用统一API
```

## API 端点配置 (api.ts)

### 管理员相关
- `ADMIN.USERS` - 用户管理
- `ADMIN.IMPORT_TEMPLATE` - 下载导入模板
- `ADMIN.EXPORT_TEACHER_DOCX` - 导出教师版题库
- `ADMIN.EXPORT_SCORES_ZIP` - 导出成绩ZIP
- `ADMIN.EXPORT_SCORES_DOCX` - 导出成绩表DOCX

### 用户相关
- `USER.LOGIN` - 用户登录
- `USER.REGISTER` - 用户注册
- `USER.INFO` - 用户信息

### 认证相关
- `AUTH.CHANGE_PASSWORD` - 修改密码
- `AUTH.RESET_PASSWORD` - 重置密码

### 题库管理
- `QUESTIONS.UPLOAD` - 上传题目
- `QUESTIONS.EXPLAIN` - 生成解析
- `QUESTIONS.REVIEW` - 审核通过
- `QUESTIONS.REJECT` - 驳回题目
- `QUESTIONS.APPROVE_ALL` - 一键通过
- `QUESTIONS.DEBUG_QUESTIONS` - 获取题目列表
- `QUESTIONS.DEBUG_ANALYSES` - 获取解析列表

### 试卷管理
- `PAPERS.LIST_OPEN` - 获取公开试卷列表
- `PAPERS.LIST_ALL` - 获取所有试卷
- `PAPERS.VIEW` - 查看试卷详情
- `PAPERS.CREATE` - 创建试卷

### 考试相关
- `EXAM.START` - 开始考试
- `EXAM.SUBMIT` - 提交答卷
- `EXAM.REVIEW` - 查看答案解析

### 学生端
- `STUDENT.EXPORT_MY_REPORT_DOCX` - 导出个人成绩报告

### 公开API
- `PUBLIC.EXPLAIN_FROM_TEXT` - 公开题目解析
- `PUBLIC.SERVER_INFO` - 服务器信息

### 任务状态
- `TASKS.STATUS` - 查询任务状态

## 请求工具函数 (request.ts)

### fetchWithAuth(url, options)
带JWT认证的fetch请求
```typescript
const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.EXAM.START), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  data: { paper_id: 'xxx', duration_sec: 600 }
})
```

### getApiUrl(path)
获取完整的API URL
```typescript
const url = getApiUrl(API_ENDPOINTS.PAPERS.LIST_OPEN)
// 返回: http://localhost:8080/papers/list_open
```

### openInNewTab(url)
在新标签页打开URL
```typescript
openInNewTab(getApiUrl(API_ENDPOINTS.ADMIN.EXPORT_TEACHER_DOCX))
```

### downloadFile(url, filename)
下载文件
```typescript
downloadFile(url, 'report.docx')
```

## 使用示例

### 1. 在组件中导入
```typescript
import { API_ENDPOINTS } from '@/config/api/api'
import { fetchWithAuth, getApiUrl } from '@/utils/request'
```

### 2. 发起请求
```typescript
// GET 请求
const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.PAPERS.LIST_OPEN))
const papers = response.data

// POST 请求
const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.EXAM.START), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  data: { paper_id: 'xxx', duration_sec: 600 }
})

// 带查询参数
const response = await fetchWithAuth(
  getApiUrl(`${API_ENDPOINTS.PAPERS.VIEW}?paper_id=${paperId}`)
)

// FormData 请求
const formData = new FormData()
formData.append('file', file)
const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.UPLOAD), {
  method: 'POST',
  body: formData
})
```

### 3. 打开新窗口
```typescript
openInNewTab(getApiUrl(API_ENDPOINTS.ADMIN.EXPORT_TEACHER_DOCX))
```

## 本地存储键名

统一定义在 `STORAGE_KEYS` 中：
- `TOKEN` - JWT令牌 (jwt_token)
- `CHAT_TOKEN` - 聊天令牌
- `SESSION_ID` - 会话ID
- `USER` - 用户信息

## 优势

1. **统一管理**：所有API端点集中在一个文件中
2. **类型安全**：TypeScript类型检查
3. **易于维护**：修改API只需更新一处
4. **自动认证**：fetchWithAuth自动添加JWT token
5. **错误处理**：统一的错误处理机制
6. **代码复用**：避免重复的请求代码

## 迁移说明

已完成以下组件的API集成：
- ✅ ExamView.vue
- ✅ AdminView.vue
- ✅ TestExplainView.vue

其他组件可以参考这些组件的实现方式进行迁移。
