<template>
  <nav class="navbar-menu">
    <el-menu
      :default-active="activeIndex"
      mode="horizontal"
      :ellipsis="false"
      :style="{ background: 'transparent', backgroundColor: 'transparent' }"
      text-color="rgba(255, 255, 255, 0.9)"
      active-text-color="#60a5fa"
      class="navbar-inner"
    >
    <!-- Logo -->
    <div class="navbar-brand">
      <router-link to="/" class="brand-link">
        <img src="@/assets/logo.png" alt="logo" class="logo-image" />
        <span class="logo-text">安徽出入境边防检查总站</span>
      </router-link>
    </div>

    <!-- 中间留空 -->
    <!-- 右侧用户区域 -->
    <div class="navbar-right">
      <template v-if="isLoggedIn">
        <el-dropdown @command="handleCommand" trigger="click">
          <div class="user-dropdown">
            <el-avatar :size="32" :src="userPhoto || undefined">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="user-name">{{ username }}</span>
            <el-tag 
              :type="roleTagType" 
              size="small" 
              effect="plain"
              class="role-tag"
            >
              {{ roleText }}
            </el-tag>
            <el-icon class="el-icon--right arrow-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <el-icon><User /></el-icon>
                <span>{{ username }}</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="canAccessAdminCenter" command="admin">
                <el-icon><Setting /></el-icon>
                <span>管理中心</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="canAccessSuperAdminCenter" command="super-admin">
                <el-icon><Setting /></el-icon>
                <span>超管中心</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="canAccessUserDashboard" command="user-dashboard">
                <el-icon><DataBoard /></el-icon>
                <span>用户仪表盘</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="canAccessQaLogs" command="qa-logs">
                <el-icon><Document /></el-icon>
                <span>问答日志</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="canAccessKnowledgeBase" command="knowledge-base">
                <el-icon><FolderOpened /></el-icon>
                <span>知识库管理</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="canAccessFeedback" command="feedback">
                <el-icon><ChatLineSquare /></el-icon>
                <span>反馈管理</span>
              </el-dropdown-item>
              <el-dropdown-item v-if="canAccessVideoCenter" command="video-center">
                <el-icon><VideoCamera /></el-icon>
                <span>资料中心</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="profile">
                <el-icon><Setting /></el-icon>
                <span>个人设置</span>
              </el-dropdown-item>
              <el-dropdown-item command="performance">
                <el-icon><Monitor /></el-icon>
                <span>性能设置</span>
              </el-dropdown-item>
              <el-dropdown-item command="excel-tool">
                <el-icon><DocumentCopy /></el-icon>
                <span>Excel 工具</span>
              </el-dropdown-item>
              <!-- <el-dropdown-item command="report-generator">
                <el-icon><Document /></el-icon>
                <span>数据分析</span>
              </el-dropdown-item> -->
              <!-- <el-dropdown-item command="data-analysis">
                <el-icon><DataAnalysis /></el-icon>
                <span>报告生成</span>
              </el-dropdown-item> -->
              <el-dropdown-item command="docx-tool">
                <el-icon><Document /></el-icon>
                <span>DOCX 工具</span>
              </el-dropdown-item>
              <el-dropdown-item command="format-tool">
                <el-icon><Document /></el-icon>
                <span>格式化工具</span>
              </el-dropdown-item>
              <el-dropdown-item command="software-download">
                <el-icon><Download /></el-icon>
                <span>软件下载</span>
              </el-dropdown-item>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
      <template v-else>
        <el-button type="primary" @click="navigateTo('/login')">
          <el-icon><User /></el-icon>
          <span>登录</span>
        </el-button>
      </template>
    </div>
    </el-menu>
    
    <!-- 性能设置对话框 -->
    <PerformanceSettings v-model="showPerformanceSettings" />
  </nav>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { 
  Setting, 
  User, 
  ArrowDown, 
  SwitchButton,
  ChatLineSquare,
  DocumentCopy,
  Document,
  DataBoard,
  FolderOpened,
  VideoCamera,
  Monitor,
  Download
} from '@element-plus/icons-vue'
import { RoleNames, UserRole } from '@/config/permissions'
import PerformanceSettings from './PerformanceSettings.vue'

export default defineComponent({
  name: 'NavBar',
  components: {
    Setting,
    User,
    ArrowDown,
    SwitchButton,
    ChatLineSquare,
    DocumentCopy,
    Document,
    DataBoard,
    FolderOpened,
    VideoCamera,
    Monitor,
    Download,
    PerformanceSettings
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const showPerformanceSettings = ref(false)

    const activeIndex = computed(() => route.path)
    const isLoggedIn = computed(() => store.state.user.is_login)
    const username = computed(() => store.state.user.username || '用户')
    const userPhoto = computed(() => store.state.user.photo)
    const userRole = computed(() => store.getters.userRole)
    const isAdmin = computed(() => store.getters.isAdmin)
    const isSuperAdmin = computed(() => store.getters.isSuperAdmin)
    const isBjzxAdmin = computed(() => store.getters.isBjzxAdmin)
    const permissionsLoaded = computed(() => store.getters.permissionsLoaded)

    const hasPagePermission = (pageCode: string) => {
      if (!permissionsLoaded.value) return false
      const checker = store.getters.hasPagePermission
      return typeof checker === 'function' ? checker(pageCode) : false
    }

    const hasAnyPagePermission = (pageCodes: string[]) => {
      return pageCodes.some((code) => hasPagePermission(code))
    }

    const canAccessAdminCenter = computed(() => {
      return isAdmin.value || isBjzxAdmin.value || hasPagePermission('PAGE_006')
    })

    const canAccessSuperAdminCenter = computed(() => {
      return isSuperAdmin.value || hasPagePermission('PAGE_007')
    })

    const canAccessUserDashboard = computed(() => {
      return isAdmin.value || hasPagePermission('PAGE_008')
    })

    const canAccessFeedback = computed(() => {
      return isAdmin.value || hasAnyPagePermission(['PAGE_018', 'PAGE_019'])
    })

    const canAccessQaLogs = computed(() => {
      return isSuperAdmin.value || hasPagePermission('PAGE_021')
    })

    const canAccessKnowledgeBase = computed(() => {
      return isSuperAdmin.value || hasPagePermission('PAGE_022')
    })

    const canAccessVideoCenter = computed(() => {
      return isAdmin.value || isSuperAdmin.value || hasPagePermission('PAGE_023')
    })

    const ensurePermissions = () => {
      if (isLoggedIn.value && !permissionsLoaded.value) {
        store.dispatch('getPermissions').catch(() => null)
      }
    }

    watch(isLoggedIn, (val) => {
      if (val) ensurePermissions()
    }, { immediate: true })

    // 角色标签类型
    const roleTagType = computed(() => {
      const role = userRole.value
      if (role === UserRole.SUPER_ADMIN) return 'danger'
      if (role === UserRole.ADMIN) return 'warning'
      if (isBjzxAdmin.value) return 'success'
      return 'info'
    })

    // 角色文本
    const roleText = computed(() => {
      const role = userRole.value as UserRole
      // 如果是边检智学管理员但不是管理员角色，显示边检智学管理员
      if (isBjzxAdmin.value && role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
        return '边检智学管理员'
      }
      return role ? RoleNames[role] : '普通用户'
    })

    const navigateTo = (path: string) => {
      router.push(path)
    }

    const handleCommand = (command: string) => {
      if (command === 'logout') {
        store.dispatch('logout')
      } else if (command === 'profile') {
        router.push('/profile')
      } else if (command === 'performance') {
        showPerformanceSettings.value = true
      } else if (command === 'excel-tool') {
        router.push('/excel-tool')
      } else if (command === 'report-generator') {
        router.push('/report-generator')
      } else if (command === 'data-analysis') {
        router.push('/data-analysis')
      } else if (command === 'docx-tool') {
        // 跳转到 nginx 代理的 docx 服务
        window.location.href = '/docx/'
      } else if (command === 'format-tool') {
        router.push('/format-tool')
      } else if (command === 'admin') {
        router.push('/admin')
      } else if (command === 'super-admin') {
        router.push('/super-admin')
      } else if (command === 'user-dashboard') {
        router.push('/user-dashboard')
      } else if (command === 'feedback') {
        router.push('/feedback')
      } else if (command === 'qa-logs') {
        router.push('/qa-logs')
      } else if (command === 'knowledge-base') {
        router.push('/knowledge-base')
      } else if (command === 'video-center') {
        router.push('/video-center')
      } else if (command === 'software-download') {
        router.push('/software-download')
      }
    }

    return {
      activeIndex,
      isLoggedIn,
      username,
      userPhoto,
      isAdmin,
      isSuperAdmin,
      isBjzxAdmin,
      canAccessAdminCenter,
      canAccessSuperAdminCenter,
      canAccessUserDashboard,
      canAccessFeedback,
      canAccessQaLogs,
      canAccessKnowledgeBase,
      canAccessVideoCenter,
      roleTagType,
      roleText,
      navigateTo,
      handleCommand,
      showPerformanceSettings
    }
  }
})
</script>

<style scoped>
/* 外层 nav 容器 */
.navbar-menu {
  background: transparent !important;
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
}

/* 内层 el-menu */
.navbar-inner {
  background: transparent !important;
  background-color: transparent !important;
  border-bottom: none !important;
  box-shadow: none !important;
  padding: 0 2rem;
  min-width: 100%;
  display: flex;
  align-items: center;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 穿透 Element Plus 默认样式 */
:deep(.el-menu) {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
}

:deep(.el-menu--horizontal) {
  background: transparent !important;
  background-color: transparent !important;
  border-bottom: none !important;
  --el-menu-bg-color: transparent !important;
}

:deep(.el-menu--horizontal.el-menu) {
  background: transparent !important;
  background-color: transparent !important;
  --el-menu-bg-color: transparent !important;
}

/* Logo区域 */
.navbar-brand {
  margin-right: auto;
  padding: 0 1rem 0 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.brand-link:hover {
  color: #60a5fa;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.logo-image {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-size: 32px;
  white-space: nowrap;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: 4px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* 导航菜单 */
.navbar-menu {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.navbar-menu :deep(.el-menu-item) {
  padding: 0 12px;
  font-size: 14px;
}

.nav-link {
  text-decoration: none;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.3s;
  position: relative;
}

.nav-link:hover {
  color: #2563eb;
}

.nav-link.router-link-active {
  color: #2563eb;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: #2563eb;
}

/* 右侧用户区域 */
.navbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  padding: 0 0 0 0.5rem;
  flex-shrink: 0;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: background 0.3s;
  white-space: nowrap;
}

.user-dropdown:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 默认头像样式 */
.user-dropdown .el-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.user-dropdown .el-avatar .el-icon {
  color: white;
  font-size: 18px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.role-tag {
  margin-left: 0.25rem;
  flex-shrink: 0;
}

.arrow-icon {
  color: rgba(255, 255, 255, 0.7);
}

/* 登录按钮样式 */
.navbar-right :deep(.el-button) {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-menu-btn span {
  width: 24px;
  height: 2px;
  background: #374151;
  transition: all 0.3s;
}

/* 移动端菜单 */
.mobile-menu {
  display: none;
  flex-direction: column;
  background: white;
  border-top: 1px solid #e5e7eb;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s;
}

.mobile-menu.open {
  max-height: 400px;
}

.mobile-link {
  padding: 1rem 2rem;
  text-decoration: none;
  color: #374151;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.3s;
}

.mobile-link:hover,
.mobile-link.router-link-active {
  background: #f9fafb;
  color: #2563eb;
}

.mobile-user {
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
}

.mobile-logout {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 768px) {
  .navbar-menu,
  .navbar-user {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }

  .logo-text {
    font-size: 16px;
  }
}
</style>
