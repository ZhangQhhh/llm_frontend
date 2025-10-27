# 权限管理系统说明

## 概述

项目已实现完整的三级权限管理系统，包括：
- 超级管理员（super_admin）
- 管理员（admin）
- 普通用户（user）

## 用户角色

### 1. 超级管理员 (super_admin)
**权限：**
- ✅ 访问所有功能
- ✅ 访问管理中心
- ✅ 管理用户
- ✅ 管理系统设置
- ✅ 使用多轮对话
- ✅ 使用知识问答

**标识：**
- 角色标签：红色（danger）
- 显示文本：超级管理员

### 2. 管理员 (admin)
**权限：**
- ✅ 访问管理中心
- ✅ 管理用户
- ❌ 管理系统设置
- ✅ 使用多轮对话
- ✅ 使用知识问答

**标识：**
- 角色标签：橙色（warning）
- 显示文本：管理员

### 3. 普通用户 (user)
**权限：**
- ❌ 访问管理中心
- ❌ 管理用户
- ❌ 管理系统设置
- ✅ 使用多轮对话（需登录）
- ✅ 使用知识问答

**标识：**
- 角色标签：蓝色（info）
- 显示文本：普通用户

## 页面访问权限

| 页面 | 路径 | 需要登录 | 需要管理员 | 说明 |
|------|------|---------|-----------|------|
| 首页 | / | ❌ | ❌ | 所有人可访问 |
| 知识问答 | /knowledge-qa | ❌ | ❌ | 所有人可访问 |
| 多轮对话 | /conversation | ✅ | ❌ | 需要登录 |
| 管理中心 | /admin | ✅ | ✅ | 仅管理员 |
| 个人设置 | /profile | ✅ | ❌ | 需要登录 |
| 登录页 | /login | ❌ | ❌ | 未登录可访问 |

## 技术实现

### 1. 权限配置文件
**位置：** `src/config/permissions.ts`

```typescript
// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user'
}

// 权限检查函数
hasPermission(role, permission)
isAdmin(role)
isSuperAdmin(role)
```

### 2. Vuex Store
**位置：** `src/store/user.ts`

**新增Getters：**
- `userRole` - 获取当前用户角色
- `isAdmin` - 检查是否为管理员
- `isSuperAdmin` - 检查是否为超级管理员
- `hasPermission` - 检查特定权限

### 3. 路由守卫
**位置：** `src/router/index.ts`

**功能：**
- 检查登录状态
- 检查管理员权限
- 自动重定向
- 设置页面标题

**路由元信息：**
```typescript
meta: {
  requiresAuth: true,      // 需要登录
  requiresAdmin: true,     // 需要管理员
  title: '页面标题'
}
```

### 4. 导航栏
**位置：** `src/components/NavBar.vue`

**功能：**
- 使用Element UI重构
- 显示用户角色标签
- 根据权限显示菜单项
- 用户下拉菜单
- 管理中心入口（仅管理员可见）

## 使用方法

### 在组件中检查权限

```vue
<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 检查是否为管理员
const isAdmin = computed(() => store.getters.isAdmin)

// 检查特定权限
const canManageUsers = computed(() => 
  store.getters.hasPermission('canManageUsers')
)
</script>

<template>
  <!-- 仅管理员可见 -->
  <div v-if="isAdmin">
    管理员专属内容
  </div>
  
  <!-- 根据权限显示 -->
  <button v-if="canManageUsers">
    管理用户
  </button>
</template>
```

### 在路由中设置权限

```typescript
{
  path: '/admin',
  name: 'admin',
  component: AdminView,
  meta: {
    requiresAuth: true,      // 需要登录
    requiresAdmin: true,     // 需要管理员权限
    title: '管理中心'
  }
}
```

## 权限流程

### 登录流程
1. 用户输入用户名密码
2. 调用登录API
3. 获取JWT token
4. 调用用户信息API获取角色
5. 存储到Vuex store
6. 重定向到目标页面或首页

### 权限检查流程
1. 用户访问页面
2. 路由守卫检查meta信息
3. 检查是否需要登录（requiresAuth）
4. 检查是否需要管理员（requiresAdmin）
5. 验证通过则放行，否则重定向

### 未登录访问受保护页面
1. 用户访问 `/conversation`
2. 路由守卫检测未登录
3. 显示提示：「请先登录」
4. 重定向到 `/login?redirect=/conversation`
5. 登录成功后自动返回原页面

### 普通用户访问管理页面
1. 用户访问 `/admin`
2. 路由守卫检测非管理员
3. 显示提示：「无权访问，需要管理员权限」
4. 重定向到首页

## UI展示

### 导航栏用户信息
```
[头像] 用户名 [角色标签] ▼
```

**角色标签颜色：**
- 超级管理员：红色
- 管理员：橙色
- 普通用户：蓝色

### 下拉菜单
```
用户名
─────────
个人设置
退出登录
```

## 后端API要求

### 登录接口
**端点：** `POST /user/account/token/`

**响应：**
```json
{
  "error_msg": "success",
  "token": "jwt_token_here"
}
```

### 用户信息接口
**端点：** `GET /user/account/info/`

**Headers：** `Authorization: Bearer {token}`

**响应：**
```json
{
  "error_msg": "success",
  "id": "user_id",
  "username": "username",
  "role": "admin",  // super_admin / admin / user
  "email": "email@example.com",
  "photo": "avatar_url",
  "status": "1"
}
```

## 注意事项

1. **角色字段**
   - 后端返回的`role`字段必须是：`super_admin`、`admin`或`user`
   - 大小写敏感

2. **Token存储**
   - JWT token存储在localStorage的`jwt_token`键
   - 登出时会自动清除

3. **权限缓存**
   - 用户信息存储在Vuex store
   - 刷新页面需要重新获取用户信息

4. **管理中心**
   - 当前为占位页面
   - 后续可扩展具体管理功能

## 扩展建议

1. **添加更多角色**
   - 在`permissions.ts`中添加新角色
   - 更新`RolePermissions`配置
   - 更新UI显示逻辑

2. **细粒度权限**
   - 扩展`RolePermissions`对象
   - 添加更多权限项
   - 在组件中使用`hasPermission`检查

3. **权限缓存优化**
   - 实现token自动刷新
   - 添加权限预加载
   - 优化路由守卫性能

4. **管理界面开发**
   - 用户管理（增删改查）
   - 角色分配
   - 权限配置
   - 系统设置

## 测试建议

### 测试用例

1. **未登录用户**
   - ✅ 可以访问首页
   - ✅ 可以访问知识问答
   - ❌ 不能访问多轮对话（重定向到登录）
   - ❌ 不能访问管理中心（重定向到登录）

2. **普通用户**
   - ✅ 可以访问所有公开页面
   - ✅ 可以访问多轮对话
   - ❌ 不能访问管理中心（提示无权限）
   - ✅ 导航栏不显示管理中心入口

3. **管理员**
   - ✅ 可以访问所有页面
   - ✅ 导航栏显示管理中心入口
   - ✅ 角色标签显示为橙色

4. **超级管理员**
   - ✅ 可以访问所有页面
   - ✅ 拥有所有权限
   - ✅ 角色标签显示为红色

## 总结

权限系统已完整实现，包括：
- ✅ 三级角色体系
- ✅ 路由权限守卫
- ✅ UI权限控制
- ✅ Element UI美化
- ✅ 用户信息展示
- ✅ 登录重定向
- ✅ 权限提示

系统架构清晰，易于扩展和维护！
