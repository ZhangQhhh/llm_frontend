# 虚拟机环境配置指南

## 📋 概述

为虚拟机环境创建了专用的配置文件 `.env.vm`，解决在虚拟机中无法连接后端 API 的问题。

## 🚀 使用方法

### **1. 启动虚拟机环境**

```bash
# 开发模式 - 虚拟机环境
npm run serve:vm

# 生产构建 - 虚拟机环境  
npm run build:vm
```

### **2. 配置说明**

#### **环境变量文件**: `.env.vm`

```bash
# 虚拟机环境配置
VUE_APP_API_BASE_URL=http://192.168.174.1:3000/api
VUE_APP_LLM_BASE_URL=http://192.168.174.1:5000/api
VUE_APP_MCQ_BASE_URL=http://192.168.174.1:5000/mcq_public
VUE_APP_WRITER_URL=http://192.168.174.1:5000/api
VUE_APP_WS_URL=ws://192.168.174.1:3000/ws/session
VUE_APP_OCR_BASE_URL=http://192.168.174.1:9000
```

## 🔧 配置调整

### **如果后端服务在其他 IP**

修改 `.env.vm` 文件中的 IP 地址：

```bash
# 假设后端在 192.168.174.100
VUE_APP_API_BASE_URL=http://192.168.174.100:3000/api
VUE_APP_LLM_BASE_URL=http://192.168.174.100:5000/api
VUE_APP_WS_URL=ws://192.168.174.100:3000/ws/session
```

### **如果端口不同**

根据实际端口调整：

```bash
# 假设 API 服务在 8080 端口
VUE_APP_API_BASE_URL=http://192.168.174.1:8080/api

# 假设 LLM 服务在 6000 端口
VUE_APP_LLM_BASE_URL=http://192.168.174.1:6000/api
```

## 🌐 网络配置检查

### **1. 确认后端服务地址**

```bash
# 在虚拟机中检查服务是否运行
curl http://192.168.174.1:3000/api/health
curl http://192.168.174.1:5000/api/health
```

### **2. 检查防火墙**

```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 3000
sudo ufw allow 5000

# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=5000/tcp --permanent
sudo firewall-cmd --reload
```

### **3. 检查服务监听地址**

确保后端服务监听 `0.0.0.0` 而不是 `127.0.0.1`：

```bash
# 检查端口监听状态
netstat -tlnp | grep :3000
netstat -tlnp | grep :5000

# 应该显示类似：
# tcp 0 0 0.0.0.0:3000  LISTEN 12345/node
# 而不是：
# tcp 0 0 127.0.0.1:3000  LISTEN 12345/node
```

## 🐛 常见问题

### **1. 连接被拒绝**

**问题**: `net::ERR_CONNECTION_REFUSED`

**解决方案**:
- 检查后端服务是否启动
- 检查防火墙设置
- 确认 IP 地址和端口正确

### **2. 跨域问题**

**问题**: `Access-Control-Allow-Origin`

**解决方案**:
在后端服务中添加 CORS 配置：

```javascript
// Express.js 示例
app.use(cors({
  origin: ['http://192.168.174.1:8080', 'http://localhost:8080'],
  credentials: true
}));
```

### **3. WebSocket 连接失败**

**问题**: `WebSocket connection failed`

**解决方案**:
- 检查 WebSocket 服务是否启动
- 确认 `ws://` 协议和端口正确
- 检查防火墙是否允许 WebSocket 连接

## 🔄 环境切换

### **开发环境 vs 虚拟机环境**

```bash
# 本地开发环境
npm run serve          # 使用 .env.development

# 虚拟机环境
npm run serve:vm       # 使用 .env.vm
```

### **环境变量优先级**

Vue CLI 环境变量加载顺序：
1. `.env` - 基础配置
2. `.env.local` - 本地覆盖
3. `.env.[mode]` - 模式特定 (如 `.env.vm`)
4. `.env.[mode].local` - 模式特定本地覆盖

## 📝 配置模板

### **完整的 .env.vm 模板**

```bash
# ===== 基础配置 =====
NODE_ENV=development

# ===== API 服务配置 =====
# 主 API 服务 (用户认证、基础功能)
VUE_APP_API_BASE_URL=http://192.168.174.1:3000/api

# LLM 服务 (AI 对话、知识问答)
VUE_APP_LLM_BASE_URL=http://192.168.174.1:5000/api

# MCQ 服务 (选择题功能)
VUE_APP_MCQ_BASE_URL=http://192.168.174.1:5000/mcq_public

# 写作服务
VUE_APP_WRITER_URL=http://192.168.174.1:5000/api

# ===== WebSocket 配置 =====
VUE_APP_WS_URL=ws://192.168.174.1:3000/ws/session

# ===== 第三方服务 =====
# OCR 服务
VUE_APP_OCR_BASE_URL=http://192.168.174.1:9000

# ===== 功能开关 =====
# 是否显示隐藏节点
VUE_APP_SHOW_HIDDEN_NODES=false

# ===== 调试配置 =====
# 性能监控 (可选)
VUE_APP_ENABLE_PERF_MONITOR=false

# 日志级别 (可选)
VUE_APP_LOG_LEVEL=info
```

## 🎯 快速开始

### **1. 创建配置文件**
```bash
# 已创建 .env.vm 文件
```

### **2. 修改 IP 地址**
```bash
# 根据实际后端服务 IP 修改 .env.vm
```

### **3. 启动项目**
```bash
npm run serve:vm
```

### **4. 访问应用**
```
http://192.168.174.1:8080
```

## 📞 技术支持

如果遇到问题，请检查：
1. 后端服务是否正常运行
2. 网络连接是否通畅
3. 防火墙配置是否正确
4. IP 地址和端口是否准确

---

**注意**: 虚拟机环境的 IP 地址可能变化，请根据实际情况调整配置。
