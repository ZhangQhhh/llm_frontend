# Vue DevServer 代理配置指南

## 📋 概述

使用 Vue DevServer 的代理功能，通过相对路径访问后端服务，避免跨域问题。

## 🎯 配置方案

### **环境变量配置** (`.env.vm`)

```bash
# 使用相对路径，通过 Vue devServer proxy 转发
VUE_APP_API_BASE_URL=/api
VUE_APP_LLM_BASE_URL=/llm/api
VUE_APP_MCQ_BASE_URL=/llm/mcq_public
VUE_APP_WRITER_URL=/llm/api
VUE_APP_WS_URL=/ws/session
VUE_APP_OCR_BASE_URL=http://192.168.174.1:9000
```

### **代理配置** (`vue.config.js`)

```javascript
devServer: {
  host: '0.0.0.0',       
  port: 8080,
  allowedHosts: 'all',
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true
    },
    '/llm': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true
    },
    '/ws': {
      target: 'ws://127.0.0.1:3000',
      ws: true,
      changeOrigin: true
    }
  }
}
```

## 🔄 请求转发流程

```
前端请求: /api/user/info
    ↓
Vue DevServer 检测到 /api 前缀
    ↓
转发到: http://127.0.0.1:3000/api/user/info
    ↓
后端处理并返回响应
    ↓
Vue DevServer 返回给前端
```

## 🌐 端口映射

| 前端路径 | 目标服务 | 目标地址 |
|---------|---------|---------|
| `/api/*` | 主 API 服务 | `http://127.0.0.1:3000` |
| `/llm/*` | LLM 服务 | `http://127.0.0.1:5000` |
| `/ws/*` | WebSocket | `ws://127.0.0.1:3000` |
| OCR | OCR 服务 | `http://192.168.174.1:9000` |

## 🚀 使用方法

### **1. 启动开发服务器**
```bash
npm run serve:vm
```

### **2. 访问应用**
```
http://192.168.174.1:8080
```

### **3. API 请求示例**
```javascript
// 前端代码
axios.get('/api/user/info')  // 实际请求: http://127.0.0.1:3000/api/user/info
axios.post('/llm/chat', data)  // 实际请求: http://127.0.0.1:5000/llm/chat
```

## 🔧 配置说明

### **代理选项**

#### **changeOrigin: true**
- 修改请求头中的 `Origin` 字段
- 避免跨域问题

#### **ws: true** (仅 WebSocket)
- 启用 WebSocket 代理支持
- 用于实时通信功能

### **路径匹配规则**

#### **精确匹配**
```javascript
'/api': {
  target: 'http://127.0.0.1:3000'
}
// 匹配: /api/user/info
// 不匹配: /api2/user/info
```

#### **通配符匹配**
```javascript
'^/api': {
  target: 'http://127.0.0.1:3000'
}
// 匹配: /api/user/info, /api2/user/info
```

## 🐛 常见问题

### **1. 代理不生效**

**问题**: 请求仍然指向本地开发服务器

**解决方案**:
- 重启开发服务器
- 检查环境变量是否正确加载
- 确认代理配置语法正确

### **2. WebSocket 连接失败**

**问题**: `WebSocket connection failed`

**解决方案**:
```javascript
'/ws': {
  target: 'ws://127.0.0.1:3000',
  ws: true,              // ✅ 必须设置
  changeOrigin: true
}
```

### **3. 后端服务无法访问**

**问题**: `ECONNREFUSED` 错误

**解决方案**:
- 检查后端服务是否启动
- 确认端口号是否正确
- 检查防火墙设置

### **4. 跨域问题**

**问题**: `CORS` 错误

**解决方案**:
```javascript
'/api': {
  target: 'http://127.0.0.1:3000',
  changeOrigin: true,    // ✅ 必须设置
  secure: false          // 如果是 HTTPS
}
```

## 📊 调试技巧

### **1. 查看代理日志**
```bash
# 启动时查看代理配置
npm run serve:vm

# 输出示例:
# [HPM] Proxy created: /api  -> http://127.0.0.1:3000
# [HPM] Proxy created: /llm  -> http://127.0.0.1:5000
```

### **2. 浏览器网络面板**
- 打开开发者工具
- 查看 Network 面板
- 确认请求 URL 是否正确转发

### **3. 代理配置验证**
```javascript
// 在 vue.config.js 中添加日志
devServer: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      logLevel: 'debug'  // 显示详细日志
    }
  }
}
```

## 🎯 优势

### **✅ 避免跨域**
- 所有请求都通过开发服务器转发
- 浏览器认为请求来自同一源

### **✅ 灵活配置**
- 可以针对不同路径配置不同目标
- 支持多种协议 (HTTP/HTTPS/WebSocket)

### **✅ 开发便利**
- 无需修改后端 CORS 配置
- 支持热重载和调试

### **✅ 环境隔离**
- 不同环境使用不同配置
- 避免硬编码 IP 地址

## 🔄 环境对比

| 配置项 | 开发环境 | 虚拟机环境 | 生产环境 |
|--------|---------|-----------|---------|
| API_BASE_URL | `http://localhost:3000/api` | `/api` | `/api` |
| 代理 | 不需要 | Vue DevServer | Nginx/Apache |
| 跨域处理 | CORS | 代理 | 代理 |

## 📝 最佳实践

### **1. 环境变量命名**
```bash
# ✅ 好的命名
VUE_APP_API_BASE_URL=/api
VUE_APP_LLM_BASE_URL=/llm/api

# ❌ 避免硬编码
VUE_APP_API_BASE_URL=http://127.0.0.1:3000/api
```

### **2. 代理配置顺序**
```javascript
proxy: {
  // 具体路径放在前面
  '/ws': { target: 'ws://127.0.0.1:3000', ws: true },
  // 通用路径放在后面
  '/api': { target: 'http://127.0.0.1:3000' },
  '/llm': { target: 'http://127.0.0.1:5000' }
}
```

### **3. 错误处理**
```javascript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error('代理错误:', err);
    }
  }
}
```

---

**注意**: 这种配置仅适用于开发环境，生产环境需要使用 Nginx 或其他反向代理。
