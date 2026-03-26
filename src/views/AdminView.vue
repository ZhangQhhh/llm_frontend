<template>
  <div class="admin-page">
    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <h1>管理中心</h1>
        <p class="subtitle">{{ username }} ({{ roleText }})</p>
      </header>

      <el-tabs v-model="activeTab" type="border-card" :before-leave="beforeTabLeave">
        <!-- 账号审核 -->
        <el-tab-pane v-if="showAdminTabs" label="账号审核" name="approval">
          <div class="tab-content">
            <div class="action-bar">
              <el-button type="primary" @click="loadPendingUsers" :loading="loadingPending" :icon="Refresh">
                刷新待审核列表
              </el-button>
              <el-tag type="warning" v-if="pendingUsers.length > 0">
                待审核：{{ pendingUsers.length }} 个账号
              </el-tag>
              <el-input
                v-model="pendingSearch"
                size="small"
                placeholder="搜索用户名/警号"
                clearable
                style="width: 200px; margin-left: auto;"
                @input="pendingPage = 1"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <div v-if="loadingPending" style="text-align: center; padding: 40px">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            </div>
            <el-empty v-else-if="pendingUsers.length === 0" description="暂无待审核账号" />
            <el-table
              v-else
              :data="pagedPending"
              border
              size="small"
              stripe
              style="width: 100%; margin-top: 1rem"
            >
              <el-table-column prop="username" label="用户名" min-width="140" />
              <el-table-column prop="policeId" label="警号" min-width="120">
                <template #default="scope">{{ scope.row.policeId || scope.row.police_id || '—' }}</template>
              </el-table-column>
              <el-table-column prop="idCardNumber" label="身份证号" min-width="180">
                <template #default="scope">
                  <span v-if="scope.row.idCardNumber || scope.row.id_card_number">
                    {{ maskIdCard(scope.row.idCardNumber || scope.row.id_card_number) }}
                  </span>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="注册时间" min-width="160">
                <template #default="scope">{{ scope.row.created_at || scope.row.createdAt || '—' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
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
            <div style="margin-top: 12px; display: flex; justify-content: center;">
              <el-pagination
                v-model:current-page="pendingPage"
                v-model:page-size="pendingPageSize"
                :page-sizes="[10, 20, 50]"
                :total="filteredPending.length"
                layout="total, sizes, prev, pager, next"
                small
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 密码管理（管理员为普通用户重置密码） -->
        <el-tab-pane v-if="showAdminTabs" label="密码管理" name="password">
          <div class="tab-content">
            <el-alert
              title="此功能用于管理员帮助普通用户重置密码，重置后请及时通知用户新密码。"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 1rem"
            />
            <el-form label-width="100px" style="max-width: 600px">
              <el-form-item label="选择用户">
                <el-select
                  v-model="selectedResetUserId"
                  filterable
                  placeholder="搜索或选择用户"
                  style="width: 100%"
                  @change="onResetUserChange"
                >
                  <el-option
                    v-for="u in resetUserOptions"
                    :key="u.id"
                    :label="u.username"
                    :value="u.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="resetPassword" type="password" show-password placeholder="请输入新密码（至少6位）" />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input v-model="resetPasswordConfirm" type="password" show-password placeholder="请再次输入新密码" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="resetUserPassword" :loading="resettingPassword">
                  重置密码
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- ==================== 题库管理（MCQ 对接） ==================== -->
        <el-tab-pane v-if="showBjzxTabs" label="题库管理" name="questions">
          <div class="tab-content mcq-tab-content">

            <!-- 题库选择器 -->
            <div class="bank-selector-bar" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 10px 16px; background: #f5f7fa; border-radius: 8px;">
              <span style="font-weight: 600; color: #303133; white-space: nowrap;">当前题库：</span>
              <el-select
                v-model="currentBankId"
                placeholder="暂无题库，请新建"
                size="default"
                filterable
                style="width: 220px"
                @change="onBankChange"
              >
                <el-option
                  v-for="b in banksList"
                  :key="b.id"
                  :label="`${b.name}（${b.question_count ?? 0} 题）`"
                  :value="b.id"
                />
              </el-select>
              <el-button size="small" type="primary" plain @click="showCreateBankDialog">
                <el-icon><Plus /></el-icon> 新建题库
              </el-button>
              <el-button size="small" plain @click="showRenameBankDialog" :disabled="!currentBankId">
                <el-icon><Edit /></el-icon> 重命名
              </el-button>
              <el-button size="small" type="danger" plain @click="deleteCurrentBank" :disabled="!currentBankId">
                <el-icon><Delete /></el-icon> 删除题库
              </el-button>
              <el-button size="small" :icon="Refresh" @click="loadBanksList" :loading="loadingBanks">刷新</el-button>
            </div>

            <!-- 顶部工具栏 -->
            <div class="mcq-toolbar">
              <div class="toolbar-section">
                <div class="section-title">
                  <el-icon class="title-icon"><Document /></el-icon>
                  <span>文件操作</span>
                </div>
                <div class="button-group">
                  <el-upload
                    ref="uploadRef"
                    :auto-upload="false"
                    :limit="1"
                    accept=".docx,.doc,.wps,.txt"
                    :on-change="handleFileChange"
                    style="display: inline-block"
                  >
                    <el-button :icon="Upload" size="default">选择文件</el-button>
                  </el-upload>
                  <el-button type="primary" @click="uploadQuestions" :loading="uploading" :icon="Upload" size="default">
                    上传解析
                  </el-button>
                  <el-button @click="downloadTemplate" :icon="Download" size="default">下载导入模板</el-button>
                  <el-divider direction="vertical" />
                  <el-button @click="exportBankDocx" :loading="exportingBank" :icon="Download" size="default">
                    导出题库
                  </el-button>
                  <input ref="bankImportRef" type="file" accept=".docx" style="display:none" @change="onPickBankDocx" />
                  <el-button @click="triggerPickBankDocx" :loading="importingBank" :icon="Upload" size="default">
                    导入题库
                  </el-button>
                </div>
                <div v-if="uploadMessage || counterMsg" class="toolbar-message">
                  <el-icon class="message-icon"><InfoFilled /></el-icon>
                  <span v-if="uploadMessage">{{ uploadMessage }}</span>
                  <span v-if="counterMsg">{{ counterMsg }}</span>
                </div>
              </div>

              <div class="toolbar-section">
                <div class="section-title">
                  <el-icon class="title-icon"><MagicStick /></el-icon>
                  <span>AI 解析</span>
                </div>
                <div class="button-group">
                  <!-- 原同步一键解析按钮已隐藏 -->
                  <!-- <el-button type="success" @click="generateExplanations" :loading="generating" :icon="MagicStick" size="default">
                    一键解析
                  </el-button> -->
                  <el-button type="success" @click="explainBatchAsync" :loading="asyncExplaining" :icon="MagicStick" size="default" :disabled="isTaskRunning">
                    一键解析
                  </el-button>
                  <el-button
                    v-if="isTaskRunning"
                    type="warning"
                    @click="stopTask"
                    :loading="stoppingTask"
                    size="default"
                  >
                    停止
                  </el-button>
                  <el-button
                    v-if="canResumeTask"
                    type="primary"
                    @click="resumeTask"
                    :loading="resumingTask"
                    size="default"
                  >
                    恢复
                  </el-button>
                  <el-divider direction="vertical" />
                  <el-select v-model="llmModelId" placeholder="AI模型" size="default" style="width:180px">
                    <el-option v-for="m in llmOptions" :key="m.value" :label="m.label" :value="m.value" />
                  </el-select>
                  <el-input-number v-model="topN" :min="1" :step="1" size="default" style="width:90px" controls-position="right" />
                  <el-checkbox v-model="thinking" size="default">思考模式</el-checkbox>
                  <el-checkbox v-model="insertBlock" size="default">精准检索</el-checkbox>
                  <el-divider direction="vertical" />
                  <el-popover placement="bottom" :width="200" trigger="click">
                    <template #reference>
                      <el-button size="default" plain>
                        解析目标 ({{ parseTargetStatuses.length }})
                        <el-icon class="el-icon--right"><Filter /></el-icon>
                      </el-button>
                    </template>
                    <div style="padding: 8px 0;">
                      <div style="font-size: 12px; color: #909399; margin-bottom: 8px;">选择要解析的题目状态：</div>
                      <el-checkbox-group v-model="parseTargetStatuses" style="display: flex; flex-direction: column; gap: 8px;">
                        <el-checkbox label="none">无解析</el-checkbox>
                        <el-checkbox label="rejected">已驳回</el-checkbox>
                        <el-checkbox label="abnormal">异常</el-checkbox>
                        <el-checkbox label="draft">草稿</el-checkbox>
                      </el-checkbox-group>
                    </div>
                  </el-popover>
                </div>
                <div v-if="generateMessage || (asyncMsg && !pendingTaskDismissed)" class="toolbar-message">
                  <el-icon class="message-icon"><InfoFilled /></el-icon>
                  <span v-if="generateMessage">{{ generateMessage }}</span>
                  <span v-if="asyncMsg && !pendingTaskDismissed">{{ asyncMsg }}</span>
                  <el-button
                    v-if="asyncMsg && !asyncExplaining && !pendingTaskDismissed"
                    type="info"
                    link
                    size="small"
                    @click="dismissPendingTask"
                    style="margin-left: 8px;"
                  >
                    忽略
                  </el-button>
                </div>
              </div>

              <div class="toolbar-section filter-section">
                <div class="section-title">
                  <el-icon class="title-icon"><Filter /></el-icon>
                  <span>筛选与操作</span>
                </div>
                <div class="filter-controls">
                  <div class="filter-left">
                    <el-select v-model="statusFilter" placeholder="状态" size="default" style="width: 130px" @change="loadQuestions">
                      <el-option label="全部" value="all" />
                      <el-option label="无解析" value="none" />
                      <el-option label="草稿" value="draft" />
                      <el-option label="已通过" value="approved" />
                      <el-option label="已驳回" value="rejected" />
                      <el-option label="异常" value="abnormal" />
                    </el-select>
                    <el-input
                      v-model="searchQuery"
                      placeholder="搜索题干/选项内容"
                      clearable
                      size="default"
                      style="width: 200px"
                      :prefix-icon="Search"
                    />
                    <el-button @click="loadQuestions" :loading="loadingQuestions" :icon="Refresh" size="default">刷新</el-button>
                  </div>
                  <div class="filter-right">
                    <el-checkbox v-model="selectAll" @change="toggleSelectAll" style="margin-right: 8px;">
                      全选
                    </el-checkbox>
                    <el-button
                      type="danger"
                      plain
                      @click="batchDelete"
                      :disabled="selectedQuestions.length === 0"
                      size="default"
                    >
                      批量删除 ({{ selectedQuestions.length }})
                    </el-button>
                    <el-divider direction="vertical" />
                    <el-button type="success" @click="approveAll" :loading="approvingAll" :icon="Check" size="default">
                      批量通过
                    </el-button>
                    <el-button type="danger" @click="rejectAll" :loading="rejectingAll" :icon="Close" size="default">
                      批量驳回
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 列表 -->
            <div v-if="loadingQuestions" style="text-align: center; padding: 40px">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            </div>
            <el-empty v-else-if="filteredQuestions.length === 0" description="暂无题目" />
            <div v-else class="questions-list">
              <el-card v-for="(q, idx) in pagedQuestions" :key="q.qid" class="question-card" shadow="hover">
                <div class="q-header">
                  <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <el-checkbox v-model="selectedQuestions" :value="q.qid" />
                    <span><strong>{{ (idx + 1) + (page-1)*pageSize }}.</strong> {{ q.stem }}</span>
                    <el-tag v-if="q.qtype === 'saq'" type="info" size="small" effect="plain">📝 简答题</el-tag>
                    <el-tag v-if="q.has_images" type="info" size="small" effect="plain">📷 含图片</el-tag>
                  </div>
                  <el-tag v-if="q.ai_generated_answer" type="warning" size="small" style="margin-right: 6px;" effect="plain">
                    AI答案待校对
                  </el-tag>
                  <el-tag :type="getStatusTagType(q.status)" size="small">{{ getStatusText(q.status) }}</el-tag>
                </div>
                <!-- 题干图片 -->
                <div v-if="q.stem_images && q.stem_images.length > 0" class="q-stem-images">
                  <img
                    v-for="(img, imgIdx) in q.stem_images"
                    :key="imgIdx"
                    :src="'data:' + img.content_type + ';base64,' + img.base64"
                    :alt="'题干图片' + (imgIdx + 1)"
                    class="q-image"
                    @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                  />
                </div>
                <div class="q-options">
                  <div v-for="opt in q.options" :key="opt.label" class="q-option-item">
                    <span>{{ opt.label }}. {{ opt.text }}</span>
                    <!-- 选项图片 -->
                    <div v-if="opt.images && opt.images.length > 0" class="q-option-images">
                      <img
                        v-for="(img, imgIdx) in opt.images"
                        :key="imgIdx"
                        :src="'data:' + img.content_type + ';base64,' + img.base64"
                        :alt="'选项' + opt.label + '图片' + (imgIdx + 1)"
                        class="q-image q-option-image"
                        @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                      />
                    </div>
                  </div>
                </div>
                <div class="q-actions">
                  <!-- 查看解析：保持不变 -->
                  <el-button size="small" @click="toggleAnalysis(q.qid)">
                    {{ showingAnalysis[q.qid] ? '收起' : '查看解析' }}
                  </el-button>

                  <!-- 编辑：始终可见 -->
                  <el-button size="small" @click="editRow(q)">编辑</el-button>

                  <!-- 保存 / 取消：仅在编辑状态下出现 -->
                  <el-button
                    v-if="isEditing(q.qid)"
                    size="small"
                    type="primary"
                    plain
                    @click="saveRow(q)"
                  >
                    保存
                  </el-button>
                  <el-button
                    v-if="isEditing(q.qid)"
                    size="small"
                    @click="cancelEdit()"
                  >
                    取消
                  </el-button>

                  <!-- 重生成并保存：仅在题目状态为"已驳回"（rejected）时显示 -->
                  <el-button
                    v-if="q.status === 'rejected'"
                    size="small"
                    type="primary"
                    @click="regenAndSave(q)"
                    :loading="rowRegenLoading[q.qid]"
                  >
                    重生成并保存
                  </el-button>

                  <!-- 通过 / 驳回 -->
                  <el-button
                    size="small"
                    type="success"
                    @click="approveQuestion(q.qid, q.analysis)"
                  >
                    通过
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="rejectQuestion(q.qid)"
                  >
                    驳回
                  </el-button>

                  <!-- 删除按钮 -->
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="deleteQuestion(q.qid)"
                    :loading="deletingQuestion[q.qid]"
                  >
                    删除
                  </el-button>
                </div>

                <!-- 行内编辑区 -->
                <div v-if="isEditing(q.qid)" class="edit-grid">
                  <el-form label-width="60px">
                    <!-- 1. 题干 -->
                    <el-form-item label="题干">
                      <el-input
                        v-model="editBuf.stem"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 6 }"
                      />
                    </el-form-item>

                    <!-- 1.5 题干图片编辑 -->
                    <el-form-item label="题干图片">
                      <div class="edit-images-grid">
                        <div v-for="(img, imgIdx) in editBuf.stem_images" :key="imgIdx" class="edit-image-item">
                          <img
                            :src="'data:' + img.content_type + ';base64,' + img.base64"
                            :alt="'题干图片' + (imgIdx + 1)"
                            class="edit-image-preview"
                            @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                          />
                          <el-button
                            type="danger"
                            :icon="Close"
                            circle
                            size="small"
                            class="edit-image-remove"
                            @click="removeStemImage(Number(imgIdx))"
                            title="删除此图片"
                          />
                        </div>
                        <div class="edit-image-add" @click="triggerStemImageUpload">
                          <el-icon :size="24"><Plus /></el-icon>
                          <span>添加图片</span>
                        </div>
                      </div>
                      <input
                        id="stem-image-input"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="onStemImageSelected"
                      />
                    </el-form-item>

                    <!-- 2. 选项（和题干同宽，自适应高度） -->
                    <el-form-item label="选项">
                      <div class="opts-grid">
                        <div
                          v-for="k in editOptionKeys"
                          :key="k"
                          class="opt-row-wrapper"
                        >
                          <div class="opt-row">
                            <span class="opt-label">{{ k }}.</span>
                            <el-input
                              class="opt-input"
                              v-model="editBuf.options[k]"
                              type="textarea"
                              :autosize="{ minRows: 1, maxRows: 4 }"
                            />
                            <el-button
                              type="danger"
                              :icon="Close"
                              circle
                              size="small"
                              class="opt-remove-btn"
                              @click="removeOption(k)"
                              title="删除此选项"
                            />
                          </div>
                          <!-- 选项图片编辑 -->
                          <div class="opt-images-row">
                            <div class="edit-images-grid">
                              <div
                                v-for="(img, imgIdx) in (editBuf.option_images[k] || [])"
                                :key="imgIdx"
                                class="edit-image-item"
                              >
                                <img
                                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                                  :alt="'选项' + k + '图片' + (imgIdx + 1)"
                                  class="edit-image-preview"
                                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                                />
                                <el-button
                                  type="danger"
                                  :icon="Close"
                                  circle
                                  size="small"
                                  class="edit-image-remove"
                                  @click="removeOptionImage(k, Number(imgIdx))"
                                  title="删除此图片"
                                />
                              </div>
                              <div class="edit-image-add edit-image-add-small" @click="triggerOptionImageUpload(k)">
                                <el-icon :size="16"><Plus /></el-icon>
                                <span>图片</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="opt-actions">
                          <el-button
                            type="primary"
                            plain
                            size="small"
                            @click="addOption"
                          >
                            + 添加选项
                          </el-button>
                          <span class="opt-hint">（支持 A-H，删除所有选项将变为简答题）</span>
                        </div>
                      </div>
                      <!-- 选项图片上传input -->
                      <input
                        id="option-image-input"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="onOptionImageSelected"
                      />
                    </el-form-item>

                    <!-- 2.5 知识条款（简答题时显示） -->
                    <el-form-item v-if="editingQtype === 'saq'" label="知识条款">
                      <div class="opts-grid">
                        <div
                          v-for="(clause, idx) in editBuf.knowledge_clauses"
                          :key="idx"
                          class="opt-row-wrapper"
                        >
                          <div class="opt-row">
                            <span class="opt-label" style="min-width: 80px;">知识条款{{ chineseNumber(idx + 1) }}</span>
                            <el-input
                              class="opt-input"
                              v-model="editBuf.knowledge_clauses[idx]"
                              type="textarea"
                              :autosize="{ minRows: 1, maxRows: 6 }"
                            />
                            <el-button
                              type="danger"
                              :icon="Close"
                              circle
                              size="small"
                              class="opt-remove-btn"
                              @click="removeKnowledgeClause(Number(idx))"
                              title="删除此知识条款"
                            />
                          </div>
                        </div>
                        <div class="opt-actions">
                          <el-button
                            type="primary"
                            plain
                            size="small"
                            @click="addKnowledgeClause"
                          >
                            + 添加知识条款
                          </el-button>
                        </div>
                      </div>
                    </el-form-item>

                    <!-- 3. 答案 -->
                    <el-form-item label="答案">
                      <el-input
                        v-model="editBuf.answer"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 10 }"
                        placeholder="如 A 或 AC（简答题填写参考答案）"
                      />
                    </el-form-item>

                    <!-- 4. 解析 -->
                    <el-form-item label="解析">
                      <el-input
                        v-model="editBuf.explain"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 10 }"
                      />
                    </el-form-item>

                    <!-- 4.5 解析图片编辑 -->
                    <el-form-item label="解析图片">
                      <div class="edit-images-grid">
                        <div v-for="(img, imgIdx) in editBuf.analysis_images" :key="imgIdx" class="edit-image-item">
                          <img
                            :src="'data:' + img.content_type + ';base64,' + img.base64"
                            :alt="'解析图片' + (imgIdx + 1)"
                            class="edit-image-preview"
                            @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                          />
                          <el-button
                            type="danger"
                            :icon="Close"
                            circle
                            size="small"
                            class="edit-image-remove"
                            @click="removeAnalysisImage(Number(imgIdx))"
                            title="删除此图片"
                          />
                        </div>
                        <div class="edit-image-add" @click="triggerAnalysisImageUpload">
                          <el-icon :size="24"><Plus /></el-icon>
                          <span>添加图片</span>
                        </div>
                      </div>
                      <input
                        id="analysis-image-input"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="onAnalysisImageSelected"
                      />
                    </el-form-item>

                    <!-- 5. 知识点/考点 -->
                    <el-form-item label="考点">
                      <div style="display: flex; gap: 8px; width: 100%;">
                        <el-select
                          v-model="editSelectedKnowledgePoints"
                          multiple
                          filterable
                          allow-create
                          default-first-option
                          collapse-tags
                          collapse-tags-tooltip
                          :max-collapse-tags="3"
                          placeholder="选择或输入考点（可多选）"
                          style="flex: 1;"
                        >
                          <el-option
                            v-for="kp in knowledgePointOptions"
                            :key="kp"
                            :label="'《' + kp + '》'"
                            :value="kp"
                          />
                        </el-select>
                        <el-button type="primary" plain size="small" @click="kpManageDialogVisible = true">
                          管理考点
                        </el-button>
                      </div>
                      <div class="knowledge-point-hint">
                        <el-icon><InfoFilled /></el-icon>
                        <span>可从预设列表选择，也可输入新的考点名称后按回车添加</span>
                      </div>
                    </el-form-item>
                  </el-form>
                </div>

                <div v-if="showingAnalysis[q.qid]" class="q-analysis">
                  <!-- 复杂验证策略：显示Tab切换 -->
                  <template v-if="isComplexValidation(q.analysis)">
                    <div class="analysis-tab-bar">
                      <el-radio-group
                        v-model="analysisActiveTab[q.qid]"
                        size="small"
                        @change="() => { if (!analysisActiveTab[q.qid]) analysisActiveTab[q.qid] = 'all' }"
                      >
                        <el-radio-button label="all">全部</el-radio-button>
                        <el-radio-button
                          v-for="opt in q.options"
                          :key="opt.label"
                          :label="opt.label"
                        >
                          选项 {{ opt.label }}
                        </el-radio-button>
                      </el-radio-group>
                    </div>

                    <!-- 根据Tab显示对应解析内容 -->
                    <div class="q-analysis-text" v-html="processAnalysisText(getAnalysisForTab(q.qid, q.analysis, analysisActiveTab[q.qid] || 'all'))">
                    </div>

                    <!-- 解析图片 -->
                    <div v-if="q.analysis_images && q.analysis_images.length > 0" class="q-analysis-images">
                      <div class="analysis-images-title">解析配图：</div>
                      <div class="q-stem-images">
                        <img
                          v-for="(img, imgIdx) in q.analysis_images"
                          :key="imgIdx"
                          :src="'data:' + img.content_type + ';base64,' + img.base64"
                          :alt="'解析图片' + (imgIdx + 1)"
                          class="q-image"
                          @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                        />
                      </div>
                    </div>

                    <!-- 参考资料：根据Tab过滤 -->
                    <details class="analysis-sources">
                      <summary>参考资料（重排序最终 TopN）</summary>
                      <div v-if="sourcesLoading[q.qid]" class="src-loading">参考资料载入中…</div>
                      <div v-else-if="sourcesError[q.qid]" class="src-error">加载失败：{{ sourcesError[q.qid] }}</div>
                      <div v-else-if="sourcesLoaded[q.qid] && getSourcesForTab(q.qid, analysisActiveTab[q.qid] || 'all').length === 0" class="src-empty">
                        无参考资料
                      </div>
                      <template v-else>
                        <!-- 当选择"全部"或非分组时显示分组列表 -->
                        <template v-if="(analysisActiveTab[q.qid] || 'all') === 'all' && isGroupedSources(q.qid)">
                          <details
                            v-for="(group, gi) in sourcesMap[q.qid]"
                            :key="group.label || gi"
                            class="src-group"
                            open
                          >
                            <summary>选项 {{ group.label || '?' }} 的参考资料</summary>
                            <div class="src-group-body">
                              <div v-for="(s, si) in group.sources || []" :key="si" class="src-card">
                                <div class="src-title">{{ getSourceTitle(s, si) }}</div>
                                <div v-if="getSourceMeta(s)" class="src-meta">{{ getSourceMeta(s) }}</div>
                                <div v-if="sourcePassages(s).length" class="src-passages">
                                  <div v-for="(p, pi) in sourcePassages(s)" :key="pi" class="passage"><pre>{{ p }}</pre></div>
                                </div>
                                <div v-else class="src-empty">无片段</div>
                              </div>
                            </div>
                          </details>
                        </template>
                        <!-- 当选择特定选项时只显示该选项的参考资料 -->
                        <template v-else-if="(analysisActiveTab[q.qid] || 'all') !== 'all' && isGroupedSources(q.qid)">
                          <template v-for="(group, gi) in getSourcesForTab(q.qid, analysisActiveTab[q.qid] || 'all')" :key="group.label || gi">
                            <div v-for="(s, si) in group.sources || []" :key="si" class="src-card">
                              <div class="src-title">{{ getSourceTitle(s, si) }}</div>
                              <div v-if="getSourceMeta(s)" class="src-meta">{{ getSourceMeta(s) }}</div>
                              <div v-if="sourcePassages(s).length" class="src-passages">
                                <div v-for="(p, pi) in sourcePassages(s)" :key="pi" class="passage"><pre>{{ p }}</pre></div>
                              </div>
                              <div v-else class="src-empty">无片段</div>
                            </div>
                          </template>
                        </template>
                        <!-- 非分组结构 -->
                        <template v-else>
                          <div v-for="(s, si) in sourcesMap[q.qid] || []" :key="si" class="src-card">
                            <div class="src-title">{{ getSourceTitle(s, si) }}</div>
                            <div v-if="getSourceMeta(s)" class="src-meta">{{ getSourceMeta(s) }}</div>
                            <div v-if="sourcePassages(s).length" class="src-passages">
                              <div v-for="(p, pi) in sourcePassages(s)" :key="pi" class="passage"><pre>{{ p }}</pre></div>
                            </div>
                            <div v-else class="src-empty">无片段</div>
                          </div>
                        </template>
                      </template>
                    </details>
                  </template>

                  <!-- 简单查找策略：直接显示全部 -->
                  <template v-else>
                    <div class="q-analysis-text" v-html="processAnalysisText(q.analysis)">
                    </div>

                    <!-- 解析图片 -->
                    <div v-if="q.analysis_images && q.analysis_images.length > 0" class="q-analysis-images">
                      <div class="analysis-images-title">解析配图：</div>
                      <div class="q-stem-images">
                        <img
                          v-for="(img, imgIdx) in q.analysis_images"
                          :key="imgIdx"
                          :src="'data:' + img.content_type + ';base64,' + img.base64"
                          :alt="'解析图片' + (imgIdx + 1)"
                          class="q-image"
                          @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                        />
                      </div>
                    </div>

                    <!-- 参考资料折叠块 -->
                    <details class="analysis-sources">
                      <summary>参考资料（重排序最终 TopN）</summary>
                      <div v-if="sourcesLoading[q.qid]" class="src-loading">参考资料载入中…</div>
                      <div v-else-if="sourcesError[q.qid]" class="src-error">加载失败：{{ sourcesError[q.qid] }}</div>
                      <div v-else-if="sourcesLoaded[q.qid] && (!sourcesMap[q.qid] || !sourcesMap[q.qid].length)" class="src-empty">
                        无参考资料
                      </div>
                      <template v-else>
                        <div v-for="(s, si) in sourcesMap[q.qid] || []" :key="si" class="src-card">
                          <div class="src-title">{{ getSourceTitle(s, si) }}</div>
                          <div v-if="getSourceMeta(s)" class="src-meta">{{ getSourceMeta(s) }}</div>
                          <div v-if="sourcePassages(s).length" class="src-passages">
                            <div v-for="(p, pi) in sourcePassages(s)" :key="pi" class="passage"><pre>{{ p }}</pre></div>
                          </div>
                          <div v-else class="src-empty">无片段</div>
                        </div>
                      </template>
                    </details>
                  </template>
                </div>
              </el-card>
            </div>

            <!-- 分页 -->
            <div v-if="filteredQuestions.length" style="display:flex;justify-content:flex-end;margin-top:12px">
              <el-pagination
                background
                layout="prev, pager, next, sizes, jumper, total"
                :total="filteredQuestions.length"
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :page-sizes="[20,50,100,200]"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 回收站 -->
        <el-tab-pane v-if="showBjzxTabs" label="回收站" name="recycle">
          <div class="tab-content">
            <!-- 工具栏 -->
            <div class="action-bar">
              <el-button @click="loadDeletedQuestions" :loading="loadingDeleted" :icon="Refresh">
                刷新
              </el-button>
              <el-checkbox v-model="selectAllDeleted" @change="toggleSelectAllDeleted" style="margin: 0 12px;">
                全选
              </el-checkbox>
              <el-button
                type="success"
                @click="batchRestore"
                :disabled="selectedDeleted.length === 0"
              >
                批量恢复 ({{ selectedDeleted.length }})
              </el-button>
              <el-button
                type="danger"
                plain
                @click="batchPermanentDelete"
                :disabled="selectedDeleted.length === 0"
              >
                批量永久删除 ({{ selectedDeleted.length }})
              </el-button>
              <el-divider direction="vertical" />
              <el-button
                type="danger"
                @click="clearRecycleBin"
              >
                清空回收站
              </el-button>
              <span class="status-msg">{{ recycleMessage }}</span>
            </div>

            <!-- 回收站列表 -->
            <div v-if="deletedQuestions.length === 0" style="text-align: center; padding: 40px; color: #999;">
              回收站为空
            </div>
            <div v-else class="questions-list">
              <el-card
                v-for="q in pagedDeletedQuestions"
                :key="q.qid"
                class="question-card"
              >
                <div class="q-header">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <el-checkbox
                      v-model="selectedDeleted"
                      :value="q.qid"
                    />
                  </div>
                </div>

                <div style="margin: 10px 0;">
                  <div><strong>题目：</strong>{{ q.stem }}</div>
                  <!-- 题干图片 -->
                  <div v-if="q.stem_images && q.stem_images.length > 0" class="q-stem-images">
                    <img
                      v-for="(img, imgIdx) in q.stem_images"
                      :key="imgIdx"
                      :src="'data:' + img.content_type + ';base64,' + img.base64"
                      :alt="'题干图片' + (imgIdx + 1)"
                      class="q-image"
                      @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                    />
                  </div>
                  <div class="q-options">
                    <div v-for="opt in q.options" :key="opt.label">
                      {{ opt.label }}. {{ opt.text }}
                      <!-- 选项图片 -->
                      <div v-if="opt.images && opt.images.length > 0" class="q-option-images">
                        <img
                          v-for="(img, imgIdx) in opt.images"
                          :key="imgIdx"
                          :src="'data:' + img.content_type + ';base64,' + img.base64"
                          :alt="opt.label + '选项图片' + (imgIdx + 1)"
                          class="q-image"
                          @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                        />
                      </div>
                    </div>
                  </div>
                  <!-- 解析图片 -->
                  <div v-if="q.analysis_images && q.analysis_images.length > 0" class="q-analysis-images" style="margin-top: 8px;">
                    <div style="font-size: 12px; color: #999;">解析配图：</div>
                    <div class="q-stem-images">
                      <img
                        v-for="(img, imgIdx) in q.analysis_images"
                        :key="imgIdx"
                        :src="'data:' + img.content_type + ';base64,' + img.base64"
                        :alt="'解析图片' + (imgIdx + 1)"
                        class="q-image"
                        @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                      />
                    </div>
                  </div>
                  <div style="margin-top: 8px; color: #666; font-size: 13px;">
                    <div><strong>答案：</strong>{{ q.answer }}</div>
                    <div><strong>删除时间：</strong>{{ q.deleted_at }}</div>
                    <div><strong>删除人：</strong>{{ q.deleted_by }}</div>
                  </div>
                </div>

                <div class="q-actions">
                  <el-button
                    size="small"
                    type="success"
                    @click="restoreQuestion(q.qid)"
                    :loading="restoringQuestion[q.qid]"
                  >
                    恢复
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="permanentDelete(q.qid)"
                    :loading="permanentDeleting[q.qid]"
                  >
                    永久删除
                  </el-button>
                </div>
              </el-card>
            </div>

            <!-- 回收站分页 -->
            <div v-if="deletedQuestions.length" style="display:flex;justify-content:flex-end;margin-top:12px">
              <el-pagination
                background
                layout="prev, pager, next, sizes, jumper, total"
                :total="deletedQuestions.length"
                v-model:current-page="recyclePage"
                v-model:page-size="recyclePageSize"
                :page-sizes="[20,50,100,200]"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 试卷管理 -->
        <el-tab-pane v-if="showBjzxTabs" label="试卷管理" name="papers">
          <div class="tab-content">
            <!-- 生成试卷区域 -->
            <el-card shadow="never" style="margin-bottom: 20px;">
              <template #header>
                <span style="font-weight: 600;">生成试卷</span>
              </template>
              
              <!-- 试卷标题和生成模式 -->
              <el-form label-width="100px" style="margin-bottom: 16px;">
                <el-form-item label="试卷标题" style="margin-bottom: 12px;">
                  <el-input v-model="paperTitle" placeholder="请输入试卷名称" style="width: 300px" />
                </el-form-item>
                
                <!-- 分数设置 -->
                <el-form-item label="分数设置" style="margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                    <span>
                      <span style="margin-right: 4px;">单选题</span>
                      <el-input-number v-model="singleScore" :min="0" :max="100" :precision="1" :step="0.1" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">分/题</span>
                    </span>
                    <span>
                      <span style="margin-right: 4px;">多选题</span>
                      <el-input-number v-model="multiScore" :min="0" :max="100" :precision="1" :step="0.1" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">分/题</span>
                    </span>
                    <span>
                      <span style="margin-right: 4px;">不定项</span>
                      <el-input-number v-model="indeterminateScore" :min="0" :max="100" :precision="1" :step="0.1" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">分/题</span>
                    </span>
                    <span style="display: flex; align-items: center; gap: 8px;">
                      <span style="margin-right: 4px;">简答题</span>
                      <el-radio-group v-model="saqScoreMode" size="small">
                        <el-radio-button value="uniform">统一</el-radio-button>
                        <el-radio-button value="custom">自定义</el-radio-button>
                      </el-radio-group>
                      <template v-if="saqScoreMode === 'uniform'">
                        <el-input-number v-model="saqScore" :min="0" :max="100" :precision="1" :step="0.1" size="small" style="width: 100px;" />
                        <span>分/题</span>
                      </template>
                      <span v-else style="color: #909399; font-size: 12px;">（在下方题目列表中设置）</span>
                    </span>
                  </div>
                </el-form-item>
                
                <!-- 知识点筛选（放在生成模式前，对随机和手动都生效） -->
                <el-form-item label="考点筛选" style="margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <el-select
                      v-model="selectedKnowledgePoints"
                      multiple
                      collapse-tags
                      collapse-tags-tooltip
                      :max-collapse-tags="3"
                      placeholder="选择知识点（可多选，不选则为全部）"
                      clearable
                      filterable
                      autocomplete="off"
                      style="width: 500px;"
                      size="default"
                      @change="paperQuestionPage = 1"
                    >
                      <el-option
                        v-for="kp in availableKnowledgePoints"
                        :key="kp"
                        :label="'《' + kp + '》'"
                        :value="kp"
                      />
                    </el-select>
                    <span v-if="approvedQuestions.length === 0" style="color: #e6a23c; font-size: 13px;">
                      暂无已通过题目，请先通过题目审核
                    </span>
                    <span v-else-if="selectedKnowledgePoints.length > 0" style="color: #67c23a; font-size: 13px;">
                      已筛选 {{ filteredPaperQuestions.length }} 道相关题目
                    </span>
                    <span v-else style="color: #909399; font-size: 13px;">
                      共 {{ approvedQuestions.length }} 道已通过题目
                    </span>
                  </div>
                </el-form-item>
                
                <!-- 生成模式选择 -->
                <el-form-item label="生成模式" style="margin-bottom: 12px;">
                  <el-radio-group v-model="paperGenerateMode">
                    <el-radio value="manual">手动选择题目</el-radio>
                    <el-radio value="random">随机抽取题目</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <!-- 随机抽取配置 -->
                <el-form-item v-if="paperGenerateMode === 'random'" label="题目数量" style="margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <span>
                      <span style="margin-right: 4px;">单选</span>
                      <el-input-number v-model="randomSingleCount" :min="0" :max="singleApprovedCount" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">题</span>
                    </span>
                    <span>
                      <span style="margin-right: 4px;">多选</span>
                      <el-input-number v-model="randomMultiCount" :min="0" :max="multiApprovedCount" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">题</span>
                    </span>
                    <span>
                      <span style="margin-right: 4px;">简答</span>
                      <el-input-number v-model="randomSaqCount" :min="0" :max="saqApprovedCount" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">题</span>
                    </span>
                    <span style="display: flex; align-items: center; gap: 8px;">
                      <span style="margin-right: 4px;">不定项：</span>
                      <span>单选</span>
                      <el-input-number v-model="randomIndeterminateSingleCount" :min="0" :max="singleApprovedCount" size="small" style="width: 70px;" />
                      <span>多选</span>
                      <el-input-number v-model="randomIndeterminateMultiCount" :min="0" :max="multiApprovedCount" size="small" style="width: 70px;" />
                      <span style="color: #909399; font-size: 12px;">（从剩余题目中抽取）</span>
                    </span>
                  </div>
                </el-form-item>
                
                <!-- 手动模式下的不定项配置 -->
                <el-form-item v-if="paperGenerateMode === 'manual'" label="不定项题" style="margin-bottom: 12px;">
                  <el-checkbox v-model="enableIndeterminate" style="margin-right: 16px;">启用不定项选择题</el-checkbox>
                  <template v-if="enableIndeterminate">
                    <el-radio-group v-model="indeterminateMode" style="margin-right: 16px;">
                      <el-radio value="select">手动选择题目</el-radio>
                      <el-radio value="count">按数量抽取</el-radio>
                    </el-radio-group>
                    
                    <template v-if="indeterminateMode === 'select'">
                      <span style="color: #67c23a; font-size: 13px;">
                        已选 {{ selectedIndeterminateQuestions.length }} 题为不定项
                        <span v-if="selectedIndeterminateQuestions.length > 0">（点击下方题目的"不定项"按钮可取消）</span>
                      </span>
                    </template>
                    
                    <template v-else>
                      <span style="margin-right: 8px;">单选</span>
                      <el-input-number v-model="indeterminateSingleCount" :min="0" :max="99" size="small" style="width: 80px;" />
                      <span style="margin: 0 8px;">题，多选</span>
                      <el-input-number v-model="indeterminateMultiCount" :min="0" :max="99" size="small" style="width: 80px;" />
                      <span style="margin-left: 8px;">题（随机抽取）</span>
                    </template>
                  </template>
                </el-form-item>
                
                <!-- 密码保护 -->
                <el-form-item label="密码保护" style="margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-input
                      v-model="generatePaperPassword"
                      placeholder="留空则不设密码"
                      style="width: 200px;"
                      size="default"
                      show-password
                      clearable
                      autocomplete="new-password"
                    />
                    <span style="color: #909399; font-size: 12px;">（用于查看/编辑/下载）</span>
                  </div>
                </el-form-item>
                
                <!-- 生成按钮 -->
                <el-form-item label="" style="margin-bottom: 0;">
                  <el-button type="primary" @click="createPaper" :loading="creatingPaper">
                    {{ paperGenerateMode === 'random' 
                      ? `随机生成试卷 (${randomSingleCount + randomMultiCount + randomSaqCount + randomIndeterminateCount}题)` 
                      : `生成试卷 ${selectedPaperQuestions.length > 0 ? '(' + selectedPaperQuestions.length + '题)' : '(全部)'}` }}
                  </el-button>
                  <span class="status-msg">{{ paperMessage }}</span>
                </el-form-item>
              </el-form>
              
              <!-- 筛选和搜索 -->
              <div class="action-bar" style="margin-bottom: 12px;">
                <el-radio-group v-model="paperQuestionFilter" size="small" @change="paperQuestionPage = 1">
                  <el-radio-button value="all">全部</el-radio-button>
                  <el-radio-button value="single">单选题</el-radio-button>
                  <el-radio-button value="multi">多选题</el-radio-button>
                  <el-radio-button value="saq">简答题</el-radio-button>
                </el-radio-group>
                <el-input
                  v-model="paperQuestionSearch"
                  placeholder="搜索题干或选项"
                  clearable
                  style="width: 250px; margin-left: 12px;"
                  size="small"
                  @input="paperQuestionPage = 1"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-checkbox v-model="selectAllPaperQuestions" @change="toggleSelectAllPaperQuestions" style="margin-left: 12px;">
                  全选
                </el-checkbox>
                <span style="margin-left: 12px; color: #909399; font-size: 13px;">
                  已选 {{ selectedPaperQuestions.length }} / {{ filteredPaperQuestions.length }} 题
                  （已通过共 {{ approvedQuestions.length }} 题）
                </span>
              </div>
              
              <!-- 题目列表 -->
              <div v-if="approvedQuestions.length === 0" style="text-align: center; padding: 30px; color: #999;">
                暂无已通过的题目，请先在题库管理中通过题目
              </div>
              <div v-else-if="filteredPaperQuestions.length === 0" style="text-align: center; padding: 30px; color: #999;">
                没有符合筛选条件的题目
              </div>
              <div v-else class="paper-question-list">
                <div
                  v-for="(q, idx) in pagedPaperQuestions"
                  :key="q.qid"
                  class="paper-question-item"
                  :class="{ selected: selectedPaperQuestions.includes(q.qid) }"
                >
                  <el-checkbox
                    :model-value="selectedPaperQuestions.includes(q.qid)"
                    @change="(val: boolean) => {
                      if (val) {
                        if (!selectedPaperQuestions.includes(q.qid)) selectedPaperQuestions.push(q.qid)
                      } else {
                        const i = selectedPaperQuestions.indexOf(q.qid)
                        if (i > -1) selectedPaperQuestions.splice(i, 1)
                      }
                    }"
                  />
                  <div class="paper-question-content">
                    <div class="paper-question-stem">
                      <el-tag :type="q.qtype === 'saq' ? 'primary' : (isMultiChoice(q) ? 'warning' : 'info')" size="small" style="margin-right: 8px;">
                        {{ q.qtype === 'saq' ? '简答' : (isMultiChoice(q) ? '多选' : '单选') }}
                      </el-tag>
                      <el-tag 
                        v-if="enableIndeterminate && indeterminateMode === 'select' && q.qtype !== 'saq'" 
                        :type="selectedIndeterminateQuestions.includes(q.qid) ? 'success' : 'info'"
                        size="small" 
                        style="margin-right: 8px; cursor: pointer;"
                        :effect="selectedIndeterminateQuestions.includes(q.qid) ? 'dark' : 'plain'"
                        @click="toggleIndeterminate(q.qid)"
                      >
                        {{ selectedIndeterminateQuestions.includes(q.qid) ? '✓ 不定项' : '+ 不定项' }}
                      </el-tag>
                      <el-tag v-if="!q.answer || !q.answer.trim()" type="danger" size="small" style="margin-right: 8px;">
                        无答案
                      </el-tag>
                      <el-tag v-if="q.ai_generated_answer" type="warning" size="small" style="margin-right: 8px;" effect="plain">
                        🤖 AI答案待校对
                      </el-tag>
                      <!-- 简答题自定义分数输入 -->
                      <template v-if="q.qtype === 'saq' && saqScoreMode === 'custom'">
                        <!-- 有知识条款：显示总分（条款小分之和） -->
                        <span v-if="q.knowledge_clauses && q.knowledge_clauses.length > 0 && saqClauseScores[q.qid]" style="display: inline-flex; align-items: center; gap: 4px; margin-right: 8px;">
                          <span style="color: #409eff; font-size: 12px;">{{ getSaqClauseTotal(q.qid) }}分</span>
                        </span>
                        <!-- 无知识条款：保持原有单分数输入 -->
                        <span v-else style="display: inline-flex; align-items: center; gap: 4px; margin-right: 8px;">
                          <el-input-number
                            v-model="saqCustomScores[q.qid]"
                            :min="0" :max="100" :precision="1" size="small" style="width: 90px;"
                            @click.stop
                          />
                          <span style="color: #909399; font-size: 12px;">分</span>
                        </span>
                      </template>
                      <span>{{ idx + 1 }}. {{ q.stem }}</span>
                    </div>
                    <!-- 题干图片 -->
                    <div v-if="q.stem_images && q.stem_images.length > 0" class="q-stem-images" style="margin: 6px 0;">
                      <img
                        v-for="(img, imgIdx) in q.stem_images"
                        :key="imgIdx"
                        :src="'data:' + img.content_type + ';base64,' + img.base64"
                        :alt="'题干图片' + (imgIdx + 1)"
                        class="q-image"
                        style="max-height: 80px;"
                        @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                      />
                    </div>
                    <div class="paper-question-options">
                      <div v-for="opt in q.options" :key="opt.label" class="paper-question-opt">
                        {{ opt.label }}. {{ opt.text }}
                        <!-- 选项图片 -->
                        <template v-if="opt.images && opt.images.length > 0">
                          <template v-for="(img, imgIdx) in opt.images" :key="imgIdx">
                            <img
                              :src="'data:' + img.content_type + ';base64,' + img.base64"
                              :alt="opt.label + '选项图片'"
                              class="q-image"
                              style="max-height: 60px; margin-left: 4px; vertical-align: middle;"
                              @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                            />
                          </template>
                        </template>
                      </div>
                    </div>
                    <!-- 知识条款列表（有知识条款的简答题） -->
                    <div v-if="q.qtype === 'saq' && q.knowledge_clauses && q.knowledge_clauses.length > 0" style="margin: 4px 0; padding-left: 8px; border-left: 2px solid #e4e7ed;">
                      <div v-for="(clause, ci) in q.knowledge_clauses" :key="ci" style="display: flex; align-items: flex-start; gap: 6px; margin: 3px 0; font-size: 13px; line-height: 1.5;">
                        <template v-if="saqScoreMode === 'custom' && saqClauseScores[q.qid]">
                          <el-input-number
                            v-model="saqClauseScores[q.qid][ci]"
                            :min="0" :max="100" :precision="1" controls-position="right" size="small" style="width: 80px; flex-shrink: 0;"
                            @click.stop
                            @change="saqCustomScores[q.qid] = getSaqClauseTotal(q.qid)"
                          />
                          <span style="color: #909399; flex-shrink: 0;">分</span>
                        </template>
                        <span v-else style="color: #409eff; flex-shrink: 0; min-width: 30px;">{{ distributeScore(saqScore, q.knowledge_clauses.length)[ci] }}分</span>
                        <span style="color: #606266;">知识条款{{ chineseNumber(ci + 1) }}：{{ clause }}</span>
                      </div>
                    </div>
                    <div class="paper-question-answer" :class="{ 'no-answer': !q.answer || !q.answer.trim() }">
                      {{ q.answer && q.answer.trim() ? `答案：${q.answer}` : '⚠️ 无答案（考试系统无法判分）' }}
                    </div>
                  </div>
                </div>
              </div>
              <div style="margin-top: 12px; display: flex; justify-content: center;">
                <el-pagination
                  v-model:current-page="paperQuestionPage"
                  v-model:page-size="paperQuestionPageSize"
                  :page-sizes="[20, 50, 100]"
                  :total="filteredPaperQuestions.length"
                  layout="total, sizes, prev, pager, next"
                  small
                />
              </div>
            </el-card>
            
            <!-- 试卷列表 -->
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600;">已生成试卷</span>
                  <div>
                    <input ref="paperUploadRef" type="file" accept=".docx,.doc,.wps,.txt" style="display:none" @change="onPickPaperFile" />
                    <el-button size="small" type="success" @click="triggerPickPaperFile" :icon="Upload">上传试卷</el-button>
                    <span style="margin-left: 10px; color: #909399;">共 {{ paperList.length }} 份</span>
                  </div>
                </div>
              </template>
              <!-- 编辑已生成试卷 -->
              <div style="margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="color: #606266; font-size: 14px;">📝 编辑试卷：</span>
                <el-select
                  v-model="editPaperSelected"
                  placeholder="选择要编辑的试卷"
                  size="default"
                  style="width: 300px"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="paper in paperList"
                    :key="paper.paper_id"
                    :label="paper.title"
                    :value="paper.paper_id"
                  />
                </el-select>
                <el-button
                  type="primary"
                  @click="editPaperWithPasswordCheck"
                  :loading="loadingPaperDetail"
                  :disabled="!editPaperSelected"
                  :icon="Edit"
                  size="default"
                >
                  读取编辑
                </el-button>
                <span style="color: #909399; font-size: 12px;">（可修改试卷内容并批量解析）</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <el-input v-model="paperListSearch" placeholder="搜索试卷名称" clearable size="small" style="width: 260px;" :prefix-icon="Search" @input="paperListPage = 1" />
              </div>
              <el-table :data="pagedPaperList" stripe border style="width: 100%">
                <el-table-column prop="title" label="试卷名称" min-width="200" />
                <el-table-column prop="paper_id" label="文件名" min-width="250" />
                <el-table-column label="练习可见" width="120">
                  <template #default="{ row }">
                    <el-switch
                      v-model="row.visible"
                      :loading="togglingVisibility[row.paper_id]"
                      @change="togglePaperVisibility(row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="密码" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.has_password" type="warning" size="small">已设</el-tag>
                    <span v-else style="color: #c0c4cc; font-size: 12px;">无</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" :width="isSuperAdminUser ? 280 : 200" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" @click="downloadPaper(row.paper_id)">下载</el-button>
                    <el-button v-if="isSuperAdminUser" size="small" type="warning" @click="openPasswordManage(row.paper_id, row.title)">密码</el-button>
                    <el-button size="small" type="danger" @click="deletePaper(row.paper_id, row.title)" :loading="deletingPaper[row.paper_id]">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div style="margin-top: 12px; display: flex; justify-content: center;">
                <el-pagination
                  v-model:current-page="paperListPage"
                  v-model:page-size="paperListPageSize"
                  :page-sizes="[10, 20, 50]"
                  :total="filteredPaperList.length"
                  layout="total, sizes, prev, pager, next"
                  small
                />
              </div>
            </el-card>
            
            <!-- 上传试卷预览编辑对话框 -->
            <el-dialog
              v-model="paperPreviewVisible"
              :title="isEditingExistingPaper ? '编辑试卷' : '上传试卷预览'"
              width="900px"
              :close-on-click-modal="false"
              @closed="onPaperDialogClosed"
              append-to-body
            >
              <div style="margin-bottom: 16px;">
                <el-form :inline="true">
                  <el-form-item label="试卷标题">
                    <el-input v-model="uploadedPaperTitle" placeholder="请输入试卷标题" style="width: 300px" />
                  </el-form-item>
                  <el-form-item>
                    <el-tag type="info">共 {{ uploadedPaperItems.length }} 题</el-tag>
                    <el-tag v-if="paperParseIssueCount > 0" type="danger" style="margin-left: 8px;">
                      {{ paperParseIssueCount }} 题存在问题
                    </el-tag>
                  </el-form-item>
                </el-form>
                <el-form :inline="true" style="margin-top: 8px;">
                  <el-form-item label="分数设置">
                    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                      <span style="display: flex; align-items: center;">
                        <span style="margin-right: 6px;">单选</span>
                        <el-input-number v-model="uploadedSingleScore" :min="0" :max="100" :precision="1" size="small" style="width: 100px;" />
                        <span style="margin-left: 4px;">分</span>
                      </span>
                      <span style="display: flex; align-items: center;">
                        <span style="margin-right: 6px;">多选</span>
                        <el-input-number v-model="uploadedMultiScore" :min="0" :max="100" :precision="1" size="small" style="width: 100px;" />
                        <span style="margin-left: 4px;">分</span>
                      </span>
                      <span style="display: flex; align-items: center;">
                        <span style="margin-right: 6px;">不定项</span>
                        <el-input-number v-model="uploadedIndeterminateScore" :min="0" :max="100" :precision="1" size="small" style="width: 100px;" />
                        <span style="margin-left: 4px;">分</span>
                      </span>
                      <span style="display: flex; align-items: center; gap: 8px;">
                        <span style="margin-right: 6px;">简答题</span>
                        <el-radio-group v-model="uploadedSaqScoreMode" size="small">
                          <el-radio-button value="uniform">统一分数</el-radio-button>
                          <el-radio-button value="custom">自定义</el-radio-button>
                        </el-radio-group>
                        <template v-if="uploadedSaqScoreMode === 'uniform'">
                          <el-input-number v-model="uploadedSaqScore" :min="0" :max="100" :precision="1" size="small" style="width: 100px;" />
                          <span>分</span>
                        </template>
                        <span v-else style="color: #909399; font-size: 12px;">（在下方每题单独设置）</span>
                      </span>
                    </div>
                  </el-form-item>
                </el-form>
                <!-- 解析功能区 -->
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e4e7ed; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <span style="color: #606266; font-size: 14px;">🔍 批量解析：</span>
                  <el-select v-model="llmModelId" placeholder="AI模型" size="small" style="width: 140px">
                    <el-option v-for="m in llmOptions" :key="m.value" :label="m.label" :value="m.value" />
                  </el-select>
                  <el-input-number v-model="topN" :min="1" :step="1" size="small" style="width: 75px" controls-position="right" />
                  <el-checkbox v-model="thinking" size="small">思考模式</el-checkbox>
                  <el-checkbox v-model="insertBlock" size="small">精准检索</el-checkbox>
                  <el-popover placement="bottom" :width="180" trigger="click">
                    <template #reference>
                      <el-button size="small" plain>
                        解析目标 ({{ paperParseTargets.length }})
                        <el-icon class="el-icon--right"><Filter /></el-icon>
                      </el-button>
                    </template>
                    <div style="padding: 8px 0;">
                      <div style="font-size: 12px; color: #909399; margin-bottom: 8px;">选择要解析的题目：</div>
                      <el-checkbox-group v-model="paperParseTargets" style="display: flex; flex-direction: column; gap: 8px;">
                        <el-checkbox label="no_explain">无解析</el-checkbox>
                        <el-checkbox label="has_explain">已有解析</el-checkbox>
                      </el-checkbox-group>
                    </div>
                  </el-popover>
                  <el-button
                    type="primary"
                    size="small"
                    @click="explainPaperItemsAsync"
                    :loading="paperExplaining"
                    :disabled="uploadedPaperItems.length === 0"
                    :icon="MagicStick"
                  >
                    批量解析
                  </el-button>
                  <el-button
                    size="small"
                    @click="stopPaperExplainTask"
                    :disabled="!paperTaskId"
                    type="warning"
                  >
                    停止任务
                  </el-button>
                  <span v-if="paperExplainMsg" style="color: #909399; font-size: 13px;">{{ paperExplainMsg }}</span>
                </div>
              </div>
              
              <div style="max-height: 500px; overflow-y: auto;">
                <div
                  v-for="(item, idx) in uploadedPaperItems"
                  :key="idx"
                  class="paper-preview-item"
                  :class="{ 'has-issue': hasParseIssue(item) }"
                >
                  <div class="preview-header">
                    <span class="preview-num">{{ idx + 1 }}.</span>
                    <el-tag v-if="item.qtype === 'saq'" type="primary" size="small">简答</el-tag>
                    <el-tag v-else-if="item.qtype === 'indeterminate'" type="success" size="small">不定项</el-tag>
                    <el-tag v-else-if="item.qtype === 'multi' || (!item.qtype && isMultiChoice(item))" type="warning" size="small">多选</el-tag>
                    <el-tag v-else type="info" size="small">单选</el-tag>
                    <el-tag v-if="item.qtype === 'saq' && item.category" size="small" effect="plain">{{ item.category }}</el-tag>
                    <!-- 简答题自定义分数输入 -->
                    <template v-if="item.qtype === 'saq' && uploadedSaqScoreMode === 'custom'">
                      <!-- 有知识条款：显示总分（条款小分之和） -->
                      <span v-if="item.knowledge_clauses && item.knowledge_clauses.length > 0 && item.clause_scores" style="display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;">
                        <span style="color: #409eff; font-size: 12px;">{{ item.score || 0 }}分</span>
                      </span>
                      <!-- 无知识条款：保持原有单分数输入 -->
                      <span v-else style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
                        <el-input-number v-model="item.score" :min="0" :max="100" :precision="1" :step="0.1" size="small" style="width: 90px;" placeholder="分数" />
                        <span style="color: #909399; font-size: 12px;">分</span>
                      </span>
                    </template>
                    <el-tag v-if="hasParseIssue(item) && item.qtype !== 'saq'" type="danger" size="small">需检查</el-tag>
                    <el-tag v-if="!item.answer && item.qtype !== 'saq'" type="warning" size="small">缺少答案</el-tag>
                    <el-tag v-if="getOptionsCount(item) < 2 && item.qtype !== 'saq'" type="warning" size="small">选项不足</el-tag>
                    <el-tag v-if="item.has_images" type="info" size="small">📷 图片题</el-tag>
                    <el-button
                      v-if="!item.explain || !item.explain.trim()"
                      size="small"
                      type="success"
                      link
                      @click="explainSinglePaperItem(idx)"
                      :loading="paperItemExplaining[idx]"
                      style="margin-left: auto;"
                    >
                      生成解析
                    </el-button>
                    <el-button
                      size="small"
                      type="primary"
                      link
                      @click="toggleEditPaperItem(idx)"
                      :style="item.explain && item.explain.trim() ? 'margin-left: auto;' : ''"
                    >
                      {{ editingPaperItemIdx === idx ? '收起' : '编辑' }}
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      link
                      @click="deletePaperItem(idx)"
                    >
                      删除
                    </el-button>
                  </div>
                  
                  <!-- 预览模式 -->
                  <div v-if="editingPaperItemIdx !== idx" class="preview-content">
                    <div class="preview-stem">{{ item.stem || '（题干为空）' }}</div>
                    <!-- 题干图片 -->
                    <div v-if="item.stem_images && item.stem_images.length > 0" class="q-stem-images" style="margin: 6px 0;">
                      <img
                        v-for="(img, imgIdx) in item.stem_images"
                        :key="imgIdx"
                        :src="'data:' + img.content_type + ';base64,' + img.base64"
                        :alt="'题干图片' + (imgIdx + 1)"
                        class="q-image"
                        style="max-height: 100px;"
                        @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                      />
                    </div>
                    <!-- 选择题显示选项 -->
                    <div v-if="item.qtype !== 'saq'" class="preview-options">
                      <template v-for="k in ['A','B','C','D','E','F','G','H']" :key="k">
                        <div v-if="(item.options && item.options[k] !== undefined) || (item.option_images && item.option_images[k] && item.option_images[k].length > 0)" class="preview-opt-item">
                          <span class="preview-opt">{{ k }}. {{ item.options[k] || '' }}</span>
                          <!-- 纯图片选项提示 -->
                          <span v-if="!item.options[k] && item.option_images && item.option_images[k] && item.option_images[k].length > 0" style="color: #909399; font-size: 12px;">(图片选项)</span>
                          <!-- 选项图片 -->
                          <template v-if="item.option_images && item.option_images[k] && item.option_images[k].length > 0">
                            <img
                              v-for="(img, imgIdx) in item.option_images[k]"
                              :key="imgIdx"
                              :src="'data:' + img.content_type + ';base64,' + img.base64"
                              :alt="k + '选项图片'"
                              class="q-image"
                              style="max-height: 60px; margin-left: 6px; vertical-align: middle;"
                              @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                            />
                          </template>
                        </div>
                      </template>
                    </div>
                    <!-- 选择题显示答案 -->
                    <div v-if="item.qtype !== 'saq'" class="preview-answer" :class="{ 'no-answer': !item.answer }">
                      {{ item.answer ? `答案：${item.answer}` : '⚠️ 缺少答案' }}
                    </div>
                    <!-- 知识条款列表（有知识条款的简答题） -->
                    <div v-if="item.qtype === 'saq' && item.knowledge_clauses && item.knowledge_clauses.length > 0" style="margin: 4px 0; padding-left: 8px; border-left: 2px solid #e4e7ed;">
                      <div v-for="(clause, ci) in item.knowledge_clauses" :key="ci" style="display: flex; align-items: flex-start; gap: 6px; margin: 3px 0; font-size: 13px; line-height: 1.5;">
                        <template v-if="uploadedSaqScoreMode === 'custom' && item.clause_scores">
                          <el-input-number
                            v-model="item.clause_scores[ci]"
                            :min="0" :max="100" :precision="1" :step="0.1" controls-position="right" size="small" style="width: 80px; flex-shrink: 0;"
                            @change="item.score = item.clause_scores.reduce((s, v) => s + (v || 0), 0)"
                          />
                          <span style="color: #909399; flex-shrink: 0;">分</span>
                        </template>
                        <span v-else style="color: #409eff; flex-shrink: 0; min-width: 30px;">{{ distributeScore(uploadedSaqScore, item.knowledge_clauses.length)[ci] }}分</span>
                        <span style="color: #606266;">知识条款{{ chineseNumber(ci + 1) }}：{{ clause }}</span>
                      </div>
                    </div>
                    <!-- 简答题显示答案和解析 -->
                    <div v-if="item.qtype === 'saq' && item.answer" class="preview-answer" style="white-space: pre-wrap; color: #409eff;">
                      答案：{{ item.answer }}
                    </div>
                    <div v-if="item.qtype === 'saq' && item.explain" class="preview-answer" style="white-space: pre-wrap; color: #67c23a;">
                      解析：{{ item.explain }}
                    </div>
                    <!-- 图片题标记 -->
                    <el-tag v-if="item.has_images" type="info" size="small" style="margin-top: 4px;">📷 含图片</el-tag>
                  </div>
                  
                  <!-- 编辑模式 -->
                  <div v-else class="preview-edit">
                    <el-form label-width="60px" size="small">
                      <el-form-item label="题干">
                        <el-input v-model="item.stem" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" />
                        <!-- 题干图片 -->
                        <div style="margin-top: 8px;">
                          <span style="color: #909399; font-size: 12px;">题干图片：</span>
                          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; align-items: center;">
                            <div v-for="(img, imgIdx) in (item.stem_images || [])" :key="imgIdx" class="editable-image-wrapper">
                              <img
                                :src="'data:' + img.content_type + ';base64,' + img.base64"
                                class="q-image"
                                style="max-height: 80px; cursor: pointer;"
                                @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                              />
                              <el-button class="img-delete-btn" type="danger" size="small" circle :icon="Delete" @click="deleteUploadedItemImage(Number(idx), 'stem', Number(imgIdx))" />
                            </div>
                            <el-button size="small" type="primary" plain :icon="Plus" @click="triggerUploadItemImage(idx, 'stem')">添加</el-button>
                          </div>
                        </div>
                      </el-form-item>
                      <el-form-item label="选项">
                        <div style="width: 100%;">
                          <div v-for="k in ['A','B','C','D','E','F','G','H']" :key="k" style="margin-bottom: 8px;">
                            <div style="display: flex; align-items: center;">
                              <span style="width: 24px; font-weight: bold;">{{ k }}.</span>
                              <el-input v-model="item.options[k]" placeholder="留空则不显示此选项" style="flex: 1;" />
                              <el-button size="small" type="primary" plain :icon="Plus" style="margin-left: 4px;" @click="triggerUploadItemImage(idx, 'option', k)">图</el-button>
                            </div>
                            <!-- 选项图片 -->
                            <div v-if="item.option_images && item.option_images[k] && item.option_images[k].length > 0" style="margin-left: 24px; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
                              <div v-for="(img, imgIdx) in item.option_images[k]" :key="imgIdx" class="editable-image-wrapper">
                                <img
                                  :src="'data:' + img.content_type + ';base64,' + img.base64"
                                  class="q-image"
                                  style="max-height: 60px; cursor: pointer;"
                                  @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                                />
                                <el-button class="img-delete-btn" type="danger" size="small" circle :icon="Delete" @click="deleteUploadedItemImage(Number(idx), 'option', Number(imgIdx), k)" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </el-form-item>
                      <el-form-item label="答案">
                        <el-input v-model="item.answer" type="textarea" :autosize="{ minRows: 1, maxRows: 6 }" placeholder="如 A 或 ABC（简答题填写参考答案）" />
                      </el-form-item>
                      <el-form-item label="解析">
                        <el-input v-model="item.explain" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" placeholder="选填，解析内容" />
                        <!-- 解析图片 -->
                        <div style="margin-top: 8px;">
                          <span style="color: #909399; font-size: 12px;">解析图片：</span>
                          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; align-items: center;">
                            <div v-for="(img, imgIdx) in (item.analysis_images || [])" :key="imgIdx" class="editable-image-wrapper">
                              <img
                                :src="'data:' + img.content_type + ';base64,' + img.base64"
                                class="q-image"
                                style="max-height: 60px; cursor: pointer;"
                                @click="previewImage('data:' + img.content_type + ';base64,' + img.base64)"
                              />
                              <el-button class="img-delete-btn" type="danger" size="small" circle :icon="Delete" @click="deleteUploadedItemImage(Number(idx), 'analysis', Number(imgIdx))" />
                            </div>
                            <el-button size="small" type="primary" plain :icon="Plus" @click="triggerUploadItemImage(idx, 'analysis')">添加</el-button>
                          </div>
                        </div>
                      </el-form-item>
                      <!-- 知识条款（简答题时显示） -->
                      <el-form-item v-if="item.qtype === 'saq'" label="知识条款">
                        <div style="width: 100%;">
                          <div
                            v-for="(clause, cIdx) in (item.knowledge_clauses || [])"
                            :key="cIdx"
                            style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px;"
                          >
                            <span style="min-width: 72px; color: #606266; font-size: 13px; line-height: 32px; flex-shrink: 0;">知识条款{{ chineseNumber(cIdx + 1) }}</span>
                            <el-input
                              v-model="item.knowledge_clauses[cIdx]"
                              type="textarea"
                              :autosize="{ minRows: 1, maxRows: 6 }"
                              style="flex: 1;"
                            />
                            <el-button
                              type="danger"
                              :icon="Close"
                              circle
                              size="small"
                              @click="removePaperItemClause(item, cIdx)"
                              title="删除此知识条款"
                            />
                          </div>
                          <el-button
                            type="primary"
                            plain
                            size="small"
                            @click="addPaperItemClause(item)"
                          >
                            + 添加知识条款
                          </el-button>
                        </div>
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
              </div>
              
              <template #footer>
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #606266; font-size: 13px; white-space: nowrap;">🔒 密码保护：</span>
                    <el-input
                      v-model="paperPassword"
                      placeholder="留空则不设密码"
                      style="width: 200px;"
                      size="default"
                      show-password
                      clearable
                      autocomplete="new-password"
                    />
                    <span style="color: #909399; font-size: 12px;">（用于查看/编辑/下载）</span>
                  </div>
                  <div>
                    <el-button @click="paperPreviewVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveUploadedPaper" :loading="savingUploadedPaper">
                      保存试卷
                    </el-button>
                  </div>
                </div>
              </template>
            </el-dialog>

            <!-- 密码验证对话框 -->
            <el-dialog
              v-model="paperPasswordDialogVisible"
              title="试卷密码验证"
              width="400px"
              :close-on-click-modal="false"
              append-to-body
            >
              <div style="padding: 10px 0;">
                <p style="margin-bottom: 12px; color: #606266;">
                  该试卷已设置密码保护，请输入密码以{{ paperPasswordAction === 'download' ? '下载' : paperPasswordAction === 'edit' ? '编辑' : '删除' }}试卷：
                </p>
                <el-input
                  v-model="paperPasswordInput"
                  placeholder="请输入试卷密码"
                  show-password
                  autocomplete="new-password"
                  @keyup.enter="verifyPaperPassword"
                />
              </div>
              <template #footer>
                <el-button @click="paperPasswordDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="verifyPaperPassword" :loading="verifyingPassword">
                  确认
                </el-button>
              </template>
            </el-dialog>

            <!-- 超级管理员密码管理对话框 -->
            <el-dialog
              v-model="passwordManageDialogVisible"
              :title="'密码管理 - ' + passwordManageTargetTitle"
              width="450px"
              :close-on-click-modal="false"
              append-to-body
            >
              <div style="padding: 10px 0;">
                <el-form label-width="80px">
                  <el-form-item label="当前密码">
                    <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                      <el-input
                        v-model="passwordManageValue"
                        :type="passwordManageShowPwd ? 'text' : 'password'"
                        placeholder="留空则清除密码"
                        :loading="passwordManageLoading"
                        clearable
                        style="flex: 1;"
                      />
                      <el-button
                        :icon="passwordManageShowPwd ? Close : Search"
                        @click="passwordManageShowPwd = !passwordManageShowPwd"
                        size="default"
                        circle
                        :title="passwordManageShowPwd ? '隐藏密码' : '查看密码'"
                      />
                    </div>
                  </el-form-item>
                </el-form>
                <p style="color: #909399; font-size: 12px; margin-top: 8px;">
                  提示：留空并保存将清除该试卷的密码保护。
                </p>
              </div>
              <template #footer>
                <el-button @click="passwordManageDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="savePasswordManage" :loading="passwordManageLoading">
                  保存
                </el-button>
              </template>
            </el-dialog>
          </div>
        </el-tab-pane>

        <!-- 成绩导出 -->
        <el-tab-pane v-if="showBjzxTabs" label="成绩导出" name="export">
          <div class="tab-content">
            <div class="action-bar">
              <el-select v-model="selectedExportExam" placeholder="选择考试场次" filterable style="width: 480px" @change="onExportExamChange">
                <el-option 
                  v-for="exam in sortedPublishedExams" 
                  :key="exam.exam_id" 
                  :label="`${exam.exam_name} (${exam.paper_title})`" 
                  :value="exam.exam_id"
                />
              </el-select>
              <el-button @click="loadPublishedExams" :loading="loadingPublished">刷新</el-button>
              <el-button type="primary" @click="exportZip" :loading="exportingZip" :disabled="!selectedExportExam">导出ZIP</el-button>
              <!-- <el-button type="success" @click="exportXlsx" :loading="exportingXlsx" :disabled="!selectedExportExam">导出Excel</el-button> -->
              <el-button @click="exportDocx" :loading="exportingDocx" :disabled="!selectedExportExam">导出DOCX</el-button>
              <!-- <el-button type="warning" plain @click="openFixAnswerDialog" :disabled="!selectedExportExam || !gradesStats">
                <el-icon style="margin-right: 2px;"><EditPen /></el-icon>修正答案
              </el-button> -->
              <span class="status-msg">{{ exportMessage }}</span>
            </div>
            
            <!-- 成绩统计图表 -->
            <div v-if="selectedExportExam && gradesStats" class="grades-stats-panel">
              <el-row :gutter="20">
                <!-- 总体概览 -->
                <el-col :span="8">
                  <el-card shadow="hover" class="stats-card">
                    <template #header>
                      <div class="stats-card-header">
                        <el-icon class="stats-icon"><TrendCharts /></el-icon>
                        <span>总体概览</span>
                      </div>
                    </template>
                    <div class="stats-overview">
                      <div class="stat-item">
                        <div class="stat-value">{{ gradesStats.total_students || 0 }}</div>
                        <div class="stat-label">参考人数</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ gradesStats.submitted_count || 0 }}</div>
                        <div class="stat-label">已交卷</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value highlight">{{ (gradesStats.avg_score || 0).toFixed(1) }}</div>
                        <div class="stat-label">平均分</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-value">{{ (gradesStats.pass_rate || 0).toFixed(1) }}%</div>
                        <div class="stat-label">及格率</div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                
                <!-- 分数分布 -->
                <el-col :span="8">
                  <el-card shadow="hover" class="stats-card">
                    <template #header>
                      <div class="stats-card-header">
                        <el-icon class="stats-icon"><Histogram /></el-icon>
                        <span>分数分布</span>
                      </div>
                    </template>
                    <div class="score-distribution">
                      <div v-for="(item, idx) in scoreDistribution" :key="idx" class="dist-item">
                        <div class="dist-label">{{ item.range }}</div>
                        <div class="dist-bar-wrapper">
                          <div class="dist-bar" :style="{ width: item.percent + '%', background: item.color }"></div>
                        </div>
                        <div class="dist-count">{{ item.count }}人 ({{ item.percent.toFixed(1) }}%)</div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                
                <!-- 最高/最低分 -->
                <el-col :span="8">
                  <el-card shadow="hover" class="stats-card">
                    <template #header>
                      <div class="stats-card-header">
                        <el-icon class="stats-icon"><Medal /></el-icon>
                        <span>成绩排名</span>
                      </div>
                    </template>
                    <div class="rank-info">
                      <div class="rank-item best">
                        <div class="rank-icon">🏆</div>
                        <div class="rank-content">
                          <div class="rank-title">最高分</div>
                          <div class="rank-score">{{ gradesStats.max_score || 0 }}</div>
                          <div class="rank-name">{{ gradesStats.max_score_student || '-' }}</div>
                        </div>
                      </div>
                      <el-divider />
                      <div class="rank-item worst">
                        <div class="rank-icon">📉</div>
                        <div class="rank-content">
                          <div class="rank-title">最低分</div>
                          <div class="rank-score">{{ gradesStats.min_score || 0 }}</div>
                          <div class="rank-name">{{ gradesStats.min_score_student || '-' }}</div>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
              
              <!-- 易错知识点统计 -->
              <el-card v-if="topKpErrors && topKpErrors.length > 0" shadow="hover" style="margin-top: 20px;">
                <template #header>
                  <div class="stats-card-header">
                    <el-icon class="stats-icon"><Warning /></el-icon>
                    <span>易错知识点 Top10</span>
                    <span style="margin-left: auto; color: #909399; font-size: 13px;">共 {{ topKpErrors.length }} 个知识点</span>
                  </div>
                </template>
                <div class="kp-error-chart">
                  <div v-for="(kp, idx) in topKpErrors" :key="idx" class="kp-error-item">
                    <div class="kp-rank" :class="{ 'top-three': Number(idx) < 3 }">{{ Number(idx) + 1 }}</div>
                    <div class="kp-name" :title="kp.name">{{ kp.name }}</div>
                    <div class="kp-bar-wrapper">
                      <div 
                        class="kp-bar" 
                        :style="{ 
                          width: getKpBarWidth(kp.error_count) + '%',
                          background: getKpBarColor(Number(idx))
                        }"
                      ></div>
                    </div>
                    <div class="kp-count">{{ kp.error_count }}次</div>
                    <el-button size="small" link type="primary" @click="viewKpDetail(kp.name)">详情</el-button>
                  </div>
                </div>
              </el-card>
              
              <!-- 错题 Top10 -->
              <el-card v-if="topWrongQuestions && topWrongQuestions.length > 0" shadow="hover" style="margin-top: 20px;">
                <template #header>
                  <div class="stats-card-header">
                    <el-icon class="stats-icon"><Failed /></el-icon>
                    <span>错题 Top10</span>
                    <span style="margin-left: auto; color: #909399; font-size: 13px;">共 {{ topWrongQuestions.length }} 道题</span>
                  </div>
                </template>
                <div class="wrong-question-chart">
                  <div v-for="(q, idx) in topWrongQuestions" :key="q.qid" class="wrong-question-item">
                    <div class="wq-rank" :class="{ 'top-three': Number(idx) < 3 }">{{ Number(idx) + 1 }}</div>
                    <el-tag class="wq-tag" size="small" :type="q.qtype === 'saq' ? 'warning' : (q.qtype === 'multi' ? 'success' : 'primary')">
                      {{ getQtypeLabel(q.qtype) }}
                    </el-tag>
                    <div class="wq-stem" :title="q.stem_full || q.stem">{{ q.stem }}</div>
                    <div class="wq-bar-wrapper">
                      <div 
                        class="wq-bar" 
                        :style="{ 
                          width: getWrongQBarWidth(q.error_count) + '%',
                          background: getWrongQBarColor(Number(idx))
                        }"
                      ></div>
                    </div>
                    <div class="wq-count">{{ q.error_count }}人错</div>
                    <el-button size="small" link type="primary" @click="viewQuestionDetail(q.qid)">详情</el-button>
                  </div>
                </div>
              </el-card>
              
              <!-- 成绩明细表 -->
              <el-card shadow="hover" style="margin-top: 20px;">
                <template #header>
                  <div class="stats-card-header">
                    <el-icon class="stats-icon"><List /></el-icon>
                    <span>成绩明细</span>
                    <span style="margin-left: auto; color: #909399; font-size: 13px;">共 {{ gradesStats.details?.length || 0 }} 人</span>
                  </div>
                </template>
                <div style="margin-bottom: 12px;">
                  <el-input v-model="gradesSearch" placeholder="搜索姓名/学号" clearable size="small" style="width: 240px;" :prefix-icon="Search" @input="gradesPage = 1" />
                </div>
                <el-table :data="pagedGradesDetails" border stripe max-height="400" style="width: 100%">
                  <el-table-column type="index" label="排名" width="70" :index="(idx) => (gradesPage - 1) * gradesPageSize + idx + 1" />
                  <el-table-column prop="student_name" label="学生姓名" min-width="120" />
                  <el-table-column prop="student_id" label="学号/警号" min-width="140" />
                  <el-table-column prop="mcq_score" label="选择题" width="100" sortable>
                    <template #default="scope">
                      {{ scope.row.mcq_score?.toFixed(1) || 0 }}
                    </template>
                  </el-table-column>
                  <el-table-column v-if="gradesStats.has_saq" prop="saq_score" label="简答题" width="100" sortable>
                    <template #default="scope">
                      {{ scope.row.saq_score?.toFixed(1) || 0 }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="score" label="总分" width="80" sortable>
                    <template #default="scope">
                      <span :class="{ 'score-pass': scope.row.score >= 60, 'score-fail': scope.row.score < 60 }">
                        {{ scope.row.score?.toFixed(1) || 0 }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="correct_count" label="正确题数" width="100" />
                  <el-table-column prop="submit_time" label="交卷时间" min-width="160" />
                  <el-table-column prop="cheat_count" label="作弊次数" width="110" sortable>
                    <template #default="scope">
                      <span v-if="!scope.row.cheat_count || scope.row.cheat_count === 0" style="color: #67c23a;">0</span>
                      <span v-else style="color: #f56c6c; font-weight: 600;">{{ scope.row.cheat_count }}</span>
                      <el-button
                        v-if="scope.row.cheat_count > 0"
                        size="small"
                        link
                        type="primary"
                        style="margin-left: 4px;"
                        @click="viewCheatDetail(scope.row)"
                      >详情</el-button>
                    </template>
                  </el-table-column>
                  <el-table-column v-if="isSuperAdminUser" label="操作" width="100" fixed="right" align="left">
                    <template #default="scope">
                      <el-button size="small" link type="primary" @click="openScoreEditDialog(scope.row)">改分</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div style="margin-top: 12px; display: flex; justify-content: center;">
                  <el-pagination
                    v-model:current-page="gradesPage"
                    v-model:page-size="gradesPageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="filteredGradesDetails.length"
                    layout="total, sizes, prev, pager, next"
                    small
                  />
                </div>
              </el-card>
            </div>
            
            <el-empty v-else-if="selectedExportPaper && !loadingGradesStats" description="暂无成绩数据" />
          </div>
        </el-tab-pane>
        
        <!-- 考试发布 -->
        <el-tab-pane v-if="showBjzxTabs" label="考试发布" name="publish">
          <div class="tab-content">
            <!-- 发布考试表单 -->
            <el-card shadow="never" style="margin-bottom: 20px;">
              <template #header>
                <span style="font-weight: 600;">📢 发布新考试</span>
              </template>
              
              <el-form :model="publishForm" label-width="100px" style="max-width: 700px;">
                <el-form-item label="考试名称" required>
                  <el-input v-model="publishForm.examName" placeholder="请输入考试名称，如：2024年度业务考核" />
                </el-form-item>
                
                <el-form-item label="选择试卷" required>
                  <el-select v-model="publishForm.paperId" placeholder="选择已生成的试卷" style="width: 100%">
                    <el-option
                      v-for="paper in paperList"
                      :key="paper.paper_id"
                      :label="paper.title"
                      :value="paper.paper_id"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="考试时间" required>
                  <el-date-picker
                    v-model="publishForm.timeRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    format="YYYY-MM-DD HH:mm"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item label="考试时长">
                  <el-input-number v-model="publishForm.durationMin" :min="10" :max="180" :step="5" />
                  <span style="margin-left: 10px; color: #909399;">分钟（学生进入考试后的答题时间）</span>
                </el-form-item>
                
                <el-form-item label="目标分组">
                  <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                    <div style="display: flex; gap: 10px; width: 100%;">
                      <el-select
                        v-model="publishForm.targetDepartments"
                        multiple
                        filterable
                        clearable
                        placeholder="可多选，不选择表示对所有人可见"
                        style="flex: 1"
                        :loading="loadingGroupList"
                        @change="onGroupSelectionChange"
                      >
                        <el-option
                          v-for="group in groupOptions"
                          :key="group.id"
                          :label="group.name"
                          :value="group.id"
                        />
                      </el-select>
                      <el-button 
                        type="primary" 
                        plain 
                        :disabled="publishForm.targetDepartments.length === 0"
                        :loading="loadingPersonTree"
                        @click="openPersonSelectDialog"
                      >
                        选择人员
                      </el-button>
                    </div>
                    <div v-if="publishForm.targetUsers.length > 0" style="display: flex; align-items: center; gap: 8px;">
                      <el-tag type="success" size="small">已选择 {{ publishForm.targetUsers.length }} 人</el-tag>
                      <el-button link type="primary" size="small" @click="openPersonSelectDialog" :disabled="publishForm.targetDepartments.length === 0">修改人员</el-button>
                      <el-button link type="primary" size="small" @click="previewDeptUsers" :disabled="publishForm.targetUsers.length === 0">查看名单</el-button>
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item label="考试说明">
                  <el-input
                    v-model="publishForm.description"
                    type="textarea"
                    :rows="3"
                    placeholder="可选，填写考试注意事项等"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="publishExam" :loading="publishing" :icon="Bell">
                    发布考试通知
                  </el-button>
                  <span class="status-msg" v-if="publishMessage">{{ publishMessage }}</span>
                </el-form-item>
              </el-form>
            </el-card>
            
            <!-- 已发布考试列表 -->
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600;">📋 已发布考试</span>
                  <div style="display: flex; gap: 10px;">
                    <el-button size="small" type="warning" @click="goToSaqGrading" :icon="Edit">简答题评分</el-button>
                    <el-button size="small" @click="loadPublishedExams" :loading="loadingPublished" :icon="Refresh">刷新</el-button>
                  </div>
                </div>
              </template>
              
              <div style="margin-bottom: 12px;">
                <el-input v-model="examSearch" placeholder="搜索考试名称/试卷" clearable size="small" style="width: 260px;" :prefix-icon="Search" @input="examPage = 1" />
              </div>
              <el-empty v-if="filteredExams.length === 0" description="暂无已发布的考试" />
              
              <el-table v-else :data="pagedExams" border stripe style="width: 100%">
                <el-table-column prop="exam_name" label="考试名称" min-width="180" />
                <el-table-column prop="paper_title" label="试卷" min-width="150" />
                <el-table-column label="考试时间" min-width="280">
                  <template #default="{ row }">
                    {{ row.start_time }} ~ {{ row.end_time }}
                  </template>
                </el-table-column>
                <el-table-column prop="duration_min" label="时长" width="80">
                  <template #default="{ row }">{{ row.duration_min }}分钟</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getExamStatusType(row.status)">{{ getExamStatusText(row.status) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="参与人数" width="100">
                  <template #default="{ row }">{{ row.participant_count || 0 }}</template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="row.status === 'pending' || row.status === 'active'"
                      type="danger"
                      size="small"
                      plain
                      @click="cancelExam(row)"
                      :loading="cancelingExam[row.exam_id]"
                    >
                      取消
                    </el-button>
                    <el-button
                      v-else-if="row.status === 'ended' || row.status === 'cancelled'"
                      type="info"
                      size="small"
                      plain
                      disabled
                    >
                      已结束
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      @click="deleteExam(row)"
                      :loading="deletingExam[row.exam_id]"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div style="margin-top: 12px; display: flex; justify-content: center;">
                <el-pagination
                  v-model:current-page="examPage"
                  v-model:page-size="examPageSize"
                  :page-sizes="[10, 20, 50]"
                  :total="filteredExams.length"
                  layout="total, sizes, prev, pager, next"
                  small
                />
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 考试设置 -->
        <el-tab-pane v-if="showBjzxTabs" label="考试设置" name="exam-settings">
          <div class="tab-content">
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600;">🛡️ 防作弊设置</span>
                  <el-button size="small" @click="loadAntiCheatConfig" :loading="loadingAntiCheat" :icon="Refresh">刷新</el-button>
                </div>
              </template>

              <el-form label-width="160px" style="max-width: 700px;">
                <!-- 总开关 -->
                <el-form-item label="防作弊总开关">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-switch
                      v-model="antiCheatConfig.enabled"
                      active-text="开启"
                      inactive-text="关闭"
                      inline-prompt
                      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                    />
                    <el-tag :type="antiCheatConfig.enabled ? 'success' : 'danger'" size="small" effect="plain">
                      {{ antiCheatConfig.enabled ? '防作弊已启用' : '防作弊已关闭' }}
                    </el-tag>
                  </div>
                  <div style="color: #909399; font-size: 12px; margin-top: 4px;">
                    关闭后，以下所有防作弊检测机制将在考试中停用
                  </div>
                </el-form-item>

                <el-divider content-position="left">检测项目（总开关开启时生效）</el-divider>

                <!-- 切屏检测 -->
                <el-form-item label="切屏检测">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-switch v-model="antiCheatConfig.tab_switch_detection" :disabled="!antiCheatConfig.enabled" />
                    <span style="color: #606266; font-size: 13px;">检测标签页切换、窗口最小化</span>
                  </div>
                </el-form-item>

                <!-- 窗口失焦检测 -->
                <el-form-item label="窗口失焦检测">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-switch v-model="antiCheatConfig.window_blur_detection" :disabled="!antiCheatConfig.enabled" />
                    <span style="color: #606266; font-size: 13px;">检测点击其他窗口（5秒防抖，避免输入法误判）</span>
                  </div>
                </el-form-item>

                <!-- 窗口缩小检测 -->
                <el-form-item label="窗口缩小检测">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-switch v-model="antiCheatConfig.window_resize_detection" :disabled="!antiCheatConfig.enabled" />
                    <span style="color: #606266; font-size: 13px;">检测浏览器窗口面积缩小至95%以下</span>
                  </div>
                </el-form-item>

                <!-- 强制最大化窗口 -->
                <el-form-item label="强制最大化窗口">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-switch v-model="antiCheatConfig.force_maximize" :disabled="!antiCheatConfig.enabled" />
                    <span style="color: #606266; font-size: 13px;">开始考试前要求浏览器窗口最大化</span>
                  </div>
                </el-form-item>

                <!-- 页面关闭警告 -->
                <el-form-item label="页面关闭警告">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-switch v-model="antiCheatConfig.beforeunload_warning" :disabled="!antiCheatConfig.enabled" />
                    <span style="color: #606266; font-size: 13px;">关闭/刷新页面时弹出确认提示</span>
                  </div>
                </el-form-item>

                <el-divider content-position="left">远程桌面检测</el-divider>

                <!-- VNC 端口检测 -->
                <el-form-item label="VNC 端口检测">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-switch v-model="antiCheatConfig.vnc_port_detection" :disabled="!antiCheatConfig.enabled" />
                    <span style="color: #606266; font-size: 13px;">开考前扫描指定端口，检测到则禁止开考</span>
                    <el-button
                      v-if="antiCheatConfig.vnc_port_detection"
                      :icon="Setting"
                      circle
                      size="small"
                      :disabled="!antiCheatConfig.enabled"
                      @click="openVncPortsDialog"
                      title="配置检测端口"
                    />
                  </div>
                </el-form-item>

                <el-divider content-position="left">切屏限制</el-divider>

                <!-- 最大切屏次数 -->
                <el-form-item label="最大切屏次数">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <el-input-number
                      v-model="antiCheatConfig.max_switch_count"
                      :min="1"
                      :max="20"
                      :disabled="!antiCheatConfig.enabled"
                      size="default"
                      style="width: 120px"
                    />
                    <span style="color: #606266; font-size: 13px;">次（达到后自动提交试卷）</span>
                  </div>
                </el-form-item>

                <!-- 保存按钮 -->
                <el-form-item>
                  <el-button type="primary" @click="saveAntiCheatConfig" :loading="savingAntiCheat">
                    保存设置
                  </el-button>
                  <span class="status-msg" v-if="antiCheatMessage">{{ antiCheatMessage }}</span>
                </el-form-item>
              </el-form>

              <!-- 功能说明 -->
              <el-collapse style="margin-top: 20px;">
                <el-collapse-item title="📖 防作弊功能说明" name="help">
                  <div style="font-size: 13px; color: #606266; line-height: 1.8;">
                    <p><strong>切屏检测：</strong>通过 <code>visibilitychange</code> 事件监听标签页切换和窗口最小化。</p>
                    <p><strong>窗口失焦检测：</strong>通过 <code>blur/focus</code> 事件监听窗口焦点变化，设有5秒延迟防抖以避免输入法等短暂失焦的误判。</p>
                    <p><strong>窗口缩小检测：</strong>通过 <code>resize</code> 事件监听窗口大小变化，当窗口面积缩小至初始面积的95%以下时触发。</p>
                    <p><strong>强制最大化窗口：</strong>考试开始前弹窗要求考生将浏览器窗口最大化，未最大化则无法进入考试。</p>
                    <p><strong>页面关闭警告：</strong>考试进行中关闭或刷新页面时弹出浏览器原生确认对话框。</p>
                    <p><strong>最大切屏次数：</strong>超过设定次数后系统将自动提交试卷，每次切屏会弹出警告并记录。</p>
                    <p><strong>VNC 端口检测：</strong>开考前扫描管理员配置的端口（默认 5900-5910），支持自定义范围和单个端口。如检测到端口开放则禁止进入正式考试。练习模式不受影响。</p>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-card v-if="activeTab === 'approval' || activeTab === 'password'" class="user-management-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>用户账号管理</span>
            <div class="card-actions">
              <el-input
                v-model="userSearch"
                size="small"
                placeholder="搜索用户名/邮箱"
                clearable
                @clear="applyUserSearch"
                @keyup.enter="applyUserSearch"
                style="width: 240px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" plain size="small" :loading="loadingUsers" :icon="Refresh" @click="loadUsers">
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <div class="user-list-body">
          <div v-if="loadingUsers" class="list-loading"><el-skeleton :rows="3" animated /></div>
          <el-empty v-else-if="filteredUsers.length === 0" description="暂无用户数据">
            <el-button type="primary" plain @click="loadUsers">刷新</el-button>
          </el-empty>
          <el-table
            v-else
            :data="pagedUsers"
            border
            size="small"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="username" label="用户名" min-width="140" />
            <el-table-column prop="email" label="邮箱" min-width="200">
              <template #default="scope">{{ scope.row.email || '—' }}</template>
            </el-table-column>
            <el-table-column prop="role" label="角色" min-width="120">
              <template #default="scope">
                <el-tag :type="scope.row.isBjzxAdmin ? 'success' : (scope.row.role === 'admin' ? 'warning' : 'info')">
                  {{ roleName(scope.row.role, scope.row.isBjzxAdmin) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="120">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 1" type="success" effect="plain">正常</el-tag>
                <el-tag v-else-if="scope.row.status === 0" type="warning" effect="plain">待审核</el-tag>
                <el-tag v-else-if="scope.row.status === -1" type="danger" effect="plain">已封禁</el-tag>
                <el-tag v-else-if="scope.row.status === -2" type="info" effect="plain">审核未通过</el-tag>
                <el-tag v-else type="info" effect="plain">未知</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <template v-if="isRegularUser(scope.row)">
                  <el-button
                    v-if="scope.row.status !== -1"
                    type="danger"
                    plain
                    size="small"
                    :loading="actionLoadingId === (scope.row.id || scope.row.username)"
                    @click="banUser(scope.row)"
                  >
                    封禁
                  </el-button>
                  <el-button
                    v-if="scope.row.status === -1"
                    type="success"
                    plain
                    size="small"
                    :loading="actionLoadingId === (scope.row.id || scope.row.username)"
                    @click="unbanUser(scope.row)"
                  >
                    解封
                  </el-button>
                </template>
                <el-tooltip v-else effect="dark" content="仅可封禁普通用户" placement="top">
                  <span>
                    <el-button type="danger" plain size="small" disabled>封禁</el-button>
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 12px; display: flex; justify-content: center;">
            <el-pagination
              v-model:current-page="userPage"
              v-model:page-size="userPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredUsers.length"
              layout="total, sizes, prev, pager, next"
              small
            />
          </div>
        </div>
      </el-card>

      <!-- 图片预览对话框 -->
      <el-dialog v-model="previewImageVisible" title="图片预览" width="80%" :close-on-click-modal="true">
        <div style="text-align: center;">
          <img :src="previewImageUrl" style="max-width: 100%; max-height: 70vh;" />
        </div>
      </el-dialog>

      <!-- 考点管理对话框 -->
      <el-dialog v-model="kpManageDialogVisible" title="管理考点列表" width="600px">
        <div style="margin-bottom: 16px;">
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <el-input 
              v-model="newKpName" 
              placeholder="输入新考点名称" 
              @keyup.enter="addKnowledgePoint"
              style="flex: 1;"
            />
            <el-button type="primary" @click="addKnowledgePoint">添加</el-button>
          </div>
          <div style="color: #909399; font-size: 12px;">
            共 {{ knowledgePointOptions.length }} 个考点（数据保存在浏览器本地）
          </div>
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
          <div 
            v-for="(kp, idx) in knowledgePointOptions" 
            :key="idx"
            class="kp-manage-item"
          >
            <template v-if="editingKpIndex === idx">
              <el-input 
                v-model="editingKpName" 
                size="small" 
                style="flex: 1;"
                @keyup.enter="saveEditKp"
              />
              <el-button size="small" type="primary" @click="saveEditKp">保存</el-button>
              <el-button size="small" @click="cancelEditKp">取消</el-button>
            </template>
            <template v-else>
              <span class="kp-name">《{{ kp }}》</span>
              <div class="kp-actions">
                <el-button size="small" type="primary" link @click="startEditKp(idx)">编辑</el-button>
                <el-popconfirm 
                  title="确定删除此考点？" 
                  confirm-button-text="删除" 
                  cancel-button-text="取消"
                  @confirm="deleteKnowledgePoint(idx)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" link>删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </div>
        </div>
        
        <template #footer>
          <el-button @click="kpManageDialogVisible = false">关闭</el-button>
          <el-popconfirm 
            title="确定重置为默认考点列表？" 
            confirm-button-text="确定" 
            cancel-button-text="取消"
            @confirm="resetKnowledgePoints"
          >
            <template #reference>
              <el-button type="warning">重置为默认</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-dialog>

      <!-- 分组用户预览对话框 -->
      <el-dialog v-model="deptUsersDialogVisible" title="目标分组人员名单" width="600px">
        <div v-if="loadingDeptUsers" style="text-align: center; padding: 20px;">
          <el-skeleton :rows="5" animated />
        </div>
        <template v-else>
          <div style="margin-bottom: 10px; color: #606266;">
            已选分组：<el-tag v-for="groupId in publishForm.targetDepartments" :key="groupId" size="small" style="margin-right: 5px;">{{ groupOptions.find(g => g.id === groupId)?.name || groupId }}</el-tag>
          </div>
          <div style="margin-bottom: 10px; font-weight: 500;">共 {{ deptUsersList.length }} 人</div>
          <el-table :data="pagedDeptUsersList" border stripe max-height="400" size="small">
            <el-table-column type="index" label="序号" width="60" :index="(idx: number) => (deptUsersPage - 1) * deptUsersPageSize + idx + 1" />
            <el-table-column prop="username" label="姓名" min-width="120" />
            <el-table-column prop="policeId" label="警号" min-width="120" />
            <el-table-column prop="groupName" label="分组" min-width="100" />
          </el-table>
          <div v-if="deptUsersList.length > deptUsersPageSize" style="margin-top: 12px; display: flex; justify-content: center;">
            <el-pagination
              v-model:current-page="deptUsersPage"
              v-model:page-size="deptUsersPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="deptUsersList.length"
              layout="total, sizes, prev, pager, next"
              small
            />
          </div>
        </template>
        <template #footer>
          <el-button @click="deptUsersDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 人员选择对话框 -->
      <el-dialog v-model="personSelectDialogVisible" title="选择目标人员" width="650px" :close-on-click-modal="false">
        <div v-if="loadingPersonTree" style="text-align: center; padding: 20px;">
          <el-skeleton :rows="6" animated />
        </div>
        <template v-else>
          <el-input
            v-model="personTreeFilterText"
            placeholder="搜索姓名或警号"
            clearable
            style="margin-bottom: 12px;"
            :prefix-icon="Search"
          />
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; color: #606266;">
              已勾选 <b style="color: #409EFF;">{{ personTreeCheckedCount }}</b> 人
            </span>
            <div style="display: flex; gap: 8px;">
              <el-button size="small" @click="checkAllPersonTree">全选</el-button>
              <el-button size="small" @click="uncheckAllPersonTree">全不选</el-button>
            </div>
          </div>
          <div style="max-height: 420px; overflow-y: auto; border: 1px solid #EBEEF5; border-radius: 4px; padding: 8px;">
            <el-tree
              ref="personTreeRef"
              :data="personTreeData"
              show-checkbox
              node-key="nodeId"
              default-expand-all
              :props="{ label: 'label', children: 'children' }"
              :filter-node-method="filterPersonTreeNode"
              @check="onPersonTreeCheck"
            />
          </div>
        </template>
        <template #footer>
          <el-button @click="personSelectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmPersonSelection">确认选择</el-button>
        </template>
      </el-dialog>

      <!-- 知识点详情对话框 -->
      <el-dialog v-model="kpDetailDialogVisible" :title="`知识点详情：${kpDetailData?.kp_name || ''}`" width="800px">
        <div v-if="loadingKpDetail" style="text-align: center; padding: 20px;">
          <el-skeleton :rows="5" animated />
        </div>
        <template v-else-if="kpDetailData">
          <div class="detail-summary">
            <div class="detail-stat">
              <span class="stat-label">错误人数</span>
              <span class="stat-value error">{{ kpDetailData.total_error_count }}</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">相关题目</span>
              <span class="stat-value">{{ kpDetailData.questions?.length || 0 }}</span>
            </div>
          </div>
          
          <el-divider content-position="left">错误学生</el-divider>
          <div class="error-students-list">
            <el-tag v-for="name in kpDetailData.error_students" :key="name" size="small" style="margin: 2px;">{{ name }}</el-tag>
            <span v-if="!kpDetailData.error_students?.length" style="color: #909399;">暂无</span>
          </div>
          
          <el-divider content-position="left">易错题目 Top5</el-divider>
          <div class="detail-questions">
            <div v-for="(q, idx) in kpDetailData.top5_questions" :key="q.qid" class="detail-question-item">
              <div class="dq-rank">{{ idx + 1 }}</div>
              <el-tag size="small" :type="q.qtype === 'saq' ? 'warning' : (q.qtype === 'multi' ? 'success' : 'primary')">
                {{ getQtypeLabel(q.qtype) }}
              </el-tag>
              <div class="dq-stem" :title="q.stem_full">{{ q.stem }}</div>
              <div class="dq-error">{{ q.error_count }}人错</div>
              <el-button size="small" link type="primary" @click="viewQuestionDetail(q.qid)">查看</el-button>
            </div>
          </div>
        </template>
        <template #footer>
          <el-button @click="kpDetailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 错题详情对话框 -->
      <el-dialog v-model="questionDetailDialogVisible" title="错题详情" width="800px">
        <div v-if="loadingQuestionDetail" style="text-align: center; padding: 20px;">
          <el-skeleton :rows="5" animated />
        </div>
        <template v-else-if="questionDetailData">
          <div class="detail-summary">
            <div class="detail-stat">
              <span class="stat-label">参考人数</span>
              <span class="stat-value">{{ questionDetailData.total_participants }}</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">错误人数</span>
              <span class="stat-value error">{{ questionDetailData.error_count }}</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">错误率</span>
              <span class="stat-value error">{{ ((questionDetailData.error_count / questionDetailData.total_participants) * 100).toFixed(1) }}%</span>
            </div>
          </div>
          
          <el-divider content-position="left">题目信息</el-divider>
          <div class="question-detail-content">
            <div class="qd-stem">
              <strong>题干：</strong>{{ questionDetailData.question?.stem }}
            </div>
            <div v-if="questionDetailData.question?.qtype !== 'saq'" class="qd-options">
              <div v-for="opt in questionDetailData.question?.options" :key="opt.label" class="qd-option" :class="{ correct: questionDetailData.question?.answer?.includes(opt.label) }">
                <span class="opt-label">{{ opt.label }}.</span>
                <span class="opt-text">{{ opt.text }}</span>
                <el-tag v-if="questionDetailData.question?.answer?.includes(opt.label)" size="small" type="success" style="margin-left: 8px;">正确答案</el-tag>
              </div>
            </div>
            <div v-else class="qd-answer">
              <strong>参考答案：</strong>
              <div class="answer-content">{{ questionDetailData.question?.answer }}</div>
            </div>
          </div>
          
          <el-divider v-if="questionDetailData.question?.qtype !== 'saq'" content-position="left">错误选项分布</el-divider>
          <div v-if="questionDetailData.question?.qtype !== 'saq'" class="wrong-choice-dist">
            <div v-for="[label, count] in questionDetailData.wrong_choice_distribution" :key="label" class="wcd-item">
              <span class="wcd-label">{{ label }}</span>
              <div class="wcd-bar-wrapper">
                <div class="wcd-bar" :style="{ width: getWrongChoiceBarWidth(count) + '%' }"></div>
              </div>
              <span class="wcd-count">{{ count }}人</span>
            </div>
            <div v-if="!questionDetailData.wrong_choice_distribution?.length" style="color: #909399;">暂无选项分布数据</div>
          </div>
          
          <el-divider content-position="left">错误学生</el-divider>
          <div class="error-students-list">
            <el-tag v-for="name in questionDetailData.error_students" :key="name" size="small" style="margin: 2px;">{{ name }}</el-tag>
            <span v-if="!questionDetailData.error_students?.length" style="color: #909399;">暂无</span>
          </div>
        </template>
        <template #footer>
          <el-button @click="questionDetailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>

      <!-- 修正答案对话框 -->
      <el-dialog
        v-model="fixAnswerDialogVisible"
        title="修正选择题答案（批量重算分数）"
        width="600px"
        destroy-on-close
      >
        <el-alert type="warning" :closable="false" style="margin-bottom: 16px;">
          修正答案后，该试卷所有考生的该题得分和总分将自动重算。此操作不可撤销，请谨慎操作。
        </el-alert>
        <el-form label-width="100px" size="default">
          <el-form-item label="选择题目">
            <el-select v-model="fixAnswerForm.question_index" placeholder="请选择要修正的题目" style="width: 100%;" filterable @change="onFixQuestionChange">
              <el-option
                v-for="q in mcqQuestionsOverview"
                :key="q.index"
                :value="q.index"
                :label="`第${q.index}题 [${qtypeLabelMap[q.qtype] || q.qtype}] ${q.stem}`"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="fixAnswerForm.question_index" label="当前答案">
            <el-tag type="info" size="large">{{ fixAnswerSelectedQ?.answer || '-' }}</el-tag>
          </el-form-item>
          <el-form-item v-if="fixAnswerForm.question_index && fixAnswerSelectedQ?.options && Object.keys(fixAnswerSelectedQ.options).length" label="选项">
            <div v-for="(text, label) in fixAnswerSelectedQ.options" :key="label" style="line-height: 1.8;">
              <strong>{{ label }}.</strong> {{ text }}
            </div>
          </el-form-item>
          <el-form-item v-if="fixAnswerForm.question_index" label="新答案">
            <el-input v-model="fixAnswerForm.new_answer" placeholder="输入正确答案，如 A / AB / ACD" style="width: 200px;" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">多选题请连写，如 ABD</span>
          </el-form-item>
        </el-form>
        <!-- 执行结果 -->
        <div v-if="fixAnswerResult" style="margin-top: 12px;">
          <el-alert :title="`修正完成：影响 ${fixAnswerResult.affected_count} 人`" type="success" :closable="false" style="margin-bottom: 8px;">
            <div>第{{ fixAnswerResult.question_index }}题 答案: {{ fixAnswerResult.old_answer }} → {{ fixAnswerResult.new_answer }}</div>
          </el-alert>
          <el-table :data="fixAnswerResult.score_changes" border size="small" max-height="250" style="width: 100%;">
            <el-table-column prop="student_name" label="姓名" width="100" />
            <el-table-column prop="student_id" label="学号" width="120" />
            <el-table-column label="该题得分" width="120">
              <template #default="scope">
                {{ scope.row.old_score }} → <span :style="{ color: scope.row.score_diff > 0 ? '#67c23a' : scope.row.score_diff < 0 ? '#f56c6c' : '#909399', fontWeight: 600 }">{{ scope.row.new_score }}</span>
              </template>
            </el-table-column>
            <el-table-column label="总分变化" width="140">
              <template #default="scope">
                {{ scope.row.old_total?.toFixed(1) }} → <span :style="{ fontWeight: 600 }">{{ scope.row.new_total?.toFixed(1) }}</span>
                <span v-if="scope.row.score_diff !== 0" :style="{ color: scope.row.score_diff > 0 ? '#67c23a' : '#f56c6c', marginLeft: '4px' }">
                  ({{ scope.row.score_diff > 0 ? '+' : '' }}{{ scope.row.score_diff }})
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <template #footer>
          <el-button @click="fixAnswerDialogVisible = false">{{ fixAnswerResult ? '关闭' : '取消' }}</el-button>
          <el-button v-if="!fixAnswerResult" type="primary" @click="submitFixAnswer" :loading="fixAnswerSaving" :disabled="!fixAnswerForm.question_index || !fixAnswerForm.new_answer">确认修正</el-button>
        </template>
      </el-dialog>

      <!-- 改分对话框 -->
      <el-dialog
        v-model="scoreEditDialogVisible"
        :title="`修改分数 — ${scoreEditData?.student_name || ''}`"
        width="420px"
        destroy-on-close
      >
        <template v-if="scoreEditData">
          <el-form label-width="90px" size="default">
            <el-form-item label="学生">
              <span>{{ scoreEditData.student_name }} ({{ scoreEditData.student_id }})</span>
            </el-form-item>
            <el-form-item label="选择题分数">
              <el-input-number v-model="scoreEditForm.mcq_score" :min="0" :precision="1" :step="1" style="width: 160px;" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px;">原始: {{ scoreEditData.orig_mcq?.toFixed(1) }}</span>
            </el-form-item>
            <el-form-item v-if="gradesStats?.has_saq" label="简答题分数">
              <el-input-number v-model="scoreEditForm.saq_score" :min="0" :precision="1" :step="1" style="width: 160px;" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px;">原始: {{ scoreEditData.orig_saq?.toFixed(1) }}</span>
            </el-form-item>
            <el-form-item label="修改后总分">
              <span style="font-size: 18px; font-weight: 600; color: #409eff;">
                {{ ((scoreEditForm.mcq_score || 0) + (scoreEditForm.saq_score || 0)).toFixed(1) }}
              </span>
            </el-form-item>
          </el-form>
        </template>
        <template #footer>
          <el-button v-if="scoreEditData?.has_override" type="warning" plain @click="clearScoreOverride" :loading="scoreEditSaving">恢复原始分数</el-button>
          <el-button @click="scoreEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitScoreOverride" :loading="scoreEditSaving">确认修改</el-button>
        </template>
      </el-dialog>

      <!-- VNC 端口配置弹窗 -->
      <el-dialog v-model="vncPortsDialogVisible" title="VNC 检测端口配置" width="480px" :close-on-click-modal="false">
        <div style="margin-bottom: 12px; color: #606266; font-size: 13px;">每条可以是单个端口（如 <b>5859</b>）或端口范围（如 <b>5900-5910</b>），端口号限 5800-5999。</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 36px; margin-bottom: 16px;">
          <el-tag
            v-for="(entry, idx) in vncPortEntries"
            :key="idx"
            closable
            size="large"
            @close="removeVncPortEntry(idx)"
            style="font-size: 14px;"
          >{{ entry }}</el-tag>
          <span v-if="vncPortEntries.length === 0" style="color: #c0c4cc; font-size: 13px; line-height: 32px;">暂无端口条目，请添加</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <el-input
            v-model="newVncPortEntry"
            placeholder="输入端口或范围，如 5900-5910 或 5859"
            size="default"
            style="flex: 1;"
            @keyup.enter="addVncPortEntry"
          />
          <el-button type="primary" :icon="Plus" @click="addVncPortEntry" size="default">添加</el-button>
        </div>
        <template #footer>
          <el-button @click="vncPortsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmVncPorts">确定</el-button>
        </template>
      </el-dialog>

      <!-- 作弊详情对话框 -->
      <el-dialog
        v-model="cheatDetailDialogVisible"
        :title="`作弊记录详情 — ${cheatDetailData?.student_name || ''}`"
        width="500px"
      >
        <template v-if="cheatDetailData">
          <div class="detail-summary" style="margin-bottom: 16px;">
            <div class="detail-stat">
              <span class="stat-label">学号/警号</span>
              <span class="stat-value">{{ cheatDetailData.student_id }}</span>
            </div>
            <div class="detail-stat">
              <span class="stat-label">作弊次数</span>
              <span class="stat-value error">{{ cheatDetailData.cheat_count }}</span>
            </div>
          </div>
          <el-divider content-position="left">触发记录</el-divider>
          <div v-if="cheatDetailData.cheat_events && cheatDetailData.cheat_events.length > 0">
            <el-table :data="cheatDetailData.cheat_events" border size="small" style="width: 100%">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column prop="time" label="触发时间" min-width="120" />
              <el-table-column prop="type" label="触发类型" min-width="160" />
            </el-table>
          </div>
          <div v-else style="color: #909399; text-align: center; padding: 16px;">
            暂无详细触发记录（考试期间未同步事件数据）
          </div>
        </template>
        <template #footer>
          <el-button @click="cheatDetailDialogVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, reactive, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Refresh, Search, Document, Upload, Download, MagicStick, Filter, Check, Close, InfoFilled, Bell, TrendCharts, Histogram, Medal, List, Plus, Edit, EditPen, Warning, Delete, Failed, Setting } from '@element-plus/icons-vue'
import { RoleNames, UserRole, canAccessAdminTabs, canAccessBjzxTabs, isSuperAdmin } from '@/config/permissions'
import { API_ENDPOINTS, MCQ_BASE_URL} from '@/config/api/api'
import { fetchWithAuth, getApiUrl, openInNewTab } from '@/utils/request'
import { renderMarkdown } from '@/utils/markdown'

interface QuestionImage {
  filename: string
  base64: string
  ext: string
  content_type: string
}

interface Question {
  qid: string
  stem: string
  options: Array<{ label: string; text: string; images?: QuestionImage[] }>
  answer: string
  analysis: string
  status: string
  qtype?: string  // 题目类型：single, multi, saq 等
  category?: string  // 简答题岗位分类
  reference_answer?: string  // 简答题参考答案
  ai_generated_answer?: boolean  // 标记答案是否由 AI 生成（需人工校对）
  deleted_at?: string
  deleted_by?: string
  has_images?: boolean  // 是否包含图片
  stem_images?: QuestionImage[]  // 题干图片
  analysis_images?: QuestionImage[]  // 解析图片
  knowledge_clauses?: string[]  // 知识条款
  knowledge_points?: string[]  // 结构化知识点列表
}

interface Paper {
  paper_id: string
  title: string
  visible?: boolean
  has_password?: boolean
}

export default defineComponent({
  name: 'AdminView',
  // eslint-disable-next-line vue/no-unused-components
  components: { Loading, Search, Refresh, Document, Upload, Download, MagicStick, Filter, Check, Close, InfoFilled, Bell, TrendCharts, Histogram, Medal, List, Plus, Edit, Delete, Warning, Failed },
  setup() {
    const store = useStore()
    const username = computed(() => store.state.user.username)
    const userRole = computed(() => store.getters.userRole)
    const isBjzxAdmin = computed(() => store.state.user.isBjzxAdmin || false)
    
    // 通用请求头（包含用户信息和边检智学管理员标识）
    const getAuthHeaders = (includeContentType = true) => {
      const headers: Record<string, string> = {
        'X-User-Name': encodeURIComponent(store.state.user.username),
        'X-User-Role': userRole.value || '',
        'X-Is-Bjzx-Admin': isBjzxAdmin.value ? 'true' : 'false'
      }
      if (includeContentType) {
        headers['Content-Type'] = 'application/json'
      }
      return headers
    }
    
    // Tab权限控制
    const showAdminTabs = computed(() => canAccessAdminTabs(userRole.value))
    const showBjzxTabs = computed(() => canAccessBjzxTabs(userRole.value, isBjzxAdmin.value))
    
    const roleText = computed(() => {
      const role = userRole.value as UserRole
      return role ? RoleNames[role] : '普通用户'
    })

    const activeTab = ref('questions')
    const myOldPassword = ref('')
    const myNewPassword = ref('')
    const resetUsername = ref('')
    const resetPassword = ref('')
    const resetPasswordConfirm = ref('')
    const selectedResetUserId = ref<string | number | null>(null)
    const changingPassword = ref(false)
    const resettingPassword = ref(false)

    // ======= 题库管理（MCQ） =======
    // --- 题库选择器 ---
    const currentBankId = ref('default')
    const banksList = ref<Array<{id: string; name: string; question_count?: number; created_at?: string}>>([])
    const loadingBanks = ref(false)

    const loadBanksList = async () => {
      loadingBanks.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/banks`, { method: 'GET', headers: getAuthHeaders(false) })
        const j = await r.json()
        if (j?.ok && Array.isArray(j.banks)) {
          banksList.value = j.banks
          // 如果题库列表为空，清空当前选择
          if (banksList.value.length === 0) {
            currentBankId.value = ''
          } else if (!banksList.value.find(b => b.id === currentBankId.value)) {
            // 如果当前选中的题库不存在，切换到第一个题库
            currentBankId.value = banksList.value[0].id
          }
        }
      } catch (e: any) {
        console.warn('加载题库列表失败:', e)
      } finally {
        loadingBanks.value = false
      }
    }

    const onBankChange = () => {
      loadQuestions()
      loadDeletedQuestions()
    }

    const showCreateBankDialog = async () => {
      try {
        const { value: name } = await ElMessageBox.prompt('请输入新题库名称', '新建题库', {
          confirmButtonText: '创建',
          cancelButtonText: '取消',
          inputPattern: /\S+/,
          inputErrorMessage: '名称不能为空',
        })
        const r = await fetch(`${MCQ_BASE_URL}/banks`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name }),
        })
        const j = await r.json()
        if (j?.ok) {
          ElMessage.success(`题库 "${name}" 创建成功`)
          await loadBanksList()
          currentBankId.value = j.bank.id
          onBankChange()
        } else {
          ElMessage.error(j?.msg || '创建失败')
        }
      } catch (e: any) {
        if (e !== 'cancel') ElMessage.error(e?.message || '创建失败')
      }
    }

    const showRenameBankDialog = async () => {
      const current = banksList.value.find(b => b.id === currentBankId.value)
      if (!current) return
      try {
        const { value: newName } = await ElMessageBox.prompt('请输入新名称', '重命名题库', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: current.name,
          inputPattern: /\S+/,
          inputErrorMessage: '名称不能为空',
        })
        const r = await fetch(`${MCQ_BASE_URL}/banks/${currentBankId.value}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: newName }),
        })
        const j = await r.json()
        if (j?.ok) {
          ElMessage.success('重命名成功')
          await loadBanksList()
        } else {
          ElMessage.error(j?.msg || '重命名失败')
        }
      } catch (e: any) {
        if (e !== 'cancel') ElMessage.error(e?.message || '重命名失败')
      }
    }

    const deleteCurrentBank = async () => {
      const current = banksList.value.find(b => b.id === currentBankId.value)
      if (!current) return
      try {
        await ElMessageBox.confirm(
          `确定删除题库 "${current.name}" 吗？该题库下的所有题目将被永久删除！`,
          '删除题库',
          { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'error' }
        )
        const r = await fetch(`${MCQ_BASE_URL}/banks/${currentBankId.value}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        const j = await r.json()
        if (j?.ok) {
          ElMessage.success(`已删除题库 "${current.name}"，移除 ${j.removed_count || 0} 道题目`)
          await loadBanksList()
          // 如果还有其他题库，切换到第一个；否则清空选择
          if (banksList.value.length > 0) {
            currentBankId.value = banksList.value[0].id
          } else {
            currentBankId.value = ''
          }
          onBankChange()
        } else {
          ElMessage.error(j?.msg || '删除失败')
        }
      } catch (e: any) {
        if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
      }
    }

    const uploadRef = ref<any>(null)
    const uploadFile = ref<File | null>(null)
    const normalizeOptions = (opts: any, optionImages?: Record<string, QuestionImage[]>): Array<{ label: string; text: string; images?: QuestionImage[] }> => {
      const out: Array<{ label: string; text: string; images?: QuestionImage[] }> = []
      const o = opts || {}
      const imgMap = optionImages || {}
      for (const k of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
        // 有文本或有图片的选项都要显示
        const hasText = o[k] !== undefined && o[k] !== null && o[k] !== ''
        const hasImages = imgMap[k] && imgMap[k].length > 0
        if (hasText || hasImages) {
          const item: { label: string; text: string; images?: QuestionImage[] } = { label: k, text: o[k] || '' }
          if (hasImages) {
            item.images = imgMap[k]
          }
          out.push(item)
        }
      }
      return out
    }
    const uploading = ref(false)
    const uploadMessage = ref('')
    const generating = ref(false)
    const generateMessage = ref('')
    // 解析目标状态选择（默认选中：无解析、已驳回、异常）
    const parseTargetStatuses = ref<string[]>(['none', 'rejected', 'abnormal'])

    const pollingInterval = ref<number | null>(null)
    const questions = ref<Question[]>([])
    const statusFilter = ref<'all'|'none'|'draft'|'approved'|'rejected'|'abnormal'|'processing'>('all')
    const searchQuery = ref('')
    const loadingQuestions = ref(false)
    const showingAnalysis = reactive<Record<string, boolean>>({})
    const approvingAll = ref(false)

    // 解析Tab切换状态（复杂验证策略时可切换查看单个选项）
    const analysisActiveTab = reactive<Record<string, string>>({})

    // 判断解析是否为复杂验证策略（通过文本标识判断）
    const isComplexValidation = (analysis: string): boolean => {
      return !!(analysis && analysis.includes('【复杂验证（逐选项核查·汇总）】'))
    }

    // 解析复杂验证的分项解析内容
    const parseOptionAnalyses = (analysis: string): Record<string, string> => {
      const result: Record<string, string> = {}
      if (!analysis) return result
      
      // 使用【选项X分析】标记分割各选项段落（比 A. 格式更可靠，避免误匹配内部 【证据链验证】 等）
      const optionPattern = /【选项([A-H])分析】([\s\S]*?)(?=【选项[A-H]分析】|【答案汇总|说明：本步骤|$)/g
      let match
      while ((match = optionPattern.exec(analysis)) !== null) {
        const label = match[1].toUpperCase()
        const content = match[2].trim()
        if (content) {
          result[label] = content
        }
      }
      
      return result
    }

    // 获取指定Tab对应的解析内容（优先使用后端per_option数据）
    const getAnalysisForTab = (qid: string, analysis: string, tab: string): string => {
      if (!analysis) return ''
      if (tab === 'all') return analysis
      
      // 优先使用后端返回的per_option数据
      const perOpts = perOptionMap[qid]
      if (perOpts && perOpts.length > 0) {
        const opt = perOpts.find(o => o.label === tab)
        if (opt && opt.explain) {
          return opt.explain
        }
      }
      
      // 回退：使用正则解析（兼容旧数据）
      const optionAnalyses = parseOptionAnalyses(analysis)
      return optionAnalyses[tab] || '（无该选项解析）'
    }

    // 获取指定Tab对应的参考资料（过滤分组）
    const getSourcesForTab = (qid: string, tab: string): any[] => {
      const src = sourcesMap[qid]
      if (!Array.isArray(src) || !src.length) return []
      
      // 如果是"全部"Tab，返回所有
      if (tab === 'all') return src
      
      // 检查是否为分组结构
      const first = src[0] as any
      if (first && typeof first === 'object' && Array.isArray(first.sources)) {
        // 分组结构，只返回对应选项的组
        return src.filter((group: any) => group.label === tab)
      }
      
      // 非分组结构，返回全部
      return src
    }

    // 获取题目可用的Tab选项
    const getAvailableTabs = (q: Question): string[] => {
      const tabs = ['all']
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach(opt => {
          if (opt.label) tabs.push(opt.label.toUpperCase())
        })
      }
      return tabs
    }

    // 参考资料缓存与渲染（结构与 qa_public.html 对齐）
    const sourcesMap = reactive<Record<string, any[]>>({})
    const sourcesLoading = reactive<Record<string, boolean>>({})
    const sourcesLoaded = reactive<Record<string, boolean>>({})
    const sourcesError = reactive<Record<string, string>>({})
    // 分选项解析缓存（复杂验证策略）
    const perOptionMap = reactive<Record<string, Array<{label: string, explain: string}>>>({})

    const sourcePassages = (src: any): string[] => {
      const out: string[] = []
      const keys = [
        'passages_all',
        'passages',
        'keyPassage',
        'key_passage',
        'passage',
        'text',
        'content',
        'chunk',
        'segment',
        'excerpt'
      ]
      for (const k of keys) {
        const v = src?.[k]
        if (Array.isArray(v)) out.push(...v.map((x: any) => String(x)))
        else if (v != null) out.push(String(v))
      }
      return out.filter(Boolean)
    }

    const getSourceTitle = (s: any, idx: number): string => {
      const titleRaw = s?.fileName || s?.file_name || s?.title || s?.docId || `来源 ${idx + 1}`
      return `[${idx + 1}] ${String(titleRaw)}`
    }

    const getSourceMeta = (s: any): string => {
      const meta: string[] = []
      const init = (s?.initialScore ?? s?.initial_score)
      if (init !== undefined && init !== '') meta.push(`初始分:${init}`)
      const rer = (s?.rerankedScore ?? s?.reranked_score ?? s?.score)
      if (rer !== undefined && rer !== '') meta.push(`重排分:${rer}`)
      const page = (s?.page ?? s?.page_no ?? s?.page_num)
      if (page !== undefined && page !== '') meta.push(`页:${page}`)
      return meta.join(' / ')
    }

    const isGroupedSources = (qid: string): boolean => {
      const src = sourcesMap[qid]
      if (!Array.isArray(src) || !src.length) return false
      const first = src[0] as any
      return !!(first && typeof first === 'object' && Array.isArray(first.sources))
    }

    const loadSources = async (qid: string) => {
      if (!qid) return
      if (sourcesLoaded[qid] || sourcesLoading[qid]) return
      sourcesLoading[qid] = true
      sourcesError[qid] = ''
      try {
        let url = `${MCQ_BASE_URL}/bank/sources?qid=${encodeURIComponent(qid)}`
        let res: Response
        try {
          res = await fetch(url, { method: 'GET' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        } catch (_err) {
          url = `/mcq_public/bank/sources?qid=${encodeURIComponent(qid)}`
          res = await fetch(url, { method: 'GET' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
        }
        const j = await res.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || '获取参考资料失败')
        }
        const src = j.sources || []
        sourcesMap[qid] = Array.isArray(src) ? src : []
        // 保存分选项解析数据（复杂验证策略）
        const perOpt = j.per_option || []
        perOptionMap[qid] = Array.isArray(perOpt) ? perOpt : []
        sourcesLoaded[qid] = true
      } catch (error: any) {
        sourcesError[qid] = error?.message || String(error)
      } finally {
        sourcesLoading[qid] = false
      }
    }

    // ==== MCQ 扩展状态（仅题库管理内部使用） ====
    const exportingBank = ref(false)
    const importingBank = ref(false)
    const bankImportRef = ref<HTMLInputElement | null>(null)
    const asyncExplaining = ref(false)
    const asyncMsg = ref('')
    const currentTaskId = ref<string | null>(null)
    const currentTaskStatus = ref<string>('')  // queued, running, stopped, done, failed
    const pendingTaskDismissed = ref(false)  // 是否忽略未完成任务提示
    const stoppingTask = ref(false)
    const resumingTask = ref(false)
    const llmOptions = ref([
      { value: 'qwen3-32b',     label: 'Qwen (通用) ' },
      { value: 'qwen2025',      label: 'Qwen (增强)' },
      { value: 'deepseek',      label: 'DeepSeekv3.1' },
      { value: 'deepseek-3.2',  label: 'DeepSeekv3.2' },
      //{ value: 'qwen-plus',     label: 'Qwen (云端) ' },
      //{ value: 'qwen3-14b-lora',label: 'qwen3-14b-lora' },
      //{ value: 'deepseek-32b',  label: 'deepseek-32b (deepseek-r1-distill-qwen-32b)' },
    ])
    const llmModelId = ref('deepseek')
    const topN = ref(10)
    const thinking = ref(true)
    const insertBlock = ref(false)
    const rejectingAll = ref(false)
    const page = ref(1)
    const pageSize = ref(50)
    const rowRegenLoading = reactive<Record<string, boolean>>({})
    const deletingQuestion = reactive<Record<string, boolean>>({})
    const editingId = ref<string | null>(null)
    const editBuf = reactive<any>({ stem:'', answer:'', explain:'', options:{}, stem_images: [], option_images: {}, analysis_images: [], knowledge_point: '', knowledge_clauses: [] })
    const counterMsg = ref('')

    // 批量选择相关
    const selectedQuestions = ref<string[]>([])
    const selectAll = ref(false)

    // 回收站相关
    const deletedQuestions = ref<Question[]>([])
    const selectedDeleted = ref<string[]>([])
    const selectAllDeleted = ref(false)
    const loadingDeleted = ref(false)
    const recycleMessage = ref('')
    const recyclePage = ref(1)
    const recyclePageSize = ref(50)
    const restoringQuestion = reactive<Record<string, boolean>>({})
    const permanentDeleting = reactive<Record<string, boolean>>({})

    // 回收站分页计算属性
    const pagedDeletedQuestions = computed(() => {
      const start = (recyclePage.value - 1) * recyclePageSize.value
      return deletedQuestions.value.slice(start, start + recyclePageSize.value)
    })

    // 回收站全选切换（只选当前页）
    const toggleSelectAllDeleted = () => {
      if (selectAllDeleted.value) {
        selectedDeleted.value = pagedDeletedQuestions.value.map(q => q.qid)
      } else {
        selectedDeleted.value = []
      }
    }

    const filteredQuestions = computed(() => {
      try {
        let result = questions.value
        if (statusFilter.value !== 'all') {
          result = result.filter(q => q.status === statusFilter.value)
        }
        const query = searchQuery.value.trim().toLowerCase()
        if (query) {
          result = result.filter(q => {
            if (q.stem && q.stem.toLowerCase().includes(query)) return true
            if (q.options && Array.isArray(q.options)) {
              return q.options.some((opt: any) => opt.text && opt.text.toLowerCase().includes(query))
            }
            return false
          })
        }
        return result
      } catch { return questions.value || [] }
    })

    const paperTitle = ref('')
    const creatingPaper = ref(false)
    const paperMessage = ref('')
    const generatePaperPassword = ref('')  // 从题库生成试卷时的密码

    // 分数设置
    const singleScore = ref(1)       // 单选题分数
    const multiScore = ref(5)        // 多选题分数
    const indeterminateScore = ref(5) // 不定项分数
    const saqScore = ref(10)         // 简答题分数
    const saqScoreMode = ref<'uniform' | 'custom'>('uniform')  // 简答题分数模式
    const saqCustomScores = reactive<Record<string, number>>({})  // 简答题自定义分数 {qid: score}
    const saqClauseScores = reactive<Record<string, number[]>>({})  // 简答题知识条款分数 {qid: [分1, 分2, ...]}

    // 均匀分配分数（保证总和等于total），例: distributeScore(10, 3) => [3, 3, 4]
    const distributeScore = (total: number, count: number): number[] => {
      if (count <= 0) return []
      const base = Math.floor(total / count)
      const remainder = total - base * count
      return Array.from({ length: count }, (_, i) => base + (i >= count - remainder ? 1 : 0))
    }

    // 获取某题知识条款分数之和
    const getSaqClauseTotal = (qid: string): number => {
      const scores = saqClauseScores[qid]
      if (!scores || scores.length === 0) return 0
      return scores.reduce((sum, s) => sum + (s || 0), 0)
    }

    // 切换到自定义分数模式时，为简答题初始化默认分数
    watch(saqScoreMode, (newMode) => {
      if (newMode === 'custom') {
        approvedQuestions.value.forEach(q => {
          if (q.qtype === 'saq') {
            if (q.knowledge_clauses && q.knowledge_clauses.length > 0) {
              // 有知识条款：按条款数量分配分数
              if (!saqClauseScores[q.qid] || saqClauseScores[q.qid].length !== q.knowledge_clauses.length) {
                saqClauseScores[q.qid] = distributeScore(saqScore.value, q.knowledge_clauses.length)
              }
              saqCustomScores[q.qid] = getSaqClauseTotal(q.qid)
            } else if (saqCustomScores[q.qid] === undefined) {
              saqCustomScores[q.qid] = saqScore.value
            }
          }
        })
      }
    })

    // 试卷列表管理
    const paperList = ref<Paper[]>([])
    const loadingPaperList = ref(false)
    const deletingPaper = reactive<Record<string, boolean>>({})
    const togglingVisibility = reactive<Record<string, boolean>>({})
    const paperListSearch = ref('')
    const paperListPage = ref(1)
    const paperListPageSize = ref(10)
    const filteredPaperList = computed(() => {
      const keyword = paperListSearch.value.trim().toLowerCase()
      if (!keyword) return [...paperList.value]
      return paperList.value.filter(p => p.title.toLowerCase().includes(keyword) || p.paper_id.toLowerCase().includes(keyword))
    })
    const pagedPaperList = computed(() => {
      const start = (paperListPage.value - 1) * paperListPageSize.value
      return filteredPaperList.value.slice(start, start + paperListPageSize.value)
    })
    const exportPapers = ref<Paper[]>([])
    const selectedExportPaper = ref('')
    const selectedExportExam = ref('')
    const loadingExportPapers = ref(false)
    const exportingZip = ref(false)
    const exportingDocx = ref(false)
    const exportingXlsx = ref(false)
    const exportMessage = ref('')

    // 试卷题目选择相关
    const paperQuestionFilter = ref<'all' | 'single' | 'multi' | 'saq'>('all')
    const paperQuestionSearch = ref('')
    const selectedPaperQuestions = ref<string[]>([])
    const selectAllPaperQuestions = ref(false)
    const selectedKnowledgePoints = ref<string[]>([])  // 知识点筛选
    const paperQuestionPage = ref(1)
    const paperQuestionPageSize = ref(50)

    // 试卷生成模式
    const paperGenerateMode = ref<'manual' | 'random'>('manual')

    // 随机抽取配置
    const randomSingleCount = ref(5)
    const randomMultiCount = ref(5)
    const randomSaqCount = ref(0)    // 简答题数量
    const randomIndeterminateSingleCount = ref(0)  // 不定项中的单选数量
    const randomIndeterminateMultiCount = ref(0)   // 不定项中的多选数量
    // 兼容旧代码：计算总不定项数量
    const randomIndeterminateCount = computed(() => randomIndeterminateSingleCount.value + randomIndeterminateMultiCount.value)

    // 计算题库中各类型的题目数量（排除SAQ）
    const singleApprovedCount = computed(() => {
      return approvedQuestions.value.filter(q => q.qtype !== 'saq' && !isMultiChoice(q)).length
    })
    const multiApprovedCount = computed(() => {
      return approvedQuestions.value.filter(q => q.qtype !== 'saq' && isMultiChoice(q)).length
    })
    const saqApprovedCount = computed(() => {
      return approvedQuestions.value.filter(q => q.qtype === 'saq').length
    })

    // 不定项配置（手动模式下使用）
    const enableIndeterminate = ref(false)
    const indeterminateMode = ref<'select' | 'count'>('select')
    const indeterminateSingleCount = ref(0)
    const indeterminateMultiCount = ref(0)
    const indeterminateTotalCount = ref(10)
    const selectedIndeterminateQuestions = ref<string[]>([])

    // 切换题目的不定项状态
    const toggleIndeterminate = (qid: string) => {
      const idx = selectedIndeterminateQuestions.value.indexOf(qid)
      if (idx > -1) {
        selectedIndeterminateQuestions.value.splice(idx, 1)
      } else {
        selectedIndeterminateQuestions.value.push(qid)
      }
    }

    // 上传试卷相关
    const paperUploadRef = ref<HTMLInputElement | null>(null)
    const paperPreviewVisible = ref(false)
    const uploadedPaperTitle = ref('')
    const uploadedPaperItems = ref<any[]>([])
    const editingPaperItemIdx = ref<number | null>(null)
    const savingUploadedPaper = ref(false)
    // 上传试卷分数配置
    const uploadedSingleScore = ref(1)
    const uploadedMultiScore = ref(5)
    const uploadedIndeterminateScore = ref(5)
    const uploadedSaqScore = ref(10)
    const uploadedSaqScoreMode = ref<'uniform' | 'custom'>('uniform')  // 简答题分数模式：统一/自定义

    // 切换到自定义分数模式时，为没有分数的简答题设置默认分数
    watch(uploadedSaqScoreMode, (newMode) => {
      if (newMode === 'custom') {
        uploadedPaperItems.value.forEach(item => {
          if (item.qtype === 'saq') {
            if (item.knowledge_clauses && item.knowledge_clauses.length > 0) {
              // 有知识条款：按条款数量分配分数
              if (!item.clause_scores || item.clause_scores.length !== item.knowledge_clauses.length) {
                item.clause_scores = distributeScore(uploadedSaqScore.value, item.knowledge_clauses.length)
              }
              item.score = item.clause_scores.reduce((s: number, v: number) => s + (v || 0), 0)
            } else if (item.score === undefined || item.score === null) {
              item.score = uploadedSaqScore.value
            }
          }
        })
      }
    })

    // 编辑已有试卷相关
    const editPaperSelected = ref('')
    const loadingPaperDetail = ref(false)
    const isEditingExistingPaper = ref(false)
    const editPaperOriginalId = ref('')
    
    // 试卷密码保护相关
    const paperPassword = ref('')  // 保存试卷时设置的密码
    const paperPasswordDialogVisible = ref(false)  // 密码验证对话框
    const paperPasswordInput = ref('')  // 用户输入的密码
    const paperPasswordAction = ref<'download' | 'edit' | 'view'>('download')  // 当前操作类型
    const paperPasswordTargetId = ref('')  // 当前操作的试卷ID
    const verifyingPassword = ref(false)
    const isSuperAdminUser = computed(() => isSuperAdmin(userRole.value))
    // 超级管理员密码管理对话框
    const passwordManageDialogVisible = ref(false)
    const passwordManageTargetId = ref('')
    const passwordManageTargetTitle = ref('')
    const passwordManageValue = ref('')
    const passwordManageLoading = ref(false)
    const passwordManageShowPwd = ref(false)

    // 试卷解析相关
    const paperExplaining = ref(false)
    const paperExplainMsg = ref('')
    const paperTaskId = ref('')
    const paperPollingInterval = ref<number | null>(null)
    const paperParseTargets = ref<string[]>(['no_explain'])  // 默认只解析无解析的题目
    const paperItemExplaining = reactive<Record<number, boolean>>({})  // 单题解析loading状态

    // ======= 考试发布相关 =======
    const publishForm = reactive({
      examName: '',
      paperId: '',
      timeRange: [] as string[],
      durationMin: 60,
      description: '',
      targetDepartments: [] as string[],  // 目标部门列表
      targetUsers: [] as number[]  // 细化到个人的用户ID列表
    })
    const publishing = ref(false)
    const publishMessage = ref('')
    const publishedExams = ref<any[]>([])
    const loadingPublished = ref(false)
    const cancelingExam = reactive<Record<string, boolean>>({})
    const deletingExam = reactive<Record<string, boolean>>({})
    const examSearch = ref('')
    const examPage = ref(1)
    const examPageSize = ref(10)
    const filteredExams = computed(() => {
      const keyword = examSearch.value.trim().toLowerCase()
      const list = keyword
        ? publishedExams.value.filter(e =>
            (e.exam_name || '').toLowerCase().includes(keyword) ||
            (e.paper_title || '').toLowerCase().includes(keyword)
          )
        : [...publishedExams.value]
      return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    })
    const sortedPublishedExams = computed(() => {
      return [...publishedExams.value].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    })
    const pagedExams = computed(() => {
      const start = (examPage.value - 1) * examPageSize.value
      return filteredExams.value.slice(start, start + examPageSize.value)
    })

    // ======= 防作弊配置相关 =======
    const antiCheatConfig = reactive({
      enabled: true,
      tab_switch_detection: true,
      window_blur_detection: true,
      window_resize_detection: true,
      force_maximize: true,
      beforeunload_warning: true,
      max_switch_count: 3,
      vnc_port_detection: true,
      vnc_ports: '5900-5910',
    })
    const vncPortsDialogVisible = ref(false)
    const vncPortEntries = ref<string[]>([])
    const newVncPortEntry = ref('')

    const openVncPortsDialog = () => {
      const raw = antiCheatConfig.vnc_ports || ''
      vncPortEntries.value = raw.split(/[,，;；]/).map(s => s.trim()).filter(Boolean)
      newVncPortEntry.value = ''
      vncPortsDialogVisible.value = true
    }

    const addVncPortEntry = () => {
      const val = newVncPortEntry.value.trim()
      if (!val) return
      // validate: single port or range
      if (/^\d+$/.test(val)) {
        const p = parseInt(val, 10)
        if (p < 5800 || p > 5999) { ElMessage.warning('端口号限 5800-5999'); return }
      } else if (/^\d+\s*[-~～]\s*\d+$/.test(val)) {
        const parts = val.split(/[-~～]/).map(s => parseInt(s.trim(), 10))
        if (parts[0] < 5800 || parts[1] > 5999 || parts[0] > parts[1]) { ElMessage.warning('端口范围限 5800-5999'); return }
      } else {
        ElMessage.warning('格式无效，请输入单个端口（如 5859）或范围（如 5900-5910）')
        return
      }
      if (vncPortEntries.value.includes(val)) { ElMessage.warning('该条目已存在'); return }
      vncPortEntries.value.push(val)
      newVncPortEntry.value = ''
    }

    const removeVncPortEntry = (idx: number) => {
      vncPortEntries.value.splice(idx, 1)
    }

    const confirmVncPorts = () => {
      antiCheatConfig.vnc_ports = vncPortEntries.value.join(', ')
      vncPortsDialogVisible.value = false
    }

    const loadingAntiCheat = ref(false)
    const savingAntiCheat = ref(false)
    const antiCheatMessage = ref('')
    const antiCheatSnapshot = ref('')  // 用于检测未保存修改

    const isAntiCheatDirty = computed(() => {
      return antiCheatSnapshot.value !== '' && antiCheatSnapshot.value !== JSON.stringify(antiCheatConfig)
    })

    const loadAntiCheatConfig = async () => {
      loadingAntiCheat.value = true
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/anti_cheat_config`)
        const data = await resp.json()
        if (data?.ok && data.config) {
          Object.assign(antiCheatConfig, data.config)
          antiCheatSnapshot.value = JSON.stringify(antiCheatConfig)
        }
      } catch (e: any) {
        console.error('加载防作弊配置失败:', e)
      } finally {
        loadingAntiCheat.value = false
      }
    }

    const saveAntiCheatConfig = async () => {
      savingAntiCheat.value = true
      antiCheatMessage.value = ''
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/anti_cheat_config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: { ...antiCheatConfig } })
        })
        const data = await resp.json()
        if (data?.ok) {
          antiCheatMessage.value = '保存成功'
          ElMessage.success('防作弊配置已保存')
          if (data.config) {
            Object.assign(antiCheatConfig, data.config)
          }
          antiCheatSnapshot.value = JSON.stringify(antiCheatConfig)
        } else {
          antiCheatMessage.value = '保存失败：' + (data?.msg || '未知错误')
          ElMessage.error('保存失败：' + (data?.msg || '未知错误'))
        }
      } catch (e: any) {
        antiCheatMessage.value = '保存失败：' + (e.message || '网络错误')
        ElMessage.error('保存失败：' + (e.message || '网络错误'))
      } finally {
        savingAntiCheat.value = false
      }
    }

    // 分组列表 - 从接口动态加载
    const loadingGroupList = ref(false)
    const groupOptions = ref<Array<{ id: string; name: string; remark?: string; status?: number }>>([])

    // 加载分组列表
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
                id: String(group?.id ?? '').trim(),
                name: String(group?.name ?? `分组${group?.id ?? ''}`).trim(),
                remark: group?.remark ? String(group.remark).trim() : '',
                status: Number.isNaN(statusNumber) ? undefined : statusNumber
              }
            })
            .filter((group: { id: string; name: string }) => group.id)
        } else {
          throw new Error(response.data?.message || '获取分组列表失败')
        }
      } catch (error: any) {
        console.warn('加载分组列表失败', error)
      } finally {
        loadingGroupList.value = false
      }
    }

    // 知识点/考点列表（从服务器加载，所有电脑共享）
    const knowledgePointOptions = ref<string[]>([])
    // 编辑时选中的知识点数组
    const editSelectedKnowledgePoints = ref<string[]>([])
    const loadingKnowledgePoints = ref(false)

    // 考点管理相关
    const kpManageDialogVisible = ref(false)
    const newKpName = ref('')
    const editingKpIndex = ref<number | null>(null)
    const editingKpName = ref('')

    // 从服务器加载考点列表
    const loadKnowledgePointOptions = async () => {
      loadingKnowledgePoints.value = true
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/knowledge_points`)
        const data = await resp.json()
        if (data?.ok && Array.isArray(data.points)) {
          knowledgePointOptions.value = data.points
        }
      } catch (e) {
        console.warn('加载考点列表失败', e)
      } finally {
        loadingKnowledgePoints.value = false
      }
    }

    // 保存考点列表到服务器
    const saveKnowledgePointOptions = async () => {
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/knowledge_points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points: knowledgePointOptions.value })
        })
        const data = await resp.json()
        if (data?.ok && Array.isArray(data.points)) {
          knowledgePointOptions.value = data.points
        }
      } catch (e) {
        console.warn('保存考点列表失败', e)
      }
    }

    // 添加新考点
    const addKnowledgePoint = async () => {
      const name = newKpName.value.trim()
      if (!name) {
        ElMessage.warning('请输入考点名称')
        return
      }
      if (knowledgePointOptions.value.includes(name)) {
        ElMessage.warning('该考点已存在')
        return
      }
      knowledgePointOptions.value.push(name)
      await saveKnowledgePointOptions()
      newKpName.value = ''
      ElMessage.success('添加成功')
    }

    // 开始编辑考点
    const startEditKp = (index: number) => {
      editingKpIndex.value = index
      editingKpName.value = knowledgePointOptions.value[index]
    }

    // 保存编辑的考点
    const saveEditKp = async () => {
      if (editingKpIndex.value === null) return
      const name = editingKpName.value.trim()
      if (!name) {
        ElMessage.warning('考点名称不能为空')
        return
      }
      // 检查是否与其他考点重名
      const existingIndex = knowledgePointOptions.value.findIndex((kp, i) => kp === name && i !== editingKpIndex.value)
      if (existingIndex >= 0) {
        ElMessage.warning('该考点名称已存在')
        return
      }
      knowledgePointOptions.value[editingKpIndex.value] = name
      await saveKnowledgePointOptions()
      editingKpIndex.value = null
      editingKpName.value = ''
      ElMessage.success('修改成功')
    }

    // 取消编辑
    const cancelEditKp = () => {
      editingKpIndex.value = null
      editingKpName.value = ''
    }

    // 删除考点
    const deleteKnowledgePoint = async (index: number) => {
      knowledgePointOptions.value.splice(index, 1)
      await saveKnowledgePointOptions()
      ElMessage.success('删除成功')
    }

    // 重置为默认考点列表
    const resetKnowledgePoints = async () => {
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/knowledge_points/reset`, {
          method: 'POST'
        })
        const data = await resp.json()
        if (data?.ok && Array.isArray(data.points)) {
          knowledgePointOptions.value = data.points
          ElMessage.success('已重置为默认列表')
        } else {
          throw new Error(data?.msg || '重置失败')
        }
      } catch (e: any) {
        ElMessage.error('重置失败: ' + (e?.message || e))
      }
    }

    // 部门用户预览相关
    const deptUsersDialogVisible = ref(false)
    const loadingDeptUsers = ref(false)
    const deptUsersList = ref<any[]>([])

    // 人员选择树相关
    const personSelectDialogVisible = ref(false)
    const loadingPersonTree = ref(false)
    const personTreeData = ref<any[]>([])
    const personTreeRef = ref<InstanceType<any> | null>(null)
    const personTreeFilterText = ref('')

    // 查看名单分页相关
    const deptUsersPage = ref(1)
    const deptUsersPageSize = ref(20)

    // ======= 成绩统计相关 =======
    const gradesStats = ref<any>(null)
    const loadingGradesStats = ref(false)
    const gradesSearch = ref('')
    const gradesPage = ref(1)
    const gradesPageSize = ref(20)
    const filteredGradesDetails = computed(() => {
      const details = gradesStats.value?.details || []
      const keyword = gradesSearch.value.trim().toLowerCase()
      if (!keyword) return [...details]
      return details.filter((d: any) =>
        (d.student_name || '').toLowerCase().includes(keyword) ||
        (d.student_id || '').toLowerCase().includes(keyword)
      )
    })
    const pagedGradesDetails = computed(() => {
      const start = (gradesPage.value - 1) * gradesPageSize.value
      return filteredGradesDetails.value.slice(start, start + gradesPageSize.value)
    })
    
    // 分数分布计算
    const scoreDistribution = computed(() => {
      if (!gradesStats.value?.details?.length) return []
      const details = gradesStats.value.details
      const total = details.length
      const ranges = [
        { range: '90-100', min: 90, max: 100, color: '#67c23a', count: 0 },
        { range: '80-89', min: 80, max: 89, color: '#409eff', count: 0 },
        { range: '70-79', min: 70, max: 79, color: '#e6a23c', count: 0 },
        { range: '60-69', min: 60, max: 69, color: '#f56c6c', count: 0 },
        { range: '0-59', min: 0, max: 59, color: '#909399', count: 0 }
      ]
      details.forEach((d: any) => {
        const score = d.score || 0
        for (const r of ranges) {
          if (score >= r.min && score <= r.max) {
            r.count++
            break
          }
        }
      })
      return ranges.map(r => ({
        ...r,
        percent: total > 0 ? (r.count / total) * 100 : 0
      }))
    })
    
    // 易错知识点 Top10
    const topKpErrors = computed(() => {
      return gradesStats.value?.top_kp_errors || []
    })
    
    // 错题 Top10
    const topWrongQuestions = computed(() => {
      return gradesStats.value?.top_wrong_questions || []
    })
    
    // 计算知识点柱状图宽度百分比
    const getKpBarWidth = (errorCount: number) => {
      const maxCount = topKpErrors.value.length > 0 
        ? Math.max(...topKpErrors.value.map((kp: any) => kp.error_count)) 
        : 1
      return (errorCount / maxCount) * 100
    }
    
    // 计算错题柱状图宽度百分比
    const getWrongQBarWidth = (errorCount: number) => {
      const maxCount = topWrongQuestions.value.length > 0 
        ? Math.max(...topWrongQuestions.value.map((q: any) => q.error_count)) 
        : 1
      return (errorCount / maxCount) * 100
    }
    
    // 获取知识点柱状图颜色
    const getKpBarColor = (index: number) => {
      const colors = ['#f56c6c', '#e6a23c', '#f89c3d', '#409eff', '#67c23a', '#909399', '#b0b0b0', '#c0c0c0', '#d0d0d0', '#e0e0e0']
      return colors[index] || '#909399'
    }
    
    // 获取错题柱状图颜色
    const getWrongQBarColor = (index: number) => {
      const colors = ['#e74c3c', '#e67e22', '#f39c12', '#3498db', '#2ecc71', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6', '#7f8c8d']
      return colors[index] || '#95a5a6'
    }
    
    // 获取题型标签
    const getQtypeLabel = (qtype: string) => {
      const map: Record<string, string> = { single: '单选', multi: '多选', saq: '简答' }
      return map[qtype] || qtype
    }

    // 知识点详情弹窗
    const kpDetailDialogVisible = ref(false)
    const loadingKpDetail = ref(false)
    const kpDetailData = ref<any>(null)
    
    // 错题详情弹窗
    const questionDetailDialogVisible = ref(false)
    const loadingQuestionDetail = ref(false)
    const questionDetailData = ref<any>(null)
    
    // 查看知识点详情
    const viewKpDetail = async (kpName: string) => {
      if (!selectedExportExam.value) return
      kpDetailDialogVisible.value = true
      loadingKpDetail.value = true
      kpDetailData.value = null
      try {
        const exam = publishedExams.value.find((e: any) => e.exam_id === selectedExportExam.value)
        const paperId = exam?.paper_id || ''
        const url = `${MCQ_BASE_URL}/grades/kp_detail?paper_id=${encodeURIComponent(paperId)}&exam_id=${encodeURIComponent(selectedExportExam.value)}&kp_name=${encodeURIComponent(kpName)}`
        const r = await fetch(url)
        const j = await r.json()
        if (j?.ok) {
          kpDetailData.value = j
        } else {
          ElMessage.error(j?.msg || '获取详情失败')
        }
      } catch (e: any) {
        ElMessage.error('获取详情失败：' + (e?.message || e))
      } finally {
        loadingKpDetail.value = false
      }
    }
    
    // 查看错题详情
    const viewQuestionDetail = async (qid: string) => {
      if (!selectedExportExam.value) return
      questionDetailDialogVisible.value = true
      loadingQuestionDetail.value = true
      questionDetailData.value = null
      try {
        const exam = publishedExams.value.find((e: any) => e.exam_id === selectedExportExam.value)
        const paperId = exam?.paper_id || ''
        const url = `${MCQ_BASE_URL}/grades/question_detail?paper_id=${encodeURIComponent(paperId)}&exam_id=${encodeURIComponent(selectedExportExam.value)}&qid=${encodeURIComponent(qid)}`
        const r = await fetch(url)
        const j = await r.json()
        if (j?.ok) {
          questionDetailData.value = j
        } else {
          ElMessage.error(j?.msg || '获取详情失败')
        }
      } catch (e: any) {
        ElMessage.error('获取详情失败：' + (e?.message || e))
      } finally {
        loadingQuestionDetail.value = false
      }
    }
    
    // 作弊详情弹窗
    const cheatDetailDialogVisible = ref(false)
    const cheatDetailData = ref<any>(null)

    // 查看作弊详情（切屏事件）
    const viewCheatDetail = (row: any) => {
      cheatDetailData.value = {
        student_name: row.student_name,
        student_id: row.student_id,
        cheat_count: row.cheat_count || 0,
        cheat_events: row.cheat_events || []
      }
      cheatDetailDialogVisible.value = true
    }

    // ========== 改分功能 ==========
    const scoreEditDialogVisible = ref(false)
    const scoreEditData = ref<any>(null)
    const scoreEditForm = reactive({ mcq_score: 0, saq_score: 0 })
    const scoreEditSaving = ref(false)

    const openScoreEditDialog = (row: any) => {
      scoreEditData.value = {
        attempt_id: row.attempt_id,
        student_name: row.student_name,
        student_id: row.student_id,
        orig_mcq: row.mcq_score || 0,
        orig_saq: row.saq_score || 0,
        has_override: row.has_override || false
      }
      scoreEditForm.mcq_score = row.mcq_score || 0
      scoreEditForm.saq_score = row.saq_score || 0
      scoreEditDialogVisible.value = true
    }

    const submitScoreOverride = async () => {
      if (!scoreEditData.value?.attempt_id) return
      scoreEditSaving.value = true
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/grades/score_override`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            attempt_id: scoreEditData.value.attempt_id,
            mcq_score: scoreEditForm.mcq_score,
            saq_score: scoreEditForm.saq_score
          })
        })
        const j = await resp.json()
        if (j.ok) {
          ElMessage.success('分数修改成功')
          scoreEditDialogVisible.value = false
          // 刷新成绩数据
          if (selectedExportExam.value) {
            onExportExamChange(selectedExportExam.value)
          }
        } else {
          ElMessage.error(j.detail || j.msg || '修改失败')
        }
      } catch (e: any) {
        ElMessage.error('修改失败：' + (e?.message || e))
      } finally {
        scoreEditSaving.value = false
      }
    }

    const clearScoreOverride = async () => {
      if (!scoreEditData.value?.attempt_id) return
      scoreEditSaving.value = true
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/grades/score_override_clear`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            attempt_id: scoreEditData.value.attempt_id
          })
        })
        const j = await resp.json()
        if (j.ok) {
          ElMessage.success('已恢复原始分数')
          scoreEditDialogVisible.value = false
          if (selectedExportExam.value) {
            onExportExamChange(selectedExportExam.value)
          }
        } else {
          ElMessage.error(j.detail || j.msg || '恢复失败')
        }
      } catch (e: any) {
        ElMessage.error('恢复失败：' + (e?.message || e))
      } finally {
        scoreEditSaving.value = false
      }
    }

    // ========== 修正答案功能 ==========
    const fixAnswerDialogVisible = ref(false)
    const fixAnswerForm = reactive({ question_index: null as number | null, new_answer: '' })
    const fixAnswerSaving = ref(false)
    const fixAnswerResult = ref<any>(null)
    const qtypeLabelMap: Record<string, string> = { single: '单选', multi: '多选', indeterminate: '不定项', saq: '简答' }

    // 只显示选择题（非SAQ）
    const mcqQuestionsOverview = computed(() => {
      return (gradesStats.value?.questions_overview || []).filter((q: any) => q.qtype !== 'saq')
    })

    const fixAnswerSelectedQ = computed(() => {
      if (!fixAnswerForm.question_index) return null
      return (gradesStats.value?.questions_overview || []).find((q: any) => q.index === fixAnswerForm.question_index) || null
    })

    const openFixAnswerDialog = () => {
      fixAnswerForm.question_index = null
      fixAnswerForm.new_answer = ''
      fixAnswerResult.value = null
      fixAnswerDialogVisible.value = true
    }

    const onFixQuestionChange = () => {
      fixAnswerForm.new_answer = ''
      fixAnswerResult.value = null
    }

    const submitFixAnswer = async () => {
      if (!fixAnswerForm.question_index || !fixAnswerForm.new_answer) return
      const exam = publishedExams.value.find((e: any) => e.exam_id === selectedExportExam.value)
      if (!exam) return
      fixAnswerSaving.value = true
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/grades/fix_answer`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            paper_id: exam.paper_id,
            exam_id: selectedExportExam.value,
            question_index: fixAnswerForm.question_index,
            new_answer: fixAnswerForm.new_answer.toUpperCase().trim()
          })
        })
        const j = await resp.json()
        if (j.ok) {
          fixAnswerResult.value = j
          ElMessage.success(`答案修正成功，影响 ${j.affected_count} 人`)
          // 刷新成绩数据
          if (selectedExportExam.value) {
            onExportExamChange(selectedExportExam.value)
          }
        } else {
          ElMessage.error(j.detail || j.msg || '修正失败')
        }
      } catch (e: any) {
        ElMessage.error('修正失败：' + (e?.message || e))
      } finally {
        fixAnswerSaving.value = false
      }
    }

    // 计算错误选项柱状图宽度
    const getWrongChoiceBarWidth = (count: number) => {
      if (!questionDetailData.value?.wrong_choice_distribution?.length) return 0
      const maxCount = Math.max(...questionDetailData.value.wrong_choice_distribution.map((item: any) => item[1]))
      return maxCount > 0 ? (count / maxCount) * 100 : 0
    }

    // 判断题目是否为多选题（答案包含多个字母）
    const isMultiChoice = (q: Question) => {
      const answer = (q.answer || '').toUpperCase().replace(/[^A-H]/g, '')
      return answer.length > 1
    }

    // 已通过的题目列表
    const approvedQuestions = computed(() => {
      return questions.value.filter(q => q.status === 'approved')
    })

    // 标准化知识点字符串（用于比较和去重）
    const normalizeKnowledgePoint = (kp: string): string => {
      if (!kp) return ''
      return kp
        .replace(/[（(]/g, '(')   // 全角/半角左括号统一为半角
        .replace(/[）)]/g, ')')   // 全角/半角右括号统一为半角
        .replace(/\s+/g, '')       // 移除所有空格
        .toLowerCase()             // 转小写
    }

    // 检查两个知识点是否相同（忽略括号和空格差异）
    const isSameKnowledgePoint = (kp1: string, kp2: string): boolean => {
      return normalizeKnowledgePoint(kp1) === normalizeKnowledgePoint(kp2)
    }

    // 从题目解析中提取知识点列表
    const extractKnowledgePointsFromAnalysis = (analysis: string): string[] => {
      if (!analysis) return []
      const kpMatch = analysis.match(/知识点[：:]\s*(.+?)\s*$/s)
      if (!kpMatch) return []
      const kpText = kpMatch[1]
      // 提取《xxx》格式的知识点
      const bookPattern = /《([^》]+)》/g
      const points: string[] = []
      let match
      while ((match = bookPattern.exec(kpText)) !== null) {
        const kp = match[1].trim()
        // 使用标准化比较进行去重
        if (kp && !points.some(p => isSameKnowledgePoint(p, kp))) {
          points.push(kp)
        }
      }
      return points
    }

    // 获取所有已通过题目的知识点列表（使用标准化比较去重）
    const availableKnowledgePoints = computed(() => {
      const kpList: string[] = []
      approvedQuestions.value.forEach(q => {
        // 优先使用结构化知识点字段，回退到正则提取
        const kps = (q.knowledge_points && q.knowledge_points.length > 0)
          ? q.knowledge_points
          : extractKnowledgePointsFromAnalysis(q.analysis || '')
        kps.forEach((kp: string) => {
          // 使用标准化比较去重
          if (!kpList.some(existing => isSameKnowledgePoint(existing, kp))) {
            kpList.push(kp)
          }
        })
      })
      return kpList.sort()
    })

    // 合并预设考点和题目中检测到的考点（去重，使用标准化比较）
    const mergedKnowledgePointOptions = computed(() => {
      const result: string[] = [...knowledgePointOptions.value]
      // 添加题目中检测到但预设中没有的考点
      availableKnowledgePoints.value.forEach(kp => {
        if (!result.some(preset => isSameKnowledgePoint(preset, kp))) {
          result.push(kp)
        }
      })
      return result.sort()
    })

    // 根据筛选和搜索过滤后的题目
    const filteredPaperQuestions = computed(() => {
      let result = approvedQuestions.value

      // 按类型筛选
      if (paperQuestionFilter.value === 'single') {
        result = result.filter(q => q.qtype !== 'saq' && !isMultiChoice(q))
      } else if (paperQuestionFilter.value === 'multi') {
        result = result.filter(q => q.qtype !== 'saq' && isMultiChoice(q))
      } else if (paperQuestionFilter.value === 'saq') {
        result = result.filter(q => q.qtype === 'saq')
      }

      // 按知识点筛选（优先使用结构化字段，使用标准化比较）
      if (selectedKnowledgePoints.value.length > 0) {
        result = result.filter(q => {
          const qKps = (q.knowledge_points && q.knowledge_points.length > 0)
            ? q.knowledge_points
            : extractKnowledgePointsFromAnalysis(q.analysis || '')
          return qKps.some((qKp: string) => 
            selectedKnowledgePoints.value.some(selKp => isSameKnowledgePoint(qKp, selKp))
          )
        })
      }

      // 按关键词搜索
      const keyword = paperQuestionSearch.value.trim().toLowerCase()
      if (keyword) {
        result = result.filter(q => {
          // 搜索题干
          if (q.stem.toLowerCase().includes(keyword)) return true
          // 搜索选项（简答题无选项）
          if (q.qtype !== 'saq') {
            for (const opt of q.options) {
              if (opt.text.toLowerCase().includes(keyword)) return true
            }
          }
          return false
        })
      }

      return result
    })

    const pagedPaperQuestions = computed(() => {
      const start = (paperQuestionPage.value - 1) * paperQuestionPageSize.value
      return filteredPaperQuestions.value.slice(start, start + paperQuestionPageSize.value)
    })

    // 切换全选试卷题目（全选当前页）
    const toggleSelectAllPaperQuestions = () => {
      if (selectAllPaperQuestions.value) {
        selectedPaperQuestions.value = pagedPaperQuestions.value.map(q => q.qid)
      } else {
        selectedPaperQuestions.value = []
      }
    }

    const userSearch = ref('')
    interface ManagedUser {
      id?: string | number
      username: string
      email?: string
      role?: string
      status?: number  // 1=正常，0=待审核，-1=封禁，-2=审核未通过
      isBjzxAdmin?: boolean
    }

    const users = ref<ManagedUser[]>([])
    const loadingUsers = ref(false)
    const actionLoadingId = ref<string | number | null>(null)
    const userPage = ref(1)
    const userPageSize = ref(20)
    const pendingUsers = ref<ManagedUser[]>([])
    const loadingPending = ref(false)
    const approvalLoadingId = ref<string | number | null>(null)
    const rejectLoadingId = ref<string | number | null>(null)
    const pendingSearch = ref('')
    const pendingPage = ref(1)
    const pendingPageSize = ref(20)


    const getStatusTagType = (status: string) => {
      const map: Record<string, any> = { approved: 'success', draft: 'warning', abnormal: 'danger', rejected: 'info' }
      return map[status] || ''
    }

    const getStatusText = (status: string) => {
      const map: Record<string, string> = { approved: '已通过', draft: '草稿', abnormal: '异常', rejected: '已驳回', none: '无解析' }
      return map[status] || status
    }

    // 密码重置：用户选项列表（只显示普通用户，不显示管理员）
    const resetUserOptions = computed(() => {
      return users.value.filter(u => {
        const role = normalizeRole(u.role)
        return role === UserRole.USER && u.status === 1
      })
    })

    const onResetUserChange = (userId: string | number) => {
      selectedResetUserId.value = userId
    }

    const changeMyPassword = async () => {
      if (!myNewPassword.value) return ElMessage.warning('新密码不可为空')
      changingPassword.value = true
      try {
        const response = await fetchWithAuth(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             id: store.state.user.id,
             username: store.state.user.username,
             password: myOldPassword.value,
             newPassword: myNewPassword.value
            })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('修改成功，请重新登录')
          store.dispatch('logout')
          setTimeout(() => window.location.href = '/login', 1000)
        } else throw new Error(response.data?.message || '修改失败')
      } catch (error: any) {
        ElMessage.error('修改失败：' + error.message)
      } finally {
        changingPassword.value = false
      }
    }

    const resetUserPassword = async () => {
      if (!selectedResetUserId.value) return ElMessage.warning('请先选择用户')
      if (!resetPassword.value) return ElMessage.warning('请输入新密码')
      if (resetPassword.value.length < 6) return ElMessage.warning('密码至少6位')
      if (resetPassword.value !== resetPasswordConfirm.value) return ElMessage.warning('两次输入的密码不一致')

      const targetUser = users.value.find(u => u.id === selectedResetUserId.value)
      if (!targetUser) return ElMessage.warning('用户不存在，请刷新后重试')

      resettingPassword.value = true
      try {
        const response = await fetchWithAuth(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetUser.id,
            username: targetUser.username,
            newPassword: resetPassword.value
          })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success(`已成功重置用户【${targetUser.username}】的密码`)
          selectedResetUserId.value = null
          resetPassword.value = ''
          resetPasswordConfirm.value = ''
        } else throw new Error(response.data?.message || '重置失败，用户可能不存在')
      } catch (error: any) {
        ElMessage.error('重置失败：' + error.message)
      } finally {
        resettingPassword.value = false
      }
    }

    const handleFileChange = (file: any) => {
      // Element Plus el-upload 的 on-change 参数是 (file, fileList)
      if (file && file.raw) {
        uploadFile.value = file.raw as File
      } else {
        uploadFile.value = null
      }
    }

    const uploadQuestions = async () => {
      if (!uploadFile.value) {
        ElMessage.warning('请选择 .docx / .txt 文件')
        return
      }
      
      uploading.value = true
      uploadMessage.value = '识别中…'

      try {
        // 1）调用 /upload 做题目识别
        const fd = new FormData()
        fd.append('file', uploadFile.value)

        const r = await fetch(`${MCQ_BASE_URL}/upload`, { method: 'POST', body: fd })
        const j = await r.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || `上传/解析失败（HTTP ${r.status})`)
        }

        const items = Array.isArray(j.items) ? j.items : []
        const saqItems = Array.isArray(j.saq_items) ? j.saq_items : []

        // 2）对齐 qa_public.html：把 answer 也带上，同时保留图片数据
        const mcqPayload = items.map((x: any) => {
          const item: any = {
            stem: x.stem || '',
            options: x.options || {},
            answer: (x.answer || '').toString().toUpperCase(),
            explain: x.explain_original || '',
            qtype: x.qtype || 'single',
          }
          // 如果有图片数据，一并传递
          if (x.stem_images && x.stem_images.length > 0) {
            item.stem_images = x.stem_images
          }
          if (x.option_images && Object.keys(x.option_images).length > 0) {
            item.option_images = x.option_images
          }
          if (x.analysis_images && x.analysis_images.length > 0) {
            item.analysis_images = x.analysis_images
          }
          return item
        })
        
        // 处理简答题（三字段：题干、答案、解析）
        const saqPayload = saqItems.map((x: any) => ({
          stem: x.stem || '',
          options: {},
          answer: x.answer || '',  // SAQ答案
          explain: x.explain_original || '',  // SAQ解析
          qtype: 'saq',
          category: x.category || '',
          reference_answer: '',  // 保留兼容性
          stem_images: x.stem_images || [],
          option_images: {},
          analysis_images: x.analysis_images || [],
        }))
        
        // 合并选择题和简答题
        const upsertPayload = [...mcqPayload, ...saqPayload]

        // 3）检查重复题目（仅在当前题库内查重）
        uploadMessage.value = '检查重复题目中…'
        const checkRes = await fetch(`${MCQ_BASE_URL}/bank/check_duplicates`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: upsertPayload, bank_id: currentBankId.value }),
        })
        const checkData = await checkRes.json()
        
        if (!checkData || checkData.ok === false) {
          throw new Error(checkData?.msg || '检查重复失败')
        }

        let finalPayload = upsertPayload
        let skippedCount = 0

        // 4）如果有重复题目，弹窗提示用户（自动跳过重复，提供预览）
        if (checkData.has_duplicates && checkData.dup_count > 0) {
          const dupCount = checkData.dup_count
          const newCount = checkData.new_count
          
          // 构建重复题目的 HTML 预览列表
          const dupListHtml = (checkData.duplicates || [])
            .map((d: any, i: number) => {
              const stem = (d.new_item?.stem || '').substring(0, 80)
              const answer = d.new_item?.answer || ''
              return `<div style="padding: 6px 0; border-bottom: 1px solid #eee; font-size: 13px;">
                <span style="color: #909399;">${i + 1}.</span> 
                <span>${stem}${stem.length >= 80 ? '...' : ''}</span>
                <span style="color: #E6A23C; margin-left: 8px;">答案: ${answer}</span>
              </div>`
            })
            .join('')
          
          // 构建完整的 HTML 消息
          const messageHtml = `
            <div style="margin-bottom: 12px;">
              检测到 <strong style="color: #E6A23C;">${dupCount}</strong> 道题目已存在于题库中（题干、选项、答案相同），将自动跳过。
              ${newCount > 0 ? `<br/>本次将保存 <strong style="color: #67C23A;">${newCount}</strong> 道新题目。` : ''}
            </div>
            <details style="margin-top: 8px; cursor: pointer;">
              <summary style="color: #409EFF; font-size: 13px; outline: none;">
                点击查看重复题目列表
              </summary>
              <div style="max-height: 300px; overflow-y: auto; margin-top: 8px; padding: 8px; background: #f5f7fa; border-radius: 4px;">
                ${dupListHtml}
              </div>
            </details>
          `

          // 如果全部都是重复题目
          if (newCount === 0) {
            await ElMessageBox.alert(
              messageHtml,
              '全部题目已存在',
              {
                dangerouslyUseHTMLString: true,
                confirmButtonText: '知道了',
                type: 'info',
              }
            )
            uploadMessage.value = `全部 ${dupCount} 道题目已存在于题库中，无需保存`
            uploading.value = false
            return
          }

          try {
            // 弹出确认对话框
            await ElMessageBox.confirm(
              messageHtml,
              '发现重复题目',
              {
                dangerouslyUseHTMLString: true,
                distinguishCancelAndClose: true,
                confirmButtonText: '确定保存新题目',
                cancelButtonText: '取消上传',
                type: 'warning',
              }
            )
            
            // 用户确认，自动跳过重复项
            const dupIndexSet = new Set((checkData.duplicates || []).map((d: any) => d.index))
            finalPayload = upsertPayload.filter((_: any, idx: number) => !dupIndexSet.has(idx))
            skippedCount = dupCount
            
          } catch (dialogAction) {
            // 用户取消上传
            uploadMessage.value = '已取消上传'
            uploading.value = false
            return
          }
        }

        // 5）执行保存（到当前题库）
        uploadMessage.value = '保存中…'
        const rs = await fetch(`${MCQ_BASE_URL}/bank/bulk_upsert`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: finalPayload, bank_id: currentBankId.value }),
        })
        const saved = await rs.json()
        if (!saved || saved.ok === false) {
          throw new Error(saved?.msg || 'bulk_upsert 失败')
        }

        const bankItems = Array.isArray(saved.items) ? saved.items : []

        // 6）映射成前端 Question 时，记得带上 answer 和图片数据
        questions.value = bankItems.map((it: any): Question => {
          const status = it.status || ((it.explain || '').trim() ? 'draft' : 'none')
          return {
            qid: String(it.id ?? it.qid ?? ''),
            stem: it.stem || '',
            options: normalizeOptions(it.options, it.option_images),
            answer: (it.answer || '').toString().toUpperCase(),
            analysis: it.explain || '',
            status,
            qtype: it.qtype || '',
            category: it.category || '',
            reference_answer: it.reference_answer || '',
            has_images: Boolean(it.has_images),
            stem_images: it.stem_images || [],
            analysis_images: it.analysis_images || [],
          }
        })

        const parsedExplainCount = questions.value.filter(
          q => (q.analysis || '').trim().length > 0
        ).length
        
        // 7）构建消息，包含格式化和去重信息
        const mcqCount = items.length
        const saqCount = saqItems.length
        let msg = `识别成功并已保存：${questions.value.length} 题`
        if (saqCount > 0) {
          msg += `（选择题 ${mcqCount} 道，简答题 ${saqCount} 道）`
        }
        msg += `；识别解析：${parsedExplainCount} 条`
        if (skippedCount > 0) {
          msg += `；跳过重复：${skippedCount} 题`
        }
        if (j.llm_formatted) {
          msg += '（已使用LLM格式化）'
        }
        if (j.format_msg) {
          msg += ` [${j.format_msg}]`
        }
        uploadMessage.value = msg
        ElMessage.success('上传成功')
        loadBanksList()  // 刷新题库列表（更新题目数量）
      } catch (e: any) {
        const msg = e?.message || String(e) || '未知错误'
        uploadMessage.value = '上传失败：' + msg
        ElMessage.error(uploadMessage.value)
      } finally {
        uploading.value = false
      }
    }


    const explainBatchAsync = async () => {
      // 检查是否选择了解析目标
      if (parseTargetStatuses.value.length === 0) {
        asyncMsg.value = '请至少选择一个解析目标状态'
        return
      }
      asyncExplaining.value = true; asyncMsg.value = '创建任务中…'
      try{
        const req:any = { 
          model_id: llmModelId.value, 
          thinking: thinking.value, 
          rerank_top_n: topN.value, 
          use_insert_block: insertBlock.value,
          target_statuses: parseTargetStatuses.value,  // 传递选中的目标状态
          bank_id: currentBankId.value,  // 指定题库
        }
        const r = await fetch(`${MCQ_BASE_URL}/explain_batch_async`, { method:'POST', headers: getAuthHeaders(), body: JSON.stringify(req) })
        const j = await r.json(); if (!j?.ok) throw new Error(j?.msg || '创建任务失败')
        currentTaskId.value = String(j.task_id)
        currentTaskStatus.value = 'running'
        pollTaskStatus(String(j.task_id))
      }catch(e:any){ asyncMsg.value = `失败：${e?.message||e}` }
      finally{ asyncExplaining.value = false }
    }

    const downloadTemplate = () => {
      // 直接请求后端刚才新加的 /mcq_public/import_template
      const url = `${MCQ_BASE_URL}/import_template`

      const a = document.createElement('a')
      a.href = url
      // 这里可以写 download，但现在真正起作用的是后端的 Content-Disposition
      // a.download = '题库导入模板.docx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }


    const pollTaskStatus = (taskId: string) => {
      if (pollingInterval.value) clearInterval(pollingInterval.value)
      currentTaskId.value = taskId
      pollingInterval.value = window.setInterval(async () => {
        try {
          const r = await fetch(`${MCQ_BASE_URL}/tasks/status?task_id=${encodeURIComponent(taskId)}`, { cache:'no-store' })
          const j = await r.json(); if (!j || !j.ok) return
          currentTaskStatus.value = j.status || ''
          asyncMsg.value = `进度：${j.done||0}/${j.total||0}`
          const arrs = [j.results, j.delta_results, j.partial_results, j.latest_results, j.items, j.updates]
          ;(arrs||[]).forEach((arr:any[]) => {
            if (!Array.isArray(arr)) return
            arr.forEach((res:any)=>{
              const qid = String(res.qid)
              const row = (questions.value || []).find(x => String(x.qid) === qid)
              if (!row || res.ok === false) return
              const explain = (res.explain||'').trim()
              if (explain) row.analysis = explain
              if (typeof res.answer_mismatch !== 'undefined' && (row.status==='none'||row.status==='draft')){
                row.status = res.answer_mismatch ? 'abnormal' : 'draft'
              }
              // 清除该题目的参考资料缓存，以便重新加载
              if (qid) {
                delete sourcesLoaded[qid]
                delete sourcesMap[qid]
                delete sourcesError[qid]
              }
            })
          })
          if (j.status && String(j.status).toLowerCase() in {done:1, failed:1, stopped:1}){
            if (pollingInterval.value) clearInterval(pollingInterval.value)
            if (j.status === 'stopped') {
              asyncMsg.value = `任务已停止（${j.done||0}/${j.total||0}）`
            } else {
              asyncMsg.value = '任务已结束'
              currentTaskId.value = null
              currentTaskStatus.value = ''
            }
            await loadQuestions()
          }
        } catch (e) {
          console.debug && console.debug('MCQ polling failed', e)
          if (pollingInterval.value) clearInterval(pollingInterval.value)
          asyncMsg.value = '轮询失败'
        }
      }, 2000)
    }

    // 停止任务
    const stopTask = async () => {
      if (!currentTaskId.value) return
      stoppingTask.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/tasks/stop`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ task_id: currentTaskId.value })
        })
        const j = await r.json()
        if (j?.ok) {
          asyncMsg.value = '正在停止任务...'
        } else {
          throw new Error(j?.msg || '停止失败')
        }
      } catch (e: any) {
        ElMessage.error(e?.message || '停止任务失败')
      } finally {
        stoppingTask.value = false
      }
    }

    // 恢复任务
    const resumeTask = async () => {
      resumingTask.value = true
      asyncMsg.value = '正在恢复任务...'
      try {
        const r = await fetch(`${MCQ_BASE_URL}/tasks/resume`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ task_id: currentTaskId.value || '' })
        })
        const j = await r.json()
        if (j?.ok) {
          currentTaskId.value = j.task_id
          currentTaskStatus.value = 'running'
          asyncMsg.value = j.msg || `已恢复，剩余 ${j.remaining} 题`
          pollTaskStatus(j.task_id)
        } else {
          throw new Error(j?.msg || '恢复失败')
        }
      } catch (e: any) {
        asyncMsg.value = `恢复失败：${e?.message || e}`
        ElMessage.error(e?.message || '恢复任务失败')
      } finally {
        resumingTask.value = false
      }
    }

    // 检查是否有未完成的任务（页面加载时调用）
    const checkPendingTask = async () => {
      try {
        const r = await fetch(`${MCQ_BASE_URL}/tasks/pending`, { cache: 'no-store', headers: getAuthHeaders(false) })
        const j = await r.json()
        if (j?.ok && j.has_pending) {
          currentTaskId.value = j.task_id
          currentTaskStatus.value = j.status || 'stopped'
          asyncMsg.value = `发现未完成任务（${j.done}/${j.total}），可点击"恢复"继续`
          if (j.status === 'running') {
            pollTaskStatus(j.task_id)
          }
        }
      } catch (e) {
        console.debug && console.debug('检查未完成任务失败', e)
      }
    }

    // 忽略未完成任务提示
    const dismissPendingTask = () => {
      pendingTaskDismissed.value = true
      asyncMsg.value = ''
    }

    // 计算属性：是否有正在运行的任务
    const isTaskRunning = computed(() => {
      return currentTaskStatus.value === 'running' || currentTaskStatus.value === 'queued'
    })

    // 计算属性：是否有已停止的任务可恢复
    const canResumeTask = computed(() => {
      return currentTaskId.value && currentTaskStatus.value === 'stopped'
    })

    const generateExplanations = async () => {
      generating.value = true
      generateMessage.value = '正在生成解析...'

      try {
        // 根据选中的目标状态筛选题目
        const selectedStatuses = parseTargetStatuses.value
        if (selectedStatuses.length === 0) {
          generateMessage.value = '请至少选择一个解析目标状态'
          generating.value = false
          return
        }
        const targets = (questions.value || []).filter(
          q => selectedStatuses.includes(q.status || 'none')
        )
        if (targets.length === 0) {
          generateMessage.value = `无符合条件的题目（目标状态：${selectedStatuses.join(', ')}）`
          generating.value = false
          return
        }

        // 分批大小，可以按需要调大/调小
        const BATCH_SIZE = 50
        const allUpdates: any[] = []

        for (let start = 0; start < targets.length; start += BATCH_SIZE) {
          const batch = targets.slice(start, start + BATCH_SIZE)

          generateMessage.value = `正在生成解析（${start + 1}~${Math.min(
            start + BATCH_SIZE,
            targets.length
          )} / ${targets.length}）...`

          const payload = {
            items: batch.map(q => ({
              qid: q.qid,
              stem: q.stem,
              options: Object.fromEntries(
                (q.options || []).map((o: any) => [o.label, o.text])
              ),
              qtype: q.qtype || '',  // 题目类型：saq为简答题
              answer: q.answer || '',  // 简答题答案
            })),
            thinking: false,
          }

          const resp = await fetch(`${MCQ_BASE_URL}/explain`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          })

          const raw = await resp.text()
          let data: any
          try {
            data = JSON.parse(raw)
          } catch (e: any) {
            throw new Error(
              `后端返回的不是 JSON（HTTP ${resp.status}）：${raw.slice(0, 200)}`
            )
          }

          if (!data?.ok) {
            throw new Error(data?.msg || '生成失败')
          }

          // 处理结果，检查无答案的题目
          const updates = (data.results || []).map((r: any) => {
            const qid = String(r.qid)
            const originalQuestion = batch.find(q => q.qid === qid)
            const originalAnswer = (originalQuestion?.answer || '').trim()
            const aiFinalAnswer = (r.final_answer || '').trim()
            
            const updateItem: any = {
              id: qid,
              explain: r.explain_raw || r.explain || '',
            }
            
            // 如果原题无答案且 AI 给出了答案，自动填充并标记
            if (!originalAnswer && aiFinalAnswer) {
              updateItem.answer = aiFinalAnswer.toUpperCase()
              updateItem.ai_generated_answer = true
            }
            
            return updateItem
          })

          allUpdates.push(...updates)
        }

        if (!allUpdates.length) {
          generateMessage.value = '没有生成任何解析'
          return
        }

        // 统一写回
        const upResp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: allUpdates }),
        })

        const upRaw = await upResp.text()
        let up: any
        try {
          up = JSON.parse(upRaw)
        } catch (e: any) {
          throw new Error(
            `写回解析失败（HTTP ${upResp.status}）：${upRaw.slice(0, 200)}`
          )
        }

        if (!up?.ok) {
          throw new Error(up?.msg || '写回失败')
        }

        generateMessage.value = `完成：${allUpdates.length} 题`
        ElMessage.success('解析生成完成')
        // 清除已解析题目的参考资料缓存，以便重新加载
        for (const upd of allUpdates) {
          const qid = upd.id
          if (qid) {
            delete sourcesLoaded[qid]
            delete sourcesMap[qid]
            delete sourcesError[qid]
          }
        }
        await loadQuestions()
      } catch (error: any) {
        generateMessage.value = '失败：' + (error?.message || error)
        ElMessage.error(generateMessage.value)
      } finally {
        generating.value = false
      }
    }

    const loadQuestions = async () => {
      loadingQuestions.value = true
      try {
        // 不分页(page=0)，加载图片数据，按题库筛选
        const r = await fetch(`${MCQ_BASE_URL}/bank/list?page=0&include_images=true&bank_id=${encodeURIComponent(currentBankId.value)}`, { method: 'GET', headers: getAuthHeaders(false) })
        const j = await r.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || `HTTP ${r.status}`)
        }

        const items = Array.isArray(j.items) ? j.items : []
        questions.value = items.map((it: any): Question => {
          const status = it.status || ((it.explain || '').trim() ? 'draft' : 'none')
          return {
            qid: String(it.id ?? it.qid ?? ''),
            stem: it.stem || '',
            options: normalizeOptions(it.options, it.option_images),
            answer: (it.answer || '').toString().toUpperCase(),
            analysis: it.explain || '',
            status,
            qtype: it.qtype || '',
            category: it.category || '',
            reference_answer: it.reference_answer || '',
            ai_generated_answer: Boolean(it.ai_generated_answer),
            has_images: Boolean(it.has_images),
            stem_images: it.stem_images || [],
            analysis_images: it.analysis_images || [],
            knowledge_clauses: it.knowledge_clauses || [],
            knowledge_points: it.knowledge_points || [],
          }
        })
      } catch (error: any) {
        ElMessage.error('加载题库失败：' + (error?.message || String(error)))
      } finally {
        loadingQuestions.value = false
      }
    }

    const toggleAnalysis = (qid: string) => {
      const next = !showingAnalysis[qid]
      showingAnalysis[qid] = next
      if (next) loadSources(qid)
    }

    // 图片预览
    const previewImageUrl = ref('')
    const previewImageVisible = ref(false)
    const previewImage = (src: string) => {
      previewImageUrl.value = src
      previewImageVisible.value = true
    }

    const approveQuestion = async (qid: string, analysis?: string) => {
      try {
        const question = (questions.value || []).find(q => q.qid === qid)
        if (!question) return
        
        // 如果没有解析，弹窗提醒
        if (!analysis) {
          await ElMessageBox.confirm(
            '该题目尚无解析，确定要通过吗？',
            '提示',
            {
              confirmButtonText: '确定通过',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
        }
        
        const resp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: [{ id: qid, status: 'approved', explain: question.analysis || '' }] })
        })
        const data = await resp.json()
        if (data?.ok) { ElMessage.success('已通过'); loadQuestions() }
        else throw new Error(data?.msg || '操作失败')
      } catch (error: any) { 
        if (error !== 'cancel') ElMessage.error('操作失败：' + (error?.message || error)) 
      }
    }

    const rejectQuestion = async (qid: string) => {
      try {
        const { value: reason } = await ElMessageBox.prompt('请输入驳回原因', '驳回', { confirmButtonText: '确定', cancelButtonText: '取消' })
        const resp = await fetch(`${MCQ_BASE_URL}/bank/bulk_reject`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ids: [qid], reason: (reason || '不符合要求') })
        })
        const data = await resp.json()
        if (data?.ok) { ElMessage.success('已驳回'); loadQuestions() }
        else throw new Error(data?.msg || '操作失败')
      } catch (error: any) { if (error !== 'cancel') ElMessage.error('操作失败：' + (error?.message || error)) }
    }

    const deleteQuestion = async (qid: string) => {
      try {
        await ElMessageBox.confirm('确认删除该题目？删除后将移到回收站。', '警告', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        deletingQuestion[qid] = true
        const resp = await fetch(`${MCQ_BASE_URL}/bank/delete`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ids: [qid],
            user: store.state.user.username,
            role: userRole.value,
            isBjzxAdmin: isBjzxAdmin.value
          })
        })
        const data = await resp.json()
        if (data?.ok) {
          ElMessage.success('删除成功')
          loadQuestions()
        } else {
          throw new Error(data?.msg || '删除失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败：' + (error?.message || error))
        }
      } finally {
        deletingQuestion[qid] = false
      }
    }

    const approveAll = async () => {
      try {
        await ElMessageBox.confirm('确认一键通过所有草稿/未解析的题目？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
        approvingAll.value = true
        const candidates = (filteredQuestions.value || []).filter((it:any) => (it.status || 'none') !== 'approved')
        if (candidates.length === 0) { ElMessage.info('没有可通过的题目'); return }
        const resp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: candidates.map((it:any)=>({ id: it.qid, status: 'approved', explain: it.analysis || '' })) })
        })
        if (!resp.ok) {
          const text = await resp.text()
          throw new Error(`请求失败 (${resp.status}): ${text.substring(0, 100)}`)
        }
        const contentType = resp.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const text = await resp.text()
          throw new Error(`响应格式错误，预期 JSON 但收到: ${text.substring(0, 100)}`)
        }
        const data = await resp.json()
        if (data?.ok) { ElMessage.success(`已通过 ${data.count || candidates.length} 题`); loadQuestions() }
        else throw new Error(data?.msg || '操作失败')
      } catch (error: any) {
        if (error !== 'cancel') ElMessage.error('操作失败：' + (error?.message || error))
      } finally { approvingAll.value = false }
    }

    const rejectAll = async () => {
      const candidates = (filteredQuestions.value || []).filter(it => (it.status || 'none') !== 'rejected')
      if (candidates.length === 0) return ElMessage.info('没有可驳回的题目')
      rejectingAll.value = true
      try {
        const payload = { items: candidates.map(it => ({ id: it.qid, status: 'rejected', explain: it.analysis || '' })) }
        const resp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        })
        if (!resp.ok) {
          const text = await resp.text()
          throw new Error(`请求失败 (${resp.status}): ${text.substring(0, 100)}`)
        }
        const contentType = resp.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const text = await resp.text()
          throw new Error(`响应格式错误，预期 JSON 但收到: ${text.substring(0, 100)}`)
        }
        const data = await resp.json()
        if (!data?.ok) throw new Error(data?.msg || '批量驳回失败')
        ElMessage.success(`批量驳回 ${data.count||candidates.length} 题`)
        await loadQuestions()
      } catch (e:any) { ElMessage.error(e?.message || e) }
      finally { rejectingAll.value = false }
    }

    // ========== 批量选择相关函数 ==========
    const toggleSelectAll = () => {
      if (selectAll.value) {
        selectedQuestions.value = pagedQuestions.value.map(q => q.qid)
      } else {
        selectedQuestions.value = []
      }
    }

    const batchDelete = async () => {
      if (selectedQuestions.value.length === 0) return

      try {
        await ElMessageBox.confirm(
          `确认删除选中的 ${selectedQuestions.value.length} 个题目？删除后将移到回收站。`,
          '批量删除',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        const resp = await fetch(`${MCQ_BASE_URL}/bank/delete`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ids: selectedQuestions.value,
            user: store.state.user.username,
            role: userRole.value,
            isBjzxAdmin: isBjzxAdmin.value
          })
        })

        const data = await resp.json()
        if (data?.ok) {
          ElMessage.success(`已删除 ${data.count} 个题目`)
          selectedQuestions.value = []
          selectAll.value = false
          loadQuestions()
        } else {
          throw new Error(data?.msg || '批量删除失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('批量删除失败：' + (error?.message || error))
        }
      }
    }

    // ========== 回收站相关函数 ==========
    const loadDeletedQuestions = async () => {
      loadingDeleted.value = true
      recycleMessage.value = '加载中...'
      try {
        const resp = await fetch(`${MCQ_BASE_URL}/bank/deleted?bank_id=${encodeURIComponent(currentBankId.value)}`, {
          headers: getAuthHeaders(false)
        })
        const data = await resp.json()
        if (data?.ok) {
          deletedQuestions.value = (data.items || []).map((it: any): Question => ({
            qid: String(it.id ?? it.qid ?? ''),
            stem: it.stem || '',
            options: normalizeOptions(it.options, it.option_images),
            answer: (it.answer || '').toString().toUpperCase(),
            analysis: it.explain || '',
            status: it.status || 'deleted',
            deleted_at: it.deleted_at || '',
            deleted_by: it.deleted_by || '',
            has_images: Boolean(it.has_images),
            stem_images: it.stem_images || [],
            analysis_images: it.analysis_images || [],
          }))
          recycleMessage.value = `共 ${deletedQuestions.value.length} 个已删除题目`
        } else {
          throw new Error(data?.msg || '加载失败')
        }
      } catch (error: any) {
        recycleMessage.value = '加载失败'
        ElMessage.error('加载回收站失败：' + (error?.message || error))
      } finally {
        loadingDeleted.value = false
      }
    }

    const restoreQuestion = async (qid: string) => {
      try {
        restoringQuestion[qid] = true
        const resp = await fetch(`${MCQ_BASE_URL}/bank/restore`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ids: [qid],
            user: store.state.user.username,
            isBjzxAdmin: isBjzxAdmin.value
          })
        })
        const data = await resp.json()
        if (data?.ok) {
          ElMessage.success('恢复成功')
          loadDeletedQuestions()
          loadQuestions()
        } else {
          throw new Error(data?.msg || '恢复失败')
        }
      } catch (error: any) {
        ElMessage.error('恢复失败：' + (error?.message || error))
      } finally {
        restoringQuestion[qid] = false
      }
    }

    const batchRestore = async () => {
      if (selectedDeleted.value.length === 0) return
      try {
        await ElMessageBox.confirm(
          `确认恢复选中的 ${selectedDeleted.value.length} 个题目？`,
          '批量恢复',
          { type: 'info' }
        )
        const resp = await fetch(`${MCQ_BASE_URL}/bank/restore`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ids: selectedDeleted.value,
            user: store.state.user.username,
            isBjzxAdmin: isBjzxAdmin.value
          })
        })
        const data = await resp.json()
        if (data?.ok) {
          ElMessage.success(`已恢复 ${data.count} 个题目`)
          selectedDeleted.value = []
          loadDeletedQuestions()
          loadQuestions()
        } else {
          throw new Error(data?.msg || '恢复失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('批量恢复失败：' + (error?.message || error))
        }
      }
    }

    const permanentDelete = async (qid: string) => {
      try {
        await ElMessageBox.confirm(
          '确认永久删除该题目？此操作无法恢复！',
          '警告',
          { confirmButtonText: '永久删除', cancelButtonText: '取消', type: 'error' }
        )
        permanentDeleting[qid] = true
        const resp = await fetch(`${MCQ_BASE_URL}/bank/delete`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ids: [qid],
            user: store.state.user.username,
            permanent: true,
            isBjzxAdmin: isBjzxAdmin.value
          })
        })
        const data = await resp.json()
        if (data?.ok) {
          ElMessage.success('已永久删除')
          loadDeletedQuestions()
        } else {
          throw new Error(data?.msg || '删除失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('永久删除失败：' + (error?.message || error))
        }
      } finally {
        permanentDeleting[qid] = false
      }
    }

    // ✨ 新增：批量永久删除
    const batchPermanentDelete = async () => {
      if (selectedDeleted.value.length === 0) return

      try {
        await ElMessageBox.confirm(
          `确认永久删除选中的 ${selectedDeleted.value.length} 个题目？此操作无法恢复！`,
          '批量永久删除',
          {
            confirmButtonText: '确定永久删除',
            cancelButtonText: '取消',
            type: 'error',
            dangerouslyUseHTMLString: true,
            message: `<p>您即将永久删除 <strong style="color: #f56c6c;">${selectedDeleted.value.length}</strong> 个题目</p><p style="color: #e6a23c;">⚠️ 此操作无法撤销，题目将被彻底删除！</p>`
          }
        )

        const resp = await fetch(`${MCQ_BASE_URL}/bank/delete`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ids: selectedDeleted.value,
            user: store.state.user.username,
            permanent: true,
            isBjzxAdmin: isBjzxAdmin.value
          })
        })

        const data = await resp.json()
        if (data?.ok) {
          ElMessage.success(`已永久删除 ${data.count} 个题目`)
          selectedDeleted.value = []
          loadDeletedQuestions()
        } else {
          throw new Error(data?.msg || '批量永久删除失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('批量永久删除失败：' + (error?.message || error))
        }
      }
    }

    const clearRecycleBin = async () => {
      try {
        await ElMessageBox.confirm(
          '确认清空回收站？将永久删除回收站中的所有题目，此操作无法撤销！',
          '警告',
          { confirmButtonText: '确定清空', cancelButtonText: '取消', type: 'error' }
        )
        const resp = await fetch(`${MCQ_BASE_URL}/bank/clear_deleted`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            user: store.state.user.username,
            isBjzxAdmin: isBjzxAdmin.value,
            bank_id: currentBankId.value
          })
        })
        const data = await resp.json()
        if (data?.ok) {
          ElMessage.success(`已清理 ${data.count} 个题目`)
          loadDeletedQuestions()
        } else {
          throw new Error(data?.msg || '清空失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('清空回收站失败：' + (error?.message || error))
        }
      }
    }

    const exportBankDocx = async () => {
      exportingBank.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/bank/export_docx?bank_id=${encodeURIComponent(currentBankId.value)}`)
        const blob = await r.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = '题库导出.docx'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
        ElMessage.success('已导出题库')
      } catch (e:any) { ElMessage.error(`导出失败：${e?.message||e}`) }
      finally { exportingBank.value = false }
    }

    const triggerPickBankDocx = () => { bankImportRef.value?.click() }

    const onPickBankDocx = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const f = input?.files?.[0]; if (!f) return
      importingBank.value = true
      try {
        const fd = new FormData(); fd.append('file', f); fd.append('bank_id', currentBankId.value)
        const r = await fetch(`${MCQ_BASE_URL}/bank/import_docx`, { method:'POST', body: fd })
        const j = await r.json(); if (!j?.ok) throw new Error(j?.msg || '导入失败')
        // 显示更详细的导入结果
        const msg = j.msg || `导入成功：更新 ${j.updated||0} 题，新增 ${j.added||0} 题`
        ElMessage.success(msg)
        await loadQuestions()
        loadBanksList()
      } catch(e:any) { ElMessage.error(`导入失败：${e?.message||e}`) }
      finally { importingBank.value = false; if (bankImportRef.value) bankImportRef.value.value='' }
    }

    const viewSources = async (qid: string) => {
      const url1 = `${MCQ_BASE_URL}/bank/sources?qid=${encodeURIComponent(qid)}`
      try { const res = await fetch(url1, { method: 'GET' }); if (res.ok) { openInNewTab(url1); return } }
      catch (e) { /* ignore */ }
      const url2 = `/mcq_public/bank/sources?qid=${encodeURIComponent(qid)}`
      openInNewTab(url2)
    }
    const isEditing = (id: string) => editingId.value === id

    // 将 <NEWLINE> 标记转换为真实换行符（用于试卷编辑等场景）
    const stripNewlineTags = (text: string): string => {
      if (!text) return text
      return text.replace(/<NEWLINE>/g, '\n')
    }
    // 将试卷题目所有文本字段中的 <NEWLINE> 转换为真实换行符
    const stripPaperItemNewlines = (item: any) => {
      if (!item) return
      if (item.stem) item.stem = stripNewlineTags(item.stem)
      if (item.answer) item.answer = stripNewlineTags(item.answer)
      if (item.explain) item.explain = stripNewlineTags(item.explain)
      if (item.options) {
        for (const k of Object.keys(item.options)) {
          if (item.options[k]) item.options[k] = stripNewlineTags(item.options[k])
        }
      }
      if (Array.isArray(item.knowledge_clauses)) {
        item.knowledge_clauses = item.knowledge_clauses.map((c: string) => stripNewlineTags(c))
      }
    }

    // 清理 markdown 符号用于编辑框显示
    const cleanMarkdownForEdit = (text: string): string => {
      if (!text) return ''
      // 将带选项字母的进度提示替换为选项分隔标记（保留选项标识）
      const replaceProgressWithLabel = (_: string, letter: string) => `【选项${letter.toUpperCase()}分析】`
      
      let cleaned = text
        .replace(/<NEWLINE>/g, '\n')           // <NEWLINE> 转换为真实换行
        // 移除"参考来源"关键词及其 markdown 符号（包括 **参考来源**:）
        .replace(/\*{0,2}参考来源\*{0,2}[：:\s]*/g, '')
        // 将带选项字母的进度提示替换为选项分隔标记
        .replace(/^([A-Ha-h])[.)、]?\s*正在进行混合检索[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*已找到相关资料[，,]正在生成回答[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*未找到高相关性资料[，,]基于通用知识回答[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*正在使用精准检索分析[.…]*\s*$/gm, replaceProgressWithLabel)
        // 移除不带选项字母的通用进度提示（支持行内任意位置）
        .replace(/正在进行混合检索[.…]*\s*/g, '')
        .replace(/已找到相关资料[，,]正在生成回答[.…]*\s*/g, '')
        .replace(/未找到高相关性资料[，,]基于通用知识回答[.…]*\s*/g, '')
        .replace(/正在使用精准检索分析[.…]*\s*/g, '')
        .replace(/^#{1,6}\s*/gm, '')           // 移除标题符号
        .replace(/\*\*(.+?)\*\*/g, '$1')       // 移除加粗
        .replace(/\*(.+?)\*/g, '$1')           // 移除斜体
        .replace(/__(.+?)__/g, '$1')           // 移除加粗
        .replace(/_(.+?)_/g, '$1')             // 移除斜体
        .replace(/^[-*]\s+/gm, '')             // 移除列表符号
        .replace(/```[\s\S]*?```/g, '')        // 移除代码块
        .replace(/`(.+?)`/g, '$1')             // 移除行内代码
        .replace(/\n{3,}/g, '\n\n')            // 清理多余空行
      return cleaned.trim()
    }

    // 从解析文本中提取知识点
    const extractKnowledgePoint = (analysis: string): { explain: string; kp: string } => {
      if (!analysis) return { explain: '', kp: '' }
      // 匹配 "知识点：《XXX》、《YYY》" 或 "知识点：《XXX》" 格式
      const kpMatch = analysis.match(/\n*知识点[：:]\s*(.+?)\s*$/s)
      if (kpMatch) {
        const kp = kpMatch[1].trim()
        const explain = analysis.slice(0, kpMatch.index).trim()
        return { explain, kp }
      }
      return { explain: analysis, kp: '' }
    }

    // 按需加载题目图片
    const loadQuestionImages = async (qid: string): Promise<any> => {
      try {
        const r = await fetch(`${MCQ_BASE_URL}/bank/images/${encodeURIComponent(qid)}`)
        const j = await r.json()
        if (j?.ok) {
          return {
            stem_images: j.stem_images || [],
            option_images: j.option_images || {},
            analysis_images: j.analysis_images || []
          }
        }
      } catch (e) {
        console.warn('加载图片失败', e)
      }
      return { stem_images: [], option_images: {}, analysis_images: [] }
    }

    const editRow = async (row: any) => {
      editingId.value = row.qid
      editBuf.stem = row.stem || ''
      editBuf.answer = row.answer || ''
      // 清理 markdown 符号，方便编辑，并提取纯解析文本（去除嵌入的知识点行）
      const cleanedAnalysis = cleanMarkdownForEdit(row.analysis || '')
      const { explain: extractedExplain, kp } = extractKnowledgePoint(cleanedAnalysis)
      editBuf.explain = extractedExplain
      editBuf.knowledge_point = kp
      // 优先使用结构化 knowledge_points 字段，回退到从 analysis 正则提取（兼容旧数据）
      if (row.knowledge_points && row.knowledge_points.length > 0) {
        editSelectedKnowledgePoints.value = [...row.knowledge_points]
      } else {
        editSelectedKnowledgePoints.value = extractKnowledgePointsFromAnalysis(row.analysis || '')
      }
      
      const map: Record<string, string> = {}
      ;(row.options || []).forEach((o: any) => {
        map[o.label] = o.text
      })
      editBuf.options = { ...map }
      
      // 按需加载图片数据（如果题目有图片但尚未加载）
      if (row.has_images && (!row.stem_images || row.stem_images.length === 0)) {
        const imgData = await loadQuestionImages(row.qid)
        row.stem_images = imgData.stem_images
        row.analysis_images = imgData.analysis_images
        // 合并选项图片到选项中
        if (imgData.option_images) {
          (row.options || []).forEach((o: any) => {
            if (imgData.option_images[o.label]) {
              o.images = imgData.option_images[o.label]
            }
          })
        }
      }
      
      editBuf.stem_images = JSON.parse(JSON.stringify(row.stem_images || []))
      // 从选项中提取图片
      const optImgs: Record<string, any[]> = {}
      ;(row.options || []).forEach((o: any) => {
        if (o.images && o.images.length > 0) {
          optImgs[o.label] = JSON.parse(JSON.stringify(o.images))
        }
      })
      editBuf.option_images = optImgs
      // 加载解析图片
      editBuf.analysis_images = JSON.parse(JSON.stringify(row.analysis_images || []))
      // 加载知识条款
      editBuf.knowledge_clauses = JSON.parse(JSON.stringify(row.knowledge_clauses || []))
    }

    const cancelEdit = () => {
      editingId.value = null
    }

    const saveRow = async (row: any) => {
      if (!isEditing(row.qid)) return
      try {
        // 1) 把当前编辑缓冲区打包发给后端
        // 解析文本仅保存纯解析内容，知识点通过 knowledge_points 结构化字段传递
        const finalExplain = (editBuf.explain || '').trim()
        // 根据是否有实际内容的选项自动判定题目类型
        // 同时清理空选项（无文本且无图片的选项不保存）
        const cleanedOptions: Record<string, string> = {}
        const optImgs = editBuf.option_images || {}
        for (const [k, v] of Object.entries(editBuf.options || {})) {
          if ((v as string || '').trim() !== '' || (optImgs[k] && optImgs[k].length > 0)) {
            cleanedOptions[k] = v as string
          }
        }
        const hasOptions = Object.keys(cleanedOptions).length > 0
        const newQtype = hasOptions ? (((editBuf.answer || '').length > 1) ? 'multi' : 'single') : 'saq'
        const itemData: any = {
          id: row.qid,
          stem: editBuf.stem,
          options: { ...cleanedOptions },
          answer: (editBuf.answer || '').toUpperCase(),
          explain: finalExplain,
          qtype: newQtype,
          knowledge_clauses: editBuf.knowledge_clauses || [],
          knowledge_points: editSelectedKnowledgePoints.value || [],
        }
        
        // 添加图片数据
        if (editBuf.stem_images && editBuf.stem_images.length > 0) {
          itemData.stem_images = editBuf.stem_images
        } else {
          itemData.stem_images = []  // 明确传递空数组表示删除所有图片
        }
        if (editBuf.option_images && Object.keys(editBuf.option_images).length > 0) {
          itemData.option_images = editBuf.option_images
        } else {
          itemData.option_images = {}
        }
        if (editBuf.analysis_images && editBuf.analysis_images.length > 0) {
          itemData.analysis_images = editBuf.analysis_images
        } else {
          itemData.analysis_images = []
        }
        
        const payload = { items: [itemData] }

        const upResp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        const up = await upResp.json()

        if (!up?.ok) {
          throw new Error(up?.msg || '保存失败')
        }

        // 2) 用后端返回的最新记录覆盖当前行，保证和 bank.json 完全一致
        const updated = (up.items && up.items[0]) || null
        if (updated) {
          row.stem = updated.stem || ''
          row.options = normalizeOptions(updated.options || {})
          row.answer = (updated.answer || '').toString().toUpperCase()
          row.analysis = updated.explain || ''
          row.status = updated.status || ((row.analysis || '').trim() ? 'draft' : 'none')
          row.qtype = updated.qtype || newQtype
          row.knowledge_clauses = updated.knowledge_clauses || []
          row.knowledge_points = updated.knowledge_points || []
        } else {
          // 理论上不会走到这里，兜底用前端缓冲区
          row.stem = editBuf.stem
          row.options = normalizeOptions(editBuf.options)
          row.answer = (editBuf.answer || '').toString().toUpperCase()
          row.analysis = editBuf.explain || ''
          row.status = (row.analysis && row.analysis.trim()) ? 'draft' : 'none'
          row.qtype = newQtype
          row.knowledge_clauses = editBuf.knowledge_clauses || []
          row.knowledge_points = editSelectedKnowledgePoints.value || []
        }

        ElMessage.success('保存成功')
        editingId.value = null
      } catch (e: any) {
        ElMessage.error(e?.message || e)
      }
    }

    const regenAndSave = async (row:any) => {
      rowRegenLoading[row.qid] = true
      try{
        const req:any = {
          items: [{ qid: row.qid, stem: row.stem, options: Object.fromEntries((row.options||[]).map((o:any)=>[o.label,o.text])) }],
          thinking: thinking.value,
          model_id: llmModelId.value,
          rerank_top_n: topN.value,
          use_insert_block: insertBlock.value
        }
        const resp = await fetch(`${MCQ_BASE_URL}/explain`, {
          method:'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(req)
        })
        const data = await resp.json()
        if (!data?.ok || !Array.isArray(data.results) || !data.results.length) {
          throw new Error(data?.msg || '解析失败')
        }
        const r0 = data.results[0]
        const explain = (r0.explain||'').trim()
        const explainRaw = (r0.explain_raw || r0.explain || '').trim()
        const newStatus = r0.answer_mismatch ? 'abnormal' : 'draft'
        const upResp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method:'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: [{ id: row.qid, explain: explainRaw, status: newStatus }] })
        })
        const up = await upResp.json()
        if (!up?.ok) throw new Error(up?.msg || '写回失败')
        row.analysis = explain; row.status = newStatus
        // 清除该题目的参考资料缓存，以便重新加载
        delete sourcesLoaded[row.qid]
        delete sourcesMap[row.qid]
        delete sourcesError[row.qid]
        ElMessage.success('已重生成并保存')
      }catch(e:any){ ElMessage.error(e?.message||e) }
      finally { rowRegenLoading[row.qid] = false }
    }

    const optionKeys = (opts: Array<{label:string;text:string}> | Record<string,string>) => {
      if (Array.isArray(opts)) return (opts as any[]).map((o:any)=>o.label).filter(Boolean).sort()
      return Object.keys(opts || {}).sort()
    }

    // 获取当前编辑缓冲区的选项 keys（用于编辑模式）
    const editOptionKeys = computed(() => {
      return Object.keys(editBuf.options || {}).sort()
    })

    // 添加选项
    const addOption = () => {
      const allKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      const existingKeys = Object.keys(editBuf.options || {})
      // 找到下一个可用的选项字母
      const nextKey = allKeys.find(k => !existingKeys.includes(k))
      if (nextKey) {
        editBuf.options[nextKey] = ''
      } else {
        ElMessage.warning('最多支持8个选项（A-H）')
      }
    }

    // 删除选项
    const removeOption = (key: string) => {
      delete editBuf.options[key]
      // 同时删除该选项的图片
      if (editBuf.option_images && editBuf.option_images[key]) {
        delete editBuf.option_images[key]
      }
    }

    // 判断编辑缓冲区中是否有实际内容的选项（文本非空或有图片）
    const hasRealOptions = () => {
      const opts = editBuf.options || {}
      const optImgs = editBuf.option_images || {}
      return Object.keys(opts).some(k => (opts[k] || '').trim() !== '' || (optImgs[k] && optImgs[k].length > 0))
    }

    // 编辑时的题目类型（根据是否有实际内容的选项自动判断）
    const editingQtype = computed(() => {
      return hasRealOptions() ? 'mcq' : 'saq'
    })

    // 中文数字转换
    const chineseNumber = (n: number): string => {
      const nums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
                     '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']
      return nums[n - 1] || String(n)
    }

    // 添加知识条款
    const addKnowledgeClause = () => {
      if (!editBuf.knowledge_clauses) editBuf.knowledge_clauses = []
      editBuf.knowledge_clauses.push('')
    }

    // 删除知识条款
    const removeKnowledgeClause = (index: number) => {
      editBuf.knowledge_clauses.splice(index, 1)
    }

    // 上传试卷/编辑试卷 - 添加知识条款
    const addPaperItemClause = (item: any) => {
      if (!item.knowledge_clauses) item.knowledge_clauses = []
      item.knowledge_clauses.push('')
    }

    // 上传试卷/编辑试卷 - 删除知识条款
    const removePaperItemClause = (item: any, index: number) => {
      if (item.knowledge_clauses) {
        item.knowledge_clauses.splice(index, 1)
        // 同步更新 clause_scores
        if (item.clause_scores && item.clause_scores.length > index) {
          item.clause_scores.splice(index, 1)
          item.score = item.clause_scores.reduce((s: number, v: number) => s + (v || 0), 0)
        }
      }
    }

    // 删除题干图片
    const removeStemImage = (imgIdx: number) => {
      if (editBuf.stem_images && editBuf.stem_images.length > imgIdx) {
        editBuf.stem_images.splice(imgIdx, 1)
      }
    }

    // 删除选项图片
    const removeOptionImage = (label: string, imgIdx: number) => {
      if (editBuf.option_images && editBuf.option_images[label] && editBuf.option_images[label].length > imgIdx) {
        editBuf.option_images[label].splice(imgIdx, 1)
        if (editBuf.option_images[label].length === 0) {
          delete editBuf.option_images[label]
        }
      }
    }

    // 删除解析图片
    const removeAnalysisImage = (imgIdx: number) => {
      if (editBuf.analysis_images && editBuf.analysis_images.length > imgIdx) {
        editBuf.analysis_images.splice(imgIdx, 1)
      }
    }

    // 题干图片上传
    const triggerStemImageUpload = () => {
      const input = document.getElementById('stem-image-input') as HTMLInputElement
      input?.click()
    }
    
    const onStemImageSelected = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const file = input?.files?.[0]
      if (!file) return
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('请选择图片文件')
        return
      }
      
      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning('图片大小不能超过5MB')
        return
      }
      
      try {
        // 读取文件并转换为base64
        const base64 = await fileToBase64(file)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
        
        // 添加到编辑缓冲区
        if (!editBuf.stem_images) {
          editBuf.stem_images = []
        }
        editBuf.stem_images.push({
          filename: file.name,
          base64: base64,
          ext: ext,
          content_type: file.type,
        })
        
        ElMessage.success('图片已添加')
      } catch (e: any) {
        ElMessage.error('图片读取失败：' + (e?.message || e))
      } finally {
        // 清空input以便再次选择同一文件
        if (input) input.value = ''
      }
    }
    
    // 将文件转换为base64（不含data:前缀）
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // 移除 "data:image/xxx;base64," 前缀
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    // 选项图片上传
    let currentOptionLabel = ''
    
    const triggerOptionImageUpload = (label: string) => {
      currentOptionLabel = label
      const input = document.getElementById('option-image-input') as HTMLInputElement
      input?.click()
    }
    
    const onOptionImageSelected = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const file = input?.files?.[0]
      if (!file || !currentOptionLabel) return
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('请选择图片文件')
        return
      }
      
      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning('图片大小不能超过5MB')
        return
      }
      
      try {
        // 读取文件并转换为base64
        const base64 = await fileToBase64(file)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
        
        // 添加到编辑缓冲区
        if (!editBuf.option_images) {
          editBuf.option_images = {}
        }
        if (!editBuf.option_images[currentOptionLabel]) {
          editBuf.option_images[currentOptionLabel] = []
        }
        editBuf.option_images[currentOptionLabel].push({
          filename: file.name,
          base64: base64,
          ext: ext,
          content_type: file.type,
        })
        
        ElMessage.success(`选项${currentOptionLabel}图片已添加`)
      } catch (e: any) {
        ElMessage.error('图片读取失败：' + (e?.message || e))
      } finally {
        // 清空input以便再次选择同一文件
        if (input) input.value = ''
        currentOptionLabel = ''
      }
    }

    // 解析图片上传
    const triggerAnalysisImageUpload = () => {
      const input = document.getElementById('analysis-image-input') as HTMLInputElement
      input?.click()
    }
    
    const onAnalysisImageSelected = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const file = input?.files?.[0]
      if (!file) return
      
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('请选择图片文件')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.warning('图片大小不能超过5MB')
        return
      }
      
      try {
        const base64 = await fileToBase64(file)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
        
        if (!editBuf.analysis_images) {
          editBuf.analysis_images = []
        }
        editBuf.analysis_images.push({
          filename: file.name,
          base64: base64,
          ext: ext,
          content_type: file.type,
        })
        
        ElMessage.success('解析图片已添加')
      } catch (e: any) {
        ElMessage.error('图片读取失败：' + (e?.message || e))
      } finally {
        if (input) input.value = ''
      }
    }

    const pagedQuestions = computed(() => {
      const start = (page.value - 1) * pageSize.value
      return (filteredQuestions.value || []).slice(start, start + pageSize.value)
    })

    const processAnalysisText = (text: string | null | undefined): string => {
      if (!text) return '<p>暂无解析</p>'
      // 将带选项字母的进度提示替换为选项分隔标记
      const replaceProgressWithLabel = (_: string, letter: string) => `【选项${letter.toUpperCase()}分析】`
      
      let cleaned = text
        // 移除"参考来源"关键词及其 markdown 符号（包括 **参考来源**:）
        .replace(/\*{0,2}参考来源\*{0,2}[：:\s]*/g, '')
        // 将带选项字母的进度提示替换为选项分隔标记
        .replace(/^([A-Ha-h])[.)、]?\s*正在进行混合检索[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*已找到相关资料[，,]正在生成回答[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*未找到高相关性资料[，,]基于通用知识回答[.…]*\s*$/gm, replaceProgressWithLabel)
        .replace(/^([A-Ha-h])[.)、]?\s*正在使用精准检索分析[.…]*\s*$/gm, replaceProgressWithLabel)
        // 移除不带选项字母的通用进度提示（支持行内任意位置）
        .replace(/正在进行混合检索[.…]*\s*/g, '')
        .replace(/已找到相关资料[，,]正在生成回答[.…]*\s*/g, '')
        .replace(/未找到高相关性资料[，,]基于通用知识回答[.…]*\s*/g, '')
        .replace(/正在使用精准检索分析[.…]*\s*/g, '')
        // 清理残留的孤立 ** 符号
        .replace(/^\s*\*\*\s*$/gm, '')
        .replace(/\*\*(?=\s*$)/gm, '')
      return renderMarkdown(cleaned)
    }
    const createPaper = async () => {
      // 仍然要求填写标题，和原行为保持一致
      if (!paperTitle.value) return ElMessage.warning('请输入试卷标题')
      
      const name = (paperTitle.value || '').trim() || '试卷'
      creatingPaper.value = true
      paperMessage.value = '生成中…'
      
      // 构建分数配置
      const scoreConfig: any = {
        single: singleScore.value,
        multi: multiScore.value,
        indeterminate: indeterminateScore.value,
        saq_mode: saqScoreMode.value
      }
      
      if (saqScoreMode.value === 'uniform') {
        scoreConfig.saq = saqScore.value
        // 统一模式下，为有知识条款的题目自动分配各条款分数
        const clauseScoresMap: Record<string, number[]> = {}
        approvedQuestions.value.forEach(q => {
          if (q.qtype === 'saq' && q.knowledge_clauses && q.knowledge_clauses.length > 0) {
            clauseScoresMap[q.qid] = distributeScore(saqScore.value, q.knowledge_clauses.length)
          }
        })
        if (Object.keys(clauseScoresMap).length > 0) {
          scoreConfig.saq_clause_scores = clauseScoresMap
        }
      } else {
        // 自定义模式：传递每题分数
        const customScores: Record<string, number> = {}
        const clauseScoresMap: Record<string, number[]> = {}
        approvedQuestions.value.forEach(q => {
          if (q.qtype === 'saq') {
            if (q.knowledge_clauses && q.knowledge_clauses.length > 0 && saqClauseScores[q.qid]) {
              clauseScoresMap[q.qid] = [...saqClauseScores[q.qid]]
              customScores[q.qid] = getSaqClauseTotal(q.qid)
            } else {
              customScores[q.qid] = saqCustomScores[q.qid] ?? saqScore.value
            }
          }
        })
        scoreConfig.saq_custom = customScores
        if (Object.keys(clauseScoresMap).length > 0) {
          scoreConfig.saq_clause_scores = clauseScoresMap
        }
      }
      
      let requestBody: any = { 
        name,
        score_config: scoreConfig,
        password: generatePaperPassword.value.trim(),
        bank_id: currentBankId.value,
      }
      
      if (paperGenerateMode.value === 'random') {
        // 随机抽取模式
        requestBody.random_mode = {
          single_count: randomSingleCount.value,
          multi_count: randomMultiCount.value,
          saq_count: randomSaqCount.value,
          indeterminate_single_count: randomIndeterminateSingleCount.value,
          indeterminate_multi_count: randomIndeterminateMultiCount.value
        }
      } else {
        // 手动选择模式
        // 如果选择了题目，则使用选中的题目；否则使用全部已通过题目
        const questionIds = selectedPaperQuestions.value.length > 0 
          ? selectedPaperQuestions.value 
          : null
        requestBody.question_ids = questionIds
        
        // 构建不定项配置
        if (enableIndeterminate.value) {
          if (indeterminateMode.value === 'select') {
            // 手动选择模式：传递选中的不定项题目ID
            if (selectedIndeterminateQuestions.value.length > 0) {
              requestBody.indeterminate = {
                mode: 'select',
                question_ids: selectedIndeterminateQuestions.value
              }
            }
          } else {
            // 按数量抽取模式
            requestBody.indeterminate = {
              mode: 'count',
              single_count: indeterminateSingleCount.value,
              multi_count: indeterminateMultiCount.value
            }
          }
        }
      }

      try {
        const r = await fetch(`${MCQ_BASE_URL}/bank/generate_paper`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(requestBody)
        })

        const ct = (r.headers && r.headers.get)
          ? (r.headers.get('content-type') || '')
          : ''

        // 如果是 JSON，说明是“无可用题目”或错误信息，按 qa_public.html 的规则处理
        if (ct.includes('application/json')) {
          const j = await r.json()
          if (!j.ok) throw new Error(j.msg || `HTTP ${r.status}`)
          paperMessage.value = j.msg || '无可用题目'
          return
        }

        // 否则认为是 DOCX，直接触发下载
        const blob = await r.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${name}.docx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)

        paperMessage.value = '试卷已生成'
        ElMessage.success('试卷生成成功')
        generatePaperPassword.value = ''
        setTimeout(() => { paperMessage.value = '' }, 1500)
        // 生成成功后刷新列表
        loadPaperList()
      } catch (error: any) {
        const msg = error?.message || error
        paperMessage.value = '生成失败：' + msg
        ElMessage.error(paperMessage.value)
      } finally {
        creatingPaper.value = false
      }
    }

    // 试卷列表管理函数
    const loadPaperList = async () => {
      loadingPaperList.value = true
      try {
        // 管理端获取全部试卷（包含可见性状态）
        const r = await fetch(`${MCQ_BASE_URL}/papers/list_open?visible_only=false`, { method: 'GET', cache: 'no-store' })
        const j = await r.json()
        if (Array.isArray(j)) {
          paperList.value = j
        } else if (j.ok === false) {
          throw new Error(j?.msg || `HTTP ${r.status}`)
        } else {
          paperList.value = []
        }
      } catch (error: any) {
        ElMessage.error('加载试卷列表失败：' + (error?.message || error))
      } finally {
        loadingPaperList.value = false
      }
    }

    // 切换试卷练习可见性
    const togglePaperVisibility = async (row: any) => {
      const paperId = row.paper_id
      const visible = row.visible
      togglingVisibility[paperId] = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/papers/visibility`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ paper_id: paperId, visible: visible })
        })
        const j = await r.json()
        if (!j?.ok) {
          // 恢复原状态
          row.visible = !visible
          throw new Error(j?.msg || '设置失败')
        }
        ElMessage.success(visible ? '试卷已开放练习' : '试卷已隐藏')
      } catch (error: any) {
        ElMessage.error('设置可见性失败：' + (error?.message || error))
      } finally {
        togglingVisibility[paperId] = false
      }
    }

    const downloadPaperDirect = (paperId: string) => {
      const url = `${MCQ_BASE_URL}/bank/paper_docx?paper_id=${encodeURIComponent(paperId)}`
      openInNewTab(url)
    }

    // 带密码保护的下载
    const downloadPaper = (paperId: string) => {
      const paper = paperList.value.find((p: any) => p.paper_id === paperId)
      if (paper?.has_password) {
        paperPasswordAction.value = 'download'
        paperPasswordTargetId.value = paperId
        paperPasswordInput.value = ''
        paperPasswordDialogVisible.value = true
      } else {
        downloadPaperDirect(paperId)
      }
    }

    // 带密码保护的编辑（读取编辑按钮）
    const editPaperWithPasswordCheck = () => {
      if (!editPaperSelected.value) {
        ElMessage.warning('请选择要编辑的试卷')
        return
      }
      const paper = paperList.value.find((p: any) => p.paper_id === editPaperSelected.value)
      if (paper?.has_password) {
        paperPasswordAction.value = 'edit'
        paperPasswordTargetId.value = editPaperSelected.value
        paperPasswordInput.value = ''
        paperPasswordDialogVisible.value = true
      } else {
        loadPaperForEdit()
      }
    }

    // 验证密码并执行操作
    const verifyPaperPassword = async () => {
      if (!paperPasswordInput.value.trim()) {
        ElMessage.warning('请输入密码')
        return
      }
      verifyingPassword.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/papers/verify_password`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ paper_id: paperPasswordTargetId.value, password: paperPasswordInput.value.trim() })
        })
        const j = await r.json()
        if (!j?.ok) throw new Error(j?.msg || '验证失败')
        if (!j.verified) {
          ElMessage.error('密码错误')
          return
        }
        // 密码正确，执行对应操作
        paperPasswordDialogVisible.value = false
        if (paperPasswordAction.value === 'download') {
          downloadPaperDirect(paperPasswordTargetId.value)
        } else if (paperPasswordAction.value === 'edit') {
          loadPaperForEdit()
        } else if ((paperPasswordAction.value as string) === 'delete') {
          doDeletePaper(paperPasswordTargetId.value, deletePaperTitle.value)
        }
      } catch (e: any) {
        ElMessage.error('验证失败：' + (e?.message || e))
      } finally {
        verifyingPassword.value = false
      }
    }

    // 超级管理员：查看/修改密码
    const openPasswordManage = async (paperId: string, title: string) => {
      passwordManageTargetId.value = paperId
      passwordManageTargetTitle.value = title
      passwordManageValue.value = ''
      passwordManageLoading.value = true
      passwordManageShowPwd.value = false
      passwordManageDialogVisible.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/papers/get_password?paper_id=${encodeURIComponent(paperId)}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        })
        const j = await r.json()
        if (j?.ok) {
          passwordManageValue.value = j.password || ''
        } else {
          throw new Error(j?.msg || '获取密码失败')
        }
      } catch (e: any) {
        ElMessage.error('获取密码失败：' + (e?.message || e))
      } finally {
        passwordManageLoading.value = false
      }
    }

    // 超级管理员：保存密码
    const savePasswordManage = async () => {
      passwordManageLoading.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/papers/password`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ paper_id: passwordManageTargetId.value, password: passwordManageValue.value.trim() })
        })
        const j = await r.json()
        if (!j?.ok) throw new Error(j?.msg || '保存失败')
        ElMessage.success(passwordManageValue.value.trim() ? '密码已更新' : '密码已清除')
        passwordManageDialogVisible.value = false
        await loadPaperList()
      } catch (e: any) {
        ElMessage.error('保存密码失败：' + (e?.message || e))
      } finally {
        passwordManageLoading.value = false
      }
    }

    // 实际执行删除
    const doDeletePaper = async (paperId: string, title: string) => {
      try {
        await ElMessageBox.confirm(
          `确认删除试卷「${title}」？同时会删除对应的学生版文件。`,
          '删除确认',
          { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
        )
        deletingPaper[paperId] = true
        const r = await fetch(`${MCQ_BASE_URL}/bank/delete_paper`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ paper_id: paperId })
        })
        const j = await r.json()
        if (!j?.ok) {
          throw new Error(j?.msg || '删除失败')
        }
        ElMessage.success(j.msg || '删除成功')
        loadPaperList()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败：' + (error?.message || error))
        }
      } finally {
        deletingPaper[paperId] = false
      }
    }

    // 带密码保护的删除
    const deletePaperTitle = ref('')
    const deletePaper = (paperId: string, title: string) => {
      const paper = paperList.value.find((p: any) => p.paper_id === paperId)
      if (paper?.has_password) {
        paperPasswordAction.value = 'delete' as any
        paperPasswordTargetId.value = paperId
        deletePaperTitle.value = title
        paperPasswordInput.value = ''
        paperPasswordDialogVisible.value = true
      } else {
        doDeletePaper(paperId, title)
      }
    }

    // ========== 上传试卷相关函数 ==========

    // 计算有问题的题目数量
    const paperParseIssueCount = computed(() => {
      return uploadedPaperItems.value.filter(item => hasParseIssue(item)).length
    })

    // 判断题目是否有解析问题（简答题不检查选项）
    const hasParseIssue = (item: any): boolean => {
      if (!item.stem || item.stem.trim().length === 0) return true
      // 简答题不需要选项
      if (item.qtype === 'saq') return false
      if (getOptionsCount(item) < 2) return true
      return false
    }

    // 获取有效选项数量（包括纯图片选项）
    const getOptionsCount = (item: any): number => {
      if (!item.options) return 0
      let count = 0
      const optionImages = item.option_images || {}
      for (const k of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
        // 选项有文本 或 有图片，都算有效选项
        const hasText = item.options[k] !== undefined && item.options[k] !== null
        const hasImages = optionImages[k] && optionImages[k].length > 0
        if (hasText || hasImages) count++
      }
      return count
    }

    // 触发选择试卷文件
    const triggerPickPaperFile = () => { paperUploadRef.value?.click() }

    // 选择试卷文件后处理
    const onPickPaperFile = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const f = input?.files?.[0]
      if (!f) return
      
      // 重置编辑状态（新上传的试卷不是编辑模式）
      isEditingExistingPaper.value = false
      editPaperOriginalId.value = ''
      
      try {
        ElMessage.info('正在解析试卷文件...')
        
        const fd = new FormData()
        fd.append('file', f)
        
        const r = await fetch(`${MCQ_BASE_URL}/upload`, { method: 'POST', body: fd })
        const j = await r.json()
        
        if (!j || j.ok === false) {
          throw new Error(j?.msg || '解析失败')
        }
        
        const items = Array.isArray(j.items) ? j.items : []
        const saqItems = Array.isArray(j.saq_items) ? j.saq_items : []
        
        if (items.length === 0 && saqItems.length === 0) {
          ElMessage.warning('未识别到任何题目，请检查文件格式')
          return
        }
        
        // 确保每个item的options是对象格式，保留qtype和图片数据
        const mcqList = items.map((x: any) => ({
          stem: x.stem || '',
          options: x.options || {},
          answer: (x.answer || '').toString().toUpperCase(),
          explain: x.explain_original || '',
          qtype: x.qtype || '',
          stem_images: x.stem_images || [],
          option_images: x.option_images || {},
          analysis_images: x.analysis_images || [],
          has_images: Boolean(x.has_images || (x.stem_images && x.stem_images.length > 0) || 
                              (x.option_images && Object.keys(x.option_images).length > 0) ||
                              (x.analysis_images && x.analysis_images.length > 0)),
        }))
        
        // 处理简答题（三字段：题干、答案、解析）
        const saqList = saqItems.map((x: any) => ({
          stem: x.stem || '',
          options: {},
          answer: x.answer || '',  // SAQ答案
          explain: x.explain_original || '',  // SAQ解析
          qtype: 'saq',
          category: x.category || '',
          reference_answer: '',  // 保留兼容性
          stem_images: x.stem_images || [],
          option_images: {},
          analysis_images: x.analysis_images || [],
          has_images: Boolean((x.stem_images && x.stem_images.length > 0) ||
                              (x.analysis_images && x.analysis_images.length > 0)),
        }))
        
        // 合并选择题和简答题
        uploadedPaperItems.value = [...mcqList, ...saqList]
        
        // 从文件名提取标题
        const fileName = f.name.replace(/\.(docx|txt)$/i, '')
        uploadedPaperTitle.value = fileName
        
        editingPaperItemIdx.value = null
        paperPreviewVisible.value = true
        
        const issueCount = mcqList.filter((item: any) => hasParseIssue(item)).length
        let msg = `成功识别 ${items.length} 道选择题`
        if (saqItems.length > 0) {
          msg += `，${saqItems.length} 道简答题`
        }
        if (issueCount > 0) {
          ElMessage.warning(`${msg}，其中 ${issueCount} 道选择题可能存在问题，请检查`)
        } else {
          ElMessage.success(msg)
        }
        
      } catch (e: any) {
        ElMessage.error(`解析失败：${e?.message || e}`)
      } finally {
        if (paperUploadRef.value) paperUploadRef.value.value = ''
      }
    }

    // 切换编辑某题
    const toggleEditPaperItem = (idx: number) => {
      if (editingPaperItemIdx.value === idx) {
        editingPaperItemIdx.value = null
      } else {
        editingPaperItemIdx.value = idx
      }
    }

    // 删除某题
    const deletePaperItem = (idx: number) => {
      ElMessageBox.confirm(
        `确定要删除第 ${idx + 1} 题吗？`,
        '删除确认',
        { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        uploadedPaperItems.value.splice(idx, 1)
        // 如果正在编辑的题目被删除，重置编辑状态
        if (editingPaperItemIdx.value === idx) {
          editingPaperItemIdx.value = null
        } else if (editingPaperItemIdx.value !== null && editingPaperItemIdx.value > idx) {
          // 如果删除的是编辑题目之前的题，索引需要减1
          editingPaperItemIdx.value--
        }
        ElMessage.success('已删除')
      }).catch(() => {})
    }

    // 删除上传试卷题目中的图片
    const deleteUploadedItemImage = (itemIdx: number, type: 'stem' | 'option' | 'analysis', imgIdx: number, optionKey?: string) => {
      const item = uploadedPaperItems.value[itemIdx]
      if (!item) return
      
      if (type === 'stem') {
        if (item.stem_images && item.stem_images[imgIdx]) {
          item.stem_images.splice(imgIdx, 1)
          updateItemHasImages(item)
          ElMessage.success('图片已删除')
        }
      } else if (type === 'option' && optionKey) {
        if (item.option_images && item.option_images[optionKey] && item.option_images[optionKey][imgIdx]) {
          item.option_images[optionKey].splice(imgIdx, 1)
          if (item.option_images[optionKey].length === 0) {
            delete item.option_images[optionKey]
          }
          updateItemHasImages(item)
          ElMessage.success('图片已删除')
        }
      } else if (type === 'analysis') {
        if (item.analysis_images && item.analysis_images[imgIdx]) {
          item.analysis_images.splice(imgIdx, 1)
          updateItemHasImages(item)
          ElMessage.success('图片已删除')
        }
      }
    }

    // 更新题目的has_images标记
    const updateItemHasImages = (item: any) => {
      item.has_images = Boolean(
        (item.stem_images && item.stem_images.length > 0) ||
        (item.option_images && Object.keys(item.option_images).some(k => item.option_images[k]?.length > 0)) ||
        (item.analysis_images && item.analysis_images.length > 0)
      )
    }

    // 图片上传状态
    const pendingImageUpload = ref<{ itemIdx: number; type: 'stem' | 'option' | 'analysis'; optionKey?: string } | null>(null)

    // 触发上传图片
    const triggerUploadItemImage = (itemIdx: number, type: 'stem' | 'option' | 'analysis', optionKey?: string) => {
      pendingImageUpload.value = { itemIdx, type, optionKey }
      // 创建临时input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => handleItemImageUpload(e as any)
      input.click()
    }

    // 处理图片上传
    const handleItemImageUpload = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const file = input?.files?.[0]
      if (!file || !pendingImageUpload.value) return
      
      const { itemIdx, type, optionKey } = pendingImageUpload.value
      const item = uploadedPaperItems.value[itemIdx]
      if (!item) return
      
      try {
        // 读取图片为base64
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]
          const imgData = {
            base64,
            content_type: file.type || 'image/png',
            filename: file.name
          }
          
          if (type === 'stem') {
            if (!item.stem_images) item.stem_images = []
            item.stem_images.push(imgData)
          } else if (type === 'option' && optionKey) {
            if (!item.option_images) item.option_images = {}
            if (!item.option_images[optionKey]) item.option_images[optionKey] = []
            item.option_images[optionKey].push(imgData)
          } else if (type === 'analysis') {
            if (!item.analysis_images) item.analysis_images = []
            item.analysis_images.push(imgData)
          }
          
          updateItemHasImages(item)
          ElMessage.success('图片已添加')
        }
        reader.readAsDataURL(file)
      } catch (e: any) {
        ElMessage.error('图片读取失败：' + (e?.message || e))
      } finally {
        pendingImageUpload.value = null
      }
    }

    // 加载试卷详情用于编辑
    const loadPaperForEdit = async () => {
      if (!editPaperSelected.value) {
        ElMessage.warning('请选择要编辑的试卷')
        return
      }
      
      loadingPaperDetail.value = true
      try {
        const r = await fetch(`${MCQ_BASE_URL}/papers/detail?paper_id=${encodeURIComponent(editPaperSelected.value)}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        })
        const j = await r.json()
        
        if (!j || j.ok === false) {
          throw new Error(j?.detail || j?.msg || '加载失败')
        }
        
        // 填充编辑数据
        uploadedPaperTitle.value = j.title || ''
        uploadedPaperItems.value = j.items || []
        // 将所有文本字段中的 <NEWLINE> 转换为真实换行符
        uploadedPaperItems.value.forEach((item: any) => stripPaperItemNewlines(item))
        
        // 设置分数配置
        const scoreConfig = j.score_config || {}
        uploadedSingleScore.value = scoreConfig.single || 1
        uploadedMultiScore.value = scoreConfig.multi || 5
        uploadedIndeterminateScore.value = scoreConfig.indeterminate || 5
        uploadedSaqScore.value = scoreConfig.saq || 10
        uploadedSaqScoreMode.value = scoreConfig.saq_mode || 'uniform'
        
        // 恢复知识条款分数到各题目上（使用索引作为key）
        const savedClauseScores = scoreConfig.saq_clause_scores || {}
        uploadedPaperItems.value.forEach((item: any, idx: number) => {
          if (item.qtype === 'saq' && item.knowledge_clauses && item.knowledge_clauses.length > 0) {
            if (savedClauseScores[String(idx)]) {
              item.clause_scores = [...savedClauseScores[String(idx)]]
              item.score = item.clause_scores.reduce((s: number, v: number) => s + (v || 0), 0)
            } else if (uploadedSaqScoreMode.value === 'uniform') {
              item.clause_scores = distributeScore(uploadedSaqScore.value, item.knowledge_clauses.length)
              item.score = uploadedSaqScore.value
            }
          }
        })
        
        // 标记为编辑模式
        isEditingExistingPaper.value = true
        editPaperOriginalId.value = editPaperSelected.value
        
        // 加载已有密码（如果超级管理员或者已验证过密码）
        paperPassword.value = ''
        try {
          const pr = await fetch(`${MCQ_BASE_URL}/papers/get_password?paper_id=${encodeURIComponent(editPaperSelected.value)}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            cache: 'no-store'
          })
          const pj = await pr.json()
          if (pj?.ok && pj.password) {
            paperPassword.value = pj.password
          }
        } catch { /* ignore - password field stays empty */ }
        
        editingPaperItemIdx.value = null
        paperPreviewVisible.value = true
        
        ElMessage.success(`已加载试卷「${j.title}」，共 ${j.items?.length || 0} 题`)
      } catch (e: any) {
        ElMessage.error(`加载试卷失败：${e?.message || e}`)
      } finally {
        loadingPaperDetail.value = false
      }
    }

    // 保存上传的试卷
    const saveUploadedPaper = async () => {
      if (!uploadedPaperTitle.value.trim()) {
        ElMessage.warning('请输入试卷标题')
        return
      }
      
      const validItems = uploadedPaperItems.value.filter(item => item.stem && item.stem.trim())
      if (validItems.length === 0) {
        ElMessage.warning('没有有效的题目可保存')
        return
      }
      
      savingUploadedPaper.value = true
      try {
        // 根据是否编辑模式选择不同的 API
        const isUpdate = isEditingExistingPaper.value && editPaperOriginalId.value
        const url = isUpdate 
          ? `${MCQ_BASE_URL}/papers/update`
          : `${MCQ_BASE_URL}/bank/save_paper`
        
        // 构建分数配置
        const scoreConfig: any = {
          single: uploadedSingleScore.value,
          multi: uploadedMultiScore.value,
          indeterminate: uploadedIndeterminateScore.value,
          saq_mode: uploadedSaqScoreMode.value
        }
        
        if (uploadedSaqScoreMode.value === 'uniform') {
          scoreConfig.saq = uploadedSaqScore.value
          // 统一模式下，为有知识条款的题目自动分配各条款分数（使用索引作为key）
          const clauseScoresMap: Record<string, number[]> = {}
          validItems.forEach((item: any, idx: number) => {
            if (item.qtype === 'saq' && item.knowledge_clauses && item.knowledge_clauses.length > 0) {
              clauseScoresMap[String(idx)] = distributeScore(uploadedSaqScore.value, item.knowledge_clauses.length)
            }
          })
          if (Object.keys(clauseScoresMap).length > 0) {
            scoreConfig.saq_clause_scores = clauseScoresMap
          }
        } else {
          // 自定义模式下，收集知识条款分数（使用索引作为key）
          const clauseScoresMap: Record<string, number[]> = {}
          validItems.forEach((item: any, idx: number) => {
            if (item.qtype === 'saq' && item.knowledge_clauses && item.knowledge_clauses.length > 0 && item.clause_scores) {
              clauseScoresMap[String(idx)] = [...item.clause_scores]
            }
          })
          if (Object.keys(clauseScoresMap).length > 0) {
            scoreConfig.saq_clause_scores = clauseScoresMap
          }
        }
        // 自定义模式下，每题总分已保存在 item.score 中
        
        const payload: any = {
          title: uploadedPaperTitle.value.trim(),
          items: validItems,
          score_config: scoreConfig
        }
        
        // 更新模式需要附带原试卷 ID
        if (isUpdate) {
          payload.paper_id = editPaperOriginalId.value
        }
        
        const r = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        })
        const j = await r.json()
        
        if (!j || j.ok === false) {
          throw new Error(j?.msg || '保存失败')
        }
        
        // 保存成功后设置密码（如果有）
        const newPaperId = j.paper_id || ''
        if (paperPassword.value.trim() && newPaperId) {
          try {
            await fetch(`${MCQ_BASE_URL}/papers/password`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ paper_id: newPaperId, password: paperPassword.value.trim() })
            })
          } catch (pwdErr: any) {
            ElMessage.warning('试卷已保存，但密码设置失败：' + (pwdErr?.message || pwdErr))
          }
        }
        
        ElMessage.success(j.msg || (isUpdate ? '试卷更新成功' : '试卷保存成功'))
        paperPreviewVisible.value = false
        uploadedPaperItems.value = []
        uploadedPaperTitle.value = ''
        paperPassword.value = ''
        
        // 重置编辑状态
        isEditingExistingPaper.value = false
        editPaperOriginalId.value = ''
        editPaperSelected.value = ''
        
        // 刷新试卷列表
        await loadPaperList()
        
      } catch (e: any) {
        ElMessage.error(`保存失败：${e?.message || e}`)
      } finally {
        savingUploadedPaper.value = false
      }
    }

    // 试卷对话框关闭时重置编辑状态
    const onPaperDialogClosed = () => {
      isEditingExistingPaper.value = false
      editPaperOriginalId.value = ''
      paperPassword.value = ''
      // 重置简答题分数模式为默认
      uploadedSaqScoreMode.value = 'uniform'
      // 停止解析任务
      if (paperPollingInterval.value) {
        clearInterval(paperPollingInterval.value)
        paperPollingInterval.value = null
      }
      paperTaskId.value = ''
      paperExplainMsg.value = ''
    }

    // 异步批量解析试卷题目
    const explainPaperItemsAsync = async () => {
      if (uploadedPaperItems.value.length === 0) {
        ElMessage.warning('没有题目可解析')
        return
      }
      
      paperExplaining.value = true
      paperExplainMsg.value = '创建任务中…'
      
      try {
        // 将试卷题目转换为解析任务需要的格式
        const items = uploadedPaperItems.value.map((item, idx) => ({
          idx,  // 用于后续更新
          stem: item.stem || '',
          options: item.options || {},
          answer: item.answer || '',
          qtype: item.qtype || 'single'
        }))
        
        const req = {
          items,
          model_id: llmModelId.value,
          thinking: thinking.value,
          rerank_top_n: topN.value,
          use_insert_block: insertBlock.value
        }
        
        const r = await fetch(`${MCQ_BASE_URL}/explain_paper_async`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(req)
        })
        const j = await r.json()
        
        if (!j?.ok) throw new Error(j?.msg || '创建任务失败')
        
        paperTaskId.value = String(j.task_id)
        pollPaperTaskStatus(String(j.task_id))
        
      } catch (e: any) {
        paperExplainMsg.value = `失败：${e?.message || e}`
        ElMessage.error(`创建解析任务失败：${e?.message || e}`)
      } finally {
        paperExplaining.value = false
      }
    }

    // 轮询试卷解析任务状态
    const pollPaperTaskStatus = (taskId: string) => {
      if (paperPollingInterval.value) clearInterval(paperPollingInterval.value)
      
      paperPollingInterval.value = window.setInterval(async () => {
        try {
          const r = await fetch(`${MCQ_BASE_URL}/tasks/status?task_id=${encodeURIComponent(taskId)}`, { cache: 'no-store' })
          const j = await r.json()
          
          if (!j || !j.ok) return
          
          paperExplainMsg.value = `进度：${j.done || 0}/${j.total || 0}`
          
          // 更新解析结果到 uploadedPaperItems
          const arrs = [j.results, j.delta_results, j.partial_results, j.latest_results, j.items, j.updates]
          arrs.forEach((arr: any[]) => {
            if (!Array.isArray(arr)) return
            arr.forEach((res: any) => {
              const idx = res.idx
              if (typeof idx === 'number' && idx >= 0 && idx < uploadedPaperItems.value.length) {
                if (res.ok !== false && res.explain) {
                  uploadedPaperItems.value[idx].explain = stripNewlineTags(res.explain)
                }
              }
            })
          })
          
          // 任务完成
          if (j.status === 'done' || j.status === 'stopped') {
            if (paperPollingInterval.value) {
              clearInterval(paperPollingInterval.value)
              paperPollingInterval.value = null
            }
            paperTaskId.value = ''
            paperExplainMsg.value = j.status === 'done' ? '解析完成' : '任务已停止'
            if (j.status === 'done') {
              ElMessage.success('试卷解析完成')
            }
          }
        } catch (e) {
          console.error('轮询试卷任务状态失败:', e)
        }
      }, 2000)
    }

    // 停止试卷解析任务
    const stopPaperExplainTask = async () => {
      if (!paperTaskId.value) return
      
      try {
        const r = await fetch(`${MCQ_BASE_URL}/tasks/stop`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ task_id: paperTaskId.value })
        })
        const j = await r.json()
        
        if (j?.ok) {
          ElMessage.success('任务已停止')
          if (paperPollingInterval.value) {
            clearInterval(paperPollingInterval.value)
            paperPollingInterval.value = null
          }
          paperTaskId.value = ''
          paperExplainMsg.value = '任务已停止'
        } else {
          throw new Error(j?.msg || '停止失败')
        }
      } catch (e: any) {
        ElMessage.error(`停止任务失败：${e?.message || e}`)
      }
    }

    // 单题解析
    const explainSinglePaperItem = async (idx: number) => {
      const item = uploadedPaperItems.value[idx]
      if (!item) return
      
      paperItemExplaining[idx] = true
      try {
        const req = {
          items: [{
            qid: `paper_item_${idx}`,
            stem: item.stem || '',
            options: item.options || {},
            answer: item.answer || '',
            qtype: item.qtype || 'single'
          }],
          thinking: thinking.value,
          model_id: llmModelId.value,
          rerank_top_n: topN.value,
          use_insert_block: insertBlock.value
        }
        
        const r = await fetch(`${MCQ_BASE_URL}/explain`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(req)
        })
        const j = await r.json()
        
        if (j?.results && j.results.length > 0 && j.results[0].explain) {
          uploadedPaperItems.value[idx].explain = stripNewlineTags(j.results[0].explain)
          ElMessage.success('解析完成')
        } else {
          throw new Error(j?.msg || '解析失败')
        }
      } catch (e: any) {
        ElMessage.error(`解析失败：${e?.message || e}`)
      } finally {
        paperItemExplaining[idx] = false
      }
    }

    const loadExportPapers = async () => {
      loadingExportPapers.value = true
      try {
        // 直接走 MCQ 试卷列表：GET {MCQ_BASE_URL}/bank/papers
        const r = await fetch(`${MCQ_BASE_URL}/bank/papers`, { method: 'GET', cache: 'no-store' })
        const j = await r.json()
        if (!j || j.ok === false) {
          throw new Error(j?.msg || `HTTP ${r.status}`)
        }
        exportPapers.value = Array.isArray(j.papers) ? j.papers : []
        // 默认选中第一份试卷
        if (!selectedExportPaper.value && exportPapers.value.length > 0) {
          selectedExportPaper.value = exportPapers.value[0].paper_id
        }
      } catch (error: any) {
        ElMessage.error('加载试卷列表失败：' + (error?.message || error))
      } finally {
        loadingExportPapers.value = false
      }
    }
    const exportZip = async () => {
      if (!selectedExportExam.value) {
        return ElMessage.warning('请选择考试场次')
      }
      exportingZip.value = true
      exportMessage.value = '正在生成ZIP压缩包...'
      try {
        let url = `${MCQ_BASE_URL}/grades/export_zip?paper_id=${encodeURIComponent(selectedExportPaper.value)}`
        if (selectedExportExam.value) {
          url += `&exam_id=${encodeURIComponent(selectedExportExam.value)}`
        }
        const response = await fetch(url)
        if (!response.ok) {
          const error = await response.json().catch(() => ({ msg: '导出失败' }))
          throw new Error(error.msg || '导出失败')
        }
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `成绩报告_${Date.now()}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
        exportMessage.value = '导出成功！'
        exportingZip.value = false
        setTimeout(() => { exportMessage.value = '' }, 3000)
      } catch (error: any) {
        exportMessage.value = '导出失败：' + (error?.message || error)
        ElMessage.error('导出失败：' + (error?.message || error))
      } finally {
        exportingZip.value = false
      }
    }

    const exportDocx = async () => {
      if (!selectedExportExam.value) {
        return ElMessage.warning('请选择考试场次')
      }
      exportingDocx.value = true
      exportMessage.value = '正在生成成绩汇总表...'
      try {
        let url = `${MCQ_BASE_URL}/grades/export_summary_docx?paper_id=${encodeURIComponent(selectedExportPaper.value)}`
        if (selectedExportExam.value) {
          url += `&exam_id=${encodeURIComponent(selectedExportExam.value)}`
        }
        const response = await fetch(url)
        if (!response.ok) {
          const error = await response.json().catch(() => ({ msg: '导出失败' }))
          throw new Error(error.msg || '导出失败')
        }
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `成绩汇总_${Date.now()}.docx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
        exportMessage.value = '导出成功！'
        setTimeout(() => { exportMessage.value = '' }, 3000)
      } catch (error: any) {
        exportMessage.value = '导出失败：' + (error?.message || error)
        ElMessage.error('导出失败：' + (error?.message || error))
      } finally {
        exportingDocx.value = false
      }
    }

    const exportXlsx = async () => {
      if (!selectedExportExam.value) {
        return ElMessage.warning('请选择考试场次')
      }
      exportingXlsx.value = true
      exportMessage.value = '正在生成Excel成绩汇总表...'
      try {
        let url = `${MCQ_BASE_URL}/grades/export_summary_xlsx?paper_id=${encodeURIComponent(selectedExportPaper.value)}`
        if (selectedExportExam.value) {
          url += `&exam_id=${encodeURIComponent(selectedExportExam.value)}`
        }
        const response = await fetch(url)
        if (!response.ok) {
          const error = await response.json().catch(() => ({ msg: '导出失败' }))
          throw new Error(error.msg || '导出失败')
        }
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `成绩汇总_${Date.now()}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
        exportMessage.value = '导出成功！'
        setTimeout(() => { exportMessage.value = '' }, 3000)
      } catch (error: any) {
        exportMessage.value = '导出失败：' + (error?.message || error)
        ElMessage.error('导出失败：' + (error?.message || error))
      } finally {
        exportingXlsx.value = false
      }
    }

    // ========== 成绩统计相关函数 ==========
    // 选择考试场次时触发
    const onExportExamChange = (examId: string) => {
      selectedExportExam.value = examId
      // 找到对应的考试，获取paper_id
      const exam = publishedExams.value.find((e: any) => e.exam_id === examId)
      if (exam) {
        selectedExportPaper.value = exam.paper_id
        loadGradesStats(exam.paper_id, examId)
      } else {
        gradesStats.value = null
      }
    }

    const loadGradesStats = async (paperId?: string, examId?: string) => {
      const pId = paperId || selectedExportPaper.value
      const eId = examId || selectedExportExam.value
      if (!pId) {
        gradesStats.value = null
        return
      }
      loadingGradesStats.value = true
      try {
        let url = `${MCQ_BASE_URL}/grades/stats?paper_id=${encodeURIComponent(pId)}`
        if (eId) {
          url += `&exam_id=${encodeURIComponent(eId)}`
        }
        const response = await fetch(url)
        const data = await response.json()
        if (data?.ok !== false) {
          gradesStats.value = data
        } else {
          gradesStats.value = null
        }
      } catch (error: any) {
        gradesStats.value = null
      } finally {
        loadingGradesStats.value = false
      }
    }

    // ========== 考试发布相关函数 ==========
    
    // 查看名单分页计算
    const pagedDeptUsersList = computed(() => {
      const start = (deptUsersPage.value - 1) * deptUsersPageSize.value
      return deptUsersList.value.slice(start, start + deptUsersPageSize.value)
    })

    // 预览分组用户名单（优先展示已选人员）
    const previewDeptUsers = async () => {
      deptUsersPage.value = 1
      if (publishForm.targetUsers.length > 0) {
        // 如果已精确选择了人员，从树数据中提取已选用户展示
        const selectedIds = new Set(publishForm.targetUsers)
        const users: any[] = []
        for (const group of personTreeData.value) {
          const gName = group.label?.replace(/\s*\(\d+人\)\s*$/, '') || ''
          for (const child of (group.children || [])) {
            if (selectedIds.has(child.userId)) {
              users.push({ id: child.userId, username: child.username, policeId: child.policeId, groupName: gName })
            }
          }
        }
        deptUsersList.value = users
        deptUsersDialogVisible.value = true
        return
      }
      if (publishForm.targetDepartments.length === 0) {
        return ElMessage.warning('请先选择目标分组')
      }
      loadingDeptUsers.value = true
      deptUsersDialogVisible.value = true
      deptUsersList.value = []
      try {
        // 按分组逐个加载，以便获取分组名
        const results = await Promise.all(
          publishForm.targetDepartments.map(async (groupId: string) => {
            const response = await fetchWithAuth(getApiUrl('/api/user/groups/users'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ groupIds: [groupId] })
            })
            const users = (response.ok && response.data?.data?.users) ? response.data.data.users : []
            const group = groupOptions.value.find((g: any) => g.id === groupId)
            const gName = group?.name || `分组${groupId}`
            return users.map((u: any) => ({ ...u, groupName: gName }))
          })
        )
        deptUsersList.value = results.flat()
      } catch (error: any) {
        ElMessage.error('获取分组用户列表失败：' + (error?.message || error))
        deptUsersList.value = []
      } finally {
        loadingDeptUsers.value = false
      }
    }

    // 人员选择树 - 实时勾选计数
    const personTreeCheckedCount = ref(0)

    const onPersonTreeCheck = () => {
      if (personTreeRef.value) {
        const checkedNodes = personTreeRef.value.getCheckedNodes(true)
        personTreeCheckedCount.value = checkedNodes.filter((n: any) => !n.isGroup).length
      }
    }

    // 分组变更时清空已选人员
    const onGroupSelectionChange = () => {
      publishForm.targetUsers = []
      personTreeCheckedCount.value = 0
    }

    // 人员树搜索过滤
    const filterPersonTreeNode = (value: string, data: any) => {
      if (!value) return true
      const keyword = value.toLowerCase()
      return (data.label || '').toLowerCase().includes(keyword)
    }

    // 监听搜索关键字变化触发树过滤
    watch(personTreeFilterText, (val) => {
      personTreeRef.value?.filter(val)
    })

    // 打开人员选择对话框
    const openPersonSelectDialog = async () => {
      if (publishForm.targetDepartments.length === 0) {
        return ElMessage.warning('请先选择目标分组')
      }
      personSelectDialogVisible.value = true
      loadingPersonTree.value = true
      personTreeData.value = []
      personTreeCheckedCount.value = 0
      personTreeFilterText.value = ''

      // 保存需要恢复的勾选keys
      const keysToRestore = publishForm.targetUsers.length > 0
        ? publishForm.targetUsers.map((uid: number) => `user_${uid}`)
        : null  // null 表示默认全选

      try {
        // 并行加载每个分组的用户
        const results = await Promise.all(
          publishForm.targetDepartments.map(async (groupId: string) => {
            const response = await fetchWithAuth(getApiUrl('/api/user/groups/users'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ groupIds: [groupId] })
            })
            const users = (response.ok && response.data?.data?.users) ? response.data.data.users : []
            return { groupId, users }
          })
        )

        const treeData = results.map(({ groupId, users }) => {
          const group = groupOptions.value.find((g: any) => g.id === groupId)
          const groupName = group?.name || `分组${groupId}`
          const children = users.map((u: any) => ({
            nodeId: `user_${u.id}`,
            label: `${u.username}${u.policeId ? ' (' + u.policeId + ')' : ''}`,
            isGroup: false,
            userId: u.id,
            username: u.username,
            policeId: u.policeId || '',
            department: u.department || ''
          }))
          return {
            nodeId: `group_${groupId}`,
            label: `${groupName} (${children.length}人)`,
            isGroup: true,
            groupId: groupId,
            children: children
          }
        })

        personTreeData.value = treeData
        // 先关闭loading使tree渲染到DOM
        loadingPersonTree.value = false
        await nextTick()

        // 设置勾选状态：有选择则恢复，否则默认全选
        if (personTreeRef.value) {
          if (keysToRestore) {
            personTreeRef.value.setCheckedKeys(keysToRestore)
          } else {
            const allUserNodeIds = treeData.flatMap((g: any) => g.children.map((c: any) => c.nodeId))
            personTreeRef.value.setCheckedKeys(allUserNodeIds)
          }
          onPersonTreeCheck()
        }
      } catch (error: any) {
        ElMessage.error('加载人员列表失败：' + (error?.message || error))
        loadingPersonTree.value = false
      }
    }

    // 全选 / 全不选
    const checkAllPersonTree = () => {
      if (!personTreeRef.value) return
      const allUserNodeIds = personTreeData.value.flatMap((g: any) => g.children.map((c: any) => c.nodeId))
      personTreeRef.value.setCheckedKeys(allUserNodeIds)
      onPersonTreeCheck()
    }
    const uncheckAllPersonTree = () => {
      if (!personTreeRef.value) return
      personTreeRef.value.setCheckedKeys([])
      personTreeCheckedCount.value = 0
    }

    // 确认人员选择
    const confirmPersonSelection = () => {
      if (!personTreeRef.value) return
      const checkedNodes = personTreeRef.value.getCheckedNodes(true)
      const selectedUsers = checkedNodes.filter((n: any) => !n.isGroup)
      publishForm.targetUsers = selectedUsers.map((n: any) => n.userId)
      personSelectDialogVisible.value = false
      if (selectedUsers.length > 0) {
        ElMessage.success(`已选择 ${selectedUsers.length} 人`)
      } else {
        ElMessage.warning('未选择任何人员')
      }
    }

    const publishExam = async () => {
      if (!publishForm.examName.trim()) {
        return ElMessage.warning('请输入考试名称')
      }
      if (!publishForm.paperId) {
        return ElMessage.warning('请选择试卷')
      }
      if (!publishForm.timeRange || publishForm.timeRange.length < 2) {
        return ElMessage.warning('请设置考试时间')
      }
      
      publishing.value = true
      publishMessage.value = '发布中...'
      try {
        const response = await fetch(`${MCQ_BASE_URL}/exam/publish`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            exam_name: publishForm.examName.trim(),
            paper_id: publishForm.paperId,
            start_time: publishForm.timeRange[0],
            end_time: publishForm.timeRange[1],
            duration_min: publishForm.durationMin,
            description: publishForm.description,
            target_groups: publishForm.targetDepartments,  // 目标分组ID列表
            target_users: publishForm.targetUsers.length > 0 ? publishForm.targetUsers : undefined  // 细化到个人的用户ID列表
          })
        })
        const data = await response.json()
        if (data?.ok) {
          ElMessage.success('考试发布成功')
          publishMessage.value = '发布成功！'
          publishForm.examName = ''
          publishForm.paperId = ''
          publishForm.timeRange = []
          publishForm.durationMin = 60
          publishForm.description = ''
          publishForm.targetDepartments = []
          publishForm.targetUsers = []
          loadPublishedExams()
        } else {
          throw new Error(data?.msg || '发布失败')
        }
      } catch (error: any) {
        publishMessage.value = '发布失败：' + (error?.message || error)
        ElMessage.error('发布失败：' + (error?.message || error))
      } finally {
        publishing.value = false
        setTimeout(() => { publishMessage.value = '' }, 3000)
      }
    }

    const loadPublishedExams = async () => {
      loadingPublished.value = true
      try {
        const response = await fetch(`${MCQ_BASE_URL}/exam/published`, {
          method: 'GET',
          cache: 'no-store',
          headers: getAuthHeaders(false)
        })
        const data = await response.json()
        if (data?.ok !== false) {
          publishedExams.value = Array.isArray(data.exams) ? data.exams : []
        }
      } catch (error: any) {
        ElMessage.error('加载已发布考试失败：' + (error?.message || error))
      } finally {
        loadingPublished.value = false
      }
    }

    const cancelExam = async (exam: any) => {
      try {
        await ElMessageBox.confirm(
          `确认取消考试「${exam.exam_name}」？`,
          '取消确认',
          { confirmButtonText: '确定取消', cancelButtonText: '返回', type: 'warning' }
        )
        cancelingExam[exam.exam_id] = true
        const response = await fetch(`${MCQ_BASE_URL}/exam/cancel`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ exam_id: exam.exam_id })
        })
        const data = await response.json()
        if (data?.ok) {
          ElMessage.success('已取消考试')
          loadPublishedExams()
        } else {
          throw new Error(data?.msg || '取消失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('取消失败：' + (error?.message || error))
        }
      } finally {
        cancelingExam[exam.exam_id] = false
      }
    }

    const deleteExam = async (exam: any) => {
      try {
        await ElMessageBox.confirm(
          `确认删除考试「${exam.exam_name}」？此操作不可恢复！`,
          '删除确认',
          { confirmButtonText: '确定删除', cancelButtonText: '返回', type: 'warning' }
        )
        deletingExam[exam.exam_id] = true
        const response = await fetch(`${MCQ_BASE_URL}/exam/delete`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ exam_id: exam.exam_id })
        })
        const data = await response.json()
        if (data?.ok) {
          ElMessage.success('已删除考试')
          if (selectedExportExam.value === exam.exam_id) {
            selectedExportExam.value = ''
            gradesStats.value = null
          }
          loadPublishedExams()
        } else {
          throw new Error(data?.msg || '删除失败')
        }
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败：' + (error?.message || error))
        }
      } finally {
        deletingExam[exam.exam_id] = false
      }
    }

    const deleteExamFromExport = async (exam: any) => {
      await deleteExam(exam)
    }

    const getExamStatusType = (status: string) => {
      const map: Record<string, string> = { pending: 'warning', active: 'success', ended: 'info', cancelled: 'danger' }
      return map[status] || 'info'
    }

    const getExamStatusText = (status: string) => {
      const map: Record<string, string> = { pending: '未开始', active: '进行中', ended: '已结束', cancelled: '已取消' }
      return map[status] || status
    }

    const normalizeRole = (role?: string) => (role || '').toLowerCase()

    const roleName = (role?: string, isBjzxAdmin?: boolean) => {
      const key = normalizeRole(role)
      if (key === UserRole.SUPER_ADMIN) return RoleNames[UserRole.SUPER_ADMIN]
      if (key === UserRole.ADMIN) return RoleNames[UserRole.ADMIN]
      if (key === UserRole.USER && isBjzxAdmin) return RoleNames[UserRole.BJZX_ADMIN]
      if (key === UserRole.USER) return RoleNames[UserRole.USER]
      return role || '未知角色'
    }

    // 状态码常量
    const UserStatus = {
      NORMAL: 1,        // 正常
      PENDING: 0,       // 待审核
      BANNED: -1,       // 封禁
      REJECTED: -2      // 审核未通过
    }

    const isBanned = (user: ManagedUser) => user.status === UserStatus.BANNED

    const loadUsers = async () => {
      loadingUsers.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_LIST))
        if (response.ok) {
          const raw = response.data?.data?.list || response.data?.data?.users || response.data || []
          const list = Array.isArray(raw) ? raw : (raw.items || [])
          users.value = list
        } else {
          throw new Error(response.data?.message || '加载用户列表失败')
        }
      } catch (error: any) {
        users.value = []
        ElMessage.error(error?.message || '加载用户列表失败')
      } finally {
        loadingUsers.value = false
      }
    }

    const filteredUsers = computed(() => {
      const keyword = userSearch.value.trim().toLowerCase()
      if (!keyword) return [...users.value]
      return users.value.filter((user) => {
        const username = user.username?.toLowerCase() || ''
        const email = user.email?.toLowerCase() || ''
        return username.includes(keyword) || email.includes(keyword)
      })
    })

    const pagedUsers = computed(() => {
      const start = (userPage.value - 1) * userPageSize.value
      return filteredUsers.value.slice(start, start + userPageSize.value)
    })

    const filteredPending = computed(() => {
      const keyword = pendingSearch.value.trim().toLowerCase()
      if (!keyword) return [...pendingUsers.value]
      return pendingUsers.value.filter((u) => {
        const username = u.username?.toLowerCase() || ''
        const policeId = ((u as any).policeId || (u as any).police_id || '').toLowerCase()
        return username.includes(keyword) || policeId.includes(keyword)
      })
    })

    const pagedPending = computed(() => {
      const start = (pendingPage.value - 1) * pendingPageSize.value
      return filteredPending.value.slice(start, start + pendingPageSize.value)
    })

    const applyUserSearch = () => {
      userSearch.value = userSearch.value.trim()
      userPage.value = 1
    }

    const isRegularUser = (user: ManagedUser) => normalizeRole(user.role) === UserRole.USER

    const banUser = async (user: ManagedUser) => {
      if (!isRegularUser(user)) {
        ElMessage.warning('仅可封禁普通用户')
        return
      }
      actionLoadingId.value = user.id || user.username
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_BAN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('封禁成功')
          await loadUsers()
        } else {
          throw new Error(response.data?.message || '封禁失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '封禁失败，请稍后重试')
      } finally {
        actionLoadingId.value = null
      }
    }

    const unbanUser = async (user: ManagedUser) => {
      actionLoadingId.value = user.id || user.username
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.USER_UNBAN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('已解除封禁')
          await loadUsers()
        } else {
          throw new Error(response.data?.message || '解除封禁失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '解除封禁失败，请稍后重试')
      } finally {
        actionLoadingId.value = null
      }
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

    const approveUser = async (user: ManagedUser) => {
      approvalLoadingId.value = user.id || user.username
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.ADMIN.APPROVE_USER), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, username: user.username })
        })
        if (response.ok && (response.data?.code === 200 || response.data?.success)) {
          ElMessage.success('账号已批准')
          await loadPendingUsers()
          await loadUsers()
        } else {
          throw new Error(response.data?.message || '批准失败，请稍后重试')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '批准失败，请稍后重试')
      } finally {
        approvalLoadingId.value = null
      }
    }

    const rejectUser = async (user: ManagedUser) => {
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
        rejectLoadingId.value = user.id || user.username
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

    const maskIdCard = (idCard: string) => {
      if (!idCard || idCard.length < 8) return idCard
      return idCard.slice(0, 6) + '********' + idCard.slice(-4)
    }

    const goToSaqGrading = () => {
      window.open('/saq-grading', '_blank')
    }

    // Tab切换拦截：离开考试设置时检查未保存修改
    const beforeTabLeave = (activeName: string, oldActiveName: string) => {
      if (oldActiveName === 'exam-settings' && isAntiCheatDirty.value) {
        return ElMessageBox.confirm(
          '防作弊配置已修改但尚未保存，确定要离开吗？',
          '未保存的更改',
          {
            confirmButtonText: '离开',
            cancelButtonText: '留在此页',
            type: 'warning',
          }
        ).then(() => true).catch(() => false)
      }
      return true
    }

    // 页面关闭/刷新时检查未保存的防作弊配置
    const handleAdminBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTab.value === 'exam-settings' && isAntiCheatDirty.value) {
        e.preventDefault()
        e.returnValue = '防作弊配置已修改但尚未保存，确定要离开吗？'
        return e.returnValue
      }
    }

    // 路由离开时检查未保存的防作弊配置
    onBeforeRouteLeave(async (to, from, next) => {
      if (activeTab.value === 'exam-settings' && isAntiCheatDirty.value) {
        try {
          await ElMessageBox.confirm(
            '防作弊配置已修改但尚未保存，确定要离开吗？',
            '未保存的更改',
            {
              confirmButtonText: '离开',
              cancelButtonText: '留在此页',
              type: 'warning',
            }
          )
          next()
        } catch {
          next(false)
        }
      } else {
        next()
      }
    })

    onMounted(() => {
      if (showBjzxTabs.value) {
        loadBanksList()
        loadQuestions()
        loadExportPapers()
        loadPaperList()
        loadPublishedExams()
        checkPendingTask()
        loadKnowledgePointOptions()
        loadGroupOptions()
        loadAntiCheatConfig()
      }
      if (showAdminTabs.value) {
        loadUsers()
        loadPendingUsers()
      }
      window.addEventListener('beforeunload', handleAdminBeforeUnload)
    })

    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleAdminBeforeUnload)
    })

    return {
      username, roleText, activeTab, myOldPassword, myNewPassword, resetUsername, resetPassword, resetPasswordConfirm,
      selectedResetUserId, resetUserOptions, onResetUserChange,
      showAdminTabs, showBjzxTabs,
      // 题库选择器
      currentBankId, banksList, loadingBanks, loadBanksList, onBankChange,
      showCreateBankDialog, showRenameBankDialog, deleteCurrentBank,
      changingPassword, resettingPassword, uploading, uploadMessage, generating, generateMessage, parseTargetStatuses,
      pendingUsers, loadingPending, approvalLoadingId, rejectLoadingId, pendingSearch, pendingPage, pendingPageSize, filteredPending, pagedPending,
      changeMyPassword, resetUserPassword, handleFileChange, uploadQuestions, downloadTemplate,
      generateExplanations, loadQuestions, toggleAnalysis, approveQuestion, rejectQuestion, deleteQuestion, cancelEdit,saveRow,
      approveAll, createPaper, loadExportPapers, exportZip, exportDocx, exportXlsx, exportingXlsx, isEditing,editRow,
      loadUsers, filteredUsers, applyUserSearch, banUser, unbanUser, roleName, isRegularUser,onPickBankDocx,
      loadPendingUsers, approveUser, rejectUser, maskIdCard,uploadRef,exportingBank,importingBank,viewSources,
      bankImportRef,asyncExplaining,asyncMsg,llmOptions,llmModelId,topN,thinking,insertBlock,triggerPickBankDocx,pendingTaskDismissed,dismissPendingTask,
      rejectingAll,page,pageSize,rowRegenLoading,deletingQuestion,editingId,editBuf,counterMsg,explainBatchAsync,rejectAll,exportBankDocx,
      UserStatus, isBanned, getStatusTagType, getStatusText, Refresh,regenAndSave,pagedQuestions,optionKeys,editOptionKeys,addOption,removeOption,removeStemImage,removeOptionImage,removeAnalysisImage,triggerStemImageUpload,onStemImageSelected,triggerOptionImageUpload,onOptionImageSelected,triggerAnalysisImageUpload,onAnalysisImageSelected,editingQtype,chineseNumber,addKnowledgeClause,removeKnowledgeClause,addPaperItemClause,removePaperItemClause,
      // 任务控制相关
      currentTaskId, currentTaskStatus, stoppingTask, resumingTask, isTaskRunning, canResumeTask, stopTask, resumeTask,
      sourcesMap, sourcesLoading, sourcesLoaded, sourcesError, sourcePassages, getSourceTitle, getSourceMeta, isGroupedSources,
      processAnalysisText,
      // 解析Tab切换相关
      analysisActiveTab, isComplexValidation, getAnalysisForTab, getSourcesForTab, getAvailableTabs,
      // 图片预览相关
      previewImageUrl, previewImageVisible, previewImage,
      // 批量选择相关
      selectedQuestions, selectAll, toggleSelectAll, batchDelete,
      // 回收站相关
      deletedQuestions, selectedDeleted, selectAllDeleted, toggleSelectAllDeleted, loadingDeleted, recycleMessage,
      recyclePage, recyclePageSize, pagedDeletedQuestions,
      restoringQuestion, permanentDeleting,
      loadDeletedQuestions, restoreQuestion, batchRestore,
      permanentDelete, batchPermanentDelete, clearRecycleBin,
      // 试卷生成相关
      questions, filteredQuestions, statusFilter, searchQuery, loadingQuestions, showingAnalysis, approvingAll,
      paperTitle, creatingPaper, paperMessage,
      singleScore, multiScore, indeterminateScore, saqScore, saqScoreMode, saqCustomScores, saqClauseScores, distributeScore, getSaqClauseTotal,
      paperQuestionFilter, paperQuestionSearch, selectedPaperQuestions, selectAllPaperQuestions,
      selectedKnowledgePoints, availableKnowledgePoints, mergedKnowledgePointOptions,
      approvedQuestions, filteredPaperQuestions, pagedPaperQuestions, paperQuestionPage, paperQuestionPageSize, toggleSelectAllPaperQuestions, isMultiChoice,
      paperList, loadingPaperList, deletingPaper, togglingVisibility, loadPaperList, downloadPaper, deletePaper, togglePaperVisibility, isSuperAdminUser, generatePaperPassword, paperListSearch, paperListPage, paperListPageSize, filteredPaperList, pagedPaperList,
      exportPapers, selectedExportPaper, selectedExportExam, onExportExamChange, loadingExportPapers, exportingZip, exportingDocx, exportMessage,
      userSearch, users, loadingUsers, actionLoadingId, userPage, userPageSize, pagedUsers,
      // 试卷生成模式
      paperGenerateMode, randomSingleCount, randomMultiCount, randomSaqCount, randomIndeterminateSingleCount, randomIndeterminateMultiCount, randomIndeterminateCount,
      singleApprovedCount, multiApprovedCount, saqApprovedCount,
      // 不定项配置
      enableIndeterminate, indeterminateMode, indeterminateSingleCount, indeterminateMultiCount, indeterminateTotalCount,
      selectedIndeterminateQuestions, toggleIndeterminate,
      // 上传试卷相关
      paperUploadRef, paperPreviewVisible, uploadedPaperTitle, uploadedPaperItems,
      editingPaperItemIdx, savingUploadedPaper, paperParseIssueCount,
      hasParseIssue, getOptionsCount, triggerPickPaperFile, onPickPaperFile,
      toggleEditPaperItem, deletePaperItem, saveUploadedPaper,
      deleteUploadedItemImage, triggerUploadItemImage,
      uploadedSingleScore, uploadedMultiScore, uploadedIndeterminateScore, uploadedSaqScore, uploadedSaqScoreMode,
      // 编辑已有试卷相关
      editPaperSelected, loadingPaperDetail, isEditingExistingPaper, editPaperOriginalId,
      loadPaperForEdit, onPaperDialogClosed, editPaperWithPasswordCheck,
      // 试卷密码保护相关
      paperPassword, paperPasswordDialogVisible, paperPasswordInput, paperPasswordAction, paperPasswordTargetId,
      verifyingPassword, verifyPaperPassword, downloadPaperDirect, deletePaperTitle,
      passwordManageDialogVisible, passwordManageTargetId, passwordManageTargetTitle,
      passwordManageValue, passwordManageLoading, passwordManageShowPwd,
      openPasswordManage, savePasswordManage,
      // 试卷解析相关
      paperExplaining, paperExplainMsg, paperTaskId, paperParseTargets, paperItemExplaining,
      explainPaperItemsAsync, stopPaperExplainTask, explainSinglePaperItem,
      // 考试发布相关
      publishForm, publishing, publishMessage, publishedExams, loadingPublished, cancelingExam, deletingExam, examSearch, examPage, examPageSize, filteredExams, pagedExams, sortedPublishedExams,
      publishExam, loadPublishedExams, cancelExam, deleteExam, deleteExamFromExport, getExamStatusType, getExamStatusText, Bell, Plus,
      // 分组相关（从接口动态加载）
      groupOptions, loadingGroupList,
      // 知识点/考点预设选项
      knowledgePointOptions, editSelectedKnowledgePoints,
      kpManageDialogVisible, newKpName, editingKpIndex, editingKpName,
      addKnowledgePoint, startEditKp, saveEditKp, cancelEditKp, deleteKnowledgePoint, resetKnowledgePoints,
      // 部门用户预览相关
      deptUsersDialogVisible, loadingDeptUsers, deptUsersList, previewDeptUsers,
      pagedDeptUsersList, deptUsersPage, deptUsersPageSize,
      // 人员选择树相关
      personSelectDialogVisible, loadingPersonTree, personTreeData, personTreeRef, personTreeCheckedCount,
      personTreeFilterText, filterPersonTreeNode,
      openPersonSelectDialog, onGroupSelectionChange, onPersonTreeCheck, confirmPersonSelection,
      checkAllPersonTree, uncheckAllPersonTree,
      // 简答题评分
      goToSaqGrading, Edit,
      // 成绩统计相关
      gradesStats, loadingGradesStats, scoreDistribution, loadGradesStats, gradesSearch, gradesPage, gradesPageSize, filteredGradesDetails, pagedGradesDetails,
      // 易错知识点统计
      topKpErrors, getKpBarWidth, getKpBarColor, Warning, Delete,
      // 错题Top10统计
      topWrongQuestions, getWrongQBarWidth, getWrongQBarColor, getQtypeLabel, Failed,
      // 知识点/错题详情弹窗
      kpDetailDialogVisible, loadingKpDetail, kpDetailData, viewKpDetail,
      questionDetailDialogVisible, loadingQuestionDetail, questionDetailData, viewQuestionDetail, getWrongChoiceBarWidth,
      // 作弊详情弹窗
      cheatDetailDialogVisible, cheatDetailData, viewCheatDetail,
      // 改分功能
      scoreEditDialogVisible, scoreEditData, scoreEditForm, scoreEditSaving,
      openScoreEditDialog, submitScoreOverride, clearScoreOverride, EditPen,
      // 修正答案功能
      fixAnswerDialogVisible, fixAnswerForm, fixAnswerSaving, fixAnswerResult,
      mcqQuestionsOverview, fixAnswerSelectedQ, qtypeLabelMap,
      openFixAnswerDialog, onFixQuestionChange, submitFixAnswer,
      // 防作弊配置相关
      antiCheatConfig, loadingAntiCheat, savingAntiCheat, antiCheatMessage,
      loadAntiCheatConfig, saveAntiCheatConfig, isAntiCheatDirty, beforeTabLeave,
      vncPortsDialogVisible, vncPortEntries, newVncPortEntry, openVncPortsDialog, addVncPortEntry, removeVncPortEntry, confirmVncPorts, Setting,
      // 图标组件
      Upload, Download, MagicStick, Search, Check, Close
    }
  }
})
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 60px);
  background: url('@/assets/allPic/public/userInfo.png') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  padding: 2rem 0;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}
.page-header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
}
.page-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  color: #1f2937;
}
.subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}
.tab-content {
  padding: 1rem;
}
.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.status-msg {
  color: #6b7280;
  font-size: 0.875rem;
  margin-left: 10px;
}
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
.question-card {
  margin-bottom: 0;
}
.q-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}
.q-options {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
  color: #4b5563;
}
.q-stem-images {
  margin: 0.5rem 0 0.75rem 0;
  padding-left: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.q-analysis-images {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}
.analysis-images-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 500;
}
.q-option-item {
  margin-bottom: 4px;
}
.q-option-images {
  margin: 4px 0 8px 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.q-image {
  max-width: 300px;
  max-height: 200px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.q-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.q-option-image {
  max-width: 200px;
  max-height: 150px;
}
.edit-images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.edit-image-item {
  position: relative;
  display: inline-block;
}
.edit-image-preview {
  max-width: 150px;
  max-height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
}
.edit-image-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px !important;
  height: 20px !important;
  padding: 0 !important;
}
.edit-image-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 80px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  color: #909399;
  font-size: 12px;
  transition: all 0.2s;
  cursor: pointer;
}
.edit-image-add:hover {
  border-color: #409eff;
  color: #409eff;
}
.edit-image-add-small {
  width: 60px;
  height: 50px;
  font-size: 10px;
}
.opt-row-wrapper {
  width: 100%;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}
.opt-row-wrapper:last-of-type {
  border-bottom: none;
}
.opt-images-row {
  margin-left: 30px;
  margin-top: 6px;
}
.editable-image-wrapper {
  position: relative;
  display: inline-block;
}
.editable-image-wrapper .img-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px !important;
  height: 20px !important;
  padding: 0 !important;
  font-size: 10px;
}
.q-analysis {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px dashed #e5e7eb;
  white-space: pre-wrap;
  color: #374151;
}
.q-analysis-text {
  white-space: pre-wrap;
  margin-bottom: 0.5rem;
}
.analysis-tab-bar {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e5e7eb;
}

.analysis-tab-bar :deep(.el-radio-button__inner) {
  padding: 6px 12px;
}

.analysis-sources {
  margin-top: 0.25rem;
}

.analysis-sources summary {
  cursor: pointer;
  font-weight: 600;
}

.src-loading,
.src-empty,
.src-error {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.src-error {
  color: #b91c1c;
}

.src-group {
  margin-top: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
}

.src-group-body {
  margin-top: 0.25rem;
}

.src-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  background: #f9fafb;
}

.src-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.src-meta {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.src-passages {
  margin-top: 4px;
}

.passage {
  margin-top: 4px;
  border-radius: 4px;
  border: 1px dashed #d1d5db;
  background: #f3f4f6;
  padding: 4px 6px;
}

.passage pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.user-management-card {
  margin-top: 1.5rem;
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
/* 选项整体容器占满一整行，宽度和“题干”一致 */
.opts-grid {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 每一行（A/B/C/D）也占满整行 */
.opt-row {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.opt-label {
  flex: 0 0 22px;
  text-align: right;
  color: #475569;
  line-height: 1.6;
  padding-top: 3px;
}

/* 右侧输入框占掉剩余所有宽度 */
.opt-input {
  flex: 1 1 auto;
}

/* 选项删除按钮 */
.opt-remove-btn {
  flex-shrink: 0;
  margin-top: 2px;
}

/* 选项操作区域（添加按钮 + 提示） */
.opt-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.opt-hint {
  font-size: 12px;
  color: #9ca3af;
}

.knowledge-point-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.knowledge-point-hint .el-icon {
  font-size: 14px;
}

/* 考点管理对话框样式 */
.kp-manage-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
}
.kp-manage-item:last-child {
  border-bottom: none;
}
.kp-manage-item:hover {
  background: #f9fafb;
}
.kp-manage-item .kp-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
}
.kp-manage-item .kp-actions {
  display: flex;
  gap: 8px;
}

.mcq-tab-content {
  padding: 0 !important;
}

.mcq-toolbar {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.toolbar-section {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.toolbar-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.title-icon {
  font-size: 16px;
  color: #667eea;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.button-group .el-divider--vertical {
  height: 24px;
  margin: 0 4px;
}

.toolbar-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  border-radius: 6px;
  border-left: 3px solid #0ea5e9;
  font-size: 13px;
  color: #0c4a6e;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-icon {
  font-size: 16px;
  color: #0ea5e9;
  flex-shrink: 0;
}

.toolbar-message span {
  line-height: 1.5;
}

.filter-section {
  background: #fafbfc;
}

.filter-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-msg-box {
  padding: 8px 12px;
  background: #eff6ff;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
  font-size: 13px;
  color: #1e40af;
}

.status-msg-box span {
  display: block;
}

.status-msg-box span + span {
  margin-top: 4px;
}

/* 试卷题目选择列表 */
.paper-question-list {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.paper-question-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.paper-question-item:last-child {
  border-bottom: none;
}

.paper-question-item:hover {
  background-color: #f9fafb;
}

.paper-question-item.selected {
  background-color: #eff6ff;
}

.paper-question-content {
  flex: 1;
  min-width: 0;
}

.paper-question-stem {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.5;
  margin-bottom: 6px;
}

.paper-question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.paper-question-opt {
  white-space: nowrap;
}

.paper-question-answer {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
}

.paper-question-answer.no-answer {
  color: #ef4444;
  font-weight: 600;
}

/* 上传试卷预览样式 */
.paper-preview-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fff;
}

.paper-preview-item.has-issue {
  border-color: #f87171;
  background: #fef2f2;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-num {
  font-weight: 600;
  color: #374151;
}

.preview-content {
  padding-left: 20px;
}

.preview-stem {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 8px;
  line-height: 1.5;
}

.preview-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 6px;
}

.preview-opt {
  font-size: 13px;
  color: #4b5563;
}

.preview-answer {
  font-size: 13px;
  color: #10b981;
  font-weight: 500;
}

.preview-answer.no-answer {
  color: #ef4444;
}

.preview-edit {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  margin-top: 8px;
}

/* 成绩统计面板样式 */
.grades-stats-panel {
  margin-top: 20px;
}

.stats-card {
  height: 100%;
}

.stats-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
}

.stats-icon {
  color: #667eea;
  font-size: 18px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stats-overview .stat-item {
  text-align: center;
  padding: 12px 8px;
  background: #f8fafc;
  border-radius: 8px;
}

.stats-overview .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stats-overview .stat-value.highlight {
  color: #667eea;
}

.stats-overview .stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.score-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dist-label {
  width: 60px;
  font-size: 13px;
  color: #4b5563;
  flex-shrink: 0;
}

.dist-bar-wrapper {
  flex: 1;
  height: 18px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.dist-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dist-count {
  width: 90px;
  font-size: 12px;
  color: #6b7280;
  text-align: right;
  flex-shrink: 0;
}

.rank-info {
  padding: 8px 0;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
}

.rank-item.best {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.05) 100%);
}

.rank-item.worst {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.1) 0%, rgba(245, 108, 108, 0.05) 100%);
}

.rank-icon {
  font-size: 28px;
}

.rank-content {
  flex: 1;
}

.rank-title {
  font-size: 12px;
  color: #6b7280;
}

.rank-score {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.rank-name {
  font-size: 13px;
  color: #4b5563;
  margin-top: 2px;
}

.score-pass {
  color: #67c23a;
  font-weight: 600;
}

.score-fail {
  color: #f56c6c;
  font-weight: 600;
}

/* 易错知识点统计样式 */
.kp-error-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kp-error-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kp-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kp-rank.top-three {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  color: white;
}

.kp-name {
  width: 180px;
  font-size: 13px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.kp-bar-wrapper {
  flex: 1;
  height: 20px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.kp-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.kp-count {
  width: 50px;
  font-size: 13px;
  color: #6b7280;
  text-align: right;
  flex-shrink: 0;
  font-weight: 500;
}

/* 错题Top10统计样式 */
.wrong-question-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wrong-question-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.wrong-question-item:last-child {
  border-bottom: none;
}

.wq-rank {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wq-rank.top-three {
  background: linear-gradient(135deg, #e74c3c 0%, #e67e22 100%);
  color: white;
}

.wq-tag {
  flex-shrink: 0;
}

.wq-stem {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.wq-bar-wrapper {
  width: 120px;
  height: 18px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.wq-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.wq-count {
  width: 60px;
  font-size: 13px;
  color: #e74c3c;
  text-align: right;
  flex-shrink: 0;
  font-weight: 500;
}

/* 详情弹窗样式 */
.detail-summary {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.detail-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.detail-stat .stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.detail-stat .stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.detail-stat .stat-value.error {
  color: #e74c3c;
}

.error-students-list {
  max-height: 120px;
  overflow-y: auto;
  padding: 10px;
  background: #fafafa;
  border-radius: 6px;
}

.detail-questions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-question-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #fafafa;
  border-radius: 6px;
}

.dq-rank {
  width: 24px;
  height: 24px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.dq-stem {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dq-error {
  font-size: 12px;
  color: #e74c3c;
  flex-shrink: 0;
}

.question-detail-content {
  background: #fafafa;
  padding: 15px;
  border-radius: 8px;
}

.qd-stem {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 15px;
}

.qd-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qd-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.qd-option.correct {
  background: #f0f9eb;
  border-color: #67c23a;
}

.opt-label {
  font-weight: 600;
  margin-right: 8px;
  color: #606266;
}

.opt-text {
  flex: 1;
  color: #303133;
}

.qd-answer {
  font-size: 14px;
  line-height: 1.6;
}

.answer-content {
  margin-top: 8px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  white-space: pre-wrap;
}

.wrong-choice-dist {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wcd-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wcd-label {
  width: 30px;
  font-weight: 600;
  color: #606266;
  text-align: center;
}

.wcd-bar-wrapper {
  flex: 1;
  height: 20px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.wcd-bar {
  height: 100%;
  background: #e74c3c;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.wcd-count {
  width: 50px;
  font-size: 13px;
  color: #606266;
  text-align: right;
}
</style>
