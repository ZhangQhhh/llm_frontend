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
        
        <el-button type="primary" @click="startPractice" :disabled="!selectedPaperId || examStarted" :loading="starting" size="default">
          开始作答
        </el-button>
        
        <el-button type="success" @click="randomPracticeVisible = true" :disabled="examStarted" size="default">
          <el-icon><Reading /></el-icon>
          随机练习
        </el-button>
        
        <el-button type="warning" @click="openWrongBook" :disabled="examStarted" size="default">
          <el-icon><Collection /></el-icon>
          错题本
          <el-badge v-if="wrongBookTotal > 0" :value="wrongBookTotal" :max="99" class="wrong-badge" />
        </el-button>
        
        <div class="time">
          <span class="muted">倒计时：</span>
          <span class="pill">{{ timerDisplay }}</span>
        </div>
        
        <div class="user-actions">
          <span class="user-name">{{ username }}</span>
        </div>
      </div>
    </div>

    <!-- 考试通知面板 -->
    <div v-if="publishedExams.length > 0 && !examStarted" class="notification-panel">
      <div class="notification-header">
        <el-icon class="notification-icon"><Bell /></el-icon>
        <span>考试通知</span>
        <el-button size="small" text @click="loadPublishedExams" :loading="loadingExamNotifications">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <div class="notification-list">
        <div
          v-for="exam in publishedExams"
          :key="exam.exam_id"
          class="notification-item"
          :class="{ active: getExamStatus(exam) === 'active', pending: getExamStatus(exam) === 'pending' }"
        >
          <div class="exam-info">
            <div class="exam-name">{{ exam.exam_name }}</div>
            <div class="exam-meta">
              <span>试卷：{{ exam.paper_title }}</span>
              <span class="divider">|</span>
              <span>时长：{{ exam.duration_min }}分钟</span>
            </div>
            <div class="exam-time">
              <el-icon><Clock /></el-icon>
              {{ exam.start_time }} ~ {{ exam.end_time }}
            </div>
            <div class="exam-desc" v-if="exam.description">{{ exam.description }}</div>
          </div>
          <div class="exam-action">
            <el-tag v-if="getExamStatus(exam) === 'pending'" type="warning" effect="plain">未开始</el-tag>
            <el-tag v-else-if="getExamStatus(exam) === 'ended'" type="info" effect="plain">已结束</el-tag>
            <el-button
              v-else-if="getExamStatus(exam) === 'active'"
              type="primary"
              @click="enterPublishedExam(exam)"
              :loading="enteringExam === exam.exam_id"
            >
              进入考试
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="wrap">
      <!-- 左侧导航 -->
      <div class="side card" v-if="examStarted && questions.length > 0">
        <h3>题目导航</h3>
        <!-- 单选题导航 -->
        <div v-if="singleQuestions.length > 0" class="nav-section">
          <div class="nav-section-title">
            <span class="nav-type-tag single">单选</span>
            <span class="nav-count">{{ singleQuestions.length }}题</span>
          </div>
          <div class="navgrid">
            <button
              v-for="(q, idx) in singleQuestions"
              :key="q.qid"
              :class="['navbtn', { answered: isAnswered(q.qid), current: currentQid === q.qid }]"
              @click="scrollToQuestion(q.qid)"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>
        <!-- 多选题导航 -->
        <div v-if="multiQuestions.length > 0" class="nav-section">
          <div class="nav-section-title">
            <span class="nav-type-tag multi">多选</span>
            <span class="nav-count">{{ multiQuestions.length }}题</span>
          </div>
          <div class="navgrid">
            <button
              v-for="(q, idx) in multiQuestions"
              :key="q.qid"
              :class="['navbtn', { answered: isAnswered(q.qid), current: currentQid === q.qid }]"
              @click="scrollToQuestion(q.qid)"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>
        <!-- 不定项选择题导航 -->
        <div v-if="indeterminateQuestions.length > 0" class="nav-section">
          <div class="nav-section-title">
            <span class="nav-type-tag indeterminate">不定项</span>
            <span class="nav-count">{{ indeterminateQuestions.length }}题</span>
          </div>
          <div class="navgrid">
            <button
              v-for="(q, idx) in indeterminateQuestions"
              :key="q.qid"
              :class="['navbtn', { answered: isAnswered(q.qid), current: currentQid === q.qid }]"
              @click="scrollToQuestion(q.qid)"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>
        <div class="nav-summary" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(96, 165, 250, 0.2);">
          <span class="muted">共 {{ questions.length }} 题，已答 {{ answeredCount }} 题</span>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main">

        <!-- 头部信息 -->
        <div class="card head">
          <h2>{{ paperTitle }}</h2>
          <div class="sub" v-if="examStarted && questions.length > 0">
            <span class="head-stat" v-if="singleQuestions.length > 0">
              <span class="stat-label">单选</span>
              <span class="stat-value">{{ singleQuestions.length }}题</span>
            </span>
            <span class="head-divider" v-if="singleQuestions.length > 0 && (multiQuestions.length > 0 || indeterminateQuestions.length > 0)">|</span>
            <span class="head-stat" v-if="multiQuestions.length > 0">
              <span class="stat-label">多选</span>
              <span class="stat-value">{{ multiQuestions.length }}题</span>
            </span>
            <span class="head-divider" v-if="multiQuestions.length > 0 && indeterminateQuestions.length > 0">|</span>
            <span class="head-stat" v-if="indeterminateQuestions.length > 0">
              <span class="stat-label">不定项</span>
              <span class="stat-value">{{ indeterminateQuestions.length }}题</span>
            </span>
            <span class="head-divider">|</span>
            <span class="head-stat">
              <span class="stat-label">共</span>
              <span class="stat-value">{{ questions.length }}题</span>
            </span>
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
          <!-- 单选题区域 -->
          <div v-if="singleQuestions.length > 0" class="question-section">
            <div class="section-header">
              <span class="section-tag single">一、单选题</span>
              <span class="section-count">共 {{ singleQuestions.length }} 题</span>
            </div>
            <div v-for="(q, idx) in singleQuestions" :key="q.qid" :id="'q-' + q.qid" class="q">
              <div class="qheader">
                <b><span>{{ idx + 1 }}. </span><span v-html="formatText(q.stem)"></span></b>
                <span class="tag single">单选</span>
              </div>
              <!-- 题干图片 -->
              <div v-if="q.stem_images && q.stem_images.length > 0" class="stem-images">
                <img
                  v-for="(img, imgIdx) in q.stem_images"
                  :key="imgIdx"
                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                  class="q-image"
                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                />
              </div>
              <div class="opts">
                <div v-for="opt in q.options" :key="opt.label" class="opt-wrapper">
                  <button
                    :class="['opt', { active: answersState[q.qid] === opt.label }]"
                    @click="selectSingleOption(q.qid, opt.label)"
                    :disabled="submitted"
                  >
                    <span>{{ opt.label }}. </span><span v-html="formatText(opt.text)"></span>
                  </button>
                  <!-- 选项图片（在按钮外部，可点击预览） -->
                  <div v-if="getOptionImages(q, opt.label).length > 0" class="opt-images-outer">
                    <img
                      v-for="(img, imgIdx) in getOptionImages(q, opt.label)"
                      :key="imgIdx"
                      :src="'data:' + img.content_type + ';base64,' + img.base64"
                      class="opt-image"
                      @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 多选题区域 -->
          <div v-if="multiQuestions.length > 0" class="question-section">
            <div class="section-header">
              <span class="section-tag multi">{{ singleQuestions.length > 0 ? '二' : '一' }}、多选题</span>
              <span class="section-count">共 {{ multiQuestions.length }} 题</span>
            </div>
            <div v-for="(q, idx) in multiQuestions" :key="q.qid" :id="'q-' + q.qid" class="q">
              <div class="qheader">
                <b><span>{{ idx + 1 }}. </span><span v-html="formatText(q.stem)"></span></b>
                <span class="tag multi">多选</span>
              </div>
              <!-- 题干图片 -->
              <div v-if="q.stem_images && q.stem_images.length > 0" class="stem-images">
                <img
                  v-for="(img, imgIdx) in q.stem_images"
                  :key="imgIdx"
                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                  class="q-image"
                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                />
              </div>
              <div class="opts">
                <div v-for="opt in q.options" :key="opt.label" class="opt-wrapper">
                  <button
                    :class="['opt', { active: answersState[q.qid]?.includes(opt.label) }]"
                    @click="toggleMultiOption(q.qid, opt.label)"
                    :disabled="submitted"
                  >
                    <span>{{ opt.label }}. </span><span v-html="formatText(opt.text)"></span>
                  </button>
                  <!-- 选项图片（在按钮外部，可点击预览） -->
                  <div v-if="getOptionImages(q, opt.label).length > 0" class="opt-images-outer">
                    <img
                      v-for="(img, imgIdx) in getOptionImages(q, opt.label)"
                      :key="imgIdx"
                      :src="'data:' + img.content_type + ';base64,' + img.base64"
                      class="opt-image"
                      @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 不定项选择题区域 -->
          <div v-if="indeterminateQuestions.length > 0" class="question-section">
            <div class="section-header">
              <span class="section-tag indeterminate">{{ (singleQuestions.length > 0 ? 1 : 0) + (multiQuestions.length > 0 ? 1 : 0) === 2 ? '三' : ((singleQuestions.length > 0 || multiQuestions.length > 0) ? '二' : '一') }}、不定项选择题</span>
              <span class="section-count">共 {{ indeterminateQuestions.length }} 题</span>
            </div>
            <div v-for="(q, idx) in indeterminateQuestions" :key="q.qid" :id="'q-' + q.qid" class="q">
              <div class="qheader">
                <b><span>{{ idx + 1 }}. </span><span v-html="formatText(q.stem)"></span></b>
                <span class="tag indeterminate">不定项</span>
              </div>
              <!-- 题干图片 -->
              <div v-if="q.stem_images && q.stem_images.length > 0" class="stem-images">
                <img
                  v-for="(img, imgIdx) in q.stem_images"
                  :key="imgIdx"
                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                  class="q-image"
                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                />
              </div>
              <div class="opts">
                <div v-for="opt in q.options" :key="opt.label" class="opt-wrapper">
                  <button
                    :class="['opt', { active: answersState[q.qid]?.includes(opt.label) }]"
                    @click="toggleMultiOption(q.qid, opt.label)"
                    :disabled="submitted"
                  >
                    <span>{{ opt.label }}. </span><span v-html="formatText(opt.text)"></span>
                  </button>
                  <!-- 选项图片（在按钮外部，可点击预览） -->
                  <div v-if="getOptionImages(q, opt.label).length > 0" class="opt-images-outer">
                    <img
                      v-for="(img, imgIdx) in getOptionImages(q, opt.label)"
                      :key="imgIdx"
                      :src="'data:' + img.content_type + ';base64,' + img.base64"
                      class="opt-image"
                      @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="card footact" v-if="examStarted">
          <el-button type="primary" size="large" @click="submitExam" :disabled="submitted" :loading="submitting">
            交卷并评分
          </el-button>
          <span class="muted">{{ submitMessage }}</span>
          <span class="auto-save-status" v-if="!submitted">
            <span v-if="savingProgress" class="saving">💾 保存中...</span>
            <span v-else-if="lastSaveTime" class="saved">✓ 已自动保存 {{ lastSaveTime }}</span>
          </span>
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
            <el-button 
              type="danger" 
              @click="saveToWrongBook" 
              :loading="savingToWrongBook"
              :disabled="wrongQuestions.length === 0"
            >
              <el-icon><Collection /></el-icon>
              收录到错题本（{{ wrongQuestions.length }}题）
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
              <!-- 题干图片 -->
              <div v-if="item.stem_images && item.stem_images.length > 0" class="stem-images">
                <img
                  v-for="(img, imgIdx) in item.stem_images"
                  :key="imgIdx"
                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                  class="q-image"
                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                />
              </div>
              <div class="muted" style="margin: 8px 0">
                标准答案：{{ item.correct_labels.join('') }}
                ｜ 我的作答：{{ item.my_labels?.join('') || '(未作答)' }}
                ｜ 判定：{{ item.is_correct ? '正确' : '错误' }}
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
                  <!-- 选项图片 -->
                  <span v-if="getReviewOptionImages(item, opt.label).length > 0" class="opt-images">
                    <img
                      v-for="(img, imgIdx) in getReviewOptionImages(item, opt.label)"
                      :key="imgIdx"
                      :src="'data:' + img.content_type + ';base64,' + img.base64"
                      class="opt-image"
                      @click.stop="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                    />
                  </span>
                </button>
              </div>
              <!-- 解析区域：复杂验证策略显示Tab切换 -->
              <div class="analysis" @mouseenter="isComplexValidation(item.analysis) && loadPerOption(item.qid)">
                <template v-if="isComplexValidation(item.analysis)">
                  <div class="analysis-tab-bar">
                    <el-radio-group
                      v-model="analysisActiveTab[idx]"
                      size="small"
                      @change="() => { if (!analysisActiveTab[idx]) analysisActiveTab[idx] = 'all'; loadPerOption(item.qid) }"
                    >
                      <el-radio-button label="all">全部</el-radio-button>
                      <el-radio-button
                        v-for="opt in item.options"
                        :key="opt.label"
                        :label="opt.label"
                      >
                        选项 {{ opt.label }}
                      </el-radio-button>
                    </el-radio-group>
                  </div>
                  <div v-html="formatAnalysis(getAnalysisForTab(item.qid, item.analysis, analysisActiveTab[idx] || 'all')) || '（无解析）'"></div>
                </template>
                <template v-else>
                  <div v-html="formatAnalysis(item.analysis) || '（无解析）'"></div>
                </template>
                <!-- 解析图片 -->
                <div v-if="item.analysis_images && item.analysis_images.length > 0" class="analysis-images">
                  <img
                    v-for="(img, imgIdx) in item.analysis_images"
                    :key="imgIdx"
                    :src="'data:' + img.content_type + ';base64,' + img.base64"
                    class="q-image"
                    style="max-height: 200px;"
                    @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewImageVisible" title="图片预览" width="auto" :close-on-click-modal="true">
      <div style="text-align: center;">
        <img :src="previewImageUrl" style="max-width: 90vw; max-height: 80vh;" />
      </div>
    </el-dialog>

    <!-- 防作弊警告对话框 -->
    <el-dialog
      v-model="switchWarningVisible"
      title="⚠️ 切屏警告"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <p style="font-size: 16px; color: #f56c6c; font-weight: bold; margin-bottom: 12px;">
          检测到您离开了考试页面！
        </p>
        <p style="font-size: 14px; color: #606266; margin-bottom: 8px;">
          当前已切屏 <span style="color: #f56c6c; font-weight: bold;">{{ switchCount }}</span> 次，
          最多允许 <span style="font-weight: bold;">{{ maxSwitchCount }}</span> 次
        </p>
        <p style="font-size: 13px; color: #909399;">
          再切屏 {{ maxSwitchCount - switchCount }} 次系统将自动提交试卷
        </p>
      </div>
      <template #footer>
        <el-button type="primary" @click="closeSwitchWarning" style="width: 100%;">
          我知道了，继续作答
        </el-button>
      </template>
    </el-dialog>

    <!-- 考试中切屏次数显示 -->
    <div v-if="examStarted && !submitted && switchCount > 0" class="switch-count-badge">
      ⚠️ 已切屏 {{ switchCount }}/{{ maxSwitchCount }} 次
    </div>

    <!-- 随机练习对话框 -->
    <el-dialog
      v-model="randomPracticeVisible"
      title="🎲 随机练习"
      width="500px"
      :close-on-click-modal="true"
    >
      <div class="random-practice-dialog">
        <div class="practice-config-dialog">
          <div class="config-row-dialog">
            <div class="config-item-dialog">
              <label>单选题数量</label>
              <el-input-number v-model="practiceConfig.singleCount" :min="0" :max="50" size="default" />
            </div>
            <div class="config-item-dialog">
              <label>多选题数量</label>
              <el-input-number v-model="practiceConfig.multiCount" :min="0" :max="50" size="default" />
            </div>
          </div>
          <div class="config-row-dialog">
            <div class="config-item-dialog">
              <label>不定项数量</label>
              <el-input-number v-model="practiceConfig.indeterminateCount" :min="0" :max="50" size="default" />
            </div>
            <div class="config-item-dialog">
              <label>练习时长（分钟）</label>
              <el-input-number v-model="practiceConfig.duration" :min="5" :max="180" size="default" />
            </div>
          </div>
          <div class="config-summary-dialog">
            <span>共 <b>{{ practiceTotalCount }}</b> 题，预计 <b>{{ practiceConfig.duration }}</b> 分钟</span>
          </div>
        </div>
        <div class="practice-tips-dialog">
          <el-icon><InfoFilled /></el-icon>
          <span>随机练习模式将从题库中随机抽取指定数量的题目，练习结果不计入正式成绩。</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="randomPracticeVisible = false">取消</el-button>
        <el-button 
          type="success" 
          @click="startRandomPracticeFromDialog" 
          :disabled="practiceTotalCount === 0"
          :loading="startingPractice"
        >
          <el-icon><CaretRight /></el-icon>
          开始练习
        </el-button>
      </template>
    </el-dialog>

    <!-- 错题本对话框 -->
    <el-dialog
      v-model="wrongBookVisible"
      title="📚 我的错题本"
      width="900px"
      :close-on-click-modal="true"
    >
      <div class="wrong-book-dialog">
        <div v-if="loadingWrongBook" class="loading-wrap">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <div v-else-if="wrongBook.length === 0" class="empty-wrap">
          <el-empty description="错题本为空" />
        </div>
        <div v-else class="wrong-list">
          <div v-for="(q, idx) in wrongBook" :key="q.qid" class="wrong-item">
            <div class="wrong-header">
              <span class="wrong-num">{{ idx + 1 }}</span>
              <span class="wrong-stem" v-html="formatText(q.stem)"></span>
              <el-tag size="small" :type="q.qtype === 'multi' ? 'danger' : 'primary'">
                {{ q.qtype === 'multi' ? '多选' : (q.qtype === 'indeterminate' ? '不定项' : '单选') }}
              </el-tag>
              <el-button 
                size="small" 
                type="success" 
                text
                @click="removeFromWrongBook([q.qid])"
                title="已掌握，从错题本移除"
              >
                <el-icon><Delete /></el-icon>
                已掌握
              </el-button>
            </div>
            <!-- 题干图片 -->
            <div v-if="q.stem_images && q.stem_images.length > 0" class="wrong-images">
              <img
                v-for="(img, imgIdx) in q.stem_images"
                :key="'stem-' + imgIdx"
                :src="'data:' + img.content_type + ';base64,' + img.base64"
                class="wrong-img"
                @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
              />
            </div>
            <div class="wrong-options">
              <div v-for="opt in q.options" :key="opt.label" class="wrong-opt">
                <span :class="{ 'correct-label': q.answer.includes(opt.label), 'my-wrong': q.my_answer?.includes(opt.label) && !q.answer.includes(opt.label) }">
                  {{ opt.label }}. {{ opt.text }}
                </span>
                <!-- 选项图片 -->
                <div v-if="q.option_images && q.option_images[opt.label] && q.option_images[opt.label].length > 0" class="opt-images">
                  <img
                    v-for="(img, imgIdx) in q.option_images[opt.label]"
                    :key="'opt-' + opt.label + '-' + imgIdx"
                    :src="'data:' + img.content_type + ';base64,' + img.base64"
                    class="wrong-img small"
                    @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                  />
                </div>
              </div>
            </div>
            <div class="wrong-answer-info">
              <span class="correct-answer">正确答案：{{ q.answer }}</span>
              <span class="my-answer">我的答案：{{ q.my_answer?.join('') || '未作答' }}</span>
              <span class="review-info" v-if="q.review_count > 0">已复习 {{ q.review_count }} 次</span>
            </div>
            <div v-if="q.explain" class="wrong-explain">
              <div class="explain-label">解析：</div>
              <div v-html="formatAnalysis(q.explain)"></div>
              <!-- 解析图片 -->
              <div v-if="q.analysis_images && q.analysis_images.length > 0" class="wrong-images">
                <img
                  v-for="(img, imgIdx) in q.analysis_images"
                  :key="'analysis-' + imgIdx"
                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                  class="wrong-img"
                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="wrong-book-footer">
          <span class="wrong-total">共 {{ wrongBook.length }} 道错题</span>
          <el-button @click="wrongBookVisible = false">关闭</el-button>
          <el-button type="warning" @click="startWrongBookPractice" :loading="startingPractice" :disabled="wrongBook.length === 0">
            开始错题练习
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Refresh, Clock, Reading, CaretRight, InfoFilled, Collection, View, Delete, Loading } from '@element-plus/icons-vue'
import { MCQ_BASE_URL } from '@/config/api/api'
import { renderMarkdown } from '@/utils/markdown'

// API endpoints matching mcq_public_routes.py
const API_ENDPOINTS = {
  PAPERS: {
    LIST_OPEN: `${MCQ_BASE_URL}/papers/list_open`,
    VIEW: `${MCQ_BASE_URL}/papers/view`
  },
  BANK: {
    LIST: `${MCQ_BASE_URL}/bank/list`,
    SAVE_PAPER: `${MCQ_BASE_URL}/bank/save_paper`
  },
  EXAM: {
    START: `${MCQ_BASE_URL}/exam/start`,
    START_TEMP: `${MCQ_BASE_URL}/exam/start_temp`,  // 临时练习（不生成试卷文件）
    SUBMIT: `${MCQ_BASE_URL}/exam/submit`,
    REVIEW: `${MCQ_BASE_URL}/exam/review`,
    PROGRESS: `${MCQ_BASE_URL}/exam/progress`,
    SAVE_PROGRESS: `${MCQ_BASE_URL}/exam/save_progress`,
    ABANDON_PROGRESS: `${MCQ_BASE_URL}/exam/abandon_progress`,
    NOTIFICATIONS: `${MCQ_BASE_URL}/exam/notifications`
  },
  STUDENT: {
    EXPORT_MY_REPORT_DOCX: `${MCQ_BASE_URL}/student/export_my_report_docx`,
    EXPORT_WRONG_REPORT_DOCX: `${MCQ_BASE_URL}/student/export_wrong_report_docx`
  },
  WRONG_QUESTIONS: {
    ADD: `${MCQ_BASE_URL}/wrong_questions/add`,
    LIST: `${MCQ_BASE_URL}/wrong_questions/list`,
    REMOVE: `${MCQ_BASE_URL}/wrong_questions/remove`,
    MARK_REVIEWED: `${MCQ_BASE_URL}/wrong_questions/mark_reviewed`,
    CLEAR: `${MCQ_BASE_URL}/wrong_questions/clear`
  },
  AUTH: {
    CHANGE_PASSWORD: '/api/auth/change_password'
  }
}

interface ImageData {
  base64: string
  content_type: string
  filename?: string
}

interface Question {
  qid: string
  stem: string
  qtype: string
  options: Array<{ label: string; text: string; images?: ImageData[] }>
  stem_images?: ImageData[]
  option_images?: Record<string, ImageData[]>
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
  analysis_images?: ImageData[]
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
    const isPracticeMode = ref(true)  // 是否为练习模式（默认是练习）

    // 随机练习配置
    const practiceConfig = reactive({
      singleCount: 10,
      multiCount: 5,
      indeterminateCount: 0,
      duration: 30
    })
    const startingPractice = ref(false)
    const practiceTotalCount = computed(() => {
      return practiceConfig.singleCount + practiceConfig.multiCount + practiceConfig.indeterminateCount
    })

    // 答题相关
    const answersState = ref<Record<string, any>>({})
    const currentPage = ref(1)
    const pageSize = ref(3)
    
    // 自动保存相关
    const autoSaveHandle = ref<number | null>(null)
    const debounceSaveHandle = ref<number | null>(null)
    const lastSaveTime = ref('')
    const savingProgress = ref(false)
    const lastSavedAnswersHash = ref('')  // 用于检测答案是否真正变化

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

    // ======= 防作弊相关 =======
    const switchCount = ref(0)  // 切屏次数
    const maxSwitchCount = 3    // 最大允许切屏次数
    const switchWarningVisible = ref(false)  // 警告弹窗
    const lastSwitchTime = ref('')  // 最后一次切屏时间
    const switchLogs = ref<Array<{time: string, type: string}>>([])  // 切屏记录
    const lastSwitchTimestamp = ref(0)  // 用于防抖，避免重复计数
    const blurTimeoutId = ref<number | null>(null)  // blur 延迟检测定时器

    // ======= 错题本相关 =======
    const wrongBook = ref<any[]>([])  // 错题本列表
    const wrongBookTotal = ref(0)  // 错题本总数
    const wrongBookVisible = ref(false)  // 错题本弹窗
    const loadingWrongBook = ref(false)  // 加载中
    const savingToWrongBook = ref(false)  // 保存中
    const randomPracticeVisible = ref(false)  // 随机练习弹窗

    // 解析Tab切换状态（复杂验证策略时可切换查看单个选项）
    const analysisActiveTab = reactive<Record<number, string>>({})
    // 分选项解析缓存（从后端获取）
    const perOptionMap = reactive<Record<string, Array<{label: string, explain: string}>>>({})
    const perOptionLoading = reactive<Record<string, boolean>>({})
    const perOptionLoaded = reactive<Record<string, boolean>>({})

    // 判断解析是否为复杂验证策略（通过文本标识判断）
    const isComplexValidation = (analysis: string): boolean => {
      return !!(analysis && analysis.includes('【复杂验证（逐选项核查·汇总）】'))
    }

    // 加载分选项解析数据
    const loadPerOption = async (qid: string) => {
      if (!qid || perOptionLoaded[qid] || perOptionLoading[qid]) return
      perOptionLoading[qid] = true
      try {
        const url = `${MCQ_BASE_URL}/bank/sources?qid=${encodeURIComponent(qid)}`
        const res = await fetch(url, { method: 'GET' })
        if (res.ok) {
          const j = await res.json()
          if (j && j.ok !== false) {
            const perOpt = j.per_option || []
            perOptionMap[qid] = Array.isArray(perOpt) ? perOpt : []
          }
        }
        perOptionLoaded[qid] = true
      } catch (e) {
        console.warn('加载per_option失败:', e)
      } finally {
        perOptionLoading[qid] = false
      }
    }

    // 解析复杂验证的分项解析内容（回退方案）
    const parseOptionAnalyses = (analysis: string): Record<string, string> => {
      const result: Record<string, string> = {}
      if (!analysis) return result
      
      // 查找"分项解析："之后的内容
      const marker = '分项解析：'
      const markerIdx = analysis.indexOf(marker)
      if (markerIdx === -1) return result
      
      const afterMarker = analysis.substring(markerIdx + marker.length)
      
      // 匹配 "A. xxx" 格式，直到下一个选项或特定结束标记
      const optionPattern = /([A-H])[.、]\s*([\s\S]*?)(?=(?:\n[A-H][.、])|(?:\n\n说明：)|(?:\n【)|$)/g
      let match
      while ((match = optionPattern.exec(afterMarker)) !== null) {
        const label = match[1].toUpperCase()
        const content = match[2].trim()
        if (content) {
          result[label] = content
        }
      }
      
      return result
    }

    // 获取指定Tab对应的解析内容（优先使用后端per_option数据）
    const getAnalysisForTab = (qid: string, analysis: string, tab: string): string => {
      if (!analysis) return ''
      if (tab === 'all') return analysis
      
      // 优先使用后端返回的per_option数据
      const perOpts = perOptionMap[qid]
      if (perOpts && perOpts.length > 0) {
        const opt = perOpts.find(o => o.label === tab)
        if (opt && opt.explain) {
          return opt.explain
        }
      }
      
      // 回退：使用正则解析（兼容旧数据）
      const optionAnalyses = parseOptionAnalyses(analysis)
      return optionAnalyses[tab] || '（无该选项解析）'
    }

    // 图片预览
    const previewImageVisible = ref(false)
    const previewImageUrl = ref('')
    const previewImage = (url: string) => {
      previewImageUrl.value = url
      previewImageVisible.value = true
    }

    // 获取选项图片（兼容两种数据格式）
    const getOptionImages = (q: Question, label: string): ImageData[] => {
      // 方式1: option_images 对象格式
      if (q.option_images && q.option_images[label]) {
        return q.option_images[label]
      }
      // 方式2: options 数组中的 images 字段
      if (Array.isArray(q.options)) {
        const opt = q.options.find(o => o.label === label)
        if (opt && opt.images) {
          return opt.images
        }
      }
      return []
    }

    // 获取解析区域的选项图片（用于ReviewItem）
    const getReviewOptionImages = (item: ReviewItem, label: string): ImageData[] => {
      // 方式1: option_images 对象格式
      if (item.option_images && item.option_images[label]) {
        return item.option_images[label]
      }
      // 方式2: options 数组中的 images 字段
      if (Array.isArray(item.options)) {
        const opt = item.options.find(o => o.label === label)
        if (opt && opt.images) {
          return opt.images
        }
      }
      return []
    }

    // 考试通知相关
    const publishedExams = ref<any[]>([])
    const loadingExamNotifications = ref(false)
    const enteringExam = ref('')

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

    // 单选题列表
    const singleQuestions = computed(() => {
      return questions.value.filter(q => q.qtype === 'single')
    })

    // 多选题列表
    const multiQuestions = computed(() => {
      return questions.value.filter(q => q.qtype === 'multi')
    })

    // 不定项选择题列表
    const indeterminateQuestions = computed(() => {
      return questions.value.filter(q => q.qtype === 'indeterminate')
    })

    // 已答题目数
    const answeredCount = computed(() => {
      let count = 0
      questions.value.forEach(q => {
        if (isAnswered(q.qid)) count++
      })
      return count
    })

    // 当前高亮的题目ID
    const currentQid = ref('')

    // 滚动到指定题目
    const scrollToQuestion = (qid: string) => {
      currentQid.value = qid
      const element = document.getElementById('q-' + qid)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // 添加高亮效果
        element.classList.add('highlight-question')
        setTimeout(() => {
          element.classList.remove('highlight-question')
        }, 1500)
      }
    }

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

    // 规范化选项格式：将 dict 格式转为 list 格式
    const normalizeOptions = (options: any): Array<{label: string, text: string}> => {
      if (!options) return []
      if (Array.isArray(options)) {
        // 已经是 list 格式
        return options
      }
      if (typeof options === 'object') {
        // dict 格式 {"A": "text", "B": "text"} 转为 list 格式
        return Object.keys(options).sort().map(k => ({ label: k, text: options[k] }))
      }
      return []
    }

    // 规范化题目数据（确保 options 为 list 格式）
    const normalizeQuestions = (items: any[]): any[] => {
      return items.map(q => ({
        ...q,
        options: normalizeOptions(q.options)
      }))
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

    // 格式化解析文本：渲染 markdown 并过滤"参考来源"和进度提示
    const formatAnalysis = (text: string | undefined | null): string => {
      if (!text) return ''
      // 带选项字母的进度提示替换为选项分隔标记
      const replaceProgressWithLabel = (_: string, letter: string) => `【选项${letter.toUpperCase()}分析】`
      // 过滤掉"参考来源"（可能被加粗）
      let cleaned = text
        .replace(/\*{0,2}参考来源\*{0,2}[：:\s]*/g, '')
        // 将带选项字母的进度提示替换为选项分隔标记
        .replace(/^([A-Ha-h])[.)、]?\s*正在进行混合检索[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*已找到相关资料[，,]正在生成回答[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*未找到高相关性资料[，,]基于通用知识回答[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*正在使用精准检索分析[.…]*\s*$/gm, replaceProgressWithLabel)
        // 移除不带选项字母的通用进度提示（支持行内任意位置）
        .replace(/正在进行混合检索[.…]*\s*/g, '')
        .replace(/已找到相关资料[，,]正在生成回答[.…]*\s*/g, '')
        .replace(/未找到高相关性资料[，,]基于通用知识回答[.…]*\s*/g, '')
        .replace(/正在使用精准检索分析[.…]*\s*/g, '')
        // 清理残留的孤立 ** 符号
        .replace(/^\s*\*\*\s*$/gm, '')
        .replace(/\*\*(?=\s*$)/gm, '')
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
      // 答案变化后触发防抖保存
      debounceSave()
    }

    const selectSingleOption = (qid: string, label: string) => {
      if (submitted.value) return
      answersState.value[qid] = label
      // 答案变化后触发防抖保存
      debounceSave()
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

    // 收集当前答案用于保存
    const collectAnswersForSave = () => {
      const answers: Array<{ qid: string; chosen_labels: string[] }> = []
      questions.value.forEach(q => {
        const answer = answersState.value[q.qid]
        let labels: string[] = []
        if (q.qtype === 'multi' || q.qtype === 'indeterminate') {
          labels = Array.isArray(answer) ? answer : []
        } else {
          labels = answer ? [answer] : []
        }
        // 保存所有答案，包括空的
        answers.push({ qid: q.qid, chosen_labels: labels })
      })
      return answers
    }

    // 保存答题进度到后端
    const saveProgress = async (force = false) => {
      if (!attemptId.value || submitted.value || savingProgress.value) return
      
      const answers = collectAnswersForSave()
      // 计算答案hash，避免重复保存相同内容
      const currentHash = JSON.stringify(answers)
      if (!force && currentHash === lastSavedAnswersHash.value) {
        return  // 答案没有变化，跳过保存
      }
      
      savingProgress.value = true
      try {
        const data = await mcqFetch(API_ENDPOINTS.EXAM.SAVE_PROGRESS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attemptId.value,
            answers,
            switch_count: switchCount.value  // 同时保存切屏次数
          })
        })
        
        if (data.ok) {
          lastSavedAnswersHash.value = currentHash
          lastSaveTime.value = new Date().toLocaleTimeString()
          // 如果返回超时信息，触发自动提交
          if (data.timeout) {
            ElMessage.warning('考试已超时，正在自动提交...')
            submitExam(true)
          }
        }
      } catch (error: any) {
        console.error('保存进度失败:', error)
      } finally {
        savingProgress.value = false
      }
    }

    // 启动自动保存定时器（每30秒保存一次）
    const startAutoSave = () => {
      if (autoSaveHandle.value) clearInterval(autoSaveHandle.value)
      autoSaveHandle.value = window.setInterval(() => {
        saveProgress()
      }, 30000)  // 30秒保存一次
    }

    // 停止自动保存
    const stopAutoSave = () => {
      if (autoSaveHandle.value) {
        clearInterval(autoSaveHandle.value)
        autoSaveHandle.value = null
      }
      if (debounceSaveHandle.value) {
        clearTimeout(debounceSaveHandle.value)
        debounceSaveHandle.value = null
      }
    }

    // 防抖保存（答案变化后3秒保存）
    const debounceSave = () => {
      if (debounceSaveHandle.value) {
        clearTimeout(debounceSaveHandle.value)
      }
      debounceSaveHandle.value = window.setTimeout(() => {
        saveProgress()
      }, 3000)  // 3秒防抖，连续答题时不会频繁触发
    }

    // 检查是否有未完成的考试
    const checkInProgressExam = async () => {
      const studentId = store.state.user.username
      // 未登录用户不检查进度（避免 anonymous 用户互相恢复进度）
      if (!studentId) {
        return
      }
      try {
        const url = `${API_ENDPOINTS.EXAM.PROGRESS}?student_id=${encodeURIComponent(studentId)}`
        const data = await mcqFetch(url)
        
        if (data.ok && data.has_progress) {
          // 找到未完成的考试，询问是否恢复
          try {
            await ElMessageBox.confirm(
              `您有一个未完成的考试「${data.title}」，剩余时间 ${Math.floor(data.left_sec / 60)} 分钟。是否继续答题？`,
              '发现未完成的考试',
              {
                confirmButtonText: '继续答题',
                cancelButtonText: '放弃并重新开始',
                type: 'warning'
              }
            )
            // 用户选择恢复考试
            resumeExam(data)
          } catch {
            // 用户选择放弃，调用后端 API 清除进度
            try {
              await mcqFetch(API_ENDPOINTS.EXAM.ABANDON_PROGRESS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  student_id: studentId,
                  attempt_id: data.attempt_id
                })
              })
            } catch (e) {
              console.error('放弃进度失败:', e)
            }
          }
        }
      } catch (error: any) {
        console.error('检查未完成考试失败:', error)
      }
    }

    // 恢复考试
    const resumeExam = (progressData: any) => {
      attemptId.value = progressData.attempt_id
      leftSeconds.value = progressData.left_sec
      questions.value = progressData.items || []
      paperTitle.value = progressData.title || '试卷'
      selectedPaperId.value = progressData.paper_id
      
      // 恢复已保存的答案
      const newAnswersState: Record<string, any> = {}
      questions.value.forEach(q => {
        const saved = progressData.saved_answers?.[q.qid]
        if (q.qtype === 'multi' || q.qtype === 'indeterminate') {
          newAnswersState[q.qid] = saved || []
        } else {
          newAnswersState[q.qid] = saved?.[0] || ''
        }
      })
      answersState.value = newAnswersState
      
      // 恢复切屏次数（防作弊）
      switchCount.value = progressData.switch_count || 0
      lastSwitchTimestamp.value = 0
      switchLogs.value = []
      switchWarningVisible.value = false
      
      examStarted.value = true
      currentPage.value = 1
      submitted.value = false
      gradeReport.value = null
      reviewData.value = null
      
      // 启动倒计时和自动保存
      startTimer()
      startAutoSave()
      
      const resumeMsg = progressData.switch_count > 0 
        ? `已恢复考试进度（已切屏 ${progressData.switch_count} 次）`
        : '已恢复考试进度'
      ElMessage.success(resumeMsg)
    }

    // 使用 sendBeacon 保存进度（用于页面卸载时确保数据不丢失）
    const saveProgressWithBeacon = () => {
      if (!attemptId.value || submitted.value) return
      
      const answers = collectAnswersForSave()
      const data = JSON.stringify({
        attempt_id: attemptId.value,
        answers,
        switch_count: switchCount.value
      })
      
      // sendBeacon 确保页面卸载时数据能被发送
      const url = API_ENDPOINTS.EXAM.SAVE_PROGRESS
      navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }))
    }

    // 页面关闭前警告
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStarted.value && !submitted.value) {
        // 记录切屏并保存
        handleSwitchDetected('关闭/刷新页面')
        saveProgressWithBeacon()
        e.preventDefault()
        e.returnValue = '考试进行中，确定要离开吗？您的答案已自动保存。'
        return e.returnValue
      }
    }

    // pagehide 事件处理（更可靠的页面卸载检测）
    const handlePageHide = () => {
      if (examStarted.value && !submitted.value) {
        saveProgressWithBeacon()
      }
    }

    // ======= 防作弊检测函数 =======
    const formatTime = () => {
      return new Date().toLocaleTimeString('zh-CN', { hour12: false })
    }

    // 统一的切屏处理函数（带防抖）
    const handleSwitchDetected = (type: string) => {
      // 只在考试进行中且未提交时检测
      if (!examStarted.value || submitted.value) return
      
      // 防抖：1秒内的多次触发只算一次
      const now = Date.now()
      if (now - lastSwitchTimestamp.value < 1000) return
      lastSwitchTimestamp.value = now
      
      const time = formatTime()
      switchCount.value++
      lastSwitchTime.value = time
      switchLogs.value.push({ time, type })
      
      // 立即使用 sendBeacon 保存切屏记录（确保页面卸载时数据不丢失）
      saveProgressWithBeacon()
      
      if (switchCount.value >= maxSwitchCount) {
        // 达到最大次数，自动提交
        ElMessage.error(`检测到第${switchCount.value}次切屏，系统将自动提交试卷！`)
        submitExam()
      } else {
        // 显示警告
        switchWarningVisible.value = true
        ElMessage.warning(`警告：检测到切屏（第${switchCount.value}/${maxSwitchCount}次），请专注作答！`)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSwitchDetected('切换标签页/最小化')
      }
    }

    const handleWindowBlur = () => {
      // 如果页面已经隐藏，不重复计数（visibilitychange已处理）
      if (document.hidden) return
      
      // 延迟检测：等待 5秒，过滤点击输入法等短暂失焦
      if (blurTimeoutId.value) {
        clearTimeout(blurTimeoutId.value)
      }
      blurTimeoutId.value = window.setTimeout(() => {
        // 5秒后仍未获得焦点，才算切屏
        if (!document.hasFocus() && !document.hidden) {
          handleSwitchDetected('切换到其他窗口')
        }
        blurTimeoutId.value = null
      }, 5000)
    }

    const handleWindowFocus = () => {
      // 窗口重新获得焦点，取消延迟检测
      if (blurTimeoutId.value) {
        clearTimeout(blurTimeoutId.value)
        blurTimeoutId.value = null
      }
    }

    // 重置防作弊状态（开始新考试时调用）
    const resetAntiCheat = () => {
      switchCount.value = 0
      lastSwitchTime.value = ''
      switchLogs.value = []
      switchWarningVisible.value = false
      lastSwitchTimestamp.value = 0
    }

    // 关闭切屏警告弹窗
    const closeSwitchWarning = () => {
      switchWarningVisible.value = false
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

    // ========== 考试通知相关函数 ==========
    const loadPublishedExams = async () => {
      loadingExamNotifications.value = true
      try {
        const data = await mcqFetch(API_ENDPOINTS.EXAM.NOTIFICATIONS)
        if (data?.ok !== false) {
          publishedExams.value = Array.isArray(data.exams) ? data.exams : []
        }
      } catch (error: any) {
        console.error('加载考试通知失败:', error)
      } finally {
        loadingExamNotifications.value = false
      }
    }

    // 获取考试状态
    const getExamStatus = (exam: any): string => {
      const now = new Date()
      const startTime = new Date(exam.start_time)
      const endTime = new Date(exam.end_time)
      if (now < startTime) return 'pending'
      if (now > endTime) return 'ended'
      return 'active'
    }

    // 进入已发布的考试（正式考试模式，不可重复进入）
    const currentExamId = ref('')  // 当前考试ID
    const enterPublishedExam = async (exam: any) => {
      enteringExam.value = exam.exam_id
      try {
        // 设置试卷和时长
        selectedPaperId.value = exam.paper_id
        durationMin.value = exam.duration_min
        
        // 设置为正式考试模式（不可重复进入，成绩计入导出）
        isPracticeMode.value = false
        currentExamId.value = exam.exam_id  // 记录考试ID
        
        // 直接开始考试
        await startExam()
      } catch (error: any) {
        ElMessage.error('进入考试失败：' + (error?.message || error))
      } finally {
        enteringExam.value = ''
      }
    }

    // 开始练习（练习模式，可重复进入，成绩不计入导出）
    const startPractice = () => {
      isPracticeMode.value = true
      currentExamId.value = ''  // 练习模式没有考试ID
      startExam()
    }

    // 开始随机练习（从题库随机抽题）
    const startRandomPractice = async () => {
      // 检查用户是否已登录
      const username = store.state.user.username
      if (!username) {
        ElMessage.warning('请先登录后再开始练习')
        return
      }

      if (practiceTotalCount.value === 0) {
        ElMessage.warning('请至少设置一种题型的数量')
        return
      }

      startingPractice.value = true
      try {
        // 1. 从题库获取所有已通过的题目（包含图片数据）
        const bankData = await mcqFetch(`${API_ENDPOINTS.BANK.LIST}?page=0&include_images=true`)
        if (!bankData.ok) {
          throw new Error(bankData.msg || '获取题库失败')
        }

        const allQuestions = bankData.items || []
        if (allQuestions.length === 0) {
          ElMessage.warning('题库中暂无可用题目')
          return
        }

        // 2. 按题型分类（只取已通过的题目）
        const approvedQuestions = allQuestions.filter((q: any) => q.status === 'approved')
        const singleQuestions = approvedQuestions.filter((q: any) => {
          const answer = (q.answer || '').toUpperCase()
          return answer.length === 1
        })
        const multiQuestions = approvedQuestions.filter((q: any) => {
          const answer = (q.answer || '').toUpperCase()
          return answer.length > 1
        })

        // 3. 随机抽取指定数量的题目
        const shuffle = (arr: any[]) => {
          const result = [...arr]
          for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[result[i], result[j]] = [result[j], result[i]]
          }
          return result
        }

        const selectedSingle = shuffle(singleQuestions).slice(0, practiceConfig.singleCount)
        const selectedMulti = shuffle(multiQuestions).slice(0, practiceConfig.multiCount)
        
        // 不定项题目：从单选和多选中各抽一部分
        const indeterminateSingleCount = Math.ceil(practiceConfig.indeterminateCount / 2)
        const indeterminateMultiCount = practiceConfig.indeterminateCount - indeterminateSingleCount
        const remainingSingle = shuffle(singleQuestions.filter((q: any) => !selectedSingle.includes(q))).slice(0, indeterminateSingleCount)
        const remainingMulti = shuffle(multiQuestions.filter((q: any) => !selectedMulti.includes(q))).slice(0, indeterminateMultiCount)
        const selectedIndeterminate = [...remainingSingle, ...remainingMulti]

        // 4. 检查是否有足够的题目
        const actualSingleCount = selectedSingle.length
        const actualMultiCount = selectedMulti.length
        const actualIndeterminateCount = selectedIndeterminate.length
        const actualTotal = actualSingleCount + actualMultiCount + actualIndeterminateCount

        if (actualTotal === 0) {
          ElMessage.warning('题库中没有足够的已通过题目')
          return
        }

        if (actualTotal < practiceTotalCount.value) {
          ElMessage.info(`题库题目不足，实际抽取 ${actualTotal} 题`)
        }

        // 5. 构建临时试卷数据（包含图片）
        const paperItems: any[] = []
        
        // 辅助函数：构建题目项（包含图片数据）
        const buildPaperItem = (q: any, qtype: string) => {
          const item: any = {
            qid: q.qid,
            stem: q.stem,
            options: q.options,
            answer: q.answer,
            explain: q.explain || '',
            qtype: qtype
          }
          // 包含图片数据
          if (q.stem_images && q.stem_images.length > 0) {
            item.stem_images = q.stem_images
          }
          if (q.option_images) {
            item.option_images = q.option_images
          }
          if (q.analysis_images && q.analysis_images.length > 0) {
            item.analysis_images = q.analysis_images
          }
          return item
        }
        
        // 添加单选题
        selectedSingle.forEach((q: any) => {
          paperItems.push(buildPaperItem(q, 'single'))
        })

        // 添加多选题
        selectedMulti.forEach((q: any) => {
          paperItems.push(buildPaperItem(q, 'multi'))
        })

        // 添加不定项题
        selectedIndeterminate.forEach((q: any) => {
          paperItems.push(buildPaperItem(q, 'indeterminate'))
        })

        // 6. 直接使用临时题目数据开始练习（不保存为试卷文件）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const practiceTitle = `随机练习_${timestamp}`
        
        const startResult = await mcqFetch(API_ENDPOINTS.EXAM.START_TEMP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: paperItems,
            duration_sec: practiceConfig.duration * 60,
            student_id: username,
            title: practiceTitle
          })
        })

        if (!startResult.ok) {
          throw new Error(startResult.detail || '开始练习失败')
        }

        // 7. 直接进入考试状态
        attemptId.value = startResult.attempt_id
        questions.value = normalizeQuestions(startResult.items || [])
        leftSeconds.value = startResult.left_sec || practiceConfig.duration * 60
        examStarted.value = true
        isPracticeMode.value = true
        currentExamId.value = ''
        
        // 初始化答案
        answersState.value = {}
        questions.value.forEach((q: any) => {
          answersState.value[q.qid] = []
        })
        
        // 启动倒计时
        startTimer()

      } catch (error: any) {
        ElMessage.error('开始随机练习失败：' + (error.message || '未知错误'))
        console.error('随机练习失败:', error)
      } finally {
        startingPractice.value = false
      }
    }

    // 从弹窗开始随机练习
    const startRandomPracticeFromDialog = async () => {
      randomPracticeVisible.value = false
      await startRandomPractice()
    }

    const startExam = async () => {
      if (!selectedPaperId.value) {
        ElMessage.warning('请选择试卷')
        return
      }
      // 检查用户是否已登录
      const username = store.state.user.username
      if (!username) {
        ElMessage.warning('请先登录后再开始考试')
        return
      }
      starting.value = true
      try {
        // 开始考试 - username 就是登录时输入的警号
        const startData = await mcqFetch(API_ENDPOINTS.EXAM.START, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paper_id: selectedPaperId.value,
            duration_sec: durationMin.value * 60,
            student_id: username,
            student_name: username,
            police_id: store.state.user.policeId || username,  // 优先使用用户设置的警号
            is_practice: isPracticeMode.value,  // 练习模式可重复进入，正式考试只能一次
            exam_id: currentExamId.value  // 发布的考试ID（正式考试时传入）
          })
        })

        if (!startData.ok) {
          throw new Error(startData.detail || '创建会话失败')
        }

        attemptId.value = startData.attempt_id
        leftSeconds.value = startData.left_sec || durationMin.value * 60

        // 直接使用 exam_start 返回的题目（已根据学生ID随机打乱顺序）
        questions.value = startData.items || []
        paperTitle.value = startData.title || '试卷'

        // 初始化答案状态
        const newAnswersState: Record<string, any> = {}
        questions.value.forEach(q => {
          // 多选题和不定项题目使用数组，单选题使用字符串
          newAnswersState[q.qid] = (q.qtype === 'multi' || q.qtype === 'indeterminate') ? [] : ''
        })
        answersState.value = newAnswersState

        examStarted.value = true
        currentPage.value = 1
        submitted.value = false
        gradeReport.value = null
        reviewData.value = null

        // 重置防作弊状态
        resetAntiCheat()

        // 启动倒计时和自动保存
        startTimer()
        startAutoSave()

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
        if (q.qtype === 'multi' || q.qtype === 'indeterminate') {
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
        stopAutoSave()

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
          // 规范化选项格式
          if (data.items) {
            data.items = normalizeQuestions(data.items)
          }
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

    // ======= 错题本功能函数 =======
    // 加载错题本
    const loadWrongBook = async () => {
      const studentId = store.state.user.username
      if (!studentId) return
      
      loadingWrongBook.value = true
      try {
        const data = await mcqFetch(`${API_ENDPOINTS.WRONG_QUESTIONS.LIST}?student_id=${encodeURIComponent(studentId)}`)
        if (data.ok) {
          wrongBook.value = data.questions || []
          wrongBookTotal.value = data.total || 0
        }
      } catch (error: any) {
        console.error('加载错题本失败:', error)
      } finally {
        loadingWrongBook.value = false
      }
    }

    // 保存错题到错题本
    const saveToWrongBook = async () => {
      const studentId = store.state.user.username
      if (!studentId || !reviewData.value) return
      
      // 收集错题
      const wrongItems = reviewData.value.items
        .filter(item => !item.is_correct)
        .map(item => ({
          qid: item.qid,
          stem: item.stem,
          options: item.options,
          answer: item.correct_labels.join(''),
          explain: item.analysis || '',
          my_answer: item.my_labels || [],
          qtype: item.qtype,
          stem_images: item.stem_images,
          option_images: item.option_images,
          analysis_images: item.analysis_images
        }))
      
      if (wrongItems.length === 0) {
        ElMessage.info('本次考试没有错题')
        return
      }
      
      savingToWrongBook.value = true
      try {
        const data = await mcqFetch(API_ENDPOINTS.WRONG_QUESTIONS.ADD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            questions: wrongItems
          })
        })
        
        if (data.ok) {
          ElMessage.success(`已收录 ${data.added_count} 道错题到错题本`)
          loadWrongBook()  // 刷新错题本
        } else {
          throw new Error(data.msg || '保存失败')
        }
      } catch (error: any) {
        ElMessage.error('保存错题失败：' + (error.message || '未知错误'))
      } finally {
        savingToWrongBook.value = false
      }
    }

    // 从错题本移除（已掌握）
    const removeFromWrongBook = async (qids: string[]) => {
      const studentId = store.state.user.username
      if (!studentId || qids.length === 0) return
      
      try {
        const data = await mcqFetch(API_ENDPOINTS.WRONG_QUESTIONS.REMOVE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            qids
          })
        })
        
        if (data.ok) {
          ElMessage.success(`已移除 ${data.removed_count} 道题目`)
          loadWrongBook()
        }
      } catch (error: any) {
        ElMessage.error('移除失败：' + (error.message || '未知错误'))
      }
    }

    // 打开错题本
    const openWrongBook = () => {
      wrongBookVisible.value = true
      loadWrongBook()
    }

    // 使用错题本开始练习
    const startWrongBookPractice = async () => {
      const studentId = store.state.user.username
      if (!studentId) {
        ElMessage.warning('请先登录')
        return
      }
      
      if (wrongBook.value.length === 0) {
        ElMessage.warning('错题本为空')
        return
      }
      
      startingPractice.value = true
      try {
        // 构建错题练习题目数据
        const practiceQuestions = wrongBook.value.map((q: any) => ({
          qid: q.qid,
          stem: q.stem,
          options: q.options,
          answer: q.answer,
          explain: q.explain || '',
          qtype: q.qtype || 'single',
          stem_images: q.stem_images,
          option_images: q.option_images,
          analysis_images: q.analysis_images
        }))
        
        // 直接使用临时题目数据开始练习（不保存为试卷文件）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const practiceTitle = `错题练习_${timestamp}`
        const durationSec = Math.max(30, wrongBook.value.length * 2) * 60  // 每题2分钟
        
        const startResult = await mcqFetch(API_ENDPOINTS.EXAM.START_TEMP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: practiceQuestions,
            duration_sec: durationSec,
            student_id: studentId,
            title: practiceTitle
          })
        })
        
        if (!startResult.ok) {
          throw new Error(startResult.detail || '开始练习失败')
        }
        
        // 直接进入考试状态
        attemptId.value = startResult.attempt_id
        questions.value = normalizeQuestions(startResult.items || [])
        leftSeconds.value = startResult.left_sec || durationSec
        examStarted.value = true
        isPracticeMode.value = true
        currentExamId.value = ''
        wrongBookVisible.value = false
        
        // 初始化答案
        answersState.value = {}
        questions.value.forEach((q: any) => {
          answersState.value[q.qid] = []
        })
        
        // 启动倒计时
        startTimer()
        
      } catch (error: any) {
        ElMessage.error('开始错题练习失败：' + (error.message || '未知错误'))
      } finally {
        startingPractice.value = false
      }
    }

    // 监听路由离开（Vue Router 导航）
    onBeforeRouteLeave((to, from, next) => {
      if (examStarted.value && !submitted.value) {
        // 记录切屏
        handleSwitchDetected('离开考试页面')
        // 使用 sendBeacon 确保数据保存
        saveProgressWithBeacon()
      }
      next()
    })

    onMounted(() => {
      loadPapers()
      loadPublishedExams()  // 加载考试通知
      loadWrongBook()  // 加载错题本
      // 检查是否有未完成的考试
      checkInProgressExam()
      // 添加页面关闭前警告
      window.addEventListener('beforeunload', handleBeforeUnload)
      // 添加 pagehide 事件（比 beforeunload 更可靠）
      window.addEventListener('pagehide', handlePageHide)
      // 添加防作弊检测
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('blur', handleWindowBlur)
      window.addEventListener('focus', handleWindowFocus)
    })

    onUnmounted(() => {
      stopTimer()
      stopAutoSave()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      // 移除防作弊检测
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      // 清理延迟定时器
      if (blurTimeoutId.value) {
        clearTimeout(blurTimeoutId.value)
        blurTimeoutId.value = null
      }
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
      singleQuestions,
      multiQuestions,
      indeterminateQuestions,
      answeredCount,
      currentQid,
      scrollToQuestion,
      knowledgePointStats,
      scrollToWrongByKp,
      exporting,
      exportingWrong,
      exportMessage,
      exportWrongReport,
      scoreChartRef,
      previewImageVisible,
      previewImageUrl,
      previewImage,
      getOptionImages,
      getReviewOptionImages,
      loadPapers,
      startPractice,
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
      // 解析Tab切换相关
      analysisActiveTab, isComplexValidation, getAnalysisForTab, loadPerOption,
      toggleMultiOption,
      selectSingleOption,
      lastSaveTime,
      savingProgress,
      saveProgress,
      // 考试通知相关
      publishedExams,
      loadingExamNotifications,
      enteringExam,
      loadPublishedExams,
      getExamStatus,
      enterPublishedExam,
      // 防作弊相关
      switchCount,
      maxSwitchCount,
      switchWarningVisible,
      closeSwitchWarning,
      // 随机练习相关
      practiceConfig,
      practiceTotalCount,
      startingPractice,
      startRandomPractice,
      randomPracticeVisible,
      startRandomPracticeFromDialog,
      // 错题本相关
      wrongBook,
      wrongBookTotal,
      wrongBookVisible,
      loadingWrongBook,
      savingToWrongBook,
      loadWrongBook,
      saveToWrongBook,
      removeFromWrongBook,
      openWrongBook,
      startWrongBookPractice,
      // Icons
      Bell,
      Refresh,
      Clock,
      Reading,
      CaretRight,
      InfoFilled,
      Collection,
      View,
      Delete,
      Loading
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
  --ink: #e5e7eb;
  --pri: #2b7cff;
  --ok: #10b981;
  --warn: #f59e0b;
  --bad: #ef4444;
}

.exam-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/card.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  color: #e5e7eb;
  position: relative;
}

.exam-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  z-index: 0;
}

/* 顶栏 */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 随机练习面板 */
.practice-panel {
  max-width: 1400px;
  margin: 16px auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.practice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-radius: 10px 10px 0 0;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-bottom: none;
  color: #10b981;
  font-weight: 600;
}

.practice-icon {
  font-size: 20px;
}

.practice-content {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 0 0 10px 10px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-top: none;
  padding: 20px;
}

.practice-config {
  margin-bottom: 16px;
}

.config-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.config-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.summary-text {
  font-size: 14px;
  color: #e5e7eb;
}

.summary-text b {
  color: #10b981;
  font-size: 16px;
}

.practice-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(96, 165, 250, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: #94a3b8;
}

.practice-tips .el-icon {
  color: #60a5fa;
  font-size: 16px;
}

@media (max-width: 768px) {
  .config-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .config-summary {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

/* 考试通知面板 */
.notification-panel {
  max-width: 1400px;
  margin: 16px auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
  border-radius: 10px 10px 0 0;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-bottom: none;
  color: #fbbf24;
  font-weight: 600;
}

.notification-icon {
  font-size: 20px;
}

.notification-list {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 0 0 10px 10px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-top: none;
  overflow: hidden;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.1);
  transition: background-color 0.2s;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: rgba(96, 165, 250, 0.05);
}

.notification-item.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-left: 3px solid #10b981;
}

.notification-item.pending {
  opacity: 0.7;
}

.exam-info {
  flex: 1;
}

.exam-name {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 6px;
}

.exam-meta {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.exam-meta .divider {
  margin: 0 8px;
  opacity: 0.5;
}

.exam-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.exam-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 6px;
  padding-left: 8px;
  border-left: 2px solid rgba(96, 165, 250, 0.3);
}

.exam-action {
  margin-left: 20px;
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
  background: rgba(30, 41, 59, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.muted {
  color: #94a3b8;
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
  color: #e5e7eb;
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
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: hidden;
}

/* 自定义滚动条 */
.side::-webkit-scrollbar {
  width: 6px;
}

.side::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 3px;
}

.side::-webkit-scrollbar-thumb {
  background: rgba(96, 165, 250, 0.4);
  border-radius: 3px;
}

.side::-webkit-scrollbar-thumb:hover {
  background: rgba(96, 165, 250, 0.6);
}

.card {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 30px rgba(96, 165, 250, 0.2);
  transform: translateY(-2px);
}

.side h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: #e5e7eb;
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
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.8);
  text-align: center;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #e5e7eb;
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
  color: #cbd5e1;
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
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 16px;
  padding: 24px;
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.q:hover {
  box-shadow: 0 4px 20px rgba(96, 165, 250, 0.2);
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
  color: #e5e7eb;
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

.tag.indeterminate {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: #fff;
}

/* 题干图片 */
.stem-images {
  margin: 12px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.q-image {
  max-width: 400px;
  max-height: 300px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  pointer-events: auto;  /* 确保图片可点击 */
}

.q-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
}

/* 选项包装器 */
.opt-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 选项图片（按钮外部） */
.opt-images-outer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: 24px;
}

/* 选项图片（旧版兼容） */
.opt-images {
  display: block;
  margin-top: 8px;
}

.opt-image {
  max-width: 200px;
  max-height: 150px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 6px;
  margin-right: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  pointer-events: auto;  /* 确保图片可点击，即使父元素disabled */
}

.opt-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
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
  border: 2px solid rgba(96, 165, 250, 0.3);
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.8);
  color: #e5e7eb;
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
  color: #e5e7eb;
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
  grid-template-columns: repeat(9, 1fr);
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
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 2px dashed rgba(102, 126, 234, 0.4);
  padding: 16px;
  border-radius: 12px;
  margin-top: 12px;
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.8;
  position: relative;
}

.analysis-images {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(102, 126, 234, 0.3);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.analysis-tab-bar {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.3);
}

.analysis-tab-bar :deep(.el-radio-button__inner) {
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(102, 126, 234, 0.4);
  color: #e2e8f0;
}

.analysis-tab-bar :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #fff;
}

/* 响应式优化 */
/* 错题统计与知识点分析 */
.wrong-stats-panel h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #e5e7eb;
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
  color: #e5e7eb;
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
  color: #e5e7eb;
}

.kp-row.kp-danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%);
}

.kp-row.kp-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%);
}

.kp-name {
  font-size: 14px;
  color: #e5e7eb;
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
  color: #cbd5e1;
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
    grid-template-columns: repeat(7, 1fr);
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

/* 题目分类导航样式 */
.nav-section {
  margin-bottom: 16px;
}

.nav-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.nav-type-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.nav-type-tag.single {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nav-type-tag.multi {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.nav-type-tag.indeterminate {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.nav-count {
  font-size: 12px;
  color: #94a3b8;
}

.nav-summary {
  text-align: center;
}

/* 题目分类区域样式 */
.question-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 20px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.section-tag {
  font-size: 16px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 8px;
  color: #fff;
}

.section-tag.single {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.section-tag.multi {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.section-tag.indeterminate {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.section-count {
  font-size: 14px;
  color: #94a3b8;
}

/* 头部统计样式 */
.head-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.head-stat .stat-label {
  color: #94a3b8;
  font-size: 13px;
}

.head-stat .stat-value {
  color: #e5e7eb;
  font-weight: 600;
  font-size: 14px;
}

.head-divider {
  color: rgba(96, 165, 250, 0.3);
  margin: 0 8px;
}

/* 自动保存状态样式 */
.auto-save-status {
  margin-left: 16px;
  font-size: 13px;
}

.auto-save-status .saving {
  color: #fbbf24;
  animation: pulse 1s infinite;
}

.auto-save-status .saved {
  color: #4ade80;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 防作弊切屏次数提示 */
.switch-count-badge {
  position: fixed;
  top: 70px;
  right: 20px;
  background: linear-gradient(135deg, #f56c6c, #e74c3c);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  z-index: 1000;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 错题本面板 */
.wrong-book-panel {
  max-width: 1400px;
  margin: 16px auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.wrong-book-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
  border-radius: 10px 10px 0 0;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-bottom: none;
  color: #ef4444;
  font-weight: 600;
}

.wrong-book-icon {
  font-size: 20px;
}

.wrong-book-content {
  background: rgba(30, 41, 59, 0.9);
  border-radius: 0 0 10px 10px;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-top: none;
  padding: 20px;
}

.wrong-book-empty {
  padding: 20px;
  text-align: center;
}

.wrong-book-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.wrong-book-stats {
  font-size: 14px;
  color: #e5e7eb;
}

.wrong-book-stats b {
  color: #ef4444;
  font-size: 18px;
}

.wrong-book-actions {
  display: flex;
  gap: 12px;
}

/* 随机练习对话框 */
.random-practice-dialog {
  padding: 10px 0;
}

.practice-config-dialog {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.config-row-dialog {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.config-row-dialog:last-child {
  margin-bottom: 0;
}

.config-item-dialog {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item-dialog label {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.config-summary-dialog {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  margin-top: 16px;
  color: #64748b;
}

.config-summary-dialog b {
  color: #10b981;
  font-size: 18px;
}

.practice-tips-dialog {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  padding: 12px;
  background: #fefce8;
  border-radius: 8px;
}

.practice-tips-dialog .el-icon {
  color: #eab308;
  margin-top: 2px;
}

/* 顶部按钮中的错题本徽章 */
.wrong-badge {
  margin-left: 6px;
}

.wrong-badge :deep(.el-badge__content) {
  top: -8px;
  right: -8px;
}

/* 错题本对话框 */
.wrong-book-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.loading-wrap, .empty-wrap {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wrong-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.wrong-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.wrong-num {
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.wrong-stem {
  flex: 1;
  font-size: 15px;
  color: #1e293b;
  line-height: 1.6;
}

.wrong-options {
  margin: 12px 0;
  padding-left: 34px;
}

.wrong-opt {
  padding: 6px 0;
  font-size: 14px;
  color: #475569;
}

.correct-label {
  color: #10b981;
  font-weight: 600;
}

.my-wrong {
  color: #ef4444;
  text-decoration: line-through;
}

.wrong-answer-info {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  margin-left: 34px;
  font-size: 13px;
  border-top: 1px dashed #e2e8f0;
}

.correct-answer {
  color: #10b981;
  font-weight: 500;
}

.my-answer {
  color: #ef4444;
}

.review-info {
  color: #64748b;
  font-style: italic;
}

.wrong-explain {
  margin-top: 12px;
  margin-left: 34px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
}

.explain-label {
  color: #667eea;
  font-weight: 600;
  margin-bottom: 6px;
}

.wrong-images {
  margin: 10px 0 10px 34px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wrong-img {
  max-width: 300px;
  max-height: 200px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.wrong-img:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.wrong-img.small {
  max-width: 150px;
  max-height: 100px;
}

.opt-images {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wrong-book-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wrong-total {
  flex: 1;
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 768px) {
  .wrong-book-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .wrong-book-actions {
    width: 100%;
  }
  
  .wrong-book-actions .el-button {
    flex: 1;
  }
}
</style>
