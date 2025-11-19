<template>
  <div class="feedback-list-page">
    <div class="container">
      <h1 class="page-title">
        <el-icon :size="32" style="vertical-align: middle; margin-right: 0.5rem;"><DocumentCopy /></el-icon>
        反馈记录列表
      </h1>

      <!-- 统计信息栏 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">总记录数:</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">点赞数:</span>
          <span class="stat-value like">{{ stats.likeCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">点踩数:</span>
          <span class="stat-value dislike">{{ stats.dislikeCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最后更新:</span>
          <span class="stat-value">{{ stats.lastUpdate }}</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>正在加载反馈数据...</span>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error">
        <el-icon :size="64" color="#ef4444"><WarningFilled /></el-icon>
        <span>{{ error }}</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="feedbacks.length === 0" class="empty">
        <el-icon :size="64" color="#9ca3af"><FolderOpened /></el-icon>
        <span>暂无反馈记录</span>
      </div>

      <!-- 反馈列表 -->
      <div v-else class="feedback-list">
        <div
          v-for="feedback in feedbacks"
          :key="feedback.feedbackId"
          class="feedback-item"
        >
          <div class="feedback-id">ID {{ feedback.feedbackId }}</div>
          <div class="feedback-type">
            <el-icon :size="32" :color="feedback.feedbackType === 'LIKE' ? '#10b981' : '#ef4444'">
              <CircleCheck v-if="feedback.feedbackType === 'LIKE'" />
              <CircleClose v-else />
            </el-icon>
          </div>
          <div class="feedback-content">
            <div class="feedback-question">{{ feedback.question }}</div>
            <div class="feedback-meta">
              <span><el-icon><Calendar /></el-icon> {{ feedback.createAt }}</span>
              <span><el-icon><User /></el-icon> {{ feedback.reporterName || '匿名用户' }}</span>
              <span><el-icon><OfficeBuilding /></el-icon> {{ feedback.reporterUnit || '未知单位' }}</span>
              <span><el-icon><Cpu /></el-icon> {{ feedback.modelId }}</span>
            </div>
          </div>
          <button class="view-button" @click="viewDetail(feedback.feedbackId)">
            查看详情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import http from '@/config/api/http';
import { API_ENDPOINTS } from '@/config/api/api';
import { 
  DocumentCopy, 
  WarningFilled, 
  FolderOpened, 
  CircleCheck, 
  CircleClose,
  Calendar,
  User,
  OfficeBuilding,
  Cpu
} from '@element-plus/icons-vue';

interface Feedback {
  feedbackId: number;
  feedbackType: 'LIKE' | 'DISLIKE';
  question: string;
  answer: string;
  modelId: string;
  createAt: string;
  reporterName?: string;
  reporterUnit?: string;
  reason?: string;
}

const router = useRouter();
const feedbacks = ref<Feedback[]>([]);
const loading = ref(true);
const error = ref('');

// 统计信息
const stats = computed(() => {
  const total = feedbacks.value.length;
  const likeCount = feedbacks.value.filter(f => f.feedbackType === 'LIKE').length;
  const dislikeCount = feedbacks.value.filter(f => f.feedbackType === 'DISLIKE').length;
  const lastUpdate = feedbacks.value.length > 0 ? feedbacks.value[0].createAt : '无';

  return {
    total,
    likeCount,
    dislikeCount,
    lastUpdate
  };
});

// 加载反馈列表
const loadFeedbackList = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await http.get(API_ENDPOINTS.FEEDBACK.LIST);
    
    if (response.data.success) {
      feedbacks.value = response.data.data.feedbacks || [];
    } else {
      error.value = response.data.message || '获取数据失败';
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '加载失败，请稍后重试';
    console.error('加载反馈列表失败:', err);
  } finally {
    loading.value = false;
  }
};

// 查看详情
const viewDetail = (feedbackId: number) => {
  router.push({ name: 'feedback-detail', params: { id: feedbackId } });
};

onMounted(() => {
  loadFeedbackList();
});
</script>

<style scoped>
.feedback-list-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/wide_bac.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 统计信息栏 */
.stats-bar {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.95rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.like {
  color: #10b981;
}

.stat-value.dislike {
  color: #ef4444;
}

/* 加载、错误、空状态 */
.loading,
.error,
.empty {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
  font-size: 1.1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #ef4444;
  font-size: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 3rem;
}

.empty {
  color: #6b7280;
  font-size: 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-icon {
  font-size: 3rem;
}

/* 反馈列表 */
.feedback-list {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.feedback-item {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.feedback-item:last-child {
  border-bottom: none;
}

.feedback-item:hover {
  background: linear-gradient(90deg, #f9fafb 0%, #f3f4f6 100%);
}

.feedback-id {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 80px;
  text-align: center;
  margin-right: 1.5rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.feedback-type {
  margin-right: 1.5rem;
  font-size: 2rem;
  min-width: 40px;
  text-align: center;
}

.feedback-content {
  flex: 1;
  margin-right: 1.5rem;
}

.feedback-question {
  font-size: 1.05rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.75rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feedback-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.feedback-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.view-button {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.view-button:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.75rem;
  }

  .stats-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .feedback-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .feedback-id {
    margin-right: 0;
  }

  .feedback-content {
    margin-right: 0;
    width: 100%;
  }

  .view-button {
    width: 100%;
  }
}
</style>
