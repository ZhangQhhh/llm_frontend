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

async function ensurePermissionsLoaded(): Promise<void> {
  const permissionsLoaded = store.getters.permissionsLoaded
  if (permissionsLoaded) return
  try {
    await store.dispatch('getPermissions')
  } catch {
    // ignore, fallback to role checks
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
  {
    path: '/saq-grading',
    name: 'saq-grading',
    component: () => import('../views/SaqGradingView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '简答题评分'
    }
  },
  {
    path: '/software-download',
    name: 'software-download',
    component: () => import('../views/SoftwareDownloadView.vue'),
    meta: {
      title: '软件下载',
      pageCode: 'PAGE_024',
      publicAccess: true  // 公开访问，无需登录
    }
  }
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

    if (!isLoggedIn) {
      try {
        await new Promise<void>((resolve, reject) => {
          store.dispatch('getinfo', {
            success: () => resolve(),
            error: () => reject()
          })
        })
      } catch {
        ElMessage.warning('登录已过期，请重新登录')
        next({ name: 'login', query: { redirect: to.fullPath } })
        return
      }
    }
  }

  // Permission checks after user info is loaded
  const isLoggedIn = (store.state as any).user.is_login
  const isAdmin = store.getters.isAdmin
  const isSuperAdmin = store.getters.isSuperAdmin
  const isBjzxAdmin = store.getters.isBjzxAdmin
  const isPrivileged = isAdmin || isSuperAdmin || isBjzxAdmin

  // 🔥 修复：对于 publicAccess 页面，跳过所有权限检查
  if (to.meta.publicAccess) {
    // 公开访问页面，直接放行
    if (to.name === 'login' && isLoggedIn) {
      next({ name: 'home' })
      return
    }
    next()
    return
  }

  let hasPagePermission = false
  if (token && to.meta.pageCode && !isPrivileged) {
    await ensurePermissionsLoaded()
    if (typeof store.getters.hasPagePermission === 'function') {
      hasPagePermission = store.getters.hasPagePermission(to.meta.pageCode)
    }
  }

  // Admin system remains role-based; group permissions only supplement regular users
  if (to.meta.requiresSuperAdmin && !isSuperAdmin) {
    ElMessage.error('\u65e0\u6743\u8bbf\u95ee\uff0c\u9700\u8981\u8d85\u7ea7\u7ba1\u7406\u5458\u6743\u9650')
    next({ name: 'home' })
    return
  }

  if (to.meta.requiresAdminRole && !isAdmin) {
    ElMessage.error('\u65e0\u6743\u8bbf\u95ee\uff0c\u9700\u8981\u7ba1\u7406\u5458\u6743\u9650')
    next({ name: 'home' })
    return
  }

  // Regular users with page permission can access requiresAdmin pages
  if (to.meta.requiresAdmin && !isAdmin && !isBjzxAdmin) {
    if (store.getters.permissionsLoaded) {
      if (!hasPagePermission) {
        ElMessage.error('\u65e0\u6743\u8bbf\u95ee\uff0c\u9700\u8981\u7ba1\u7406\u5458\u6743\u9650')
        next({ name: 'home' })
        return
      }
    } else {
      const allowed = await checkPagePermission(to.meta.pageCode || '')
      if (!allowed) {
        ElMessage.error('\u65e0\u6743\u8bbf\u95ee\uff0c\u9700\u8981\u7ba1\u7406\u5458\u6743\u9650')
        next({ name: 'home' })
        return
      }
    }
  }

  // Page permission checks only apply to non-admin users and non-public pages
  if (token && to.meta.pageCode && !isPrivileged) {
    if (store.getters.permissionsLoaded) {
      if (!hasPagePermission) {
        ElMessage.error('\u65e0\u6743\u8bbf\u95ee\u8be5\u9875\u9762')
        next({ name: 'home' })
        return
      }
    } else {
      const allowed = await checkPagePermission(to.meta.pageCode)
      if (!allowed) {
        ElMessage.error('\u65e0\u6743\u8bbf\u95ee\u8be5\u9875\u9762')
        next({ name: 'home' })
        return
      }
    }
  }

  // 🔥 修复：登录用户访问登录页，重定向到首页
  if (to.name === 'login' && isLoggedIn) {
    next({ name: 'home' })
    return
  }

  next()
})

export default router
