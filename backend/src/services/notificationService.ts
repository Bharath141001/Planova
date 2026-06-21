import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { emitToUser } from '../config/socket';
import { env } from '../config/env';
import { emailService } from './emailService';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  issueId?: string | null;
  actorId?: string | null;
}

const notificationInclude = {
  actor: { select: { id: true, displayName: true, avatarUrl: true } },
  issue: { select: { key: true, title: true } },
} satisfies Prisma.NotificationInclude;

export const notificationService = {
  async create(input: CreateNotificationInput) {
    // Never notify a user about their own action.
    if (input.actorId && input.actorId === input.userId) return null;

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        message: input.message,
        issueId: input.issueId ?? null,
        actorId: input.actorId ?? null,
      },
      include: notificationInclude,
    });

    emitToUser(input.userId, 'notification:new', notification);
    return notification;
  },

  /** Fan-out a notification to many recipients (e.g. watchers), deduplicated. */
  async createMany(userIds: string[], input: Omit<CreateNotificationInput, 'userId'>) {
    const unique = [...new Set(userIds)].filter((id) => id !== input.actorId);
    await Promise.all(unique.map((userId) => this.create({ ...input, userId })));
  },

  async list(userId: string, onlyUnread = false) {
    return prisma.notification.findMany({
      where: { userId, ...(onlyUnread ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: notificationInclude,
    });
  },

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markRead(id: string, userId: string) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },

  /** Sends a mention email immediately in addition to the in-app notification. */
  async notifyMention(recipientId: string, actorId: string, issueKey: string, issueId: string) {
    await this.create({
      userId: recipientId,
      type: NotificationType.MENTIONED,
      message: `mentioned you on ${issueKey}`,
      issueId,
      actorId,
    });
    const [recipient, actor] = await Promise.all([
      prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } }),
      prisma.user.findUnique({ where: { id: actorId }, select: { displayName: true } }),
    ]);
    if (recipient && actor) {
      await emailService.sendMentionEmail(
        recipient.email,
        actor.displayName,
        issueKey,
        `${env.clientUrl}/issues/${issueKey}`
      );
    }
  },
};

/**
 * Extracts mentioned usernames from a comment body.
 * Handles both TipTap-generated mention nodes (<span data-type="mention" data-id="username">)
 * and plain @username text for backwards compatibility.
 */
export function extractMentions(body: string): string[] {
  // TipTap mention nodes carry the username in data-id, not in visible text
  // (display name may contain spaces that the plain regex would split on).
  const ids: string[] = [];
  const mentionTagRe = /<[^>]+data-type="mention"[^>]*>/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = mentionTagRe.exec(body)) !== null) {
    const idMatch = /data-id="([^"]+)"/.exec(tagMatch[0]);
    if (idMatch) ids.push(idMatch[1]);
  }
  // Fallback: plain @username patterns (legacy / plain-text content).
  const plain = [...(body.match(/@([a-zA-Z0-9_.-]+)/g) ?? [])].map((m) => m.slice(1));
  return [...new Set([...ids, ...plain])];
}
