<template>
  <div class="admin-page">
    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <h1>管理中心</h1>
        <p class="subtitle">{{ username }} ({{ roleText }})</p>
      </header>

      <el-tabs v-model="activeTab" type="border-card">
        <!-- 账号审核 -->
        <el-tab-pane label="账号审核" name="approval">
          <div class="tab-content">
            <div class="action-bar">
              <el-button type="primary" @click="loadPendingUsers" :loading="loadingPending" :icon="Refresh">
                刷新待审核列表
              </el-button>
              <el-tag type="warning" v-if="pendingUsers.length > 0">
                待审核：{{ pendingUsers.length }} 个账号
              </el-tag>
            </div>

            <div v-if="loadingPending" style="text-align: center; padding: 40px">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            </div>
            <el-empty v-else-if="pendingUsers.length === 0" description="暂无待审核账号" />
            <el-table
              v-else
              :data="pendingUsers"
              border
              size="small"
              stripe
              style="width: 100%; margin-top: 1rem"
            >
              <el-table-column prop="username" label="用户名" min-width="140" />
              <el-table-column prop="policeId" label="警号" min-width="120">
                <template #default="scope">{{ scope.row.policeId || scope.row.police_id || '—' }}</template>
              </el-table-column>
              <el-table-column prop="idCardNumber" label="身份证号" min-width="180">
                <template #default="scope">
                  <span v-if="scope.row.idCardNumber || scope.row.id_card_number">
                    {{ maskIdCard(scope.row.idCardNumber || scope.row.id_card_number) }}
                  </span>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="注册时间" min-width="160">
                <template #default="scope">{{ scope.row.created_at || scope.row.createdAt || '—' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
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
        </el-tab-pane>

        <!-- 密码管理 -->
        <el-tab-pane label="密码管理" name="password">
          <div class="tab-content">
            <el-form label-width="100px">
              <el-form-item label="修改密码">
                <el-input v-model="myOldPassword" type="password" placeholder="旧密码" style="width: 200px" />
                <el-input v-model="myNewPassword" type="password" placeholder="新密码" style="width: 200px; margin-left: 10px" />
                <el-button @click="changeMyPassword" :loading="changingPassword" style="margin-left: 10px">修改</el-button>
              </el-form-item>
              <el-form-item label="重置密码">
                <el-input v-model="resetUsername" placeholder="用户名" style="width: 200px" />
                <el-input v-model="resetPassword" type="password" placeholder="新密码" style="width: 200px; margin-left: 10px" />
                <el-button @click="resetUserPassword" :loading="resettingPassword" style="margin-left: 10px">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 题库管理 -->
        <el-tab-pane label="题库管理" name="questions">
          <div class="tab-content">
            <div class="action-bar">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                accept=".docx"
                :on-change="handleFileChange"
                style="display: inline-block"
              >
                <el-button>选择文件</el-button>
              </el-upload>
              <el-button type="primary" @click="uploadQuestions" :loading="uploading">上传题目</el-button>
              <el-button @click="downloadTemplate">下载模板</el-button>
              <el-button type="success" @click="generateExplanations" :loading="generating">生成解析</el-button>
              <span class="status-msg">{{ uploadMessage || generateMessage }}</span>
            </div>
            
            <div class="action-bar" style="margin-top: 10px">
              <el-select v-model="statusFilter" placeholder="筛选" style="width: 120px" @change="loadQuestions">
                <el-option label="全部" value="all" />
                <el-option label="已通过" value="approved" />
                <el-option label="草稿" value="draft" />
              </el-select>
              <el-button @click="loadQuestions" :loading="loadingQuestions">刷新</el-button>
              <el-button @click="exportTeacher">导出教师版</el-button>
              <el-button type="success" @click="approveAll" :loading="approvingAll">一键通过</el-button>
            </div>

            <div v-if="loadingQuestions" style="text-align: center; padding: 40px">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            </div>
            <el-empty v-else-if="filteredQuestions.length === 0" description="暂无题目" />
            <div v-else class="questions-list">
              <el-card v-for="(q, idx) in filteredQuestions" :key="q.qid" class="question-card" shadow="hover">
                <div class="q-header">
                  <span><strong>{{ idx + 1 }}.</strong> {{ q.stem }}</span>
                  <el-tag :type="getStatusTagType(q.status)" size="small">{{ getStatusText(q.status) }}</el-tag>
                </div>
                <div class="q-options">
                  <div v-for="opt in q.options" :key="opt.label">{{ opt.label }}. {{ opt.text }}</div>
                </div>
                <div class="q-actions">
                  <el-button size="small" @click="toggleAnalysis(q.qid)" :disabled="!q.analysis">
                    {{ showingAnalysis[q.qid] ? '收起' : '查看解析' }}
                  </el-button>
                  <el-button size="small" type="success" @click="approveQuestion(q.qid)" :disabled="!q.analysis">通过</el-button>
                  <el-button size="small" type="danger" @click="rejectQuestion(q.qid)">驳回</el-button>
                </div>
                <div v-if="showingAnalysis[q.qid]" class="q-analysis">{{ q.analysis || '暂无解析' }}</div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 试卷管理 -->
        <el-tab-pane label="试卷管理" name="papers">
          <div class="tab-content">
            <el-form label-width="100px">
              <el-form-item label="试卷标题">
                <el-input v-model="paperTitle" placeholder="试卷标题" style="width: 300px" />
                <el-button type="primary" @click="createPaper" :loading="creatingPaper" style="margin-left: 10px">生成试卷</el-button>
                <span class="status-msg">{{ paperMessage }}</span>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 成绩导出 -->
        <el-tab-pane label="成绩导出" name="export">
          <div class="tab-content">
            <div class="action-bar">
              <el-select v-model="selectedExportPaper" placeholder="选择试卷" style="width: 300px">
                <el-option v-for="paper in exportPapers" :key="paper.paper_id" :label="paper.title" :value="paper.paper_id" />
              </el-select>
              <el-button @click="loadExportPapers" :loading="loadingExportPapers">刷新</el-button>
              <el-button type="primary" @click="exportZip" :loading="exportingZip">导出ZIP</el-button>
              <el-button @click="exportDocx" :loading="exportingDocx">导出DOCX</el-button>
              <span class="status-msg">{{ exportMessage }}</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-card class="user-management-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>用户账号管理</span>
            <div class="card-actions">
              <el-input
                v-model="userSearch"
                size="small"
                placeholder="搜索用户名/邮箱"
                clearable
                @clear="applyUserSearch"
                @keyup.enter="applyUserSearch"
                style="width: 240px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" plain size="small" :loading="loadingUsers" :icon="Refresh" @click="loadUsers">
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <div class="user-list-body">
          <div v-if="loadingUsers" class="list-loading"><el-skeleton :rows="3" animated /></div>
          <el-empty v-else-if="filteredUsers.length === 0" description="暂无用户数据">
            <el-button type="primary" plain @click="loadUsers">刷新</el-button>
          </el-empty>
          <el-table
            v-else
            :data="filteredUsers"
            border
            size="small"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="username" label="用户名" min-width="140" />
            <el-table-column prop="email" label="邮箱" min-width="200">
              <template #default="scope">{{ scope.row.email || '—' }}</template>
            </el-table-column>
            <el-table-column prop="role" label="角色" min-width="120">
              <template #default="scope">
                <el-tag :type="scope.row.role === 'admin' ? 'warning' : 'info'">
                  {{ roleName(scope.row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="120">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 1" type="success" effect="plain">正常</el-tag>
                <el-tag v-else-if="scope.row.status === 0" type="warning" effect="plain">待审核</el-tag>
                <el-tag v-else-if="scope.row.status === -1" type="danger" effect="plain">已封禁</el-tag>
                <el-tag v-else-if="scope.row.status === -2" type="info" effect="plain">审核未通过</el-tag>
                <el-tag v-else type="info" effect="plain">未知</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <template v-if="isRegularUser(scope.row)">
                  <el-button
                    v-if="scope.row.status !== -1"
                    type="danger"
                    plain
                    size="small"
                    :loading="actionLoadingId === (scope.row.id || scope.row.username)"
                    @click="banUser(scope.row)"
                  >
                    封禁
                  </el-button>
                  <el-button
                    v-if="scope.row.status === -1"
                    type="success"
                    plain
                    size="small"
                    :loading="actionLoadingId === (scope.row.id || scope.row.username)"
                    @click="unbanUser(scope.row)"
                  >
                    解封
                  </el-button>
                </template>
                <el-tooltip v-else effect="dark" content="仅可封禁普通用户" placement="top">
                  <span>
                    <el-button type="danger" plain size="small" disabled>封禁</el-button>
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, reactive } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { RoleNames, UserRole } from '@/config/permissions'
import { API_ENDPOINTS } from '@/config/api/api'
import { fetchWithAuth, getApiUrl, openInNewTab } from '@/utils/request'
import { Refresh, Search } from '@element-plus/icons-vue'

interface Question {
  qid: string
  stem: string
  options: Array<{ label: string; text: string }>
  analysis: string
  status: string
}

interface Paper {
  paper_id: string
  title: string
}

export default defineComponent({
  name: 'AdminView',
  components: { Loading, Search },
  setup() {
    const store = useStore()
    const username = computed(() => store.state.user.username)
    const userRole = computed(() => store.getters.userRole)
    const roleText = computed(() => {
      const role = userRole.value as UserRole
      return role ? RoleNames[role] : '普通用户'
    })

    const activeTab = ref('questions')
    const myOldPassword = ref('')
    const myNewPassword = ref('')
    const resetUsername = ref('')
    const resetPassword = ref('')
    const changingPassword = ref(false)
    const resettingPassword = ref(false)
    const uploadFile = ref<File | null>(null)
    const uploading = ref(false)
    const uploadMessage = ref('')
    const generating = ref(false)
    const generateMessage = ref('')
    const pollingInterval = ref<number | null>(null)
    const questions = ref<Question[]>([])
    const statusFilter = ref('all')
    const loadingQuestions = ref(false)
    const showingAnalysis = reactive<Record<string, boolean>>({})
    const approvingAll = ref(false)
    const paperTitle = ref('概率统计小测')
    const creatingPaper = ref(false)
    const paperMessage = ref('')
    const exportPapers = ref<Paper[]>([])
    const selectedExportPaper = ref('')
    const loadingExportPapers = ref(false)
    const exportingZip = ref(false)
    const exportingDocx = ref(false)
    const exportMessage = ref('')
    const userSearch = ref('')
    interface ManagedUser {
      id?: string
      username: string
      email?: string
      role?: string
      status?: number  // 1=正常，0=待审核，-1=封禁，-2=审核未通过
    }

    const users = ref<ManagedUser[]>([])
    const loadingUsers = ref(false)
    const actionLoadingId = ref<string | null>(null)
    const pendingUsers = ref<ManagedUser[]>([])
    const loadingPending = ref(false)
    const approvalLoadingId = ref<string | null>(null)
    const rejectLoadingId = ref<string | null>(null)


    const filteredQuestions = computed(() => {
      if (statusFilter.value === 'all') return questions.value
      return questions.value.filter(q => q.status === statusFilter.value)
    })

    const getStatusTagType = (status: string) => {
      const map: Record<string, any> = { approved: 'success', draft: 'warning', abnormal: 'danger', rejected: 'info' }
      return map[status] || ''
    }

    const getStatusText = (status: string) => {
      const map: Record<string, string> = { approved: '已通过', draft: '草稿', abnormal: '异常', rejected: '已驳回' }
      return map[status] || status
    }

    const changeMyPassword = async () => {
      if (!myNewPassword.value) return ElMessage.warning('新密码不可为空')
      changingPassword.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             id: store.state.user.id,
             username: store.state.user.username,
             oldPassword: myOldPassword.value, 
             newPassword: myNewPassword.value 
            })
        })
        if (response.data.ok) {
          ElMessage.success('修改成功，请重新登录')
          store.dispatch('logout')
          setTimeout(() => window.location.href = '/login', 1000)
        } else throw new Error(response.data.detail || '修改失败')
      } catch (error: any) {
        ElMessage.error('修改失败：' + error.message)
      } finally {
        changingPassword.value = false
      }
    }

    const resetUserPassword = async () => {
      if (!resetUsername.value || !resetPassword.value) return ElMessage.warning('请输入用户名和新密码')
      resettingPassword.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: store.state.user.id,
            username: resetUsername.value,
            newPassword: resetPassword.value
          })
        })
        if (response.data.ok) {
          ElMessage.success('重置成功')
          resetUsername.value = ''
          resetPassword.value = ''
        } else throw new Error(response.data.detail || '重置失败')
      } catch (error: any) {
        ElMessage.error('重置失败：' + error.message)
      } finally {
        resettingPassword.value = false
      }
    }

    const handleFileChange = (file: any) => { uploadFile.value = file.raw }

    const uploadQuestions = async () => {
      if (!uploadFile.value) return ElMessage.warning('请选择文件')
      uploading.value = true
      uploadMessage.value = '上传中...'
      try {
        const formData = new FormData()
        formData.append('file', uploadFile.value)
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.UPLOAD), { method: 'POST', body: formData })
        if (response.data.ok) {
          uploadMessage.value = `解析成功：${response.data.count} 题`
          ElMessage.success('上传成功')
          loadQuestions()
        } else throw new Error(response.data.detail || '上传失败')
      } catch (error: any) {
        uploadMessage.value = '上传失败：' + error.message
        ElMessage.error(uploadMessage.value)
      } finally {
        uploading.value = false
      }
    }

    const downloadTemplate = () => { openInNewTab(getApiUrl(API_ENDPOINTS.ADMIN.IMPORT_TEMPLATE)) }

    const pollTaskStatus = (taskId: string) => {
      if (pollingInterval.value) clearInterval(pollingInterval.value)
      pollingInterval.value = window.setInterval(async () => {
        try {
          const response = await fetchWithAuth(getApiUrl(`${API_ENDPOINTS.TASKS.STATUS}/${taskId}`))
          const data = response.data
          generateMessage.value = `正在生成解析: ${data.progress} / ${data.total} 完成...`
          if (data.status === 'completed' || data.status === 'failed') {
            if (pollingInterval.value) clearInterval(pollingInterval.value)
            generating.value = false
            if (data.status === 'completed') {
              generateMessage.value = '生成完成！'
              ElMessage.success('解析生成完成')
              loadQuestions()
            } else {
              generateMessage.value = `任务失败: ${data.error || '未知错误'}`
              ElMessage.error('解析生成失败')
            }
          }
        } catch (error: any) {
          if (pollingInterval.value) clearInterval(pollingInterval.value)
          generating.value = false
          ElMessage.error('轮询失败')
        }
      }, 2000)
    }

    const generateExplanations = async () => {
      generating.value = true
      generateMessage.value = '正在准备生成任务...'
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.EXPLAIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ only_unexplained: true, include_rejected: true, limit: 0 })
        })
        if (response.data.ok && response.data.task_id) {
          generateMessage.value = '任务已启动，正在生成解析...'
          pollTaskStatus(response.data.task_id)
        } else throw new Error(response.data.detail || '启动失败')
      } catch (error: any) {
        generateMessage.value = '启动失败：' + error.message
        generating.value = false
        ElMessage.error(generateMessage.value)
      }
    }

    const loadQuestions = async () => {
      loadingQuestions.value = true
      try {
        const [questionsResp, analysesResp] = await Promise.all([
          fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.DEBUG_QUESTIONS)),
          fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.DEBUG_ANALYSES))
        ])
        const questionsData = questionsResp.data || []
        const analysesData = analysesResp.data || []
        const analysisMap = new Map(analysesData.map((a: any) => [a.qid, a]))
        questions.value = questionsData.map((q: any) => {
          const analysis: any = analysisMap.get(q.qid)
          return { ...q, analysis: analysis?.rationale_overall || '', status: analysis?.status || 'draft' }
        })
      } catch (error: any) {
        ElMessage.error('加载题库失败：' + error.message)
      } finally {
        loadingQuestions.value = false
      }
    }

    const toggleAnalysis = (qid: string) => { showingAnalysis[qid] = !showingAnalysis[qid] }

    const approveQuestion = async (qid: string) => {
      try {
        const question = questions.value.find(q => q.qid === qid)
        if (!question) return
        const formData = new FormData()
        formData.append('qid', qid)
        formData.append('final_text', question.analysis)
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.REVIEW), { method: 'POST', body: formData })
        if (response.data.ok) {
          ElMessage.success('已通过')
          loadQuestions()
        } else throw new Error(response.data.detail || '操作失败')
      } catch (error: any) {
        ElMessage.error('操作失败：' + error.message)
      }
    }

    const rejectQuestion = async (qid: string) => {
      try {
        const { value: reason } = await ElMessageBox.prompt('请输入驳回原因', '驳回', {
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })
        const formData = new FormData()
        formData.append('qid', qid)
        formData.append('reject_reason', reason || '不符合要求')
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.REJECT), { method: 'POST', body: formData })
        if (response.data.ok) {
          ElMessage.success('已驳回')
          loadQuestions()
        } else throw new Error(response.data.detail || '操作失败')
      } catch (error: any) {
        if (error !== 'cancel') ElMessage.error('操作失败：' + error.message)
      }
    }

    const approveAll = async () => {
      try {
        await ElMessageBox.confirm('确认一键通过所有草稿状态的题目？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        approvingAll.value = true
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.QUESTIONS.APPROVE_ALL), { method: 'POST' })
        if (response.data.ok) {
          ElMessage.success(`已通过 ${response.data.count} 题`)
          loadQuestions()
        } else throw new Error(response.data.detail || '操作失败')
      } catch (error: any) {
        if (error !== 'cancel') ElMessage.error('操作失败：' + error.message)
      } finally {
        approvingAll.value = false
      }
    }

    const exportTeacher = () => { openInNewTab(getApiUrl(API_ENDPOINTS.ADMIN.EXPORT_TEACHER_DOCX)) }

    const createPaper = async () => {
      if (!paperTitle.value) return ElMessage.warning('请输入试卷标题')
      creatingPaper.value = true
      paperMessage.value = '生成中...'
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.PAPERS.CREATE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: paperTitle.value })
        })
        if (response.data.ok) {
          paperMessage.value = `生成成功：${response.data.paper_id.slice(0, 8)}`
          ElMessage.success('试卷生成成功')
        } else throw new Error(response.data.detail || '生成失败')
      } catch (error: any) {
        paperMessage.value = '生成失败：' + error.message
        ElMessage.error(paperMessage.value)
      } finally {
        creatingPaper.value = false
      }
    }

    const loadExportPapers = async () => {
      loadingExportPapers.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.PAPERS.LIST_ALL))
        exportPapers.value = response.data || []
      } catch (error: any) {
        ElMessage.error('加载试卷列表失败：' + error.message)
      } finally {
        loadingExportPapers.value = false
      }
    }

    const exportZip = () => {
      if (!selectedExportPaper.value) return ElMessage.warning('请选择试卷')
      openInNewTab(getApiUrl(`${API_ENDPOINTS.ADMIN.EXPORT_SCORES_ZIP}?paper_id=${selectedExportPaper.value}`))
      ElMessage.success('导出成功')
    }

    const exportDocx = () => {
      if (!selectedExportPaper.value) return ElMessage.warning('请选择试卷')
      openInNewTab(getApiUrl(`${API_ENDPOINTS.ADMIN.EXPORT_SCORES_DOCX}?paper_id=${selectedExportPaper.value}`))
      ElMessage.success('导出成功')
    }

    const normalizeRole = (role?: string) => (role || '').toLowerCase()

    const roleName = (role?: string) => {
      const key = normalizeRole(role)
      if (key === UserRole.SUPER_ADMIN) return RoleNames[UserRole.SUPER_ADMIN]
      if (key === UserRole.ADMIN) return RoleNames[UserRole.ADMIN]
      if (key === UserRole.USER) return RoleNames[UserRole.USER]
      return role || '未知角色'
    }

    // 状态码常量
    const UserStatus = {
      NORMAL: 1,        // 正常
      PENDING: 0,       // 待审核
      BANNED: -1,       // 封禁
      REJECTED: -2      // 审核未通过
    }

    const isBanned = (user: ManagedUser) => user.status === UserStatus.BANNED

    const loadUsers = async () => {
      loadingUsers.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_LIST))
        if (response.ok) {
          const raw = response.data?.data?.list || response.data?.data?.users || response.data || []
          const list = Array.isArray(raw) ? raw : (raw.items || [])
          users.value = list
        } else {
          throw new Error(response.data?.message || '加载用户列表失败')
        }
      } catch (error: any) {
        users.value = []
        ElMessage.error(error?.message || '加载用户列表失败')
      } finally {
        loadingUsers.value = false
      }
    }

    const filteredUsers = computed(() => {
      const keyword = userSearch.value.trim().toLowerCase()
      if (!keyword) return users.value
      return users.value.filter((user) => {
        const username = user.username?.toLowerCase() || ''
        const email = user.email?.toLowerCase() || ''
        return username.includes(keyword) || email.includes(keyword)
      })
    })

    const applyUserSearch = () => {
      userSearch.value = userSearch.value.trim()
    }

    const isRegularUser = (user: ManagedUser) => normalizeRole(user.role) === UserRole.USER

    const banUser = async (user: ManagedUser) => {
      if (!isRegularUser(user)) {
        ElMessage.warning('仅可封禁普通用户')
        return
      }
      actionLoadingId.value = user.id || user.username
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_BAN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('封禁成功')
          await loadUsers()
        } else {
          throw new Error(response.data?.message || '封禁失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '封禁失败，请稍后重试')
      } finally {
        actionLoadingId.value = null
      }
    }

    const unbanUser = async (user: ManagedUser) => {
      actionLoadingId.value = user.id || user.username
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_UNBAN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('已解除封禁')
          await loadUsers()
        } else {
          throw new Error(response.data?.message || '解除封禁失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '解除封禁失败，请稍后重试')
      } finally {
        actionLoadingId.value = null
      }
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

    const approveUser = async (user: ManagedUser) => {
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
          await loadUsers()
        } else {
          throw new Error(response.data?.message || '批准失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '批准失败，请稍后重试')
      } finally {
        approvalLoadingId.value = null
      }
    }

    const rejectUser = async (user: ManagedUser) => {
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

    const maskIdCard = (idCard: string) => {
      if (!idCard || idCard.length < 8) return idCard
      return idCard.slice(0, 6) + '********' + idCard.slice(-4)
    }

    onMounted(() => {
      loadQuestions()
      loadExportPapers()
      loadUsers()
      loadPendingUsers()
    })

    return {
      username, roleText, activeTab, myOldPassword, myNewPassword, resetUsername, resetPassword,
      changingPassword, resettingPassword, uploading, uploadMessage, generating, generateMessage,
      questions, filteredQuestions, statusFilter, loadingQuestions, showingAnalysis, approvingAll,
      paperTitle, creatingPaper, paperMessage, exportPapers, selectedExportPaper,
      loadingExportPapers, exportingZip, exportingDocx, exportMessage,
      userSearch, users, loadingUsers, actionLoadingId,
      pendingUsers, loadingPending, approvalLoadingId, rejectLoadingId,
      changeMyPassword, resetUserPassword, handleFileChange, uploadQuestions, downloadTemplate,
      generateExplanations, loadQuestions, toggleAnalysis, approveQuestion, rejectQuestion,
      approveAll, exportTeacher, createPaper, loadExportPapers, exportZip, exportDocx,
      loadUsers, filteredUsers, applyUserSearch, banUser, unbanUser, roleName, isRegularUser,
      loadPendingUsers, approveUser, rejectUser, maskIdCard,
      UserStatus, isBanned, getStatusTagType, getStatusText, Refresh
    }
  }
})
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 60px);
  background: url('@/assets/allPic/public/wide_bac.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 2rem 0;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}
.page-header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
}
.page-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  color: #1f2937;
}
.subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}
.tab-content {
  padding: 1rem;
}
.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.status-msg {
  color: #6b7280;
  font-size: 0.875rem;
  margin-left: 10px;
}
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
.question-card {
  margin-bottom: 0;
}
.q-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}
.q-options {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
  color: #4b5563;
}
.q-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.q-analysis {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  white-space: pre-wrap;
  color: #374151;
}
.user-management-card {
  margin-top: 1.5rem;
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
</style>
