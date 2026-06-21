import { ActivityType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

interface LogActivityInput {
  issueId: string;
  actorId: string;
  type: ActivityType;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export const activityService = {
  async log(input: LogActivityInput, tx: Prisma.TransactionClient = prisma): Promise<void> {
    await tx.activity.create({
      data: {
        issueId: input.issueId,
        actorId: input.actorId,
        type: input.type,
        field: input.field,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
      },
    });
  },

  /** Diffs two issue snapshots and records one activity row per changed field. */
  async logFieldChanges(
    issueId: string,
    actorId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    tx: Prisma.TransactionClient = prisma
  ): Promise<string[]> {
    const tracked: Array<{ field: keyof typeof after; type: ActivityType }> = [
      { field: 'status', type: ActivityType.STATUS_CHANGED },
      { field: 'assigneeId', type: ActivityType.ASSIGNED },
      { field: 'priority', type: ActivityType.PRIORITY_CHANGED },
      { field: 'sprintId', type: ActivityType.SPRINT_CHANGED },
      { field: 'title', type: ActivityType.UPDATED },
      { field: 'storyPoints', type: ActivityType.UPDATED },
      { field: 'type', type: ActivityType.UPDATED },
      { field: 'epicId', type: ActivityType.UPDATED },
    ];
    const changedFields: string[] = [];

    for (const { field, type } of tracked) {
      const oldVal = before[field as string];
      const newVal = after[field as string];
      if (oldVal === undefined || newVal === undefined) continue;
      if (String(oldVal ?? '') === String(newVal ?? '')) continue;
      changedFields.push(field as string);
      await this.log(
        {
          issueId,
          actorId,
          type,
          field: field as string,
          oldValue: oldVal === null ? null : String(oldVal),
          newValue: newVal === null ? null : String(newVal),
        },
        tx
      );
    }
    return changedFields;
  },

  async listForIssue(issueId: string) {
    return prisma.activity.findMany({
      where: { issueId },
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
  },
};
