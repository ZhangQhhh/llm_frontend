import { ref, reactive, computed } from 'vue'
import { fetchMcqWithAuth } from '@/utils/request'
import { MCQ_BASE_URL } from '@/config/api/api'

// ==================== 类型 ====================
export interface AiGradeLogItem {
  msg: string
  type: 'success' | 'error' | 'info'
}

export interface AiGradeProgress {
  totalStudents: number
  completedStudents: number
  currentStudentName: string
  currentStudentQuestions: string
  successCount: number
  errorCount: number
  logs: AiGradeLogItem[]
}

export interface AiGradeConfig {
  examId: string
  modelId: string
  scope: 'current' | 'ungraded' | 'all'
  autoSubmit: boolean
}

// ==================== 模块级单例状态（跨路由持久） ====================
const aiConfigVisible = ref(false)
const aiProgressVisible = ref(false)
const aiGrading = ref(false)
const currentTaskId = ref<string | null>(null)
let pollingTimer: ReturnType<typeof setInterval> | null = null
let _onProgressChange: ((gradedResults: Record<string, Record<string, any>>, wasRunning: boolean) => void) | null = null
const latestGradedResults = ref<Record<string, Record<string, any>>>({})

const aiConfig: AiGradeConfig = reactive({
  examId: '',
  modelId: 'deepseek',
  scope: 'ungraded' as 'current' | 'ungraded' | 'all',
  autoSubmit: false,
})

const aiProgress: AiGradeProgress = reactive({
  totalStudents: 0,
  completedStudents: 0,
  currentStudentName: '',
  currentStudentQuestions: '',
  successCount: 0,
  errorCount: 0,
  logs: [],
})

const aiProgressPercent = computed(() => {
  if (aiProgress.totalStudents === 0) return 0
  return Math.round((aiProgress.completedStudents / aiProgress.totalStudents) * 100)
})

const llmOptions = ref([
  { value: 'qwen3-32b', label: 'Qwen (通用)' },
  { value: 'qwen2025', label: 'Qwen (增强)' },
  { value: 'deepseek', label: 'DeepSeekv3.1' },
  { value: 'deepseek-3.2', label: 'DeepSeekv3.2' },
  { value: 'qwen-plus', label: 'Qwen (云端)' },
])

// ==================== 轮询逻辑 ====================

function applyTaskStatus(data: any) {
  const prevCompleted = aiProgress.completedStudents
  const prevStatus = aiGrading.value

  aiProgress.totalStudents = data.total_students || 0
  aiProgress.completedStudents = data.completed_students || 0
  aiProgress.currentStudentName = data.current_student_name || ''
  aiProgress.successCount = data.success_count || 0
  aiProgress.errorCount = data.error_count || 0
  aiProgress.logs = data.logs || []

  const status = data.status || ''
  aiGrading.value = (status === 'running' || status === 'queued')

  // 任务结束时停止轮询
  if (status === 'done' || status === 'failed' || status === 'stopped') {
    stopPolling()
  }

  // 保存最新的AI评分结果
  const newResults = data.graded_results || {}
  if (Object.keys(newResults).length > 0) {
    latestGradedResults.value = newResults
  }

  // 当有新的评分完成时，通知外部刷新数据
  const hasNewProgress = aiProgress.completedStudents > prevCompleted
  const justFinished = prevStatus && !aiGrading.value
  if ((hasNewProgress || justFinished) && _onProgressChange) {
    // prevStatus表示任务此前是否在运行（用于区分"任务刚完成"和"恢复旧结果"）
    _onProgressChange(latestGradedResults.value, !!prevStatus)
  }
}

function startPolling(taskId: string) {
  stopPolling()
  currentTaskId.value = taskId

  pollingTimer = setInterval(async () => {
    try {
      const res = await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/grade-task/status?task_id=${encodeURIComponent(taskId)}`, {
        method: 'GET',
      })
      if (res.data?.ok) {
        applyTaskStatus(res.data)
      }
    } catch (e) {
      console.debug('[SAQ-Poll] 轮询失败', e)
    }
  }, 2000)
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// ==================== 核心方法 ====================

/**
 * 创建后台评分任务（提交给后端执行）
 */
async function startGradeTask(examId: string, modelId: string, scope: string, autoSubmit: boolean) {
  const res = await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/grade-task`, {
    method: 'POST',
    data: { exam_id: examId, model_id: modelId, scope, auto_submit: autoSubmit },
  })
  if (!res.data?.ok) {
    throw new Error(res.data?.msg || '创建评分任务失败')
  }
  const taskId = res.data.task_id
  currentTaskId.value = taskId
  aiGrading.value = true
  aiProgressVisible.value = true

  // 初始化本地状态
  aiProgress.totalStudents = res.data.total_students || 0
  aiProgress.completedStudents = 0
  aiProgress.currentStudentName = ''
  aiProgress.currentStudentQuestions = ''
  aiProgress.successCount = 0
  aiProgress.errorCount = 0
  aiProgress.logs = [{ msg: '📋 任务已提交，后台评分中...', type: 'info' }]

  // 开始轮询
  startPolling(taskId)
  return taskId
}

/**
 * 停止评分任务
 */
async function cancelAiGrade() {
  if (!currentTaskId.value) {
    aiGrading.value = false
    return
  }
  try {
    await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/grade-task/stop`, {
      method: 'POST',
      data: { task_id: currentTaskId.value },
    })
  } catch { /* ignore */ }
  // 停止轮询，等下一次polling刷新状态或直接设置
  aiGrading.value = false
  aiProgress.logs.push({ msg: '⏹ 已发送停止请求', type: 'info' })
}

/**
 * 检查是否有进行中或已完成的任务（页面加载时调用）
 */
async function checkPendingTask() {
  try {
    const res = await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/grade-task/pending`, { method: 'GET' })
    if (res.data?.ok && res.data.has_task) {
      const data = res.data
      currentTaskId.value = data.task_id
      applyTaskStatus(data)

      // 如果还在运行，启动轮询
      if (data.status === 'running' || data.status === 'queued') {
        startPolling(data.task_id)
      }
    }
  } catch (e) {
    console.debug('[SAQ] 检查待处理任务失败', e)
  }
}

// ==================== 导出 ====================
export function useAiGrading() {
  return {
    // 状态
    aiConfigVisible,
    aiProgressVisible,
    aiGrading,
    currentTaskId,
    aiConfig,
    aiProgress,
    aiProgressPercent,
    llmOptions,
    // 方法
    cancelAiGrade,
    startGradeTask,
    checkPendingTask,
    /**
     * 注册进度变化回调（当后台评分有新的考生完成时触发）
     * 回调参数: gradedResults = { attempt_id: { qid: { score, clause_grades, comment, is_correct } } }
     */
    onProgressChange(cb: (gradedResults: Record<string, Record<string, any>>, wasRunning: boolean) => void) {
      _onProgressChange = cb
    },
    latestGradedResults,
  }
}
