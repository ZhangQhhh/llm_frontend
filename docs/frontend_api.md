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
- **报告模板**：
  - 月度模板：`template/report_template_month.docx`
  - 年度模板：`template/report_template_year.docx`
  - 兼容旧模板：`template/report_templete.docx`
- **CORS 配置**：默认允许所有源，可通过 `CORS_ORIGINS` 环境变量配置

## 模板与占位符

### 模板选择

- `analysisMode=month`：使用 `template/report_template_month.docx`
- `analysisMode=year`：使用 `template/report_template_year.docx`
- 未传 `analysisMode`：默认按月模板

> 生成报告后，会在模板中“附录”段落后自动追加一张汇总表。

### 占位符清单（文档模板可用）

**基础日期/周期**
- `year`：报告年份
- `reportYear`：报告日期（格式：YYYY年M月D日）
- `mm`：报告月份
- `dd`：报告日期
- `periodTitle`：周期标题（如“2025年度”“2025年9月”“2025年3-5月”）
- `periodScope`：周期范围（如“全年”“9月”“3-5月”）
- `periodEnd`：截至日期（如“2025年9月30日”）

**总量与结构**
- `totalCount`
- `passengerTotal`
- `employeeTotal`
- `chinesePassenger`
- `hktPassenger`
- `foreignPassenger`
- `chineseEmployee`
- `hktEmployee`
- `foreignEmployee`
- `chineseEntry`
- `chineseExit`
- `chinesePassenger_percent`
- `hktPassenger_percent`
- `foreignPassenger_percent`
- `hkPassenger`
- `moPassenger`
- `twPassenger`

**出入境与航班**
- `traffic_current_flights`
- `traffic_current_passengers`
- `traffic_current_exit`
- `traffic_current_entry`
- `traffic_flights_change_trend`
- `traffic_flights_change_rate`
- `traffic_passengers_change_trend`
- `traffic_passengers_change_rate`
- `civil_aircraft_count`
- `business_jet_count`
- `cargo_aircraft_count`
- `total_routes`
- `passenger_routes`
- `cargo_routes`
- `passenger_main_directions`
- `cargo_main_directions`
- `monthly_passenger_flights`
- `monthly_cargo_flights`
- `cargo_routes_change_trend`
- `cargo_routes_change_rate`

**热点统计（TOP3）**
- `top_one_issue`
- `top_one_issue_count`
- `top_one_issue_count_percent`
- `top_two_issue`
- `top_two_issue_count`
- `top_two_issue_count_percent`
- `top_three_issue`
- `top_three_issue_count`
- `top_three_issue_count_percent`
- `top_one_exit_des`
- `top_one_exit_des_count`
- `top_one_exit_des_count_percent`
- `top_two_exit_des`
- `top_two_exit_des_count`
- `top_two_exit_des_count_percent`
- `top_three_exit_des`
- `top_three_exit_des_count`
- `top_three_exit_des_count_percent`
- `top_one_hkw_issue`
- `top_one_hkw_issue_count`
- `top_one_hkw_issue_count_percent`
- `top_two_hkw_issue`
- `top_two_hkw_issue_count`
- `top_two_hkw_issue_count_percent`
- `top_three_hkw_issue`
- `top_three_hkw_issue_count`
- `top_three_hkw_issue_count_percent`
- `top_one_foreign`
- `top_one_foreign_count`
- `top_one_foreign_count_percent`
- `top_two_foreign`
- `top_two_foreign_count`
- `top_two_foreign_count_percent`
- `top_three_foreign`
- `top_three_foreign_count`
- `top_three_foreign_count_percent`
- `top_one_aim`
- `top_one_aim_count`
- `top_one_aim_count_percent`
- `top_two_aim`
- `top_two_aim_count`
- `top_two_aim_count_percent`
- `top_three_aim`
- `top_three_aim_count`
- `top_three_aim_count_percent`

**类别统计**
- `personCategoryStats_入境外国人`
- `personCategoryStats_出境外国人`

**LLM 文本输出**
- `exitLlmSummary`
- `foreignLlmSummary`
- `aimLlm`
- `dataTrendSummary`
- `specialExitSummary`
- `specialForeignSummary`
- `specialAimSummary`

**图表占位符（图片）**
- `pic1`：出入境趋势
- `pic2`：航线概览
- `pic3`：旅客构成
- `pic4`：中国籍出境关注
- `pic5`：港澳台入境关注
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
| `analysisMode` | String | 否 | 分析维度：`month`（默认）/ `year` |
| `months` | String | 否 | 月份过滤，逗号分隔，例：`"3,4"` 或 `"1,2,3"`，不传则按上传月份统计 |
| `chartEngine` | String | 否 | 图表引擎：`plotly`（默认，推荐）/ `matplotlib`（兼容回退） |
| `username` | String | 否 | 操作用户名，用于日志记录和审计 |

> **说明**：
> - `*` 表示 `basePeriodFile`/`previousYearFile` 二选一必填，`comparePeriodFile`/`currentYearFile` 二选一必填
> - 字段名为"基准期/对比期"命名，但实际可用于任意两个对比周期，例如 2025 年 4 月 vs 2025 年 9 月
> - 系统会将 `basePeriodFile` 视为"对比基准"，`comparePeriodFile` 视为"对比期"
> - 所有 Excel 文件必须为 `.xlsx` 格式，`.xls` 格式不支持
> - 支持多文件上传：同名字段可重复上传多份月表，后台会自动合并统计（给多少分析多少）
> - months 不传/传 "全年"/"all" 表示不过滤，按上传月份统计
> - `analysisMode` 用于选择模板：`month`=按月模板，`year`=按年模板（不传默认按月）

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
  -F "chartEngine=plotly" \
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
| `analysisMode` | String | 否 | 分析维度：`month`（默认）/ `year` |
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
  -F "analysisMode=year" \
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


---

### 4.2) 上传总量历史数据

**POST** `/entryExit/forecast-total/history`
**Content-Type** `multipart/form-data`

上传出入境总量的月度历史 CSV，会按 `year+month` 去重覆盖旧数据。

#### 请求参数

**表单字段（multipart/form-data）：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file` | File | 是 | CSV 文件，列必须为 `year,month,totalCount` |

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
    "rows": 36,
    "inserted": 12,
    "updated": 3
  }
}
```

#### 请求示例

```bash
curl -X POST "http://localhost:8030/entryExit/forecast-total/history" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/total_count_history.csv"
```

---

### 4.3) 上传交通工具总量历史数据

**POST** `/entryExit/forecast-traffic-tools/history`
**Content-Type** `multipart/form-data`

上传交通工具总量的月度历史 CSV，会按 `year+month` 去重覆盖旧数据。

#### 请求参数

**表单字段（multipart/form-data）：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file` | File | 是 | CSV 文件，列必须为 `year,month,totalCount` |

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
    "rows": 36,
    "inserted": 12,
    "updated": 3
  }
}
```

#### 请求示例

```bash
curl -X POST "http://localhost:8030/entryExit/forecast-traffic-tools/history" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/traffic_tool_history.csv"
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

> 说明：同一 `job_id` 可能有多条记录（状态流转），列表按 `timestamp` 倒序；单条接口返回该 `job_id` 最新记录。

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
        "timestamp": "2026-01-29T15:35:20",
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
        "timestamp": "2026-01-29T14:22:15",
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
| `logs[].timestamp` | String | 记录时间（ISO 8601） |
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
    "timestamp": "2026-01-29T15:35:20",
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
    console.log(`记录时间: ${log.timestamp}`);
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

---

## 按年自动同比接口（新增）

### 功能总览

1. 按年接口与按月上传对比接口完全独立。
2. 用户只传 `startMonth/endMonth`，系统自动生成同比区间（上一年同月份窗口）。
3. 所有按年数据统一从 `sava_here/yearData` 读取，先上传再生成。
4. 仅缓存参与指标计算的字段，不缓存无关字段（如证件号码、姓名等）。
5. 支持两套前缀：
   - 主路径：`/entryExit/*`
   - 兼容路径：`/entry-exit/*`

### 自动同比规则（新增能力）

以 `startMonth=2024-01`、`endMonth=2025-01` 为例：

1. 分析窗口：`2024-01` 到 `2025-01`（共 13 个月）。
2. 同比窗口：自动映射为 `2023-01` 到 `2024-01`（同样 13 个月）。
3. 生成年报前会校验两个窗口的数据是否齐全。
4. 数据不足时不生成报告，返回缺失月份清单。

### 缓存机制（新增能力）

缓存分两层：

1. 月缓存：`sava_here/yearData/cache/monthly/{datasetType}/{YYYY-MM}.pkl`
2. 窗口缓存：`sava_here/yearData/cache/window/{cacheKey}.json`

月缓存只保留用于指标计算的字段：

1. `people`：人员类别、出入类型、出入事由、国家地区、往来国、出入时间（标准化为内部时间列）
2. `traffic`：工具类型、抵离地、来往国、出入时间（以及可识别的“架次/航班架次”列）

重传同年月文件时（同 `datasetType+year+month`）：

1. 新版本记录 `version + 1` 且 `isActive=true`
2. 旧版本自动标记为 `isActive=false`
3. 该月月缓存重建
4. 全部窗口缓存失效，下一次生成按新版本重算

---

### 接口清单（按年）

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 上传月表 | POST | `/entryExit/year-data/upload` | 需要 | 上传 `people/traffic` 月表并构建月缓存 |
| 查询已上传文件 | GET | `/entryExit/year-data/files` | 需要 | 查询当前生效版本（`isActive=true`） |
| 生成前校验 | POST | `/entryExit/year-report/validate` | 需要 | 校验分析窗口+同比窗口是否齐全 |
| 生成年报 | POST | `/entryExit/year-report/generate` | 需要 | 自动同比并返回 docx |
| 查询进度 | GET | `/entryExit/year-report/progress/{jobId}` | 不需要 | 查询年报任务进度 |

> 以上 5 个接口都支持兼容前缀 `/entry-exit/*`。

---

### A) 上传年报月表

**POST** `/entryExit/year-data/upload`  
**Content-Type** `multipart/form-data`

请求字段：

1. `file`：`.xlsx`（必填）
2. `datasetType`：`people` 或 `traffic`（必填）
3. `year`：四位年份（必填）
4. `month`：`1-12`（必填）
5. `username`：可选

#### cURL（上传 people 月表）

```bash
curl -X POST "http://localhost:8030/entryExit/year-data/upload" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/people_2024_01.xlsx" \
  -F "datasetType=people" \
  -F "year=2024" \
  -F "month=1" \
  -F "username=张三"
```

#### cURL（上传 traffic 月表）

```bash
curl -X POST "http://localhost:8030/entryExit/year-data/upload" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/traffic_2024_01.xlsx" \
  -F "datasetType=traffic" \
  -F "year=2024" \
  -F "month=1" \
  -F "username=张三"
```

#### cURL（兼容前缀）

```bash
curl -X POST "http://localhost:8030/entry-exit/year-data/upload" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/people_2024_02.xlsx" \
  -F "datasetType=people" \
  -F "year=2024" \
  -F "month=2"
```

#### 前端 Fetch 示例

```javascript
async function uploadYearData({ baseUrl, token, file, datasetType, year, month, username }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('datasetType', datasetType); // people | traffic
  formData.append('year', String(year));
  formData.append('month', String(month));
  if (username) formData.append('username', username);

  const res = await fetch(`${baseUrl}/entryExit/year-data/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || '上传失败');
  }
  return json.data; // { record, cache }
}
```

#### 上传成功响应示例（含缓存）

```json
{
  "success": true,
  "data": {
    "record": {
      "id": "96d3b3f0e93f4d66b4a88f5b18f26f62",
      "datasetType": "people",
      "year": 2024,
      "month": 1,
      "monthId": "2024-01",
      "originalName": "people_2024_01.xlsx",
      "storedName": "people_2024_01.xlsx",
      "storedPath": "sava_here/yearData/people/2024/01/people_2024_01.xlsx",
      "size": 123456,
      "checksum": "sha256...",
      "uploadedBy": "张三",
      "uploadedAt": "2026-02-15T12:00:00.000000",
      "isActive": true,
      "version": 1
    },
    "cache": {
      "datasetType": "people",
      "monthId": "2024-01",
      "rowCount": 32187,
      "cachePath": "sava_here/yearData/cache/monthly/people/2024-01.pkl",
      "updatedAt": "2026-02-15T12:00:01.000000"
    }
  }
}
```

---

### B) 查询已上传月表

**GET** `/entryExit/year-data/files`

查询参数（都可选）：

1. `datasetType`: `people | traffic`
2. `year`: 数字年份
3. `month`: 1-12

#### cURL

```bash
curl -X GET "http://localhost:8030/entryExit/year-data/files?datasetType=people&year=2024" \
  -H "Authorization: Bearer your_token_here"
```

#### cURL（查询某个月的生效版本）

```bash
curl -X GET "http://localhost:8030/entryExit/year-data/files?datasetType=people&year=2024&month=1" \
  -H "Authorization: Bearer your_token_here"
```

#### Axios 示例

```javascript
async function listYearData({ baseUrl, token, datasetType, year, month }) {
  const res = await axios.get(`${baseUrl}/entryExit/year-data/files`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { datasetType, year, month }
  });
  return res.data.data; // 仅返回 active 版本
}
```

---

### C) 生成前校验（建议前端每次先调用）

**POST** `/entryExit/year-report/validate`  
**Content-Type** `application/json`

请求体：

```json
{
  "startMonth": "2024-01",
  "endMonth": "2025-01",
  "reportType": "comprehensive"
}
```

参数说明：

1. `startMonth`：`YYYY-MM`
2. `endMonth`：`YYYY-MM`
3. `reportType`：`comprehensive` 或 `people_only`

返回字段重点：

1. `ready`：是否满足生成条件
2. `analysisMonths`：分析窗口月序列
3. `yoyMonths`：同比窗口月序列（自动计算）
4. `missingPeopleMonths`：缺失人员数据月份
5. `missingTrafficMonths`：缺失航班数据月份（`people_only` 时为空）

#### cURL

```bash
curl -X POST "http://localhost:8030/entryExit/year-report/validate" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d "{\"startMonth\":\"2024-01\",\"endMonth\":\"2025-01\",\"reportType\":\"comprehensive\"}"
```

#### `ready=true` 响应示例

```json
{
  "success": true,
  "data": {
    "ready": true,
    "analysisMonths": ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06", "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01"],
    "yoyMonths": ["2023-01", "2023-02", "2023-03", "2023-04", "2023-05", "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12", "2024-01"],
    "missingPeopleMonths": [],
    "missingTrafficMonths": []
  }
}
```

#### `ready=false` 响应示例（接口仍返回 200）

```json
{
  "success": true,
  "data": {
    "ready": false,
    "analysisMonths": ["2024-01", "...", "2025-01"],
    "yoyMonths": ["2023-01", "...", "2024-01"],
    "missingPeopleMonths": ["2024-06"],
    "missingTrafficMonths": ["2023-10", "2023-11"]
  }
}
```

---

### D) 生成按年报告（自动同比）

**POST** `/entryExit/year-report/generate`  
**Content-Type** `application/json`

请求体字段：

1. `startMonth`：必填，`YYYY-MM`
2. `endMonth`：必填，`YYYY-MM`
3. `reportType`：可选，默认 `comprehensive`
4. `chartEngine`：可选，默认 `plotly`
5. `jobId`：可选，不传服务端自动生成
6. `username`：可选，用于日志记录

#### cURL（下载报告）

```bash
curl -X POST "http://localhost:8030/entryExit/year-report/generate" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d "{\"startMonth\":\"2024-01\",\"endMonth\":\"2025-01\",\"reportType\":\"comprehensive\",\"chartEngine\":\"plotly\",\"username\":\"张三\"}" \
  -D headers.txt \
  -o year_report.docx
```

#### cURL（兼容前缀）

```bash
curl -X POST "http://localhost:8030/entry-exit/year-report/generate" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d "{\"startMonth\":\"2024-01\",\"endMonth\":\"2025-01\",\"reportType\":\"people_only\"}" \
  -D headers.txt \
  -o year_people_only.docx
```

#### 422 响应示例（数据不足）

```json
{
  "success": false,
  "code": 422,
  "message": "Insufficient yearData for selected window",
  "data": {
    "message": "Insufficient yearData for selected window",
    "missingPeopleMonths": ["2024-06"],
    "missingTrafficMonths": ["2023-10", "2023-11"]
  }
}
```

#### 400 响应示例（参数格式错误）

```json
{
  "success": false,
  "code": 400,
  "message": "month value must be YYYY-MM"
}
```

---

### E) 查询按年任务进度

**GET** `/entryExit/year-report/progress/{job_id}`

> 该接口当前不要求 `Authorization` 头。

#### cURL

```bash
curl -X GET "http://localhost:8030/entryExit/year-report/progress/abc123"
```

返回示例：

```json
{
  "jobId": "abc123",
  "stage": "charts",
  "percent": 85,
  "done": false,
  "updatedAt": 1700000000
}
```

---

### F) 完整 cURL 调用链（可直接联调）

```bash
# 0) 环境变量
BASE_URL="http://localhost:8030"
TOKEN="your_token_here"
START_MONTH="2024-01"
END_MONTH="2025-01"
USERNAME="zhangsan"

# 1) 上传 people 月表（示例：上传 2024-01）
curl -X POST "${BASE_URL}/entryExit/year-data/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@/data/people_2024_01.xlsx" \
  -F "datasetType=people" \
  -F "year=2024" \
  -F "month=1" \
  -F "username=${USERNAME}"

# 2) 上传 traffic 月表（comprehensive 模式需要）
curl -X POST "${BASE_URL}/entryExit/year-data/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@/data/traffic_2024_01.xlsx" \
  -F "datasetType=traffic" \
  -F "year=2024" \
  -F "month=1" \
  -F "username=${USERNAME}"

# 3) 查看当前生效上传记录
curl -X GET "${BASE_URL}/entryExit/year-data/files?year=2024&month=1" \
  -H "Authorization: Bearer ${TOKEN}"

# 4) 校验窗口完整性
curl -X POST "${BASE_URL}/entryExit/year-report/validate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"startMonth\":\"${START_MONTH}\",\"endMonth\":\"${END_MONTH}\",\"reportType\":\"comprehensive\"}"

# 5) 生成报告并保存到本地
curl -X POST "${BASE_URL}/entryExit/year-report/generate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"startMonth\":\"${START_MONTH}\",\"endMonth\":\"${END_MONTH}\",\"reportType\":\"comprehensive\",\"chartEngine\":\"plotly\",\"username\":\"${USERNAME}\"}" \
  -D headers.txt \
  -o year_report.docx

# 6) 读取任务ID（X-Job-Id）
JOB_ID=$(grep -i "X-Job-Id" headers.txt | awk '{print $2}' | tr -d '\r')
echo "jobId=${JOB_ID}"

# 7) 轮询进度
curl -X GET "${BASE_URL}/entryExit/year-report/progress/${JOB_ID}"
```

---

### G) 前端调用示例（Fetch + TypeScript）

```typescript
type ReportType = 'comprehensive' | 'people_only';

interface YearValidateResult {
  ready: boolean;
  analysisMonths: string[];
  yoyMonths: string[];
  missingPeopleMonths: string[];
  missingTrafficMonths: string[];
}

class YearReportClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  private authHeaders(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${this.token}`, ...extra };
  }

  async upload(file: File, datasetType: 'people' | 'traffic', year: number, month: number, username?: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('datasetType', datasetType);
    form.append('year', String(year));
    form.append('month', String(month));
    if (username) form.append('username', username);

    const res = await fetch(`${this.baseUrl}/entryExit/year-data/upload`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: form
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'upload failed');
    return json.data;
  }

  async list(params: { datasetType?: 'people' | 'traffic'; year?: number; month?: number }) {
    const query = new URLSearchParams();
    if (params.datasetType) query.set('datasetType', params.datasetType);
    if (params.year) query.set('year', String(params.year));
    if (params.month) query.set('month', String(params.month));

    const res = await fetch(`${this.baseUrl}/entryExit/year-data/files?${query.toString()}`, {
      headers: this.authHeaders()
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'list failed');
    return json.data;
  }

  async validate(startMonth: string, endMonth: string, reportType: ReportType): Promise<YearValidateResult> {
    const res = await fetch(`${this.baseUrl}/entryExit/year-report/validate`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ startMonth, endMonth, reportType })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'validate failed');
    return json.data;
  }

  async generate(payload: {
    startMonth: string;
    endMonth: string;
    reportType: ReportType;
    chartEngine?: 'plotly' | 'matplotlib';
    jobId?: string;
    username?: string;
  }) {
    const res = await fetch(`${this.baseUrl}/entryExit/year-report/generate`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('application/json')) {
      const err = await res.json();
      throw err;
    }

    const jobId = res.headers.get('X-Job-Id') || '';
    const blob = await res.blob();
    return { jobId, blob };
  }

  async progress(jobId: string) {
    const res = await fetch(`${this.baseUrl}/entryExit/year-report/progress/${jobId}`);
    if (!res.ok) throw new Error('progress failed');
    return res.json();
  }
}

// 串联示例：validate -> generate -> progress
async function runYearReportFlow(client: YearReportClient) {
  const startMonth = '2024-01';
  const endMonth = '2025-01';
  const reportType: ReportType = 'comprehensive';

  const check = await client.validate(startMonth, endMonth, reportType);
  if (!check.ready) {
    return {
      ready: false,
      missingPeopleMonths: check.missingPeopleMonths,
      missingTrafficMonths: check.missingTrafficMonths
    };
  }

  const { jobId, blob } = await client.generate({
    startMonth,
    endMonth,
    reportType,
    chartEngine: 'plotly',
    username: '张三'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '年度分析报告.docx';
  a.click();
  URL.revokeObjectURL(url);

  const timer = setInterval(async () => {
    const p = await client.progress(jobId);
    console.log(`[year-report] ${p.percent}% ${p.stage}`);
    if (p.done) clearInterval(timer);
  }, 2000);

  return { ready: true, jobId };
}
```

---

### H) Axios 下载与错误解析示例（blob + JSON 错误体）

```javascript
import axios from 'axios';

async function generateYearReportByAxios(baseUrl, token, payload) {
  try {
    const res = await axios.post(
      `${baseUrl}/entryExit/year-report/generate`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    );

    const jobId = res.headers['x-job-id'];
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = '年度分析报告.docx';
    a.click();
    URL.revokeObjectURL(url);
    return { jobId };
  } catch (error) {
    // 后端在 422/400 时返回 JSON；axios + blob 需要手动转文本再解析
    const blob = error?.response?.data;
    if (blob instanceof Blob) {
      const text = await blob.text();
      try {
        const json = JSON.parse(text);
        throw json;
      } catch {
        throw new Error(text || 'generate failed');
      }
    }
    throw error;
  }
}
```

---

### I) 重传更新与缓存刷新（新增能力重点）

适用场景：同一个 `datasetType + year + month` 上传了修订版文件。

服务端行为：

1. 新文件入库后自动成为当前生效版本（`isActive=true`）。
2. 历史版本保留但 `isActive=false`。
3. 对应月份月缓存立即重建。
4. 窗口缓存全量失效，避免旧版本数据继续命中。
5. 后续 `validate/generate` 只会读取生效版本。

前端建议流程：

1. 上传成功后立即调用 `GET /year-data/files?datasetType=...&year=...&month=...` 确认 `version` 和 `isActive`。
2. 重新调用 `POST /year-report/validate`，确认 `ready=true` 且缺失月份清单清零。
3. 再调用 `POST /year-report/generate` 生成最终报告。

重传后检查示例：

```bash
curl -X GET "http://localhost:8030/entryExit/year-data/files?datasetType=people&year=2024&month=1" \
  -H "Authorization: Bearer your_token_here"
```


