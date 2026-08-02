import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export type NotificationType =
  | 'LIKE_POST'
  | 'COMMENT_POST'
  | 'REPLY_COMMENT'
  | 'FOLLOW_USER'
  | 'ADZAN_REMINDER'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id?: string;
  type: NotificationType;
  title: string;
  body: string;
  entity_type?: 'POST' | 'COMMENT' | 'USER' | 'PRAYER';
  entity_id?: string;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
}

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];
  isLoading: boolean;
  page: number;
  total: number;
  hasMore: boolean;
  fetchUnreadCount: () => Promise<number>;
  fetchNotifications: (page?: number, refresh?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  page: 1,
  total: 0,
  hasMore: true,

  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const unreadCount = response.data?.data?.unreadCount || 0;
      set({ unreadCount });
      return unreadCount;
    } catch {
      return get().unreadCount;
    }
  },

  fetchNotifications: async (page = 1, refresh = false) => {
    try {
      if (!refresh && page === 1) {
        set({ isLoading: true });
      }
      const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS.BASE, {
        params: { page, limit: 20 },
      });
      const data = response.data?.data;
      const fetchedList: AppNotification[] = data?.notifications || [];
      const total = data?.total || 0;
      const currentList = get().notifications;

      const newList = refresh || page === 1 ? fetchedList : [...currentList, ...fetchedList];
      const hasMore = newList.length < total;

      set({
        notifications: newList,
        page,
        total,
        hasMore,
        isLoading: false,
      });

      // Also update unread count
      get().fetchUnreadCount();
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic UI update
    set((state) => {
      const updatedList = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const currentUnread = state.unreadCount;
      const wasUnread = state.notifications.find((n) => n.id === id && !n.is_read);
      return {
        notifications: updatedList,
        unreadCount: wasUnread ? Math.max(0, currentUnread - 1) : currentUnread,
      };
    });

    try {
      await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    } catch {}
  },

  markAllAsRead: async () => {
    // Optimistic UI update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    try {
      await apiClient.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL);
    } catch {}
  },

  deleteNotification: async (id: string) => {
    // Optimistic UI update
    set((state) => {
      const wasUnread = state.notifications.find((n) => n.id === id && !n.is_read);
      const updatedList = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updatedList,
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        total: Math.max(0, state.total - 1),
      };
    });

    try {
      await apiClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE_SINGLE(id));
    } catch {}
  },

  deleteAllNotifications: async () => {
    // Optimistic UI update
    set({
      notifications: [],
      unreadCount: 0,
      total: 0,
    });

    try {
      await apiClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE_ALL);
    } catch {}
  },
}));
