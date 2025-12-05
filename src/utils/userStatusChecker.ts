import { ElMessage } from 'element-plus';
import router from '@/router';
import store from '@/store';
import http from '@/config/api/http';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/config/api/api';
import { startSessionWatch, stopSessionWatch } from './sessionWatcher';

// 封禁/过期时统一清理本地状态并跳转登录
export function forceLogout(message?: string) {
  stopSessionWatch();

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CHAT_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);

  store.commit('logout');

  if (message) {
    ElMessage.warning(message);
  }

  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login' });
  }
}

// 调用后端接口确认当前用户是否被封禁
export async function checkUserStatus() {
  try {
    const response = await http.get(API_ENDPOINTS.USER.INFO);
    const payload = response?.data;
    const statusValue =
      payload?.data?.data?.status ??
      payload?.data?.status ??
      payload?.status;

    // 后端约定：1=正常；0待审核；-1封禁；-2审核未通过
    const statusString = statusValue ? statusValue.toString() : '';
    const isBanned = statusString !== '1';

    if (isBanned) {
      forceLogout('账号状态异常（可能被封禁/待审核/未通过），请重新登录');
      return false;
    }

    return true;
  } catch (error) {
    // 校验失败时不强制登出，避免误杀
    console.warn('检查用户状态失败:', error);
    return true;
  }
}

// 统一初始化会话监听，简化调用方逻辑
export function initSessionWatch(token: string, userId?: string) {
  if (!token) return;

  startSessionWatch({
    token,
    userId,
    onForceCheck: () => {
      void checkUserStatus();
    },
    onForceLogout: (reason?: string) => {
      const msg = reason || '账号已被封禁，请重新登录';
      forceLogout(msg);
    },
  });
}
