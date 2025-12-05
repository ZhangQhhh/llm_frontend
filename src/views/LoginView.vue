<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧装饰 -->
      <div class="auth-visual">
        <div class="visual-content">
          <h2>欢迎来到</h2>
          <h1>皖美智脑</h1>
          <p>基于大语言模型的专业知识库，为边防检查工作提供精准、高效的智能问答服务</p>
          <div class="visual-features">
            <div class="feature-item">
              <el-icon class="feature-icon"><Search /></el-icon>
              <span>业务问答</span>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon"><ChatDotRound /></el-icon>
              <span>智能对话</span>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon"><Reading /></el-icon>
              <span>边检智学</span>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon"><Document /></el-icon>
              <span>公文助手</span>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon"><Phone /></el-icon>
              <span>12367 助手</span>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon"><DataLine /></el-icon>
              <span>数研报告</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="auth-form-container">
        <div class="auth-form">
          <!-- Tab切换 -->
          <div class="auth-tabs">
            <button
              class="tab-btn"
              :class="{ active: isLogin }"
              @click="isLogin = true"
            >
              登录
            </button>
            <button
              class="tab-btn"
              :class="{ active: !isLogin }"
              @click="isLogin = false"
            >
              注册
            </button>
          </div>

          <!-- 登录表单 -->
          <form v-if="isLogin" @submit.prevent="handleLogin" class="form">
            <h2 class="form-title">登录账号</h2>
            <p class="form-subtitle">使用您的警号登录系统</p>

            <div class="form-group">
              <label>警号</label>
              <input
                type="text"
                v-model="loginForm.username"
                placeholder="请输入警号"
                required
              />
            </div>

            <div class="form-group">
              <label>密码</label>
              <input
                type="password"
                v-model="loginForm.password"
                placeholder="请输入密码"
                required
              />
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="rememberMe" />
                <span>记住我</span>
              </label>
              <a href="#" class="link" @click.prevent="showForgetPassword = true">忘记密码？</a>
            </div>

            <button type="submit" class="submit-btn" :disabled="loginLoading">
              {{ loginLoading ? '登录中...' : '登录' }}
            </button>

            <div v-if="loginError" class="error-message">
              {{ loginError }}
            </div>
          </form>

          <!-- 注册表单 -->
          <form v-else @submit.prevent="handleRegister" class="form">
            <h2 class="form-title">创建账号</h2>
            <p class="form-subtitle">注册新账号开始使用</p>

            <div class="form-group">
              <label>用户名</label>
              <input
                type="text"
                v-model="registerForm.username"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div class="form-group">
              <label>密码</label>
              <input
                type="password"
                v-model="registerForm.password"
                placeholder="请输入密码（至少6位）"
                required
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label>确认密码</label>
              <input
                type="password"
                v-model="registerForm.confirmPassword"
                placeholder="请再次输入密码"
                required
              />
            </div>

            <div class="form-group">
              <label>警号</label>
              <input
                type="text"
                v-model="registerForm.policeId"
                placeholder="请输入警号"
                required
              />
            </div>

            <div class="form-group">
              <label>身份证号</label>
              <input
                type="text"
                v-model="registerForm.idCardNumber"
                placeholder="请输入身份证号"
                required
                maxlength="18"
              />
            </div>

            <button type="submit" class="submit-btn" :disabled="registerLoading">
              {{ registerLoading ? '注册中...' : '注册' }}
            </button>

            <div v-if="registerError" class="error-message">
              {{ registerError }}
            </div>
          </form>

          <!-- 返回首页 -->
          <div class="back-home">
            <router-link to="/">← 返回首页</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <el-dialog
      v-model="showForgetPassword"
      title="忘记密码"
      width="420px"
      :close-on-click-modal="false"
      class="forget-password-dialog"
    >
      <div class="forget-form">
        <p class="forget-tip">请输入您的警号和身份证号，系统将为您重置密码</p>
        
        <div class="form-group">
          <label>警号</label>
          <input
            type="text"
            v-model="forgetForm.policeId"
            placeholder="请输入警号"
          />
        </div>

        <div class="form-group">
          <label>身份证号</label>
          <input
            type="text"
            v-model="forgetForm.idCardNumber"
            placeholder="请输入身份证号"
            maxlength="18"
          />
        </div>

        <div class="form-group">
          <label>新密码</label>
          <input
            type="password"
            v-model="forgetForm.newPassword"
            placeholder="请输入新密码（至少6位）"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label>确认新密码</label>
          <input
            type="password"
            v-model="forgetForm.confirmPassword"
            placeholder="请再次输入新密码"
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showForgetPassword = false">取消</el-button>
        <el-button type="primary" @click="handleForgetPassword" :loading="forgetLoading">
          重置密码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, ChatDotRound, Reading, Document, Phone, DataLine } from '@element-plus/icons-vue';
import http from '@/config/api/http';
import { API_ENDPOINTS } from '@/config/api/api';

export default defineComponent({
  name: 'LoginView',
  components: {
    Search,
    ChatDotRound,
    Reading,
    Document,
    Phone,
    DataLine
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    // 状态
    const isLogin = ref(true);
    const rememberMe = ref(false);

    // 登录表单
    const loginForm = ref({
      username: '',
      password: ''
    });
    const loginLoading = ref(false);
    const loginError = ref('');

    // 注册表单
    const registerForm = ref({
      username: '',
      password: '',
      confirmPassword: '',
      policeId: '',
      idCardNumber: ''
    });
    const registerLoading = ref(false);
    const registerError = ref('');

    // 忘记密码
    const showForgetPassword = ref(false);
    const forgetForm = ref({
      policeId: '',
      idCardNumber: '',
      newPassword: '',
      confirmPassword: ''
    });
    const forgetLoading = ref(false);

    // 处理登录
    const handleLogin = () => {
      loginError.value = '';
      loginLoading.value = true;

      store.dispatch('login', {
        username: loginForm.value.username,
        password: loginForm.value.password,
        success: () => {
          loginLoading.value = false;
          // 获取用户信息
          store.dispatch('getinfo', {
            success: () => {
              // 登录成功后重定向
              const redirect = router.currentRoute.value.query.redirect as string;
              router.push(redirect || { name: 'home' });
            },
            error: () => {
              router.push({ name: 'home' });
            }
          });
        },
        error: (resp: any) => {
          loginLoading.value = false;
          loginError.value = resp.message || resp.error_msg || '登录失败，请重试';
        }
      });
    };

    // 处理注册
    const handleRegister = () => {
      registerError.value = '';

      // 验证密码
      if (registerForm.value.password !== registerForm.value.confirmPassword) {
        registerError.value = '两次输入的密码不一致';
        return;
      }

      if (registerForm.value.password.length < 6) {
        registerError.value = '密码长度至少为6位';
        return;
      }

      registerLoading.value = true;

      // 调用注册API
      http.post(API_ENDPOINTS.USER.REGISTER, {
        username: registerForm.value.username,
        password: registerForm.value.password,
        policeId: registerForm.value.policeId,
        idCardNumber: registerForm.value.idCardNumber
      })
        .then(response => {
          registerLoading.value = false;
          const data = response.data;
          if (data.success || data.code === 200 || data.error_msg === 'success') {
            ElMessage({
              type: 'success',
              message: '注册成功！您的账号需要等待管理员审批通过后方可使用，请耐心等待。',
              duration: 5000,
              showClose: true
            });
            isLogin.value = true;
            loginForm.value.username = registerForm.value.username;
            registerForm.value = {
              username: '',
              password: '',
              confirmPassword: '',
              policeId: '',
              idCardNumber: ''
            };
          } else {
            registerError.value = data.message || data.error_msg || '注册失败，请重试';
          }
        })
        .catch((error) => {
          registerLoading.value = false;
          registerError.value = error.response?.data?.message || error.response?.data?.error_msg || '注册失败，请检查网络连接';
        });
    };

    // 处理忘记密码
    const handleForgetPassword = async () => {
      if (!forgetForm.value.policeId || !forgetForm.value.idCardNumber || !forgetForm.value.newPassword) {
        ElMessage.warning('请填写完整信息');
        return;
      }

      if (forgetForm.value.newPassword.length < 6) {
        ElMessage.warning('密码长度至少6位');
        return;
      }

      if (forgetForm.value.newPassword !== forgetForm.value.confirmPassword) {
        ElMessage.warning('两次输入的密码不一致');
        return;
      }

      forgetLoading.value = true;
      try {
        const response = await http.post(API_ENDPOINTS.AUTH.FORGET_PASSWORD, {
          policeId: forgetForm.value.policeId,
          idCardNumber: forgetForm.value.idCardNumber,
          newPassword: forgetForm.value.newPassword
        });
        
        const data = response.data;
        if (data.success && data.code === 200) {
          ElMessage.success(data.message || '密码重置成功，请使用新密码登录');
          showForgetPassword.value = false;
          forgetForm.value = { policeId: '', idCardNumber: '', newPassword: '', confirmPassword: '' };
        } else {
          ElMessage.error(data.message || '密码重置失败');
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '密码重置失败，请稍后重试');
      } finally {
        forgetLoading.value = false;
      }
    };

    return {
      isLogin,
      rememberMe,
      loginForm,
      loginLoading,
      loginError,
      registerForm,
      registerLoading,
      registerError,
      handleLogin,
      handleRegister,
      showForgetPassword,
      forgetForm,
      forgetLoading,
      handleForgetPassword
    };
  }
});
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/nrobt.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 100%;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 左侧装饰 */
.auth-visual {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  padding: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;
}

.auth-visual::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.visual-content {
  position: relative;
  z-index: 1;
}

.visual-content h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  opacity: 0.9;
}

.visual-content h1 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  line-height: 1.3;
}

.visual-content p {
  font-size: 16px;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 3rem 0;
}

.visual-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 0.875rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 20px;
  color: #60a5fa;
}

.feature-item span:last-child {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* 右侧表单 */
.auth-form-container {
  padding: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-form {
  width: 100%;
  max-width: 400px;
}

.auth-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.tab-btn.active {
  color: #2563eb;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #2563eb;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.form-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.link {
  font-size: 14px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.875rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  text-align: center;
}

.back-home {
  margin-top: 2rem;
  text-align: center;
}

.back-home a {
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.back-home a:hover {
  color: #2563eb;
}

/* 响应式 */
@media (max-width: 968px) {
  .auth-container {
    grid-template-columns: 1fr;
  }

  .auth-visual {
    display: none;
  }

  .auth-form-container {
    padding: 3rem 2rem;
  }
}

@media (max-width: 480px) {
  .auth-page {
    padding: 1rem;
  }

  .auth-form-container {
    padding: 2rem 1.5rem;
  }

  .form-title {
    font-size: 24px;
  }
}

/* 忘记密码弹窗样式 */
.forget-form {
  padding: 0 10px;
}

.forget-tip {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.6;
}

.forget-form .form-group {
  margin-bottom: 16px;
}

.forget-form .form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.forget-form .form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.forget-form .form-group input:focus {
  outline: none;
  border-color: #2563eb;
}
</style>
