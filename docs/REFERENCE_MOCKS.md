## 本地参考文献模拟说明

为了在没有真实后端数据的情况下验证「参考来源」的新展示效果，新增了一个**完全可选**的模拟数据开关。默认情况下项目行为不变；只有当你显式打开开关时，相关页面才会注入示例问答与参考文献。

### 如何启用

任选以下任意一种方式（优先级从高到低）：

1. 在浏览器地址栏追加查询参数 `mockReferences=1`  
   - 示例：`http://localhost:8080/#/knowledge?mockReferences=1`
   - 多轮对话页同理：`http://localhost:8080/#/conversation?mockReferences=1`
2. 或者在浏览器控制台执行 `localStorage.setItem('ENABLE_REFERENCE_MOCKS', 'true')`
3. 或者在 `.env.development` 中设置 `VUE_APP_ENABLE_REFERENCE_MOCKS=true`

> 只要开关被关闭（移除参数 / localStorage 置为 `false` / 删除 env 设置），应用会立刻恢复正常联机逻辑。

### 生效范围

| 页面 | 效果 |
| --- | --- |
| `KnowledgeQAView` | 自动填充一段示例问答、思考过程以及 4 条参考文献，并显示检索来源/排名徽章。 |
| `ConversationView` | 会在对话区注入一轮示例对话，同时在参考侧边栏填充相同的 4 条文献数据。 |

模拟模式下，点击“发送”按钮不会再向后端发起请求，只是重新填充示例数据，确保不会影响真实业务。

### 模拟数据包含的新增字段

每条参考文献都包含以下新增字段的模拟数据：

- **retrievalSources**: 检索来源数组，包含 `['vector']`、`['keyword']` 或 `['vector', 'keyword']`
- **vectorScore**: 向量检索分数（4位小数），例如 `0.9234`
- **bm25Score**: BM25关键词检索分数（4位小数），例如 `18.4567`
- **vectorRank**: 向量检索排名（整数），例如 `1`（仅当 retrievalSources 包含 "vector" 时）
- **bm25Rank**: BM25检索排名（整数），例如 `3`（仅当 retrievalSources 包含 "keyword" 时）
- **matchedKeywords**: 匹配的关键词数组，例如 `['旅游签证', '入境', '核查']`

这些字段会在前端页面中以 Bootstrap 样式展示：
- 检索来源显示为蓝色（向量）或绿色（关键词）的 badge 标签
- 详细分数显示为浅蓝色 badge，包含分数和排名（如：📊 向量分: 0.9234 (排名#1)）
- 匹配关键词显示为黄色 badge 标签

### 关闭方式

- 移除地址栏中的 `mockReferences` 参数后刷新页面；
- 或在控制台执行 `localStorage.removeItem('ENABLE_REFERENCE_MOCKS')`；
- 或将 `.env` 中的 `VUE_APP_ENABLE_REFERENCE_MOCKS` 注释掉/设为 `false`。

这样即可在需要时快速查看 UI 效果，同时保证日常使用不受影响。***
