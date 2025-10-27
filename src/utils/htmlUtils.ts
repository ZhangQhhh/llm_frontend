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
  "找到",
  "个可回答的节点",
  "未找到可直接回答的节点",
  "已找到相关资料，正在生成回答",
  "未找到高相关性资料，基于通用知识回答",
  "参考来源"
];

export function isStatusMessage(text: string): boolean {
  if (!text || text.trim() === '') return true;
  
  for (const keyword of STATUS_KEYWORDS) {
    if (text.includes(keyword)) {
      return true;
    }
  }
  
  return false;
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
