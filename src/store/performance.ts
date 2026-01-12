// 性能模式配置 Store
export interface PerformanceState {
  lowPerformanceMode: boolean;  // 全局低配模式
  disableAnimations: boolean;   // 禁用动画
  disable3DBackground: boolean; // 禁用3D背景
  reduceEffects: boolean;       // 减少特效
  simplifyUI: boolean;          // 简化UI
  enableDebugLogs: boolean;     // 启用调试日志
}

const state: PerformanceState = {
  lowPerformanceMode: localStorage.getItem('global-low-performance-mode') === 'true',
  disableAnimations: localStorage.getItem('disable-animations') === 'true',
  disable3DBackground: localStorage.getItem('disable-3d-background') === 'true',
  reduceEffects: localStorage.getItem('reduce-effects') === 'true',
  simplifyUI: localStorage.getItem('simplify-ui') === 'true',
  enableDebugLogs: localStorage.getItem('enable-debug-logs') === 'true',
};

export default {
  namespaced: true,
  state,
  getters: {
    // 是否启用低配模式
    isLowPerformanceMode(state: PerformanceState): boolean {
      return state.lowPerformanceMode;
    },
    // 是否禁用动画
    shouldDisableAnimations(state: PerformanceState): boolean {
      return state.lowPerformanceMode || state.disableAnimations;
    },
    // 是否禁用3D背景
    shouldDisable3DBackground(state: PerformanceState): boolean {
      return state.lowPerformanceMode || state.disable3DBackground;
    },
    // 是否减少特效
    shouldReduceEffects(state: PerformanceState): boolean {
      return state.lowPerformanceMode || state.reduceEffects;
    },
    // 是否简化UI
    shouldSimplifyUI(state: PerformanceState): boolean {
      return state.lowPerformanceMode || state.simplifyUI;
    },
  },
  mutations: {
    // 设置全局低配模式
    setLowPerformanceMode(state: PerformanceState, value: boolean) {
      state.lowPerformanceMode = value;
      localStorage.setItem('global-low-performance-mode', String(value));
      
      // 低配模式开启时，自动启用所有优化
      if (value) {
        state.disableAnimations = true;
        state.disable3DBackground = true;
        state.reduceEffects = true;
        state.simplifyUI = true;
        
        localStorage.setItem('disable-animations', 'true');
        localStorage.setItem('disable-3d-background', 'true');
        localStorage.setItem('reduce-effects', 'true');
        localStorage.setItem('simplify-ui', 'true');
      }
    },
    // 设置是否禁用动画
    setDisableAnimations(state: PerformanceState, value: boolean) {
      state.disableAnimations = value;
      localStorage.setItem('disable-animations', String(value));
    },
    // 设置是否禁用3D背景
    setDisable3DBackground(state: PerformanceState, value: boolean) {
      state.disable3DBackground = value;
      localStorage.setItem('disable-3d-background', String(value));
    },
    // 设置是否减少特效
    setReduceEffects(state: PerformanceState, value: boolean) {
      state.reduceEffects = value;
      localStorage.setItem('reduce-effects', String(value));
    },
    // 设置是否简化UI
    setSimplifyUI(state: PerformanceState, value: boolean) {
      state.simplifyUI = value;
      localStorage.setItem('simplify-ui', String(value));
    },
    // 设置是否启用调试日志
    setEnableDebugLogs(state: PerformanceState, value: boolean) {
      state.enableDebugLogs = value;
      localStorage.setItem('enable-debug-logs', String(value));
      
      // 动态更新日志级别
      if (typeof window !== 'undefined') {
        import('@/utils/logger').then(({ logger, LogLevel }) => {
          if (value) {
            logger.setLevel(LogLevel.DEBUG);
            logger.enableAll();
            console.log('✅ 调试日志已启用');
          } else {
            logger.setLevel(LogLevel.WARN);
            console.log('⚠️ 调试日志已禁用');
          }
        });
      }
    },
  },
};
