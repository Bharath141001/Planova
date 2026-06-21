import { create } from 'zustand';
import type { Notification } from '@/types/notification.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  panelOpen: boolean;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  prepend: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setPanelOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
  prepend: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 })),
  setPanelOpen: (open) => set({ panelOpen: open }),
}));
