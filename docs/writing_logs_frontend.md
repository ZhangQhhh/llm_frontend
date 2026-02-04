# 写作日志前端对接文档

## 目标
- 展示写作日志列表（公文写作、数据分析报告、通用写作）
- 支持日期选择、类型筛选、分页
- 展示 7 天统计卡片
- 支持日志详情查看

## 接口清单（统一 `/api` 前缀）
- `GET /api/writing_logs/dates`
- `GET /api/writing_logs/daily`
- `GET /api/writing_logs/statistics`
- `GET /api/writing_logs/detail`

## 日期与时区策略（强制）
- 默认日期不要直接用浏览器“今天”
- 必须先调用 `dates`，取 `dates[0]` 作为默认日期（该日期一定有日志）
- 如果 `dates` 为空，才使用本地“今天”兜底

## 接口说明
### 1) 获取可用日期
**GET** `/api/writing_logs/dates`

响应：
```json
{
  "type": "success",
  "data": {
    "dates": ["2026-02-04", "2026-02-03"],
    "total": 2
  }
}
```

### 2) 获取某天日志列表
**GET** `/api/writing_logs/daily`

Query 参数：
- `date`（必填，`YYYY-MM-DD`）
- `writing_type`（可选：`official_document` | `data_analysis_report` | `general_writing`）
- `session_id`（可选）
- `page`（可选，默认 1）
- `page_size`（可选，默认 20，最大 100）

响应：
```json
{
  "type": "success",
  "data": {
    "date": "2026-02-04",
    "total": 12,
    "page": 1,
    "page_size": 20,
    "total_pages": 1,
    "logs": [
      {
        "id": "2026-02-04T10:20:30.123456_0",
        "timestamp": "2026-02-04T10:20:30.123456",
        "type": "writing_start",
        "writing_type": "official_document",
        "session_id": "session_xxx",
        "instruction_preview": "请写一份关于..."
      },
      {
        "id": "2026-02-04T10:21:02.456789_1",
        "timestamp": "2026-02-04T10:21:02.456789",
        "type": "writing_result",
        "writing_type": "official_document",
        "session_id": "session_xxx",
        "content_length": 1200,
        "source_count": 3,
        "generation_time": 12.5,
        "content_preview": "生成内容前200字..."
      }
    ]
  }
}
```

### 3) 获取日志详情
**GET** `/api/writing_logs/detail`

Query 参数：
- `id`（必填：`timestamp_lineIndex`）
- `date`（可选，`YYYY-MM-DD`）

响应：
```json
{
  "type": "success",
  "data": {
    "id": "2026-02-04T10:21:02.456789_1",
    "timestamp": "2026-02-04T10:21:02.456789",
    "type": "writing_result",
    "writing_type": "official_document",
    "session_id": "session_xxx",
    "user_instruction": "完整指令",
    "generated_content": "完整生成内容",
    "content_length": 1200,
    "source_count": 3,
    "generation_time": 12.5,
    "metadata": {
      "user_id": "alice",
      "write_mode": "generate",
      "enable_thinking": false,
      "use_kb": true,
      "ocr_used": false
    }
  }
}
```

### 4) 获取统计信息
**GET** `/api/writing_logs/statistics?days=7`

响应：
```json
{
  "type": "success",
  "data": {
    "period": {
      "start_date": "2026-01-29",
      "end_date": "2026-02-04",
      "days": 7
    },
    "summary": {
      "total_entries": 120,
      "total_sessions": 25,
      "success_count": 110,
      "error_count": 10,
      "avg_generation_time": 12.3,
      "avg_content_length": 980
    },
    "writing_types": {
      "official_document": 50,
      "data_analysis_report": 40,
      "general_writing": 30
    },
    "daily_stats": [
      {
        "date": "2026-02-04",
        "total": 10,
        "success": 9,
        "errors": 1
      }
    ]
  }
}
```

## 前端展示规则
### 写作类型映射
- `official_document` → 公文写作
- `data_analysis_report` → 数据分析报告
- `general_writing` → 通用写作

### 日志类型映射
- `writing_start` → 开始写作
- `retrieval_result` → 检索完成
- `writing_result` → 写作完成
- `writing_error` → 写作错误

### 列表展示建议
- `writing_start`：显示 `instruction_preview` + `session_id`
- `retrieval_result`：显示 `retrieved_count`、`reranked_count`、`avg_score`、`source_files_preview`
- `writing_result`：显示 `content_length`、`source_count`、`generation_time`、`content_preview`
- `writing_error`：显示 `error_type`、`error_message`

## 推荐前端初始化流程
1. 调 `GET /api/writing_logs/dates`
2. 若有日期，选 `dates[0]`；否则用本地“今天”
3. 调 `GET /api/writing_logs/daily`
4. 调 `GET /api/writing_logs/statistics?days=7`

## 常见错误与处理
- 日期格式不对：显示“日期格式错误”
- `writing_type` 非法：显示后端返回错误
- 返回空列表：显示“该日期暂无写作日志”

## 重要说明
- 日志按天文件写入，跨天运行不会自动出现在“今天”文件，必须使用 `dates` 的最新日期
- 详情接口依赖 `id`，不要自行拼接，必须使用 `daily` 返回的 `id`
