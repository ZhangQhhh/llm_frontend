<template>
  <div class="exam-page">
    <!-- 顶部工具栏 -->
    <div class="topbar">
      <div class="topwrap">
        <h1>📝 边检智学</h1>
        
        <div class="control-group">
          <label class="muted">试卷：</label>
          <el-select v-model="selectedPaperId" placeholder="选择试卷" style="width: 240px" size="default">
            <el-option
              v-for="paper in papers"
              :key="paper.paper_id"
              :label="`${paper.title}（${paper.item_count || 0}题）`"
              :value="paper.paper_id"
            />
          </el-select>
          <el-button @click="loadPapers" :loading="loadingPapers" size="default">刷新</el-button>
        </div>
        
        <div class="control-group">
          <label class="muted">时长：</label>
          <el-input-number
            v-model="durationMin"
            :min="1"
            :max="180"
            :disabled="examStarted"
            style="width: 100px"
            size="default"
          />
          <span class="muted">分钟</span>
        </div>
        
        <el-button type="primary" @click="startExam" :disabled="!selectedPaperId || examStarted" :loading="starting" size="default">
          开始作答
        </el-button>
        
        <div class="time">
          <span class="muted">倒计时：</span>
          <span class="pill">{{ timerDisplay }}</span>
        </div>
        
        <div class="user-actions">
          <span class="user-name">{{ username }}</span>
          <el-button size="small" text @click="handleChangePassword">修改密码</el-button>
        </div>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="wrap">
      <!-- 左侧导航 -->
      <div class="side card" v-if="examStarted && questions.length > 0">
        <h3>题目导航</h3>
        <div class="navgrid">
          <button
            v-for="(q, idx) in questions"
            :key="q.qid"
            :class="['navbtn', { answered: isAnswered(q.qid), current: isCurrentPage(idx) }]"
            @click="jumpToQuestion(idx)"
          >
            {{ idx + 1 }}
          </button>
        </div>
        <div class="pager" style="margin-top: 10px">
          <el-button size="small" @click="prevPage" :disabled="currentPage === 1">上一页</el-button>
          <span class="muted">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <el-button size="small" @click="nextPage" :disabled="currentPage === totalPages">下一页</el-button>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main">

        <!-- 头部信息 -->
        <div class="card head">
          <h2>{{ paperTitle }}</h2>
          <div class="sub">
            <span class="muted">每页显示</span>
            <el-select v-model="pageSize" size="small" style="width: 80px; margin: 0 8px" @change="handlePageSizeChange">
              <el-option :value="3" label="3" />
              <el-option :value="5" label="5" />
              <el-option :value="10" label="10" />
            </el-select>
            <span class="muted">题</span>
          </div>
        </div>

        <!-- 题目列表 -->
        <div v-if="!examStarted" class="empty-hint card">
          <el-empty description="请点击开始作答按钮后显示题目" />
        </div>

        <div v-else-if="questions.length === 0" class="empty-hint card">
          <el-empty description="未获取到题目" />
        </div>

        <div v-else class="qlist">
          <div v-for="(q, idx) in currentPageQuestions" :key="q.qid" class="q">
            <div class="qheader">
              <b><span>{{ getQuestionNumber(idx) }}. </span><span v-html="formatText(q.stem)"></span></b>
              <span :class="['tag', q.qtype === 'multi' ? 'multi' : 'single']">
                {{ q.qtype === 'multi' ? '多选' : '单选' }}
              </span>
            </div>
            <div class="opts">
              <!-- 多选题 -->
              <template v-if="q.qtype === 'multi'">
                <button
                  v-for="opt in q.options"
                  :key="opt.label"
                  :class="['opt', { active: answersState[q.qid]?.includes(opt.label) }]"
                  @click="toggleMultiOption(q.qid, opt.label)"
                  :disabled="submitted"
                >
                  <span>{{ opt.label }}. </span><span v-html="formatText(opt.text)"></span>
                </button>
              </template>
              <!-- 单选题 -->
              <template v-else>
                <button
                  v-for="opt in q.options"
                  :key="opt.label"
                  :class="['opt', { active: answersState[q.qid] === opt.label }]"
                  @click="selectSingleOption(q.qid, opt.label)"
                  :disabled="submitted"
                >
                  <span>{{ opt.label }}. </span><span v-html="formatText(opt.text)"></span>
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="card footact" v-if="examStarted">
          <el-button type="primary" size="large" @click="submitExam" :disabled="submitted" :loading="submitting">
            交卷并评分
          </el-button>
          <span class="muted">{{ submitMessage }}</span>
        </div>

        <!-- 错题统计与知识点分析 -->
        <div v-if="reviewData && wrongQuestions.length > 0" class="card wrong-stats-panel">
          <h3>错题统计与知识点分析</h3>
          
          <!-- 概览统计 -->
          <div class="stats-overview">
            <div class="stat-item wrong">
              <span class="stat-num">{{ wrongQuestions.length }}</span>
              <span class="stat-label">错题数</span>
            </div>
            <div class="stat-item kp">
              <span class="stat-num">{{ knowledgePointStats.length }}</span>
              <span class="stat-label">涉及知识点</span>
            </div>
          </div>

          <!-- 知识点统计表格 -->
          <div class="kp-stats" v-if="knowledgePointStats.length > 0">
            <h4>📚 薄弱知识点排行（按错题数降序）</h4>
            <div class="kp-table">
              <div class="kp-row kp-header">
                <span class="kp-name">知识点名称</span>
                <span class="kp-count">错题数</span>
                <span class="kp-action">操作</span>
              </div>
              <div 
                v-for="(kp, idx) in knowledgePointStats" 
                :key="idx" 
                class="kp-row"
                :class="{ 'kp-danger': kp.count >= 3, 'kp-warning': kp.count === 2 }"
              >
                <span class="kp-name">《{{ kp.name }}》</span>
                <span class="kp-count">
                  <span class="count-badge">{{ kp.count }}</span>
                </span>
                <span class="kp-action">
                  <el-button size="small" type="primary" text @click="scrollToWrongByKp(kp.name)">
                    查看错题
                  </el-button>
                </span>
              </div>
            </div>
          </div>

          <!-- 无知识点提示 -->
          <div v-else class="no-kp-hint">
            <el-alert type="info" :closable="false" show-icon>
              部分错题暂无知识点信息，请查看下方详细解析
            </el-alert>
          </div>

          <!-- 复习建议 -->
          <div class="review-suggestion" v-if="knowledgePointStats.length > 0">
            <h4>💡 复习建议</h4>
            <p>根据您的答题情况，建议重点复习以下知识点：</p>
            <div class="suggestion-tags">
              <span 
                v-for="(kp, idx) in knowledgePointStats.slice(0, 5)" 
                :key="idx" 
                class="suggestion-tag"
                :class="{ 'urgent': kp.count >= 3 }"
              >
                {{ kp.name }}
                <span class="tag-count">{{ kp.count }}题</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 成绩展示 -->
        <div v-if="gradeReport" class="card result-panel">
          <h3>考试结果</h3>
          <div class="grid">
            <div class="chart">
              <canvas ref="scoreChartRef" width="220" height="220"></canvas>
            </div>
            <div class="chart">
              <div class="legend">
                <span class="lg ok">✅ 正确</span>
                <span class="lg partial">🟡 部分得分</span>
                <span class="lg bad">❌ 错误</span>
              </div>
              <div class="stat-text">
                总题数：{{ questions.length }}<br>
                答对：{{ correctCount }}<br>
                正确率：{{ correctRate }}%<br>
                总分：{{ (gradeReport.total_score || 0).toFixed(2) }}
              </div>
              <div class="qgrid">
                <div
                  v-for="(item, idx) in gradeReport.items"
                  :key="idx"
                  :class="['qcell', getScoreClass(item)]"
                >
                  {{ idx + 1 }}
                </div>
              </div>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <el-button @click="exportReport" :loading="exporting">导出成绩报告（DOCX）</el-button>
            <el-button 
              type="warning" 
              @click="exportWrongReport" 
              :loading="exportingWrong"
            >
              导出错题报告（DOCX）
            </el-button>
            <span class="muted">{{ exportMessage }}</span>
          </div>
        </div>

        <!-- 答案与解析 -->
        <div v-if="reviewData" class="card review-panel">
          <h3>答案与解析</h3>
          <div class="review-list">
            <div v-for="(item, idx) in reviewData.items" :key="idx" class="q">
              <div class="qheader">
                <b><span>{{ idx + 1 }}. </span><span v-html="formatText(item.stem)"></span></b>
                <span :class="['tag', item.qtype === 'multi' ? 'multi' : 'single']">
                  {{ item.qtype === 'multi' ? '多选' : '单选' }}
                </span>
              </div>
              <div class="muted" style="margin: 8px 0">
                标准答案：{{ item.correct_labels.join('') }}
                ｜ 我的作答：{{ item.my_labels?.join('') || '(未作答)' }}
                ｜ 判定：{{ item.is_correct ? '正确' : (item.my_labels?.length > 0 ? '部分得分' : '错误') }}
              </div>
              <div class="opts">
                <button
                  v-for="opt in item.options"
                  :key="opt.label"
                  :class="['opt', { 
                    active: item.my_labels?.includes(opt.label),
                    correct: item.correct_labels.includes(opt.label)
                  }]"
                  disabled
                >
                  <span>{{ opt.label }}. </span><span v-html="formatText(opt.text)"></span>
                </button>
              </div>
              <div class="analysis" v-html="formatAnalysis(item.analysis) || '（无解析）'">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item label="旧密码">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="changingPassword">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MCQ_BASE_URL } from '@/config/api/api'
import { renderMarkdown } from '@/utils/markdown'

// API endpoints matching mcq_public_routes.py
const API_ENDPOINTS = {
  PAPERS: {
    LIST_OPEN: `${MCQ_BASE_URL}/papers/list_open`,
    VIEW: `${MCQ_BASE_URL}/papers/view`
  },
  EXAM: {
    START: `${MCQ_BASE_URL}/exam/start`,
    SUBMIT: `${MCQ_BASE_URL}/exam/submit`,
    REVIEW: `${MCQ_BASE_URL}/exam/review`
  },
  STUDENT: {
    EXPORT_MY_REPORT_DOCX: `${MCQ_BASE_URL}/student/export_my_report_docx`,
    EXPORT_WRONG_REPORT_DOCX: `${MCQ_BASE_URL}/student/export_wrong_report_docx`
  },
  AUTH: {
    CHANGE_PASSWORD: '/api/auth/change_password'
  }
}

interface Question {
  qid: string
  stem: string
  qtype: string
  options: Array<{ label: string; text: string }>
}

interface Paper {
  paper_id: string
  title: string
  item_count?: number
}

interface GradeItem {
  qid: string
  score: number
  is_correct: boolean
}

interface GradeReport {
  total_score: number
  items: GradeItem[]
}

interface ReviewItem extends Question {
  correct_labels: string[]
  my_labels?: string[]
  analysis: string
  is_correct: boolean
}

interface ReviewData {
  items: ReviewItem[]
}

export default defineComponent({
  name: 'ExamView',
  setup() {
    const store = useStore()
    const username = computed(() => store.state.user.username || '学生')

    // 试卷相关
    const papers = ref<Paper[]>([])
    const selectedPaperId = ref('')
    const loadingPapers = ref(false)
    const paperTitle = ref('尚未开始')

    // 考试相关
    const questions = ref<Question[]>([])
    const examStarted = ref(false)
    const durationMin = ref(30)
    const starting = ref(false)
    const attemptId = ref('')
    const leftSeconds = ref(0)
    const timerHandle = ref<number | null>(null)

    // 答题相关
    const answersState = ref<Record<string, any>>({})
    const currentPage = ref(1)
    const pageSize = ref(3)

    // 提交相关
    const submitted = ref(false)
    const submitting = ref(false)
    const submitMessage = ref('')

    // 成绩相关
    const gradeReport = ref<GradeReport | null>(null)
    const reviewData = ref<ReviewData | null>(null)
    const exporting = ref(false)
    const exportingWrong = ref(false)
    const exportMessage = ref('')
    const scoreChartRef = ref<HTMLCanvasElement | null>(null)

    // 修改密码
    const passwordDialogVisible = ref(false)
    const passwordForm = ref({
      oldPassword: '',
      newPassword: ''
    })
    const changingPassword = ref(false)

    const timerDisplay = computed(() => {
      if (!examStarted.value) return '--:--'
      const min = Math.floor(leftSeconds.value / 60)
      const sec = leftSeconds.value % 60
      return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    })

    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(questions.value.length / pageSize.value))
    })

    const currentPageQuestions = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      return questions.value.slice(start, start + pageSize.value)
    })

    const correctCount = computed(() => {
      if (!gradeReport.value) return 0
      return gradeReport.value.items.filter(item => item.is_correct).length
    })

    const correctRate = computed(() => {
      const total = questions.value.length
      if (total === 0) return 0
      return Math.round((correctCount.value / total) * 100)
    })

    // 错题列表
    const wrongQuestions = computed(() => {
      if (!reviewData.value) return []
      return reviewData.value.items.filter(item => !item.is_correct)
    })

    // 从解析文本中提取知识点
    const extractKnowledgePoints = (analysis: string): string[] => {
      if (!analysis) return []
      // 匹配 "知识点：《XXX》、《YYY》" 格式
      const match = analysis.match(/知识点：(.+?)(?:\n|$)/)
      if (!match) return []
      // 提取所有《XXX》中的内容
      const kpText = match[1]
      const kpMatches = kpText.match(/《([^》]+)》/g)
      if (!kpMatches) return []
      return kpMatches.map(kp => kp.replace(/[《》]/g, ''))
    }

    // 知识点统计（按错题数排序）
    const knowledgePointStats = computed(() => {
      const kpMap: Record<string, { name: string; count: number; questionIndices: number[] }> = {}
      
      wrongQuestions.value.forEach((item) => {
        const kps = extractKnowledgePoints(item.analysis)
        kps.forEach(kp => {
          if (!kpMap[kp]) {
            kpMap[kp] = { name: kp, count: 0, questionIndices: [] }
          }
          kpMap[kp].count++
          // 记录原始索引（在reviewData.items中的位置）
          const originalIdx = reviewData.value?.items.findIndex(q => q.qid === item.qid) ?? -1
          if (originalIdx >= 0) {
            kpMap[kp].questionIndices.push(originalIdx)
          }
        })
      })
      
      // 按错题数降序排列
      return Object.values(kpMap).sort((a, b) => b.count - a.count)
    })

    // 滚动到指定知识点的错题
    const scrollToWrongByKp = (kpName: string) => {
      const stat = knowledgePointStats.value.find(kp => kp.name === kpName)
      if (stat && stat.questionIndices.length > 0) {
        // 滚动到第一个相关错题
        const targetIdx = stat.questionIndices[0]
        const reviewPanel = document.querySelector('.review-panel')
        if (reviewPanel) {
          const questionElements = reviewPanel.querySelectorAll('.q')
          if (questionElements[targetIdx]) {
            questionElements[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
            // 添加高亮效果
            questionElements[targetIdx].classList.add('highlight-question')
            setTimeout(() => {
              questionElements[targetIdx].classList.remove('highlight-question')
            }, 2000)
          }
        }
      }
    }

    const getQuestionNumber = (idx: number) => {
      return (currentPage.value - 1) * pageSize.value + idx + 1
    }

    const isAnswered = (qid: string) => {
      const answer = answersState.value[qid]
      if (Array.isArray(answer)) return answer.length > 0
      return !!answer
    }

    const isCurrentPage = (idx: number) => {
      const page = Math.floor(idx / pageSize.value) + 1
      return page === currentPage.value
    }

    const jumpToQuestion = (idx: number) => {
      const page = Math.floor(idx / pageSize.value) + 1
      currentPage.value = page
    }

    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++
    }

    const handlePageSizeChange = () => {
      currentPage.value = 1
    }

    const getScoreClass = (item: GradeItem) => {
      if (item.is_correct) return 'ok'
      if (item.score > 0) return 'partial'
      return 'bad'
    }

    // 将 <NEWLINE> 标识符转换为换行显示
    const formatText = (text: string | undefined | null): string => {
      if (!text) return ''
      // 先转义 HTML 特殊字符，再将 <NEWLINE> 替换为 <br>
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;NEWLINE&gt;/g, '<br>')
    }

    // 格式化解析文本：渲染 markdown 并过滤"参考来源"
    const formatAnalysis = (text: string | undefined | null): string => {
      if (!text) return ''
      // 过滤掉"参考来源"（可能被加粗）
      let cleaned = text
        .replace(/\*\*参考来源\*\*[：:\s]*/g, '')
        .replace(/参考来源[：:\s]*/g, '')
      return renderMarkdown(cleaned)
    }

    const toggleMultiOption = (qid: string, label: string) => {
      if (submitted.value) return
      const current = answersState.value[qid] || []
      const idx = current.indexOf(label)
      if (idx > -1) {
        answersState.value[qid] = current.filter((l: string) => l !== label)
      } else {
        answersState.value[qid] = [...current, label]
      }
    }

    const selectSingleOption = (qid: string, label: string) => {
      if (submitted.value) return
      answersState.value[qid] = label
    }

    // 绘制圆环进度图
    const drawRing = (canvas: HTMLCanvasElement, correct: number, total: number) => {
      const size = 220
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1))
      canvas.style.width = size + 'px'
      canvas.style.height = size + 'px'
      canvas.width = size * ratio
      canvas.height = size * ratio
      ctx.scale(ratio, ratio)

      const cx = size / 2
      const cy = size / 2
      const radius = 88
      const thick = 16
      const start = -Math.PI / 2
      const pct = total ? Math.max(0, Math.min(1, correct / total)) : 0

      // 背景
      ctx.clearRect(0, 0, size, size)
      ctx.lineCap = 'round'

      // 轨道
      ctx.beginPath()
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = thick
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()

      // 进度
      ctx.beginPath()
      ctx.strokeStyle = '#2b7cff'
      ctx.lineWidth = thick
      ctx.arc(cx, cy, radius, start, start + Math.PI * 2 * pct, false)
      ctx.stroke()

      // 中心文本
      const percentTxt = total ? Math.round(pct * 100) + '%' : '--%'
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 24px system-ui, -apple-system, Segoe UI, Roboto, Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(percentTxt, cx, cy - 8)

      ctx.fillStyle = '#6b7280'
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
      ctx.fillText(`正确 ${correct} / ${total}`, cx, cy + 14)
    }

    // MCQ 接口专用 fetch（带超时控制）
    const mcqFetch = async (url: string, options: any = {}, timeout = 120000) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      try {
        const resp = await fetch(url, {
          ...options,
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        const contentType = resp.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const text = await resp.text()
          throw new Error(`HTTP ${resp.status} 非 JSON 响应：${text.substring(0, 800)}`)
        }
        
        const data = await resp.json()
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}：${JSON.stringify(data)}`)
        }
        return data
      } catch (error: any) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    const loadPapers = async () => {
      loadingPapers.value = true
      try {
        const data = await mcqFetch(API_ENDPOINTS.PAPERS.LIST_OPEN)
        // Backend returns array directly: [{paper_id, title, item_count}]
        if (Array.isArray(data)) {
          papers.value = data
        } else {
          papers.value = []
        }
        if (papers.value.length === 0) {
          ElMessage.warning('暂无可用试卷')
        }
      } catch (error: any) {
        ElMessage.error('加载试卷失败：' + (error.message || '未知错误'))
      } finally {
        loadingPapers.value = false
      }
    }

    const startExam = async () => {
      if (!selectedPaperId.value) {
        ElMessage.warning('请选择试卷')
        return
      }
      starting.value = true
      try {
        // 开始考试
        const startData = await mcqFetch(API_ENDPOINTS.EXAM.START, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paper_id: selectedPaperId.value,
            duration_sec: durationMin.value * 60,
            student_id: store.state.user.username || 'anonymous'
          })
        })

        if (!startData.ok) {
          throw new Error(startData.detail || '创建会话失败')
        }

        attemptId.value = startData.attempt_id
        leftSeconds.value = startData.left_sec || durationMin.value * 60

        // 获取题目
        const questionsData = await mcqFetch(
          `${API_ENDPOINTS.PAPERS.VIEW}?paper_id=${encodeURIComponent(selectedPaperId.value)}`
        )
        
        if (!questionsData.ok) {
          throw new Error(questionsData.detail || '获取题目失败')
        }
        
        questions.value = questionsData.items || []
        paperTitle.value = questionsData.title || '试卷'

        // 初始化答案状态
        const newAnswersState: Record<string, any> = {}
        questions.value.forEach(q => {
          newAnswersState[q.qid] = q.qtype === 'multi' ? [] : ''
        })
        answersState.value = newAnswersState

        examStarted.value = true
        currentPage.value = 1
        submitted.value = false
        gradeReport.value = null
        reviewData.value = null

        // 启动倒计时
        startTimer()

        ElMessage.success('考试已开始')
      } catch (error: any) {
        ElMessage.error('开始失败：' + (error.message || '未知错误'))
      } finally {
        starting.value = false
      }
    }

    const startTimer = () => {
      if (timerHandle.value) clearInterval(timerHandle.value)
      timerHandle.value = window.setInterval(() => {
        leftSeconds.value -= 1
        if (leftSeconds.value <= 0) {
          stopTimer()
          if (!submitted.value) {
            ElMessage.warning('时间到，自动提交')
            submitExam(true)
          }
        }
      }, 1000)
    }

    const stopTimer = () => {
      if (timerHandle.value) {
        clearInterval(timerHandle.value)
        timerHandle.value = null
      }
    }

    const collectAnswers = () => {
      const answers: Array<{ qid: string; chosen_labels: string[] }> = []
      questions.value.forEach(q => {
        const answer = answersState.value[q.qid]
        let labels: string[] = []
        if (q.qtype === 'multi') {
          labels = Array.isArray(answer) ? answer : []
        } else {
          labels = answer ? [answer] : []
        }
        if (labels.length > 0) {
          answers.push({ qid: q.qid, chosen_labels: labels })
        }
      })
      return answers
    }

    const submitExam = async (auto = false) => {
      if (!attemptId.value) {
        ElMessage.warning('请先开始作答')
        return
      }

      const answers = collectAnswers()
      const unanswered = answers.filter(a => a.chosen_labels.length === 0).length

      if (!auto && unanswered > 0) {
        try {
          await ElMessageBox.confirm(
            `确认提交？尚有 ${unanswered} 题未作答。`,
            '提示',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
        } catch {
          return
        }
      }

      submitting.value = true
      submitMessage.value = '评分中…'

      try {
        const data = await mcqFetch(API_ENDPOINTS.EXAM.SUBMIT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attemptId.value,
            answers
          })
        })

        if (!data.ok) {
          throw new Error(data.detail || '提交失败')
        }

        gradeReport.value = data
        submitted.value = true
        submitMessage.value = '评分完成'
        stopTimer()

        // 绘制圆环图
        await nextTick()
        if (scoreChartRef.value) {
          drawRing(scoreChartRef.value, correctCount.value, questions.value.length)
        }

        // 加载答案解析
        await loadReview()

        ElMessage.success('提交成功')
      } catch (error: any) {
        submitMessage.value = '提交失败'
        ElMessage.error('提交失败：' + (error.message || '未知错误'))
      } finally {
        submitting.value = false
      }
    }

    const loadReview = async () => {
      if (!attemptId.value) return
      try {
        const data = await mcqFetch(
          `${API_ENDPOINTS.EXAM.REVIEW}?attempt_id=${encodeURIComponent(attemptId.value)}`
        )
        if (data.ok) {
          reviewData.value = data
        }
      } catch (error: any) {
        console.error('加载解析失败：', error)
      }
    }

    const exportReport = async () => {
      if (!attemptId.value) {
        ElMessage.warning('缺少会话信息')
        return
      }
      exporting.value = true
      exportMessage.value = '导出中…'
      try {
        // 第一步：调用导出接口生成报告
        const formData = new FormData()
        formData.append('attempt_id', attemptId.value)
        
        const data = await mcqFetch(API_ENDPOINTS.STUDENT.EXPORT_MY_REPORT_DOCX, {
          method: 'POST',
          body: formData
        })

        if (!data.ok) {
          throw new Error(data.detail || '导出失败')
        }

        // 第二步：使用返回的 download_url 下载文件
        if (data.download_url) {
          // 如果是相对路径，需要拼接完整 URL
          let downloadUrl = data.download_url
          if (downloadUrl.startsWith('/')) {
            downloadUrl = `${MCQ_BASE_URL}${downloadUrl}`
          }
          
          // 直接打开下载链接
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = data.filename || '成绩报告.docx'
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          exportMessage.value = '已导出'
          setTimeout(() => { exportMessage.value = '' }, 2000)
          ElMessage.success('导出成功')
        } else {
          throw new Error('未获取到下载链接')
        }
      } catch (error: any) {
        exportMessage.value = '导出失败'
        ElMessage.error('导出失败：' + (error.message || '未知错误'))
        console.error('导出报告错误：', error)
      } finally {
        exporting.value = false
      }
    }

    const exportWrongReport = async () => {
      if (!attemptId.value) {
        ElMessage.warning('缺少会话信息')
        return
      }
      if (wrongQuestions.value.length === 0) {
        ElMessage.success('恭喜！本次考试全部正确，没有错题需要导出 🎉')
        return
      }
      exportingWrong.value = true
      exportMessage.value = '导出错题报告中…'
      try {
        const formData = new FormData()
        formData.append('attempt_id', attemptId.value)
        
        const data = await mcqFetch(API_ENDPOINTS.STUDENT.EXPORT_WRONG_REPORT_DOCX, {
          method: 'POST',
          body: formData
        })

        if (!data.ok) {
          throw new Error(data.detail || '导出失败')
        }

        if (data.download_url) {
          let downloadUrl = data.download_url
          if (downloadUrl.startsWith('/')) {
            downloadUrl = `${MCQ_BASE_URL}${downloadUrl}`
          }
          
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = data.filename || '错题报告.docx'
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          exportMessage.value = `已导出（${data.wrong_count}道错题，${data.kp_count}个知识点）`
          setTimeout(() => { exportMessage.value = '' }, 3000)
          ElMessage.success('错题报告导出成功')
        } else {
          throw new Error('未获取到下载链接')
        }
      } catch (error: any) {
        exportMessage.value = '导出失败'
        ElMessage.error('导出错题报告失败：' + (error.message || '未知错误'))
        console.error('导出错题报告错误：', error)
      } finally {
        exportingWrong.value = false
      }
    }

    const handleChangePassword = () => {
      passwordDialogVisible.value = true
      passwordForm.value = { oldPassword: '', newPassword: '' }
    }

    const changePassword = async () => {
      if (!passwordForm.value.newPassword) {
        ElMessage.warning('新密码不可为空')
        return
      }
      changingPassword.value = true
      try {
        // 注意：修改密码走 /api 路径，不是 MCQ 接口
        const resp = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old_password: passwordForm.value.oldPassword,
            new_password: passwordForm.value.newPassword
          })
        })
        const data = await resp.json()

        if (data.ok) {
          ElMessage.success('修改成功，请重新登录')
          passwordDialogVisible.value = false
          store.dispatch('logout')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
        } else {
          throw new Error(data.detail || '修改失败')
        }
      } catch (error: any) {
        ElMessage.error('修改失败：' + (error.message || '未知错误'))
      } finally {
        changingPassword.value = false
      }
    }

    onMounted(() => {
      loadPapers()
    })

    onUnmounted(() => {
      stopTimer()
    })

    return {
      username,
      papers,
      selectedPaperId,
      loadingPapers,
      paperTitle,
      questions,
      examStarted,
      durationMin,
      starting,
      timerDisplay,
      answersState,
      currentPage,
      pageSize,
      totalPages,
      currentPageQuestions,
      submitted,
      submitting,
      submitMessage,
      gradeReport,
      correctCount,
      correctRate,
      reviewData,
      wrongQuestions,
      knowledgePointStats,
      scrollToWrongByKp,
      exporting,
      exportingWrong,
      exportMessage,
      exportWrongReport,
      scoreChartRef,
      passwordDialogVisible,
      passwordForm,
      changingPassword,
      loadPapers,
      startExam,
      submitExam,
      exportReport,
      getQuestionNumber,
      isAnswered,
      isCurrentPage,
      jumpToQuestion,
      prevPage,
      nextPage,
      handlePageSizeChange,
      getScoreClass,
      formatText,
      formatAnalysis,
      toggleMultiOption,
      selectSingleOption,
      handleChangePassword,
      changePassword
    }
  }
})
</script>

<style scoped>
/* 全局变量 */
:root {
  --bg: #f7f8fb;
  --card: #ffffff;
  --muted: #6b7280;
  --border: #e5e7eb;
  --ink: #111827;
  --pri: #2b7cff;
  --ok: #10b981;
  --warn: #f59e0b;
  --bad: #ef4444;
}

.exam-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/robot.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  color: #111827;
  position: relative;
}

.exam-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  z-index: 0;
}

/* 顶栏 */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.topwrap {
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.topwrap h1 {
  font-size: 20px;
  margin: 0 12px 0 0;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.muted {
  color: #6b7280;
  font-size: 14px;
  white-space: nowrap;
}

.time {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pill {
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 999px;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  font-weight: 600;
  font-size: 14px;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 16px;
  border-left: 1px solid rgba(229, 231, 235, 0.5);
}

.user-name {
  font-size: 14px;
  color: #4b5563;
}

/* 布局 */
.wrap {
  max-width: 1400px;
  margin: 24px auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  position: relative;
  z-index: 1;
}

@media (max-width: 900px) {
  .wrap {
    grid-template-columns: 1fr;
    padding: 0 16px;
  }
}

/* 侧栏（导航） */
.side {
  position: sticky;
  top: 90px;
  align-self: start;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.side h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.side h3::before {
  content: '📋';
  font-size: 18px;
}

.navgrid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.navbtn {
  padding: 10px 0;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  text-align: center;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.navbtn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.navbtn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.navbtn:hover::before {
  opacity: 1;
}

.navbtn.answered {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  font-weight: 600;
}

.navbtn.current {
  outline: 2px solid #667eea;
  outline-offset: 2px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.pager {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

/* 主区 */
.main {
  min-height: 400px;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.head .sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
}

.empty-hint {
  padding: 60px 20px;
  text-align: center;
  color: #9ca3af;
}

/* 题目列表 */
.qlist {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.q {
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-radius: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.q:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.qheader {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.qheader b {
  flex: 1;
  font-size: 16px;
  line-height: 1.7;
  color: #1f2937;
}

.tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.tag.single {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.tag.multi {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

/* 选项 */
.opts {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.opt {
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px 18px;
  border: 2px solid rgba(229, 231, 235, 0.6);
  border-radius: 12px;
  background: rgba(249, 250, 251, 0.8);
  cursor: pointer;
  font-size: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.opt::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.opt:hover:not(:disabled) {
  border-color: #667eea;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.opt:hover:not(:disabled)::before {
  opacity: 1;
}

.opt.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.opt.correct {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #059669;
  font-weight: 600;
}

.opt:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 提交按钮 */
.footact {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* 成绩展示 */
.result-panel h3,
.review-panel h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-panel h3::before {
  content: '🎯';
  font-size: 22px;
}

.review-panel h3::before {
  content: '📖';
  font-size: 22px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart {
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-radius: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.chart:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.legend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.lg.ok {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
}

.lg.partial {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
}

.lg.bad {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
}

.stat-text {
  white-space: pre-line;
  text-align: center;
  font-size: 15px;
  color: #4b5563;
  line-height: 2;
  font-weight: 500;
}

.qgrid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
  width: 100%;
}

.qcell {
  padding: 8px 10px;
  border: 2px solid transparent;
  border-radius: 10px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.qcell:hover {
  transform: scale(1.1);
}

.qcell.ok {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
  border-color: #10b981;
  color: #065f46;
}

.qcell.partial {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%);
  border-color: #f59e0b;
  color: #92400e;
}

.qcell.bad {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
  border-color: #ef4444;
  color: #991b1b;
}

/* 答案解析 */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analysis {
  white-space: pre-wrap;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 2px dashed rgba(102, 126, 234, 0.3);
  padding: 16px;
  border-radius: 12px;
  margin-top: 12px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.8;
  position: relative;
}

.analysis::before {
  content: '💡 解析';
  position: absolute;
  top: -12px;
  left: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 响应式优化 */
/* 错题统计与知识点分析 */
.wrong-stats-panel h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 10px;
}

.wrong-stats-panel h3::before {
  content: '📊';
  font-size: 22px;
}

.stats-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-item.wrong {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
}

.stat-item.kp {
  border-color: rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.stat-num {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-item.wrong .stat-num {
  color: #ef4444;
}

.stat-item.kp .stat-num {
  color: #667eea;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.kp-stats h4,
.review-suggestion h4 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px;
}

.kp-table {
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.kp-row {
  display: grid;
  grid-template-columns: 1fr 100px 100px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.4);
  align-items: center;
  transition: all 0.2s ease;
}

.kp-row:last-child {
  border-bottom: none;
}

.kp-row:not(.kp-header):hover {
  background: rgba(102, 126, 234, 0.05);
}

.kp-header {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  font-weight: 600;
  font-size: 14px;
  color: #4b5563;
}

.kp-row.kp-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%);
}

.kp-row.kp-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%);
}

.kp-name {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.kp-count {
  text-align: center;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.kp-row.kp-warning .count-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.kp-action {
  text-align: center;
}

.no-kp-hint {
  margin-bottom: 20px;
}

.review-suggestion {
  padding: 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
}

.review-suggestion p {
  margin: 0 0 16px;
  font-size: 14px;
  color: #4b5563;
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.suggestion-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
  transition: all 0.3s ease;
}

.suggestion-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.suggestion-tag.urgent {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
  border-color: rgba(239, 68, 68, 0.4);
  color: #dc2626;
}

.tag-count {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(102, 126, 234, 0.15);
  border-radius: 999px;
  color: #667eea;
}

.suggestion-tag.urgent .tag-count {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

/* 错题高亮动画 */
.highlight-question {
  animation: highlightPulse 2s ease-in-out;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  25%, 75% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 4px 20px rgba(239, 68, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.4), 0 6px 24px rgba(239, 68, 68, 0.3);
  }
}

@media (max-width: 768px) {
  .topwrap {
    padding: 12px 16px;
  }
  
  .topwrap h1 {
    font-size: 16px;
  }
  
  .wrap {
    margin: 16px auto;
    gap: 16px;
  }
  
  .card {
    padding: 16px;
  }
  
  .q {
    padding: 16px;
  }
  
  .qheader b {
    font-size: 15px;
  }
  
  .opt {
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .navgrid {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .qgrid {
    grid-template-columns: repeat(8, 1fr);
  }
  
  .stats-overview {
    flex-direction: column;
    gap: 12px;
  }
  
  .kp-row {
    grid-template-columns: 1fr 80px 80px;
    padding: 12px 14px;
  }
  
  .suggestion-tags {
    gap: 8px;
  }
  
  .suggestion-tag {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
