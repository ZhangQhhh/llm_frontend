# IP黑名单与登录IP后端新增接口联调文档

- 文档版本: `v1.0`
- 更新时间: `2026-02-27`
- 适用后端: `Supervisory-commissions`

## 1. 联调基础信息

1. 本次新增接口统一前缀为 `/api`。
2. 本地直连示例：`http://127.0.0.1:3000/api`
3. Nginx转发示例：`http://<host>/api`（由 Nginx `/api/ -> 3000/api/` 转发）
4. 鉴权方式：`Authorization: Bearer <token>`

## 2. 统一返回结构

```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {}
}
```

说明：
1. 业务错误通常在响应体 `code` 返回 `400/404/409`，HTTP 状态码多数仍为 `200`。
2. 权限类错误（未登录/无权限）由 Spring Security 返回 `401/403`。
3. 黑名单命中时，返回 HTTP `403` 且响应体为统一 JSON。

## 3. 接口清单

1. `POST /api/user/account/login-ip/` 记录当前登录IP
2. `GET /api/admin/users/login-ips/` 查询用户最近登录IP列表
3. `GET /api/admin/ip-blacklist/` 查询IP黑名单
4. `POST /api/admin/ip-blacklist/` 新增IP黑名单
5. `DELETE /api/admin/ip-blacklist/{identifier}/` 删除IP黑名单（按id或ip/cidr）
6. `DELETE /api/admin/ip-blacklist/` 删除IP黑名单（按body）

说明：以上路径均同时兼容不带末尾 `/` 的形式。

## 4. 接口详情

## 4.1 记录当前登录IP

- 方法：`POST`
- 路径：`/api/user/account/login-ip/`
- 权限：已登录用户
- 请求体：可传 `{}` 或空

后端IP提取优先级：
1. `X-Forwarded-For` 第一个可用IP
2. `X-Real-IP`
3. `remoteAddr`

成功示例：
```json
{
  "success": true,
  "code": 200,
  "message": "登录IP记录成功",
  "data": {
    "userId": "10001",
    "ip": "53.21.18.98",
    "lastLoginAt": "2026-02-27 11:10:00"
  }
}
```

失败示例（参数/解析失败）：
```json
{
  "success": false,
  "code": 400,
  "message": "无法解析客户端IP",
  "data": {}
}
```

## 4.2 查询用户最近登录IP列表

- 方法：`GET`
- 路径：`/api/admin/users/login-ips/`
- 权限：`ADMIN` 或 `SUPER_ADMIN`

Query 参数：
1. `userId` 可选，整数
2. `keyword` 可选，按用户名模糊查询
3. `page` 可选，默认 `1`
4. `pageSize` 可选，默认 `200`，上限 `500`

成功示例：
```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {
    "list": [
      {
        "userId": 10001,
        "user_id": 10001,
        "id": 10001,
        "username": "zhangsan",
        "ip": "53.21.18.98",
        "login_ip": "53.21.18.98",
        "last_login_ip": "53.21.18.98",
        "lastLogin": "2026-02-27 11:10:00",
        "last_login_at": "2026-02-27 11:10:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 200
  }
}
```

## 4.3 查询IP黑名单

- 方法：`GET`
- 路径：`/api/admin/ip-blacklist/`
- 权限：`SUPER_ADMIN`

Query 参数：
1. `status` 可选，仅支持 `0/1`
2. `keyword` 可选，匹配 `ip` 或 `remark`
3. `page` 可选，默认 `1`
4. `pageSize` 可选，默认 `50`，上限 `500`

成功示例：
```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "ip": "53.21.16.0/22",
        "ip_version": 4,
        "is_cidr": 1,
        "remark": "测试网段",
        "status": 1,
        "hit_count": 3,
        "last_hit_at": "2026-02-27 11:15:00",
        "created_by": "superadmin",
        "updated_by": "superadmin",
        "created_at": "2026-02-27 11:00:00",
        "updated_at": "2026-02-27 11:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 50
  }
}
```

## 4.4 新增IP黑名单

- 方法：`POST`
- 路径：`/api/admin/ip-blacklist/`
- 权限：`SUPER_ADMIN`
- 请求头：可选 `X-User-Name`（未取到登录用户名时作为操作人兜底）

请求体：
```json
{
  "ip": "53.21.16.0/22",
  "remark": "测试网段"
}
```

字段约束：
1. `ip` 必填，支持 IPv4/IPv6/CIDR
2. `remark` 可选，最大 `255`
3. 重复新增返回业务码 `409`

成功示例：
```json
{
  "success": true,
  "code": 200,
  "message": "新增成功",
  "data": {
    "id": 1,
    "ip": "53.21.16.0/22"
  }
}
```

重复示例：
```json
{
  "success": false,
  "code": 409,
  "message": "IP已在黑名单中",
  "data": {}
}
```

## 4.5 删除IP黑名单

### 方式A：按路径删除
- 方法：`DELETE`
- 路径：`/api/admin/ip-blacklist/{identifier}/`
- 权限：`SUPER_ADMIN`

`identifier` 支持：
1. 数字ID：如 `3`
2. IP/CIDR（需URL编码）：如 `53.21.16.0%2F22`

可选请求体（兜底）：
```json
{
  "id": 3,
  "ip": "53.21.16.0/22"
}
```

### 方式B：按Body删除
- 方法：`DELETE`
- 路径：`/api/admin/ip-blacklist/`
- 权限：`SUPER_ADMIN`
- 请求体：
```json
{
  "id": 3,
  "ip": "53.21.16.0/22"
}
```

成功示例：
```json
{
  "success": true,
  "code": 200,
  "message": "删除成功",
  "data": {}
}
```

不存在示例：
```json
{
  "success": false,
  "code": 404,
  "message": "删除目标不存在",
  "data": {}
}
```

## 5. 黑名单拦截行为（联调重点）

1. 拦截范围：`/api/**` 与 `/ws/**`
2. 命中黑名单后直接返回 HTTP `403`
3. 响应示例：
```json
{
  "success": false,
  "code": 403,
  "message": "当前IP已被禁止访问",
  "data": null
}
```

## 6. 前端联调确认点

1. 登录IP上报请使用 `/api/user/account/login-ip/`（注意带 `/api` 前缀）。
2. 黑名单删除建议优先使用路径参数方式（`id` 或 URL 编码后的 `ip/cidr`）。
3. 对业务错误请优先读取响应体 `code` 与 `message`，不要只看 HTTP 状态码。
4. 命中黑名单会出现 HTTP `403`，前端需提示“IP被禁止访问”。

## 7. 本地联调建议

1. 本地不经过Nginx可直接联调：`http://127.0.0.1:3000/api/...`
2. 如需模拟代理IP，可手动加请求头：
   - `X-Forwarded-For: 53.21.18.98`
   - `X-Real-IP: 53.21.18.98`

