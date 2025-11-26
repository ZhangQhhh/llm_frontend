<template>
  <div class="super-admin-page">
    <div class="container">
      <header class="page-header">
        <div class="header-content">
          <h1>超级管理员中心</h1>
          <el-tag type="danger" effect="dark">SUPER ADMIN</el-tag>
        </div>
        <p class="subtitle">专属的高权限操作面板，请谨慎执行敏感操作</p>
        <el-alert
          class="header-alert"
          title="创建管理员后，请立即通知对方完成首次密码修改"
          type="warning"
          effect="dark"
          show-icon
        />
      </header>

      <el-row :gutter="20">
        <el-col :xs="24" :md="16">
          <!-- 账号审核 -->
          <el-card class="card approval-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>账号审核</span>
                <div class="card-actions">
                  <el-tag type="warning" v-if="pendingUsers.length > 0">
                    待审核：{{ pendingUsers.length }} 个
                  </el-tag>
                  <el-button type="primary" plain @click="loadPendingUsers" :loading="loadingPending" :icon="Refresh" size="small">
                    刷新
                  </el-button>
                </div>
              </div>
            </template>

            <div class="approval-body">
              <div v-if="loadingPending" class="list-loading">
                <el-skeleton :rows="3" animated />
              </div>
              <el-empty v-else-if="pendingUsers.length === 0" description="暂无待审核账号">
                <el-button type="primary" plain @click="loadPendingUsers">刷新数据</el-button>
              </el-empty>
              <el-table
                v-else
                :data="pendingUsers"
                border
                size="small"
                stripe
                style="width: 100%"
              >
                <el-table-column prop="username" label="用户名" min-width="120" />
                <el-table-column prop="policeId" label="警号" min-width="100">
                  <template #default="scope">{{ scope.row.policeId || scope.row.police_id || '—' }}</template>
                </el-table-column>
                <el-table-column prop="idCardNumber" label="身份证" min-width="140">
                  <template #default="scope">
                    <span v-if="scope.row.idCardNumber || scope.row.id_card_number">
                      {{ maskIdCard(scope.row.idCardNumber || scope.row.id_card_number) }}
                    </span>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="注册时间" min-width="150">
                  <template #default="scope">{{ scope.row.created_at || scope.row.createdAt || '—' }}</template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="scope">
                    <el-button
                      type="success"
                      plain
                      size="small"
                      :loading="approvalLoadingId === (scope.row.id || scope.row.username)"
                      @click="approveUser(scope.row)"
                    >
                      批准
                    </el-button>
                    <el-button
                      type="danger"
                      plain
                      size="small"
                      :loading="rejectLoadingId === (scope.row.id || scope.row.username)"
                      @click="rejectUser(scope.row)"
                    >
                      拒绝
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>

          <el-card class="card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>创建管理员账号</span>
                <el-tag type="danger" effect="plain">仅超级管理员可操作</el-tag>
              </div>
            </template>

            <el-form
              ref="formRef"
              label-width="120px"
              :model="form"
              :rules="rules"
              status-icon
            >
              <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" placeholder="请输入管理员用户名">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="警号" prop="policeId">
                <el-input v-model="form.policeId" placeholder="请输入警号">
                  <template #prefix>
                    <el-icon><Postcard /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="身份证号" prop="idCardNumber">
                <el-input v-model="form.idCardNumber" placeholder="请输入身份证号" maxlength="18">
                  <template #prefix>
                    <el-icon><CreditCard /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="邮箱（可选）" prop="email">
                <el-input v-model="form.email" placeholder="请输入管理员邮箱（可选）">
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="初始密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  show-password
                  placeholder="请输入初始密码"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-space>
                  <el-button type="primary" @click="handleCreate" :loading="creating" icon="CirclePlus">
                    创建管理员
                  </el-button>
                  <el-button @click="resetForm" :disabled="creating" icon="RefreshRight">重置</el-button>
                </el-space>
              </el-form-item>
            </el-form>

            <transition name="fade">
              <el-result
                v-if="lastCreated.username"
                icon="success"
                title="管理员创建成功"
                :sub-title="`已为 ${lastCreated.username} (${lastCreated.email}) 开通管理员权限`"
                class="success-result"
              >
                <template #extra>
                  <el-tag type="success" effect="plain">
                    初始密码：已通过安全通道发送
                  </el-tag>
                </template>
              </el-result>
            </transition>
          </el-card>

          <el-card class="card admin-list-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>现有管理员列表</span>
                <div class="card-actions">
                  <el-input
                    v-model="searchKeyword"
                    size="small"
                    placeholder="搜索用户名/邮箱"
                    clearable
                    @clear="applySearch"
                    @keyup.enter="applySearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" plain @click="loadAdmins" :loading="loadingAdmins" :icon="Refresh" size="small">
                    刷新
                  </el-button>
                </div>
              </div>
            </template>

            <div class="admin-list-body">
              <div v-if="loadingAdmins" class="list-loading">
                <el-skeleton :rows="3" animated />
              </div>
              <el-empty v-else-if="filteredAdmins.length === 0" description="暂无管理员数据">
                <el-button type="primary" plain @click="loadAdmins">刷新数据</el-button>
              </el-empty>
              <div v-else class="admin-list-scroll">
                <div class="admin-list-grid">
                  <div class="admin-card" v-for="admin in filteredAdmins" :key="admin.id || admin.username">
                    <div class="admin-card-header">
                      <div class="admin-identity">
                        <el-avatar :size="40">
                          {{ admin.username?.slice(0, 1)?.toUpperCase() || 'A' }}
                        </el-avatar>
                        <div class="admin-info">
                          <div class="admin-name">{{ admin.username }}</div>
                          <div class="admin-email">{{ admin.email || '未填写邮箱' }}</div>
                        </div>
                      </div>
                      <el-tag type="success" effect="plain">管理员</el-tag>
                    </div>
                    <el-descriptions :column="1" size="small" class="admin-meta">
                      <el-descriptions-item label="创建时间">
                        {{ formatDate(admin.create_at || admin.created_at || admin.createAt) }}
                      </el-descriptions-item>
                      <el-descriptions-item label="账号状态">
                        <el-tag v-if="admin.status" size="small" type="info">{{ admin.status }}</el-tag>
                        <span v-else>正常</span>
                      </el-descriptions-item>
                    </el-descriptions>
                    <div class="admin-card-actions">
                      <el-button 
                        type="primary" 
                        plain 
                        size="small" 
                        :icon="Lock"
                        @click="openResetPasswordDialog(admin)"
                      >
                        重置密码
                      </el-button>
                      <el-popconfirm
                        title="确认降级为普通用户？"
                        confirm-button-text="确定"
                        cancel-button-text="取消"
                        icon-color="#E6A23C"
                        @confirm="handleDowngrade(admin)"
                      >
                        <template #reference>
                          <el-button type="warning" plain size="small" :icon="ArrowDownBold">
                            降级
                          </el-button>
                        </template>
                      </el-popconfirm>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 提升用户为管理员 -->
          <el-card class="card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>提升用户为管理员</span>
                <el-tag type="warning" effect="plain">权限提升</el-tag>
              </div>
            </template>

            <el-alert
              title="提示"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 1rem"
            >
              输入现有普通用户的用户名，将其提升为管理员
            </el-alert>

            <el-form
              ref="upgradeFormRef"
              :model="upgradeForm"
              :rules="upgradeRules"
              label-width="100px"
              status-icon
            >
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="upgradeForm.username" 
                  placeholder="请输入要提升的用户名"
                  clearable
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-space>
                  <el-button 
                    type="success" 
                    @click="handleUpgrade" 
                    :loading="upgrading"
                    icon="Top"
                  >
                    提升为管理员
                  </el-button>
                  <el-button 
                    @click="resetUpgradeForm" 
                    :disabled="upgrading"
                  >
                    重置
                  </el-button>
                </el-space>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="8">
          <el-card class="card quick-tips" shadow="never">
            <template #header>
              <div class="card-header">
                <span>安全提示</span>
              </div>
            </template>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="权限范围">仅限超级管理员访问</el-descriptions-item>
              <el-descriptions-item label="角色赋予">后端强制设置为 ADMIN</el-descriptions-item>
              <el-descriptions-item label="密码策略">建议配置 12 位以上复杂密码</el-descriptions-item>
            </el-descriptions>
            <el-divider content-position="left">操作流程</el-divider>
            <el-timeline>
              <el-timeline-item type="primary" :timestamp="'Step 1'">
                填写管理员基本信息（用户名 / 警号 / 身份证号 / 邮箱 / 初始密码）
              </el-timeline-item>
              <el-timeline-item type="success" :timestamp="'Step 2'">
                提交创建，系统校验并调用后端接口
              </el-timeline-item>
              <el-timeline-item type="warning" :timestamp="'Step 3'">
                通知新管理员登录并在个人设置中修改密码
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>运维建议</span>
          </div>
        </template>
        <ul class="instruction-list">
          <li>建议定期盘点管理员账号，并撤销离职或不再需要的账号。</li>
          <li>搭配后台审计日志功能，确保敏感操作可追溯。</li>
          <li>如需停用管理员账号，请联系后端或数据库维护人员。</li>
        </ul>
      </el-card>
    </div>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置管理员密码"
      width="500px"
      :close-on-click-modal="false"
      @close="handleResetDialogClose"
    >
      <el-alert
        title="安全提示"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 1.5rem"
      >
        重置后请立即通知管理员修改密码
      </el-alert>
      
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
        status-icon
      >
        <el-form-item label="管理员">
          <el-input :value="currentResetAdmin?.username" disabled>
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordForm.newPassword"
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
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPasswordForm.confirmPassword"
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
      </el-form>

      <template #footer>
        <el-space>
          <el-button @click="resetPasswordDialogVisible = false" :disabled="resettingPassword">
            取消
          </el-button>
          <el-button type="primary" @click="handleResetPassword" :loading="resettingPassword">
            确认重置
          </el-button>
        </el-space>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CirclePlus, RefreshRight, User, Message, Lock, ArrowDownBold, Refresh, Search, Postcard, CreditCard, Top } from '@element-plus/icons-vue'
import { API_ENDPOINTS } from '@/config/api/api'
import { fetchWithAuth, getApiUrl } from '@/utils/request'

interface CreateAdminPayload {
  username: string
  policeId: string
  idCardNumber: string
  email: string
  password: string
}

interface AdminUser {
  id?: string
  username: string
  email?: string
  role?: string
  created_at?: string
  create_at?: string
  createAt?: string
  status?: string
}

export default defineComponent({
  name: 'SuperAdminView',
  setup() {
    const form = reactive<CreateAdminPayload>({
      username: '',
      policeId: '',
      idCardNumber: '',
      email: '',
      password: ''
    })

    const creating = ref(false)
    const formRef = ref<FormInstance>()
    const lastCreated = ref<{ username: string; email: string }>({ username: '', email: '' })
    const adminList = ref<AdminUser[]>([])
    const loadingAdmins = ref(false)
    const searchKeyword = ref('')
    const pendingUsers = ref<AdminUser[]>([])
    const loadingPending = ref(false)
    const approvalLoadingId = ref<string | null>(null)
    const rejectLoadingId = ref<string | null>(null)

    // 重置密码相关状态
    const resetPasswordDialogVisible = ref(false)
    const resetPasswordFormRef = ref<FormInstance>()
    const currentResetAdmin = ref<AdminUser | null>(null)
    const resettingPassword = ref(false)
    const resetPasswordForm = reactive({
      newPassword: '',
      confirmPassword: ''
    })

    // 提升用户相关状态
    const upgradeFormRef = ref<FormInstance>()
    const upgrading = ref(false)
    const upgradeForm = reactive({
      username: ''
    })

    const rules = reactive<FormRules<CreateAdminPayload>>({
      username: [
        { required: true, message: '请输入管理员用户名', trigger: 'blur' },
        { min: 3, message: '用户名至少 3 个字符', trigger: 'blur' }
      ],
      policeId: [
        { required: true, message: '请输入警号', trigger: 'blur' },
        { pattern: /^[0-9]+$/, message: '警号只能包含数字', trigger: 'blur' }
      ],
      idCardNumber: [
        { required: true, message: '请输入身份证号', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
            if (!idCardRegex.test(value)) {
              callback(new Error('身份证号格式不正确'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      email: [
        {
          validator: (_rule, value, callback) => {
            if (!value) {
              callback()
              return
            }
            const emailRegex = /^[\w-.]+@[\w-]+\.[A-Za-z]{2,}$/
            if (!emailRegex.test(value)) {
              callback(new Error('邮箱格式不正确'))
            } else {
              callback()
            }
          },
          trigger: ['blur', 'change']
        }
      ],
      password: [
        { required: true, message: '请输入初始密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' }
      ]
    })

    const resetPasswordRules = reactive<FormRules>({
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            if (value !== resetPasswordForm.newPassword) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    })

    const upgradeRules = reactive<FormRules>({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, message: '用户名至少 3 个字符', trigger: 'blur' }
      ]
    })

    const resetForm = () => {
      formRef.value?.resetFields()
    }

    const handleCreate = async () => {
      if (!formRef.value) return
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return
      creating.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.CREATE_ADMIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            policeId: form.policeId,
            idCardNumber: form.idCardNumber,
            email: form.email,
            password: form.password
          })
        })

        if (response.ok && response.data.code === 200) {
          lastCreated.value = {
            username: form.username,
            email: form.email
          }
          ElMessage.success('管理员创建成功')
          resetForm()
          loadAdmins()
        } else {
          const message = response.data?.message || response.data?.detail || '创建失败，请稍后重试'
          ElMessage.error(message)
          console.error('创建管理员失败:', response.data)
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '创建失败，请稍后重试')
      } finally {
        creating.value = false
      }
    }

    const loadAdmins = async () => {
      loadingAdmins.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.LIST_ADMINS))
        if (response.ok) {
          const dataSource = response.data?.data?.list || response.data?.data?.admins || response.data || []
          adminList.value = Array.isArray(dataSource) ? dataSource : (dataSource.items || [])
        } else {
          throw new Error(response.data?.message || '加载管理员列表失败')
        }
      } catch (error: any) {
        adminList.value = []
        ElMessage.error(error?.message || '加载管理员列表失败')
      } finally {
        loadingAdmins.value = false
      }
    }

    const handleDowngrade = async (admin: AdminUser) => {
      try {
        await ElMessageBox.confirm(
          `确定要将管理员【${admin.username}】降级为普通用户吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )

        const payload = {
          id: admin.id,
          username: admin.username
        }

        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.DOWNGRADE_ADMIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok && response.data?.code === 200) {
          ElMessage.success('降级成功')
          loadAdmins()
        } else {
          throw new Error(response.data?.message || '降级失败，请稍后重试')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '降级失败，请稍后重试')
      }
    }

    const filteredAdmins = computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return adminList.value
      return adminList.value.filter((admin) => {
        const username = admin.username?.toLowerCase() || ''
        const email = admin.email?.toLowerCase() || ''
        return username.includes(keyword) || email.includes(keyword)
      })
    })

    const applySearch = () => {
      searchKeyword.value = searchKeyword.value.trim()
    }

    const loadPendingUsers = async () => {
      loadingPending.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.PENDING_USERS))
        if (response.ok) {
          // 支持新的 API 格式: { success: true, code: 200, message: "...", data: { list: [...] } }
          const raw = response.data?.data?.list || response.data?.list || response.data?.users || response.data || []
          const list = Array.isArray(raw) ? raw : (raw.items || [])
          pendingUsers.value = list
        } else {
          throw new Error(response.data?.message || '加载待审核用户列表失败')
        }
      } catch (error: any) {
        pendingUsers.value = []
        ElMessage.error(error?.message || '加载待审核用户列表失败')
      } finally {
        loadingPending.value = false
      }
    }

    const approveUser = async (user: AdminUser) => {
      approvalLoadingId.value = user.id || user.username
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.APPROVE_USER), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('账号已批准')
          await loadPendingUsers()
        } else {
          throw new Error(response.data?.message || '批准失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '批准失败，请稍后重试')
      } finally {
        approvalLoadingId.value = null
      }
    }

    const rejectUser = async (user: AdminUser) => {
      try {
        await ElMessageBox.confirm(
          `确定要拒绝用户【${user.username}】的注册申请吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )
        rejectLoadingId.value = user.id || user.username
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.REJECT_USER), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('已拒绝该用户的注册申请')
          await loadPendingUsers()
        } else {
          throw new Error(response.data?.message || '拒绝失败，请稍后重试')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '拒绝失败，请稍后重试')
      } finally {
        rejectLoadingId.value = null
      }
    }

    const openResetPasswordDialog = (admin: AdminUser) => {
      currentResetAdmin.value = admin
      resetPasswordForm.newPassword = ''
      resetPasswordForm.confirmPassword = ''
      resetPasswordDialogVisible.value = true
      // 清除之前的验证错误
      setTimeout(() => {
        resetPasswordFormRef.value?.clearValidate()
      }, 0)
    }

    const handleResetDialogClose = () => {
      resetPasswordForm.newPassword = ''
      resetPasswordForm.confirmPassword = ''
      currentResetAdmin.value = null
      resetPasswordFormRef.value?.clearValidate()
    }

    const handleResetPassword = async () => {
      if (!resetPasswordFormRef.value || !currentResetAdmin.value) return
      
      const valid = await resetPasswordFormRef.value.validate().catch(() => false)
      if (!valid) return

      resettingPassword.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.RESET_ADMIN_PASSWORD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentResetAdmin.value.id,
            username: currentResetAdmin.value.username,
            newPassword: resetPasswordForm.newPassword,
            // rawPassword: "NONE" // 这里不需要填写原密码
          })
        })

        if (response.ok && response.data?.code === 200) {
          ElMessage.success(`已成功重置管理员【${currentResetAdmin.value.username}】的密码`)
          resetPasswordDialogVisible.value = false
          handleResetDialogClose()
        } else {
          throw new Error(response.data?.message || '重置密码失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '重置密码失败，请稍后重试')
      } finally {
        resettingPassword.value = false
      }
    }

    const resetUpgradeForm = () => {
      upgradeFormRef.value?.resetFields()
    }

    const handleUpgrade = async () => {
      if (!upgradeFormRef.value) return
      const valid = await upgradeFormRef.value.validate().catch(() => false)
      if (!valid) return

      try {
        await ElMessageBox.confirm(
          `确定要将用户【${upgradeForm.username}】提升为管理员吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )

        upgrading.value = true
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.UPGRADE_ADMIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: upgradeForm.username
          })
        })

        if (response.ok && response.data?.code === 200) {
          ElMessage.success(`已成功将用户【${upgradeForm.username}】提升为管理员`)
          resetUpgradeForm()
          loadAdmins()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '提升失败，请稍后重试')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '提升失败，请稍后重试')
      } finally {
        upgrading.value = false
      }
    }

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '—'
      try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return dateStr
      }
    }

    const maskIdCard = (idCard: string) => {
      if (!idCard || idCard.length < 8) return idCard
      return idCard.slice(0, 6) + '********' + idCard.slice(-4)
    }

    onMounted(() => {
      loadAdmins()
      loadPendingUsers()
    })

    return {
      form,
      creating,
      formRef,
      rules,
      lastCreated,
      adminList,
      loadingAdmins,
      searchKeyword,
      filteredAdmins,
      pendingUsers,
      loadingPending,
      approvalLoadingId,
      rejectLoadingId,
      resetPasswordDialogVisible,
      resetPasswordFormRef,
      resetPasswordForm,
      resetPasswordRules,
      currentResetAdmin,
      resettingPassword,
      upgradeFormRef,
      upgradeForm,
      upgradeRules,
      upgrading,
      CirclePlus,
      RefreshRight,
      User,
      Message,
      Lock,
      ArrowDownBold,
      Refresh,
      Search,
      Postcard,
      CreditCard,
      Top,
      handleCreate,
      resetForm,
      loadAdmins,
      handleDowngrade,
      applySearch,
      loadPendingUsers,
      approveUser,
      rejectUser,
      openResetPasswordDialog,
      handleResetDialogClose,
      handleResetPassword,
      handleUpgrade,
      resetUpgradeForm,
      formatDate,
      maskIdCard
    }
  }
})
</script>

<style scoped>
.super-admin-page {
  min-height: calc(100vh - 60px);
  background: url('@/assets/allPic/public/robot.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 2rem 0;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.page-header h1 {
  margin: 0;
  color: #1f2937;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.header-alert {
  margin-top: 1rem;
}

.card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-actions :deep(.el-input__wrapper) {
  background-color: #f9fafb;
  box-shadow: none;
}

.instruction-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #4b5563;
}

.instruction-list code {
  background: #fef3c7;
  padding: 0 4px;
  border-radius: 4px;
}

.quick-tips {
  height: 100%;
}

.success-result {
  margin-top: 1.5rem;
}

.admin-list-scroll {
  margin-top: 1rem;
}

.admin-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.admin-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.admin-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.admin-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-info {
  display: flex;
  flex-direction: column;
}

.admin-name {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
}

.admin-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.admin-meta {
  background: #f9fafb;
  border-radius: 10px;
  padding: 0.75rem;
}

.admin-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.list-loading {
  padding: 1.5rem 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.approval-card {
  margin-bottom: 1.5rem;
}

.approval-body {
  min-height: 200px;
}
</style>
