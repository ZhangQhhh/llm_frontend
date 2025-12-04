<template>
  <div id="app">
    <NavBar v-if="showNavBar" />
    <router-view />
    <TourGuideButton />
    <FirstTimeGuide />
    <ChangeNameDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from './components/NavBar.vue';
import TourGuideButton from './components/TourGuideButton.vue';
import FirstTimeGuide from './components/FirstTimeGuide.vue';
import ChangeNameDialog from './components/ChangeNameDialog.vue';

export default defineComponent({
  name: "App",
  components: {
    NavBar,
    TourGuideButton,
    FirstTimeGuide,
    ChangeNameDialog,
  },
  setup() {
    const route = useRoute();

    // 在登录页面隐藏导航栏
    const showNavBar = computed(() => {
      return route.name !== 'login';
    });

    return {
      showNavBar
    };
  }
});
</script>

<style>
@import '@/styles/driver.css';

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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
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
