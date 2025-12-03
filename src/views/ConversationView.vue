<template>
  <div class="conversation-page">
    <!-- 会话列表侧边栏 -->
    <SessionList
      :sessions="sessionList"
      :current-session-id="sessionId || undefined"
      :loading="sessionsLoading"
      :current-page="sessionsPage"
      :total-pages="sessionsTotalPages"
      @new-session="handleNewSession"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
      @page-change="handlePageChange"
    />

    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <div class="brand">
          <div class="logo">💬</div>
          <div>
            <h1>边检智能对话</h1>
            <p class="subtitle">支持上下文理解 · 思考过程可视化 · 参考来源追溯</p>
          </div>
        </div>
        <div class="user-info">
          <span class="session-info">{{ sessionDisplay }}</span>
        </div>
      </header>

      <!-- 主卡片 -->
      <div class="main-card">
        <!-- 输入区域 -->
        <div class="input-section">
          <textarea
            v-model="question"
            placeholder="请输入您的问题，支持智能对话..."
            @keydown.enter.exact.prevent="handleSubmit"
            :disabled="loading"
          ></textarea>

          <div class="control-bar">
            <div class="controls-left">
              <label class="control-item">
                <span class="label-text">模型</span>
                <select v-model="modelId">
                  <option value="qwen3-32b">Qwen(通用)</option>
                  <option value="qwen2025">Qwen(增强)</option>
                  <option value="deepseek">DeepSeek-R1</option>
                </select>
              </label>

              <label class="control-item">
                <span class="label-text">参考数</span>
                <input type="number" v-model.number="rerankTopN" min="1" max="30" />
              </label>

              <label class="switch-item">
                <input type="checkbox" v-model="thinkingMode" />
                <span>思考模式</span>
              </label>

              <label class="switch-item">
                <input type="checkbox" v-model="insertBlock" />
                <span>精准检索</span>
              </label>
            </div>

            <div class="controls-right">
              <button class="btn-secondary" @click="handleNewSession" :disabled="loading">
                新建会话
              </button>
              <button class="btn-secondary" @click="handleClearSession" :disabled="!sessionId || loading">
                清空会话
              </button>
              <button class="btn-primary" @click="handleSubmit" :disabled="loading || !question.trim()">
                <span v-if="loading">发送中...</span>
                <span v-else>发送</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 对话和参考来源区域 -->
        <div class="content-area">
          <!-- 对话区 -->
          <div class="conversation-box" ref="conversationBox">
            <div v-if="messages.length === 0" class="welcome-message">
              欢迎使用智能对话系统，请输入问题开始对话
            </div>

            <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.role">
              <div class="message-bubble">
                <div v-if="msg.role === 'user'" class="user-content">
                  {{ msg.content }}
                </div>
                <div v-else class="assistant-content">
                  <!-- 思考过程 -->
                  <div v-if="msg.thinking && thinkingMode" class="thinking-section">
                    <div class="section-header">
                      <span class="icon">🧠</span>
                      <span class="title">思考过程</span>
                      <button class="toggle-btn" @click="msg.thinkingCollapsed = !msg.thinkingCollapsed">
                        {{ msg.thinkingCollapsed ? '展开' : '收起' }}
                      </button>
                    </div>
                    <div v-show="!msg.thinkingCollapsed" class="section-body">
                      {{ msg.thinking }}
                    </div>
                  </div>

                  <!-- 正文 -->
                  <div class="answer-section" v-if="msg.content || (loading && index === messages.length - 1)">
                    <div class="section-header">
                      <span class="icon">✨</span>
                      <span class="title">回答</span>
                    </div>
                    <!-- 流式输出时显示原始文本，完成后显示 Markdown -->
                    <div v-if="loading && index === messages.length - 1" 
                         class="section-body streaming-content" 
                         style="white-space: pre-wrap;">{{ msg.content }}<span class="cursor">▊</span></div>
                    <div v-else 
                         class="section-body markdown-content" 
                         v-html="renderMarkdown(msg.content)"></div>
                  </div>

                  <!-- 关键词提取 -->
                  <div v-if="msg.keywords && (msg.keywords.question.length > 0 || msg.keywords.document.length > 0)" class="keywords-section">
                    <div class="section-header">
                      <span class="icon">🔑</span>
                      <span class="title">关键词提取</span>
                    </div>
                    <div class="section-body keywords-body">
                      <!-- 问题关键词 -->
                      <div v-if="msg.keywords.question.length > 0" class="keywords-group">
                        <div class="keywords-label">💭 问题关键词</div>
                        <div class="keywords-tags">
                          <span
                            v-for="(keyword, idx) in msg.keywords.question"
                            :key="'q-' + idx"
                            class="keyword-badge question-keyword"
                          >
                            {{ keyword }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- 文档关键词 -->
                      <div v-if="msg.keywords.document.length > 0" class="keywords-group">
                        <div class="keywords-label">📄 文档关键词</div>
                        <div class="keywords-tags">
                          <span
                            v-for="(keyword, idx) in msg.keywords.document"
                            :key="'d-' + idx"
                            class="keyword-badge document-keyword"
                          >
                            {{ keyword }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 精准检索进度条 -->
            <div v-if="showProgress" class="progress-container">
              <div class="progress-header">
                <span class="progress-icon">🔍</span>
                <span class="progress-title">精准检索进度</span>
                <span class="progress-percentage">{{ progressInfo.percentage }}%</span>
              </div>
              <div class="progress-bar-wrapper">
                <div class="progress-bar" :style="{ width: progressInfo.percentage + '%' }">
                  <div class="progress-bar-shine"></div>
                </div>
              </div>
              <div class="progress-text">{{ progressMessage }}</div>
            </div>

            <div v-if="loading && !showProgress" class="loading-indicator">
              <div class="spinner"></div>
              <span>AI正在思考中...</span>
            </div>
          </div>

          <!-- 参考来源折叠按钮 -->
          <div class="references-toggle" @click="showReferences = !showReferences">
            <span class="toggle-icon">{{ showReferences ? '▶' : '◀' }}</span>
            <span class="toggle-text">参考来源</span>
            <span class="toggle-count">{{ filteredReferences.length }}</span>
          </div>

          <!-- 参考来源侧边栏 -->
          <transition name="slide-right">
            <div v-show="showReferences" class="references-sidebar">
              <div class="sidebar-header">
                <h3>参考来源</h3>
                <span class="count">{{ filteredReferences.length }} 条</span>
                <button class="close-btn" @click="showReferences = false">✕</button>
              </div>

            <div class="references-list">
              <div v-if="filteredReferences.length === 0" class="empty-state">
                暂无参考来源
              </div>

              <div
                v-for="(ref, index) in filteredReferences"
                :key="index"
                class="reference-item"
                :class="{ selected: ref.canAnswer, 'hidden-node': ref.isHidden }"
              >
                <div class="ref-header">
                  <span class="ref-id">[{{ ref.id }}]</span>
                  <span class="ref-title">{{ ref.fileName }}</span>
                  <span v-if="ref.isHidden" class="hidden-badge"> 隐藏节点</span>
                  <span v-if="ref.hiddenKbName" class="kb-name-badge">{{ ref.hiddenKbName }}</span>
                  <span v-if="ref.canAnswer" class="selected-badge">✓ 已选中</span>
                </div>
                <div class="ref-meta">
                  <span>初始检索分: {{ typeof ref.initialScore === 'number' ? ref.initialScore.toFixed(2) : (ref.initialScore || '-') }}</span>
                  <span>重排序分: {{ typeof ref.rerankedScore === 'number' ? ref.rerankedScore.toFixed(2) : (ref.rerankedScore || '-') }}</span>
                  <span
                    v-if="ref.canAnswer !== undefined"
                    :class="ref.canAnswer ? 'can-answer' : 'cannot-answer'"
                  >
                    {{ ref.canAnswer ? '✓ 可回答' : '✗ 不可回答' }}
                  </span>
                </div>
                
                <!-- 检索来源标签 -->
                <div v-if="ref.retrievalSources && ref.retrievalSources.length" class="mb-2">
                  <span
                    v-for="(source, idx) in ref.retrievalSources"
                    :key="idx"
                    class="badge me-1"
                    :class="source === 'vector' ? 'bg-primary' : 'bg-success'"
                  >
                    {{ source === 'vector' ? '🔍 向量检索' : '🔑 关键词检索' }}
                  </span>
                </div>
                
                <!-- 详细分数 -->
                <div v-if="ref.vectorScore || ref.bm25Score || ref.vectorRank || ref.bm25Rank" class="mb-2">
                  <small class="d-flex flex-wrap gap-2">
                    <span v-if="ref.vectorScore" class="badge bg-info text-dark">
                      📊 向量分: {{ typeof ref.vectorScore === 'number' ? ref.vectorScore.toFixed(4) : ref.vectorScore }}
                      <span v-if="ref.vectorRank" class="ms-1">(排名#{{ ref.vectorRank }})</span>
                    </span>
                    <span v-if="ref.bm25Score" class="badge bg-info text-dark">
                      📈 BM25分: {{ typeof ref.bm25Score === 'number' ? ref.bm25Score.toFixed(4) : ref.bm25Score }}
                      <span v-if="ref.bm25Rank" class="ms-1">(排名#{{ ref.bm25Rank }})</span>
                    </span>
                  </small>
                </div>
                
                <!-- 匹配关键词 -->
                <div v-if="ref.matchedKeywords && ref.matchedKeywords.length" class="mb-2">
                  <div class="text-muted small mb-1"><strong>🏷️ 匹配关键词</strong></div>
                  <div class="d-flex flex-wrap gap-1">
                    <span
                      v-for="(keyword, idx) in ref.matchedKeywords"
                      :key="idx"
                      class="badge bg-warning text-dark"
                    >
                      {{ keyword }}
                    </span>
                  </div>
                </div>
                
                <div class="ref-content">"{{ ref.content }}"</div>
                
                <div v-if="ref.keyPassage" class="key-passage">
                  <div class="passage-label">🔍 关键段落：</div>
                  <div class="passage-text">{{ ref.keyPassage }}</div>
                </div>
              </div>
            </div>
          </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, onMounted, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import SessionList from '@/components/SessionList.vue';
import {
  sendStreamChatRequest,
  createNewSession,
  clearSession as clearSessionApi,
  getSessionHistory,
  getSessionList,
  deleteSession,
  type ReferenceSource,
  type StreamMessage,
  type SessionListItem,
  type KeywordsData
} from '@/utils/chatApi';
import { API_ENDPOINTS, STORAGE_KEYS, SHOW_HIDDEN_NODES } from '@/config/api/api';
import { getStorageItem, setStorageItem } from '@/utils/storageUtils';
import { renderMarkdown, setupCopyCode } from '@/utils/markdown';
import { 
  isProgressMessage, 
  parseProgressMessage, 
  isPreciseRetrievalStart, 
  parsePreciseRetrievalStart,
  type ProgressInfo 
} from '@/utils/htmlUtils';
import {
  getMockAnswer,
  getMockConversation,
  getMockReferences,
  getMockThinking,
  shouldUseReferenceMocks
} from '@/mocks/referenceMocks';
import 'highlight.js/styles/atom-one-dark.css';  // 代码高亮主题
import 'katex/dist/katex.min.css';                // 数学公式样式
import '@/assets/styles/markdown.css';            // Markdown 样式

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  thinkingCollapsed?: boolean;
  keywords?: KeywordsData | null;
}

export default defineComponent({
  name: 'ConversationView',
  components: {
    SessionList
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    // 状态
    const question = ref('');
    const messages = ref<Message[]>([]);
    const references = ref<ReferenceSource[]>([]);
    const showReferences = ref(false);  // 参考来源默认隐藏
    
    // 过滤后的参考文献（根据环境变量决定是否显示隐藏节点）
    const filteredReferences = computed(() => {
      if (SHOW_HIDDEN_NODES) {
        return references.value;
      }
      return references.value.filter(ref => !ref.isHidden);
    });
    const loading = ref(false);
    const sessionId = ref<string | null>(getStorageItem(STORAGE_KEYS.SESSION_ID));

    // 进度条状态
    const showProgress = ref(false);
    const progressInfo = ref<ProgressInfo>({ current: 0, total: 0, percentage: 0 });
    const progressMessage = ref('');

    // 会话列表状态
    const sessionList = ref<SessionListItem[]>([]);
    const sessionsLoading = ref(false);
    const sessionsPage = ref(1);
    const sessionsTotalPages = ref(1);

    // 配置
    const modelId = ref('qwen3-32b');
    const rerankTopN = ref(10);
    const thinkingMode = ref(true);
    const insertBlock = ref(false);

    // DOM引用
    const conversationBox = ref<HTMLElement | null>(null);
    const mockReferencesEnabled = shouldUseReferenceMocks();

    const applyConversationMocks = () => {
      const mockHistory = getMockConversation();
      if (messages.value.length === 0) {
        messages.value.push(
          {
            role: 'user',
            content: mockHistory.user
          },
          {
            role: 'assistant',
            content: getMockAnswer(),
            thinking: getMockThinking(),
            thinkingCollapsed: false
          }
        );
      }
      references.value = getMockReferences();
    };

    const guardMockRequests = (): boolean => {
      if (!mockReferencesEnabled) {
        return false;
      }
      applyConversationMocks();
      return true;
    };



    // 计算属性
    const sessionDisplay = computed(() => {
      return sessionId.value ? `会话: ${sessionId.value.substring(0, 8)}...` : '会话: 无';
    });

    // 检查登录状态
    const checkAuth = () => {
      if (!store.state.user.token) {
        router.push({ name: 'login' });
        return false;
      }
      return true;
    };

    // 滚动到底部
    const scrollToBottom = () => {
      nextTick(() => {
        if (conversationBox.value) {
          conversationBox.value.scrollTop = conversationBox.value.scrollHeight;
        }
      });
    };

    // 初始化
    onMounted(async () => {
      setupCopyCode();

      if (mockReferencesEnabled) {
        applyConversationMocks();
        return;
      }

      
      // 🔥 修复：检查用户切换，如果检测到token不一致则清除会话数据
      const currentToken = store.state.user.token;
      const storedChatToken = getStorageItem(STORAGE_KEYS.CHAT_TOKEN);
      
      if (storedChatToken && storedChatToken !== currentToken) {
        // 用户已切换，清除会话数据
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
        sessionId.value = null;
        console.log('检测到用户切换，已清除会话数据');
      }
      
      // 同步设置当前token
      if (currentToken) {
        setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);
      }
      
      await initializeSession();
      await loadSessionList();
    });

    // 初始化会话
    const initializeSession = async () => {
      if (guardMockRequests()) {
        return;
      }
      if (!checkAuth()) return;

      // 🔥 修复：确保使用当前用户的最新token
      const currentToken = store.state.user.token;
      setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);

      // 如果没有会话ID，创建新会话
      if (!sessionId.value) {
        try {
          const result = await createNewSession(currentToken);
          sessionId.value = result.session_id;
          setStorageItem(STORAGE_KEYS.SESSION_ID, result.session_id);
          console.log('新会话已创建:', result.session_id);
        } catch (error: any) {
          console.error('创建会话失败:', error);
        }
      } else {
        // 尝试加载历史消息
        try {
          const history = await getSessionHistory(sessionId.value, currentToken);
          // 将历史消息转换为当前格式
          history.messages.forEach(msg => {
            messages.value.push({
              role: 'user',
              // 历史消息可能包含 <NEWLINE>，需要转换
              content: msg.user_query.replace(/<NEWLINE>/g, '\n')
            });
            messages.value.push({
              role: 'assistant',
              // 历史消息可能包含 <NEWLINE>，需要转换
              content: msg.assistant_response.replace(/<NEWLINE>/g, '\n'),
              thinking: '',
              thinkingCollapsed: false,
              keywords: null
            });
          });
          scrollToBottom();
        } catch (error) {
          console.warn('加载历史消息失败，可能是新会话');
        }
      }
    };

    // 加载会话列表
    const loadSessionList = async (page: number = 1) => {
      if (guardMockRequests()) {
        return;
      }
      if (!checkAuth()) return;

      sessionsLoading.value = true;
      try {
        // 🔥 修复：确保使用当前用户的最新token
        const currentToken = store.state.user.token;
        setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);
        
        const result = await getSessionList(currentToken, {
          page,
          page_size: 20,
          sort_by: 'last_update'
        });
        sessionList.value = result.sessions;
        sessionsPage.value = result.page;
        sessionsTotalPages.value = Math.ceil(result.total / result.page_size);
      } catch (error) {
        console.error('加载会话列表失败:', error);
      } finally {
        sessionsLoading.value = false;
      }
    };

    // 创建新会话
    const handleNewSession = async () => {
      if (guardMockRequests()) {
        return;
      }
      if (!checkAuth()) return;

      try {
        // 🔥 修复：确保使用当前用户的最新token
        const currentToken = store.state.user.token;
        setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);
        
        const result = await createNewSession(currentToken);
        sessionId.value = result.session_id;
        setStorageItem(STORAGE_KEYS.SESSION_ID, result.session_id);
        messages.value = [];
        references.value = [];
        console.log('新会话已创建:', result.session_id);
        await loadSessionList(); // 刷新会话列表
      } catch (error: any) {
        console.error('创建会话失败:', error);
      }
    };

    // 选择会话
    const handleSelectSession = async (selectedSessionId: string) => {
      if (guardMockRequests()) {
        return;
      }
      if (selectedSessionId === sessionId.value) return;

      // 🔥 修复：确保使用当前用户的最新token
      const currentToken = store.state.user.token;
      setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);

      sessionId.value = selectedSessionId;
      setStorageItem(STORAGE_KEYS.SESSION_ID, selectedSessionId);
      messages.value = [];
      references.value = [];

      // 加载历史消息
      try {
        const history = await getSessionHistory(selectedSessionId, currentToken);
        history.messages.forEach(msg => {
          messages.value.push({
            role: 'user',
            // 历史消息可能包含 <NEWLINE>，需要转换
            content: msg.user_query.replace(/<NEWLINE>/g, '\n')
          });
          messages.value.push({
            role: 'assistant',
            // 历史消息可能包含 <NEWLINE>，需要转换
            content: msg.assistant_response.replace(/<NEWLINE>/g, '\n'),
            thinking: '',
            thinkingCollapsed: false,
            keywords: null
          });
        });
        scrollToBottom();
      } catch (error) {
        console.error('加载会话历史失败:', error);
      }
    };

    // 删除会话
    const handleDeleteSession = async (sessionIdToDelete: string) => {
      if (guardMockRequests()) {
        return;
      }
      if (!confirm('确定要删除这个会话吗？')) return;

      try {
        // 🔥 修复：确保使用当前用户的最新token
        const currentToken = store.state.user.token;
        setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);
        
        await deleteSession(sessionIdToDelete, currentToken);
        await loadSessionList(); // 刷新列表

        // 如果删除的是当前会话，创建新会话
        if (sessionIdToDelete === sessionId.value) {
          await handleNewSession();
        }
      } catch (error) {
        console.error('删除会话失败:', error);
      }
    };

    // 分页切换
    const handlePageChange = (page: number) => {
      if (guardMockRequests()) {
        return;
      }
      loadSessionList(page);
    };

    // 发送消息
    const handleSubmit = async () => {
      if (guardMockRequests()) {
        return;
      }
      if (!checkAuth() || !question.value.trim() || loading.value) return;



      const userQuestion = question.value.trim();
      question.value = '';

      // 添加用户消息
      messages.value.push({
        role: 'user',
        content: userQuestion
      });
      scrollToBottom();

      // 准备助手消息
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        thinking: '',
        thinkingCollapsed: false,
        keywords: null
      };
      messages.value.push(assistantMessage);

      loading.value = true;
      references.value = [];
      
      // 如果启用了精准检索，预先显示进度条
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
        // 🔥 修复：确保使用当前用户的最新token
        const currentToken = store.state.user.token;
        setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);
        
        await sendStreamChatRequest(
          API_ENDPOINTS.KNOWLEDGE.CONVERSATION_CHAT,
          {
            question: userQuestion,
            session_id: sessionId.value,
            thinking: thinkingMode.value,
            model_id: modelId.value,
            rerank_top_n: rerankTopN.value,
            use_insert_block: insertBlock.value,
            insert_block_llm_id: modelId.value
          },
          currentToken,
          (message: StreamMessage) => {
            handleStreamMessage(message, assistantMessage);
          }
        );
      } catch (error: any) {
        assistantMessage.content = `请求失败: ${error.message}`;
      } finally {
        loading.value = false;
        showProgress.value = false;
        scrollToBottom();
      }
    };

    // 处理流式消息
    const handleStreamMessage = (message: StreamMessage, assistantMessage: Message) => {
      if (mockReferencesEnabled) {
        return;
      }

      // 获取当前助手消息在数组中的索引
      const msgIndex = messages.value.indexOf(assistantMessage);
      
      switch (message.type) {
        case 'SESSION':
          sessionId.value = message.data;
          setStorageItem(STORAGE_KEYS.SESSION_ID, message.data);
          break;

        case 'THINK':
          if (msgIndex !== -1 && messages.value[msgIndex].thinking !== undefined) {
            // parseSSEMessage 已经处理了 <NEWLINE> 转换
            messages.value[msgIndex].thinking += message.data;
          }
          scrollToBottom();
          break;

        case 'CONTENT':
          // 检查是否为精准检索开始消息
          if (isPreciseRetrievalStart(message.data)) {
            const total = parsePreciseRetrievalStart(message.data);
            if (total) {
              showProgress.value = true;
              progressInfo.value = { current: 0, total, percentage: 0 };
              progressMessage.value = '正在启动精准检索...';
            }
          }
          // 检查是否为进度消息
          else if (isProgressMessage(message.data)) {
            const progress = parseProgressMessage(message.data);
            if (progress) {
              progressInfo.value = progress;
              progressMessage.value = `正在分析文档 ${progress.current}/${progress.total}`;
            }
          }
          // 普通内容消息
          else if (msgIndex !== -1) {
            // parseSSEMessage 已经处理了 <NEWLINE> 转换
            messages.value[msgIndex].content += message.data;
          }
          scrollToBottom();
          break;

        case 'SOURCE':
          try {
            const source = JSON.parse(message.data) as ReferenceSource;
            console.log('📦 接收到SOURCE数据:', source);
            console.log('  - retrievalSources:', source.retrievalSources);
            console.log('  - vectorScore:', source.vectorScore, 'vectorRank:', source.vectorRank);
            console.log('  - bm25Score:', source.bm25Score, 'bm25Rank:', source.bm25Rank);
            console.log('  - matchedKeywords:', source.matchedKeywords);
            references.value.push(source);
          } catch (e) {
            console.error('解析SOURCE失败:', e);
          }
          break;

        case 'KEYWORDS':
          console.log('收到KEYWORDS消息，原始数据:', message.data);
          try {
            const keywordsData = JSON.parse(message.data) as KeywordsData;
            console.log('🔑 解析后的KEYWORDS:', keywordsData);
            if (msgIndex !== -1 && messages.value[msgIndex].keywords !== undefined) {
              messages.value[msgIndex].keywords = keywordsData;
            }
          } catch (e) {
            console.error('解析KEYWORDS失败:', e, '原始数据:', message.data);
          }
          break;

        case 'ERROR':
          if (msgIndex !== -1) {
            messages.value[msgIndex].content = `错误: ${message.data}`;
          }
          break;

        case 'DONE':
          console.log('流式响应完成');
          // 隐藏进度条
          showProgress.value = false;
          break;
      }
    };

    // 清空会话
    const handleClearSession = async () => {
      if (guardMockRequests()) {
        return;
      }
      if (!sessionId.value) return;

      try {
        // 🔥 修复：确保使用当前用户的最新token
        const currentToken = store.state.user.token;
        setStorageItem(STORAGE_KEYS.CHAT_TOKEN, currentToken);
        
        await clearSessionApi(sessionId.value, currentToken);
        messages.value = [];
        references.value = [];
        console.log('会话已清空，会话ID保留');
      } catch (error) {
        console.error('清空会话失败:', error);
      }
    };

    return {
      question,
      messages,
      references,
      filteredReferences,
      loading,
      sessionId,
      modelId,
      rerankTopN,
      thinkingMode,
      insertBlock,
      conversationBox,
      sessionDisplay,
      sessionList,
      sessionsLoading,
      sessionsPage,
      sessionsTotalPages,
      showProgress,
      progressInfo,
      progressMessage,
      showReferences,
      handleSubmit,
      handleNewSession,
      handleSelectSession,
      handleDeleteSession,
      handlePageChange,
      handleClearSession,
      renderMarkdown
    };
  }
});
</script>

<style scoped>
.conversation-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/deepbac.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 2rem;
  padding-left: calc(320px + 2rem); /* 为侧边栏留出空间 */
  transition: padding-left 0.3s ease;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
}

/* 头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  color: white;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.user-info {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
}

.session-info {
  font-size: 14px;
  font-weight: 500;
}

/* 主卡片 */
.main-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 输入区域 */
.input-section textarea {
  width: 100%;
  min-height: 120px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 1rem;
  font-size: 16px;
  resize: vertical;
  transition: border-color 0.3s;
  font-family: inherit;
}

.input-section textarea:focus {
  outline: none;
  border-color: #2563eb;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.controls-left {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
}

.label-text {
  color: #6b7280;
  font-weight: 500;
}

.control-item select,
.control-item input {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.control-item input[type="number"] {
  width: 70px;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
}

.switch-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.controls-right {
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 内容区域 */
.content-area {
  display: block;
  position: relative;
  margin-top: 2rem;
}

/* 对话框 */
.conversation-box {
  background: #f9fafb;
  border-radius: 16px;
  padding: 1.5rem;
  height: 600px;
  overflow-y: auto;
}

.welcome-message {
  text-align: center;
  color: #9ca3af;
  padding: 3rem 1rem;
  font-size: 16px;
}

.message {
  display: flex;
  margin-bottom: 1.5rem;
}

.message.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 85%;
  padding: 1rem 1.25rem;
  border-radius: 16px;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-bubble {
  background: white;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.thinking-section,
.answer-section {
  margin-bottom: 1rem;
}

.thinking-section:last-child,
.answer-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header .icon {
  font-size: 18px;
}

.section-header .title {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.toggle-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}

.section-body {
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
}

.thinking-section .section-body {
  background: #f0f9ff;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
  font-style: italic;
  color: #1e40af;
}

/* 关键词提取 */
.keywords-section {
  margin-bottom: 1rem;
}

.keywords-section:last-child {
  margin-bottom: 0;
}

.keywords-body {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #ec4899;
}

.keywords-group {
  margin-bottom: 1rem;
}

.keywords-group:last-child {
  margin-bottom: 0;
}

.keywords-label {
  font-size: 13px;
  font-weight: 600;
  color: #9f1239;
  margin-bottom: 0.5rem;
}

.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keyword-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: default;
}

.keyword-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 问题关键词 - 粉色 */
.keyword-badge.question-keyword {
  background: linear-gradient(135deg, #f9a8d4 0%, #ec4899 100%);
  color: #831843;
  border: 1px solid #f472b6;
}

/* 文档关键词 - 红色 */
.keyword-badge.document-keyword {
  background: linear-gradient(135deg, #fca5a5 0%, #ef4444 100%);
  color: #7f1d1d;
  border: 1px solid #f87171;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #6b7280;
}

/* 精准检索进度条 */
.progress-container {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #93c5fd;
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.progress-icon {
  font-size: 24px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
  flex: 1;
}

.progress-percentage {
  font-size: 18px;
  font-weight: 700;
  color: #2563eb;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar-wrapper {
  width: 100%;
  height: 24px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  border-radius: 12px;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

.progress-bar-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 200%; }
}

.progress-text {
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
  text-align: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 流式输出光标动画 */
.streaming-content .cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #2563eb;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 参考来源折叠按钮 */
.references-toggle {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 8px;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: all 0.3s ease;
}

.references-toggle:hover {
  padding-right: 12px;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.3);
}

.references-toggle .toggle-icon {
  font-size: 12px;
}

.references-toggle .toggle-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
}

.references-toggle .toggle-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

/* 参考来源侧边栏 */
.references-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 380px;
  background: #f9fafb;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 99;
}

/* 滑入动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.sidebar-header .close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.sidebar-header .close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: #374151;
}

.count {
  background: #2563eb;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.references-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 2rem 1rem;
}

.reference-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s;
}

.reference-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reference-item.selected {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
}

.reference-item.hidden-node {
  border: 2px solid #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
  opacity: 0.85;
}

.reference-item.hidden-node:hover {
  opacity: 1;
}

.ref-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  flex-shrink: 0;
}

.ref-title {
  font-weight: 600;
  color: #065f46;
  font-size: 14px;
  flex: 1;
  min-width: 0;
}

.selected-badge {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.hidden-badge {
  background: linear-gradient(45deg, #f59e0b, #d97706);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.kb-name-badge {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.ref-meta {
  display: flex;
  gap: 1rem;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  font-style: italic;
}

.can-answer {
  color: #059669;
  font-weight: 600;
}

.cannot-answer {
  color: #dc2626;
  font-weight: 600;
}

.retrieval-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.retrieval-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
}

.retrieval-badge.source-vector {
  background: rgba(37, 99, 235, 0.15);
  color: #1d4ed8;
}

.retrieval-badge.source-keyword {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.retrieval-badge.source-other {
  background: rgba(107, 114, 128, 0.15);
  color: #374151;
}

.ref-content {
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 3px solid #10b981;
  margin-bottom: 0.75rem;
}

.key-passage {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  padding: 0.75rem;
  border-radius: 8px;
}

.passage-label {
  font-weight: 600;
  color: #b45309;
  margin-bottom: 0.5rem;
  font-size: 12px;
}

.passage-text {
  font-size: 12px;
  color: #92400e;
  line-height: 1.6;
}

.retrieval-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.source-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
}

.source-tag.tag-vector {
  background: rgba(37, 99, 235, 0.15);
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.3);
}

.source-tag.tag-keyword {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.detailed-scores {
  display: flex;
  gap: 1rem;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 0.75rem;
  font-family: 'Courier New', monospace;
}

.detailed-scores span {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.matched-keywords {
  margin-bottom: 0.75rem;
  font-size: 12px;
}

.matched-keywords strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
}

.keyword-tag {
  display: inline-block;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* 响应式 */
@media (max-width: 768px) {
  .references-sidebar {
    width: 100%;
  }

  .references-toggle {
    top: auto;
    bottom: 20px;
    transform: none;
  }
}
</style>