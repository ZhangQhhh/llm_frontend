<template>
  <div class="format-tool-page">
    <el-container class="main-container">
      <el-main>
        <div class="content-wrapper">
          <!-- 主上传卡片 -->
          <el-card class="upload-card glass-effect" shadow="hover">
            <div class="upload-container">
              <!-- 标题 -->
              <div class="tool-header">
                <el-icon class="header-icon" :size="36"><MagicStick /></el-icon>
                <div class="header-text">
                  <h2>选择题格式化工具</h2>
                  <p>使用 AI 将非标准格式的选择题自动转换为标准格式</p>
                </div>
              </div>

              <!-- 拖拽上传区 -->
              <el-upload
                ref="uploadRef"
                class="upload-dragger-area"
                drag
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleFileChange"
                accept=".docx,.txt"
              >
                <div class="upload-content">
                  <el-icon class="upload-icon" :size="80">
                    <UploadFilled />
                  </el-icon>
                  <div class="upload-text">
                    <p class="primary-text">拖拽文件到此处，或点击选择</p>
                    <p class="secondary-text">支持 .docx / .txt 格式</p>
                  </div>
                </div>
              </el-upload>

              <!-- 文件信息展示 -->
              <transition name="el-zoom-in-top">
                <div v-if="selectedFile" class="file-info-section">
                  <el-card class="file-info-card" shadow="never">
                    <div class="file-info-header">
                      <el-icon :size="24" color="#67c23a"><DocumentChecked /></el-icon>
                      <span class="file-name">{{ selectedFile.name }}</span>
                    </div>
                    <div class="file-details">
                      <div class="detail-item">
                        <el-icon><Files /></el-icon>
                        <span>大小: {{ formatFileSize(selectedFile.size) }}</span>
                      </div>
                    </div>
                  </el-card>

                  <!-- 操作按钮 -->
                  <div class="action-buttons">
                    <el-button
                      type="warning"
                      size="large"
                      :loading="formatting"
                      :disabled="formatting"
                      @click="handleFormat"
                      round
                      class="format-btn"
                    >
                      <el-icon v-if="!formatting" class="btn-icon"><MagicStick /></el-icon>
                      {{ formatting ? 'AI 格式化中...' : 'LLM 格式化' }}
                    </el-button>
                    <el-button
                      size="large"
                      :disabled="formatting"
                      @click="handleClear"
                      round
                    >
                      <el-icon><Close /></el-icon>
                      清除文件
                    </el-button>
                  </div>
                </div>
              </transition>

              <!-- 格式化进度 -->
              <transition name="el-zoom-in-top">
                <div v-if="formatting" class="progress-section">
                  <el-progress
                    :percentage="100"
                    :indeterminate="true"
                    :stroke-width="8"
                    striped
                    striped-flow
                  />
                  <p class="progress-text">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    AI 正在分析并格式化文档，请稍候...
                  </p>
                </div>
              </transition>

              <!-- 状态消息 -->
              <transition name="el-zoom-in-top">
                <div v-if="message" class="message-section">
                  <el-alert
                    :title="message"
                    :type="messageType"
                    :closable="true"
                    show-icon
                    @close="message = ''"
                  />
                </div>
              </transition>

              <!-- 格式化结果 -->
              <transition name="el-zoom-in-top">
                <div v-if="formatResult.formatted_text" class="result-section">
                  <el-card class="result-card" shadow="never">
                    <div class="result-header">
                      <el-icon :size="24" color="#409eff"><SuccessFilled /></el-icon>
                      <span>格式化完成！识别出 {{ formatResult.count }} 道题目</span>
                    </div>
                    <div class="result-info">
                      <el-tag type="info" size="small">使用模型: {{ formatResult.model_used || '默认' }}</el-tag>
                    </div>
                    <div class="result-actions">
                      <el-button
                        type="success"
                        @click="downloadFormattedDocx"
                        :icon="Download"
                      >
                        下载 DOCX 文件
                      </el-button>
                      <el-button
                        type="primary"
                        plain
                        @click="previewResult"
                        :icon="View"
                      >
                        预览结果
                      </el-button>
                    </div>
                  </el-card>
                </div>
              </transition>
            </div>
          </el-card>

          <!-- 使用说明 -->
          <el-card class="steps-card" shadow="hover">
            <el-collapse v-model="activeSteps" class="steps-collapse">
              <el-collapse-item name="1">
                <template #title>
                  <div class="card-header">
                    <el-icon><QuestionFilled /></el-icon>
                    <span>使用说明</span>
                  </div>
                </template>
                <div class="help-content">
                  <h4>支持输入的格式</h4>
                  <ul>
                    <li>选项在同一行：A.选项A B.选项B C.选项C D.选项D</li>
                    <li>无标点选项：A选项A B选项B</li>
                    <li>各种答案格式：【答案】A、正确答案：A、(A)等</li>
                  </ul>
                  
                  <h4>输出标准格式</h4>
                  <pre class="format-example">
1. 题干内容
A. 选项A内容
B. 选项B内容
C. 选项C内容
D. 选项D内容
答案：A
解析：解析内容（如果有）</pre>
                  
                  <h4>使用步骤</h4>
                  <el-steps :active="currentStep" finish-status="success" direction="vertical">
                    <el-step title="上传文件" description="选择包含选择题的 .docx 或 .txt 文件" />
                    <el-step title="LLM 格式化" description="AI 自动识别并转换为标准格式" />
                    <el-step title="下载结果" description="下载格式化后的 DOCX 文件" />
                  </el-steps>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  UploadFilled,
  Close,
  QuestionFilled,
  Loading,
  DocumentChecked,
  Files,
  Download,
  View,
  MagicStick,
  SuccessFilled,
} from "@element-plus/icons-vue";
import { MCQ_BASE_URL } from "@/config/api/api";
import type { UploadFile } from "element-plus";

const formatting = ref(false);
const message = ref("");
const messageType = ref<"success" | "error" | "warning" | "info">("info");
const selectedFile = ref<File | null>(null);
const uploadRef = ref();
const activeSteps = ref(['1']);

const formatResult = reactive<{
  formatted_text: string;
  items: any[];
  count: number;
  model_used: string;
}>({
  formatted_text: '',
  items: [],
  count: 0,
  model_used: ''
});

const currentStep = computed(() => {
  if (!selectedFile.value) return 0;
  if (formatting.value) return 1;
  if (formatResult.formatted_text) return 3;
  return 1;
});

const handleFileChange = (uploadFile: UploadFile) => {
  message.value = "";
  // 清空之前的结果
  formatResult.formatted_text = '';
  formatResult.items = [];
  formatResult.count = 0;
  formatResult.model_used = '';
  
  selectedFile.value = uploadFile.raw || null;
  
  if (selectedFile.value) {
    ElMessage.success({
      message: `已选择文件: ${selectedFile.value.name}`,
      duration: 2000,
    });
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

const handleFormat = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择文件");
    return;
  }

  message.value = "";
  formatting.value = true;

  try {
    const fd = new FormData();
    fd.append('file', selectedFile.value);
    fd.append('model_id', 'qwen3-32b');  // 使用 qwen3-32b 模型进行格式化
    
    const r = await fetch(`${MCQ_BASE_URL}/format_only`, { method: 'POST', body: fd });
    
    // 检查网关超时等HTTP错误
    if (!r.ok) {
      if (r.status === 504 || r.status === 502) {
        throw new Error('LLM处理超时，请尝试上传较小的文件或稍后重试');
      } else if (r.status === 500) {
        throw new Error('服务器内部错误，请稍后重试');
      }
      throw new Error(`服务器错误（HTTP ${r.status}）`);
    }
    
    // 尝试解析JSON，捕获HTML响应的情况
    let j;
    try {
      j = await r.json();
    } catch (parseErr) {
      throw new Error('LLM服务响应异常，可能正在处理中或已超时，请稍后重试');
    }
    
    if (!j || j.ok === false) {
      throw new Error(j?.msg || `格式化失败（HTTP ${r.status})`);
    }
    
    // 保存结果
    formatResult.formatted_text = j.formatted_text || '';
    formatResult.items = j.items || [];
    formatResult.count = j.count || 0;
    formatResult.model_used = j.model_used || '';
    
    message.value = j.format_msg || '格式化完成';
    messageType.value = "success";
    ElMessage.success({
      message: `格式化成功！识别出 ${j.count} 道题目`,
      duration: 3000,
    });
  } catch (err: any) {
    const errorMsg = err?.message || "格式化失败，请检查文件内容";
    message.value = errorMsg;
    messageType.value = "error";
    ElMessage.error({
      message: errorMsg,
      duration: 5000,
    });
    console.error("Format error:", err);
  } finally {
    formatting.value = false;
  }
};

const downloadFormattedDocx = async () => {
  if (!formatResult.formatted_text) {
    ElMessage.warning('没有可下载的格式化结果');
    return;
  }
  
  try {
    // 调用后端接口生成 docx
    const r = await fetch(`${MCQ_BASE_URL}/format_export_docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        formatted_text: formatResult.formatted_text,
        items: formatResult.items 
      })
    });
    
    if (!r.ok) {
      throw new Error(`导出失败（HTTP ${r.status})`);
    }
    
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 从原文件名生成新文件名
    const originalName = selectedFile.value?.name || 'questions';
    const baseName = originalName.replace(/\.(docx|txt)$/i, '');
    a.download = `${baseName}_格式化.docx`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ElMessage.success('格式化结果已下载');
  } catch (err: any) {
    ElMessage.error(err?.message || '下载失败');
  }
};

const previewResult = () => {
  if (!formatResult.items || formatResult.items.length === 0) {
    ElMessage.warning('没有可预览的格式化结果');
    return;
  }
  
  // 构建预览内容
  const previewHtml = formatResult.items.map((item: any, idx: number) => {
    const optionsHtml = Object.entries(item.options || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `<div style="margin-left: 20px;">${k}. ${v}</div>`)
      .join('');
    
    return `
      <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px;">
        <div style="font-weight: 600; margin-bottom: 8px;">${idx + 1}. ${item.stem || '（题干为空）'}</div>
        <div style="color: #4b5563;">${optionsHtml || '（无选项）'}</div>
        <div style="margin-top: 8px; color: ${item.answer ? '#10b981' : '#ef4444'};">
          答案：${item.answer || '（无）'}
        </div>
      </div>
    `;
  }).join('');
  
  ElMessageBox.alert(
    `<div style="max-height: 500px; overflow-y: auto;">${previewHtml}</div>`,
    `格式化结果预览（共 ${formatResult.count} 题）`,
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customClass: 'format-preview-dialog'
    }
  );
};

const handleClear = () => {
  selectedFile.value = null;
  message.value = "";
  formatResult.formatted_text = '';
  formatResult.items = [];
  formatResult.count = 0;
  formatResult.model_used = '';
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  ElMessage.info("已清除文件");
};
</script>

<style scoped>
.format-tool-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/girl.jpg') no-repeat 0% 30%;
  background-size: cover;
  background-attachment: fixed;
  position: relative;
}

.format-tool-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(240, 248, 255, 0.25) 100%);
  z-index: 0;
}

.main-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

:deep(.el-main) {
  padding: 2rem 3rem 3rem;
  display: flex;
  align-items: flex-end;
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.25) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.upload-card {
  margin-bottom: 2rem;
  border-radius: 20px;
  overflow: hidden;
}

.upload-container {
  padding: 2rem;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}

.header-icon {
  color: #e6a23c;
}

.header-text h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.header-text p {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.upload-dragger-area {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 240px;
  border: 3px dashed #d9d9d9;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger:hover) {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #fef9e7 0%, #fdebd0 100%);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(230, 162, 60, 0.2);
}

.upload-content {
  text-align: center;
}

.upload-icon {
  color: #e6a23c;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.upload-text .primary-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
}

.upload-text .secondary-text {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0;
}

.file-info-section {
  margin-top: 2rem;
  animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file-info-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: none;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.file-info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.file-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  word-break: break-all;
}

.file-details {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #5f6368;
  font-size: 0.95rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.format-btn {
  min-width: 180px;
  height: 48px;
  font-size: 1.05rem;
  font-weight: 600;
  background: linear-gradient(135deg, #e6a23c 0%, #f39c12 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(230, 162, 60, 0.4);
  transition: all 0.3s;
}

.format-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230, 162, 60, 0.5);
}

.btn-icon {
  margin-right: 0.5rem;
}

.progress-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(230, 162, 60, 0.1);
  border-radius: 12px;
}

.progress-text {
  text-align: center;
  margin-top: 1rem;
  font-size: 1rem;
  color: #e6a23c;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.message-section {
  margin-top: 1.5rem;
}

.result-section {
  margin-top: 2rem;
}

.result-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: none;
  border-radius: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.result-info {
  margin-bottom: 1rem;
}

.result-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.steps-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95) !important;
}

.steps-collapse {
  border: none;
}

:deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 1rem 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.help-content {
  padding: 1rem;
}

.help-content h4 {
  margin: 1rem 0 0.5rem 0;
  color: #1f2937;
}

.help-content ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #4b5563;
}

.help-content li {
  margin-bottom: 0.5rem;
}

.format-example {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  :deep(.el-main) {
    padding: 1rem;
  }

  .upload-container {
    padding: 1rem;
  }

  :deep(.el-upload-dragger) {
    height: 200px;
  }

  .upload-icon {
    font-size: 60px !important;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .result-actions {
    flex-direction: column;
  }

  .result-actions .el-button {
    width: 100%;
  }
}
</style>
