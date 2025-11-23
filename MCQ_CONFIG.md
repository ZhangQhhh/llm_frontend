# MCQ 模块配置说明

## 配置文件位置

### 1. API 配置文件
`src/config/api/api.ts`

```typescript
export const MCQ_BASE_URL = process.env.VUE_APP_MCQ_BASE_URL;
```

### 2. 环境变量配置

#### 开发环境 (`.env.development`)
```env
VUE_APP_MCQ_BASE_URL=http://localhost:5000/mcq_public
```

#### 生产环境 (`.env.production`)
```env
VUE_APP_MCQ_BASE_URL=/llm/mcq_public
```

## ExamView.vue 使用方式

```typescript
import { MCQ_BASE_URL } from '@/config/api/api'

// 构建 API 端点
const API_ENDPOINTS = {
  PAPERS: {
    LIST_OPEN: `${MCQ_BASE_URL}/papers/list_open`,
    VIEW: `${MCQ_BASE_URL}/papers/view`
  },
  EXAM: {
    START: `${MCQ_BASE_URL}/exam/start`,
    SUBMIT: `${MCQ_BASE_URL}/exam/submit`,
    REVIEW: `${MCQ_BASE_URL}/exam/review`
  },
  STUDENT: {
    EXPORT_MY_REPORT_DOCX: `${MCQ_BASE_URL}/student/export_my_report_docx`
  }
}
```

## 修改配置

### 开发环境修改
1. 编辑 `.env.development` 文件
2. 修改 `VUE_APP_MCQ_BASE_URL` 的值
3. 重启开发服务器

### 生产环境修改
1. 编辑 `.env.production` 文件
2. 修改 `VUE_APP_MCQ_BASE_URL` 的值
3. 重新构建项目：`npm run build`

## 注意事项

1. **环境变量前缀**：所有 Vue 环境变量必须以 `VUE_APP_` 开头
2. **重启服务**：修改 `.env` 文件后需要重启开发服务器
3. **构建时注入**：环境变量在构建时注入，运行时无法修改
4. **Nginx 代理**：生产环境使用相对路径，通过 Nginx 代理到后端服务

## 当前配置

- **开发环境**：直连后端 `http://localhost:5000/mcq_public`
- **生产环境**：通过 Nginx 代理 `/llm/mcq_public` → 后端服务
