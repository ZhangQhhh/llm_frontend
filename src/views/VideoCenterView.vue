<template>
  <div class="video-center-page">
    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <h1>
          <el-icon class="header-icon"><VideoCamera /></el-icon>
          视频中心
        </h1>
        <p class="subtitle">{{ isAdmin ? '管理和分享视频资源' : '查看和下载视频资源' }}</p>
      </header>

      <!-- 管理员上传区域 -->
      <el-card v-if="isAdmin" class="upload-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Upload /></el-icon>
            <span>上传视频</span>
          </div>
        </template>
        <el-form :model="uploadForm" label-width="80px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="视频文件">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :limit="1"
                  :on-change="handleFileChange"
                  :on-remove="handleFileRemove"
                  accept=".mp4,.avi,.mov,.mkv,.wmv,.flv,.webm,.m4v"
                  drag
                  class="video-upload"
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">
                    拖拽视频文件到这里，或 <em>点击选择</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持 mp4、avi、mov、mkv 等格式，最大 500MB
                    </div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="视频标题">
                <el-input v-model="uploadForm.title" placeholder="请输入视频标题" clearable />
              </el-form-item>
              <el-form-item label="视频描述">
                <el-input
                  v-model="uploadForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入视频描述（可选）"
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

      <!-- 视频列表 -->
      <el-card class="video-list-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-icon><Film /></el-icon>
              <span>视频列表</span>
              <el-tag type="info" size="small" style="margin-left: 10px">
                共 {{ videos.length }} 个视频
              </el-tag>
            </div>
            <el-button type="primary" :icon="Refresh" @click="loadVideos" :loading="loading">
              刷新
            </el-button>
          </div>
        </template>

        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <p>加载中...</p>
        </div>

        <el-empty v-else-if="videos.length === 0" description="暂无视频" />

        <div v-else class="video-grid">
          <el-card
            v-for="video in videos"
            :key="video.id"
            class="video-item"
            shadow="hover"
            @click="openVideoPlayer(video)"
          >
            <div class="video-thumbnail">
              <el-icon class="play-icon"><VideoPlay /></el-icon>
              <div class="video-duration">
                {{ formatFileSize(video.size) }}
              </div>
            </div>
            <div class="video-info">
              <h3 class="video-title" :title="video.title">{{ video.title }}</h3>
              <p class="video-description" v-if="video.description">{{ video.description }}</p>
              <div class="video-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ video.uploader }}
                </span>
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(video.upload_time) }}
                </span>
              </div>
              <div class="video-actions" @click.stop>
                <el-button-group>
                  <el-button size="small" type="primary" @click="openVideoPlayer(video)">
                    <el-icon><VideoPlay /></el-icon>
                    播放
                  </el-button>
                  <el-button size="small" @click="downloadVideo(video)">
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="warning"
                    @click="openEditDialog(video)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="danger"
                    @click="confirmDelete(video)"
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
      :title="currentVideo?.title || '视频播放'"
      width="80%"
      :before-close="handlePlayerClose"
      destroy-on-close
      class="video-player-dialog"
    >
      <div class="video-player-container">
        <video
          ref="videoPlayer"
          :src="currentVideoUrl"
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
          <el-button @click="downloadVideo(currentVideo!)" :disabled="!currentVideo">
            <el-icon><Download /></el-icon>
            下载视频
          </el-button>
          <el-button type="primary" @click="playerDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑视频对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑视频信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="视频标题">
          <el-input v-model="editForm.title" placeholder="请输入视频标题" />
        </el-form-item>
        <el-form-item label="视频描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入视频描述"
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
  Film,
  Refresh,
  VideoPlay,
  Download,
  Edit,
  Delete,
  User,
  Clock,
  Loading
} from '@element-plus/icons-vue'
import llmHttp from '@/config/api/llmHttp'

// Store
const store = useStore()

// 权限判断
const isAdmin = computed(() => store.getters.isAdmin)

// 视频列表
const videos = ref<any[]>([])
const loading = ref(false)

// 上传相关
const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadForm = ref({
  title: '',
  description: ''
})

// 播放器相关
const playerDialogVisible = ref(false)
const currentVideo = ref<any>(null)
const currentVideoUrl = ref('')
const videoPlayer = ref<HTMLVideoElement | null>(null)

// 编辑相关
const editDialogVisible = ref(false)
const editForm = ref({
  id: '',
  title: '',
  description: ''
})
const saving = ref(false)

// 加载视频列表
async function loadVideos() {
  loading.value = true
  try {
    const response = await llmHttp.get('/api/videos/list')
    if (response.data.ok) {
      videos.value = response.data.data.videos || []
    } else {
      ElMessage.error(response.data.message || '加载视频列表失败')
    }
  } catch (error: any) {
    console.error('加载视频列表失败:', error)
    ElMessage.error('加载视频列表失败')
  } finally {
    loading.value = false
  }
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

// 上传视频
async function handleUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('title', uploadForm.value.title || selectedFile.value.name)
  formData.append('description', uploadForm.value.description || '')

  try {
    const response = await llmHttp.post('/api/videos/upload', formData, {
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
      ElMessage.success('视频上传成功')
      // 重置表单
      uploadForm.value = { title: '', description: '' }
      selectedFile.value = null
      uploadRef.value?.clearFiles()
      // 刷新列表
      await loadVideos()
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

// 打开视频播放器
function openVideoPlayer(video: any) {
  currentVideo.value = video
  // 构建流式播放URL，使用multi_turn_chat_jwt token
  const token = localStorage.getItem('multi_turn_chat_jwt') || localStorage.getItem('jwt_token')
  const baseUrl = process.env.VUE_APP_LLM_BASE_URL || ''
  currentVideoUrl.value = `${baseUrl}/api/videos/${video.id}/stream?token=${token}`
  playerDialogVisible.value = true
}

// 关闭播放器
function handlePlayerClose(done: () => void) {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
  currentVideoUrl.value = ''
  currentVideo.value = null
  done()
}

// 视频播放错误处理
function handleVideoError() {
  ElMessage.error('视频加载失败，请稍后重试')
}

// 下载视频
async function downloadVideo(video: any) {
  if (!video) return
  
  try {
    const response = await llmHttp.get(`/api/videos/${video.id}/download`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = video.original_filename || video.filename || `${video.title}.mp4`
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

// 保存视频信息
async function saveVideoInfo() {
  if (!editForm.value.title.trim()) {
    ElMessage.warning('请输入视频标题')
    return
  }

  saving.value = true
  try {
    const response = await llmHttp.post(`/api/videos/${editForm.value.id}/update`, {
      title: editForm.value.title,
      description: editForm.value.description
    })

    if (response.data.ok) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      await loadVideos()
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
async function confirmDelete(video: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除视频「${video.title}」吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await llmHttp.post(`/api/videos/${video.id}/delete`)
    
    if (response.data.ok) {
      ElMessage.success('删除成功')
      await loadVideos()
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
  loadVideos()
})
</script>

<style scoped>
.video-center-page {
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
.video-list-card {
  margin-bottom: 20px;
  border-radius: 12px;
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

.video-upload {
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

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.video-item {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 12px;
  overflow: hidden;
}

.video-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.video-thumbnail {
  height: 180px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.play-icon {
  font-size: 60px;
  color: rgba(255, 255, 255, 0.8);
  transition: transform 0.3s;
}

.video-item:hover .play-icon {
  transform: scale(1.2);
  color: #fff;
}

.video-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.video-info {
  padding: 15px;
}

.video-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

.video-description {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
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

.video-actions {
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

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .video-grid {
    grid-template-columns: 1fr;
  }
  
  .el-row {
    flex-direction: column;
  }
  
  .el-col {
    max-width: 100% !important;
  }
}
</style>
