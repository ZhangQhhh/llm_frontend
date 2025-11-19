// 测试 SSE 消息解析和换行符处理

// 模拟 parseSSEMessage 函数
function parseSSEMessage(raw) {
  let data = raw.trim();
  if (data.startsWith("data:")) {
    data = data.substring(5).trim();
  }

  if (data.startsWith("CONTENT:")) {
    return { type: 'CONTENT', data: data.substring(8).replace(/<NEWLINE>/g, "\n") };
  }
  
  return { type: 'UNKNOWN', data };
}

// 测试用例
console.log('=== SSE 消息解析测试 ===\n');

// 测试1：后端发送的原始消息（包含 <NEWLINE>）
const rawMessage1 = 'data: CONTENT:第一行<NEWLINE>第二行<NEWLINE>第三行';
console.log('测试1: 后端发送的原始消息');
console.log('输入:', JSON.stringify(rawMessage1));
const parsed1 = parseSSEMessage(rawMessage1);
console.log('解析后 type:', parsed1.type);
console.log('解析后 data:', JSON.stringify(parsed1.data));
console.log('data 实际内容:', parsed1.data);
console.log('data 包含真正的换行符?', parsed1.data.includes('\n'));
console.log('');

// 测试2：验证 replace 是否正确工作
const testString = '第一行<NEWLINE>第二行';
console.log('测试2: replace 函数验证');
console.log('输入:', JSON.stringify(testString));
console.log('replace 前包含 <NEWLINE>?', testString.includes('<NEWLINE>'));
const replaced = testString.replace(/<NEWLINE>/g, '\n');
console.log('replace 后:', JSON.stringify(replaced));
console.log('replace 后包含真正的 \\n?', replaced.includes('\n'));
console.log('');

// 测试3：模拟完整流程
console.log('测试3: 完整流程模拟');
const sseMessage = 'data: CONTENT:第一行<NEWLINE>第二行<NEWLINE>第三行';
console.log('1. 后端发送:', JSON.stringify(sseMessage));

const parsed = parseSSEMessage(sseMessage);
console.log('2. parseSSEMessage 处理后:', JSON.stringify(parsed.data));

// 模拟页面中的额外 replace（应该不会有影响）
const afterPageReplace = parsed.data.replace(/<NEWLINE>/g, '\n');
console.log('3. 页面再次 replace 后:', JSON.stringify(afterPageReplace));
console.log('4. 两次处理结果相同?', parsed.data === afterPageReplace);
console.log('');

// 测试4：验证正则表达式
console.log('测试4: 正则表达式验证');
const str1 = 'hello<NEWLINE>world';  // <NEWLINE> 标记
const str2 = 'hello\nworld';   // 真正的换行符
console.log('<NEWLINE> 标记:', JSON.stringify(str1));
console.log('匹配 /<NEWLINE>/g?', /<NEWLINE>/g.test(str1));
console.log('真正的 \\n:', JSON.stringify(str2));
console.log('匹配 /<NEWLINE>/g?', /<NEWLINE>/g.test(str2));
