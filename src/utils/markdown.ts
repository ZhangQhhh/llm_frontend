import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import katex from 'katex';
import mermaid from 'mermaid';

/**
 * Markdown 渲染工具（完整版本）
 * 支持：
 * - 完整的 Markdown 语法
 * - 代码高亮
 * - 数学公式（LaTeX）
 * - Mermaid 图表
 * - XSS 防护
 * 适用于内网环境，所有依赖本地化
 */

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Arial, sans-serif',
});

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
    
    // 0.1 防御性处理：检测未闭合的代码块标记
    // 统计代码块标记（三个反引号）的数量
    const codeBlockMarkers = (normalizedMarkdown.match(/```/g) || []).length;
    
    // 如果代码块标记数量是奇数，说明有未闭合的代码块
    if (codeBlockMarkers % 2 !== 0) {
      console.warn('[Markdown] 检测到未闭合的代码块标记，已自动修复');
      // 在末尾添加闭合标记
      normalizedMarkdown += '\n```';
    }
    
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
    
    // 4. 代码高亮和 Mermaid 图表处理
    html = processCodeBlocks(html);
    
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

/**
 * 处理代码块：添加语法高亮、复制按钮、语言标签、Mermaid 图表
 */
function processCodeBlocks(html: string): string {
  let mermaidIndex = 0;
  
  // 匹配 <pre><code> 标签
  return html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
    const language = lang || 'plaintext';
    
    // 解码 HTML 实体
    const decodedCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // 检查是否是 Mermaid 图表
    if (language === 'mermaid') {
      const mermaidId = `mermaid-${Date.now()}-${mermaidIndex++}`;
      
      // 使用 setTimeout 异步渲染 Mermaid（避免阻塞）
      setTimeout(() => {
        const element = document.getElementById(mermaidId);
        if (element) {
          mermaid.render(`mermaid-svg-${mermaidId}`, decodedCode).then(({ svg }) => {
            element.innerHTML = svg;
          }).catch((err) => {
            console.error('Mermaid 渲染失败:', err);
            element.innerHTML = `<pre class="mermaid-error">${decodedCode}</pre>`;
          });
        }
      }, 0);
      
      return `
        <div class="mermaid-block">
          <div class="mermaid-header">
            <span class="language">Mermaid 图表</span>
          </div>
          <div id="${mermaidId}" class="mermaid-container">
            <div class="mermaid-loading">正在渲染图表...</div>
          </div>
        </div>
      `.trim();
    }
    
    // 普通代码块：代码高亮
    let highlighted: string;
    try {
      if (hljs.getLanguage(language)) {
        highlighted = hljs.highlight(decodedCode, { language }).value;
      } else {
        highlighted = hljs.highlightAuto(decodedCode).value;
      }
    } catch (err) {
      console.error('代码高亮失败:', err);
      highlighted = decodedCode;
    }
    
    // 返回带样式的代码块
    // 当语言为 plaintext 时不显示语言标签
    const languageLabel = language === 'plaintext' ? '' : `<span class="language">${language}</span>`;
    
    return `
      <div class="code-block">
        <div class="code-header">
          ${languageLabel}
          <button class="copy-btn" onclick="copyCode(this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            复制
          </button>
        </div>
        <pre><code class="hljs language-${language}">${highlighted}</code></pre>
      </div>
    `.trim();
  });
}

/**
 * 复制代码到剪贴板（需要在全局注册）
 */
export function setupCopyCode() {
  (window as any).copyCode = function(button: HTMLButtonElement) {
    const codeBlock = button.closest('.code-block');
    if (!codeBlock) return;
    
    const code = codeBlock.querySelector('code');
    if (!code) return;
    
    const text = code.textContent || '';
    
    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        已复制
      `;
      button.classList.add('copied');
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制');
    });
  };
}
