# 日志系统使用指南

## 📋 概述

新的日志系统支持在生产环境动态开启/关闭调试日志，提供灵活的日志级别和模块控制。

## 🚀 快速开始

### 1. 在组件中使用日志

```typescript
import { createModuleLogger, LogModules } from '@/utils/logger';

// 创建模块日志
const log = createModuleLogger(LogModules.DEPARTMENT);

// 使用日志
log.debug('开始检查部门');
log.info('用户已设置部门:', department);
log.warn('内存使用较高:', memoryUsage);
log.error('获取用户部门信息失败:', error);
```

### 2. 在性能设置中控制

1. 点击导航栏 **"性能设置"**
2. 开启 **"启用调试日志"**
3. 无需刷新，立即生效！

### 3. 通过控制台控制

```javascript
// 导入日志系统
import { logger, LogLevel } from '@/utils/logger';

// 设置日志级别
logger.setLevel(LogLevel.DEBUG);  // 显示所有日志
logger.setLevel(LogLevel.INFO);   // 显示 INFO 及以上
logger.setLevel(LogLevel.WARN);   // 只显示警告和错误
logger.setLevel(LogLevel.ERROR);  // 只显示错误
logger.setLevel(LogLevel.NONE);   // 禁用所有日志

// 启用/禁用特定模块
logger.enableModule('DepartmentDialog');
logger.disableModule('ThreeBackground');

// 启用/禁用所有模块
logger.enableAll();
logger.disableAll();

// 查看当前配置
logger.printConfig();
```

## 📊 日志级别

| 级别 | 值 | 说明 | 使用场景 |
|------|---|------|---------|
| DEBUG | 0 | 调试信息 | 开发环境、问题排查 |
| INFO | 1 | 一般信息 | 重要操作记录 |
| WARN | 2 | 警告信息 | 潜在问题提示 |
| ERROR | 3 | 错误信息 | 错误和异常 |
| NONE | 4 | 禁用日志 | 生产环境优化 |

## 🎯 预定义模块

```typescript
export const LogModules = {
  STREAM: 'Stream',              // 流式输出
  PERFORMANCE: 'Performance',    // 性能监控
  DEPARTMENT: 'DepartmentDialog',// 部门对话框
  THREE_BG: 'ThreeBackground',   // 3D背景
  CHAT_API: 'ChatAPI',          // 聊天API
  USER: 'User',                 // 用户模块
  AUTH: 'Auth',                 // 认证模块
  ROUTER: 'Router',             // 路由模块
  STORE: 'Store',               // 状态管理
};
```

## 💡 最佳实践

### 1. 替换现有的 console.log

**旧代码**：
```typescript
console.log('[DepartmentDialog] 开始检查部门');
console.log('[DepartmentDialog] hasChecked:', hasChecked.value);
```

**新代码**：
```typescript
import { createModuleLogger, LogModules } from '@/utils/logger';
const log = createModuleLogger(LogModules.DEPARTMENT);

log.debug('开始检查部门');
log.debug('hasChecked:', hasChecked.value);
```

### 2. 使用合适的日志级别

```typescript
// ✅ 正确使用
log.debug('详细的调试信息', data);        // 调试信息
log.info('用户登录成功', username);       // 重要操作
log.warn('内存使用较高', memoryUsage);    // 警告
log.error('API请求失败', error);          // 错误

// ❌ 错误使用
log.error('开始处理数据');  // 应该用 debug
log.debug('系统崩溃');      // 应该用 error
```

### 3. 提供有意义的上下文

```typescript
// ✅ 好的日志
log.debug('用户已设置部门，跳过部门检查:', store.state.user.department);
log.error('获取用户部门信息失败:', { error, userId, timestamp });

// ❌ 不好的日志
log.debug('跳过');
log.error('失败');
```

## 🔧 生产环境配置

### 默认配置

- **开发环境**: DEBUG 级别，所有模块启用
- **生产环境**: WARN 级别，所有模块启用

### 动态调整

生产环境可以通过以下方式动态开启调试：

#### 方式一：性能设置界面
1. 登录系统
2. 点击用户头像 → 性能设置
3. 开启"启用调试日志"
4. 立即生效，无需刷新

#### 方式二：浏览器控制台
```javascript
// 临时开启调试（刷新后失效）
localStorage.setItem('enable-debug-logs', 'true');
location.reload();

// 永久开启调试
localStorage.setItem('log-level', '0');  // DEBUG
localStorage.setItem('log-enabled-modules', '["*"]');
```

#### 方式三：URL 参数（待实现）
```
https://your-domain.com?debug=true
```

## 📈 日志格式

```
[时间] [级别] [模块] 消息内容
```

示例：
```
[14:30:25] [DEBUG] [DepartmentDialog] 开始检查部门
[14:30:25] [INFO] [User] 用户登录成功: zhangsan
[14:30:26] [WARN] [Performance] 内存使用较高: 235.98MB
[14:30:27] [ERROR] [ChatAPI] API请求失败: Network Error
```

## 🎨 颜色标识

- **DEBUG**: 普通文本（console.log）
- **INFO**: 蓝色（console.info）
- **WARN**: 黄色（console.warn）
- **ERROR**: 红色（console.error）

## 🔍 故障排除

### 问题：日志没有显示

**解决方案**：
1. 检查日志级别：`logger.getLevel()`
2. 检查模块是否启用：`logger.isModuleEnabled('YourModule')`
3. 检查浏览器控制台过滤器
4. 确认已开启"启用调试日志"

### 问题：日志太多

**解决方案**：
1. 提高日志级别：`logger.setLevel(LogLevel.WARN)`
2. 禁用特定模块：`logger.disableModule('ThreeBackground')`
3. 关闭"启用调试日志"

### 问题：生产环境看不到日志

**解决方案**：
1. 打开性能设置
2. 开启"启用调试日志"
3. 或在控制台执行：`localStorage.setItem('enable-debug-logs', 'true')`

## 📝 迁移指南

### 步骤1：导入日志系统

```typescript
import { createModuleLogger, LogModules } from '@/utils/logger';
```

### 步骤2：创建模块日志

```typescript
// 在 setup() 或组件外部
const log = createModuleLogger(LogModules.YOUR_MODULE);
```

### 步骤3：替换 console 调用

```typescript
// 查找并替换
console.log('[YourModule]', ...) → log.debug(...)
console.info('[YourModule]', ...) → log.info(...)
console.warn('[YourModule]', ...) → log.warn(...)
console.error('[YourModule]', ...) → log.error(...)
```

## 🚀 高级功能

### 自定义模块

```typescript
// 创建自定义模块日志
const customLog = createModuleLogger('MyCustomModule');
customLog.debug('自定义模块日志');
```

### 条件日志

```typescript
// 只在特定条件下记录
if (isDebugMode) {
  log.debug('调试模式下的详细信息', data);
}
```

### 性能监控

```typescript
const startTime = performance.now();
// ... 执行操作
const duration = performance.now() - startTime;
log.info('操作耗时:', `${duration.toFixed(2)}ms`);
```

## 📞 技术支持

如有问题，请联系技术团队并提供：
1. 日志配置：`logger.getStats()`
2. 浏览器控制台截图
3. 复现步骤

---

**注意**: 生产环境默认关闭 DEBUG 日志以节省资源，需要时可动态开启。
