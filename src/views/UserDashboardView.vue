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

    <!-- 分组列表 -->
    <div class="group-list-section">
      <el-card shadow="never">
        <template #header>
          <div class="group-header">
            <span class="group-title">分组列表</span>
            <span class="group-subtitle">查看分组备注、启用状态与已授权用户</span>
          </div>
        </template>
        <el-table
          :data="groupTableRows"
          v-loading="loadingGroupList"
          stripe
          border
          style="width: 100%"
          empty-text="暂无分组数据"
        >
          <el-table-column prop="name" label="分组名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.remark || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="用户数" width="90">
            <template #default="{ row }">
              <span>{{ row.userCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用户" min-width="220">
            <template #default="{ row }">
              <div v-if="row.userCount === 0" class="empty-text">-</div>
              <div v-else-if="row.userCount <= 3" class="simple-text">
                {{ row.userNamesLabel }}
              </div>
              <div v-else class="expandable-cell">
                <span class="preview-text">{{ getPreviewText(row.userNamesLabel, 2) }}</span>
                <el-popover
                  placement="bottom"
                  :width="300"
                  trigger="click"
                >
                  <template #reference>
                    <el-link type="primary" :underline="false" style="margin-left: 8px;">
                      查看全部({{ row.userCount }})
                    </el-link>
                  </template>
                  <div class="popover-content">
                    <div class="popover-title">分组用户列表</div>
                    <div class="popover-list">
                      <el-tag
                        v-for="(userName, index) in row.userNamesLabel.split('、')"
                        :key="index"
                        size="small"
                        style="margin: 4px;"
                      >
                        {{ userName }}
                      </el-tag>
                    </div>
                  </div>
                </el-popover>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="权限" min-width="240">
            <template #default="{ row }">
              <div v-if="!row.permissionLabels || row.permissionLabels === '-'" class="empty-text">-</div>
              <div v-else-if="getPermissionCount(row.permissionLabels) <= 3" class="simple-text">
                {{ row.permissionLabels }}
              </div>
              <div v-else class="expandable-cell">
                <span class="preview-text">{{ getPreviewText(row.permissionLabels, 2) }}</span>
                <el-popover
                  placement="bottom"
                  :width="400"
                  trigger="click"
                >
                  <template #reference>
                    <el-link type="primary" :underline="false" style="margin-left: 8px;">
                      查看全部({{ getPermissionCount(row.permissionLabels) }})
                    </el-link>
                  </template>
                  <div class="popover-content">
                    <div class="popover-title">分组权限列表</div>
                    <div class="popover-list">
                      <el-tag
                        v-for="(permName, index) in row.permissionLabels.split('、')"
                        :key="index"
                        type="success"
                        size="small"
                        style="margin: 4px;"
                      >
                        {{ permName }}
                      </el-tag>
                    </div>
                  </div>
                </el-popover>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 分组权限管理 -->
    <div class="group-permission-section">
      <el-card shadow="never">
        <template #header>
          <div class="group-header">
            <span class="group-title">分组权限管理</span>
            <span class="group-subtitle">管理员可分配分组与访问权限（超管可配置全部权限）</span>
          </div>
        </template>
        <div class="group-permission-grid">
          <div class="group-panel">
            <h3 class="group-panel-title">新建分组</h3>
            <el-form :model="groupForm" label-width="90px">
              <el-form-item label="分组名称" required>
                <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="groupForm.remark" placeholder="例如：仅可看反馈" />
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="groupForm.status" placeholder="请选择">
                  <el-option label="启用" :value="1" />
                  <el-option label="禁用" :value="0" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="savingGroup" @click="createGroup">新建分组</el-button>
                <el-button @click="resetGroupForm">清空</el-button>
              </el-form-item>
            </el-form>
          </div>
          <div class="group-panel">
            <h3 class="group-panel-title">分组权限</h3>
            <el-form :model="permissionForm" label-width="90px">
              <el-form-item label="分组ID" required>
                <el-select
                  v-model="permissionForm.groupId"
                  placeholder="请选择或输入分组ID"
                  filterable
                  allow-create
                  default-first-option
                  :loading="loadingGroupList || loadingGroupDetail"
                >
                  <el-option
                    v-for="group in groupOptions"
                    :key="group.id"
                    :label="`${group.name}（ID:${group.id}）`"
                    :value="group.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="页面权限">
                <el-checkbox-group v-model="permissionForm.pageCodes" class="permission-list">
                  <el-checkbox
                    v-for="item in pagePermissionsForDisplay"
                    :key="item.code"
                    :label="item.code"
                    :disabled="item.disabled"
                  >
                    <span>{{ item.label }}</span>
                    <el-tag v-if="item.tag" size="small" class="perm-tag" :type="item.tagType">
                      {{ item.tag }}
                    </el-tag>
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="功能权限">
                <el-checkbox-group v-model="permissionForm.funcCodes" class="permission-list">
                  <el-checkbox
                    v-for="item in functionPermissions"
                    :key="item.code"
                    :label="item.code"
                  >
                    {{ item.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="savingPermissions" @click="submitGroupPermissions">保存权限</el-button>
                <el-button @click="resetPermissionForm">清空</el-button>
              </el-form-item>
              <div class="permission-tips">
                <el-icon><Warning /></el-icon>
                <span>首页、登录、业务问答、智能对话、12367助手默认开放；管理员不可授予仅超级管理员可访问的页面权限。</span>
              </div>
            </el-form>
          </div>
          <div class="group-panel">
            <h3 class="group-panel-title">用户归组</h3>
            <el-form :model="userGroupForm" label-width="90px">
              <el-form-item label="用户ID/用户名" required>
                <el-input v-model="userGroupForm.userId" placeholder="请输入用户ID或用户名" />
              </el-form-item>
              <el-form-item label="分组ID" required>
                <el-select
                  v-model="userGroupForm.groupIds"
                  placeholder="请选择或输入分组ID"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  :loading="loadingGroupList"
                >
                  <el-option
                    v-for="group in groupOptions"
                    :key="group.id"
                    :label="`${group.name}（ID:${group.id}）`"
                    :value="group.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="savingUserGroups" @click="assignUserGroups">更新归组</el-button>
                <el-button @click="resetUserGroupForm">清空</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-card shadow="never">
        <div class="filter-row">
          <div class="filter-item filter-item-keyword">
            <label>关键词搜索</label>
            <el-input
              v-model="filters.keyword"
              placeholder="搜索用户名、邮箱、ID（警号精确）"
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
              <el-tag :type="getRoleTagType(row.role, !!row.isBjzxAdmin)" size="small">
                {{ getRoleText(row.role, !!row.isBjzxAdmin) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="分组" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="group-label">{{ formatGroupLabel(row) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="访问权限" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="permission-label">{{ formatPermissionLabel(row) }}</span>
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
            <el-tag :type="getRoleTagType(currentUser.role, !!currentUser.isBjzxAdmin)" size="small">
              {{ getRoleText(currentUser.role, !!currentUser.isBjzxAdmin) }}
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
          <el-descriptions-item label="可访问页面" :span="2">
            <div class="accessible-pages">
              <el-tag
                v-for="pageName in getAccessiblePageNames(currentUser)"
                :key="pageName"
                type="primary"
                size="small"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ pageName }}
              </el-tag>
              <span v-if="getAccessiblePageNames(currentUser).length === 0" class="detail-value">-</span>
            </div>
          </el-descriptions-item>
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
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useStore } from 'vuex'
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
  Connection,
  Warning
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

interface PermissionOption {
  code: string
  label: string
  access: 'public' | 'super_admin' | 'normal'
}

// 状态
const store = useStore()
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

const isSuperAdminUser = computed(() => store.getters.isSuperAdmin)

const savingGroup = ref(false)
const savingPermissions = ref(false)
const savingUserGroups = ref(false)
const loadingGroupList = ref(false)
const loadingGroupDetail = ref(false)
const lockedSuperAdminCodes = ref<string[]>([])
const groupOptions = ref<Array<{ id: string; name: string; remark?: string; status?: number }>>([])
const groupPermissionsById = reactive<Record<string, string[]>>({})
const groupPermissionRequested = new Set<string>()

const groupForm = reactive({
  name: '',
  remark: '',
  status: 1
})

const permissionForm = reactive({
  groupId: '',
  pageCodes: [] as string[],
  funcCodes: [] as string[]
})

const userGroupForm = reactive({
  userId: '',
  groupIds: [] as string[]
})

const pagePermissionCatalog: PermissionOption[] = [
  { code: 'PAGE_001', label: '首页', access: 'public' },
  { code: 'PAGE_002', label: '登录', access: 'public' },
  { code: 'PAGE_003', label: '业务问答', access: 'public' },
  { code: 'PAGE_004', label: '业务问答 (Debug模式)', access: 'normal' },
  { code: 'PAGE_005', label: '智能对话', access: 'public' },
  { code: 'PAGE_006', label: '管理中心', access: 'normal' },
  { code: 'PAGE_007', label: '超级管理员中心', access: 'super_admin' },
  { code: 'PAGE_008', label: '用户仪表盘', access: 'normal' },
  { code: 'PAGE_009', label: '个人设置', access: 'public' },
  { code: 'PAGE_010', label: 'Excel 工具', access: 'public' },
  { code: 'PAGE_011', label: '选择题格式化工具', access: 'public' },
  { code: 'PAGE_012', label: '边检智能家教', access: 'normal' },
  { code: 'PAGE_013', label: '智慧办公', access: 'normal' },
  { code: 'PAGE_014', label: '12367助手', access: 'public' },
  { code: 'PAGE_015', label: '选择题问答测试', access: 'normal' },
  { code: 'PAGE_017', label: '数研报告', access: 'normal' },
  { code: 'PAGE_018', label: '反馈记录列表', access: 'normal' },
  { code: 'PAGE_019', label: '反馈详情', access: 'normal' },
  { code: 'PAGE_021', label: '问答日志管理', access: 'super_admin' },
  { code: 'PAGE_022', label: '知识库管理', access: 'super_admin' },
  { code: 'PAGE_023', label: '资料中心', access: 'normal' },
  { code: 'PAGE_024', label: '软件下载', access: 'public' }
]

const functionPermissions = [
  { code: 'PERM_FEEDBACK_VIEW', label: '反馈查看' }
]

const superAdminOnlyCodes = new Set(
  pagePermissionCatalog.filter(item => item.access === 'super_admin').map(item => item.code)
)

const pagePermissionsForDisplay = computed(() => {
  const isSuper = isSuperAdminUser.value
  return pagePermissionCatalog.map((item) => {
    const isPublic = item.access === 'public'
    const isSuperOnly = item.access === 'super_admin'
    return {
      ...item,
      disabled: isPublic || (!isSuper && isSuperOnly),
      tag: isPublic ? '默认开放' : (isSuperOnly ? '仅超管' : ''),
      tagType: isPublic ? 'info' : 'warning'
    }
  })
})

const groupNameMap = computed(() => {
  const map = new Map<string, string>()
  groupOptions.value.forEach(group => {
    if (group.id) {
      map.set(group.id, group.name)
    }
  })
  return map
})

const permissionLabelMap = computed(() => {
  const map = new Map<string, string>()
  pagePermissionCatalog.forEach(item => map.set(item.code, item.label))
  functionPermissions.forEach(item => map.set(item.code, item.label))
  return map
})

const groupUserMap = computed(() => {
  const map = new Map<string, Set<string>>()
  users.value.forEach((user) => {
    const userLabel = String(user.username || user.id || '-').trim()
    extractGroupIds(user).forEach((id) => {
      if (!map.has(id)) {
        map.set(id, new Set())
      }
      map.get(id)?.add(userLabel)
    })
  })
  return map
})

const formatGroupPermissionsLabel = (groupId: string) => {
  const codes = groupPermissionsById[groupId]
  if (!Array.isArray(codes) || codes.length === 0) return '-'
  const labelMap = permissionLabelMap.value
  const labels = codes.map(code => labelMap.get(code) || code)
  return labels.join('、')
}

const groupTableRows = computed(() => {
  return groupOptions.value.map((group) => {
    const userSet = groupUserMap.value.get(group.id)
    const userNames = userSet ? Array.from(userSet) : []
    return {
      ...group,
      userCount: userNames.length,
      userNamesLabel: userNames.length > 0 ? userNames.join('、') : '-',
      permissionLabels: formatGroupPermissionsLabel(group.id)
    }
  })
})

// 获取预览文本（显示前N项，其余用省略号）
const getPreviewText = (text: string, maxItems: number): string => {
  if (!text || text === '-') return '-'
  const items = text.split('、')
  if (items.length <= maxItems) return text
  return items.slice(0, maxItems).join('、') + '...'
}

// 获取权限数量
const getPermissionCount = (permissionLabels: string): number => {
  if (!permissionLabels || permissionLabels === '-') return 0
  return permissionLabels.split('、').filter(Boolean).length
}


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
  const normalizeSearchText = (value: unknown) => String(value ?? '').trim().toLowerCase()

  const getUserPoliceId = (user: DashboardUser) => {
    const raw = user as any
    return String(raw?.policeId ?? raw?.police_id ?? '').trim()
  }

  const applyKeywordFilter = (list: DashboardUser[]) => {
    if (!filters.keyword) return list
    const keyword = normalizeSearchText(filters.keyword)
    if (!keyword) return list

    const policeMatches = list.filter((user) => {
      const policeId = normalizeSearchText(getUserPoliceId(user))
      return policeId !== '' && policeId === keyword
    })
    if (policeMatches.length > 0) return policeMatches

    return list.filter((user) => {
      const username = normalizeSearchText(user.username)
      const email = normalizeSearchText(user.email)
      const id = normalizeSearchText(user.id)
      return username.includes(keyword) || email.includes(keyword) || id.includes(keyword)
    })
  }

  const applyFiltersToList = (list: DashboardUser[]) => {
    let result = applyKeywordFilter(list)
    if (filters.status !== '') {
      result = result.filter(user => user.status === filters.status)
    }
    if (filters.role) {
      result = result.filter(user => normalizeRole(user.role) === filters.role)
    }
    return result
  }

  const filteredUsers = computed(() => {
    const result = applyFiltersToList([...users.value])
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return result.slice(start, end)
  })
  
  const filteredTotal = computed(() => {
    return applyFiltersToList([...users.value]).length
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
const getRoleTagType = (role?: string, isBjzxAdmin?: boolean) => {
  const r = normalizeRole(role)
  if (r === 'super_admin') return 'danger'
  if (r === 'admin') return 'warning'
  if (isBjzxAdmin) return 'success'
  return ''
}

// 角色文本
const getRoleText = (role?: string, isBjzxAdmin?: boolean) => {
  const r = normalizeRole(role)
  if (r === 'user' && isBjzxAdmin) return '边检智学管理员'
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
  groupIds: '分组ID',
  group_ids: '分组ID',
  groupNames: '分组名称',
  group_names: '分组名称',
  groups: '分组信息',
  group: '分组信息',
  permissions: '访问权限',
  permissionCodes: '访问权限',
  permission_codes: '访问权限',
  perms: '访问权限',
  permCodes: '访问权限',
  groupPermissions: '访问权限',
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
  'groupIds',
  'group_ids',
  'groupNames',
  'group_names',
  'groups',
  'group',
  'permissions',
  'permissionCodes',
  'permission_codes',
  'perms',
  'permCodes',
  'groupPermissions',
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
  if (
    key === 'groupIds' ||
    key === 'group_ids' ||
    key === 'groupNames' ||
    key === 'group_names' ||
    key === 'groups' ||
    key === 'group'
  ) {
    return currentUser.value ? formatGroupLabel(currentUser.value) : '-'
  }
  if (
    key === 'permissions' ||
    key === 'permissionCodes' ||
    key === 'permission_codes' ||
    key === 'perms' ||
    key === 'permCodes' ||
    key === 'groupPermissions'
  ) {
    return currentUser.value ? formatPermissionLabel(currentUser.value) : '-'
  }
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
      loadGroupPermissionsForUsers(normalizedList)
      
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

const normalizeGroupId = (value: unknown) => String(value ?? '').trim()
const normalizeUserInput = (value: unknown) => String(value ?? '').trim()

const normalizeStringList = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(item => String(item ?? '').trim()).filter(Boolean)
  }
  return [String(value).trim()].filter(Boolean)
}

const extractGroupIds = (user: DashboardUser): string[] => {
  const ids: string[] = []
  const raw = user as any
  const idCandidates = [
    raw.groupIds,
    raw.group_ids,
    raw.groupId,
    raw.group_id
  ]
  idCandidates.forEach(candidate => {
    ids.push(...normalizeStringList(candidate))
  })

  const groups = raw.groups
  if (Array.isArray(groups)) {
    groups.forEach((group: any) => {
      if (group && typeof group === 'object') {
        ids.push(...normalizeStringList(group.id))
      } else {
        ids.push(...normalizeStringList(group))
      }
    })
  }

  if (raw.group && typeof raw.group === 'object') {
    ids.push(...normalizeStringList(raw.group.id))
  } else if (raw.group) {
    ids.push(...normalizeStringList(raw.group))
  }

  return Array.from(new Set(ids.filter(Boolean)))
}

const findUserIdByInput = (input: string): { userId?: string; error?: string } => {
  const normalized = normalizeUserInput(input)
  if (!normalized) {
    return { error: '请填写用户ID或用户名' }
  }
  if (users.value.length === 0) {
    return { error: '用户列表未加载，请稍后重试' }
  }

  const direct = users.value.find(user => normalizeUserInput(user.id) === normalized)
  if (direct?.id !== undefined && direct?.id !== null) {
    return { userId: String(direct.id) }
  }

  const normalizedLower = normalized.toLowerCase()
  const matches = users.value.filter(user => {
    const name = normalizeUserInput(user.username)
    return name && name.toLowerCase() === normalizedLower
  })

  if (matches.length === 1) {
    const matchedId = matches[0]?.id
    if (matchedId !== undefined && matchedId !== null) {
      return { userId: String(matchedId) }
    }
  }

  if (matches.length > 1) {
    return { error: '用户名重复，请输入用户ID' }
  }

  return { error: '未找到对应用户，请检查输入' }
}

const resolveGroupLabels = (user: DashboardUser): string[] => {
  const labels = new Set<string>()
  const raw = user as any
  normalizeStringList(raw.groupNames).forEach(name => labels.add(name))
  normalizeStringList(raw.group_names).forEach(name => labels.add(name))
  normalizeStringList(raw.groupName).forEach(name => labels.add(name))
  normalizeStringList(raw.group_name).forEach(name => labels.add(name))

  const groups = raw.groups
  if (Array.isArray(groups)) {
    groups.forEach((group: any) => {
      if (group && typeof group === 'object') {
        if (group.name) labels.add(String(group.name).trim())
      } else {
        labels.add(String(group).trim())
      }
    })
  }

  if (raw.group && typeof raw.group === 'object') {
    if (raw.group.name) labels.add(String(raw.group.name).trim())
  } else if (raw.group) {
    labels.add(String(raw.group).trim())
  }

  const ids = extractGroupIds(user)
  const map = groupNameMap.value
  ids.forEach((id) => {
    if (map.has(id)) {
      labels.add(map.get(id) as string)
    } else {
      labels.add(id)
    }
  })

  return Array.from(labels).filter(Boolean)
}

const extractPermissionCodes = (user: DashboardUser): string[] => {
  const raw = user as any
  const candidates = [
    raw.permissions,
    raw.permissionCodes,
    raw.permission_codes,
    raw.perms,
    raw.permCodes,
    raw.groupPermissions
  ]
  const codes: string[] = []
  candidates.forEach(candidate => {
    if (Array.isArray(candidate)) {
      codes.push(...candidate.map((code: any) => String(code).trim()))
    }
  })

  if (Array.isArray(raw.groups)) {
    raw.groups.forEach((group: any) => {
      if (group && Array.isArray(group.permissions)) {
        codes.push(...group.permissions.map((code: any) => String(code).trim()))
      }
    })
  }

  return Array.from(new Set(codes.filter(Boolean)))
}

const resolveUserPermissionCodes = (user: DashboardUser): string[] => {
  const direct = extractPermissionCodes(user)
  if (direct.length > 0) return direct

  const ids = extractGroupIds(user)
  const collected: string[] = []
  ids.forEach(id => {
    const perms = groupPermissionsById[id]
    if (Array.isArray(perms)) {
      collected.push(...perms)
    }
  })
  return Array.from(new Set(collected.filter(Boolean)))
}

const formatGroupLabel = (user: DashboardUser): string => {
  const labels = resolveGroupLabels(user)
  return labels.length > 0 ? labels.join('、') : '-'
}

const formatPermissionLabel = (user: DashboardUser): string => {
  const codes = resolveUserPermissionCodes(user)
  if (codes.length === 0) return '-'
  const labelMap = permissionLabelMap.value
  const labels = codes.map(code => labelMap.get(code) || code)
  return labels.join('、')
}

// 获取用户可访问的页面名称列表
const getAccessiblePageNames = (user: DashboardUser): string[] => {
  const codes = resolveUserPermissionCodes(user)
  if (codes.length === 0) return []
  
  // 只筛选页面权限（以 PAGE_ 开头的权限码）
  const pageCodes = codes.filter(code => code.startsWith('PAGE_'))
  
  // 将权限码映射为页面名称
  const labelMap = permissionLabelMap.value
  const pageNames = pageCodes
    .map(code => labelMap.get(code))
    .filter(Boolean) as string[]
  
  // 去重并排序
  return Array.from(new Set(pageNames)).sort()
}


const upsertGroupOption = (groupId: unknown, groupName?: unknown, remark?: unknown, status?: unknown) => {
  const normalizedId = normalizeGroupId(groupId)
  if (!normalizedId) return
  const normalizedName = String(groupName ?? `分组${normalizedId}`).trim()
  const existing = groupOptions.value.find(group => group.id === normalizedId)
  if (existing) {
    if (groupName) {
      existing.name = normalizedName
    }
    if (remark !== undefined) {
      existing.remark = String(remark ?? '').trim()
    }
    if (status !== undefined && status !== null && status !== '') {
      const statusNumber = Number(status)
      existing.status = Number.isNaN(statusNumber) ? existing.status : statusNumber
    }
    return
  }
  const statusNumber = Number(status)
  groupOptions.value.push({
    id: normalizedId,
    name: normalizedName,
    remark: remark !== undefined ? String(remark ?? '').trim() : undefined,
    status: Number.isNaN(statusNumber) ? undefined : statusNumber
  })
}

const resetGroupForm = () => {
  groupForm.name = ''
  groupForm.remark = ''
  groupForm.status = 1
}

const resetPermissionForm = () => {
  permissionForm.groupId = ''
  permissionForm.pageCodes = []
  permissionForm.funcCodes = []
}

const resetUserGroupForm = () => {
  userGroupForm.userId = ''
  userGroupForm.groupIds = []
}

const loadGroupOptions = async () => {
  loadingGroupList.value = true
  try {
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.GROUPS_LIST))
    if (response.ok && (response.data?.success || response.data?.code === 200)) {
      const raw = response.data?.data?.list || response.data?.data || response.data || []
      const list = Array.isArray(raw) ? raw : (raw.list || [])
      groupOptions.value = list
        .map((group: any) => {
          const statusNumber = Number(group?.status)
          return {
            id: normalizeGroupId(group?.id),
            name: String(group?.name ?? `分组${group?.id ?? ''}`).trim(),
            remark: group?.remark ? String(group.remark).trim() : '',
            status: Number.isNaN(statusNumber) ? undefined : statusNumber
          }
        })
        .filter((group: { id: string; name: string }) => group.id)
      loadGroupPermissionsForIds(groupOptions.value.map(group => group.id))
    } else {
      throw new Error(response.data?.message || '获取分组列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取分组列表失败')
  } finally {
    loadingGroupList.value = false
  }
}

const loadGroupPermissionsForIds = async (groupIds: string[]) => {
  const pending = groupIds.filter(id => id && !groupPermissionsById[id] && !groupPermissionRequested.has(id))
  if (pending.length === 0) return

  pending.forEach(id => groupPermissionRequested.add(id))
  await Promise.all(pending.map(async (groupId) => {
    try {
      const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.GROUPS_DETAIL(groupId)))
      if (response.ok && (response.data?.success || response.data?.code === 200)) {
        const payload = response.data?.data || response.data || {}
        const permissions = Array.isArray(payload.permissions) ? payload.permissions : []
        groupPermissionsById[groupId] = permissions.map((code: any) => String(code).trim()).filter(Boolean)
        if (payload?.name) {
          upsertGroupOption(groupId, payload.name)
        }
      } else {
        groupPermissionRequested.delete(groupId)
      }
    } catch {
      groupPermissionRequested.delete(groupId)
    }
  }))
}

const loadGroupPermissionsForUsers = (list: DashboardUser[]) => {
  const ids = new Set<string>()
  list.forEach(user => {
    extractGroupIds(user).forEach(id => ids.add(id))
  })
  if (ids.size === 0) return
  loadGroupPermissionsForIds(Array.from(ids))
}

const loadGroupDetail = async (groupId: string) => {
  if (!groupId) {
    permissionForm.pageCodes = []
    permissionForm.funcCodes = []
    lockedSuperAdminCodes.value = []
    return
  }

  loadingGroupDetail.value = true
  try {
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.GROUPS_DETAIL(groupId)))
    if (response.ok && (response.data?.success || response.data?.code === 200)) {
      const payload = response.data?.data || response.data || {}
      const permissions = Array.isArray(payload.permissions) ? payload.permissions : []
      const pageCodes = permissions.filter((code: string) => String(code).startsWith('PAGE_'))
      const funcCodes = permissions.filter((code: string) => !String(code).startsWith('PAGE_'))
      permissionForm.pageCodes = pageCodes
      permissionForm.funcCodes = funcCodes
      groupPermissionsById[groupId] = permissions.map((code: any) => String(code).trim()).filter(Boolean)
      if (!isSuperAdminUser.value) {
        lockedSuperAdminCodes.value = pageCodes.filter((code: string) => superAdminOnlyCodes.has(code))
      } else {
        lockedSuperAdminCodes.value = []
      }
      if (payload?.name) {
        upsertGroupOption(groupId, payload.name, payload.remark, payload.status)
      }
    } else {
      throw new Error(response.data?.message || '获取分组详情失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取分组详情失败')
  } finally {
    loadingGroupDetail.value = false
  }
}

const createGroup = async () => {
  const name = groupForm.name.trim()
  if (!name) {
    ElMessage.warning('请填写分组名称')
    return
  }

  savingGroup.value = true
  try {
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.GROUPS_CREATE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        remark: groupForm.remark.trim(),
        status: groupForm.status
      })
    })

    if (response.ok && (response.data?.success || response.data?.code === 200)) {
      const payload = response.data?.data || response.data || {}
      const groupId = payload?.id ?? payload?.groupId ?? payload?.data?.id ?? payload?.data?.groupId
      upsertGroupOption(groupId, name, groupForm.remark, groupForm.status)
      await loadGroupOptions()
      ElMessage.success('分组创建成功')
      resetGroupForm()
    } else {
      throw new Error(response.data?.message || '创建分组失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '创建分组失败')
  } finally {
    savingGroup.value = false
  }
}

const submitGroupPermissions = async () => {
  const groupId = normalizeGroupId(permissionForm.groupId)
  if (!groupId) {
    ElMessage.warning('请填写分组ID')
    return
  }

  const selectedPermissions = [
    ...permissionForm.pageCodes,
    ...permissionForm.funcCodes
  ]
    .map(code => code.trim())
    .filter(Boolean)

  let filteredPermissions = selectedPermissions
  if (!isSuperAdminUser.value) {
    const lockedSet = new Set(lockedSuperAdminCodes.value)
    const retained = selectedPermissions.filter(
      (code) => !superAdminOnlyCodes.has(code) || lockedSet.has(code)
    )
    const removed = selectedPermissions.filter(
      (code) => superAdminOnlyCodes.has(code) && !lockedSet.has(code)
    )
    if (removed.length > 0) {
      ElMessage.warning('已移除仅超级管理员可授予的页面权限')
    }
    filteredPermissions = Array.from(new Set([...retained, ...lockedSet]))
  }

  const dedupedPermissions = Array.from(new Set(filteredPermissions))
  if (dedupedPermissions.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    return
  }

  savingPermissions.value = true
  try {
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.GROUPS_PERMISSIONS(groupId)), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: dedupedPermissions })
    })

    if (response.ok && (response.data?.success || response.data?.code === 200)) {
      upsertGroupOption(groupId)
      groupPermissionsById[groupId] = dedupedPermissions
      ElMessage.success('权限更新成功')
    } else {
      throw new Error(response.data?.message || '权限更新失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '权限更新失败')
  } finally {
    savingPermissions.value = false
  }
}

const assignUserGroups = async () => {
  const userInput = normalizeUserInput(userGroupForm.userId)
  if (!userInput) {
    ElMessage.warning('请填写用户ID或用户名')
    return
  }
  if (users.value.length === 0) {
    await loadUsers()
  }
  const resolved = findUserIdByInput(userInput)
  if (resolved.error) {
    ElMessage.warning(resolved.error)
    return
  }
  const userId = normalizeGroupId(resolved.userId)

  const normalizedGroupIds = userGroupForm.groupIds
    .map(id => normalizeGroupId(id))
    .filter(Boolean)

  if (normalizedGroupIds.length === 0) {
    ElMessage.warning('请填写分组ID')
    return
  }

  const payloadGroupIds = normalizedGroupIds.map((id) => {
    const asNumber = Number(id)
    return Number.isFinite(asNumber) ? asNumber : id
  })

  savingUserGroups.value = true
  try {
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.GROUPS_USER_UPDATE(userId)), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupIds: payloadGroupIds })
    })

    if (response.ok && (response.data?.success || response.data?.code === 200)) {
      normalizedGroupIds.forEach(id => upsertGroupOption(id))
      ElMessage.success('用户归组已更新')
      await loadUsers()
      resetUserGroupForm()
    } else {
      throw new Error(response.data?.message || '用户归组失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '用户归组失败')
  } finally {
    savingUserGroups.value = false
  }
}

// 切换IP列显示
const toggleIPColumn = async () => {
  // IP列显示/隐藏由 v-if 控制
}

// 从问答日志加载用户活动数据（使用缓存服务）
interface LoginIpActivity {
  userId?: string
  username?: string
  ip?: string
  lastLogin?: string
}

const normalizeLoginIpRows = (raw: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(raw)) {
    return raw as Array<Record<string, unknown>>
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      return obj.items as Array<Record<string, unknown>>
    }
    if (Array.isArray(obj.list)) {
      return obj.list as Array<Record<string, unknown>>
    }
    return Object.entries(obj).map(([userId, record]) => {
      if (record && typeof record === 'object') {
        const source = record as Record<string, unknown>
        return {
          ...source,
          userId: source.userId ?? source.user_id ?? source.id ?? userId
        }
      }
      return {
        userId,
        ip: record
      }
    })
  }
  return []
}

const normalizeLoginIpKey = (value: unknown) => String(value ?? '').trim().toLowerCase()

const fetchUserLoginIpData = async (): Promise<{
  byUserId: Map<string, LoginIpActivity>
  byUsername: Map<string, LoginIpActivity>
}> => {
  const byUserId = new Map<string, LoginIpActivity>()
  const byUsername = new Map<string, LoginIpActivity>()
  try {
    const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_LOGIN_IPS))
    const bizCode = Number(response.data?.code)
    const isBizOk = response.ok
      && response.data?.success !== false
      && (Number.isNaN(bizCode) || bizCode === 200)

    if (!isBizOk) {
      console.warn('[UserDashboard] fetch login-ip failed:', response.status, response.data?.message || response.data)
      return { byUserId, byUsername }
    }

    const payload = response.data?.data?.list
      || response.data?.data?.users
      || response.data?.data
      || response.data?.list
      || response.data
      || []
    const rows = normalizeLoginIpRows(payload)

    rows.forEach((row) => {
      const userIdRaw = row.userId ?? row.user_id ?? row.id ?? row.uid
      const userId = String(userIdRaw ?? '').trim()
      const username = String(row.username ?? row.userName ?? row.name ?? '').trim()

      const ipRaw = row.ip ?? row.loginIp ?? row.login_ip ?? row.last_login_ip ?? row.user_ip ?? row.client_ip
      const loginTimeRaw = row.lastLogin ?? row.lastLoginAt ?? row.last_login_at ?? row.login_at ?? row.updated_at

      const ip = String(ipRaw ?? '').trim()
      const lastLogin = String(loginTimeRaw ?? '').trim()
      if (!ip && !lastLogin) return

      const activity: LoginIpActivity = {
        userId: userId || undefined,
        username: username || undefined,
        ip: ip || undefined,
        lastLogin: lastLogin || undefined
      }

      if (userId) {
        byUserId.set(userId, activity)
      }
      if (username) {
        byUsername.set(normalizeLoginIpKey(username), activity)
      }
    })
  } catch (error) {
    console.warn('[UserDashboard] fetch login-ip exception:', error)
  }
  return { byUserId, byUsername }
}

const loadUserActivity = async (forceRefresh = false) => {
  loadingIP.value = true
  try {
    const loginIpData = await fetchUserLoginIpData()

    // Priority: backend login-ip data.
    users.value = users.value.map(user => {
      const odUserId = String(user.id)
      const loginIp = loginIpData.byUserId.get(odUserId)
        || loginIpData.byUsername.get(normalizeLoginIpKey(user.username))
      return {
        ...user,
        last_login_ip: loginIp?.ip || user.last_login_ip,
        last_login_at: loginIp?.lastLogin || user.last_login_at
      }
    })

    // Fallback: activity logs from 5000 side.
    let activityMap: Awaited<ReturnType<typeof getUserActivityMap>> = new Map()
    try {
      activityMap = forceRefresh
        ? await refreshActivityCache()
        : await getUserActivityMap()

      users.value = users.value.map(user => {
        const odUserId = String(user.id)
        const loginIp = loginIpData.byUserId.get(odUserId)
          || loginIpData.byUsername.get(normalizeLoginIpKey(user.username))
        const activity = activityMap.get(odUserId)
        return {
          ...user,
          last_login_ip: loginIp?.ip || activity?.ip || user.last_login_ip,
          last_login_at: loginIp?.lastLogin || activity?.lastLogin || user.last_login_at
        }
      })
    } catch (error) {
      console.warn('[UserDashboard] activity log unavailable, backend login-ip applied:', error)
    }

    // Ranking should not block IP refresh.
    try {
      const rankingData = await getQARanking(10)
      qaRanking.value = rankingData.map(item => {
        const cachedUser = getUserById(item.userId)
        const localUser = users.value.find(u => String(u.id) === item.userId)
        return {
          userId: item.userId,
          username: cachedUser?.username || localUser?.username || `用户${item.userId}`,
          count: item.qaCount
        }
      })
    } catch (error) {
      console.warn('[UserDashboard] load ranking failed:', error)
    }

    const loadedCount = Math.max(loginIpData.byUserId.size, loginIpData.byUsername.size, activityMap.size)
    ElMessage.success(`已加载 ${loadedCount} 个用户的活动记录`)
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
      getRoleText(user.role, !!user.isBjzxAdmin),
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
  loadGroupOptions()
  // 加载用户后自动从问答日志获取活动数据（IP和最近登录时间）
  loadUserActivity()
  startOnlineStatusWatch()
})

onBeforeUnmount(() => {
  stopOnlineStatusWatch()
})

watch(
  () => permissionForm.groupId,
  (value) => {
    const groupId = normalizeGroupId(value)
    if (!groupId) {
      permissionForm.pageCodes = []
      permissionForm.funcCodes = []
      lockedSuperAdminCodes.value = []
      return
    }
    loadGroupDetail(groupId)
  }
)
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

/* 分组权限管理 */
.group-list-section {
  margin-bottom: 24px;
}

.group-permission-section {
  margin-bottom: 24px;
}

.group-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.group-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.group-subtitle {
  font-size: 13px;
  color: #909399;
}

.group-permission-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.group-panel {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  background: #fafafa;
}

.group-panel-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.perm-tag {
  margin-left: 6px;
}

.permission-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #e6a23c;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 12px;
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

.filter-item-keyword {
  flex: 1 1 320px;
  min-width: 280px;
}

.filter-item-keyword :deep(.el-input) {
  width: 100%;
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

.group-label,
.permission-label {
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

.accessible-pages {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

/* 分组列表展开单元格样式 */
.empty-text {
  color: #909399;
  font-size: 14px;
}

.simple-text {
  font-size: 14px;
  color: #606266;
}

.expandable-cell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.preview-text {
  font-size: 14px;
  color: #606266;
}

.popover-content {
  max-height: 400px;
  overflow-y: auto;
}

.popover-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
}

.popover-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 响应式 */
@media (max-width: 1400px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
  }

  .group-permission-grid {
    grid-template-columns: repeat(2, 1fr);
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

  .group-permission-grid {
    grid-template-columns: 1fr;
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

