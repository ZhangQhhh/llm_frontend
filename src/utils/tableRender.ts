/**
 * 把题干 / 解析里的 `[表格] ... [/表格]` 块渲染成 HTML <table>。
 *
 * 后端约定（参见 utils/smart_docx_reader.py preprocess_docx_content）：
 *   - 表格起始行：`[表格]`
 *   - 表格结束行：`[/表格]`
 *   - 中间每一行：`· cell1 ｜ cell2 ｜ cell3`
 *
 * 之所以放到前端做：
 *   - 后端输出保留纯文本标记，方便导出 / 编辑 / 与原解析比对；
 *   - 前端用 `v-html` 渲染，正好能转成真正的表格视觉效果。
 */

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// 表格 HTML 占位符使用 Unicode 私有区字符，正常文本永远不会出现，
// 同时也避开 eslint no-control-regex 限制。
const TABLE_OPEN = '\uE000'
const TABLE_CLOSE = '\uE001'
const TABLE_SEG_RE = new RegExp('(' + TABLE_OPEN + '[\\s\\S]*?' + TABLE_CLOSE + ')')

/**
 * 图片映射：filename -> data URL（或 base64 与 content_type 拼装后的 src）。
 * 调用方传入题目中可用的 stem_images / option_images / analysis_images 合并后的 map。
 */
export type CellImagesMap = Record<string, string>

// [IMG:filename] 标记正则（后端在表格单元格内嵌入）
const IMG_MARKER_RE = /\[IMG:([^\]]+)\]/g

const renderCellWithImages = (cell: string, images?: CellImagesMap): string => {
  // 拆分出文本段与图片标记段：文本走转义，图片走 <img>。
  let lastIdx = 0
  let html = ''
  IMG_MARKER_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = IMG_MARKER_RE.exec(cell)) !== null) {
    const before = cell.slice(lastIdx, m.index)
    if (before) html += escapeHtml(before)
    const filename = m[1]
    const src = images && images[filename]
    if (src) {
      html += `<img class="md-table-img" src="${src}" alt="${escapeHtml(filename)}" />`
    } else {
      // 拿不到图片时保留原始标记，避免丢失信息
      html += escapeHtml(m[0])
    }
    lastIdx = m.index + m[0].length
  }
  const tail = cell.slice(lastIdx)
  if (tail) html += escapeHtml(tail)
  return html
}

const renderTableBlock = (rawRows: string[], images?: CellImagesMap): string => {
  // 解析行：去掉行首 `· ` 标记，按 `｜` 切单元格。
  const rows: string[][] = []
  for (const r of rawRows) {
    const line = r.replace(/^\s*[·•・]\s*/, '').trim()
    if (!line) continue
    rows.push(line.split('｜').map(c => c.trim()))
  }
  if (rows.length === 0) return ''
  // 列数对齐：用最长一行作为列数基准
  const colCount = Math.max(...rows.map(r => r.length))
  for (const r of rows) {
    while (r.length < colCount) r.push('')
  }
  const head = rows[0]
  const body = rows.slice(1)
  const thead = `<thead><tr>${head
    .map(c => `<th>${renderCellWithImages(c, images)}</th>`)
    .join('')}</tr></thead>`
  const tbody = body.length
    ? `<tbody>${body
        .map(
          r =>
            `<tr>${r.map(c => `<td>${renderCellWithImages(c, images)}</td>`).join('')}</tr>`
        )
        .join('')}</tbody>`
    : ''
  return `<table class="md-table">${thead}${tbody}</table>`
}

/**
 * 替换文本里所有 `[表格]...[/表格]` 块为 HTML 表格。
 * 块外文本保持原样（调用方负责后续转义 / 换行处理）。
 */
export const renderTableBlocks = (text: string, images?: CellImagesMap): string => {
  if (!text || text.indexOf('[表格]') === -1) return text
  const out: string[] = []
  let i = 0
  while (i < text.length) {
    const start = text.indexOf('[表格]', i)
    if (start < 0) {
      out.push(text.slice(i))
      break
    }
    // 块前文本原样保留（占位符 \u0001START / END 用来标识 HTML 片段）
    if (start > i) out.push(text.slice(i, start))
    const end = text.indexOf('[/表格]', start)
    if (end < 0) {
      // 未闭合，保留剩余原文
      out.push(text.slice(start))
      break
    }
    const inner = text.slice(start + '[表格]'.length, end)
    const rows = inner.split('\n')
    const html = renderTableBlock(rows, images)
    out.push(TABLE_OPEN + html + TABLE_CLOSE)
    i = end + '[/表格]'.length
    // 跳过紧跟的换行符，避免表格后多出空行
    while (i < text.length && (text[i] === '\n' || text[i] === '\r')) i++
  }
  return out.join('')
}

/**
 * 把含表格占位符的字符串做最终转义：
 *   - 表格 HTML 占位符段（TABLE_OPEN ... TABLE_CLOSE）原样保留
 *   - 其他段做 HTML 转义并把 \n 替成 <br>
 */
export const formatTextWithTables = (
  text: string | undefined | null,
  images?: CellImagesMap
): string => {
  if (!text) return ''
  // 兼容后端导出时使用的换行占位符
  const normalized = text.replace(/<NEWLINE>/g, '\n')
  const withTables = renderTableBlocks(normalized, images)
  // 按占位符切分，逐段处理
  const segments = withTables.split(TABLE_SEG_RE)
  return segments
    .map(seg => {
      if (seg.startsWith(TABLE_OPEN) && seg.endsWith(TABLE_CLOSE)) {
        return seg.slice(1, -1) // 表格 HTML 原样
      }
      return escapeHtml(seg).replace(/\n/g, '<br>')
    })
    .join('')
}

/**
 * 从题目对象中构建 filename -> data URL 映射。
 * 同时考虑 stem_images / option_images / analysis_images 三个来源，表格内
 * 的图片依靠它们存在 base64 / content_type 才能渲染。
 */
export const buildQuestionImagesMap = (q: any): CellImagesMap => {
  const map: CellImagesMap = {}
  if (!q) return map
  const pushList = (arr: any) => {
    if (!Array.isArray(arr)) return
    for (const it of arr) {
      if (!it || !it.filename) continue
      if (map[it.filename]) continue
      // 优先使用后端提供的现成 url（如 image.url），其次拼 base64 为 data URL
      if (typeof it.url === 'string' && it.url) {
        map[it.filename] = it.url
      } else if (it.base64) {
        const ct = it.content_type || 'image/png'
        map[it.filename] = `data:${ct};base64,${it.base64}`
      }
    }
  }
  pushList(q.stem_images)
  pushList(q.analysis_images)
  // option_images: { A: [...], B: [...] }
  const optImgs = q.option_images || {}
  if (optImgs && typeof optImgs === 'object') {
    for (const k of Object.keys(optImgs)) pushList(optImgs[k])
  }
  // 选项本身包含的 images 字段（有些调用点传选项对象）
  if (Array.isArray(q.options)) {
    for (const opt of q.options) {
      if (opt && Array.isArray(opt.images)) pushList(opt.images)
    }
  }
  return map
}

/**
 * 提取文本中所有 [IMG:filename] 标记里的文件名，去重保序。
 */
export const extractImageMarkerFilenames = (text: string | null | undefined): string[] => {
  if (!text) return []
  const out: string[] = []
  const seen = new Set<string>()
  const re = /\[IMG:([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const fn = m[1]
    if (!seen.has(fn)) { seen.add(fn); out.push(fn) }
  }
  return out
}

/**
 * 从题干图片列表中过滤掉"已经以 [IMG:filename] 形式内联在 stem 文本里"的图片。
 * 用于题干图片卡片网格 v-if/v-for，避免与表格内的 <img> 重复显示。
 */
export const visibleStemImages = (q: any): any[] => {
  const stemImgs: any[] = (q && Array.isArray(q.stem_images)) ? q.stem_images : []
  if (stemImgs.length === 0) return []
  const inText = new Set(extractImageMarkerFilenames(q?.stem))
  if (inText.size === 0) return stemImgs
  return stemImgs.filter(it => !inText.has(it?.filename))
}

/**
 * 删除文本中指定文件名的 [IMG:filename] 标记（含相邻的多余空格）。
 */
export const removeImageMarker = (text: string, filename: string): string => {
  if (!text || !filename) return text || ''
  // 转义文件名中的正则特殊字符
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // 同时吃掉前后单空格，避免出现连续空格
  const re = new RegExp('[ \\t]?\\[IMG:' + escaped + '\\][ \\t]?', 'g')
  return text.replace(re, ' ').replace(/[ \t]{2,}/g, ' ')
}
