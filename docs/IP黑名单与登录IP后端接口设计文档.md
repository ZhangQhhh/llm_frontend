# IP黑名单与登录IP后端接口设计文档

- 文档版本: `v1.0`
- 创建日期: `2026-02-27`
- 适用环境: `生产/测试`
- 对接对象: `后端、运维、前端`

## 1. 背景与目标

当前前端已完成以下能力：

1. 超级管理员页面可维护 IP 黑名单（新增/删除/查看）。
2. 用户登录后会调用接口上报“本次登录IP”。
3. 用户仪表盘支持展示“用户最近登录IP、最近登录时间”。

本文件定义后端需要新增的接口、数据模型、鉴权规则与落地建议，供后端直接实现。

## 2. 与前端已对接的接口清单（必须实现）

> 前端已按下列路径接入，建议后端按此路径落地，避免前端再次改动。

### 2.1 用户侧

1. `POST /user/account/login-ip/`
   - 用途: 登录成功后记录当前用户登录IP。
   - 调用方: 前端登录页（登录后、获取用户信息成功后触发，非阻塞）。

### 2.2 管理侧

1. `GET /api/admin/users/login-ips/`
   - 用途: 获取用户最近登录IP/时间（用于用户仪表盘）。
2. `GET /api/admin/ip-blacklist/`
   - 用途: 获取IP黑名单列表。
3. `POST /api/admin/ip-blacklist/`
   - 用途: 新增黑名单IP（IPv4/IPv6/CIDR）。
4. `DELETE /api/admin/ip-blacklist/{identifier}/`
   - 用途: 删除黑名单记录，`identifier` 支持记录 `id` 或 `ip/cidr`（URL编码后）。

## 3. 全局协议约定

## 3.1 鉴权

1. 采用 `Authorization: Bearer <jwt_token>`。
2. 管理接口要求 `admin/super_admin`，建议仅 `super_admin` 可维护黑名单。
3. 继续兼容现有请求头:
   - `X-User-Role`
   - `X-User-Name`

## 3.2 响应结构（建议统一）

```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {}
}
```

说明：

1. 前端对成功判定兼容 `success=true` 或 `code=200` 或 HTTP `204`。
2. 建议统一返回 `200 + success=true`，可减少联调歧义。

## 3.3 常见错误码（建议）

1. `400`: 参数错误（IP格式错误、缺少字段）。
2. `401`: 未登录/Token失效。
3. `403`: 权限不足。
4. `404`: 资源不存在（删除目标不存在）。
5. `409`: 重复冲突（黑名单已存在）。
6. `500`: 服务端异常。

## 4. 数据模型设计（建议）

## 4.1 黑名单表 `ip_blacklist`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK | 主键 |
| `ip` | varchar(128) unique | IP 或 CIDR（标准化后） |
| `ip_version` | tinyint | `4`/`6` |
| `is_cidr` | tinyint | 是否网段 |
| `remark` | varchar(255) | 备注 |
| `status` | tinyint | `1=生效,0=停用` |
| `hit_count` | bigint | 命中次数 |
| `last_hit_at` | datetime | 最近命中时间 |
| `created_by` | varchar(64) | 创建人 |
| `updated_by` | varchar(64) | 更新人 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

建议索引：

1. `unique(ip)`
2. `index(status, updated_at)`

## 4.2 登录IP审计表 `user_login_ip_audit`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK | 主键 |
| `user_id` | bigint | 用户ID |
| `username` | varchar(64) | 用户名（冗余） |
| `ip` | varchar(128) | 登录IP |
| `user_agent` | varchar(512) | UA |
| `login_at` | datetime | 登录时间 |
| `source` | varchar(32) | 来源（web/api） |

建议索引：

1. `index(user_id, login_at desc)`
2. `index(ip, login_at desc)`

## 4.3 用户最近登录快照（可选但推荐）

可采用两种方式：

1. 每次登录写审计表后，同时更新用户表 `users.last_login_ip/last_login_at`。
2. 或维护 `user_last_login` 表，避免频繁写主用户表。

## 5. 接口详细定义

## 5.1 记录当前登录IP

- 方法: `POST`
- 路径: `/user/account/login-ip/`
- 权限: 已登录用户

请求体：

```json
{}
```

说明：

1. 前端不传IP，后端自行解析真实客户端IP。
2. IP提取优先级建议：
   - `X-Forwarded-For` 第一个IP
   - `X-Real-IP`
   - 连接源地址 `remote_addr`

成功响应示例：

```json
{
  "success": true,
  "code": 200,
  "message": "登录IP记录成功",
  "data": {
    "userId": "10001",
    "ip": "53.21.18.98",
    "lastLoginAt": "2026-02-27 10:20:00"
  }
}
```

失败示例：

```json
{
  "success": false,
  "code": 400,
  "message": "无法解析客户端IP",
  "data": null
}
```

## 5.2 查询用户最近登录IP列表

- 方法: `GET`
- 路径: `/api/admin/users/login-ips/`
- 权限: `admin/super_admin`

Query 参数（建议）：

1. `userId` 可选
2. `keyword` 可选（用户名模糊）
3. `page` 可选，默认 `1`
4. `pageSize` 可选，默认 `200`

成功响应示例（推荐格式）：

```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {
    "list": [
      {
        "userId": "10001",
        "username": "zhangsan",
        "ip": "53.21.18.98",
        "lastLogin": "2026-02-27 10:20:00"
      },
      {
        "userId": "10002",
        "username": "lisi",
        "ip": "53.21.18.97",
        "lastLogin": "2026-02-27 10:16:00"
      }
    ],
    "total": 2
  }
}
```

前端兼容字段（建议至少返回其一）：

1. `userId` 或 `user_id` 或 `id`
2. `ip` 或 `login_ip` 或 `last_login_ip`
3. `lastLogin` 或 `last_login_at`

## 5.3 查询IP黑名单

- 方法: `GET`
- 路径: `/api/admin/ip-blacklist/`
- 权限: `super_admin`（推荐）

Query 参数（建议）：

1. `status` 可选（`1` 生效、`0` 停用）
2. `keyword` 可选（IP或备注）
3. `page` 可选
4. `pageSize` 可选

成功响应示例：

```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "ip": "53.21.18.98",
        "remark": "异常流量来源",
        "created_by": "super_admin",
        "updated_by": "super_admin",
        "created_at": "2026-02-27 09:30:00",
        "updated_at": "2026-02-27 09:30:00",
        "status": 1
      },
      {
        "id": 2,
        "ip": "53.21.16.0/22",
        "remark": "测试网段",
        "created_by": "super_admin",
        "updated_by": "super_admin",
        "created_at": "2026-02-27 09:31:00",
        "updated_at": "2026-02-27 09:31:00",
        "status": 1
      }
    ],
    "total": 2
  }
}
```

## 5.4 新增IP黑名单

- 方法: `POST`
- 路径: `/api/admin/ip-blacklist/`
- 权限: `super_admin`（推荐）

请求体：

```json
{
  "ip": "53.21.18.98",
  "remark": "异常流量来源"
}
```

字段约束建议：

1. `ip` 必填，支持：
   - IPv4: `x.x.x.x`
   - IPv4 CIDR: `x.x.x.x/n`
   - IPv6: `xxxx:...`
   - IPv6 CIDR: `xxxx:.../n`
2. `remark` 可选，最大 `255`。
3. 重复新增返回 `409`。

成功响应示例：

```json
{
  "success": true,
  "code": 200,
  "message": "新增成功",
  "data": {
    "id": 3,
    "ip": "53.21.18.98"
  }
}
```

重复冲突示例：

```json
{
  "success": false,
  "code": 409,
  "message": "IP已在黑名单中",
  "data": null
}
```

## 5.5 删除IP黑名单

- 方法: `DELETE`
- 路径: `/api/admin/ip-blacklist/{identifier}/`
- 权限: `super_admin`（推荐）

参数说明：

1. `identifier` 可为数值 `id`。
2. 也可为 `ip/cidr`（注意URL编码）：
   - 示例: `53.21.16.0%2F22`

请求体（可选，前端会携带）：

```json
{
  "id": 3,
  "ip": "53.21.18.98"
}
```

成功响应示例：

```json
{
  "success": true,
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

## 6. 黑名单拦截策略（服务端必须实现）

仅有“增删黑名单接口”不够，必须有请求拦截链路。

推荐至少在应用层实现：

1. 在网关/后端中间件统一解析客户端IP。
2. 命中黑名单时直接拒绝请求（`403` 或自定义 `460`）。
3. 白名单资源可按需放行（如健康检查）。
4. 命中时写审计日志（`ip/uri/user_agent/time`）。

建议额外在 Nginx 层做前置拦截（性能更好）：

1. 后端维护黑名单后，同步生成 `include` 文件。
2. `nginx -s reload` 热更新。
3. Nginx 与应用层双保险。

## 7. 安全与审计要求

1. 所有黑名单维护操作写审计日志：
   - 操作人、时间、IP、动作、变更前后值。
2. 删除操作必须可追溯。
3. 对黑名单管理接口做限流（防误操作或攻击）。
4. 禁止普通管理员越权维护黑名单（建议仅超管）。

## 8. 性能建议

1. 黑名单加载到内存缓存（本地缓存/Redis）并定时刷新。
2. 使用 CIDR 匹配时，建议预编译网段结构（避免逐条字符串比对）。
3. 登录IP列表查询分页，默认限制返回量。

## 9. 联调验收清单

1. 超管新增单个IPv4成功。
2. 超管新增CIDR成功。
3. 重复新增返回冲突错误。
4. 删除黑名单成功。
5. 黑名单命中时访问被拒。
6. 登录后调用 `/user/account/login-ip/` 能写入记录。
7. 用户仪表盘能看到最新登录IP和时间。
8. 非超管调用黑名单接口返回 `403`。

## 10. cURL示例

## 10.1 记录登录IP

```bash
curl -X POST "http://<host>/user/account/login-ip/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{}"
```

## 10.2 查询用户登录IP

```bash
curl -X GET "http://<host>/api/admin/users/login-ips/?page=1&pageSize=50" \
  -H "Authorization: Bearer <token>"
```

## 10.3 查询黑名单

```bash
curl -X GET "http://<host>/api/admin/ip-blacklist/" \
  -H "Authorization: Bearer <token>"
```

## 10.4 新增黑名单

```bash
curl -X POST "http://<host>/api/admin/ip-blacklist/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ip":"53.21.18.98","remark":"异常流量来源"}'
```

## 10.5 删除黑名单

```bash
curl -X DELETE "http://<host>/api/admin/ip-blacklist/53.21.16.0%2F22/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ip":"53.21.16.0/22"}'
```

## 11. 与前端代码映射（便于后端核对）

1. 前端接口常量: `src/config/api/api.ts`
2. 超管IP黑名单页面: `src/views/SuperAdminView.vue`
3. 登录上报IP: `src/views/LoginView.vue`
4. 仪表盘IP展示: `src/views/UserDashboardView.vue`

---

如需，我可以继续补一版 `SQL DDL + 索引 + 示例查询语句` 的可直接执行脚本文档。
