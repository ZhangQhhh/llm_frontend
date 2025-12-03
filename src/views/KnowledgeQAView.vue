<template>
  <div class="qa-page ai-tech-theme">
    <!-- 科技感AI背景效果 -->
    <div class="ai-bg">
      <!-- 星空粒子背景 -->
      <div class="stars-layer"></div>
      <!-- 科技网格 -->
      <div class="tech-grid"></div>
      <!-- 光效装饰 -->
      <div class="glow-orb glow-orb-1"></div>
      <div class="glow-orb glow-orb-2"></div>
      <div class="glow-orb glow-orb-3"></div>
      <!-- 扫描线 -->
      <div class="scan-line"></div>
      <!-- 边框装饰线 -->
      <div class="border-line border-top"></div>
      <div class="border-line border-bottom"></div>
      <!-- 角落装饰 -->
      <div class="corner-decor corner-tl"></div>
      <div class="corner-decor corner-tr"></div>
      <div class="corner-decor corner-bl"></div>
      <div class="corner-decor corner-br"></div>
      
      <!-- AI机器人背景图 -->
      <div class="robot-bg">
        <div class="robot-glow"></div>
        <div class="robot-image"></div>
        <div class="robot-scan-line"></div>
      </div>
    </div>
    <el-container class="main-container">
      <!-- 头部区域 -->
      <el-header class="page-header">
        <div class="brand">
          <!-- AI机器人图标区域 -->
          <div class="ai-avatar">
            <div class="avatar-ring"></div>
            <div class="avatar-core">
              <img src="@/assets/allPic/public/4.png" alt="AI" class="ai-logo" />
            </div>
            <div class="avatar-pulse"></div>
          </div>
          <div class="brand-text">
            <div class="title-wrapper">
              <span class="title-prefix">智能</span>
              <h1>业务问答</h1>
            </div>
            <p class="subtitle">INTELLIGENT BORDER INSPECTION Q&A SYSTEM</p>
            <div class="status-bar">
              <span class="status-dot"></span>
              <span class="status-text">AI引擎运行中</span>
            </div>
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
                :rows="6"
                :placeholder="mcqMode ? '请输入您的问题，选择题格式如下：\n题干\nA.选项A\nB.选项B\nC.选项C\nD.选项D' : '请输入您的业务问题，例如：\u2018外籍人员入境签证办理流程是什么？\u2019'"
                resize="none"
                class="custom-textarea"
                @keydown.enter.exact.prevent="handleSubmit"
                :disabled="loading"
              />
              <div class="input-footer">
                <div class="controls-area">
                  <el-select v-model="modelId" placeholder="选择模型" class="model-select">
                    <template #prefix><el-icon><Cpu /></el-icon></template>
                    <el-option label="Qwen (通用)" value="qwen3-32b" />
                    <el-option label="Qwen (增强)" value="qwen2025" />
                    <el-option label="DeepSeek-R1" value="deepseek" />
                    <!-- <el-option label="DeepSeek-32B (快速)" value="deepseek-32b" /> -->
                  </el-select>

                  <el-tooltip content="设置检索参考文档的数量" placement="top">
                    <div class="control-item setting-item">
                      <span class="label">参考数</span>
                      <el-input-number v-model="rerankTopN" :min="1" :max="20" size="small" controls-position="right" style="width: 80px" />
                    </div>
                  </el-tooltip>

                  <div class="toggles">
                    <el-checkbox v-model="insertBlock" border size="default">
                      <span class="toggle-label"><el-icon><Aim /></el-icon> 精准检索</span>
                    </el-checkbox>
                    <el-checkbox v-model="thinkingMode" border size="default">
                      <span class="toggle-label"><el-icon><Operation /></el-icon> 思考模式</span>
                    </el-checkbox>
                    <el-checkbox v-model="mcqMode" border size="default" @change="handleMcqModeChange">
                      <span class="toggle-label"><el-icon><Document /></el-icon> 选择题模式</span>
                    </el-checkbox>

                    <!-- 策略选择下拉框，仅在选择题模式开启时显示 -->
                    <transition name="el-fade-in-linear">
                      <el-select
                        v-if="mcqMode"
                        v-model="mcqStrategy"
                        placeholder="选择策略"
                        class="mcq-strategy-select"
                        size="default"
                      >
                        <template #prefix>
                          <el-icon><Setting /></el-icon>
                        </template>
                        <el-option label="模型自动判断" value="auto">
                          <span style="float: left">模型自动判断</span>
                          <span style="float: right; color: #8492a6; font-size: 13px">🤖 推荐</span>
                        </el-option>
                        <el-option label="简单查找策略" value="SIMPLE_LOOKUP">
                          <span style="float: left">简单查找策略</span>
                          <span style="float: right; color: #8492a6; font-size: 13px"></span>
                        </el-option>
                        <el-option label="复杂验证策略" value="COMPLEX_VALIDATION">
                          <span style="float: left">复杂验证策略</span>
                          <span style="float: right; color: #8492a6; font-size: 13px"></span>
                        </el-option>
                      </el-select>
                    </transition>
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
          <div v-if="loading || answer || references.length > 0 || mcqResults.length > 0" class="result-area">
            <!-- 回答与思考 -->
            <div class="answer-section">
              <!-- 思考过程 -->
                <transition name="el-fade-in">
                  <div v-if="(loading || thinking) && thinkingMode && !(mcqMode && mcqResults.length > 0)" class="thinking-section mb-4">
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
                          <div v-if="!thinking && loading" class="thinking-placeholder">
                            <div class="spinner-small"></div>
                            <span>正在深度思考中...</span>
                          </div>
                          <div v-else class="thinking-text">{{ thinking }}</div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </transition>

                <!-- 最终回答 -->
                <el-card v-if="!(mcqMode && mcqResults.length > 0)" class="answer-card glass-effect" :body-style="{ padding: '0' }">
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

                  <div class="answer-body" ref="answerBodyRef">
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

            <!-- 选择题多选项结果标签页，仅在选择题模式且使用COMPLEX_VALIDATION策略时显示 -->
            <transition name="el-fade-in">
              <el-card v-if="mcqMode && mcqResults.length > 0" class="mcq-results-card glass-effect" :body-style="{ padding: '0' }">
                <div class="card-header">
                  <div class="title">
                    <el-icon><Document /></el-icon> 选项验证结果
                  </div>
                </div>
                <el-tabs v-model="activeTab" type="card" class="mcq-tabs">
                  <el-tab-pane v-for="(result, index) in mcqResults" :key="index" :label="result.optionLabel" :name="String(index)">
                    <div class="tab-content">
                      <div class="option-question">
                        <strong>问题：</strong> {{ result.question }}
                      </div>
                      <div class="option-answer">
                        <strong>候选答案：</strong> {{ result.option }}
                      </div>
                      <el-divider />
                      <div class="option-result">
                        <div v-if="result.loading && !result.answer" class="loading-placeholder">
                          <div class="loading-hint">
                            <div class="spinner-small"></div>
                            <span>正在验证选项 {{ result.optionLabel }}...</span>
                          </div>
                        </div>
                        <div v-if="result.answer" class="markdown-body" v-html="renderMarkdown(result.answer)"></div>
                        <div v-if="result.loading && result.answer" class="streaming-indicator">
                          <div class="spinner-small" style="margin-top: 10px;"></div>
                          <span style="font-size: 12px; color: #666;">流式输出中...</span>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </el-card>
            </transition>

            <!-- 参考资料与元数据 -->
            <div v-if="!(mcqMode && mcqResults.length > 0)" class="metadata-section">
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
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import {
   Cpu, Aim, Operation, Promotion, Loading, Connection,
    ChatDotRound, CopyDocument, Select, CloseBold, Key, Share, Document,
    Sunny, Setting
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
    Sunny, Setting
  },
  setup() {
    const store = useStore();

    // 状态
    const question = ref('');
    const answer = ref('');
    const thinking = ref('');
    const references = ref<ReferenceSource[]>([]);
    const activeThinking = ref(['1']); // 默认展开思考
    const answerBodyRef = ref<HTMLElement | null>(null);
    const autoScrollEnabled = ref(true); // 自动滚动开关

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
    const mcqMode = ref(false);  // 选择题模式开关
    const mcqStrategy = ref('auto');  // 策略选择：auto(自动判断)、SIMPLE_LOOKUP、COMPLEX_VALIDATION
    const mcqResults = ref<any[]>([]);  // 存储每个选项的结果
    const activeTab = ref('0');  // 当前激活的标签页

    // 监听选择题模式切换
    const handleMcqModeChange = (val: boolean) => {
      if (!val) {
        // 关闭选择题模式时清空相关结果
        mcqResults.value = [];
        activeTab.value = '0';
        mcqStrategy.value = 'auto';  // 重置策略为自动判断
      }
    };

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

    // 模拟流式输出效果
    const simulateStreamOutput = async (text: string, targetRef: typeof answer | typeof thinking, delay = 30) => {
      const chars = text.split('');
      for (let i = 0; i < chars.length; i++) {
        targetRef.value += chars[i];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    };

    const applyReferenceMocks = async () => {
      // 设置 loading 状态
      loading.value = true;
      answer.value = '';
      thinking.value = '';
      autoScrollEnabled.value = true;  // 重置自动滚动
      
      // 模拟流式输出思考过程
      const mockThinking = getMockThinking();
      if (thinkingMode.value && mockThinking) {
        await simulateStreamOutput(mockThinking, thinking, 15);
      }
      
      // 模拟流式输出回答
      const mockAnswer = getMockAnswer();
      if (mockAnswer) {
        await simulateStreamOutput(mockAnswer, answer, 20);
      }
      
      // 设置参考文献
      references.value = getMockReferences();
      subQuestions.value = getMockSubQuestions();
      
      loading.value = false;
    };


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

    // 解析选择题格式
    const parseMCQ = (text: string): { stem: string; options: { [key: string]: string } } | null => {
      const lines = text.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) return null;

      const stem = lines[0].trim();
      const options: { [key: string]: string } = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        const match = line.match(/^([A-D])[.\uff0e、\s]+(.+)$/);
        if (match) {
          options[match[1]] = match[2].trim();
        }
      }

      return Object.keys(options).length > 0 ? { stem, options } : null;
    };

    // 调用策略判断API
    const callStrategyAPI = async (stem: string, options: { [key: string]: string }): Promise<string> => {
      try {
        // 使用配置文件中的MCQ策略判断端点
        const apiUrl = API_ENDPOINTS.KNOWLEDGE.MCQ_STRATEGY;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${store.state.user.token}`
          },
          body: JSON.stringify({ stem, options })
        });

        if (!response.ok) {
          throw new Error('策略判断请求失败');
        }

        const data = await response.json();
        return data.strategy || 'SIMPLE_LOOKUP';
      } catch (error) {
        console.error('策略判断失败:', error);
        // 默认使用SIMPLE_LOOKUP
        return 'SIMPLE_LOOKUP';
      }
    };

    // 处理选择题提问
    const handleMCQSubmit = async (mcqData: { stem: string; options: { [key: string]: string } }) => {
      // 获取策略（手动指定或自动判断）
      let strategy = mcqStrategy.value;
      if (strategy === 'auto') {
        ElMessage.info('正在智能判断题目策略...');
        strategy = await callStrategyAPI(mcqData.stem, mcqData.options);
        const strategyName = strategy === 'SIMPLE_LOOKUP' ? '简单查找策略' : '复杂验证策略';
        ElMessage.success(`已自动选择：${strategyName}`);
      } else {
        const strategyName = strategy === 'SIMPLE_LOOKUP' ? '简单查找策略' : '复杂验证策略';
        ElMessage.info(`使用指定策略：${strategyName}`);
      }

      if (strategy === 'SIMPLE_LOOKUP') {
        // SIMPLE_LOOKUP策略: 一次传入所有选项
        const formattedQuestion = `问题：${mcqData.stem}\n候选答案：\n` +
          Object.entries(mcqData.options)
            .map(([key, value]) => `${key}. ${value}`)
            .join('\n');

        question.value = formattedQuestion;
        mcqResults.value = [];  // 清空多标签页结果

        // 直接调用原来的发送逻辑
        await originalHandleSubmit();

      } else if (strategy === 'COMPLEX_VALIDATION') {
        // COMPLEX_VALIDATION策略: 分别处理每个选项
        mcqResults.value = [];
        
        // 设置全局loading状态以显示结果区域
        loading.value = true;
        answer.value = ''; // 清空旧答案
        references.value = []; // 清空旧引用

        // 为每个选项创建一个结果对象
        for (const [key, value] of Object.entries(mcqData.options)) {
          mcqResults.value.push({
            optionLabel: `选项 ${key}`,
            question: mcqData.stem,
            option: `${key}. ${value}`,
            answer: '',
            loading: true
          });
        }

        // 逐个处理每个选项
        const optionEntries = Object.entries(mcqData.options);
        for (let index = 0; index < optionEntries.length; index++) {
          const [key, value] = optionEntries[index];
          const formattedQuestion = `问题：${mcqData.stem}\n候选答案：\n${key}. ${value}`;

          // 修改当前标签页
          activeTab.value = String(index);

          // 发送请求
          try {
            await sendStreamChatRequest(
              API_ENDPOINTS.KNOWLEDGE.CHAT,
              {
                question: formattedQuestion,
                thinking: thinkingMode.value,
                rerank_top_n: rerankTopN.value,
                model_id: modelId.value,
                use_insert_block: insertBlock.value,
                insert_block_llm_id: modelId.value
              },
              store.state.user.token,
              ((currentIndex) => (message: StreamMessage) => {
                // 处理流式消息，使用闭包确保index正确
                if (message.type === 'CONTENT' && !isStatusMessage(message.data)) {
                  mcqResults.value[currentIndex].answer += message.data;
                } else if (message.type === 'DONE') {
                  mcqResults.value[currentIndex].loading = false;
                } else if (message.type === 'ERROR') {
                  mcqResults.value[currentIndex].answer = `错误: ${message.data}`;
                  mcqResults.value[currentIndex].loading = false;
                }
              })(index)
            );
          } catch (error: any) {
            mcqResults.value[index].answer = `请求失败: ${error.message}`;
            mcqResults.value[index].loading = false;
          }
        }
        
        // 所有选项处理完成后，设置全局loading为false
        loading.value = false;
      }
    };

    // 保存原始的handleSubmit函数
    const originalHandleSubmit = async () => {
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

    // 发送问题
    const handleSubmit = async () => {
      // 如果开启了选择题模式，尝试解析选择题
      if (mcqMode.value) {
        const mcqData = parseMCQ(question.value);
        if (mcqData) {
          await handleMCQSubmit(mcqData);
          return;
        } else {
          ElMessage.warning('输入格式不符合选择题格式，请按照标准格式输入');
          return;
        }
      }

      // 非选择题模式，使用原始逻辑
      if (!question.value.trim() || loading.value) return;

      if (mockReferencesEnabled) {
        await applyReferenceMocks();
        return;
      }

      lastQuestion.value = question.value.trim();
      answer.value = '';
      thinking.value = '';
      references.value = [];
      subQuestions.value = null;
      keywords.value = null;
      mcqResults.value = [];  // 清空选择题结果
      feedbackSubmitted.value = false;
      loading.value = true;
      activeThinking.value = ['1'];
      autoScrollEnabled.value = true;  // 重置自动滚动

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

    // 自动滚动到页面底部
    const autoScrollToBottom = () => {
      if (autoScrollEnabled.value && answerBodyRef.value) {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'auto'
        });
      }
    };

    // 监听用户滚动，如果用户向上滚动则禁用自动滚动
    let lastScrollTop = 0;
    const handleUserScroll = () => {
      const currentScrollTop = window.scrollY;
      // 如果用户向上滚动超过50px，禁用自动滚动
      if (currentScrollTop < lastScrollTop - 50) {
        autoScrollEnabled.value = false;
      }
      lastScrollTop = currentScrollTop;
    };

    // 监听 answer 和 thinking 变化，自动滚动
    watch([answer, thinking], () => {
      if (loading.value) {
        autoScrollToBottom();
      }
    });

    // 监听 mcqMode 变化
    onMounted(() => {
      // 监听选择题模式变化
      store.watch(
        () => mcqMode.value,
        (newVal) => handleMcqModeChange(newVal)
      );
      // 添加滚动监听
      window.addEventListener('wheel', handleUserScroll);
      window.addEventListener('touchmove', handleUserScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
    });

    return {
      question, answer, thinking, references, filteredReferences, subQuestions, keywords,
      loading, modelId, rerankTopN, thinkingMode, insertBlock, mcqMode, mcqStrategy, mcqResults, activeTab,
      feedbackSubmitted, showFeedbackModal, feedbackReason, reporterName, reporterUnit, submittingFeedback,
      showProgress, progressInfo, progressMessage, activeThinking, answerBodyRef,
      handleSubmit, handleLike, handleDislikeSubmit, openFeedbackModal,
      renderMarkdown, copyAnswer, toggleRefExpand, handleMcqModeChange
    };
  }
});
</script>

<style scoped>
/* ========== 国企AI科技感主题变量 ========== */
.ai-tech-theme {
  --ai-primary: #00b4ff;
  --ai-secondary: #6366f1;
  --ai-accent: #22d3ee;
  --ai-danger: #ef4444;
  --ai-success: #10b981;
  --ai-warning: #f59e0b;
  --ai-bg-dark: #0a1929;
  --ai-bg-card: rgba(10, 25, 50, 0.95);
  --ai-border: rgba(0, 180, 255, 0.3);
  --ai-glow: 0 0 30px rgba(0, 180, 255, 0.4);
  --ai-text: #e8f4fc;
  --ai-text-dim: #94a3b8;
  --ai-gradient: linear-gradient(135deg, #0a1929 0%, #0d2847 50%, #0a1929 100%);
}

.qa-page {
  min-height: 100vh;
  background: var(--ai-gradient);
  padding-bottom: 2rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ========== AI科技感背景效果 ========== */
.ai-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 星空粒子层 */
.stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(1px 1px at 10% 20%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 20% 50%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 30% 10%, rgba(0, 180, 255, 0.9), transparent),
    radial-gradient(1px 1px at 40% 80%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1.5px 1.5px at 50% 30%, rgba(99, 102, 241, 0.8), transparent),
    radial-gradient(1px 1px at 60% 70%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 70% 40%, rgba(0, 180, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 80% 90%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 90% 15%, rgba(99, 102, 241, 0.7), transparent),
    radial-gradient(1px 1px at 15% 85%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 25% 35%, rgba(0, 180, 255, 0.8), transparent),
    radial-gradient(1px 1px at 35% 65%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 45% 5%, rgba(99, 102, 241, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 55% 95%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 65% 25%, rgba(0, 180, 255, 0.5), transparent),
    radial-gradient(1px 1px at 75% 55%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 85% 75%, rgba(99, 102, 241, 0.7), transparent),
    radial-gradient(1px 1px at 95% 45%, rgba(255, 255, 255, 0.8), transparent);
  background-size: 100% 100%;
  animation: starsTwinkle 8s ease-in-out infinite;
}

@keyframes starsTwinkle {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* 科技网格 */
.tech-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 180, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 180, 255, 0.03) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%);
}

/* 光球效果 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: orbFloat 8s ease-in-out infinite;
}

.glow-orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 180, 255, 0.25) 0%, transparent 70%);
  top: -10%;
  left: -5%;
}

.glow-orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
  bottom: -10%;
  right: -5%;
  animation-delay: 2s;
}

.glow-orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
}

@keyframes orbFloat {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.1); }
}

/* 扫描线 */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 180, 255, 0.2) 20%, 
    rgba(0, 180, 255, 0.6) 50%, 
    rgba(0, 180, 255, 0.2) 80%, 
    transparent 100%);
  animation: scanMove 6s linear infinite;
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.4);
}

@keyframes scanMove {
  0% { top: -2px; opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

/* 边框装饰线 */
.border-line {
  position: absolute;
  left: 5%;
  right: 5%;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 180, 255, 0.5) 10%,
    rgba(0, 180, 255, 0.8) 50%,
    rgba(0, 180, 255, 0.5) 90%,
    transparent 100%);
}

.border-top {
  top: 60px;
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.3);
}

.border-bottom {
  bottom: 30px;
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.3);
}

/* 角落装饰 */
.corner-decor {
  position: absolute;
  width: 40px;
  height: 40px;
  border-color: var(--ai-primary);
  border-style: solid;
  border-width: 0;
}

.corner-tl {
  top: 55px;
  left: 4%;
  border-top-width: 2px;
  border-left-width: 2px;
}

.corner-tr {
  top: 55px;
  right: 4%;
  border-top-width: 2px;
  border-right-width: 2px;
}

.corner-bl {
  bottom: 25px;
  left: 4%;
  border-bottom-width: 2px;
  border-left-width: 2px;
}

.corner-br {
  bottom: 25px;
  right: 4%;
  border-bottom-width: 2px;
  border-right-width: 2px;
}

/* ========== AI机器人背景图 ========== */
.robot-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.robot-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/allPic/public/cybo.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  animation: robotBreath 8s ease-in-out infinite;
  filter: brightness(0.7) contrast(1.1);
}

@keyframes robotBreath {
  0%, 100% { transform: scale(1); filter: brightness(0.7) contrast(1.1); }
  50% { transform: scale(1.02); filter: brightness(0.75) contrast(1.15); }
}

.robot-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(0, 180, 255, 0.15) 0%, transparent 60%);
  filter: blur(60px);
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
}

.robot-scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, 
    transparent 0%, 
    rgba(0, 180, 255, 0.08) 50%, 
    transparent 51%);
  background-size: 100% 4px;
  animation: scanMove 4s linear infinite;
  opacity: 0.6;
}

@keyframes scanMove {
  0% { background-position: 0 -100%; }
  100% { background-position: 0 200%; }
}

/* 页面遮罩 */
.qa-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(10, 25, 41, 0.5) 100%);
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
  max-width: 1100px;
  margin: 0 auto;
}

/* ========== AI科技感品牌区域 ========== */
.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(0, 180, 255, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);
  border: 1px solid rgba(0, 180, 255, 0.2);
  border-radius: 16px;
  position: relative;
}

.brand::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ai-primary), transparent);
}

/* AI头像区域 */
.ai-avatar {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid var(--ai-primary);
  border-radius: 50%;
  animation: ringRotate 10s linear infinite;
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.3);
}

.avatar-ring::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--ai-primary);
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 10px var(--ai-primary);
}

@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.avatar-core {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0a1929 0%, #0d2847 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 180, 255, 0.5);
  overflow: hidden;
  z-index: 1;
}

.ai-logo {
  width: 85%;
  height: 85%;
  object-fit: cover;
  filter: drop-shadow(0 0 8px rgba(0, 180, 255, 0.5));
}

.avatar-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid var(--ai-primary);
  animation: pulseExpand 2s ease-out infinite;
  opacity: 0;
}

@keyframes pulseExpand {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* 品牌文字 */
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title-wrapper {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.title-prefix {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ai-accent);
  padding: 4px 12px;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 4px;
}

.brand-text h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ai-text);
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(0, 180, 255, 0.3);
}

.brand-text .subtitle {
  font-size: 0.75rem;
  color: var(--ai-text-dim);
  margin: 0;
  font-weight: 500;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: var(--ai-success);
  border-radius: 50%;
  animation: statusBlink 2s ease-in-out infinite;
  box-shadow: 0 0 8px var(--ai-success);
}

@keyframes statusBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 0.75rem;
  color: var(--ai-success);
  font-weight: 500;
  letter-spacing: 1px;
}

/* ========== AI科技感玻璃效果 ========== */
.glass-effect {
  background: var(--ai-bg-card) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--ai-border) !important;
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 180, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border-radius: 12px !important;
  position: relative;
  overflow: hidden;
}

/* 卡片顶部装饰线 */
.glass-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--ai-primary), transparent);
  pointer-events: none;
}

.glass-effect::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
  pointer-events: none;
}

/* ========== AI科技感搜索卡片 ========== */
.search-card {
  margin-bottom: 2rem;
  overflow: visible;
  max-width: 1100px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.input-area {
  padding: 1.5rem;
}

.custom-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 1rem;
  font-size: 15px;
  background: rgba(10, 25, 50, 0.8);
  border: 1px solid var(--ai-border);
  color: var(--ai-text);
  transition: all 0.3s;
  min-height: 80px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.custom-textarea :deep(.el-textarea__inner::placeholder) {
  color: var(--ai-text-dim);
}

.custom-textarea :deep(.el-textarea__inner:focus) {
  background: rgba(10, 30, 60, 0.95);
  border-color: var(--ai-primary);
  box-shadow: 
    0 0 20px rgba(0, 180, 255, 0.2),
    inset 0 0 10px rgba(0, 180, 255, 0.05);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  gap: 1.5rem;
  min-height: 50px;  /* 固定最小高度，避免布局跳动 */
}

/* 小屏幕时允许折行 */
@media (max-width: 1100px) {
  .input-footer {
    flex-wrap: wrap;
  }

  .controls-area {
    width: 100%;
    order: 1;
  }

  .submit-btn {
    width: 100%;
    order: 2;
    margin-top: 0.5rem;
  }
}

.controls-area {
  display: flex;
  gap: 0.75rem;  /* 减小间距 */
  align-items: center;
  flex: 1;  /* 让控制区域占用可用空间 */
  min-width: 0;  /* 允许收缩 */
  justify-content: flex-start;  /* 左对齐 */
}

/* 中等屏幕时换行 */
@media (max-width: 1300px) {
  .controls-area {
    flex-wrap: wrap;
    row-gap: 0.75rem;
  }

  .toggles {
    width: 100%;
    justify-content: flex-start;
    margin-right: 0;
  }

  .mcq-strategy-select {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 模型选择框样式 - 确保回显可见 */
.model-select {
  width: 200px !important;
  flex-shrink: 0 !important;
}

.model-select :deep(.el-select__wrapper) {
  background: rgba(0, 180, 255, 0.15) !important;
  border: 1px solid var(--ai-border) !important;
  box-shadow: none !important;
  min-width: 200px !important;
}

.model-select :deep(.el-select__selected-item) {
  color: #fff !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  max-width: none !important;
  overflow: visible !important;
}

.model-select :deep(.el-select__input) {
  color: #fff !important;
}

.model-select :deep(.el-select__placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

.model-select :deep(.el-select__prefix) {
  color: var(--ai-primary) !important;
}

.model-select :deep(.el-select__suffix) {
  color: var(--ai-primary) !important;
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
  gap: 0.5rem;  /* 减小间距避免遮挡 */
  align-items: center;
  flex-wrap: nowrap;  /* 保持在一行 */
  flex: 0 0 auto;  /* 不压缩不拉伸 */
  margin-right: 1rem;  /* 与策略选择器保持间距 */
}

/* MCQ Strategy Selector */
.mcq-strategy-select {
  min-width: 150px;
  max-width: 180px;
  flex-shrink: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform-origin: left center;
  margin-left: 0;  /* 移除左边距 */
}

.mcq-strategy-select :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.mcq-strategy-select :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.mcq-strategy-select :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ========== AI科技感提交按钮 ========== */
.submit-btn {
  padding: 14px 36px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--ai-primary) 0%, var(--ai-secondary) 100%) !important;
  border: none !important;
  color: #fff !important;
  box-shadow: 
    0 4px 20px rgba(0, 180, 255, 0.4),
    0 0 40px rgba(0, 180, 255, 0.2);
  transition: all 0.3s;
  flex-shrink: 0;
  white-space: nowrap;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  border-radius: 8px !important;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 30px rgba(0, 180, 255, 0.5),
    0 0 60px rgba(0, 180, 255, 0.3);
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 15px rgba(0, 180, 255, 0.4);
}

/* ========== AI科技感进度条 ========== */
.progress-card {
  padding: 1.5rem;
  margin-bottom: 2rem;
  background: var(--ai-bg-card) !important;
  border: 1px solid var(--ai-primary) !important;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-title {
  font-weight: 600;
  color: var(--ai-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.progress-value {
  font-weight: 700;
  color: var(--ai-warning);
  text-shadow: 0 0 10px rgba(240, 255, 0, 0.5);
  font-family: 'Orbitron', monospace;
}

.progress-status {
  text-align: center;
  font-size: 13px;
  color: var(--ai-text-dim);
  margin-top: 0.5rem;
}

.progress-card :deep(.el-progress-bar__outer) {
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid var(--ai-border);
}

.progress-card :deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, var(--ai-primary), var(--ai-secondary));
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
}

/* ========== AI科技感选择题结果卡片 ========== */
.mcq-results-card {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.mcq-results-card .card-header {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 0, 255, 0.1));
  border-bottom: 1px solid var(--ai-border);
  color: var(--ai-text);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mcq-results-card .title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 18px;
  color: var(--ai-primary);
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.mcq-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 1rem;
  background: rgba(0, 10, 20, 0.5);
}

.mcq-tabs :deep(.el-tabs__item) {
  height: 45px;
  line-height: 45px;
  font-weight: 500;
  transition: all 0.3s;
  color: var(--ai-text-dim);
}

.mcq-tabs :deep(.el-tabs__item.is-active) {
  color: var(--ai-primary);
  font-weight: 600;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.mcq-tabs :deep(.el-tabs__active-bar) {
  background: var(--ai-primary);
  box-shadow: 0 0 10px var(--ai-primary);
}

.tab-content {
  padding: 1.5rem;
  min-height: 300px;
  background: rgba(22, 27, 34, 0.6);
}

.option-question {
  font-size: 16px;
  margin-bottom: 1rem;
  color: var(--ai-text);
}

.option-answer {
  font-size: 15px;
  margin-bottom: 1rem;
  color: var(--ai-text-dim);
  background: rgba(0, 240, 255, 0.05);
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid var(--ai-primary);
}

.option-result {
  margin-top: 1.5rem;
}

.option-result .markdown-body {
  font-size: 15px;
  line-height: 1.8;
  color: var(--ai-text);
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: var(--ai-primary);
}

/* ========== AI科技感思考区域 ========== */
.thinking-section {
  margin-bottom: 1.5rem;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

.thinking-section :deep(.el-collapse) {
  border: none;
  background: linear-gradient(135deg, rgba(255, 0, 255, 0.05), rgba(0, 240, 255, 0.05));
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 0, 255, 0.3);
  box-shadow: 0 0 20px rgba(255, 0, 255, 0.1);
  transition: all 0.3s ease;
}

.thinking-section :deep(.el-collapse:hover) {
  box-shadow: 0 0 30px rgba(255, 0, 255, 0.2);
}

.thinking-section :deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 15px;
  height: auto;
  line-height: 1.5;
  color: var(--ai-text);
}

.thinking-section :deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

.thinking-section :deep(.el-collapse-item__content) {
  padding: 0 1.5rem 1.5rem;
}

.thinking-section :deep(.el-collapse-item__arrow) {
  color: var(--ai-secondary);
}

.thinking-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--ai-secondary);
  gap: 0.5rem;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.thinking-header .el-icon {
  font-size: 18px;
  color: var(--ai-secondary);
}

.thinking-content {
  background: rgba(22, 27, 34, 0.9);
  border-radius: 4px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 102, 255, 0.3);
}

.thinking-placeholder {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: var(--ai-text-dim);
  justify-content: center;
  font-size: 14px;
}

.thinking-text {
  font-family: 'Consolas', 'Microsoft YaHei', monospace;
  font-size: 14px;
  color: var(--ai-text);
  white-space: pre-wrap;
  line-height: 1.8;
  min-height: 20px;
}

.custom-scrollbar {
  max-height: none;
  overflow-y: visible;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 240, 255, 0.05);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--ai-primary);
  border-radius: 3px;
}

/* ========== AI科技感回答卡片 ========== */
.answer-card {
  min-height: 200px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

.answer-card .card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--ai-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(0, 10, 20, 0.5));
}

.answer-card .card-header .title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ai-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.answer-card .card-header .actions :deep(.el-button) {
  background: transparent;
  border: 1px solid var(--ai-border);
  color: var(--ai-text-dim);
}

.answer-card .card-header .actions :deep(.el-button:hover) {
  border-color: var(--ai-primary);
  color: var(--ai-primary);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.answer-body {
  padding: 2rem;
  background: rgba(22, 27, 34, 0.6);
  position: relative;
}

.markdown-body {
  font-size: 16px;
  line-height: 1.8;
  color: var(--ai-text);
}

.markdown-body :deep(p) {
  margin-bottom: 1rem;
}

.markdown-body :deep(strong) {
  color: var(--ai-primary);
}

.markdown-body :deep(a) {
  color: var(--ai-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--ai-secondary);
}

.markdown-body :deep(a:hover) {
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.answer-footer {
  padding: 1rem 2rem;
  background: rgba(0, 10, 20, 0.5);
  border-top: 1px solid var(--ai-border);
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
  color: var(--ai-text-dim);
}

.feedback-group :deep(.el-button) {
  background: transparent;
  border: 1px solid var(--ai-border);
  color: var(--ai-text-dim);
}

.feedback-group :deep(.el-button:hover) {
  border-color: var(--ai-primary);
  color: var(--ai-primary);
}

.feedback-group :deep(.el-button--success) {
  border-color: var(--ai-success);
  color: var(--ai-success);
}

.feedback-group :deep(.el-button--danger) {
  border-color: var(--ai-danger);
  color: var(--ai-danger);
}

/* ========== AI科技感元数据卡片 ========== */
.meta-card {
  border: none !important;
  margin-bottom: 1.5rem;
}

.meta-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(0, 10, 20, 0.5));
  border-bottom: 1px solid var(--ai-border);
  padding: 1rem 1.5rem;
}

.meta-card :deep(.el-card__body) {
  background: rgba(22, 27, 34, 0.6);
}

.meta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: var(--ai-primary);
}

.meta-header .left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.meta-header :deep(.el-tag) {
  background: var(--ai-primary);
  border: none;
  color: var(--ai-bg-dark);
}

.keywords-container {
  padding: 0.5rem 0;
}

.keyword-group {
  margin-bottom: 0.75rem;
}

.group-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ai-text-dim);
  margin-bottom: 6px;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-tag {
  border-radius: 2px;
  font-weight: 500;
  background: rgba(0, 240, 255, 0.1) !important;
  border: 1px solid var(--ai-primary) !important;
  color: var(--ai-primary) !important;
}

.custom-tag.el-tag--info {
  background: rgba(255, 0, 255, 0.1) !important;
  border: 1px solid var(--ai-secondary) !important;
  color: var(--ai-secondary) !important;
}

/* AI科技感问题分解 */
.meta-card :deep(.el-timeline) {
  padding-left: 0;
}

.meta-card :deep(.el-timeline-item__tail) {
  border-left: 2px solid var(--ai-primary);
}

.meta-card :deep(.el-timeline-item__node) {
  background: var(--ai-primary);
  box-shadow: 0 0 10px var(--ai-primary);
}

.sub-q-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-text);
}

.sub-q-answer {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ai-text-dim);
  line-height: 1.5;
}

/* ========== AI科技感参考文献 ========== */
.references-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 0.5rem;
}

.reference-item {
  background: rgba(22, 27, 34, 0.85);
  border: 1px solid var(--ai-border);
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.reference-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--ai-primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.reference-item:hover {
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
  border-color: var(--ai-primary);
}

.reference-item:hover::before {
  opacity: 1;
}

.reference-item.is-selected {
  border-left: 3px solid var(--ai-success);
  background: rgba(0, 255, 136, 0.05);
}

.reference-item.is-selected::before {
  display: none;
}

.ref-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.ref-index {
  background: linear-gradient(135deg, var(--ai-primary), var(--ai-secondary));
  color: var(--ai-bg-dark);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 2px;
  font-weight: 700;
  font-family: 'Orbitron', monospace;
}

.ref-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ai-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.ref-head :deep(.el-tag--success) {
  background: var(--ai-success) !important;
  border: none !important;
  color: var(--ai-bg-dark) !important;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(0, 240, 255, 0.05);
  border-radius: 4px;
  border: 1px solid var(--ai-border);
  color: var(--ai-text-dim);
  justify-content: center;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 240, 255, 0.2);
  border-top-color: var(--ai-primary);
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

.ref-sources :deep(.el-tag--primary) {
  background: rgba(0, 240, 255, 0.1) !important;
  border: 1px solid var(--ai-primary) !important;
  color: var(--ai-primary) !important;
}

.ref-sources :deep(.el-tag--success) {
  background: rgba(0, 255, 136, 0.1) !important;
  border: 1px solid var(--ai-success) !important;
  color: var(--ai-success) !important;
}

.ref-scores {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.ref-scores :deep(.el-tag) {
  background: rgba(0, 10, 20, 0.8) !important;
  border: 1px solid var(--ai-border) !important;
  color: var(--ai-text-dim) !important;
  font-family: 'Consolas', monospace;
}

.ref-scores :deep(.el-tag--warning) {
  border-color: var(--ai-warning) !important;
  color: var(--ai-warning) !important;
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
  color: var(--ai-text-dim);
  font-weight: 600;
}

.ref-keywords :deep(.el-tag--warning) {
  background: rgba(240, 255, 0, 0.1) !important;
  border: 1px solid var(--ai-warning) !important;
  color: var(--ai-warning) !important;
}

.ref-content-wrapper {
  position: relative;
}

.ref-content {
  font-size: 13px;
  color: var(--ai-text);
  line-height: 1.6;
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
  color: var(--ai-primary) !important;
}

.expand-btn:hover {
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

/* ========== AI科技感 Markdown 样式 ========== */
.markdown-body :deep(pre) {
  background: rgba(0, 10, 20, 0.9);
  color: var(--ai-text);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  border: 1px solid var(--ai-border);
  box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.05);
}

.markdown-body :deep(code) {
  background: rgba(0, 240, 255, 0.1);
  padding: 2px 6px;
  border-radius: 2px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: var(--ai-warning);
  border: 1px solid rgba(0, 240, 255, 0.2);
}

.markdown-body :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--ai-secondary);
  padding-left: 1rem;
  color: var(--ai-text-dim);
  background: rgba(255, 0, 255, 0.05);
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  margin: 1rem 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  color: var(--ai-primary);
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5rem;
}

.markdown-body :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-body :deep(li::marker) {
  color: var(--ai-primary);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--ai-border);
  padding: 0.5rem 0.75rem;
}

.markdown-body :deep(th) {
  background: rgba(0, 240, 255, 0.1);
  color: var(--ai-primary);
}

.markdown-body :deep(tr:hover) {
  background: rgba(0, 240, 255, 0.05);
}

/* ========== AI科技感控件样式 ========== */
.controls-area :deep(.el-select .el-input__wrapper) {
  background: rgba(22, 27, 34, 0.95);
  border: 1px solid var(--ai-border);
  box-shadow: none;
}

.controls-area :deep(.el-select .el-input__wrapper:hover) {
  border-color: var(--ai-primary);
}

.controls-area :deep(.el-select .el-input__inner) {
  color: var(--ai-text);
}

.controls-area :deep(.el-input-number) {
  background: rgba(22, 27, 34, 0.95);
}

.controls-area :deep(.el-input-number .el-input__wrapper) {
  background: transparent;
  border: 1px solid var(--ai-border);
  box-shadow: none;
}

.controls-area :deep(.el-input-number .el-input__inner) {
  color: var(--ai-text);
}

.controls-area :deep(.el-checkbox) {
  --el-checkbox-checked-bg-color: var(--ai-primary);
  --el-checkbox-checked-input-border-color: var(--ai-primary);
}

.controls-area :deep(.el-checkbox.is-bordered) {
  border-color: var(--ai-border);
  background: rgba(22, 27, 34, 0.85);
}

.controls-area :deep(.el-checkbox.is-bordered.is-checked) {
  border-color: var(--ai-primary);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.controls-area :deep(.el-checkbox__label) {
  color: var(--ai-text-dim);
}

.controls-area :deep(.el-checkbox.is-checked .el-checkbox__label) {
  color: var(--ai-primary);
}

.setting-item {
  background: rgba(22, 27, 34, 0.85) !important;
  border: 1px solid var(--ai-border);
}

.setting-item .label {
  color: var(--ai-text-dim) !important;
}

/* AI科技感反馈对话框 */
.feedback-dialog :deep(.el-dialog) {
  background: var(--ai-bg-card);
  border: 1px solid var(--ai-border);
}

.feedback-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(0, 10, 20, 0.5));
  border-bottom: 1px solid var(--ai-border);
}

.feedback-dialog :deep(.el-dialog__title) {
  color: var(--ai-primary);
}

.feedback-dialog :deep(.el-dialog__body) {
  background: rgba(0, 10, 20, 0.3);
}

.feedback-dialog :deep(.el-form-item__label) {
  color: var(--ai-text);
}

.feedback-dialog :deep(.el-input__wrapper),
.feedback-dialog :deep(.el-textarea__inner) {
  background: rgba(22, 27, 34, 0.95);
  border: 1px solid var(--ai-border);
  color: var(--ai-text);
}

/* AI科技感滚动条 */
.references-card :deep(.el-scrollbar__bar) {
  background: rgba(0, 240, 255, 0.1);
}

.references-card :deep(.el-scrollbar__thumb) {
  background: var(--ai-primary);
}

/* ========== 响应式设计 ========== */
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
  
  .brand-text h1 {
    font-size: 1.6rem;
  }
  
  .cyber-glow-1,
  .cyber-glow-2 {
    display: none;
  }
}

@media (max-width: 1024px) {
  .qa-page {
    align-items: flex-start;
    padding-top: 2rem;
  }
}

@media (max-width: 768px) {
  .qa-page {
    align-items: flex-start;
    padding-top: 1rem;
  }
  
  .main-container {
    justify-content: flex-start;
    padding: 0.5rem;
  }
  
  .tech-grid {
    animation: none;
  }
}

/* AI科技感呼吸效果 */
@keyframes aiBreath {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}

.brand-text h1 {
  animation: aiBreath 3s ease-in-out infinite;
}
</style>
