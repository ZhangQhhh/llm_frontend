<template>
  <div class="resource-center-page">
    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <h1>
          <el-icon class="header-icon"><FolderOpened /></el-icon>
          资料中心
        </h1>
        <p class="subtitle">{{ isAdmin ? '管理和分享各类资源' : '查看和下载各类资源' }}</p>
      </header>

      <!-- 管理员上传区域 -->
      <el-card v-if="isAdmin" class="upload-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Upload /></el-icon>
            <span>上传资料</span>
          </div>
        </template>
        <el-form :model="uploadForm" label-width="80px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="文件类型">
                <el-radio-group v-model="uploadForm.fileType" @change="handleUploadTypeChange">
                  <el-radio-button value="video">
                    <el-icon><VideoCamera /></el-icon> 视频
                  </el-radio-button>
                  <el-radio-button value="pdf">
                    <el-icon><Document /></el-icon> PDF
                  </el-radio-button>
                  <el-radio-button value="ppt">
                    <el-icon><Tickets /></el-icon> PPT
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="选择文件">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :limit="1"
                  :on-change="handleFileChange"
                  :on-remove="handleFileRemove"
                  :accept="acceptFileTypes"
                  drag
                  class="resource-upload"
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">
                    拖拽文件到这里，或 <em>点击选择</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      {{ uploadTipText }}
                    </div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="资料标题">
                <el-input v-model="uploadForm.title" placeholder="请输入资料标题" clearable />
              </el-form-item>
              <el-form-item label="资料描述">
                <el-input
                  v-model="uploadForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入资料描述（可选）"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="uploading"
                  :disabled="!selectedFile"
                  @click="handleUpload"
                  size="large"
                  class="upload-btn"
                >
                  <el-icon><Upload /></el-icon>
                  {{ uploading ? '上传中...' : '开始上传' }}
                </el-button>
              </el-form-item>
              <el-progress
                v-if="uploading"
                :percentage="uploadProgress"
                :status="uploadProgress === 100 ? 'success' : undefined"
                :stroke-width="10"
                style="margin-top: 10px"
              />
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 资料列表 -->
      <el-card class="resource-list-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-icon><Folder /></el-icon>
              <span>资料列表</span>
              <el-tag type="info" size="small" style="margin-left: 10px">
                共 {{ filteredResources.length }} 个资料
              </el-tag>
            </div>
            <div class="header-right">
              <el-radio-group v-model="filterType" size="small" style="margin-right: 15px">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="video">
                  <el-icon><VideoCamera /></el-icon> 视频
                </el-radio-button>
                <el-radio-button value="pdf">
                  <el-icon><Document /></el-icon> PDF
                </el-radio-button>
                <el-radio-button value="ppt">
                  <el-icon><Tickets /></el-icon> PPT
                </el-radio-button>
              </el-radio-group>
              <el-button type="primary" :icon="Refresh" @click="loadResources" :loading="loading">
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <p>加载中...</p>
        </div>

        <el-empty v-else-if="filteredResources.length === 0" description="暂无资料" />

        <div v-else class="resource-grid">
          <el-card
            v-for="resource in filteredResources"
            :key="resource.id"
            class="resource-item"
            shadow="hover"
            @click="openResource(resource)"
          >
            <div class="resource-thumbnail" :class="`type-${resource.file_type}`">
              <el-icon class="type-icon">
                <VideoPlay v-if="resource.file_type === 'video'" />
                <Document v-else-if="resource.file_type === 'pdf'" />
                <Tickets v-else-if="resource.file_type === 'ppt'" />
                <Document v-else />
              </el-icon>
              <div class="resource-size">
                {{ formatFileSize(resource.size) }}
              </div>
              <div class="resource-type-badge">
                {{ getFileTypeLabel(resource.file_type) }}
              </div>
            </div>
            <div class="resource-info">
              <h3 class="resource-title" :title="resource.title">{{ resource.title }}</h3>
              <p class="resource-description" v-if="resource.description">{{ resource.description }}</p>
              <div class="resource-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ resource.uploader }}
                </span>
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(resource.upload_time) }}
                </span>
              </div>
              <div class="resource-actions" @click.stop>
                <el-button-group>
                  <el-button size="small" type="primary" @click="openResource(resource)">
                    <el-icon>
                      <VideoPlay v-if="resource.file_type === 'video'" />
                      <View v-else />
                    </el-icon>
                    {{ resource.file_type === 'video' ? '播放' : '预览' }}
                  </el-button>
                  <el-button size="small" @click="downloadResource(resource)">
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="warning"
                    @click="openEditDialog(resource)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="danger"
                    @click="confirmDelete(resource)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 视频播放对话框 -->
    <el-dialog
      v-model="playerDialogVisible"
      :title="currentResource?.title || '视频播放'"
      width="80%"
      :before-close="handlePlayerClose"
      destroy-on-close
      class="video-player-dialog"
    >
      <div class="video-player-container">
        <video
          ref="videoPlayer"
          :src="currentResourceUrl"
          controls
          autoplay
          class="video-player"
          @error="handleVideoError"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="downloadResource(currentResource!)" :disabled="!currentResource">
            <el-icon><Download /></el-icon>
            下载视频
          </el-button>
          <el-button type="primary" @click="playerDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- PDF预览对话框 -->
    <el-dialog
      v-model="pdfDialogVisible"
      :title="currentResource?.title || 'PDF预览'"
      width="85%"
      :before-close="handlePdfClose"
      destroy-on-close
      class="pdf-viewer-dialog"
    >
      <div class="pdf-viewer-container">
        <iframe
          :src="currentResourceUrl"
          class="pdf-viewer"
          frameborder="0"
        ></iframe>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="downloadResource(currentResource!)" :disabled="!currentResource">
            <el-icon><Download /></el-icon>
            下载PDF
          </el-button>
          <el-button type="primary" @click="pdfDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="资料标题">
          <el-input v-model="editForm.title" placeholder="请输入资料标题" />
        </el-form-item>
        <el-form-item label="资料描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入资料描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveVideoInfo">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoCamera,
  Upload,
  UploadFilled,
  Refresh,
  VideoPlay,
  Download,
  Edit,
  Delete,
  User,
  Clock,
  Loading,
  FolderOpened,
  Folder,
  Document,
  Tickets,
  View
} from '@element-plus/icons-vue'
import llmHttp from '@/config/api/llmHttp'

// Store
const store = useStore()

// 权限判断
const isAdmin = computed(() => store.getters.isAdmin)

// 资料列表
const resources = ref<any[]>([])
const loading = ref(false)
const filterType = ref('all')  // 筛选类型: all, video, pdf, ppt

// 计算属性 - 筛选后的资料列表
const filteredResources = computed(() => {
  if (filterType.value === 'all') {
    return resources.value
  }
  return resources.value.filter(r => r.file_type === filterType.value)
})

// 上传相关
const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadForm = ref({
  title: '',
  description: '',
  fileType: 'video' as 'video' | 'pdf' | 'ppt'
})

// 计算属性 - 根据文件类型返回接受的文件格式
const acceptFileTypes = computed(() => {
  switch (uploadForm.value.fileType) {
    case 'video':
      return '.mp4,.avi,.mov,.mkv,.wmv,.flv,.webm,.m4v'
    case 'pdf':
      return '.pdf'
    case 'ppt':
      return '.ppt,.pptx'
    default:
      return '*'
  }
})

// 计算属性 - 上传提示文本
const uploadTipText = computed(() => {
  switch (uploadForm.value.fileType) {
    case 'video':
      return '支持 mp4、avi、mov、mkv 等格式，最大 500MB'
    case 'pdf':
      return '支持 PDF 格式，最大 100MB'
    case 'ppt':
      return '支持 ppt、pptx 格式，最大 100MB'
    default:
      return '请选择文件'
  }
})

// 播放器/预览器相关
const playerDialogVisible = ref(false)
const pdfDialogVisible = ref(false)
const currentResource = ref<any>(null)
const currentResourceUrl = ref('')
const videoPlayer = ref<HTMLVideoElement | null>(null)
const isClosingPlayer = ref(false)  // 标记是否正在关闭播放器

// 编辑相关
const editDialogVisible = ref(false)
const editForm = ref({
  id: '',
  title: '',
  description: ''
})
const saving = ref(false)

// 加载资料列表
async function loadResources() {
  loading.value = true
  try {
    const response = await llmHttp.get('/resources/list')
    if (response.data.ok) {
      resources.value = response.data.data.resources || []
    } else {
      ElMessage.error(response.data.message || '加载资料列表失败')
    }
  } catch (error: any) {
    console.error('加载资料列表失败:', error)
    ElMessage.error('加载资料列表失败')
  } finally {
    loading.value = false
  }
}

// 获取文件类型标签
function getFileTypeLabel(fileType: string): string {
  switch (fileType) {
    case 'video': return '视频'
    case 'pdf': return 'PDF'
    case 'ppt': return 'PPT'
    default: return '文件'
  }
}

// 切换上传文件类型时清空已选文件
function handleUploadTypeChange() {
  selectedFile.value = null
  uploadRef.value?.clearFiles()
}

// 文件选择处理
function handleFileChange(file: any) {
  selectedFile.value = file.raw
  if (!uploadForm.value.title) {
    // 自动填充文件名作为标题
    const name = file.name.replace(/\.[^/.]+$/, '')
    uploadForm.value.title = name
  }
}

function handleFileRemove() {
  selectedFile.value = null
}

// 上传资料
async function handleUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('title', uploadForm.value.title || selectedFile.value.name)
  formData.append('description', uploadForm.value.description || '')
  formData.append('file_type', uploadForm.value.fileType)

  try {
    const response = await llmHttp.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    if (response.data.ok) {
      ElMessage.success('资料上传成功')
      // 重置表单
      uploadForm.value = { title: '', description: '', fileType: uploadForm.value.fileType }
      selectedFile.value = null
      uploadRef.value?.clearFiles()
      // 刷新列表
      await loadResources()
    } else {
      ElMessage.error(response.data.message || '上传失败')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error(error.response?.data?.message || '上传失败')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 打开资料预览
function openResource(resource: any) {
  currentResource.value = resource
  const token = localStorage.getItem('multi_turn_chat_jwt') || localStorage.getItem('jwt_token')
  const baseUrl = process.env.VUE_APP_LLM_BASE_URL || ''
  
  if (resource.file_type === 'video') {
    // 视频播放
    currentResourceUrl.value = `${baseUrl}/resources/${resource.id}/stream?token=${token}`
    playerDialogVisible.value = true
  } else if (resource.file_type === 'pdf') {
    // PDF预览
    currentResourceUrl.value = `${baseUrl}/resources/${resource.id}/preview?token=${token}`
    pdfDialogVisible.value = true
  } else if (resource.file_type === 'ppt') {
    // PPT直接下载（浏览器无法直接预览PPT）
    ElMessage.info('PPT文件将直接下载')
    downloadResource(resource)
  }
}

// 关闭视频播放器
function handlePlayerClose(done: () => void) {
  isClosingPlayer.value = true
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.src = ''
  }
  currentResourceUrl.value = ''
  currentResource.value = null
  done()
  setTimeout(() => {
    isClosingPlayer.value = false
  }, 100)
}

// 关闭PDF预览器
function handlePdfClose(done: () => void) {
  currentResourceUrl.value = ''
  currentResource.value = null
  done()
}

// 视频播放错误处理
function handleVideoError() {
  if (isClosingPlayer.value || !currentResourceUrl.value) {
    return
  }
  ElMessage.error('视频加载失败，请稍后重试')
}

// 下载资料
async function downloadResource(resource: any) {
  if (!resource) return
  
  try {
    const response = await llmHttp.get(`/resources/${resource.id}/download`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    
    // 根据文件类型设置默认扩展名
    let defaultExt = ''
    switch (resource.file_type) {
      case 'video': defaultExt = '.mp4'; break
      case 'pdf': defaultExt = '.pdf'; break
      case 'ppt': defaultExt = '.pptx'; break
    }
    link.download = resource.original_filename || resource.filename || `${resource.title}${defaultExt}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('下载开始')
  } catch (error: any) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 打开编辑对话框
function openEditDialog(video: any) {
  editForm.value = {
    id: video.id,
    title: video.title,
    description: video.description || ''
  }
  editDialogVisible.value = true
}

// 保存资料信息
async function saveVideoInfo() {
  if (!editForm.value.title.trim()) {
    ElMessage.warning('请输入资料标题')
    return
  }

  saving.value = true
  try {
    const response = await llmHttp.post(`/resources/${editForm.value.id}/update`, {
      title: editForm.value.title,
      description: editForm.value.description
    })

    if (response.data.ok) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      await loadResources()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 确认删除
async function confirmDelete(resource: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除资料「${resource.title}」吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await llmHttp.post(`/resources/${resource.id}/delete`)
    
    if (response.data.ok) {
      ElMessage.success('删除成功')
      await loadResources()
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.resource-center-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  color: #fff;
  margin-bottom: 30px;
  padding: 20px 0;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.header-icon {
  font-size: 2.5rem;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.upload-card,
.resource-list-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.resource-upload {
  width: 100%;
}

.upload-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

.loading-container {
  text-align: center;
  padding: 60px;
  color: #909399;
}

.loading-container p {
  margin-top: 15px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.resource-item {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 12px;
  overflow: hidden;
}

.resource-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.resource-thumbnail {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.resource-thumbnail.type-video {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.resource-thumbnail.type-pdf {
  background: linear-gradient(135deg, #c62828 0%, #e53935 100%);
}

.resource-thumbnail.type-ppt {
  background: linear-gradient(135deg, #d84315 0%, #ff5722 100%);
}

.type-icon {
  font-size: 60px;
  color: rgba(255, 255, 255, 0.8);
  transition: transform 0.3s;
}

.resource-item:hover .type-icon {
  transform: scale(1.2);
  color: #fff;
}

.resource-size {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.resource-type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.resource-info {
  padding: 15px;
}

.resource-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

.resource-description {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #909399;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.resource-actions {
  display: flex;
  justify-content: flex-start;
}

.video-player-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.video-player-container {
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-player {
  width: 100%;
  max-height: 70vh;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pdf-viewer-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.pdf-viewer-container {
  width: 100%;
  height: 75vh;
  background: #f5f5f5;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .resource-grid {
    grid-template-columns: 1fr;
  }
  
  .el-row {
    flex-direction: column;
  }
  
  .el-col {
    max-width: 100% !important;
  }
  
  .header-right {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
