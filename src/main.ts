import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { initSessionWatch } from './utils/userStatusChecker'

// 1. 导入 Element Plus 库
import ElementPlus from 'element-plus'

// 2. 导入 Element Plus 的 CSS 样式文件 (非常重要！)
import 'element-plus/dist/index.css'

// 1. 导入 Bootstrap 的 CSS 样式
import 'bootstrap/dist/css/bootstrap.min.css'

// Bootstrap JS removed to reduce global runtime overhead.

// 恢复登录状态
const token = localStorage.getItem('jwt_token')
if (token) {
  console.log('[Auth] 检测到本地 token，尝试恢复登录状态...')
  // 恢复 token 到 store
  store.commit('updateToken', token)
  
  // 获取用户信息
  store.dispatch('getinfo', {
    success: () => {
      console.log('[Auth] 用户信息已恢复')
      // 延迟启动 WebSocket 监听，确保状态完全恢复
      setTimeout(() => {
        const userId = (store.state as any).user?.id
        if (userId) {
          initSessionWatch(token, userId)
        }
      }, 500)
    },
    error: (err: any) => {
      // token 可能已过期，清除它
      console.error('[Auth] 恢复登录状态失败，清除 token:', err)
      localStorage.removeItem('jwt_token')
      store.commit('logout')
    }
  })
} else {
  console.log('[Auth] 未检测到本地 token，用户未登录')
}

// 🔥 监听 localStorage 变化，实时同步 token 状态
// 注意：这个事件只在同一浏览器的不同标签页之间触发
window.addEventListener('storage', (e) => {
  if (e.key === 'jwt_token' && !e.newValue) {
    // token 被删除了，清除 Vuex 状态
    console.warn('检测到 token 被删除，清除用户状态')
    store.commit('logout')
  }
})

createApp(App).use(store).use(router).use(ElementPlus).mount('#app')
