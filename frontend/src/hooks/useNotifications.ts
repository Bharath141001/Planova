import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import { useSocketEvent } from './useSocket';
import { QUERY_KEYS } from '@/utils/constants';
import type { Notification } from '@/types/notification.types';

/** Loads notifications and subscribes to live `notification:new` socket events. */
export function useNotifications() {
  const { setNotifications, prepend } = useNotificationStore();

  const query = useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => notificationService.list(),
  });

  useEffect(() => {
    if (query.data) setNotifications(query.data.notifications, query.data.unreadCount);
  }, [query.data, setNotifications]);

  useSocketEvent<Notification>('notification:new', (notification) => {
    prepend(notification);
    toast(notification.message, { icon: '🔔' });
  });

  return query;
}

export function useNotificationActions() {
  const { markRead, markAllRead } = useNotificationStore();

  return {
    markRead: async (id: string) => {
      markRead(id);
      await notificationService.markRead(id).catch(() => undefined);
    },
    markAllRead: async () => {
      markAllRead();
      await notificationService.markAllRead().catch(() => undefined);
    },
  };
}
