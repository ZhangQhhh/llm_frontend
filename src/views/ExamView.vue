<template>
  <div class="exam-page">
    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <div class="brand">
          <div class="logo">📝</div>
          <div>
            <h1>边检智能家教</h1>
            <p class="subtitle">在线考试系统 · 智能评分 · 详细解析</p>
          </div>
        </div>
        <div class="user-info">
          <span class="user-name">{{ username }}</span>
          <el-button size="small" @click="handleChangePassword">修改密码</el-button>
        </div>
      </header>

      <!-- 试卷选择卡片 -->
      <el-card class="control-card" shadow="hover">
        <div class="control-row">
          <el-select v-model="selectedPaperId" placeholder="选择试卷" style="width: 300px">
            <el-option
              v-for="paper in papers"
              :key="paper.paper_id"
              :label="`${paper.title} (${paper.paper_id.slice(0, 8)})`"
              :value="paper.paper_id"
            />
          </el-select>
          <el-button @click="loadPapers" :loading="loadingPapers">刷新试卷列表</el-button>
          <el-input-number
            v-model="durationMin"
            :min="1"
            :max="180"
            :disabled="examStarted"
            style="width: 150px"
          />
          <span class="label-text">分钟</span>
          <el-button type="primary" @click="startExam" :disabled="!selectedPaperId || examStarted" :loading="starting">
            开始作答
          </el-button>
          <el-tag v-if="examStarted" type="success" effect="dark">
            {{ timerDisplay }}
          </el-tag>
        </div>
      </el-card>

      <!-- 题目列表 -->
      <el-card class="question-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="title">试题</span>
            <span class="subtitle" v-if="questions.length > 0">共 {{ questions.length }} 题</span>
          </div>
        </template>

        <div v-if="!examStarted" class="empty-state">
          <el-empty description="请点击开始作答按钮后显示题目" />
        </div>

        <div v-else-if="questions.length === 0" class="empty-state">
          <el-empty description="未获取到题目" />
        </div>

        <div v-else class="question-list">
          <div v-for="(q, idx) in currentPageQuestions" :key="q.qid" class="question-item">
            <div class="question-header">
              <span class="question-number">{{ getQuestionNumber(idx) }}.</span>
              <span class="question-stem">{{ q.stem }}</span>
              <el-tag size="small" :type="q.qtype === 'multi' ? 'warning' : 'info'">
                {{ q.qtype === 'multi' ? '多选题' : '单选题' }}
              </el-tag>
            </div>
            <div class="question-options">
              <el-checkbox-group
                v-if="q.qtype === 'multi'"
                v-model="answersState[q.qid]"
              >
                <el-checkbox
                  v-for="opt in q.options"
                  :key="opt.label"
                  :label="opt.label"
                  class="option-item"
                >
                  {{ opt.label }}. {{ opt.text }}
                </el-checkbox>
              </el-checkbox-group>
              <el-radio-group v-else v-model="answersState[q.qid]">
                <el-radio
                  v-for="opt in q.options"
                  :key="opt.label"
                  :label="opt.label"
                  class="option-item"
                >
                  {{ opt.label }}. {{ opt.text }}
                </el-radio>
              </el-radio-group>
            </div>
          </div>
        </div>

        <el-pagination
          v-if="questions.length > 0"
          class="pagination"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="questions.length"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </el-card>

      <!-- 提交卡片 -->
      <el-card class="submit-card" shadow="hover">
        <el-button
          type="primary"
          size="large"
          @click="submitExam"
          :disabled="!examStarted || submitted"
          :loading="submitting"
        >
          交卷并评分
        </el-button>
        <span class="submit-msg">{{ submitMessage }}</span>
      </el-card>

      <!-- 成绩展示 -->
      <el-card v-if="gradeReport" class="grade-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="title">考试成绩</span>
          </div>
        </template>
        <div class="score-display">
          <div class="score-main">
            <span class="score-value">{{ gradeReport.total_score.toFixed(2) }}</span>
            <span class="score-total">/ {{ questions.length }}</span>
          </div>
          <el-progress
            :percentage="scorePercentage"
            :color="getProgressColor"
            :stroke-width="20"
          />
        </div>
        <div class="score-grid">
          <div
            v-for="(item, idx) in gradeReport.items"
            :key="idx"
            :class="['score-cell', getScoreClass(item)]"
            :title="getScoreTitle(item, idx)"
          >
            {{ idx + 1 }}
          </div>
        </div>
      </el-card>

      <!-- 答案与解析 -->
      <el-card v-if="reviewData" class="review-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="title">答案与解析</span>
            <el-button type="primary" @click="exportReport" :loading="exporting">
              导出成绩报告
            </el-button>
          </div>
        </template>
        <div class="review-list">
          <div v-for="(item, idx) in reviewData.items" :key="idx" class="review-item">
            <div class="review-header">
              <span class="review-number">{{ idx + 1 }}.</span>
              <span class="review-stem">{{ item.stem }}</span>
              <el-tag :type="item.is_correct ? 'success' : 'danger'" size="small">
                {{ item.is_correct ? '正确' : '错误' }}
              </el-tag>
              <el-tag size="small">{{ item.qtype === 'multi' ? '多选题' : '单选题' }}</el-tag>
            </div>
            <div class="review-options">
              <div
                v-for="opt in item.options"
                :key="opt.label"
                :class="['review-option', { correct: item.correct_labels.includes(opt.label) }]"
              >
                <span class="option-label">{{ opt.label }}.</span>
                <span class="option-text">{{ opt.text }}</span>
                <el-icon v-if="item.correct_labels.includes(opt.label)" color="#67c23a">
                  <Check />
                </el-icon>
              </div>
            </div>
            <div class="review-analysis">
              <div class="analysis-label">解析：</div>
              <div class="analysis-content">{{ item.analysis || '暂无解析' }}</div>
            </div>
          </div>
        </div>
      </el-card>
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
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { API_ENDPOINTS } from '@/config/api/api'
import { fetchWithAuth, getApiUrl } from '@/utils/request'

interface Question {
  qid: string
  stem: string
  qtype: string
  options: Array<{ label: string; text: string }>
}

interface Paper {
  paper_id: string
  title: string
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
  analysis: string
  is_correct: boolean
}

interface ReviewData {
  items: ReviewItem[]
}

export default defineComponent({
  name: 'ExamView',
  components: {
    Check
  },
  setup() {
    const store = useStore()
    const username = computed(() => store.state.user.username || '学生')

    // 试卷相关
    const papers = ref<Paper[]>([])
    const selectedPaperId = ref('')
    const loadingPapers = ref(false)

    // 考试相关
    const questions = ref<Question[]>([])
    const examStarted = ref(false)
    const durationMin = ref(10)
    const starting = ref(false)
    const attemptId = ref('')
    const leftSeconds = ref(0)
    const timerHandle = ref<number | null>(null)

    // 答题相关
    const answersState = ref<Record<string, any>>({})
    const currentPage = ref(1)
    const pageSize = 3

    // 提交相关
    const submitted = ref(false)
    const submitting = ref(false)
    const submitMessage = ref('')

    // 成绩相关
    const gradeReport = ref<GradeReport | null>(null)
    const reviewData = ref<ReviewData | null>(null)
    const exporting = ref(false)

    // 修改密码
    const passwordDialogVisible = ref(false)
    const passwordForm = ref({
      oldPassword: '',
      newPassword: ''
    })
    const changingPassword = ref(false)

    const timerDisplay = computed(() => {
      if (!examStarted.value) return '未开始'
      const min = Math.floor(leftSeconds.value / 60)
      const sec = leftSeconds.value % 60
      return `剩余时间：${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    })

    const currentPageQuestions = computed(() => {
      const start = (currentPage.value - 1) * pageSize
      return questions.value.slice(start, start + pageSize)
    })

    const scorePercentage = computed(() => {
      if (!gradeReport.value) return 0
      const total = questions.value.length || 1
      return Math.round((gradeReport.value.total_score / total) * 100)
    })

    const getProgressColor = (percentage: number) => {
      if (percentage >= 90) return '#67c23a'
      if (percentage >= 60) return '#e6a23c'
      return '#f56c6c'
    }

    const getQuestionNumber = (idx: number) => {
      return (currentPage.value - 1) * pageSize + idx + 1
    }

    const getScoreClass = (item: GradeItem) => {
      if (item.is_correct) return 'correct'
      if (item.score > 0) return 'partial'
      return 'wrong'
    }

    const getScoreTitle = (item: GradeItem, idx: number) => {
      const num = idx + 1
      if (item.is_correct) return `第${num}题：正确，得分 ${item.score}`
      if (item.score > 0) return `第${num}题：部分得分 ${item.score}`
      return `第${num}题：错误，得分 ${item.score}`
    }

    const loadPapers = async () => {
      loadingPapers.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.PAPERS.LIST_OPEN))
        papers.value = response.data || []
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
        const startResp = await fetchWithAuth(getApiUrl(API_ENDPOINTS.EXAM.START), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: {
            paper_id: selectedPaperId.value,
            duration_sec: durationMin.value * 60
          }
        })

        if (!startResp.data.ok) {
          throw new Error(startResp.data.detail || '创建会话失败')
        }

        attemptId.value = startResp.data.attempt_id
        leftSeconds.value = startResp.data.left_sec

        // 获取题目
        const questionsResp = await fetchWithAuth(
          getApiUrl(`${API_ENDPOINTS.PAPERS.VIEW}?paper_id=${encodeURIComponent(selectedPaperId.value)}`)
        )
        questions.value = questionsResp.data.items || []

        // 初始化答案状态
        const newAnswersState: Record<string, any> = {}
        questions.value.forEach(q => {
          newAnswersState[q.qid] = q.qtype === 'multi' ? [] : ''
        })
        answersState.value = newAnswersState

        examStarted.value = true
        currentPage.value = 1

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
      const unanswered = questions.value.length - answers.length

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
      submitMessage.value = '提交中...'

      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.EXAM.SUBMIT), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: {
            attempt_id: attemptId.value,
            answers
          }
        })

        gradeReport.value = response.data
        submitted.value = true
        submitMessage.value = '评分完成'
        stopTimer()

        // 加载答案解析
        await loadReview()

        ElMessage.success('提交成功')
      } catch (error: any) {
        submitMessage.value = '提交失败：' + (error.message || '未知错误')
        ElMessage.error(submitMessage.value)
      } finally {
        submitting.value = false
      }
    }

    const loadReview = async () => {
      if (!attemptId.value) return
      try {
        const response = await fetchWithAuth(
          getApiUrl(`${API_ENDPOINTS.EXAM.REVIEW}?attempt_id=${encodeURIComponent(attemptId.value)}`)
        )
        if (response.data.ok) {
          reviewData.value = response.data
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
      try {
        const formData = new FormData()
        formData.append('attempt_id', attemptId.value)
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.STUDENT.EXPORT_MY_REPORT_DOCX), {
          method: 'POST',
          body: formData
        })

        if (!response.data.ok) {
          throw new Error(response.data.detail || '导出失败')
        }

        const filename = response.data.path?.split('/').pop() || '我的成绩报告.docx'
        const downloadUrl = getApiUrl(response.data.download_url)

        // 下载文件
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        ElMessage.success('导出成功')
      } catch (error: any) {
        ElMessage.error('导出失败：' + (error.message || '未知错误'))
      } finally {
        exporting.value = false
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
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
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: {
            old_password: passwordForm.value.oldPassword,
            new_password: passwordForm.value.newPassword
          }
        })

        if (response.data.ok) {
          ElMessage.success('修改成功，请重新登录')
          passwordDialogVisible.value = false
          store.dispatch('logout')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
        } else {
          throw new Error(response.data.detail || '修改失败')
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
      questions,
      examStarted,
      durationMin,
      starting,
      timerDisplay,
      answersState,
      currentPage,
      pageSize,
      currentPageQuestions,
      submitted,
      submitting,
      submitMessage,
      gradeReport,
      scorePercentage,
      reviewData,
      exporting,
      passwordDialogVisible,
      passwordForm,
      changingPassword,
      loadPapers,
      startExam,
      submitExam,
      exportReport,
      handlePageChange,
      getQuestionNumber,
      getProgressColor,
      getScoreClass,
      getScoreTitle,
      handleChangePassword,
      changePassword
    }
  }
})
</script>

<style scoped>
.exam-page {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-size: 2.5rem;
}

.brand h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-size: 0.875rem;
  color: #4b5563;
}

.control-card {
  margin-bottom: 1.5rem;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.label-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.question-card {
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.card-header .subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.empty-state {
  padding: 2rem 0;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-item {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 600;
  color: #1f2937;
  flex-shrink: 0;
}

.question-stem {
  flex: 1;
  font-size: 1rem;
  color: #1f2937;
  line-height: 1.5;
}

.question-options {
  margin-left: 1.5rem;
}

.option-item {
  display: block;
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.pagination {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.submit-card {
  margin-bottom: 1.5rem;
  text-align: center;
}

.submit-msg {
  margin-left: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.grade-card {
  margin-bottom: 1.5rem;
}

.score-display {
  margin-bottom: 1.5rem;
}

.score-main {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 1rem;
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
  color: #1f2937;
}

.score-total {
  font-size: 1.5rem;
  color: #6b7280;
  margin-left: 0.5rem;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.score-cell {
  padding: 0.75rem;
  text-align: center;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid #e5e7eb;
}

.score-cell.correct {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.score-cell.partial {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.score-cell.wrong {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.review-card {
  margin-bottom: 1.5rem;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-item {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.review-header {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.review-number {
  font-weight: 600;
  color: #1f2937;
  flex-shrink: 0;
}

.review-stem {
  flex: 1;
  font-size: 1rem;
  color: #1f2937;
  line-height: 1.5;
}

.review-options {
  margin: 1rem 0;
}

.review-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.review-option.correct {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.option-label {
  font-weight: 600;
  color: #1f2937;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  color: #4b5563;
}

.review-analysis {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
}

.analysis-label {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.analysis-content {
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
