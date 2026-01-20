<template>
  <div class="dashboard-container">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon><DataBoard /></el-icon>
          用户仪表盘
        </h1>
        <p class="page-subtitle">系统用户数据概览与管理</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Refresh" @click="refreshData" :loading="loading">
          刷新数据
        </el-button>
        <el-button :icon="Download" @click="exportUsers" :loading="exporting">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">总用户数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.active }}</span>
          <span class="stat-label">正常用户</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pending }}</span>
          <span class="stat-label">待审核</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon banned">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.banned }}</span>
          <span class="stat-label">已封禁</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon admin">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.admins }}</span>
          <span class="stat-label">管理员</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon online">
          <el-icon><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.online }}</span>
          <span class="stat-label">当前在线</span>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-card shadow="never">
        <div class="filter-row">
          <div class="filter-item">
            <label>关键词搜索</label>
            <el-input
              v-model="filters.keyword"
              placeholder="搜索用户名、邮箱、ID"
              clearable
              :prefix-icon="Search"
              @keyup.enter="applyFilters"
            />
          </div>
          <div class="filter-item">
            <label>用户状态</label>
            <el-select v-model="filters.status" placeholder="全部状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="正常" :value="1" />
              <el-option label="待审核" :value="0" />
              <el-option label="已封禁" :value="-1" />
              <el-option label="审核未通过" :value="-2" />
            </el-select>
          </div>
          <div class="filter-item">
            <label>用户角色</label>
            <el-select v-model="filters.role" placeholder="全部角色" clearable>
              <el-option label="全部" value="" />
              <el-option label="普通用户" value="user" />
              <el-option label="管理员" value="admin" />
              <el-option label="超级管理员" value="super_admin" />
            </el-select>
          </div>
          <div class="filter-actions">
            <el-button type="primary" @click="applyFilters">筛选</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 问答排行榜 -->
    <div class="chart-section">
      <el-card shadow="never">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">问答次数排行榜</span>
            <span class="chart-subtitle">基于最近7天问答日志统计</span>
          </div>
        </template>
        <div class="ranking-container" v-loading="loadingIP">
          <div v-if="qaRanking.length === 0" class="no-data">
            暂无问答数据
          </div>
          <div v-else class="podium-wrapper">
            <!-- 颁奖台 - 前三名 -->
            <div class="podium" v-if="qaRanking.length >= 1">
              <!-- 第二名 -->
              <div class="podium-item second" v-if="qaRanking[1]">
                <div class="podium-avatar">
                  <el-avatar :size="50" :icon="UserFilled" />
                </div>
                <div class="podium-name">{{ qaRanking[1].username }}</div>
                <div class="podium-count">{{ qaRanking[1].count }} 次</div>
                <div class="podium-stand second-stand">
                  <span class="podium-rank">2</span>
                </div>
              </div>
              <!-- 第一名 -->
              <div class="podium-item first" v-if="qaRanking[0]">
                <div class="podium-crown">👑</div>
                <div class="podium-avatar gold">
                  <el-avatar :size="60" :icon="UserFilled" />
                </div>
                <div class="podium-name">{{ qaRanking[0].username }}</div>
                <div class="podium-count">{{ qaRanking[0].count }} 次</div>
                <div class="podium-stand first-stand">
                  <span class="podium-rank">1</span>
                </div>
              </div>
              <!-- 第三名 -->
              <div class="podium-item third" v-if="qaRanking[2]">
                <div class="podium-avatar">
                  <el-avatar :size="50" :icon="UserFilled" />
                </div>
                <div class="podium-name">{{ qaRanking[2].username }}</div>
                <div class="podium-count">{{ qaRanking[2].count }} 次</div>
                <div class="podium-stand third-stand">
                  <span class="podium-rank">3</span>
                </div>
              </div>
            </div>
            <!-- 其他排名 -->
            <div class="other-ranks" v-if="qaRanking.length > 3">
              <div 
                v-for="(item, index) in qaRanking.slice(3)" 
                :key="item.userId" 
                class="other-rank-item"
              >
                <span class="other-rank-num">{{ index + 4 }}</span>
                <span class="other-rank-name">{{ item.username }}</span>
                <span class="other-rank-count">{{ item.count }} 次问答</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 用户表格 -->
    <div class="table-section">
      <el-card shadow="never">
        <template #header>
          <div class="table-header">
            <span class="table-title">用户列表</span>
            <div class="table-actions">
              <el-checkbox v-model="showIP" @change="toggleIPColumn">
                显示IP地址
              </el-checkbox>
              <el-button 
                size="small" 
                text 
                type="primary" 
                @click="loadUserActivity(true)" 
                :loading="loadingIP"
              >
                <el-icon v-if="!loadingIP"><Refresh /></el-icon>
                刷新活动数据
              </el-button>
              <span class="selected-count" v-if="selectedUsers.length > 0">
                已选择 {{ selectedUsers.length }} 个用户
              </span>
              <el-dropdown v-if="selectedUsers.length > 0" trigger="click">
                <el-button type="primary" size="small">
                  批量操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="batchBan">批量封禁</el-dropdown-item>
                    <el-dropdown-item @click="batchUnban">批量解封</el-dropdown-item>
                    <el-dropdown-item @click="batchExport">导出选中</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>

        <el-table
          ref="tableRef"
          :data="filteredUsers"
          v-loading="loading"
          stripe
          border
          @selection-change="handleSelectionChange"
          :default-sort="{ prop: 'created_at', order: 'descending' }"
          style="width: 100%"
        >
          <el-table-column type="selection" width="50" fixed="left" />
          <el-table-column type="index" label="#" width="60" fixed="left" />
          
          <el-table-column prop="id" label="用户ID" width="180" sortable show-overflow-tooltip>
            <template #default="{ row }">
              <span class="user-id">{{ row.id || '-' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="username" label="用户名" min-width="150" sortable>
            <template #default="{ row }">
              <div class="user-info">
                <el-avatar :size="32" :icon="UserFilled" />
                <span class="username">{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="role" label="角色" width="120" sortable>
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)" size="small">
                {{ getRoleText(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100" sortable>
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="online" label="在线" width="100" sortable>
            <template #default="{ row }">
              <el-tag :type="row.online ? 'success' : 'info'" size="small">
                {{ row.online ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column v-if="showIP" prop="last_login_ip" label="最近登录IP" width="150">
            <template #default="{ row }">
              <span class="ip-address">{{ row.last_login_ip || '暂无记录' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="last_login_at" label="最近登录" width="180" sortable>
            <template #default="{ row }">
              <span>{{ formatDate(row.last_login_at) || '从未登录' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" type="primary" text @click="viewUserDetail(row)">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button 
                  v-if="row.status === 1 && isRegularUser(row)" 
                  size="small" 
                  type="danger" 
                  text 
                  @click="banUser(row)"
                >
                  <el-icon><Lock /></el-icon>
                </el-button>
                <el-button 
                  v-if="row.status === -1" 
                  size="small" 
                  type="success" 
                  text 
                  @click="unbanUser(row)"
                >
                  <el-icon><Unlock /></el-icon>
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 用户详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="600px"
      destroy-on-close
    >
      <div class="user-detail" v-if="currentUser">
        <div class="detail-avatar">
          <el-avatar :size="80" :icon="UserFilled" />
          <h3>{{ currentUser.username }}</h3>
          <el-tag :type="getStatusTagType(currentUser.status)">
            {{ getStatusText(currentUser.status) }}
          </el-tag>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="getRoleTagType(currentUser.role)" size="small">
              {{ getRoleText(currentUser.role) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentUser.status)" size="small">
              {{ getStatusText(currentUser.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="在线状态">
            <el-tag :type="currentUser.online ? 'success' : 'info'" size="small">
              {{ currentUser.online ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ formatDate(currentUser.last_login_at) || '从未登录' }}</el-descriptions-item>
          <el-descriptions-item label="最近登录IP" v-if="showIP">{{ currentUser.last_login_ip || '暂无记录' }}</el-descriptions-item>
          <el-descriptions-item
            v-for="field in detailFields"
            :key="field.key"
            :label="field.label"
          >
            <span class="detail-value">{{ formatDetailValue(field.key, field.value) }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  UserFilled,
  Search,
  Refresh,
  Download,
  View,
  Lock,
  Unlock,
  CircleCheck,
  CircleClose,
  Clock,
  ArrowDown,
  DataBoard,
  Connection
} from '@element-plus/icons-vue'
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '@/config/api/api'
import { fetchWithAuth, getApiUrl } from '@/utils/request'
import { refreshUserCache, getUserById } from '@/utils/userCache'
import { getUserActivityMap, getQARanking, refreshActivityCache } from '@/utils/userActivityCache'

// 用户接口定义
interface DashboardUser {
  id?: string
  username: string
  email?: string
  department?: string | null
  policeId?: string
  idCardNumber?: string
  phone?: string
  role?: string
  status?: number
  created_at?: string
  updated_at?: string
  last_login_at?: string
  last_login_ip?: string
  online?: boolean
  [key: string]: unknown
}

// 状态
const loading = ref(false)
const exporting = ref(false)
const loadingIP = ref(false)
const users = ref<DashboardUser[]>([])
const selectedUsers = ref<DashboardUser[]>([])
const showIP = ref(true)  // 默认显示IP
const detailDialogVisible = ref(false)
const currentUser = ref<DashboardUser | null>(null)
const tableRef = ref()

// 问答排行榜数据
interface QaRankItem {
  userId: string
  username: string
  count: number
}
const qaRanking = ref<QaRankItem[]>([])

// 筛选条件
const filters = reactive({
  keyword: '',
  status: '' as number | string,
  role: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 统计数据
const stats = reactive({
  total: 0,
  active: 0,
  pending: 0,
  banned: 0,
  admins: 0,
  online: 0
})

let onlineStatusWs: WebSocket | null = null

const normalizeOnlineFlag = (value: unknown) => value === true

const syncOnlineStats = (list: DashboardUser[]) => {
  stats.online = list.filter(user => user.online === true).length
}

const resolveOnlineWsEndpoint = () => {
  if (process.env.VUE_APP_WS_URL) return process.env.VUE_APP_WS_URL
  if (API_BASE_URL) {
    try {
      const baseUrl = new URL(API_BASE_URL)
      return `${baseUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${baseUrl.host}/ws/session`
    } catch {
      return ''
    }
  }
  return `${window.location.origin.replace(/^http/, 'ws')}/ws/session`
}

const buildOnlineWsUrl = (token: string) => {
  const endpoint = resolveOnlineWsEndpoint()
  if (!endpoint) return ''
  const url = new URL(endpoint, window.location.origin)
  url.searchParams.set('token', token)
  let wsUrl = url.toString()
  if (wsUrl.startsWith('https://')) {
    wsUrl = wsUrl.replace('https://', 'wss://')
  } else if (wsUrl.startsWith('http://')) {
    wsUrl = wsUrl.replace('http://', 'ws://')
  }
  return wsUrl
}

const stopOnlineStatusWatch = () => {
  if (!onlineStatusWs) return
  try {
    onlineStatusWs.close()
  } catch (error) {
    console.warn('关闭在线状态 WebSocket 连接时出错:', error)
  } finally {
    onlineStatusWs = null
  }
}

const updateOnlineStatus = (userId: unknown, online: unknown, onlineCount?: unknown) => {
  if (userId == null || typeof online !== 'boolean') return
  const targetId = String(userId)
  const target = users.value.find(user => String(user.id) === targetId)
  if (target) {
    target.online = online
  }

  if (typeof onlineCount === 'number') {
    stats.online = onlineCount
  } else {
    syncOnlineStats(users.value)
  }
}

const startOnlineStatusWatch = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  if (!token) {
    console.warn('在线状态 WebSocket 未启动：缺少 token')
    return
  }

  const wsUrl = buildOnlineWsUrl(token)
  if (!wsUrl) {
    console.warn('在线状态 WebSocket 未启动：无法解析 ws 地址')
    return
  }

  stopOnlineStatusWatch()
  onlineStatusWs = new WebSocket(wsUrl)

  onlineStatusWs.onmessage = (event: MessageEvent) => {
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      const type = message?.type?.toString().toLowerCase()
      if (type !== 'user-online-status') return

      const payload = message?.data && typeof message.data === 'object' ? message.data : message
      updateOnlineStatus(payload?.userId, payload?.online, payload?.onlineCount)
    } catch (error) {
      console.warn('解析在线状态消息失败:', error)
    }
  }

  onlineStatusWs.onerror = (event) => {
    console.warn('在线状态 WebSocket 发生错误:', event)
  }

  onlineStatusWs.onclose = () => {
    onlineStatusWs = null
  }
}

// 计算筛选后的用户列表
const filteredUsers = computed(() => {
  let result = [...users.value]
  
  // 关键词筛选
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(user => 
      user.username?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.id?.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (filters.status !== '') {
    result = result.filter(user => user.status === filters.status)
  }
  
  // 角色筛选
  if (filters.role) {
    result = result.filter(user => normalizeRole(user.role) === filters.role)
  }
  
  // 分页
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return result.slice(start, end)
})

// 计算筛选后的总数
const filteredTotal = computed(() => {
  let result = [...users.value]
  
  // 关键词筛选
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase()
    result = result.filter(user => 
      user.username?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.id?.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (filters.status !== '') {
    result = result.filter(user => user.status === filters.status)
  }
  
  // 角色筛选
  if (filters.role) {
    result = result.filter(user => normalizeRole(user.role) === filters.role)
  }
  
  return result.length
})

// 角色标准化
const normalizeRole = (role?: string): string => {
  if (!role) return 'user'
  const r = role.toLowerCase()
  if (r.includes('super')) return 'super_admin'
  if (r.includes('admin')) return 'admin'
  return 'user'
}

// 状态标签类型
const getStatusTagType = (status?: number) => {
  const map: Record<number, string> = {
    1: 'success',
    0: 'warning',
    [-1]: 'danger',
    [-2]: 'info'
  }
  return map[status ?? 1] || ''
}

// 状态文本
const getStatusText = (status?: number) => {
  const map: Record<number, string> = {
    1: '正常',
    0: '待审核',
    [-1]: '已封禁',
    [-2]: '审核未通过'
  }
  return map[status ?? 1] || '未知'
}

// 角色标签类型
const getRoleTagType = (role?: string) => {
  const r = normalizeRole(role)
  if (r === 'super_admin') return 'danger'
  if (r === 'admin') return 'warning'
  return ''
}

// 角色文本
const getRoleText = (role?: string) => {
  const r = normalizeRole(role)
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    user: '普通用户'
  }
  return map[r] || '普通用户'
}

// 判断是否为普通用户
const isRegularUser = (user: DashboardUser) => normalizeRole(user.role) === 'user'

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

const detailFieldLabelMap: Record<string, string> = {
  email: '邮箱',
  department: '所属部门',
  dept: '所属部门',
  deptName: '所属部门',
  department_name: '所属部门',
  policeId: '警号',
  police_id: '警号',
  idCardNumber: '身份证号',
  id_card_number: '身份证号',
  phone: '手机号',
  phoneNumber: '手机号',
  createAt: '创建时间',
  isBjzxAdmin: '边检智学权限',
  created_at: '注册时间',
  updated_at: '更新时间',
  createdAt: '注册时间',
  updatedAt: '更新时间'
}

const detailFieldOrder = [
  'email',
  'department',
  'dept',
  'deptName',
  'department_name',
  'policeId',
  'police_id',
  'idCardNumber',
  'id_card_number',
  'phone',
  'phoneNumber',
  'createAt',
  'isBjzxAdmin',
  'created_at',
  'createdAt',
  'updated_at',
  'updatedAt'
]

const detailExcludedKeys = new Set([
  'id',
  'username',
  'role',
  'status',
  'online',
  'hasChangedName',
  'last_login_at',
  'last_login_ip'
])

const formatDetailValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  if (key.endsWith('_at') || key.endsWith('_time') || key.endsWith('At') || key.endsWith('Time')) {
    return formatDate(String(value)) || String(value)
  }
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

const detailFields = computed(() => {
  const user = currentUser.value
  if (!user) return []

  const fields: Array<{ key: string; label: string; value: unknown }> = []
  const usedKeys = new Set(detailExcludedKeys)

  for (const key of detailFieldOrder) {
    if (Object.prototype.hasOwnProperty.call(user, key)) {
      fields.push({
        key,
        label: detailFieldLabelMap[key] || key,
        value: user[key]
      })
      usedKeys.add(key)
    }
  }

  const restKeys = Object.keys(user)
    .filter((key) => !usedKeys.has(key))
    .sort()

  restKeys.forEach((key) => {
    fields.push({
      key,
      label: detailFieldLabelMap[key] || key,
      value: user[key]
    })
  })

  return fields
})

// 加载用户数据
const loadUsers = async () => {
  loading.value = true
  try {
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_LIST))
    if (response.ok) {
      const raw = response.data?.data?.list || response.data?.data?.users || response.data || []
      const list = Array.isArray(raw) ? raw : (raw.items || [])
      const normalizedList = list.map((user: DashboardUser) => ({
        ...user,
        online: normalizeOnlineFlag(user.online)
      }))
      users.value = normalizedList
      
      // 计算统计数据
      stats.total = normalizedList.length
      stats.active = normalizedList.filter((u: DashboardUser) => u.status === 1).length
      stats.pending = normalizedList.filter((u: DashboardUser) => u.status === 0).length
      stats.banned = normalizedList.filter((u: DashboardUser) => u.status === -1).length
      stats.admins = normalizedList.filter((u: DashboardUser) => 
        normalizeRole(u.role) === 'admin' || normalizeRole(u.role) === 'super_admin'
      ).length
      syncOnlineStats(normalizedList)
      
      // 同步刷新全局用户缓存，让其他页面受益
      refreshUserCache()
    } else {
      throw new Error(response.data?.message || '加载用户列表失败')
    }
  } catch (error: any) {
    users.value = []
    ElMessage.error(error?.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  loadUsers()
}

// 应用筛选
const applyFilters = () => {
  pagination.page = 1
}

// 重置筛选
const resetFilters = () => {
  filters.keyword = ''
  filters.status = ''
  filters.role = ''
  pagination.page = 1
}

// 切换IP列显示
const toggleIPColumn = async () => {
  // IP列显示/隐藏由 v-if 控制
}

// 从问答日志加载用户活动数据（使用缓存服务）
const loadUserActivity = async (forceRefresh = false) => {
  loadingIP.value = true
  try {
    // 使用缓存服务获取活动数据
    const activityMap = forceRefresh 
      ? await refreshActivityCache() 
      : await getUserActivityMap()
    
    // 更新用户列表中的IP和最近登录时间
    users.value = users.value.map(user => {
      const odUserId = String(user.id)
      const activity = activityMap.get(odUserId)
      return {
        ...user,
        last_login_ip: activity?.ip || user.last_login_ip,
        last_login_at: activity?.lastLogin || user.last_login_at
      }
    })
    
    // 获取问答排行榜
    const rankingData = await getQARanking(10)
    qaRanking.value = rankingData.map(item => {
      // 优先从缓存获取用户名
      const cachedUser = getUserById(item.userId)
      const localUser = users.value.find(u => String(u.id) === item.userId)
      return {
        userId: item.userId,
        username: cachedUser?.username || localUser?.username || `用户${item.userId}`,
        count: item.qaCount
      }
    })
    
    ElMessage.success(`已加载 ${activityMap.size} 个用户的活动记录`)
  } catch (error: any) {
    ElMessage.error('加载活动数据失败: ' + (error?.message || '未知错误'))
  } finally {
    loadingIP.value = false
  }
}

// 选择变化
const handleSelectionChange = (selection: DashboardUser[]) => {
  selectedUsers.value = selection
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
}

// 页码变化
const handlePageChange = (page: number) => {
  pagination.page = page
}

// 查看用户详情
const viewUserDetail = (user: DashboardUser) => {
  currentUser.value = user
  detailDialogVisible.value = true
}

// 封禁用户
const banUser = async (user: DashboardUser) => {
  try {
    await ElMessageBox.confirm(
      `确定要封禁用户 "${user.username}" 吗？`,
      '确认封禁',
      { type: 'warning' }
    )
    
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_BAN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, username: user.username })
    })
    
    if (response.ok && (response.data?.code === 200 || response.data?.success)) {
      ElMessage.success('封禁成功')
      await loadUsers()
    } else {
      throw new Error(response.data?.message || '封禁失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '封禁失败')
    }
  }
}

// 解封用户
const unbanUser = async (user: DashboardUser) => {
  try {
    await ElMessageBox.confirm(
      `确定要解封用户 "${user.username}" 吗？`,
      '确认解封',
      { type: 'warning' }
    )
    
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_UNBAN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, username: user.username })
    })
    
    if (response.ok && (response.data?.code === 200 || response.data?.success)) {
      ElMessage.success('解封成功')
      await loadUsers()
    } else {
      throw new Error(response.data?.message || '解封失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '解封失败')
    }
  }
}

// 批量封禁
const batchBan = async () => {
  const regularUsers = selectedUsers.value.filter(u => isRegularUser(u) && u.status === 1)
  if (regularUsers.length === 0) {
    ElMessage.warning('没有可封禁的普通用户')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要封禁选中的 ${regularUsers.length} 个用户吗？`,
      '批量封禁',
      { type: 'warning' }
    )
    
    for (const user of regularUsers) {
      await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_BAN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, username: user.username })
      })
    }
    
    ElMessage.success(`成功封禁 ${regularUsers.length} 个用户`)
    await loadUsers()
    tableRef.value?.clearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量封禁失败')
    }
  }
}

// 批量解封
const batchUnban = async () => {
  const bannedUsers = selectedUsers.value.filter(u => u.status === -1)
  if (bannedUsers.length === 0) {
    ElMessage.warning('没有可解封的用户')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要解封选中的 ${bannedUsers.length} 个用户吗？`,
      '批量解封',
      { type: 'warning' }
    )
    
    for (const user of bannedUsers) {
      await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_UNBAN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, username: user.username })
      })
    }
    
    ElMessage.success(`成功解封 ${bannedUsers.length} 个用户`)
    await loadUsers()
    tableRef.value?.clearSelection()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量解封失败')
    }
  }
}

// 导出用户数据
const exportUsers = () => {
  exporting.value = true
  try {
    const dataToExport = selectedUsers.value.length > 0 ? selectedUsers.value : users.value
    const csvContent = generateCSV(dataToExport)
    downloadCSV(csvContent, `用户数据_${new Date().toISOString().slice(0, 10)}.csv`)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 批量导出选中
const batchExport = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要导出的用户')
    return
  }
  exportUsers()
}

// 生成CSV内容
const generateCSV = (data: DashboardUser[]) => {
  const headers = ['用户ID', '用户名', '邮箱', '角色', '状态', '注册时间', '最近登录']
  if (showIP.value) headers.push('最近登录IP')
  
  const rows = data.map(user => {
    const row = [
      user.id || '',
      user.username || '',
      user.email || '',
      getRoleText(user.role),
      getStatusText(user.status),
      formatDate(user.created_at),
      formatDate(user.last_login_at) || '从未登录'
    ]
    if (showIP.value) row.push(user.last_login_ip || '')
    return row
  })
  
  const csvRows = [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  )
  
  return '\uFEFF' + csvRows.join('\n') // BOM for Excel
}

// 下载CSV
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 初始化
onMounted(async () => {
  await loadUsers()
  // 加载用户后自动从问答日志获取活动数据（IP和最近登录时间）
  loadUserActivity()
  startOnlineStatusWatch()
})

onBeforeUnmount(() => {
  stopOnlineStatusWatch()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  padding-top: 80px; /* 为导航栏留出空间 */
  background: url('@/assets/allPic/public/userInfo.png') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  min-height: 100vh;
  margin-top: -60px; /* 向上延伸覆盖导航栏背景 */
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-title .el-icon {
  font-size: 32px;
  color: #ffffff;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  margin: 0;
  padding-left: 44px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
  color: white;
}

.stat-icon.banned {
  background: linear-gradient(135deg, #f56c6c 0%, #fab6b6 100%);
  color: white;
}

.stat-icon.admin {
  background: linear-gradient(135deg, #909399 0%, #c0c4cc 100%);
  color: white;
}

.stat-icon.online {
  background: linear-gradient(135deg, #14b8a6 0%, #34d399 100%);
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 问答排行榜 */
.chart-section {
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-subtitle {
  font-size: 13px;
  color: #909399;
}

.ranking-container {
  min-height: 200px;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}

/* 颁奖台样式 */
.podium-wrapper {
  padding: 20px;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 30px;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.podium-crown {
  font-size: 32px;
  margin-bottom: 8px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.podium-avatar {
  margin-bottom: 8px;
}

.podium-avatar.gold :deep(.el-avatar) {
  border: 3px solid #f5a623;
  box-shadow: 0 4px 12px rgba(245, 166, 35, 0.4);
}

.podium-item.second .podium-avatar :deep(.el-avatar) {
  border: 3px solid #a0a0a0;
  box-shadow: 0 4px 12px rgba(160, 160, 160, 0.4);
}

.podium-item.third .podium-avatar :deep(.el-avatar) {
  border: 3px solid #cd7f32;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
}

.podium-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-count {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.podium-stand {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px 8px 0 0;
  color: white;
  font-weight: 700;
  font-size: 24px;
}

.first-stand {
  width: 100px;
  height: 100px;
  background: linear-gradient(180deg, #f5a623 0%, #d4920a 100%);
}

.second-stand {
  width: 90px;
  height: 70px;
  background: linear-gradient(180deg, #a0a0a0 0%, #787878 100%);
}

.third-stand {
  width: 90px;
  height: 50px;
  background: linear-gradient(180deg, #cd7f32 0%, #a66628 100%);
}

.podium-rank {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 其他排名 */
.other-ranks {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.other-rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  flex: 1;
  min-width: 200px;
}

.other-rank-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.other-rank-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.other-rank-count {
  font-size: 13px;
  color: #909399;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 24px;
}

.filter-section :deep(.el-card__body) {
  padding: 20px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.filter-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

/* 表格区域 */
.table-section :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selected-count {
  color: #409eff;
  font-size: 14px;
}

/* 表格内容样式 */
.user-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #909399;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-weight: 500;
  color: #303133;
}

.ip-address {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #606266;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0 0;
}

/* 用户详情弹窗 */
.user-detail {
  padding: 20px 0;
}

.detail-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.detail-avatar h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.detail-value {
  word-break: break-all;
}

/* 响应式 */
@media (max-width: 1400px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    min-width: 100%;
  }
  
  .filter-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
