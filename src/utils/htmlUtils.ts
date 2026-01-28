/**
 * HTML工具函数
 */

/**
 * 转义HTML特殊字符
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * 判断是否为状态消息（用于过滤检索状态信息）
 */
const STATUS_KEYWORDS = [
  "正在进行混合检索",
  "正在使用 InsertBlock",
  "正在使用精准检索分析",
  "找到",
  "个可回答的节点",
  "未找到可直接回答的节点",
  "已找到相关资料，正在生成回答",
  "未找到高相关性资料，基于通用知识回答",
  "参考来源",
  "提示：系统正在逐个判断"
];

export function isStatusMessage(text: string): boolean {
  if (!text) return true;
  const normalized = text.replace(/\r/g, '');
  if (normalized.trim() === '') {
    // 仅包含换行时，保留用于渲染换行
    return !/\n/.test(normalized);
  }
  
  for (const keyword of STATUS_KEYWORDS) {
    if (text.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 进度信息接口
 */
export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
}

/**
 * 判断是否为进度消息
 * 格式: "📊 进度: 5/20 (25%)\n"
 */
export function isProgressMessage(text: string): boolean {
  return /📊\s*进度:\s*\d+\/\d+\s*\(\d+%\)/.test(text);
}

/**
 * 解析进度消息
 * 从 "📊 进度: 5/20 (25%)\n" 提取进度信息
 */
export function parseProgressMessage(text: string): ProgressInfo | null {
  const match = text.match(/📊\s*进度:\s*(\d+)\/(\d+)\s*\((\d+)%\)/);
  if (!match) return null;
  
  const current = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  const percentage = parseInt(match[3], 10);
  
  return { current, total, percentage };
}

/**
 * 判断是否为精准检索开始消息
 */
export function isPreciseRetrievalStart(text: string): boolean {
  return text.includes('正在使用精准检索分析') && text.includes('个文档');
}

/**
 * 解析精准检索开始消息，提取文档总数
 * 从 "正在使用精准检索分析 20 个文档..." 提取 20
 */
export function parsePreciseRetrievalStart(text: string): number | null {
  const match = text.match(/正在使用精准检索分析\s*(\d+)\s*个文档/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * 平滑滚动到元素
 */
export function smoothScrollTo(element: HTMLElement): void {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

/**
 * 滚动到容器底部
 */
export function scrollToBottom(container: HTMLElement): void {
  container.scrollTop = container.scrollHeight;
}
