<template>
  <div class="qa-logs-page">
    <div class="container">
      <h1 class="page-title">
        <el-icon :size="32" style="vertical-align: middle; margin-right: 0.5rem;"><Document /></el-icon>
        问答日志管理
      </h1>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-item">
          <label>选择日期：</label>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            @change="handleDateChange"
          />
        </div>
        <div class="filter-item">
          <label>用户ID：</label>
          <el-input
            v-model="filterUserId"
            placeholder="输入用户ID筛选"
            clearable
            style="width: 200px;"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="filter-item">
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>

      <!-- 统计信息栏 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">当前日期:</span>
          <span class="stat-value">{{ logData.date || '-' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总记录数:</span>
          <span class="stat-value">{{ logData.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">当前页:</span>
          <span class="stat-value">{{ logData.page }} / {{ logData.total_pages || 1 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">可用日期数:</span>
          <span class="stat-value highlight">{{ availableDates.length }}</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>正在加载日志数据...</span>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error">
        <el-icon :size="64" color="#ef4444"><WarningFilled /></el-icon>
        <span>{{ error }}</span>
        <el-button type="primary" @click="loadLogs" style="margin-top: 1rem;">重试</el-button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="logs.length === 0" class="empty">
        <el-icon :size="64" color="#9ca3af"><FolderOpened /></el-icon>
        <span>暂无日志记录</span>
      </div>

      <!-- 日志列表 -->
      <div v-else class="log-list">
        <div
          v-for="log in logs"
          :key="log.id"
          class="log-item"
          @click="viewDetail(log)"
        >
          <div class="log-header">
            <span class="log-type" :class="getTypeClass(log.type)">{{ getTypeLabel(log.type) }}</span>
            <span class="log-time">
              <el-icon><Clock /></el-icon>
              {{ formatTime(log.timestamp) }}
            </span>
          </div>
          <div class="log-question">
            <el-icon><ChatDotRound /></el-icon>
            {{ log.question }}
          </div>
          <div class="log-preview">{{ log.answer_preview }}</div>
          <div class="log-meta">
            <span v-if="log.metadata.user_id" class="meta-item">
              <el-icon><User /></el-icon>
              {{ log.metadata.user_id }}
            </span>
            <span v-if="log.metadata.ip" class="meta-item">
              <el-icon><Location /></el-icon>
              {{ log.metadata.ip }}
            </span>
            <span v-if="log.metadata.answer_type" class="meta-item">
              <el-icon><Cpu /></el-icon>
              {{ log.metadata.answer_type }}
            </span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="logData.total_pages > 1" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="logData.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 日志详情弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      title="日志详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="detailLoading" class="detail-loading">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="logDetail" class="log-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>日志ID:</label>
              <span class="mono">{{ logDetail.id }}</span>
            </div>
            <div class="detail-item">
              <label>时间:</label>
              <span>{{ formatTime(logDetail.timestamp) }}</span>
            </div>
            <div class="detail-item">
              <label>类型:</label>
              <span class="log-type" :class="getTypeClass(logDetail.type)">{{ getTypeLabel(logDetail.type) }}</span>
            </div>
            <div class="detail-item" v-if="logDetail.metadata.user_id">
              <label>用户ID:</label>
              <span>{{ logDetail.metadata.user_id }}</span>
            </div>
            <div class="detail-item" v-if="logDetail.metadata.ip">
              <label>IP地址:</label>
              <span class="mono">{{ logDetail.metadata.ip }}</span>
            </div>
            <div class="detail-item" v-if="logDetail.metadata.answer_type">
              <label>回答类型:</label>
              <span>{{ logDetail.metadata.answer_type }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>用户问题</h4>
          <div class="detail-content question-content">{{ logDetail.question }}</div>
        </div>

        <div class="detail-section">
          <h4>系统回答</h4>
          <div class="detail-content answer-content" v-html="renderMarkdown(logDetail.answer)"></div>
        </div>

        <div class="detail-section" v-if="Object.keys(logDetail.metadata).length > 0">
          <h4>元数据</h4>
          <div class="metadata-json">
            <pre>{{ JSON.stringify(logDetail.metadata, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import {
  Document,
  Search,
  Refresh,
  WarningFilled,
  FolderOpened,
  Clock,
  ChatDotRound,
  User,
  Location,
  Cpu,
  Loading
} from '@element-plus/icons-vue';
import {
  getQALogsByDate,
  getQALogDetail,
  getQALogDates,
  type QALogItem,
  type QALogDetail,
  type QALogListResponse
} from '@/utils/chatApi';
import { renderMarkdown } from '@/utils/markdown';

const store = useStore();

// 状态
const loading = ref(false);
const error = ref('');
const logs = ref<QALogItem[]>([]);
const logData = ref<QALogListResponse>({
  date: '',
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 0,
  logs: []
});

// 筛选条件
const selectedDate = ref<string>(getTodayDate());
const filterUserId = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

// 可用日期列表
const availableDates = ref<string[]>([]);

// 详情弹窗
const showDetailDialog = ref(false);
const detailLoading = ref(false);
const logDetail = ref<QALogDetail | null>(null);

// 获取今天日期
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// 禁用未来日期和没有日志的日期
function disabledDate(date: Date): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
}

// 获取类型标签
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    'knowledge_qa_stream': '知识问答',
    'knowledge_chat': '知识对话',
    'conversation': '多轮对话',
    'mcq': '选择题'
  };
  return typeMap[type] || type;
}

// 获取类型样式类
function getTypeClass(type: string): string {
  const classMap: Record<string, string> = {
    'knowledge_qa_stream': 'type-qa',
    'knowledge_chat': 'type-chat',
    'conversation': 'type-conv',
    'mcq': 'type-mcq'
  };
  return classMap[type] || 'type-default';
}

// 格式化时间
function formatTime(timestamp: string): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 加载可用日期列表
async function loadAvailableDates() {
  try {
    const token = store.state.user.token;
    const result = await getQALogDates(token);
    availableDates.value = result.dates || [];
  } catch (err: any) {
    console.error('加载日期列表失败:', err);
  }
}

// 加载日志列表
async function loadLogs() {
  loading.value = true;
  error.value = '';

  try {
    const token = store.state.user.token;
    const result = await getQALogsByDate(token, {
      date: selectedDate.value,
      user_id: filterUserId.value || undefined,
      page: currentPage.value,
      page_size: pageSize.value
    });

    logData.value = result;
    logs.value = result.logs || [];
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || '加载失败，请稍后重试';
    console.error('加载日志列表失败:', err);
  } finally {
    loading.value = false;
  }
}

// 查看详情
async function viewDetail(log: QALogItem) {
  showDetailDialog.value = true;
  detailLoading.value = true;
  logDetail.value = null;

  try {
    const token = store.state.user.token;
    logDetail.value = await getQALogDetail(token, log.id, selectedDate.value);
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '加载详情失败');
    showDetailDialog.value = false;
  } finally {
    detailLoading.value = false;
  }
}

// 处理日期变化
function handleDateChange() {
  currentPage.value = 1;
  loadLogs();
}

// 处理搜索
function handleSearch() {
  currentPage.value = 1;
  loadLogs();
}

// 处理重置
function handleReset() {
  selectedDate.value = getTodayDate();
  filterUserId.value = '';
  currentPage.value = 1;
  pageSize.value = 20;
  loadLogs();
}

// 处理分页大小变化
function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  loadLogs();
}

// 处理页码变化
function handlePageChange(page: number) {
  currentPage.value = page;
  loadLogs();
}

onMounted(() => {
  loadAvailableDates();
  loadLogs();
});
</script>

<style scoped>
.qa-logs-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 筛选栏 */
.filter-bar {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-item label {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

/* 统计信息栏 */
.stats-bar {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 1rem 2rem;
  margin-bottom: 1.5rem;
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
  color: #6b7280;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
}

.stat-value.highlight {
  color: #667eea;
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误和空状态 */
.error, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  color: #6b7280;
}

/* 日志列表 */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.log-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.log-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.log-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.type-qa {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-chat {
  background: #dcfce7;
  color: #15803d;
}

.type-conv {
  background: #fef3c7;
  color: #b45309;
}

.type-mcq {
  background: #f3e8ff;
  color: #7c3aed;
}

.type-default {
  background: #f3f4f6;
  color: #4b5563;
}

.log-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
  font-size: 0.85rem;
}

.log-question {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.log-preview {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 0.75rem;
}

.log-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #9ca3af;
  font-size: 0.8rem;
}

/* 分页 */
.pagination {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 详情弹窗 */
.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.detail-loading .el-icon {
  margin-bottom: 1rem;
}

.log-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-size: 0.8rem;
  color: #6b7280;
}

.detail-item span {
  font-weight: 500;
  color: #1f2937;
}

.detail-item .mono {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
}

.detail-content {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  line-height: 1.6;
}

.question-content {
  color: #1f2937;
  font-weight: 500;
}

.answer-content {
  color: #374151;
}

.answer-content :deep(p) {
  margin-bottom: 0.5rem;
}

.answer-content :deep(code) {
  background: #e5e7eb;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.answer-content :deep(pre) {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.metadata-json {
  background: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
}

.metadata-json pre {
  margin: 0;
  color: #a5f3fc;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
