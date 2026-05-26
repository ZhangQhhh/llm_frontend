/**
 * 权限管理配置
 */

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'super_admin',  // 超级管理员
  ADMIN = 'admin',               // 管理员
  BJZX_ADMIN = 'bjzx_admin',    // 边检智学管理员
  USER = 'user'                  // 普通用户
}

// 角色显示名称
export const RoleNames: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.BJZX_ADMIN]: '边检智学管理员',
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
  [UserRole.BJZX_ADMIN]: {
    canAccessAdmin: true,
    canAccessConversation: true,
    canAccessKnowledge: true,
    canManageUsers: false,
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

// 检查是否可访问管理员Tab（账号审核、密码管理）
export function canAccessAdminTabs(role: UserRole | null): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
}

// 检查是否可访问边检智学Tab（题库管理、回收站、试卷管理、成绩导出、考试发布）
export function canAccessBjzxTabs(role: UserRole | null, isBjzxAdmin: boolean): boolean {
  return role === UserRole.SUPER_ADMIN || isBjzxAdmin === true;
}

// ==================== 可见模块（管理中心 Tab）====================

// 管理中心所有 Tab 键（与后端 visible_tabs_routes.ALL_TABS 保持一致）
export enum AdminTab {
  APPROVAL = 'approval',           // 账号审核
  PASSWORD = 'password',           // 密码管理
  QUESTIONS = 'questions',         // 题库管理
  RECYCLE = 'recycle',             // 回收站
  PAPERS = 'papers',               // 试卷管理
  EXPORT = 'export',               // 成绩导出
  PUBLISH = 'publish',             // 考试发布
  EXAM_SETTINGS = 'exam-settings', // 考试设置
}

// Tab 显示名称
export const AdminTabNames: Record<string, string> = {
  [AdminTab.APPROVAL]: '账号审核',
  [AdminTab.PASSWORD]: '密码管理',
  [AdminTab.QUESTIONS]: '题库管理',
  [AdminTab.RECYCLE]: '回收站',
  [AdminTab.PAPERS]: '试卷管理',
  [AdminTab.EXPORT]: '成绩导出',
  [AdminTab.PUBLISH]: '考试发布',
  [AdminTab.EXAM_SETTINGS]: '考试设置',
};

// 一个 Tab 默认归属哪类权限组（用于在没有显式可见模块配置时回退到角色级权限）
const ADMIN_GROUP_TABS = new Set<string>([AdminTab.APPROVAL, AdminTab.PASSWORD]);
const BJZX_GROUP_TABS = new Set<string>([
  AdminTab.QUESTIONS,
  AdminTab.RECYCLE,
  AdminTab.PAPERS,
  AdminTab.EXPORT,
  AdminTab.PUBLISH,
  AdminTab.EXAM_SETTINGS,
]);

/**
 * 综合判断某 Tab 是否对当前用户可见。
 *
 * @param tab            Tab 键（AdminTab 枚举值）
 * @param role           当前用户角色
 * @param isBjzxAdmin    是否为边检智学管理员
 * @param allowedTabs    后端返回的当前用户可见 Tab 列表（null 表示未配置/未加载）
 *
 * 规则：
 * 1) 超级管理员永远可见全部 Tab；
 * 2) 角色不具备访问条件（如普通用户）→ 不可见；
 * 3) allowedTabs 已配置（非 null）→ 必须在列表中；
 * 4) allowedTabs 未配置 → 按角色默认可见集合。
 */
export function isTabVisible(
  tab: string,
  role: UserRole | null,
  isBjzxAdmin: boolean,
  allowedTabs: string[] | null
): boolean {
  if (role === UserRole.SUPER_ADMIN) return true;

  // 角色级 baseline：必须先满足角色访问条件
  const adminOk = ADMIN_GROUP_TABS.has(tab) && canAccessAdminTabs(role);
  const bjzxOk = BJZX_GROUP_TABS.has(tab) && canAccessBjzxTabs(role, isBjzxAdmin);
  if (!adminOk && !bjzxOk) return false;

  // 显式配置过：仅当 tab 在列表中
  if (Array.isArray(allowedTabs)) {
    return allowedTabs.includes(tab);
  }
  // 未配置：按角色默认放开
  return true;
}
