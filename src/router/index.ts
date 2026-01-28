import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import KnowledgeQAView from '../views/KnowledgeQAView.vue'
import ConversationView from '../views/ConversationView.vue'
import SmartOfficeView from '../views/SmartOfficeView.vue'
import Immigration12367View from '../views/Immigration12367View.vue'
import store from '../store'
import { ElMessage } from 'element-plus'
import http from '../config/api/http'
import { API_ENDPOINTS } from '../config/api/api'

// 路由元信息类型定义
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresSuperAdmin?: boolean
    requiresAdminRole?: boolean
    title?: string
    pageCode?: string
    publicAccess?: boolean
  }
}

interface XspaceResult<T = any> {
  success: boolean
  code: number
  message: string
  data: T
}

interface PermissionCheckData {
  allowed?: boolean
  code?: string
  permissions?: string[]
  roles?: string[]
  isAdmin?: boolean
}

async function checkPagePermission(pageCode: string): Promise<boolean> {
  try {
    const response = await http.get<XspaceResult<PermissionCheckData>>(
      API_ENDPOINTS.PERMISSIONS.CHECK,
      {
        params: { code: pageCode }
      }
    )
    const payload = response.data?.data
    return payload?.allowed === true || payload?.isAdmin === true
  } catch (error) {
    return false
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '首页', pageCode: 'PAGE_001', publicAccess: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录', pageCode: 'PAGE_002', publicAccess: true }
  },
  {
    path: '/knowledge-qa',
    name: 'knowledge-qa',
    component: KnowledgeQAView,
    meta: { 
      requiresAuth: true,
      title: '知识问答',
      pageCode: 'PAGE_003',
      publicAccess: true
    }
  },
  {
    path: '/knowledge-qa/debug',
    name: 'knowledge-qa-debug',
    component: KnowledgeQAView,
    meta: { 
      requiresAuth: true,
      title: '知识问答 (Debug模式)',
      pageCode: 'PAGE_004'
    }
  },
  {
    path: '/conversation',
    name: 'conversation',
    component: ConversationView,
    meta: { 
      requiresAuth: true,
      title: '多轮对话',
      pageCode: 'PAGE_005',
      publicAccess: true
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: '管理中心',
      pageCode: 'PAGE_006'
    }
  },
  {
    path: '/super-admin',
    name: 'super-admin',
    component: () => import('../views/SuperAdminView.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true,
      title: '超级管理员中心',
      pageCode: 'PAGE_007'
    }
  },
  {
    path: '/user-dashboard',
    name: 'user-dashboard',
    component: () => import('../views/UserDashboardView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdminRole: true,
      title: '用户仪表盘',
      pageCode: 'PAGE_008'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { 
      requiresAuth: true,
      title: '个人设置',
      pageCode: 'PAGE_009',
      publicAccess: true
    }
  },
  {
    path: '/excel-tool',
    name: 'excel-tool',
    component: () => import('../views/ExcelToolView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Excel 工具',
      pageCode: 'PAGE_010',
      publicAccess: true
    }
  },
  {
    path: '/format-tool',
    name: 'format-tool',
    component: () => import('../views/FormatToolView.vue'),
    meta: { 
      requiresAuth: true,
      title: '选择题格式化工具',
      pageCode: 'PAGE_011',
      publicAccess: true
    }
  },
  {
    path: '/exam',
    name: 'exam',
    component: () => import('../views/ExamView.vue'),
    meta: { 
      requiresAuth: true,
      title: '边检智能家教',
      pageCode: 'PAGE_012'
    }
  },
  {
    path: '/smart-office',
    name: 'smart-office',
    component: SmartOfficeView,
    meta: { 
      requiresAuth: true,
      title: '智慧办公',
      pageCode: 'PAGE_013'
    }
  },
  {
    path: '/immigration-12367',
    name: 'immigration-12367',
    component: Immigration12367View,
    meta: { 
      requiresAuth: true,
      title: '移民局12367',
      pageCode: 'PAGE_014',
      publicAccess: true
    }
  },
  {
    path: '/test-explain',
    name: 'test-explain',
    component: () => import('../views/TestExplainView.vue'),
    meta: { 
      title: '选择题问答测试',
      pageCode: 'PAGE_015'
    }
  },
  {
    path: '/report-generator',
    name: 'report-generator',
    component: () => import('../views/ReportGeneratorView.vue'),
    meta: { 
      requiresAuth: true,
      title: '数据分析',
      pageCode: 'PAGE_016'
    }
  },
  {
    path: '/data-analysis',
    name: 'data-analysis',
    component: () => import('../views/DataAnalysisView.vue'),
    meta: { 
      requiresAuth: true,
      title: '数研报告',
      pageCode: 'PAGE_017'
    }
  },
  {
    path: '/feedback',
    name: 'feedback-list',
    component: () => import('../views/FeedbackListView.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: '反馈记录列表',
      pageCode: 'PAGE_018'
    }
  },
  {
    path: '/feedback/:id',
    name: 'feedback-detail',
    component: () => import('../views/FeedbackDetailView.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: '反馈详情',
      pageCode: 'PAGE_019'
    }
  },
  {
    path: '/help',
    name: 'help-center',
    component: () => import('../views/HelpCenterView.vue'),
    meta: { 
      title: '帮助中心',
      pageCode: 'PAGE_020'
    }
  },
  {
    path: '/qa-logs',
    name: 'qa-logs',
    component: () => import('../views/QALogsView.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true,
      title: '问答日志管理',
      pageCode: 'PAGE_021'
    }
  },
  {
    path: '/knowledge-base',
    name: 'knowledge-base',
    component: () => import('../views/KnowledgeBaseManageView.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true,
      title: '知识库管理',
      pageCode: 'PAGE_022'
    }
  },
  {
    path: '/video-center',
    name: 'video-center',
    component: () => import('../views/VideoCenterView.vue'),
    meta: {
      requiresAuth: true,
      title: '视频中心',
      pageCode: 'PAGE_023'
    }
  },
  {
    path: '/test-department',
    name: 'test-department',
    component: () => import('../views/DepartmentTestView.vue'),
    meta: {
      requiresAuth: true,
      title: '部门设置测试'
    }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：权限检查
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('jwt_token')
  
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
  
  // 如果有 token 且需要权限检查，确保用户信息已加载
  if (token && (to.meta.requiresAdmin || to.meta.requiresSuperAdmin || to.meta.requiresAdminRole)) {
    const isLoggedIn = (store.state as any).user.is_login
    
    // 如果用户信息还没加载，先加载用户信息
    if (!isLoggedIn) {
      try {
        await new Promise<void>((resolve, reject) => {
          store.dispatch('getinfo', {
            success: () => resolve(),
            error: () => reject()
          })
        })
      } catch {
        // 获取用户信息失败，可能 token 已过期
        ElMessage.warning('登录已过期，请重新登录')
        next({ name: 'login', query: { redirect: to.fullPath } })
        return
      }
    }
  }
  
  // 重新获取权限状态（用户信息已加载后）
  const isLoggedIn = (store.state as any).user.is_login
  const isAdmin = store.getters.isAdmin
  const isSuperAdmin = store.getters.isSuperAdmin
  const isBjzxAdmin = store.getters.isBjzxAdmin
  
  // 检查是否需要管理员权限（管理员或边检智学管理员都可以访问）
  if (to.meta.requiresAdmin && !isAdmin && !isBjzxAdmin) {
    ElMessage.error('无权访问，需要管理员权限')
    next({ name: 'home' })
    return
  }

  if (to.meta.requiresAdminRole && !isAdmin) {
    ElMessage.error('无权访问，需要管理员权限')
    next({ name: 'home' })
    return
  }

  if (to.meta.requiresSuperAdmin && !isSuperAdmin) {
    ElMessage.error('无权访问，需要超级管理员权限')
    next({ name: 'home' })
    return
  }

  if (token && to.meta.pageCode && !to.meta.publicAccess) {
    const allowed = await checkPagePermission(to.meta.pageCode)
    if (!allowed) {
      ElMessage.error('无权访问该页面')
      next({ name: 'home' })
      return
    }
  }

  // 已登录用户访问登录页，跳转到首页
  if (to.name === 'login' && isLoggedIn) {
    next({ name: 'home' })
    return
  }
  
  next()
})

export default router
