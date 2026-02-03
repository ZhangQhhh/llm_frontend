import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';

/**
 * Markdown rendering utilities.
 * Supports:
 * - Markdown basics
 * - KaTeX math
 * - XSS sanitization
 * Local dependencies only.
 */

// 配置 marked - 使用 GitHub 风格的 Markdown
marked.setOptions({
  gfm: true,           // 启用 GitHub 风格的 Markdown
  breaks: true,        // 将换行符转换为 <br>
  pedantic: false,     // 不使用严格模式
});

/**
 * 渲染 Markdown 文本为 HTML
 * @param markdown Markdown 文本
 * @returns 安全的 HTML 字符串
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  try {
    // 0. 预处理：将 <NEWLINE> 转换为真实换行符 \n
    let normalizedMarkdown = markdown.replace(/<NEWLINE>/g, '\n');
    
    // 0.05 移除 <think>...</think> 标签（思考过程不应显示在正文中）
    // 某些模型（如千问增强）可能在 CONTENT 消息中包含思考标签
    normalizedMarkdown = normalizedMarkdown.replace(/<think>[\s\S]*?<\/think>/gi, '');
    // 移除可能残留的单独标签
    normalizedMarkdown = normalizedMarkdown.replace(/<\/?think>/gi, '');
    
    // 0.1 Skip code block handling for this app
    
    // 0.5. 确保 marked 能正确处理换行：
    // 1. 先将所有 \n 替换为临时标记（避免重复处理）
    // 2. 将单个换行符标记替换为两个空格+换行符（Markdown 硬换行）
    // 3. 将双换行符标记恢复为双换行（段落分隔）
    normalizedMarkdown = normalizedMarkdown
      .replace(/\n\n/g, '___DOUBLE_NEWLINE___')  // 保护双换行
      .replace(/\n/g, '  \n')                      // 单换行转为硬换行
      .replace(/___DOUBLE_NEWLINE___/g, '\n\n');   // 恢复双换行
    
    // 1. 预处理：提取并替换数学公式（避免被 Markdown 解析）
    const { text: processedMarkdown, mathBlocks } = extractMathBlocks(normalizedMarkdown);
    
    // 2. 使用 marked 转换 Markdown 为 HTML
    let html = marked.parse(processedMarkdown) as string;
    
    // 3. 恢复并渲染数学公式
    html = restoreMathBlocks(html, mathBlocks);
    
    // 4. 业务不渲染代码块，跳过代码块增强处理
    
    // 5. 使用 DOMPurify 清理 HTML，防止 XSS 攻击
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'u', 's', 'code', 'pre',
        'ul', 'ol', 'li',
        'blockquote',
        'a',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span',
        'img',
        'button', 'svg', 'path', 'rect', 'polyline',
        'g', 'text', 'line', 'circle', 'ellipse', 'polygon',
        'foreignObject', 'marker', 'defs', 'style'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel',
        'class', 'id', 'style',
        'src', 'alt', 'width', 'height',
        'start',
        'onclick',
        'viewBox', 'fill', 'stroke', 'stroke-width',
        'd', 'x', 'y', 'rx', 'ry', 'points', 'cx', 'cy', 'r',
        'x1', 'y1', 'x2', 'y2',
        'transform', 'text-anchor', 'dominant-baseline',
        'font-size', 'font-family', 'font-weight',
        'marker-end', 'marker-start'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    });
    
    return cleanHtml;
  } catch (error) {
    console.error('Markdown 渲染失败:', error);
    return markdown;
  }
}

/**
 * 提取数学公式块（避免被 Markdown 解析器处理）
 */
function extractMathBlocks(text: string): { text: string; mathBlocks: string[] } {
  const mathBlocks: string[] = [];
  let index = 0;

  // 提取块级公式 $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    mathBlocks.push(formula.trim());
    return `__MATH_BLOCK_${index++}__`;
  });

  // 提取行内公式 $...$
  text = text.replace(/\$([^\n]+?)\$/g, (match, formula) => {
    mathBlocks.push(formula.trim());
    return `__MATH_INLINE_${index++}__`;
  });

  return { text, mathBlocks };
}

/**
 * 恢复并渲染数学公式
 */
function restoreMathBlocks(html: string, mathBlocks: string[]): string {

  // 恢复块级公式
  html = html.replace(/__MATH_BLOCK_(\d+)__/g, (match, idx) => {
    const formula = mathBlocks[parseInt(idx)];
    try {
      const rendered = katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
      return `<div class="math-block">${rendered}</div>`;
    } catch (err) {
      console.error('数学公式渲染失败:', err);
      return `<div class="math-error">$$${formula}$$</div>`;
    }
  });

  // 恢复行内公式
  html = html.replace(/__MATH_INLINE_(\d+)__/g, (match, idx) => {
    const formula = mathBlocks[parseInt(idx)];
    try {
      const rendered = katex.renderToString(formula, {
        displayMode: false,
        throwOnError: false,
        output: 'html',
      });
      return `<span class="math-inline">${rendered}</span>`;
    } catch (err) {
      console.error('数学公式渲染失败:', err);
      return `<span class="math-error">$${formula}$</span>`;
    }
  });

  return html;
}
