<template>
  <div class="session-list-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 折叠按钮 -->
    <button class="collapse-btn" @click="toggleCollapse">
      <span v-if="isCollapsed">☰</span>
      <span v-else>✕</span>
    </button>

    <div v-if="!isCollapsed" class="sidebar-content">
      <!-- 头部 -->
      <div class="sidebar-header">
        <h3>💬 会话列表</h3>
        <button class="new-session-btn" @click="$emit('new-session')" :disabled="loading">
          <span>➕ 新建</span>
        </button>
      </div>

      <!-- 会话列表 -->
      <div class="sessions-container">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>

        <div v-else-if="sessions.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>暂无会话记录</p>
        </div>

        <div v-else class="sessions-list">
          <div
            v-for="session in sessions"
            :key="session.session_id"
            class="session-item"
            :class="{ active: session.session_id === currentSessionId }"
            @click="$emit('select-session', session.session_id)"
          >
            <div class="session-header">
              <h4 class="session-title">{{ session.title || '新对话' }}</h4>
              <button
                class="delete-btn"
                @click.stop="$emit('delete-session', session.session_id)"
                title="删除会话"
              >
                🗑️
              </button>
            </div>
            <p class="session-preview">{{ session.first_message }}</p>
            <div class="session-meta">
              <span class="message-count">💬 {{ session.message_count }}</span>
              <span class="update-time">{{ formatTime(session.last_update_time) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="$emit('page-change', currentPage - 1)"
        >
          ‹
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="$emit('page-change', currentPage + 1)"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue';
import type { SessionListItem } from '@/utils/chatApi';

export default defineComponent({
  name: 'SessionList',
  props: {
    sessions: {
      type: Array as PropType<SessionListItem[]>,
      required: true
    },
    currentSessionId: {
      type: String,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    currentPage: {
      type: Number,
      default: 1
    },
    totalPages: {
      type: Number,
      default: 1
    }
  },
  emits: ['new-session', 'select-session', 'delete-session', 'page-change'],
  setup() {
    const isCollapsed = ref(false);

    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value;
    };

    const formatTime = (timeStr: string) => {
      const date = new Date(timeStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
          const minutes = Math.floor(diff / (1000 * 60));
          return minutes === 0 ? '刚刚' : `${minutes}分钟前`;
        }
        return `${hours}小时前`;
      } else if (days === 1) {
        return '昨天';
      } else if (days < 7) {
        return `${days}天前`;
      } else {
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      }
    };

    return {
      isCollapsed,
      toggleCollapse,
      formatTime
    };
  }
});
</script>

<style scoped>
.session-list-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 320px;
  background: white;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.session-list-sidebar.collapsed {
  transform: translateX(-280px);
}

.collapse-btn {
  position: absolute;
  right: -40px;
  top: 20px;
  width: 40px;
  height: 40px;
  background: white;
  border: none;
  border-radius: 0 8px 8px 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.collapse-btn:hover {
  background: #f3f4f6;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.new-session-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.new-session-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.new-session-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sessions-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 1rem;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-item {
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.session-item:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.session-item.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 58, 138, 0.05) 100%);
  border-color: #2563eb;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.session-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.6;
  transition: all 0.3s;
}

.delete-btn:hover {
  opacity: 1;
  transform: scale(1.2);
}

.session-preview {
  margin: 0 0 0.5rem 0;
  font-size: 13px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #9ca3af;
}

.message-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 768px) {
  .session-list-sidebar {
    width: 280px;
  }

  .session-list-sidebar.collapsed {
    transform: translateX(-240px);
  }
}
</style>
