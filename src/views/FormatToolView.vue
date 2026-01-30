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
                  <h2>题目格式化工具</h2>
                  <p>使用 AI 将非标准格式的题目自动转换为标准格式（支持选择题、图片题、简答题）</p>
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
                accept=".docx,.doc,.wps,.txt"
              >
                <div class="upload-content">
                  <el-icon class="upload-icon" :size="80">
                    <UploadFilled />
                  </el-icon>
                  <div class="upload-text">
                    <p class="primary-text">拖拽文件到此处，或点击选择</p>
                    <p class="secondary-text">支持 .docx / .doc / .wps / .txt 格式</p>
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
                      <span>格式化完成！共识别出 {{ formatResult.count + formatResult.saq_count }} 道题目</span>
                    </div>
                    <div class="result-stats">
                      <el-tag v-if="formatResult.count > 0" type="primary" size="small">
                        选择题: {{ formatResult.count }} 道
                      </el-tag>
                      <el-tag v-if="formatResult.saq_count > 0" type="warning" size="small">
                        简答题: {{ formatResult.saq_count }} 道
                      </el-tag>
                      <el-tag v-if="formatResult.has_images" type="success" size="small">
                        图片: {{ formatResult.total_images }} 张
                      </el-tag>
                      <el-tag type="info" size="small">
                        模型: {{ formatResult.model_used || '默认' }}
                      </el-tag>
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

          <!-- PDF转DOCX工具 -->
          <el-card class="upload-card glass-effect pdf-card" shadow="hover">
            <div class="upload-container">
              <div class="tool-header pdf-header">
                <el-icon class="header-icon" :size="36"><Document /></el-icon>
                <div class="header-text">
                  <h2>PDF 转 DOCX 工具</h2>
                  <p>将 PDF 文件转换为可编辑的 Word 文档格式</p>
                </div>
              </div>

              <el-upload
                ref="pdfUploadRef"
                class="upload-dragger-area"
                drag
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handlePdfFileChange"
                accept=".pdf"
              >
                <div class="upload-content">
                  <el-icon class="upload-icon pdf-icon" :size="60">
                    <UploadFilled />
                  </el-icon>
                  <div class="upload-text">
                    <p class="primary-text">拖拽 PDF 文件到此处，或点击选择</p>
                    <p class="secondary-text">支持 .pdf 格式</p>
                  </div>
                </div>
              </el-upload>

              <transition name="el-zoom-in-top">
                <div v-if="pdfFile" class="file-info-section">
                  <el-card class="file-info-card pdf-file-card" shadow="never">
                    <div class="file-info-header">
                      <el-icon :size="24" color="#409eff"><Document /></el-icon>
                      <span class="file-name">{{ pdfFile.name }}</span>
                    </div>
                    <div class="file-details">
                      <div class="detail-item">
                        <el-icon><Files /></el-icon>
                        <span>大小: {{ formatFileSize(pdfFile.size) }}</span>
                      </div>
                    </div>
                  </el-card>

                  <div class="action-buttons">
                    <el-button
                      type="primary"
                      size="large"
                      :loading="pdfConverting"
                      :disabled="pdfConverting"
                      @click="handlePdfConvert"
                      round
                      class="convert-btn"
                    >
                      <el-icon v-if="!pdfConverting" class="btn-icon"><RefreshRight /></el-icon>
                      {{ pdfConverting ? '转换中...' : '转换为 DOCX' }}
                    </el-button>
                    <el-button
                      size="large"
                      :disabled="pdfConverting"
                      @click="handlePdfClear"
                      round
                    >
                      <el-icon><Close /></el-icon>
                      清除文件
                    </el-button>
                  </div>
                </div>
              </transition>

              <transition name="el-zoom-in-top">
                <div v-if="pdfConverting" class="progress-section">
                  <el-progress
                    :percentage="100"
                    :indeterminate="true"
                    :stroke-width="8"
                    striped
                    striped-flow
                    status="success"
                  />
                  <p class="progress-text" style="color: #409eff;">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    正在转换 PDF 文件，请稍候...
                  </p>
                </div>
              </transition>

              <transition name="el-zoom-in-top">
                <div v-if="pdfMessage" class="message-section">
                  <el-alert
                    :title="pdfMessage"
                    :type="pdfMessageType"
                    :closable="true"
                    show-icon
                    @close="pdfMessage = ''"
                  />
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
                  <h4>支持的题目类型</h4>
                  <ul>
                    <li><strong>选择题</strong>：单选题、多选题、不定项选择题</li>
                    <li><strong>图片题</strong>：题干含图片、选项含图片</li>
                    <li><strong>简答题</strong>：问答题、论述题等主观题</li>
                  </ul>
                  
                  <h4>支持输入的格式</h4>
                  <ul>
                    <li>选项在同一行：A.选项A B.选项B C.选项C D.选项D</li>
                    <li>无标点选项：A选项A B选项B</li>
                    <li>各种答案格式：【答案】A、正确答案：A、(A)等</li>
                    <li>简答题标记：四、简答题 / 问答题 等</li>
                  </ul>
                  
                  <h4>输出标准格式</h4>
                  <pre class="format-example">【选择题】
1. 题干内容
A. 选项A内容
B. 选项B内容
C. 选项C内容
D. 选项D内容
答案：A
解析：解析内容

【简答题】
1. 题干内容
答案：参考答案内容
解析：解析内容</pre>
                  
                  <h4>使用步骤</h4>
                  <el-steps :active="currentStep" finish-status="success" direction="vertical">
                    <el-step title="上传文件" description="选择包含题目的 .docx / .doc / .wps / .txt 文件（支持混合题型）" />
                    <el-step title="LLM 格式化" description="AI 自动识别题型并转换为标准格式" />
                    <el-step title="下载结果" description="预览并下载格式化后的 DOCX 文件" />
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
  Document,
  RefreshRight,
} from "@element-plus/icons-vue";
import { MCQ_BASE_URL } from "@/config/api/api";
import type { UploadFile } from "element-plus";

const formatting = ref(false);
const message = ref("");
const messageType = ref<"success" | "error" | "warning" | "info">("info");
const selectedFile = ref<File | null>(null);
const uploadRef = ref();
const activeSteps = ref(['1']);

// PDF转换相关状态
const pdfFile = ref<File | null>(null);
const pdfUploadRef = ref();
const pdfConverting = ref(false);
const pdfMessage = ref("");
const pdfMessageType = ref<"success" | "error" | "warning" | "info">("info");

const formatResult = reactive<{
  formatted_text: string;
  items: any[];
  count: number;
  saq_items: any[];
  saq_count: number;
  has_images: boolean;
  total_images: number;
  model_used: string;
  duplicate_msg: string;
}>({
  formatted_text: '',
  items: [],
  count: 0,
  saq_items: [],
  saq_count: 0,
  has_images: false,
  total_images: 0,
  model_used: '',
  duplicate_msg: ''
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
  formatResult.saq_items = [];
  formatResult.saq_count = 0;
  formatResult.has_images = false;
  formatResult.total_images = 0;
  formatResult.model_used = '';
  formatResult.duplicate_msg = '';
  
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
    fd.append('model_id', 'qwen-plus');  // 使用 qwen-plus 模型进行格式化
    
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
    formatResult.saq_items = j.saq_items || [];
    formatResult.saq_count = j.saq_count || 0;
    formatResult.has_images = j.has_images || false;
    formatResult.total_images = j.total_images || 0;
    formatResult.model_used = j.model_used || '';
    formatResult.duplicate_msg = j.duplicate_msg || '';
    
    message.value = j.format_msg || '格式化完成';
    messageType.value = "success";
    
    // 构建提示消息
    const totalCount = (j.count || 0) + (j.saq_count || 0);
    let successMsg = `格式化成功！识别出 ${totalCount} 道题目`;
    if (j.count > 0 && j.saq_count > 0) {
      successMsg = `格式化成功！选择题 ${j.count} 道，简答题 ${j.saq_count} 道`;
    }
    if (j.has_images) {
      successMsg += `，含 ${j.total_images} 张图片`;
    }
    ElMessage.success({
      message: successMsg,
      duration: 3000,
    });
    
    // 如果有重复题目，弹窗提示
    if (j.duplicate_msg) {
      setTimeout(() => {
        ElMessageBox.alert(j.duplicate_msg, '重复题目检测', {
          type: 'warning',
          confirmButtonText: '知道了'
        }).catch(() => {});
      }, 500);
    }
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
    const baseName = originalName.replace(/\.(docx|doc|wps|txt)$/i, '');
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
  const totalCount = formatResult.count + formatResult.saq_count;
  if (totalCount === 0) {
    ElMessage.warning('没有可预览的格式化结果');
    return;
  }
  
  // 获取题目类型标签
  const getTypeTag = (item: any) => {
    const qtype = item.qtype || '';
    if (qtype === 'saq') {
      return '<span style="background: #f56c6c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">简答</span>';
    } else if (qtype === 'single') {
      return '<span style="background: #409eff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">单选</span>';
    } else if (qtype === 'multi') {
      return '<span style="background: #e6a23c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">多选</span>';
    } else if (qtype === 'indeterminate') {
      return '<span style="background: #67c23a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">不定项</span>';
    }
    const answer = (item.answer || '').toUpperCase();
    if (answer.length > 1) {
      return '<span style="background: #e6a23c; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">多选</span>';
    }
    return '<span style="background: #409eff; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">单选</span>';
  };
  
  // 生成图片HTML（base64）
  const renderImages = (images: any[]) => {
    if (!images || images.length === 0) return '';
    return images.map((img: any) => {
      if (img.base64) {
        const contentType = img.content_type || 'image/png';
        return `<img src="data:${contentType};base64,${img.base64}" style="max-width: 200px; max-height: 150px; margin: 4px; border: 1px solid #e5e7eb; border-radius: 4px;" />`;
      }
      return '';
    }).join('');
  };
  
  // 构建选择题预览内容
  let previewHtml = '';
  
  if (formatResult.items.length > 0) {
    previewHtml += '<div style="margin-bottom: 16px;"><strong style="color: #409eff;">选择题</strong></div>';
    previewHtml += formatResult.items.map((item: any, idx: number) => {
      // 题干图片
      const stemImagesHtml = renderImages(item.stem_images);
      
      // 选项HTML（含图片）
      const optionsHtml = Object.entries(item.options || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => {
          const optImgs = item.option_images?.[k] || [];
          const optImgsHtml = renderImages(optImgs);
          return `<div style="margin-left: 20px;">${k}. ${v || ''}${optImgsHtml ? '<div>' + optImgsHtml + '</div>' : ''}</div>`;
        })
        .join('');
      
      return `
        <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa;">
          <div style="font-weight: 600; margin-bottom: 8px;">
            ${getTypeTag(item)}${idx + 1}. ${item.stem || '（题干为空）'}
          </div>
          ${stemImagesHtml ? '<div style="margin-bottom: 8px;">' + stemImagesHtml + '</div>' : ''}
          <div style="color: #4b5563;">${optionsHtml || '（无选项）'}</div>
          <div style="margin-top: 8px; color: ${item.answer ? '#10b981' : '#ef4444'};">
            答案：${item.answer || '（无）'}
          </div>
        </div>
      `;
    }).join('');
  }
  
  // 构建简答题预览内容
  if (formatResult.saq_items.length > 0) {
    previewHtml += '<div style="margin: 16px 0;"><strong style="color: #f56c6c;">简答题</strong></div>';
    previewHtml += formatResult.saq_items.map((item: any, idx: number) => {
      const stemImagesHtml = renderImages(item.stem_images);
      const answer = item.answer || item.reference_answer || '';
      
      return `
        <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #fde2e2; border-radius: 6px; background: #fef0f0;">
          <div style="font-weight: 600; margin-bottom: 8px;">
            ${getTypeTag(item)}${idx + 1}. ${item.stem || '（题干为空）'}
          </div>
          ${stemImagesHtml ? '<div style="margin-bottom: 8px;">' + stemImagesHtml + '</div>' : ''}
          <div style="margin-top: 8px; color: #606266;">
            <div style="font-weight: 500; color: #303133;">参考答案：</div>
            <div style="white-space: pre-wrap; margin-top: 4px; padding: 8px; background: white; border-radius: 4px;">${answer || '（无）'}</div>
          </div>
          ${item.explain_original ? `
            <div style="margin-top: 8px; color: #909399;">
              <div style="font-weight: 500;">解析：</div>
              <div style="white-space: pre-wrap; margin-top: 4px;">${item.explain_original}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }
  
  // 构建标题
  let dialogTitle = `格式化结果预览（共 ${totalCount} 题`;
  if (formatResult.count > 0 && formatResult.saq_count > 0) {
    dialogTitle = `格式化结果预览（选择题 ${formatResult.count} 道，简答题 ${formatResult.saq_count} 道`;
  }
  if (formatResult.has_images) {
    dialogTitle += `，含 ${formatResult.total_images} 张图片`;
  }
  dialogTitle += '）';
  
  ElMessageBox.alert(
    `<div style="max-height: 500px; overflow-y: auto;">${previewHtml}</div>`,
    dialogTitle,
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭',
      customClass: 'format-preview-dialog'
    }
  ).catch(() => {
    // 用户点击×关闭弹窗，忽略此事件
  });
};

const handleClear = () => {
  selectedFile.value = null;
  message.value = "";
  formatResult.formatted_text = '';
  formatResult.items = [];
  formatResult.count = 0;
  formatResult.saq_items = [];
  formatResult.saq_count = 0;
  formatResult.has_images = false;
  formatResult.total_images = 0;
  formatResult.model_used = '';
  formatResult.duplicate_msg = '';
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  ElMessage.info("已清除文件");
};

// ========== PDF转换功能 ==========
const handlePdfFileChange = (uploadFile: UploadFile) => {
  pdfMessage.value = "";
  pdfFile.value = uploadFile.raw || null;
  
  if (pdfFile.value) {
    ElMessage.success({
      message: `已选择PDF文件: ${pdfFile.value.name}`,
      duration: 2000,
    });
  }
};

const handlePdfConvert = async () => {
  if (!pdfFile.value) {
    ElMessage.warning("请先选择PDF文件");
    return;
  }

  pdfMessage.value = "";
  pdfConverting.value = true;

  try {
    const fd = new FormData();
    fd.append('file', pdfFile.value);
    
    const r = await fetch(`${MCQ_BASE_URL}/convert_pdf_to_docx`, { method: 'POST', body: fd });
    
    if (!r.ok) {
      // 尝试解析错误信息
      try {
        const errData = await r.json();
        throw new Error(errData.msg || `转换失败（HTTP ${r.status}）`);
      } catch {
        throw new Error(`转换失败（HTTP ${r.status}）`);
      }
    }
    
    // 下载转换后的文件
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const originalName = pdfFile.value?.name || 'document.pdf';
    const baseName = originalName.replace(/\.pdf$/i, '');
    a.download = `${baseName}.docx`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    pdfMessage.value = "PDF转换成功！文件已开始下载";
    pdfMessageType.value = "success";
    ElMessage.success('PDF转换成功，DOCX文件已下载');
    
  } catch (err: any) {
    const errorMsg = err?.message || "PDF转换失败";
    pdfMessage.value = errorMsg;
    pdfMessageType.value = "error";
    ElMessage.error({
      message: errorMsg,
      duration: 5000,
    });
    console.error("PDF convert error:", err);
  } finally {
    pdfConverting.value = false;
  }
};

const handlePdfClear = () => {
  pdfFile.value = null;
  pdfMessage.value = "";
  if (pdfUploadRef.value) {
    pdfUploadRef.value.clearFiles();
  }
  ElMessage.info("已清除PDF文件");
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

.result-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

/* PDF转换卡片样式 */
.pdf-card {
  margin-bottom: 2rem;
}

.pdf-header .header-icon {
  color: #409eff;
}

.pdf-icon {
  color: #409eff !important;
}

.pdf-card :deep(.el-upload-dragger) {
  height: 180px;
}

.pdf-card :deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  box-shadow: 0 12px 40px rgba(64, 158, 255, 0.2);
}

.pdf-file-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
}

.convert-btn {
  min-width: 180px;
  height: 48px;
  font-size: 1.05rem;
  font-weight: 600;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.4);
  transition: all 0.3s;
}

.convert-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
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

  .pdf-card :deep(.el-upload-dragger) {
    height: 160px;
  }
}
</style>
