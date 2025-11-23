<template>
  <div class="smart-office-page">
    <ThreeBackground />
    <el-container class="smart-office-layout container-fluid">
      <!-- 左侧：额外知识库 -->
      <el-aside width="320px" class="kb-aside">
        <div class="kb-header mb-3">
          <div class="kb-title-wrapper">
            <div class="kb-icon-badge">
              <el-icon :size="20"><Collection /></el-icon>
            </div>
            <div class="kb-title-text">
              <h3 class="kb-title">知识库管理</h3>
              <p class="kb-subtitle">持久化存储 · 智能检索</p>
            </div>
          </div>
        </div>

        <el-card shadow="hover" class="kb-control-card mb-3">
          <div class="kb-switch-wrapper">
            <el-switch
              v-model="useKb"
              size="large"
              active-text="启用知识库"
              inactive-text="仅会话文档"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6"
            />
          </div>
          <el-divider class="my-3" />
          <el-input
            v-model="kbPassword"
            type="password"
            show-password
            placeholder="请输入知识库口令"
            class="kb-password-input"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
        </el-card>

        <el-card shadow="hover" class="kb-upload-card mb-3">
          <div class="upload-section">
            <div class="upload-label mb-2">
              <el-icon class="me-1"><UploadFilled /></el-icon>
              <span>上传文档</span>
            </div>
            <input
              ref="kbFileInputRef"
              type="file"
              multiple
              accept=".txt,.md,.pdf,.docx,.doc"
              class="form-control mb-2"
            />
            <el-button
              type="primary"
              :loading="kbUploading"
              class="w-100 upload-btn"
              @click="uploadKbFiles"
            >
              <el-icon class="me-2"><UploadFilled /></el-icon>
              上传到知识库
            </el-button>
          </div>
        </el-card>

        <el-card shadow="hover" class="kb-list-card">
          <div class="kb-list-header mb-2">
            <span class="list-title">文档列表</span>
            <el-badge :value="kbFiles.length" :max="99" type="primary" />
          </div>
          <div class="kb-list-body">
            <div v-if="!kbFiles.length" class="kb-empty">
              <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
              <p class="empty-text">暂无文档</p>
              <p class="empty-hint">请先上传文件到知识库</p>
            </div>
            <el-scrollbar v-else style="height: 100%" id="kbList">
              <div
                v-for="file in kbFiles"
                :key="file.name"
                class="kb-item"
              >
                <el-checkbox v-model="file.selected" />
                <el-icon class="file-icon"><Document /></el-icon>
                <span class="kb-file-name" :title="file.name">
                  {{ file.name }}
                </span>
                <el-icon 
                  class="delete-icon" 
                  @click="deleteKbFile(file.name)"
                >
                  <Delete />
                </el-icon>
              </div>
            </el-scrollbar>
          </div>
        </el-card>
      </el-aside>

      <!-- 右侧：上传 + 对话区 -->
      <el-main class="main-area">
        <!-- 头部 -->
        <div class="page-header mb-4">
          <div class="header-content">
            <div class="header-left">
              <div class="logo-container">
                <div class="logo-gradient">
                  <el-icon :size="24"><Document /></el-icon>
                </div>
              </div>
              <div class="header-text">
                <h1 class="page-title">智能写作助手</h1>
                <p class="page-description">
                  <el-icon class="desc-icon"><Collection /></el-icon>
                  <span>支持知识库检索</span>
                  <el-divider direction="vertical" />
                  <el-icon class="desc-icon"><Document /></el-icon>
                  <span>最多10个会话文档</span>
                </p>
              </div>
            </div>
            <div class="header-right">
              <el-tag
                v-if="templateReady"
                type="success"
                effect="light"
                size="large"
                class="template-tag"
              >
                <el-icon class="me-1"><Tickets /></el-icon>
                模板已就绪
              </el-tag>
              <el-button
                type="primary"
                size="large"
                class="template-btn"
                @click="onRecognizeTemplate"
              >
                <el-icon class="me-2"><Tickets /></el-icon>
                识别模板
              </el-button>
            </div>
          </div>
        </div>

        <!-- 上传区 -->
        <el-card shadow="hover" class="upload-card mb-4">
          <div class="card-title-bar mb-3">
            <el-icon class="title-icon" :size="18"><UploadFilled /></el-icon>
            <span class="card-title">文档与配置</span>
          </div>
          <div class="upload-row row g-3">
            <div class="col-lg-6 col-12">
              <div class="config-section">
                <label class="config-label">
                  <el-icon><Document /></el-icon>
                  <span>会话文档上传</span>
                </label>
                <div class="upload-group">
                  <input
                    ref="sessionFileInputRef"
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,.docx,.doc"
                    class="form-control"
                  />
                  <el-button
                    type="primary"
                    :loading="sessionUploading"
                    class="upload-action-btn"
                    @click="uploadSessionFiles"
                  >
                    <el-icon class="me-2"><UploadFilled /></el-icon>
                    上传文档
                  </el-button>
                </div>
                <div class="config-hint">
                  <el-icon><Warning /></el-icon>
                  <span>建议上传 1~10 个参考文档</span>
                </div>
              </div>
            </div>
            <div class="col-lg-6 col-12">
              <div class="config-section">
                <label class="config-label">
                  <el-icon><Tickets /></el-icon>
                  <span>模板文件</span>
                  <el-tag size="small" type="info" class="ms-2">可选</el-tag>
                </label>
                <el-select
                  v-model="templateFile"
                  filterable
                  clearable
                  placeholder="选择模板文件"
                  class="w-100 config-select"
                >
                  <el-option
                    v-for="name in sessionFiles"
                    :key="name"
                    :label="name"
                    :value="name"
                  />
                </el-select>
              </div>
            </div>
            <div class="col-lg-6 col-12">
              <div class="config-section">
                <label class="config-label">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>AI 模型</span>
                </label>
                <el-select
                  v-model="selectedModel"
                  filterable
                  clearable
                  placeholder="自动选择最优模型"
                  class="w-100 config-select"
                >
                  <el-option
                    v-for="m in modelOptions"
                    :key="m"
                    :label="m"
                    :value="m"
                  />
                </el-select>
              </div>
            </div>
            <div class="col-lg-6 col-12">
              <div class="config-section">
                <label class="config-label">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>高级选项</span>
                </label>
                <div class="switch-container">
                  <el-switch
                    v-model="thinkingMode"
                    active-text="启用思考模式"
                    inactive-text="标准模式"
                    size="large"
                    style="--el-switch-on-color: #409eff"
                  />
                </div>
              </div>
            </div>
          </div>
          <el-divider v-if="sessionFiles.length" class="my-3" />
          <div v-if="sessionFiles.length" class="session-files-section">
            <div class="files-header">
              <span class="files-title">已上传文档</span>
              <el-badge :value="sessionFiles.length" :max="99" type="primary" />
            </div>
            <div class="files-list">
              <el-tag
                v-for="name in sessionFiles"
                :key="name"
                closable
                type="info"
                effect="light"
                class="file-tag"
                @close="deleteSessionFile(name)"
              >
                <el-icon class="me-1"><Document /></el-icon>
                {{ name }}
              </el-tag>
            </div>
          </div>
          <el-alert
            type="info"
            :closable="false"
            class="mt-3 template-tip"
          >
            <template #title>
              <div class="tip-content">
                <el-icon><Tickets /></el-icon>
                <span>如需按模板写作，请先选择模板文件并点击「识别模板」按钮</span>
              </div>
            </template>
          </el-alert>
        </el-card>

        <!-- 对话区 -->
        <el-card shadow="hover" class="chat-card">
          <div class="card-title-bar mb-3">
            <el-icon class="title-icon" :size="18"><ChatDotRound /></el-icon>
            <span class="card-title">对话区域</span>
            <el-badge :value="messages.length" :max="99" type="primary" class="ms-2" />
          </div>

          <div ref="chatWindowRef" class="chat-window">
            <div v-if="!messages.length" class="chat-empty">
              <el-icon :size="64" color="#c0c4cc"><ChatDotRound /></el-icon>
              <p class="empty-title">开始您的创作之旅</p>
              <p class="empty-desc">输入写作意图、主题或大纲，AI 将协助您完成创作</p>
            </div>
            <div
              v-for="(msg, idx) in messages"
              :key="idx"
              :class="['chat-row', msg.role]"
            >
              <div class="avatar" v-if="msg.role !== 'system'">
                <el-icon v-if="msg.role === 'assistant'" :size="18">
                  <ChatDotRound />
                </el-icon>
                <el-icon v-else-if="msg.role === 'user'" :size="18">
                  <User />
                </el-icon>
                <el-icon v-else :size="18">
                  <Warning />
                </el-icon>
              </div>
              <div class="bubble">
                <div class="bubble-content" v-html="formatMessage(msg.text)" />
                <div v-if="msg.sources && msg.sources.length > 0" class="bubble-sources">
                  <el-divider class="my-2" />
                  <div class="sources-title">
                    <el-icon :size="14"><Document /></el-icon>
                    <span>参考资料 ({{ msg.sources.length }})</span>
                  </div>
                  <div class="sources-list">
                    <el-tag
                      v-for="src in msg.sources"
                      :key="src.id"
                      size="small"
                      type="info"
                      effect="plain"
                      class="source-tag"
                    >
                      [{{ src.id }}] {{ src.fileName }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="input-bar">
            <el-input
              v-model="prompt"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 8 }"
              placeholder="请输入写作意图、主题或大纲... (Shift+Enter 换行，Enter 发送)"
              class="input-textarea"
              @keydown.enter.stop.prevent="handleEnter"
            />
            <el-button
              type="primary"
              :loading="sending"
              size="large"
              class="send-btn"
              @click="sendMessage"
            >
              <el-icon class="me-2" :size="18">
                <Promotion />
              </el-icon>
              <span>{{ sending ? '生成中...' : '发送' }}</span>
            </el-button>
          </div>
        </el-card>
      </el-main>
    </el-container>

    <!-- 模板识别弹窗 -->
    <el-dialog
      v-model="templateDialogVisible"
      width="700px"
      class="template-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <el-icon :size="22" class="header-icon"><Tickets /></el-icon>
          <span class="header-title">识别写作模板</span>
        </div>
      </template>

      <div v-if="templateLoading" class="template-loading">
        <el-icon class="loading-icon spin" :size="48">
          <Loading />
        </el-icon>
        <p class="loading-text">正在智能识别模板结构...</p>
        <p class="loading-hint">这可能需要几秒钟时间</p>
      </div>
      <div v-else class="template-content">
        <el-form label-width="90px" class="template-form">
          <el-form-item label="模板概要">
            <el-input
              v-model="templateOutlineText"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 8 }"
              readonly
              class="outline-textarea"
            />
          </el-form-item>
          <el-form-item label="生成提示">
            <el-input
              v-model="templateContent"
              type="textarea"
              :autosize="{ minRows: 6, maxRows: 12 }"
              placeholder="您可以在此基础上微调写作提示词，使其更符合您的需求"
              class="content-textarea"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="templateDialogVisible = false">
            取消
          </el-button>
          <el-button 
            type="primary" 
            size="large"
            :disabled="!templateContent" 
            @click="applyTemplate"
          >
            <el-icon class="me-2"><Promotion /></el-icon>
            确认使用
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, nextTick } from 'vue';
import { useStore } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ChatDotRound,
  User,
  UploadFilled,
  Collection,
  Tickets,
  Promotion,
  Loading,
  Document,
  Key,
  Warning,
  Delete,
} from '@element-plus/icons-vue';
import { LLM_BASE_URL, WRITER_BASE_URL } from '@/config/api/api';
import ThreeBackground from '@/components/ThreeBackground.vue';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error' | 'system';
  text: string;
  sources?: Array<{
    id: number;
    fileName: string;
    path: string;
  }>;
}

interface KbFile {
  name: string;
  selected: boolean;
}

export default defineComponent({
  name: 'SmartOfficeView',
  components: {
    ChatDotRound,
    User,
    UploadFilled,
    Collection,
    Tickets,
    Promotion,
    Loading,
    Document,
    Key,
    Warning,
    Delete,
    ThreeBackground,
  },
  setup() {
    const store = useStore();

    const sessionId = ref<string>('');
    const prompt = ref<string>('');
    const messages = ref<ChatMessage[]>([]);

    const useKb = ref<boolean>(false);
    const kbPassword = ref<string>('');
    const kbFiles = ref<KbFile[]>([]);
    const kbUploading = ref<boolean>(false);

    const sessionFiles = ref<string[]>([]);
    const sessionUploading = ref<boolean>(false);

    const sessionFileInputRef = ref<HTMLInputElement | null>(null);
    const kbFileInputRef = ref<HTMLInputElement | null>(null);

    const thinkingMode = ref<boolean>(false);
    const modelOptions = ref<string[]>([]);
    const selectedModel = ref<string>('');

    const templateFile = ref<string>('');
    const templateDialogVisible = ref<boolean>(false);
    const templateLoading = ref<boolean>(false);
    const templateContent = ref<string>('');
    const templateOutlineText = ref<string>('');
    const templateReady = ref<boolean>(false);

    const chatWindowRef = ref<HTMLDivElement | null>(null);
    const sending = ref<boolean>(false);
    const abortController = ref<AbortController | null>(null);

    const writerBase = WRITER_BASE_URL || LLM_BASE_URL || '';

    const scrollToBottom = () => {
      nextTick(() => {
        const el = chatWindowRef.value;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    };

    const getAuthHeaders = (extra?: Record<string, string>) => {
      const headers: Record<string, string> = extra ? { ...extra } : {};
      const token: string | undefined = store.state?.user?.token;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
    };

    const ensureSession = async () => {
      if (sessionId.value) return;
      try {
        const resp = await fetch(`${writerBase}/writer/session/new`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        });
        const data = await resp.json();
        sessionId.value = data.session_id;
      } catch (e) {
        ElMessage.error('创建会话失败，请稍后重试');
      }
    };

    const refreshKbList = async () => {
      try {
        const resp = await fetch(`${writerBase}/writer/kb/list`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const data = await resp.json();
        if (data.ok) {
          const files: string[] = data.files || [];
          kbFiles.value = files.map((name) => ({
            name,
            selected: false,
          }));
        }
      } catch {
        // 静默
      }
    };

    const loadModels = async () => {
      try {
        const resp = await fetch(`${writerBase}/writer/models`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const data = await resp.json();
        if (data.ok) {
          const models: string[] = data.models || [];
          modelOptions.value = models;
          if (data.default && models.includes(data.default)) {
            selectedModel.value = data.default;
          } else if (models.length) {
            selectedModel.value = models[0];
          }
        }
      } catch {
        // 模型列表失败不阻塞主流程
      }
    };

    const uploadSessionFiles = async () => {
      const input = sessionFileInputRef.value;
      if (!input || !input.files || input.files.length === 0) {
        ElMessage.warning('请先选择要上传的会话文档');
        return;
      }

      await ensureSession();
      if (!sessionId.value) return;

      const fd = new FormData();
      fd.append('session_id', sessionId.value);
      Array.from(input.files)
        .slice(0, 10)
        .forEach((f) => fd.append('files', f));

      sessionUploading.value = true;
      try {
        const resp = await fetch(`${writerBase}/writer/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: fd,
        });
        const data = await resp.json();
        if (!data.ok) {
          throw new Error(data.error || '上传失败');
        }
        sessionFiles.value = data.allFiles || data.files || [];
        ElMessage.success(`已接收 ${data.added || 0} 个文件`);
        input.value = '';
      } catch (e: any) {
        ElMessage.error(`上传失败：${e?.message || String(e)}`);
      } finally {
        sessionUploading.value = false;
      }
    };

    const deleteSessionFile = async (name: string) => {
      if (!sessionId.value) return;
      try {
        const resp = await fetch(`${writerBase}/writer/upload/delete`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            session_id: sessionId.value,
            filename: name,
          }),
        });
        const data = await resp.json();
        if (!data.ok) {
          throw new Error(data.error || '删除失败');
        }
        sessionFiles.value = data.allFiles || [];
        if (templateFile.value === name) {
          templateFile.value = '';
          templateReady.value = false;
        }
        ElMessage.success('删除成功');
      } catch (e: any) {
        ElMessage.error(`删除失败：${e?.message || String(e)}`);
      }
    };

    const deleteKbFile = async (filename: string) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除知识库文件 "${filename}" 吗？`,
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
      } catch {
        return; // 用户取消
      }

      try {
        const resp = await fetch(`${writerBase}/writer/kb/upload/delete`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ filename }),
        });
        const data = await resp.json();
        if (!data.ok) {
          throw new Error(data.error || '删除失败');
        }
        ElMessage.success('删除成功');
        await refreshKbList();
      } catch (e: any) {
        ElMessage.error(`删除失败：${e?.message || String(e)}`);
      }
    };

    const uploadKbFiles = async () => {
      const input = kbFileInputRef.value;
      if (!input || !input.files || input.files.length === 0) {
        ElMessage.warning('请先选择要上传到知识库的文件');
        return;
      }

      const fd = new FormData();
      Array.from(input.files).forEach((f) => fd.append('files', f));
      if (kbPassword.value) {
        fd.append('kb_password', kbPassword.value);
      }

      kbUploading.value = true;
      try {
        const resp = await fetch(`${writerBase}/writer/kb/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: fd,
        });
        const data = await resp.json();
        if (!data.ok) {
          throw new Error(data.error || '上传失败');
        }
        ElMessage.success(`KB 已接收 ${data.added || 0} 个文件`);
        if (input) input.value = '';
        await refreshKbList();
      } catch (e: any) {
        ElMessage.error(`上传 KB 失败：${e?.message || String(e)}`);
      } finally {
        kbUploading.value = false;
      }
    };

    const onRecognizeTemplate = async () => {
      await ensureSession();
      if (!sessionId.value) {
        ElMessage.warning('请先上传至少一个会话文档');
        return;
      }
      if (!templateFile.value && !sessionFiles.value.length) {
        ElMessage.warning('当前会话暂无可用模板文件');
        return;
      }
      if (!templateFile.value && sessionFiles.value.length) {
        templateFile.value = sessionFiles.value[0];
      }

      templateDialogVisible.value = true;
      templateLoading.value = true;
      templateContent.value = '';
      templateOutlineText.value = '';

      try {
        const resp = await fetch(`${writerBase}/writer/template/recognize`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            session_id: sessionId.value,
            filename: templateFile.value,
          }),
        });
        const data = await resp.json();
        if (!data.ok) {
          throw new Error(data.error || '识别失败');
        }
        const tpl = data.template || {};
        const outline: string[] = tpl.outline || [];
        templateOutlineText.value = outline.map((h: string) => `• ${h}`).join('\n');
        templateContent.value = tpl.suggested_instruction || '';
        templateFile.value = tpl.filename || templateFile.value;
        templateReady.value = true;
      } catch (e: any) {
        templateDialogVisible.value = false;
        ElMessage.error(`模板识别失败：${e?.message || String(e)}`);
      } finally {
        templateLoading.value = false;
      }
    };

    const applyTemplate = () => {
      if (!templateContent.value) return;
      const base = templateContent.value.trim();
      if (!base) return;
      // 不写入输入框，只设置模板就绪标志
      templateReady.value = true;
      templateDialogVisible.value = false;
      ElMessage.success('模板已就绪，发送消息时将自动应用');
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      sendMessage();
    };

    const sendMessage = async () => {
      const text = prompt.value.trim();
      if (!text) {
        ElMessage.warning('请输入写作意图 / 主题 / 大纲');
        return;
      }

      await ensureSession();
      if (!sessionId.value) return;

      if (sending.value) {
        ElMessage.warning('已有任务正在进行中，请稍候');
        return;
      }

      if (abortController.value) {
        abortController.value.abort();
        abortController.value = null;
      }

      sending.value = true;
      const userMsg: ChatMessage = { role: 'user', text };
      messages.value.push(userMsg);
      const aiMsg: ChatMessage = { role: 'assistant', text: '' };
      messages.value.push(aiMsg);
      prompt.value = '';
      scrollToBottom();

      const kbSelected = useKb.value
        ? kbFiles.value.filter((f) => f.selected).map((f) => f.name)
        : [];

      const payload: any = {
        session_id: sessionId.value,
        instruction: text,
        template_content: templateContent.value || '',
        model_id: selectedModel.value || undefined,
        enable_thinking: !!thinkingMode.value,
        use_kb: !!useKb.value,
        kb_selected: kbSelected,
      };

      const ac = new AbortController();
      abortController.value = ac;

      try {
        const resp = await fetch(`${writerBase}/writer/chat`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(payload),
          signal: ac.signal,
        });

        if (!resp.ok) {
          let errText = resp.statusText;
          try {
            const j = await resp.json();
            errText = j.error || j.detail || errText;
          } catch {
            // ignore
          }
          aiMsg.role = 'error';
          aiMsg.text = `生成失败：${errText}`;
          ElMessage.error(aiMsg.text);
          return;
        }

        const ctype = (resp.headers.get('content-type') || '').toLowerCase();
        if (ctype.includes('text/event-stream')) {
          const reader = resp.body?.getReader();
          if (!reader) {
            throw new Error('无法获取响应流');
          }
          const decoder = new TextDecoder('utf-8');
          let sources: any[] = [];
          
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            chunk
              .split('\n')
              .filter(Boolean)
              .forEach((ln) => {
                const s = ln.replace(/^data:\s?/, '').trim();
                if (!s) return;
                
                if (s.startsWith('SOURCE:')) {
                  // 处理来源映射
                  try {
                    sources = JSON.parse(s.substring(7));
                    console.log('[SSE] 接收到来源映射:', sources);
                  } catch (e) {
                    console.warn('[SSE] 解析来源映射失败:', e);
                  }
                } else if (s.startsWith('CONTENT:')) {
                  // 处理内容流
                  const content = s.substring(8);
                  aiMsg.text += content;
                } else if (s.startsWith('ERROR:')) {
                  // 处理错误
                  aiMsg.role = 'error';
                  const errorMsg = s.substring(6);
                  aiMsg.text = errorMsg;
                  ElMessage.error(errorMsg);
                } else if (s.startsWith('THINKING:')) {
                  // 处理思考过程（可选显示）
                  console.log('[SSE] 思考:', s.substring(9));
                }
              });
            scrollToBottom();
          }
          
          // 流式传输完成后，保存来源信息到消息对象
          if (sources.length > 0) {
            aiMsg.sources = sources;
            console.log('[SSE] 使用的参考资料:', sources);
          }
        } else if (ctype.includes('application/json')) {
          const j = await resp.json();
          aiMsg.text =
            j.content || JSON.stringify(j, null, 2);
        } else {
          aiMsg.text = await resp.text();
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          aiMsg.text += '\n\n[已中止当前生成]';
        } else {
          aiMsg.role = 'error';
          aiMsg.text = `生成失败：${e?.message || String(e)}`;
          ElMessage.error(aiMsg.text);
        }
      } finally {
        sending.value = false;
        abortController.value = null;
        scrollToBottom();
      }
    };

    const formatMessage = (text: string): string => {
      if (!text) return '';
      // 转义 HTML 特殊字符，防止 XSS
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      // 将 <NEWLINE> 替换为 <br>
      return escaped.replace(/&lt;NEWLINE&gt;/g, '<br>');
    };

    onMounted(async () => {
      await ensureSession();
      await refreshKbList();
      await loadModels();
    });

    return {
      sessionId,
      prompt,
      messages,
      useKb,
      kbPassword,
      kbFiles,
      kbUploading,
      sessionFiles,
      sessionUploading,
      sessionFileInputRef,
      kbFileInputRef,
      thinkingMode,
      modelOptions,
      selectedModel,
      templateFile,
      templateDialogVisible,
      templateLoading,
      templateContent,
      templateOutlineText,
      templateReady,
      chatWindowRef,
      sending,
      uploadSessionFiles,
      deleteSessionFile,
      uploadKbFiles,
      deleteKbFile,
      onRecognizeTemplate,
      applyTemplate,
      handleEnter,
      sendMessage,
      formatMessage,
    };
  },
});
</script>

<style scoped>
/* ========== 基础布局 ========== */
.smart-office-page {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
}

.smart-office-layout {
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 100px rgba(102, 126, 234, 0.2);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

/* ========== 左侧知识库区域 ========== */
.kb-aside {
  padding: 24px;
  border-right: 1px solid rgba(232, 234, 237, 0.5);
  background: linear-gradient(180deg, rgba(248, 249, 250, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}

.kb-header {
  margin-bottom: 20px;
}

.kb-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kb-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4), 0 0 20px rgba(102, 126, 234, 0.3);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4), 0 0 20px rgba(102, 126, 234, 0.3);
  }
  to {
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6), 0 0 30px rgba(102, 126, 234, 0.5);
  }
}

.kb-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.kb-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.kb-control-card,
.kb-upload-card,
.kb-list-card {
  border-radius: 12px;
  border: 1px solid rgba(232, 234, 237, 0.5);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.kb-list-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.kb-list-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.kb-switch-wrapper {
  display: flex;
  justify-content: center;
}

.kb-password-input {
  border-radius: 8px;
}

.upload-section {
  padding: 4px 0;
}

.upload-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.upload-btn {
  border-radius: 8px;
  font-weight: 500;
}

.kb-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8eaed;
}

.list-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.kb-empty {
  text-align: center;
  padding: 40px 20px;
}

.empty-text {
  font-size: 14px;
  color: #6b7280;
  margin: 12px 0 4px 0;
}

.empty-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.kb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.kb-item:hover {
  background: #f3f4f6;
}

.file-icon {
  color: #6b7280;
  flex-shrink: 0;
}

.kb-file-name {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.delete-icon {
  color: #9ca3af;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
}

.kb-item:hover .delete-icon {
  opacity: 1;
}

.delete-icon:hover {
  color: #ef4444;
  transform: scale(1.1);
}

/* ========== 主内容区域 ========== */
.main-area {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  background: rgba(250, 251, 252, 0.5);
  backdrop-filter: blur(10px);
}

/* ========== 页面头部 ========== */
.page-header {
  padding: 20px 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-container {
  position: relative;
}

.logo-gradient {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3), 0 0 30px rgba(102, 126, 234, 0.4);
  animation: logoGlow 3s ease-in-out infinite alternate;
}

@keyframes logoGlow {
  from {
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3), 0 0 30px rgba(102, 126, 234, 0.4);
  }
  to {
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.5), 0 0 40px rgba(102, 126, 234, 0.6);
  }
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.page-description {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.desc-icon {
  color: #9ca3af;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.template-tag {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
}

.template-btn {
  border-radius: 10px;
  font-weight: 500;
  padding: 12px 24px;
}

/* ========== 上传卡片 ========== */
.upload-card {
  border-radius: 12px;
  border: 1px solid rgba(232, 234, 237, 0.5);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8eaed;
  position: relative;
}

.title-icon {
  color: #667eea;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.upload-group {
  display: flex;
  gap: 8px;
}

.upload-action-btn {
  border-radius: 8px;
  font-weight: 500;
  white-space: nowrap;
}

.config-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.config-select {
  border-radius: 8px;
}

.switch-container {
  padding: 8px 0;
}

.session-files-section {
  padding-top: 12px;
}

.files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.files-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-tag {
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
}

.template-tip {
  border-radius: 8px;
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

/* ========== 对话卡片 ========== */
.chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  border-radius: 12px;
  border: 1px solid rgba(232, 234, 237, 0.5);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  border: 1px solid rgba(232, 234, 237, 0.3);
  min-height: 400px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 16px 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.chat-row {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-row.user {
  justify-content: flex-end;
}

.chat-row.assistant,
.chat-row.error {
  justify-content: flex-start;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.chat-row.user .avatar {
  margin-right: 0;
  margin-left: 12px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 2px 8px rgba(240, 147, 251, 0.4), 0 0 15px rgba(240, 147, 251, 0.3);
}

.bubble {
  max-width: 75%;
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.bubble-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-sources {
  margin-top: 8px;
}

.sources-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.sources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.source-tag {
  font-size: 11px;
  border-radius: 4px;
  cursor: default;
}

.chat-row.assistant .bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.chat-row.user .bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.chat-row.error .bubble {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.input-textarea {
  flex: 1;
  border-radius: 12px;
}

.send-btn {
  border-radius: 12px;
  font-weight: 500;
  padding: 12px 28px;
  white-space: nowrap;
}

/* ========== 模板弹窗 ========== */
.template-dialog .dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: #667eea;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.template-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-icon {
  color: #667eea;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 8px 0;
}

.loading-hint {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.template-content {
  padding: 8px 0;
}

.template-form {
  margin-top: 8px;
}

.outline-textarea,
.content-textarea {
  border-radius: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 科技感效果 ========== */
.smart-office-layout::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      rgba(102, 126, 234, 0.03) 0px,
      transparent 1px,
      transparent 2px,
      rgba(102, 126, 234, 0.03) 3px
    );
  pointer-events: none;
  z-index: 0;
}

.card-title-bar::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 0;
  background: linear-gradient(90deg, #667eea, #764ba2);
  animation: dataFlow 2s ease-in-out infinite;
}

@keyframes dataFlow {
  0%, 100% {
    width: 0;
    opacity: 0;
  }
  50% {
    width: 100%;
    opacity: 1;
  }
}

.kb-item {
  position: relative;
  overflow: hidden;
}

.kb-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left 0.5s;
}

.kb-item:hover::before {
  left: 100%;
}

.upload-action-btn,
.send-btn,
.template-btn {
  position: relative;
  overflow: hidden;
}

.upload-action-btn::before,
.send-btn::before,
.template-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.upload-action-btn:hover::before,
.send-btn:hover::before,
.template-btn:hover::before {
  width: 300px;
  height: 300px;
}

/* 数据流动画 */
@keyframes dataStream {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.config-section {
  position: relative;
}

.config-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, transparent, #667eea, transparent);
  animation: dataStream 2s ease-in-out infinite;
  opacity: 0;
  transition: opacity 0.3s;
}

.config-section:hover::after {
  opacity: 0.5;
}

/* ========== 响应式设计 ========== */
@media (max-width: 992px) {
  .smart-office-layout {
    flex-direction: column;
  }
  
  .kb-aside {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid #e8eaed;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .smart-office-page {
    padding: 1rem 0;
  }
  
  .main-area {
    padding: 16px;
  }
  
  .bubble {
    max-width: 85%;
  }
}
</style>
