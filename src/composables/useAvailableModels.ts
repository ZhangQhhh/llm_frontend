import { ref, readonly, watch } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { LLM_BASE_URL } from '@/config/api/api'

export interface ModelOption {
  value: string
  label: string
  reachable: boolean
}

// ==================== 模块级缓存（跨组件共享，避免重复请求） ====================
const _models = ref<ModelOption[]>([])
const _firstReachable = ref<string>('')
const _defaultModel = ref<string>('')
const _loaded = ref(false)
const _loading = ref(false)
let _fetchPromise: Promise<void> | null = null

const _LABEL_FALLBACK: Record<string, string> = {
  'qwen3-32b':    'Qwen (通用)',
  'qwen2025':     'Qwen (增强)',
  'deepseek':     'DeepSeekv3.1',
  'deepseek-3.2': 'DeepSeekv3.2',
  'qwen-plus':    'Qwen (云端)',
}

async function _doFetch(): Promise<void> {
  _loading.value = true
  try {
    const token = localStorage.getItem('llm_token') || localStorage.getItem('jwt_token') || ''
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const resp = await fetch(`${LLM_BASE_URL}/available_models`, { headers })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    if (!data.ok || !Array.isArray(data.models)) throw new Error('invalid response')

    _models.value = data.models.map((m: any) => ({
      value: m.value,
      label: m.label || _LABEL_FALLBACK[m.value] || m.value,
      reachable: !!m.reachable,
    }))
    _firstReachable.value = data.first_reachable || ''
    _defaultModel.value = data.default || ''
    _loaded.value = true
  } catch (e) {
    console.warn('[useAvailableModels] 拉取模型列表失败，使用静态兜底列表', e)
    _models.value = [
      { value: 'qwen-plus',    label: 'Qwen (云端)',   reachable: true },
      { value: 'qwen2025',     label: 'Qwen (增强)',   reachable: false },
      { value: 'qwen3-32b',    label: 'Qwen (通用)',   reachable: false },
      { value: 'deepseek',     label: 'DeepSeekv3.1', reachable: false },
      { value: 'deepseek-3.2', label: 'DeepSeekv3.2', reachable: false },
    ]
    _firstReachable.value = 'qwen-plus'
    _defaultModel.value = 'qwen-plus'
    _loaded.value = true
  } finally {
    _loading.value = false
    _fetchPromise = null
  }
}

/**
 * 触发一次（模块内去重）模型列表拉取。
 * 多个组件同时调用只发一个请求。
 */
function fetchModels(): Promise<void> {
  if (_loaded.value) return Promise.resolve()
  if (_fetchPromise) return _fetchPromise
  _fetchPromise = _doFetch()
  return _fetchPromise
}

/**
 * 强制刷新（服务器重启后可调用）
 */
function refreshModels(): Promise<void> {
  _loaded.value = false
  _fetchPromise = null
  return fetchModels()
}

/**
 * 从候选列表中同步返回第一个在 _models 中标记为 reachable 的 model_id。
 * 若没有可达候选，返回 _firstReachable 或 _defaultModel。
 */
function resolveModel(candidates?: string[]): string {
  if (!_loaded.value) return _firstReachable.value || _defaultModel.value || 'qwen-plus'
  if (candidates && candidates.length > 0) {
    for (const c of candidates) {
      const found = _models.value.find(m => m.value === c)
      if (found?.reachable) return c
    }
  }
  return _firstReachable.value || _defaultModel.value || (_models.value[0]?.value ?? 'qwen-plus')
}

/**
 * 监听用户选择的模型，若不可达则弹出警告。
 * 在组件 setup() 中调用，传入 modelId 的 ref。
 */
function watchModelReachability(modelRef: Ref<string>) {
  watch(modelRef, (newVal) => {
    if (!_loaded.value || !newVal) return
    const found = _models.value.find(m => m.value === newVal)
    if (found && !found.reachable) {
      ElMessage.warning(`模型「${found.label}」当前不可达，请求将自动切换到可用模型`)
    }
  })
}

/**
 * 初始化组件模型选择 ref：
 * 1. 同步将 modelRef 设为候选列表第一项（保持用户期望的默认，如 'deepseek'）
 * 2. fetchModels 完成后修正为第一个真正可达的候选；若值已被用户改动则不覆盖
 * 3. 自动注册 watchModelReachability
 *
 * 在组件 setup() 中替代 ref(resolveModel(...)) + watchModelReachability(...) 使用：
 *   const modelId = ref('');
 *   initModel(modelId, ['deepseek', 'qwen3-32b', 'qwen2025', 'qwen-plus']);
 */
function initModel(modelRef: Ref<string>, candidates: string[]) {
  const preferred = candidates[0] ?? 'deepseek'
  // 同步设为候选第一项，保证刷新后显示用户期望的默认值
  modelRef.value = preferred

  // fetchModels 完成后修正为真正可达的模型
  fetchModels().then(() => {
    // 仅当值仍是我们设的初始值时才修正（用户未主动切换过）
    if (modelRef.value === preferred) {
      const resolved = resolveModel(candidates)
      modelRef.value = resolved
    }
  })

  watchModelReachability(modelRef)
}

export function useAvailableModels() {
  return {
    models: readonly(_models),
    firstReachable: readonly(_firstReachable),
    defaultModel: readonly(_defaultModel),
    loaded: readonly(_loaded),
    loading: readonly(_loading),
    fetchModels,
    refreshModels,
    resolveModel,
    watchModelReachability,
    initModel,
  }
}
