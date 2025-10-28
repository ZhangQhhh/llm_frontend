<template>
  <div class="qa-page">
    <div class="container">
      <!-- 标题 -->
      <h1 class="page-title">🎓 边检知识问答助手</h1>
      <p class="page-desc">基于专业知识库的精准检索与智能回答</p>

      <!-- 问题输入区 -->
      <div class="input-card">
        <textarea
          v-model="question"
          placeholder="请输入您的问题..."
          @keydown.enter.exact.prevent="handleSubmit"
          :disabled="loading"
        ></textarea>

        <div class="input-controls">
          <div class="controls-left">
            <label class="control-group">
              <span>模型:</span>
              <select v-model="modelId">
                <option value="qwen3-32b">Qwen-32B</option>
                <option value="qwen2025">Qwen满血版</option>
                <option value="deepseek">DeepSeek-R1</option>
                <option value="deepseek-32b">DeepSeek-32B</option>
              </select>
            </label>

            <label class="control-group">
              <span>参考数:</span>
              <input type="number" v-model.number="rerankTopN" min="1" max="15" />
            </label>

            <label class="switch-control">
              <input type="checkbox" v-model="insertBlock" />
              <span>精准检索</span>
            </label>

            <label class="switch-control">
              <input type="checkbox" v-model="thinkingMode" />
              <span>思考模式</span>
            </label>
          </div>

          <button class="submit-btn" @click="handleSubmit" :disabled="loading || !question.trim()">
            {{ loading ? '生成中...' : '发送' }}
          </button>
        </div>
      </div>

      <!-- 回答区域 -->
      <div v-if="loading || answer || references.length > 0" class="answer-card">
        <h2 class="answer-title">💡 回答</h2>

        <!-- 加载提示 -->
        <div v-if="loading && !answer" class="loading-hint">
          <div class="spinner-small"></div>
          <span>AI正在思考中...</span>
        </div>

        <!-- 正文 -->
        <div v-if="answer" class="answer-content">
          <!-- 流式输出时显示原始文本，完成后显示 Markdown -->
          <div v-if="loading" style="white-space: pre-wrap;">{{ answer }}</div>
          <div v-else v-html="renderMarkdown(answer)"></div>
        </div>

        <!-- 思考过程 -->
        <div v-if="thinking && thinkingMode" class="thinking-box">
          <div class="thinking-header">
            <span class="icon">💭</span>
            <h3>思考过程</h3>
          </div>
          <div class="thinking-content">{{ thinking }}</div>
        </div>

        <!-- 参考来源 -->
        <div v-if="references.length > 0" class="references-box">
          <div class="references-header">
            <span class="icon">📚</span>
            <h3>参考内容（全部检索结果）</h3>
          </div>

          <div class="references-list">
            <div
              v-for="(ref, index) in references"
              :key="index"
              class="reference-card"
              :class="{ selected: ref.canAnswer }"
            >
              <div class="ref-header">
                <span class="ref-id">[{{ ref.id }}]</span>
                <span class="ref-filename">{{ ref.fileName }}</span>
                <span v-if="ref.canAnswer" class="selected-badge">✓ 已选中</span>
              </div>

              <div class="ref-scores">
                <span>初始检索分: {{ typeof ref.initialScore === 'number' ? ref.initialScore.toFixed(2) : (ref.initialScore || '-') }}</span>
                <span>重排序分: {{ typeof ref.rerankedScore === 'number' ? ref.rerankedScore.toFixed(2) : (ref.rerankedScore || '-') }}</span>
                <span
                  v-if="ref.canAnswer !== undefined"
                  :class="ref.canAnswer ? 'can-answer' : 'cannot-answer'"
                >
                  {{ ref.canAnswer ? '✓ 可回答' : '✗ 不可回答' }}
                </span>
              </div>

              <div class="ref-text">"{{ ref.content }}"</div>

              <div v-if="ref.keyPassage" class="key-passage">
                <div class="passage-label">🔍 关键段落：</div>
                <div class="passage-text">{{ ref.keyPassage }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 反馈按钮 -->
        <div class="feedback-actions">
          <button
            class="feedback-btn like-btn"
            @click="handleLike"
            :disabled="feedbackSubmitted"
          >
            👍 点赞
          </button>
          <button
            class="feedback-btn dislike-btn"
            @click="showFeedbackModal = true"
            :disabled="feedbackSubmitted"
          >
            👎 点踩
          </button>
        </div>
      </div>
    </div>

    <!-- 反馈模态框 -->
    <div v-if="showFeedbackModal" class="modal-overlay" @click.self="showFeedbackModal = false">
      <div class="modal-content">
        <h3>提交反馈</h3>
        <form @submit.prevent="handleDislikeSubmit">
          <div class="form-group">
            <label>错误原因 (必填)</label>
            <textarea
              v-model="feedbackReason"
              placeholder="请具体描述回答中的错误或问题..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>反映人</label>
            <input type="text" v-model="reporterName" placeholder="请输入您的姓名" />
          </div>

          <div class="form-group">
            <label>反映单位</label>
            <input type="text" v-model="reporterUnit" placeholder="请输入您的单位" />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showFeedbackModal = false">
              取消
            </button>
            <button type="submit" class="btn-submit" :disabled="submittingFeedback">
              {{ submittingFeedback ? '提交中...' : '提交反馈' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 滚动到反馈按钮 -->
    <div
      v-if="answer && !feedbackSubmitted"
      class="scroll-to-feedback"
      @click="scrollToFeedback"
    >
      <span>评价</span>
      <span class="arrow">▼</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from 'vuex';
import {
  sendStreamChatRequest,
  submitLikeFeedback,
  submitDislikeFeedback,
  type ReferenceSource,
  type StreamMessage
} from '@/utils/chatApi';
import { API_ENDPOINTS } from '@/config/api/api';
import { isStatusMessage } from '@/utils/htmlUtils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default defineComponent({
  name: 'KnowledgeQAView',
  setup() {
    const store = useStore();
    
    // 状态
    const question = ref('');
    const answer = ref('');
    const thinking = ref('');
    const references = ref<ReferenceSource[]>([]);
    const loading = ref(false);

    // 配置
    const modelId = ref('qwen3-32b');
    const rerankTopN = ref(10);
    const thinkingMode = ref(true);
    const insertBlock = ref(false);

    // 反馈相关
    const feedbackSubmitted = ref(false);
    const showFeedbackModal = ref(false);
    const feedbackReason = ref('');
    const reporterName = ref('');
    const reporterUnit = ref('');
    const submittingFeedback = ref(false);

    // 用于反馈的数据
    const lastQuestion = ref('');
    const lastAnswer = ref('');

    // 配置 marked
    marked.setOptions({
      breaks: true,  // 支持 GitHub 风格的换行
      gfm: true,     // 启用 GitHub Flavored Markdown
    });

    // Markdown渲染
    const renderMarkdown = (text: string) => {
      try {
        const html = marked.parse(text) as string;
        return DOMPurify.sanitize(html);
      } catch (error) {
        console.error('Markdown 渲染失败:', error);
        return text;
      }
    };

    // 发送问题
    const handleSubmit = async () => {
      if (!question.value.trim() || loading.value) return;

      lastQuestion.value = question.value.trim();
      answer.value = '';
      thinking.value = '';
      references.value = [];
      feedbackSubmitted.value = false;
      loading.value = true;

      try {
        await sendStreamChatRequest(
          API_ENDPOINTS.KNOWLEDGE.CHAT,
          {
            question: lastQuestion.value,
            thinking: thinkingMode.value,
            rerank_top_n: rerankTopN.value,
            model_id: modelId.value,
            use_insert_block: insertBlock.value,
            insert_block_llm_id: modelId.value
          },
          store.state.user.token,
          (message: StreamMessage) => {
            handleStreamMessage(message);
          }
        );

        // 组合完整答案用于反馈
        lastAnswer.value = thinking.value
          ? `<think>${thinking.value}</think>\n${answer.value}`
          : answer.value;
      } catch (error: any) {
        answer.value = `请求失败: ${error.message}`;
      } finally {
        loading.value = false;
      }
    };

    // 处理流式消息
    const handleStreamMessage = (message: StreamMessage) => {
      console.log('收到消息:', message.type, message.data ? message.data.substring(0, 100) : '');
      
      switch (message.type) {
        case 'THINK':
          thinking.value = thinking.value + message.data;
          break;

        case 'CONTENT':
          // 过滤状态消息
          if (!isStatusMessage(message.data)) {
            answer.value = answer.value + message.data;
          }
          break;

        case 'SOURCE':
          console.log('收到SOURCE消息，原始数据:', message.data);
          try {
            const source = JSON.parse(message.data) as ReferenceSource;
            console.log('解析后的SOURCE:', source);
            references.value.push(source);
            console.log('当前references数量:', references.value.length);
          } catch (e) {
            console.error('解析SOURCE失败:', e, '原始数据:', message.data);
          }
          break;

        case 'ERROR':
          answer.value = `错误: ${message.data}`;
          break;

        case 'DONE':
          console.log('流式响应完成，最终references数量:', references.value.length);
          loading.value = false;
          break;
          
        case 'UNKNOWN':
          console.warn('未知消息类型:', message.data ? message.data.substring(0, 100) : '');
          break;
      }
    };

    // 点赞
    const handleLike = async () => {
      try {
        await submitLikeFeedback(lastQuestion.value, lastAnswer.value, modelId.value, 'LIKE', references.value);
        feedbackSubmitted.value = true;
        alert('感谢您的反馈！');
      } catch (error: any) {
        alert(`提交反馈失败: ${error.message}`);
      }
    };

    // 点踩提交
    const handleDislikeSubmit = async () => {
      if (!feedbackReason.value.trim()) {
        alert('请填写具体的错误原因');
        return;
      }

      submittingFeedback.value = true;

      try {
        await submitDislikeFeedback(
          lastQuestion.value,
          lastAnswer.value,
          references.value,
          feedbackReason.value,
          'DISLIKE',
          modelId.value,
          reporterName.value,
          reporterUnit.value
        );

        feedbackSubmitted.value = true;
        showFeedbackModal.value = false;
        alert('反馈提交成功，感谢您！');

        // 清空表单
        feedbackReason.value = '';
        reporterName.value = '';
        reporterUnit.value = '';
      } catch (error: any) {
        alert(`提交反馈失败: ${error.message}`);
      } finally {
        submittingFeedback.value = false;
      }
    };

    // 滚动到反馈区域
    const scrollToFeedback = () => {
      const feedbackEl = document.querySelector('.feedback-actions');
      if (feedbackEl) {
        feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    return {
      question,
      answer,
      thinking,
      references,
      loading,
      modelId,
      rerankTopN,
      thinkingMode,
      insertBlock,
      feedbackSubmitted,
      showFeedbackModal,
      feedbackReason,
      reporterName,
      reporterUnit,
      submittingFeedback,
      handleSubmit,
      handleLike,
      handleDislikeSubmit,
      scrollToFeedback,
      renderMarkdown
    };
  }
});
</script>

<style scoped>
.qa-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  padding: 3rem 1.5rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

/* 标题 */
.page-title {
  text-align: center;
  color: white;
  font-size: 48px;
  margin: 0 0 1rem 0;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.page-desc {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin: 0 0 3rem 0;
}

/* 输入卡片 */
.input-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;
}

.input-card textarea {
  width: 100%;
  min-height: 140px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.25rem;
  font-size: 16px;
  resize: vertical;
  transition: border-color 0.3s;
  font-family: inherit;
  line-height: 1.6;
}

.input-card textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.controls-left {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #6b7280;
}

.control-group select,
.control-group input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.control-group input[type="number"] {
  width: 60px;
  text-align: center;
}

.switch-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
}

.switch-control input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.submit-btn {
  background: linear-gradient(45deg, #2563eb, #1e3a8a);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 2rem;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-box {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-box p {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

/* 回答卡片 */
.answer-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.answer-title {
  font-size: 24px;
  color: #374151;
  margin: 0 0 1.5rem 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.answer-content {
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 2rem;
}

/* Markdown 样式 */
.answer-content :deep(h1),
.answer-content :deep(h2),
.answer-content :deep(h3),
.answer-content :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.answer-content :deep(h1) {
  font-size: 2em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.answer-content :deep(h2) {
  font-size: 1.75em;
}

.answer-content :deep(h3) {
  font-size: 1.5em;
}

.answer-content :deep(h4) {
  font-size: 1.25em;
}

.answer-content :deep(p) {
  margin-bottom: 1rem;
}

.answer-content :deep(ul),
.answer-content :deep(ol) {
  margin-left: 2rem;
  margin-bottom: 1rem;
}

.answer-content :deep(li) {
  margin-bottom: 0.5rem;
}

.answer-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #dc2626;
}

.answer-content :deep(pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.answer-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

.answer-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin-left: 0;
  color: #6b7280;
  font-style: italic;
}

.answer-content :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.answer-content :deep(em) {
  font-style: italic;
}

.answer-content :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.answer-content :deep(a:hover) {
  color: #2563eb;
}

.answer-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.answer-content :deep(th),
.answer-content :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.answer-content :deep(th) {
  background-color: #f3f4f6;
  font-weight: 600;
}

/* 思考过程 */
.thinking-box {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #7dd3fc;
}

.thinking-header .icon {
  font-size: 24px;
}

.thinking-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e40af;
}

.thinking-content {
  color: #1e3a8a;
  font-size: 15px;
  line-height: 1.7;
  font-style: italic;
  background: rgba(255, 255, 255, 0.7);
  padding: 1rem;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

/* 参考来源 */
.references-box {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #bbf7d0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.references-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #86efac;
}

.references-header .icon {
  font-size: 24px;
}

.references-header h3 {
  margin: 0;
  font-size: 18px;
  color: #047857;
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reference-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s;
}

.reference-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reference-card.selected {
  border: 2px solid #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
}

.ref-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.ref-id {
  background: #6b7280;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.ref-filename {
  font-weight: 600;
  color: #065f46;
  font-size: 15px;
  flex: 1;
}

.selected-badge {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.ref-scores {
  display: flex;
  gap: 1rem;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 0.75rem;
  font-style: italic;
  flex-wrap: wrap;
}

.can-answer {
  color: #059669;
  font-weight: 600;
}

.cannot-answer {
  color: #dc2626;
  font-weight: 600;
}

.ref-text {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.key-passage {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  padding: 1rem;
  margin-top: 0.75rem;
  border-radius: 8px;
}

.passage-label {
  font-weight: 600;
  color: #b45309;
  margin-bottom: 0.5rem;
  font-size: 13px;
}

.passage-text {
  font-size: 13px;
  color: #92400e;
  line-height: 1.6;
}

/* 反馈按钮 */
.feedback-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.feedback-btn {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0.75rem 1.5rem;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.like-btn:hover:not(:disabled) {
  background: #dcfce7;
  border-color: #10b981;
  color: #065f46;
}

.dislike-btn:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.feedback-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  font-size: 22px;
  color: #374151;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #e5e7eb;
  color: #374151;
}

.btn-cancel:hover {
  background: #d1d5db;
}

.btn-submit {
  background: linear-gradient(45deg, #2563eb, #1e3a8a);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 滚动到反馈按钮 */
.scroll-to-feedback {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #f59e0b;
  color: white;
  border-radius: 50px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  animation: bounce 2s ease-in-out infinite;
  z-index: 100;
}

.scroll-to-feedback:hover {
  animation-play-state: paused;
  background: #d97706;
  transform: translateY(-2px);
}

.scroll-to-feedback span {
  font-size: 14px;
  font-weight: 600;
}

.arrow {
  font-size: 12px;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .page-title {
    font-size: 32px;
  }

  .input-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-left {
    flex-direction: column;
    align-items: stretch;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
