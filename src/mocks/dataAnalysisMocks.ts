/**
 * 数据分析系统模拟数据
 */

import { mockDelay } from './mockService';

// 模拟生成分析报告
export const mockGenerateReport = async (
  _previousFile: File,
  _currentFile: File
): Promise<Blob> => {
  await mockDelay(2000); // 模拟较长的处理时间
  
  // 创建一个模拟的 Word 文档内容（实际上是文本）
  const mockContent = `
数据分析报告（模拟数据）
========================

生成时间：${new Date().toLocaleString('zh-CN')}

一、数据概览
-----------
往年数据文件：已接收
今年数据文件：已接收

二、数据对比分析
---------------
1. 总体趋势
   - 数据量同比增长 15.3%
   - 平均值提升 8.7%
   - 峰值出现在第三季度

2. 关键指标变化
   - 指标A：+12.5%
   - 指标B：-3.2%
   - 指标C：+28.9%

3. 异常数据点
   - 发现 3 处异常波动
   - 建议进一步核查

三、结论与建议
-------------
1. 整体数据呈现良好增长态势
2. 建议关注指标B的下降趋势
3. 第三季度表现突出，可作为参考

---
注：此为模拟数据，仅供演示使用
`;

  // 创建 Blob
  const blob = new Blob([mockContent], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
  
  return blob;
};

// 模拟报告下载响应
export interface MockReportResponse {
  data: Blob;
  headers: {
    'content-disposition': string;
  };
}

export const mockGenerateReportResponse = async (
  previousFile: File,
  currentFile: File
): Promise<MockReportResponse> => {
  const blob = await mockGenerateReport(previousFile, currentFile);
  
  const filename = `数据分析报告_${new Date().toISOString().slice(0, 10)}_模拟.docx`;
  
  return {
    data: blob,
    headers: {
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  };
};
