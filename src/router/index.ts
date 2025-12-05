import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import KnowledgeQAView from '../views/KnowledgeQAView.vue'
import ConversationView from '../views/ConversationView.vue'
import SmartOfficeView from '../views/SmartOfficeView.vue'
import Immigration12367View from '../views/Immigration12367View.vue'
import store from '../store'
import { ElMessage } from 'element-plus'

// 路由元信息类型定义
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresSuperAdmin?: boolean
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
    meta: { 
      requiresAuth: true,
      title: '知识问答' 
    }
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
    path: '/super-admin',
    name: 'super-admin',
    component: () => import('../views/SuperAdminView.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true,
      title: '超级管理员中心'
    }
  },
  {
    path: '/user-dashboard',
    name: 'user-dashboard',
    component: () => import('../views/UserDashboardView.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true,
      title: '用户仪表盘'
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
  },
  {
    path: '/excel-tool',
    name: 'excel-tool',
    component: () => import('../views/ExcelToolView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Excel 工具'
    }
  },
  {
    path: '/exam',
    name: 'exam',
    component: () => import('../views/ExamView.vue'),
    meta: { 
      requiresAuth: true,
      title: '边检智能家教'
    }
  },
  {
    path: '/smart-office',
    name: 'smart-office',
    component: SmartOfficeView,
    meta: { 
      requiresAuth: true,
      title: '智慧办公'
    }
  },
  {
    path: '/immigration-12367',
    name: 'immigration-12367',
    component: Immigration12367View,
    meta: { 
      requiresAuth: true,
      title: '移民局12367'
    }
  },
  {
    path: '/test-explain',
    name: 'test-explain',
    component: () => import('../views/TestExplainView.vue'),
    meta: { 
      title: '选择题问答测试'
    }
  },
  {
    path: '/report-generator',
    name: 'report-generator',
    component: () => import('../views/ReportGeneratorView.vue'),
    meta: { 
      requiresAuth: true,
      title: '数据分析'
    }
  },
  {
    path: '/data-analysis',
    name: 'data-analysis',
    component: () => import('../views/DataAnalysisView.vue'),
    meta: { 
      requiresAuth: true,
      title: '报告生成'
    }
  },
  {
    path: '/feedback',
    name: 'feedback-list',
    component: () => import('../views/FeedbackListView.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: '反馈记录列表'
    }
  },
  {
    path: '/feedback/:id',
    name: 'feedback-detail',
    component: () => import('../views/FeedbackDetailView.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: '反馈详情'
    }
  },
  {
    path: '/help',
    name: 'help-center',
    component: () => import('../views/HelpCenterView.vue'),
    meta: { 
      title: '帮助中心'
    }
  },
  {
    path: '/qa-logs',
    name: 'qa-logs',
    component: () => import('../views/QALogsView.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true,
      title: '问答日志管理'
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
  const isLoggedIn = (store.state as any).user.is_login
  const isAdmin = store.getters.isAdmin
  const isSuperAdmin = store.getters.isSuperAdmin
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 边检知识问答系统`
  }
  
  // 未登录用户访问首页，重定向到登录页
  if (to.name === 'home' && !token) {
    next({ name: 'login' })
    return
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

  if (to.meta.requiresSuperAdmin && !isSuperAdmin) {
    ElMessage.error('无权访问，需要超级管理员权限')
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
