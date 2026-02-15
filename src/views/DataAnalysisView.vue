<template>
  <div class="research-report-container">
    <!-- 鑳屾櫙瑁呴グ -->
    <div class="bg-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="main-content">
      <!-- 椤堕儴鏍囬鍖?-->
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

      <!-- 涓诲伐浣滃尯 -->
      <div class="workspace">
        
        <!-- 宸︿晶锛氶娴嬪ぇ灞?-->
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

            <!-- 缁熻鍗＄墖 -->
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

        <!-- 鍙充晶锛氬姛鑳藉尯 -->
        <aside class="sidebar animate-slide-right">
          
          <!-- Tab 鍒囨崲 -->
          <el-tabs v-model="activeTab" class="function-tabs">
            
            <!-- Tab 1: 鎶ュ憡鐢熸垚 -->
            <el-tab-pane label="报告生成" name="generate">
              <div class="section-card generate-card">
                <div class="card-header">
                  <h2><el-icon><Document /></el-icon> 生成出入境综合报告</h2>
                </div>

                <div class="upload-area">
                  
                  <!-- 鍒嗘瀽妯″紡 -->
                  <div class="analysis-mode">
                    <label>分析模式</label>
                    <el-radio-group v-model="analysisMode" size="small">
                      <el-radio-button label="month">按月</el-radio-button>
                      <el-radio-button label="year">按年</el-radio-button>
                    </el-radio-group>
                  </div>

                  <!-- 鎸夋湀鍙傛暟 -->
                  <div v-if="analysisMode === 'month'" class="month-selector-group">
                    <div class="selector-item">
                      <label>基准期月份</label>
                      <el-date-picker
                        v-model="baseMonth"
                        type="month"
                        placeholder="选择基准期月份"
                        format="YYYY-MM"
                        value-format="YYYY-MM"
                        size="default"
                        style="width: 100%"
                      />
                    </div>
                    <div class="selector-item">
                      <label>对比期月份</label>
                      <el-date-picker
                        v-model="compareMonth"
                        type="month"
                        placeholder="选择对比期月份"
                        format="YYYY-MM"
                        value-format="YYYY-MM"
                        size="default"
                        style="width: 100%"
                      />
                    </div>
                  </div>

                  <!-- 鎸夊勾鍙傛暟 -->
                  <div v-else class="month-selector-group year-selector-group">
                    <div class="selector-item">
                      <label>开始月份</label>
                      <el-date-picker
                        v-model="yearStartMonth"
                        type="month"
                        placeholder="YYYY-MM"
                        format="YYYY-MM"
                        value-format="YYYY-MM"
                        size="default"
                        style="width: 100%"
                      />
                    </div>
                    <div class="selector-item">
                      <label>结束月份</label>
                      <el-date-picker
                        v-model="yearEndMonth"
                        type="month"
                        placeholder="YYYY-MM"
                        format="YYYY-MM"
                        value-format="YYYY-MM"
                        size="default"
                        style="width: 100%"
                      />
                    </div>
                    <div class="selector-item selector-item-wide">
                      <label>报告类型</label>
                      <el-select v-model="yearReportType" style="width: 100%">
                        <el-option label="综合报告（人员+航班）" value="comprehensive" />
                        <el-option label="仅人员报告" value="people_only" />
                      </el-select>
                    </div>
                  </div>

                  <!-- 鎸夊勾锛氭湀琛ㄤ笂浼犱笌宸蹭笂浼犳竻鍗?-->
                  <div v-if="analysisMode === 'year'" class="year-section">
                    <div class="year-upload-panel">
                      <div class="group-title">
                        <el-icon><Upload /></el-icon>
                        <span>按月上传年报数据</span>
                      </div>
                      <div class="year-upload-grid">
                        <div class="selector-item">
                          <label>数据类型</label>
                          <el-select v-model="yearUploadDatasetType" style="width: 100%">
                            <el-option label="人员数据（people）" value="people" />
                            <el-option label="航班数据（traffic）" value="traffic" />
                          </el-select>
                        </div>
                        <div class="selector-item">
                          <label>月份</label>
                          <el-date-picker
                            v-model="yearUploadMonth"
                            type="month"
                            placeholder="YYYY-MM"
                            format="YYYY-MM"
                            value-format="YYYY-MM"
                            style="width: 100%"
                          />
                        </div>
                        <div class="selector-item selector-item-wide">
                          <label>月表文件（.xlsx）</label>
                          <div
                            class="file-box year-file-box"
                            :class="{ active: yearUploadFile }"
                            @click="triggerUpload('yearUpload')"
                          >
                            <input type="file" ref="fileInput_yearUpload" style="display:none" accept=".xlsx" @change="handleYearUploadFileChange" />
                            <el-icon class="box-icon"><FolderAdd /></el-icon>
                            <span class="box-label">选择月表文件</span>
                            <span v-if="yearUploadFile" class="file-name">{{ yearUploadFile.name }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="action-buttons year-upload-actions">
                        <el-button
                          type="primary"
                          plain
                          :loading="uploadingYearData"
                          :disabled="!canUploadYearData"
                          @click="handleUploadYearData"
                        >
                          上传当前月表
                        </el-button>
                      </div>
                    </div>

                    <div v-if="yearMissingPeopleMonths.length || yearMissingTrafficMonths.length" class="year-missing-panel">
                      <div v-if="yearMissingPeopleMonths.length">
                        人员缺失月份：{{ yearMissingPeopleMonths.join(', ') }}
                      </div>
                      <div v-if="yearMissingTrafficMonths.length">
                        航班缺失月份：{{ yearMissingTrafficMonths.join(', ') }}
                      </div>
                    </div>

                    <div class="year-files-panel">
                      <div class="year-files-header">
                        <span>已上传月份清单</span>
                        <el-button text size="small" :loading="loadingYearFiles" @click="loadYearDataFiles">
                          <el-icon><Refresh /></el-icon>
                          刷新
                        </el-button>
                      </div>

                      <div class="year-files-grid">
                        <div class="year-files-card">
                          <div class="year-files-title">人员表（people）</div>
                          <div class="year-table-wrap">
                            <el-table
                              :data="yearPeopleFiles"
                              v-loading="loadingYearFiles"
                              size="small"
                              height="220"
                              empty-text="暂无上传"
                            >
                              <el-table-column prop="monthId" label="月份" width="88" />
                              <el-table-column prop="version" label="版本" width="64" />
                              <el-table-column prop="originalName" label="文件名" min-width="120" show-overflow-tooltip />
                              <el-table-column label="上传时间" width="110" show-overflow-tooltip>
                                <template #default="{ row }">
                                  {{ formatDateOnly(row.uploadedAt) }}
                                </template>
                              </el-table-column>
                            </el-table>
                          </div>
                        </div>

                        <div class="year-files-card">
                          <div class="year-files-title">航班表（traffic）</div>
                          <div class="year-table-wrap">
                            <el-table
                              :data="yearTrafficFiles"
                              v-loading="loadingYearFiles"
                              size="small"
                              height="220"
                              empty-text="暂无上传"
                            >
                              <el-table-column prop="monthId" label="月份" width="88" />
                              <el-table-column prop="version" label="版本" width="64" />
                              <el-table-column prop="originalName" label="文件名" min-width="120" show-overflow-tooltip />
                              <el-table-column label="上传时间" width="110" show-overflow-tooltip>
                                <template #default="{ row }">
                                  {{ formatDateOnly(row.uploadedAt) }}
                                </template>
                              </el-table-column>
                            </el-table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 浜哄憳鏁版嵁 -->
                  <div v-if="analysisMode === 'month'" class="upload-group">
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

                  <!-- 鑸彮鏁版嵁 -->
                  <div v-if="analysisMode === 'month'" class="upload-group">
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

                  <!-- 妯℃澘鍖?-->
                  <div class="template-panel">
                    <div class="template-header">
                      <el-icon><Collection /></el-icon>
                      <span>模板区</span>
                    </div>
                    <div class="template-tip">
                      <el-icon><InfoFilled /></el-icon>
                      <span>“更新历史CSV”请严格按照示意文件.csv的字段顺序与格式填写。</span>
                    </div>
                    <div class="template-grid">
                      <div v-for="item in templateFiles" :key="item.filename" class="template-item">
                        <div class="template-left">
                          <el-icon class="template-icon"><Document /></el-icon>
                        </div>
                        <div class="template-body">
                          <div class="template-name">{{ item.title }}</div>
                          <div class="template-desc">{{ item.desc }}</div>
                          <div class="template-meta">{{ item.filename }}</div>
                        </div>
                        <div class="template-actions">
                          <el-button
                            size="small"
                            type="primary"
                            plain
                            :icon="Download"
                            @click="downloadTemplate(item)"
                          >
                            下载模板
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 鎿嶄綔鎸夐挳 -->
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

                  <!-- 杩涘害鏉?-->
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

            <!-- Tab 2: 鏂囨。涓婁紶 -->
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

            <!-- Tab 3: 鏂囨。绠＄悊 -->
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { 
  TrendCharts, DataLine, Document, FolderAdd, Ship, 
  MagicStick, Top, Bottom, DataBoard, User, Folder,
  Refresh, DocumentCopy, View, Download, Delete,
  Promotion, RefreshLeft, Medal, Upload, UploadFilled,
  Close, QuestionFilled, Collection, InfoFilled
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { davHttp } from '@/config/api/http';
import { API_ENDPOINTS, LLM_BASE_URL } from '@/config/api/api';
const templateHistoryCsv = new URL('../assets/tem_file/示意文件.csv', import.meta.url).href;
const templateStaffXlsx = new URL('../assets/tem_file/20240801.xlsx', import.meta.url).href;
const templateFlightXls = new URL('../assets/tem_file/航班表2024.xls', import.meta.url).href;

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

// 鏈堜唤閫夋嫨
const baseMonth = ref('');
const compareMonth = ref('');
const analysisMode = ref<'month' | 'year'>('month');
type YearReportType = 'comprehensive' | 'people_only';
type YearDatasetType = 'people' | 'traffic';
const yearStartMonth = ref('');
const yearEndMonth = ref('');
const yearReportType = ref<YearReportType>('comprehensive');
const yearUploadDatasetType = ref<YearDatasetType>('people');
const yearUploadMonth = ref('');
const yearUploadFile = ref<File | null>(null);
const uploadingYearData = ref(false);
const yearMissingPeopleMonths = ref<string[]>([]);
const yearMissingTrafficMonths = ref<string[]>([]);
const yearApiUseCompatPrefix = ref(false);

const files = reactive({
  basePeriod: null as File | null,
  comparePeriod: null as File | null,
  prevTraffic: null as File | null,
  currTraffic: null as File | null
});

const generating = ref(false);
const progressPercent = ref(0);
const progressStep = ref('鍑嗗涓?..');
const progressStatus = ref('');

const fileInput_basePeriod = ref();
const fileInput_comparePeriod = ref();
const fileInput_prevTraffic = ref();
const fileInput_currTraffic = ref();
const fileInput_yearUpload = ref();

const stats = reactive({
  max: '0',
  min: '0',
  avg: '0',
  growth: '0'
});

// 鏂囨。涓婁紶
const uploadDocFile = ref<File | null>(null);
const overwriteDoc = ref(false);
const uploading = ref(false);
const uploadRef = ref();

// 鏂囨。绠＄悊
interface DocumentItem {
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  previewUrl: string;
  downloadUrl: string;
}

interface TemplateFile {
  title: string;
  filename: string;
  desc: string;
  url: string;
}

interface YearDataFileItem {
  id?: string;
  datasetType?: 'people' | 'traffic';
  year?: number;
  month?: number;
  monthId?: string;
  originalName?: string;
  storedName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  version?: number;
  isActive?: boolean;
}

const documents = ref<DocumentItem[]>([]);
const loadingDocs = ref(false);
const loadingYearFiles = ref(false);
const yearPeopleFiles = ref<YearDataFileItem[]>([]);
const yearTrafficFiles = ref<YearDataFileItem[]>([]);
const store = useStore();
const templateFiles: TemplateFile[] = [
  {
    title: '更新历史CSV示意',
    filename: '示意文件.csv',
    desc: '用于“更新历史CSV”上传，字段顺序和格式请与示意文件保持一致。',
    url: templateHistoryCsv
  },
  {
    title: '人员数据示意表',
    filename: '20240801.xlsx',
    desc: '人员数据模板示例，按示例表结构填写。',
    url: templateStaffXlsx
  },
  {
    title: '航班表示意表',
    filename: '航班表2024.xls',
    desc: '航班数据模板示例（xls）。',
    url: templateFlightXls
  }
];

// --- Computed ---
const canGenerate = computed(() => {
  if (analysisMode.value === 'month') {
    if (!files.basePeriod || !files.comparePeriod || !files.prevTraffic || !files.currTraffic) {
      return false;
    }
    return Boolean(baseMonth.value && compareMonth.value && compareMonth.value >= baseMonth.value);
  }
  if (!yearStartMonth.value || !yearEndMonth.value) {
    return false;
  }
  return yearEndMonth.value >= yearStartMonth.value;
});

const canUploadYearData = computed(() =>
  Boolean(yearUploadFile.value && yearUploadMonth.value && !uploadingYearData.value)
);

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

const normalizeYearFileList = (payload: any): YearDataFileItem[] => {
  const data = payload?.data ?? payload;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.records)
        ? data.records
        : [];

  return list
    .map((item: any) => ({
      id: item?.id,
      datasetType: item?.datasetType,
      year: Number(item?.year),
      month: Number(item?.month),
      monthId: item?.monthId || (item?.year && item?.month ? String(item.year) + '-' + String(item.month).padStart(2, '0') : ''),
      originalName: item?.originalName || item?.storedName || '',
      storedName: item?.storedName || '',
      uploadedBy: item?.uploadedBy || '',
      uploadedAt: item?.uploadedAt || '',
      version: Number(item?.version || 0),
      isActive: Boolean(item?.isActive)
    }))
    .sort((a, b) => (b.monthId || '').localeCompare(a.monthId || ''));
};

const switchYearApiPrefix = (path: string): string => {
  if (path.includes('/entryExit/')) {
    return path.replace('/entryExit/', '/entry-exit/');
  }
  if (path.includes('/entry-exit/')) {
    return path.replace('/entry-exit/', '/entryExit/');
  }
  return path;
};

const requestYearApi = async (config: any): Promise<any> => {
  const primaryUrl = yearApiUseCompatPrefix.value ? switchYearApiPrefix(config.url) : config.url;

  try {
    const res = await davHttp.request({ ...config, url: primaryUrl });
    return res;
  } catch (error: any) {
    if (error?.response?.status !== 404) {
      throw error;
    }

    const fallbackUrl = switchYearApiPrefix(primaryUrl);
    if (fallbackUrl === primaryUrl) {
      throw error;
    }

    console.warn('[year-api] 404 fallback: ' + primaryUrl + ' -> ' + fallbackUrl);
    const fallbackRes = await davHttp.request({ ...config, url: fallbackUrl });
    yearApiUseCompatPrefix.value = fallbackUrl.includes('/entry-exit/');
    return fallbackRes;
  }
};

const loadYearDataFiles = async () => {
  loadingYearFiles.value = true;
  try {
    const [peopleRes, trafficRes] = await Promise.all([
      requestYearApi({ method: 'get', url: API_ENDPOINTS.LLM_SUMMARY.YEAR_DATA_FILES, params: { datasetType: 'people' } }),
      requestYearApi({ method: 'get', url: API_ENDPOINTS.LLM_SUMMARY.YEAR_DATA_FILES, params: { datasetType: 'traffic' } }),
    ]);

    yearPeopleFiles.value = normalizeYearFileList(peopleRes.data);
    yearTrafficFiles.value = normalizeYearFileList(trafficRes.data);
  } catch (error) {
    console.error('加载按年月表清单失败:', error);
    ElMessage.error('加载已上传月份清单失败');
  } finally {
    loadingYearFiles.value = false;
  }
};

// --- Lifecycle ---
onMounted(() => {
  window.addEventListener('resize', handleResize);
  initChart();
  loadDocuments();
  if (analysisMode.value === 'year') {
    loadYearDataFiles();
  }
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

watch(
  () => analysisMode.value,
  (mode) => {
    if (mode === 'year') {
      loadYearDataFiles();
    }
  }
);

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
        ElMessage.success('历史数据更新成功：新增 ' + (inserted ?? 0) + '，覆盖 ' + (updated ?? 0));
      } else {
        ElMessage.success('鍘嗗彶鏁版嵁鏇存柊鎴愬姛');
      }
    } else {
      ElMessage.error(res.data?.message || '鍘嗗彶鏁版嵁鏇存柊澶辫触');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('鍘嗗彶鏁版嵁鏇存柊澶辫触');
  } finally {
    uploadingForecastHistory.value = false;
    forecastHistoryFile.value = null;
    forecastUploadRef.value?.clearFiles();
  }
};

const formatLabel = (item: any) => {
  if (item && Number.isFinite(item.year) && Number.isFinite(item.month)) {
    const month = String(item.month).padStart(2, '0');
    return String(item.year) + '-' + month;
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
    case 'basePeriod': fileInput_basePeriod.value?.click(); break;
    case 'comparePeriod': fileInput_comparePeriod.value?.click(); break;
    case 'prevTraffic': fileInput_prevTraffic.value?.click(); break;
    case 'currTraffic': fileInput_currTraffic.value?.click(); break;
    case 'yearUpload': fileInput_yearUpload.value?.click(); break;
  }
};

const handleFileChange = (event: Event, key: keyof typeof files) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    files[key] = target.files[0];
    ElMessage.success('已选择: ' + target.files[0].name);
  }
};

const handleYearUploadFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    yearUploadFile.value = target.files[0];
    ElMessage.success('已选择月表: ' + target.files[0].name);
  }
};

const getCurrentUsername = (): string => {
  return (
    store.state.user?.username ||
    (() => {
      try {
        const user = JSON.parse(localStorage.getItem('multi_turn_chat_user') || '{}');
        return user.username || '';
      } catch {
        return '';
      }
    })()
  );
};

const getFilenameFromHeaders = (headers: any, fallbackName: string): string => {
  const contentDisposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
  if (!contentDisposition) return fallbackName;
  const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
  if (!match) return fallbackName;
  try {
    return decodeURIComponent(match[1].replace(/['"]/g, ''));
  } catch {
    return fallbackName;
  }
};

const downloadReportBlob = (blobData: any, headers: any, fallbackName: string) => {
  const blob = new Blob([blobData]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', getFilenameFromHeaders(headers, fallbackName));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const parseGenerateErrorMessage = async (error: any): Promise<string | null> => {
  const blobData = error?.response?.data;
  if (blobData instanceof Blob) {
    const text = await blobData.text();
    try {
      const payload = JSON.parse(text);
      const data = payload?.data || {};
      if (Array.isArray(data.missingPeopleMonths)) {
        yearMissingPeopleMonths.value = data.missingPeopleMonths;
      }
      if (Array.isArray(data.missingTrafficMonths)) {
        yearMissingTrafficMonths.value = data.missingTrafficMonths;
      }
      return payload?.message || data?.message || text;
    } catch {
      return text || null;
    }
  }

  const payload = error?.response?.data;
  if (payload && typeof payload === 'object') {
    const data = payload?.data || {};
    if (Array.isArray(data.missingPeopleMonths)) {
      yearMissingPeopleMonths.value = data.missingPeopleMonths;
    }
    if (Array.isArray(data.missingTrafficMonths)) {
      yearMissingTrafficMonths.value = data.missingTrafficMonths;
    }
    return payload?.message || data?.message || null;
  }

  return error?.message || null;
};

const handleUploadYearData = async () => {
  if (!canUploadYearData.value || !yearUploadFile.value) {
    ElMessage.warning('璇峰厛閫夋嫨鏁版嵁绫诲瀷銆佹湀浠藉拰涓婁紶鏂囦欢');
    return;
  }

  const [year, month] = yearUploadMonth.value.split('-');
  if (!year || !month) {
    ElMessage.warning('鏈堜唤鏍煎紡搴斾负 YYYY-MM');
    return;
  }

  uploadingYearData.value = true;
  try {
    const formData = new FormData();
    formData.append('file', yearUploadFile.value);
    formData.append('datasetType', yearUploadDatasetType.value);
    formData.append('year', year);
    formData.append('month', String(Number(month)));
    const username = getCurrentUsername();
    if (username) formData.append('username', username);

    const res: any = await requestYearApi({
      method: 'post',
      url: API_ENDPOINTS.LLM_SUMMARY.YEAR_DATA_UPLOAD,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (!res.data?.success) {
      ElMessage.error(res.data?.message || '鏈堣〃涓婁紶澶辫触');
      return;
    }

    yearUploadFile.value = null;
    if (fileInput_yearUpload.value) fileInput_yearUpload.value.value = '';

    const version = res.data?.data?.record?.version;
    ElMessage.success(version ? ('月表上传成功（version ' + version + '）') : '月表上传成功');
    loadYearDataFiles();
  } catch (error: any) {
    console.error(error);
    const msg = await parseGenerateErrorMessage(error);
    ElMessage.error(msg || '鏈堣〃涓婁紶澶辫触');
  } finally {
    uploadingYearData.value = false;
  }
};

const resetForm = () => {
  files.basePeriod = null;
  files.comparePeriod = null;
  files.prevTraffic = null;
  files.currTraffic = null;
  baseMonth.value = '';
  compareMonth.value = '';
  yearStartMonth.value = '';
  yearEndMonth.value = '';
  yearReportType.value = 'comprehensive';
  yearUploadDatasetType.value = 'people';
  yearUploadMonth.value = '';
  yearUploadFile.value = null;
  yearMissingPeopleMonths.value = [];
  yearMissingTrafficMonths.value = [];
  analysisMode.value = 'month';
  if(fileInput_basePeriod.value) fileInput_basePeriod.value.value = '';
  if(fileInput_comparePeriod.value) fileInput_comparePeriod.value.value = '';
  if(fileInput_prevTraffic.value) fileInput_prevTraffic.value.value = '';
  if(fileInput_currTraffic.value) fileInput_currTraffic.value.value = '';
  if(fileInput_yearUpload.value) fileInput_yearUpload.value.value = '';
  ElMessage.info('已重置');
};

// --- Generate Report ---
const getProgressStepFromStage = (stage: string): string => {
  const mapping: Record<string, string> = {
    start: '任务已开始',
    load_people: '正在加载人员数据',
    load_flights: '正在加载航班数据',
    compute_metrics: '正在计算指标',
    llm_basic: '正在进行基础分析',
    llm_extended: '正在进行深度分析',
    charts: '正在生成图表',
    render: '正在渲染报告',
    done: '报告已完成'
  };
  return mapping[stage] || '正在生成报告...';
};

const startYearProgressPolling = (jobId: string): (() => void) => {
  const timer = window.setInterval(async () => {
    try {
      const res: any = await requestYearApi({
        method: 'get',
        url: API_ENDPOINTS.LLM_SUMMARY.YEAR_REPORT_PROGRESS(jobId)
      });
      const data = res?.data;
      if (!data) return;
      if (Number.isFinite(data.percent)) {
        progressPercent.value = Math.max(progressPercent.value, Number(data.percent));
      }
      if (typeof data.stage === 'string') {
        progressStep.value = getProgressStepFromStage(data.stage);
      }
      if (data.done) {
        progressPercent.value = 100;
        progressStep.value = '报告已完成';
      }
    } catch (error) {
      // ignore polling error
    }
  }, 2000);

  return () => window.clearInterval(timer);
};

const handleGenerateMonthReport = async () => {
  generating.value = true;
  progressPercent.value = 0;
  progressStatus.value = '';
  progressStep.value = '正在上传数据...';

  const progressTimer = setInterval(() => {
    if (progressPercent.value < 90) {
      progressPercent.value += 5;
      if (progressPercent.value > 30) progressStep.value = '姝ｅ湪鏃堕棿搴忓垪鍒嗘瀽...';
      if (progressPercent.value > 60) progressStep.value = '姝ｅ湪鐢熸垚 Word 鎶ュ憡...';
    }
  }, 800);

  try {
    const formData = new FormData();
    formData.append('basePeriodFile', files.basePeriod!);
    formData.append('comparePeriodFile', files.comparePeriod!);
    formData.append('previousYearTrafficFile', files.prevTraffic!);
    formData.append('currentYearTrafficFile', files.currTraffic!);

    const username = getCurrentUsername();
    if (username) {
      formData.append('username', username);
    }
    
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
    progressStep.value = '完成';
    progressStatus.value = 'success';
    downloadReportBlob(response.data, response.headers, '数据分析报告.docx');

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

const handleGenerateYearReport = async () => {
  generating.value = true;
  progressPercent.value = 0;
  progressStatus.value = '';
  progressStep.value = '姝ｅ湪鏍￠獙绐楀彛瀹屾暣鎬?..';
  yearMissingPeopleMonths.value = [];
  yearMissingTrafficMonths.value = [];

  let stopPolling = () => {};

  try {
    const validateRes: any = await requestYearApi({
      method: 'post',
      url: API_ENDPOINTS.LLM_SUMMARY.YEAR_REPORT_VALIDATE,
      data: {
        startMonth: yearStartMonth.value,
        endMonth: yearEndMonth.value,
        reportType: yearReportType.value
      },
      headers: { 'Content-Type': 'application/json' }
    });

    if (!validateRes.data?.success) {
      ElMessage.error(validateRes.data?.message || '鏍￠獙澶辫触');
      return;
    }

    const validateData = validateRes.data.data || {};
    yearMissingPeopleMonths.value = Array.isArray(validateData.missingPeopleMonths)
      ? validateData.missingPeopleMonths
      : [];
    yearMissingTrafficMonths.value = Array.isArray(validateData.missingTrafficMonths)
      ? validateData.missingTrafficMonths
      : [];

    if (!validateData.ready) {
      progressPercent.value = 100;
      progressStatus.value = 'exception';
      progressStep.value = '数据不完整，无法生成';
      ElMessage.warning('校验未通过，请先补齐缺失月份后再生成');
      return;
    }

    progressPercent.value = 10;
    progressStep.value = '校验通过，正在生成报告...';
    const username = getCurrentUsername();
    const clientJobId = 'year-report-' + Date.now();
    stopPolling = startYearProgressPolling(clientJobId);

    const response = await requestYearApi({
      method: 'post',
      url: API_ENDPOINTS.LLM_SUMMARY.YEAR_REPORT_GENERATE,
      data: {
        startMonth: yearStartMonth.value,
        endMonth: yearEndMonth.value,
        reportType: yearReportType.value,
        chartEngine: 'plotly',
        jobId: clientJobId,
        username: username || undefined
      },
      responseType: 'blob',
      headers: { 'Content-Type': 'application/json' },
      timeout: 600000
    });

    stopPolling();
    progressPercent.value = 100;
    progressStep.value = '报告生成完成';
    progressStatus.value = 'success';

    downloadReportBlob(response.data, response.headers, '年度分析报告.docx');
    ElNotification({
      title: '生成成功',
      message: '年度报告已自动下载',
      type: 'success',
    });

    setTimeout(() => {
      loadDocuments();
    }, 1000);
  } catch (error: any) {
    stopPolling();
    progressStatus.value = 'exception';
    progressStep.value = '生成失败';
    console.error(error);
    const msg = await parseGenerateErrorMessage(error);
    ElMessage.error(msg || '年度报告生成失败，请检查数据或稍后重试');
  } finally {
    setTimeout(() => {
      generating.value = false;
    }, 1500);
  }
};

const handleGenerate = async () => {
  if (!canGenerate.value) {
    const message = analysisMode.value === 'month'
      ? '璇蜂笂浼犳墍鏈夊繀瑕佹枃浠跺苟閫夋嫨鏈堜唤鑼冨洿'
      : '璇烽€夋嫨姝ｇ‘鐨勫紑濮?缁撴潫鏈堜唤';
    ElMessage.warning(message);
    return;
  }

  if (analysisMode.value === 'year') {
    await handleGenerateYearReport();
    return;
  }

  await handleGenerateMonthReport();
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
    ElMessage.warning('璇峰厛閫夋嫨鏂囦欢');
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
      ElMessage.success('涓婁紶鎴愬姛');
      clearUploadDoc();
      loadDocuments();
      activeTab.value = 'docs';
    } else {
      ElMessage.error('涓婁紶澶辫触');
    }
  } catch (error) {
    console.error('涓婁紶澶辫触:', error);
    ElMessage.error('涓婁紶澶辫触锛岃閲嶈瘯');
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
    console.error('鍔犺浇鏂囨。鍒楄〃澶辫触:', error);
  } finally {
    loadingDocs.value = false;
  }
};

const previewDocument = (doc: DocumentItem) => {
  const url = LLM_BASE_URL + doc.previewUrl;
  window.open(url, '_blank');
};

const downloadDocument = (doc: DocumentItem) => {
  const url = LLM_BASE_URL + doc.downloadUrl;
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.name;
  link.click();
};

const downloadTemplate = (item: TemplateFile) => {
  const link = document.createElement('a');
  link.href = item.url;
  link.download = item.filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const deleteDocument = async (doc: DocumentItem) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除文档 "' + doc.name + '" 吗？',
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

const formatDateOnly = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return days + '天前';
  
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};
</script>

<style scoped>
/* === 鍩虹甯冨眬 === */
.research-report-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #e0e7ff 100%);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 鑳屾櫙瑁呴グ */
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

/* === 椤甸潰澶撮儴 === */
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

/* === 宸ヤ綔鍖哄竷灞€ === */
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

/* === 鍗＄墖鏍峰紡 === */
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

/* === 棰勬祴鍗＄墖 === */
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

/* 缁熻鍗＄墖 */
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

/* === 渚ц竟鏍?=== */
.sidebar {
  display: flex;
  flex-direction: column;
}

/* Tab 鏍峰紡 */
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

/* === 鐢熸垚鍗＄墖 === */
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

.year-selector-group {
  grid-template-columns: 1fr 1fr;
}

.selector-item-wide {
  grid-column: 1 / -1;
}

.year-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.year-upload-panel {
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #99f6e4;
  background: #f0fdfa;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.year-upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.year-file-box {
  min-height: 100px;
}

.year-upload-actions {
  margin-top: 0;
}

.year-missing-panel {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  line-height: 1.7;
}

.year-files-panel {
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #d1fae5;
  border-radius: 12px;
  padding: 12px;
}

.year-files-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: #0f766e;
  margin-bottom: 10px;
}

.year-files-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.year-files-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.year-files-title {
  font-size: 12px;
  color: #334155;
  font-weight: 700;
  margin-bottom: 8px;
}

.year-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.year-table-wrap :deep(.el-table) {
  width: 100% !important;
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

@media (max-width: 768px) {
  .month-selector-group,
  .year-upload-grid,
  .file-grid {
    grid-template-columns: 1fr;
  }
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

.template-panel {
  padding: 16px;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
}

.template-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.template-tip {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f1f5f9;
  border-radius: 10px;
  color: #64748b;
  font-size: 12px;
}

.template-grid {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.template-left {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 184, 166, 0.12);
}

.template-icon {
  font-size: 18px;
  color: #14b8a6;
}

.template-body {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.template-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.template-meta {
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
}

.template-actions {
  flex-shrink: 0;
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

/* === 鏂囨。涓婁紶鍗＄墖 === */
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

/* === 鏂囨。绠＄悊 === */
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

/* === 鍔ㄧ敾 === */
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

/* 婊氬姩鏉＄編鍖?*/
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


