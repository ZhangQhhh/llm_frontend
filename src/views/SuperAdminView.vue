<template>
  <div class="super-admin-page">
    <div class="container">
      <header class="page-header">
        <div class="header-content">
          <h1>超级管理员中心</h1>
          <el-tag type="danger" effect="dark">SUPER ADMIN</el-tag>
        </div>
        <p class="subtitle">专属的高权限操作面板，请谨慎执行敏感操作</p>
        <el-alert
          class="header-alert"
          title="创建管理员后，请立即通知对方完成首次密码修改"
          type="warning"
          effect="dark"
          show-icon
        />
      </header>

      <el-row :gutter="20">
        <el-col :xs="24" :md="16" class="primary-column">
          <!-- 账号审核 -->
          <el-card class="card approval-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>账号审核</span>
                <div class="card-actions">
                  <el-tag type="warning" v-if="pendingUsers.length > 0">
                    待审核：{{ pendingUsers.length }} 个
                  </el-tag>
                  <el-button type="primary" plain @click="loadPendingUsers" :loading="loadingPending" :icon="Refresh" size="small">
                    刷新
                  </el-button>
                </div>
              </div>
            </template>

            <div class="approval-body">
              <div v-if="loadingPending" class="list-loading">
                <el-skeleton :rows="3" animated />
              </div>
              <el-empty v-else-if="pendingUsers.length === 0" description="暂无待审核账号">
                <el-button type="primary" plain @click="loadPendingUsers">刷新数据</el-button>
              </el-empty>
              <el-table
                v-else
                :data="pendingUsers"
                border
                size="small"
                stripe
                style="width: 100%"
              >
                <el-table-column prop="username" label="用户名" min-width="120" />
                <el-table-column prop="policeId" label="警号" min-width="100">
                  <template #default="scope">{{ scope.row.policeId || scope.row.police_id || '—' }}</template>
                </el-table-column>
                <el-table-column prop="idCardNumber" label="身份证" min-width="140">
                  <template #default="scope">
                    <span v-if="scope.row.idCardNumber || scope.row.id_card_number">
                      {{ maskIdCard(scope.row.idCardNumber || scope.row.id_card_number) }}
                    </span>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="注册时间" min-width="150">
                  <template #default="scope">{{ scope.row.created_at || scope.row.createdAt || '—' }}</template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="scope">
                    <el-button
                      type="success"
                      plain
                      size="small"
                      :loading="approvalLoadingId === (scope.row.id || scope.row.username)"
                      @click="approveUser(scope.row)"
                    >
                      批准
                    </el-button>
                    <el-button
                      type="danger"
                      plain
                      size="small"
                      :loading="rejectLoadingId === (scope.row.id || scope.row.username)"
                      @click="rejectUser(scope.row)"
                    >
                      拒绝
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>

          <el-card class="card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>创建管理员账号</span>
                <el-tag type="danger" effect="plain">仅超级管理员可操作</el-tag>
              </div>
            </template>

            <el-form
              ref="formRef"
              label-width="120px"
              :model="form"
              :rules="rules"
              status-icon
            >
              <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" placeholder="请输入管理员用户名">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="警号" prop="policeId">
                <el-input v-model="form.policeId" placeholder="请输入警号">
                  <template #prefix>
                    <el-icon><Postcard /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="身份证号" prop="idCardNumber">
                <el-input v-model="form.idCardNumber" placeholder="请输入身份证号" maxlength="18">
                  <template #prefix>
                    <el-icon><CreditCard /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="邮箱（可选）" prop="email">
                <el-input v-model="form.email" placeholder="请输入管理员邮箱（可选）">
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="初始密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  show-password
                  placeholder="请输入初始密码"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-space>
                  <el-button type="primary" @click="handleCreate" :loading="creating" icon="CirclePlus">
                    创建管理员
                  </el-button>
                  <el-button @click="resetForm" :disabled="creating" icon="RefreshRight">重置</el-button>
                </el-space>
              </el-form-item>
            </el-form>

            <transition name="fade">
              <el-result
                v-if="lastCreated.username"
                icon="success"
                title="管理员创建成功"
                :sub-title="`已为 ${lastCreated.username} (${lastCreated.email}) 开通管理员权限`"
                class="success-result"
              >
                <template #extra>
                  <el-tag type="success" effect="plain">
                    初始密码：已通过安全通道发送
                  </el-tag>
                </template>
              </el-result>
            </transition>
          </el-card>

          <el-card class="card admin-list-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>现有管理员列表</span>
                <div class="card-actions">
                  <el-input
                    v-model="searchKeyword"
                    size="small"
                    placeholder="搜索用户名/邮箱"
                    clearable
                    @clear="applySearch"
                    @keyup.enter="applySearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" plain @click="loadAdmins" :loading="loadingAdmins" :icon="Refresh" size="small">
                    刷新
                  </el-button>
                </div>
              </div>
            </template>

            <div class="admin-list-body">
              <div v-if="loadingAdmins" class="list-loading">
                <el-skeleton :rows="3" animated />
              </div>
              <el-empty v-else-if="filteredAdmins.length === 0" description="暂无管理员数据">
                <el-button type="primary" plain @click="loadAdmins">刷新数据</el-button>
              </el-empty>
              <div v-else class="admin-list-scroll">
                <div class="admin-list-grid">
                  <div class="admin-card" v-for="admin in filteredAdmins" :key="admin.id || admin.username">
                    <div class="admin-card-header">
                      <div class="admin-identity">
                        <el-avatar :size="40" class="default-avatar">
                          <el-icon><User /></el-icon>
                        </el-avatar>
                        <div class="admin-info">
                          <div class="admin-name">{{ admin.username }}</div>
                          <div class="admin-email">{{ admin.email || '未填写邮箱' }}</div>
                        </div>
                      </div>
                      <div class="admin-tags">
                        <el-tag v-if="admin.role?.toLowerCase() === 'admin'" type="success" effect="plain">管理员</el-tag>
                        <el-tag v-if="admin.isBjzxAdmin" type="primary" effect="plain">边检智学管理员</el-tag>
                      </div>
                    </div>
                    <el-descriptions :column="1" size="small" class="admin-meta">
                      <el-descriptions-item label="创建时间">
                        {{ formatDate(admin.create_at || admin.created_at || admin.createAt) }}
                      </el-descriptions-item>
                      <el-descriptions-item label="账号状态">
                        <el-tag v-if="admin.status" size="small" type="info">{{ admin.status }}</el-tag>
                        <span v-else>正常</span>
                      </el-descriptions-item>
                    </el-descriptions>
                    <div class="admin-card-actions">
                      <el-button 
                        type="primary" 
                        plain 
                        size="small" 
                        :icon="Lock"
                        @click="openResetPasswordDialog(admin)"
                      >
                        重置密码
                      </el-button>
                      <el-popconfirm
                        title="确认降级为普通用户？"
                        confirm-button-text="确定"
                        cancel-button-text="取消"
                        icon-color="#E6A23C"
                        @confirm="handleDowngrade(admin)"
                      >
                        <template #reference>
                          <el-button type="warning" plain size="small" :icon="ArrowDownBold">
                            降级
                          </el-button>
                        </template>
                      </el-popconfirm>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>任意用户密码重置</span>
                <div class="card-actions">
                  <el-input
                    v-model="userResetKeyword"
                    size="small"
                    placeholder="搜索用户ID / 用户名 / 警号 / 邮箱"
                    clearable
                    @clear="applyUserResetSearch"
                    @keyup.enter="applyUserResetSearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" plain @click="loadAllUsers" :loading="loadingAllUsers" :icon="Refresh" size="small">
                    刷新
                  </el-button>
                </div>
              </div>
            </template>

            <el-alert
              title="超级管理员可直接为任意用户重置密码，请确认目标用户身份后再操作。"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 1rem"
            />

            <div v-if="loadingAllUsers" class="list-loading">
              <el-skeleton :rows="4" animated />
            </div>
            <el-empty v-else-if="filteredResetUsers.length === 0" description="暂无可操作用户">
              <el-button type="primary" plain @click="loadAllUsers">刷新数据</el-button>
            </el-empty>
            <el-table
              v-else
              :data="filteredResetUsers"
              border
              stripe
              size="small"
              max-height="360"
              class="user-reset-table"
            >
              <el-table-column prop="id" label="用户ID" min-width="120" show-overflow-tooltip />
              <el-table-column prop="username" label="用户名" min-width="140" show-overflow-tooltip />
              <el-table-column label="警号" min-width="120" show-overflow-tooltip>
                <template #default="scope">
                  {{ scope.row.policeId || scope.row.police_id || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="角色" width="120">
                <template #default="scope">
                  <el-tag :type="getUserRoleTagType(scope.row.role, scope.row.isBjzxAdmin)" size="small">
                    {{ getUserRoleText(scope.row.role, scope.row.isBjzxAdmin) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="getUserStatusTagType(scope.row.status)" size="small">
                    {{ getUserStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip>
                <template #default="scope">
                  {{ scope.row.email || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="scope">
                  <el-button
                    type="danger"
                    plain
                    size="small"
                    :icon="Lock"
                    @click="openResetPasswordDialog(scope.row)"
                  >
                    重置密码
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card class="card user-edit-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>用户信息修改</span>
                <div class="card-actions">
                  <el-input
                    v-model="userEditKeyword"
                    size="small"
                    placeholder="搜索用户ID / 用户名 / 警号 / 邮箱"
                    clearable
                    @clear="applyUserEditSearch"
                    @keyup.enter="applyUserEditSearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" plain @click="loadAllUsers" :loading="loadingAllUsers" :icon="Refresh" size="small">
                    刷新
                  </el-button>
                </div>
              </div>
            </template>

            <el-alert
              title="仅超级管理员可修改普通用户和普通管理员的基础信息，超级管理员账号不在此处展示。"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 1rem"
            />

            <div v-if="loadingAllUsers" class="list-loading">
              <el-skeleton :rows="4" animated />
            </div>
            <el-empty v-else-if="filteredEditableUsers.length === 0" description="暂无可修改用户">
              <el-button type="primary" plain @click="loadAllUsers">刷新数据</el-button>
            </el-empty>
            <el-table
              v-else
              :data="filteredEditableUsers"
              border
              stripe
              size="small"
              max-height="360"
              class="user-edit-table"
            >
              <el-table-column prop="id" label="用户ID" min-width="120" show-overflow-tooltip />
              <el-table-column prop="username" label="用户名" min-width="140" show-overflow-tooltip />
              <el-table-column label="角色" width="120">
                <template #default="scope">
                  <el-tag :type="getUserRoleTagType(scope.row.role)" size="small">
                    {{ getUserRoleText(scope.row.role) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="警号" min-width="120" show-overflow-tooltip>
                <template #default="scope">
                  {{ scope.row.policeId || scope.row.police_id || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="身份证号" min-width="170" show-overflow-tooltip>
                <template #default="scope">
                  <span v-if="scope.row.idCardNumber || scope.row.id_card_number">
                    {{ maskIdCard(scope.row.idCardNumber || scope.row.id_card_number) }}
                  </span>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="getUserStatusTagType(scope.row.status)" size="small">
                    {{ getUserStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip>
                <template #default="scope">
                  {{ scope.row.email || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="scope">
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    @click="openUserEditDrawer(scope.row)"
                  >
                    修改信息
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 提升用户为管理员 -->
          <el-card class="card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>提升用户为管理员</span>
                <el-tag type="warning" effect="plain">权限提升</el-tag>
              </div>
            </template>

            <el-alert
              title="提示"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 1rem"
            >
              输入现有普通用户的用户名，将其提升为管理员
            </el-alert>

            <el-form
              ref="upgradeFormRef"
              :model="upgradeForm"
              :rules="upgradeRules"
              label-width="100px"
              status-icon
            >
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="upgradeForm.username" 
                  placeholder="请输入要提升的用户名"
                  clearable
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-space>
                  <el-button 
                    type="success" 
                    @click="handleUpgrade" 
                    :loading="upgrading"
                    icon="Top"
                  >
                    提升为管理员
                  </el-button>
                  <el-button 
                    @click="resetUpgradeForm" 
                    :disabled="upgrading"
                  >
                    重置
                  </el-button>
                </el-space>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 提升用户为边检智学管理员 -->
          <el-card class="card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>提升用户为边检智学管理员</span>
                <el-tag type="success" effect="plain">权限提升</el-tag>
              </div>
            </template>

            <el-alert
              title="提示"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 1rem"
            >
              输入现有用户的用户名，将其设置为边检智学管理员（可访问边检智学相关功能）
            </el-alert>

            <el-form
              ref="bjzxUpgradeFormRef"
              :model="bjzxUpgradeForm"
              :rules="bjzxUpgradeRules"
              label-width="100px"
              status-icon
            >
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="bjzxUpgradeForm.username" 
                  placeholder="请输入要提升的用户名"
                  clearable
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-space>
                  <el-button 
                    type="success" 
                    @click="handleBjzxUpgrade" 
                    :loading="bjzxUpgrading"
                    icon="Top"
                  >
                    设为边检智学管理员
                  </el-button>
                  <el-button 
                    @click="resetBjzxUpgradeForm" 
                    :disabled="bjzxUpgrading"
                  >
                    重置
                  </el-button>
                </el-space>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- IP黑名单管理 -->
          <el-card class="card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>IP黑名单管理</span>
                <div class="card-actions">
                  <el-button type="primary" plain size="small" :icon="Refresh" :loading="loadingIpBlacklist" @click="loadIpBlacklist">
                    刷新
                  </el-button>
                </div>
              </div>
            </template>

            <el-alert
              title="用于阻止指定IP访问系统（支持IPv4 / IPv6 / CIDR）"
              type="warning"
              :closable="false"
              show-icon
              style="margin-bottom: 1rem"
            />

            <el-form :model="ipBlacklistForm" label-width="80px" class="ip-blacklist-form">
              <el-form-item label="IP地址" class="ip-form-item">
                <el-input
                  v-model="ipBlacklistForm.ip"
                  placeholder="例如：53.21.18.98 或 53.21.16.0/22"
                  clearable
                />
              </el-form-item>
              <el-form-item label="备注" class="ip-form-item ip-remark-item">
                <el-input
                  v-model="ipBlacklistForm.remark"
                  placeholder="例如：异常流量来源 / 非授权出口地址"
                  clearable
                />
              </el-form-item>
              <el-form-item>
                <el-space>
                  <el-button type="danger" :icon="CirclePlus" :loading="addingIpBlacklist" @click="handleAddIpBlacklist">
                    加入黑名单
                  </el-button>
                  <el-button :disabled="addingIpBlacklist" @click="resetIpBlacklistForm">
                    清空
                  </el-button>
                </el-space>
              </el-form-item>
            </el-form>

            <el-table
              :data="ipBlacklist"
              border
              size="small"
              stripe
              v-loading="loadingIpBlacklist"
              empty-text="暂无黑名单记录"
            >
              <el-table-column prop="ip" label="IP/CIDR" min-width="180" />
              <el-table-column label="备注" min-width="220">
                <template #default="scope">
                  {{ scope.row.remark || scope.row.reason || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="创建时间" min-width="170">
                <template #default="scope">
                  {{ formatDate(scope.row.created_at || scope.row.createdAt || scope.row.updated_at) || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="操作人" min-width="120">
                <template #default="scope">
                  {{ scope.row.operator || scope.row.created_by || scope.row.updated_by || '—' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="scope">
                  <el-button
                    type="danger"
                    plain
                    size="small"
                    :icon="Delete"
                    :loading="deletingIpIdentifier === (scope.row.id || scope.row.ip)"
                    @click="handleRemoveIpBlacklist(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <backup-manage-panel />
        </el-col>

        <el-col :xs="24" :md="8">
          <el-card class="card quick-tips" shadow="never">
            <template #header>
              <div class="card-header">
                <span>安全提示</span>
              </div>
            </template>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="权限范围">仅限超级管理员访问</el-descriptions-item>
              <el-descriptions-item label="角色赋予">后端强制设置为 ADMIN</el-descriptions-item>
              <el-descriptions-item label="密码策略">建议配置 12 位以上复杂密码</el-descriptions-item>
            </el-descriptions>
            <el-divider content-position="left">操作流程</el-divider>
            <el-timeline>
              <el-timeline-item type="primary" :timestamp="'Step 1'">
                填写管理员基本信息（用户名 / 警号 / 身份证号 / 邮箱 / 初始密码）
              </el-timeline-item>
              <el-timeline-item type="success" :timestamp="'Step 2'">
                提交创建，系统校验并调用后端接口
              </el-timeline-item>
              <el-timeline-item type="warning" :timestamp="'Step 3'">
                通知新管理员登录并在个人设置中修改密码
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>运维建议</span>
          </div>
        </template>
        <ul class="instruction-list">
          <li>建议定期盘点管理员账号，并撤销离职或不再需要的账号。</li>
          <li>搭配后台审计日志功能，确保敏感操作可追溯。</li>
          <li>如需停用管理员账号，请联系后端或数据库维护人员。</li>
        </ul>
      </el-card>
    </div>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置用户密码"
      width="500px"
      :close-on-click-modal="false"
      @close="handleResetDialogClose"
    >
      <el-alert
        title="安全提示"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 1.5rem"
      >
        重置后请立即通过安全渠道通知目标用户修改密码
      </el-alert>
      
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
        status-icon
      >
        <el-form-item label="目标用户">
          <el-input :value="currentResetAdmin?.username" disabled>
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input :value="currentResetAdmin?.id || '—'" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码（至少6位）"
            autocomplete="new-password"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
            autocomplete="new-password"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-space>
          <el-button @click="resetPasswordDialogVisible = false" :disabled="resettingPassword">
            取消
          </el-button>
          <el-button type="primary" @click="handleResetPassword" :loading="resettingPassword">
            确认重置
          </el-button>
        </el-space>
      </template>
    </el-dialog>

    <el-drawer
      v-model="editingUserDrawerVisible"
      title="修改用户信息"
      size="520px"
      :close-on-click-modal="false"
      @close="handleEditDrawerClose"
    >
      <template v-if="selectedEditableUser">
        <div class="edit-user-summary">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="用户ID">
              {{ selectedEditableUser.id || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前用户名">
              {{ selectedEditableUser.username || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前角色">
              <el-tag :type="getUserRoleTagType(selectedEditableUser.role)" size="small">
                {{ getUserRoleText(selectedEditableUser.role) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前警号">
              {{ selectedEditableUser.policeId || selectedEditableUser.police_id || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前身份证号">
              {{ selectedEditableUser.idCardNumber || selectedEditableUser.id_card_number || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前邮箱">
              {{ selectedEditableUser.email || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getUserStatusTagType(selectedEditableUser.status)" size="small">
                {{ getUserStatusText(selectedEditableUser.status) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-alert
          title="三个字段独立提交，保存成功后会同步刷新用户列表。"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 1rem"
        />

        <el-form
          ref="userEditFormRef"
          :model="userEditForm"
          :rules="userEditRules"
          label-width="96px"
          status-icon
        >
          <div class="edit-user-section">
            <div class="edit-user-section__title">修改用户名</div>
            <el-form-item label="新用户名" prop="newUsername">
              <el-input
                v-model="userEditForm.newUsername"
                placeholder="请输入新用户名"
                clearable
              />
            </el-form-item>
            <div class="edit-user-actions">
              <el-button
                type="primary"
                @click="handleUpdateUsername"
                :loading="userEditSubmitting.username"
              >
                保存用户名
              </el-button>
            </div>
          </div>

          <div class="edit-user-section">
            <div class="edit-user-section__title">修改身份证号</div>
            <el-form-item label="新身份证号" prop="newIdCardNumber">
              <el-input
                v-model="userEditForm.newIdCardNumber"
                maxlength="18"
                placeholder="请输入新身份证号"
                clearable
              />
            </el-form-item>
            <div class="edit-user-actions">
              <el-button
                type="primary"
                @click="handleUpdateIdCardNumber"
                :loading="userEditSubmitting.idCardNumber"
              >
                保存身份证号
              </el-button>
            </div>
          </div>

          <div class="edit-user-section">
            <div class="edit-user-section__title">修改警号</div>
            <el-form-item label="新警号" prop="newPoliceId">
              <el-input
                v-model="userEditForm.newPoliceId"
                placeholder="请输入新警号"
                clearable
              />
            </el-form-item>
            <div class="edit-user-actions">
              <el-button
                type="primary"
                @click="handleUpdatePoliceId"
                :loading="userEditSubmitting.policeId"
              >
                保存警号
              </el-button>
            </div>
          </div>
        </el-form>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CirclePlus, RefreshRight, User, Message, Lock, ArrowDownBold, Refresh, Search, Postcard, CreditCard, Top, Delete } from '@element-plus/icons-vue'
import { API_ENDPOINTS } from '@/config/api/api'
import { fetchWithAuth, getApiUrl } from '@/utils/request'
import BackupManagePanel from '@/components/super-admin/BackupManagePanel.vue'

interface CreateAdminPayload {
  username: string
  policeId: string
  idCardNumber: string
  email: string
  password: string
}

interface AdminUser {
  id?: string | number
  username: string
  policeId?: string
  police_id?: string
  idCardNumber?: string
  id_card_number?: string
  email?: string
  role?: string
  created_at?: string
  create_at?: string
  createAt?: string
  status?: string | number
  isBjzxAdmin?: boolean
}

interface IpBlacklistItem {
  id?: string | number
  ip: string
  remark?: string
  reason?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  operator?: string
  created_by?: string
  updated_by?: string
}

interface UserEditForm {
  newUsername: string
  newIdCardNumber: string
  newPoliceId: string
}

type EditableTargetUser = AdminUser & {
  id: string | number
}

export default defineComponent({
  name: 'SuperAdminView',
  components: {
    BackupManagePanel
  },
  setup() {
    const form = reactive<CreateAdminPayload>({
      username: '',
      policeId: '',
      idCardNumber: '',
      email: '',
      password: ''
    })

    const creating = ref(false)
    const formRef = ref<FormInstance>()
    const lastCreated = ref<{ username: string; email: string }>({ username: '', email: '' })
    const adminList = ref<AdminUser[]>([])
    const loadingAdmins = ref(false)
    const searchKeyword = ref('')
    const allUsers = ref<AdminUser[]>([])
    const loadingAllUsers = ref(false)
    const userResetKeyword = ref('')
    const userEditKeyword = ref('')
    const pendingUsers = ref<AdminUser[]>([])
    const loadingPending = ref(false)
    const approvalLoadingId = ref<string | null>(null)
    const rejectLoadingId = ref<string | null>(null)

    // 重置密码相关状态
    const resetPasswordDialogVisible = ref(false)
    const resetPasswordFormRef = ref<FormInstance>()
    const currentResetAdmin = ref<AdminUser | null>(null)
    const resettingPassword = ref(false)
    const resetPasswordForm = reactive({
      newPassword: '',
      confirmPassword: ''
    })
    const editingUserDrawerVisible = ref(false)
    const userEditFormRef = ref<FormInstance>()
    const selectedEditableUser = ref<AdminUser | null>(null)
    const userEditSubmitting = reactive({
      username: false,
      idCardNumber: false,
      policeId: false
    })
    const userEditForm = reactive<UserEditForm>({
      newUsername: '',
      newIdCardNumber: '',
      newPoliceId: ''
    })

    // 提升用户相关状态
    const upgradeFormRef = ref<FormInstance>()
    const upgrading = ref(false)
    const upgradeForm = reactive({
      username: ''
    })

    // 提升用户为边检智学管理员相关状态
    const bjzxUpgradeFormRef = ref<FormInstance>()
    const bjzxUpgrading = ref(false)
    const bjzxUpgradeForm = reactive({
      username: ''
    })

    const ipBlacklist = ref<IpBlacklistItem[]>([])
    const loadingIpBlacklist = ref(false)
    const addingIpBlacklist = ref(false)
    const deletingIpIdentifier = ref<string | number | null>(null)
    const ipBlacklistForm = reactive({
      ip: '',
      remark: ''
    })

    const rules = reactive<FormRules<CreateAdminPayload>>({
      username: [
        { required: true, message: '请输入管理员用户名', trigger: 'blur' },
        { min: 3, message: '用户名至少 3 个字符', trigger: 'blur' }
      ],
      policeId: [
        { required: true, message: '请输入警号', trigger: 'blur' },
        { pattern: /^[0-9]+$/, message: '警号只能包含数字', trigger: 'blur' }
      ],
      idCardNumber: [
        { required: true, message: '请输入身份证号', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
            if (!idCardRegex.test(value)) {
              callback(new Error('身份证号格式不正确'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      email: [
        {
          validator: (_rule, value, callback) => {
            if (!value) {
              callback()
              return
            }
            const emailRegex = /^[\w-.]+@[\w-]+\.[A-Za-z]{2,}$/
            if (!emailRegex.test(value)) {
              callback(new Error('邮箱格式不正确'))
            } else {
              callback()
            }
          },
          trigger: ['blur', 'change']
        }
      ],
      password: [
        { required: true, message: '请输入初始密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' }
      ]
    })

    const resetPasswordRules = reactive<FormRules>({
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            if (value !== resetPasswordForm.newPassword) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    })

    const userEditRules = reactive<FormRules<UserEditForm>>({
      newUsername: [
        { required: true, message: '请输入新用户名', trigger: 'blur' }
      ],
      newIdCardNumber: [
        { required: true, message: '请输入新身份证号', trigger: 'blur' },
        {
          validator: (_rule, value, callback) => {
            const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
            if (!idCardRegex.test(value)) {
              callback(new Error('身份证号格式不正确'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      newPoliceId: [
        { required: true, message: '请输入新警号', trigger: 'blur' },
        { pattern: /^[0-9]+$/, message: '警号只能包含数字', trigger: 'blur' }
      ]
    })

    const upgradeRules = reactive<FormRules>({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, message: '用户名至少 2 个字符', trigger: 'blur' }
      ]
    })

    const bjzxUpgradeRules = reactive<FormRules>({
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, message: '用户名至少 2 个字符', trigger: 'blur' }
      ]
    })

    const resetForm = () => {
      formRef.value?.resetFields()
    }

    const handleCreate = async () => {
      if (!formRef.value) return
      const valid = await formRef.value.validate().catch(() => false)
      if (!valid) return
      creating.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.CREATE_ADMIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            policeId: form.policeId,
            idCardNumber: form.idCardNumber,
            email: form.email,
            password: form.password
          })
        })

        if (response.ok && response.data.code === 200) {
          lastCreated.value = {
            username: form.username,
            email: form.email
          }
          ElMessage.success('管理员创建成功')
          resetForm()
          loadAdmins()
        } else {
          const message = response.data?.message || response.data?.detail || '创建失败，请稍后重试'
          ElMessage.error(message)
          console.error('创建管理员失败:', response.data)
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '创建失败，请稍后重试')
      } finally {
        creating.value = false
      }
    }

    const loadAdmins = async () => {
      loadingAdmins.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.LIST_ADMINS))
        if (response.ok) {
          const dataSource = response.data?.data?.list || response.data?.data?.admins || response.data || []
          adminList.value = Array.isArray(dataSource) ? dataSource : (dataSource.items || [])
        } else {
          throw new Error(response.data?.message || '加载管理员列表失败')
        }
      } catch (error: any) {
        adminList.value = []
        ElMessage.error(error?.message || '加载管理员列表失败')
      } finally {
        loadingAdmins.value = false
      }
    }

    const loadAllUsers = async () => {
      loadingAllUsers.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_LIST))
        if (response.ok) {
          const raw = response.data?.data?.list || response.data?.data?.users || response.data || []
          const list = Array.isArray(raw) ? raw : (raw.items || [])
          allUsers.value = list
          if (selectedEditableUser.value?.id !== undefined) {
            const latestSelectedUser = list.find((user: AdminUser) => String(user.id ?? '') === String(selectedEditableUser.value?.id ?? ''))
            if (latestSelectedUser) {
              selectedEditableUser.value = { ...latestSelectedUser }
            }
          }
        } else {
          throw new Error(response.data?.message || '加载用户列表失败')
        }
      } catch (error: any) {
        allUsers.value = []
        ElMessage.error(error?.message || '加载用户列表失败')
      } finally {
        loadingAllUsers.value = false
      }
    }

    const handleDowngrade = async (admin: AdminUser) => {
      try {
        await ElMessageBox.confirm(
          `确定要将管理员【${admin.username}】降级为普通用户吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )

        const payload = {
          id: admin.id,
          username: admin.username
        }

        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.DOWNGRADE_ADMIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (response.ok && response.data?.code === 200) {
          ElMessage.success('降级成功')
          loadAdmins()
        } else {
          throw new Error(response.data?.message || '降级失败，请稍后重试')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '降级失败，请稍后重试')
      }
    }

    const filteredAdmins = computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return adminList.value
      return adminList.value.filter((admin) => {
        const username = admin.username?.toLowerCase() || ''
        const email = admin.email?.toLowerCase() || ''
        return username.includes(keyword) || email.includes(keyword)
      })
    })

    const filteredResetUsers = computed(() => {
      const keyword = userResetKeyword.value.trim().toLowerCase()
      if (!keyword) return allUsers.value
      return allUsers.value.filter((user) => {
        const id = String(user.id || '').toLowerCase()
        const username = user.username?.toLowerCase() || ''
        const policeId = String(user.policeId || user.police_id || '').toLowerCase()
        const email = user.email?.toLowerCase() || ''
        return id.includes(keyword) || username.includes(keyword) || policeId.includes(keyword) || email.includes(keyword)
      })
    })

    const normalizeRole = (role?: string) => String(role || '').toLowerCase()

    const isEditableUser = (user: AdminUser) => {
      const role = normalizeRole(user.role)
      return role === 'user' || role === 'admin'
    }

    const editableUsers = computed(() => allUsers.value.filter((user) => isEditableUser(user)))

    const filteredEditableUsers = computed(() => {
      const keyword = userEditKeyword.value.trim().toLowerCase()
      if (!keyword) return editableUsers.value
      return editableUsers.value.filter((user) => {
        const id = String(user.id || '').toLowerCase()
        const username = user.username?.toLowerCase() || ''
        const policeId = String(user.policeId || user.police_id || '').toLowerCase()
        const email = user.email?.toLowerCase() || ''
        return id.includes(keyword) || username.includes(keyword) || policeId.includes(keyword) || email.includes(keyword)
      })
    })

    const applySearch = () => {
      searchKeyword.value = searchKeyword.value.trim()
    }

    const applyUserResetSearch = () => {
      userResetKeyword.value = userResetKeyword.value.trim()
    }

    const applyUserEditSearch = () => {
      userEditKeyword.value = userEditKeyword.value.trim()
    }

    const loadPendingUsers = async () => {
      loadingPending.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.PENDING_USERS))
        if (response.ok) {
          // 支持新的 API 格式: { success: true, code: 200, message: "...", data: { list: [...] } }
          const raw = response.data?.data?.list || response.data?.list || response.data?.users || response.data || []
          const list = Array.isArray(raw) ? raw : (raw.items || [])
          pendingUsers.value = list
        } else {
          throw new Error(response.data?.message || '加载待审核用户列表失败')
        }
      } catch (error: any) {
        pendingUsers.value = []
        ElMessage.error(error?.message || '加载待审核用户列表失败')
      } finally {
        loadingPending.value = false
      }
    }

    const approveUser = async (user: AdminUser) => {
      approvalLoadingId.value = String(user.id ?? user.username)
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.APPROVE_USER), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('账号已批准')
          await loadPendingUsers()
        } else {
          throw new Error(response.data?.message || '批准失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '批准失败，请稍后重试')
      } finally {
        approvalLoadingId.value = null
      }
    }

    const rejectUser = async (user: AdminUser) => {
      try {
        await ElMessageBox.confirm(
          `确定要拒绝用户【${user.username}】的注册申请吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )
        rejectLoadingId.value = String(user.id ?? user.username)
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.REJECT_USER), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('已拒绝该用户的注册申请')
          await loadPendingUsers()
        } else {
          throw new Error(response.data?.message || '拒绝失败，请稍后重试')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '拒绝失败，请稍后重试')
      } finally {
        rejectLoadingId.value = null
      }
    }

    const openResetPasswordDialog = (admin: AdminUser) => {
      currentResetAdmin.value = admin
      resetPasswordForm.newPassword = ''
      resetPasswordForm.confirmPassword = ''
      resetPasswordDialogVisible.value = true
      // 清除之前的验证错误
      setTimeout(() => {
        resetPasswordFormRef.value?.clearValidate()
      }, 0)
    }

    const handleResetDialogClose = () => {
      resetPasswordForm.newPassword = ''
      resetPasswordForm.confirmPassword = ''
      currentResetAdmin.value = null
      resetPasswordFormRef.value?.clearValidate()
    }

    const handleResetPassword = async () => {
      if (!resetPasswordFormRef.value || !currentResetAdmin.value) return
      if (!currentResetAdmin.value.id) {
        ElMessage.error('目标用户缺少用户ID，无法重置密码')
        return
      }
      
      const valid = await resetPasswordFormRef.value.validate().catch(() => false)
      if (!valid) return

      resettingPassword.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.RESET_ADMIN_PASSWORD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentResetAdmin.value.id,
            newPassword: resetPasswordForm.newPassword
          })
        })

        if (response.ok && response.data?.code === 200) {
          ElMessage.success(`已成功重置用户【${currentResetAdmin.value.username}】的密码`)
          resetPasswordDialogVisible.value = false
          handleResetDialogClose()
        } else {
          throw new Error(response.data?.message || '重置密码失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '重置密码失败，请稍后重试')
      } finally {
        resettingPassword.value = false
      }
    }

    const resetUserEditForm = () => {
      userEditForm.newUsername = ''
      userEditForm.newIdCardNumber = ''
      userEditForm.newPoliceId = ''
    }

    const openUserEditDrawer = (user: AdminUser) => {
      if (!isEditableUser(user)) {
        ElMessage.warning('超级管理员账号不支持在此处修改')
        return
      }
      selectedEditableUser.value = { ...user }
      userEditForm.newUsername = user.username || ''
      userEditForm.newIdCardNumber = user.idCardNumber || user.id_card_number || ''
      userEditForm.newPoliceId = user.policeId || user.police_id || ''
      editingUserDrawerVisible.value = true
      setTimeout(() => {
        userEditFormRef.value?.clearValidate()
      }, 0)
    }

    const handleEditDrawerClose = () => {
      selectedEditableUser.value = null
      resetUserEditForm()
      userEditFormRef.value?.clearValidate()
    }

    const validateUserEditField = async (field: keyof UserEditForm) => {
      if (!userEditFormRef.value) return true
      return userEditFormRef.value.validateField(field).then(() => true).catch(() => false)
    }

    const getEditableUserTarget = (): EditableTargetUser | null => {
      if (!selectedEditableUser.value) {
        ElMessage.warning('请先选择目标用户')
        return null
      }
      if (selectedEditableUser.value.id === undefined || selectedEditableUser.value.id === null || selectedEditableUser.value.id === '') {
        ElMessage.error('目标用户缺少用户ID，无法提交修改')
        return null
      }
      if (!isEditableUser(selectedEditableUser.value)) {
        ElMessage.error('超级管理员账号不支持在此处修改')
        return null
      }
      return selectedEditableUser.value as EditableTargetUser
    }

    const syncEditedUserField = (userId: string | number, patch: Partial<AdminUser>) => {
      allUsers.value = allUsers.value.map((user) => (
        String(user.id ?? '') === String(userId) ? { ...user, ...patch } : user
      ))

      if (selectedEditableUser.value && String(selectedEditableUser.value.id ?? '') === String(userId)) {
        selectedEditableUser.value = {
          ...selectedEditableUser.value,
          ...patch
        }
      }
    }

    const handleUpdateUsername = async () => {
      const target = getEditableUserTarget()
      if (!target) return

      const isValid = await validateUserEditField('newUsername')
      if (!isValid) return

      const newUsername = userEditForm.newUsername.trim()
      if (newUsername === target.username) {
        ElMessage.warning('用户名未发生变化')
        return
      }

      userEditSubmitting.username = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.UPDATE_USERNAME), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: target.id,
            newUsername
          })
        })

        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          syncEditedUserField(target.id, { username: newUsername })
          userEditForm.newUsername = newUsername
          ElMessage.success('用户名修改成功')
          await loadAllUsers()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '用户名修改失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '用户名修改失败，请稍后重试')
      } finally {
        userEditSubmitting.username = false
      }
    }

    const handleUpdateIdCardNumber = async () => {
      const target = getEditableUserTarget()
      if (!target) return

      const isValid = await validateUserEditField('newIdCardNumber')
      if (!isValid) return

      const currentIdCardNumber = target.idCardNumber || target.id_card_number || ''
      const newIdCardNumber = userEditForm.newIdCardNumber.trim()
      if (newIdCardNumber === currentIdCardNumber) {
        ElMessage.warning('身份证号未发生变化')
        return
      }

      userEditSubmitting.idCardNumber = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.UPDATE_ID_CARD_NUMBER), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: target.id,
            newIdCardNumber
          })
        })

        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          syncEditedUserField(target.id, {
            idCardNumber: newIdCardNumber,
            id_card_number: newIdCardNumber
          })
          userEditForm.newIdCardNumber = newIdCardNumber
          ElMessage.success('身份证号修改成功')
          await loadAllUsers()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '身份证号修改失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '身份证号修改失败，请稍后重试')
      } finally {
        userEditSubmitting.idCardNumber = false
      }
    }

    const handleUpdatePoliceId = async () => {
      const target = getEditableUserTarget()
      if (!target) return

      const isValid = await validateUserEditField('newPoliceId')
      if (!isValid) return

      const currentPoliceId = target.policeId || target.police_id || ''
      const newPoliceId = userEditForm.newPoliceId.trim()
      if (newPoliceId === currentPoliceId) {
        ElMessage.warning('警号未发生变化')
        return
      }

      userEditSubmitting.policeId = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.UPDATE_POLICE_ID), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: target.id,
            newPoliceId
          })
        })

        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          syncEditedUserField(target.id, {
            policeId: newPoliceId,
            police_id: newPoliceId
          })
          userEditForm.newPoliceId = newPoliceId
          ElMessage.success('警号修改成功')
          await loadAllUsers()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '警号修改失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '警号修改失败，请稍后重试')
      } finally {
        userEditSubmitting.policeId = false
      }
    }

    const resetUpgradeForm = () => {
      upgradeFormRef.value?.resetFields()
    }

    const resetBjzxUpgradeForm = () => {
      bjzxUpgradeFormRef.value?.resetFields()
    }

    const normalizeIpBlacklistItems = (raw: any): IpBlacklistItem[] => {
      if (Array.isArray(raw)) {
        return raw as IpBlacklistItem[]
      }
      if (raw && Array.isArray(raw.items)) {
        return raw.items as IpBlacklistItem[]
      }
      if (raw && Array.isArray(raw.list)) {
        return raw.list as IpBlacklistItem[]
      }
      if (raw && typeof raw === 'object') {
        return Object.entries(raw as Record<string, unknown>).map(([ip, item]) => {
          if (item && typeof item === 'object') {
            const source = item as Record<string, unknown>
            const normalized: IpBlacklistItem = {
              ip: String(source.ip ?? ip).trim()
            }
            if (source.id !== undefined) normalized.id = source.id as string | number
            if (source.remark !== undefined) normalized.remark = String(source.remark)
            if (source.reason !== undefined) normalized.reason = String(source.reason)
            if (source.created_at !== undefined) normalized.created_at = String(source.created_at)
            if (source.createdAt !== undefined) normalized.createdAt = String(source.createdAt)
            if (source.updated_at !== undefined) normalized.updated_at = String(source.updated_at)
            if (source.operator !== undefined) normalized.operator = String(source.operator)
            if (source.created_by !== undefined) normalized.created_by = String(source.created_by)
            if (source.updated_by !== undefined) normalized.updated_by = String(source.updated_by)
            return {
              ...normalized
            }
          }
          return {
            ip,
            remark: String(item ?? '').trim()
          }
        })
      }
      return []
    }

    const loadIpBlacklist = async () => {
      loadingIpBlacklist.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.IP_BLACKLIST_LIST))
        const bizCode = Number(response.data?.code)
        const isBizOk = response.ok
          && response.data?.success !== false
          && (Number.isNaN(bizCode) || bizCode === 200)
        if (!isBizOk) {
          throw new Error(response.data?.message || '加载IP黑名单失败')
        }
        const payload = response.data?.data?.list
          || response.data?.data?.items
          || response.data?.data
          || response.data?.list
          || response.data
          || []
        const list = normalizeIpBlacklistItems(payload)
          .map((item) => ({ ...item, ip: String(item.ip || '').trim() }))
          .filter((item) => item.ip)
        ipBlacklist.value = list
      } catch (error: any) {
        ipBlacklist.value = []
        ElMessage.error(error?.message || '加载IP黑名单失败')
      } finally {
        loadingIpBlacklist.value = false
      }
    }

    const resetIpBlacklistForm = () => {
      ipBlacklistForm.ip = ''
      ipBlacklistForm.remark = ''
    }

    const isValidIpValue = (value: string) => {
      const ip = value.trim()
      if (!ip) return false

      const ipv4Seg = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)'
      const ipv4 = new RegExp(`^(?:${ipv4Seg}\\.){3}${ipv4Seg}$`)
      const ipv4Cidr = new RegExp(`^(?:${ipv4Seg}\\.){3}${ipv4Seg}\\/(?:3[0-2]|[12]?\\d)$`)
      const hasColon = ip.includes(':')
      const ipv6 = hasColon && /^[0-9a-fA-F:]+$/.test(ip)
      const ipv6Cidr = hasColon && /^[0-9a-fA-F:]+\/(?:12[0-8]|1[01]\d|[1-9]?\d)$/.test(ip)
      return ipv4.test(ip) || ipv4Cidr.test(ip) || ipv6 || ipv6Cidr
    }

    const handleAddIpBlacklist = async () => {
      const ip = ipBlacklistForm.ip.trim()
      const remark = ipBlacklistForm.remark.trim()
      if (!ip) {
        ElMessage.warning('请输入IP地址')
        return
      }
      if (!isValidIpValue(ip)) {
        ElMessage.warning('IP格式不正确，请输入合法的IPv4/IPv6/CIDR')
        return
      }
      if (ipBlacklist.value.some((item) => item.ip === ip)) {
        ElMessage.warning('该IP已在黑名单中')
        return
      }

      addingIpBlacklist.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.IP_BLACKLIST_ADD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip, remark })
        })
        if (response.ok && (response.data?.success || response.data?.code === 200 || response.status === 204)) {
          ElMessage.success('IP已加入黑名单')
          resetIpBlacklistForm()
          await loadIpBlacklist()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '新增IP黑名单失败')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '新增IP黑名单失败')
      } finally {
        addingIpBlacklist.value = false
      }
    }

    const handleRemoveIpBlacklist = async (item: IpBlacklistItem) => {
      const identifier = item.id || item.ip
      if (!identifier) return
      try {
        await ElMessageBox.confirm(
          `确定要移除黑名单IP【${item.ip}】吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )
        deletingIpIdentifier.value = identifier
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.IP_BLACKLIST_DELETE(identifier)), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, ip: item.ip })
        })
        if (response.ok && (response.data?.success || response.data?.code === 200 || response.status === 204)) {
          ElMessage.success('已移除IP黑名单')
          await loadIpBlacklist()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '删除IP黑名单失败')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '删除IP黑名单失败')
      } finally {
        deletingIpIdentifier.value = null
      }
    }

    const handleBjzxUpgrade = async () => {
      if (!bjzxUpgradeFormRef.value) return
      const valid = await bjzxUpgradeFormRef.value.validate().catch(() => false)
      if (!valid) return

      try {
        await ElMessageBox.confirm(
          `确定要将用户【${bjzxUpgradeForm.username}】设置为边检智学管理员吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )

        bjzxUpgrading.value = true
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.SET_BJZX_ADMIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: bjzxUpgradeForm.username,
            isBjzxAdmin: true
          })
        })

        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success(`已成功将用户【${bjzxUpgradeForm.username}】设置为边检智学管理员`)
          resetBjzxUpgradeForm()
          loadAdmins()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '设置失败，请稍后重试')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '设置失败，请稍后重试')
      } finally {
        bjzxUpgrading.value = false
      }
    }

    const handleUpgrade = async () => {
      if (!upgradeFormRef.value) return
      const valid = await upgradeFormRef.value.validate().catch(() => false)
      if (!valid) return

      try {
        await ElMessageBox.confirm(
          `确定要将用户【${upgradeForm.username}】提升为管理员吗？`,
          '确认操作',
          {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )

        upgrading.value = true
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.SUPER_ADMIN.UPGRADE_ADMIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: upgradeForm.username
          })
        })

        if (response.ok && response.data?.code === 200) {
          ElMessage.success(`已成功将用户【${upgradeForm.username}】提升为管理员`)
          resetUpgradeForm()
          loadAdmins()
        } else {
          throw new Error(response.data?.message || response.data?.detail || '提升失败，请稍后重试')
        }
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.message || '提升失败，请稍后重试')
      } finally {
        upgrading.value = false
      }
    }

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '—'
      try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
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

    const maskIdCard = (idCard: string) => {
      if (!idCard || idCard.length < 8) return idCard
      return idCard.slice(0, 6) + '********' + idCard.slice(-4)
    }

    const getUserRoleText = (role?: string, isBjzxAdmin?: boolean) => {
      const normalized = normalizeRole(role)
      if (normalized === 'super_admin') return '超级管理员'
      if (normalized === 'admin') return '管理员'
      if (isBjzxAdmin) return '边检智学管理员'
      return '普通用户'
    }

    const getUserRoleTagType = (role?: string, isBjzxAdmin?: boolean) => {
      const normalized = normalizeRole(role)
      if (normalized === 'super_admin') return 'danger'
      if (normalized === 'admin') return 'success'
      if (isBjzxAdmin) return 'warning'
      return 'info'
    }

    const getUserStatusText = (status?: string | number) => {
      const normalized = String(status ?? '')
      if (normalized === '1') return '正常'
      if (normalized === '0') return '待审核'
      if (normalized === '-1') return '已封禁'
      if (normalized === '-2') return '已拒绝'
      return normalized || '未知'
    }

    const getUserStatusTagType = (status?: string | number) => {
      const normalized = String(status ?? '')
      if (normalized === '1') return 'success'
      if (normalized === '0') return 'warning'
      if (normalized === '-1') return 'danger'
      if (normalized === '-2') return 'info'
      return 'info'
    }

    onMounted(() => {
      loadAdmins()
      loadAllUsers()
      loadPendingUsers()
      loadIpBlacklist()
    })

    return {
      form,
      creating,
      formRef,
      rules,
      lastCreated,
      adminList,
      loadingAdmins,
      searchKeyword,
      allUsers,
      loadingAllUsers,
      userResetKeyword,
      userEditKeyword,
      filteredAdmins,
      filteredResetUsers,
      editableUsers,
      filteredEditableUsers,
      pendingUsers,
      loadingPending,
      approvalLoadingId,
      rejectLoadingId,
      resetPasswordDialogVisible,
      resetPasswordFormRef,
      resetPasswordForm,
      resetPasswordRules,
      currentResetAdmin,
      resettingPassword,
      editingUserDrawerVisible,
      userEditFormRef,
      selectedEditableUser,
      userEditSubmitting,
      userEditForm,
      userEditRules,
      upgradeFormRef,
      upgradeForm,
      upgradeRules,
      upgrading,
      CirclePlus,
      RefreshRight,
      User,
      Message,
      Lock,
      ArrowDownBold,
      Refresh,
      Search,
      Postcard,
      CreditCard,
      Top,
      Delete,
      handleCreate,
      resetForm,
      loadAdmins,
      loadAllUsers,
      handleDowngrade,
      applySearch,
      applyUserResetSearch,
      applyUserEditSearch,
      loadPendingUsers,
      approveUser,
      rejectUser,
      openResetPasswordDialog,
      handleResetDialogClose,
      handleResetPassword,
      openUserEditDrawer,
      handleEditDrawerClose,
      handleUpdateUsername,
      handleUpdateIdCardNumber,
      handleUpdatePoliceId,
      handleUpgrade,
      resetUpgradeForm,
      formatDate,
      maskIdCard,
      normalizeRole,
      isEditableUser,
      getUserRoleText,
      getUserRoleTagType,
      getUserStatusText,
      getUserStatusTagType,
      ipBlacklist,
      loadingIpBlacklist,
      addingIpBlacklist,
      deletingIpIdentifier,
      ipBlacklistForm,
      loadIpBlacklist,
      resetIpBlacklistForm,
      handleAddIpBlacklist,
      handleRemoveIpBlacklist,
      // 边检智学管理员相关
      bjzxUpgradeFormRef,
      bjzxUpgradeForm,
      bjzxUpgradeRules,
      bjzxUpgrading,
      handleBjzxUpgrade,
      resetBjzxUpgradeForm
    }
  }
})
</script>

<style scoped>
.super-admin-page {
  min-height: calc(100vh - 60px);
  background: url('@/assets/allPic/public/userInfo.png') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 2rem 0;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.page-header h1 {
  margin: 0;
  color: #1f2937;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.header-alert {
  margin-top: 1rem;
}

.card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-actions :deep(.el-input__wrapper) {
  background-color: #f9fafb;
  box-shadow: none;
}

.instruction-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #4b5563;
}

.instruction-list code {
  background: #fef3c7;
  padding: 0 4px;
  border-radius: 4px;
}

.quick-tips {
  height: 100%;
}

.success-result {
  margin-top: 1.5rem;
}

.admin-list-scroll {
  margin-top: 1rem;
}

.admin-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.admin-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.admin-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.admin-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.admin-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-info {
  display: flex;
  flex-direction: column;
}

.admin-name {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
}

.admin-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.admin-meta {
  background: #f9fafb;
  border-radius: 10px;
  padding: 0.75rem;
}

/* 默认头像样式 */
.default-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.default-avatar .el-icon {
  color: white;
  font-size: 20px;
}

.admin-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.list-loading {
  padding: 1.5rem 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.primary-column :deep(.card + .card) {
  margin-top: 1.75rem;
}

.approval-body {
  min-height: 200px;
}

.ip-blacklist-form {
  margin-top: 0.5rem;
}

.ip-form-item {
  margin-bottom: 12px;
}

.ip-remark-item {
  width: 100%;
}

.user-reset-table {
  margin-top: 0.5rem;
}

.user-edit-table {
  margin-top: 0.5rem;
}

.edit-user-summary {
  margin-bottom: 1rem;
}

.edit-user-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  background: #f9fafb;
}

.edit-user-section + .edit-user-section {
  margin-top: 1rem;
}

.edit-user-section__title {
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.edit-user-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
