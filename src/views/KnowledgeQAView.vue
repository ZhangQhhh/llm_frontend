<template>
  <div class="qa-page">
    <el-container class="main-container">
      <!-- 头部区域 -->
      <el-header class="page-header">
        <div class="brand">
          <div class="logo-icon">
            <img src="@/assets/allPic/public/4.png" alt="Logo" class="logo-image" />
          </div>
          <div class="brand-text">
            <h1>边检知识问答助手</h1>
            <p>Intelligent Border Inspection Knowledge Assistant</p>
          </div>
        </div>
      </el-header>

      <el-main>
        <div class="content-wrapper">
          <!-- 搜索/输入区域 -->
          <el-card class="search-card glass-effect" :body-style="{ padding: '0' }">
            <div class="input-area">
              <el-input
                v-model="question"
                type="textarea"
                :rows="4"
                placeholder="请输入您的业务问题，例如：'外籍人员入境签证办理流程是什么？'"
                resize="none"
                class="custom-textarea"
                @keydown.enter.exact.prevent="handleSubmit"
                :disabled="loading"
              />
              <div class="input-footer">
                <div class="controls-area">
                  <el-select v-model="modelId" placeholder="选择模型" class="control-item" style="width: 160px">
                    <template #prefix><el-icon><Cpu /></el-icon></template>
                    <el-option label="Qwen-32B (通用)" value="qwen3-32b" />
                    <el-option label="Qwen-Max (增强)" value="qwen2025" />
                    <el-option label="DeepSeek-R1 (深度)" value="deepseek" />
                    <el-option label="DeepSeek-32B (快速)" value="deepseek-32b" />
                  </el-select>
                  
                  <el-tooltip content="设置检索参考文档的数量" placement="top">
                    <div class="control-item setting-item">
                      <span class="label">参考数</span>
                      <el-input-number v-model="rerankTopN" :min="1" :max="20" size="small" controls-position="right" style="width: 90px" />
                    </div>
                  </el-tooltip>

                  <div class="toggles">
                    <el-checkbox v-model="insertBlock" border size="default">
                      <span class="toggle-label"><el-icon><Aim /></el-icon> 精准检索</span>
                    </el-checkbox>
                    <el-checkbox v-model="thinkingMode" border size="default">
                      <span class="toggle-label"><el-icon><Operation /></el-icon> 思考模式</span>
                    </el-checkbox>
                  </div>
                </div>

                <el-button 
                  type="primary" 
                  :loading="loading" 
                  round 
                  class="submit-btn" 
                  @click="handleSubmit"
                  :disabled="!question.trim()"
                >
                  {{ loading ? '分析中...' : '立即提问' }} 
                  <el-icon class="el-icon--right"><Promotion /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 检索进度条 -->
          <transition name="el-zoom-in-top">
            <div v-if="showProgress" class="progress-card glass-effect">
              <div class="progress-header">
                <span class="progress-title">
                  <el-icon class="is-loading"><Loading /></el-icon> 
                  正在进行深度检索分析...
                </span>
                <span class="progress-value">{{ progressInfo.percentage }}%</span>
              </div>
              <el-progress 
                :percentage="progressInfo.percentage" 
                :stroke-width="10" 
                striped 
                striped-flow 
                :show-text="false"
                color="#409eff"
              />
              <div class="progress-status">{{ progressMessage }}</div>
            </div>
          </transition>

          <!-- 结果区域 -->
          <div v-if="loading || answer || references.length > 0" class="result-area">
            <!-- 回答与思考 -->
            <div class="answer-section">
              <!-- 思考过程 -->
                <transition name="el-fade-in">
                  <div v-if="thinking && thinkingMode" class="thinking-section mb-4">
                    <el-collapse v-model="activeThinking">
                      <el-collapse-item name="1">
                        <template #title>
                          <div class="thinking-header">
                            <el-icon class="is-loading" v-if="loading"><Connection /></el-icon>
                            <el-icon v-else><Sunny /></el-icon>
                            <span class="ml-2">AI 深度思考过程</span>
                          </div>
                        </template>
                        <div class="thinking-content custom-scrollbar">
                          <div class="thinking-text">{{ thinking }}</div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </transition>

                <!-- 最终回答 -->
                <el-card class="answer-card glass-effect" :body-style="{ padding: '0' }">
                  <div class="card-header">
                    <div class="title">
                      <el-icon><ChatDotRound /></el-icon> 智能回答
                    </div>
                    <div class="actions" v-if="!loading">
                      <el-tooltip content="复制回答" placement="top">
                        <el-button circle size="small" @click="copyAnswer">
                          <el-icon><CopyDocument /></el-icon>
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                  
                  <div class="answer-body">
                    <div v-if="loading && !answer && !thinking" class="loading-placeholder">
                      <div class="loading-hint">
                        <div class="spinner-small"></div>
                        <span>AI正在思考中...</span>
                      </div>
                    </div>
                    <div v-else-if="answer" class="markdown-body" v-html="renderMarkdown(answer)"></div>
                  </div>

                  <!-- 底部反馈 -->
                  <div class="answer-footer" v-if="answer && !loading">
                     <div class="feedback-group">
                        <span class="feedback-label">回答是否有帮助？</span>
                        <el-button-group>
                          <el-button 
                            :type="feedbackSubmitted ? 'success' : 'default'" 
                            size="small" 
                            @click="handleLike" 
                            :disabled="feedbackSubmitted"
                            plain
                          >
                            <el-icon><Select /></el-icon> 有帮助
                          </el-button>
                          <el-button 
                            :type="feedbackSubmitted ? 'danger' : 'default'" 
                            size="small" 
                            @click="openFeedbackModal" 
                            :disabled="feedbackSubmitted"
                            plain
                          >
                            <el-icon><CloseBold /></el-icon> 没帮助
                          </el-button>
                        </el-button-group>
                     </div>
                  </div>
                </el-card>
            </div>

            <!-- 参考资料与元数据 -->
            <div class="metadata-section">
                <!-- 关键词 -->
                <transition name="el-zoom-in-top">
                  <el-card v-if="keywords && (keywords.question.length || keywords.document.length)" class="meta-card glass-effect mb-4">
                    <template #header>
                      <div class="meta-header">
                        <div class="left">
                           <el-icon><Key /></el-icon> <span>关键词提取</span>
                        </div>
                      </div>
                    </template>
                    <div class="keywords-container">
                       <div v-if="keywords.question.length" class="keyword-group">
                         <span class="group-label">问题:</span>
                         <div class="tags">
                           <el-tag v-for="(k, i) in keywords.question" :key="'q'+i" size="small" effect="plain" class="custom-tag">{{ k }}</el-tag>
                         </div>
                       </div>
                       <div v-if="keywords.document.length" class="keyword-group mt-2">
                         <span class="group-label">文档:</span>
                         <div class="tags">
                           <el-tag v-for="(k, i) in keywords.document" :key="'d'+i" size="small" type="info" effect="plain" class="custom-tag">{{ k }}</el-tag>
                         </div>
                       </div>
                    </div>
                  </el-card>
                </transition>

                <!-- 问题分解 -->
                <transition name="el-zoom-in-top">
                  <el-card v-if="subQuestions && subQuestions.sub_answers && subQuestions.sub_answers.length" class="meta-card glass-effect mb-4">
                    <template #header>
                      <div class="meta-header">
                        <div class="left">
                           <el-icon><Share /></el-icon> <span>问题分解</span>
                        </div>
                      </div>
                    </template>
                    <el-timeline>
                      <el-timeline-item
                        v-for="(item, index) in subQuestions.sub_answers"
                        :key="index"
                        :type="'primary'"
                        :hollow="true"
                      >
                        <h4 class="sub-q-title">{{ item.sub_question }}</h4>
                        <p class="sub-q-answer">{{ item.answer }}</p>
                      </el-timeline-item>
                    </el-timeline>
                  </el-card>
                </transition>

                <!-- 参考文献 -->
                <el-card v-if="references.length" class="meta-card glass-effect references-card">
                  <template #header>
                    <div class="meta-header">
                      <div class="left">
                        <el-icon><Document /></el-icon> <span>参考来源</span>
                      </div>
                      <el-tag size="small" effect="dark" round>{{ filteredReferences.length }}</el-tag>
                    </div>
                  </template>
                  
                  <el-scrollbar max-height="500px">
                    <div class="references-list">
                      <div 
                        v-for="(ref, idx) in filteredReferences" 
                        :key="idx" 
                        class="reference-item"
                        :class="{ 'is-selected': ref.canAnswer }"
                      >
                        <div class="ref-head">
                          <span class="ref-index">#{{ ref.id }}</span>
                          <el-tooltip :content="ref.fileName" placement="top">
                            <span class="ref-name">{{ ref.fileName }}</span>
                          </el-tooltip>
                          <el-tag v-if="ref.canAnswer" type="success" size="small" effect="dark">引用</el-tag>
                        </div>
                        <!-- 检索来源标签 -->
                        <div v-if="ref.retrievalSources && ref.retrievalSources.length" class="ref-sources">
                          <el-tag
                            v-for="(source, idx) in ref.retrievalSources"
                            :key="idx"
                            size="small"
                            :type="source === 'vector' ? 'primary' : 'success'"
                            effect="dark"
                          >
                            {{ source === 'vector' ? ' 向量检索' : ' 关键词检索' }}
                          </el-tag>
                        </div>
                        
                        <div class="ref-scores">
                          <el-tag v-if="ref.initialScore !== undefined && ref.initialScore !== 0" size="small" type="info" effect="plain">
                            初始: {{ typeof ref.initialScore === 'number' ? ref.initialScore.toFixed(3) : ref.initialScore }}
                          </el-tag>
                          <el-tag v-if="ref.rerankedScore !== undefined && ref.rerankedScore !== 0" size="small" type="warning" effect="plain">
                            重排: {{ typeof ref.rerankedScore === 'number' ? ref.rerankedScore.toFixed(3) : ref.rerankedScore }}
                          </el-tag>
                          <el-tag v-if="ref.vectorScore !== undefined && ref.vectorScore !== 0" size="small" type="info" effect="plain">
                            向量: {{ typeof ref.vectorScore === 'number' ? ref.vectorScore.toFixed(4) : ref.vectorScore }}
                            <span v-if="ref.vectorRank">(#{{ ref.vectorRank }})</span>
                          </el-tag>
                          <el-tag v-if="ref.bm25Score !== undefined && ref.bm25Score !== 0" size="small" type="success" effect="plain">
                            BM25: {{ typeof ref.bm25Score === 'number' ? ref.bm25Score.toFixed(4) : ref.bm25Score }}
                            <span v-if="ref.bm25Rank">(#{{ ref.bm25Rank }})</span>
                          </el-tag>
                          <el-tag v-if="ref.isHidden" size="small" type="danger" effect="plain">隐藏</el-tag>
                        </div>
                        
                        <!-- 匹配关键词 -->
                        <div v-if="ref.matchedKeywords && ref.matchedKeywords.length" class="ref-keywords">
                          <span class="keywords-label">🏷️ 匹配关键词:</span>
                          <el-tag
                            v-for="(keyword, idx) in ref.matchedKeywords"
                            :key="idx"
                            size="small"
                            type="warning"
                            effect="plain"
                          >
                            {{ keyword }}
                          </el-tag>
                        </div>
                        <div class="ref-content-wrapper">
                          <div class="ref-content" :class="{ 'expanded': ref.expanded }">{{ ref.content }}</div>
                          <el-button 
                            text 
                            type="primary" 
                            size="small" 
                            class="expand-btn"
                            @click="toggleRefExpand(idx)"
                          >
                            {{ ref.expanded ? '收起' : '展开全文' }}
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </el-scrollbar>
                </el-card>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- 反馈模态框 -->
    <el-dialog
      v-model="showFeedbackModal"
      title="提交反馈"
      width="500px"
      class="feedback-dialog"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="错误原因 (必填)" required>
          <el-input
            v-model="feedbackReason"
            type="textarea"
            :rows="3"
            placeholder="请具体描述回答中的错误或问题..."
          />
        </el-form-item>
        <el-form-item label="反映人">
           <el-input v-model="reporterName" disabled />
        </el-form-item>
        <el-form-item label="反映单位">
           <el-input v-model="reporterUnit" placeholder="请输入您的单位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showFeedbackModal = false">取消</el-button>
          <el-button type="primary" @click="handleDislikeSubmit" :loading="submittingFeedback">
            提交反馈
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import {
   Cpu, Aim, Operation, Promotion, Loading, Connection,
  ChatDotRound, CopyDocument, Select, CloseBold, Key, Share, Document,
  Sunny
} from '@element-plus/icons-vue';
import {
  sendStreamChatRequest,
  submitLikeFeedback,
  submitDislikeFeedback,
  type ReferenceSource,
  type StreamMessage,
  type KeywordsData
} from '@/utils/chatApi';
import { API_ENDPOINTS, SHOW_HIDDEN_NODES } from '@/config/api/api';
import { 
  isStatusMessage, 
  isProgressMessage, 
  parseProgressMessage, 
  isPreciseRetrievalStart, 
  parsePreciseRetrievalStart,
  type ProgressInfo 
} from '@/utils/htmlUtils';
import {
  getMockAnswer,
  getMockReferences,
  getMockThinking,
  getMockSubQuestions,
  shouldUseReferenceMocks,
  type SubQuestionsData
} from '@/mocks/referenceMocks';
import { renderMarkdown } from '@/utils/markdown';

export default defineComponent({
  name: 'KnowledgeQAView',
  components: {
     Cpu, Aim, Operation, Promotion, Loading, Connection,
    ChatDotRound, CopyDocument, Select, CloseBold, Key, Share, Document,
    Sunny
  },
  setup() {
    const store = useStore();

    // 状态
    const question = ref('');
    const answer = ref('');
    const thinking = ref('');
    const references = ref<ReferenceSource[]>([]);
    const activeThinking = ref(['1']); // 默认展开思考
    
    // 过滤后的参考文献（根据环境变量决定是否显示隐藏节点）
    const filteredReferences = computed(() => {
      if (SHOW_HIDDEN_NODES) {
        return references.value;
      }
      return references.value.filter(ref => !ref.isHidden);
    });
    const subQuestions = ref<SubQuestionsData | null>(null);
    const keywords = ref<KeywordsData | null>(null);
    const loading = ref(false);

    // 进度条状态
    const showProgress = ref(false);
    const progressInfo = ref<ProgressInfo>({ current: 0, total: 0, percentage: 0 });
    const progressMessage = ref('');

    // 配置
    const modelId = ref('deepseek');
    const rerankTopN = ref(10);
    const thinkingMode = ref(true);
    const insertBlock = ref(false);

    // 反馈相关
    const feedbackSubmitted = ref(false);
    const showFeedbackModal = ref(false);
    const feedbackReason = ref('');
    const reporterName = ref(store.state.user.username || ''); 
    const reporterUnit = ref('');
    const submittingFeedback = ref(false);

    const lastQuestion = ref('');
    const lastAnswer = ref('');

    const mockReferencesEnabled = shouldUseReferenceMocks();

    const applyReferenceMocks = () => {
      references.value = getMockReferences();
      if (!answer.value) {
        answer.value = getMockAnswer();
      }
      if (!thinking.value) {
        thinking.value = getMockThinking();
      }
      if (!subQuestions.value) {
        subQuestions.value = getMockSubQuestions();
      }
    };

    onMounted(() => {
      if (mockReferencesEnabled) {
        applyReferenceMocks();
      }
    });

    // 复制回答
    const copyAnswer = async () => {
        if(!answer.value) return;
        try {
            await navigator.clipboard.writeText(answer.value);
            ElMessage.success('已复制到剪贴板');
        } catch(e) {
            ElMessage.error('复制失败');
        }
    };

    // 发送问题
    const handleSubmit = async () => {
      if (!question.value.trim() || loading.value) return;

      if (mockReferencesEnabled) {
        applyReferenceMocks();
        return;
      }

      lastQuestion.value = question.value.trim();
      answer.value = '';
      thinking.value = '';
      references.value = [];
      subQuestions.value = null;
      keywords.value = null;
      feedbackSubmitted.value = false;
      loading.value = true;
      activeThinking.value = ['1'];
      
      if (insertBlock.value) {
        showProgress.value = true;
        progressInfo.value = { current: 0, total: 0, percentage: 0 };
        progressMessage.value = '正在准备精准检索...';
      } else {
        showProgress.value = false;
        progressInfo.value = { current: 0, total: 0, percentage: 0 };
        progressMessage.value = '';
      }

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

        lastAnswer.value = thinking.value
          ? `<think>${thinking.value}</think>\n${answer.value}`
          : answer.value;
      } catch (error: any) {
        answer.value = `请求失败: ${error.message}`;
        ElMessage.error(`请求失败: ${error.message}`);
      } finally {
        loading.value = false;
        showProgress.value = false;
      }
    };

    // 处理流式消息
    const handleStreamMessage = (message: StreamMessage) => {
      if (mockReferencesEnabled) return;
      
      switch (message.type) {
        case 'THINK':
          thinking.value = thinking.value + message.data;
          break;

        case 'CONTENT':
          if (isPreciseRetrievalStart(message.data)) {
            const total = parsePreciseRetrievalStart(message.data);
            if (total) {
              showProgress.value = true;
              progressInfo.value = { current: 0, total, percentage: 0 };
              progressMessage.value = '正在启动精准检索...';
            }
          }
          else if (isProgressMessage(message.data)) {
            const progress = parseProgressMessage(message.data);
            if (progress) {
              progressInfo.value = progress;
              progressMessage.value = `正在分析文档 ${progress.current}/${progress.total}`;
            }
          }
          else if (!isStatusMessage(message.data)) {
            answer.value = answer.value + message.data;
          }
          break;

        case 'SOURCE':
          try {
            const source = JSON.parse(message.data) as ReferenceSource;
            references.value.push(source);
          } catch (e) {
            console.error('解析SOURCE失败', e);
          }
          break;

        case 'SUB_QUESTIONS':
          try {
            const subQuestionsData = JSON.parse(message.data) as SubQuestionsData;
            subQuestions.value = subQuestionsData;
          } catch (e) {
             console.error('解析SUB_QUESTIONS失败', e);
          }
          break;

        case 'KEYWORDS':
          try {
            const keywordsData = JSON.parse(message.data) as KeywordsData;
            keywords.value = keywordsData;
          } catch (e) {
             console.error('解析KEYWORDS失败', e);
          }
          break;

        case 'ERROR':
          answer.value = `错误: ${message.data}`;
          ElMessage.error(message.data);
          break;

        case 'DONE':
          loading.value = false;
          showProgress.value = false;
          break;
      }
    };

    const handleLike = async () => {
      try {
        await submitLikeFeedback(lastQuestion.value, lastAnswer.value, modelId.value, 'LIKE', references.value);
        feedbackSubmitted.value = true;
        ElMessage.success('感谢您的反馈！');
      } catch (error: any) {
        ElMessage.error(`提交反馈失败: ${error.message}`);
      }
    };

    const handleDislikeSubmit = async () => {
      if (!feedbackReason.value.trim()) {
        ElMessage.warning('请填写具体的错误原因');
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
        ElMessage.success('反馈提交成功，感谢您！');
        feedbackReason.value = '';
        reporterUnit.value = '';
      } catch (error: any) {
        ElMessage.error(`提交反馈失败: ${error.message}`);
      } finally {
        submittingFeedback.value = false;
      }
    };

    const openFeedbackModal = () => {
      reporterName.value = store.state.user.username || '';
      showFeedbackModal.value = true;
    };

    // 切换参考来源展开/收起
    const toggleRefExpand = (index: number) => {
      const ref = references.value[index];
      if (ref) {
        ref.expanded = !ref.expanded;
      }
    };

    return {
      question, answer, thinking, references, filteredReferences, subQuestions, keywords,
      loading, modelId, rerankTopN, thinkingMode, insertBlock,
      feedbackSubmitted, showFeedbackModal, feedbackReason, reporterName, reporterUnit, submittingFeedback,
      showProgress, progressInfo, progressMessage, activeThinking,
      handleSubmit, handleLike, handleDislikeSubmit, openFeedbackModal,
      renderMarkdown, copyAnswer, toggleRefExpand
    };
  }
});
</script>

<style scoped>
.qa-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/wide_bac.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding-bottom: 2rem;
  background-position: center center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 为竖向图片添加渐变遮罩，确保文字可读性 */
.qa-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
  z-index: 1;
}

.main-container {
  position: relative;
  z-index: 2;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
  padding-top: 0;
  width: 100%;
}

/* Content Wrapper */
.content-wrapper {
  width: 100%;
  max-width: 1400px;
}

/* Result Area */
.result-area {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.answer-section {
  width: 100%;
}

.metadata-section {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.logo-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  background: white;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-text h1 {
  font-size: 2.2rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.brand-text p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.25rem 0 0 0;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* Glass Effect */
.glass-effect {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px !important;
}

/* Search Card */
.search-card {
  margin-bottom: 2rem;
  overflow: visible;
  max-width: 900px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.input-area {
  padding: 1rem;
}

.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 12px;
  padding: 0.75rem;
  font-size: 15px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
  min-height: 60px;
}

.custom-textarea :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.controls-area {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-item {
  background: rgba(241, 245, 249, 0.8);
  padding: 4px 8px;
  border-radius: 8px;
}

.setting-item .label {
  font-size: 12px;
  color: #64748b;
  margin-right: 6px;
}

.toggles {
  display: flex;
  gap: 1rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.submit-btn {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border: none;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: all 0.3s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

/* Progress Card */
.progress-card {
  padding: 1.5rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.95) !important;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-title {
  font-weight: 600;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-value {
  font-weight: 700;
  color: #3b82f6;
}

.progress-status {
  text-align: center;
  font-size: 13px;
  color: #64748b;
  margin-top: 0.5rem;
}

/* Result Area */
.thinking-section {
  margin-bottom: 1.5rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.thinking-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #6366f1;
}

.thinking-content {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  border: 1px dashed #cbd5e1;
}

.thinking-text {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 14px;
  color: #475569;
  white-space: pre-wrap;
  line-height: 1.6;
}

.custom-scrollbar {
  max-height: 300px;
  overflow-y: auto;
}

/* Answer Card */
.answer-card {
  min-height: 200px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.answer-card .card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
}

.answer-card .card-header .title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.answer-body {
  padding: 2rem;
}

.markdown-body {
  font-size: 16px;
  line-height: 1.8;
  color: #334155;
}

.markdown-body :deep(p) {
  margin-bottom: 1rem;
}

.answer-footer {
  padding: 1rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

.feedback-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feedback-label {
  font-size: 13px;
  color: #64748b;
}

/* Meta Cards (Right Side) */
.meta-card {
  border: none !important;
  margin-bottom: 1.5rem;
}

.meta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #334155;
}

.meta-header .left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.keywords-container {
  padding: 0.5rem 0;
}

.group-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 4px;
  display: block;
  text-transform: uppercase;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.custom-tag {
  border-radius: 6px;
  font-weight: 500;
}

/* Sub-questions */
.sub-q-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.sub-q-answer {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

/* References List */
.references-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 0.5rem;
}

.reference-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.reference-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.reference-item.is-selected {
  border-left: 3px solid #10b981;
  background: #f0fdf4;
}

.ref-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.ref-index {
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.ref-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  color: #6b7280;
  justify-content: center;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ref-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.ref-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.ref-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.keywords-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.ref-content-wrapper {
  position: relative;
}

.ref-content {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: all 0.3s ease;
}

.ref-content.expanded {
  display: block;
  -webkit-line-clamp: unset;
  line-clamp: unset;
  max-height: none;
}

.expand-btn {
  margin-top: 0.5rem;
  padding: 0;
  height: auto;
  font-size: 12px;
}

/* Markdown Styles (Minimal override for brevity, assuming main styles exist or are handled by utility) */
.markdown-body :deep(pre) {
  background: #1e293b;
  color: #f1f5f9;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  color: #dc2626;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .input-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls-area {
    flex-direction: column;
    align-items: stretch;
  }

  .control-item {
    width: 100% !important;
  }

  .submit-btn {
    width: 100%;
  }
}

@media (max-width: 1024px) {
  .qa-page {
    background-size: cover;
    background-position: 25% 45%;
  }
}

@media (max-width: 768px) {
  .qa-page {
    background-size: cover;
    background-position: 20% 40%;
    background-attachment: scroll; /* 移动设备禁用fixed背景 */
    align-items: flex-start;
    padding-top: 2rem;
  }
  
  .qa-page::before {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.4) 100%);
  }
  
  .main-container {
    justify-content: flex-start;
  }
}
</style>
