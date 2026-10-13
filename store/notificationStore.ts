import { create } from "zustand";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";
import type { Notification } from "@/types/notification";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchNotifications: (options?: { silent?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchNotifications: async (options) => {
    if (!options?.silent) {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await getNotifications();
      const unreadCount = response.notifications.filter(
        (notification) => !notification.isRead,
      ).length;

      set({
        notifications: response.notifications,
        unreadCount,
        isLoading: false,
        error: null,
        hasFetched: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load notifications",
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await getUnreadNotificationCount();
      set({ unreadCount: response.unreadCount });
    } catch {
      // Non-blocking by design.
    }
  },

  markAsRead: async (id) => {
    const current = get();
    const target = current.notifications.find((notification) => notification._id === id);
    if (!target || target.isRead) return;

    set({
      notifications: current.notifications.map((notification) =>
        notification._id === id
          ? {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            }
          : notification,
      ),
      unreadCount: Math.max(current.unreadCount - 1, 0),
    });

    try {
      const updated = await markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification._id === id ? updated : notification,
        ),
      }));
    } catch {
      set({
        notifications: current.notifications,
        unreadCount: current.unreadCount,
      });
    }
  },

  markAllAsRead: async () => {
    const current = get();
    const nextNotifications = current.notifications.map((notification) => ({
      ...notification,
      isRead: true,
      readAt: notification.readAt || new Date().toISOString(),
    }));

    set({ notifications: nextNotifications, unreadCount: 0 });

    try {
      await markAllNotificationsAsRead();
    } catch {
      set({
        notifications: current.notifications,
        unreadCount: current.unreadCount,
      });
    }
  },

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      hasFetched: false,
    }),
}));
