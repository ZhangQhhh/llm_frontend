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

// 🔥 监听 localStorage 变化，实时同步 token 状态
// 注意：这个事件只在同一浏览器的不同标签页之间触发
// 对于同一页面内的 localStorage 修改，我们需要额外处理
window.addEventListener('storage', (e) => {
  if (e.key === 'jwt_token' && !e.newValue) {
    // token 被删除了，清除 Vuex 状态
    console.warn('检测到 token 被删除，清除用户状态')
    store.commit('logout')
  }
})

// 🔥 重写 localStorage.removeItem 方法，捕获同一页面内的删除操作
const originalRemoveItem = localStorage.removeItem.bind(localStorage)
localStorage.removeItem = function(key: string) {
  // 先执行原始的删除操作
  const result = originalRemoveItem(key)
  
  // 如果删除的是 jwt_token，同步清除 Vuex 状态
  if (key === 'jwt_token' && (store.state as any).user?.is_login) {
    console.warn('检测到 token 被删除，清除用户状态')
    store.commit('logout')
  }
  
  return result
}

createApp(App).use(store).use(router).use(ElementPlus).mount('#app')
