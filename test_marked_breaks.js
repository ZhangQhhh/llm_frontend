// 测试 marked 对 breaks 的处理

const { marked } = require('marked');

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

// 测试用例
const testCases = [
  {
    name: '单个换行符',
    input: '第一行\n第二行',
    expected: '应该转换为 <br>'
  },
  {
    name: '双换行符',
    input: '第一段\n\n第二段',
    expected: '应该转换为两个 <p>'
  },
  {
    name: '多个单换行符',
    input: '第一行\n第二行\n第三行',
    expected: '应该转换为 <br>'
  },
  {
    name: '混合换行符',
    input: '第一行\n第二行\n\n第三段\n第四行',
    expected: '混合处理'
  }
];

console.log('=== marked breaks 测试 ===\n');

testCases.forEach(test => {
  console.log(`测试: ${test.name}`);
  console.log(`输入: ${JSON.stringify(test.input)}`);
  const output = marked.parse(test.input);
  console.log(`输出: ${output}`);
  console.log(`说明: ${test.expected}\n`);
});
