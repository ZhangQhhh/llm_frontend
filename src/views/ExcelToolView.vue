<template>
  <div class="excel-tool-container">
    <div class="excel-tool-content">
      <!-- 标题区域 -->
      <div class="header-section">
        <h1 class="page-title">
          <el-icon class="title-icon"><Document /></el-icon>
          Excel 格式转换工具
        </h1>
        <p class="page-description">
          支持将各种 Excel 格式（包括早期 BIFF2/3/4/5 的 .xls、.xlsx、.xlsb、.csv、.ods 等）转换为标准的 .xlsx 格式
        </p>
      </div>

      <!-- 上传区域 -->
      <div class="upload-section">
        <el-card shadow="hover" class="upload-card">
          <template #header>
            <div class="card-header">
              <el-icon><Upload /></el-icon>
              <span>选择文件</span>
            </div>
          </template>

          <div class="upload-area">
            <el-upload
              ref="uploadRef"
              class="upload-demo"
              drag
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleFileChange"
              accept=".xls,.xlsx,.xlsb,.csv,.tsv,.ods,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击选择</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 .xls / .xlsx / .xlsb / .csv / .tsv / .ods 等格式
                </div>
              </template>
            </el-upload>

            <!-- 文件信息显示 -->
            <div v-if="selectedFile" class="file-info">
              <el-alert
                :title="`已选择: ${selectedFile.name}`"
                type="info"
                :closable="false"
                show-icon
              >
                <template #default>
                  <div class="file-details">
                    <span>大小: {{ formatFileSize(selectedFile.size) }}</span>
                    <span>类型: {{ selectedFile.type || '未知' }}</span>
                  </div>
                </template>
              </el-alert>
              
              <!-- 编码提示 -->
              <el-alert
                v-if="selectedFile.name.toLowerCase().endsWith('.xls')"
                title="中文编码提示"
                type="warning"
                :closable="true"
                show-icon
                style="margin-top: 10px;"
              >
                <template #default>
                  <div style="font-size: 13px; line-height: 1.6;">
                    老旧的 .xls 文件已自动配置为 GBK 编码（中文）。<br>
                    如果转换后仍出现乱码，可能是文件本身编码异常，建议：<br>
                    1. 用 Excel 打开原文件，另存为新的 .xlsx 格式<br>
                    2. 或者在 Excel 中另存为 CSV（UTF-8）后再转换
                  </div>
                </template>
              </el-alert>
            </div>

            <!-- 转换按钮 -->
            <div v-if="selectedFile" class="action-buttons">
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                :disabled="loading"
                @click="handleConvert"
              >
                <el-icon v-if="!loading"><RefreshRight /></el-icon>
                {{ loading ? '转换中...' : '开始转换' }}
              </el-button>
              <el-button
                size="large"
                :disabled="loading"
                @click="handleClear"
              >
                <el-icon><Close /></el-icon>
                清除
              </el-button>
            </div>

            <!-- 状态消息 -->
            <div v-if="message" class="message-area">
              <el-alert
                :title="message"
                :type="messageType"
                :closable="true"
                show-icon
                @close="message = ''"
              />
            </div>
          </div>
        </el-card>
      </div>

      <!-- 功能说明 -->
      <div class="info-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-card shadow="hover" class="info-card">
              <template #header>
                <div class="info-card-header">
                  <el-icon color="#409eff"><Check /></el-icon>
                  <span>支持格式</span>
                </div>
              </template>
              <ul class="info-list">
                <li>早期 BIFF2/3/4/5/8 格式的 .xls</li>
                <li>现代 .xlsx / .xlsb 格式</li>
                <li>OpenDocument .ods 格式</li>
                <li>CSV / TSV 文本格式</li>
                <li>HTML 表格格式</li>
              </ul>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-card shadow="hover" class="info-card">
              <template #header>
                <div class="info-card-header">
                  <el-icon color="#67c23a"><Lightning /></el-icon>
                  <span>转换特点</span>
                </div>
              </template>
              <ul class="info-list">
                <li>纯前端转换，数据不上传服务器</li>
                <li>支持大多数 Excel 相关格式</li>
                <li>自动处理编码问题</li>
                <li>智能文本兜底机制</li>
                <li>输出标准 .xlsx 格式</li>
              </ul>
            </el-card>
          </el-col>

          <el-col :xs="24" :sm="12" :md="8">
            <el-card shadow="hover" class="info-card">
              <template #header>
                <div class="info-card-header">
                  <el-icon color="#e6a23c"><Warning /></el-icon>
                  <span>注意事项</span>
                </div>
              </template>
              <ul class="info-list">
                <li>文件损坏或截断可能导致失败</li>
                <li>加密/密码保护的文件无法转换</li>
                <li>超大文件（>100MB）可能卡顿</li>
                <li>伪装格式文件可能无法识别</li>
                <li>建议文件大小在 50MB 以内</li>
              </ul>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 使用说明 -->
      <div class="usage-section">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><QuestionFilled /></el-icon>
              <span>使用说明</span>
            </div>
          </template>
          <el-steps :active="currentStep" finish-status="success" align-center>
            <el-step title="选择文件" description="点击或拖拽上传 Excel 文件" />
            <el-step title="开始转换" description="点击转换按钮进行格式转换" />
            <el-step title="自动下载" description="转换完成后自动下载 .xlsx 文件" />
          </el-steps>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  Document,
  Upload,
  UploadFilled,
  RefreshRight,
  Close,
  Check,
  Lightning,
  Warning,
  QuestionFilled,
} from "@element-plus/icons-vue";
import { convertExcelToXlsx, downloadBlob } from "@/utils/excel-convert";
import type { UploadFile } from "element-plus";

const loading = ref(false);
const message = ref("");
const messageType = ref<"success" | "error" | "warning" | "info">("info");
const selectedFile = ref<File | null>(null);
const uploadRef = ref();

const currentStep = computed(() => {
  if (!selectedFile.value) return 0;
  if (loading.value) return 1;
  if (message.value && messageType.value === "success") return 3;
  return 1;
});

// 文件选择处理
const handleFileChange = (uploadFile: UploadFile) => {
  message.value = "";
  selectedFile.value = uploadFile.raw || null;
  
  if (selectedFile.value) {
    ElMessage.info(`已选择文件: ${selectedFile.value.name}`);
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

// 转换处理
const handleConvert = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择文件");
    return;
  }

  // 检查文件大小
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (selectedFile.value.size > maxSize) {
    ElMessage.warning("文件过大（超过 100MB），可能导致浏览器卡顿");
  }

  message.value = "";
  loading.value = true;

  try {
    const xlsxBlob = await convertExcelToXlsx(selectedFile.value);

    // 生成新文件名
    const originalName = selectedFile.value.name;
    const newName = originalName.replace(
      /\.(xls|xlsx|xlsb|csv|ods|tsv)$/i,
      ""
    ) + ".xlsx";

    // 下载文件
    downloadBlob(xlsxBlob, newName);

    message.value = `转换成功！文件已下载: ${newName}`;
    messageType.value = "success";
    ElMessage.success("转换成功！");
  } catch (err: any) {
    const errorMsg = err?.message || "转换失败，请检查文件格式";
    message.value = errorMsg;
    messageType.value = "error";
    ElMessage.error(errorMsg);
    console.error("Excel conversion error:", err);
  } finally {
    loading.value = false;
  }
};

// 清除选择
const handleClear = () => {
  selectedFile.value = null;
  message.value = "";
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};
</script>

<style scoped>
.excel-tool-container {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.excel-tool-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* 标题区域 */
.header-section {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.title-icon {
  font-size: 2.5rem;
}

.page-description {
  font-size: 1.1rem;
  opacity: 0.95;
  line-height: 1.6;
}

/* 上传区域 */
.upload-section {
  margin-bottom: 2rem;
}

.upload-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.upload-area {
  padding: 1rem;
}

.upload-demo {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 3rem 2rem;
  border-radius: 8px;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.el-icon--upload {
  font-size: 4rem;
  color: #409eff;
  margin-bottom: 1rem;
}

.el-upload__text {
  font-size: 1rem;
  color: #606266;
}

.el-upload__text em {
  color: #409eff;
  font-style: normal;
}

.el-upload__tip {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #909399;
}

/* 文件信息 */
.file-info {
  margin-top: 1.5rem;
}

.file-details {
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.action-buttons .el-button {
  min-width: 140px;
}

/* 消息区域 */
.message-area {
  margin-top: 1.5rem;
}

/* 信息卡片 */
.info-section {
  margin-bottom: 2rem;
}

.info-card {
  height: 100%;
  border-radius: 8px;
  transition: transform 0.3s;
}

.info-card:hover {
  transform: translateY(-4px);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  padding: 0.5rem 0;
  color: #606266;
  font-size: 0.95rem;
  line-height: 1.6;
  position: relative;
  padding-left: 1.2rem;
}

.info-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #409eff;
  font-weight: bold;
}

/* 使用说明 */
.usage-section {
  margin-bottom: 2rem;
}

:deep(.el-step__title) {
  font-size: 1rem;
}

:deep(.el-step__description) {
  font-size: 0.9rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .excel-tool-container {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .page-description {
    font-size: 1rem;
  }

  .file-details {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .info-section {
    margin-bottom: 1rem;
  }

  .info-section .el-col {
    margin-bottom: 1rem;
  }
}
</style>
