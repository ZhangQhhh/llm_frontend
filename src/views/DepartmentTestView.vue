<template>
  <div class="dept-test-page">
    <div class="container">
      <header class="page-header">
        <div class="title">部门设置测试</div>
        <div class="subtitle">独立测试部门检查与设置接口</div>
      </header>

      <el-card class="info-card" shadow="hover">
        <div class="info-grid">
          <div>
            <div class="label">当前用户名</div>
            <div class="value">{{ currentUsername || '-' }}</div>
          </div>
          <div>
            <div class="label">当前部门</div>
            <div class="value">{{ currentDepartment || '未设置' }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="action-card" shadow="hover">
        <template #header>
          <div class="card-header">接口测试</div>
        </template>

        <div class="actions">
          <el-button type="primary" :loading="checkLoading" @click="checkRequired">
            检查是否需要设置部门
          </el-button>
          <el-button :loading="getLoading" @click="getDepartment">
            获取当前部门
          </el-button>
          <el-button :loading="listLoading" @click="fetchDepartmentList">
            拉取部门列表
          </el-button>
          <el-button type="warning" plain @click="openDepartmentDialog">
            打开部门选择弹窗
          </el-button>
        </div>

        <el-divider />

        <el-form label-width="90px" class="dept-form">
          <el-form-item label="选择部门">
            <el-select v-model="selectedDepartment" placeholder="请选择部门" filterable style="width: 320px">
              <el-option
                v-for="dept in departmentOptions"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="success" :loading="saveLoading" @click="submitDepartment">
              提交设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="log-card" shadow="hover">
        <template #header>
          <div class="card-header">响应日志</div>
        </template>
        <pre class="log-content">{{ responseLog || '暂无请求' }}</pre>
      </el-card>

      <DepartmentDialog ref="deptDialogRef" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import http from '@/config/api/http'
import { API_ENDPOINTS } from '@/config/api/api'
import DepartmentDialog from '@/components/DepartmentDialog.vue'

const DEFAULT_DEPARTMENTS = [
  { label: '站领导', value: '站领导' },
  { label: '办公室', value: '办公室' },
  { label: '边检大队', value: '边检大队' },
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
  name: 'DepartmentTestView',
  components: {
    DepartmentDialog
  },
  setup() {
    const store = useStore()
    const selectedDepartment = ref((store.state as any).user.department || '')
    const responseLog = ref('')
    const checkLoading = ref(false)
    const getLoading = ref(false)
    const saveLoading = ref(false)
    const listLoading = ref(false)

    const departmentOptions = ref([...DEFAULT_DEPARTMENTS])
    const deptDialogRef = ref<{ openDialog?: () => void } | null>(null)

    const currentUsername = computed(() => (store.state as any).user.username)
    const currentDepartment = computed(() => (store.state as any).user.department)

    const appendLog = (title: string, data: any) => {
      const time = new Date().toLocaleTimeString()
      const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      responseLog.value = `[${time}] ${title}\n${payload}`
    }

    const checkRequired = async () => {
      checkLoading.value = true
      try {
        const response = await http.get(API_ENDPOINTS.USER_DEPARTMENT.CHECK_DEPARTMENT_REQUIRED)
        appendLog('CHECK /user/department/check', response.data)
        const department = response.data?.department || response.data?.data?.department
        if (department) {
          store.commit('setDepartment', department)
          if (!selectedDepartment.value) {
            selectedDepartment.value = department
          }
        }
      } catch (error: any) {
        appendLog('CHECK 失败', error?.response?.data || error?.message || 'unknown error')
        ElMessage.error('检查失败')
      } finally {
        checkLoading.value = false
      }
    }

    const getDepartment = async () => {
      getLoading.value = true
      try {
        const response = await http.get(API_ENDPOINTS.USER_DEPARTMENT.GET_USER_DEPARTMENT)
        appendLog('GET /user/department', response.data)
        const department = response.data?.department || response.data?.data?.department
        if (department) {
          store.commit('setDepartment', department)
          if (!selectedDepartment.value) {
            selectedDepartment.value = department
          }
        }
      } catch (error: any) {
        appendLog('GET 失败', error?.response?.data || error?.message || 'unknown error')
        ElMessage.error('获取失败')
      } finally {
        getLoading.value = false
      }
    }

    const fetchDepartmentList = async () => {
      listLoading.value = true
      try {
        const response = await http.get(API_ENDPOINTS.USER_DEPARTMENT.GET_DEPARTMENT_LIST)
        appendLog('GET /departments', response.data)
        const list = response.data?.data ?? response.data
        if (Array.isArray(list)) {
          departmentOptions.value = list.map((item: any) => {
            if (typeof item === 'string') {
              return { label: item, value: item }
            }
            return {
              label: item.label || item.name || item.value || '未知部门',
              value: item.value || item.code || item.name || item.label || '未知部门'
            }
          })
        }
      } catch (error: any) {
        appendLog('GET 列表失败', error?.response?.data || error?.message || 'unknown error')
        ElMessage.error('拉取部门列表失败')
      } finally {
        listLoading.value = false
      }
    }

    const openDepartmentDialog = () => {
      deptDialogRef.value?.openDialog?.()
    }

    const submitDepartment = async () => {
      if (!selectedDepartment.value) {
        ElMessage.warning('请选择部门')
        return
      }

      saveLoading.value = true
      try {
        const response = await http.post(API_ENDPOINTS.USER_DEPARTMENT.UPDATE_USER_DEPARTMENT, {
          department: selectedDepartment.value
        })
        appendLog('POST /user/department', response.data)
        if (response.data?.code === 200 || response.data?.success === true) {
          store.commit('setDepartment', selectedDepartment.value)
          ElMessage.success('部门设置成功')
        } else {
          ElMessage.error(response.data?.message || '部门设置失败')
        }
      } catch (error: any) {
        appendLog('POST 失败', error?.response?.data || error?.message || 'unknown error')
        ElMessage.error('部门设置失败')
      } finally {
        saveLoading.value = false
      }
    }

    return {
      currentUsername,
      currentDepartment,
      selectedDepartment,
      departmentOptions,
      responseLog,
      checkLoading,
      getLoading,
      saveLoading,
      listLoading,
      deptDialogRef,
      checkRequired,
      getDepartment,
      fetchDepartmentList,
      submitDepartment,
      openDepartmentDialog
    }
  }
})
</script>

<style scoped>
.dept-test-page {
  min-height: calc(100vh - 60px);
  padding: 2rem 0;
  background: #f3f4f6;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.subtitle {
  margin-top: 0.5rem;
  color: #6b7280;
}

.info-card {
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.action-card {
  margin-bottom: 1.5rem;
}

.card-header {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dept-form {
  margin-top: 0.5rem;
}

.log-card {
  margin-bottom: 1.5rem;
}

.log-content {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 120px;
}
</style>
