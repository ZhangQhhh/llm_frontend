/**
 * 权限管理配置
 */

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'super_admin',  // 超级管理员
  ADMIN = 'admin',               // 管理员
  USER = 'user'                  // 普通用户
}

// 角色显示名称
export const RoleNames: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.USER]: '普通用户'
};

// 角色权限配置
export const RolePermissions = {
  [UserRole.SUPER_ADMIN]: {
    canAccessAdmin: true,      // 可以访问管理界面
    canAccessConversation: true, // 可以使用多轮对话
    canAccessKnowledge: true,    // 可以使用知识问答
    canManageUsers: true,        // 可以管理用户
    canManageSystem: true        // 可以管理系统
  },
  [UserRole.ADMIN]: {
    canAccessAdmin: true,
    canAccessConversation: true,
    canAccessKnowledge: true,
    canManageUsers: true,
    canManageSystem: false
  },
  [UserRole.USER]: {
    canAccessAdmin: false,
    canAccessConversation: true,
    canAccessKnowledge: true,
    canManageUsers: false,
    canManageSystem: false
  }
};

// 检查角色权限
export function hasPermission(role: UserRole | null, permission: keyof typeof RolePermissions[UserRole]): boolean {
  if (!role) return false;
  return RolePermissions[role]?.[permission] || false;
}

// 检查是否为管理员（包括超级管理员）
export function isAdmin(role: UserRole | null): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
}

// 检查是否为超级管理员
export function isSuperAdmin(role: UserRole | null): boolean {
  return role === UserRole.SUPER_ADMIN;
}
