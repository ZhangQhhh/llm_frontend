import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import KnowledgeQAView from '../views/KnowledgeQAView.vue'
import ConversationView from '../views/ConversationView.vue'
import store from '../store'
import { ElMessage } from 'element-plus'

// 路由元信息类型定义
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    title?: string
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录' }
  },
  {
    path: '/knowledge-qa',
    name: 'knowledge-qa',
    component: KnowledgeQAView,
    meta: { title: '知识问答' }
  },
  {
    path: '/conversation',
    name: 'conversation',
    component: ConversationView,
    meta: { 
      requiresAuth: true,
      title: '多轮对话'
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: '管理中心'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { 
      requiresAuth: true,
      title: '个人设置'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：权限检查
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('jwt_token')
  const isLoggedIn = (store.state as any).is_login
  const isAdmin = store.getters.isAdmin
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 边检知识问答系统`
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth && !token) {
    ElMessage.warning('请先登录')
    next({ 
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !isAdmin) {
    ElMessage.error('无权访问，需要管理员权限')
    next({ name: 'home' })
    return
  }
  
  // 已登录用户访问登录页，跳转到首页
  if (to.name === 'login' && isLoggedIn) {
    next({ name: 'home' })
    return
  }
  
  next()
})

export default router
