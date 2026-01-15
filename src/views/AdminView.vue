<template>
  <div class="admin-page">
    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <h1>管理中心</h1>
        <p class="subtitle">{{ username }} ({{ roleText }})</p>
      </header>

      <el-tabs v-model="activeTab" type="border-card">
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
            </div>

            <div v-if="loadingPending" style="text-align: center; padding: 40px">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            </div>
            <el-empty v-else-if="pendingUsers.length === 0" description="暂无待审核账号" />
            <el-table
              v-else
              :data="pendingUsers"
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
          </div>
        </el-tab-pane>

        <!-- 密码管理 -->
        <el-tab-pane v-if="showAdminTabs" label="密码管理" name="password">
          <div class="tab-content">
            <el-form label-width="100px">
              <el-form-item label="修改密码">
                <el-input v-model="myOldPassword" type="password" placeholder="旧密码" style="width: 200px" />
                <el-input v-model="myNewPassword" type="password" placeholder="新密码" style="width: 200px; margin-left: 10px" />
                <el-button @click="changeMyPassword" :loading="changingPassword" style="margin-left: 10px">修改</el-button>
              </el-form-item>
              <el-form-item label="重置密码">
                <el-input v-model="resetUsername" placeholder="用户名" style="width: 200px" />
                <el-input v-model="resetPassword" type="password" placeholder="新密码" style="width: 200px; margin-left: 10px" />
                <el-button @click="resetUserPassword" :loading="resettingPassword" style="margin-left: 10px">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- ==================== 题库管理（MCQ 对接） ==================== -->
        <el-tab-pane v-if="showBjzxTabs" label="题库管理" name="questions">
          <div class="tab-content mcq-tab-content">

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
                    accept=".docx,.txt"
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
                  <el-button type="success" @click="generateExplanations" :loading="generating" :icon="MagicStick" size="default">
                    一键解析
                  </el-button>
                  <el-button @click="explainBatchAsync" :loading="asyncExplaining" :icon="Loading" size="default" :disabled="isTaskRunning">
                    异步批量
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
                <div v-if="generateMessage || asyncMsg" class="toolbar-message">
                  <el-icon class="message-icon"><InfoFilled /></el-icon>
                  <span v-if="generateMessage">{{ generateMessage }}</span>
                  <span v-if="asyncMsg">{{ asyncMsg }}</span>
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
                    <el-tag v-if="q.has_images" type="info" size="small" effect="plain">📷 含图片</el-tag>
                  </div>
                  <el-tag v-if="q.ai_generated_answer" type="warning" size="small" style="margin-right: 6px;" effect="plain">
                    🤖 AI答案待校对
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
                    @click="cancelEdit(q)"
                  >
                    取消
                  </el-button>

                  <!-- 重生成并保存：仅在题目状态为“已驳回”（rejected）时显示 -->
                  <el-button
                    v-if="q.status === 'rejected'"
                    size="small"
                    type="primary"
                    @click="regenAndSave(q)"
                    :loading="rowRegenLoading[q.qid]"
                  >
                    重生成并保存
                  </el-button>

                  <!-- 通过 / 驳回：保持不变 -->
                  <el-button
                    size="small"
                    type="success"
                    @click="approveQuestion(q.qid)"
                    :disabled="!q.analysis"
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
                            @click="removeStemImage(imgIdx)"
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
                                  @click="removeOptionImage(k, imgIdx)"
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
                          <span class="opt-hint">（支持 A-H，最少1个选项）</span>
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

                    <!-- 3. 答案 -->
                    <el-form-item label="答案">
                      <el-input
                        v-model="editBuf.answer"
                        placeholder="如 A 或 AC"
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
                            @click="removeAnalysisImage(imgIdx)"
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
                v-for="q in deletedQuestions"
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
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span>
                      <span style="margin-right: 4px;">单选题</span>
                      <el-input-number v-model="singleScore" :min="0" :max="100" :precision="1" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">分/题</span>
                    </span>
                    <span>
                      <span style="margin-right: 4px;">多选题</span>
                      <el-input-number v-model="multiScore" :min="0" :max="100" :precision="1" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">分/题</span>
                    </span>
                    <span>
                      <span style="margin-right: 4px;">不定项</span>
                      <el-input-number v-model="indeterminateScore" :min="0" :max="100" :precision="1" size="small" style="width: 80px;" />
                      <span style="margin-left: 4px;">分/题</span>
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
                
                <!-- 生成按钮 -->
                <el-form-item label="" style="margin-bottom: 0;">
                  <el-button type="primary" @click="createPaper" :loading="creatingPaper">
                    {{ paperGenerateMode === 'random' 
                      ? `随机生成试卷 (${randomSingleCount + randomMultiCount + randomIndeterminateCount}题)` 
                      : `生成试卷 ${selectedPaperQuestions.length > 0 ? '(' + selectedPaperQuestions.length + '题)' : '(全部)'}` }}
                  </el-button>
                  <span class="status-msg">{{ paperMessage }}</span>
                </el-form-item>
              </el-form>
              
              <!-- 筛选和搜索 -->
              <div class="action-bar" style="margin-bottom: 12px;">
                <el-radio-group v-model="paperQuestionFilter" size="small">
                  <el-radio-button value="all">全部</el-radio-button>
                  <el-radio-button value="single">单选题</el-radio-button>
                  <el-radio-button value="multi">多选题</el-radio-button>
                </el-radio-group>
                <el-input
                  v-model="paperQuestionSearch"
                  placeholder="搜索题干或选项"
                  clearable
                  style="width: 250px; margin-left: 12px;"
                  size="small"
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
                  v-for="(q, idx) in filteredPaperQuestions"
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
                      <el-tag :type="isMultiChoice(q) ? 'warning' : 'info'" size="small" style="margin-right: 8px;">
                        {{ isMultiChoice(q) ? '多选' : '单选' }}
                      </el-tag>
                      <el-tag 
                        v-if="enableIndeterminate && indeterminateMode === 'select'" 
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
                    <div class="paper-question-answer" :class="{ 'no-answer': !q.answer || !q.answer.trim() }">
                      {{ q.answer && q.answer.trim() ? `答案：${q.answer}` : '⚠️ 无答案（考试系统无法判分）' }}
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
            
            <!-- 试卷列表 -->
            <el-card shadow="never">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600;">已生成试卷</span>
                  <div>
                    <input ref="paperUploadRef" type="file" accept=".docx,.txt" style="display:none" @change="onPickPaperFile" />
                    <el-button size="small" type="success" @click="triggerPickPaperFile" :icon="Upload">上传试卷</el-button>
                    <span style="margin-left: 10px; color: #909399;">共 {{ paperList.length }} 份</span>
                  </div>
                </div>
              </template>
              <el-table :data="paperList" stripe border style="width: 100%">
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
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="{ row }">
                    <el-button size="small" @click="downloadPaper(row.paper_id)">下载</el-button>
                    <el-button size="small" type="danger" @click="deletePaper(row.paper_id, row.title)" :loading="deletingPaper[row.paper_id]">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <!-- 上传试卷预览编辑对话框 -->
            <el-dialog
              v-model="paperPreviewVisible"
              title="上传试卷预览"
              width="900px"
              :close-on-click-modal="false"
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
                    </div>
                  </el-form-item>
                </el-form>
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
                    <el-tag v-if="item.qtype === 'single'" type="info" size="small">单选</el-tag>
                    <el-tag v-else-if="item.qtype === 'multi'" type="warning" size="small">多选</el-tag>
                    <el-tag v-else-if="item.qtype === 'indeterminate'" type="success" size="small">不定项</el-tag>
                    <el-tag v-if="hasParseIssue(item)" type="danger" size="small">需检查</el-tag>
                    <el-tag v-if="!item.answer" type="warning" size="small">缺少答案</el-tag>
                    <el-tag v-if="getOptionsCount(item) < 2" type="warning" size="small">选项不足</el-tag>
                    <el-tag v-if="item.has_images" type="info" size="small">📷 图片题</el-tag>
                    <el-button
                      size="small"
                      type="primary"
                      link
                      @click="toggleEditPaperItem(idx)"
                      style="margin-left: auto;"
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
                    <div class="preview-options">
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
                    <div class="preview-answer" :class="{ 'no-answer': !item.answer }">
                      {{ item.answer ? `答案：${item.answer}` : '⚠️ 缺少答案' }}
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
                              <el-button class="img-delete-btn" type="danger" size="small" circle :icon="Delete" @click="deleteUploadedItemImage(idx, 'stem', imgIdx)" />
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
                                <el-button class="img-delete-btn" type="danger" size="small" circle :icon="Delete" @click="deleteUploadedItemImage(idx, 'option', imgIdx, k)" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </el-form-item>
                      <el-form-item label="答案">
                        <el-input v-model="item.answer" placeholder="如 A 或 ABC" style="width: 200px;" />
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
                              <el-button class="img-delete-btn" type="danger" size="small" circle :icon="Delete" @click="deleteUploadedItemImage(idx, 'analysis', imgIdx)" />
                            </div>
                            <el-button size="small" type="primary" plain :icon="Plus" @click="triggerUploadItemImage(idx, 'analysis')">添加</el-button>
                          </div>
                        </div>
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
              </div>
              
              <template #footer>
                <el-button @click="paperPreviewVisible = false">取消</el-button>
                <el-button type="primary" @click="saveUploadedPaper" :loading="savingUploadedPaper">
                  保存试卷
                </el-button>
              </template>
            </el-dialog>
          </div>
        </el-tab-pane>

        <!-- 成绩导出 -->
        <el-tab-pane v-if="showBjzxTabs" label="成绩导出" name="export">
          <div class="tab-content">
            <div class="action-bar">
              <el-select v-model="selectedExportExam" placeholder="选择考试场次" style="width: 400px" @change="onExportExamChange">
                <el-option 
                  v-for="exam in publishedExams" 
                  :key="exam.exam_id" 
                  :label="`${exam.exam_name} (${exam.paper_title})`" 
                  :value="exam.exam_id"
                />
              </el-select>
              <el-button @click="loadPublishedExams" :loading="loadingPublished">刷新</el-button>
              <el-button type="primary" @click="exportZip" :loading="exportingZip" :disabled="!selectedExportExam">导出ZIP</el-button>
              <!-- <el-button type="success" @click="exportXlsx" :loading="exportingXlsx" :disabled="!selectedExportExam">导出Excel</el-button> -->
              <el-button @click="exportDocx" :loading="exportingDocx" :disabled="!selectedExportExam">导出DOCX</el-button>
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
              
              <!-- 成绩明细表 -->
              <el-card shadow="hover" style="margin-top: 20px;">
                <template #header>
                  <div class="stats-card-header">
                    <el-icon class="stats-icon"><List /></el-icon>
                    <span>成绩明细</span>
                    <span style="margin-left: auto; color: #909399; font-size: 13px;">共 {{ gradesStats.details?.length || 0 }} 人</span>
                  </div>
                </template>
                <el-table :data="gradesStats.details || []" border stripe max-height="400" style="width: 100%">
                  <el-table-column type="index" label="排名" width="70" />
                  <el-table-column prop="student_name" label="学生姓名" min-width="120" />
                  <el-table-column prop="student_id" label="学号/警号" min-width="140" />
                  <el-table-column prop="score" label="得分" width="100" sortable>
                    <template #default="scope">
                      <span :class="{ 'score-pass': scope.row.score >= 60, 'score-fail': scope.row.score < 60 }">
                        {{ scope.row.score?.toFixed(1) || 0 }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="correct_count" label="正确题数" width="100" />
                  <el-table-column prop="submit_time" label="交卷时间" min-width="160" />
                </el-table>
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
                  <el-button size="small" @click="loadPublishedExams" :loading="loadingPublished" :icon="Refresh">刷新</el-button>
                </div>
              </template>
              
              <el-empty v-if="publishedExams.length === 0" description="暂无已发布的考试" />
              
              <el-table v-else :data="publishedExams" border stripe style="width: 100%">
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
            :data="filteredUsers"
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
                <el-tag :type="scope.row.role === 'admin' ? 'warning' : 'info'">
                  {{ roleName(scope.row.role) }}
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
        </div>
      </el-card>

      <!-- 图片预览对话框 -->
      <el-dialog v-model="previewImageVisible" title="图片预览" width="80%" :close-on-click-modal="true">
        <div style="text-align: center;">
          <img :src="previewImageUrl" style="max-width: 100%; max-height: 70vh;" />
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, reactive } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Refresh, Search, Document, Upload, Download, MagicStick, Filter, Check, Close, InfoFilled, Bell, TrendCharts, Histogram, Medal, List, Plus } from '@element-plus/icons-vue'
import { RoleNames, UserRole, canAccessAdminTabs, canAccessBjzxTabs } from '@/config/permissions'
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
  ai_generated_answer?: boolean  // 标记答案是否由 AI 生成（需人工校对）
  deleted_at?: string
  deleted_by?: string
  has_images?: boolean  // 是否包含图片
  stem_images?: QuestionImage[]  // 题干图片
  analysis_images?: QuestionImage[]  // 解析图片
}

interface Paper {
  paper_id: string
  title: string
}

export default defineComponent({
  name: 'AdminView',
  // eslint-disable-next-line vue/no-unused-components
  components: { Loading, Search, Refresh, Document, Upload, Download, MagicStick, Filter, Check, Close, InfoFilled, Bell, TrendCharts, Histogram, Medal, List, Plus },
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
    const changingPassword = ref(false)
    const resettingPassword = ref(false)

    // ======= 题库管理（MCQ） =======
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
      
      // 查找"分项解析："之后的内容
      const marker = '分项解析：'
      const markerIdx = analysis.indexOf(marker)
      if (markerIdx === -1) return result
      
      const afterMarker = analysis.substring(markerIdx + marker.length)
      
      // 匹配 "A. xxx" 格式，直到下一个选项或特定结束标记
      const optionPattern = /([A-H])[.、]\s*([\s\S]*?)(?=(?:\n[A-H][.、])|(?:\n\n说明：)|(?:\n【)|$)/g
      let match
      while ((match = optionPattern.exec(afterMarker)) !== null) {
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
    const stoppingTask = ref(false)
    const resumingTask = ref(false)
    const llmOptions = ref([
      { value: 'qwen3-32b',     label: 'Qwen (通用) ' },
      { value: 'qwen2025',      label: 'Qwen (增强)' },
      { value: 'deepseek',      label: 'DeepSeekv3_2' },
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
    const editBuf = reactive<any>({ stem:'', answer:'', explain:'', options:{}, stem_images: [], option_images: {}, analysis_images: [] })
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
    const restoringQuestion = reactive<Record<string, boolean>>({})
    const permanentDeleting = reactive<Record<string, boolean>>({})

    // 回收站全选切换
    const toggleSelectAllDeleted = () => {
      if (selectAllDeleted.value) {
        selectedDeleted.value = deletedQuestions.value.map(q => q.qid)
      } else {
        selectedDeleted.value = []
      }
    }

    const filteredQuestions = computed(() => {
      try {
        if (statusFilter.value === 'all') return questions.value
        return questions.value.filter(q => q.status === statusFilter.value)
      } catch { return questions.value || [] }
    })

    const paperTitle = ref('')
    const creatingPaper = ref(false)
    const paperMessage = ref('')

    // 分数设置
    const singleScore = ref(1)       // 单选题分数
    const multiScore = ref(5)        // 多选题分数
    const indeterminateScore = ref(5) // 不定项分数

    // 试卷列表管理
    const paperList = ref<Paper[]>([])
    const loadingPaperList = ref(false)
    const deletingPaper = reactive<Record<string, boolean>>({})
    const togglingVisibility = reactive<Record<string, boolean>>({})
    const exportPapers = ref<Paper[]>([])
    const selectedExportPaper = ref('')
    const selectedExportExam = ref('')
    const loadingExportPapers = ref(false)
    const exportingZip = ref(false)
    const exportingDocx = ref(false)
    const exportingXlsx = ref(false)
    const exportMessage = ref('')

    // 试卷题目选择相关
    const paperQuestionFilter = ref<'all' | 'single' | 'multi'>('all')
    const paperQuestionSearch = ref('')
    const selectedPaperQuestions = ref<string[]>([])
    const selectAllPaperQuestions = ref(false)

    // 试卷生成模式
    const paperGenerateMode = ref<'manual' | 'random'>('manual')

    // 随机抽取配置
    const randomSingleCount = ref(5)
    const randomMultiCount = ref(5)
    const randomIndeterminateSingleCount = ref(0)  // 不定项中的单选数量
    const randomIndeterminateMultiCount = ref(0)   // 不定项中的多选数量
    // 兼容旧代码：计算总不定项数量
    const randomIndeterminateCount = computed(() => randomIndeterminateSingleCount.value + randomIndeterminateMultiCount.value)

    // 计算题库中各类型的题目数量
    const singleApprovedCount = computed(() => {
      return approvedQuestions.value.filter(q => !isMultiChoice(q)).length
    })
    const multiApprovedCount = computed(() => {
      return approvedQuestions.value.filter(q => isMultiChoice(q)).length
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

    // ======= 考试发布相关 =======
    const publishForm = reactive({
      examName: '',
      paperId: '',
      timeRange: [] as string[],
      durationMin: 60,
      description: ''
    })
    const publishing = ref(false)
    const publishMessage = ref('')
    const publishedExams = ref<any[]>([])
    const loadingPublished = ref(false)
    const cancelingExam = reactive<Record<string, boolean>>({})
    const deletingExam = reactive<Record<string, boolean>>({})

    // ======= 成绩统计相关 =======
    const gradesStats = ref<any>(null)
    const loadingGradesStats = ref(false)
    
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

    // 判断题目是否为多选题（答案包含多个字母）
    const isMultiChoice = (q: Question) => {
      const answer = (q.answer || '').toUpperCase().replace(/[^A-H]/g, '')
      return answer.length > 1
    }

    // 已通过的题目列表
    const approvedQuestions = computed(() => {
      return questions.value.filter(q => q.status === 'approved')
    })

    // 根据筛选和搜索过滤后的题目
    const filteredPaperQuestions = computed(() => {
      let result = approvedQuestions.value

      // 按类型筛选
      if (paperQuestionFilter.value === 'single') {
        result = result.filter(q => !isMultiChoice(q))
      } else if (paperQuestionFilter.value === 'multi') {
        result = result.filter(q => isMultiChoice(q))
      }

      // 按关键词搜索
      const keyword = paperQuestionSearch.value.trim().toLowerCase()
      if (keyword) {
        result = result.filter(q => {
          // 搜索题干
          if (q.stem.toLowerCase().includes(keyword)) return true
          // 搜索选项
          for (const opt of q.options) {
            if (opt.text.toLowerCase().includes(keyword)) return true
          }
          return false
        })
      }

      return result
    })

    // 切换全选试卷题目
    const toggleSelectAllPaperQuestions = () => {
      if (selectAllPaperQuestions.value) {
        selectedPaperQuestions.value = filteredPaperQuestions.value.map(q => q.qid)
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
    }

    const users = ref<ManagedUser[]>([])
    const loadingUsers = ref(false)
    const actionLoadingId = ref<string | number | null>(null)
    const pendingUsers = ref<ManagedUser[]>([])
    const loadingPending = ref(false)
    const approvalLoadingId = ref<string | number | null>(null)
    const rejectLoadingId = ref<string | number | null>(null)


    const getStatusTagType = (status: string) => {
      const map: Record<string, any> = { approved: 'success', draft: 'warning', abnormal: 'danger', rejected: 'info' }
      return map[status] || ''
    }

    const getStatusText = (status: string) => {
      const map: Record<string, string> = { approved: '已通过', draft: '草稿', abnormal: '异常', rejected: '已驳回', none: '无解析' }
      return map[status] || status
    }

    const changeMyPassword = async () => {
      if (!myNewPassword.value) return ElMessage.warning('新密码不可为空')
      changingPassword.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             id: store.state.user.id,
             username: store.state.user.username,
             oldPassword: myOldPassword.value,
             newPassword: myNewPassword.value
            })
        })
        if (response.data.ok) {
          ElMessage.success('修改成功，请重新登录')
          store.dispatch('logout')
          setTimeout(() => window.location.href = '/login', 1000)
        } else throw new Error(response.data.detail || '修改失败')
      } catch (error: any) {
        ElMessage.error('修改失败：' + error.message)
      } finally {
        changingPassword.value = false
      }
    }

    const resetUserPassword = async () => {
      if (!resetUsername.value || !resetPassword.value) return ElMessage.warning('请输入用户名和新密码')
      resettingPassword.value = true
      try {
        const response = await fetchWithAuth(getApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: store.state.user.id,
            username: resetUsername.value,
            newPassword: resetPassword.value
          })
        })
        if (response.data.ok) {
          ElMessage.success('重置成功')
          resetUsername.value = ''
          resetPassword.value = ''
        } else throw new Error(response.data.detail || '重置失败')
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

        // 2）对齐 qa_public.html：把 answer 也带上，同时保留图片数据
        const upsertPayload = items.map((x: any) => {
          const item: any = {
            stem: x.stem || '',
            options: x.options || {},
            answer: (x.answer || '').toString().toUpperCase(),
            explain: x.explain_original || '',
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

        // 3）检查重复题目
        uploadMessage.value = '检查重复题目中…'
        const checkRes = await fetch(`${MCQ_BASE_URL}/bank/check_duplicates`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: upsertPayload }),
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

        // 5）执行保存
        uploadMessage.value = '保存中…'
        const rs = await fetch(`${MCQ_BASE_URL}/bank/bulk_upsert`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: finalPayload }),
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
            has_images: Boolean(it.has_images),
            stem_images: it.stem_images || [],
            analysis_images: it.analysis_images || [],
          }
        })

        const parsedExplainCount = questions.value.filter(
          q => (q.analysis || '').trim().length > 0
        ).length
        
        // 7）构建消息，包含格式化和去重信息
        let msg = `识别成功并已保存：${questions.value.length} 题；识别解析：${parsedExplainCount} 条`
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
          target_statuses: parseTargetStatuses.value  // 传递选中的目标状态
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
              const row = (questions.value || []).find(x => String(x.qid) === String(res.qid))
              if (!row || res.ok === false) return
              const explain = (res.explain||'').trim()
              if (explain) row.analysis = explain
              if (typeof res.answer_mismatch !== 'undefined' && (row.status==='none'||row.status==='draft')){
                row.status = res.answer_mismatch ? 'abnormal' : 'draft'
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
              explain: r.explain || '',
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
        // 不分页(page=0)，加载图片数据
        const r = await fetch(`${MCQ_BASE_URL}/bank/list?page=0&include_images=true`, { method: 'GET', headers: getAuthHeaders(false) })
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
            ai_generated_answer: Boolean(it.ai_generated_answer),
            has_images: Boolean(it.has_images),
            stem_images: it.stem_images || [],
            analysis_images: it.analysis_images || [],
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

    const approveQuestion = async (qid: string) => {
      try {
        const question = (questions.value || []).find(q => q.qid === qid)
        if (!question) return
        const resp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: [{ id: qid, status: 'approved', explain: question.analysis || '' }] })
        })
        const data = await resp.json()
        if (data?.ok) { ElMessage.success('已通过'); loadQuestions() }
        else throw new Error(data?.msg || '操作失败')
      } catch (error: any) { ElMessage.error('操作失败：' + (error?.message || error)) }
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
        const resp = await fetch(`${MCQ_BASE_URL}/bank/deleted`, {
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
            isBjzxAdmin: isBjzxAdmin.value
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
        const r = await fetch(`${MCQ_BASE_URL}/bank/export_docx`)
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
        const fd = new FormData(); fd.append('file', f)
        const r = await fetch(`${MCQ_BASE_URL}/bank/import_docx`, { method:'POST', body: fd })
        const j = await r.json(); if (!j?.ok) throw new Error(j?.msg || '导入失败')
        // 显示更详细的导入结果
        const msg = j.msg || `导入成功：更新 ${j.updated||0} 题，新增 ${j.added||0} 题`
        ElMessage.success(msg)
        await loadQuestions()
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
      // 清理 markdown 符号，方便编辑
      editBuf.explain = cleanMarkdownForEdit(row.analysis || '')

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
    }

    const cancelEdit = () => {
      editingId.value = null
    }

    const saveRow = async (row: any) => {
      if (!isEditing(row.qid)) return
      try {
        // 1) 把当前编辑缓冲区打包发给后端（注意带上 answer 和图片）
        const itemData: any = {
          id: row.qid,
          stem: editBuf.stem,
          options: { ...editBuf.options },
          answer: (editBuf.answer || '').toUpperCase(),
          explain: editBuf.explain,
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
        } else {
          // 理论上不会走到这里，兜底用前端缓冲区
          row.stem = editBuf.stem
          row.options = normalizeOptions(editBuf.options)
          row.answer = (editBuf.answer || '').toString().toUpperCase()
          row.analysis = editBuf.explain
          row.status = (row.analysis && row.analysis.trim()) ? 'draft' : 'none'
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
        const newStatus = r0.answer_mismatch ? 'abnormal' : 'draft'
        const upResp = await fetch(`${MCQ_BASE_URL}/bank/bulk_update`, {
          method:'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ items: [{ id: row.qid, explain, status: newStatus }] })
        })
        const up = await upResp.json()
        if (!up?.ok) throw new Error(up?.msg || '写回失败')
        row.analysis = explain; row.status = newStatus
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
      const existingKeys = Object.keys(editBuf.options || {})
      if (existingKeys.length <= 1) {
        ElMessage.warning('至少需要保留1个选项')
        return
      }
      delete editBuf.options[key]
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
      
      let requestBody: any = { 
        name,
        score_config: {
          single: singleScore.value,
          multi: multiScore.value,
          indeterminate: indeterminateScore.value
        }
      }
      
      if (paperGenerateMode.value === 'random') {
        // 随机抽取模式
        requestBody.random_mode = {
          single_count: randomSingleCount.value,
          multi_count: randomMultiCount.value,
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

    const downloadPaper = (paperId: string) => {
      const url = `${MCQ_BASE_URL}/bank/paper_docx?paper_id=${encodeURIComponent(paperId)}`
      openInNewTab(url)
    }

    const deletePaper = async (paperId: string, title: string) => {
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

    // ========== 上传试卷相关函数 ==========

    // 计算有问题的题目数量
    const paperParseIssueCount = computed(() => {
      return uploadedPaperItems.value.filter(item => hasParseIssue(item)).length
    })

    // 判断题目是否有解析问题
    const hasParseIssue = (item: any): boolean => {
      if (!item.stem || item.stem.trim().length === 0) return true
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
        
        if (items.length === 0) {
          ElMessage.warning('未识别到任何题目，请检查文件格式')
          return
        }
        
        // 确保每个item的options是对象格式，保留qtype和图片数据
        uploadedPaperItems.value = items.map((x: any) => ({
          stem: x.stem || '',
          options: x.options || {},
          answer: (x.answer || '').toString().toUpperCase(),
          explain: x.explain_original || '',
          qtype: x.qtype || '',  // 保留题目类型（single/multi/indeterminate）
          // 图片数据
          stem_images: x.stem_images || [],
          option_images: x.option_images || {},
          analysis_images: x.analysis_images || [],
          has_images: Boolean(x.has_images || (x.stem_images && x.stem_images.length > 0) || 
                              (x.option_images && Object.keys(x.option_images).length > 0) ||
                              (x.analysis_images && x.analysis_images.length > 0)),
        }))
        
        // 从文件名提取标题
        const fileName = f.name.replace(/\.(docx|txt)$/i, '')
        uploadedPaperTitle.value = fileName
        
        editingPaperItemIdx.value = null
        paperPreviewVisible.value = true
        
        const issueCount = uploadedPaperItems.value.filter(item => hasParseIssue(item)).length
        if (issueCount > 0) {
          ElMessage.warning(`识别到 ${items.length} 道题目，其中 ${issueCount} 道可能存在问题，请检查`)
        } else {
          ElMessage.success(`成功识别 ${items.length} 道题目`)
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
        const r = await fetch(`${MCQ_BASE_URL}/bank/save_paper`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title: uploadedPaperTitle.value.trim(),
            items: validItems,
            score_config: {
              single: uploadedSingleScore.value,
              multi: uploadedMultiScore.value,
              indeterminate: uploadedIndeterminateScore.value
            }
          })
        })
        const j = await r.json()
        
        if (!j || j.ok === false) {
          throw new Error(j?.msg || '保存失败')
        }
        
        ElMessage.success(j.msg || '试卷保存成功')
        paperPreviewVisible.value = false
        uploadedPaperItems.value = []
        uploadedPaperTitle.value = ''
        
        // 刷新试卷列表
        await loadPaperList()
        
      } catch (e: any) {
        ElMessage.error(`保存失败：${e?.message || e}`)
      } finally {
        savingUploadedPaper.value = false
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
            description: publishForm.description
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

    const getExamStatusType = (status: string) => {
      const map: Record<string, string> = { pending: 'warning', active: 'success', ended: 'info', cancelled: 'danger' }
      return map[status] || 'info'
    }

    const getExamStatusText = (status: string) => {
      const map: Record<string, string> = { pending: '未开始', active: '进行中', ended: '已结束', cancelled: '已取消' }
      return map[status] || status
    }

    const normalizeRole = (role?: string) => (role || '').toLowerCase()

    const roleName = (role?: string) => {
      const key = normalizeRole(role)
      if (key === UserRole.SUPER_ADMIN) return RoleNames[UserRole.SUPER_ADMIN]
      if (key === UserRole.ADMIN) return RoleNames[UserRole.ADMIN]
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
      if (!keyword) return users.value
      return users.value.filter((user) => {
        const username = user.username?.toLowerCase() || ''
        const email = user.email?.toLowerCase() || ''
        return username.includes(keyword) || email.includes(keyword)
      })
    })

    const applyUserSearch = () => {
      userSearch.value = userSearch.value.trim()
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

    onMounted(() => {
      // 边检智学管理员相关数据
      if (showBjzxTabs.value) {
        loadQuestions()
        loadExportPapers()
        loadPaperList()  // 加载试卷管理列表
        loadPublishedExams()  // 加载已发布考试列表
        checkPendingTask()  // 检查是否有未完成的异步解析任务
      }
      // 管理员相关数据（用户管理等）
      if (showAdminTabs.value) {
        loadUsers()
        loadPendingUsers()
      }
    })

    return {
      username, roleText, activeTab, myOldPassword, myNewPassword, resetUsername, resetPassword,
      showAdminTabs, showBjzxTabs,
      changingPassword, resettingPassword, uploading, uploadMessage, generating, generateMessage, parseTargetStatuses,
      pendingUsers, loadingPending, approvalLoadingId, rejectLoadingId,
      changeMyPassword, resetUserPassword, handleFileChange, uploadQuestions, downloadTemplate,
      generateExplanations, loadQuestions, toggleAnalysis, approveQuestion, rejectQuestion, deleteQuestion, cancelEdit,saveRow,
      approveAll, createPaper, loadExportPapers, exportZip, exportDocx, exportXlsx, exportingXlsx, isEditing,editRow,
      loadUsers, filteredUsers, applyUserSearch, banUser, unbanUser, roleName, isRegularUser,onPickBankDocx,
      loadPendingUsers, approveUser, rejectUser, maskIdCard,uploadRef,exportingBank,importingBank,viewSources,
      bankImportRef,asyncExplaining,asyncMsg,llmOptions,llmModelId,topN,thinking,insertBlock,triggerPickBankDocx,
      rejectingAll,page,pageSize,rowRegenLoading,deletingQuestion,editingId,editBuf,counterMsg,explainBatchAsync,rejectAll,exportBankDocx,
      UserStatus, isBanned, getStatusTagType, getStatusText, Refresh,regenAndSave,pagedQuestions,optionKeys,editOptionKeys,addOption,removeOption,removeStemImage,removeOptionImage,removeAnalysisImage,triggerStemImageUpload,onStemImageSelected,triggerOptionImageUpload,onOptionImageSelected,triggerAnalysisImageUpload,onAnalysisImageSelected,
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
      restoringQuestion, permanentDeleting,
      loadDeletedQuestions, restoreQuestion, batchRestore,
      permanentDelete, batchPermanentDelete, clearRecycleBin,
      // 试卷生成相关
      questions, filteredQuestions, statusFilter, loadingQuestions, showingAnalysis, approvingAll,
      paperTitle, creatingPaper, paperMessage,
      singleScore, multiScore, indeterminateScore,
      paperQuestionFilter, paperQuestionSearch, selectedPaperQuestions, selectAllPaperQuestions,
      approvedQuestions, filteredPaperQuestions, toggleSelectAllPaperQuestions, isMultiChoice,
      paperList, loadingPaperList, deletingPaper, togglingVisibility, loadPaperList, downloadPaper, deletePaper, togglePaperVisibility,
      exportPapers, selectedExportPaper, selectedExportExam, onExportExamChange, loadingExportPapers, exportingZip, exportingDocx, exportMessage,
      userSearch, users, loadingUsers, actionLoadingId,
      // 试卷生成模式
      paperGenerateMode, randomSingleCount, randomMultiCount, randomIndeterminateSingleCount, randomIndeterminateMultiCount, randomIndeterminateCount,
      singleApprovedCount, multiApprovedCount,
      // 不定项配置
      enableIndeterminate, indeterminateMode, indeterminateSingleCount, indeterminateMultiCount, indeterminateTotalCount,
      selectedIndeterminateQuestions, toggleIndeterminate,
      // 上传试卷相关
      paperUploadRef, paperPreviewVisible, uploadedPaperTitle, uploadedPaperItems,
      editingPaperItemIdx, savingUploadedPaper, paperParseIssueCount,
      hasParseIssue, getOptionsCount, triggerPickPaperFile, onPickPaperFile,
      toggleEditPaperItem, deletePaperItem, saveUploadedPaper,
      deleteUploadedItemImage, triggerUploadItemImage,
      uploadedSingleScore, uploadedMultiScore, uploadedIndeterminateScore,
      // 考试发布相关
      publishForm, publishing, publishMessage, publishedExams, loadingPublished, cancelingExam, deletingExam,
      publishExam, loadPublishedExams, cancelExam, deleteExam, getExamStatusType, getExamStatusText, Bell, Plus,
      // 成绩统计相关
      gradesStats, loadingGradesStats, scoreDistribution, loadGradesStats
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
</style>