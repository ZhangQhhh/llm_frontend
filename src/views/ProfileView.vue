<template>
  <div class="profile-page">
    <el-container>
      <el-header>
        <h1>个人设置</h1>
      </el-header>
      <el-main>
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">{{ username }}</el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="roleTagType">{{ roleText }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ email || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag type="success">正常</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { RoleNames, UserRole } from '@/config/permissions';

export default defineComponent({
  name: 'ProfileView',
  setup() {
    const store = useStore();
    
    const username = computed(() => store.state.user.username);
    const email = computed(() => store.state.user.email);
    const userRole = computed(() => store.getters.userRole);
    
    const roleText = computed(() => {
      const role = userRole.value as UserRole;
      return role ? RoleNames[role] : '普通用户';
    });
    
    const roleTagType = computed(() => {
      const role = userRole.value;
      if (role === UserRole.SUPER_ADMIN) return 'danger';
      if (role === UserRole.ADMIN) return 'warning';
      return 'info';
    });

    return {
      username,
      email,
      roleText,
      roleTagType
    };
  }
});
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
}

.el-header {
  background: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-header h1 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.el-main {
  padding: 2rem;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}
</style>
