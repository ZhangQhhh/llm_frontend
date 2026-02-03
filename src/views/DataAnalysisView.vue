<template>
  <div class="research-report-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="main-content">
      <!-- 顶部标题区 -->
      <header class="page-header animate-slide-down">
        <div class="header-content">
          <div class="title-section">
            <div class="icon-wrapper">
              <el-icon :size="40"><TrendCharts /></el-icon>
            </div>
            <div class="title-text">
              <h1>数研报告中心</h1>
              <p>Digital Research & Predictive Analytics Platform</p>
            </div>
          </div>
          <el-tag effect="plain" size="large" round class="version-tag">
            <el-icon class="mr-1"><Medal /></el-icon> Pro Edition
          </el-tag>
        </div>
      </header>

      <!-- 主工作区 -->
      <div class="workspace">
        
        <!-- 左侧：预测大屏 -->
        <section class="forecast-section animate-slide-left">
          <div class="section-card forecast-card">
            <div class="card-header">
              <h2><el-icon><DataLine /></el-icon> {{ forecastTitle }}</h2>
              <div class="header-controls">
                <el-select v-model="forecastType" class="forecast-type-select" size="small">
                  <el-option label="出入境总人数" value="total" />
                  <el-option label="交通工具总量" value="traffic" />
                </el-select>
                <el-upload
                  ref="forecastUploadRef"
                  class="forecast-upload"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept=".csv"
                  :on-change="handleForecastHistoryFileChange"
                >
                  <el-tooltip content="上传历史CSV（列：year,month,totalCount）" placement="top">
                    <el-button size="small" plain :loading="uploadingForecastHistory" class="upload-history-btn">
                      <el-icon><Upload /></el-icon>
                      {{ uploadingForecastHistory ? '上传中...' : '更新历史CSV' }}
                    </el-button>
                  </el-tooltip>
                </el-upload>
                <el-input-number 
                  v-model="forecastMonths" 
                  :min="1" 
                  :max="24" 
                  size="small"
                  class="month-selector"
                />
                <span class="unit-label">个月</span>
                <el-button 
                  type="primary" 
                  :loading="predicting"
                  @click="handleForecast"
                  round
                  class="predict-btn"
                >
                  <el-icon v-if="!predicting"><MagicStick /></el-icon>
                  {{ predicting ? '预测中...' : '开始预测' }}
                </el-button>
              </div>
            </div>

            <div class="chart-container" v-loading="predicting" element-loading-text="AI 正在计算未来趋势...">
              <div ref="chartRef" class="echarts-box"></div>
              <div v-if="!hasForecastData && !predicting" class="empty-state">
                <el-icon :size="80" color="#d0d0d0"><TrendCharts /></el-icon>
                <p>点击上方按钮开始智能预测</p>
              </div>
            </div>

            <!-- 统计卡片 -->
            <transition name="el-zoom-in-top">
              <div v-if="hasForecastData" class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon peak"><el-icon><Top /></el-icon></div>
                  <div class="stat-info">
                    <span class="label">预测峰值</span>
                    <span class="value">{{ stats.max }}</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon low"><el-icon><Bottom /></el-icon></div>
                  <div class="stat-info">
                    <span class="label">预测低谷</span>
                    <span class="value">{{ stats.min }}</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon avg"><el-icon><DataBoard /></el-icon></div>
                  <div class="stat-info">
                    <span class="label">平均流量</span>
                    <span class="value">{{ stats.avg }}</span>
                  </div>
                </div>
                <div class="stat-card highlight">
                  <div class="stat-icon growth"><el-icon><TrendCharts /></el-icon></div>
                  <div class="stat-info">
                    <span class="label">增长趋势</span>
                    <span class="value growth-value">+{{ stats.growth }}%</span>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </section>

        <!-- 右侧：功能区 -->
        <aside class="sidebar animate-slide-right">
          
          <!-- Tab 切换 -->
          <el-tabs v-model="activeTab" class="function-tabs">
            
            <!-- Tab 1: 报告生成 -->
            <el-tab-pane label="报告生成" name="generate">
              <div class="section-card generate-card">
                <div class="card-header">
                  <h2><el-icon><Document /></el-icon> 生成出入境综合报告</h2>
                </div>

                <div class="upload-area">
                  
                  <!-- 分析模式 -->
                  <div class="analysis-mode">
                    <label>分析模式</label>
                    <el-radio-group v-model="analysisMode" size="small">
                      <el-radio-button label="month">按月</el-radio-button>
                      <el-radio-button label="year">按年</el-radio-button>
                    </el-radio-group>
                  </div>

                  <!-- 月份/年份选择 -->
                  <div class="month-selector-group">
                    <div class="selector-item">
                      <label>{{ analysisMode === 'year' ? '基准期年份' : '基准期月份' }}</label>
                      <el-date-picker
                        v-model="baseMonth"
                        :type="analysisMode === 'year' ? 'year' : 'month'"
                        :placeholder="analysisMode === 'year' ? '选择基准期年份' : '选择基准期月份'"
                        :format="analysisMode === 'year' ? 'YYYY' : 'YYYY-MM'"
                        :value-format="analysisMode === 'year' ? 'YYYY' : 'YYYY-MM'"
                        size="default"
                        style="width: 100%"
                      />
                    </div>
                    <div class="selector-item">
                      <label>{{ analysisMode === 'year' ? '对比期年份' : '对比期月份' }}</label>
                      <el-date-picker
                        v-model="compareMonth"
                        :type="analysisMode === 'year' ? 'year' : 'month'"
                        :placeholder="analysisMode === 'year' ? '选择对比期年份' : '选择对比期月份'"
                        :format="analysisMode === 'year' ? 'YYYY' : 'YYYY-MM'"
                        :value-format="analysisMode === 'year' ? 'YYYY' : 'YYYY-MM'"
                        size="default"
                        style="width: 100%"
                      />
                    </div>
                  </div>

                  <!-- 人员数据 -->
                  <div class="upload-group">
                    <div class="group-title">
                      <el-icon><User /></el-icon>
                      <span>{{ peopleGroupTitle }}</span>
                    </div>
                    <div class="file-grid">
                      <div 
                        class="file-box" 
                        :class="{ active: files.basePeriod }"
                        @click="triggerUpload('basePeriod')"
                      >
                        <input type="file" ref="fileInput_basePeriod" style="display:none" accept=".xlsx" @change="(e) => handleFileChange(e, 'basePeriod')" />
                        <el-icon class="box-icon"><FolderAdd /></el-icon>
                        <span class="box-label">{{ peopleBaseLabel }}</span>
                        <span v-if="files.basePeriod" class="file-name">{{ files.basePeriod.name }}</span>
                      </div>
                      <div 
                        class="file-box" 
                        :class="{ active: files.comparePeriod }"
                        @click="triggerUpload('comparePeriod')"
                      >
                        <input type="file" ref="fileInput_comparePeriod" style="display:none" accept=".xlsx" @change="(e) => handleFileChange(e, 'comparePeriod')" />
                        <el-icon class="box-icon"><FolderAdd /></el-icon>
                        <span class="box-label">{{ peopleCompareLabel }}</span>
                        <span v-if="files.comparePeriod" class="file-name">{{ files.comparePeriod.name }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 航班数据 -->
                  <div class="upload-group">
                    <div class="group-title">
                      <el-icon><Ship /></el-icon>
                      <span>{{ trafficGroupTitle }}</span>
                    </div>
                    <div class="file-grid">
                      <div 
                        class="file-box" 
                        :class="{ active: files.prevTraffic }"
                        @click="triggerUpload('prevTraffic')"
                      >
                        <input type="file" ref="fileInput_prevTraffic" style="display:none" accept=".xlsx" @change="(e) => handleFileChange(e, 'prevTraffic')" />
                        <el-icon class="box-icon"><FolderAdd /></el-icon>
                        <span class="box-label">{{ trafficBaseLabel }}</span>
                        <span v-if="files.prevTraffic" class="file-name">{{ files.prevTraffic.name }}</span>
                      </div>
                      <div 
                        class="file-box" 
                        :class="{ active: files.currTraffic }"
                        @click="triggerUpload('currTraffic')"
                      >
                        <input type="file" ref="fileInput_currTraffic" style="display:none" accept=".xlsx" @change="(e) => handleFileChange(e, 'currTraffic')" />
                        <el-icon class="box-icon"><FolderAdd /></el-icon>
                        <span class="box-label">{{ trafficCompareLabel }}</span>
                        <span v-if="files.currTraffic" class="file-name">{{ files.currTraffic.name }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="action-buttons">
                    <el-button 
                      type="primary" 
                      size="large" 
                      :loading="generating"
                      :disabled="!canGenerate"
                      @click="handleGenerate"
                      class="gen-btn"
                      round
                    >
                      <el-icon v-if="!generating"><Promotion /></el-icon>
                      {{ generating ? '生成中...' : '生成报告' }}
                    </el-button>
                    <el-button size="large" @click="resetForm" round>
                      <el-icon><RefreshLeft /></el-icon>
                      重置
                    </el-button>
                  </div>

                  <!-- 进度条 -->
                  <transition name="el-fade-in">
                    <div v-if="generating" class="progress-wrapper">
                      <div class="progress-label">
                        <span>{{ progressStep }}</span>
                        <span>{{ progressPercent }}%</span>
                      </div>
                      <el-progress 
                        :percentage="progressPercent" 
                        :status="progressStatus"
                        :stroke-width="8"
                        striped
                        striped-flow
                      />
                    </div>
                  </transition>
                </div>
              </div>
            </el-tab-pane>

            <!-- Tab 2: 文档上传 -->
            <el-tab-pane label="文档上传" name="upload">
              <div class="section-card upload-card">
                <div class="card-header">
                  <h2><el-icon><Upload /></el-icon> 上传修改后的报告</h2>
                </div>

                <div class="upload-doc-area">
                  <el-upload
                    ref="uploadRef"
                    class="doc-uploader"
                    drag
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleDocFileChange"
                    accept=".doc,.docx"
                  >
                    <el-icon class="upload-icon"><UploadFilled /></el-icon>
                    <div class="upload-text">
                      <p class="primary">点击或拖拽上传 Word 文档</p>
                      <p class="secondary">支持 .doc / .docx 格式</p>
                    </div>
                  </el-upload>

                  <transition name="el-zoom-in-top">
                    <div v-if="uploadDocFile" class="selected-file">
                      <el-icon class="file-icon"><Document /></el-icon>
                      <div class="file-info">
                        <span class="name">{{ uploadDocFile.name }}</span>
                        <span class="size">{{ formatFileSize(uploadDocFile.size) }}</span>
                      </div>
                      <el-button 
                        text 
                        type="danger"
                        @click="clearUploadDoc"
                      >
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </div>
                  </transition>

                  <div class="upload-options">
                    <el-checkbox v-model="overwriteDoc">覆盖同名文件</el-checkbox>
                    <el-tooltip content="勾选后，如果存在同名文件将被覆盖；不勾选则自动添加时间戳" placement="top">
                      <el-icon class="help-icon"><QuestionFilled /></el-icon>
                    </el-tooltip>
                  </div>

                  <el-button 
                    type="primary" 
                    size="large"
                    :loading="uploading"
                    :disabled="!uploadDocFile"
                    @click="handleUploadDoc"
                    class="upload-btn"
                    round
                  >
                    <el-icon v-if="!uploading"><Upload /></el-icon>
                    {{ uploading ? '上传中...' : '确认上传' }}
                  </el-button>
                </div>
              </div>
            </el-tab-pane>

            <!-- Tab 3: 文档管理 -->
            <el-tab-pane label="文档管理" name="docs">
              <div class="section-card docs-card">
                <div class="card-header">
                  <h2><el-icon><Folder /></el-icon> 已保存的文档</h2>
                  <el-button 
                    text 
                    @click="loadDocuments"
                    :loading="loadingDocs"
                    size="small"
                  >
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>

                <div class="docs-list" v-loading="loadingDocs">
                  <div v-if="documents.length === 0" class="empty-docs">
                    <el-icon :size="50" color="#ccc"><DocumentCopy /></el-icon>
                    <p>暂无文档</p>
                  </div>
                  <div 
                    v-else 
                    v-for="doc in documents" 
                    :key="doc.name"
                    class="doc-item"
                  >
                    <div class="doc-info">
                      <el-icon class="doc-icon"><Document /></el-icon>
                      <div class="doc-details">
                        <span class="doc-name" :title="doc.name">{{ doc.name }}</span>
                        <span class="doc-meta">{{ formatFileSize(doc.size) }} · {{ formatDate(doc.updatedAt) }}</span>
                      </div>
                    </div>
                    <div class="doc-actions">
                      <el-button 
                        text 
                        size="small"
                        @click="previewDocument(doc)"
                      >
                        <el-icon><View /></el-icon>
                      </el-button>
                      <el-button 
                        text 
                        size="small"
                        @click="downloadDocument(doc)"
                      >
                        <el-icon><Download /></el-icon>
                      </el-button>
                      <el-button 
                        text 
                        type="danger"
                        size="small"
                        @click="deleteDocument(doc)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

          </el-tabs>

        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { 
  TrendCharts, DataLine, Document, FolderAdd, Ship, 
  MagicStick, Top, Bottom, DataBoard, User, Folder,
  Refresh, DocumentCopy, View, Download, Delete,
  Promotion, RefreshLeft, Medal, Upload, UploadFilled,
  Close, QuestionFilled
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { davHttp } from '@/config/api/http';
import { API_ENDPOINTS, LLM_BASE_URL } from '@/config/api/api';

// --- State ---
const activeTab = ref('generate');
const forecastMonths = ref(6);
const forecastType = ref<'total' | 'traffic'>('total');
const predicting = ref(false);
const hasForecastData = ref(false);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const forecastUploadRef = ref();
const forecastHistoryFile = ref<File | null>(null);
const uploadingForecastHistory = ref(false);

// 月份选择
const baseMonth = ref('');
const compareMonth = ref('');
const analysisMode = ref<'month' | 'year'>('month');

const files = reactive({
  basePeriod: null as File | null,
  comparePeriod: null as File | null,
  prevTraffic: null as File | null,
  currTraffic: null as File | null
});

const generating = ref(false);
const progressPercent = ref(0);
const progressStep = ref('准备中...');
const progressStatus = ref('');

const fileInput_basePeriod = ref();
const fileInput_comparePeriod = ref();
const fileInput_prevTraffic = ref();
const fileInput_currTraffic = ref();

const stats = reactive({
  max: '0',
  min: '0',
  avg: '0',
  growth: '0'
});

// 文档上传
const uploadDocFile = ref<File | null>(null);
const overwriteDoc = ref(false);
const uploading = ref(false);
const uploadRef = ref();

// 文档管理
interface DocumentItem {
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  previewUrl: string;
  downloadUrl: string;
}

const documents = ref<DocumentItem[]>([]);
const loadingDocs = ref(false);

// --- Computed ---
const canGenerate = computed(() => {
  if (!files.basePeriod || !files.comparePeriod || !files.prevTraffic || !files.currTraffic) {
    return false;
  }
  if (analysisMode.value === 'month') {
    return Boolean(baseMonth.value && compareMonth.value);
  }
  return true;
});

const forecastTitle = computed(() =>
  forecastType.value === 'traffic' ? '交通工具预测' : '出入境总人数预测'
);

const peopleGroupTitle = computed(() =>
  analysisMode.value === 'year' ? '人员年度数据' : '人员月度数据'
);

const peopleBaseLabel = computed(() =>
  analysisMode.value === 'year' ? '基准年' : '基准月'
);

const peopleCompareLabel = computed(() =>
  analysisMode.value === 'year' ? '对比年' : '对比月'
);

const trafficGroupTitle = computed(() =>
  analysisMode.value === 'year' ? '航班年度数据' : '航班月度数据（逐航班明细）'
);

const trafficBaseLabel = computed(() =>
  analysisMode.value === 'year' ? '基准年' : '基准月'
);

const trafficCompareLabel = computed(() =>
  analysisMode.value === 'year' ? '对比年' : '对比月'
);

const parseCount = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

// --- Lifecycle ---
onMounted(() => {
  window.addEventListener('resize', handleResize);
  initChart();
  loadDocuments();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance) {
    chartInstance.dispose();
  }
});

const handleResize = () => {
  chartInstance?.resize();
};

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  const options = {
    grid: { top: 40, right: 30, bottom: 40, left: 60 },
    xAxis: { 
      type: 'category', 
      data: [],
      axisLabel: { color: '#666', fontSize: 11 }
    },
    yAxis: { 
      type: 'value',
      axisLabel: { color: '#666', fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } }
    },
    series: []
  };
  chartInstance.setOption(options);
};

// --- Forecast ---
const handleForecast = async () => {
  if (predicting.value) return;
  predicting.value = true;
  hasForecastData.value = false;
  
  try {
    const endpoint = forecastType.value === 'traffic'
      ? API_ENDPOINTS.LLM_SUMMARY.TRAFFIC_TOOLS_FORECAST
      : API_ENDPOINTS.LLM_SUMMARY.TOTAL_FORECAST;
    const res: any = await davHttp.get(endpoint, {
      params: { steps: forecastMonths.value }
    });
    
    if (res.data && res.data.success && res.data.data) {
      const history = Array.isArray(res.data.data.history) ? res.data.data.history : [];
      const forecast = Array.isArray(res.data.data.forecast) ? res.data.data.forecast : [];
      if (!history.length && !forecast.length) {
        ElMessage.warning('未能获取预测数据');
        return;
      }
      updateChart(history, forecast);
      calculateStats(history, forecast);
      hasForecastData.value = true;
      const label = forecastType.value === 'traffic' ? '交通工具预测完成' : '总人数预测完成';
      ElMessage.success(label);
    } else {
      ElMessage.warning('未能获取预测数据');
    }
  } catch (e) {
    console.error(e);
    ElMessage.error('预测数据处理失败');
  } finally {
    predicting.value = false;
  }
};

const handleForecastHistoryFileChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;
  forecastHistoryFile.value = file;
  await uploadForecastHistory();
};

const uploadForecastHistory = async () => {
  if (!forecastHistoryFile.value || uploadingForecastHistory.value) return;
  uploadingForecastHistory.value = true;
  try {
    const endpoint = forecastType.value === 'traffic'
      ? API_ENDPOINTS.LLM_SUMMARY.TRAFFIC_TOOLS_FORECAST_HISTORY
      : API_ENDPOINTS.LLM_SUMMARY.TOTAL_FORECAST_HISTORY;
    const formData = new FormData();
    formData.append('file', forecastHistoryFile.value);
    const res: any = await davHttp.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data && res.data.success) {
      const payload = res.data.data || res.data;
      const inserted = parseCount(payload?.inserted);
      const updated = parseCount(payload?.updated);
      if (inserted !== null || updated !== null) {
        ElMessage.success(`历史数据更新成功：新增 ${inserted ?? 0}，覆盖 ${updated ?? 0}`);
      } else {
        ElMessage.success('历史数据更新成功');
      }
    } else {
      ElMessage.error(res.data?.message || '历史数据更新失败');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('历史数据更新失败');
  } finally {
    uploadingForecastHistory.value = false;
    forecastHistoryFile.value = null;
    forecastUploadRef.value?.clearFiles();
  }
};

const formatLabel = (item: any) => {
  if (item && Number.isFinite(item.year) && Number.isFinite(item.month)) {
    const month = String(item.month).padStart(2, '0');
    return `${item.year}-${month}`;
  }
  if (item && Number.isFinite(item.month)) {
    return String(item.month);
  }
  return '';
};

const getValue = (item: any) => {
  if (item && Number.isFinite(item.totalCount)) return item.totalCount;
  if (item && Number.isFinite(item.value)) return item.value;
  return 0;
};

const updateChart = (history: any[], forecast: any[]) => {
  if (!chartInstance) return;
  const historyLabels = history.map(formatLabel);
  const forecastLabels = forecast.map(formatLabel);
  const labels = [...historyLabels, ...forecastLabels];
  const historyValues = history.map(getValue);
  const forecastValues = forecast.map(getValue);
  const historySeries = [...historyValues, ...new Array(forecastValues.length).fill(null)];
  const forecastSeries = [...new Array(historyValues.length).fill(null), ...forecastValues];
  
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: forecastTitle.value,
      left: 'center',
      top: 8,
      textStyle: {
        color: '#1e293b',
        fontSize: 14,
        fontWeight: 700
      }
    },
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#666', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#666', fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } }
    },
    series: [
      {
        data: historySeries,
        type: 'line',
        smooth: true,
        symbolSize: 8,
        itemStyle: { 
          color: '#14b8a6',
          borderColor: '#fff',
          borderWidth: 2
        },
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#14b8a6' },
            { offset: 1, color: '#06b6d4' }
          ])
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(20, 184, 166, 0.3)' },
            { offset: 1, color: 'rgba(20, 184, 166, 0.0)' }
          ])
        }
      },
      {
        data: forecastSeries,
        type: 'line',
        smooth: true,
        symbolSize: 8,
        itemStyle: {
          color: '#f59e0b',
          borderColor: '#fff',
          borderWidth: 2
        },
        lineStyle: {
          width: 3,
          type: 'dashed',
          color: '#f59e0b'
        }
      }
    ]
  };
  
  chartInstance.setOption(option);
};

const calculateStats = (history: any[], forecast: any[]) => {
  const forecastValues = forecast.map(getValue).filter(v => Number.isFinite(v));
  const historyValues = history.map(getValue).filter(v => Number.isFinite(v));
  const values = forecastValues.length ? forecastValues : historyValues;
  if (!values.length) return;
  stats.max = Math.max(...values).toLocaleString();
  stats.min = Math.min(...values).toLocaleString();
  const sum = values.reduce((a, b) => a + b, 0);
  stats.avg = Math.round(sum / values.length).toLocaleString();
  
  const first = values[0];
  const last = values[values.length - 1];
  if (first > 0) {
    stats.growth = ((last - first) / first * 100).toFixed(1);
  } else {
    stats.growth = '0.0';
  }
};

// --- File Upload ---
const triggerUpload = (key: string) => {
  switch(key) {
    case 'basePeriod': fileInput_basePeriod.value.click(); break;
    case 'comparePeriod': fileInput_comparePeriod.value.click(); break;
    case 'prevTraffic': fileInput_prevTraffic.value.click(); break;
    case 'currTraffic': fileInput_currTraffic.value.click(); break;
  }
};

const handleFileChange = (event: Event, key: keyof typeof files) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    files[key] = target.files[0];
    ElMessage.success(`已选择: ${target.files[0].name}`);
  }
};

const resetForm = () => {
  files.basePeriod = null;
  files.comparePeriod = null;
  files.prevTraffic = null;
  files.currTraffic = null;
  baseMonth.value = '';
  compareMonth.value = '';
  analysisMode.value = 'month';
  if(fileInput_basePeriod.value) fileInput_basePeriod.value.value = '';
  if(fileInput_comparePeriod.value) fileInput_comparePeriod.value.value = '';
  if(fileInput_prevTraffic.value) fileInput_prevTraffic.value.value = '';
  if(fileInput_currTraffic.value) fileInput_currTraffic.value.value = '';
  ElMessage.info('已重置');
};

// --- Generate Report ---
const handleGenerate = async () => {
  if (!canGenerate.value) {
    ElMessage.warning('请上传所有必要文件并选择月份');
    return;
  }
  
  generating.value = true;
  progressPercent.value = 0;
  progressStatus.value = '';
  progressStep.value = '正在上传数据...';

  const progressTimer = setInterval(() => {
    if (progressPercent.value < 90) {
      progressPercent.value += 5;
      if (progressPercent.value > 30) progressStep.value = '正在时间序列分析...';
      if (progressPercent.value > 60) progressStep.value = '正在生成 Word 报告...';
    }
  }, 800);

  try {
    const formData = new FormData();
    formData.append('basePeriodFile', files.basePeriod!);
    formData.append('comparePeriodFile', files.comparePeriod!);
    formData.append('previousYearTrafficFile', files.prevTraffic!);
    formData.append('currentYearTrafficFile', files.currTraffic!);
    
    formData.append('analysisMode', analysisMode.value);
    if (analysisMode.value === 'month') {
      const baseMonthNum = baseMonth.value.split('-')[1];
      const compareMonthNum = compareMonth.value.split('-')[1];
      if (baseMonthNum || compareMonthNum) {
        const months = [baseMonthNum, compareMonthNum].filter(Boolean);
        if (months.length) {
          formData.append('months', months.join(','));
        }
      }
    }

    const response = await davHttp.post(
        API_ENDPOINTS.LLM_SUMMARY.MAX_SUMMARY,
        formData,
        {
          responseType: 'blob',
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600000
        }
    );

    clearInterval(progressTimer);
    progressPercent.value = 100;
    progressStep.value = '完成！';
    progressStatus.value = 'success';

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    let filename = '数研分析报告.docx';
    if (contentDisposition) {
       const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
       if (match) filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElNotification({
      title: '生成成功',
      message: '报告已自动下载',
      type: 'success',
    });

    setTimeout(() => {
      loadDocuments();
    }, 1000);

  } catch (error) {
    clearInterval(progressTimer);
    progressStatus.value = 'exception';
    progressStep.value = '生成失败';
    console.error(error);
    ElMessage.error('报告生成失败，请检查网络或文件格式');
  } finally {
    setTimeout(() => {
      generating.value = false;
    }, 2000);
  }
};

// --- Document Upload ---
const handleDocFileChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;
  uploadDocFile.value = file;
};

const clearUploadDoc = () => {
  uploadDocFile.value = null;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

const handleUploadDoc = async () => {
  if (!uploadDocFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', uploadDocFile.value);
    formData.append('overwrite', overwriteDoc.value.toString());

    const res = await davHttp.post(API_ENDPOINTS.DOCUMENTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (res.data && res.data.success) {
      ElMessage.success('上传成功');
      clearUploadDoc();
      loadDocuments();
      activeTab.value = 'docs';
    } else {
      ElMessage.error('上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    ElMessage.error('上传失败，请重试');
  } finally {
    uploading.value = false;
  }
};

// --- Document Management ---
const loadDocuments = async () => {
  loadingDocs.value = true;
  try {
    const res = await davHttp.get(API_ENDPOINTS.DOCUMENTS.LIST);
    if (res.data && res.data.success) {
      documents.value = res.data.data || [];
    }
  } catch (error) {
    console.error('加载文档列表失败:', error);
  } finally {
    loadingDocs.value = false;
  }
};

const previewDocument = (doc: DocumentItem) => {
  const url = `${LLM_BASE_URL}${doc.previewUrl}`;
  window.open(url, '_blank');
};

const downloadDocument = (doc: DocumentItem) => {
  const url = `${LLM_BASE_URL}${doc.downloadUrl}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.name;
  link.click();
};

const deleteDocument = async (doc: DocumentItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档 "${doc.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await davHttp.delete(API_ENDPOINTS.DOCUMENTS.DELETE(doc.name));
    ElMessage.success('删除成功');
    loadDocuments();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// --- Utils ---
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};
</script>

<style scoped>
/* === 基础布局 === */
.research-report-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #e0e7ff 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.2;
  animation: float 25s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #7dd3fc 0%, #38bdf8 100%);
  top: -150px;
  left: -150px;
}

.orb-2 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #5eead4 0%, #2dd4bf 100%);
  bottom: -200px;
  right: -200px;
  animation-delay: -12s;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #a5f3fc 0%, #67e8f9 100%);
  top: 50%;
  left: 50%;
  animation-delay: -6s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -40px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
}

.main-content {
  position: relative;
  z-index: 1;
  max-width: 1600px;
  margin: 0 auto;
  padding: 32px;
}

/* === 页面头部 === */
.page-header {
  margin-bottom: 32px;
}

.header-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.3);
}

.title-text h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(90deg, #0891b2, #14b8a6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.title-text p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.version-tag {
  font-weight: 600;
  background: white;
  border: 2px solid #14b8a6;
  color: #14b8a6;
  padding: 8px 16px;
}

/* === 工作区布局 === */
.workspace {
  display: grid;
  grid-template-columns: 1fr 480px;
  gap: 24px;
}

@media (max-width: 1200px) {
  .workspace {
    grid-template-columns: 1fr;
  }
}

/* === 卡片样式 === */
.section-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.section-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === 预测卡片 === */
.forecast-card {
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.forecast-upload {
  display: inline-flex;
}

.upload-history-btn {
  font-weight: 600;
}

.forecast-type-select {
  width: 140px;
}

.month-selector {
  width: 100px;
}

.unit-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.predict-btn {
  font-weight: 600;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.chart-container {
  flex: 1;
  min-height: 400px;
  position: relative;
  background: linear-gradient(180deg, rgba(20, 184, 166, 0.02) 0%, transparent 100%);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
}

.echarts-box {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #94a3b8;
}

.empty-state p {
  margin-top: 16px;
  font-size: 14px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  color: white;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.peak {
  background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%);
  color: white;
}

.stat-icon.low {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
}

.stat-icon.avg {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  color: white;
}

.stat-icon.growth {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-info .label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.stat-card.highlight .stat-info .label {
  color: rgba(255, 255, 255, 0.8);
}

.stat-info .value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.stat-card.highlight .stat-info .value {
  color: white;
}

.growth-value {
  color: #10b981 !important;
}

.stat-card.highlight .growth-value {
  color: white !important;
}

/* === 侧边栏 === */
.sidebar {
  display: flex;
  flex-direction: column;
}

/* Tab 样式 */
.function-tabs {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__item) {
  font-weight: 600;
  color: #64748b;
}

:deep(.el-tabs__item.is-active) {
  color: #14b8a6;
}

:deep(.el-tabs__active-bar) {
  background-color: #14b8a6;
}

/* === 生成卡片 === */
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-mode {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0fdfa;
  border-radius: 12px;
  border: 2px solid #99f6e4;
}

.analysis-mode label {
  font-size: 13px;
  font-weight: 600;
  color: #0f766e;
}

.month-selector-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
  background: #f0fdfa;
  border-radius: 12px;
  border: 2px solid #99f6e4;
}

.selector-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-item label {
  font-size: 13px;
  font-weight: 600;
  color: #0f766e;
}

.upload-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.file-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.file-box {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
  min-height: 120px;
  justify-content: center;
}

.file-box:hover {
  border-color: #14b8a6;
  background: #f0fdfa;
  transform: translateY(-2px);
}

.file-box.active {
  border-color: #10b981;
  border-style: solid;
  background: #ecfdf5;
}

.box-icon {
  font-size: 32px;
  color: #94a3b8;
}

.file-box.active .box-icon {
  color: #10b981;
}

.box-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.file-name {
  font-size: 11px;
  color: #10b981;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.gen-btn {
  flex: 1;
  font-weight: 600;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.progress-wrapper {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
  font-weight: 500;
}

/* === 文档上传卡片 === */
.upload-doc-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.doc-uploader {
  width: 100%;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  padding: 40px 20px;
  transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: #14b8a6;
  background: #f0fdfa;
}

.upload-icon {
  font-size: 60px;
  color: #94a3b8;
  margin-bottom: 16px;
}

.upload-text .primary {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.upload-text .secondary {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.selected-file {
  background: #f0fdfa;
  border: 2px solid #5eead4;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 28px;
  color: #14b8a6;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-info .name {
  font-size: 14px;
  font-weight: 600;
  color: #0f766e;
}

.file-info .size {
  font-size: 12px;
  color: #64748b;
}

.upload-options {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
}

.help-icon {
  color: #f59e0b;
  cursor: help;
}

.upload-btn {
  width: 100%;
  font-weight: 600;
  background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

/* === 文档管理 === */
.docs-card {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.docs-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
}

.empty-docs {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-docs p {
  margin-top: 12px;
  font-size: 14px;
}

.doc-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.doc-item:hover {
  background: #f0fdfa;
  transform: translateX(4px);
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.doc-icon {
  font-size: 20px;
  color: #14b8a6;
  flex-shrink: 0;
}

.doc-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.doc-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-meta {
  font-size: 11px;
  color: #94a3b8;
}

.doc-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* === 动画 === */
.animate-slide-down {
  animation: slideDown 0.6s ease-out;
}

.animate-slide-left {
  animation: slideLeft 0.8s ease-out;
}

.animate-slide-right {
  animation: slideRight 0.8s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideLeft {
  from {
    transform: translateX(-30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideRight {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 滚动条美化 */
.docs-list::-webkit-scrollbar {
  width: 6px;
}

.docs-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.docs-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.docs-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.mr-1 {
  margin-right: 4px;
}
</style>
