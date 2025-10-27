<template>
  <el-menu
    :default-active="activeIndex"
    mode="horizontal"
    :ellipsis="false"
    background-color="#ffffff"
    text-color="#4b5563"
    active-text-color="#2563eb"
    class="navbar-menu"
  >
    <!-- Logo -->
    <div class="navbar-brand">
      <router-link to="/" class="brand-link">
        <span class="logo-icon">🛡️</span>
        <span class="logo-text">边检知识问答</span>
      </router-link>
    </div>

    <!-- 导航菜单项 -->
    <el-menu-item index="/" @click="navigateTo('/')">
      <el-icon><HomeFilled /></el-icon>
      <span>首页</span>
    </el-menu-item>
    
    <el-menu-item index="/knowledge-qa" @click="navigateTo('/knowledge-qa')">
      <el-icon><Reading /></el-icon>
      <span>知识问答</span>
    </el-menu-item>
    
    <el-menu-item 
      index="/conversation" 
      @click="navigateTo('/conversation')"
      v-if="isLoggedIn"
    >
      <el-icon><ChatDotRound /></el-icon>
      <span>多轮对话</span>
    </el-menu-item>

    <!-- 管理入口（仅管理员可见） -->
    <el-menu-item 
      index="/admin" 
      @click="navigateTo('/admin')"
      v-if="isAdmin"
    >
      <el-icon><Setting /></el-icon>
      <span>管理中心</span>
    </el-menu-item>

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
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <el-icon><User /></el-icon>
                <span>{{ username }}</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="profile">
                <el-icon><Setting /></el-icon>
                <span>个人设置</span>
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
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { 
  HomeFilled, 
  Reading, 
  ChatDotRound, 
  Setting, 
  User, 
  ArrowDown, 
  SwitchButton 
} from '@element-plus/icons-vue'
import { RoleNames, UserRole } from '@/config/permissions'

export default defineComponent({
  name: 'NavBar',
  components: {
    HomeFilled,
    Reading,
    ChatDotRound,
    Setting,
    User,
    ArrowDown,
    SwitchButton
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    const activeIndex = computed(() => route.path)
    const isLoggedIn = computed(() => store.state.is_login)
    const username = computed(() => store.state.username || '用户')
    const userPhoto = computed(() => store.state.photo)
    const userRole = computed(() => store.getters.userRole)
    const isAdmin = computed(() => store.getters.isAdmin)

    // 角色标签类型
    const roleTagType = computed(() => {
      const role = userRole.value
      if (role === UserRole.SUPER_ADMIN) return 'danger'
      if (role === UserRole.ADMIN) return 'warning'
      return 'info'
    })

    // 角色文本
    const roleText = computed(() => {
      const role = userRole.value as UserRole
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
      }
    }

    return {
      activeIndex,
      isLoggedIn,
      username,
      userPhoto,
      isAdmin,
      roleTagType,
      roleText,
      navigateTo,
      handleCommand
    }
  }
})
</script>

<style scoped>
/* Element UI Menu 样式覆盖 */
.navbar-menu {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0 2rem;
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
  color: #1f2937;
  transition: color 0.3s;
}

.brand-link:hover {
  color: #2563eb;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 18px;
  white-space: nowrap;
}

/* 导航菜单 */
.navbar-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
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
  padding: 0 0 0 1rem;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-dropdown:hover {
  background: #f3f4f6;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.role-tag {
  margin-left: 0.25rem;
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
