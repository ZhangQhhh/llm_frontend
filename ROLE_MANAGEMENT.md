# 用户角色注册管理方案

## 角色定义

项目中定义了三种用户角色：

1. **USER（普通用户）** - 默认角色
2. **ADMIN（管理员）** - 管理权限
3. **SUPER_ADMIN（超级管理员）** - 最高权限

## 注册策略

### 1. 普通用户注册（USER）
- **接口**: `POST /api/account/register/`
- **访问权限**: 公开，无需认证
- **创建方式**: 任何人都可以通过此接口注册
- **角色**: 自动设置为 `USER`，用户无法指定其他角色
- **实现**: `RegisterController.register()`

### 2. 管理员创建（ADMIN）
- **接口**: `POST /api/admin/create-admin/`
- **访问权限**: 仅超级管理员可访问
- **创建方式**: 只能由超级管理员通过专门接口创建
- **角色**: 强制设置为 `ADMIN`
- **实现**: `AdminManageController.createAdmin()`
- **权限验证**: 使用 `@PreAuthorize("hasRole('SUPER_ADMIN')")` 注解

### 3. 超级管理员创建（SUPER_ADMIN）
- **创建方式**: 通过数据库初始化脚本创建
- **安全考虑**: 不提供任何API接口创建超级管理员
- **数量建议**: 系统中只保留1-2个超级管理员账号
- **脚本位置**: `src/main/resources/init_super_admin.sql`

## 实现细节

### 普通用户注册流程
```
用户提交注册信息
    ↓
参数校验（用户名、密码、邮箱）
    ↓
检查用户名/邮箱是否已存在
    ↓
强制设置角色为 USER
    ↓
密码加密（BCrypt）
    ↓
保存到数据库
    ↓
返回注册成功
```

### 管理员创建流程
```
超级管理员登录
    ↓
调用创建管理员接口
    ↓
验证当前用户是否为 SUPER_ADMIN
    ↓
参数校验
    ↓
检查用户名/邮箱是否已存在
    ↓
强制设置角色为 ADMIN
    ↓
密码加密
    ↓
保存到数据库
    ↓
返回创建成功
```

## 安全措施

1. **角色强制设置**: 在服务层强制设置角色，忽略客户端传入的角色参数
2. **权限验证**: 管理员创建接口使用 Spring Security 的 `@PreAuthorize` 进行权限控制
3. **密码加密**: 所有密码使用 BCrypt 加密存储
4. **参数校验**: 严格校验用户名、密码、邮箱等必填字段
5. **唯一性检查**: 防止用户名和邮箱重复注册

## 初始化超级管理员

### 步骤：

1. 生成加密密码（使用 BCrypt 工具）
2. 执行 `init_super_admin.sql` 脚本
3. 首次登录后立即修改密码

### 生成加密密码示例（Java代码）：
```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String encodedPassword = encoder.encode("your_password");
System.out.println(encodedPassword);
```

## API 接口文档

### 1. 用户注册
**请求:**
```
POST /api/account/register/
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456",
  "email": "user@example.com"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": null
}
```

### 2. 创建管理员（需要超级管理员权限）
**请求:**
```
POST /api/admin/create-admin/
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "admin001",
  "password": "admin123",
  "email": "admin@example.com"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "管理员创建成功",
  "data": null
}
```

## 注意事项

1. **TODO**: UserMapper 需要添加 `insert()` 方法用于保存用户
2. 确保已配置 Spring Security 和 BCrypt 密码编码器
3. 超级管理员账号应该妥善保管，不要泄露
4. 建议定期审计管理员账号列表
5. 生产环境部署前务必修改默认超级管理员密码

## 文件清单

- `DefaultConstant.java` - 角色常量定义
- `RegisterController.java` - 普通用户注册控制器
- `RegisterServiceImpl.java` - 注册服务实现
- `AdminManageController.java` - 管理员管理控制器
- `AdminManageServiceImpl.java` - 管理员管理服务实现
- `init_super_admin.sql` - 超级管理员初始化脚本

