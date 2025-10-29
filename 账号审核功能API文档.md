# 账号审核功能 - 后端API开发文档

## 概述

本文档描述了账号审核功能所需的后端API接口规范。新注册的用户默认状态为"封禁"（待审核），需要管理员或超级管理员审核通过后才能正常使用系统。

---

## 1. 用户注册接口（已有，需修改）

### 接口信息
- **接口路径**: `/user/account/register/`
- **请求方法**: `POST`
- **权限要求**: 无（公开接口）

### 请求参数

```json
{
    "username": "rtst91",
    "password": "ppptest",
    "policeId": "262841",
    "idCardNumber": "323456372840503259"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| policeId | string | 是 | 警号 |
| idCardNumber | string | 是 | 身份证号码（18位） |

### 响应格式

**成功响应**:
```json
{
    "success": true,
    "code": 200,
    "message": "注册成功",
    "data": {}
}
```

### 业务逻辑要求

1. **默认状态**: 新注册用户的 `status` 字段应设置为 `0`（封禁/待审核状态）
2. **字段验证**:
   - 用户名不能重复
   - 密码长度至少6位
   - 警号格式验证
   - 身份证号格式验证（18位，符合身份证号规则）
3. **密码加密**: 使用bcrypt等安全算法加密存储
4. **返回信息**: 不返回敏感信息（如加密后的密码）

---

## 2. 获取待审核用户列表

### 接口信息
- **接口路径**: `/api/admin/users/pending/`
- **请求方法**: `GET`
- **权限要求**: 管理员（ADMIN）或超级管理员（SUPER_ADMIN）

### 请求参数
无

### 响应格式

**成功响应**:
```json
{
    "success": true,
    "code": 200,
    "message": "获取成功",
    "data": [
        {
            "id": 123,
            "username": "rtst91",
            "policeId": "262841",
            "idCardNumber": "323456372840503259",
            "created_at": "2025-10-29 17:30:00",
            "status": 0
        },
        {
            "id": 124,
            "username": "test02",
            "policeId": "262842",
            "idCardNumber": "320106199001011234",
            "created_at": "2025-10-29 18:00:00",
            "status": 0
        }
    ]
}
```

**字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 用户ID |
| username | string | 用户名 |
| policeId | string | 警号 |
| idCardNumber | string | 身份证号（前端会脱敏显示） |
| created_at | string | 注册时间（格式：YYYY-MM-DD HH:mm:ss） |
| status | integer | 状态（0=待审核/封禁，1=正常） |

### 业务逻辑要求

1. **筛选条件**: 只返回 `status = 0` 的用户
2. **排序**: 按注册时间倒序排列（最新的在前）
3. **权限验证**: 验证请求者是否为管理员或超级管理员

---

## 3. 批准用户注册

### 接口信息
- **接口路径**: `/api/admin/users/approve/`
- **请求方法**: `POST`
- **权限要求**: 管理员（ADMIN）或超级管理员（SUPER_ADMIN）

### 请求参数

```json
{
    "id": 123,
    "username": "rtst91"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 否 | 用户ID（优先使用） |
| username | string | 否 | 用户名（id不存在时使用） |

**注**: `id` 和 `username` 至少提供一个

### 响应格式

**成功响应**:
```json
{
    "success": true,
    "code": 200,
    "message": "账号已批准",
    "data": {
        "userId": 123,
        "username": "rtst91",
        "status": 1
    }
}
```

**失败响应**:
```json
{
    "success": false,
    "code": 400,
    "message": "用户不存在或已被处理",
    "data": null
}
```

### 业务逻辑要求

1. **状态更新**: 将用户的 `status` 字段从 `0` 更新为 `1`
2. **验证检查**:
   - 用户必须存在
   - 用户当前状态必须为 `0`（待审核）
   - 不能重复批准已批准的用户
3. **操作日志**: 建议记录审批操作日志（操作人、操作时间、操作类型）
4. **权限验证**: 验证请求者是否为管理员或超级管理员

---

## 4. 拒绝用户注册

### 接口信息
- **接口路径**: `/api/admin/users/reject/`
- **请求方法**: `POST`
- **权限要求**: 管理员（ADMIN）或超级管理员（SUPER_ADMIN）

### 请求参数

```json
{
    "id": 124,
    "username": "test02"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | 否 | 用户ID（优先使用） |
| username | string | 否 | 用户名（id不存在时使用） |

**注**: `id` 和 `username` 至少提供一个

### 响应格式

**成功响应**:
```json
{
    "success": true,
    "code": 200,
    "message": "已拒绝该用户的注册申请",
    "data": {
        "userId": 124,
        "username": "test02"
    }
}
```

**失败响应**:
```json
{
    "success": false,
    "code": 400,
    "message": "用户不存在或已被处理",
    "data": null
}
```

### 业务逻辑要求

1. **处理方式**: 有两种实现方案：
   - **方案A（推荐）**: 直接删除该用户记录
   - **方案B**: 保留记录但标记为"已拒绝"状态（需新增状态值，如 `status = -1`）
2. **验证检查**:
   - 用户必须存在
   - 用户当前状态必须为 `0`（待审核）
3. **操作日志**: 建议记录拒绝操作日志
4. **权限验证**: 验证请求者是否为管理员或超级管理员

---

## 5. 获取用户信息接口（已有，需修改）

### 接口信息
- **接口路径**: `/api/user/account/info/`
- **请求方法**: `GET`
- **权限要求**: 需要登录（JWT Token）

### 请求参数
无（通过JWT Token识别用户）

### 响应格式

**成功响应**:
```json
{
    "success": true,
    "code": 200,
    "message": "成功",
    "data": {
        "data": {
            "id": 1,
            "username": "zq",
            "role": "SUPER_ADMIN",
            "password": "$2a$10$uikCnaf21iy2vl2GBWmy/uJU4oRhyhe8r0LYQ687OylVjWXZDgoBK",
            "status": 1,
            "email": null,
            "policeId": null,
            "idCardNumber": null
        }
    }
}
```

**字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 用户ID |
| username | string | 用户名 |
| role | string | 角色（USER/ADMIN/SUPER_ADMIN） |
| password | string | 加密后的密码（建议不返回此字段） |
| status | integer | 状态（0=封禁，1=正常） |
| email | string/null | 邮箱 |
| policeId | string/null | 警号 |
| idCardNumber | string/null | 身份证号 |

### 业务逻辑要求

1. **安全性**: 建议不返回 `password` 字段，即使是加密后的
2. **数据结构**: 保持现有的嵌套 `data.data` 结构
3. **新增字段**: 确保返回 `email`、`policeId`、`idCardNumber` 字段

---

## 6. 用户封禁/解封接口（已有）

### 封禁用户
- **接口路径**: `/api/admin/users/ban/`
- **请求方法**: `POST`

### 解封用户
- **接口路径**: `/api/admin/users/unban/`
- **请求方法**: `POST`

**注**: 这两个接口已存在，与账号审核功能配合使用。批准后的用户（status=1）可以被管理员封禁，封禁后可以解封。

---

## 数据库设计建议

### 用户表（users）字段

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN', 'SUPER_ADMIN') DEFAULT 'USER',
    status TINYINT DEFAULT 0 COMMENT '0=待审核/封禁, 1=正常, -1=已拒绝(可选)',
    email VARCHAR(100),
    policeId VARCHAR(20),
    idCardNumber VARCHAR(18),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_username (username)
);
```

### 审核日志表（可选，用于审计）

```sql
CREATE TABLE approval_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    operator_id INT NOT NULL COMMENT '操作人ID',
    action ENUM('APPROVE', 'REJECT', 'BAN', 'UNBAN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);
```

---

## 错误码规范

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或Token失效） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

---

## 前端调用流程

### 用户注册流程
1. 用户填写注册表单（用户名、密码、警号、身份证号）
2. 提交到 `/user/account/register/`
3. 后端创建用户，`status=0`
4. 前端显示提示：**"注册成功！您的账号需要等待管理员审批通过后方可使用，请耐心等待。"**

### 管理员审核流程
1. 管理员登录后访问"账号审核"页面
2. 调用 `/api/admin/users/pending/` 获取待审核列表
3. 对每个用户可以：
   - 点击"批准"：调用 `/api/admin/users/approve/`
   - 点击"拒绝"：调用 `/api/admin/users/reject/`
4. 操作成功后刷新列表

### 用户登录流程
1. 用户输入用户名密码登录
2. 后端验证用户名密码正确
3. **检查 `status` 字段**：
   - 如果 `status=0`：返回错误 "账号待审核，请联系管理员"
   - 如果 `status=1`：正常登录，返回Token
   - 如果 `status=-1`：返回错误 "账号已被拒绝"

---

## 安全建议

1. **身份证号加密存储**: 建议对身份证号进行加密存储，查询时解密
2. **操作日志**: 记录所有审核操作，便于审计
3. **权限验证**: 严格验证管理员权限，防止越权操作
4. **防止暴力注册**: 添加注册频率限制（如同一IP 1小时内最多注册3次）
5. **敏感信息**: 不要在日志中记录完整的身份证号和密码

---

## 测试用例

### 注册接口测试
```bash
# 正常注册
curl -X POST http://localhost:3000/user/account/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test001",
    "password": "123456",
    "policeId": "262841",
    "idCardNumber": "320106199001011234"
  }'
```

### 获取待审核列表
```bash
curl -X GET http://localhost:3000/api/admin/users/pending/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 批准用户
```bash
curl -X POST http://localhost:3000/api/admin/users/approve/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "username": "test001"
  }'
```

### 拒绝用户
```bash
curl -X POST http://localhost:3000/api/admin/users/reject/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 124,
    "username": "test002"
  }'
```

---

## 联系方式

如有疑问，请联系前端开发团队。

**文档版本**: v1.0  
**更新日期**: 2025-10-29
