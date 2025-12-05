# LLM Frontend - 智能问答系统前端

> 基于 Vue 3 + TypeScript + Element Plus 构建的智能问答系统前端应用，集成知识问答、多轮对话、题库管理、考试系统等功能模块。

---

## 📋 项目概述

本项目是一个功能完整的智能问答系统前端，主要服务于公安出入境管理场景，提供：

- 🔍 **智能知识问答** - 基于大语言模型的专业知识问答
- 💬 **多轮对话管理** - 支持会话上下文的连续对话
- 📝 **题库管理系统** - MCQ 题目的上传、解析、审核和管理
- 📊 **在线考试系统** - 试卷生成、考试执行、成绩分析
- 📈 **数据分析报告** - Excel 数据的智能分析和报告生成
- 📋 **问答日志管理** - 完整的用户问答记录追踪
- 👥 **权限管理系统** - 多级用户权限控制

---

## 🚀 技术栈

### 核心框架
- **Vue 3.4+** - 渐进式 JavaScript 框架
- **TypeScript 5.0+** - JavaScript 的超集，提供静态类型检查
- **Vite 5.0+** - 现代化的前端构建工具

### UI 组件库
- **Element Plus 2.4+** - 基于 Vue 3 的企业级 UI 组件库
- **@element-plus/icons-vue** - Element Plus 图标库

### 状态管理
- **Vuex 4.0+** - Vue.js 的状态管理模式库

### 路由管理
- **Vue Router 4.0+** - Vue.js 的官方路由管理器

### HTTP 客户端
- **Axios 1.6+** - 基于 Promise 的 HTTP 客户端

### 开发工具
- **ESLint** - 代码质量检查工具
- **Prettier** - 代码格式化工具
- **Sass/SCSS** - CSS 预处理器

---

## 📁 项目结构

```
llm_frontend/
├── public/                     # 静态资源
│   ├── favicon.ico
│   └── index.html
├── src/                        # 源代码
│   ├── assets/                 # 资源文件
│   │   └── allPic/            # 图片资源
│   ├── components/            # 公共组件
│   │   ├── AppFooter.vue      # 页脚组件
│   │   ├── AppHeader.vue      # 头部组件
│   │   ├── AppSidebar.vue     # 侧边栏组件
│   │   └── ChatInterface.vue  # 聊天界面组件
│   ├── config/                # 配置文件
│   │   └── api/               # API 配置
│   │       ├── api.ts         # API 端点定义
│   │       ├── http.ts        # 主后端 HTTP 客户端
│   │       ├── llmHttp.ts     # LLM 服务 HTTP 客户端
│   │       └── mcqHttp.ts     # MCQ 服务 HTTP 客户端
│   ├── router/                # 路由配置
│   │   └── index.ts
│   ├── store/                 # Vuex 状态管理
│   │   ├── index.ts
│   │   └── user.ts            # 用户状态模块
│   ├── utils/                 # 工具函数
│   │   ├── chatApi.ts         # 聊天相关 API
│   │   ├── markdown.ts        # Markdown 渲染
│   │   ├── permissions.ts     # 权限管理
│   │   └── request.ts         # HTTP 请求工具
│   ├── views/                 # 页面组件
│   │   ├── AdminView.vue              # 管理员页面
│   │   ├── ConversationView.vue       # 多轮对话页面
│   │   ├── DataAnalysisView.vue       # 数据分析页面
│   │   ├── ExamView.vue               # 考试页面
│   │   ├── FeedbackListView.vue       # 反馈列表页面
│   │   ├── HomeView.vue               # 首页
│   │   ├── Immigration12367View.vue   # 12367 问答页面
│   │   ├── LoginView.vue              # 登录页面
│   │   ├── ProfileView.vue            # 个人资料页面
│   │   ├── QALogsView.vue             # 问答日志页面
│   │   ├── ReportGeneratorView.vue    # 报告生成页面
│   │   ├── SuperAdminView.vue         # 超级管理员页面
│   │   └── WelcomeView.vue            # 欢迎页面
│   ├── App.vue                # 根组件
│   ├── main.ts                # 应用入口
│   └── shims-vue.d.ts         # Vue 类型声明
├── .env                        # 环境变量
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── .eslintrc.js               # ESLint 配置
├── .gitignore                 # Git 忽略文件
├── index.html                 # HTML 模板
├── package.json               # 项目依赖
├── README.md                  # 项目文档
├── tsconfig.json              # TypeScript 配置
└── vite.config.ts             # Vite 配置
```

---

## 🛠️ 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 或 **yarn** >= 1.22.0
- **Git** >= 2.30.0

---

## 📦 安装与运行

### 1. 克隆项目

```bash
git clone <repository-url>
cd llm_frontend
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 环境配置

复制环境变量模板并根据实际环境修改：

```bash
cp .env.example .env
```

**环境变量说明：**

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VUE_APP_API_BASE_URL` | 主后端 API 地址 | `/api` |
| `VUE_APP_LLM_BASE_URL` | LLM 服务地址 | `/llm` |
| `VUE_APP_MCQ_BASE_URL` | MCQ 题库服务地址 | `/mcq_public` |
| `VUE_APP_WRITER_URL` | 写作服务地址 | 同 LLM_BASE_URL |
| `VUE_APP_OCR_BASE_URL` | OCR 服务地址 | `http://localhost:9000` |
| `VUE_APP_SHOW_HIDDEN_NODES` | 是否显示隐藏节点 | `false` |

### 4. 开发模式运行

```bash
# 使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

应用将在 `http://localhost:5173` 启动（开发环境）。

### 5. 生产环境构建

```bash
# 使用 npm
npm run build

# 或使用 yarn
yarn build
```

构建产物将输出到 `dist/` 目录。

### 6. 预览生产构建

```bash
# 使用 npm
npm run preview

# 或使用 yarn
yarn preview
```

---

## 🔧 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码质量控制：

```bash
# 检查代码规范
npm run lint

# 自动修复代码格式
npm run lint:fix
```

### API 接口管理

所有 API 接口定义在 `src/config/api/api.ts` 中，按模块分组：

```typescript
export const API_ENDPOINTS = {
  USER: {
    LOGIN: `/user/account/token/`,
    REGISTER: `/user/account/register/`,
    INFO: `/user/account/info/`
  },
  // ... 其他模块
}
```

### HTTP 客户端配置

项目使用三个独立的 Axios 实例：

- **http** - 主后端服务（30s 超时）
- **llmHttp** - LLM 服务（90s 超时，支持流式响应）
- **mcqHttp** - MCQ 题库服务（60s 超时）

### 状态管理

使用 Vuex 进行状态管理，主要模块：

- **user** - 用户信息、登录状态、权限管理

### 权限控制

基于角色的权限控制（RBAC）：

- **普通用户** - 基础问答功能
- **管理员** - 用户管理、题库管理
- **超级管理员** - 管理员管理、系统配置

权限检查工具：`src/utils/permissions.ts`

### 组件开发规范

1. **命名规范**：使用 PascalCase 命名组件文件
2. **Props 定义**：必须定义 TypeScript 接口
3. **事件命名**：使用 kebab-case
4. **样式作用域**：使用 `scoped` CSS

---

## 📱 功能模块详解

### 1. 智能问答系统

**特性：**
- 支持单轮和多轮对话
- 实时流式响应（SSE）
- 参考文献展示
- 思考过程可视化
- 关键词和子问题提取

**技术实现：**
- Server-Sent Events (SSE) 实现流式响应
- Markdown 渲染支持
- 会话上下文管理

### 2. 题库管理系统

**特性：**
- 支持 Word/TXT 文件批量导入
- AI 智能生成题目解析
- 多级审核流程
- 题目版本管理
- 批量操作支持

**文件格式：**
- 题目导入：`.docx`、`.txt`
- 导出格式：`.docx`

### 3. 在线考试系统

**特性：**
- 试卷自动生成
- 倒计时功能
- 实时答案保存
- 自动评分
- 成绩报告导出

### 4. 数据分析系统

**特性：**
- Excel 文件上传解析
- 往年/今年数据对比
- 智能分析报告生成
- Word 文档自动下载

### 5. 日志管理系统

**特性：**
- 完整的问答记录
- 多维度筛选（日期、用户、类型）
- 日志详情查看
- 统计分析功能

---

## 🎨 UI/UX 设计

### 设计原则

1. **一致性** - 统一的设计语言和交互模式
2. **响应式** - 适配不同屏幕尺寸
3. **可访问性** - 支持键盘导航和屏幕阅读器
4. **性能优化** - 流畅的动画和过渡效果

### 主题定制

使用 Element Plus 主题系统，支持：

- 自定义主色调
- 暗色/亮色模式切换
- 组件样式覆盖

### 响应式设计

- **桌面端**：>= 1200px
- **平板端**：768px - 1199px
- **移动端**：< 768px

---

## 🔒 安全考虑

### 前端安全措施

1. **XSS 防护**：
   - 使用 `v-html` 时进行内容过滤
   - Markdown 渲染时的安全处理

2. **CSRF 防护**：
   - Axios 请求拦截器自动添加 CSRF Token

3. **敏感信息保护**：
   - Token 存储在 localStorage
   - 自动 Token 刷新机制

4. **权限验证**：
   - 路由守卫进行页面级权限控制
   - 组件级权限检查

---

## 📊 性能优化

### 构建优化

- **代码分割**：路由级别的懒加载
- **Tree Shaking**：移除未使用的代码
- **资源压缩**：Gzip 压缩
- **缓存策略**：静态资源长期缓存

### 运行时优化

- **虚拟滚动**：大数据列表优化
- **图片懒加载**：按需加载图片资源
- **防抖节流**：搜索和输入优化
- **组件缓存**：`keep-alive` 缓存组件状态

---

## 🧪 测试策略

### 测试类型

1. **单元测试**：组件和工具函数测试
2. **集成测试**：API 接口和业务流程测试
3. **端到端测试**：完整用户场景测试

### 测试工具

- **Vitest** - 单元测试框架
- **Vue Test Utils** - Vue 组件测试工具
- **Cypress** - 端到端测试框架

---

## 📦 部署指南

### Docker 部署

```dockerfile
# 构建镜像
docker build -t llm-frontend .

# 运行容器
docker run -p 80:80 llm-frontend
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 环境变量配置

不同环境的配置文件：

- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.staging` - 测试环境

---

## 📈 监控与维护

### 错误监控

- **Sentry** - 错误追踪和性能监控
- **自定义日志** - 用户行为日志记录

### 性能监控

- **Web Vitals** - 核心性能指标
- **Lighthouse** - 性能评分
- **Bundle Analysis** - 打包体积分析

---

## 🤝 贡献指南

### 开发流程

1. Fork 项目到个人仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交代码：`git commit -m 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

### 代码提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具或辅助工具的变动
```

---

## 📝 更新日志

### v1.0.0 (2024-12)

#### 🎉 新功能
- ✨ 完整的智能问答系统
- ✨ 多轮对话管理功能
- ✨ 题库管理系统
- ✨ 在线考试系统
- ✨ 数据分析报告生成
- ✨ 问答日志管理
- ✨ 多级权限管理系统

#### 🔧 技术特性
- ⚡ Vue 3 + TypeScript + Vite 技术栈
- 🎨 Element Plus UI 组件库
- 📱 完全响应式设计
- 🔒 完善的安全机制
- 📊 性能优化措施

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- **项目维护者**：zqsee
- **邮箱**：zq@zqsee.com
- **问题反馈**：[GitHub Issues](https://github.com/your-repo/issues)

---

## 🙏 致谢

感谢以下开源项目和贡献者：

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 UI 组件库
- [Vite](https://vitejs.dev/) - 现代化构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 超集

---

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**
