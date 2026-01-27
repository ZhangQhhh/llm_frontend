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
      <div v-else class="feedback-list" ref="listRef">
        <div
          v-for="feedback in feedbacks"
          :key="feedback.feedbackId"
          class="feedback-item"
          :data-feedback-id="feedback.feedbackId"
        >
          <div class="feedback-id">ID {{ feedback.feedbackId }}</div>
          <div class="feedback-type">
            <el-icon :size="32" :color="isLike(feedback.feedbackType) ? '#10b981' : '#ef4444'">
              <CircleCheck v-if="isLike(feedback.feedbackType)" />
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
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import http from '@/config/api/http';
import { API_ENDPOINTS } from '@/config/api/api';
import {
  getFeedbackListCache,
  updateFeedbackListCache,
  type FeedbackListItem,
} from '@/utils/feedbackListCache';
import {
  DocumentCopy,
  WarningFilled,
  FolderOpened,
  CircleCheck,
  CircleClose,
  Calendar,
  User,
  OfficeBuilding,
  Cpu,
} from '@element-plus/icons-vue';

type FeedbackTypeFilter = '' | 'like' | 'dislike';

const router = useRouter();
const feedbacks = ref<FeedbackListItem[]>([]);
const loading = ref(true);
const error = ref('');
const listRef = ref<HTMLElement | null>(null);
const feedbackType = ref<FeedbackTypeFilter>('');

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  pages: 0,
});

const isLike = (type?: string) => String(type || '').toUpperCase() === 'LIKE';

const stats = computed(() => {
  const likeCount = feedbacks.value.filter((f) => isLike(f.feedbackType)).length;
  const dislikeCount = feedbacks.value.filter((f) => !isLike(f.feedbackType)).length;
  const total = pagination.total || feedbacks.value.length;
  const lastUpdate = feedbacks.value.length > 0 ? feedbacks.value[0].createAt : '?';

  return {
    total,
    likeCount,
    dislikeCount,
    lastUpdate,
  };
});

const normalizeFeedbackType = (type?: string) => String(type || '').toUpperCase();

const applyCache = () => {
  const cache = getFeedbackListCache();
  if (!cache || !cache.restoreOnNextEnter || cache.records.length === 0) {
    return false;
  }

  feedbacks.value = cache.records;
  pagination.page = cache.pageNum;
  pagination.pageSize = cache.pageSize;
  pagination.total = cache.total;
  pagination.pages = cache.pages;
  feedbackType.value = (cache.feedbackType as FeedbackTypeFilter) || '';

  updateFeedbackListCache({ restoreOnNextEnter: false });
  return true;
};

const restoreScrollPosition = async () => {
  const cache = getFeedbackListCache();
  if (!cache) return;

  await nextTick();

  const targetId = cache.lastClickedId;
  if (targetId) {
    const selector = `[data-feedback-id="${targetId}"]`;
    const target =
      listRef.value?.querySelector(selector) ?? document.querySelector(selector);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: 'center' });
      return;
    }
  }

  if (cache.scrollTop > 0) {
    window.scrollTo({ top: cache.scrollTop });
  }
};

const syncCache = () => {
  updateFeedbackListCache({
    pageNum: pagination.page,
    pageSize: pagination.pageSize,
    feedbackType: feedbackType.value,
    total: pagination.total,
    pages: pagination.pages,
    records: feedbacks.value,
  });
};

const loadFeedbackPage = async (options?: { showLoading?: boolean; restoreScroll?: boolean }) => {
  let success = false;
  const showLoading = options?.showLoading !== false;
  const restoreScroll = options?.restoreScroll === true;

  if (showLoading) {
    loading.value = true;
  } else {
    loading.value = false;
  }
  error.value = '';

  try {
    const params: Record<string, string | number> = {
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
    };
    if (feedbackType.value) {
      params.feedbackType = feedbackType.value;
    }

    const response = await http.get(API_ENDPOINTS.FEEDBACK.PAGE, { params });

    if (response.data.success) {
      const data = response.data.data || {};
      const records = Array.isArray(data.records) ? data.records : [];
      feedbacks.value = records.map((record: FeedbackListItem) => ({
        ...record,
        feedbackType: normalizeFeedbackType(record.feedbackType),
      }));

      const total = typeof data.total === 'number' ? data.total : Number(data.total) || records.length;
      const size = typeof data.size === 'number' ? data.size : Number(data.size) || pagination.pageSize;
      const pages = typeof data.pages === 'number' ? data.pages : Number(data.pages) || Math.ceil(total / size);
      const current = typeof data.current === 'number' ? data.current : Number(data.current) || pagination.page;

      pagination.total = total;
      pagination.pageSize = size;
      pagination.pages = pages;
      pagination.page = current;

      syncCache();
      success = true;
    } else if (feedbacks.value.length === 0) {
      error.value = response.data.message || '获取数据失败';
    }
  } catch (err: any) {
    if (feedbacks.value.length === 0) {
      error.value = err.response?.data?.message || '加载失败，请稍后重试';
    } else {
      console.error('加载反馈列表失败:', err);
    }
  } finally {
    if (showLoading) {
      loading.value = false;
    }
  }

  if (restoreScroll) {
    await restoreScrollPosition();
  }
  return success;
};

const handlePageChange = async (page: number) => {
  const previousPage = pagination.page;
  pagination.page = page;
  updateFeedbackListCache({ lastClickedId: null, scrollTop: 0 });
  const loaded = await loadFeedbackPage();
  if (!loaded) {
    pagination.page = previousPage;
    return;
  }
  window.scrollTo({ top: 0 });
};

const handleSizeChange = async (size: number) => {
  const previousPage = pagination.page;
  const previousSize = pagination.pageSize;
  pagination.pageSize = size;
  pagination.page = 1;
  updateFeedbackListCache({ lastClickedId: null, scrollTop: 0 });
  const loaded = await loadFeedbackPage();
  if (!loaded) {
    pagination.page = previousPage;
    pagination.pageSize = previousSize;
    return;
  }
  window.scrollTo({ top: 0 });
};

const viewDetail = (feedbackId: number) => {
  updateFeedbackListCache({
    pageNum: pagination.page,
    pageSize: pagination.pageSize,
    feedbackType: feedbackType.value,
    total: pagination.total,
    pages: pagination.pages,
    records: feedbacks.value,
    scrollTop: window.scrollY,
    lastClickedId: feedbackId,
    restoreOnNextEnter: true,
  });

  router.push({ name: 'feedback-detail', params: { id: feedbackId } });
};

onMounted(async () => {
  const restored = applyCache();
  if (restored) {
    loading.value = false;
    await restoreScrollPosition();
  }
  await loadFeedbackPage({ showLoading: !restored, restoreScroll: restored });
});
</script>


<style scoped>
.feedback-list-page {
  min-height: 100vh;
  background: url('@/assets/allPic/public/card.jpg') no-repeat center center;
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.8);
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
