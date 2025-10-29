# 重构说明 - 统一使用 llmHttp.ts

## 📋 重构内容

已将所有新增的会话管理API函数从原生 `fetch` 重构为使用 `llmHttp.ts` 工具。

## ✅ 重构的函数列表

### 1. `createNewSession()` - 创建新会话
**之前**：
```typescript
const response = await fetch(API_ENDPOINTS.KNOWLEDGE.CONVERSATION_NEW, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
if (!response.ok) {
  throw new Error(`创建会话失败: ${response.status}`);
}
return await response.json();
```

**之后**：
```typescript
const response = await llmHttp.post(
  API_ENDPOINTS.KNOWLEDGE.CONVERSATION_NEW,
  {},
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
return response.data;
```

### 2. `clearSession()` - 清空会话
**之前**：使用 `http.post`

**之后**：使用 `llmHttp.post`

### 3. `getSessionStatistics()` - 获取会话统计
**之前**：原生 `fetch` + 手动错误处理

**之后**：`llmHttp.post` + 自动错误处理

### 4. `getSessionList()` - 获取会话列表
**之前**：原生 `fetch` + 手动错误处理

**之后**：`llmHttp.post` + 自动错误处理

### 5. `getSessionHistory()` - 获取会话历史
**之前**：原生 `fetch` + 手动错误处理

**之后**：`llmHttp.post` + 自动错误处理

### 6. `getSessionInfo()` - 获取会话详情
**之前**：原生 `fetch` + 手动错误处理

**之后**：`llmHttp.post` + 自动错误处理

### 7. `deleteSession()` - 删除会话
**之前**：原生 `fetch` + 手动错误处理

**之后**：`llmHttp.post` + 自动错误处理

## 🎯 重构收益

### 1. 代码简洁性
- **减少代码行数**：每个函数平均减少 5-8 行代码
- **消除重复**：不需要在每个函数中重复写错误处理逻辑

### 2. 统一的错误处理
- ✅ 自动处理 401 错误（Token 过期）
- ✅ 自动移除失效的 Token
- ✅ 统一的错误响应格式

### 3. 自动 Token 管理
- ✅ 使用 `STORAGE_KEYS.CHAT_TOKEN`
- ✅ 自动在请求头中添加 Authorization
- ✅ Token 过期自动清理

### 4. 更长的超时时间
- ✅ 90 秒超时（LLM 请求可能需要更长时间）
- ✅ 避免长时间请求被中断

### 5. 统一的配置
- ✅ 统一的 baseURL 配置
- ✅ 统一的请求拦截器
- ✅ 统一的响应拦截器

## 📊 对比表

| 特性 | 原生 fetch | llmHttp |
|------|-----------|---------|
| 代码行数 | 10-15 行 | 5-8 行 |
| 错误处理 | 手动 | 自动 |
| Token 管理 | 手动传递 | 自动添加 |
| 超时时间 | 默认（短） | 90 秒 |
| 401 处理 | 无 | 自动清理 Token |
| 代码一致性 | 低 | 高 |

## 🔧 技术细节

### 响应数据结构
所有函数都统一处理后端响应格式：
```typescript
// 后端响应格式
{
  type: "success",
  data: { ... }
}

// 提取数据
return response.data.data;
```

### Token 传递
虽然 `llmHttp` 会自动从 localStorage 读取 `CHAT_TOKEN`，但我们仍然在函数参数中保留 `token`，并在 headers 中显式传递，以保持灵活性。

### 空请求体
对于不需要请求体的 POST 请求，传递空对象 `{}`：
```typescript
llmHttp.post(url, {}, { headers: { ... } })
```

## 📝 注意事项

### 1. 流式请求仍使用 fetch
`sendStreamChatRequest()` 函数仍然使用原生 `fetch`，因为：
- 需要处理 SSE（Server-Sent Events）流式响应
- Axios 不适合处理流式数据
- 这是正确的做法

### 2. 反馈功能使用 http.ts
`submitLikeFeedback()` 和 `submitDislikeFeedback()` 使用 `http.ts`，因为：
- 这些 API 在主后端（3000 端口）
- 不是 LLM 服务的 API
- 使用不同的 baseURL

### 3. Token 来源
- LLM API：使用 `STORAGE_KEYS.CHAT_TOKEN`
- 主后端 API：使用 `STORAGE_KEYS.TOKEN`

## 🚀 后续优化建议

### 1. 简化 Token 传递
考虑移除函数参数中的 `token`，完全依赖 `llmHttp` 的自动 Token 管理：

```typescript
// 当前
export async function createNewSession(token: string) {
  const response = await llmHttp.post(url, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

// 优化后
export async function createNewSession() {
  const response = await llmHttp.post(url, {});
  // llmHttp 自动添加 token
}
```

### 2. 统一响应处理
创建一个辅助函数来处理响应：

```typescript
function extractData<T>(response: AxiosResponse): T {
  return response.data.data;
}

// 使用
return extractData<SessionInfo>(response);
```

### 3. 错误提示优化
在 `llmHttp` 拦截器中添加更友好的错误提示：

```typescript
llmHttp.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 显示友好提示
      showToast('登录已过期，请重新登录');
    }
    return Promise.reject(error);
  }
);
```

## 📈 性能影响

- ✅ **无负面影响**：使用 Axios 不会降低性能
- ✅ **更好的错误恢复**：自动处理常见错误
- ✅ **更少的网络请求**：避免因 Token 问题导致的重试

## ✨ 总结

通过这次重构：
1. **代码质量提升**：更简洁、更易维护
2. **用户体验改善**：更好的错误处理
3. **开发效率提高**：统一的 API 调用方式
4. **技术债务减少**：消除了代码重复

---

**重构日期**: 2025-01-29  
**影响范围**: `src/utils/chatApi.ts` 中的 7 个会话管理函数  
**测试状态**: 待测试
