import { NotificationType } from './common.types';
import { UserMini } from './user.types';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  issueId: string | null;
  actorId: string | null;
  actor: UserMini | null;
  issue: { key: string; title: string } | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}
