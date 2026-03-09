<template>
  <el-dialog
    v-model="showGuide"
    width="680px"
    align-center
    class="first-time-guide-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    @close="handleSkip"
  >
    <template #header>
      <div class="dialog-title">
        <div class="welcome-icon">
          <el-icon size="28"><Guide /></el-icon>
        </div>
        <div class="dialog-title__text">
          <h2>欢迎使用皖美边检-智慧大脑</h2>
          <p>花 1 分钟了解主要功能和常用入口</p>
        </div>
      </div>
    </template>

    <div class="first-time-guide">
      <div class="guide-intro">
        <p>首次登录建议先看一下功能概览，后续也可以随时从页面右下角重新打开导览。</p>
      </div>

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
        <div class="guide-options__title">你希望怎么开始？</div>
        <div class="guide-options__group">
          <button
            v-for="option in guideOptions"
            :key="option.value"
            type="button"
            class="guide-option-card"
            :class="{ 'is-active': selectedOption === option.value }"
            @click="selectedOption = option.value"
          >
            <span class="guide-option-card__radio" />
            <span class="guide-option-card__content">
              <strong>{{ option.title }}</strong>
              <span>{{ option.description }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="guide-footer">
        <div class="guide-actions">
          <el-button @click="handleSkip">跳过</el-button>
          <el-button type="primary" @click="handleStart">
            {{ selectedOption === 'skip' ? '开始使用' : '继续' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { tourGuide } from '@/utils/tourGuide'
import {
  Guide,
  Reading,
  ChatDotRound,
  EditPen,
  Briefcase
} from '@element-plus/icons-vue'

const FIRST_TIME_GUIDE_KEY = 'user_has_visited'

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
    const showGuide = ref(false)
    const selectedOption = ref('tour')

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
        description: 'AI 辅助学习和题目练习',
        icon: 'EditPen'
      },
      {
        id: 'office',
        name: '智慧办公',
        description: '提升工作效率的常用工具集合',
        icon: 'Briefcase'
      }
    ]

    const guideOptions = [
      {
        value: 'tour',
        title: '开始导览',
        description: '逐步介绍首页和关键功能入口'
      },
      {
        value: 'skip',
        title: '跳过引导',
        description: '直接进入系统，后续需要时再打开导览'
      }
    ]

    const checkFirstTimeUser = () => {
      const hasVisited = localStorage.getItem(FIRST_TIME_GUIDE_KEY)
      if (!hasVisited) {
        localStorage.setItem(FIRST_TIME_GUIDE_KEY, 'true')
        showGuide.value = true
      }
    }

    const completeGuide = () => {
      showGuide.value = false
    }

    const handleSkip = () => {
      completeGuide()
    }

    const handleStart = () => {
      completeGuide()

      switch (selectedOption.value) {
        case 'tour':
          setTimeout(() => {
            tourGuide.startHomeTour()
          }, 300)
          break
        case 'skip':
          break
      }
    }

    onMounted(() => {
      checkFirstTimeUser()
    })

    return {
      showGuide,
      selectedOption,
      keyFeatures,
      guideOptions,
      handleSkip,
      handleStart
    }
  }
})
</script>

<style scoped>
.first-time-guide {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dialog-title__text h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.dialog-title__text p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.welcome-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
  flex-shrink: 0;
}

.guide-intro {
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%);
  border: 1px solid #dbeafe;
}

.guide-intro p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}

.feature-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.feature-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  flex-shrink: 0;
}

.feature-text h4 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.feature-text p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.guide-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-options__title {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.guide-options__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-option-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  appearance: none;
  outline: none;
  transition: all 0.2s ease;
}

.guide-option-card:hover {
  border-color: #93c5fd;
  background: #f8fbff;
}

.guide-option-card:focus-visible {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.guide-option-card.is-active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.08);
}

.guide-option-card__radio {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border: 2px solid #cbd5e1;
  border-radius: 999px;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.guide-option-card.is-active .guide-option-card__radio {
  border-color: #2563eb;
}

.guide-option-card.is-active .guide-option-card__radio::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 999px;
  background: #2563eb;
}

.guide-option-card__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  line-height: 1.6;
}

.guide-option-card__content strong {
  font-size: 14px;
  color: #0f172a;
}

.guide-option-card__content span {
  font-size: 13px;
  color: #64748b;
  white-space: normal;
}

.guide-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.guide-actions {
  display: flex;
  gap: 10px;
}

.first-time-guide-dialog :deep(.el-dialog) {
  max-width: calc(100vw - 32px);
  border-radius: 24px;
  overflow: hidden;
}

.first-time-guide-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 24px 24px 8px;
}

.first-time-guide-dialog :deep(.el-dialog__body) {
  padding: 8px 24px 0;
}

.first-time-guide-dialog :deep(.el-dialog__footer) {
  padding: 20px 24px 24px;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 640px) {
  .dialog-title {
    align-items: flex-start;
  }

  .feature-overview {
    grid-template-columns: 1fr;
  }

  .guide-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .guide-actions {
    width: 100%;
  }

  .guide-actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
