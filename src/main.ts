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

// 恢复登录状态
const token = localStorage.getItem('jwt_token')
if (token) {
  // 恢复 token 到 store
  store.commit('updateToken', token)
  
  // 获取用户信息
  store.dispatch('getinfo', {
    success: () => {
      console.log('用户信息已恢复')
    },
    error: () => {
      // token 可能已过期，清除它
      localStorage.removeItem('jwt_token')
      store.commit('logout')
    }
  })
}

createApp(App).use(store).use(router).use(ElementPlus).mount('#app')
