import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/apiResponse';

export const notificationController = {
  async list(req: Request, res: Response) {
    const onlyUnread = req.query.unread === 'true';
    const [notifications, unreadCount] = await Promise.all([
      notificationService.list(req.user!.id, onlyUnread),
      notificationService.unreadCount(req.user!.id),
    ]);
    sendSuccess(res, { notifications, unreadCount });
  },

  async markRead(req: Request, res: Response) {
    await notificationService.markRead(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Marked as read' });
  },

  async markAllRead(req: Request, res: Response) {
    await notificationService.markAllRead(req.user!.id);
    sendSuccess(res, { message: 'All marked as read' });
  },
};
