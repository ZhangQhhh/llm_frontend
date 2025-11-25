<template>
  <el-button 
    v-if="showTourButton"
    type="primary" 
    size="small"
    @click="startCurrentPageTour"
    class="tour-guide-button"
  >
    <el-icon><Guide /></el-icon>
    {{ buttonText }}
  </el-button>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { tourGuide } from '@/utils/tourGuide'
import { Guide } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'TourGuideButton',
  components: {
    Guide
  },
  props: {
    forceShow: {
      type: Boolean,
      default: false
    },
    buttonText: {
      type: String,
      default: '页面导览'
    }
  },
  setup(props) {
    const route = useRoute()

    const showTourButton = computed(() => {
      return props.forceShow || tourGuide.shouldShowFirstTimeTour(route.name as string)
    })

    const startCurrentPageTour = () => {
      const pageName = route.name as string
      
      // 标记导览已启动，隐藏按钮
      tourGuide.markTourCompleted(pageName)
      
      switch (pageName) {
        case 'home':
          tourGuide.startHomeTour()
          break
        case 'knowledge-qa':
          tourGuide.startKnowledgeQATour()
          break
        case 'conversation':
          tourGuide.startConversationTour()
          break
        case 'exam':
          tourGuide.startExamTour()
          break
        case 'smart-office':
          tourGuide.startSmartOfficeTour()
          break
        case 'immigration-12367':
          tourGuide.startImmigration12367Tour()
          break
        case 'admin':
          tourGuide.startAdminTour()
          break
        default:
          // 如果没有对应页面的导览，显示首页导览
          tourGuide.startHomeTour()
      }
    }

    onMounted(() => {
      // 移除自动启动逻辑，避免干扰用户
      // 用户可以通过点击按钮手动启动导览
    })

    return {
      showTourButton,
      startCurrentPageTour
    }
  }
})
</script>

<style scoped>
.tour-guide-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
  }
  100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .tour-guide-button {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
