import { SprintStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { notificationService } from '../services/notificationService';

/**
 * Notifies assignees of issues whose due date is within the next 24h.
 * Runs hourly. Idempotent within the day via a coarse de-dup on existing
 * unread DUE_DATE_APPROACHING notifications.
 */
async function notifyUpcomingDueDates(): Promise<void> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const due = await prisma.issue.findMany({
    where: { dueDate: { gte: now, lte: in24h }, resolvedAt: null, assigneeId: { not: null } },
    select: { id: true, key: true, assigneeId: true },
  });

  for (const issue of due) {
    if (!issue.assigneeId) continue;
    const existing = await prisma.notification.findFirst({
      where: {
        userId: issue.assigneeId,
        issueId: issue.id,
        type: NotificationType.DUE_DATE_APPROACHING,
        isRead: false,
      },
    });
    if (existing) continue;
    await notificationService.create({
      userId: issue.assigneeId,
      type: NotificationType.DUE_DATE_APPROACHING,
      message: `${issue.key} is due within 24 hours`,
      issueId: issue.id,
    });
  }
  if (due.length) logger.debug(`Due-date check processed ${due.length} issue(s)`);
}

/** Auto-completes active sprints whose end date has passed. */
async function autoCloseExpiredSprints(): Promise<void> {
  const expired = await prisma.sprint.findMany({
    where: { status: SprintStatus.ACTIVE, endDate: { lt: new Date() } },
    include: { issues: { select: { storyPoints: true, status: true } } },
  });

  for (const sprint of expired) {
    const velocity = sprint.issues
      .filter((i) => /done|complete|closed|resolved/i.test(i.status))
      .reduce((s, i) => s + (i.storyPoints ?? 0), 0);
    await prisma.sprint.update({
      where: { id: sprint.id },
      data: { status: SprintStatus.COMPLETED, completedAt: new Date(), velocity },
    });
    logger.info(`Auto-closed expired sprint ${sprint.name} (velocity ${velocity})`);
  }
}

export function startSprintAutoCloseJob(): NodeJS.Timeout {
  const run = () => {
    void notifyUpcomingDueDates().catch((e) => logger.warn(`Due-date job failed: ${e.message}`));
    void autoCloseExpiredSprints().catch((e) => logger.warn(`Auto-close job failed: ${e.message}`));
  };
  run();
  return setInterval(run, 60 * 60 * 1000); // hourly
}
