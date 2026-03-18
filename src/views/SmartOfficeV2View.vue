<template>
  <div class="smart-office-v2-container">
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
      <p class="loading-text">正在加载公文写作助手...</p>
    </div>
    <div v-if="error" class="error-overlay">
      <el-icon :size="48" color="#f56c6c"><WarningFilled /></el-icon>
      <p class="error-text">{{ error }}</p>
      <el-button type="primary" @click="retryLoad">重试</el-button>
    </div>
    <iframe
      v-show="!loading && !error"
      ref="iframeRef"
      :src="iframeSrc"
      class="offdo-iframe"
      @load="onIframeLoad"
      @error="onIframeError"
      allow="clipboard-read; clipboard-write"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import { OFFDO_BASE_URL } from '@/config/api/api'

const iframeRef = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)
const error = ref('')
const loadAttempts = ref(0)

/**
 * 构建 iframe URL：
 * - 将 llm_frontend 的 JWT token 通过 URL 参数传递给 official_document
 * - official_document 后端会通过 /api/sso_login 验证该 token
 */
const iframeSrc = computed(() => {
  const jwtToken = localStorage.getItem('jwt_token') || ''
  const baseUrl = OFFDO_BASE_URL || '/offdo'
  // 传递 supervisory JWT token 用于 SSO 登录
  if (jwtToken) {
    return `${baseUrl}/?sso_token=${encodeURIComponent(jwtToken)}`
  }
  return `${baseUrl}/`
})

function onIframeLoad() {
  loading.value = false
  error.value = ''
}

function onIframeError() {
  loading.value = false
  error.value = '公文写作助手服务加载失败，请确认服务是否已启动'
}

function retryLoad() {
  loadAttempts.value++
  loading.value = true
  error.value = ''
  if (iframeRef.value) {
    iframeRef.value.src = iframeSrc.value + (iframeSrc.value.includes('?') ? '&' : '?') + `_t=${Date.now()}`
  }
}

onMounted(() => {
  // 设置加载超时
  setTimeout(() => {
    if (loading.value) {
      loading.value = false
      error.value = '加载超时，请检查公文写作助手服务是否运行中'
    }
  }, 30000)
})
</script>

<style scoped>
.smart-office-v2-container {
  width: 100%;
  height: calc(100vh - 60px);
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
}

.offdo-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  z-index: 10;
  gap: 16px;
}

.loading-icon {
  animation: spin 1.2s linear infinite;
  color: #409eff;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #606266;
}

.error-text {
  font-size: 16px;
  color: #f56c6c;
  margin-bottom: 8px;
}
</style>
