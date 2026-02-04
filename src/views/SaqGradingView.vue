<template>
  <div class="saq-grading-page" @keydown="handleKeydown" tabindex="0">
    <!-- 评分详情视图 - 三栏布局 (选中考试后直接进入) 测试 -->
    <div class="grading-layout" v-if="currentExam">
      <!-- 左侧边栏 - 考生列表 + 题目导航 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <el-button @click="exitGrading" text size="small" class="back-btn">
            <el-icon><Back /></el-icon>
            返回考试列表
          </el-button>
          <div class="exam-title">{{ currentExam.paper_title }}</div>
        </div>
        
        <!-- 考生列表 -->
        <div class="student-list-section">
          <div class="list-title">
            <span>考生列表</span>
            <span class="list-count">{{ currentExam.student_count }}人</span>
          </div>
          <div class="student-list">
            <div 
              v-for="student in paginatedStudents" 
              :key="student.attempt_id"
              class="student-item"
              :class="{ active: currentStudent?.attempt_id === student.attempt_id }"
              @click="switchStudent(student)"
            >
              <el-avatar :size="32" :icon="User" />
              <div class="student-brief">
                <div class="student-name">{{ student.student_name || student.student_id }}</div>
                <div class="student-pending">{{ getStudentPendingCount(student) }} 题待评</div>
              </div>
              <el-icon v-if="isStudentFullyGraded(student)" class="student-done"><Check /></el-icon>
            </div>
          </div>
          <el-pagination
            v-if="totalStudents > studentPageSize"
            v-model:current-page="studentPage"
            :page-size="studentPageSize"
            :total="totalStudents"
            layout="prev, pager, next"
            small
            class="student-pagination"
          />
        </div>

        <!-- 当前考生的题目列表 -->
        <div class="question-list-section" v-if="currentStudent">
          <div class="progress-section">
            <div class="progress-header">
              <span>当前考生进度</span>
              <span class="progress-num">{{ gradedCount }}/{{ currentStudent.pending_saqs.length }}</span>
            </div>
            <el-progress :percentage="gradingProgressPercent" :stroke-width="6" :show-text="false" />
          </div>

          <div class="question-list">
            <div class="list-title">题目列表</div>
            <div 
              v-for="(saq, idx) in sortedSaqs" 
              :key="saq.qid"
              class="question-item"
              :class="{ 
                active: idx === currentQuestionIndex, 
                graded: grades[saq.qid]?.is_correct !== undefined 
              }"
              @click="goToQuestion(idx)"
            >
              <span class="q-num">{{ idx + 1 }}</span>
              <span class="q-category-tag" v-if="saq.category" :class="getCategoryColorClass(saq.category)">
                {{ formatCategoryTag(saq.category) }}
              </span>
              <span class="q-status">
                <el-icon v-if="grades[saq.qid]?.is_correct !== undefined" class="icon-graded"><Check /></el-icon>
              </span>
              <span class="q-score" v-if="grades[saq.qid]?.is_correct !== undefined">
                {{ grades[saq.qid].score }}/{{ saq.full_score ?? 10 }}
              </span>
              <span class="q-full-score" v-else style="color: #909399; font-size: 11px;">
                ({{ saq.full_score ?? 10 }}分)
              </span>
            </div>
          </div>
        </div>

        <div class="submit-section">
          <el-button 
            type="success" 
            @click="submitGrades" 
            :loading="submitting"
            :disabled="gradedCount === 0"
            size="large"
            class="submit-btn"
          >
            <el-icon><Check /></el-icon>
            提交评分
          </el-button>
        </div>
      </div>

      <!-- 中间区域 - 题目和答案 -->
      <div class="main-panel">
        <div class="content-scroll" v-if="currentSaq">
          <!-- 题目 -->
          <div class="section question-section">
            <div class="section-header">
              <span class="section-title">📋 题目 {{ currentQuestionIndex + 1 }}</span>
            </div>
            <div class="section-body">
              <div class="stem-text" v-html="formatText(currentSaq.stem)"></div>
              <div v-if="currentSaq.stem_images && currentSaq.stem_images.length > 0" class="stem-images">
                <img
                  v-for="(img, imgIdx) in currentSaq.stem_images"
                  :key="imgIdx"
                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                  class="stem-image"
                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                />
              </div>
            </div>
          </div>

          <!-- 参考答案 -->
          <div class="section reference-section">
            <div class="section-header">
              <span class="section-title">✅ 参考答案</span>
              <el-button size="small" text @click="copyText(currentSaq.correct_answer)">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </div>
            <div class="section-body answer-body">
              <pre>{{ currentSaq.correct_answer || '(无参考答案)' }}</pre>
            </div>
          </div>

          <!-- 解析 -->
          <div v-if="currentSaq.analysis" class="section analysis-section">
            <div class="section-header">
              <span class="section-title">📖 解析</span>
              <el-button size="small" text @click="copyText(currentSaq.analysis)">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </div>
            <div class="section-body answer-body">
              <pre>{{ currentSaq.analysis }}</pre>
            </div>
          </div>

          <!-- 学生答案 -->
          <div class="section student-section">
            <div class="section-header">
              <span class="section-title">📝 学生答案</span>
              <el-tag v-if="!currentSaq.my_answer" type="danger" size="small">未作答</el-tag>
              <span v-else class="word-count">{{ currentSaq.my_answer.length }} 字</span>
            </div>
            <div class="section-body answer-body" :class="{ empty: !currentSaq.my_answer }">
              <pre>{{ currentSaq.my_answer || '(学生未作答)' }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 - 评分操作 -->
      <div class="grading-panel">
        <div class="panel-title">评分操作</div>
        
        <!-- 快速评分 -->
        <div class="quick-grade">
          <div class="grade-label">快速评分</div>
          <div class="grade-buttons">
            <button 
              class="grade-btn full" 
              :class="{ active: currentGrade?.score === saqFullScore && currentGrade?.is_correct !== undefined }"
              @click="quickGrade('full')"
            >
              <span class="btn-score">{{ saqFullScore }}</span>
              <span class="btn-label">满分</span>
            </button>
            <button 
              class="grade-btn partial" 
              :class="{ active: currentGrade?.score === Math.floor(saqFullScore * 0.75) && currentGrade?.is_correct !== undefined }"
              @click="quickGrade('partial')"
            >
              <span class="btn-score">{{ Math.floor(saqFullScore * 0.75) }}</span>
              <span class="btn-label">部分</span>
            </button>
            <button 
              class="grade-btn half" 
              :class="{ active: currentGrade?.score === Math.floor(saqFullScore * 0.5) && currentGrade?.is_correct !== undefined }"
              @click="quickGrade('half')"
            >
              <span class="btn-score">{{ Math.floor(saqFullScore * 0.5) }}</span>
              <span class="btn-label">一半</span>
            </button>
            <button 
              class="grade-btn zero" 
              :class="{ active: currentGrade?.score === 0 && currentGrade?.is_correct !== undefined }"
              @click="quickGrade('zero')"
            >
              <span class="btn-score">0</span>
              <span class="btn-label">零分</span>
            </button>
          </div>
          <div class="keyboard-tips">
            <span><kbd>1</kbd> 满分</span>
            <span><kbd>2</kbd> 部分</span>
            <span><kbd>3</kbd> 一半</span>
            <span><kbd>0</kbd> 零分</span>
          </div>
        </div>

        <!-- 自定义分数 -->
        <div class="custom-score" v-if="currentGrade">
          <div class="grade-label">自定义分数</div>
          <div class="score-input-row">
            <el-input-number 
              v-model="currentGrade.score" 
              :min="0" 
              :max="saqFullScore"
              :step="1"
              size="large"
              @change="onScoreChange"
            />
            <span class="score-max">/ {{ saqFullScore }} 分</span>
          </div>
        </div>

        <!-- 评语 -->
        <div class="comment-area" v-if="currentGrade">
          <div class="grade-label">
            评语
            <el-dropdown trigger="click" @command="insertTemplate" style="margin-left: 8px">
              <el-button size="small" link type="primary">常用</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="tpl in commentTemplates" :key="tpl" :command="tpl">
                    {{ tpl }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <el-input 
            v-model="currentGrade.comment" 
            type="textarea"
            :rows="4"
            placeholder="输入评语（可选）"
            resize="none"
          />
        </div>

        <!-- 导航 -->
        <div class="nav-buttons">
          <el-button @click="prevQuestion" :disabled="currentQuestionIndex === 0" class="nav-btn">
            <el-icon><ArrowLeft /></el-icon>
            上一题
          </el-button>
          <el-button 
            type="primary" 
            @click="gradeAndNext" 
            class="nav-btn next"
          >
            {{ currentStudent && currentQuestionIndex >= sortedSaqs.length - 1 ? '完成' : '下一题' }}
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 考试列表视图 (初始视图) -->
    <div class="list-view" v-else>
      <div class="list-header">
        <h1>📝 简答题评分</h1>
        <div class="header-actions">
          <el-button @click="loadPendingList" :loading="loading" type="primary">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button @click="goBack" plain>
            <el-icon><Back /></el-icon>
            返回
          </el-button>
        </div>
      </div>

      <!-- 搜索和筛选栏 -->
      <div class="filter-bar" v-if="examList.length > 0">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索考试名称/试卷名称"
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          clearable
          class="date-range-picker"
        />
        <el-radio-group v-model="statusFilter" class="status-filter">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="pending">待评分</el-radio-button>
          <el-radio-button value="completed">已完成</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-row" v-if="examList.length > 0">
        <div class="stat-item">
          <div class="stat-num">{{ pendingExams }}</div>
          <div class="stat-text">待评考试</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ totalPending }}</div>
          <div class="stat-text">待评题目</div>
        </div>
        <div class="stat-item completed">
          <div class="stat-num">{{ completedExams }}</div>
          <div class="stat-text">已完成</div>
        </div>
      </div>

      <!-- 考试列表 -->
      <div class="paper-list" v-if="filteredExamList.length > 0">
        <div 
          v-for="exam in filteredExamList" 
          :key="exam.exam_id" 
          class="paper-card exam-card"
          @click="selectExam(exam)"
        >
          <div class="paper-left">
            <div class="exam-icon">📋</div>
            <div class="paper-info">
              <div class="paper-student">{{ exam.paper_title }}</div>
              <div class="paper-meta">考试ID: {{ exam.exam_id.slice(0, 8) }}...</div>
            </div>
          </div>
          <div class="paper-right">
            <div class="pending-badge">{{ exam.student_count }} 人</div>
            <div class="pending-badge orange">{{ exam.total_pending }} 题</div>
            <el-button type="primary" round>查看考生</el-button>
          </div>
        </div>
      </div>

      <el-empty v-else-if="!loading && examList.length > 0" description="没有匹配的考试，请调整筛选条件">
        <el-button type="primary" @click="clearFilters">清除筛选</el-button>
      </el-empty>

      <el-empty v-else-if="!loading" description="暂无简答题考试（仅显示正式考试）">
        <el-button type="primary" @click="loadPendingList">刷新</el-button>
      </el-empty>

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Refresh /></el-icon>
        加载中...
      </div>
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewUrl]"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, Back, User, Check, CopyDocument, ArrowLeft, ArrowRight, Search
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { fetchMcqWithAuth } from '@/utils/request'
import { MCQ_BASE_URL } from '@/config/api/api'

const router = useRouter()

// ==================== 类型定义 ====================
interface SaqItem {
  qid: string
  stem: string
  correct_answer: string
  analysis?: string
  my_answer: string
  stem_images?: Array<{ content_type: string; base64: string }>
  is_graded?: boolean
  score?: number
  full_score?: number  // 该题满分（支持自定义分数）
  comment?: string
  category?: string  // 岗位分类标签
}

interface StudentData {
  attempt_id: string
  student_id: string
  student_name: string
  end_time: string
  pending_count: number
  pending_saqs: SaqItem[]
}

interface ExamData {
  exam_id: string
  paper_id: string
  paper_title: string
  students: StudentData[]
  total_pending: number
  student_count: number
  start_time?: string
  earliest_end?: string
}

interface GradeInfo {
  score: number
  is_correct?: boolean
  comment: string
}

// ==================== 状态定义 ====================
const loading = ref(false)
const submitting = ref(false)
const examList = ref<ExamData[]>([])
const currentExam = ref<ExamData | null>(null)
const currentStudent = ref<StudentData | null>(null)
const grades = reactive<Record<string, GradeInfo>>({})
// 按考生缓存评分数据 (attempt_id -> qid -> GradeInfo)
const gradesCache = reactive<Record<string, Record<string, GradeInfo>>>({})
// 跟踪已提交评分的考生
const submittedStudents = reactive(new Set<string>())
// 当前题目的满分（根据每题配置动态获取）
const saqFullScore = computed(() => {
  if (!currentSaq.value) return 10
  return currentSaq.value.full_score ?? 10
})
const currentQuestionIndex = ref(0)
// 防止最后一题重复弹窗
const completionDialogShown = ref(false)

const previewVisible = ref(false)
const previewUrl = ref('')

// 分页状态
const studentPage = ref(1)
const studentPageSize = ref(10)

// 搜索和筛选状态
const searchKeyword = ref('')
const dateRange = ref<[string, string] | null>(null)  // 日期范围筛选
const statusFilter = ref<string>('all')  // 状态筛选：all, pending, completed

// 常用评语模板
const commentTemplates = [
  '回答完整准确，思路清晰',
  '回答正确，但可以更详细',
  '基本正确，部分要点遗漏',
  '回答不完整，缺少关键要点',
  '理解有偏差，需要复习相关知识',
  '未回答或答案与题目无关'
]

// ==================== 计算属性 ====================
// 待评考试数（有未评分题目的考试）
const pendingExams = computed(() => {
  return examList.value.filter(e => e.total_pending > 0).length
})

// 已完成考试数（所有题目都已评分的考试）
const completedExams = computed(() => {
  return examList.value.filter(e => e.total_pending === 0).length
})

const totalPending = computed(() => {
  return examList.value.reduce((sum, e) => sum + e.total_pending, 0)
})

// 筛选后的考试列表
const filteredExamList = computed(() => {
  let list = examList.value
  
  // 关键字搜索（考试名称/试卷名称/考试ID）
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(e => 
      e.paper_title.toLowerCase().includes(kw) ||
      e.paper_id.toLowerCase().includes(kw) ||
      e.exam_id.toLowerCase().includes(kw)
    )
  }
  
  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [startStr, endStr] = dateRange.value
    const startDate = new Date(startStr)
    const endDate = new Date(endStr)
    endDate.setHours(23, 59, 59, 999)  // 包含结束日期当天
    
    list = list.filter(e => {
      const examDate = e.earliest_end ? new Date(e.earliest_end) : null
      if (!examDate) return false
      return examDate >= startDate && examDate <= endDate
    })
  }
  
  // 状态筛选
  if (statusFilter.value !== 'all') {
    list = list.filter(e => {
      if (statusFilter.value === 'pending') return e.total_pending > 0
      if (statusFilter.value === 'completed') return e.total_pending === 0
      return true
    })
  }
  
  return list
})

// 按岗位分类排序的题目列表（同一岗位放在一起）
const sortedSaqs = computed(() => {
  if (!currentStudent.value) return []
  const saqs = [...currentStudent.value.pending_saqs]
  // 按 category 排序，无分类的放最后
  return saqs.sort((a, b) => {
    const catA = a.category || 'zzz_未分类'
    const catB = b.category || 'zzz_未分类'
    return catA.localeCompare(catB, 'zh-CN')
  })
})

const currentSaq = computed(() => {
  if (!currentStudent.value) return null
  return sortedSaqs.value[currentQuestionIndex.value] || null
})

const currentGrade = computed(() => {
  if (!currentSaq.value) return null
  return grades[currentSaq.value.qid]
})

const gradedCount = computed(() => {
  if (!currentStudent.value) return 0
  return currentStudent.value.pending_saqs.filter(
    saq => grades[saq.qid]?.is_correct !== undefined
  ).length
})

const gradingProgressPercent = computed(() => {
  if (!currentStudent.value || currentStudent.value.pending_saqs.length === 0) return 0
  return Math.round((gradedCount.value / currentStudent.value.pending_saqs.length) * 100)
})

// 分页后的考生列表
const paginatedStudents = computed(() => {
  if (!currentExam.value) return []
  const start = (studentPage.value - 1) * studentPageSize.value
  const end = start + studentPageSize.value
  return currentExam.value.students.slice(start, end)
})

const totalStudents = computed(() => {
  return currentExam.value?.students.length || 0
})

// ==================== 生命周期 ====================
onMounted(() => {
  loadPendingList()
  // 键盘事件已通过模板 @keydown 绑定，无需重复添加
})

onUnmounted(() => {
  // 清理工作（如有需要）
})

// ==================== 方法 ====================
async function loadPendingList() {
  loading.value = true
  try {
    const res = await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/pending`)
    if (res.data.ok) {
      const newExams = res.data.exams || []
      // 合并数据：保留已有的考试（可能已评分完成），更新或添加新考试
      const existingMap = new Map(examList.value.map(e => [e.exam_id, e]))
      for (const exam of newExams) {
        existingMap.set(exam.exam_id, exam)
      }
      examList.value = Array.from(existingMap.values())
    } else {
      ElMessage.error(res.data.detail || res.data.msg || '获取待评分列表失败')
    }
  } catch (e: any) {
    ElMessage.error('请求失败: ' + (e.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

function selectExam(exam: ExamData) {
  currentExam.value = exam
  studentPage.value = 1 // 重置分页
  // 自动选中第一个考生
  if (exam.students.length > 0) {
    selectStudent(exam.students[0])
  }
}

function selectStudent(student: StudentData) {
  // 先保存当前考生的评分到缓存
  if (currentStudent.value) {
    gradesCache[currentStudent.value.attempt_id] = { ...grades }
  }
  
  currentStudent.value = student
  currentQuestionIndex.value = 0
  completionDialogShown.value = false  // 重置弹窗标记
  
  // 清空当前评分对象
  Object.keys(grades).forEach(key => delete grades[key])
  
  // 从缓存恢复或从后端数据初始化评分
  const cached = gradesCache[student.attempt_id]
  for (const saq of student.pending_saqs) {
    if (cached && cached[saq.qid]) {
      // 优先使用本地缓存
      grades[saq.qid] = { ...cached[saq.qid] }
    } else if (saq.is_graded) {
      // 使用后端返回的已评分数据
      grades[saq.qid] = {
        score: saq.score || 0,
        is_correct: true, // 后端已评分
        comment: saq.comment || ''
      }
      // 标记该考生已提交（从后端加载的已评分数据）
      submittedStudents.add(student.attempt_id)
    } else {
      // 初始化为未评分
      grades[saq.qid] = {
        score: 0,
        is_correct: undefined,
        comment: ''
      }
    }
  }
}

function switchStudent(student: StudentData) {
  // 直接切换，评分数据会保存在缓存中
  selectStudent(student)
}

function isStudentFullyGraded(student: StudentData): boolean {
  // 检查该考生的所有题目是否都已评分（当前、缓存或后端已评分）
  const cached = gradesCache[student.attempt_id]
  const isCurrentStudent = currentStudent.value?.attempt_id === student.attempt_id
  
  return student.pending_saqs.every(saq => {
    if (isCurrentStudent) {
      return grades[saq.qid]?.is_correct !== undefined
    }
    // 检查缓存
    if (cached?.[saq.qid]?.is_correct !== undefined) {
      return true
    }
    // 检查后端返回的已评分状态
    return saq.is_graded === true
  })
}

// 清除筛选条件
function clearFilters() {
  searchKeyword.value = ''
  dateRange.value = null
  statusFilter.value = 'all'
}

// 获取考生实时待评题数
function getStudentPendingCount(student: StudentData): number {
  const cached = gradesCache[student.attempt_id]
  const isCurrentStudent = currentStudent.value?.attempt_id === student.attempt_id
  
  return student.pending_saqs.filter(saq => {
    // 当前考生使用实时grades
    if (isCurrentStudent) {
      return grades[saq.qid]?.is_correct === undefined
    }
    // 检查缓存
    if (cached?.[saq.qid]?.is_correct !== undefined) {
      return false
    }
    // 检查后端返回的已评分状态
    return saq.is_graded !== true
  }).length
}

function exitGrading() {
  // 先保存当前考生的评分到缓存
  if (currentStudent.value) {
    gradesCache[currentStudent.value.attempt_id] = { ...grades }
  }
  
  // 检查当前考生是否有未提交的评分
  const hasUnsubmittedGrades = currentStudent.value && 
    gradedCount.value > 0 && 
    !submittedStudents.has(currentStudent.value.attempt_id)
  
  if (hasUnsubmittedGrades) {
    ElMessageBox.confirm(
      '您有未提交的评分，确定要离开吗？',
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(() => {
      currentStudent.value = null
      currentExam.value = null
    }).catch(() => {})
  } else {
    currentStudent.value = null
    currentExam.value = null
  }
}

function prevQuestion() {
  if (!currentStudent.value || !currentExam.value) return
  
  const isFirstQuestion = currentQuestionIndex.value === 0
  
  if (!isFirstQuestion) {
    // 还有上一题
    currentQuestionIndex.value--
  } else {
    // 第一题，尝试切换到上一个考生
    const currentIdx = currentExam.value.students.findIndex(
      s => s.attempt_id === currentStudent.value!.attempt_id
    )
    
    if (currentIdx > 0) {
      // 切换到上一个考生的最后一题
      const prevStudent = currentExam.value.students[currentIdx - 1]
      switchStudent(prevStudent)
      // 跳到最后一题
      currentQuestionIndex.value = prevStudent.pending_saqs.length - 1
      ElMessage.info('已切换到上一位考生')
    }
  }
}

function nextQuestion() {
  if (!currentStudent.value || !currentExam.value) return
  
  const isLastQuestion = currentQuestionIndex.value >= sortedSaqs.value.length - 1
  
  if (!isLastQuestion) {
    // 还有下一题
    currentQuestionIndex.value++
  } else if (isStudentFullyGraded(currentStudent.value)) {
    // 当前考生已完成评分
    const currentIdx = currentExam.value.students.findIndex(
      s => s.attempt_id === currentStudent.value!.attempt_id
    )
    const isLastStudent = currentIdx >= currentExam.value.students.length - 1
    
    if (isLastStudent) {
      // 最后一个考生完成，提交评分
      submitGrades()
    } else {
      // 切换到下一个考生（不管是否已评分）
      const nextStudent = currentExam.value.students[currentIdx + 1]
      switchStudent(nextStudent)
      ElMessage.info('已切换到下一位考生')
    }
  }
}

function goToQuestion(idx: number) {
  currentQuestionIndex.value = idx
}

function quickGrade(type: string) {
  if (!currentSaq.value) return
  const qid = currentSaq.value.qid
  switch (type) {
    case 'full':
      grades[qid].score = saqFullScore.value
      grades[qid].is_correct = true
      break
    case 'partial':
      grades[qid].score = Math.floor(saqFullScore.value * 0.75)
      grades[qid].is_correct = true
      break
    case 'half':
      grades[qid].score = Math.floor(saqFullScore.value * 0.5)
      grades[qid].is_correct = true
      break
    case 'zero':
      grades[qid].score = 0
      grades[qid].is_correct = false
      break
  }
}

function gradeAndNext() {
  if (!currentSaq.value || !currentStudent.value) return
  const qid = currentSaq.value.qid
  // 如果还没评分，自动标记为已评分
  if (grades[qid].is_correct === undefined) {
    grades[qid].is_correct = grades[qid].score >= saqFullScore.value * 0.6
  }
  // 前往下一题或完成
  if (currentQuestionIndex.value < sortedSaqs.value.length - 1) {
    nextQuestion()
  } else {
    // 最后一题
    if (completionDialogShown.value) {
      // 弹窗已显示过，直接切换到下一个考生
      nextQuestion()
      return
    }
    completionDialogShown.value = true
    
    ElMessageBox.confirm(
      '已完成当前考生所有题目的评分，是否立即提交？',
      '评分完成',
      { confirmButtonText: '提交', cancelButtonText: '稍后提交', type: 'success' }
    ).then(() => {
      submitGrades()
    }).catch(() => {
      ElMessage.info('您可以稍后点击提交评分按钮')
    })
  }
}

function onScoreChange() {
  if (!currentSaq.value) return
  const qid = currentSaq.value.qid
  // 根据分数自动设置正确性
  grades[qid].is_correct = grades[qid].score >= saqFullScore.value * 0.6
}

function insertTemplate(tpl: string) {
  if (!currentSaq.value) return
  const qid = currentSaq.value.qid
  if (grades[qid].comment) {
    grades[qid].comment += '\n' + tpl
  } else {
    grades[qid].comment = tpl
  }
}

function copyText(text: string) {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 岗位分类颜色映射
const categoryColorMap: Record<string, string> = {}
const categoryColors = ['cat-blue', 'cat-green', 'cat-orange', 'cat-purple', 'cat-cyan', 'cat-pink']
let colorIndex = 0

function getCategoryColorClass(category: string): string {
  if (!category) return ''
  if (!categoryColorMap[category]) {
    categoryColorMap[category] = categoryColors[colorIndex % categoryColors.length]
    colorIndex++
  }
  return categoryColorMap[category]
}

function formatCategoryTag(category: string): string {
  if (!category) return ''
  // 保留完整名称，最多显示6个字符
  const maxLen = 6
  return category.length > maxLen ? category.slice(0, maxLen) + '…' : category
}

function handleKeydown(e: KeyboardEvent) {
  // 只在评分详情页面生效
  if (!currentStudent.value || !currentSaq.value) return
  
  // 如果焦点在输入框中，不处理快捷键
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
  
  const qid = currentSaq.value.qid
  
  switch (e.key) {
    case '1': // 满分
      grades[qid].score = saqFullScore.value
      grades[qid].is_correct = true
      e.preventDefault()
      break
    case '2': // 部分得分（3/4）
      grades[qid].score = Math.floor(saqFullScore.value * 3 / 4)
      grades[qid].is_correct = true
      e.preventDefault()
      break
    case '3': // 一半
      grades[qid].score = Math.floor(saqFullScore.value / 2)
      grades[qid].is_correct = true
      e.preventDefault()
      break
    case '0': // 零分
      grades[qid].score = 0
      grades[qid].is_correct = false
      e.preventDefault()
      break
    case 'ArrowUp':
      prevQuestion()
      e.preventDefault()
      break
    case 'ArrowDown':
    case 'Enter':
      gradeAndNext()  // 与界面按钮行为一致：标记评分后切换下一题
      e.preventDefault()
      break
  }
}

async function submitGrades() {
  if (!currentStudent.value) return
  
  const gradeData = currentStudent.value.pending_saqs
    .filter((saq: SaqItem) => grades[saq.qid]?.is_correct !== undefined)
    .map((saq: SaqItem) => ({
      qid: saq.qid,
      score: grades[saq.qid].score,
      is_correct: grades[saq.qid].is_correct,
      comment: grades[saq.qid].comment
    }))
  
  if (gradeData.length === 0) {
    ElMessage.warning('请先评分至少一道题目')
    return
  }
  
  const ungradedCount = currentStudent.value.pending_saqs.length - gradeData.length
  if (ungradedCount > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${ungradedCount} 道题目未评分，确定只提交已评分的题目吗？`,
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }
  
  submitting.value = true
  try {
    const res = await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/grade`, {
      method: 'POST',
      data: {
        attempt_id: currentStudent.value.attempt_id,
        grades: gradeData
      }
    })
    
    if (res.data.ok) {
      ElMessage.success(`评分成功！已更新 ${res.data.updated_count} 道题目，新增 ${res.data.added_score} 分`)
      // 标记当前考生已提交
      if (currentStudent.value) {
        submittedStudents.add(currentStudent.value.attempt_id)
      }
      // 保留当前考生在列表中，便于修改评分
      // 自动切换到下一个未评分的考生（如果有的话）
      if (currentExam.value && currentStudent.value) {
        const currentIdx = currentExam.value.students.findIndex(
          s => s.attempt_id === currentStudent.value!.attempt_id
        )
        const nextStudent = currentExam.value.students.find(
          (s, idx) => idx > currentIdx && !isStudentFullyGraded(s)
        )
        if (nextStudent) {
          selectStudent(nextStudent)
          ElMessage.info('已自动切换到下一位考生')
        }
      }
    } else {
      ElMessage.error(res.data.detail || res.data.msg || '提交评分失败')
    }
  } catch (e: any) {
    ElMessage.error('请求失败: ' + (e.message || '网络错误'))
  } finally {
    submitting.value = false
  }
}

function formatText(text: string): string {
  if (!text) return ''
  return text.replace(/<NEWLINE>/g, '<br>')
}

function previewImage(url: string) {
  previewUrl.value = url
  previewVisible.value = true
}

function goBack() {
  // 返回到管理页面
  router.push('/admin')
}
</script>

<style scoped>
.saq-grading-page {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  outline: none;
}

/* ==================== 三栏布局 ==================== */
.grading-layout {
  display: grid;
  grid-template-columns: 240px 1fr 320px;
  height: 100vh;
}

/* ==================== 左侧边栏 ==================== */
.sidebar {
  background: #1e293b;
  border-right: 1px solid rgba(96, 165, 250, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.1);
}

.back-btn { color: #94a3b8; }

.exam-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-top: 8px;
  padding: 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==================== 考生列表区域 ==================== */
.student-list-section {
  border-bottom: 1px solid rgba(96, 165, 250, 0.1);
  padding-bottom: 12px;
}

.student-list-section .list-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.list-count {
  font-size: 0.7rem;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.student-list {
  max-height: 180px;
  overflow-y: auto;
  padding: 0 8px;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.student-item:hover { background: rgba(96, 165, 250, 0.1); }
.student-item.active { 
  background: rgba(96, 165, 250, 0.2); 
  border-left: 3px solid #60a5fa; 
}

.student-brief {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-pending {
  font-size: 0.7rem;
  color: #f59e0b;
}

.student-done {
  color: #22c55e;
  font-size: 16px;
}

.student-pagination {
  margin-top: 12px;
  justify-content: center;
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: #94a3b8;
  --el-pagination-button-color: #94a3b8;
  --el-pagination-hover-color: #60a5fa;
}

/* ==================== 题目列表区域 ==================== */
.question-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 8px;
}

.progress-section {
  padding: 0 16px;
  margin-bottom: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

.progress-num { color: #60a5fa; font-weight: 600; }

.question-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.list-title {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 4px;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.question-item:hover { background: rgba(96, 165, 250, 0.1); }
.question-item.active { background: rgba(96, 165, 250, 0.2); border-left: 3px solid #60a5fa; }
.question-item.graded { background: rgba(34, 197, 94, 0.1); }
.question-item.graded.active { background: rgba(34, 197, 94, 0.2); border-left-color: #22c55e; }

.q-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(96, 165, 250, 0.2);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.question-item.graded .q-num { background: rgba(34, 197, 94, 0.2); }

.q-status { flex: 1; }
.icon-graded { color: #22c55e; }
.q-score { font-size: 0.8rem; color: #22c55e; font-weight: 600; }

/* 岗位分类标签样式 */
.q-category-tag {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.q-category-tag.cat-blue {
  background: rgba(96, 165, 250, 0.25);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.4);
}

.q-category-tag.cat-green {
  background: rgba(34, 197, 94, 0.25);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.q-category-tag.cat-orange {
  background: rgba(245, 158, 11, 0.25);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.q-category-tag.cat-purple {
  background: rgba(168, 85, 247, 0.25);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

.q-category-tag.cat-cyan {
  background: rgba(34, 211, 238, 0.25);
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.4);
}

.q-category-tag.cat-pink {
  background: rgba(236, 72, 153, 0.25);
  color: #ec4899;
  border: 1px solid rgba(236, 72, 153, 0.4);
}

.submit-section {
  padding: 16px;
  border-top: 1px solid rgba(96, 165, 250, 0.1);
}

.submit-btn { width: 100%; }

/* ==================== 中间主面板 ==================== */
.main-panel {
  background: #0f172a;
  overflow: hidden;
}

.content-scroll {
  height: 100vh;
  overflow-y: auto;
  padding: 24px;
}

.section {
  background: #1e293b;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(96, 165, 250, 0.05);
  border-bottom: 1px solid rgba(96, 165, 250, 0.1);
}

.section-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.section-body {
  padding: 20px;
}

.stem-text {
  font-size: 1.05rem;
  line-height: 1.9;
  color: #e2e8f0;
}

.stem-images {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stem-image {
  max-width: 280px;
  max-height: 180px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.stem-image:hover { border-color: #60a5fa; }

.reference-section .section-header { border-left: 3px solid #22c55e; }
.analysis-section .section-header { border-left: 3px solid #f59e0b; }
.student-section .section-header { border-left: 3px solid #60a5fa; }

.answer-body {
  min-height: 100px;
  max-height: 250px;
  overflow-y: auto;
}

.answer-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.8;
  color: #e2e8f0;
}

.answer-body.empty pre { color: #64748b; font-style: italic; }

.word-count { font-size: 0.75rem; color: #64748b; }

/* ==================== 右侧评分面板 ==================== */
.grading-panel {
  background: #1e293b;
  border-left: 1px solid rgba(96, 165, 250, 0.15);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
}

.grade-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

/* 快速评分按钮 */
.grade-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.grade-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border: 2px solid rgba(96, 165, 250, 0.2);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.grade-btn:hover { border-color: rgba(96, 165, 250, 0.5); transform: translateY(-2px); }
.grade-btn.active { border-color: #60a5fa; background: rgba(96, 165, 250, 0.2); }

.grade-btn.full:hover, .grade-btn.full.active { border-color: #22c55e; }
.grade-btn.partial:hover, .grade-btn.partial.active { border-color: #84cc16; }
.grade-btn.half:hover, .grade-btn.half.active { border-color: #eab308; }
.grade-btn.zero:hover, .grade-btn.zero.active { border-color: #ef4444; }

.btn-score { font-size: 1.5rem; font-weight: 700; color: #e2e8f0; }
.btn-label { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }

.keyboard-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.keyboard-tips span {
  font-size: 0.7rem;
  color: #64748b;
}

.keyboard-tips kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.7rem;
  background: rgba(96, 165, 250, 0.2);
  border-radius: 4px;
  color: #60a5fa;
  margin-right: 4px;
}

/* 自定义分数 */
.score-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-max { font-size: 1.1rem; color: #64748b; }

/* 评语区域 */
.comment-area { flex: 1; display: flex; flex-direction: column; }

/* 导航按钮 */
.nav-buttons {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(96, 165, 250, 0.2);
}

.nav-btn { flex: 1; }
.nav-btn.next { background: #22c55e; border-color: #22c55e; }
.nav-btn.next:hover { background: #16a34a; }

/* ==================== 列表视图 ==================== */
.list-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.list-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #60a5fa;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 统计行 */
.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  background: #1e293b;
  border-radius: 16px;
}

.stat-item { text-align: center; flex: 1; }
.stat-num { font-size: 2rem; font-weight: 700; color: #60a5fa; }
.stat-text { font-size: 0.875rem; color: #94a3b8; margin-top: 4px; }
.stat-item.completed .stat-num { color: #22c55e; }

/* 搜索筛选栏 */
.filter-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #1e293b;
  border-radius: 12px;
  flex-wrap: wrap;
}

.filter-bar .search-input {
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}

.filter-bar .date-range-picker {
  width: 260px;
}

.filter-bar .status-filter {
  margin-left: auto;
}

:deep(.filter-bar .el-input__wrapper) {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(96, 165, 250, 0.3);
}

:deep(.filter-bar .el-input__inner) {
  color: #e2e8f0;
}

:deep(.filter-bar .el-select .el-input__wrapper) {
  background: rgba(15, 23, 42, 0.6);
}

:deep(.filter-bar .el-radio-button__inner) {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(96, 165, 250, 0.3);
  color: #94a3b8;
}

:deep(.filter-bar .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(96, 165, 250, 0.3);
  border-color: #60a5fa;
  color: #60a5fa;
}

/* 试卷列表 */
.paper-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.paper-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #1e293b;
  border: 1px solid rgba(96, 165, 250, 0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.paper-card:hover {
  border-color: rgba(96, 165, 250, 0.4);
  transform: translateX(4px);
}

.paper-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.paper-info { display: flex; flex-direction: column; gap: 4px; }
.paper-student { font-size: 1.1rem; font-weight: 600; color: #e2e8f0; }
.paper-meta { font-size: 0.875rem; color: #94a3b8; }
.paper-time { font-size: 0.75rem; color: #64748b; }

.paper-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pending-badge {
  padding: 6px 12px;
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.pending-badge.orange {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.exam-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(96, 165, 250, 0.2);
  border-radius: 12px;
  font-size: 24px;
}

.exam-card .paper-right {
  gap: 12px;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
  font-size: 1.1rem;
}

.loading-state .el-icon { font-size: 2rem; margin-bottom: 12px; }

/* ==================== Element Plus 覆盖 ==================== */
:deep(.el-input-number) {
  --el-input-bg-color: rgba(15, 23, 42, 0.8);
  --el-input-border-color: rgba(96, 165, 250, 0.3);
  --el-input-text-color: #e2e8f0;
}

:deep(.el-input-number--large) { width: 100%; }
:deep(.el-input-number--large .el-input__inner) { font-size: 1.25rem; font-weight: 700; }

:deep(.el-textarea__inner) {
  background: rgba(15, 23, 42, 0.5) !important;
  border-color: rgba(96, 165, 250, 0.3) !important;
  color: #e2e8f0 !important;
}

:deep(.el-progress__outer) { background: rgba(96, 165, 250, 0.2); }
:deep(.el-avatar) { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
:deep(.el-empty__description p) { color: #94a3b8; }
</style>
