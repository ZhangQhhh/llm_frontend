<template>
  <el-dialog 
    v-model="showDialog" 
    title="请修改用户名为真实姓名"
    width="450px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="change-name-dialog">
      <div class="dialog-header">
        <div class="notice-icon">
          <el-icon size="40"><User /></el-icon>
        </div>
        <p class="notice-text">
          为了更好地为您提供服务，请将用户名修改为您的<strong>真实姓名</strong>。
        </p>
        <p class="notice-tip">
          若当前已经是真实姓名，则再次输入即可。
        </p>
        <p class="notice-warning">
          <el-icon><Warning /></el-icon>
          注意：用户名只能修改一次，请认真填写！
        </p>
      </div>

      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="rules" 
        label-width="80px"
        class="name-form"
      >
        <el-form-item label="当前用户名">
          <el-input :value="currentUsername" disabled />
        </el-form-item>
        <el-form-item label="真实姓名" prop="newName">
          <el-input 
            v-model="formData.newName" 
            placeholder="请输入您的真实姓名"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="确认姓名" prop="confirmName">
          <el-input 
            v-model="formData.confirmName" 
            placeholder="请再次输入您的真实姓名"
            maxlength="20"
          />
        </el-form-item>
      </el-form>

      <div class="dialog-footer">
        <el-button 
          type="primary" 
          :loading="loading"
          @click="handleSubmit"
        >
          确认修改
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, reactive } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { User, Warning } from '@element-plus/icons-vue'
import http from '@/config/api/http'
import { API_ENDPOINTS } from '@/config/api/api'

export default defineComponent({
  name: 'ChangeNameDialog',
  components: {
    User,
    Warning
  },
  emits: ['completed'],  // 定义事件
  setup(props, { emit }) {  // 解构 emit
    const store = useStore()
    const showDialog = ref(false)
    const loading = ref(false)
    const formRef = ref<FormInstance>()
    const hasChecked = ref(false)  // 是否已检查过

    const formData = reactive({
      newName: '',
      confirmName: ''
    })

    // 获取当前用户名
    const currentUsername = computed(() => store.state.user.username)
    
    // 获取用户是否已登录
    const isLoggedIn = computed(() => store.state.user.is_login)

    // 表单验证规则
    const rules: FormRules = {
      newName: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' },
        { 
          pattern: /^[\u4e00-\u9fa5a-zA-Z·]+$/, 
          message: '姓名只能包含中文、英文字母和间隔号', 
          trigger: 'blur' 
        }
      ],
      confirmName: [
        { required: true, message: '请再次输入真实姓名', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== formData.newName) {
              callback(new Error('两次输入的姓名不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }

    // 从后端获取用户是否已修改过用户名
    const checkHasChangedName = async () => {
      if (hasChecked.value) return
      
      try {
        const response = await http.get(API_ENDPOINTS.AUTH.USER_INFO)
        // 后端返回 { id, username, email, hasChangedName }
        const userInfo = response.data
        
        if (userInfo.hasChangedName === false) {
          showDialog.value = true
        }
        
        // 更新 store 中的状态
        store.commit('setHasChangedName', userInfo.hasChangedName)
        hasChecked.value = true
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }

    // 监听登录状态变化
    watch(
      isLoggedIn,
      (loggedIn) => {
        if (loggedIn) {
          checkHasChangedName()
        } else {
          hasChecked.value = false
        }
      },
      { immediate: true }
    )

    // 提交修改
    const handleSubmit = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()
        
        loading.value = true
        
        const response = await http.post(API_ENDPOINTS.AUTH.CHANGE_NAME, {
          newUsername: formData.newName
        })

        // 后端返回 { code: 200, message: "success", data: null }
        if (response.data.code === 200) {
          ElMessage.success('用户名修改成功！')
          
          // 更新 store 中的用户名和 hasChangedName 状态
          store.commit('updateUsername', formData.newName)
          store.commit('setHasChangedName', true)
          
          showDialog.value = false
          
          // 触发改名完成事件
          emit('completed')
        } else {
          ElMessage.error(response.data.message || '修改失败，请稍后重试')
        }
      } catch (error: any) {
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else if (error !== 'cancel') {
          // 不是表单验证错误
          ElMessage.error('修改失败，请稍后重试')
        }
      } finally {
        loading.value = false
      }
    }

    return {
      showDialog,
      loading,
      formRef,
      formData,
      rules,
      currentUsername,
      handleSubmit
    }
  }
})
</script>

<style scoped>
.change-name-dialog {
  padding: 0.5rem;
}

.dialog-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.notice-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
}

.notice-text {
  font-size: 1rem;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

.notice-text strong {
  color: #409eff;
}

.notice-tip {
  font-size: 0.9rem;
  color: #67c23a;
  margin-bottom: 0.75rem;
}

.notice-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.name-form {
  margin-top: 1.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #ebeef5;
}

.dialog-footer .el-button {
  width: 150px;
}
</style>
