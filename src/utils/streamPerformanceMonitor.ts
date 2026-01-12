// 流式输出性能监控工具
export class StreamPerformanceMonitor {
  private static instance: StreamPerformanceMonitor;
  private startTime: number = 0;
  private messageCount: number = 0;
  private totalBytes: number = 0;
  private lastMessageTime: number = 0;
  private performanceData: Array<{
    timestamp: number;
    type: string;
    size: number;
    interval: number;
  }> = [];

  static getInstance(): StreamPerformanceMonitor {
    if (!StreamPerformanceMonitor.instance) {
      StreamPerformanceMonitor.instance = new StreamPerformanceMonitor();
    }
    return StreamPerformanceMonitor.instance;
  }

  startStream() {
    this.startTime = performance.now();
    this.messageCount = 0;
    this.totalBytes = 0;
    this.lastMessageTime = this.startTime;
    this.performanceData = [];
    
    console.log('[StreamMonitor] 开始流式输出监控');
  }

  recordMessage(type: string, data: string) {
    const now = performance.now();
    const interval = now - this.lastMessageTime;
    const size = new Blob([data]).size;
    
    this.messageCount++;
    this.totalBytes += size;
    this.lastMessageTime = now;
    
    this.performanceData.push({
      timestamp: now,
      type,
      size,
      interval
    });

    // 检测性能问题
    if (interval > 1000) {
      console.warn(`[StreamMonitor] 消息间隔过长: ${interval.toFixed(2)}ms, 类型: ${type}`);
    }
    
    if (size > 50000) {
      console.warn(`[StreamMonitor] 消息过大: ${(size/1024).toFixed(2)}KB, 类型: ${type}`);
    }

    // 每100条消息输出一次统计
    if (this.messageCount % 100 === 0) {
      this.logStats();
    }
  }

  endStream() {
    const duration = performance.now() - this.startTime;
    const avgInterval = duration / this.messageCount;
    const avgSize = this.totalBytes / this.messageCount;
    
    console.log('[StreamMonitor] 流式输出结束');
    console.log(`总时长: ${duration.toFixed(2)}ms`);
    console.log(`消息数量: ${this.messageCount}`);
    console.log(`总数据量: ${(this.totalBytes/1024).toFixed(2)}KB`);
    console.log(`平均间隔: ${avgInterval.toFixed(2)}ms`);
    console.log(`平均大小: ${(avgSize/1024).toFixed(2)}KB`);
    
    // 检测卡顿
    this.detectStuttering();
  }

  private detectStuttering() {
    const longIntervals = this.performanceData.filter(d => d.interval > 500);
    const stutteringRatio = longIntervals.length / this.performanceData.length;
    
    if (stutteringRatio > 0.1) {
      console.warn(`[StreamMonitor] 检测到严重卡顿，卡顿率: ${(stutteringRatio * 100).toFixed(1)}%`);
    }
    
    // 找出最长的间隔
    const maxInterval = Math.max(...this.performanceData.map(d => d.interval));
    if (maxInterval > 3000) {
      console.warn(`[StreamMonitor] 最大间隔过长: ${maxInterval.toFixed(2)}ms`);
    }
  }

  private logStats() {
    const recentData = this.performanceData.slice(-10);
    const avgRecentInterval = recentData.reduce((sum, d) => sum + d.interval, 0) / recentData.length;
    
    console.log(`[StreamMonitor] 当前统计: 消息数=${this.messageCount}, 平均间隔=${avgRecentInterval.toFixed(2)}ms`);
  }

  // 检测内存使用情况
  checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMB = memory.totalJSHeapSize / 1024 / 1024;
      
      if (usedMB > 100) {
        console.warn(`[StreamMonitor] 内存使用较高: ${usedMB.toFixed(2)}MB`);
      }
      
      return {
        used: usedMB,
        total: totalMB,
        percentage: (usedMB / totalMB) * 100
      };
    }
    return null;
  }
}

export const streamMonitor = StreamPerformanceMonitor.getInstance();
