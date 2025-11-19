<template>
  <div class="coming-soon-page">
    <div class="container">
      <div class="content-card">
        <!-- 图标 -->
        <div class="icon-wrapper">
          <el-icon :size="120" color="#2563eb">
            <Briefcase />
          </el-icon>
        </div>

        <!-- 标题 -->
        <h1 class="title">智慧办公</h1>
        
        <!-- 描述 -->
        <p class="description">
          智能化办公助手，提升工作效率
        </p>

        <!-- 状态标签 -->
        <el-tag type="warning" size="large" effect="dark" class="status-tag">
          <el-icon class="tag-icon"><Tools /></el-icon>
          功能正在开发，敬请期待
        </el-tag>

        <!-- 功能预告 -->
        <div class="features-preview">
          <h3 class="features-title">即将推出的功能</h3>
          <div class="features-grid">
            <div class="feature-item">
              <el-icon :size="32" color="#10b981"><Document /></el-icon>
              <span>智能文档处理</span>
            </div>
            <div class="feature-item">
              <el-icon :size="32" color="#f59e0b"><Calendar /></el-icon>
              <span>日程管理</span>
            </div>
            <div class="feature-item">
              <el-icon :size="32" color="#8b5cf6"><ChatDotRound /></el-icon>
              <span>协作沟通</span>
            </div>
            <div class="feature-item">
              <el-icon :size="32" color="#ef4444"><DataAnalysis /></el-icon>
              <span>数据分析</span>
            </div>
          </div>
        </div>

        <!-- 返回按钮 -->
        <el-button type="primary" size="large" @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Briefcase, 
  Tools, 
  Document, 
  Calendar, 
  ChatDotRound, 
  DataAnalysis,
  ArrowLeft 
} from '@element-plus/icons-vue';

export default defineComponent({
  name: 'SmartOfficeView',
  components: {
    Briefcase,
    Tools,
    Document,
    Calendar,
    ChatDotRound,
    DataAnalysis,
    ArrowLeft
  },
  setup() {
    const router = useRouter();

    const goBack = () => {
      router.push('/');
    };

    return {
      goBack
    };
  }
});
</script>

<style scoped>
.coming-soon-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/wide_bac.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  max-width: 800px;
  width: 100%;
}

.content-card {
  background: white;
  border-radius: 24px;
  padding: 4rem 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-wrapper {
  margin-bottom: 2rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 48px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.description {
  font-size: 20px;
  color: #6b7280;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.status-tag {
  font-size: 16px;
  padding: 0.75rem 1.5rem;
  margin-bottom: 3rem;
}

.tag-icon {
  margin-right: 0.5rem;
}

.features-preview {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.features-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 1.5rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  transition: all 0.3s;
  cursor: default;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.feature-item span {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.back-btn {
  font-size: 16px;
  padding: 0.75rem 2rem;
  border-radius: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .content-card {
    padding: 3rem 2rem;
  }

  .title {
    font-size: 36px;
  }

  .description {
    font-size: 18px;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>