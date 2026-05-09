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

          <!-- 知识条款 -->
          <div v-if="hasClauseGrading" class="section clause-section">
            <div class="section-header">
              <span class="section-title">📑 知识条款（{{ currentSaq.knowledge_clauses!.length }}条）</span>
              <span class="clause-total-hint">满分 {{ saqFullScore }} 分</span>
            </div>
            <div class="section-body">
              <div 
                v-for="(clause, ci) in currentSaq.knowledge_clauses" 
                :key="ci" 
                class="clause-item"
              >
                <div class="clause-header">
                  <span class="clause-label">条款{{ ci + 1 }}</span>
                  <span class="clause-max-score" v-if="currentClauseScores[ci]">（{{ currentClauseScores[ci] }}分）</span>
                </div>
                <div class="clause-text">{{ clause }}</div>
              </div>
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
        <div class="panel-header">
          <div class="panel-title">评分操作</div>
          <div class="panel-header-actions">
            <el-button 
              size="small" 
              type="warning" 
              @click="openAiGradeDialog"
              :disabled="!currentExam"
            >
              🤖 AI自动评分
            </el-button>
            <el-button
              size="small"
              :type="aiGrading ? 'danger' : 'info'"
              @click="aiProgressVisible = true"
              plain
            >
              📋 任务
              <span v-if="aiGrading" class="task-badge running">{{ aiProgress.completedStudents }}/{{ aiProgress.totalStudents }}</span>
            </el-button>
            <div class="sync-status" v-if="lastSyncTime">
              <span class="sync-text">已同步</span>
            </div>
          </div>
        </div>
        
        <!-- 按条款评分（有知识条款时显示） -->
        <div v-if="hasClauseGrading && currentGrade" class="clause-grading">
          <div class="grade-label">
            按条款评分
            <div class="clause-quick-actions">
              <el-button size="small" link type="success" @click="clauseQuickFull">全满分</el-button>
              <el-button size="small" link type="danger" @click="clauseQuickZero">全零分</el-button>
            </div>
          </div>
          <div class="clause-grade-list">
            <div 
              v-for="(clause, ci) in currentSaq!.knowledge_clauses" 
              :key="ci" 
              class="clause-grade-row"
            >
              <div class="clause-grade-info">
                <span class="clause-grade-label">条款{{ ci + 1 }}</span>
                <span class="clause-grade-text" :title="clause">{{ clause.length > 20 ? clause.slice(0, 20) + '…' : clause }}</span>
              </div>
              <div class="clause-grade-input">
                <el-input-number
                  v-model="currentGrade.clause_grades![ci]"
                  :min="0"
                  :max="currentClauseScores[ci] ?? saqFullScore"
                  :step="1"
                  size="small"
                  controls-position="right"
                  style="width: 90px;"
                  @change="onClauseScoreChange"
                />
                <span class="clause-grade-max">/ {{ currentClauseScores[ci] ?? '?' }}</span>
              </div>
            </div>
          </div>
          <div class="clause-grade-total">
            总分：<span class="total-num">{{ currentGrade.score }}</span> / {{ saqFullScore }}
          </div>
        </div>

        <!-- 快速评分（无知识条款时显示） -->
        <div v-else class="quick-grade">
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

        <!-- 自定义分数（无知识条款时显示，有条款时总分由条款自动汇总） -->
        <div class="custom-score" v-if="currentGrade && !hasClauseGrading">
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

        <!-- 批改信息 -->
        <div class="grader-info" v-if="currentSaq && getGraderInfo(currentSaq.qid)">
          <div class="grader-label">本题批改信息</div>
          <div class="grader-detail">
            <span class="grader-name">{{ getGraderInfo(currentSaq.qid)?.name }}</span>
            <span class="grader-time">{{ getGraderInfo(currentSaq.qid)?.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 考试列表视图 (初始视图) -->
    <div class="list-view" v-else>
      <div class="list-header">
        <h1>📝 简答题评分</h1>
        <div class="header-actions">
          <el-button 
            type="warning" 
            @click="openAiGradeDialog"
            :disabled="examList.length === 0"
          >
            🤖 AI自动评分
          </el-button>
          <el-button 
            :type="aiGrading ? 'danger' : 'info'"
            @click="aiProgressVisible = true"
            plain
          >
            📋 评分任务
            <span v-if="aiGrading" class="task-badge running">{{ aiProgress.completedStudents }}/{{ aiProgress.totalStudents }}</span>
          </el-button>
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
              <div class="paper-student">{{ exam.exam_name || exam.paper_title }}</div>
              <div class="paper-meta">{{ formatExamDate(exam.exam_start_time) }} | {{ exam.paper_title }}</div>
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

    <!-- AI自动评分 - 配置弹窗 -->
    <el-dialog 
      v-model="aiConfigVisible" 
      title="🤖 AI自动评分配置" 
      width="520px" 
      :close-on-click-modal="false"
    >
      <el-form label-width="90px" class="ai-config-form">
        <el-form-item label="目标考试">
          <el-select 
            v-model="aiConfig.examId" 
            placeholder="选择考试" 
            style="width: 100%"
            :disabled="!!currentExam"
          >
            <el-option 
              v-for="exam in examList" 
              :key="exam.exam_id" 
              :label="`${exam.exam_name || exam.paper_title}（${exam.student_count}人 / ${exam.total_pending}题）`" 
              :value="exam.exam_id" 
            />
          </el-select>
          <div class="ai-config-tip" v-if="currentExam">已在评分界面，固定为当前考试</div>
        </el-form-item>
        <el-form-item label="AI模型">
          <el-select v-model="aiConfig.modelId" placeholder="选择模型" style="width: 100%">
            <el-option v-for="m in llmOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分范围">
          <el-radio-group v-model="aiConfig.scope">
            <el-radio value="ungraded">所有未评分考生</el-radio>
            <el-radio value="all">全部考生（覆盖已有评分）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="自动提交">
          <el-switch v-model="aiConfig.autoSubmit" />
          <span class="ai-config-tip">评分完成后自动提交到服务器</span>
        </el-form-item>
      </el-form>
      <div class="ai-config-summary" v-if="aiConfig.examId">
        <el-icon style="color: #e6a23c; margin-right: 4px"><Warning /></el-icon>
        将评分 <b>{{ aiScopeSummary.studentCount }}</b> 位考生的约 <b>{{ aiScopeSummary.questionCount }}</b> 道题目
      </div>
      <div class="ai-config-summary" v-else style="border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.06);">
        <el-icon style="color: #ef4444; margin-right: 4px"><Warning /></el-icon>
        请先选择目标考试
      </div>
      <template #footer>
        <el-button @click="aiConfigVisible = false">取消</el-button>
        <el-button type="warning" @click="startBatchAiGrade" :disabled="!aiConfig.examId || aiScopeSummary.studentCount === 0">
          开始评分
        </el-button>
      </template>
    </el-dialog>

    <!-- AI评分任务 - 进度弹窗 -->
    <el-dialog 
      v-model="aiProgressVisible" 
      :title="aiGrading ? '🤖 AI评分任务 - 进行中' : (aiProgress.totalStudents > 0 ? '🤖 AI评分任务 - 已完成' : '🤖 AI评分任务')" 
      width="520px" 
      :close-on-click-modal="false"
      :close-on-press-escape="!aiGrading"
      :show-close="true"
    >
      <!-- 无任务状态 -->
      <div v-if="!aiGrading && aiProgress.totalStudents === 0" class="ai-task-empty">
        <div class="ai-task-empty-icon">📋</div>
        <div class="ai-task-empty-text">暂无评分任务</div>
        <div class="ai-task-empty-hint">点击「AI自动评分」按钮开始新的评分任务</div>
      </div>

      <!-- 有任务状态（进行中或已完成） -->
      <div v-else class="ai-progress-content">
        <!-- 状态标签 -->
        <div class="ai-task-status">
          <el-tag v-if="aiGrading" type="danger" effect="dark" round>⏳ 进行中</el-tag>
          <el-tag v-else-if="aiProgress.completedStudents < aiProgress.totalStudents && aiProgress.totalStudents > 0" type="info" effect="dark" round>⏹ 已停止</el-tag>
          <el-tag v-else-if="aiProgress.errorCount > 0" type="warning" effect="dark" round>⚠ 已完成（有失败）</el-tag>
          <el-tag v-else type="success" effect="dark" round>✅ 已完成</el-tag>
        </div>
        <div class="ai-progress-overview">
          <el-progress 
            :percentage="aiProgressPercent" 
            :stroke-width="20"
            :status="!aiGrading && aiProgress.errorCount === 0 ? 'success' : undefined"
            :format="() => `${aiProgress.completedStudents}/${aiProgress.totalStudents}`"
          />
        </div>
        <div class="ai-progress-detail">
          <div class="ai-progress-row" v-if="aiProgress.currentStudentName">
            <span class="ai-progress-label">当前考生：</span>
            <span class="ai-progress-value">{{ aiProgress.currentStudentName }}</span>
          </div>
          <div class="ai-progress-row">
            <span class="ai-progress-label">考生进度：</span>
            <span class="ai-progress-value">{{ aiProgress.completedStudents }} / {{ aiProgress.totalStudents }}</span>
          </div>
          <div class="ai-progress-row">
            <span class="ai-progress-label">成功评分：</span>
            <span class="ai-progress-value success">{{ aiProgress.successCount }} 题</span>
            <template v-if="aiProgress.errorCount > 0">
              <span class="ai-progress-label" style="margin-left: 12px;">失败：</span>
              <span class="ai-progress-value error">{{ aiProgress.errorCount }} 题</span>
            </template>
          </div>
        </div>
        <div class="ai-progress-log" v-if="aiProgress.logs.length > 0">
          <div 
            class="ai-log-item" 
            v-for="(log, i) in aiProgress.logs.slice(-10)" 
            :key="i"
            :class="log.type"
          >
            {{ log.msg }}
          </div>
        </div>
      </div>
      <template #footer>
        <template v-if="aiGrading">
          <el-button @click="aiProgressVisible = false">最小化</el-button>
          <el-button type="danger" @click="cancelAiGrade">取消评分</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="aiProgressVisible = false">关闭</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewUrl]"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Refresh, Back, User, Check, CopyDocument, ArrowLeft, ArrowRight, Search, Warning
} from '@element-plus/icons-vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { fetchMcqWithAuth } from '@/utils/request'
import { MCQ_BASE_URL } from '@/config/api/api'
import { useAiGrading } from '@/composables/useAiGrading'

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
  is_correct?: boolean | string
  full_score?: number  // 该题满分（支持自定义分数）
  comment?: string
  category?: string  // 岗位分类标签
  knowledge_clauses?: string[]  // 知识条款列表
  clause_scores?: number[]  // 每条款配置分数 [分1, 分2, ...]
  clause_grades?: number[]  // AI评分的每条款实际得分
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
  exam_name?: string
  exam_start_time?: string
  students: StudentData[]
  total_pending: number
  student_count: number
  start_time?: string
  earliest_end?: string
}

interface GradeInfo {
  score: number
  is_correct?: boolean | string
  comment: string
  clause_grades?: number[]  // 每条款实际得分
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

// ==================== 多人同步批改相关 ====================
// 进度同步状态
const progressSyncTimer = ref<ReturnType<typeof setInterval> | null>(null)
const PROGRESS_SYNC_INTERVAL = 5000 // 5秒轮询一次
const lastSyncTime = ref('')
const syncedProgress = reactive<Record<string, Record<string, { is_graded: boolean; score: number; is_correct?: boolean | string; comment: string; graded_time: string; grader: string; clause_grades?: number[] }>>>({})

// 启动进度同步轮询
function startProgressSync() {
  if (progressSyncTimer.value) {
    clearInterval(progressSyncTimer.value)
  }
  
  // 立即同步一次
  syncGradingProgress()
  
  // 设置定时轮询
  progressSyncTimer.value = setInterval(() => {
    syncGradingProgress()
  }, PROGRESS_SYNC_INTERVAL)
}

// 停止进度同步
function stopProgressSync() {
  if (progressSyncTimer.value) {
    clearInterval(progressSyncTimer.value)
    progressSyncTimer.value = null
  }
}

// 同步评分进度
async function syncGradingProgress() {
  if (!currentExam.value) return
  
  try {
    const res = await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/grading-progress`, {
      params: {
        exam_id: currentExam.value.exam_id
      }
    })
    
    if (res.data.ok) {
      const newProgress = res.data.progress || {}
      const newLastUpdate = res.data.last_update || ''
      const hasNewUpdate = newLastUpdate && newLastUpdate !== lastSyncTime.value
      
      console.log('[ProgressSync] 服务器返回数据:', JSON.stringify(newProgress, null, 2))
      console.log('[ProgressSync] 同步完成, hasNewUpdate:', hasNewUpdate, 'last_update:', newLastUpdate)
      
      if (hasNewUpdate) {
        lastSyncTime.value = newLastUpdate
      }
      
      // 合并进度数据（始终更新）
      for (const [attemptId, qidProgress] of Object.entries(newProgress)) {
        const oldProgress = syncedProgress[attemptId] || {}
        if (!syncedProgress[attemptId]) {
          syncedProgress[attemptId] = {} as any
        }
        
        // 检测当前考生的当前题目是否被他人评分（冲突检测）
        if (hasNewUpdate && currentStudent.value?.attempt_id === attemptId && currentSaq.value) {
          const currentQid = currentSaq.value.qid
          const newGrade = (qidProgress as Record<string, any>)[currentQid]
          const oldGrade = oldProgress[currentQid]
          
          // 如果当前题目有新的评分，且本地未评分或评分时间不同
          if (newGrade?.is_graded && newGrade.grader) {
            const isNewGrade = !oldGrade?.is_graded || oldGrade.graded_time !== newGrade.graded_time
            const localGrade = grades[currentQid]
            const localNotGraded = !localGrade || localGrade.is_correct === undefined
            
            if (isNewGrade && localNotGraded) {
              // 显示冲突提示
              ElMessage({
                message: `此题已被 ${newGrade.grader} 于 ${formatGradedTime(newGrade.graded_time)} 评分`,
                type: 'warning',
                duration: 5000
              })
            }
          }
        }
        
        Object.assign(syncedProgress[attemptId], qidProgress)
      }
      
      // 始终更新当前考生的grades（从syncedProgress同步）
      if (currentStudent.value) {
        const attemptId = currentStudent.value.attempt_id
        const progress = syncedProgress[attemptId] || {}
        console.log('[ProgressSync] 当前考生:', attemptId, '进度数据:', Object.keys(progress).length, '条')
        for (const [qid, serverGrade] of Object.entries(progress)) {
          const localGrade = grades[qid]
          console.log('[ProgressSync] 检查题目:', qid, 
            'server.is_graded:', serverGrade.is_graded,
            'local.is_correct:', localGrade?.is_correct)
          // 更新本地评分：AI任务运行中始终覆盖，否则只更新未评分的题目
          if (serverGrade.is_graded) {
            if (!localGrade || localGrade.is_correct === undefined || aiGrading.value) {
              console.log('[ProgressSync] 更新题目:', qid, '分数:', serverGrade.score)
              // 确保响应式更新
              if (!grades[qid]) {
                grades[qid] = { score: 0, is_correct: undefined, comment: '' }
              }
              grades[qid].score = serverGrade.score
              grades[qid].is_correct = serverGrade.is_correct ?? true
              grades[qid].comment = serverGrade.comment || ''
              // clause_grades优先从server取，其次从AI任务结果取
              const aiClause = latestGradedResults.value?.[attemptId]?.[qid]?.clause_grades
              if (serverGrade.clause_grades) {
                grades[qid].clause_grades = serverGrade.clause_grades
              } else if (aiClause) {
                grades[qid].clause_grades = aiClause
              }
            }
          }
        }
      }
    }
  } catch (e: any) {
    console.error('[ProgressSync] 同步失败:', e.message)
  }
}

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

// 当前题目是否有知识条款（用于按条款打分模式）
const hasClauseGrading = computed(() => {
  if (!currentSaq.value) return false
  const clauses = currentSaq.value.knowledge_clauses
  return clauses && clauses.length > 0
})

// 当前题目的知识条款配置分数（每条款满分）
const currentClauseScores = computed(() => {
  if (!currentSaq.value) return []
  return currentSaq.value.clause_scores || []
})

// 当知识条款小分变化时，自动汇总到总分
function onClauseScoreChange() {
  if (!currentSaq.value || !currentGrade.value) return
  const qid = currentSaq.value.qid
  const cg = grades[qid].clause_grades
  if (!cg) return
  const total = cg.reduce((sum, s) => sum + (s || 0), 0)
  grades[qid].score = total
  // 自动标记评分状态
  grades[qid].is_correct = total >= saqFullScore.value * 0.6
}

// 快速按条款全部满分
function clauseQuickFull() {
  if (!currentSaq.value || !currentGrade.value) return
  const qid = currentSaq.value.qid
  const clauseMax = currentClauseScores.value
  const clauses = currentSaq.value.knowledge_clauses || []
  if (clauses.length === 0) return
  grades[qid].clause_grades = clauses.map((_, i) => clauseMax[i] ?? Math.round(saqFullScore.value / clauses.length))
  onClauseScoreChange()
}

// 快速按条款全部零分
function clauseQuickZero() {
  if (!currentSaq.value || !currentGrade.value) return
  const qid = currentSaq.value.qid
  const clauses = currentSaq.value.knowledge_clauses || []
  if (clauses.length === 0) return
  grades[qid].clause_grades = new Array(clauses.length).fill(0)
  onClauseScoreChange()
}

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
  // 检查是否有进行中或已完成的评分任务
  checkPendingTask()
})

// 浏览器关闭/刷新时的提示
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (hasUnsavedGrades()) {
    e.preventDefault()
    e.returnValue = '您有未保存的评分，确定要离开吗？'
    return e.returnValue
  }
}

onUnmounted(() => {
  // 停止进度同步
  stopProgressSync()
  // 移除 beforeunload 事件
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 添加 beforeunload 事件监听
watch(currentStudent, (newStudent) => {
  if (newStudent) {
    window.addEventListener('beforeunload', handleBeforeUnload)
  } else {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}, { immediate: true })

// Vue 路由离开时的提示
onBeforeRouteLeave(async (to, from, next) => {
  if (hasUnsavedGrades()) {
    try {
      await ElMessageBox.confirm(
        '您有未保存的评分，确定要离开吗？',
        '提示',
        { confirmButtonText: '离开', cancelButtonText: '取消', type: 'warning' }
      )
      next()
    } catch {
      next(false)
    }
  } else {
    next()
  }
})

// 监听当前考试变化，启动/停止进度同步
watch(currentExam, (newExam) => {
  if (newExam) {
    console.log('[ProgressSync] 启动同步, exam_id:', newExam.exam_id)
    startProgressSync()
  } else {
    stopProgressSync()
  }
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

async function selectExam(exam: ExamData) {
  currentExam.value = exam
  studentPage.value = 1 // 重置分页
  
  // 清空旧的同步进度和本地缓存，重新获取最新数据
  Object.keys(syncedProgress).forEach(key => delete syncedProgress[key])
  Object.keys(gradesCache).forEach(key => delete gradesCache[key])
  submittedStudents.clear()
  lastSyncTime.value = ''
  await syncGradingProgress()
  
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
  
  // 从同步进度/缓存/后端数据初始化评分
  const cached = gradesCache[student.attempt_id]
  const synced = syncedProgress[student.attempt_id] || {}
  
  for (const saq of student.pending_saqs) {
    // 初始化知识条款分数数组
    const initClauseGrades = (): number[] | undefined => {
      if (!saq.knowledge_clauses || saq.knowledge_clauses.length === 0) return undefined
      return new Array(saq.knowledge_clauses.length).fill(0)
    }
    
    if (synced[saq.qid]?.is_graded) {
      // 优先使用同步的进度数据（最新，包含他人评分/AI评分）
      // 如果synced没有clause_grades，从AI任务结果中补充
      const aiResult = latestGradedResults.value?.[student.attempt_id]?.[saq.qid]
      grades[saq.qid] = {
        score: synced[saq.qid].score || 0,
        is_correct: synced[saq.qid].is_correct ?? true,
        comment: synced[saq.qid].comment || '',
        clause_grades: synced[saq.qid].clause_grades || aiResult?.clause_grades || initClauseGrades()
      }
    } else if (cached && cached[saq.qid]?.is_correct !== undefined) {
      // 使用本地缓存（我自己的未提交评分）
      grades[saq.qid] = { ...cached[saq.qid] }
    } else if (saq.is_graded) {
      // 使用初始加载的已评分数据（服务器数据优先于AI原始结果）
      const aiResult = latestGradedResults.value?.[student.attempt_id]?.[saq.qid]
      grades[saq.qid] = {
        score: saq.score || 0,
        is_correct: saq.is_correct ?? true,
        comment: saq.comment || '',
        clause_grades: saq.clause_grades || aiResult?.clause_grades || initClauseGrades()
      }
      submittedStudents.add(student.attempt_id)
    } else {
      // 检查任务中是否有AI结果（评分已完成但尚未同步到saq数据）
      const aiResult = latestGradedResults.value?.[student.attempt_id]?.[saq.qid]
      if (aiResult) {
        grades[saq.qid] = {
          score: aiResult.score ?? 0,
          is_correct: aiResult.is_correct ?? true,
          comment: aiResult.comment || '',
          clause_grades: aiResult.clause_grades || initClauseGrades()
        }
      } else {
        // 初始化为未评分
        grades[saq.qid] = {
          score: 0,
          is_correct: undefined,
          comment: '',
          clause_grades: initClauseGrades()
        }
      }
    }
  }
}

// 检查当前考生是否有未提交的评分（与已同步数据比较，只有真正修改过的才算）
function hasUnsavedGrades(): boolean {
  if (!currentStudent.value) return false
  const attemptId = currentStudent.value.attempt_id
  // 如果已提交过，则认为已保存
  if (submittedStudents.has(attemptId)) return false
  
  // 检查是否有评分与服务器不同的题目
  const serverProgress = syncedProgress[attemptId] || {}
  return currentStudent.value.pending_saqs.some(saq => {
    const localGrade = grades[saq.qid]
    if (localGrade?.is_correct === undefined) return false // 本地未评分
    
    const serverGrade = serverProgress[saq.qid]
    if (!serverGrade?.is_graded) return true // 服务器未评分，本地已评分
    
    // 比较分数和评语是否有变化
    return localGrade.score !== serverGrade.score || 
           (localGrade.comment || '') !== (serverGrade.comment || '')
  })
}

// 提交当前考生评分后执行回调
async function saveAndCallback(callback: () => void) {
  if (!currentStudent.value) {
    callback()
    return
  }
  
  const gradeData = currentStudent.value.pending_saqs
    .filter((saq: SaqItem) => grades[saq.qid]?.is_correct !== undefined)
    .map((saq: SaqItem) => ({
      qid: saq.qid,
      score: grades[saq.qid].score,
      is_correct: grades[saq.qid].is_correct,
      comment: grades[saq.qid].comment
    }))
  
  if (gradeData.length === 0) {
    callback()
    return
  }
  
  try {
    const res = await fetchMcqWithAuth(`${MCQ_BASE_URL}/saq/grade`, {
      method: 'POST',
      data: {
        attempt_id: currentStudent.value.attempt_id,
        grades: gradeData
      }
    })
    
    if (res.data.ok) {
      ElMessage.success(`已保存 ${gradeData.length} 道题目的评分`)
      submittedStudents.add(currentStudent.value.attempt_id)
    } else {
      ElMessage.error(res.data.detail || res.data.msg || '保存失败')
    }
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || '网络错误'))
  }
  
  callback()
}

async function switchStudent(student: StudentData) {
  // 如果当前考生与目标相同，不需要切换
  if (currentStudent.value?.attempt_id === student.attempt_id) return
  
  // 如果有未保存的评分，自动保存
  if (hasUnsavedGrades()) {
    await saveAndCallback(() => selectStudent(student))
  } else {
    selectStudent(student)
  }
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

// 获取题目的批改人信息
function getGraderInfo(qid: string): { name: string; time: string; score: string } | null {
  if (!currentStudent.value) return null
  const attemptId = currentStudent.value.attempt_id
  const progress = syncedProgress[attemptId]?.[qid]
  if (progress?.is_graded && progress.grader) {
    return {
      name: progress.grader,
      time: progress.graded_time ? formatGradedTime(progress.graded_time) : '',
      score: `${progress.score}分`
    }
  }
  return null
}

// 格式化考试日期
function formatExamDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  } catch {
    return dateStr || ''
  }
}

// 格式化批改时间
function formatGradedTime(isoTime: string): string {
  if (!isoTime) return ''
  try {
    const date = new Date(isoTime)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
  } catch {
    return isoTime
  }
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
  
  const attemptId = currentStudent.value.attempt_id
  const serverProgress = syncedProgress[attemptId] || {}
  
  // 只提交用户实际修改的题目（与服务器数据对比）
  const gradeData = currentStudent.value.pending_saqs
    .filter((saq: SaqItem) => {
      const localGrade = grades[saq.qid]
      if (!localGrade || localGrade.is_correct === undefined) return false // 本地未评分
      
      const serverGrade = serverProgress[saq.qid]
      if (!serverGrade?.is_graded) return true // 服务器未评分，本地已评分 = 需要提交
      
      // 服务器已评分，比较是否有变化
      return localGrade.score !== serverGrade.score || 
             (localGrade.comment || '') !== (serverGrade.comment || '')
    })
    .map((saq: SaqItem) => {
      const g: any = {
        qid: saq.qid,
        score: grades[saq.qid].score,
        is_correct: grades[saq.qid].is_correct,
        comment: grades[saq.qid].comment
      }
      if (grades[saq.qid].clause_grades) {
        g.clause_grades = grades[saq.qid].clause_grades
      }
      return g
    })
  
  if (gradeData.length === 0) {
    ElMessage.info('没有需要提交的评分修改')
    return
  }
  
  // 统计未评分题目数（用于提示）
  const ungradedCount = currentStudent.value.pending_saqs.filter((saq: SaqItem) => {
    const localGrade = grades[saq.qid]
    const serverGrade = serverProgress[saq.qid]
    return (!localGrade || localGrade.is_correct === undefined) && !serverGrade?.is_graded
  }).length
  
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
  console.log('[Submit] 提交评分数据:', JSON.stringify(gradeData, null, 2))
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

// ==================== AI自动评分（使用全局composable） ====================
const {
  aiConfigVisible,
  aiProgressVisible,
  aiGrading,
  aiConfig,
  aiProgress,
  aiProgressPercent,
  cancelAiGrade,
  startGradeTask,
  checkPendingTask,
  onProgressChange,
  latestGradedResults,
} = useAiGrading()

// AI模型选项配置（可直接在此修改）
const llmOptions = ref([
  { value: 'qwen3-32b', label: 'Qwen (通用)' },
  { value: 'qwen2025', label: 'Qwen (增强)' },
  { value: 'deepseek', label: 'DeepSeekv3.1' },
  { value: 'deepseek-3.2', label: 'DeepSeekv3.2' },
  { value: 'qwen-plus', label: 'Qwen (云端)' },
])

// 当后台评分有新进展时，刷新评分数据到UI
onProgressChange((gradedResults, wasRunning) => {
  // 直接将AI结果（含clause_grades）写入当前考生的grades
  if (currentStudent.value && gradedResults) {
    const attemptId = currentStudent.value.attempt_id
    const studentResults = gradedResults[attemptId]
    if (studentResults) {
      for (const [qid, result] of Object.entries(studentResults)) {
        if (!grades[qid]) continue
        // wasRunning=true：任务运行中或刚完成，始终覆盖（用户主动发起了AI评分）
        // wasRunning=false：恢复旧结果（如页面加载），只更新未评分的题目
        if (wasRunning || grades[qid].is_correct === undefined) {
          grades[qid].score = result.score ?? grades[qid].score
          grades[qid].is_correct = result.is_correct ?? grades[qid].is_correct
          grades[qid].comment = result.comment || grades[qid].comment
          if (result.clause_grades) {
            grades[qid].clause_grades = result.clause_grades
          }
        }
      }
    }
  }
  // 同时也同步服务器进度数据（更新其他考生的状态）
  syncGradingProgress()
})

// 根据aiConfig.examId查找目标考试
const aiTargetExam = computed(() => {
  if (!aiConfig.examId) return null
  if (currentExam.value?.exam_id === aiConfig.examId) return currentExam.value
  return examList.value.find(e => e.exam_id === aiConfig.examId) || null
})

// 配置弹窗中的范围摘要
const aiScopeSummary = computed(() => {
  const exam = aiTargetExam.value
  if (!exam) return { studentCount: 0, questionCount: 0 }

  const hasStudentDetail = exam.students && exam.students.length > 0
  if (!hasStudentDetail) {
    return { studentCount: exam.student_count || 0, questionCount: exam.total_pending || 0 }
  }

  const students = exam.students
  let targetStudents: StudentData[] = []

  if (aiConfig.scope === 'ungraded') {
    targetStudents = students.filter(s => s.pending_saqs.some(saq => !saq.is_graded))
  } else {
    targetStudents = [...students]
  }

  let questionCount = 0
  for (const s of targetStudents) {
    if (aiConfig.scope === 'all') {
      questionCount += s.pending_saqs.length
    } else {
      questionCount += s.pending_saqs.filter(saq => !saq.is_graded).length
    }
  }

  return { studentCount: targetStudents.length, questionCount }
})

// 打开配置弹窗
function openAiGradeDialog() {
  if (currentExam.value) {
    aiConfig.examId = currentExam.value.exam_id
  } else if (examList.value.length === 0) {
    ElMessage.warning('暂无考试数据，请先刷新')
    return
  } else {
    if (!aiConfig.examId) {
      aiConfig.examId = examList.value[0]?.exam_id || ''
    }
  }
  // 后台任务不支持'current'单考生模式
  if (aiConfig.scope === 'current') {
    aiConfig.scope = 'ungraded'
  }
  aiConfigVisible.value = true
}

// 启动批量AI评分（提交后台任务）
async function startBatchAiGrade() {
  if (!aiConfig.examId) {
    ElMessage.warning('请先选择目标考试')
    return
  }
  aiConfigVisible.value = false

  try {
    await startGradeTask(aiConfig.examId, aiConfig.modelId, aiConfig.scope, aiConfig.autoSubmit)
    ElMessage.success('评分任务已提交，后台运行中...')
  } catch (e: any) {
    ElMessage.error(e.message || '创建评分任务失败')
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
.clause-section .section-header { border-left: 3px solid #a855f7; }
.student-section .section-header { border-left: 3px solid #60a5fa; }

/* 知识条款显示 */
.clause-total-hint {
  font-size: 0.75rem;
  color: #a855f7;
  font-weight: 500;
}

.clause-item {
  padding: 10px 0;
  border-bottom: 1px solid rgba(96, 165, 250, 0.08);
}

.clause-item:last-child { border-bottom: none; }

.clause-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.clause-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #a855f7;
  background: rgba(168, 85, 247, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

.clause-max-score {
  font-size: 0.7rem;
  color: #94a3b8;
}

.clause-text {
  font-size: 0.9rem;
  line-height: 1.7;
  color: #cbd5e1;
}

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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
}

.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #22c55e;
}

.sync-text {
  opacity: 0.8;
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

/* 按条款评分 */
.clause-grading .grade-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clause-quick-actions {
  display: flex;
  gap: 4px;
}

.clause-grade-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clause-grade-row {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 8px;
  padding: 10px 12px;
}

.clause-grade-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.clause-grade-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #a855f7;
  background: rgba(168, 85, 247, 0.15);
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.clause-grade-text {
  font-size: 0.75rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clause-grade-input {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clause-grade-max {
  font-size: 0.8rem;
  color: #64748b;
}

.clause-grade-total {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(96, 165, 250, 0.1);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #94a3b8;
  text-align: center;
}

.clause-grade-total .total-num {
  font-size: 1.3rem;
  font-weight: 700;
  color: #60a5fa;
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

/* 批改信息 */
.grader-info {
  margin-top: 16px;
  padding: 12px;
  background: rgba(96, 165, 250, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(96, 165, 250, 0.2);
}

.grader-label {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-bottom: 6px;
}

.grader-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grader-name {
  font-size: 0.85rem;
  color: #60a5fa;
  font-weight: 500;
}

.grader-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

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

/* ==================== AI自动评分弹窗 ==================== */
.ai-config-form {
  margin-bottom: 12px;
}

.ai-config-form :deep(.el-form-item__label) {
  color: #cbd5e1;
}

.ai-config-form :deep(.el-radio) {
  margin-right: 16px;
}

.ai-config-tip {
  margin-left: 10px;
  font-size: 0.8rem;
  color: #94a3b8;
}

.ai-config-summary {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(230, 162, 60, 0.08);
  border: 1px solid rgba(230, 162, 60, 0.25);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.ai-config-summary b {
  color: #e6a23c;
  margin: 0 2px;
}

/* ==================== AI进度弹窗 ==================== */
.ai-progress-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-progress-overview {
  padding: 0 8px;
}

.ai-progress-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 8px;
}

.ai-progress-row {
  display: flex;
  align-items: center;
  font-size: 0.88rem;
}

.ai-progress-label {
  color: #94a3b8;
  min-width: 90px;
}

.ai-progress-value {
  color: #e2e8f0;
  font-weight: 600;
}

.ai-progress-value.success { color: #22c55e; }
.ai-progress-value.error { color: #ef4444; }

.ai-progress-log {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(96, 165, 250, 0.1);
}

.ai-log-item {
  font-size: 0.8rem;
  padding: 3px 0;
  color: #94a3b8;
  line-height: 1.5;
}

.ai-log-item.success { color: #22c55e; }
.ai-log-item.error { color: #ef4444; }
.ai-log-item.info { color: #60a5fa; }

/* ==================== AI任务空状态 ==================== */
.ai-task-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  gap: 8px;
}

.ai-task-empty-icon {
  font-size: 2.5rem;
  opacity: 0.5;
}

.ai-task-empty-text {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 500;
}

.ai-task-empty-hint {
  font-size: 0.8rem;
  color: #64748b;
}

.ai-task-status {
  display: flex;
  align-items: center;
}

/* 按钮上的任务进度小标签 */
.task-badge {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
}

.task-badge.running {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  animation: task-pulse 1.5s ease-in-out infinite;
}

@keyframes task-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
