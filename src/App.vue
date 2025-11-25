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
</style>
