// 日志系统使用示例
import { createModuleLogger, LogModules, logger, LogLevel } from './logger';

// 示例1：在组件中使用模块日志
export function exampleComponentUsage() {
  // 创建模块日志
  const log = createModuleLogger(LogModules.USER);
  
  // 不同级别的日志
  log.debug('用户数据:', { id: 1, name: 'test' });
  log.info('用户登录成功');
  log.warn('密码即将过期');
  log.error('登录失败', new Error('Invalid credentials'));
}

// 示例2：动态控制日志级别
export function exampleLogLevelControl() {
  // 开发环境：显示所有日志
  if (process.env.NODE_ENV === 'development') {
    logger.setLevel(LogLevel.DEBUG);
  }
  
  // 生产环境：只显示警告和错误
  if (process.env.NODE_ENV === 'production') {
    logger.setLevel(LogLevel.WARN);
  }
  
  // 临时开启调试（用户可在控制台执行）
  // logger.setLevel(LogLevel.DEBUG);
}

// 示例3：模块过滤
export function exampleModuleFilter() {
  // 只启用特定模块的日志
  logger.disableAll();
  logger.enableModule('User');
  logger.enableModule('Auth');
  
  // 或者禁用特定模块
  logger.enableAll();
  logger.disableModule('ThreeBackground'); // 禁用3D背景的日志
}

// 示例4：查看配置
export function examplePrintConfig() {
  // 打印当前日志配置
  logger.printConfig();
  
  // 获取统计信息
  const stats = logger.getStats();
  console.log('日志统计:', stats);
}

// 示例5：在异步操作中使用
export async function exampleAsyncUsage() {
  const log = createModuleLogger('AsyncOperation');
  
  log.debug('开始异步操作');
  
  try {
    const result = await fetch('/api/data');
    log.info('API请求成功');
    return result;
  } catch (error) {
    log.error('API请求失败:', error);
    throw error;
  }
}

// 示例6：性能监控
export function examplePerformanceMonitoring() {
  const log = createModuleLogger(LogModules.PERFORMANCE);
  
  const startTime = performance.now();
  
  // 执行一些操作
  for (let i = 0; i < 1000000; i++) {
    // 模拟操作
  }
  
  const duration = performance.now() - startTime;
  
  if (duration > 100) {
    log.warn('操作耗时过长:', `${duration.toFixed(2)}ms`);
  } else {
    log.debug('操作完成:', `${duration.toFixed(2)}ms`);
  }
}
