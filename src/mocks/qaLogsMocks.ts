/**
 * QA Logs 模拟数据
 */

import { mockDelay, generateId, randomDate } from './mockService';

// 模拟日志项
export interface MockQALogItem {
  id: string;
  timestamp: string;
  type: string;
  question: string;
  answer_preview: string;
  metadata: {
    user_id?: string;
    ip?: string;
    answer_type?: string;
  };
}

// 模拟日志详情
export interface MockQALogDetail extends MockQALogItem {
  answer: string;
}

// 模拟日志列表响应
export interface MockQALogListResponse {
  date: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: MockQALogItem[];
}

// 模拟日期列表响应
export interface MockQALogDatesResponse {
  dates: string[];
}

// 生成模拟问题
const MOCK_QUESTIONS = [
  '申根签证的90/180规则是什么？',
  '旅客持旅游签证入境，但声称是来访问亲友，应该如何处理？',
  '如何核查旅客的资金证明是否充足？',
  '144小时过境免签政策适用于哪些口岸？',
  '机组人员入境需要哪些证件？',
  '旅客护照有效期不足6个月可以入境吗？',
  '如何判断旅客是否有非法滞留风险？',
  '商务签证和旅游签证有什么区别？',
  '旅客携带超额现金入境如何处理？',
  '如何核实邀请函的真实性？',
];

// 生成模拟回答预览
const MOCK_ANSWER_PREVIEWS = [
  '根据申根签证规定，持证人在任意180天内最多可停留90天...',
  '需要核查旅客的入境目的与签证类型是否一致，并要求提供相关证明材料...',
  '资金证明核查应包括银行流水、存款证明等，需评估与行程是否匹配...',
  '144小时过境免签政策目前适用于北京、上海、广州等多个口岸...',
  '机组人员入境需持有效护照、机组人员证件及航班任务书...',
  '根据目的地国家要求，护照有效期通常需要超过预计停留期6个月以上...',
  '判断非法滞留风险需综合考虑旅客的经济状况、社会关系、出行记录等因素...',
  '商务签证主要用于商业活动，旅游签证用于观光旅游，两者在停留目的和所需材料上有所不同...',
  '携带超额现金入境需要向海关申报，超过规定限额可能需要提供资金来源证明...',
  '核实邀请函真实性可通过联系邀请方、核查公司信息、验证签名等方式进行...',
];

// 生成模拟完整回答
const MOCK_FULL_ANSWERS = [
  `## 申根签证90/180规则

申根签证的90/180规则是指：

1. **基本规则**：持申根签证的旅客在任意180天的滚动周期内，最多可以在申根区停留90天。

2. **计算方式**：
   - 从当前日期往前推180天
   - 计算这180天内已在申根区停留的总天数
   - 剩余可停留天数 = 90 - 已停留天数

3. **注意事项**：
   - 这是滚动计算，不是固定的半年周期
   - 每次入境都需要重新计算
   - 超期停留可能导致签证被取消或禁止入境

建议使用申根计算器辅助核算旅客的停留天数。`,

  `## 签证类型与入境目的核查

当旅客持旅游签证入境但声称访问亲友时：

### 核查要点
1. **确认签证类型**：旅游签证通常允许访问亲友活动
2. **要求提供证明**：
   - 被访者的联系方式
   - 具体地址
   - 邀请函（如有）
3. **评估合理性**：了解与被访者的关系

### 风险提示
- 无法提供具体信息可能存在目的不符风险
- 需关注是否有超范围停留或非法就业可能

### 处理建议
如信息不完整，可进行二次询问并记录。`,

  `## 资金证明核查指南

### 核查内容
1. **银行流水**：近3-6个月的账户流水
2. **存款证明**：冻结存款或活期余额
3. **收入证明**：工资单、纳税证明等

### 评估标准
- 资金是否足以覆盖预计停留期间的开支
- 资金来源是否合理
- 是否与申报行程匹配

### 参考标准
一般建议每天准备100-150欧元/美元的生活费用，具体根据目的地消费水平调整。

如资金证明不足，可参考《资金不足核查流程》进行处理。`,
];

// 生成模拟日志数据
const generateMockLogs = (date: string, count: number = 15): MockQALogItem[] => {
  const logs: MockQALogItem[] = [];
  const types = ['knowledge_qa_stream', 'knowledge_chat', 'conversation', 'mcq'];
  
  for (let i = 0; i < count; i++) {
    const questionIndex = Math.floor(Math.random() * MOCK_QUESTIONS.length);
    const type = types[Math.floor(Math.random() * types.length)];
    
    // 生成当天的随机时间
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    const timestamp = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    
    logs.push({
      id: `log_${date.replace(/-/g, '')}_${generateId()}`,
      timestamp,
      type,
      question: MOCK_QUESTIONS[questionIndex],
      answer_preview: MOCK_ANSWER_PREVIEWS[questionIndex],
      metadata: {
        user_id: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        answer_type: Math.random() > 0.5 ? 'RAG' : 'Direct',
      },
    });
  }
  
  // 按时间倒序排列
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// 缓存生成的日志数据
const logsCache: Record<string, MockQALogItem[]> = {};

// 获取或生成指定日期的日志
const getLogsForDate = (date: string): MockQALogItem[] => {
  if (!logsCache[date]) {
    logsCache[date] = generateMockLogs(date, 10 + Math.floor(Math.random() * 20));
  }
  return logsCache[date];
};

// 模拟获取日志列表
export const mockGetQALogsByDate = async (
  _token: string,
  params: {
    date?: string;
    user_id?: string;
    username?: string;
    page?: number;
    page_size?: number;
  }
): Promise<MockQALogListResponse> => {
  await mockDelay(400);
  
  const { user_id, username, page = 1, page_size = 20 } = params;
  // 如果没有指定日期，使用今天
  const date = params.date || new Date().toISOString().split('T')[0];
  let logs = getLogsForDate(date);
  
  // 按用户ID/用户名筛选（mock中用user_id字段兜底）
  const filterKey = user_id || username;
  if (filterKey) {
    logs = logs.filter(log => log.metadata.user_id?.includes(filterKey));
  }
  
  const total = logs.length;
  const total_pages = Math.ceil(total / page_size);
  const start = (page - 1) * page_size;
  const paginatedLogs = logs.slice(start, start + page_size);
  
  return {
    date,
    total,
    page,
    page_size,
    total_pages,
    logs: paginatedLogs,
  };
};

// 模拟获取日志详情
export const mockGetQALogDetail = async (
  _token: string,
  logId: string,
  date: string
): Promise<MockQALogDetail> => {
  await mockDelay(300);
  
  const logs = getLogsForDate(date);
  const log = logs.find(l => l.id === logId);
  
  if (!log) {
    throw new Error('日志不存在');
  }
  
  // 生成完整回答
  const answerIndex = Math.floor(Math.random() * MOCK_FULL_ANSWERS.length);
  
  return {
    ...log,
    answer: MOCK_FULL_ANSWERS[answerIndex],
  };
};

// 模拟获取可用日期列表
export const mockGetQALogDates = async (_token: string): Promise<MockQALogDatesResponse> => {
  await mockDelay(200);
  
  // 生成最近30天的日期
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // 随机跳过一些日期，模拟没有日志的天
    if (Math.random() > 0.2) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  return { dates };
};
