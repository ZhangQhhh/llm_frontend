<template>
  <div class="excel-tool-page">
    <el-container class="main-container">
      <el-main>
        <div class="content-wrapper">
          <!-- 主上传卡片 -->
          <el-card class="upload-card glass-effect" shadow="hover">
            <div class="upload-container">
              <!-- 拖拽上传区 -->
              <el-upload
                ref="uploadRef"
                class="upload-dragger-area"
                drag
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleFileChange"
                accept=".xls,.xlsx,.xlsb,.csv,.tsv,.ods,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              >
                <div class="upload-content">
                  <el-icon class="upload-icon" :size="80">
                    <UploadFilled />
                  </el-icon>
                  <div class="upload-text">
                    <p class="primary-text">拖拽文件到此处，或点击选择</p>
                    <p class="secondary-text">支持 .xls / .xlsx / .xlsb / .csv / .tsv / .ods 等格式</p>
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
                      <div class="detail-item">
                        <el-icon><Document /></el-icon>
                        <span>类型: {{ selectedFile.type || '未知' }}</span>
                      </div>
                    </div>
                  </el-card>

                  <!-- 编码提示 -->
                  <transition name="el-fade-in">
                    <el-alert
                      v-if="selectedFile.name.toLowerCase().endsWith('.xls')"
                      title="中文编码优化"
                      type="success"
                      :closable="false"
                      show-icon
                      class="encoding-alert"
                    >
                      <template #default>
                        <div class="alert-content">
                          已自动配置 GBK 编码支持，确保中文正确显示
                        </div>
                      </template>
                    </el-alert>
                  </transition>

                  <!-- 操作按钮 -->
                  <div class="action-buttons">
                    <el-button
                      type="primary"
                      size="large"
                      :loading="loading"
                      :disabled="loading"
                      @click="handleConvert"
                      round
                      class="convert-btn"
                    >
                      <el-icon v-if="!loading" class="btn-icon"><RefreshRight /></el-icon>
                      {{ loading ? '转换中...' : '开始转换' }}
                    </el-button>
                    <el-button
                      size="large"
                      :disabled="loading"
                      @click="handleClear"
                      round
                    >
                      <el-icon><Close /></el-icon>
                      清除文件
                    </el-button>
                  </div>
                </div>
              </transition>

              <!-- 转换进度 -->
              <transition name="el-zoom-in-top">
                <div v-if="loading" class="progress-section">
                  <el-progress
                    :percentage="100"
                    :indeterminate="true"
                    :stroke-width="8"
                    striped
                    striped-flow
                  />
                  <p class="progress-text">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    正在转换文件，请稍候...
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
            </div>
          </el-card>

          <!-- 使用步骤 -->
          <el-card class="steps-card" shadow="hover">
            <el-collapse v-model="activeSteps" class="steps-collapse">
              <el-collapse-item name="1">
                <template #title>
                  <div class="card-header">
                    <el-icon><QuestionFilled /></el-icon>
                    <span>使用步骤</span>
                  </div>
                </template>
                <el-steps :active="currentStep" finish-status="success" align-center>
                  <el-step>
                    <template #icon>
                      <el-icon :size="24"><Upload /></el-icon>
                    </template>
                    <template #title>
                      <span class="step-title">选择文件</span>
                    </template>
                    <template #description>
                      <span class="step-desc">拖拽或点击上传 Excel 文件</span>
                    </template>
                  </el-step>
                  <el-step>
                    <template #icon>
                      <el-icon :size="24"><RefreshRight /></el-icon>
                    </template>
                    <template #title>
                      <span class="step-title">开始转换</span>
                    </template>
                    <template #description>
                      <span class="step-desc">点击转换按钮进行格式转换</span>
                    </template>
                  </el-step>
                  <el-step>
                    <template #icon>
                      <el-icon :size="24"><Download /></el-icon>
                    </template>
                    <template #title>
                      <span class="step-title">自动下载</span>
                    </template>
                    <template #description>
                      <span class="step-desc">转换完成后自动下载文件</span>
                    </template>
                  </el-step>
                </el-steps>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>
      </el-main>
    </el-container>
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
  QuestionFilled,
  Loading,
  DocumentChecked,
  Files,
  Download,
} from "@element-plus/icons-vue";
import { convertExcelToXlsx, downloadBlob } from "@/utils/excel-convert";
import type { UploadFile } from "element-plus";

const loading = ref(false);
const message = ref("");
const messageType = ref<"success" | "error" | "warning" | "info">("info");
const selectedFile = ref<File | null>(null);
const uploadRef = ref();
const activeSteps = ref(['1']); // 默认展开

const currentStep = computed(() => {
  if (!selectedFile.value) return 0;
  if (loading.value) return 1;
  if (message.value && messageType.value === "success") return 3;
  return 1;
});

const handleFileChange = (uploadFile: UploadFile) => {
  message.value = "";
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

const handleConvert = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择文件");
    return;
  }

  const maxSize = 100 * 1024 * 1024;
  if (selectedFile.value.size > maxSize) {
    ElMessage.warning("文件过大（超过 100MB），可能导致浏览器卡顿");
  }

  message.value = "";
  loading.value = true;

  try {
    const xlsxBlob = await convertExcelToXlsx(selectedFile.value);
    const originalName = selectedFile.value.name;
    const newName = originalName.replace(/\.(xls|xlsx|xlsb|csv|ods|tsv)$/i, "") + ".xlsx";

    downloadBlob(xlsxBlob, newName);

    message.value = `转换成功！文件已下载: ${newName}`;
    messageType.value = "success";
    ElMessage.success({
      message: "转换成功！文件已自动下载",
      duration: 3000,
    });
  } catch (err: any) {
    const errorMsg = err?.message || "转换失败，请检查文件格式";
    message.value = errorMsg;
    messageType.value = "error";
    ElMessage.error({
      message: errorMsg,
      duration: 5000,
    });
    console.error("Excel conversion error:", err);
  } finally {
    loading.value = false;
  }
};

const handleClear = () => {
  selectedFile.value = null;
  message.value = "";
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  ElMessage.info("已清除文件");
};
</script>

<style scoped>
.excel-tool-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/girl.jpg') no-repeat 0% 30%;
  background-size: cover;
  background-attachment: fixed;
  position: relative;
}

.excel-tool-page::before {
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
}

.main-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.page-header {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem 3rem;
  height: auto !important;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  padding: 5px;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.brand-text h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-text p {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.5px;
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

.upload-dragger-area {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 280px;
  border: 3px dashed #d9d9d9;
  border-radius: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(64, 158, 255, 0.2);
}

.upload-content {
  text-align: center;
}

.upload-icon {
  color: #409eff;
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
  position: relative;
  padding-left: 1.5rem;
  line-height: 1.6;
}

.encoding-alert {
  margin-bottom: 1.5rem;
  border-radius: 12px;
}

.alert-content {
  font-size: 0.95rem;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.convert-btn {
  min-width: 160px;
  height: 48px;
  font-size: 1.05rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
}

.convert-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-icon {
  margin-right: 0.5rem;
}

.progress-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 12px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.progress-text {
  text-align: center;
  margin-top: 1rem;
  font-size: 1rem;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.message-section {
  margin-top: 1.5rem;
}

.features-section {
  margin-bottom: 2rem;
}

.feature-card {
  height: 100%;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2) !important;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.3) !important;
}

.feature-content {
  text-align: center;
  padding: 1rem;
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: inline-block;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: inline-block;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.feature-list li {
  padding: 0.6rem 0.8rem;
  color: #374151;
  font-size: 0.95rem;
  position: relative;
  padding-left: 2rem;
  line-height: 1.8;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.85);
  margin-bottom: 0.5rem;
  border-radius: 6px;
}

.feature-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #67c23a;
  font-weight: bold;
  font-size: 1.1rem;
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
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  margin: -1rem -1rem 1rem -1rem;
}

:deep(.el-steps) {
  padding: 2rem 1rem;
}

.step-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.step-desc {
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 1rem;
  }

  .brand {
    gap: 1rem;
  }

  .logo-icon {
    width: 50px;
    height: 50px;
  }

  .brand-text h1 {
    font-size: 1.5rem;
  }

  .brand-text p {
    font-size: 0.85rem;
  }

  :deep(.el-main) {
    padding: 1rem;
  }

  .upload-container {
    padding: 1rem;
  }

  :deep(.el-upload-dragger) {
    height: 220px;
  }

  .upload-icon {
    font-size: 60px !important;
  }

  .upload-text .primary-text {
    font-size: 1.1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .file-details {
    flex-direction: column;
    gap: 0.75rem;
  }

  .features-section .el-col {
    margin-bottom: 1rem;
  }

  :deep(.el-steps) {
    padding: 1rem 0.5rem;
  }
}
</style>