<template>
  <div class="admin-page">
    <el-container>
      <el-header>
        <h1>管理中心</h1>
      </el-header>
      <el-main>
        <el-alert
          title="管理功能开发中"
          type="info"
          description="管理界面正在开发中，敬请期待..."
          :closable="false"
          show-icon
        />
        <div class="admin-info">
          <p>当前用户：{{ username }}</p>
          <p>用户角色：{{ roleText }}</p>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { RoleNames, UserRole } from '@/config/permissions';

export default defineComponent({
  name: 'AdminView',
  setup() {
    const store = useStore();
    
    const username = computed(() => store.state.username);
    const userRole = computed(() => store.getters.userRole);
    const roleText = computed(() => {
      const role = userRole.value as UserRole;
      return role ? RoleNames[role] : '普通用户';
    });

    return {
      username,
      roleText
    };
  }
});
</script>

<style scoped>
.admin-page {
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

.admin-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-info p {
  margin: 0.5rem 0;
  font-size: 16px;
  color: #4b5563;
}
</style>
