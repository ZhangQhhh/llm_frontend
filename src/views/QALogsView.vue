<template>
  <div class="qa-logs-page">
    <div class="container">
      <!-- 模拟数据模式提示 -->
      <el-alert
        v-if="isMockMode"
        title="模拟数据模式"
        type="warning"
        :closable="false"
        show-icon
        class="mock-alert"
      >
        <template #default>
          当前处于模拟数据模式，所有数据均为模拟数据。移除 URL 中的 <code>?mock=1</code> 参数可切换回正常模式。
        </template>
      </el-alert>

      <h1 class="page-title">
        <el-icon :size="32" style="vertical-align: middle; margin-right: 0.5rem;"><Document /></el-icon>
        {{ pageTitle }}
      </h1>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-item">
          <label>日志类型：</label>
          <el-select
            v-model="logCategory"
            style="width: 200px;"
            @change="handleLogCategoryChange"
          >
          <el-option label="问答日志" value="qa" />
          <el-option label="写作日志" value="writing" />
          <el-option label="数研报告日志" value="report" />
          </el-select>
        </div>
        <div class="filter-item" v-if="isWritingLogs">
          <label>写作类型：</label>
          <el-select
            v-model="writingType"
            style="width: 200px;"
            @change="handleWritingTypeChange"
          >
            <el-option label="全部" value="" />
            <el-option label="公文写作" value="official_document" />
            <el-option label="数据分析报告" value="data_analysis_report" />
            <el-option label="通用写作" value="general_writing" />
          </el-select>
        </div>
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
        <div class="filter-item" v-if="!isWritingLogs">
          <label>用户名：</label>
          <el-input
            v-model="filterUserName"
            placeholder="输入用户名筛选"
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
        <div class="stat-item" v-if="isQaLogs || isWritingLogs">
          <span class="stat-label">可用日期数:</span>
          <span class="stat-value highlight">{{ availableDates.length }}</span>
        </div>
      </div>

      <div v-if="isWritingLogs && writingStats" class="writing-stats-grid">
        <div class="writing-stat-card">
          <span class="label">总条目</span>
          <span class="value">{{ writingStats.summary.total_entries }}</span>
        </div>
        <div class="writing-stat-card">
          <span class="label">会话数</span>
          <span class="value">{{ writingStats.summary.total_sessions }}</span>
        </div>
        <div class="writing-stat-card success">
          <span class="label">成功</span>
          <span class="value">{{ writingStats.summary.success_count }}</span>
        </div>
        <div class="writing-stat-card error">
          <span class="label">失败</span>
          <span class="value">{{ writingStats.summary.error_count }}</span>
        </div>
        <div class="writing-stat-card">
          <span class="label">平均耗时</span>
          <span class="value">{{ writingStats.summary.avg_generation_time }}s</span>
        </div>
        <div class="writing-stat-card">
          <span class="label">平均长度</span>
          <span class="value">{{ writingStats.summary.avg_content_length }}</span>
        </div>
        <div class="writing-stat-card">
          <span class="label">公文写作</span>
          <span class="value">{{ writingStats.writing_types.official_document || 0 }}</span>
        </div>
        <div class="writing-stat-card">
          <span class="label">数据分析报告</span>
          <span class="value">{{ writingStats.writing_types.data_analysis_report || 0 }}</span>
        </div>
        <div class="writing-stat-card">
          <span class="label">通用写作</span>
          <span class="value">{{ writingStats.writing_types.general_writing || 0 }}</span>
        </div>
        <div class="writing-stat-card">
          <span class="label">统计周期</span>
          <span class="value">{{ writingStats.period.start_date }} ~ {{ writingStats.period.end_date }}</span>
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
        <span>{{ isWritingLogs ? "该日期暂无写作日志" : "暂无日志记录" }}</span>
      </div>

      <!-- 日志列表 -->
      <div v-else class="log-list">
        <div
          v-for="(log, index) in logs"
          :key="getLogId(log, index, true)"
          class="log-item"
          @click="viewDetail(log)"
        >
          <div class="log-header">
            <span class="log-type" :class="getTypeClass(getLogType(log))">{{ getTypeLabel(getLogType(log)) }}</span>
            <span class="log-time">
              <el-icon><Clock /></el-icon>
              {{ formatTime(getLogTimestamp(log)) }}
            </span>
          </div>
          <div class="log-question">
            <el-icon><ChatDotRound /></el-icon>
            {{ getLogTitle(log) }}
          </div>
          <div v-if="getLogPreview(log)" class="log-preview">{{ getLogPreview(log) }}</div>
          <div class="log-meta">
            <span v-if="getLogUserName(log)" class="meta-item">
              <el-icon><User /></el-icon>
              {{ getLogUserName(log) }}
            </span>
            <span v-else-if="getLogUserId(log)" class="meta-item">
              <el-icon><User /></el-icon>
              {{ getUserName(getLogUserId(log)) }}
            </span>
            <span v-if="getLogOperation(log)" class="meta-item">
              <el-icon><EditPen /></el-icon>
              {{ getOperationLabel(getLogOperation(log)) }}
            </span>
            <span v-if="isReportLogs && getReportTypeLabel(log)" class="meta-item">
              <el-icon><Document /></el-icon>
              {{ getReportTypeLabel(log) }}
            </span>
            <span v-if="isReportLogs && getReportStatusLabel(log)" class="meta-item">
              <el-icon><Cpu /></el-icon>
              {{ getReportStatusLabel(log) }}
            </span>
            <span v-if="getLogSessionId(log)" class="meta-item">
              <el-icon><Link /></el-icon>
              {{ getLogSessionId(log) }}
            </span>
            <span v-if="getLogIp(log)" class="meta-item">
              <el-icon><Location /></el-icon>
              {{ getLogIp(log) }}
            </span>
            <span v-if="getLogAnswerType(log)" class="meta-item">
              <el-icon><Cpu /></el-icon>
              {{ getLogAnswerType(log) }}
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
              <span class="mono">{{ getLogId(logDetail) }}</span>
            </div>
            <div class="detail-item">
              <label>时间:</label>
              <span>{{ formatTime(getLogTimestamp(logDetail)) }}</span>
            </div>
            <div class="detail-item">
              <label>类型:</label>
              <span class="log-type" :class="getTypeClass(getLogType(logDetail))">{{ getTypeLabel(getLogType(logDetail)) }}</span>
            </div>
            <div class="detail-item" v-if="getLogUserName(logDetail)">
              <label>用户:</label>
              <span>{{ getLogUserName(logDetail) }}</span>
            </div>
            <div class="detail-item" v-else-if="getLogUserId(logDetail)">
              <label>用户:</label>
              <span>{{ getUserName(getLogUserId(logDetail)) }}</span>
            </div>
            <div class="detail-item" v-if="getLogOperation(logDetail)">
              <label>写作操作:</label>
              <span>{{ getOperationLabel(getLogOperation(logDetail)) }}</span>
            </div>
            <div class="detail-item" v-if="getLogSessionId(logDetail)">
              <label>会话ID:</label>
              <span class="mono">{{ getLogSessionId(logDetail) }}</span>
            </div>
            <div class="detail-item" v-if="getLogIp(logDetail)">
              <label>IP地址:</label>
              <span class="mono">{{ getLogIp(logDetail) }}</span>
            </div>
            <div class="detail-item" v-if="getLogAnswerType(logDetail)">
              <label>回答类型:</label>
              <span>{{ getLogAnswerType(logDetail) }}</span>
            </div>
            <div class="detail-item" v-if="isReportLogs && getReportStatusLabel(logDetail)">
              <label>状态:</label>
              <span>{{ getReportStatusLabel(logDetail) }}</span>
            </div>
            <div class="detail-item" v-if="isReportLogs && getReportTypeLabel(logDetail)">
              <label>报告类型:</label>
              <span>{{ getReportTypeLabel(logDetail) }}</span>
            </div>
          </div>
        </div>

        <div v-if="isReportLogs">
          <div class="detail-section" v-if="getReportFileInfo(logDetail)">
            <h4>文件信息</h4>
            <div class="metadata-json">
              <pre>{{ JSON.stringify(getReportFileInfo(logDetail), null, 2) }}</pre>
            </div>
          </div>
          <div class="detail-section" v-if="getReportErrorMessage(logDetail)">
            <h4>错误信息</h4>
            <div class="detail-content question-content">{{ getReportErrorMessage(logDetail) }}</div>
          </div>
        </div>
        <div v-else-if="isWritingLogs">
          <div class="detail-section">
            <h4>写作请求</h4>
            <div class="detail-content question-content">{{ getWritingDetailRequest(logDetail) }}</div>
          </div>
          <div v-if="getWritingDetailResult(logDetail)" class="detail-section">
            <h4>写作结果</h4>
            <div class="detail-content answer-content" v-html="renderMarkdown(getWritingDetailResult(logDetail))"></div>
          </div>
        </div>
        <div v-else>
          <div class="detail-section">
            <h4>用户问题</h4>
            <div class="detail-content question-content">{{ getQADetailQuestion(logDetail) }}</div>
          </div>
          <div class="detail-section">
            <h4>系统回答</h4>
            <div class="detail-content answer-content" v-html="renderMarkdown(getQADetailAnswer(logDetail))"></div>
          </div>
        </div>

        <div class="detail-section" v-if="Object.keys(getLogMetadata(logDetail)).length > 0">
          <h4>元数据</h4>
          <div class="metadata-json">
            <pre>{{ JSON.stringify(getLogMetadata(logDetail), null, 2) }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
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
  EditPen,
  Link,
  Loading
} from '@element-plus/icons-vue';
import {
  getQALogsByDate,
  getQALogDetail,
  getQALogDates,
  type QALogItem,
  type QALogDetail,
  getWritingLogsByDate,
  getWritingLogDetail,
  getWritingLogDates,
  getWritingLogStatistics,
  type WritingLogItem,
  type WritingLogDetail,
  type WritingType,
  type WritingLogStatisticsResponse,
  getReportLogs,
  getReportLogDetail,
  type ReportLogItem,
  type ReportLogDetail
} from '@/utils/chatApi';
import { renderMarkdown } from '@/utils/markdown';
import { buildUserFilterParams } from '@/utils/qaLogFilters';
import { ensureUserCacheLoaded, getUserNameById } from '@/utils/userCache';
import { isMockEnabled } from '@/mocks/mockService';

const store = useStore();

// 模拟数据模式
const isMockMode = ref(isMockEnabled());

type LogCategory = 'qa' | 'writing' | 'report';
type LogItem = QALogItem | WritingLogItem | ReportLogItem;
type LogDetail = QALogDetail | WritingLogDetail | ReportLogDetail;

interface LogListState {
  date: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: LogItem[];
}

// 状态
const loading = ref(false);
const error = ref('');
const logs = ref<LogItem[]>([]);
const logData = ref<LogListState>({
  date: '',
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 0,
  logs: []
});

// 筛选条件
const logCategory = ref<LogCategory>('qa');
const writingType = ref<WritingType | ''>('');

const selectedDate = ref<string>(getTodayDate());
const filterUserName = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

const refreshIntervalMs = 10000;
let refreshTimer: number | null = null;
let autoRefreshing = false;

// 可用日期列表
const availableDates = ref<string[]>([]);
const writingStats = ref<WritingLogStatisticsResponse | null>(null);


// 详情弹窗
const showDetailDialog = ref(false);
const detailLoading = ref(false);
const logDetail = ref<LogDetail | null>(null);

const isWritingLogs = computed(() => logCategory.value === 'writing');
const isReportLogs = computed(() => logCategory.value === 'report');
const isQaLogs = computed(() => logCategory.value === 'qa');
const pageTitle = computed(() => {
  if (isWritingLogs.value) return '写作日志';
  if (isReportLogs.value) return '数研报告日志';
  return '问答日志管理';
});

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

// 加载可用日期
async function loadAvailableDates(options: { setDefault?: boolean } = {}) {
  const { setDefault = false } = options;
  try {
    const token = store.state.user.token;
    if (isQaLogs.value) {
      const result = await getQALogDates(token);
      availableDates.value = result.dates || [];
    } else if (isWritingLogs.value) {
      const result = await getWritingLogDates(token);
      availableDates.value = result.dates || [];
    } else {
      availableDates.value = [];
    }

    if (setDefault) {
      selectedDate.value = availableDates.value[0] || getTodayDate();
    }
  } catch (err: any) {
    console.error('加载日期列表失败:', err);
  }
}

async function loadWritingStatistics() {
  if (!isWritingLogs.value) {
    writingStats.value = null;
    return;
  }
  try {
    const token = store.state.user.token;
    writingStats.value = await getWritingLogStatistics(token, 7);
  } catch (err: any) {
    console.error('加载写作统计失败:', err);
    writingStats.value = null;
  }
}

function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    knowledge_qa_stream: '知识问答',
    knowledge_chat: '知识问答',
    conversation: '多轮对话',
    mcq: '选择题',
    writing_start: '写作开始',
    retrieval_result: '检索结果',
    writing_result: '写作结果',
    writing_error: '写作失败',
    report_started: '报告开始',
    report_completed: '报告完成',
    report_failed: '报告失败',
    report_unknown: '报告未知'
  };
  return typeMap[type] || type;
}

function getTypeClass(type: string): string {
  const classMap: Record<string, string> = {
    knowledge_qa_stream: 'type-qa',
    knowledge_chat: 'type-chat',
    conversation: 'type-conv',
    mcq: 'type-mcq',
    writing_start: 'type-writing-start',
    retrieval_result: 'type-retrieval',
    writing_result: 'type-writing-result',
    writing_error: 'type-writing-error',
    report_started: 'type-report-started',
    report_completed: 'type-report-completed',
    report_failed: 'type-report-failed',
    report_unknown: 'type-default'
  };
  return classMap[type] || 'type-default';
}

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

function getLogType(log: LogItem): string {
  if (isReportLogs.value) {
    const status = (log as ReportLogItem).status || 'unknown';
    return `report_${status}`;
  }
  return (log as any).type || 'unknown';
}

function getLogTimestamp(log: LogItem): string {
  return (
    (log as any).timestamp ||
    (log as ReportLogItem).created_at ||
    (log as ReportLogItem).updated_at ||
    ''
  );
}

function pickFirstString(values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function getLogId(log: LogItem, index?: number, allowIndexFallback = false): string {
  const direct = (log as any).id ?? (log as any).log_id ?? (log as any).detail_id ?? (log as any).job_id;
  if (direct) {
    return String(direct);
  }
  const timestamp = (log as any).timestamp;
  const lineIndex = (log as any).line_index;
  if (timestamp && lineIndex !== undefined) {
    return `${timestamp}_${lineIndex}`;
  }
  if (allowIndexFallback && index !== undefined) {
    return timestamp ? `${timestamp}_${index}` : `log_${index}`;
  }
  return '';
}

function getLogUserId(log: LogItem): string | undefined {
  const userId = (log as any).metadata?.user_id ?? (log as any).user_id;
  if (userId === undefined || userId === null || userId === '') {
    return undefined;
  }
  return String(userId);
}

function getLogUserName(log: LogItem): string | undefined {
  if (isReportLogs.value) {
    const username = (log as ReportLogItem).username;
    return typeof username === 'string' ? username : undefined;
  }
  return undefined;
}

function getLogOperation(log: LogItem): string | undefined {
  const operation = (log as any).operation;
  return typeof operation === 'string' ? operation : undefined;
}

function getOperationLabel(operation?: string): string {
  if (!operation) return '';
  const normalized = operation.toLowerCase();
  const map: Record<string, string> = {
    generate: '生成',
    edit: '编辑',
    complete: '补全'
  };
  return map[normalized] || operation;
}

function getLogSessionId(log: LogItem): string | undefined {
  const sessionId = (log as any).session_id;
  if (sessionId === undefined || sessionId === null || sessionId === '') {
    return undefined;
  }
  return String(sessionId);
}

function getLogIp(log: LogItem): string | undefined {
  const ip = (log as any).metadata?.ip;
  return typeof ip === 'string' ? ip : undefined;
}

function getLogAnswerType(log: LogItem): string | undefined {
  const answerType = (log as any).metadata?.answer_type;
  return typeof answerType === 'string' ? answerType : undefined;
}

function getWritingTypeLabel(type?: WritingType): string {
  const map: Record<string, string> = {
    official_document: '公文写作',
    data_analysis_report: '数据分析报告',
    general_writing: '通用写作'
  };
  return type ? (map[type] || type) : '全部';
}

function getLogTitle(log: LogItem): string {
  if (isReportLogs.value) {
    const reportType = getReportTypeLabel(log);
    const statusLabel = getReportStatusLabel(log);
    const jobId = getLogId(log);
    const pieces = [reportType, statusLabel, jobId && `任务 ${jobId}`].filter(Boolean);
    return pieces.length ? pieces.join(' / ') : '未知日志';
  }
  if (isWritingLogs.value) {
    const writingLog = log as WritingLogItem;
    const sessionId = getLogSessionId(log);
    const typeLabel = getWritingTypeLabel(writingLog.writing_type);
    if (writingLog.type === 'writing_start') {
      return writingLog.instruction_preview || `写作请求${sessionId ? ` / ${sessionId}` : ''}`;
    }
    if (writingLog.type === 'retrieval_result') {
      return `${typeLabel} / 检索结果${sessionId ? ` / ${sessionId}` : ''}`;
    }
    if (writingLog.type === 'writing_result') {
      return `${typeLabel} / 写作结果${sessionId ? ` / ${sessionId}` : ''}`;
    }
    if (writingLog.type === 'writing_error') {
      return `${typeLabel} / 写作失败${sessionId ? ` / ${sessionId}` : ''}`;
    }
    return `${typeLabel}${sessionId ? ` / ${sessionId}` : ''}`;
  }

  return (log as QALogItem).question || '-';
}

function formatWritingPreviewParts(parts: Array<string | undefined>): string {
  return parts.filter((part) => part && part.trim()).join(' / ');
}

function getLogPreview(log: LogItem): string {
  if (isReportLogs.value) {
    const errorMsg = getReportErrorMessage(log);
    if (errorMsg) return errorMsg;
    const fileInfo = getReportFileInfo(log);
    if (fileInfo && typeof fileInfo === 'object' && 'output_file' in fileInfo) {
      return String((fileInfo as any).output_file || '');
    }
    return '';
  }
  if (isWritingLogs.value) {
    const writingLog = log as WritingLogItem;
    if (writingLog.type === 'writing_start') {
      return formatWritingPreviewParts([
        writingLog.instruction_preview,
        writingLog.session_id ? `会话: ${writingLog.session_id}` : undefined
      ]);
    }
    if (writingLog.type === 'retrieval_result') {
      return formatWritingPreviewParts([
        writingLog.retrieved_count !== undefined ? `检索 ${writingLog.retrieved_count}` : undefined,
        writingLog.reranked_count !== undefined ? `重排 ${writingLog.reranked_count}` : undefined,
        writingLog.avg_score !== undefined ? `平均分 ${writingLog.avg_score}` : undefined,
        writingLog.source_files_preview ? `来源: ${writingLog.source_files_preview}` : undefined
      ]);
    }
    if (writingLog.type === 'writing_result') {
      return formatWritingPreviewParts([
        writingLog.content_length !== undefined ? `长度 ${writingLog.content_length}` : undefined,
        writingLog.source_count !== undefined ? `来源 ${writingLog.source_count}` : undefined,
        writingLog.generation_time !== undefined ? `耗时 ${writingLog.generation_time}s` : undefined,
        writingLog.content_preview
      ]);
    }
    if (writingLog.type === 'writing_error') {
      return formatWritingPreviewParts([
        writingLog.error_type ? `错误类型: ${writingLog.error_type}` : undefined,
        writingLog.error_message
      ]);
    }
    return '';
  }

  return (log as QALogItem).answer_preview || '';
}

function getReportTypeLabel(log: LogItem): string {
  const reportType = (log as ReportLogItem).report_type;
  if (!reportType) return '';
  const map: Record<string, string> = {
    comprehensive: '综合报告',
    people_only: '人员报告'
  };
  return map[reportType] || reportType;
}

function getReportStatusLabel(log: LogItem): string {
  const status = (log as ReportLogItem).status;
  if (!status) return '';
  const map: Record<string, string> = {
    started: '进行中',
    completed: '已完成',
    failed: '失败'
  };
  return map[status] || status;
}

function getReportFileInfo(log: LogItem): Record<string, unknown> | null {
  const fileInfo = (log as ReportLogItem).file_info;
  return fileInfo && typeof fileInfo === 'object' ? (fileInfo as Record<string, unknown>) : null;
}

function getReportErrorMessage(log: LogItem): string {
  const errorMessage = (log as ReportLogItem).error_message;
  return typeof errorMessage === 'string' ? errorMessage : '';
}

function getWritingDetailRequest(detail: LogDetail): string {
  return (
    pickFirstString([
      (detail as any).user_instruction,
      (detail as any).instruction_preview,
      (detail as any).instruction,
      (detail as any).content,
      (detail as any).prompt,
      (detail as any).detail
    ]) || '-'
  );
}

function getWritingDetailResult(detail: LogDetail): string {
  return (
    pickFirstString([
      (detail as any).generated_content,
      (detail as any).content_preview,
      (detail as any).result,
      (detail as any).output,
      (detail as any).answer
    ]) || ''
  );
}

function getLogMetadata(detail: LogDetail): Record<string, unknown> {
  const metadata = (detail as any).metadata;
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return metadata as Record<string, unknown>;
}

function getQADetailQuestion(detail: LogDetail): string {
  return (detail as QALogDetail).question || '';
}

function getQADetailAnswer(detail: LogDetail): string {
  return (detail as QALogDetail).answer || '';
}

function getUserName(userId?: string): string {
  return getUserNameById(userId);
}

// 加载日志列表
async function loadLogs(options: { silent?: boolean } = {}) {
  const { silent = false } = options;
  if (!silent) {
    loading.value = true;
    error.value = '';
  }

  try {
    const token = store.state.user.token;
    const hasUserFilter = filterUserName.value.trim().length > 0;
    if (isReportLogs.value) {
      const date = selectedDate.value;
      const start_date = date ? `${date}T00:00:00` : undefined;
      const end_date = date ? `${date}T23:59:59` : undefined;
      const result = await getReportLogs(token, {
        page: currentPage.value,
        page_size: pageSize.value,
        username: hasUserFilter ? filterUserName.value.trim() : undefined,
        start_date,
        end_date
      });

      const reportLogs = (result.logs || []).map((log) => ({
        ...log,
        timestamp: log.created_at
      }));

      logData.value = {
        date: selectedDate.value,
        total: result.total ?? reportLogs.length,
        page: result.page ?? currentPage.value,
        page_size: result.page_size ?? pageSize.value,
        total_pages: result.total_pages ?? 1,
        logs: reportLogs
      };
      logs.value = reportLogs;
    } else {
      const userFilterResult = await buildUserFilterParams(filterUserName.value);
      if (!silent && userFilterResult.status === 'ambiguous') {
        const keyword = userFilterResult.keyword || filterUserName.value.trim();
        ElMessage.warning(`用户名“${keyword}”匹配多个用户，请输入更完整的用户名`);
      }

      if (isWritingLogs.value) {
        if (!selectedDate.value) {
          await loadAvailableDates({ setDefault: true });
        }

        const result = await getWritingLogsByDate(token, {
          date: selectedDate.value,
          writing_type: writingType.value || undefined,
          page: currentPage.value,
          page_size: pageSize.value
        });

        const writingLogs = (result.logs || []).map((log) => {
          const resolvedId = getLogId(log);
          return resolvedId ? { ...log, id: resolvedId } : log;
        });

        const total = typeof result.total === 'number' ? result.total : writingLogs.length;
        const page = result.page ?? currentPage.value;
        const page_size = result.page_size ?? pageSize.value;
        const totalForDisplay = hasUserFilter ? writingLogs.length : total;
        const fallbackTotalPages = Math.ceil(totalForDisplay / page_size) || 1;
        const total_pages = hasUserFilter
          ? fallbackTotalPages
          : (typeof result.total_pages === 'number' ? result.total_pages : fallbackTotalPages);

        logData.value = {
          date: result.date || selectedDate.value,
          total: totalForDisplay,
          page,
          page_size,
          total_pages,
          logs: writingLogs
        };
        logs.value = writingLogs;
      } else {
        const result = await getQALogsByDate(token, {
          date: selectedDate.value,
          ...userFilterResult.params,
          page: currentPage.value,
          page_size: pageSize.value
        });

        logData.value = result as LogListState;
        logs.value = result.logs || [];
      }
    }
    error.value = '';
  } catch (err: any) {
    if (!silent) {
      const rawMessage = err.response?.data?.message || err.message || '加载失败，请稍后重试';
      if (typeof rawMessage === 'string' && (rawMessage.includes('date') || rawMessage.includes('日期'))) {
        error.value = '日期格式错误';
      } else {
        error.value = rawMessage;
      }
    }
    console.error('加载日志列表失败:', err);
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
}

// 查看详情
async function viewDetail(log: LogItem) {
  showDetailDialog.value = true;
  detailLoading.value = true;
  logDetail.value = null;

  try {
    const token = store.state.user.token;
    if (isReportLogs.value) {
      const logId = getLogId(log);
      if (!logId) {
        throw new Error('日志ID缺失，无法查看详情');
      }
      logDetail.value = await getReportLogDetail(token, logId);
    } else if (isWritingLogs.value) {
      const logId = getLogId(log);
      if (!logId) {
        throw new Error('日志ID缺失，无法查看详情');
      }
      logDetail.value = await getWritingLogDetail(token, logId, selectedDate.value);
    } else {
      logDetail.value = await getQALogDetail(token, (log as QALogItem).id, selectedDate.value);
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || err.message || '加载详情失败');
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

async function handleLogCategoryChange() {
  currentPage.value = 1;
  if (isWritingLogs.value) {
    writingType.value = '';
    await loadAvailableDates({ setDefault: true });
    await loadWritingStatistics();
  } else {
    await loadAvailableDates();
    writingStats.value = null;
  }
  loadLogs();
  syncAutoRefresh();
}

function handleWritingTypeChange() {
  currentPage.value = 1;
  loadLogs();
}

// 处理搜索
function handleSearch() {
  currentPage.value = 1;
  loadLogs();
}

// 处理重置
async function handleReset() {
  filterUserName.value = '';
  currentPage.value = 1;
  pageSize.value = 20;

  if (isWritingLogs.value) {
    writingType.value = '';
    await loadAvailableDates({ setDefault: true });
    await loadWritingStatistics();
  } else {
    selectedDate.value = getTodayDate();
    await loadAvailableDates();
  }

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

function shouldAutoRefresh(): boolean {
  return isQaLogs.value && selectedDate.value === getTodayDate();
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function startAutoRefresh() {
  if (refreshTimer || !shouldAutoRefresh()) {
    return;
  }

  refreshTimer = window.setInterval(() => {
    if (!shouldAutoRefresh()) {
      stopAutoRefresh();
      return;
    }

    if (document.hidden || loading.value || autoRefreshing) {
      return;
    }

    autoRefreshing = true;
    loadLogs({ silent: true }).finally(() => {
      autoRefreshing = false;
    });
  }, refreshIntervalMs);
}

function syncAutoRefresh() {
  if (shouldAutoRefresh()) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

watch(selectedDate, () => {
  syncAutoRefresh();
});

onMounted(async () => {
  await ensureUserCacheLoaded();  // 确保用户缓存已加载
  if (isWritingLogs.value) {
    await loadAvailableDates({ setDefault: true });
    await loadWritingStatistics();
  } else {
    await loadAvailableDates();
  }
  loadLogs();
  syncAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
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

.mock-alert {
  margin-bottom: 1.5rem;
  border-radius: 12px;
}

.mock-alert code {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
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

.writing-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.writing-stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.writing-stat-card .label {
  font-size: 0.8rem;
  color: #6b7280;
}

.writing-stat-card .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.writing-stat-card.success {
  background: #ecfdf5;
  border: 1px solid #86efac;
}

.writing-stat-card.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
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

.type-writing-start {
  background: #e0f2fe;
  color: #0284c7;
}

.type-writing-result {
  background: #dcfce7;
  color: #15803d;
}

.type-retrieval {
  background: #e0e7ff;
  color: #4338ca;
}

.type-writing-error {
  background: #fee2e2;
  color: #b91c1c;
}

.type-report-started {
  background: #fef3c7;
  color: #b45309;
}

.type-report-completed {
  background: #dcfce7;
  color: #15803d;
}

.type-report-failed {
  background: #fee2e2;
  color: #b91c1c;
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
