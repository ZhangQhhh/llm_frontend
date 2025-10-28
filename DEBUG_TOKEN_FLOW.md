# Token 流程调试指南

## 问题现象
- 登录后调用 `getinfo` 接口返回 401 Unauthorized
- 错误信息：`GET http://localhost:3000/api/user/account/info/ net::ERR_FAILED 401`

## 完整流程梳理

### 1. 登录流程 (user.ts:116-142)
```
用户点击登录
  ↓
LoginView.vue:184 调用 store.dispatch('login', {...})
  ↓
user.ts:118 发送 POST /user/account/token/
  ↓
后端返回 XspaceResult<{token: string}>
  ↓
user.ts:128 localStorage.setItem("jwt_token", resp.data.token)
  ↓
user.ts:129 context.commit("updateToken", resp.data.token)
  ↓
user.ts:130 调用 success 回调
```

### 2. 获取用户信息流程 (user.ts:150-169)
```
LoginView.vue:190 调用 store.dispatch('getinfo', {...})
  ↓
user.ts:152 发送 GET /user/account/info/
  ↓
http.ts:14-25 请求拦截器自动添加 token
  ↓
http.ts:16 从 localStorage.getItem(STORAGE_KEYS.TOKEN) 读取
  ↓
⚠️ 问题可能在这里！
```

## 可能的问题点

### 问题 1：STORAGE_KEYS.TOKEN 的值不匹配
**检查点：**
- `api.ts:74` 定义：`TOKEN: 'jwt_token'`
- `user.ts:128` 保存：`localStorage.setItem("jwt_token", ...)`
- `http.ts:16` 读取：`localStorage.getItem(STORAGE_KEYS.TOKEN)`

**验证方法：**
在浏览器控制台执行：
```javascript
// 检查 localStorage 中的 token
console.log('jwt_token:', localStorage.getItem('jwt_token'));

// 检查所有 localStorage 内容
console.log('All localStorage:', {...localStorage});
```

### 问题 2：登录和获取信息之间的时序问题
登录成功后立即调用 `getinfo`，可能存在：
- localStorage 还未写入完成
- 浏览器缓存问题

### 问题 3：后端 token 格式要求
检查后端是否要求特定的 token 格式：
- 是否需要 `Bearer ` 前缀？
- token 是否有特殊字符需要编码？

### 问题 4：CORS 和请求被拦截
错误信息显示：
```
Access to XMLHttpRequest at 'http://localhost:3000/api/user/account/info/' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```
这可能导致请求根本没有发送到后端。

## 调试步骤

### 步骤 1：检查 token 是否正确保存
在 `user.ts:128` 之后添加 console.log：
```typescript
localStorage.setItem("jwt_token", resp.data.token);
console.log('✅ Token saved:', resp.data.token);
console.log('✅ Token from localStorage:', localStorage.getItem("jwt_token"));
```

### 步骤 2：检查拦截器是否正确读取
在 `http.ts:16` 添加 console.log：
```typescript
const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
console.log('🔍 STORAGE_KEYS.TOKEN:', STORAGE_KEYS.TOKEN);
console.log('🔍 Token from interceptor:', token);
if (token && config.headers) {
  config.headers.Authorization = `Bearer ${token}`;
  console.log('🔍 Authorization header:', config.headers.Authorization);
}
```

### 步骤 3：检查实际发送的请求
在浏览器 Network 面板：
1. 找到 `/user/account/info/` 请求
2. 查看 Request Headers
3. 确认是否有 `Authorization: Bearer <token>`

### 步骤 4：检查后端日志
查看后端是否收到了 Authorization header，以及 token 验证失败的原因。

## 推荐的修复方案

### 方案 1：统一使用 STORAGE_KEYS 常量
修改 `user.ts:128`：
```typescript
// 之前
localStorage.setItem("jwt_token", resp.data.token);

// 修改为
import { STORAGE_KEYS } from "@/config/api/api";
localStorage.setItem(STORAGE_KEYS.TOKEN, resp.data.token);
```

### 方案 2：添加延迟确保 localStorage 写入
在 `LoginView.vue:190` 调用 getinfo 前添加短暂延迟：
```typescript
success: () => {
  loginLoading.value = false;
  // 确保 localStorage 写入完成
  setTimeout(() => {
    store.dispatch('getinfo', {...});
  }, 100);
}
```

### 方案 3：解决 CORS 问题
在后端添加 CORS 配置，允许 `http://localhost:8080` 访问。

## 下一步行动
1. 先在浏览器控制台检查 localStorage
2. 添加 console.log 调试
3. 查看 Network 面板的实际请求
4. 根据结果选择对应的修复方案
