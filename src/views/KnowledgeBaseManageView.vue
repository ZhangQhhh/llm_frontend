<template>
  <div class="kb-manage-page">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <el-icon class="title-icon"><FolderOpened /></el-icon>
            <div class="title-text">
              <h1>知识库管理</h1>
              <p class="subtitle">管理知识库文档，支持上传、删除和索引重建</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="showPasswordDialog = true">
              <el-icon><Key /></el-icon>
              {{ kbPassword ? '已验证口令' : '输入口令' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 知识库选择和状态 -->
      <el-card class="control-card" shadow="hover">
        <div class="control-section">
          <div class="kb-selector">
            <span class="label">选择知识库：</span>
            <el-select v-model="currentKB" placeholder="选择知识库" @change="handleKBChange">
              <el-option
                v-for="kb in kbTypes"
                :key="kb.value"
                :label="kb.label"
                :value="kb.value"
              >
                <div class="kb-option">
                  <span class="kb-name">{{ kb.label }}</span>
                  <span class="kb-desc">{{ kb.description }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <div class="status-section">
            <div class="status-item" v-if="kbStatus">
              <el-tag :type="kbStatus.updating ? 'warning' : 'success'" effect="dark">
                {{ kbStatus.updating ? '更新中' : '就绪' }}
              </el-tag>
              <span class="status-text" v-if="kbStatus.updating">{{ kbStatus.progress }}</span>
              <span class="status-text" v-else>共 {{ kbStatus.file_count }} 个文件</span>
            </div>
            <el-button
              type="warning"
              plain
              size="small"
              :loading="rebuildLoading"
              :disabled="!kbPassword || (kbStatus && kbStatus.updating)"
              @click="handleRebuild"
            >
              <el-icon><Refresh /></el-icon>
              重建索引
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 上传区域 -->
      <el-card class="upload-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><Upload /></el-icon> 上传文件</span>
            <el-tag type="info" size="small">支持: {{ supportedTypes.join(', ') }}</el-tag>
          </div>
        </template>

        <el-upload
          ref="uploadRef"
          class="upload-area"
          drag
          :action="''"
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeUpload"
          :file-list="fileList"
          :accept="acceptTypes"
          :disabled="!kbPassword"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              单个文件最大 50MB，支持 txt, md, docx, doc, pdf, csv, json, html 格式
            </div>
          </template>
        </el-upload>

        <div class="upload-actions" v-if="fileList.length > 0">
          <el-checkbox v-model="autoRebuild">上传后自动重建索引</el-checkbox>
          <el-button
            type="primary"
            :loading="uploadLoading"
            :disabled="!kbPassword"
            @click="handleUpload"
          >
            <el-icon><Upload /></el-icon>
            开始上传 ({{ fileList.length }} 个文件)
          </el-button>
        </div>

        <el-alert
          v-if="!kbPassword"
          title="请先输入知识库操作口令（向后端管理员获取）"
          type="warning"
          :closable="false"
          show-icon
          class="password-alert"
        />
      </el-card>

      <!-- 文件列表 -->
      <el-card class="files-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><Document /></el-icon> 文件列表</span>
            <div class="header-right">
              <span class="file-count" v-if="files.length > 0">
                共 {{ files.length }} 个文件，总大小 {{ formatFileSize(totalSize) }}
              </span>
              <el-button text type="primary" @click="loadFiles" :loading="loading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="files"
          v-loading="loading"
          stripe
          style="width: 100%"
          empty-text="暂无文件"
        >
          <el-table-column prop="name" label="文件名" min-width="300">
            <template #default="{ row }">
              <div class="file-name">
                <el-icon class="file-icon"><Document /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="modified" label="修改时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.modified) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-popconfirm
                title="确定要删除这个文件吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                @confirm="handleDelete(row.name)"
              >
                <template #reference>
                  <el-button
                    type="danger"
                    text
                    size="small"
                    :disabled="!kbPassword"
                    :loading="deleteLoading === row.name"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 更新状态详情 -->
      <el-card class="status-card" shadow="hover" v-if="allKBStatus">
        <template #header>
          <div class="card-header">
            <span><el-icon><DataAnalysis /></el-icon> 知识库状态概览</span>
          </div>
        </template>

        <div class="status-grid">
          <div
            v-for="(status, kbType) in allKBStatus"
            :key="kbType"
            class="status-item-card"
            :class="{ 'is-updating': status.updating }"
          >
            <div class="status-header">
              <span class="kb-name">{{ getKBLabel(String(kbType)) }}</span>
              <el-tag :type="status.updating ? 'warning' : 'success'" size="small">
                {{ status.updating ? '更新中' : '就绪' }}
              </el-tag>
            </div>
            <div class="status-body">
              <div class="stat-row">
                <span class="stat-label">文件数量</span>
                <span class="stat-value">{{ status.file_count }}</span>
              </div>
              <div class="stat-row" v-if="status.updating">
                <span class="stat-label">进度</span>
                <span class="stat-value">{{ status.progress }}</span>
              </div>
              <div class="stat-row" v-if="status.duration_seconds">
                <span class="stat-label">耗时</span>
                <span class="stat-value">{{ formatDuration(status.duration_seconds) }}</span>
              </div>
              <div class="stat-row error" v-if="status.last_error">
                <span class="stat-label">错误</span>
                <span class="stat-value">{{ status.last_error }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 口令设置对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="输入知识库操作口令"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="请输入后端管理员提供的知识库操作口令"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-form>
        <el-form-item label="操作口令">
          <el-input
            v-model="passwordInput"
            type="password"
            placeholder="请输入口令"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="savePassword">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  FolderOpened, Key, Upload, UploadFilled, Document, Delete,
  Refresh, DataAnalysis
} from '@element-plus/icons-vue';
import {
  listFiles,
  uploadFile,
  deleteFile,
  getUpdateStatus,
  isUpdating,
  triggerRebuild,
  getKBPassword,
  setKBPassword,
  formatFileSize,
  formatDateTime,
  KB_TYPES,
  SUPPORTED_FILE_TYPES,
  type KBFile,
  type KBStatusItem
} from '@/utils/knowledgeBaseApi';

export default defineComponent({
  name: 'KnowledgeBaseManageView',
  components: {
    FolderOpened, Key, Upload, UploadFilled, Document, Delete,
    Refresh, DataAnalysis
  },
  setup() {
    const currentKB = ref('general');
    const files = ref<KBFile[]>([]);
    const totalSize = ref(0);
    const loading = ref(false);
    const uploadLoading = ref(false);
    const deleteLoading = ref<string | null>(null);
    const rebuildLoading = ref(false);

    const kbPassword = ref(getKBPassword());
    const showPasswordDialog = ref(false);
    const passwordInput = ref('');

    const fileList = ref<any[]>([]);
    const autoRebuild = ref(true);
    const uploadRef = ref();

    const kbStatus = ref<KBStatusItem | null>(null);
    const allKBStatus = ref<Record<string, KBStatusItem> | null>(null);

    let statusPollingTimer: number | null = null;

    const kbTypes = KB_TYPES;
    const supportedTypes = SUPPORTED_FILE_TYPES;
    const acceptTypes = computed(() => supportedTypes.map(t => `.${t}`).join(','));

    // 加载文件列表
    const loadFiles = async () => {
      loading.value = true;
      try {
        const response = await listFiles(currentKB.value);
        if (response.ok) {
          files.value = response.files;
          totalSize.value = response.total_size;
        } else {
          ElMessage.error('加载文件列表失败');
        }
      } catch (error: any) {
        ElMessage.error(error.message || '加载文件列表失败');
      } finally {
        loading.value = false;
      }
    };

    // 加载状态
    const loadStatus = async () => {
      try {
        const response = await getUpdateStatus();
        if (response.ok) {
          allKBStatus.value = response.data;
          if (response.data[currentKB.value]) {
            kbStatus.value = response.data[currentKB.value];
          }
        }
      } catch (error) {
        console.error('加载状态失败:', error);
      }
    };

    // 开始状态轮询
    const startStatusPolling = () => {
      if (statusPollingTimer) return;
      statusPollingTimer = window.setInterval(async () => {
        const response = await isUpdating();
        if (response.ok && response.updating) {
          await loadStatus();
        } else if (response.ok && !response.updating) {
          await loadStatus();
          await loadFiles();
        }
      }, 3000);
    };

    // 停止状态轮询
    const stopStatusPolling = () => {
      if (statusPollingTimer) {
        clearInterval(statusPollingTimer);
        statusPollingTimer = null;
      }
    };

    // 切换知识库
    const handleKBChange = async () => {
      await loadFiles();
      await loadStatus();
    };

    // 文件选择变化
    const handleFileChange = (file: any, fileListNew: any[]) => {
      fileList.value = fileListNew;
    };

    // 上传前校验
    const beforeUpload = (file: File) => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        ElMessage.error(`文件 ${file.name} 超过 50MB 限制`);
        return false;
      }
      return true;
    };

    // 执行上传
    const handleUpload = async () => {
      if (!kbPassword.value) {
        ElMessage.warning('请先设置知识库操作口令');
        showPasswordDialog.value = true;
        return;
      }

      if (fileList.value.length === 0) {
        ElMessage.warning('请选择要上传的文件');
        return;
      }

      uploadLoading.value = true;
      let successCount = 0;
      let failCount = 0;

      try {
        for (const fileItem of fileList.value) {
          try {
            const response = await uploadFile(
              fileItem.raw,
              currentKB.value,
              autoRebuild.value,
              kbPassword.value
            );
            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              ElMessage.error(`${fileItem.name}: ${response.message}`);
            }
          } catch (error: any) {
            failCount++;
            if (error.response?.status === 403) {
              ElMessage.error('口令错误，请重新设置');
              kbPassword.value = '';
              setKBPassword('');
              break;
            }
            ElMessage.error(`${fileItem.name}: ${error.message || '上传失败'}`);
          }
        }

        if (successCount > 0) {
          ElMessage.success(`成功上传 ${successCount} 个文件${failCount > 0 ? `，${failCount} 个失败` : ''}`);
          fileList.value = [];
          if (uploadRef.value) {
            uploadRef.value.clearFiles();
          }
          await loadFiles();
          if (autoRebuild.value) {
            startStatusPolling();
          }
        }
      } finally {
        uploadLoading.value = false;
        await loadStatus();
      }
    };

    // 删除文件
    const handleDelete = async (fileName: string) => {
      if (!kbPassword.value) {
        ElMessage.warning('请先设置知识库操作口令');
        showPasswordDialog.value = true;
        return;
      }

      deleteLoading.value = fileName;
      try {
        const response = await deleteFile(fileName, currentKB.value, kbPassword.value);
        if (response.ok) {
          ElMessage.success(response.message);
          await loadFiles();
          if (response.need_rebuild) {
            ElMessage.warning('建议手动重建索引');
          }
        } else {
          ElMessage.error(response.message);
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          ElMessage.error('口令错误，请重新设置');
          kbPassword.value = '';
          setKBPassword('');
        } else {
          ElMessage.error(error.message || '删除失败');
        }
      } finally {
        deleteLoading.value = null;
      }
    };

    // 重建索引
    const handleRebuild = async () => {
      if (!kbPassword.value) {
        ElMessage.warning('请先设置知识库操作口令');
        showPasswordDialog.value = true;
        return;
      }

      rebuildLoading.value = true;
      try {
        const response = await triggerRebuild(currentKB.value, kbPassword.value);
        if (response.ok) {
          ElMessage.success(response.message);
          startStatusPolling();
        } else {
          ElMessage.error(response.message);
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          ElMessage.error('口令错误，请重新设置');
          kbPassword.value = '';
          setKBPassword('');
        } else {
          ElMessage.error(error.message || '重建失败');
        }
      } finally {
        rebuildLoading.value = false;
        await loadStatus();
      }
    };

    // 保存口令
    const savePassword = () => {
      if (!passwordInput.value.trim()) {
        ElMessage.warning('请输入口令');
        return;
      }
      kbPassword.value = passwordInput.value.trim();
      setKBPassword(kbPassword.value);
      showPasswordDialog.value = false;
      passwordInput.value = '';
      ElMessage.success('口令已保存');
    };

    // 获取知识库标签
    const getKBLabel = (kbType: string): string => {
      const kb = KB_TYPES.find(k => k.value === kbType);
      return kb ? kb.label : kbType;
    };

    // 格式化耗时
    const formatDuration = (seconds: number): string => {
      if (seconds < 60) return `${seconds.toFixed(1)} 秒`;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes} 分 ${secs.toFixed(0)} 秒`;
    };

    onMounted(async () => {
      await loadFiles();
      await loadStatus();
      startStatusPolling();
    });

    onUnmounted(() => {
      stopStatusPolling();
    });

    return {
      currentKB,
      files,
      totalSize,
      loading,
      uploadLoading,
      deleteLoading,
      rebuildLoading,
      kbPassword,
      showPasswordDialog,
      passwordInput,
      fileList,
      autoRebuild,
      uploadRef,
      kbStatus,
      allKBStatus,
      kbTypes,
      supportedTypes,
      acceptTypes,
      loadFiles,
      handleKBChange,
      handleFileChange,
      beforeUpload,
      handleUpload,
      handleDelete,
      handleRebuild,
      savePassword,
      getKBLabel,
      formatFileSize,
      formatDateTime,
      formatDuration
    };
  }
});
</script>

<style scoped>
.kb-manage-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 24px;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 24px 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  font-size: 48px;
  color: #409eff;
}

.title-text h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #909399;
}

.control-card {
  margin-bottom: 24px;
}

.control-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.kb-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kb-selector .label {
  font-weight: 500;
  color: #606266;
}

.kb-selector .el-select {
  width: 240px;
}

.kb-option {
  display: flex;
  flex-direction: column;
}

.kb-option .kb-name {
  font-weight: 500;
}

.kb-option .kb-desc {
  font-size: 12px;
  color: #909399;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 14px;
  color: #606266;
}

.upload-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 40px 20px;
}

.upload-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.password-alert {
  margin-top: 16px;
}

.files-card {
  margin-bottom: 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-count {
  font-size: 14px;
  color: #909399;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #409eff;
}

.status-card {
  margin-bottom: 24px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.status-item-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.status-item-card.is-updating {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-header .kb-name {
  font-weight: 600;
  color: #303133;
}

.status-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.stat-label {
  color: #909399;
}

.stat-value {
  color: #606266;
  font-weight: 500;
}

.stat-row.error .stat-value {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .kb-manage-page {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .control-section {
    flex-direction: column;
    align-items: stretch;
  }

  .kb-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .kb-selector .el-select {
    width: 100%;
  }

  .status-section {
    justify-content: center;
  }

  .upload-actions {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
