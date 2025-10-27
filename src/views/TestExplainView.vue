<template>
  <div class="test-explain-page">
    <div class="container">
      <!-- 服务器信息 -->
      <div class="server-info">{{ serverInfo }}</div>

      <!-- 头部 -->
      <header class="page-header">
        <div class="brand">
          <div class="logo">🎓</div>
          <div>
            <h1>选择题问答测试</h1>
            <p class="subtitle">公开访问 · AI智能解析 · 实时生成</p>
          </div>
        </div>
      </header>

      <!-- 主卡片 -->
      <el-card class="main-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="title">题目输入</span>
            <span class="subtitle">请在下方文本框中输入题目内容，然后点击"生成解析"</span>
          </div>
        </template>

        <el-input
          v-model="questionText"
          type="textarea"
          :rows="10"
          placeholder="示例格式：&#10;1. 题目题干...&#10;A. 选项A&#10;B. 选项B&#10;C. 选项C&#10;D. 选项D&#10;答案：B"
          class="question-input"
        />

        <div class="control-bar">
          <el-button
            type="primary"
            size="large"
            @click="generateExplanation"
            :loading="generating"
            :disabled="!questionText.trim()"
          >
            生成解析
          </el-button>
          <span class="status-msg">{{ statusMessage }}</span>
        </div>
      </el-card>

      <!-- 结果展示 -->
      <el-card v-if="result || generating" class="result-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="title">解析结果</span>
            <el-tag v-if="taskStatus" :type="getStatusType(taskStatus)">
              {{ getStatusText(taskStatus) }}
            </el-tag>
          </div>
        </template>

        <div v-if="generating" class="loading-state">
          <el-icon class="is-loading" :size="40">
            <Loading />
          </el-icon>
          <p>正在生成解析，请稍候...</p>
          <p class="progress-info">{{ progressInfo }}</p>
        </div>

        <div v-else-if="result" class="result-content">
          <pre>{{ result }}</pre>
        </div>

        <el-empty v-else description="暂无结果" />
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { API_ENDPOINTS } from '@/config/api/api'
import { getApiUrl } from '@/utils/request'
import http from '@/config/api/http'

export default defineComponent({
  name: 'TestExplainView',
  components: {
    Loading
  },
  setup() {
    const serverInfo = ref('正在连接服务器...')
    const questionText = ref('')
    const generating = ref(false)
    const statusMessage = ref('准备就绪')
    const result = ref('')
    const taskStatus = ref('')
    const progressInfo = ref('')
    const pollingInterval = ref<number | null>(null)

    const getStatusType = (status: string) => {
      if (status === 'completed') return 'success'
      if (status === 'failed') return 'danger'
      return 'info'
    }

    const getStatusText = (status: string) => {
      const statusMap: Record<string, string> = {
        'pending': '等待中',
        'processing': '处理中',
        'completed': '已完成',
        'failed': '失败'
      }
      return statusMap[status] || status
    }

    const initServerInfo = async () => {
      try {
        const response = await http.get(getApiUrl(API_ENDPOINTS.PUBLIC.SERVER_INFO))
        const data = response.data
        serverInfo.value = `服务运行在: ${data.lan_ip}:${data.port}`
      } catch (error) {
        serverInfo.value = '无法连接到后端服务'
      }
    }

    const loadExampleQuestion = () => {
      questionText.value = `1. 下列关于中国古代四大发明的描述，哪个是正确的？
A. 指南针最初用于航海。
B. 火药的发明与炼丹术有关。
C. 活字印刷术由蔡伦发明。
答案：B`
    }

    const pollTaskStatus = async (taskId: string) => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
      }

      pollingInterval.value = window.setInterval(async () => {
        try {
          const response = await http.get(getApiUrl(`${API_ENDPOINTS.TASKS.STATUS}/${taskId}`))
          const data = response.data

          taskStatus.value = data.status
          progressInfo.value = `进度: ${data.progress || 0}/${data.total || 0}`
          statusMessage.value = `状态: ${getStatusText(data.status)}... (${data.progress || 0}/${data.total || 0})`

          if (data.status === 'completed' || data.status === 'failed') {
            if (pollingInterval.value) {
              clearInterval(pollingInterval.value)
              pollingInterval.value = null
            }
            generating.value = false

            if (data.status === 'completed') {
              statusMessage.value = '生成成功！'
              result.value = data.result?.rationale_overall || '未能获取解析文本'
              ElMessage.success('解析生成成功')
            } else {
              const errorMsg = `任务失败: ${data.error || '未知错误'}`
              statusMessage.value = errorMsg
              result.value = errorMsg
              ElMessage.error('解析生成失败')
            }
          }
        } catch (error: any) {
          statusMessage.value = `轮询状态时出错: ${error.message}`
          if (pollingInterval.value) {
            clearInterval(pollingInterval.value)
            pollingInterval.value = null
          }
          generating.value = false
          ElMessage.error('轮询状态失败')
        }
      }, 200)
    }

    const generateExplanation = async () => {
      const text = questionText.value.trim()
      if (!text) {
        ElMessage.warning('请输入题目内容')
        return
      }

      generating.value = true
      statusMessage.value = '正在提交任务...'
      result.value = ''
      taskStatus.value = ''
      progressInfo.value = ''

      try {
        const response = await http.post(getApiUrl(API_ENDPOINTS.PUBLIC.EXPLAIN_FROM_TEXT), {
          question_text: text
        })

        const data = response.data
        if (data.task_id) {
          statusMessage.value = '任务已启动，正在等待结果...'
          pollTaskStatus(data.task_id)
        } else {
          throw new Error(data.detail || '未能启动任务')
        }
      } catch (error: any) {
        statusMessage.value = '启动任务失败: ' + error.message
        result.value = '错误: ' + error.message
        generating.value = false
        ElMessage.error('启动任务失败')
      }
    }

    onMounted(() => {
      initServerInfo()
      loadExampleQuestion()
    })

    onUnmounted(() => {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
      }
    })

    return {
      serverInfo,
      questionText,
      generating,
      statusMessage,
      result,
      taskStatus,
      progressInfo,
      generateExplanation,
      getStatusType,
      getStatusText
    }
  }
})
</script>

<style scoped>
.test-explain-page {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.server-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  font-size: 3rem;
}

.brand h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #1f2937;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.main-card {
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-header .title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.card-header .subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.question-input {
  margin-bottom: 1.5rem;
}

.question-input :deep(textarea) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-msg {
  color: #6b7280;
  font-size: 0.875rem;
}

.result-card {
  margin-bottom: 1.5rem;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.loading-state .is-loading {
  color: #2563eb;
  margin-bottom: 1rem;
}

.loading-state p {
  margin: 0.5rem 0;
  font-size: 1rem;
}

.progress-info {
  font-size: 0.875rem;
  color: #9ca3af;
}

.result-content {
  padding: 1rem;
}

.result-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin: 0;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }

  .brand h1 {
    font-size: 1.5rem;
  }

  .logo {
    font-size: 2.5rem;
  }
}
</style>
