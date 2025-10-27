import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 1. 导入 Element Plus 库
import ElementPlus from 'element-plus'

// 2. 导入 Element Plus 的 CSS 样式文件 (非常重要！)
import 'element-plus/dist/index.css'

// 1. 导入 Bootstrap 的 CSS 样式
import 'bootstrap/dist/css/bootstrap.min.css'

// 2. 导入 Bootstrap 的 JavaScript 功能 (包含 Popper.js)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

createApp(App).use(store).use(router).use(ElementPlus).mount('#app')
