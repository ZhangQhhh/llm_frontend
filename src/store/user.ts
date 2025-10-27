import router from "@/router";
import { API_ENDPOINTS } from "@/config/api/api";
import http from "@/config/api/http";
import { Module, ActionContext } from "vuex"; // [1] 导入 Vuex 类型
import { UserRole, hasPermission, isAdmin, isSuperAdmin } from "@/config/permissions";

// [2] 定义从 API 返回的用户信息（不包括 token 和登录状态）
interface UserInfo {
  id: string;
  username: string;
  photo: string;
  role: string;
  status: string;  // 1 表示没有被封禁，0表示被封禁
  vip: number;
  email: string;
  followingCount: number;
  followerCount: number;
  bio: string;
  location: string;
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

// [5] 定义 API 响应类型
interface LoginSuccessResponse {
  error_msg: "success";
  token: string;
}

interface GetInfoSuccessResponse extends UserInfo {
  error_msg: "success";
}

interface ApiErrorResponse {
  error_msg: string; // 任何非 "success" 的字符串
  message?: string;
}

// [6] 定义 Action 载荷类型
interface LoginData {
  username: string;
  password: string;
  success: (resp: LoginSuccessResponse) => void;
  error: (resp: ApiErrorResponse) => void;
}

interface GetInfoData {
  success: (resp: GetInfoSuccessResponse) => void;
  error: (resp: ApiErrorResponse | any) => void;
}

// [7] 定义 RootState，如果你有根 state 的话。这里我们用 'any' 代替
type RootState = any;


// [8] 初始 state，并指定其类型为 UserState
const state: UserState = {
  id: "",
  username: "",
  photo: "",
  token: "",
  role: "",
  is_login: false,
  status: "",  // 1 表示没有被封禁，0表示被封禁
  vip: 0,
  email: "",
  followingCount: 0,
  followerCount: 0,
  bio: "", // [重要] 已添加，否则响应式会出问题
  location: "", // [重要] 已添加
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
      state.photo = user.photo;
      state.role = user.role;
      state.is_login = user.is_login;
      state.status = user.status
      state.vip = user.vip,
      state.email = user.email,
      state.followerCount = user.followerCount,
      state.followingCount = user.followingCount,
      state.bio = user.bio,
      state.location = user.location
    },
    // [10] 为 token 参数添加类型
    updateToken(state: UserState, token: string) {
      state.token = token;
    },
    logout(state: UserState) {
      state.id = "";
      state.username = "";
      state.token = "";
      state.photo = "";
      state.role = "";
      state.is_login = false;
      state.status = "";
      state.vip = 0;
      state.email = "";
      state.followerCount = 0;
      state.followingCount = 0;
      state.bio = "";
      state.location = "";
    }
  },
  actions: {  // 修改state的函数写在actions里边
    // [11] 为 context 和 data 添加类型
    async login(context: ActionContext<UserState, RootState>, data: LoginData) {
      try {
        const response = await http.post<LoginSuccessResponse | ApiErrorResponse>(
          API_ENDPOINTS.USER.LOGIN,
          {
            username: data.username,
            password: data.password,
          }
        );
        
        const resp = response.data;
        if (resp.error_msg === "success") {
          const successResp = resp as LoginSuccessResponse;
          localStorage.setItem("jwt_token", successResp.token);
          context.commit("updateToken", successResp.token);
          data.success(successResp);
        } else {
          data.error(resp);
        }
      } catch (error: any) {
        // 捕获HTTP错误，如403等
        data.error({
          error_msg: "error",
          message: error.response?.status === 403 ? "用户名或密码错误" : "登录失败，请稍后重试"
        });
      }
    },
    logout(context: ActionContext<UserState, RootState>) {
      localStorage.removeItem("jwt_token");
      context.commit("logout");
      router.push({ name: 'home' });
    },

    async getinfo(context: ActionContext<UserState, RootState>, data: GetInfoData) {
      try {
        const response = await http.get<GetInfoSuccessResponse | ApiErrorResponse>(
          API_ENDPOINTS.USER.INFO,
          {
            headers: {
              Authorization: "Bearer " + context.state.token,
            }
          }
        );
        
        const resp = response.data;
        if (resp.error_msg === "success") {
          const successResp = resp as GetInfoSuccessResponse;
          context.commit("updateUser", {
            ...resp,
            is_login: true,
          });
          data.success(successResp);
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