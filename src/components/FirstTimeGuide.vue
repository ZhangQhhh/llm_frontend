<template>
  <el-dialog 
    v-model="showGuide" 
    title="欢迎使用皖美边检-智慧大脑"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    @close="handleSkip"
  >
    <div class="first-time-guide">
      <div class="guide-header">
        <div class="welcome-icon">
          <el-icon size="48"><Guide /></el-icon>
        </div>
        <h2>欢迎使用智能助手</h2>
        <p>让我们花几分钟时间，了解系统的主要功能</p>
      </div>

      <div class="guide-content">
        <div class="feature-overview">
          <div class="feature-item" v-for="feature in keyFeatures" :key="feature.id">
            <div class="feature-icon">
              <el-icon><component :is="feature.icon" /></el-icon>
            </div>
            <div class="feature-text">
              <h4>{{ feature.name }}</h4>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>

        <div class="guide-options">
          <el-radio-group v-model="selectedOption">
            <el-radio value="tour">
              <strong>开始导览</strong> - 逐步介绍各项功能
            </el-radio>
            <el-radio value="help">
              <strong>查看帮助</strong> - 自助学习使用方法
            </el-radio>
            <el-radio value="skip">
              <strong>跳过引导</strong> - 直接开始使用
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <div class="guide-footer">
        <el-checkbox v-model="dontShowAgain">
          不再显示此引导
        </el-checkbox>
        <div class="guide-actions">
          <el-button @click="handleSkip">跳过</el-button>
          <el-button type="primary" @click="handleStart">
            {{ selectedOption === 'skip' ? '开始使用' : '继续' }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tourGuide } from '@/utils/tourGuide'
import { 
  Guide, 
  Reading, 
  ChatDotRound, 
  EditPen, 
  Briefcase 
} from '@element-plus/icons-vue'

export default defineComponent({
  name: 'FirstTimeGuide',
  components: {
    Guide,
    Reading,
    ChatDotRound,
    EditPen,
    Briefcase
  },
  setup() {
    const router = useRouter()
    const showGuide = ref(false)
    const selectedOption = ref('tour')
    const dontShowAgain = ref(false)

    const keyFeatures = [
      {
        id: 'qa',
        name: '智能问答',
        description: '快速获取准确的边检知识答案',
        icon: 'Reading'
      },
      {
        id: 'chat',
        name: '多轮对话',
        description: '支持上下文理解的连续交流',
        icon: 'ChatDotRound'
      },
      {
        id: 'exam',
        name: '智能家教',
        description: 'AI辅助学习和题目练习',
        icon: 'EditPen'
      },
      {
        id: 'office',
        name: '智慧办公',
        description: '提升工作效率的工具集合',
        icon: 'Briefcase'
      }
    ]

    const checkFirstTimeUser = () => {
      const hasVisited = localStorage.getItem('user_has_visited')
      if (!hasVisited) {
        showGuide.value = true
      }
    }

    const handleSkip = () => {
      completeGuide()
    }

    const handleStart = () => {
      // 无论用户选择什么，都标记为已访问
      completeGuide()

      switch (selectedOption.value) {
        case 'tour':
          // 开始首页导览
          setTimeout(() => {
            tourGuide.startHomeTour()
          }, 300)
          break
        case 'help':
          // 跳转到帮助中心
          showGuide.value = false
          router.push('/help')
          break
        case 'skip':
          // 直接开始使用（已经调用了 completeGuide）
          break
      }
    }

    const completeGuide = () => {
      // 总是标记为已访问，避免重复显示
      localStorage.setItem('user_has_visited', 'true')
      showGuide.value = false
    }

    onMounted(() => {
      checkFirstTimeUser()
    })

    return {
      showGuide,
      selectedOption,
      dontShowAgain,
      keyFeatures,
      handleSkip,
      handleStart
    }
  }
})
</script>

<style scoped>
.first-time-guide {
  text-align: center;
  padding: 1rem;
}

.guide-header {
  margin-bottom: 2rem;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
}

.guide-header h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.guide-header p {
  color: #6b7280;
  font-size: 1rem;
}

.feature-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  text-align: left;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  transition: transform 0.2s;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;
}

.feature-text h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.feature-text p {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.guide-options {
  margin-bottom: 2rem;
  text-align: left;
}

.guide-options :deep(.el-radio) {
  display: block;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.guide-options :deep(.el-radio:hover) {
  border-color: #2563eb;
  background: #f8fafc;
}

.guide-options :deep(.el-radio.is-checked) {
  border-color: #2563eb;
  background: #eff6ff;
}

.guide-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.guide-actions {
  display: flex;
  gap: 0.5rem;
}

/* 响应式适配 */
@media (max-width: 640px) {
  .feature-overview {
    grid-template-columns: 1fr;
  }
  
  .guide-footer {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .guide-actions {
    width: 100%;
  }
  
  .guide-actions .el-button {
    flex: 1;
  }
}
</style>
