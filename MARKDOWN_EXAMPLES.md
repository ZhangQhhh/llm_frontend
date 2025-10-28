# Markdown 高级功能使用示例

## 1. 数学公式（LaTeX）

### 行内公式
使用单个 `$` 包裹公式：

```markdown
这是一个行内公式：$E = mc^2$，爱因斯坦的质能方程。

勾股定理：$a^2 + b^2 = c^2$
```

**效果：**
这是一个行内公式：$E = mc^2$，爱因斯坦的质能方程。

### 块级公式
使用双 `$$` 包裹公式：

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

**效果：**
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### 更多数学公式示例

#### 矩阵
```markdown
$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
$$
```

#### 求和
```markdown
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

#### 分数
```markdown
$$
\frac{d}{dx}\left(\frac{1}{x}\right) = -\frac{1}{x^2}
$$
```

#### 希腊字母
```markdown
$\alpha, \beta, \gamma, \Delta, \Omega$
```

---

## 2. Mermaid 图表

### 流程图
````markdown
```mermaid
graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E
```
````

### 时序图
````markdown
```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 后端
    participant 数据库
    
    用户->>前端: 发送请求
    前端->>后端: API调用
    后端->>数据库: 查询数据
    数据库-->>后端: 返回结果
    后端-->>前端: 返回数据
    前端-->>用户: 显示结果
```
````

### 类图
````markdown
```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```
````

### 状态图
````markdown
```mermaid
stateDiagram-v2
    [*] --> 待审核
    待审核 --> 审核中: 开始审核
    审核中 --> 已通过: 审核通过
    审核中 --> 已拒绝: 审核拒绝
    已通过 --> [*]
    已拒绝 --> [*]
```
````

### 甘特图
````markdown
```mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 设计阶段
    需求分析           :a1, 2024-01-01, 7d
    UI设计            :a2, after a1, 5d
    section 开发阶段
    前端开发          :b1, after a2, 10d
    后端开发          :b2, after a2, 12d
    section 测试阶段
    集成测试          :c1, after b1 b2, 5d
    上线部署          :c2, after c1, 2d
```
````

### 饼图
````markdown
```mermaid
pie title 编程语言使用占比
    "JavaScript" : 35
    "Python" : 25
    "Java" : 20
    "Go" : 12
    "其他" : 8
```
````

### ER图（实体关系图）
````markdown
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    
    USER {
        int id PK
        string username
        string email
    }
    ORDER {
        int id PK
        int user_id FK
        date order_date
    }
    PRODUCT {
        int id PK
        string name
        decimal price
    }
```
````

---

## 3. 代码高亮

### Python
````markdown
```python
def fibonacci(n):
    """计算斐波那契数列"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 测试
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
```
````

### JavaScript
````markdown
```javascript
// React 组件示例
const Counter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};
```
````

### Java
````markdown
```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // 使用 Stream API
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
        int sum = numbers.stream()
                        .mapToInt(Integer::intValue)
                        .sum();
    }
}
```
````

### SQL
````markdown
```sql
SELECT 
    u.username,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= '2024-01-01'
GROUP BY u.id, u.username
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC;
```
````

---

## 4. 表格

### 基础表格
```markdown
| 姓名 | 年龄 | 职位 |
|------|------|------|
| 张三 | 28 | 工程师 |
| 李四 | 32 | 设计师 |
| 王五 | 25 | 产品经理 |
```

### 对齐方式
```markdown
| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:--------:|-------:|
| 内容1  | 内容2    | 内容3  |
| A      | B        | C      |
```

---

## 5. 列表

### 任务列表
```markdown
- [x] 完成需求分析
- [x] 设计数据库
- [ ] 实现API接口
- [ ] 编写测试用例
- [ ] 部署上线
```

### 嵌套列表
```markdown
1. 第一项
   - 子项 1.1
   - 子项 1.2
     - 子子项 1.2.1
2. 第二项
   1. 子项 2.1
   2. 子项 2.2
```

---

## 6. 引用和提示

### 普通引用
```markdown
> 这是一段引用文本。
> 可以包含多行。
>
> 甚至可以包含段落。
```

### 嵌套引用
```markdown
> 第一层引用
>> 第二层引用
>>> 第三层引用
```

---

## 7. 链接和图片

### 链接
```markdown
[普通链接](https://example.com)
[带标题的链接](https://example.com "这是标题")
```

### 图片
```markdown
![图片描述](image.png)
![带链接的图片](image.png "图片标题")
```

---

## 8. 综合示例

### 技术文档示例

````markdown
# 用户认证系统

## 概述
本系统实现了基于 JWT 的用户认证功能。

## 流程图
```mermaid
sequenceDiagram
    participant C as 客户端
    participant S as 服务器
    participant D as 数据库
    
    C->>S: POST /login {username, password}
    S->>D: 查询用户
    D-->>S: 返回用户信息
    S->>S: 验证密码
    S-->>C: 返回 JWT Token
```

## 核心算法

JWT Token 生成公式：

$$
Token = Base64(Header) + "." + Base64(Payload) + "." + HMAC(Secret, Data)
$$

## 代码实现

```python
import jwt
from datetime import datetime, timedelta

def generate_token(user_id: int) -> str:
    """生成 JWT Token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
```

## 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| QPS | 10000+ | 每秒查询数 |
| 响应时间 | <50ms | 平均响应时间 |
| 成功率 | 99.9% | 认证成功率 |

## 任务清单

- [x] 实现登录接口
- [x] 实现 Token 验证
- [ ] 添加刷新 Token 功能
- [ ] 实现单点登录
````

---

## 9. 注意事项

### 数学公式
- 使用 `$` 包裹行内公式
- 使用 `$$` 包裹块级公式
- 支持完整的 LaTeX 语法
- 公式中的特殊字符需要转义

### Mermaid 图表
- 代码块语言标记为 `mermaid`
- 支持多种图表类型
- 图表会异步渲染
- 复杂图表可能需要一些时间

### 代码高亮
- 支持 100+ 种编程语言
- 自动检测语言（如果未指定）
- 所有代码块都有复制按钮
- 使用 Atom One Dark 主题

---

## 10. 更多资源

- [KaTeX 支持的函数](https://katex.org/docs/supported.html)
- [Mermaid 文档](https://mermaid.js.org/)
- [Highlight.js 支持的语言](https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md)
- [Markdown 语法指南](https://www.markdownguide.org/)
