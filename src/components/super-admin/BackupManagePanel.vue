<template>
  <el-card class="card backup-manage-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>备份预览与恢复</span>
        <div class="card-actions">
          <el-tag type="danger" effect="plain">高危操作</el-tag>
          <el-button
            type="primary"
            plain
            size="small"
            :icon="Refresh"
            :loading="loadingFiles"
            @click="loadBackupFiles"
          >
            刷新备份列表
          </el-button>
        </div>
      </div>
    </template>

    <el-alert
      title="恢复默认会先删除目标库再重建。建议先创建预览核对表和数据，再执行正式恢复。"
      type="warning"
      :closable="false"
      show-icon
      class="module-alert"
    />

    <section class="section-block">
      <div class="section-header">
        <div>
          <h3>1. 备份文件列表</h3>
          <p>选择一个备份文件作为预览或恢复的数据源。</p>
        </div>
        <el-tag v-if="selectedBackup" type="success">已选中：{{ selectedBackup.fileName }}</el-tag>
      </div>

      <el-empty v-if="!loadingFiles && backupFiles.length === 0" description="暂无可用备份文件">
        <el-button type="primary" plain @click="loadBackupFiles">重新加载</el-button>
      </el-empty>

      <el-table
        v-else
        :data="backupFiles"
        row-key="relativePath"
        border
        stripe
        size="small"
        max-height="320"
        highlight-current-row
        :current-row-key="selectedBackup?.relativePath"
        @row-click="handleSelectBackup"
      >
        <el-table-column label="选择" width="72" align="center">
          <template #default="scope">
            <el-radio
              :model-value="selectedBackupPath"
              :value="scope.row.relativePath"
              @change="handleSelectBackup(scope.row)"
            >
              &nbsp;
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
        <el-table-column prop="databaseName" label="数据库" min-width="120">
          <template #default="scope">{{ scope.row.databaseName || '—' }}</template>
        </el-table-column>
        <el-table-column label="备份时间" min-width="170">
          <template #default="scope">{{ formatDateTime(scope.row.backupTime) }}</template>
        </el-table-column>
        <el-table-column label="文件大小" width="120">
          <template #default="scope">{{ formatFileSize(scope.row.size) }}</template>
        </el-table-column>
        <el-table-column label="压缩" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.compressed ? 'success' : 'info'" size="small">
              {{ scope.row.compressed ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="relativePath" label="相对路径" min-width="220" show-overflow-tooltip />
      </el-table>
    </section>

    <el-divider />

    <section class="section-block">
      <div class="section-header">
        <div>
          <h3>2. 预览工作区</h3>
          <p>创建临时预览库后，可先查看表清单和表内数据，再决定是否恢复。</p>
        </div>
        <div class="section-actions">
          <el-button
            type="primary"
            :loading="creatingPreview"
            :disabled="!selectedBackup"
            @click="handleCreatePreview"
          >
            创建预览
          </el-button>
          <el-button
            type="danger"
            plain
            :loading="deletingPreview"
            :disabled="!activePreview"
            @click="handleDeletePreview"
          >
            删除当前预览
          </el-button>
        </div>
      </div>

      <el-empty v-if="!activePreview" description="当前没有活动预览">
        <el-button type="primary" :disabled="!selectedBackup" @click="handleCreatePreview">
          为当前备份创建预览
        </el-button>
      </el-empty>

      <el-descriptions v-else :column="2" border size="small" class="preview-descriptions">
        <el-descriptions-item label="预览 ID">{{ activePreview.previewId }}</el-descriptions-item>
        <el-descriptions-item label="预览库">{{ activePreview.previewDatabase }}</el-descriptions-item>
        <el-descriptions-item label="来源备份">{{ activePreview.backupFileName }}</el-descriptions-item>
        <el-descriptions-item label="来源路径">{{ activePreview.backupPath }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(activePreview.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ formatDateTime(activePreview.expiresAt) }}</el-descriptions-item>
      </el-descriptions>
    </section>

    <el-divider />

    <section class="section-block">
      <div class="section-header">
        <div>
          <h3>3. 表概览区</h3>
          <p>展示预览库中的表名、近似记录数和识别到的时间字段。</p>
        </div>
        <el-button
          type="primary"
          plain
          size="small"
          :icon="Refresh"
          :loading="loadingTables"
          :disabled="!activePreview"
          @click="loadPreviewTables"
        >
          刷新表概览
        </el-button>
      </div>

      <el-empty v-if="!activePreview" description="请先创建预览后再查看表概览" />
      <el-empty v-else-if="!loadingTables && previewTables.length === 0" description="预览库中暂无可展示的表" />

      <el-table
        v-else
        :data="previewTables"
        row-key="tableName"
        border
        stripe
        size="small"
        max-height="280"
        highlight-current-row
        :current-row-key="selectedTableName"
        @row-click="handleSelectTable"
      >
        <el-table-column prop="tableName" label="表名" min-width="180" show-overflow-tooltip />
        <el-table-column label="近似记录数" min-width="120">
          <template #default="scope">{{ formatCount(scope.row.rowCount) }}</template>
        </el-table-column>
        <el-table-column label="时间字段" min-width="150">
          <template #default="scope">{{ scope.row.modifiedTimeColumn || '—' }}</template>
        </el-table-column>
        <el-table-column label="最早时间" min-width="170">
          <template #default="scope">{{ formatDateTime(scope.row.minModifiedTime) }}</template>
        </el-table-column>
        <el-table-column label="最近时间" min-width="170">
          <template #default="scope">{{ formatDateTime(scope.row.maxModifiedTime) }}</template>
        </el-table-column>
      </el-table>
    </section>

    <el-divider />

    <section class="section-block">
      <div class="section-header">
        <div>
          <h3>4. 数据预览区</h3>
          <p>当前按后端返回的排序字段分页读取预览库中的表数据。</p>
        </div>
        <div class="table-meta" v-if="tablePreview">
          <el-tag type="info">排序字段：{{ tablePreview.orderByColumn || '—' }}</el-tag>
          <el-tag type="warning">时间字段：{{ tablePreview.modifiedTimeColumn || '—' }}</el-tag>
        </div>
      </div>

      <el-empty v-if="!activePreview" description="请先创建预览" />
      <el-empty v-else-if="!selectedTableName" description="请在上方表概览中选择一张表" />
      <el-empty v-else-if="!loadingTablePreview && !tablePreview" description="暂无表预览数据" />

      <div v-else>
        <el-table
          v-loading="loadingTablePreview"
          :data="tablePreview?.rows || []"
          border
          stripe
          size="small"
          max-height="360"
          class="preview-data-table"
        >
          <el-table-column
            v-for="column in tablePreview?.columns || []"
            :key="column"
            :prop="column"
            :label="column"
            min-width="160"
            show-overflow-tooltip
          >
            <template #default="scope">
              {{ formatCellValue(scope.row[column]) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper" v-if="tablePreview">
          <div class="pagination-summary">
            总数：{{ formatCount(tablePreview.total) }}
          </div>
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :total="Number(tablePreview.total || 0)"
            :current-page="tablePage"
            :page-size="tablePageSize"
            :page-sizes="[10, 20, 50, 100]"
            @current-change="handleTablePageChange"
            @size-change="handleTableSizeChange"
          />
        </div>
      </div>
    </section>

    <el-divider />

    <section class="section-block">
      <div class="section-header">
        <div>
          <h3>5. 恢复区</h3>
          <p>支持从活动预览恢复，也支持跳过预览直接从备份恢复。</p>
        </div>
      </div>

      <el-alert
        title="目标库名只允许字母、数字和下划线。恢复前会要求你再次输入目标库名确认。"
        type="error"
        :closable="false"
        show-icon
        class="restore-alert"
      />

      <el-form label-width="130px" class="restore-form">
        <el-form-item label="当前备份">
          <el-input :model-value="selectedBackup?.fileName || ''" readonly placeholder="请选择备份文件" />
        </el-form-item>
        <el-form-item label="活动预览">
          <el-input :model-value="activePreview?.previewDatabase || ''" readonly placeholder="当前没有活动预览" />
        </el-form-item>
        <el-form-item label="目标库名">
          <el-input
            v-model.trim="restoreForm.targetDatabase"
            placeholder="例如 zqs"
            maxlength="64"
            @blur="normalizeTargetDatabase"
          />
        </el-form-item>
        <el-form-item label="覆盖已有库">
          <el-switch v-model="restoreForm.dropExisting" />
          <span class="switch-tip">开启后将先删库再重建</span>
        </el-form-item>
        <el-form-item>
          <el-space wrap>
            <el-button
              type="primary"
              :loading="restoringPreview"
              :disabled="!activePreview"
              @click="handleRestoreByPreview"
            >
              从预览恢复（推荐）
            </el-button>
            <el-button
              type="danger"
              plain
              :loading="restoringDirect"
              :disabled="!selectedBackup"
              @click="handleRestoreDirect"
            >
              直接按备份恢复
            </el-button>
          </el-space>
        </el-form-item>
      </el-form>

      <el-descriptions
        v-if="lastRestoreResult"
        :column="2"
        border
        size="small"
        class="restore-result"
      >
        <el-descriptions-item label="目标库">{{ lastRestoreResult.targetDatabase || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备份路径">{{ lastRestoreResult.backupPath || '—' }}</el-descriptions-item>
        <el-descriptions-item label="恢复时间">{{ formatDateTime(lastRestoreResult.restoredAt) }}</el-descriptions-item>
        <el-descriptions-item label="删库重建">
          {{ lastRestoreResult.dropExisting ? '是' : '否' }}
        </el-descriptions-item>
      </el-descriptions>
    </section>
  </el-card>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { API_ENDPOINTS } from '@/config/api/api'
import { fetchWithAuth, getApiUrl } from '@/utils/request'

interface BackupFileInfo {
  fileName: string
  relativePath: string
  databaseName?: string | null
  size?: number | null
  backupTime?: string | null
  fileModifiedTime?: string | null
  compressed?: boolean | null
}

interface BackupPreviewInfo {
  previewId: string
  previewDatabase: string
  backupPath: string
  backupFileName: string
  createdAt?: string | null
  expiresAt?: string | null
}

interface BackupTableInfo {
  tableName: string
  rowCount?: number | null
  modifiedTimeColumn?: string | null
  minModifiedTime?: string | null
  maxModifiedTime?: string | null
}

interface BackupTablePreview {
  previewId: string
  previewDatabase: string
  tableName: string
  modifiedTimeColumn?: string | null
  orderByColumn?: string | null
  columns: string[]
  page: number
  pageSize: number
  total?: number | null
  rows: Record<string, unknown>[]
}

interface BackupRestorePayload {
  backupPath?: string
  previewId?: string
  targetDatabase: string
  dropExisting: boolean
}

interface BackupRestoreResult {
  targetDatabase?: string
  backupPath?: string
  restoredAt?: string
  dropExisting?: boolean
}

interface BizResponse<T = unknown> {
  success?: boolean
  code?: number
  message?: string
  data?: T
}

export default defineComponent({
  name: 'BackupManagePanel',
  setup() {
    const backupFiles = ref<BackupFileInfo[]>([])
    const loadingFiles = ref(false)
    const selectedBackupPath = ref('')
    const selectedBackup = ref<BackupFileInfo | null>(null)

    const activePreview = ref<BackupPreviewInfo | null>(null)
    const creatingPreview = ref(false)
    const deletingPreview = ref(false)

    const previewTables = ref<BackupTableInfo[]>([])
    const loadingTables = ref(false)
    const selectedTableName = ref('')
    const tablePreview = ref<BackupTablePreview | null>(null)
    const loadingTablePreview = ref(false)
    const tablePage = ref(1)
    const tablePageSize = ref(20)

    const restoringPreview = ref(false)
    const restoringDirect = ref(false)
    const lastRestoreResult = ref<BackupRestoreResult | null>(null)
    const restoreForm = reactive({
      targetDatabase: '',
      dropExisting: true
    })

    const isBizSuccess = (payload?: BizResponse<any>) => {
      if (!payload) return false
      if (payload.success === false) return false
      if (payload.code === undefined || payload.code === null) return true
      return Number(payload.code) === 200
    }

    const getBizMessage = (payload?: BizResponse<any>, fallback = '请求失败，请稍后重试') => {
      return payload?.message || fallback
    }

    const sanitizeIdentifier = (value: string) => value.trim().replace(/[^\w]/g, '')

    const isValidDatabaseName = (value: string) => /^[A-Za-z0-9_]+$/.test(value)

    const formatDateTime = (value?: string | null) => {
      if (!value) return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const formatFileSize = (size?: number | null) => {
      if (size === null || size === undefined || Number.isNaN(Number(size))) return '—'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let value = Number(size)
      let unitIndex = 0
      while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex += 1
      }
      return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
    }

    const formatCount = (count?: number | null) => {
      if (count === null || count === undefined || Number.isNaN(Number(count))) return '—'
      return Number(count).toLocaleString('zh-CN')
    }

    const formatCellValue = (value: unknown) => {
      if (value === null || value === undefined || value === '') return '—'
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value)
        } catch {
          return String(value)
        }
      }
      return String(value)
    }

    const clearPreviewState = () => {
      activePreview.value = null
      previewTables.value = []
      selectedTableName.value = ''
      tablePreview.value = null
      tablePage.value = 1
      tablePageSize.value = 20
    }

    const handlePreviewInvalid = (message?: string) => {
      clearPreviewState()
      if (message) {
        ElMessage.warning(message)
      }
    }

    const ensureRestoreTargetDatabase = () => {
      const databaseName = sanitizeIdentifier(restoreForm.targetDatabase)
      restoreForm.targetDatabase = databaseName
      if (!databaseName) {
        throw new Error('目标库名不能为空')
      }
      if (!isValidDatabaseName(databaseName)) {
        throw new Error('目标库名只允许字母、数字和下划线')
      }
      return databaseName
    }

    const normalizeTargetDatabase = () => {
      restoreForm.targetDatabase = sanitizeIdentifier(restoreForm.targetDatabase)
    }

    const loadBackupFiles = async () => {
      loadingFiles.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.BACKUP_FILES))
        const payload = response.data as BizResponse<BackupFileInfo[]>
        if (!response.ok || !isBizSuccess(payload)) {
          throw new Error(getBizMessage(payload, '加载备份文件失败'))
        }
        backupFiles.value = Array.isArray(payload.data) ? payload.data : []
        if (selectedBackupPath.value) {
          const matched = backupFiles.value.find(item => item.relativePath === selectedBackupPath.value) || null
          selectedBackup.value = matched
          if (!matched) {
            selectedBackupPath.value = ''
          }
        }
      } catch (error: any) {
        backupFiles.value = []
        selectedBackup.value = null
        selectedBackupPath.value = ''
        ElMessage.error(error?.message || '加载备份文件失败')
      } finally {
        loadingFiles.value = false
      }
    }

    const handleSelectBackup = (row: BackupFileInfo) => {
      selectedBackup.value = row
      selectedBackupPath.value = row.relativePath
    }

    const loadPreviewTables = async () => {
      if (!activePreview.value) return
      loadingTables.value = true
      try {
        const response = await fetchWithAuth(
          getApiUrl(API_ENDPOINTS.SUPER_ADMIN.BACKUP_PREVIEW_TABLES(activePreview.value.previewId))
        )
        const payload = response.data as BizResponse<BackupTableInfo[]>
        if (!response.ok || !isBizSuccess(payload)) {
          const message = getBizMessage(payload, '加载表概览失败')
          if (message.includes('预览')) {
            handlePreviewInvalid(message)
            return
          }
          throw new Error(message)
        }
        previewTables.value = Array.isArray(payload.data) ? payload.data : []
        if (selectedTableName.value) {
          const matched = previewTables.value.find(item => item.tableName === selectedTableName.value)
          if (!matched) {
            selectedTableName.value = ''
            tablePreview.value = null
          }
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '加载表概览失败')
      } finally {
        loadingTables.value = false
      }
    }

    const loadTablePreview = async (page = tablePage.value, pageSize = tablePageSize.value) => {
      if (!activePreview.value || !selectedTableName.value) return
      loadingTablePreview.value = true
      try {
        const endpoint = `${API_ENDPOINTS.SUPER_ADMIN.BACKUP_PREVIEW_TABLE(
          activePreview.value.previewId,
          selectedTableName.value
        )}?page=${page}&pageSize=${pageSize}`
        const response = await fetchWithAuth(getApiUrl(endpoint))
        const payload = response.data as BizResponse<BackupTablePreview>
        if (!response.ok || !isBizSuccess(payload)) {
          const message = getBizMessage(payload, '加载表数据失败')
          if (message.includes('预览')) {
            handlePreviewInvalid(message)
            return
          }
          throw new Error(message)
        }
        const preview = payload.data
        tablePreview.value = preview
          ? {
              ...preview,
              columns: Array.isArray(preview.columns) ? preview.columns : [],
              rows: Array.isArray(preview.rows) ? preview.rows : []
            }
          : null
        tablePage.value = page
        tablePageSize.value = pageSize
      } catch (error: any) {
        tablePreview.value = null
        ElMessage.error(error?.message || '加载表数据失败')
      } finally {
        loadingTablePreview.value = false
      }
    }

    const handleSelectTable = (row: BackupTableInfo) => {
      selectedTableName.value = row.tableName
      tablePage.value = 1
      loadTablePreview(1, tablePageSize.value)
    }

    const handleTablePageChange = (page: number) => {
      tablePage.value = page
      loadTablePreview(page, tablePageSize.value)
    }

    const handleTableSizeChange = (size: number) => {
      tablePageSize.value = size
      tablePage.value = 1
      loadTablePreview(1, size)
    }

    const handleCreatePreview = async () => {
      if (!selectedBackup.value) {
        ElMessage.warning('请先选择备份文件')
        return
      }
      creatingPreview.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.BACKUP_PREVIEWS), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            backupPath: selectedBackup.value.relativePath
          })
        })
        const payload = response.data as BizResponse<BackupPreviewInfo>
        if (!response.ok || !isBizSuccess(payload) || !payload.data) {
          throw new Error(getBizMessage(payload, '创建预览失败'))
        }
        activePreview.value = payload.data
        previewTables.value = []
        selectedTableName.value = ''
        tablePreview.value = null
        tablePage.value = 1
        tablePageSize.value = 20
        lastRestoreResult.value = null
        ElMessage.success('预览创建成功')
        await loadPreviewTables()
      } catch (error: any) {
        ElMessage.error(error?.message || '创建预览失败')
      } finally {
        creatingPreview.value = false
      }
    }

    const handleDeletePreview = async () => {
      if (!activePreview.value) {
        ElMessage.warning('当前没有可删除的活动预览')
        return
      }
      try {
        await ElMessageBox.confirm(
          `确定删除预览库【${activePreview.value.previewDatabase}】吗？删除后需要重新创建预览。`,
          '删除预览',
          {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消'
          }
        )
        deletingPreview.value = true
        const response = await fetchWithAuth(
          getApiUrl(API_ENDPOINTS.SUPER_ADMIN.BACKUP_PREVIEW_DELETE(activePreview.value.previewId)),
          { method: 'DELETE' }
        )
        const payload = response.data as BizResponse
        if (!response.ok || !isBizSuccess(payload)) {
          throw new Error(getBizMessage(payload, '删除预览失败'))
        }
        clearPreviewState()
        ElMessage.success(payload.message || '预览已删除')
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '删除预览失败')
      } finally {
        deletingPreview.value = false
      }
    }

    const confirmRestore = async (modeLabel: string, targetDatabase: string) => {
      await ElMessageBox.prompt(
        `当前操作为【${modeLabel}】。\n请输入目标库名 ${targetDatabase} 以继续。`,
        '恢复确认',
        {
          inputPlaceholder: `请输入 ${targetDatabase}`,
          inputValidator: (value: string) => {
            if (value.trim() !== targetDatabase) {
              return '输入的目标库名与当前目标库不一致'
            }
            return true
          },
          confirmButtonText: '确认恢复',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }

    const doRestore = async (payload: BackupRestorePayload, mode: 'preview' | 'direct') => {
      const loadingFlag = mode === 'preview' ? restoringPreview : restoringDirect
      const modeLabel = mode === 'preview' ? '从预览恢复' : '直接按备份恢复'
      const targetDatabase = ensureRestoreTargetDatabase()

      try {
        await confirmRestore(modeLabel, targetDatabase)
      } catch (error) {
        if (error === 'cancel') return
        throw error
      }

      loadingFlag.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.BACKUP_RESTORE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            targetDatabase,
            dropExisting: restoreForm.dropExisting
          })
        })
        const biz = response.data as BizResponse<BackupRestoreResult>
        if (!response.ok || !isBizSuccess(biz) || !biz.data) {
          const message = getBizMessage(biz, '恢复失败')
          if (message.includes('预览')) {
            handlePreviewInvalid(message)
            return
          }
          throw new Error(message)
        }
        lastRestoreResult.value = biz.data
        ElMessage.success(biz.message || '恢复成功')
      } finally {
        loadingFlag.value = false
      }
    }

    const handleRestoreByPreview = async () => {
      if (!activePreview.value) {
        ElMessage.warning('请先创建预览后再恢复')
        return
      }
      try {
        await doRestore(
          {
            previewId: activePreview.value.previewId,
            targetDatabase: restoreForm.targetDatabase,
            dropExisting: restoreForm.dropExisting
          },
          'preview'
        )
      } catch (error: any) {
        ElMessage.error(error?.message || '恢复失败')
      }
    }

    const handleRestoreDirect = async () => {
      if (!selectedBackup.value) {
        ElMessage.warning('请先选择备份文件')
        return
      }
      try {
        await doRestore(
          {
            backupPath: selectedBackup.value.relativePath,
            targetDatabase: restoreForm.targetDatabase,
            dropExisting: restoreForm.dropExisting
          },
          'direct'
        )
      } catch (error: any) {
        ElMessage.error(error?.message || '恢复失败')
      }
    }

    watch(selectedBackup, (value) => {
      if (!value) {
        selectedBackupPath.value = ''
        restoreForm.targetDatabase = ''
        return
      }
      selectedBackupPath.value = value.relativePath
      restoreForm.targetDatabase = sanitizeIdentifier(value.databaseName || '')
      lastRestoreResult.value = null
    })

    onMounted(() => {
      loadBackupFiles()
    })

    return {
      backupFiles,
      loadingFiles,
      selectedBackupPath,
      selectedBackup,
      activePreview,
      creatingPreview,
      deletingPreview,
      previewTables,
      loadingTables,
      selectedTableName,
      tablePreview,
      loadingTablePreview,
      tablePage,
      tablePageSize,
      restoringPreview,
      restoringDirect,
      lastRestoreResult,
      restoreForm,
      Refresh,
      formatDateTime,
      formatFileSize,
      formatCount,
      formatCellValue,
      normalizeTargetDatabase,
      loadBackupFiles,
      handleSelectBackup,
      handleCreatePreview,
      handleDeletePreview,
      loadPreviewTables,
      handleSelectTable,
      handleTablePageChange,
      handleTableSizeChange,
      handleRestoreByPreview,
      handleRestoreDirect
    }
  }
})
</script>

<style scoped>
.backup-manage-card {
  overflow: hidden;
}

.module-alert,
.restore-alert {
  margin-bottom: 1rem;
}

.section-block + .section-block {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #111827;
}

.section-header p {
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.section-actions,
.table-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preview-descriptions,
.restore-result {
  margin-top: 0.5rem;
}

.preview-data-table {
  margin-top: 0.5rem;
}

.pagination-wrapper {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.pagination-summary {
  color: #6b7280;
  font-size: 0.9rem;
}

.restore-form {
  margin-top: 0.5rem;
}

.switch-tip {
  margin-left: 0.75rem;
  color: #b45309;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
  }

  .pagination-wrapper {
    align-items: flex-start;
  }
}
</style>
