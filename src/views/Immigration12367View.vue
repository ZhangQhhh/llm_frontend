<template>
  <div class="coming-soon-page">
    <div class="container">
      <div class="content-card">
        <!-- 图标 -->
        <div class="icon-wrapper">
          <el-icon :size="120" color="#059669">
            <Service />
          </el-icon>
        </div>

        <!-- 标题 -->
        <h1 class="title">移民局12367</h1>
        
        <!-- 描述 -->
        <p class="description">
          移民管理服务热线智能助手，为您提供专业咨询服务
        </p>

        <!-- 状态标签 -->
        <el-tag type="success" size="large" effect="dark" class="status-tag">
          <el-icon class="tag-icon"><Tools /></el-icon>
          功能正在开发，敬请期待
        </el-tag>

        <!-- 功能预告 -->
        <div class="features-preview">
          <h3 class="features-title">即将推出的功能</h3>
          <div class="features-grid">
            <div class="feature-item">
              <el-icon :size="32" color="#10b981"><QuestionFilled /></el-icon>
              <span>智能问答</span>
            </div>
            <div class="feature-item">
              <el-icon :size="32" color="#3b82f6"><Document /></el-icon>
              <span>政策查询</span>
            </div>
            <div class="feature-item">
              <el-icon :size="32" color="#f59e0b"><Guide /></el-icon>
              <span>办事指南</span>
            </div>
            <div class="feature-item">
              <el-icon :size="32" color="#8b5cf6"><Phone /></el-icon>
              <span>在线咨询</span>
            </div>
          </div>
        </div>

        <!-- 服务特色 -->
        <div class="service-highlights">
          <div class="highlight-item">
            <el-icon :size="24" color="#2563eb"><Clock /></el-icon>
            <div class="highlight-text">
              <h4>7×24小时服务</h4>
              <p>全天候智能响应</p>
            </div>
          </div>
          <div class="highlight-item">
            <el-icon :size="24" color="#059669"><Checked /></el-icon>
            <div class="highlight-text">
              <h4>专业权威</h4>
              <p>官方政策解读</p>
            </div>
          </div>
          <div class="highlight-item">
            <el-icon :size="24" color="#f59e0b"><Lightning /></el-icon>
            <div class="highlight-text">
              <h4>快速响应</h4>
              <p>秒级智能回复</p>
            </div>
          </div>
        </div>

        <!-- 返回按钮 -->
        <el-button type="success" size="large" @click="goBack" class="back-btn">
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
  Service, 
  Tools, 
  QuestionFilled, 
  Document, 
  Guide, 
  Phone,
  Clock,
  Checked,
  Lightning,
  ArrowLeft 
} from '@element-plus/icons-vue';

export default defineComponent({
  name: 'Immigration12367View',
  components: {
    Service,
    Tools,
    QuestionFilled,
    Document,
    Guide,
    Phone,
    Clock,
    Checked,
    Lightning,
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  max-width: 900px;
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
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
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
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.features-title {
  font-size: 20px;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 1.5rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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
  border: 2px solid transparent;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
  border-color: #10b981;
}

.feature-item span {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.service-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 2rem 0;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  transition: all 0.3s;
}

.highlight-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.2);
}

.highlight-text {
  text-align: left;
  flex: 1;
}

.highlight-text h4 {
  font-size: 16px;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.25rem 0;
}

.highlight-text p {
  font-size: 13px;
  color: #78350f;
  margin: 0;
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

  .service-highlights {
    grid-template-columns: 1fr;
  }
}
</style>
