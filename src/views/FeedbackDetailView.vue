<template>
  <div class="feedback-detail-page">
    <div class="container">
      <!-- 返回按钮 -->
      <button class="back-button" @click="goBack">
        ← 返回列表
      </button>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>正在加载反馈详情...</span>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error">
        <el-icon :size="64" color="#ef4444"><WarningFilled /></el-icon>
        <h2>加载失败</h2>
        <p>{{ error }}</p>
      </div>

      <!-- 详情内容 -->
      <div v-else-if="feedback" class="detail-content">
        <h1 class="page-title">
          <el-icon :size="32" style="vertical-align: middle; margin-right: 0.5rem;"><DocumentCopy /></el-icon>
          反馈记录详情
        </h1>

        <!-- 信息栏 -->
        <div class="info-bar">
          <div class="info-item">
            <span class="info-label">反馈ID:</span>
            <span class="info-value">{{ feedback.feedbackId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">模型ID:</span>
            <span class="info-value">{{ feedback.modelId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">反馈类型:</span>
            <span
              class="info-value"
              :class="feedback.feedbackType === 'LIKE' ? 'like' : 'dislike'"
            >
              <el-icon :size="18" style="vertical-align: middle; margin-right: 0.25rem;">
                <CircleCheck v-if="feedback.feedbackType === 'LIKE'" />
                <CircleClose v-else />
              </el-icon>
              {{ feedback.feedbackType === 'LIKE' ? '点赞' : '点踩' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">反馈时间:</span>
            <span class="info-value">{{ feedback.createAt }}</span>
          </div>
        </div>

        <!-- 用户问题 -->
        <div class="section-card question-card">
          <div class="section-header">
            <el-icon :size="28" class="section-icon"><QuestionFilled /></el-icon>
            <h2 class="section-title">用户问题</h2>
          </div>
          <div class="question-content">{{ feedback.question }}</div>
        </div>

        <!-- 模型回答 -->
        <div class="section-card answer-card">
          <div class="section-header">
            <el-icon :size="28" class="section-icon"><Sunny /></el-icon>
            <h2 class="section-title">模型回答</h2>
          </div>

          <!-- 思考过程 -->
          <div v-if="thinkingContent" class="thinking-section">
            <div class="thinking-header">
              <el-icon :size="24" class="thinking-icon"><ChatDotRound /></el-icon>
              <h3 class="thinking-title">思考过程</h3>
            </div>
            <div class="thinking-content" v-html="renderText(thinkingContent)"></div>
          </div>

          <!-- 主要回答 -->
          <div v-if="mainAnswerContent" class="main-answer" v-html="renderMarkdown(mainAnswerContent)"></div>

          <!-- 参考来源 -->
          <div v-if="sources.length > 0" class="reference-section">
            <div class="reference-header">
              <el-icon :size="24" class="reference-icon"><Reading /></el-icon>
              <h3 class="reference-title">参考内容</h3>
              <span class="reference-count">{{ sources.length }} 个来源</span>
            </div>
            <div class="reference-list">
              <div
                v-for="(source, index) in sources"
                :key="index"
                class="reference-item"
                :class="{ selected: source.canAnswer }"
              >
                <div class="reference-filename">
                  <span class="reference-id">[{{ source.id }}]</span>
                  {{ source.fileName }}
                </div>
                <div class="reference-scores">
                  <span class="score-item">
                    <span class="score-label">初始检索分:</span>
                    <span class="score-value">{{ source.initialScore || 'N/A' }}</span>
                  </span>
                  <span class="score-divider">|</span>
                  <span class="score-item">
                    <span class="score-label">重排序分:</span>
                    <span class="score-value">{{ source.rerankedScore || 'N/A' }}</span>
                  </span>
                  <span class="score-divider">|</span>
                  <span v-if="source.canAnswer" class="can-answer">
                    <el-icon :size="14" style="vertical-align: middle;"><Select /></el-icon> 可回答
                  </span>
                  <span v-else class="cannot-answer">
                    <el-icon :size="14" style="vertical-align: middle;"><CircleClose /></el-icon> 不可回答
                  </span>
                </div>
                <div class="reference-text" v-html="renderText(source.content || '')"></div>
                <div v-if="source.keyPassage" class="key-passage">
                  <div class="key-passage-label">
                    <el-icon :size="16" style="vertical-align: middle; margin-right: 0.25rem;"><Search /></el-icon>
                    关键段落：
                  </div>
                  <div class="key-passage-text" v-html="renderText(source.keyPassage)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 差评详情 -->
        <div v-if="feedback.feedbackType === 'DISLIKE'" class="section-card dislike-card">
          <div class="section-header">
            <el-icon :size="28" class="section-icon"><WarningFilled /></el-icon>
            <h2 class="section-title">差评详情</h2>
          </div>
          <div class="dislike-content">
            <div class="dislike-item">
              <span class="dislike-label">错误原因:</span>
              <span class="dislike-value">{{ feedback.reason || '(未填写)' }}</span>
            </div>
            <div class="dislike-item">
              <span class="dislike-label">反映人:</span>
              <span class="dislike-value">{{ feedback.reporterName || '(未填写)' }}</span>
            </div>
            <div class="dislike-item">
              <span class="dislike-label">反映单位:</span>
              <span class="dislike-value">{{ feedback.reporterUnit || '(未填写)' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import http from '@/config/api/http';
import { API_ENDPOINTS } from '@/config/api/api';
import { renderMarkdown } from '@/utils/markdown';
import {
  DocumentCopy,
  WarningFilled,
  CircleCheck,
  CircleClose,
  QuestionFilled,
  Sunny,
  ChatDotRound,
  Reading,
  Select,
  Search
} from '@element-plus/icons-vue';

interface ReferenceSource {
  id: string;
  fileName: string;
  content: string;
  initialScore?: number;
  rerankedScore?: number;
  canAnswer?: boolean;
  keyPassage?: string;
}

interface FeedbackDetail {
  feedbackId: number;
  feedbackType: 'LIKE' | 'DISLIKE';
  question: string;
  answer: string;
  modelId: string;
  createAt: string;
  reporterName?: string;
  reporterUnit?: string;
  reason?: string;
  source?: ReferenceSource[];
}

const router = useRouter();
const route = useRoute();
const feedback = ref<FeedbackDetail | null>(null);
const loading = ref(true);
const error = ref('');

// 解析思考过程和主要回答
const thinkingContent = computed(() => {
  if (!feedback.value?.answer) return '';
  const thinkingRegex = /<think>(.*?)<\/think>/gs;
  const match = thinkingRegex.exec(feedback.value.answer);
  return match ? match[1].trim() : '';
});

const mainAnswerContent = computed(() => {
  if (!feedback.value?.answer) return '';
  const thinkingRegex = /<think>(.*?)<\/think>/gs;
  const match = thinkingRegex.exec(feedback.value.answer);
  
  if (match) {
    const beforeContent = feedback.value.answer.slice(0, match.index).trim();
    const afterContent = feedback.value.answer.slice(match.index + match[0].length).trim();
    return (beforeContent + '\n' + afterContent).trim();
  }
  
  return feedback.value.answer;
});

const sources = computed(() => {
  return feedback.value?.source || [];
});

// 渲染纯文本（保留换行）
const renderText = (text: string) => {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
};

// 加载反馈详情
const loadFeedbackDetail = async () => {
  const feedbackId = route.params.id;
  if (!feedbackId) {
    error.value = '缺少反馈ID参数';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await http.get(API_ENDPOINTS.FEEDBACK.DETAIL(feedbackId as string));
    
    if (response.data.success) {
      feedback.value = response.data.data.feedback;
    } else {
      error.value = response.data.message || '获取数据失败';
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '加载失败，请稍后重试';
    console.error('加载反馈详情失败:', err);
  } finally {
    loading.value = false;
  }
};

// 返回列表
const goBack = () => {
  router.push({ name: 'feedback-list' });
};

onMounted(() => {
  loadFeedbackDetail();
});
</script>

<style scoped>
.feedback-detail-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/robot.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 2rem 1rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

/* 返回按钮 */
.back-button {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: white;
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* 加载、错误状态 */
.loading,
.error {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
  font-size: 1.1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #ef4444;
}

.error-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.error h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.error p {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
}

/* 详情内容 */
.detail-content {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 信息栏 */
.info-bar {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.95rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.info-value.like {
  color: #10b981;
}

.info-value.dislike {
  color: #ef4444;
}

/* 卡片样式 */
.section-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-icon {
  font-size: 1.75rem;
}

.section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

/* 问题卡片 */
.question-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #374151;
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  white-space: pre-wrap;
}

/* 思考过程 */
.thinking-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #7dd3fc;
}

.thinking-icon {
  font-size: 1.5rem;
}

.thinking-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e40af;
}

.thinking-content {
  color: #1e3a8a;
  font-size: 1rem;
  line-height: 1.7;
  font-style: italic;
  background: rgba(255, 255, 255, 0.7);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

/* 主要回答 */
.main-answer {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 1.5rem;
}

/* 参考来源 */
.reference-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #bbf7d0;
  border-radius: 12px;
  padding: 1.5rem;
}

.reference-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #86efac;
}

.reference-icon {
  font-size: 1.5rem;
}

.reference-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #047857;
  flex: 1;
}

.reference-count {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.reference-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reference-item {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.reference-item.selected {
  border: 2px solid #10b981;
  background: rgba(16, 185, 129, 0.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.reference-filename {
  font-weight: 600;
  color: #065f46;
  margin-bottom: 0.75rem;
  font-size: 1.05rem;
}

.reference-id {
  background: #10b981;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-right: 0.5rem;
}

.reference-scores {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.score-label {
  font-weight: 500;
}

.score-value {
  font-weight: 600;
  color: #374151;
}

.score-divider {
  color: #d1d5db;
}

.can-answer {
  color: #10b981;
  font-weight: 600;
}

.cannot-answer {
  color: #9ca3af;
}

.reference-text {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #10b981;
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 0.75rem;
}

.key-passage {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  padding: 1rem;
  border-radius: 8px;
}

.key-passage-label {
  font-weight: 600;
  color: #b45309;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.key-passage-text {
  color: #92400e;
  font-size: 0.9rem;
  line-height: 1.7;
}

/* 差评详情 */
.dislike-card {
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border: 2px solid #fde047;
}

.dislike-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dislike-item {
  display: flex;
  gap: 1rem;
  font-size: 1rem;
}

.dislike-label {
  font-weight: 600;
  color: #854d0e;
  min-width: 100px;
}

.dislike-value {
  color: #92400e;
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.75rem;
  }

  .info-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .section-card {
    padding: 1.5rem;
  }

  .dislike-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .dislike-label {
    min-width: auto;
  }
}
</style>
