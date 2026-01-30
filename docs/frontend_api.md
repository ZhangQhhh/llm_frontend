# 前端接入开发文档

本文档梳理当前服务能力与对接方式，面向前端调用与联调使用。

## 服务概览

- 报告生成：上传 Excel，返回 Word 报告（docx）。
- 进度查询：轮询生成进度。
- 预测数据：基于历史数据输出未来趋势。
- 文档管理：上传/列表/预览/下载/删除，统一存放在 `sava_here/`。

## 基本信息

- 默认服务：`http://<host>:8000`
- 认证：当服务端设置 `API_TOKEN` 环境变量时，需要请求头  
  `Authorization: Bearer <token>`
- 报告模板：`template/report_templete.docx`

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

表单字段：

- `basePeriodFile`：Excel（.xlsx），人员数据**月度表**（上一年度，同结构的月度汇总/明细）
- `comparePeriodFile`：Excel（.xlsx），人员数据**月度表**（当前年度，同结构的月度汇总/明细）
- `previousYearTrafficFile`：Excel（.xlsx），航班数据**年度表**（上一年度全年）
- `currentYearTrafficFile`：Excel（.xlsx），航班数据**年度表**（当前年度全年）

> 说明：字段名为"基准期/对比期"命名，但实际可用于任意两个对比周期，例如 2025 年 4 月 vs 2025 年 9 月。
> 系统会将 `basePeriodFile` 视为"对比基准",`comparePeriodFile` 视为"对比期",兼容旧字段 `previousYearFile`/`currentYearFile`。
- `jobId`（可选）：自定义任务 ID
- `months`（可选）：月份过滤，例：`"3,4"`

响应：

- 文件流（Word .docx）
- Header：`X-Job-Id`

示例：

```bash
curl -X POST "http://localhost:8000/entryExit/summary-entrance-comprehensive" ^
  -H "Authorization: Bearer <token>" ^
  -F "basePeriodFile=@excel/20240801.xlsx" ^
  -F "comparePeriodFile=@excel/20250801.xlsx" ^
  -F "previousYearTrafficFile=@excel/航班表2024.xlsx" ^
  -F "currentYearTrafficFile=@excel/航班表2025.xlsx" ^
  -F "months=3,4"
```

---

### 2) 生成仅人员数据报告

**POST** `/entry-exit/generate-full-report`  
**Content-Type** `multipart/form-data`

表单字段：

- `basePeriodFile`：Excel（.xlsx），上一年度人员数据
- `comparePeriodFile`：Excel（.xlsx），当前年度人员数据
- `jobId`（可选）
- `months`（可选）

响应：

- 文件流（Word .docx）
- Header：`X-Job-Id`

---

### 3) 报告生成进度

**GET** `/entryExit/summary-entrance-comprehensive/progress/{jobId}`

响应示例：

```json
{
  "jobId": "abc123",
  "stage": "llm_extended",
  "percent": 70,
  "done": false,
  "updatedAt": 1700000000
}
```

可能的 `stage`：

`start` / `load_people` / `load_flights` / `compute_metrics` / `llm_basic` / `llm_extended` / `charts` / `render` / `done`

---

## 预测接口

### 4) 总量预测

**GET** `/entryExit/forecast-total?steps=6`

参数：

- `steps`：预测未来月数，默认 `6`

响应示例：

```json
{
  "success": true,
  "data": [
    {"month": "2025-12", "value": 12345},
    {"month": "2026-01", "value": 13001}
  ]
}
```

---

## 文档管理接口（保存至 `sava_here/`）

### 5) 上传文档（保存/覆盖）

**POST** `/documents/upload`  
**Content-Type** `multipart/form-data`

表单字段：

- `file`：Word 文件（`.doc`/`.docx`）
- `overwrite`（可选）：`true/false`，默认 `false`  
  - `true`：同名文件覆盖
  - `false`：自动追加时间戳后缀，避免覆盖

响应示例：

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

---

### 6) 文档列表

**GET** `/documents`

返回按 `updatedAtEpoch` 倒序：

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
    }
  ]
}
```

---

### 7) 文档预览

**GET** `/documents/{filename}/preview`

返回文件流（`Content-Disposition: inline`），用于浏览器预览。

---

### 8) 文档下载

**GET** `/documents/{filename}/download`

返回文件流（`Content-Disposition: attachment`），用于下载保存。

---

### 9) 文档删除

**DELETE** `/documents/{filename}`

响应示例：

```json
{
  "success": true,
  "data": {
    "name": "报告.docx"
  }
}
```

---

## 前端接入建议

- 上传/生成接口建议采用 `multipart/form-data`。
- 生成报告后可直接保存本地，也可通过 `/documents/upload` 持久化。
- 预览/下载 URL 为相对路径，前端拼接服务端域名即可。
- 若开启 `API_TOKEN`，请统一在请求头附带 `Authorization`。
