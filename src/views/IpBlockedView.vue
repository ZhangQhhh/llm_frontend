<template>
  <div class="ip-blocked-page">
    <div class="ip-blocked-card">
      <div class="status-code">403</div>
      <h1>当前网络已被禁止访问</h1>
      <p class="description">
        系统检测到你当前使用的 IP 或 IP 段已被加入访问黑名单，因此本次请求已被拒绝。
      </p>
      <p class="message">{{ blockedMessage }}</p>
      <p class="hint">
        如果管理员刚刚解除黑名单，点击下方按钮重新检测。只有确认恢复访问后，页面才会自动跳转。
      </p>
      <div class="actions">
        <el-button type="primary" :loading="checking" @click="recheckAccess">重新检测</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '@/config/api/api'

const STORAGE_KEY = 'ip_blocked_message'
const DEFAULT_MESSAGE = '当前IP已被禁止访问'

const router = useRouter()
const checking = ref(false)

const blockedMessage = computed(() => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || DEFAULT_MESSAGE
  } catch {
    return DEFAULT_MESSAGE
  }
})

const buildCheckUrl = () => {
  return `${String(API_BASE_URL || '')}${API_ENDPOINTS.USER.INFO}`
}

const recheckAccess = async () => {
  if (checking.value) return
  checking.value = true

  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const response = await fetch(buildCheckUrl(), {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (response.status === 403) {
      const payload = await response.json().catch(() => null)
      const message = payload?.message || DEFAULT_MESSAGE
      try {
        sessionStorage.setItem(STORAGE_KEY, message)
      } catch {
        // ignore sessionStorage errors
      }
      ElMessage.warning('黑名单尚未解除，请稍后再试')
      return
    }

    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore sessionStorage errors
    }

    if (response.status === 401 || !token) {
      router.replace({ name: 'login' })
      return
    }

    if (response.ok) {
      router.replace({ name: 'home' })
      return
    }

    ElMessage.error('检测失败，请稍后再试')
  } catch {
    ElMessage.error('检测失败，请检查网络后重试')
  } finally {
    checking.value = false
  }
}
</script>

<style scoped>
.ip-blocked-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(176, 41, 41, 0.14), transparent 42%),
    linear-gradient(160deg, #f8f1ed 0%, #f3f5f7 55%, #ebeff3 100%);
}

.ip-blocked-card {
  width: min(680px, 100%);
  padding: 40px 36px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 64px rgba(65, 40, 32, 0.14);
  border: 1px solid rgba(124, 29, 29, 0.14);
  text-align: center;
}

.status-code {
  margin-bottom: 12px;
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
  color: #8f1d1d;
  letter-spacing: 4px;
}

h1 {
  margin: 0 0 16px;
  color: #1f2937;
  font-size: 30px;
  font-weight: 700;
}

.description,
.message,
.hint {
  margin: 0 auto 14px;
  max-width: 560px;
  line-height: 1.7;
  color: #4b5563;
  font-size: 15px;
}

.message {
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff4f4;
  color: #991b1b;
  font-weight: 600;
}

.hint {
  margin-bottom: 0;
}

.actions {
  margin-top: 28px;
}

@media (max-width: 640px) {
  .ip-blocked-card {
    padding: 32px 22px;
    border-radius: 20px;
  }

  .status-code {
    font-size: 52px;
  }

  h1 {
    font-size: 24px;
  }
}
</style>
