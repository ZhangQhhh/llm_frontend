<template>
  <div class="report-generator-page">
    <el-container class="main-container">
      <el-main>
        <div class="content-wrapper">
          <!-- 主标题卡片 -->
          <el-card class="header-card glass-effect" shadow="hover">
            <div class="header-content">
              <el-icon :size="60" color="#409eff">
                <Document />
              </el-icon>
              <div class="header-text">
                <h1>数据分析</h1>
                <p>基于 Excel 数据智能生成专业对比分析 Word 报告</p>
              </div>
            </div>
          </el-card>

          <!-- 文件上传卡片 -->
          <el-card class="upload-card glass-effect" shadow="hover">
            <div class="card-title">
              <el-icon><UploadFilled /></el-icon>
              <span>上传数据文件</span>
            </div>

            <el-form ref="formRef" :model="form" label-width="140px" class="upload-form">
              <!-- 往年数据上传 -->
              <el-form-item label="往年数据">
                <div class="upload-section">
                  <el-upload
                    ref="previousUploadRef"
                    class="upload-area"
                    drag
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handlePreviousFileChange"
                    accept=".xlsx,.xls"
                  >
                    <div class="upload-content">
                      <el-icon class="upload-icon" :size="50">
                        <FolderOpened />
                      </el-icon>
                      <div class="upload-text">
                        <p class="primary-text">点击或拖拽上传往年数据</p>
                        <p class="secondary-text">仅支持 .xlsx 格式</p>
                      </div>
                    </div>
                  </el-upload>

                  <!-- 文件信息显示 -->
                  <transition name="el-zoom-in-top">
                    <div v-if="form.previousFile" class="file-info">
                      <el-tag type="success" size="large" closable @close="clearPreviousFile">
                        <el-icon><DocumentChecked /></el-icon>
                        {{ form.previousFile.name }}
                        <span class="file-size">{{ formatFileSize(form.previousFile.size) }}</span>
                      </el-tag>
                    </div>
                  </transition>
                </div>
              </el-form-item>

              <!-- 今年数据上传 -->
              <el-form-item label="今年数据">
                <div class="upload-section">
                  <el-upload
                    ref="currentUploadRef"
                    class="upload-area"
                    drag
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleCurrentFileChange"
                    accept=".xlsx,.xls"
                  >
                    <div class="upload-content">
                      <el-icon class="upload-icon" :size="50">
                        <FolderOpened />
                      </el-icon>
                      <div class="upload-text">
                        <p class="primary-text">点击或拖拽上传今年数据</p>
                        <p class="secondary-text">仅支持 .xlsx 格式</p>
                      </div>
                    </div>
                  </el-upload>

                  <!-- 文件信息显示 -->
                  <transition name="el-zoom-in-top">
                    <div v-if="form.currentFile" class="file-info">
                      <el-tag type="success" size="large" closable @close="clearCurrentFile">
                        <el-icon><DocumentChecked /></el-icon>
                        {{ form.currentFile.name }}
                        <span class="file-size">{{ formatFileSize(form.currentFile.size) }}</span>
                      </el-tag>
                    </div>
                  </transition>
                </div>
              </el-form-item>

              <!-- 操作按钮 -->
              <el-form-item>
                <div class="action-buttons">
                  <el-button
                    type="primary"
                    size="large"
                    :loading="loading"
                    :disabled="!canGenerate"
                    @click="handleGenerate"
                    round
                    class="generate-btn"
                  >
                    <el-icon v-if="!loading" class="btn-icon"><DocumentAdd /></el-icon>
                    {{ loading ? '生成中...' : '生成报告' }}
                  </el-button>
                  <el-button
                    size="large"
                    :disabled="loading"
                    @click="handleReset"
                    round
                  >
                    <el-icon><RefreshLeft /></el-icon>
                    重置
                  </el-button>
                </div>
              </el-form-item>
            </el-form>

            <!-- 生成进度 -->
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
                  正在分析数据并生成报告，请稍候...
                </p>
              </div>
            </transition>
          </el-card>

          <!-- 模板区 -->
          <el-card class="template-card glass-effect" shadow="hover">
            <div class="card-title">
              <el-icon><Collection /></el-icon>
              <span>模板区</span>
            </div>

            <div class="template-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>“更新历史csv”请严格按照示意文件.csv的字段顺序与格式填写。</span>
            </div>

            <div class="template-grid">
              <div v-for="item in templateFiles" :key="item.filename" class="template-item">
                <div class="template-left">
                  <el-icon class="template-icon"><Document /></el-icon>
                </div>
                <div class="template-body">
                  <div class="template-name">{{ item.title }}</div>
                  <div class="template-desc">{{ item.desc }}</div>
                  <div class="template-meta">{{ item.filename }}</div>
                </div>
                <div class="template-actions">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    :icon="Download"
                    @click="downloadTemplate(item)"
                  >
                    下载模板
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 使用说明卡片 -->
          <el-card class="info-card" shadow="hover">
            <el-collapse v-model="activeCollapse">
              <el-collapse-item name="1">
                <template #title>
                  <div class="collapse-title">
                    <el-icon><QuestionFilled /></el-icon>
                    <span>使用说明</span>
                  </div>
                </template>
                <div class="info-content">
                  <el-steps :active="currentStep" finish-status="success" align-center>
                    <el-step>
                      <template #icon>
                        <el-icon :size="24"><Upload /></el-icon>
                      </template>
                      <template #title>
                        <span class="step-title">上传往年数据</span>
                      </template>
                      <template #description>
                        <span class="step-desc">选择往年的 Excel 数据文件</span>
                      </template>
                    </el-step>
                    <el-step>
                      <template #icon>
                        <el-icon :size="24"><Upload /></el-icon>
                      </template>
                      <template #title>
                        <span class="step-title">上传今年数据</span>
                      </template>
                      <template #description>
                        <span class="step-desc">选择今年的 Excel 数据文件</span>
                      </template>
                    </el-step>
                    <el-step>
                      <template #icon>
                        <el-icon :size="24"><DocumentAdd /></el-icon>
                      </template>
                      <template #title>
                        <span class="step-title">生成报告</span>
                      </template>
                      <template #description>
                        <span class="step-desc">点击按钮生成对比分析报告</span>
                      </template>
                    </el-step>
                    <el-step>
                      <template #icon>
                        <el-icon :size="24"><Download /></el-icon>
                      </template>
                      <template #title>
                        <span class="step-title">下载报告</span>
                      </template>
                      <template #description>
                        <span class="step-desc">报告生成后自动下载 Word 文档</span>
                      </template>
                    </el-step>
                  </el-steps>

                  <el-divider />

                  <div class="tips-section">
                    <h4>
                      <el-icon><InfoFilled /></el-icon>
                      注意事项
                    </h4>
                    <ul class="tips-list">
                      <li>请确保上传的 Excel 文件格式正确，包含完整的数据字段</li>
                      <li>往年数据和今年数据的表格结构应保持一致</li>
                      <li>文件大小建议不超过 20MB，以确保处理速度</li>
                      <li>生成的报告将自动下载到您的默认下载文件夹</li>
                    </ul>
                  </div>
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
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import {
  Document,
  UploadFilled,
  FolderOpened,
  DocumentChecked,
  DocumentAdd,
  RefreshLeft,
  Loading,
  QuestionFilled,
  Upload,
  Download,
  InfoFilled,
  Collection
} from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import { davHttp } from '@/config/api/http';
import { API_ENDPOINTS } from '@/config/api/api';
const templateHistoryCsv = new URL('../assets/tem_file/示意文件.csv', import.meta.url).href;
const templateStaffXlsx = new URL('../assets/tem_file/20240801.xlsx', import.meta.url).href;
const templateFlightXls = new URL('../assets/tem_file/航班表2024.xls', import.meta.url).href;

interface FormData {
  previousFile: File | null;
  currentFile: File | null;
}

interface TemplateFile {
  title: string;
  filename: string;
  desc: string;
  url: string;
}

const form = ref<FormData>({
  previousFile: null,
  currentFile: null
});

const loading = ref(false);
const previousUploadRef = ref();
const currentUploadRef = ref();
const activeCollapse = ref(['1']);
const router = useRouter();
const templateFiles: TemplateFile[] = [
  {
    title: '更新历史CSV示意',
    filename: '示意文件.csv',
    desc: '用于“更新历史csv”上传，字段顺序与格式请与示意文件保持一致。',
    url: templateHistoryCsv
  },
  {
    title: '人员数据示意表',
    filename: '20240801.xlsx',
    desc: '人员数据模板示例，按示例表结构填写。',
    url: templateStaffXlsx
  },
  {
    title: '航班表示意表',
    filename: '航班表2024.xls',
    desc: '航班数据模板示例（xls）。',
    url: templateFlightXls
  }
];

// 计算当前步骤
const currentStep = computed(() => {
  if (!form.value.previousFile) return 0;
  if (!form.value.currentFile) return 1;
  if (loading.value) return 2;
  return 3;
});

// 是否可以生成报告
const canGenerate = computed(() => {
  return form.value.previousFile && form.value.currentFile && !loading.value;
});

// 检查文件格式
const checkFileFormat = async (file: File): Promise<boolean> => {
  const fileName = file.name.toLowerCase();
  
  // 只允许 .xlsx 格式
  if (!fileName.endsWith('.xlsx')) {
    if (fileName.endsWith('.xls')) {
      // 如果是 .xls 格式，提示用户转换
      try {
        await ElMessageBox.confirm(
          '检测到您上传的是 .xls 格式文件，本功能仅支持 .xlsx 格式。请前往 Excel 工具将文件转换为 .xlsx 格式后再继续。',
          '文件格式不支持',
          {
            confirmButtonText: '前往 Excel 工具',
            cancelButtonText: '取消',
            type: 'warning',
            center: true
          }
        );
        // 用户点击确认，跳转到 Excel 工具
        router.push('/excel-tool');
      } catch {
        // 用户点击取消，不做任何操作
      }
      return false;
    } else {
      // 其他格式直接提示错误
      ElMessage.error({
        message: '仅支持 .xlsx 格式的 Excel 文件',
        duration: 3000
      });
      return false;
    }
  }
  
  return true;
};

// 处理往年数据文件变化
const handlePreviousFileChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;
  
  // 验证文件格式
  const isValid = await checkFileFormat(file);
  if (!isValid) {
    // 清除上传的文件
    if (previousUploadRef.value) {
      previousUploadRef.value.clearFiles();
    }
    return;
  }
  
  form.value.previousFile = file;
  ElMessage.success({
    message: `已选择往年数据: ${file.name}`,
    duration: 2000
  });
};

// 处理今年数据文件变化
const handleCurrentFileChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;
  
  // 验证文件格式
  const isValid = await checkFileFormat(file);
  if (!isValid) {
    // 清除上传的文件
    if (currentUploadRef.value) {
      currentUploadRef.value.clearFiles();
    }
    return;
  }
  
  form.value.currentFile = file;
  ElMessage.success({
    message: `已选择今年数据: ${file.name}`,
    duration: 2000
  });
};

// 清除往年文件
const clearPreviousFile = () => {
  form.value.previousFile = null;
  if (previousUploadRef.value) {
    previousUploadRef.value.clearFiles();
  }
  ElMessage.info('已清除往年数据文件');
};

// 清除今年文件
const clearCurrentFile = () => {
  form.value.currentFile = null;
  if (currentUploadRef.value) {
    currentUploadRef.value.clearFiles();
  }
  ElMessage.info('已清除今年数据文件');
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// 下载模板文件
const downloadTemplate = (item: TemplateFile) => {
  const link = document.createElement('a');
  link.href = item.url;
  link.download = item.filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 生成报告
const handleGenerate = async () => {
  if (!form.value.previousFile || !form.value.currentFile) {
    ElMessage.warning('请先上传两个数据文件');
    return;
  }

  const formData = new FormData();
  formData.append('previousYearFile', form.value.previousFile);
  formData.append('currentYearFile', form.value.currentFile);

  loading.value = true;

  try {
    const response = await davHttp.post(
      API_ENDPOINTS.LLM_SUMMARY.DOX_SUMMARY,
      formData,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 900000 // 15分钟超时，报告生成需要较长时间
      }
    );

    // 获取文件名
    const contentDisposition = response.headers['content-disposition'];
    let filename = '出入境完整对比报告.docx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
      if (filenameMatch) {
        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }

    // 下载文件
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    ElMessage.success({
      message: '报告生成成功！文件已自动下载',
      duration: 3000
    });
  } catch (error: any) {
    console.error('生成报告失败:', error);
    const errorMsg = error.response?.data?.message || error.message || '报告生成失败，请稍后重试';
    ElMessage.error({
      message: errorMsg,
      duration: 5000
    });
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  form.value.previousFile = null;
  form.value.currentFile = null;
  if (previousUploadRef.value) {
    previousUploadRef.value.clearFiles();
  }
  if (currentUploadRef.value) {
    currentUploadRef.value.clearFiles();
  }
  ElMessage.info('已重置所有文件');
};
</script>

<style scoped>
.report-generator-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/deepbac.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  position: relative;
}

.report-generator-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 58, 183, 0.1) 100%);
  z-index: 0;
}

.main-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

:deep(.el-main) {
  padding: 2rem 3rem;
}

.content-wrapper {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 头部卡片 */
.header-card {
  margin-bottom: 2rem;
  border-radius: 20px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0;
}

.header-text h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #409eff 0%, #673ab7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-text p {
  font-size: 1rem;
  color: #7f8c8d;
  margin: 0;
}

/* 上传卡片 */
.upload-card {
  margin-bottom: 2rem;
  border-radius: 20px;
  padding: 2rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.upload-form {
  margin-top: 1.5rem;
}

.upload-section {
  width: 100%;
}

.upload-area {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: linear-gradient(135deg, #e8f4f8 0%, #d4ebf7 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
}

.upload-content {
  text-align: center;
}

.upload-icon {
  color: #409eff;
  margin-bottom: 1rem;
}

.upload-text .primary-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.upload-text .secondary-text {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
}

.file-info {
  margin-top: 1rem;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.el-tag) {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

:deep(.el-tag .el-icon) {
  margin-right: 0.5rem;
}

.file-size {
  margin-left: 0.5rem;
  color: #909399;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.generate-btn {
  min-width: 180px;
  height: 48px;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #409eff 0%, #673ab7 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.4);
  transition: all 0.3s;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  font-weight: 500;
}

/* 模板区 */
.template-card {
  margin-bottom: 2rem;
  border-radius: 20px;
  padding: 2rem;
}

.template-tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(103, 58, 183, 0.08) 100%);
  border-radius: 10px;
  color: #4b5563;
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
}

.template-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #eef2f7;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.template-item:hover {
  transform: translateY(-2px);
  border-color: #dbe7f4;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
}

.template-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(64, 158, 255, 0.1);
}

.template-icon {
  font-size: 20px;
  color: #409eff;
}

.template-body {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.template-desc {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.template-meta {
  font-size: 0.85rem;
  color: #9aa0a6;
  margin-top: 0.35rem;
}

.template-actions {
  flex-shrink: 0;
}

/* 说明卡片 */
.info-card {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95) !important;
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 1rem 0;
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 1.5rem 0;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #2c3e50;
}

.info-content {
  padding: 1rem;
}

:deep(.el-steps) {
  margin-bottom: 2rem;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.step-desc {
  font-size: 0.9rem;
  color: #606266;
}

.tips-section {
  margin-top: 1.5rem;
}

.tips-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f9ff 100%);
  border-left: 4px solid #409eff;
  border-radius: 6px;
  color: #5f6368;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-main) {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-text h1 {
    font-size: 1.5rem;
  }

  .header-text p {
    font-size: 0.9rem;
  }

  .upload-card {
    padding: 1.5rem;
  }

  :deep(.el-form-item__label) {
    width: 100% !important;
    text-align: left;
    margin-bottom: 0.5rem;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }

  :deep(.el-upload-dragger) {
    height: 150px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .template-card {
    padding: 1.5rem;
  }

  .template-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .template-actions {
    width: 100%;
  }

  .template-actions .el-button {
    width: 100%;
  }
}
</style>
