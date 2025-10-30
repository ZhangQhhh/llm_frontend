# Vue应用多轮对话用户切换测试指南

## 问题描述
当用户退出登录后，登录另外一个用户的账号时，多轮对话功能可能存在数据泄露问题，用户可能看到其他用户的对话记录。

## 问题根因
Vue应用使用两个不同的token系统：
1. `jwt_token` - 用于主要的HTTP请求
2. `multi_turn_chat_jwt` (CHAT_TOKEN) - 用于LLM服务的请求

用户切换时，如果CHAT_TOKEN没有正确更新，可能导致：
- LLM服务使用旧用户的token
- 会话数据没有正确隔离
- 用户看到其他人的对话记录

## 修复内容

### 1. 用户登录Token同步 (src/store/user.ts)
- **登录时**: 同步设置 `jwt_token` 和 `multi_turn_chat_jwt`
- **退出时**: 清除所有token和会话相关数据

### 2. 会话数据隔离 (src/views/ConversationView.vue)
- **组件初始化时**: 检测token不一致，清除旧会话数据
- **token同步**: 确保CHAT_TOKEN与当前用户token一致
- **会话操作**: 所有会话相关操作都确保使用当前用户的最新token

### 3. 会话操作Token同步修复
- **创建会话**: 创建新会话时同步当前token
- **加载会话列表**: 获取会话列表时使用最新token
- **选择会话**: 切换会话时验证token一致性
- **删除会话**: 删除操作使用当前用户token
- **清空会话**: 清空操作使用当前用户token
- **发送消息**: 消息发送时确保token同步

## 测试步骤

### 测试场景1: 用户切换基本测试
1. 打开Vue应用，使用用户A登录
2. 访问多轮对话页面 (`/conversation`)，发送一些消息创建会话
3. 点击右上角用户菜单，选择退出登录
4. 使用用户B登录
5. 再次访问多轮对话页面
6. **预期结果**: 
   - 应该看到全新的对话界面
   - 不能看到用户A的任何对话记录
   - 会话列表应该为空或只显示用户B的会话

### 测试场景2: Token一致性检查
1. 使用用户A登录
2. 在浏览器开发者工具Console中检查：
   ```javascript
   console.log('JWT Token:', localStorage.getItem('jwt_token'));
   console.log('Chat Token:', localStorage.getItem('multi_turn_chat_jwt'));
   console.log('Session ID:', localStorage.getItem('multi_turn_chat_session_id'));
   ```
3. 退出登录并使用用户B登录
4. 再次检查token，确认都已更新为用户B的token
5. **预期结果**: 所有token都应该更新为用户B的token

### 测试场景3: 直接访问会话测试
1. 使用用户A登录并创建会话，记录会话ID
2. 退出登录
3. 使用用户B登录
4. 尝试直接访问用户A的会话（如果有会话列表功能）
5. **预期结果**: 应该无法访问用户A的会话，或看到权限错误

## 验证检查点

### localStorage验证
在浏览器开发者工具Console中执行：
```javascript
// 检查token一致性
const jwtToken = localStorage.getItem('jwt_token');
const chatToken = localStorage.getItem('multi_turn_chat_jwt');
console.log('Token一致:', jwtToken === chatToken);

// 检查用户状态（通过Vuex store）
console.log('当前用户:', this.$store.state.user.username);
```

### 网络请求验证
1. 打开浏览器开发者工具的Network标签
2. 在多轮对话页面发送消息
3. 检查LLM API请求的Authorization header
4. **预期结果**: 应该使用当前用户的token

### 会话数据验证
1. 用户A登录后创建会话并发送消息
2. 用户B登录后检查会话列表
3. **预期结果**: 不应该看到用户A的会话

## 修复原理

### Token同步机制
- 登录时：`jwt_token` 和 `multi_turn_chat_jwt` 同时设置
- 退出时：两个token同时清除
- 运行时：检测token不一致，自动清除会话数据

### 会话隔离策略
- 基于JWT token进行用户身份验证
- 后端API根据token返回对应用户的会话数据
- 前端检测用户切换，清除本地会话缓存

### 安全保障
- 每次API请求都使用当前用户的token
- 用户切换时立即清除旧的会话数据
- 防止前端缓存导致的数据泄露

## 注意事项

1. **浏览器标签页**: 如果用户在多个标签页中切换登录，可能需要额外的同步机制
2. **网络异常**: token同步失败时的降级处理
3. **缓存清理**: 确保所有相关的本地存储都被正确清理
4. **性能影响**: 用户切换检测不应显著影响页面加载性能

## 回归测试

执行以下测试确保修复没有引入新问题：
1. 正常登录/退出流程 ✅
2. 多轮对话功能完整性 ✅
3. 会话创建和管理功能 ✅
4. 页面刷新后的状态保持 ✅
5. 网络请求的token验证 ✅

## 问题解决确认

经过以上修复，以下问题应该得到解决：
- ✅ 用户切换时 `multi_turn_chat_jwt` token正确更新
- ✅ 用户无法看到其他用户的对话记录
- ✅ 会话数据正确隔离
- ✅ 前端和后端token状态一致
