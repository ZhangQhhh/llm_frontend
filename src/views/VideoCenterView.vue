<template>
  <div class="resource-center-page">
    <div class="container">
      <!-- 头部 -->
      <header class="page-header">
        <h1>
          <el-icon class="header-icon"><FolderOpened /></el-icon>
          资料中心
        </h1>
        <p class="subtitle">{{ isAdmin ? '管理和分享各类资源' : '查看和下载各类资源' }}</p>
      </header>

      <!-- 页面标签切换 -->
      <el-tabs v-model="activeTab" class="main-tabs" type="border-card">
        <el-tab-pane label="资料管理" name="resources">

      <!-- 管理员上传区域 -->
      <el-card v-if="isAdmin" class="upload-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Upload /></el-icon>
            <span>上传资料</span>
          </div>
        </template>
        <el-form :model="uploadForm" label-width="80px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="文件类型">
                <el-radio-group v-model="uploadForm.fileType" @change="handleUploadTypeChange">
                  <el-radio-button value="video">
                    <el-icon><VideoCamera /></el-icon> 视频
                  </el-radio-button>
                  <el-radio-button value="pdf">
                    <el-icon><Document /></el-icon> PDF
                  </el-radio-button>
                  <el-radio-button value="ppt">
                    <el-icon><Tickets /></el-icon> PPT
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="选择文件">
                <el-upload
                  ref="uploadRef"
                  :auto-upload="false"
                  :limit="1"
                  :on-change="handleFileChange"
                  :on-remove="handleFileRemove"
                  :accept="acceptFileTypes"
                  drag
                  class="resource-upload"
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">
                    拖拽文件到这里，或 <em>点击选择</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      {{ uploadTipText }}
                    </div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="资料标题">
                <el-input v-model="uploadForm.title" placeholder="请输入资料标题" clearable />
              </el-form-item>
              <el-form-item label="资料描述">
                <el-input
                  v-model="uploadForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入资料描述（可选）"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="uploading"
                  :disabled="!selectedFile"
                  @click="handleUpload"
                  size="large"
                  class="upload-btn"
                >
                  <el-icon><Upload /></el-icon>
                  {{ uploading ? '上传中...' : '开始上传' }}
                </el-button>
              </el-form-item>
              <el-progress
                v-if="uploading"
                :percentage="uploadProgress"
                :status="uploadProgress === 100 ? 'success' : undefined"
                :stroke-width="10"
                style="margin-top: 10px"
              />
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 资料列表 -->
      <el-card class="resource-list-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-icon><Folder /></el-icon>
              <span>资料列表</span>
              <el-tag type="info" size="small" style="margin-left: 10px">
                共 {{ filteredResources.length }} 个资料
              </el-tag>
            </div>
            <div class="header-right">
              <el-input
                v-model="searchKeyword"
                placeholder="输入关键词搜索"
                clearable
                size="small"
                style="width: 220px; margin-right: 15px"
                :prefix-icon="Search"
              />
              <el-radio-group v-model="filterType" size="small" style="margin-right: 15px">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="video">
                  <el-icon><VideoCamera /></el-icon> 视频
                </el-radio-button>
                <el-radio-button value="pdf">
                  <el-icon><Document /></el-icon> PDF
                </el-radio-button>
                <el-radio-button value="ppt">
                  <el-icon><Tickets /></el-icon> PPT
                </el-radio-button>
              </el-radio-group>
              <el-button type="primary" :icon="Refresh" @click="loadResources" :loading="loading">
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <p>加载中...</p>
        </div>

        <el-empty v-else-if="filteredResources.length === 0" description="暂无资料" />

        <div v-else class="resource-grid">
          <el-card
            v-for="resource in paginatedResources"
            :key="resource.id"
            class="resource-item"
            shadow="hover"
            @click="openResource(resource)"
          >
            <div class="resource-thumbnail" :class="`type-${resource.file_type}`">
              <!-- 视频：真实缩略图 + 播放按钮 -->
              <template v-if="resource.file_type === 'video'">
                <img
                  v-if="!thumbFailedSet.has(resource.id)"
                  :src="getThumbUrl(resource)"
                  class="thumb-img"
                  @error="onThumbError(resource.id)"
                  loading="lazy"
                />
                <div class="video-play-overlay">
                  <div class="play-btn-circle">
                    <el-icon><VideoPlay /></el-icon>
                  </div>
                </div>
              </template>
              <!-- PDF：真实首页预览 + 文档样式回退 -->
              <template v-else-if="resource.file_type === 'pdf'">
                <img
                  v-if="!thumbFailedSet.has(resource.id)"
                  :src="getThumbUrl(resource)"
                  class="thumb-img"
                  @error="onThumbError(resource.id)"
                  loading="lazy"
                />
                <div v-if="thumbFailedSet.has(resource.id)" class="file-doc-preview">
                  <div class="doc-page">
                    <div class="doc-corner"></div>
                    <div class="doc-lines">
                      <div class="doc-line" style="width: 75%"></div>
                      <div class="doc-line" style="width: 92%"></div>
                      <div class="doc-line" style="width: 60%"></div>
                      <div class="doc-line" style="width: 85%"></div>
                      <div class="doc-line" style="width: 45%"></div>
                    </div>
                    <div class="doc-file-badge pdf-badge">PDF</div>
                  </div>
                </div>
              </template>
              <!-- PPT：真实首页预览 + 幻灯片样式回退 -->
              <template v-else-if="resource.file_type === 'ppt'">
                <img
                  v-if="!thumbFailedSet.has(resource.id)"
                  :src="getThumbUrl(resource)"
                  class="thumb-img"
                  @error="onThumbError(resource.id)"
                  loading="lazy"
                />
                <div v-if="thumbFailedSet.has(resource.id)" class="file-ppt-preview">
                  <div class="ppt-slide">
                    <div class="ppt-title-bar"></div>
                    <div class="ppt-body">
                      <div class="ppt-line" style="width: 70%"></div>
                      <div class="ppt-line" style="width: 55%"></div>
                      <div class="ppt-line" style="width: 80%"></div>
                    </div>
                    <div class="doc-file-badge ppt-badge">PPT</div>
                  </div>
                </div>
              </template>
              <!-- 其他文件 -->
              <template v-else>
                <el-icon class="type-icon"><Document /></el-icon>
              </template>
              <div class="resource-size">
                {{ formatFileSize(resource.size) }}
              </div>
              <div class="resource-type-badge">
                {{ getFileTypeLabel(resource.file_type) }}
              </div>
            </div>
            <div class="resource-info">
              <h3 class="resource-title" :title="resource.title">{{ resource.title }}</h3>
              <p class="resource-description" v-if="resource.description">{{ resource.description }}</p>
              <div class="resource-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ resource.uploader }}
                </span>
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(resource.upload_time) }}
                </span>
              </div>
              <div class="resource-actions" @click.stop>
                <el-button-group>
                  <el-button size="small" type="primary" @click="openResource(resource)">
                    <el-icon>
                      <VideoPlay v-if="resource.file_type === 'video'" />
                      <View v-else />
                    </el-icon>
                    {{ resource.file_type === 'video' ? '播放' : '预览' }}
                  </el-button>
                  <el-button size="small" @click="downloadResource(resource)">
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="warning"
                    @click="openEditDialog(resource)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="danger"
                    @click="confirmDelete(resource)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 分页 -->
        <div class="pagination-container" v-if="filteredResources.length > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36, 48]"
            :total="filteredResources.length"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </el-card>

        </el-tab-pane>

        <!-- 课程评分标签页 -->
        <el-tab-pane label="课程评分" name="rating">
          <!-- 搜索与筛选栏 -->
          <div class="course-toolbar">
            <div class="course-toolbar-left">
              <el-input
                v-model="courseSearchKeyword"
                placeholder="搜索课程名称 / 授课教员"
                clearable
                size="default"
                style="width: 260px"
                :prefix-icon="Search"
              />
              <el-radio-group v-model="courseRatedFilter" size="default">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="unrated">未评分</el-radio-button>
                <el-radio-button value="rated">已评分</el-radio-button>
              </el-radio-group>
              <el-tag type="info" size="small">
                共 {{ filteredCourses.length }} 个课程
              </el-tag>
            </div>
            <div class="course-toolbar-right">
              <el-button :icon="Refresh" @click="loadCourses" :loading="coursesLoading">刷新</el-button>
              <el-button v-if="isAdmin" type="primary" @click="showCreateCourseDialog">
                <el-icon><Star /></el-icon>
                创建评分课程
              </el-button>
            </div>
          </div>

          <!-- 课程列表 -->
          <div v-if="coursesLoading" class="loading-container" style="padding: 40px">
            <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            <p>加载中...</p>
          </div>

          <el-empty v-else-if="filteredCourses.length === 0" :description="courseList.length === 0 ? '暂无评分课程' : '没有匹配的课程'" />

          <div v-else class="course-list">
            <el-card
              v-for="course in paginatedCourses"
              :key="course.id"
              class="course-item"
              shadow="hover"
            >
              <div class="course-header">
                <div class="course-name-wrap">
                  <h3 class="course-name">{{ course.name }}</h3>
                  <el-tag v-if="course.my_rated" type="success" size="small" style="margin-left: 8px">已评分</el-tag>
                  <el-tag v-else type="info" size="small" style="margin-left: 8px">未评分</el-tag>
                </div>
                <div class="course-actions">
                  <el-button size="small" type="success" @click="openCourseRatingDialog(course)">
                    <el-icon><Star /></el-icon>
                    {{ course.my_rated ? '修改评分' : '评分' }}
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="primary"
                    @click="openCourseSummary(course)"
                  >
                    <el-icon><DataAnalysis /></el-icon>
                    汇总
                  </el-button>
                  <el-button
                    v-if="isAdmin"
                    size="small"
                    type="warning"
                    @click="openEditCourseDialog(course)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-popconfirm
                    v-if="isAdmin"
                    title="确定删除该课程及所有评分数据？"
                    @confirm="deleteCourse(course.id)"
                  >
                    <template #reference>
                      <el-button size="small" type="danger">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
              <div class="course-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  授课教员：{{ course.instructor }}
                </span>
                <span class="meta-item" v-if="course.training_time">
                  <el-icon><Clock /></el-icon>
                  培训时间：{{ course.training_time }}
                </span>
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  创建时间：{{ formatDate(course.created_at) }}
                </span>
              </div>
            </el-card>

            <!-- 分页 -->
            <div class="course-pagination" v-if="filteredCourses.length > coursePageSize">
              <el-pagination
                v-model:current-page="courseCurrentPage"
                v-model:page-size="coursePageSize"
                :page-sizes="[10, 20, 50]"
                :total="filteredCourses.length"
                layout="total, sizes, prev, pager, next"
                small
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 视频播放对话框 -->
    <el-dialog
      v-model="playerDialogVisible"
      :title="currentResource?.title || '视频播放'"
      width="80%"
      :before-close="handlePlayerClose"
      destroy-on-close
      class="video-player-dialog"
    >
      <div class="video-player-container">
        <div v-if="videoLoading" class="video-loading-overlay">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <template v-if="transcodePollingTimer">
            <p style="margin-top: 16px; font-size: 14px;">视频转码中...</p>
            <el-progress
              :percentage="transcodeProgress"
              :stroke-width="10"
              style="width: 300px; margin-top: 12px;"
              :format="(p: number) => p.toFixed(1) + '%'"
            />
            <p v-if="transcodeEta" style="margin-top: 8px; font-size: 12px; color: #999;">
              {{ transcodeEta }}
              <span v-if="transcodeSpeed"> · 速度 {{ transcodeSpeed }}</span>
            </p>
          </template>
          <p v-else style="margin-top: 16px; font-size: 14px;">视频加载中，请耐心等待...</p>
        </div>
        <video
          v-if="!transcodePollingTimer && currentResourceUrl"
          v-show="!videoLoading"
          ref="videoPlayer"
          :src="currentResourceUrl"
          controls
          autoplay
          class="video-player"
          @canplay="handleVideoCanPlay"
          @error="handleVideoError"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="downloadResource(currentResource!)" :disabled="!currentResource">
            <el-icon><Download /></el-icon>
            下载视频
          </el-button>
          <el-button type="primary" @click="playerDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- PDF预览对话框 -->
    <el-dialog
      v-model="pdfDialogVisible"
      :title="currentResource?.title || 'PDF预览'"
      width="85%"
      :before-close="handlePdfClose"
      destroy-on-close
      class="pdf-viewer-dialog"
    >
      <div class="pdf-viewer-container">
        <iframe
          :src="currentResourceUrl"
          class="pdf-viewer"
          frameborder="0"
        ></iframe>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="downloadResource(currentResource!)" :disabled="!currentResource">
            <el-icon><Download /></el-icon>
            下载PDF
          </el-button>
          <el-button type="primary" @click="pdfDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- PPT预览对话框 -->
    <el-dialog
      v-model="pptDialogVisible"
      :title="currentResource?.title || 'PPT预览'"
      width="85%"
      :before-close="handlePptClose"
      destroy-on-close
      class="pdf-viewer-dialog"
    >
      <div class="pdf-viewer-container">
        <div v-if="pptLoading" class="ppt-loading">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <p>正在转换PPT，请稍候...</p>
        </div>
        <iframe
          v-show="!pptLoading"
          :src="currentResourceUrl"
          class="pdf-viewer"
          frameborder="0"
          @load="handlePptLoad"
        ></iframe>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="downloadResource(currentResource!)" :disabled="!currentResource">
            <el-icon><Download /></el-icon>
            下载PPT
          </el-button>
          <el-button type="primary" @click="pptDialogVisible = false">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="资料标题">
          <el-input v-model="editForm.title" placeholder="请输入资料标题" />
        </el-form-item>
        <el-form-item label="资料描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入资料描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveVideoInfo">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑课程对话框 -->
    <el-dialog
      v-model="courseDialogVisible"
      :title="editingCourse ? '编辑课程' : '创建评分课程'"
      width="850px"
      destroy-on-close
    >
      <el-form :model="courseForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="课程名称" required>
              <el-input v-model="courseForm.name" placeholder="请输入课程名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="授课教员" required>
              <el-input v-model="courseForm.instructor" placeholder="请输入授课教员姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="培训时间">
              <el-input v-model="courseForm.training_time" placeholder="如：2025年3月1日" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 评分维度编辑 -->
      <div class="dim-edit-section">
        <div class="dim-edit-header">
          <h4 style="margin: 0">评分维度设置</h4>
          <el-button size="small" type="primary" @click="addDimensionRow">
            <el-icon><Plus /></el-icon> 添加项目
          </el-button>
        </div>
        <el-table :data="courseForm.dimensions" border size="small" style="width: 100%">
          <el-table-column label="评分项目" min-width="120">
            <template #default="scope">
              <el-input v-model="scope.row.label" placeholder="如：教学理念" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="评分标准" min-width="260">
            <template #default="scope">
              <el-input
                v-model="scope.row.description"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 3 }"
                placeholder="评分标准说明"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="分值" width="100" align="center">
            <template #default="scope">
              <el-input-number
                v-model="scope.row.max_score"
                :min="1"
                :max="100"
                :step="5"
                size="small"
                controls-position="right"
                style="width: 80px"
              />
            </template>
          </el-table-column>
          <el-table-column label="" width="50" align="center">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                circle
                :disabled="courseForm.dimensions.length <= 1"
                @click="removeDimensionRow(scope.$index)"
              />
            </template>
          </el-table-column>
        </el-table>
        <div class="dim-edit-total">
          总分值：<strong>{{ dimensionsTotalScore }}分</strong>
        </div>
      </div>

      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="courseSaving" @click="saveCourse">
          {{ editingCourse ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 课程评分对话框 -->
    <el-dialog
      v-model="ratingDialogVisible"
      :title="'课程评分 - ' + (ratingCourse?.name || '')"
      width="750px"
      destroy-on-close
      class="rating-dialog"
    >
      <div class="rating-form-container">
        <!-- 课程信息 -->
        <div class="rating-course-info" v-if="ratingCourse">
          <span><strong>课程名称：</strong>{{ ratingCourse.name }}</span>
          <span><strong>授课教员：</strong>{{ ratingCourse.instructor }}</span>
          <span v-if="ratingCourse.training_time"><strong>培训时间：</strong>{{ ratingCourse.training_time }}</span>
        </div>
        <el-alert
          v-if="myExistingRating"
          title="您已提交过评分，再次提交将覆盖之前的评分"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />
        <div class="rating-table">
          <div class="rating-table-header">
            <div class="rating-col-dim">评分项目</div>
            <div class="rating-col-desc">评分标准</div>
            <div class="rating-col-max">分值</div>
            <div class="rating-col-score">得分</div>
          </div>
          <div
            v-for="dim in activeDimensions"
            :key="dim.key"
            class="rating-table-row"
          >
            <div class="rating-col-dim">
              <span class="dim-label">{{ dim.label }}</span>
            </div>
            <div class="rating-col-desc">{{ dim.description }}</div>
            <div class="rating-col-max">{{ dim.max_score }}分</div>
            <div class="rating-col-score">
              <el-input-number
                v-model="ratingForm.scores[dim.key]"
                :min="0"
                :max="dim.max_score"
                :step="1"
                size="small"
                controls-position="right"
                style="width: 110px"
              />
            </div>
          </div>
          <div class="rating-table-footer">
            <div class="rating-col-dim"><strong>合计总分</strong></div>
            <div class="rating-col-desc"></div>
            <div class="rating-col-max"><strong>{{ activeDimensions.reduce((s, d) => s + d.max_score, 0) }}分</strong></div>
            <div class="rating-col-score">
              <el-tag :type="ratingTotal >= 80 ? 'success' : ratingTotal >= 60 ? 'warning' : 'danger'" size="large">
                <strong>{{ ratingTotal }}分</strong>
              </el-tag>
            </div>
          </div>
        </div>
        <el-form-item label="评语（可选）" style="margin-top: 16px" label-width="100px">
          <el-input
            v-model="ratingForm.comment"
            type="textarea"
            :rows="2"
            placeholder="请输入对该课程的评语（可选）"
          />
        </el-form-item>
      </div>
      <template #footer>
        <el-button @click="ratingDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ratingSubmitting" @click="submitRating">
          {{ myExistingRating ? '更新评分' : '提交评分' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 管理员评分汇总对话框 -->
    <el-dialog
      v-model="ratingSummaryVisible"
      :title="'评分汇总 - ' + (summaryCourse?.name || '')"
      width="950px"
      destroy-on-close
      class="rating-summary-dialog"
    >
      <div v-if="summaryLoading" class="loading-container" style="padding: 40px">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
      <div v-else-if="ratingSummaryData" class="summary-container">
        <!-- 课程信息 -->
        <div class="rating-course-info" v-if="ratingSummaryData.course">
          <span><strong>课程名称：</strong>{{ ratingSummaryData.course.name }}</span>
          <span><strong>授课教员：</strong>{{ ratingSummaryData.course.instructor }}</span>
          <span v-if="ratingSummaryData.course.training_time"><strong>培训时间：</strong>{{ ratingSummaryData.course.training_time }}</span>
        </div>
        <!-- 概览卡片 -->
        <div class="summary-overview">
          <div class="overview-item overview-total">
            <div class="overview-value">{{ ratingSummaryData.average_total }}</div>
            <div class="overview-label">平均总分</div>
          </div>
          <div class="overview-item overview-count">
            <div class="overview-value">{{ ratingSummaryData.total_count }}</div>
            <div class="overview-label">评分人数</div>
          </div>
          <div
            v-for="dim in summaryDimensions"
            :key="dim.key"
            class="overview-item"
          >
            <div class="overview-value">{{ ratingSummaryData.dimension_averages[dim.key] || 0 }}</div>
            <div class="overview-label">{{ dim.label }}均分</div>
          </div>
        </div>

        <!-- 搜索栏 -->
        <div class="summary-search-bar">
          <el-input
            v-model="summarySearchKeyword"
            placeholder="搜索评分人"
            clearable
            size="small"
            style="width: 220px"
            :prefix-icon="Search"
          />
          <el-tag type="info" size="small">
            {{ filteredSummaryDetail.length }} / {{ ratingSummaryData.ratings_detail?.length || 0 }} 条记录
          </el-tag>
        </div>

        <!-- 评分详情表格 -->
        <el-table
          v-if="filteredSummaryDetail.length > 0"
          :data="paginatedSummaryDetail"
          stripe
          border
          style="width: 100%; margin-top: 12px"
          max-height="400"
        >
          <el-table-column prop="username" label="评分人" width="100" fixed />
          <el-table-column
            v-for="dim in summaryDimensions"
            :key="dim.key"
            :label="dim.label"
            width="90"
            align="center"
          >
            <template #default="scope">
              {{ scope.row.scores?.[dim.key] ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="total_score" label="总分" width="80" align="center">
            <template #default="scope">
              <el-tag
                :type="scope.row.total_score >= 80 ? 'success' : scope.row.total_score >= 60 ? 'warning' : 'danger'"
                size="small"
              >
                {{ scope.row.total_score }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="评语" min-width="120" show-overflow-tooltip />
          <el-table-column prop="rated_at" label="评分时间" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.rated_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" align="center" fixed="right">
            <template #default="scope">
              <el-popconfirm
                :title="'确定删除 ' + scope.row.username + ' 的评分？'"
                @confirm="deleteUserRating(scope.row.username)"
              >
                <template #reference>
                  <el-button type="danger" size="small" :icon="Delete" circle />
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="summary-pagination" v-if="filteredSummaryDetail.length > summaryPageSize">
          <el-pagination
            v-model:current-page="summaryCurrentPage"
            v-model:page-size="summaryPageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredSummaryDetail.length"
            layout="total, sizes, prev, pager, next"
            small
          />
        </div>

        <el-empty v-if="ratingSummaryData.ratings_detail && ratingSummaryData.ratings_detail.length > 0 && filteredSummaryDetail.length === 0" description="没有匹配的评分人" />
        <el-empty v-else-if="!ratingSummaryData.ratings_detail || ratingSummaryData.ratings_detail.length === 0" description="暂无评分数据" />
      </div>
      <template #footer>
        <el-button type="primary" @click="ratingSummaryVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoCamera,
  Upload,
  UploadFilled,
  Refresh,
  VideoPlay,
  Download,
  Edit,
  Delete,
  User,
  Clock,
  Loading,
  FolderOpened,
  Folder,
  Document,
  Tickets,
  View,
  Search,
  Star,
  DataAnalysis,
  Plus
} from '@element-plus/icons-vue'
import llmHttp from '@/config/api/llmHttp'

// Store
const store = useStore()

// 权限判断
const isAdmin = computed(() => store.getters.isAdmin)

// 标签页
const activeTab = ref('resources')

// 资料列表
const resources = ref<any[]>([])
const loading = ref(false)
const filterType = ref('all')  // 筛选类型: all, video, pdf, ppt
const searchKeyword = ref('')  // 搜索关键词
const currentPage = ref(1)  // 当前页码
const pageSize = ref(12)  // 每页显示数量

// 计算属性 - 筛选后的资料列表
const filteredResources = computed(() => {
  let result = resources.value
  
  // 按文件类型筛选
  if (filterType.value !== 'all') {
    result = result.filter(r => r.file_type === filterType.value)
  }
  
  // 按关键词搜索（上传人、描述、文件名/标题）
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (keyword) {
    result = result.filter(r => {
      const uploader = (r.uploader || '').toLowerCase()
      const description = (r.description || '').toLowerCase()
      const title = (r.title || '').toLowerCase()
      const filename = (r.original_filename || r.filename || '').toLowerCase()
      return uploader.includes(keyword) || description.includes(keyword) || title.includes(keyword) || filename.includes(keyword)
    })
  }
  
  return result
})

// 计算属性 - 分页后的资料列表
const paginatedResources = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredResources.value.slice(start, end)
})

// 监听筛选条件变化，重置页码
watch([filterType, searchKeyword], () => {
  currentPage.value = 1
})

// 分页变化处理
function handlePageChange(page: number) {
  currentPage.value = page
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

// 上传相关
const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadForm = ref({
  title: '',
  description: '',
  fileType: 'video' as 'video' | 'pdf' | 'ppt'
})

// 计算属性 - 根据文件类型返回接受的文件格式
const acceptFileTypes = computed(() => {
  switch (uploadForm.value.fileType) {
    case 'video':
      return '.mp4,.avi,.mov,.mkv,.wmv,.flv,.webm,.m4v'
    case 'pdf':
      return '.pdf'
    case 'ppt':
      return '.ppt,.pptx'
    default:
      return '*'
  }
})

// 计算属性 - 上传提示文本
const uploadTipText = computed(() => {
  switch (uploadForm.value.fileType) {
    case 'video':
      return '支持 mp4、avi、mov、mkv 等格式，最大 10000MB'
    case 'pdf':
      return '支持 PDF 格式，最大 1000MB'
    case 'ppt':
      return '支持 ppt、pptx 格式，最大 1000MB'
    default:
      return '请选择文件'
  }
})

// 播放器/预览器相关
const playerDialogVisible = ref(false)
const pdfDialogVisible = ref(false)
const pptDialogVisible = ref(false)
const pptLoading = ref(false)
const videoLoading = ref(false)
const transcodeProgress = ref(0)
const transcodeEta = ref('')
const transcodeSpeed = ref('')
const transcodePollingTimer = ref<any>(null)
const currentResource = ref<any>(null)
const currentResourceUrl = ref('')
const videoPlayer = ref<HTMLVideoElement | null>(null)
const isClosingPlayer = ref(false)  // 标记是否正在关闭播放器

// 编辑相关
const editDialogVisible = ref(false)
const editForm = ref({
  id: '',
  title: '',
  description: ''
})
const saving = ref(false)

// 加载资料列表
async function loadResources() {
  loading.value = true
  try {
    const response = await llmHttp.get('/resources/list')
    if (response.data.ok) {
      resources.value = response.data.data.resources || []
    } else {
      ElMessage.error(response.data.message || '加载资料列表失败')
    }
  } catch (error: any) {
    console.error('加载资料列表失败:', error)
    ElMessage.error('加载资料列表失败')
  } finally {
    loading.value = false
  }
}

// 获取文件类型标签
function getFileTypeLabel(fileType: string): string {
  switch (fileType) {
    case 'video': return '视频'
    case 'pdf': return 'PDF'
    case 'ppt': return 'PPT'
    default: return '文件'
  }
}

// 获取视频缩略图URL
function getThumbUrl(resource: any): string {
  const baseUrl = process.env.VUE_APP_LLM_BASE_URL || ''
  const token = localStorage.getItem('multi_turn_chat_jwt') || localStorage.getItem('jwt_token')
  return `${baseUrl}/resources/${resource.id}/thumbnail?token=${token}`
}

// 缩略图加载失败记录（避免翻页后重复请求已失败的缩略图）
const thumbFailedSet = reactive(new Set<string>())

function onThumbError(resourceId: string) {
  thumbFailedSet.add(resourceId)
}

// 切换上传文件类型时清空已选文件
function handleUploadTypeChange() {
  selectedFile.value = null
  uploadRef.value?.clearFiles()
}

// 文件选择处理
function handleFileChange(file: any) {
  selectedFile.value = file.raw
  if (!uploadForm.value.title) {
    // 自动填充文件名作为标题
    const name = file.name.replace(/\.[^/.]+$/, '')
    uploadForm.value.title = name
  }
}

function handleFileRemove() {
  selectedFile.value = null
}

// 上传资料
async function handleUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('title', uploadForm.value.title || selectedFile.value.name)
  formData.append('description', uploadForm.value.description || '')
  formData.append('file_type', uploadForm.value.fileType)

  try {
    const response = await llmHttp.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 1800000, // 30分钟超时，支持大文件上传
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    if (response.data.ok) {
      ElMessage.success('资料上传成功')
      // 重置表单
      uploadForm.value = { title: '', description: '', fileType: uploadForm.value.fileType }
      selectedFile.value = null
      uploadRef.value?.clearFiles()
      // 刷新列表
      await loadResources()
    } else {
      ElMessage.error(response.data.message || '上传失败')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error(error.response?.data?.message || '上传失败')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 打开资料预览
function openResource(resource: any) {
  currentResource.value = resource
  const token = localStorage.getItem('multi_turn_chat_jwt') || localStorage.getItem('jwt_token')
  const baseUrl = process.env.VUE_APP_LLM_BASE_URL || ''
  
  if (resource.file_type === 'video') {
    // 视频播放：先查询真实转码状态再决定
    videoLoading.value = true
    transcodeProgress.value = 0
    transcodeEta.value = ''
    transcodeSpeed.value = ''
    currentResourceUrl.value = ''
    playerDialogVisible.value = true
    
    // 异步查询后端真实状态
    fetch(`${baseUrl}/resources/${resource.id}/transcode-progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      console.log('[transcode] openResource progress check:', data)
      if (data.ok && data.data) {
        const { status } = data.data
        if (status === 'converting' || status === 'pending') {
          // 需要转码，启动进度轮询
          console.log('[transcode] openResource → needs transcode, starting poll')
          startTranscodePolling(resource.id)
          return
        }
        if (status === 'failed') {
          videoLoading.value = false
          ElMessage.error('视频转码失败，请下载后使用本地播放器观看')
          return
        }
      }
      // done / not_needed / 其他：直接加载视频流
      console.log('[transcode] openResource → loading stream directly')
      currentResourceUrl.value = `${baseUrl}/resources/${resource.id}/stream?token=${token}`
    }).catch(() => {
      // 查询失败，直接尝试加载流
      console.warn('[transcode] openResource progress check failed, trying stream')
      currentResourceUrl.value = `${baseUrl}/resources/${resource.id}/stream?token=${token}`
    })
  } else if (resource.file_type === 'pdf') {
    // PDF预览
    currentResourceUrl.value = `${baseUrl}/resources/${resource.id}/preview?token=${token}`
    pdfDialogVisible.value = true
  } else if (resource.file_type === 'ppt') {
    // PPT预览（后端转换为PDF）
    pptLoading.value = true
    currentResourceUrl.value = `${baseUrl}/resources/${resource.id}/preview?token=${token}`
    pptDialogVisible.value = true
    // 加载完成后关闭loading状态（通过iframe的onload事件）
  }
}

// 关闭视频播放器
function handlePlayerClose(done: () => void) {
  isClosingPlayer.value = true
  stopTranscodePolling()
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.src = ''
  }
  currentResourceUrl.value = ''
  currentResource.value = null
  videoLoading.value = false
  transcodeProgress.value = 0
  transcodeEta.value = ''
  transcodeSpeed.value = ''
  done()
  setTimeout(() => {
    isClosingPlayer.value = false
  }, 100)
}

// 关闭PDF预览器
function handlePdfClose(done: () => void) {
  currentResourceUrl.value = ''
  currentResource.value = null
  done()
}

// 关闭PPT预览器
function handlePptClose(done: () => void) {
  currentResourceUrl.value = ''
  currentResource.value = null
  pptLoading.value = false
  done()
}

// PPT预览加载完成
function handlePptLoad() {
  pptLoading.value = false
}

// 浏览器原生支持的视频格式（扩展名）
const BROWSER_PLAYABLE_EXTS = ['mp4', 'webm', 'ogg', 'ogv', 'm4v']

// 视频可以播放时隐藏loading
function handleVideoCanPlay() {
  // 轮询进行中时不允许关闭 loading
  if (transcodePollingTimer.value) {
    console.log('[transcode] handleVideoCanPlay ignored - polling active')
    return
  }
  console.log('[transcode] handleVideoCanPlay - hiding loading')
  videoLoading.value = false
}

// 视频播放错误处理
async function handleVideoError() {
  console.log('[transcode] handleVideoError fired', {
    isClosing: isClosingPlayer.value,
    polling: !!transcodePollingTimer.value,
    url: !!currentResourceUrl.value
  })
  if (isClosingPlayer.value) {
    videoLoading.value = false
    return
  }
  // 正在轮询转码进度中，或没有设置URL，忽略错误
  if (transcodePollingTimer.value || !currentResourceUrl.value) {
    return
  }
  const resource = currentResource.value
  if (!resource) {
    videoLoading.value = false
    ElMessage.error('视频加载失败，请稍后重试')
    return
  }
  
  // 清除当前URL，防止video元素重复触发error
  currentResourceUrl.value = ''
  
  // 通过API查询真实转码状态（比本地meta更准确）
  try {
    const token = localStorage.getItem('multi_turn_chat_jwt') || localStorage.getItem('jwt_token')
    const baseUrl = process.env.VUE_APP_LLM_BASE_URL || ''
    const res = await fetch(`${baseUrl}/resources/${resource.id}/transcode-progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    console.log('[transcode] handleVideoError progress response:', data)
    if (data.ok && data.data) {
      const { status } = data.data
      if (status === 'converting' || status === 'pending') {
        // 正在转码中，启动轮询显示进度
        console.log('[transcode] starting polling - status:', status)
        videoLoading.value = true
        startTranscodePolling(resource.id)
        return
      }
      if (status === 'done' || status === 'not_needed') {
        // 转码已完成但视频仍加载失败，可能是其他问题
        videoLoading.value = false
        ElMessage.error('视频加载失败，请稍后重试')
        return
      }
      if (status === 'failed') {
        videoLoading.value = false
        ElMessage.error('视频转码失败，请下载后使用本地播放器观看')
        return
      }
    }
  } catch (e) {
    console.warn('[transcode] handleVideoError progress fetch failed:', e)
    // 查询失败，用扩展名兆底判断
  }
  
  // API查询失败时的兜底：检查扩展名
  const filename = (resource.original_filename || resource.filename || '').toLowerCase()
  const ext = filename.split('.').pop() || ''
  if (!BROWSER_PLAYABLE_EXTS.includes(ext)) {
    // 非浏览器兼容格式，可能需要转码，启动轮询
    videoLoading.value = true
    startTranscodePolling(resource.id)
    return
  }
  
  videoLoading.value = false
  ElMessage.error('视频加载失败，请稍后重试')
}

// 启动转码进度轮询
function startTranscodePolling(resourceId: string) {
  stopTranscodePolling()
  const token = localStorage.getItem('multi_turn_chat_jwt') || localStorage.getItem('jwt_token')
  const baseUrl = process.env.VUE_APP_LLM_BASE_URL || ''
  
  const poll = async () => {
    try {
      const res = await fetch(`${baseUrl}/resources/${resourceId}/transcode-progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      console.log('[transcode] poll response:', data)
      if (data.ok && data.data) {
        const { percent, speed, eta, status } = data.data
        transcodeProgress.value = percent
        transcodeEta.value = eta
        transcodeSpeed.value = speed
        // 确保轮询期间 loading 一直显示
        videoLoading.value = true
        
        if (status === 'done' || status === 'not_needed') {
          // 转码完成，加载视频
          stopTranscodePolling()
          transcodeProgress.value = 100
          // 刷新列表中该资料的转码状态
          const resource = currentResource.value
          if (resource) {
            resource.transcode_status = 'done'
          }
          // 短暂延迟后设置URL，确保UI状态已更新
          setTimeout(() => {
            const res = currentResource.value
            if (res && playerDialogVisible.value) {
              videoLoading.value = true
              currentResourceUrl.value = `${baseUrl}/resources/${res.id}/stream?token=${token}`
            }
          }, 500)
          return
        }
        if (status === 'failed') {
          stopTranscodePolling()
          videoLoading.value = false
          ElMessage.error('视频转码失败，请下载后使用本地播放器观看')
          return
        }
      }
    } catch (e) {
      // 轮询失败，静默处理
    }
  }
  
  poll()  // 立即执行一次
  transcodePollingTimer.value = setInterval(poll, 2000)  // 每2秒轮询
}

// 停止转码进度轮询
function stopTranscodePolling() {
  if (transcodePollingTimer.value) {
    clearInterval(transcodePollingTimer.value)
    transcodePollingTimer.value = null
  }
}

// 下载资料（使用直接URL下载，避免blob内存加载延迟）
function downloadResource(resource: any) {
  if (!resource) return
  
  const token = localStorage.getItem('multi_turn_chat_jwt') || localStorage.getItem('jwt_token')
  const baseUrl = process.env.VUE_APP_LLM_BASE_URL || ''
  const downloadUrl = `${baseUrl}/resources/${resource.id}/download?token=${token}`
  
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = resource.original_filename || resource.filename || resource.title
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('下载已开始')
}

// 打开编辑对话框
function openEditDialog(video: any) {
  editForm.value = {
    id: video.id,
    title: video.title,
    description: video.description || ''
  }
  editDialogVisible.value = true
}

// 保存资料信息
async function saveVideoInfo() {
  if (!editForm.value.title.trim()) {
    ElMessage.warning('请输入资料标题')
    return
  }

  saving.value = true
  try {
    const response = await llmHttp.post(`/resources/${editForm.value.id}/update`, {
      title: editForm.value.title,
      description: editForm.value.description
    })

    if (response.data.ok) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      await loadResources()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 确认删除
async function confirmDelete(resource: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除资料「${resource.title}」吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await llmHttp.post(`/resources/${resource.id}/delete`)
    
    if (response.data.ok) {
      ElMessage.success('删除成功')
      await loadResources()
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ==================== 精品课程评分功能（独立评价体系） ====================

// 评分维度定义（与后端保持一致，参照合肥边检站评分表）
const ratingDimensions = ref([
  { key: 'concept',    label: '教学理念', description: '教学突出实战、实用、实效，聚焦新形势、新任务、新要求，符合时代性、把握规律性、富有创造性。', max_score: 10 },
  { key: 'content',    label: '教学内容', description: '教学重难点处理恰当，剖析问题深入，数据案例翔实，内容逻辑严密，层次清晰，有理有据，有观点有方法，能达到传道授业解惑的效果。', max_score: 30 },
  { key: 'effect',     label: '教学效果', description: '参训人员注意力集中，能理解并反馈所学内容。', max_score: 30 },
  { key: 'courseware',  label: '课件讲义', description: '课件讲义规范详细，包含完整的教学目标、依据、方法、学时安排和讲授的主体内容，可作为同类课程教学参考。', max_score: 10 },
  { key: 'method',     label: '教学方法', description: '教学过程安排合理，教学方法运用恰当，教学组织有序；教学模式具有特色，课堂吸引力强，启发培训对象主动思考。', max_score: 10 },
  { key: 'quality',    label: '教官素养', description: '主讲教官姿态端正，语言规范、生动准确、感染力强；课件简洁大方、布局合理，特点突出、详略得当，讲解与课件内容适配。', max_score: 10 },
])

const defaultScores = (dims: any[]) => {
  const scores: Record<string, number> = {}
  for (const dim of dims) {
    scores[dim.key] = 0
  }
  return scores
}

// 课程列表
const courseList = ref<any[]>([])
const coursesLoading = ref(false)
const courseSearchKeyword = ref('')
const courseRatedFilter = ref('all')  // all / rated / unrated

// 课程分页
const courseCurrentPage = ref(1)
const coursePageSize = ref(10)

// 课程列表筛选
const filteredCourses = computed(() => {
  let result = courseList.value
  // 搜索关键词（课程名称或授课教员）
  const kw = courseSearchKeyword.value.trim().toLowerCase()
  if (kw) {
    result = result.filter((c: any) =>
      (c.name || '').toLowerCase().includes(kw) ||
      (c.instructor || '').toLowerCase().includes(kw)
    )
  }
  // 已评分/未评分筛选
  if (courseRatedFilter.value === 'rated') {
    result = result.filter((c: any) => c.my_rated)
  } else if (courseRatedFilter.value === 'unrated') {
    result = result.filter((c: any) => !c.my_rated)
  }
  return result
})

const paginatedCourses = computed(() => {
  const start = (courseCurrentPage.value - 1) * coursePageSize.value
  return filteredCourses.value.slice(start, start + coursePageSize.value)
})

// 搜索或筛选变化时重置课程分页
watch([courseSearchKeyword, courseRatedFilter], () => {
  courseCurrentPage.value = 1
})

// 课程创建/编辑对话框
const courseDialogVisible = ref(false)
const editingCourse = ref<any>(null)
const courseSaving = ref(false)
const courseForm = ref<{ name: string; instructor: string; training_time: string; dimensions: any[] }>({
  name: '',
  instructor: '',
  training_time: '',
  dimensions: JSON.parse(JSON.stringify(ratingDimensions.value))
})

// 维度编辑：总分计算
const dimensionsTotalScore = computed(() => {
  return courseForm.value.dimensions.reduce((sum: number, d: any) => sum + (d.max_score || 0), 0)
})

// 添加维度行
function addDimensionRow() {
  const idx = courseForm.value.dimensions.length + 1
  courseForm.value.dimensions.push({
    key: `dim_${idx}_${Date.now()}`,
    label: '',
    description: '',
    max_score: 10
  })
}

// 删除维度行
function removeDimensionRow(index: number) {
  courseForm.value.dimensions.splice(index, 1)
}

// 评分对话框
const ratingDialogVisible = ref(false)
const ratingCourse = ref<any>(null)
const ratingSubmitting = ref(false)
const myExistingRating = ref<any>(null)
const ratingForm = ref<{ scores: Record<string, number>; comment: string }>({
  scores: {},
  comment: ''
})

// 当前评分使用的维度（来自课程自定义）
const activeDimensions = ref<any[]>(ratingDimensions.value)

// 评分合计
const ratingTotal = computed(() => {
  return Object.values(ratingForm.value.scores).reduce((sum, v) => sum + (v || 0), 0)
})

// 评分汇总对话框（管理员）
const ratingSummaryVisible = ref(false)
const summaryCourse = ref<any>(null)
const summaryLoading = ref(false)
const ratingSummaryData = ref<any>(null)

// 汇总对话框使用的维度（来自课程自定义）
const summaryDimensions = computed(() => {
  if (summaryCourse.value?.dimensions) return summaryCourse.value.dimensions
  if (ratingSummaryData.value?.course?.dimensions) return ratingSummaryData.value.course.dimensions
  return ratingDimensions.value
})

// 汇总对话框搜索与分页
const summarySearchKeyword = ref('')
const summaryCurrentPage = ref(1)
const summaryPageSize = ref(10)

const filteredSummaryDetail = computed(() => {
  const detail = ratingSummaryData.value?.ratings_detail || []
  const kw = summarySearchKeyword.value.trim().toLowerCase()
  if (!kw) return detail
  return detail.filter((r: any) =>
    (r.username || '').toLowerCase().includes(kw)
  )
})

const paginatedSummaryDetail = computed(() => {
  const start = (summaryCurrentPage.value - 1) * summaryPageSize.value
  return filteredSummaryDetail.value.slice(start, start + summaryPageSize.value)
})

// 搜索变化时重置分页
watch(summarySearchKeyword, () => {
  summaryCurrentPage.value = 1
})

// 加载课程列表
async function loadCourses() {
  coursesLoading.value = true
  try {
    const response = await llmHttp.get('/courses')
    if (response.data.ok) {
      courseList.value = response.data.data || []
    }
  } catch (error) {
    console.error('加载课程列表失败:', error)
  } finally {
    coursesLoading.value = false
  }
}

// 切换到课程评分标签时自动加载
watch(activeTab, (val) => {
  if (val === 'rating' && courseList.value.length === 0) {
    loadCourses()
  }
})

// 创建课程对话框
function showCreateCourseDialog() {
  editingCourse.value = null
  courseForm.value = {
    name: '',
    instructor: '',
    training_time: '',
    dimensions: JSON.parse(JSON.stringify(ratingDimensions.value))
  }
  courseDialogVisible.value = true
}

// 编辑课程对话框
function openEditCourseDialog(course: any) {
  editingCourse.value = course
  courseForm.value = {
    name: course.name,
    instructor: course.instructor,
    training_time: course.training_time || '',
    dimensions: course.dimensions
      ? JSON.parse(JSON.stringify(course.dimensions))
      : JSON.parse(JSON.stringify(ratingDimensions.value))
  }
  courseDialogVisible.value = true
}

// 保存课程（创建或更新）
async function saveCourse() {
  if (!courseForm.value.name.trim()) {
    ElMessage.warning('请输入课程名称')
    return
  }
  if (!courseForm.value.instructor.trim()) {
    ElMessage.warning('请输入授课教员')
    return
  }

  // 验证评分维度
  for (let i = 0; i < courseForm.value.dimensions.length; i++) {
    const dim = courseForm.value.dimensions[i]
    if (!dim.label || !dim.label.trim()) {
      ElMessage.warning(`第${i + 1}项评分项目名称不能为空`)
      return
    }
  }

  courseSaving.value = true
  try {
    let response
    if (editingCourse.value) {
      response = await llmHttp.put(`/courses/${editingCourse.value.id}`, courseForm.value)
    } else {
      response = await llmHttp.post('/courses', courseForm.value)
    }

    if (response.data.ok) {
      ElMessage.success(editingCourse.value ? '课程更新成功' : '课程创建成功')
      courseDialogVisible.value = false
      await loadCourses()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    courseSaving.value = false
  }
}

// 删除课程
async function deleteCourse(courseId: string) {
  try {
    const response = await llmHttp.delete(`/courses/${courseId}`)
    if (response.data.ok) {
      ElMessage.success('课程已删除')
      await loadCourses()
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '删除失败')
  }
}

// 打开评分对话框
async function openCourseRatingDialog(course: any) {
  ratingCourse.value = course
  // 使用课程自定义维度
  const dims = course.dimensions || ratingDimensions.value
  activeDimensions.value = dims
  ratingForm.value = { scores: defaultScores(dims), comment: '' }
  myExistingRating.value = null
  ratingDialogVisible.value = true

  try {
    const response = await llmHttp.get(`/courses/${course.id}/my-rating`)
    if (response.data.ok && response.data.data?.has_rated) {
      const existing = response.data.data.rating
      myExistingRating.value = existing
      ratingForm.value.scores = { ...existing.scores }
      ratingForm.value.comment = existing.comment || ''
    }
  } catch (error) {
    console.error('获取已有评分失败:', error)
  }
}

// 提交评分
async function submitRating() {
  for (const dim of activeDimensions.value) {
    const score = ratingForm.value.scores[dim.key]
    if (score === undefined || score === null || score < 0 || score > dim.max_score) {
      ElMessage.warning(`请正确填写"${dim.label}"的评分（0-${dim.max_score}）`)
      return
    }
  }

  ratingSubmitting.value = true
  try {
    const response = await llmHttp.post(`/courses/${ratingCourse.value.id}/rate`, {
      scores: ratingForm.value.scores,
      comment: ratingForm.value.comment
    })

    if (response.data.ok) {
      ElMessage.success(myExistingRating.value ? '评分更新成功' : '评分提交成功')
      // 更新课程列表中的评分状态
      const idx = courseList.value.findIndex((c: any) => c.id === ratingCourse.value.id)
      if (idx >= 0) courseList.value[idx].my_rated = true
      ratingDialogVisible.value = false
    } else {
      ElMessage.error(response.data.message || '评分失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '评分提交失败')
  } finally {
    ratingSubmitting.value = false
  }
}

// 打开管理员评分汇总
async function openCourseSummary(course: any) {
  summaryCourse.value = course
  ratingSummaryData.value = null
  summaryLoading.value = true
  summarySearchKeyword.value = ''
  summaryCurrentPage.value = 1
  ratingSummaryVisible.value = true

  try {
    const response = await llmHttp.get(`/courses/${course.id}/ratings-summary`)
    if (response.data.ok) {
      ratingSummaryData.value = response.data.data
    } else {
      ElMessage.error(response.data.message || '获取评分汇总失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取评分汇总失败')
  } finally {
    summaryLoading.value = false
  }
}

// 删除某用户的评分
async function deleteUserRating(username: string) {
  if (!summaryCourse.value) return
  try {
    const response = await llmHttp.delete(`/courses/${summaryCourse.value.id}/rating/${encodeURIComponent(username)}`)
    if (response.data.ok) {
      ElMessage.success('评分已删除')
      await openCourseSummary(summaryCourse.value)
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error('删除评分失败')
  }
}

// 初始化
onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.resource-center-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  color: #fff;
  margin-bottom: 30px;
  padding: 20px 0;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.header-icon {
  font-size: 2.5rem;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.upload-card,
.resource-list-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}

.card-header .header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.resource-upload {
  width: 100%;
}

.upload-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

.loading-container {
  text-align: center;
  padding: 60px;
  color: #909399;
}

.loading-container p {
  margin-top: 15px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.resource-item {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 12px;
  overflow: hidden;
}

.resource-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.resource-thumbnail {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* ---- 视频缩略图：真实截帧 + 播放按钮 ---- */
.resource-thumbnail.type-video {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  overflow: hidden;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.video-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  background: rgba(0, 0, 0, 0.1);
  transition: background 0.3s;
}

.resource-item:hover .video-play-overlay {
  background: rgba(0, 0, 0, 0.3);
}

.play-btn-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #333;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.resource-item:hover .play-btn-circle {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

/* ---- PDF 文档预览 ---- */
.resource-thumbnail.type-pdf {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  overflow: hidden;
}

.file-doc-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.doc-page {
  width: 100px;
  height: 130px;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  padding: 14px 12px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s;
}

.resource-item:hover .doc-page {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.doc-corner {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 20px 20px 0;
  border-color: transparent #e9ecef transparent transparent;
}

.doc-corner::after {
  content: '';
  position: absolute;
  top: 0;
  right: -20px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 20px 0 0 20px;
  border-color: transparent transparent transparent #ddd;
}

.doc-lines {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 6px;
}

.doc-line {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
}

.doc-file-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 3px;
}

.doc-file-badge.pdf-badge {
  background: #dc2626;
  color: #fff;
}

.doc-file-badge.ppt-badge {
  background: #d97706;
  color: #fff;
}

/* ---- PPT 幻灯片预览 ---- */
.resource-thumbnail.type-ppt {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  overflow: hidden;
}

.file-ppt-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.ppt-slide {
  width: 144px;
  height: 100px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  padding: 12px 14px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s;
}

.resource-item:hover .ppt-slide {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.ppt-title-bar {
  height: 8px;
  width: 60%;
  background: linear-gradient(90deg, #fb923c, #f97316);
  border-radius: 2px;
  margin-bottom: 12px;
}

.ppt-body {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ppt-line {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
}

/* ---- 通用 fallback icon ---- */
.type-icon {
  font-size: 60px;
  color: rgba(255, 255, 255, 0.8);
  transition: transform 0.3s;
}

.resource-item:hover .type-icon {
  transform: scale(1.2);
  color: #fff;
}

.resource-size {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 3;
}

.resource-type-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  z-index: 3;
}

.resource-info {
  padding: 15px;
}

.resource-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

.resource-description {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #909399;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.resource-actions {
  display: flex;
  justify-content: flex-start;
}

.video-player-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.video-player-container {
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  min-height: 300px;
}

.video-loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 400px;
  color: #ccc;
}

.video-loading-overlay p {
  margin-top: 16px;
  font-size: 14px;
}

.video-player {
  width: 100%;
  max-height: 70vh;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pdf-viewer-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.pdf-viewer-container {
  width: 100%;
  height: 75vh;
  background: #f5f5f5;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

.ppt-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #606266;
}

.ppt-loading p {
  margin-top: 16px;
  font-size: 14px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* ==================== 标签页 ==================== */
.main-tabs {
  margin-bottom: 0;
  border-radius: 12px;
  overflow: hidden;
}

.main-tabs :deep(.el-tabs__content) {
  padding: 20px;
}

/* ==================== 维度编辑样式 ==================== */
.dim-edit-section {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
  margin-top: 8px;
}

.dim-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dim-edit-total {
  text-align: right;
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

/* ==================== 课程工具栏 ==================== */
.course-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.course-toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.course-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== 课程列表样式 ==================== */

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-item {
  border-radius: 10px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.course-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.course-name-wrap {
  display: flex;
  align-items: center;
}

.course-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.course-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.course-meta {
  display: flex;
  gap: 20px;
  font-size: 0.85rem;
  color: #909399;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* 评分对话框课程信息栏 */
.rating-course-info {
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #303133;
}

/* ==================== 汇总对话框搜索与分页 ==================== */
.summary-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.summary-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* ==================== 课程评分样式 ==================== */
.rating-form-container {
  padding: 0 10px;
}

.rating-table {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.rating-table-header {
  display: flex;
  background: #f5f7fa;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  border-bottom: 2px solid #e4e7ed;
}

.rating-table-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.2s;
}

.rating-table-row:hover {
  background-color: #f5f7fa;
}

.rating-table-footer {
  display: flex;
  align-items: center;
  background: #fafafa;
  border-top: 2px solid #e4e7ed;
}

.rating-col-dim {
  width: 100px;
  min-width: 100px;
  padding: 12px 16px;
  font-weight: 500;
}

.dim-label {
  color: #409eff;
  font-weight: 600;
}

.rating-col-desc {
  flex: 1;
  padding: 12px 10px;
  color: #606266;
  font-size: 13px;
}

.rating-col-max {
  width: 70px;
  min-width: 70px;
  padding: 12px 10px;
  text-align: center;
  color: #909399;
}

.rating-col-score {
  width: 130px;
  min-width: 130px;
  padding: 12px 10px;
  text-align: center;
}

/* 评分汇总概览 */
.summary-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}

.overview-item {
  flex: 1;
  min-width: 100px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  border: 1px solid #ebeef5;
  transition: transform 0.2s;
}

.overview-item:hover {
  transform: translateY(-2px);
}

.overview-item.overview-total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.overview-item.overview-total .overview-value {
  color: #fff;
}

.overview-item.overview-total .overview-label {
  color: rgba(255, 255, 255, 0.85);
}

.overview-item.overview-count {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: #fff;
  border: none;
}

.overview-item.overview-count .overview-value {
  color: #fff;
}

.overview-item.overview-count .overview-label {
  color: rgba(255, 255, 255, 0.85);
}

.overview-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.overview-label {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .resource-grid {
    grid-template-columns: 1fr;
  }
  
  .el-row {
    flex-direction: column;
  }
  
  .el-col {
    max-width: 100% !important;
  }
  
  .header-right {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
