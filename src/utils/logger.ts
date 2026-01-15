// 日志控制系统
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel;
  private enabledModules: Set<string>;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // 从 localStorage 读取配置
    const savedLevel = localStorage.getItem('log-level');
    const savedModules = localStorage.getItem('log-enabled-modules');
    
    // 默认配置：生产环境关闭 DEBUG，开发环境全开
    this.currentLevel = savedLevel 
      ? parseInt(savedLevel) 
      : (this.isProduction ? LogLevel.WARN : LogLevel.DEBUG);
    
    this.enabledModules = savedModules 
      ? new Set(JSON.parse(savedModules))
      : new Set(['*']); // '*' 表示所有模块
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // 设置日志级别
  setLevel(level: LogLevel) {
    this.currentLevel = level;
    localStorage.setItem('log-level', String(level));
    console.log(`[Logger] 日志级别已设置为: ${LogLevel[level]}`);
  }

  // 获取当前日志级别
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  // 启用特定模块的日志
  enableModule(module: string) {
    this.enabledModules.add(module);
    this.saveModules();
  }

  // 禁用特定模块的日志
  disableModule(module: string) {
    this.enabledModules.delete(module);
    this.saveModules();
  }

  // 启用所有模块
  enableAll() {
    this.enabledModules.clear();
    this.enabledModules.add('*');
    this.saveModules();
  }

  // 禁用所有模块
  disableAll() {
    this.enabledModules.clear();
    this.saveModules();
  }

  // 检查模块是否启用
  isModuleEnabled(module: string): boolean {
    return this.enabledModules.has('*') || this.enabledModules.has(module);
  }

  private saveModules() {
    localStorage.setItem('log-enabled-modules', JSON.stringify([...this.enabledModules]));
  }

  // 格式化日志消息
  private formatMessage(level: string, module: string, ...args: any[]): any[] {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const prefix = `[${timestamp}] [${level}] [${module}]`;
    return [prefix, ...args];
  }

  // DEBUG 级别日志
  debug(module: string, ...args: any[]) {
    if (this.currentLevel <= LogLevel.DEBUG && this.isModuleEnabled(module)) {
      console.log(...this.formatMessage('DEBUG', module, ...args));
    }
  }

  // INFO 级别日志
  info(module: string, ...args: any[]) {
    if (this.currentLevel <= LogLevel.INFO && this.isModuleEnabled(module)) {
      console.info(...this.formatMessage('INFO', module, ...args));
    }
  }

  // WARN 级别日志
  warn(module: string, ...args: any[]) {
    if (this.currentLevel <= LogLevel.WARN && this.isModuleEnabled(module)) {
      console.warn(...this.formatMessage('WARN', module, ...args));
    }
  }

  // ERROR 级别日志
  error(module: string, ...args: any[]) {
    if (this.currentLevel <= LogLevel.ERROR && this.isModuleEnabled(module)) {
      console.error(...this.formatMessage('ERROR', module, ...args));
    }
  }

  // 获取日志统计信息
  getStats() {
    return {
      level: LogLevel[this.currentLevel],
      isProduction: this.isProduction,
      enabledModules: [...this.enabledModules],
      totalModules: this.enabledModules.size
    };
  }

  // 打印当前配置
  printConfig() {
    console.group('📋 日志系统配置');
    console.log('环境:', this.isProduction ? '生产环境' : '开发环境');
    console.log('日志级别:', LogLevel[this.currentLevel]);
    console.log('启用的模块:', [...this.enabledModules].join(', '));
    console.groupEnd();
  }
}

// 导出单例
export const logger = Logger.getInstance();

// 便捷的模块日志创建器
export function createModuleLogger(moduleName: string) {
  return {
    debug: (...args: any[]) => logger.debug(moduleName, ...args),
    info: (...args: any[]) => logger.info(moduleName, ...args),
    warn: (...args: any[]) => logger.warn(moduleName, ...args),
    error: (...args: any[]) => logger.error(moduleName, ...args),
  };
}

// 常用模块名称常量
export const LogModules = {
  STREAM: 'Stream',
  PERFORMANCE: 'Performance',
  DEPARTMENT: 'DepartmentDialog',
  THREE_BG: 'ThreeBackground',
  CHAT_API: 'ChatAPI',
  USER: 'User',
  AUTH: 'Auth',
  ROUTER: 'Router',
  STORE: 'Store',
};
