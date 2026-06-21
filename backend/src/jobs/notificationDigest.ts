import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { emailService } from '../services/emailService';
import { env } from '../config/env';

/**
 * Sends each user a daily email digest of their unread notifications.
 * Scheduled to run once every 24h.
 */
async function sendDailyDigests(): Promise<void> {
  const usersWithUnread = await prisma.user.findMany({
    where: { notifications: { some: { isRead: false } } },
    select: {
      email: true,
      notifications: {
        where: { isRead: false },
        select: { message: true, issue: { select: { key: true } } },
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  for (const user of usersWithUnread) {
    const items = user.notifications.map((n) => ({
      message: n.message,
      link: n.issue ? `${env.clientUrl}/issues/${n.issue.key}` : env.clientUrl,
    }));
    await emailService.sendDigest(user.email, items);
  }
  if (usersWithUnread.length) logger.info(`Sent digests to ${usersWithUnread.length} user(s)`);
}

export function startNotificationDigestJob(): NodeJS.Timeout {
  return setInterval(() => {
    void sendDailyDigests().catch((e) => logger.warn(`Digest job failed: ${e.message}`));
  }, 24 * 60 * 60 * 1000);
}
