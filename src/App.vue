<template>
  <div id="app">
    <NavBar v-if="showNavBar" />
    <router-view />
    <TourGuideButton />
    <FirstTimeGuide />
    <ChangeNameDialog @completed="onNameChanged" />
    <DepartmentDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import NavBar from './components/NavBar.vue';
import TourGuideButton from './components/TourGuideButton.vue';
import FirstTimeGuide from './components/FirstTimeGuide.vue';
import ChangeNameDialog from './components/ChangeNameDialog.vue';
import DepartmentDialog from './components/DepartmentDialog.vue';
import { startVersionCheck } from './utils/versionCheck';
import { performanceMonitor } from './utils/performanceMonitor';

export default defineComponent({
  name: "App",
  components: {
    NavBar,
    TourGuideButton,
    FirstTimeGuide,
    ChangeNameDialog,
    DepartmentDialog,
  },
  setup() {
    const route = useRoute();
    const store = useStore();

    // 在登录页面隐藏导航栏
    const showNavBar = computed(() => {
      return route.name !== 'login';
    });

    // 改名完成回调
    const onNameChanged = () => {
      console.log('用户改名完成，可以检查部门了')
    };

    // 监听性能模式变化，动态添加 body class
    const updateBodyClasses = () => {
      const body = document.body;
      
      // 低配模式
      if (store.getters['performance/isLowPerformanceMode']) {
        body.classList.add('low-performance-mode');
      } else {
        body.classList.remove('low-performance-mode');
      }
      
      // 减少特效
      if (store.getters['performance/shouldReduceEffects']) {
        body.classList.add('reduce-effects-mode');
      } else {
        body.classList.remove('reduce-effects-mode');
      }
      
      // 简化UI
      if (store.getters['performance/shouldSimplifyUI']) {
        body.classList.add('simplify-ui-mode');
      } else {
        body.classList.remove('simplify-ui-mode');
      }
    };

    // 启动版本检查
    onMounted(() => {
      startVersionCheck();
      const enablePerfMonitor =
        process.env.NODE_ENV !== 'production' ||
        localStorage.getItem('enable_perf_monitor') === '1';
      if (enablePerfMonitor) {
        performanceMonitor.startMonitoring();
      }
      
      // 初始化 body classes
      updateBodyClasses();
    });

    // 监听性能设置变化
    watch(
      () => store.state.performance,
      () => {
        updateBodyClasses();
      },
      { deep: true }
    );

    return {
      showNavBar,
      onNameChanged
    };
  }
});
</script>

<style>
@import '@/styles/driver.css';
@import '@/assets/performance.css';

/* 新字体 */
@font-face {
  font-family: 'ZhaoPai';
  src: url('@/assets/fonts/667adcb33129c733bceaf9a00286e3a1.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans CJK SC', 'Source Han Sans SC', 'WenQuanYi Micro Hei',
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 导航栏透明背景 - 全局覆盖 Element Plus */
.navbar-menu,
.navbar-inner,
.navbar-inner.el-menu,
.navbar-inner.el-menu--horizontal {
  background: transparent !important;
  background-color: transparent !important;
  border-bottom: none !important;
  --el-menu-bg-color: transparent !important;
  --el-menu-hover-bg-color: transparent !important;
}
</style>
