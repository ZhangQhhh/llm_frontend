import router from "@/router";
import { API_ENDPOINTS } from "@/config/api/api";
import http from "@/config/api/http";
import { stopSessionWatch } from "@/utils/sessionWatcher";
import { Module, ActionContext } from "vuex"; // [1] 导入 Vuex 类型
import { UserRole, hasPermission, isAdmin, isSuperAdmin } from "@/config/permissions";

// [2] 定义从 API 返回的用户信息（不包括 token 和登录状态）
interface UserInfo {
  id: string;
  username: string;
  role: string;
  status: string;  // 1 表示没有被封禁，0表示被封禁
  email?: string | null;
  policeId?: string | null;
  idCardNumber?: string | null;
  hasChangedName?: boolean;  // 是否已修改过用户名
  isBjzxAdmin?: boolean;  // 是否为边检智学管理员
  department?: string | null;  // 所属部门
}

// [3] 定义 Vuex state 的完整形状
interface UserState extends UserInfo {
  token: string;
  is_login: boolean;
}

// [4] 定义 updateUser mutation 的载荷 (payload) 类型
interface UserPayload extends UserInfo {
  is_login: boolean;
}

// [5] 定义统一 API 响应类型 (对应后端 XspaceResult)
interface XspaceResult<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// 登录响应数据
interface LoginResponseData {
  token?: string;  // 可选，因为失败时可能没有 token
  error_msg?: string;  // 后端在失败时可能返回此字段
}

// 用户信息响应数据
interface UserInfoResponseData extends UserInfo {}

// [6] 定义 Action 载荷类型
interface LoginData {
  username: string;
  password: string;
  success: (resp: XspaceResult<LoginResponseData>) => void;
  error: (resp: XspaceResult<any>) => void;
}

interface GetInfoData {
  success: (resp: XspaceResult<UserInfoResponseData>) => void;
  error: (resp: XspaceResult<any> | any) => void;
}

// [7] 定义 RootState，如果你有根 state 的话。这里我们用 'any' 代替
type RootState = any;


// [8] 初始 state，并指定其类型为 UserState
const state: UserState = {
  id: "",
  username: "",
  token: "",
  role: "",   
  is_login: false,
  status: "",  // 1 表示没有被封禁，0表示被封禁
  email: null,
  policeId: null,
  idCardNumber: null,
  hasChangedName: undefined,  // 是否已修改过用户名
  isBjzxAdmin: false,  // 是否为边检智学管理员
  department: null,  // 所属部门
};

// [9] 整个模块导出时，指定为 Module<模块State, 根State>
export default {
  // namespaced: true, // 如果你使用了模块命名空间，可以打开这个
  state,
  getters: {
    // 获取用户角色
    userRole(state: UserState): UserRole | null {
      if (!state.role) return null;
      return state.role as UserRole;
    },
    // 检查是否为管理员
    isAdmin(state: UserState): boolean {
      return isAdmin(state.role as UserRole);
    },
    // 检查是否为超级管理员
    isSuperAdmin(state: UserState): boolean {
      return isSuperAdmin(state.role as UserRole);
    },
    // 检查是否为边检智学管理员
    isBjzxAdmin(state: UserState): boolean {
      return state.isBjzxAdmin || false;
    },
    // 检查是否已设置部门
    hasDepartment(state: UserState): boolean {
      return state.department !== null && state.department !== undefined;
    },
    // 检查特定权限
    hasPermission: (state: UserState) => (permission: string) => {
      return hasPermission(state.role as UserRole, permission as any);
    }
  },
  mutations: {
    // [10] 为 state 和 user 参数添加类型
    updateUser(state: UserState, user: UserPayload) {
      state.id = user.id;
      state.username = user.username;
      state.role = user.role;
      state.is_login = user.is_login;
      state.status = user.status;
      state.email = user.email || null;
      state.policeId = user.policeId || null;
      state.idCardNumber = user.idCardNumber || null;
      state.hasChangedName = user.hasChangedName;
      state.isBjzxAdmin = user.isBjzxAdmin || false;
      state.department = user.department || null;
      // 同步用户信息到 localStorage（供 http 拦截器使用）
      localStorage.setItem('multi_turn_chat_user', JSON.stringify({
        username: user.username,
        role: user.role,
        isBjzxAdmin: user.isBjzxAdmin || false,
        department: user.department || null
      }));
    },
    // [10] 为 token 参数添加类型
    updateToken(state: UserState, token: string) {
      state.token = token;
    },
    logout(state: UserState) {
      state.id = "";
      state.username = "";
      state.token = "";
      state.role = "";
      state.is_login = false;
      state.status = "";
      state.email = null;
      state.policeId = null;
      state.idCardNumber = null;
      state.hasChangedName = undefined;
      state.isBjzxAdmin = false;
      state.department = null;
      // 清除 localStorage 中的用户信息
      localStorage.removeItem('multi_turn_chat_user');
    },
    // 更新用户名
    updateUsername(state: UserState, username: string) {
      state.username = username;
    },
    // 设置是否已修改过用户名
    setHasChangedName(state: UserState, value: boolean) {
      state.hasChangedName = value;
    },
    // 设置部门
    setDepartment(state: UserState, department: string) {
      state.department = department;
    }
  },
  actions: {  // 修改state的函数写在actions里边
    // [11] 为 context 和 data 添加类型
    async login(context: ActionContext<UserState, RootState>, data: LoginData) {
      try {
        const response = await http.post<XspaceResult<LoginResponseData>>(
          API_ENDPOINTS.USER.LOGIN,
          {
            username: data.username,
            password: data.password,
          }
        );
        
        const resp = response.data;
    

        // 检查后端返回的成功状态
        // 成功：{ success: true, code: 200, data: { token: "..." } }
        // 失败：{ success: false, code: xxx, message: "错误信息" }
        if (resp.success && resp.code === 200 && resp.data?.token) {
          // 登录成功
          localStorage.setItem("jwt_token", resp.data.token);
          // 🔥 修复：同步设置LLM服务的token
          localStorage.setItem("multi_turn_chat_jwt", resp.data.token);
          context.commit("updateToken", resp.data.token);
          data.success(resp);
        } else {
          // 登录失败 - 优先使用后端返回的 message
          const errorMsg = resp.message || resp.data?.error_msg || '登录失败，请检查用户名和密码';
      
          data.error({
            success: false,
            code: resp.code,
            message: errorMsg,
            data: null
          });
        }
      } catch (error: any) {
        // 捕获HTTP错误，如403等
        data.error({
          success: false,
          code: error.response?.status || 500,
          message: error.response?.status === 403 ? "用户名或密码错误" : "登录失败，请稍后重试",
          data: null
        });
      }
    },
    logout(context: ActionContext<UserState, RootState>) {
      // 清除Vue应用的token
      localStorage.removeItem("jwt_token");
      // 🔥 修复：清除LLM服务的token和会话数据
      localStorage.removeItem("multi_turn_chat_jwt");
      localStorage.removeItem("multi_turn_chat_session_id");
      
      stopSessionWatch();
      
      context.commit("logout");
      router.push({ name: 'home' });
    },

    async getinfo(context: ActionContext<UserState, RootState>, data: GetInfoData) {
      try {
        const response = await http.get<XspaceResult<any>>(
          API_ENDPOINTS.USER.INFO
        );
        
        const resp = response.data;

        if (resp.success && resp.code === 200) {
          // 处理嵌套的 data.data 结构
          const userInfo = resp.data?.data || resp.data;
          
          // 将后端返回的 role 转换为小写，以匹配前端的 UserRole 枚举
          const userData = {
            id: userInfo.id?.toString() || '',
            username: userInfo.username || '',
            role: userInfo.role?.toLowerCase() || '',
            status: userInfo.status?.toString() || '',
            email: userInfo.email || null,
            policeId: userInfo.policeId || null,
            idCardNumber: userInfo.idCardNumber || null,
            hasChangedName: userInfo.hasChangedName ?? false,  // 默认为 false
            isBjzxAdmin: userInfo.isBjzxAdmin ?? false,  // 默认为 false
            is_login: true,
          };

          context.commit("updateUser", userData);
          data.success(resp);
        } else {
          data.error(resp);
        }
      } catch (error: any) {
        data.error(error.response || error);
      }
    }
  },
  modules: {
  }
} as Module<UserState, RootState>; // [9] 强类型断言
