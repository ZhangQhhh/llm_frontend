import { API_BASE_URL } from '@/config/api/api';

interface SessionWatchOptions {
  token: string;
  userId?: string;
  onForceCheck?: () => void;
  onForceLogout?: (reason?: string) => void;
}

const WS_ENDPOINT = process.env.VUE_APP_WS_URL;
const HEARTBEAT_INTERVAL = 30000;

let ws: WebSocket | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const buildUrl = (token: string, userId?: string) => {
  if (!WS_ENDPOINT) return '';

  const url = new URL(WS_ENDPOINT, window.location.origin);
  url.searchParams.set('token', token);
  if (userId) {
    url.searchParams.set('userId', userId);
  }
  return url.toString();
};

const clearHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
};

const startHeartbeat = () => {
  clearHeartbeat();
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  heartbeatTimer = setInterval(() => {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      }
    } catch (error) {
      console.warn('WebSocket heartbeat failed:', error);
    }
  }, HEARTBEAT_INTERVAL);
};

export const startSessionWatch = (options: SessionWatchOptions) => {
  if (!options.token) {
    console.warn('WebSocket 未启动：缺少 token');
    return;
  }

  if (!WS_ENDPOINT) {
    console.warn('WebSocket 未启动：未配置 VUE_APP_WS_URL');
    return;
  }

  stopSessionWatch();

  const wsUrl = buildUrl(options.token, options.userId);
  if (!wsUrl) return;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    startHeartbeat();
  };

  ws.onerror = (event) => {
    console.warn('WebSocket 发生错误:', event);
  };

  ws.onclose = () => {
    clearHeartbeat();
    ws = null;
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      const type = msg?.type?.toString().toLowerCase();
      const targetUserId = msg?.userId;
      const isSelf = !targetUserId || targetUserId === options.userId;

      if (!isSelf) return;

      if (type === 'connected' || type === 'pong') {
        return;
      }

      if (type === 'force-logout') {
        options.onForceLogout?.(msg?.reason);
        return;
      }

      if (type === 'force-check-status' || type === 'force-check') {
        if (msg?.banned === true) {
          options.onForceLogout?.(msg?.reason);
        } else {
          options.onForceCheck?.();
        }
      }
    } catch (error) {
      console.warn('解析 WebSocket 消息失败:', error);
    }
  };
};

export const stopSessionWatch = () => {
  clearHeartbeat();
  if (ws) {
    try {
      ws.close();
    } catch (error) {
      console.warn('关闭 WebSocket 连接时出错:', error);
    }
    ws = null;
  }
};

export const getWebSocketEndpoint = () => {
  if (WS_ENDPOINT) return WS_ENDPOINT;
  if (API_BASE_URL?.startsWith('http')) {
    try {
      const url = new URL(API_BASE_URL);
      return `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/ws`;
    } catch {
      return '';
    }
  }
  return '';
};
