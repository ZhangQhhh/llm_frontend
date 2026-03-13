# 年报批量上传对接文档

本文档面向前端联调，说明本次新增的“上传一张总表，后端按日期自动拆成月表”的能力，包括接口协议、模板字段映射、返回结构、错误处理、页面交互建议和联调示例。

## 1. 功能概述

本次新增能力用于解决客户上传 `toad` 总表时，前端不需要再手动按月拆分文件，后端会自动完成：

1. 接收一张人员总表或交通运输工具总表。
2. 按表内日期字段自动拆成多个自然月。
3. 仅保留系统当前月表需要的标准字段。
4. 按现有 `yearData` 机制落盘、建版本、生成月缓存。
5. 后续按年校验、按年报告生成接口直接复用这些月表。

当前仅支持两类模板：

1. `excel/toad 人员模板.xls`
2. `excel/toad 交通运输工具模板.xls`

## 2. 本次新增/变更点

### 2.1 新增接口

1. `POST /entryExit/year-data/upload-batch`
2. 兼容路径：`POST /entry-exit/year-data/upload-batch`

### 2.2 兼容性变更

本次还顺带放宽了按年数据上传的文件格式限制：

1. 原单月上传接口 `POST /entryExit/year-data/upload` 现在支持 `.xls` 和 `.xlsx`
2. 批量上传接口 `POST /entryExit/year-data/upload-batch` 也支持 `.xls` 和 `.xlsx`
3. 下载接口 `/entryExit/year-data/files/{record_id}/download` 会根据文件后缀自动返回对应 Excel MIME 类型

### 2.3 不变的部分

以下接口协议未变：

1. `GET /entryExit/year-data/files`
2. `POST /entryExit/year-report/validate`
3. `POST /entryExit/year-report/generate`
4. `GET /entryExit/year-report/progress/{jobId}`

前端如果已经接了按年报告流程，只需要在上传入口增加“批量上传总表”即可。

## 3. 后端实际行为

### 3.1 批量上传的处理逻辑

后端收到总表后，会执行：

1. 校验 `datasetType`
2. 校验 `templateType`，当前只允许 `toad`
3. 读取 Excel
4. 自动标准化表头
5. 自动识别并跳过模板首行的“字段说明行”
6. 用 `CRRQSJ` 解析日期时间
7. 如果 `CRRQSJ` 为空，则回退用 `CRRQ + CRSJ`
8. 按 `YYYY-MM` 分组拆分
9. 生成标准月表 `.xlsx`
10. 写入 `sava_here/yearData/{datasetType}/{year}/{month}/`
11. 为每个月生成/重建月缓存 `.pkl`
12. 更新索引 `index.json`

### 3.2 同月重复上传时的规则

如果本次批量上传拆出来的某个月，系统里已经有同 `datasetType + year + month` 的 active 月表：

1. 新文件会生成一个新版本 `version + 1`
2. 新版本自动设为 `isActive = true`
3. 老版本保留，但会被设为 `isActive = false`
4. 该月缓存会重建
5. 年报窗口缓存会失效，后续报告按新版本重算

也就是说，前端不需要额外做“覆盖确认”的参数控制，后端默认走新版本替换当前生效版本。

## 4. 接口说明

## 4.1 批量上传总表

**POST** `/entryExit/year-data/upload-batch`

**Content-Type** `multipart/form-data`

### 请求字段

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | File | 是 | Excel 总表，支持 `.xls` / `.xlsx` |
| `datasetType` | String | 是 | `people` 或 `traffic` |
| `templateType` | String | 否 | 当前固定传 `toad`，默认也是 `toad` |
| `username` | String | 否 | 操作用户名，用于记录上传人 |

### 请求头

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `Authorization` | String | 条件 | `Bearer <token>`，服务端配置了 `API_TOKEN` 时必填 |

### 成功响应

```json
{
  "success": true,
  "data": {
    "batchId": "351e69ef18cc4ed39bc4f0873f3a0a38",
    "datasetType": "people",
    "sourceFileName": "toad_people.xlsx",
    "totalRows": 2,
    "importedMonthCount": 2,
    "importedMonths": [
      {
        "monthId": "2025-01",
        "rowCount": 1,
        "recordId": "607201a2f4824c60a243ac711e268224",
        "version": 1
      },
      {
        "monthId": "2025-02",
        "rowCount": 1,
        "recordId": "71cdaf9c10ca4febb16afa73a130d64e",
        "version": 1
      }
    ],
    "warnings": [
      "已自动跳过模板说明行"
    ]
  }
}
```

### 字段说明

| 字段名 | 类型 | 说明 |
|---|---|---|
| `batchId` | String | 本次批量导入批次号，同一次拆分出的月表共用 |
| `datasetType` | String | `people` 或 `traffic` |
| `sourceFileName` | String | 原始上传文件名 |
| `totalRows` | Number | 实际参与拆分的数据行数，不包含模板说明行 |
| `importedMonthCount` | Number | 成功生成的月份数量 |
| `importedMonths[]` | Array | 每个月的落库结果 |
| `importedMonths[].monthId` | String | 月份，格式 `YYYY-MM` |
| `importedMonths[].rowCount` | Number | 该月写入的行数 |
| `importedMonths[].recordId` | String | 生成的月表记录 ID |
| `importedMonths[].version` | Number | 该月当前生成的版本号 |
| `warnings` | Array | 非阻断提示，目前常见值是“已自动跳过模板说明行” |

### 失败响应

如果是结构化的 400 错误，返回格式如下：

```json
{
  "success": false,
  "code": 400,
  "message": "存在无法解析日期的行",
  "data": {
    "message": "存在无法解析日期的行",
    "datasetType": "people",
    "sourceFileName": "bad_people.xlsx",
    "rowErrors": [
      {
        "row": 2,
        "message": "无法解析出入日期时间"
      }
    ],
    "missingColumns": []
  }
}
```

### 错误字段说明

| 字段名 | 类型 | 说明 |
|---|---|---|
| `message` | String | 错误摘要，前端可直接 toast |
| `data.datasetType` | String | 当前导入的数据类型 |
| `data.sourceFileName` | String | 上传文件名 |
| `data.rowErrors` | Array | 行级错误，最多返回前 20 条 |
| `data.rowErrors[].row` | Number | Excel 中对应的行号 |
| `data.rowErrors[].message` | String | 该行错误原因 |
| `data.missingColumns` | Array | 缺失字段列表 |

### 当前已实现的 400 错误场景

1. `templateType` 不是 `toad`
2. 上传文件为空
3. 模板缺少必需字段
4. Excel 中没有可导入的数据行
5. 存在无法解析日期的行
6. 拆分后没有得到任何月份数据
7. `datasetType` 非 `people/traffic`
8. 文件类型不是 `.xls/.xlsx`

## 4.2 单月上传接口

**POST** `/entryExit/year-data/upload`

该接口原本就存在，本次没有改协议，但文件类型从“仅 `.xlsx`”变成了“支持 `.xls/.xlsx`”。

请求字段：

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | File | 是 | Excel 月表，支持 `.xls` / `.xlsx` |
| `datasetType` | String | 是 | `people` 或 `traffic` |
| `year` | Number | 是 | 年份 |
| `month` | Number | 是 | 月份，1-12 |
| `username` | String | 否 | 上传人 |

适用场景：

1. 已经有按月拆好的标准月表
2. 需要手工补某个月数据
3. 需要导入不是 `toad` 总表的数据源，但前端已经自己转成标准月表

## 4.3 查询上传记录

**GET** `/entryExit/year-data/files`

### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `datasetType` | String | 否 | `people` 或 `traffic` |
| `year` | Number | 否 | 年份 |
| `month` | Number | 否 | 月份 |
| `grouped` | Boolean | 否 | `true` 时按月份聚合返回 |
| `activeOnly` | Boolean | 否 | 默认 `true`，只返回当前生效版本 |

### 返回记录中与本次功能相关的新字段

批量上传产生的记录会额外带上：

| 字段名 | 说明 |
|---|---|
| `importMode` | `batch_split` 或 `manual_month` |
| `batchId` | 同一次批量导入的批次号 |
| `sourceOriginalName` | 原始总表文件名 |

其中：

1. 手工单月上传：`importMode = manual_month`
2. 批量拆月上传：`importMode = batch_split`

### 前端用途建议

前端文件列表页可以利用这些字段做额外展示：

1. 用 `importMode` 区分“单月上传”与“批量拆分”
2. 用 `batchId` 将同一次导入拆出的多个文件关联显示
3. 用 `sourceOriginalName` 告诉用户这些月表来自哪张总表

## 4.4 下载月表

**GET** `/entryExit/year-data/files/{record_id}/download`

说明：

1. 如果文件后缀是 `.xls`，响应 `media_type` 为 `application/vnd.ms-excel`
2. 如果文件后缀是 `.xlsx`，响应 `media_type` 为 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
3. 批量拆分生成的月表统一保存为 `.xlsx`

## 5. 模板字段映射

前端不需要自己做字段转换，但为了方便联调和解释返回结果，这里列出后端实际映射规则。

## 5.1 人员总表映射

上传模板：`toad 人员模板.xls`

### 模板必需列

1. `RYLBDM`
2. `CRBZ`
3. `CRJSYDM`
4. `GJDQDM`
5. `QWGJDQDM`
6. 时间字段二选一：
   - `CRRQSJ`
   - 或 `CRRQ + CRSJ`

### 输出月表字段

| 输出字段 | 来源列 | 说明 |
|---|---|---|
| `人员类别` | `RYLBDM` | 原样保存代码值 |
| `出入类型` | `CRBZ` | 原样保存代码值 |
| `出入事由` | `CRJSYDM` | 原样保存代码值 |
| `国家地区` | `GJDQDM` | 原样保存代码值 |
| `往来国` | `QWGJDQDM` | 原样保存代码值 |
| `出入时间` | `CRRQSJ` 或 `CRRQ + CRSJ` | 统一写成 `YYYYMMDDHHMMSS` |
| `证件号码` | `ZJHM` | 有则保存 |
| `姓名` | `XM` | 有则保存 |
| `出生日期` | `CSRQ` | 有则保存 |
| `唯一标识` | `WYBS` | 有则保存 |
| `证件有效期` | 无 | 固定写空字符串，保留列结构 |
| `通道号` | `TDH` | 有则保存 |

### 不会保存的常见列

例如：

1. `XBDM`
2. `QZZLDM`
3. `JTFSDM`
4. `JTGJBS`
5. `CZY`
6. `CRKADM`
7. 其他模板扩展列

## 5.2 交通总表映射

上传模板：`toad 交通运输工具模板.xls`

### 模板必需列

1. `JTGJLXDM`
2. `SFDMDD`
3. `QWGLZG`
4. `HC`
5. 时间字段二选一：
   - `CRRQSJ`
   - 或 `CRRQ + CRSJ`

### 输出月表字段

| 输出字段 | 来源列 | 说明 |
|---|---|---|
| `工具类型` | `JTGJLXDM` | 原样保存代码值 |
| `抵离地` | `SFDMDD` | 原样保存 |
| `来往国` | `QWGLZG` | 原样保存 |
| `出入时间` | `CRRQSJ` 或 `CRRQ + CRSJ` | 统一写成 `YYYYMMDDHHMMSS` |
| `航班号` | `HC` | 原样保存 |
| `航班架次` | 无 | 固定写 `1` |

### 不会保存的常见列

例如：

1. `JTGJLBDM`
2. `YGS`
3. `ZKRS`
4. `YYZ`
5. `CRBZ`
6. `CZY`
7. 其他模板扩展列

## 6. 页面交互建议

建议前端把“按年数据上传”拆成两种入口：

1. 上传标准月表
2. 批量上传总表

## 6.1 推荐交互流程

### 方案 A：列表页上传

1. 页面加载时调用 `GET /entryExit/year-data/files?grouped=true`
2. 分 tab 展示 `people` / `traffic`
3. 每个 tab 提供两个按钮：
   - 上传月表
   - 批量上传总表
4. 批量上传成功后，直接用响应里的 `importedMonths` 刷新对应月份卡片

### 方案 B：引导式上传

1. 用户先选择数据类型：人员 / 交通
2. 再选择上传方式：月表 / 总表
3. 如果选择总表，显示模板说明：
   - 仅支持 `toad`
   - 仅支持 `.xls/.xlsx`
   - 会自动按日期拆月
4. 上传完成后回显：
   - 批次号
   - 共拆出几个月
   - 每月写入多少条

## 6.2 批量上传成功后的 UI 建议

建议在上传成功后展示：

1. `sourceFileName`
2. `importedMonthCount`
3. `importedMonths`
4. `warnings`

展示示例：

```text
文件：toad_people.xlsx
共导入：2 个月
2025-01：1 行，版本 1
2025-02：1 行，版本 1
提示：已自动跳过模板说明行
```

## 6.3 批量上传失败后的 UI 建议

如果接口返回结构化 400 错误：

1. 顶部展示 `message`
2. 详情区展示 `missingColumns`
3. 表格区展示 `rowErrors`

例如：

```text
导入失败：存在无法解析日期的行
文件：bad_people.xlsx
第 2 行：无法解析出入日期时间
```

## 7. 联调示例

## 7.1 cURL

### 人员总表

```bash
curl -X POST "http://localhost:8030/entryExit/year-data/upload-batch" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/toad_people.xls" \
  -F "datasetType=people" \
  -F "templateType=toad" \
  -F "username=张三"
```

### 交通总表

```bash
curl -X POST "http://localhost:8030/entryExit/year-data/upload-batch" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/toad_traffic.xls" \
  -F "datasetType=traffic" \
  -F "templateType=toad" \
  -F "username=张三"
```

### 兼容路径

```bash
curl -X POST "http://localhost:8030/entry-exit/year-data/upload-batch" \
  -H "Authorization: Bearer your_token_here" \
  -F "file=@/path/to/toad_people.xls" \
  -F "datasetType=people"
```

## 7.2 Fetch

```javascript
async function uploadYearDataBatch({ baseUrl, token, file, datasetType, username }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('datasetType', datasetType); // people | traffic
  formData.append('templateType', 'toad');
  if (username) formData.append('username', username);

  const res = await fetch(`${baseUrl}/entryExit/year-data/upload-batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const error = new Error(json.message || '批量上传失败');
    error.payload = json;
    throw error;
  }

  return json.data;
}
```

## 7.3 Axios

```javascript
async function uploadYearDataBatchByAxios({ baseUrl, token, file, datasetType, username }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('datasetType', datasetType);
  formData.append('templateType', 'toad');
  if (username) formData.append('username', username);

  const res = await axios.post(
    `${baseUrl}/entryExit/year-data/upload-batch`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return res.data.data;
}
```

## 7.4 TypeScript 类型建议

```typescript
type YearDatasetType = 'people' | 'traffic';

interface BatchImportMonthItem {
  monthId: string;
  rowCount: number;
  recordId: string;
  version: number;
}

interface BatchImportResult {
  batchId: string;
  datasetType: YearDatasetType;
  sourceFileName: string;
  totalRows: number;
  importedMonthCount: number;
  importedMonths: BatchImportMonthItem[];
  warnings: string[];
}

interface BatchImportErrorDetail {
  message: string;
  datasetType: YearDatasetType;
  sourceFileName: string;
  rowErrors: Array<{
    row: number;
    message: string;
  }>;
  missingColumns: string[];
}
```

## 8. 对接后的推荐业务流程

如果前端已经接了按年报告页面，推荐流程如下：

1. 用户上传总表到 `/year-data/upload-batch`
2. 上传成功后刷新 `/year-data/files?grouped=true`
3. 用户选择分析窗口
4. 调用 `/year-report/validate`
5. 校验通过后调用 `/year-report/generate`

这样前端不需要再做：

1. 自己按日期拆月
2. 自己推导 monthId
3. 自己保存标准月表

## 9. 已验证场景

本次后端已验证的核心场景如下：

1. 人员总表可拆成多个月表
2. 交通总表可拆成月表
3. 同月重复导入时版本号会递增
4. 模板说明行会被自动跳过
5. 坏日期会返回结构化 400 错误
6. 批量拆出的月表会正常落盘为 `.xlsx`

## 10. 前端注意事项

1. `templateType` 当前只支持 `toad`，前端可以直接写死，不需要让用户选。
2. 批量上传成功后，不代表年报一定能生成，仍需走 `/year-report/validate`。
3. 返回里的 `warnings` 不是错误，不应阻断页面流程。
4. `rowErrors` 最多返回前 20 条，前端可以提示“仅展示前 20 条错误”。
5. 批量导入得到的是标准月表，不是原始总表的回传内容。
6. 同一次批量导入可能生成多个 `recordId`，不要假设只有一个文件记录。
7. 如果前端要做“导入结果详情弹窗”，建议直接使用 `importedMonths` 渲染。

## 11. 相关接口索引

| 接口 | 方法 | 说明 |
|---|---|---|
| `/entryExit/year-data/upload-batch` | POST | 批量上传总表并自动拆月 |
| `/entryExit/year-data/upload` | POST | 上传单个月表 |
| `/entryExit/year-data/files` | GET | 查询上传记录 |
| `/entryExit/year-data/files/{record_id}/download` | GET | 下载月表文件 |
| `/entryExit/year-data/files/{record_id}/activate` | POST | 激活某个历史版本 |
| `/entryExit/year-report/validate` | POST | 年报生成前校验 |
| `/entryExit/year-report/generate` | POST | 生成按年报告 |
| `/entryExit/year-report/progress/{jobId}` | GET | 查询生成年报进度 |
