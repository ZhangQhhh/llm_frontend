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
            <el-descriptions-item label="警号">{{ policeId || '未设置' }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">
              <span v-if="idCardNumber">{{ maskedIdCard }}</span>
              <span v-else>未设置</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag type="success">正常</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 修改密码 -->
        <el-card class="profile-card password-card">
          <template #header>
            <div class="card-header">
              <span>修改密码</span>
              <el-tag type="warning" effect="plain">安全设置</el-tag>
            </div>
          </template>

          <el-alert
            title="密码安全提示"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 1.5rem"
          >
            为了您的账号安全，建议定期修改密码，密码长度至少6位
          </el-alert>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="120px"
            status-icon
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
                autocomplete="current-password"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="请输入新密码（至少6位）"
                autocomplete="new-password"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
                autocomplete="new-password"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-space>
                <el-button
                  type="primary"
                  @click="handleChangePassword"
                  :loading="changingPassword"
                  icon="Check"
                >
                  确认修改
                </el-button>
                <el-button
                  @click="resetPasswordForm"
                  :disabled="changingPassword"
                  icon="RefreshLeft"
                >
                  重置
                </el-button>
              </el-space>
            </el-form-item>
          </el-form>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Lock, Check, RefreshLeft } from '@element-plus/icons-vue';
import { RoleNames, UserRole } from '@/config/permissions';
import { API_ENDPOINTS } from '@/config/api/api';
import { fetchWithAuth } from '@/utils/request';

export default defineComponent({
  name: 'ProfileView',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    const username = computed(() => store.state.user.username);
    const email = computed(() => store.state.user.email);
    const policeId = computed(() => store.state.user.policeId);
    const idCardNumber = computed(() => store.state.user.idCardNumber);
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
    
    // 身份证号脱敏处理
    const maskedIdCard = computed(() => {
      const id = idCardNumber.value;
      if (!id || id.length < 8) return id;
      return id.slice(0, 6) + '********' + id.slice(-4);
    });

    // 修改密码相关
    const passwordFormRef = ref<FormInstance>();
    const changingPassword = ref(false);
    const passwordForm = reactive({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const passwordRules = reactive<FormRules>({
      oldPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            if (value !== passwordForm.newPassword) {
              callback(new Error('两次输入的密码不一致'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    });

    const resetPasswordForm = () => {
      passwordFormRef.value?.resetFields();
    };

    const handleChangePassword = async () => {
      if (!passwordFormRef.value) return;
      const valid = await passwordFormRef.value.validate().catch(() => false);
      if (!valid) return;

      changingPassword.value = true;
      try {
        const response = await fetchWithAuth(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: store.state.user.id,
            username: store.state.user.username,
            password: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword
          })
        });

        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('密码修改成功，请重新登录');
          resetPasswordForm();
          // 退出登录并跳转到登录页
          store.dispatch('logout');
          setTimeout(() => {
            router.push({ name: 'login' });
          }, 1500);
        } else {
          throw new Error(response.data?.message || response.data?.detail || '修改密码失败');
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '修改密码失败，请稍后重试');
      } finally {
        changingPassword.value = false;
      }
    };

    return {
      username,
      email,
      policeId,
      idCardNumber,
      roleText,
      roleTagType,
      maskedIdCard,
      passwordFormRef,
      passwordForm,
      passwordRules,
      changingPassword,
      handleChangePassword,
      resetPasswordForm,
      Lock,
      Check,
      RefreshLeft
    };
  }
});
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 60px);
  background: url('@/assets/allPic/public/robot.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
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

.password-card {
  margin-top: 1.5rem;
}

.el-form {
  max-width: 600px;
}

.el-form-item {
  margin-bottom: 1.5rem;
}
</style>
