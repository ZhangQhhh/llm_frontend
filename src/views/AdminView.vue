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

        <!-- ==================== 题库管理（MCQ 对接） ==================== -->
        <el-tab-pane label="题库管理" name="questions">
          <div class="tab-content">
            <!-- 操作区一：上传/导出导入 -->
            <div class="action-bar">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                accept=".docx,.txt"
                :on-change="handleFileChange"
                style="display: inline-block"
              >
                <el-button>选择文件</el-button>
              </el-upload>
              <el-button type="primary" @click="uploadQuestions" :loading="uploading">上传并解析 + 保存</el-button>
              <el-button @click="downloadTemplate">下载模板</el-button>

              <el-button @click="exportBankDocx" :loading="exportingBank">导出题库DOCX</el-button>
              <input ref="bankImportRef" type="file" accept=".docx" style="display:none" @change="onPickBankDocx" />
              <el-button @click="triggerPickBankDocx" :loading="importingBank">导入题库DOCX（覆盖）</el-button>

              <span class="status-msg" v-if="uploadMessage">{{ uploadMessage }}</span>
              <span class="status-msg" v-if="counterMsg">{{ counterMsg }}</span>
            </div>

            <!-- 操作区二：生成解析 / 模型参数 / 批量 -->
            <div class="action-bar" style="margin-top: 8px">
              <el-button type="success" @click="generateExplanations" :loading="generating">一键解析（草稿）</el-button>
              <span class="status-msg" v-if="generateMessage">{{ generateMessage }}</span>

              <el-button @click="explainBatchAsync" :loading="asyncExplaining">异步批量生成解析</el-button>
              <span class="status-msg" v-if="asyncMsg">{{ asyncMsg }}</span>

              <el-select v-model="llmModelId" placeholder="模型ID" style="width:220px;margin-left:auto">
                <el-option v-for="m in llmOptions" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>
              <el-input-number v-model="topN" :min="1" :step="1" style="width:120px" />
              <el-checkbox v-model="thinking">思考模式</el-checkbox>
              <el-checkbox v-model="insertBlock">InsertBlock</el-checkbox>
            </div>

            <!-- 操作区三：列表控制 -->
            <div class="filter-bar" style="margin:10px 0">
              <el-select v-model="statusFilter" placeholder="筛选" style="width: 120px" @change="loadQuestions">
                <el-option label="全部" value="all" />
                <el-option label="无解析" value="none" />
                <el-option label="草稿" value="draft" />
                <el-option label="已通过" value="approved" />
                <el-option label="已驳回" value="rejected" />
                <el-option label="异常" value="abnormal" />
              </el-select>
              <el-button @click="loadQuestions" :loading="loadingQuestions">刷新</el-button>
              <el-button type="success" @click="approveAll" :loading="approvingAll">一键通过</el-button>
              <el-button type="danger" @click="rejectAll" :loading="rejectingAll">一键驳回</el-button>
            </div>

            <!-- 列表 -->
            <div v-if="loadingQuestions" style="text-align: center; padding: 40px">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            </div>
            <el-empty v-else-if="filteredQuestions.length === 0" description="暂无题目" />
            <div v-else class="questions-list">
              <el-card v-for="(q, idx) in pagedQuestions" :key="q.qid" class="question-card" shadow="hover">
                <div class="q-header">
                  <span><strong>{{ (idx + 1) + (page-1)*pageSize }}.</strong> {{ q.stem }}</span>
                  <el-tag :type="getStatusTagType(q.status)" size="small">{{ getStatusText(q.status) }}</el-tag>
                </div>
                <div class="q-options">
                  <div v-for="opt in q.options" :key="opt.label">{{ opt.label }}. {{ opt.text }}</div>
                </div>
                <div class="q-actions">
                  <!-- 查看解析：保持不变 -->
                  <el-button size="small" @click="toggleAnalysis(q.qid)">
                    {{ showingAnalysis[q.qid] ? '收起' : '查看解析' }}
                  </el-button>

                  <!-- 编辑：始终可见 -->
                  <el-button size="small" @click="editRow(q)">编辑</el-button>

                  <!-- 保存 / 取消：仅在编辑状态下出现 -->
                  <el-button
                    v-if="isEditing(q.qid)"
                    size="small"
                    type="primary"
                    plain
                    @click="saveRow(q)"
                  >
                    保存
                  </el-button>
                  <el-button
                    v-if="isEditing(q.qid)"
                    size="small"
                    @click="cancelEdit(q)"
                  >
                    取消
                  </el-button>

                  <!-- 重生成并保存：仅在题目状态为“已驳回”（rejected）时显示 -->
                  <el-button
                    v-if="q.status === 'rejected'"
                    size="small"
                    type="primary"
                    @click="regenAndSave(q)"
                    :loading="rowRegenLoading[q.qid]"
                  >
                    重生成并保存
                  </el-button>

                  <!-- 通过 / 驳回：保持不变 -->
                  <el-button
                    size="small"
                    type="success"
                    @click="approveQuestion(q.qid)"
                    :disabled="!q.analysis"
                  >
                    通过
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="rejectQuestion(q.qid)"
                  >
                    驳回
                  </el-button>
                </div>


                <!-- 行内编辑区 -->
                <div v-if="isEditing(q.qid)" class="edit-grid">
                  <el-form label-width="60px">
                    <!-- 1. 题干 -->
                    <el-form-item label="题干">
                      <el-input
                        v-model="editBuf.stem"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 6 }"
                      />
                    </el-form-item>

                    <!-- 2. 选项（和题干同宽，自适应高度） -->
                    <el-form-item label="选项">
                      <div class="opts-grid">
                        <div
                          v-for="k in optionKeys(q.options)"
                          :key="k"
                          class="opt-row"
                        >
                          <span class="opt-label">{{ k }}.</span>
                          <el-input
                            class="opt-input"
                            v-model="editBuf.options[k]"
                            type="textarea"
                            :autosize="{ minRows: 1, maxRows: 4 }"
                          />
                        </div>
                      </div>
                    </el-form-item>

                    <!-- 3. 答案 -->
                    <el-form-item label="答案">
                      <el-input
                        v-model="editBuf.answer"
                        placeholder="如 A 或 AC"
                      />
                    </el-form-item>

                    <!-- 4. 解析 -->
                    <el-form-item label="解析">
                      <el-input
                        v-model="editBuf.explain"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 10 }"
                      />
                    </el-form-item>
                  </el-form>
                </div>


                <div v-if="showingAnalysis[q.qid]" class="q-analysis">
                  <div class="q-analysis-text">
                    {{ q.analysis || '暂无解析' }}
                  </div>

                  <!-- 参考资料折叠块（结构参考 qa_public.html） -->
                  <details class="analysis-sources">
                    <summary>参考资料（重排序最终 TopN）</summary>

                    <div v-if="sourcesLoading[q.qid]" class="src-loading">
                      参考资料载入中…
                    </div>
                    <div v-else-if="sourcesError[q.qid]" class="src-error">
                      加载失败：{{ sourcesError[q.qid] }}
                    </div>
                    <div
                      v-else-if="sourcesLoaded[q.qid] && (!sourcesMap[q.qid] || !sourcesMap[q.qid].length)"
                      class="src-empty"
                    >
                      无参考资料
                    </div>

                    <template v-else>
                      <!-- 分组选项（复杂验证：sources_grouped） -->
                      <template v-if="isGroupedSources(q.qid)">
                        <details
                          v-for="(group, gi) in sourcesMap[q.qid]"
                          :key="group.label || gi"
                          class="src-group"
                          open
                        >
                          <summary>选项 {{ group.label || '?' }} 的参考资料</summary>
                          <div class="src-group-body">
                            <div
                              v-for="(s, si) in group.sources || []"
                              :key="si"
                              class="src-card"
                            >
                              <div class="src-title">{{ getSourceTitle(s, si) }}</div>
                              <div v-if="getSourceMeta(s)" class="src-meta">
                                {{ getSourceMeta(s) }}
                              </div>
                              <div v-if="sourcePassages(s).length" class="src-passages">
                                <div
                                  v-for="(p, pi) in sourcePassages(s)"
                                  :key="pi"
                                  class="passage"
                                >
                                  <pre>{{ p }}</pre>
                                </div>
                              </div>
                              <div v-else class="src-empty">无片段</div>
                            </div>
                          </div>
                        </details>
                      </template>

                      <!-- 扁平列表（简单检索：sources） -->
                      <template v-else>
                        <div
                          v-for="(s, si) in sourcesMap[q.qid] || []"
                          :key="si"
                          class="src-card"
                        >
                          <div class="src-title">{{ getSourceTitle(s, si) }}</div>
                          <div v-if="getSourceMeta(s)" class="src-meta">
                            {{ getSourceMeta(s) }}
                          </div>
                          <div v-if="sourcePassages(s).length" class="src-passages">
                            <div
                              v-for="(p, pi) in sourcePassages(s)"
                              :key="pi"
                              class="passage"
                            >
                              <pre>{{ p }}</pre>
                            </div>
                          </div>
                          <div v-else class="src-empty">无片段</div>
                        </div>
                      </template>
                    </template>
                  </details>
                </div>
              </el-card>
            </div>

            <!-- 分页 -->
            <div v-if="filteredQuestions.length" style="display:flex;justify-content:flex-end;margin-top:12px">
              <el-pagination
                background
                layout="prev, pager, next, sizes, jumper, total"
                :total="filteredQuestions.length"
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :page-sizes="[20,50,100,200]"
              />
            </div>
          </div>
        </el-tab-pane>


        <!-- 试卷管理 -->
        <el-tab-pane label="试卷管理" name="papers">
          <div class="tab-content">
            <el-form label-width="100px">
              <el-form-item label="试卷标题">
                <el-input v-model="paperTitle" placeholder="请输入试卷名称" style="width: 300px" />
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
import { API_ENDPOINTS, MCQ_BASE_URL} from '@/config/api/api'
import { fetchWithAuth, getApiUrl, openInNewTab } from '@/utils/request'
import { Refresh, Search } from '@element-plus/icons-vue'

interface Question {
  qid: string
  stem: string
  options: Array<{ label: string; text: string }>
  answer: string
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

    // ======= 题库管理（MCQ） =======
    const uploadRef = ref<any>(null)
    const uploadFile = ref<File | null>(null)
    const normalizeOptions = (opts: any): Array<{ label: string; text: string }> => {
      const out: Array<{ label: string; text: string }> = []
      const o = opts || {}
      for (const k of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
        if (o[k]) out.push({ label: k, text: o[k] })
      }
      return out
    }
    const uploading = ref(false)
    const uploadMessage = ref('')
    const generating = ref(false)
    const generateMessage = ref('')
    const pollingInterval = ref<number | null>(null)
    const questions = ref<Question[]>([])
    const statusFilter = ref<'all'|'none'|'draft'|'approved'|'rejected'|'abnormal'|'processing'>('all')
    const loadingQuestions = ref(false)
    const showingAnalysis = reactive<Record<string, boolean>>({})
    const approvingAll = ref(false)

    // 参考资料缓存与渲染（结构与 qa_public.html 对齐）
    const sourcesMap = reactive<Record<string, any[]>>({})
    const sourcesLoading = reactive<Record<string, boolean>>({})
    const sourcesLoaded = reactive<Record<string, boolean>>({})
    const sourcesError = reactive<Record<string, string>>({})

    const sourcePassages = (src: any): string[] => {
      const out: string[] = []
      const keys = [
        'passages_all',
        'passages',
        'keyPassage',
        'key_passage',
        'passage',
        'text',
        'content',
        'chunk',
        'segment',
        'excerpt'
      ]
      for (const k of keys) {
        const v = src?.[k]
        if (Array.isArray(v)) out.push(...v.map((x: any) => String(x)))
        else if (v != null) out.push(String(v))
      }
      return out.filter(Boolean)
    }

    const getSourceTitle = (s: any, idx: number): string => {
      const titleRaw = s?.fileName || s?.file_name || s?.title || s?.docId || `来源 ${idx + 1}`
      return `[${idx + 1}] ${String(titleRaw)}`
    }

    const getSourceMeta = (s: any): string => {
      const meta: string[] = []
      const init = (s?.initialScore ?? s?.initial_score)
      if (init !== undefined && init !== '') meta.push(`初始分:${init}`)
      const rer = (s?.rerankedScore ?? s?.reranked_score ?? s?.score)
      if (rer !== undefined && rer !== '') meta.push(`重排分:${rer}`)
      const page = (s?.page ?? s?.page_no ?? s?.page_num)
      if (page !== undefined && page !== '') meta.push(`页:${page}`)
      return meta.join(' / ')
    }

    const isGroupedSources = (qid: string): boolean => {
      const src = sourcesMap[qid]
      if (!Array.isArray(src) || !src.length) return false
      const first = src[0] as any
      return !!(first && typeof first === 'object' && Array.isArray(first.sources))
    }

    const loadSources = async (qid: string) => {
      if (!qid) return
      if (sourcesLoaded[qid] || sourcesLoading[qid]) return
      sourcesLoading[qid] = true
      sourcesError[qid] = ''
      try {
        let url = `${MCQ_BASE_URL}/bank/sources?qid=${encodeURIComponent(qid)}`
        let res: Response
        try {
          res = await fetch(url, { method: 'GET' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        } catch (_err) {
          url = `/mcq_public/bank/sources?qid=${encodeURIComponent(qid)}`
          res = await fetch(url, { method: 'GET' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        }
        const j = await res.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || '获取参考资料失败')
        }
        const src = j.sources || []
        sourcesMap[qid] = Array.isArray(src) ? src : []
        sourcesLoaded[qid] = true
      } catch (error: any) {
        sourcesError[qid] = error?.message || String(error)
      } finally {
        sourcesLoading[qid] = false
      }
    }

    // ==== MCQ 扩展状态（仅题库管理内部使用） ====
    const exportingBank = ref(false)
    const importingBank = ref(false)
    const bankImportRef = ref<HTMLInputElement | null>(null)
    const asyncExplaining = ref(false)
    const asyncMsg = ref('')
    const llmOptions = ref([
      { value: 'qwen2025',      label: 'qwen2025 (qwen3)' },
      { value: 'qwen3-32b',     label: 'qwen3-32b' },
      { value: 'deepseek',      label: 'deepseek (deepseek-r1)' },
      //{ value: 'qwen3-14b-lora',label: 'qwen3-14b-lora' },
      { value: 'deepseek-32b',  label: 'deepseek-32b (deepseek-r1-distill-qwen-32b)' },
    ])
    const llmModelId = ref('qwen3-32b')
    const topN = ref(20)
    const thinking = ref(false)
    const insertBlock = ref(false)
    const rejectingAll = ref(false)
    const page = ref(1)
    const pageSize = ref(50)
    const rowRegenLoading = reactive<Record<string, boolean>>({})
    const editingId = ref<string | null>(null)
    const editBuf = reactive<any>({ stem:'', answer:'', explain:'', options:{} })
    const counterMsg = ref('')

    const filteredQuestions = computed(() => {
      try {
        if (statusFilter.value === 'all') return questions.value
        return questions.value.filter(q => q.status === statusFilter.value)
      } catch { return questions.value || [] }
    })

    const paperTitle = ref('')
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

    const handleFileChange = (file: any) => {
      // Element Plus el-upload 的 on-change 参数是 (file, fileList)
      if (file && file.raw) {
        uploadFile.value = file.raw as File
      } else {
        uploadFile.value = null
      }
    }

    const uploadQuestions = async () => {
      if (!uploadFile.value) {
        ElMessage.warning('请选择 .docx / .txt 文件')
        return
      }
      uploading.value = true
      uploadMessage.value = '识别中…'

      try {
        // 1）调用 /upload 做题目识别
        const fd = new FormData()
        fd.append('file', uploadFile.value)

        const r = await fetch(`${MCQ_BASE_URL}/upload`, { method: 'POST', body: fd })
        const j = await r.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || `上传/解析失败（HTTP ${r.status})`)
        }

        const items = Array.isArray(j.items) ? j.items : []

        // 2）对齐 qa_public.html：把 answer 也带上
        const upsertPayload = items.map((x: any) => ({
          stem: x.stem || '',
          options: x.options || {},
          answer: (x.answer || '').toString().toUpperCase(),  // ← 关键：传 answer
          explain: x.explain_original || '',
        }))

        const rs = await fetch(`${MCQ_BASE_URL}/bank/bulk_upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: upsertPayload }),
        })
        const saved = await rs.json()
        if (!saved || saved.ok === false) {
          throw new Error(saved?.msg || 'bulk_upsert 失败')
        }

        const bankItems = Array.isArray(saved.items) ? saved.items : []

        // 3）映射成前端 Question 时，记得带上 answer
        questions.value = bankItems.map((it: any): Question => {
          const statusRaw = it.status || ((it.explain || '').trim() ? 'draft' : 'none')
          const status = statusRaw === 'none' ? 'draft' : statusRaw
          return {
            qid: String(it.id ?? it.qid ?? ''),
            stem: it.stem || '',
            options: normalizeOptions(it.options),
            answer: (it.answer || '').toString().toUpperCase(),      // ← 新增
            analysis: it.explain || '',
            status,
          }
        })

        const parsedExplainCount = questions.value.filter(
          q => (q.analysis || '').trim().length > 0
        ).length
        uploadMessage.value = `识别成功并已保存：${questions.value.length} 题；识别解析：${parsedExplainCount} 条`
        ElMessage.success('上传成功')
      } catch (e: any) {
        const msg = e?.message || String(e) || '未知错误'
        uploadMessage.value = '上传失败：' + msg
        ElMessage.error(uploadMessage.value)
      } finally {
        uploading.value = false
      }
    }


    const explainBatchAsync = async () => {
      asyncExplaining.value = true; asyncMsg.value = '创建任务中…'
      try{
        const req:any = { model_id: llmModelId.value, thinking: thinking.value, rerank_top_n: topN.value, use_insert_block: insertBlock.value }
        const r = await fetch(`${MCQ_BASE_URL}/explain_batch_async`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req) })
        const j = await r.json(); if (!j?.ok) throw new Error(j?.msg || '创建任务失败')
        pollTaskStatus(String(j.task_id))
      }catch(e:any){ asyncMsg.value = `失败：${e?.message||e}` }
      finally{ asyncExplaining.value = false }
    }

    const downloadTemplate = () => {
      // 直接请求后端刚才新加的 /mcq_public/import_template
      const url = `${MCQ_BASE_URL}/import_template`

      const a = document.createElement('a')
      a.href = url
      // 这里可以写 download，但现在真正起作用的是后端的 Content-Disposition
      // a.download = '题库导入模板.docx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }


    const pollTaskStatus = (taskId: string) => {
      if (pollingInterval.value) clearInterval(pollingInterval.value)
      pollingInterval.value = window.setInterval(async () => {
        try {
          const r = await fetch(`${MCQ_BASE_URL}/tasks/status?task_id=${encodeURIComponent(taskId)}`, { cache:'no-store' })
          const j = await r.json(); if (!j || !j.ok) return
          asyncMsg.value = `进度：${j.done||0}/${j.total||0}`
          const arrs = [j.results, j.delta_results, j.partial_results, j.latest_results, j.items, j.updates]
          ;(arrs||[]).forEach((arr:any[]) => {
            if (!Array.isArray(arr)) return
            arr.forEach((res:any)=>{
              const row = (questions.value || []).find(x => String(x.qid) === String(res.qid))
              if (!row || res.ok === false) return
              const explain = (res.explain||'').trim()
              if (explain) row.analysis = explain
              if (typeof res.answer_mismatch !== 'undefined' && (row.status==='none'||row.status==='draft')){
                row.status = res.answer_mismatch ? 'abnormal' : 'draft'
              }
            })
          })
          if (j.status && String(j.status).toLowerCase() in {done:1, failed:1}){
            if (pollingInterval.value) clearInterval(pollingInterval.value)
            asyncMsg.value = '任务已结束'
            await loadQuestions()
          }
        } catch (e) {
          console.debug && console.debug('MCQ polling failed', e)
          if (pollingInterval.value) clearInterval(pollingInterval.value)
          asyncMsg.value = '轮询失败'
        }
      }, 2000)
    }

    const generateExplanations = async () => {
      generating.value = true
      generateMessage.value = '正在生成解析...'
      try {
        const targets = (questions.value || []).filter(q => (q.status || 'none') !== 'approved')
        if (targets.length === 0) {
          generateMessage.value = '无可解析题目'
          generating.value = false
          return
        }
        const payload = {
          items: targets.map(q => ({
            qid: q.qid,
            stem: q.stem,
            options: Object.fromEntries((q.options || []).map((o:any)=>[o.label, o.text]))
          })),
          thinking: false
        }
        const resp = await fetchWithAuth(`${MCQ_BASE_URL}/explain`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (!resp?.data?.ok) throw new Error(resp?.data?.msg || '生成失败')
        const updates = (resp.data.results || []).map((r:any)=>({ id: String(r.qid), explain: r.explain || '' }))
        if (updates.length) {
          const up = await fetchWithAuth(`${MCQ_BASE_URL}/bank/bulk_update`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: updates })
          })
          if (!up?.data?.ok) throw new Error(up?.data?.msg || '写回失败')
        }
        generateMessage.value = `完成：${updates.length} 题`
        ElMessage.success('解析生成完成')
        loadQuestions()
      } catch (error: any) {
        generateMessage.value = '失败：' + (error?.message || error)
        ElMessage.error(generateMessage.value)
      } finally { generating.value = false }
    }

    const loadQuestions = async () => {
      loadingQuestions.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/bank/list`, { method: 'GET' })
        const j = await r.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || `HTTP ${r.status}`)
        }

        const items = Array.isArray(j.items) ? j.items : []
        questions.value = items.map((it: any): Question => {
          const statusRaw = it.status || ((it.explain || '').trim() ? 'draft' : 'none')
          const status = statusRaw === 'none' ? 'draft' : statusRaw
          return {
            qid: String(it.id ?? it.qid ?? ''),
            stem: it.stem || '',
            options: normalizeOptions(it.options),
            answer: (it.answer || '').toString().toUpperCase(),   // ← 这里也要带
            analysis: it.explain || '',
            status,
          }
        })
      } catch (error: any) {
        ElMessage.error('加载题库失败：' + (error?.message || String(error)))
      } finally {
        loadingQuestions.value = false
      }
    }


    const toggleAnalysis = (qid: string) => {
      const next = !showingAnalysis[qid]
      showingAnalysis[qid] = next
      if (next) loadSources(qid)
    }

    const approveQuestion = async (qid: string) => {
      try {
        const question = (questions.value || []).find(q => q.qid === qid)
        if (!question) return
        const resp = await fetchWithAuth(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ id: qid, status: 'approved', explain: question.analysis || '' }] })
        })
        if (resp?.data?.ok) { ElMessage.success('已通过'); loadQuestions() }
        else throw new Error(resp?.data?.msg || '操作失败')
      } catch (error: any) { ElMessage.error('操作失败：' + (error?.message || error)) }
    }

    const rejectQuestion = async (qid: string) => {
      try {
        const { value: reason } = await ElMessageBox.prompt('请输入驳回原因', '驳回', { confirmButtonText: '确定', cancelButtonText: '取消' })
        const resp = await fetchWithAuth(`${MCQ_BASE_URL}/bank/bulk_reject`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [qid], reason: (reason || '不符合要求') })
        })
        if (resp?.data?.ok) { ElMessage.success('已驳回'); loadQuestions() }
        else throw new Error(resp?.data?.msg || '操作失败')
      } catch (error: any) { if (error !== 'cancel') ElMessage.error('操作失败：' + (error?.message || error)) }
    }

    const approveAll = async () => {
      try {
        await ElMessageBox.confirm('确认一键通过所有草稿/未解析的题目？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
        approvingAll.value = true
        const candidates = (filteredQuestions.value || []).filter((it:any) => (it.status || 'none') !== 'approved')
        if (candidates.length === 0) { ElMessage.info('没有可通过的题目'); return }
        const resp = await fetchWithAuth(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: candidates.map((it:any)=>({ id: it.qid, status: 'approved', explain: it.analysis || '' })) })
        })
        if (resp?.data?.ok) { ElMessage.success(`已通过 ${resp.data.count || candidates.length} 题`); loadQuestions() }
        else throw new Error(resp?.data?.msg || '操作失败')
      } catch (error: any) {
        if (error !== 'cancel') ElMessage.error('操作失败：' + (error?.message || error))
      } finally { approvingAll.value = false }
    }

    const rejectAll = async () => {
      const candidates = (filteredQuestions.value || []).filter(it => (it.status || 'none') !== 'rejected')
      if (candidates.length === 0) return ElMessage.info('没有可驳回的题目')
      rejectingAll.value = true
      try {
        const payload = { items: candidates.map(it => ({ id: it.qid, status: 'rejected', explain: it.analysis || '' })) }
        const resp = await fetchWithAuth(`${MCQ_BASE_URL}/bank/bulk_update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!resp?.data?.ok) throw new Error(resp?.data?.msg || '批量驳回失败')
        ElMessage.success(`批量驳回 ${resp.data.count||candidates.length} 题`)
        await loadQuestions()
      } catch (e:any) { ElMessage.error(e?.message || e) }
      finally { rejectingAll.value = false }
    }

    const exportBankDocx = async () => {
      exportingBank.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/bank/export_docx`)
        const blob = await r.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = '题库导出.docx'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
        ElMessage.success('已导出题库')
      } catch (e:any) { ElMessage.error(`导出失败：${e?.message||e}`) }
      finally { exportingBank.value = false }
    }

    const triggerPickBankDocx = () => { bankImportRef.value?.click() }

    const onPickBankDocx = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const f = input?.files?.[0]; if (!f) return
      importingBank.value = true
      try {
        const fd = new FormData(); fd.append('file', f)
        const r = await fetch(`${MCQ_BASE_URL}/bank/import_docx`, { method:'POST', body: fd })
        const j = await r.json(); if (!j?.ok) throw new Error(j?.msg || '导入失败')
        ElMessage.success(`导入成功：${j.count||0} 题`)
        await loadQuestions()
      } catch(e:any) { ElMessage.error(`导入失败：${e?.message||e}`) }
      finally { importingBank.value = false; if (bankImportRef.value) bankImportRef.value.value='' }
    }

    const viewSources = async (qid: string) => {
      const url1 = `${MCQ_BASE_URL}/bank/sources?qid=${encodeURIComponent(qid)}`
      try { const res = await fetch(url1, { method: 'GET' }); if (res.ok) { openInNewTab(url1); return } }
      catch (e) { /* ignore */ }
      const url2 = `/mcq_public/bank/sources?qid=${encodeURIComponent(qid)}`
      openInNewTab(url2)
    }
    const isEditing = (id: string) => editingId.value === id

    const editRow = (row: any) => {
      editingId.value = row.qid
      editBuf.stem = row.stem || ''
      editBuf.answer = row.answer || ''
      editBuf.explain = row.analysis || ''

      const map: Record<string, string> = {}
      ;(row.options || []).forEach((o: any) => {
        map[o.label] = o.text
      })
      editBuf.options = { ...map }
    }

    const cancelEdit = () => {
      editingId.value = null
    }

    const saveRow = async (row: any) => {
      if (!isEditing(row.qid)) return
      try {
        // 1) 把当前编辑缓冲区打包发给后端（注意带上 answer）
        const payload = {
          items: [
            {
              id: row.qid,
              stem: editBuf.stem,
              options: { ...editBuf.options },
              answer: (editBuf.answer || '').toUpperCase(),
              explain: editBuf.explain,
            },
          ],
        }

        const up = await fetchWithAuth(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!up?.data?.ok) {
          throw new Error(up?.data?.msg || '保存失败')
        }

        // 2) 用后端返回的最新记录覆盖当前行，保证和 bank.json 完全一致
        const updated = (up.data.items && up.data.items[0]) || null
        if (updated) {
          row.stem = updated.stem || ''
          row.options = normalizeOptions(updated.options || {})
          row.answer = (updated.answer || '').toString().toUpperCase()
          row.analysis = updated.explain || ''
          const statusRaw = updated.status || ((row.analysis || '').trim() ? 'draft' : 'none')
          row.status = statusRaw === 'none' ? 'draft' : statusRaw
        } else {
          // 理论上不会走到这里，兜底用前端缓冲区
          row.stem = editBuf.stem
          row.options = normalizeOptions(editBuf.options)
          row.answer = (editBuf.answer || '').toString().toUpperCase()
          row.analysis = editBuf.explain
          row.status = row.analysis && row.analysis.trim() ? 'draft' : 'none'
        }

        ElMessage.success('保存成功')
        editingId.value = null
      } catch (e: any) {
        ElMessage.error(e?.message || e)
      }
    }

    const regenAndSave = async (row:any) => {
      rowRegenLoading[row.qid] = true
      try{
        const req:any = {
          items: [{ qid: row.qid, stem: row.stem, options: Object.fromEntries((row.options||[]).map((o:any)=>[o.label,o.text])) }],
          thinking: thinking.value, model_id: llmModelId.value, rerank_top_n: topN.value, use_insert_block: insertBlock.value
        }
        const resp = await fetchWithAuth(`${MCQ_BASE_URL}/explain`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req)})
        if (!resp?.data?.ok || !Array.isArray(resp.data.results) || !resp.data.results.length) throw new Error(resp?.data?.msg || '解析失败')
        const r0 = resp.data.results[0]
        const explain = (r0.explain||'').trim()
        const newStatus = r0.answer_mismatch ? 'abnormal' : 'draft'
        const up = await fetchWithAuth(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: [{ id: row.qid, explain, status: newStatus }] })
        })
        if (!up?.data?.ok) throw new Error(up?.data?.msg || '写回失败')
        row.analysis = explain; row.status = newStatus
        ElMessage.success('已重生成并保存')
      }catch(e:any){ ElMessage.error(e?.message||e) }
      finally { rowRegenLoading[row.qid] = false }
    }

    const optionKeys = (opts: Array<{label:string;text:string}> | Record<string,string>) => {
      if (Array.isArray(opts)) return (opts as any[]).map((o:any)=>o.label).filter(Boolean).sort()
      return Object.keys(opts || {}).sort()
    }
    const pagedQuestions = computed(() => {
      const start = (page.value - 1) * pageSize.value
      return (filteredQuestions.value || []).slice(start, start + pageSize.value)
    })

    const createPaper = async () => {
      // 仍然要求填写标题，和原行为保持一致
      if (!paperTitle.value) return ElMessage.warning('请输入试卷标题')

      const name = (paperTitle.value || '').trim() || '试卷'
      creatingPaper.value = true
      paperMessage.value = '生成中…'

      try {
        const r = await fetch(`${MCQ_BASE_URL}/bank/generate_paper`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        })

        const ct = (r.headers && r.headers.get)
          ? (r.headers.get('content-type') || '')
          : ''

        // 如果是 JSON，说明是“无可用题目”或错误信息，按 qa_public.html 的规则处理
        if (ct.includes('application/json')) {
          const j = await r.json()
          if (!j.ok) throw new Error(j.msg || `HTTP ${r.status}`)
          paperMessage.value = j.msg || '无可用题目'
          return
        }

        // 否则认为是 DOCX，直接触发下载
        const blob = await r.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${name}.docx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)

        paperMessage.value = '试卷已生成'
        ElMessage.success('试卷生成成功')
        setTimeout(() => { paperMessage.value = '' }, 1500)
      } catch (error: any) {
        const msg = error?.message || error
        paperMessage.value = '生成失败：' + msg
        ElMessage.error(paperMessage.value)
      } finally {
        creatingPaper.value = false
      }
    }

    const loadExportPapers = async () => {
      loadingExportPapers.value = true
      try {
        // 直接走 MCQ 试卷列表：GET {MCQ_BASE_URL}/bank/papers
        const r = await fetch(`${MCQ_BASE_URL}/bank/papers`, { method: 'GET', cache: 'no-store' })
        const j = await r.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || `HTTP ${r.status}`)
        }
        exportPapers.value = Array.isArray(j.papers) ? j.papers : []
        // 默认选中第一份试卷
        if (!selectedExportPaper.value && exportPapers.value.length > 0) {
          selectedExportPaper.value = exportPapers.value[0].paper_id
        }
      } catch (error: any) {
        ElMessage.error('加载试卷列表失败：' + (error?.message || error))
      } finally {
        loadingExportPapers.value = false
      }
    }
    const exportZip = () => {
      if (!selectedExportPaper.value) {
        return ElMessage.warning('请选择试卷')
      }
      const url = `${MCQ_BASE_URL}/bank/paper_zip?paper_id=${encodeURIComponent(selectedExportPaper.value)}`
      openInNewTab(url)
      ElMessage.success('导出成功')
    }

    const exportDocx = () => {
      if (!selectedExportPaper.value) {
        return ElMessage.warning('请选择试卷')
      }
      const url = `${MCQ_BASE_URL}/bank/paper_docx?paper_id=${encodeURIComponent(selectedExportPaper.value)}`
      openInNewTab(url)
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
      generateExplanations, loadQuestions, toggleAnalysis, approveQuestion, rejectQuestion,cancelEdit,saveRow,
      approveAll, createPaper, loadExportPapers, exportZip, exportDocx,isEditing,editRow,
      loadUsers, filteredUsers, applyUserSearch, banUser, unbanUser, roleName, isRegularUser,onPickBankDocx,
      loadPendingUsers, approveUser, rejectUser, maskIdCard,uploadRef,exportingBank,importingBank,viewSources,
      bankImportRef,asyncExplaining,asyncMsg,llmOptions,llmModelId,topN,thinking,insertBlock,triggerPickBankDocx,
      rejectingAll,page,pageSize,rowRegenLoading,editingId,editBuf,counterMsg,explainBatchAsync,rejectAll,exportBankDocx,
      UserStatus, isBanned, getStatusTagType, getStatusText, Refresh,regenAndSave,pagedQuestions,optionKeys,
      sourcesMap, sourcesLoading, sourcesLoaded, sourcesError, sourcePassages, getSourceTitle, getSourceMeta, isGroupedSources

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
  margin-bottom: 12px;
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

.q-analysis-text {
  white-space: pre-wrap;
  margin-bottom: 0.5rem;
}

.analysis-sources {
  margin-top: 0.25rem;
}

.analysis-sources summary {
  cursor: pointer;
  font-weight: 600;
}

.src-loading,
.src-empty,
.src-error {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.src-error {
  color: #b91c1c;
}

.src-group {
  margin-top: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
}

.src-group-body {
  margin-top: 0.25rem;
}

.src-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  background: #f9fafb;
}

.src-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.src-meta {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.src-passages {
  margin-top: 4px;
}

.passage {
  margin-top: 4px;
  border-radius: 4px;
  border: 1px dashed #d1d5db;
  background: #f3f4f6;
  padding: 4px 6px;
}

.passage pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
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
/* 选项整体容器占满一整行，宽度和“题干”一致 */
.opts-grid {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 每一行（A/B/C/D）也占满整行 */
.opt-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.opt-label {
  flex: 0 0 22px;
  text-align: right;
  color: #475569;
  line-height: 1.6;
  padding-top: 3px;
}

/* 右侧输入框占掉剩余所有宽度 */
.opt-input {
  flex: 1 1 auto;
}

</style>