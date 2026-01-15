<template>
  <el-dialog 
    v-model="showDialog" 
    title="请选择您的所属部门"
    width="450px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="department-dialog">
      <div class="dialog-header">
        <div class="notice-icon">
          <el-icon size="40"><OfficeBuilding /></el-icon>
        </div>
        <p class="notice-text">
          为了更好地为您提供服务，请选择您的<strong>所属部门</strong>。
        </p>
        <p class="notice-tip">
          请根据您的实际工作部门进行选择。
        </p>
        <p class="notice-warning">
          <el-icon><Warning /></el-icon>
          注意：部门信息只能设置一次，请认真选择！
        </p>
      </div>

      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="rules" 
        label-width="80px"
        class="department-form"
      >
        <el-form-item label="当前用户名">
          <el-input :value="currentUsername" disabled />
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-select 
            v-model="formData.department" 
            placeholder="请选择您的所属部门"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.value"
              :label="dept.label"
              :value="dept.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="dialog-footer">
        <el-button 
          type="primary" 
          :loading="loading"
          @click="handleSubmit"
        >
          确认选择
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, reactive } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { OfficeBuilding, Warning } from '@element-plus/icons-vue'
import http from '@/config/api/http'
import { API_ENDPOINTS } from '@/config/api/api'

// 部门选项
const DEPARTMENT_OPTIONS = [
  { label: '站领导', value: '站领导' },
  { label: '办公室', value: '办公室' },
  { label: '边检处', value: '边检处' },
  { label: '政治处', value: '政治处' },
  { label: '后勤处', value: '后勤处' },
  { label: '执勤一队', value: '执勤一队' },
  { label: '执勤二队', value: '执勤二队' },
  { label: '执勤三队', value: '执勤三队' },
  { label: '执勤四队', value: '执勤四队' },
  { label: '执勤五队', value: '执勤五队' },
  { label: '执勤六队', value: '执勤六队' }
]

export default defineComponent({
  name: 'DepartmentDialog',
  components: {
    OfficeBuilding,
    Warning
  },
  setup() {
    const store = useStore()
    const showDialog = ref(false)
    const loading = ref(false)
    const formRef = ref<FormInstance>()
    const hasChecked = ref(false)  // 是否已检查过

    const formData = reactive({
      department: ''
    })

    // 获取当前用户名
    const currentUsername = computed(() => store.state.user.username)
    
    // 获取用户是否已登录
    const isLoggedIn = computed(() => store.state.user.is_login)

    // 获取用户是否已改名 - 部门弹窗依赖改名完成
    const hasChangedName = computed(() => store.state.user.hasChangedName)

    // 部门选项
    const departmentOptions = ref(DEPARTMENT_OPTIONS)

    // 表单验证规则
    const rules: FormRules = {
      department: [
        { required: true, message: '请选择所属部门', trigger: 'change' }
      ]
    }

    // 从后端获取用户是否已设置部门
    const checkHasDepartment = async () => {
      console.log('[DepartmentDialog] 开始检查部门')
      console.log('[DepartmentDialog] hasChecked:', hasChecked.value)
      console.log('[DepartmentDialog] hasChangedName:', hasChangedName.value)
      console.log('[DepartmentDialog] store.state.user.department:', store.state.user.department)
      console.log('[DepartmentDialog] store.getters.hasDepartment:', store.getters.hasDepartment)
      
      if (hasChecked.value) {
        console.log('[DepartmentDialog] 已检查过，跳过')
        return
      }
      
      // 确保用户已改名才检查部门
      if (!hasChangedName.value) {
        console.log('[DepartmentDialog] 用户还未改名，跳过部门检查')
        return
      }
      
      // 先检查本地 store 中是否已有部门信息
      if (store.getters.hasDepartment) {
        console.log('[DepartmentDialog] 用户已设置部门，跳过部门检查:', store.state.user.department)
        hasChecked.value = true
        return
      }
      
      console.log('[DepartmentDialog] 本地无部门信息，调用后端API')
      try {
        const response = await http.get(API_ENDPOINTS.USER_DEPARTMENT.CHECK_DEPARTMENT_REQUIRED)
        // 后端返回 { department: string | null }
        const result = response.data
        
        console.log('[DepartmentDialog] 后端返回结果:', result)
        
        if (!result.department) {
          console.log('[DepartmentDialog] 后端返回部门为空，显示弹窗')
          showDialog.value = true
        } else {
          console.log('[DepartmentDialog] 后端返回部门:', result.department)
        }
        
        // 更新 store 中的状态
        if (result.department) {
          store.commit('setDepartment', result.department)
        }
        
        hasChecked.value = true
      } catch (error) {
        console.error('[DepartmentDialog] 获取用户部门信息失败:', error)
      }
    }

    // 监听登录状态和改名状态变化
    watch(
      [isLoggedIn, hasChangedName],
      ([loggedIn, changedName]) => {
        if (loggedIn && changedName) {
          // 只有在登录状态且已改名的情况下才检查部门
          checkHasDepartment()
        } else if (!loggedIn) {
          hasChecked.value = false
        }
      },
      { immediate: true }
    )

    // 提交部门选择
    const handleSubmit = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()
        
        loading.value = true
        
        const response = await http.post(API_ENDPOINTS.USER_DEPARTMENT.UPDATE_USER_DEPARTMENT, {
          department: formData.department
        })

        // 后端返回 { code: 200, message: "success", data: null }
        if (response.data.code === 200) {
          ElMessage.success('部门设置成功！')
          
          // 更新 store 中的部门状态
          store.commit('setDepartment', formData.department)
          
          showDialog.value = false
        } else {
          ElMessage.error(response.data.message || '设置失败，请稍后重试')
        }
      } catch (error: any) {
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else if (error !== 'cancel') {
          // 不是表单验证错误
          ElMessage.error('设置失败，请稍后重试')
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
      departmentOptions,
      handleSubmit
    }
  }
})
</script>

<style scoped>
.department-dialog {
  padding: 0.5rem;
}

.dialog-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.notice-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
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
  color: #67c23a;
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

.department-form {
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
