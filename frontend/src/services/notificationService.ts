import { api, unwrap } from './api';
import type { NotificationListResponse } from '@/types/notification.types';

export const notificationService = {
  list: (onlyUnread = false) =>
    unwrap<NotificationListResponse>(api.get('/notifications', { params: { unread: onlyUnread } })),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
