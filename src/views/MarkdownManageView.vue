<template>
  <div class="md-manage-page">
    <!-- 顶部 -->
    <div class="page-header">
      <div class="header-left">
        <el-icon class="title-icon"><Notebook /></el-icon>
        <div>
          <h1>Markdown 文件管理</h1>
          <p class="subtitle">在线新建、上传、编辑你的 Markdown 文件</p>
        </div>
      </div>
      <div class="header-right">
        <el-button
          type="warning"
          @click="onRebuildTreeKb"
          :loading="rebuilding"
          :disabled="rebuilding"
        >
          <el-icon v-if="!rebuilding"><Refresh /></el-icon>
          {{ rebuilding ? '重建中...' : '重建知识库' }}
        </el-button>
        <el-button @click="openTrash">
          <el-icon><Delete /></el-icon>回收站
        </el-button>
      </div>
    </div>

    <div class="main-layout">
      <!-- 左侧：文件列表 -->
      <el-card class="sidebar" shadow="never">
        <template #header>
          <div class="sidebar-header">
            <el-button type="primary" size="small" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>新建
            </el-button>
            <el-button size="small" @click="triggerUpload">
              <el-icon><Upload /></el-icon>上传
            </el-button>
            <input
              ref="uploadInputRef"
              type="file"
              accept=".md,.markdown"
              style="display:none"
              @change="onFileSelected"
            />
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文件..."
            clearable
            size="small"
            style="margin-top: 8px;"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </template>

        <el-scrollbar class="file-list-scroll">
          <div v-if="loadingList" class="empty-hint">加载中...</div>
          <div v-else-if="filteredFiles.length === 0" class="empty-hint">
            {{ searchKeyword ? '（无匹配结果）' : '（暂无文件，点击「新建」开始）' }}
          </div>
          <div
            v-for="f in filteredFiles"
            :key="f.name"
            class="file-item"
            :class="{ active: f.name === currentFile }"
            @click="openFile(f.name)"
          >
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-main">
              <div class="file-name" :title="f.name">{{ f.name }}</div>
              <div class="file-meta">{{ formatSize(f.size) }} · {{ f.mtime_str }}</div>
            </div>
          </div>
        </el-scrollbar>
      </el-card>

      <!-- 右侧：编辑器 -->
      <el-card class="editor-card" shadow="never">
        <template v-if="currentFile" #header>
          <div class="editor-header">
            <div class="current-file">
              <el-icon><Document /></el-icon>
              <span class="filename">{{ currentFile }}</span>
              <el-tag v-if="isDirty" type="warning" size="small" effect="plain">未保存</el-tag>
            </div>
            <div class="editor-actions">
              <el-button type="primary" size="small" @click="saveCurrentFile" :loading="saving">
                <el-icon><Select /></el-icon>保存 (Ctrl+S)
              </el-button>
              <el-button size="small" @click="openRenameDialog">
                <el-icon><Edit /></el-icon>重命名
              </el-button>
              <el-button type="danger" size="small" plain @click="deleteCurrentFile">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="!currentFile" class="editor-empty">
          <el-empty description="请从左侧选择或新建一个 Markdown 文件" />
        </div>
        <div v-show="currentFile" class="editor-body">
          <!-- EasyMDE 会把这个 textarea 变成编辑器 -->
          <textarea ref="editorTextareaRef"></textarea>
        </div>
      </el-card>
    </div>

    <!-- 新建对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建 Markdown 文件" width="420px">
      <el-input
        v-model="newFileName"
        placeholder="文件名（可省略 .md 后缀）"
        @keyup.enter="submitCreate"
      />
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="showRenameDialog" title="重命名" width="420px">
      <el-input v-model="renameTarget" @keyup.enter="submitRename" />
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRename" :loading="renaming">保存</el-button>
      </template>
    </el-dialog>

    <!-- 回收站对话框 -->
    <el-dialog v-model="showTrashDialog" title="回收站" width="600px">
      <div v-if="loadingTrash" class="empty-hint">加载中...</div>
      <div v-else-if="trashList.length === 0" class="empty-hint">（回收站为空）</div>
      <div v-else class="trash-list">
        <div v-for="f in trashList" :key="f.name" class="trash-item">
          <div>
            <div class="file-name">{{ f.name }}</div>
            <div class="file-meta">{{ formatSize(f.size) }} · {{ f.mtime_str }}</div>
          </div>
          <el-button type="primary" size="small" @click="restoreTrash(f.name)">恢复</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ★ 新增：重建知识库结果对话框 -->
    <el-dialog
      v-model="showRebuildResultDialog"
      title="知识库重建结果"
      width="480px"
      :close-on-click-modal="false"
    >
      <div v-if="rebuildResult" class="rebuild-result">
        <div v-if="rebuildResult.ok" class="result-success">
          <div class="result-icon">✓</div>
          <div class="result-title">重建成功</div>
          <div class="result-stats">
            <div class="stat-row">
              <span class="stat-label">耗时：</span>
              <span class="stat-value">{{ rebuildResult.elapsed_seconds }} 秒</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Markdown 文件：</span>
              <span class="stat-value">{{ rebuildResult.md_count }} 个</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">生成 JSON：</span>
              <span class="stat-value">{{ rebuildResult.json_count }} 个</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">总节点数：</span>
              <span class="stat-value">{{ rebuildResult.total_nodes }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">叶子节点：</span>
              <span class="stat-value">{{ rebuildResult.leaf_count }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">中间节点：</span>
              <span class="stat-value">{{ rebuildResult.inner_count }}</span>
            </div>
          </div>
          <div class="result-tip">知识库已切换为最新版本，可立即在「知识问答」页面使用</div>
        </div>
        <div v-else class="result-failure">
          <div class="result-icon error">✗</div>
          <div class="result-title">重建失败</div>
          <div class="result-msg">{{ rebuildResult.message }}</div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showRebuildResultDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Notebook, Document, Plus, Upload, Delete, Edit, Select, Search, Refresh
} from '@element-plus/icons-vue'
import llmHttp from '@/config/api/llmHttp'
import { renderMarkdown } from '@/utils/markdown'

// ============================================================
// 类型
// ============================================================
interface MdFile {
  name: string
  size: number
  mtime: number
  mtime_str: string
}

interface RebuildResult {
  ok: boolean
  message?: string
  elapsed_seconds?: number
  md_count?: number
  json_count?: number
  total_nodes?: number
  leaf_count?: number
  inner_count?: number
}

// ============================================================
// EasyMDE 动态加载（完全本地化版本）
// 所有静态资源都从 Vue 项目 public/vendor/ 下读取，不联网
// ----------------------------------------------------------
// 部署前必须把以下文件就位：
//   public/vendor/easymde/easymde.min.css
//   public/vendor/easymde/easymde.min.js
//   public/vendor/font-awesome/css/font-awesome.min.css
//   public/vendor/font-awesome/fonts/fontawesome-webfont.{eot,svg,ttf,woff,woff2}
//   public/vendor/font-awesome/fonts/FontAwesome.otf
// ============================================================
const EASYMDE_CSS    = '/vendor/easymde/easymde.min.css'
const EASYMDE_JS     = '/vendor/easymde/easymde.min.js'
const FONTAWESOME_CSS = '/vendor/font-awesome/css/font-awesome.min.css'

let easymdeLoadingPromise: Promise<any> | null = null

function injectStylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function loadEasyMDE(): Promise<any> {
  if ((window as any).EasyMDE) {
    return Promise.resolve((window as any).EasyMDE)
  }
  if (easymdeLoadingPromise) return easymdeLoadingPromise

  easymdeLoadingPromise = new Promise((resolve, reject) => {
    // 1. Font Awesome（EasyMDE 工具栏图标必需，否则按钮全是方块）
    injectStylesheet(FONTAWESOME_CSS)
    // 2. EasyMDE 自身样式
    injectStylesheet(EASYMDE_CSS)
    // 3. EasyMDE 主程序
    const existingScript = document.querySelector(`script[src="${EASYMDE_JS}"]`)
    if (existingScript && (window as any).EasyMDE) {
      resolve((window as any).EasyMDE)
      return
    }
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = EASYMDE_JS
      script.onload = () => resolve((window as any).EasyMDE)
      script.onerror = () => reject(new Error(
        'EasyMDE 加载失败：请确认 public/vendor/easymde/ 下文件已就位'
      ))
      document.head.appendChild(script)
    }
  })
  return easymdeLoadingPromise
}

// ============================================================
// 组件
// ============================================================
export default defineComponent({
  name: 'MarkdownManageView',
  components: {
    Notebook, Document, Plus, Upload, Delete, Edit, Select, Search, Refresh
  },
  setup() {
    // 状态
    const fileList = ref<MdFile[]>([])
    const searchKeyword = ref('')
    const currentFile = ref<string | null>(null)
    const isDirty = ref(false)

    const loadingList = ref(false)
    const saving = ref(false)
    const creating = ref(false)
    const renaming = ref(false)
    const loadingTrash = ref(false)

    // ★ 新增：重建知识库相关状态
    const rebuilding = ref(false)
    const showRebuildResultDialog = ref(false)
    const rebuildResult = ref<RebuildResult | null>(null)

    const showCreateDialog = ref(false)
    const showRenameDialog = ref(false)
    const showTrashDialog = ref(false)

    const newFileName = ref('')
    const renameTarget = ref('')
    const trashList = ref<MdFile[]>([])

    const editorTextareaRef = ref<HTMLTextAreaElement | null>(null)
    const uploadInputRef = ref<HTMLInputElement | null>(null)

    let easyMDE: any = null

    // ========================================================
    // 工具函数
    // ========================================================
    const formatSize = (b: number): string => {
      if (b < 1024) return b + ' B'
      if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' K'
      return (b / 1024 / 1024).toFixed(1) + ' M'
    }

    const filteredFiles = computed(() => {
      const kw = searchKeyword.value.trim().toLowerCase()
      if (!kw) return fileList.value
      return fileList.value.filter(f => f.name.toLowerCase().includes(kw))
    })

    const apiErrMsg = (e: any, fallback: string): string => {
      return e?.response?.data?.message || e?.message || fallback
    }

    // ========================================================
    // EasyMDE 初始化（懒加载：首次打开文件时创建）
    // previewRender 指向项目既有的 renderMarkdown，支持 KaTeX + XSS 防护
    // ========================================================
    const initEasyMDE = async () => {
      if (easyMDE) return
      const EasyMDE = await loadEasyMDE()
      await nextTick()
      if (!editorTextareaRef.value) return

      easyMDE = new EasyMDE({
        element: editorTextareaRef.value,
        autoDownloadFontAwesome: false,   // 完全本地化：禁止 EasyMDE 自动联网下载 FA
        spellChecker: false,
        status: ['lines', 'words', 'cursor'],
        toolbar: [
          'bold', 'italic', 'strikethrough', 'heading', '|',
          'code', 'quote', 'unordered-list', 'ordered-list', '|',
          'link', 'image', 'table', 'horizontal-rule', '|',
          'preview', 'side-by-side', 'fullscreen', '|',
          'guide'
        ],
        minHeight: '400px',
        autosave: { enabled: false },
        // ★ 核心：复用项目 utils/markdown.ts 的 renderMarkdown
        //    使预览支持 KaTeX + DOMPurify（和 /help /knowledge-qa 等页面一致）
        previewRender: (plainText: string) => renderMarkdown(plainText)
      })
      easyMDE.codemirror.on('change', () => { isDirty.value = true })
    }

    // ========================================================
    // API 调用
    // ========================================================
    const fetchFileList = async () => {
      loadingList.value = true
      try {
        const { data } = await llmHttp.get('/markdown/list')
        if (data?.ok) {
          fileList.value = data.files || []
        } else {
          ElMessage.error(data?.message || '加载列表失败')
        }
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '加载列表失败'))
      } finally {
        loadingList.value = false
      }
    }

    const openFile = async (name: string) => {
      if (isDirty.value) {
        try {
          await ElMessageBox.confirm('当前文件有未保存改动，确定切换吗？', '提示', {
            confirmButtonText: '放弃改动',
            cancelButtonText: '继续编辑',
            type: 'warning'
          })
        } catch { return }
      }
      try {
        const { data } = await llmHttp.get('/markdown/read', { params: { name } })
        if (!data?.ok) { ElMessage.error(data?.message || '读取失败'); return }
        currentFile.value = data.filename
        await initEasyMDE()
        easyMDE.value(data.content || '')
        isDirty.value = false
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '读取失败'))
      }
    }

    const saveCurrentFile = async () => {
      if (!currentFile.value || !easyMDE) return
      saving.value = true
      try {
        const { data } = await llmHttp.post('/markdown/save', {
          filename: currentFile.value,
          content: easyMDE.value()
        })
        if (data?.ok) {
          ElMessage.success('已保存')
          isDirty.value = false
          await fetchFileList()
        } else {
          ElMessage.error(data?.message || '保存失败')
        }
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '保存失败'))
      } finally {
        saving.value = false
      }
    }

    const submitCreate = async () => {
      let name = newFileName.value.trim()
      if (!name) { ElMessage.warning('请输入文件名'); return }
      if (!/\.(md|markdown)$/i.test(name)) name += '.md'
      const initContent = `# ${name.replace(/\.(md|markdown)$/i, '')}\n\n`
      creating.value = true
      try {
        const { data } = await llmHttp.post('/markdown/create', {
          filename: name, content: initContent
        })
        if (data?.ok) {
          ElMessage.success('创建成功')
          showCreateDialog.value = false
          newFileName.value = ''
          await fetchFileList()
          openFile(data.filename)
        } else {
          ElMessage.error(data?.message || '创建失败')
        }
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '创建失败'))
      } finally {
        creating.value = false
      }
    }

    const triggerUpload = () => uploadInputRef.value?.click()

    const onFileSelected = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const file = input.files?.[0]
      if (!file) return

      const form = new FormData()
      form.append('file', file)
      try {
        const { data } = await llmHttp.post('/markdown/upload', form, {
          // 让浏览器自动生成 multipart boundary，不要手动设 Content-Type
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (data?.ok) {
          ElMessage.success('上传成功')
          await fetchFileList()
          openFile(data.filename)
        } else {
          ElMessage.error(data?.message || '上传失败')
        }
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '上传失败'))
      }
      input.value = ''  // 重置以便同文件可再次触发
    }

    const openRenameDialog = () => {
      if (!currentFile.value) return
      renameTarget.value = currentFile.value
      showRenameDialog.value = true
    }

    const submitRename = async () => {
      let newName = renameTarget.value.trim()
      if (!newName) { ElMessage.warning('请输入新文件名'); return }
      if (newName === currentFile.value) { showRenameDialog.value = false; return }
      if (!/\.(md|markdown)$/i.test(newName)) newName += '.md'
      renaming.value = true
      try {
        const { data } = await llmHttp.post('/markdown/rename', {
          old_name: currentFile.value, new_name: newName
        })
        if (data?.ok) {
          ElMessage.success('已重命名')
          currentFile.value = data.filename
          showRenameDialog.value = false
          await fetchFileList()
        } else {
          ElMessage.error(data?.message || '重命名失败')
        }
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '重命名失败'))
      } finally {
        renaming.value = false
      }
    }

    const deleteCurrentFile = async () => {
      if (!currentFile.value) return
      try {
        await ElMessageBox.confirm(
          `确定删除「${currentFile.value}」吗？可从回收站恢复。`,
          '确认删除',
          { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
        )
      } catch { return }
      try {
        const { data } = await llmHttp.post('/markdown/delete', {
          filename: currentFile.value
        })
        if (data?.ok) {
          ElMessage.success('已移入回收站')
          currentFile.value = null
          isDirty.value = false
          if (easyMDE) easyMDE.value('')
          await fetchFileList()
        } else {
          ElMessage.error(data?.message || '删除失败')
        }
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '删除失败'))
      }
    }

    const openTrash = async () => {
      showTrashDialog.value = true
      loadingTrash.value = true
      try {
        const { data } = await llmHttp.get('/markdown/trash/list')
        if (data?.ok) trashList.value = data.files || []
        else ElMessage.error(data?.message || '加载回收站失败')
      } catch (e: any) {
        ElMessage.error(apiErrMsg(e, '加载回收站失败'))
      } finally {
        loadingTrash.value = false
      }
    }

    const restoreTrash = async (trashName: string) => {
      try {
        const { data } = await llmHttp.post('/markdown/trash/restore', {
          trash_name: trashName
        })
        if (data?.ok) {
          ElMessage.success('已恢复')
          await openTrash()
          await fetchFileList()
          return
        }
        // 409 同名冲突：提示用户输新名
        if (data?.message && String(data.message).includes('已存在')) {
          try {
            const { value: newName } = await ElMessageBox.prompt(
              '目标位置已存在同名文件，请输入恢复后的新文件名：',
              '重命名恢复',
              { confirmButtonText: '恢复', cancelButtonText: '取消' }
            )
            const { data: d2 } = await llmHttp.post('/markdown/trash/restore', {
              trash_name: trashName, restore_as: newName
            })
            if (d2?.ok) {
              ElMessage.success('已恢复')
              await openTrash(); await fetchFileList()
            } else {
              ElMessage.error(d2?.message || '恢复失败')
            }
          } catch { /* 用户取消 */ }
        } else {
          ElMessage.error(data?.message || '恢复失败')
        }
      } catch (e: any) {
        // axios 对 409 会走到这里
        const bizMsg = e?.response?.data?.message || ''
        if (e?.response?.status === 409 || bizMsg.includes('已存在')) {
          try {
            const { value: newName } = await ElMessageBox.prompt(
              '目标位置已存在同名文件，请输入恢复后的新文件名：',
              '重命名恢复',
              { confirmButtonText: '恢复', cancelButtonText: '取消' }
            )
            const { data: d2 } = await llmHttp.post('/markdown/trash/restore', {
              trash_name: trashName, restore_as: newName
            })
            if (d2?.ok) {
              ElMessage.success('已恢复')
              await openTrash(); await fetchFileList()
            } else {
              ElMessage.error(d2?.message || '恢复失败')
            }
          } catch { /* 用户取消 */ }
        } else {
          ElMessage.error(apiErrMsg(e, '恢复失败'))
        }
      }
    }

    // ========================================================
    // ★ 新增：重建父子节点知识库
    // ========================================================
    const onRebuildTreeKb = async () => {
      // 1. 先确认（避免误点造成知识库重建）
      try {
        await ElMessageBox.confirm(
          '此操作将根据当前所有 Markdown 文件，重新生成 JSON 并重建父子节点知识库。\n\n' +
          '· 大约需要 10-30 秒\n' +
          '· 期间无法再次触发重建\n' +
          '· 完成后知识库会立即切换为最新版本',
          '确认重建知识库？',
          {
            confirmButtonText: '开始重建',
            cancelButtonText: '取消',
            type: 'warning',
            dangerouslyUseHTMLString: false
          }
        )
      } catch {
        return  // 用户取消
      }

      rebuilding.value = true
      const hint = ElMessage({
        message: '正在重建知识库，请稍候...',
        type: 'info',
        duration: 0,
        showClose: false
      })

      try {
        const { data } = await llmHttp.post('/markdown/rebuild_tree_kb')
        hint.close()

        rebuildResult.value = data
        showRebuildResultDialog.value = true

        if (data?.ok) {
          ElMessage.success(`知识库已重建：${data.total_nodes} 个节点`)
        }
      } catch (e: any) {
        hint.close()
        const status = e?.response?.status
        if (status === 403) {
          ElMessage.error('只有管理员可以重建知识库')
        } else if (status === 429) {
          ElMessage.warning('已有重建任务在进行中，请稍后再试')
        } else {
          rebuildResult.value = {
            ok: false,
            message: apiErrMsg(e, '重建失败')
          }
          showRebuildResultDialog.value = true
        }
      } finally {
        rebuilding.value = false
      }
    }

    // ========================================================
    // 快捷键 & 生命周期
    // ========================================================
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (currentFile.value) saveCurrentFile()
      }
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.value) { e.preventDefault(); e.returnValue = '' }
    }

    onMounted(() => {
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('beforeunload', onBeforeUnload)
      fetchFileList()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (easyMDE) {
        try { easyMDE.toTextArea(); easyMDE = null } catch { /* ignore */ }
      }
    })

    return {
      // state
      fileList, filteredFiles, searchKeyword,
      currentFile, isDirty,
      loadingList, saving, creating, renaming, loadingTrash,
      rebuilding, showRebuildResultDialog, rebuildResult,   // ★ 新增
      showCreateDialog, showRenameDialog, showTrashDialog,
      newFileName, renameTarget, trashList,
      editorTextareaRef, uploadInputRef,
      // methods
      formatSize,
      openFile, saveCurrentFile,
      submitCreate, triggerUpload, onFileSelected,
      openRenameDialog, submitRename,
      deleteCurrentFile,
      openTrash, restoreTrash,
      onRebuildTreeKb                                       // ★ 新增
    }
  }
})
</script>

<style scoped>
.md-manage-page {
  padding: 16px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #2c3e50 0%, #3b5470 100%);
  color: #fff;
  padding: 14px 20px;
  border-radius: 8px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.title-icon { font-size: 28px; }
.page-header h1 { font-size: 18px; margin: 0; font-weight: 600; }
.page-header .subtitle { font-size: 12px; opacity: 0.75; margin: 2px 0 0; }

/* ★ 新增：header-right 多按钮间距 */
.header-right {
  display: flex;
  gap: 8px;
}
.header-right :deep(.el-button) {
  color: #fff;
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.2);
}
.header-right :deep(.el-button:hover) {
  background: rgba(255,255,255,0.25);
}
/* warning 按钮（重建知识库）特殊配色，醒目 */
.header-right :deep(.el-button--warning) {
  background: rgba(230, 162, 60, 0.85);
  border-color: rgba(230, 162, 60, 1);
}
.header-right :deep(.el-button--warning:hover) {
  background: rgba(230, 162, 60, 1);
}
.header-right :deep(.el-button--warning.is-disabled),
.header-right :deep(.el-button--warning:disabled) {
  background: rgba(230, 162, 60, 0.4);
  border-color: rgba(230, 162, 60, 0.5);
}

.main-layout {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.sidebar :deep(.el-card__body) { flex: 1; padding: 0; min-height: 0; display: flex; }
.sidebar-header { display: flex; gap: 6px; }
.file-list-scroll { width: 100%; }
.file-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}
.file-item:hover { background: #f9fafb; }
.file-item.active { background: #ecf5ff; border-left: 3px solid #409eff; padding-left: 11px; }
.file-icon { color: #909399; font-size: 16px; flex-shrink: 0; }
.file-main { flex: 1; min-width: 0; }
.file-name {
  font-size: 13px; color: #303133;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.file-meta { font-size: 11px; color: #909399; margin-top: 2px; }
.empty-hint { padding: 28px 12px; text-align: center; color: #909399; font-size: 13px; }

.editor-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.editor-card :deep(.el-card__body) { flex: 1; padding: 12px; min-height: 0; display: flex; flex-direction: column; }
.editor-header {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
}
.current-file { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #303133; }
.current-file .filename { font-weight: 500; }
.editor-actions { display: flex; gap: 6px; }
.editor-empty { flex: 1; display: flex; align-items: center; justify-content: center; }
.editor-body { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.editor-body :deep(.EasyMDEContainer) { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.editor-body :deep(.EasyMDEContainer .CodeMirror) { flex: 1; min-height: 300px; }

.trash-list { max-height: 440px; overflow-y: auto; }
.trash-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; border-bottom: 1px solid #f3f4f6;
}
.trash-item:last-child { border-bottom: none; }

/* ★ 新增：重建结果对话框样式 */
.rebuild-result {
  padding: 8px 4px;
}
.result-success, .result-failure {
  text-align: center;
}
.result-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #67c23a;
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  line-height: 56px;
}
.result-icon.error {
  background: #f56c6c;
}
.result-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}
.result-stats {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 14px 18px;
  margin: 0 0 14px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed #e4e7ed;
}
.stat-row:last-child {
  border-bottom: none;
}
.stat-label {
  color: #606266;
}
.stat-value {
  color: #303133;
  font-weight: 500;
}
.result-tip {
  font-size: 12px;
  color: #67c23a;
  background: #f0f9eb;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #67c23a;
}
.result-msg {
  color: #f56c6c;
  font-size: 14px;
  background: #fef0f0;
  padding: 10px 14px;
  border-radius: 4px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>