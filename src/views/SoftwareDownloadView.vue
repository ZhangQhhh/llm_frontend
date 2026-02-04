<template>
  <div class="software-download-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Download /></el-icon>
          软件下载中心
        </h1>
        <p class="page-subtitle">下载系统客户端，获得更好的使用体验</p>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 上传区域 -->
      <el-card v-if="canUpload" class="upload-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Upload /></el-icon>
              上传软件
            </span>
          </div>
        </template>
        
        <el-upload
          ref="uploadRef"
          class="upload-area"
          drag
          :action="uploadUrl"
          :headers="uploadHeaders"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-progress="handleUploadProgress"
          :show-file-list="false"
          accept="*"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">
            <p class="upload-title">将文件拖到此处，或<em>点击上传</em></p>
            <p class="upload-hint">支持所有格式文件，文件大小不超过 1GB</p>
          </div>
        </el-upload>

        <!-- 上传进度 -->
        <div v-if="uploading" class="upload-progress">
          <el-progress :percentage="uploadProgress" :status="uploadStatus" />
          <p class="progress-text">{{ uploadProgressText }}</p>
        </div>
      </el-card>

      <!-- 软件列表 -->
      <el-card class="list-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><List /></el-icon>
              可用软件列表
            </span>
            <el-button 
              :icon="Refresh" 
              @click="loadSoftwareList" 
              :loading="loading"
              text
            >
              刷新
            </el-button>
          </div>
        </template>

        <el-table
          :data="softwareList"
          v-loading="loading"
          stripe
          style="width: 100%"
          empty-text="暂无可用软件"
        >
          <el-table-column type="index" label="#" width="60" />
          
          <el-table-column prop="filename" label="文件名" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="filename-cell">
                <el-icon class="file-icon"><Document /></el-icon>
                <span>{{ row.filename }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="size" label="文件大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="uploadTime" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.uploadTime) }}
            </template>
          </el-table-column>
          
          <!-- <el-table-column prop="downloads" label="下载次数" width="100" align="center" /> -->
          
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="Download"
                @click="downloadSoftware(row)"
              >
                下载
              </el-button>
              <el-button
                v-if="canDelete"
                type="danger"
                size="small"
                :icon="Delete"
                @click="deleteSoftware(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 返回链接 -->
      <div class="back-links">
        <router-link to="/login" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          返回登录
        </router-link>
        <router-link to="/" class="back-link" v-if="isLoggedIn">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download,
  Upload,
  UploadFilled,
  List,
  Refresh,
  Document,
  Delete,
  ArrowLeft,
  HomeFilled
} from '@element-plus/icons-vue'
import http from '@/config/api/http'
import { API_ENDPOINTS } from '@/config/api/api'

// 软件信息接口
interface SoftwareItem {
  id?: string
  filename: string
  size: number
  uploadTime: string
  downloads: number
}

const store = useStore()
const uploadRef = ref()

// 状态
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'success' | 'exception' | 'warning' | ''>('')
const uploadProgressText = ref('')
const softwareList = ref<SoftwareItem[]>([])

// 计算属性
const isLoggedIn = computed(() => (store.state as any).user?.is_login || false)
const isAdmin = computed(() => store.getters.isAdmin || store.getters.isSuperAdmin)
const canUpload = computed(() => isAdmin.value)
const canDelete = computed(() => isAdmin.value)

// el-upload组件的action需要完整路径（包含/api前缀）才能通过代理
const uploadUrl = computed(() => `/api${API_ENDPOINTS.SOFTWARE.UPLOAD}`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('jwt_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 加载软件列表
const loadSoftwareList = async () => {
  loading.value = true
  try {
    const response = await http.get(API_ENDPOINTS.SOFTWARE.LIST)
    const data = response.data
    
    console.log('软件列表响应:', data) // 调试日志
    
    if (data.success && data.code === 200) {
      // 确保data.data是数组
      if (Array.isArray(data.data)) {
        softwareList.value = data.data
      } else {
        console.warn('后端返回的data.data不是数组:', data.data)
        softwareList.value = []
        ElMessage.warning('软件列表数据格式异常')
      }
    } else {
      softwareList.value = []
      ElMessage.error(data.message || '获取软件列表失败')
    }
  } catch (error: any) {
    console.error('加载软件列表失败:', error)
    softwareList.value = [] // 确保出错时也是空数组
    
    // 如果是404错误，说明后端接口还未实现
    if (error.response?.status === 404) {
      ElMessage.warning('软件管理接口暂未实现，请联系后端开发')
    } else {
      ElMessage.error(error.response?.data?.message || '获取软件列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 上传前检查
const beforeUpload = (file: File) => {
  const isLt1G = file.size / 1024 / 1024 < 1024

  if (!isLt1G) {
    ElMessage.error('文件大小不能超过 1GB')
    return false
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''
  uploadProgressText.value = '准备上传...'
  
  return true
}

// 上传进度
const handleUploadProgress = (event: any) => {
  uploadProgress.value = Math.floor(event.percent)
  uploadProgressText.value = `上传中... ${uploadProgress.value}%`
}

// 上传成功
const handleUploadSuccess = () => {
  uploading.value = false
  uploadProgress.value = 100
  uploadStatus.value = 'success'
  uploadProgressText.value = '上传成功！'
  
  ElMessage.success('软件上传成功！')
  
  // 刷新列表
  setTimeout(() => {
    loadSoftwareList()
    uploadProgress.value = 0
    uploadStatus.value = ''
  }, 1500)
}

// 上传失败
const handleUploadError = (error: any) => {
  uploading.value = false
  uploadStatus.value = 'exception'
  uploadProgressText.value = '上传失败'
  
  console.error('上传失败:', error)
  ElMessage.error(error.message || '软件上传失败，请重试')
}

// 下载软件
const downloadSoftware = async (software: SoftwareItem) => {
  try {
    // 下载链接需要完整路径（包含/api前缀）才能通过代理
    const downloadUrl = `/api${API_ENDPOINTS.SOFTWARE.DOWNLOAD(software.filename)}`
    
    // 创建隐藏的a标签进行下载
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = software.filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('开始下载...')
  } catch (error: any) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

// 删除软件
const deleteSoftware = async (software: SoftwareItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除软件 "${software.filename}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await http.delete(API_ENDPOINTS.SOFTWARE.DELETE(software.filename))
    const data = response.data
    
    if (data.success || data.code === 200) {
      ElMessage.success('删除成功')
      loadSoftwareList()
    } else {
      ElMessage.error(data.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 页面加载时获取软件列表
onMounted(() => {
  loadSoftwareList()
})
</script>

<style scoped>
.software-download-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  text-align: center;
}

.header-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.page-title .el-icon {
  font-size: 40px;
  color: #667eea;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 上传卡片 */
.upload-card {
  margin-bottom: 2rem;
  border-radius: 16px;
  overflow: hidden;
}

.upload-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-card .card-title {
  color: white;
}

.list-card .card-title {
  color: #1f2937;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: #f3f4f6;
}

.upload-icon {
  font-size: 60px;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.upload-text {
  color: #6b7280;
}

.upload-title {
  font-size: 16px;
  margin: 0 0 0.5rem 0;
}

.upload-title em {
  color: #667eea;
  font-style: normal;
  font-weight: 600;
}

.upload-hint {
  font-size: 14px;
  margin: 0;
  color: #9ca3af;
}

.upload-progress {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.progress-text {
  margin-top: 0.5rem;
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}

/* 列表卡片 */
.list-card {
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.list-card :deep(.el-card__header) {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.filename-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-icon {
  font-size: 18px;
  color: #667eea;
}

/* 返回链接 */
.back-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-link:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 响应式 */
@media (max-width: 768px) {
  .software-download-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 28px;
  }

  .header-content {
    padding: 2rem 1.5rem;
  }

  .back-links {
    flex-direction: column;
    gap: 1rem;
  }

  .back-link {
    justify-content: center;
  }
}
</style>
