# 前端接入开发文档

本文档梳理当前服务能力与对接方式，面向前端调用与联调使用。

## 服务概览

- **报告生成**：上传 Excel，返回 Word 报告（docx）
- **进度查询**：轮询生成进度
- **预测数据**：基于历史数据输出未来趋势
- **文档管理**：上传/列表/预览/下载/删除，统一存放在 `sava_here/`
- **日志查询**：查询报告生成历史记录，支持分页和过滤

## 基本信息

- **默认服务地址**：`http://<host>:8030`
- **API 文档**：`http://<host>:8030/docs`（Swagger UI）
- **认证方式**：当服务端设置 `API_TOKEN` 环境变量时，所有接口需要请求头  
  ```
  Authorization: Bearer <token>
  ```
- **报告模板**：`template/report_templete.docx`
- **CORS 配置**：默认允许所有源，可通过 `CORS_ORIGINS` 环境变量配置

## 统一返回格式（JSON）

多数接口成功返回：

```json
{
  "success": true,
  "data": {}
}
```

发生错误时（由全局异常处理返回）：

```json
{
  "success": false,
  "code": 400,
  "message": "错误说明"
}
```

> 注意：文件预览/下载接口直接返回文件流（非 JSON）。

---

## 报告生成接口

### 1) 生成出入境综合报告

**POST** `/entryExit/summary-entrance-comprehensive`  
**Content-Type** `multipart/form-data`

#### 请求参数

**表单字段（multipart/form-data）：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `basePeriodFile` | File | 是* | Excel 文件（.xlsx），人员数据基准期月度表（可多文件） |
| `comparePeriodFile` | File | 是* | Excel 文件（.xlsx），人员数据对比期月度表（可多文件） |
| `previousYearFile` | File | 是* | Excel 文件（.xlsx），兼容旧参数名，等同于 `basePeriodFile` |
| `currentYearFile` | File | 是* | Excel 文件（.xlsx），兼容旧参数名，等同于 `comparePeriodFile` |
| `previousYearTrafficFile` | File | **是** | Excel 文件（.xlsx），航班数据基准期年度表 |
| `currentYearTrafficFile` | File | **是** | Excel 文件（.xlsx），航班数据对比期年度表 |
| `jobId` | String | 否 | 自定义任务 ID，用于后续查询进度。不提供则自动生成 UUID |
| `analysisMode` | String | 否 | 分析模式：`month`（默认）/ `year` |
| `months` | String | 否 | 月份过滤，逗号分隔，例：`"3,4"` 或 `"1,2,3"`，不传则按上传月份统计 |
| `username` | String | 否 | 操作用户名，用于日志记录和审计 |

> **说明**：
> - `*` 表示 `basePeriodFile`/`previousYearFile` 二选一必填，`comparePeriodFile`/`currentYearFile` 二选一必填
> - 字段名为"基准期/对比期"命名，但实际可用于任意两个对比周期，例如 2025 年 4 月 vs 2025 年 9 月
> - 系统会将 `basePeriodFile` 视为"对比基准"，`comparePeriodFile` 视为"对比期"
> - 所有 Excel 文件必须为 `.xlsx` 格式，`.xls` 格式不支持
> - 支持多文件上传：同名字段可重复上传多份月表，后台会自动合并统计（给多少分析多少）
> - months 不传/传 "全年"/"all" 表示不过滤，按上传月份统计
> - `analysisMode=year` 表示按年分析（通常不传 `months`），按年仍需 4 张表（人员基准/人员对比 + 航班基准/航班对比）
> - `analysisMode=month` 时航班表为逐航班明细表（每行一班）；不传 `months` 也可正常统计，若传 `months` 请确保与表内月份一致

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

- **Content-Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Body**: Word 文档文件流（.docx）
- **Headers**:
  - `X-Job-Id`: 任务 ID，用于查询进度
  - `Content-Disposition`: `attachment; filename="数据分析报告.docx"`

**错误响应：**

```json
{
  "success": false,
  "code": 400,
  "message": "错误说明"
}
```

常见错误码：
- `400`: 参数错误或文件格式不正确
- `401`: 未授权（Token 无效或缺失）
- `408`: 报告生成超时
- `500`: 服务器内部错误

#### 请求示例

**cURL：**

```bash
curl -X POST "http://localhost:8030/entryExit/summary-entrance-comprehensive" \
  -H "Authorization: Bearer your_token_here" \
  -F "basePeriodFile=@/path/to/2024年数据.xlsx" \
  -F "comparePeriodFile=@/path/to/2025年数据.xlsx" \
  -F "previousYearTrafficFile=@/path/to/航班表2024.xlsx" \
  -F "currentYearTrafficFile=@/path/to/航班表2025.xlsx" \
  -F "analysisMode=month" \
  -F "months=3,4,5" \
  -F "username=张三" \
  -F "jobId=custom-job-123"
```

**JavaScript (Fetch API)：**

```javascript
const formData = new FormData();
basePeriodFiles.forEach(file => formData.append('basePeriodFile', file));
comparePeriodFiles.forEach(file => formData.append('comparePeriodFile', file));
formData.append('previousYearTrafficFile', previousYearTrafficFile);
formData.append('currentYearTrafficFile', currentYearTrafficFile);
formData.append('analysisMode', 'month');
formData.append('months', '3,4,5');
formData.append('username', '张三');

const response = await fetch('http://localhost:8030/entryExit/summary-entrance-comprehensive', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token_here'
  },
  body: formData
});

if (response.ok) {
  const jobId = response.headers.get('X-Job-Id');
  const blob = await response.blob();
  // 下载文件
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '数据分析报告.docx';
  a.click();
} else {
  const error = await response.json();
  console.error(error.message);
}
```

**Axios：**

```javascript
const formData = new FormData();
basePeriodFiles.forEach(file => formData.append('basePeriodFile', file));
comparePeriodFiles.forEach(file => formData.append('comparePeriodFile', file));
formData.append('previousYearTrafficFile', previousYearTrafficFile);
formData.append('currentYearTrafficFile', currentYearTrafficFile);
formData.append('analysisMode', 'month');
formData.append('months', '3,4,5');
formData.append('username', '张三');

try {
  const response = await axios.post(
    'http://localhost:8030/entryExit/summary-entrance-comprehensive',
    formData,
    {
      headers: {
        'Authorization': 'Bearer your_token_here',
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    }
  );
  
  const jobId = response.headers['x-job-id'];
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '数据分析报告.docx');
  document.body.appendChild(link);
  link.click();
  link.remove();
} catch (error) {
  console.error(error.response.data);
}
```

---

### 2) 生成仅人员数据报告

**POST** `/entry-exit/generate-full-report`  
**Content-Type** `multipart/form-data`

> **注意**：此接口同时支持两个路径前缀：`/entryExit/generate-full-report` 和 `/entry-exit/generate-full-report`

#### 请求参数

**表单字段（multipart/form-data）：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `basePeriodFile` | File | 是* | Excel 文件（.xlsx），人员数据基准期月度表（可多文件） |
| `comparePeriodFile` | File | 是* | Excel 文件（.xlsx），人员数据对比期月度表（可多文件） |
| `previousYearFile` | File | 是* | Excel 文件（.xlsx），兼容旧参数名，等同于 `basePeriodFile` |
| `currentYearFile` | File | 是* | Excel 文件（.xlsx），兼容旧参数名，等同于 `comparePeriodFile` |
| `jobId` | String | 否 | 自定义任务 ID，用于后续查询进度。不提供则自动生成 UUID |
| `months` | String | 否 | 月份过滤，逗号分隔，例：`"3,4"` 或 `"1,2,3"`，不传则按上传月份统计 |

> **说明**：
> - `*` 表示 `basePeriodFile`/`previousYearFile` 二选一必填，`comparePeriodFile`/`currentYearFile` 二选一必填
> - 此接口不包含航班数据分析，仅生成人员数据报告
> - 所有 Excel 文件必须为 `.xlsx` 格式
> - 支持多文件上传：同名字段可重复上传多份月表，后台会自动合并统计（给多少分析多少）
> - months 不传/传 "全年"/"all" 表示不过滤，按上传月份统计

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

- **Content-Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Body**: Word 文档文件流（.docx）
- **Headers**:
  - `X-Job-Id`: 任务 ID
  - `Content-Disposition`: `attachment; filename="数据分析报告.docx"`

**错误响应：** 同上

#### 请求示例

```bash
curl -X POST "http://localhost:8030/entry-exit/generate-full-report" \
  -H "Authorization: Bearer your_token_here" \
  -F "basePeriodFile=@/path/to/2024年数据.xlsx" \
  -F "comparePeriodFile=@/path/to/2025年数据.xlsx" \
  -F "months=1,2,3"
```

---

### 3) 查询报告生成进度

**GET** `/entryExit/summary-entrance-comprehensive/progress/{job_id}`

#### 请求参数

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `job_id` | String | **是** | 任务 ID，从报告生成接口的响应头 `X-Job-Id` 获取 |

**请求头：** 无需认证

#### 响应

**成功响应：**

```json
{
  "jobId": "abc123",
  "stage": "llm_extended",
  "percent": 70,
  "done": false,
  "updatedAt": 1700000000
}
```

**字段说明：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `jobId` | String | 任务 ID |
| `stage` | String | 当前处理阶段，见下方阶段说明 |
| `percent` | Integer | 完成百分比（0-100） |
| `done` | Boolean | 是否完成 |
| `updatedAt` | Integer | 最后更新时间（Unix 时间戳） |

**处理阶段（stage）说明：**

| 阶段值 | 说明 | 预估进度 |
|--------|------|----------|
| `start` | 开始处理 | 0% |
| `load_people` | 加载人员数据 | 10% |
| `load_flights` | 加载航班数据 | 20% |
| `compute_metrics` | 计算指标 | 30% |
| `llm_basic` | LLM 基础分析 | 50% |
| `llm_extended` | LLM 深度分析 | 70% |
| `charts` | 生成图表 | 85% |
| `render` | 渲染报告 | 95% |
| `done` | 完成 | 100% |

#### 请求示例

```bash
curl -X GET "http://localhost:8030/entryExit/summary-entrance-comprehensive/progress/abc123"
```

```javascript
// 轮询进度示例
async function pollProgress(jobId) {
  const interval = setInterval(async () => {
    const response = await fetch(
      `http://localhost:8030/entryExit/summary-entrance-comprehensive/progress/${jobId}`
    );
    const progress = await response.json();
    
    console.log(`进度: ${progress.percent}% - ${progress.stage}`);
    
    if (progress.done) {
      clearInterval(interval);
      console.log('报告生成完成！');
    }
  }, 2000); // 每2秒查询一次
}
```

---

## 预测接口

### 4) 总量预测

**GET** `/entryExit/forecast-total`

基于历史数据预测未来出入境人员总量趋势。

#### 请求参数

**查询参数（Query String）：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `steps` | Integer | 否 | 6 | 预测未来月数，范围：1-24 |

**请求头：** 无需认证

#### 响应

**成功响应：**

```json
{
  "success": true,
  "data": {
    "history": [
      {"year": 2024, "month": 1, "totalCount": 18000}
    ],
    "forecast": [
      {"year": 2025, "month": 1, "totalCount": 20000}
    ],
    "model": "ARMA(1,0,1)",
    "generatedAt": "2026-02-03T00:00:00"
  }
}
```

**字段说明：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `history` | Array | 历史月度总量（按年/月） |
| `forecast` | Array | 预测月度总量（按年/月） |
| `model` | String | 使用的模型或回退策略 |
| `generatedAt` | String | 生成时间（ISO 8601） |

#### 请求示例

```bash
curl -X GET "http://localhost:8030/entryExit/forecast-total?steps=12"
```

```javascript
const response = await fetch('http://localhost:8030/entryExit/forecast-total?steps=12');
const result = await response.json();

if (result.success) {
  console.log(result.data.forecast);
}
```

---

### 4.1) 交通工具总量预测

**GET** `/entryExit/forecast-traffic-tools`

基于历史数据预测交通工具总量趋势（对应 `data/traffic_tool_history.csv`）。

#### 请求参数

**查询参数（Query String）：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `steps` | Integer | 否 | 6 | 预测未来月数，范围：1-24 |

**请求头：** 无需认证

#### 响应

**成功响应：** 与“总量预测”一致，`data.forecast` 返回交通工具总量预测结果。

#### 请求示例

```bash
curl -X GET "http://localhost:8030/entryExit/forecast-traffic-tools?steps=12"
```

```javascript
const response = await fetch('http://localhost:8030/entryExit/forecast-traffic-tools?steps=12');
const result = await response.json();

if (result.success) {
  console.log(result.data.forecast);
}
```

## 文档管理接口

文档统一保存至服务器 `sava_here/` 目录。

### 5) 上传文档

**POST** `/documents/upload`  
**Content-Type** `multipart/form-data`

#### 请求参数

**表单字段（multipart/form-data）：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `file` | File | **是** | - | Word 文件（`.doc` 或 `.docx`） |
| `overwrite` | Boolean | 否 | false | 是否覆盖同名文件 |

**overwrite 参数说明：**
- `true`：同名文件直接覆盖
- `false`：自动追加时间戳后缀（如 `报告_20260129153010.docx`），避免覆盖

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

```json
{
  "success": true,
  "data": {
    "name": "报告.docx",
    "size": 123456,
    "createdAt": "2026-01-29T15:30:10",
    "updatedAt": "2026-01-29T15:30:10",
    "createdAtEpoch": 1769412610,
    "updatedAtEpoch": 1769412610,
    "previewUrl": "/documents/%E6%8A%A5%E5%91%8A.docx/preview",
    "downloadUrl": "/documents/%E6%8A%A5%E5%91%8A.docx/download"
  }
}
```

**字段说明：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `name` | String | 文件名（URL 编码前） |
| `size` | Integer | 文件大小（字节） |
| `createdAt` | String | 创建时间（ISO 8601 格式） |
| `updatedAt` | String | 更新时间（ISO 8601 格式） |
| `createdAtEpoch` | Integer | 创建时间（Unix 时间戳） |
| `updatedAtEpoch` | Integer | 更新时间（Unix 时间戳） |
| `previewUrl` | String | 预览 URL（相对路径，URL 编码） |
| `downloadUrl` | String | 下载 URL（相对路径，URL 编码） |

#### 请求示例

```bash
curl -X POST "http://localhost:8030/documents/upload" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/报告.docx" \
  -F "overwrite=false"
```

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('overwrite', 'false');

const response = await fetch('http://localhost:8030/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_token_here'
  },
  body: formData
});

const result = await response.json();
if (result.success) {
  console.log('文件上传成功:', result.data.name);
  console.log('预览地址:', result.data.previewUrl);
}
```

---

### 6) 获取文档列表

**GET** `/documents`

获取所有已上传的文档列表，按更新时间倒序排列（最新的在前）。

#### 请求参数

无查询参数

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

```json
{
  "success": true,
  "data": [
    {
      "name": "报告.docx",
      "size": 123456,
      "createdAt": "2026-01-29T15:30:10",
      "updatedAt": "2026-01-29T15:30:10",
      "createdAtEpoch": 1769412610,
      "updatedAtEpoch": 1769412610,
      "previewUrl": "/documents/%E6%8A%A5%E5%91%8A.docx/preview",
      "downloadUrl": "/documents/%E6%8A%A5%E5%91%8A.docx/download"
    },
    {
      "name": "月度分析.docx",
      "size": 98765,
      "createdAt": "2026-01-28T10:20:30",
      "updatedAt": "2026-01-28T10:20:30",
      "createdAtEpoch": 1769306430,
      "updatedAtEpoch": 1769306430,
      "previewUrl": "/documents/%E6%9C%88%E5%BA%A6%E5%88%86%E6%9E%90.docx/preview",
      "downloadUrl": "/documents/%E6%9C%88%E5%BA%A6%E5%88%86%E6%9E%90.docx/download"
    }
  ]
}
```

**字段说明：** 同上传接口返回字段

#### 请求示例

```bash
curl -X GET "http://localhost:8030/documents" \
  -H "Authorization: Bearer your_token_here"
```

```javascript
const response = await fetch('http://localhost:8030/documents', {
  headers: {
    'Authorization': 'Bearer your_token_here'
  }
});

const result = await response.json();
if (result.success) {
  result.data.forEach(doc => {
    console.log(`${doc.name} - ${doc.size} 字节 - ${doc.updatedAt}`);
  });
}
```

---

### 7) 预览文档

**GET** `/documents/{filename}/preview`

在浏览器中预览文档（inline 模式）。

#### 请求参数

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `filename` | String | **是** | 文件名，需要 URL 编码（如 `%E6%8A%A5%E5%91%8A.docx`） |

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

- **Content-Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Content-Disposition**: `inline; filename="报告.docx"`
- **Body**: 文件流

#### 请求示例

```bash
curl -X GET "http://localhost:8030/documents/%E6%8A%A5%E5%91%8A.docx/preview" \
  -H "Authorization: Bearer your_token_here"
```

```javascript
// 在新标签页中预览
const filename = encodeURIComponent('报告.docx');
window.open(`http://localhost:8030/documents/${filename}/preview`, '_blank');
```

---

### 8) 下载文档

**GET** `/documents/{filename}/download`

下载文档到本地（attachment 模式）。

#### 请求参数

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `filename` | String | **是** | 文件名，需要 URL 编码 |

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

- **Content-Type**: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Content-Disposition**: `attachment; filename="报告.docx"`
- **Body**: 文件流

#### 请求示例

```bash
curl -X GET "http://localhost:8030/documents/%E6%8A%A5%E5%91%8A.docx/download" \
  -H "Authorization: Bearer your_token_here" \
  -o "报告.docx"
```

```javascript
// 触发浏览器下载
async function downloadDocument(filename) {
  const encodedFilename = encodeURIComponent(filename);
  const response = await fetch(
    `http://localhost:8030/documents/${encodedFilename}/download`,
    {
      headers: {
        'Authorization': 'Bearer your_token_here'
      }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

### 9) 删除文档

**DELETE** `/documents/{filename}`

从服务器删除指定文档。

#### 请求参数

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `filename` | String | **是** | 文件名，需要 URL 编码 |

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

```json
{
  "success": true,
  "data": {
    "name": "报告.docx"
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "code": 404,
  "message": "文件不存在"
}
```

#### 请求示例

```bash
curl -X DELETE "http://localhost:8030/documents/%E6%8A%A5%E5%91%8A.docx" \
  -H "Authorization: Bearer your_token_here"
```

```javascript
async function deleteDocument(filename) {
  const encodedFilename = encodeURIComponent(filename);
  const response = await fetch(
    `http://localhost:8030/documents/${encodedFilename}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer your_token_here'
      }
    }
  );
  
  const result = await response.json();
  if (result.success) {
    console.log('文档已删除:', result.data.name);
  }
}
```

---

## 日志查询接口

### 10) 获取报告生成日志列表

**GET** `/logs/report-generation`

查询报告生成历史记录，支持分页和多条件过滤。

#### 请求参数

**查询参数（Query String）：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `page` | Integer | 否 | 1 | 页码，从 1 开始 |
| `page_size` | Integer | 否 | 20 | 每页条数，范围：1-100 |
| `username` | String | 否 | - | 按用户名过滤 |
| `status` | String | 否 | - | 按状态过滤：`started`/`completed`/`failed` |
| `start_date` | String | 否 | - | 开始日期，ISO 8601 格式，如 `2024-01-01T00:00:00` |
| `end_date` | String | 否 | - | 结束日期，ISO 8601 格式，如 `2024-12-31T23:59:59` |

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

```json
{
  "success": true,
  "data": {
    "total": 156,
    "page": 1,
    "page_size": 20,
    "total_pages": 8,
    "logs": [
      {
        "job_id": "abc123def456",
        "username": "张三",
        "report_type": "comprehensive",
        "status": "completed",
        "created_at": "2026-01-29T15:30:10",
        "updated_at": "2026-01-29T15:35:20",
        "file_info": {
          "base_file": "2024年数据.xlsx",
          "compare_file": "2025年数据.xlsx",
          "flights_prev": "航班表2024.xlsx",
          "flights_curr": "航班表2025.xlsx",
          "months": "3,4,5",
          "output_file": "数据分析报告.docx",
          "file_size": 1234567
        },
        "error_message": null
      },
      {
        "job_id": "xyz789ghi012",
        "username": "李四",
        "report_type": "comprehensive",
        "status": "failed",
        "created_at": "2026-01-29T14:20:30",
        "updated_at": "2026-01-29T14:22:15",
        "file_info": {
          "base_file": "2024年数据.xlsx",
          "compare_file": "2025年数据.xlsx"
        },
        "error_message": "文件格式错误"
      }
    ]
  }
}
```

**字段说明：**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `total` | Integer | 总记录数 |
| `page` | Integer | 当前页码 |
| `page_size` | Integer | 每页条数 |
| `total_pages` | Integer | 总页数 |
| `logs` | Array | 日志记录列表 |
| `logs[].job_id` | String | 任务 ID |
| `logs[].username` | String | 操作用户名 |
| `logs[].report_type` | String | 报告类型：`comprehensive`（综合报告）/`people_only`（仅人员） |
| `logs[].status` | String | 状态：`started`/`completed`/`failed` |
| `logs[].created_at` | String | 创建时间（ISO 8601） |
| `logs[].updated_at` | String | 更新时间（ISO 8601） |
| `logs[].file_info` | Object | 文件信息（动态字段） |
| `logs[].error_message` | String/null | 错误信息（失败时） |

#### 请求示例

```bash
# 查询第1页，每页20条
curl -X GET "http://localhost:8030/logs/report-generation?page=1&page_size=20" \
  -H "Authorization: Bearer your_token_here"

# 查询指定用户的记录
curl -X GET "http://localhost:8030/logs/report-generation?username=张三&page=1" \
  -H "Authorization: Bearer your_token_here"

# 查询失败的记录
curl -X GET "http://localhost:8030/logs/report-generation?status=failed" \
  -H "Authorization: Bearer your_token_here"

# 按日期范围查询
curl -X GET "http://localhost:8030/logs/report-generation?start_date=2026-01-01T00:00:00&end_date=2026-01-31T23:59:59" \
  -H "Authorization: Bearer your_token_here"
```

```javascript
// 分页查询示例
async function fetchLogs(page = 1, filters = {}) {
  const params = new URLSearchParams({
    page: page,
    page_size: 20,
    ...filters
  });
  
  const response = await fetch(
    `http://localhost:8030/logs/report-generation?${params}`,
    {
      headers: {
        'Authorization': 'Bearer your_token_here'
      }
    }
  );
  
  const result = await response.json();
  if (result.success) {
    console.log(`总记录数: ${result.data.total}`);
    console.log(`当前页: ${result.data.page}/${result.data.total_pages}`);
    result.data.logs.forEach(log => {
      console.log(`${log.job_id} - ${log.username} - ${log.status}`);
    });
  }
}

// 使用示例
fetchLogs(1, { username: '张三', status: 'completed' });
```

---

### 11) 根据任务 ID 获取日志

**GET** `/logs/report-generation/{job_id}`

根据任务 ID 查询单条报告生成日志详情。

#### 请求参数

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `job_id` | String | **是** | 任务 ID |

**请求头：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Authorization` | String | 条件 | 格式：`Bearer <token>`，当服务端配置 `API_TOKEN` 时必填 |

#### 响应

**成功响应：**

```json
{
  "success": true,
  "data": {
    "job_id": "abc123def456",
    "username": "张三",
    "report_type": "comprehensive",
    "status": "completed",
    "created_at": "2026-01-29T15:30:10",
    "updated_at": "2026-01-29T15:35:20",
    "file_info": {
      "base_file": "2024年数据.xlsx",
      "compare_file": "2025年数据.xlsx",
      "flights_prev": "航班表2024.xlsx",
      "flights_curr": "航班表2025.xlsx",
      "months": "3,4,5",
      "output_file": "数据分析报告.docx",
      "file_size": 1234567
    },
    "error_message": null
  }
}
```

**日志不存在时：**

```json
{
  "success": false,
  "message": "日志不存在"
}
```

#### 请求示例

```bash
curl -X GET "http://localhost:8030/logs/report-generation/abc123def456" \
  -H "Authorization: Bearer your_token_here"
```

```javascript
async function getLogByJobId(jobId) {
  const response = await fetch(
    `http://localhost:8030/logs/report-generation/${jobId}`,
    {
      headers: {
        'Authorization': 'Bearer your_token_here'
      }
    }
  );
  
  const result = await response.json();
  if (result.success) {
    const log = result.data;
    console.log(`任务: ${log.job_id}`);
    console.log(`用户: ${log.username}`);
    console.log(`状态: ${log.status}`);
    console.log(`创建时间: ${log.created_at}`);
  } else {
    console.error(result.message);
  }
}
```

---

## 前端接入建议

### 认证与安全

- 所有接口（除进度查询和预测接口）都需要在请求头中携带 `Authorization: Bearer <token>`
- Token 应妥善保管，不要暴露在前端代码中，建议通过环境变量或后端代理获取
- 建议使用 HTTPS 协议传输敏感数据

### 文件上传

- 使用 `multipart/form-data` 格式上传文件
- 同名字段可重复上传多份月表，后台自动合并统计
- 所有 Excel 文件必须为 `.xlsx` 格式（不支持 `.xls`）
- 文件大小建议控制在 50MB 以内
- 上传前可进行客户端文件格式验证

### 报告生成流程

1. **上传文件并生成报告**：调用 `/entryExit/summary-entrance-comprehensive`
2. **获取任务 ID**：从响应头 `X-Job-Id` 获取
3. **轮询进度**：每 2-3 秒调用 `/entryExit/summary-entrance-comprehensive/progress/{job_id}`
4. **下载报告**：生成完成后，报告已在第一步返回，或通过文档管理接口获取

### 错误处理

- 统一处理 HTTP 状态码：
  - `200`: 成功
  - `400`: 参数错误
  - `401`: 未授权
  - `404`: 资源不存在
  - `408`: 超时
  - `500`: 服务器错误
- 所有 JSON 响应都包含 `success` 字段，可用于判断请求是否成功
- 失败时通过 `message` 字段获取错误信息

### URL 编码

- 文档预览/下载/删除接口的 `filename` 参数需要 URL 编码
- JavaScript 使用 `encodeURIComponent()` 函数
- 示例：`报告.docx` → `%E6%8A%A5%E5%91%8A.docx`

### 分页查询

- 日志查询接口支持分页，建议每页 20-50 条
- 响应中包含 `total_pages` 字段，可用于计算总页数
- 前端可实现虚拟滚动或分页器组件

### 示例：完整报告生成流程

```javascript
async function generateReportWithProgress(files, options = {}) {
  const formData = new FormData();
  files.basePeriod.forEach(file => formData.append('basePeriodFile', file));
  files.comparePeriod.forEach(file => formData.append('comparePeriodFile', file));
  formData.append('previousYearTrafficFile', files.flightsPrev);
  formData.append('currentYearTrafficFile', files.flightsCurr);
  
  if (options.months) formData.append('months', options.months);
  if (options.username) formData.append('username', options.username);
  
  // 1. 提交生成任务
  const response = await fetch(
    'http://localhost:8030/entryExit/summary-entrance-comprehensive',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your_token_here'
      },
      body: formData
    }
  );
  
  const jobId = response.headers.get('X-Job-Id');
  const reportBlob = await response.blob();
  
  // 2. 轮询进度（可选，用于显示进度条）
  const progressInterval = setInterval(async () => {
    const progressRes = await fetch(
      `http://localhost:8030/entryExit/summary-entrance-comprehensive/progress/${jobId}`
    );
    const progress = await progressRes.json();
    
    console.log(`进度: ${progress.percent}%`);
    
    if (progress.done) {
      clearInterval(progressInterval);
    }
  }, 2000);
  
  // 3. 下载报告
  const url = window.URL.createObjectURL(reportBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '数据分析报告.docx';
  a.click();
  window.URL.revokeObjectURL(url);
  
  return jobId;
}
```
