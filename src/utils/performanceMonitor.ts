// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];
  private memoryInterval: NodeJS.Timeout | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // 超过50ms的任务
            console.warn(`长任务检测: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }

    // 监控内存使用
    if ('memory' in performance) {
      this.memoryInterval = setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
        const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
        
        console.log(`内存使用: ${usedMB}MB / ${totalMB}MB (限制: ${limitMB}MB)`);
        
        // 内存使用超过80%时警告
        if (parseFloat(usedMB) / parseFloat(limitMB) > 0.8) {
          console.warn('内存使用过高，可能存在内存泄漏');
        }
      }, 10000); // 每10秒检查一次
    }

    // 监控FPS
    this.monitorFPS();
  }

  private monitorFPS() {
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const calculateFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        
        if (fps < 30) {
          console.warn(`FPS过低: ${fps}`);
        }
      }
      
      requestAnimationFrame(calculateFPS);
    };

    requestAnimationFrame(calculateFPS);
  }

  stopMonitoring() {
    // 停止所有观察器
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // 停止内存监控
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  // 检测页面是否卡顿
  detectPageFreeze(): boolean {
    const start = performance.now();
    let end = start;
    
    // 同步执行一些计算
    while (end - start < 100) {
      end = performance.now();
    }
    
    // 如果100ms内没有进展，说明页面卡顿
    return end - start > 200;
  }
}

// 全局性能监控
export const performanceMonitor = PerformanceMonitor.getInstance();
