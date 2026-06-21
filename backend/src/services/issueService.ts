import { Prisma, IssueType, IssuePriority, IssueLinkType, ActivityType, NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { generateIssueKey, rankBetween } from '../utils/issueKeyGenerator';
import { activityService } from './activityService';
import { notificationService } from './notificationService';
import { emitToProject, emitToIssue } from '../config/socket';

export const issueDetailInclude = {
  assignee: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
  reporter: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
  epic: { select: { id: true, name: true, color: true } },
  sprint: { select: { id: true, name: true, status: true } },
  project: { select: { id: true, key: true, name: true } },
  parentIssue: { select: { id: true, key: true, title: true } },
  subtasks: {
    select: { id: true, key: true, title: true, status: true, type: true, assigneeId: true },
  },
  watchers: { select: { userId: true } },
  attachments: true,
  worklogs: {
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    orderBy: { loggedAt: 'desc' as const },
  },
  sourceLinks: { include: { targetIssue: { select: { id: true, key: true, title: true, status: true, type: true } } } },
  targetLinks: { include: { sourceIssue: { select: { id: true, key: true, title: true, status: true, type: true } } } },
  customFieldValues: { include: { field: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.IssueInclude;

const boardInclude = {
  assignee: { select: { id: true, displayName: true, avatarUrl: true } },
  epic: { select: { id: true, name: true, color: true } },
  _count: { select: { comments: true, subtasks: true, attachments: true } },
} satisfies Prisma.IssueInclude;

export interface IssueFilters {
  status?: string;
  type?: IssueType;
  priority?: IssuePriority;
  assigneeId?: string;
  reporterId?: string;
  epicId?: string;
  sprintId?: string;
  label?: string;
  search?: string;
}

function buildWhere(projectScope: Prisma.IssueWhereInput, f: IssueFilters): Prisma.IssueWhereInput {
  return {
    ...projectScope,
    ...(f.status ? { status: f.status } : {}),
    ...(f.type ? { type: f.type } : {}),
    ...(f.priority ? { priority: f.priority } : {}),
    ...(f.assigneeId ? { assigneeId: f.assigneeId === 'unassigned' ? null : f.assigneeId } : {}),
    ...(f.reporterId ? { reporterId: f.reporterId } : {}),
    ...(f.epicId ? { epicId: f.epicId } : {}),
    ...(f.sprintId ? { sprintId: f.sprintId === 'backlog' ? null : f.sprintId } : {}),
    ...(f.label ? { labels: { has: f.label } } : {}),
    ...(f.search
      ? { OR: [{ title: { contains: f.search, mode: 'insensitive' } }, { key: { contains: f.search.toUpperCase() } }] }
      : {}),
  };
}

export const issueService = {
  async listForProject(projectId: string, filters: IssueFilters) {
    return prisma.issue.findMany({
      where: buildWhere({ projectId }, filters),
      include: boardInclude,
      orderBy: [{ rank: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async getByKey(key: string) {
    const issue = await prisma.issue.findUnique({ where: { key }, include: issueDetailInclude });
    if (!issue) throw AppError.notFound('Issue');
    return issue;
  },

  async create(input: {
    projectId: string;
    reporterId: string;
    title: string;
    description?: string;
    type?: IssueType;
    priority?: IssuePriority;
    status?: string;
    assigneeId?: string | null;
    epicId?: string | null;
    sprintId?: string | null;
    parentIssueId?: string | null;
    storyPoints?: number | null;
    estimatedHours?: number | null;
    dueDate?: Date | null;
    labels?: string[];
  }) {
    const issue = await prisma.$transaction(async (tx) => {
      const key = await generateIssueKey(tx, input.projectId);
      const firstColumn = await tx.column.findFirst({
        where: { projectId: input.projectId },
        orderBy: { order: 'asc' },
      });
      const last = await tx.issue.findFirst({
        where: { projectId: input.projectId },
        orderBy: { rank: 'desc' },
        select: { rank: true },
      });
      const created = await tx.issue.create({
        data: {
          key,
          projectId: input.projectId,
          reporterId: input.reporterId,
          title: input.title,
          description: input.description,
          type: input.type ?? IssueType.TASK,
          priority: input.priority ?? IssuePriority.MEDIUM,
          status: input.status ?? firstColumn?.status ?? 'To Do',
          assigneeId: input.assigneeId ?? null,
          epicId: input.epicId ?? null,
          sprintId: input.sprintId ?? null,
          parentIssueId: input.parentIssueId ?? null,
          storyPoints: input.storyPoints ?? null,
          estimatedHours: input.estimatedHours ?? null,
          dueDate: input.dueDate ?? null,
          labels: input.labels ?? [],
          rank: rankBetween(last?.rank ?? null, null),
        },
        include: issueDetailInclude,
      });
      await activityService.log({ issueId: created.id, actorId: input.reporterId, type: ActivityType.CREATED }, tx);
      // Reporter auto-watches their own issue.
      await tx.issueWatcher.create({ data: { issueId: created.id, userId: input.reporterId } });
      return created;
    });

    if (issue.assigneeId && issue.assigneeId !== input.reporterId) {
      await notificationService.create({
        userId: issue.assigneeId,
        type: NotificationType.ISSUE_ASSIGNED,
        message: `assigned ${issue.key} to you`,
        issueId: issue.id,
        actorId: input.reporterId,
      });
    }
    emitToProject(issue.projectId, 'issue:created', { issue });
    return issue;
  },

  async update(
    key: string,
    actorId: string,
    data: Partial<{
      title: string;
      description: string;
      type: IssueType;
      status: string;
      priority: IssuePriority;
      assigneeId: string | null;
      epicId: string | null;
      sprintId: string | null;
      storyPoints: number | null;
      estimatedHours: number | null;
      dueDate: Date | null;
      startDate: Date | null;
      labels: string[];
    }>
  ) {
    const existing = await prisma.issue.findUnique({ where: { key } });
    if (!existing) throw AppError.notFound('Issue');

    const resolvedAt =
      data.status && isDoneStatus(data.status) && !existing.resolvedAt
        ? new Date()
        : data.status && !isDoneStatus(data.status)
          ? null
          : existing.resolvedAt;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.issue.update({
        where: { key },
        data: { ...data, resolvedAt },
        include: issueDetailInclude,
      });
      await activityService.logFieldChanges(
        existing.id,
        actorId,
        existing as unknown as Record<string, unknown>,
        { ...existing, ...data } as unknown as Record<string, unknown>,
        tx
      );
      return result;
    });

    // Notify on assignment and status change (to watchers).
    if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
      await notificationService.create({
        userId: data.assigneeId,
        type: NotificationType.ISSUE_ASSIGNED,
        message: `assigned ${updated.key} to you`,
        issueId: updated.id,
        actorId,
      });
    }
    if (data.status && data.status !== existing.status) {
      const watchers = updated.watchers.map((w) => w.userId);
      await notificationService.createMany(watchers, {
        type: NotificationType.STATUS_CHANGED,
        message: `moved ${updated.key} to ${data.status}`,
        issueId: updated.id,
        actorId,
      });
      emitToProject(updated.projectId, 'issue:moved', {
        issueKey: updated.key,
        fromStatus: existing.status,
        toStatus: data.status,
      });
    }

    emitToProject(updated.projectId, 'issue:updated', { issueKey: updated.key, changes: data });
    emitToIssue(updated.key, 'issue:updated', { issueKey: updated.key, changes: data });
    return updated;
  },

  async remove(key: string) {
    const issue = await prisma.issue.findUnique({ where: { key }, select: { id: true, projectId: true } });
    if (!issue) throw AppError.notFound('Issue');
    await prisma.issue.delete({ where: { key } });
    emitToProject(issue.projectId, 'issue:deleted', { issueKey: key });
  },

  /** Reorders an issue via lexicographic rank and optionally moves status/sprint. */
  async rank(
    key: string,
    actorId: string,
    payload: { beforeKey?: string | null; afterKey?: string | null; status?: string; sprintId?: string | null }
  ) {
    const issue = await prisma.issue.findUnique({ where: { key } });
    if (!issue) throw AppError.notFound('Issue');

    const [before, after] = await Promise.all([
      payload.beforeKey
        ? prisma.issue.findUnique({ where: { key: payload.beforeKey }, select: { rank: true } })
        : null,
      payload.afterKey
        ? prisma.issue.findUnique({ where: { key: payload.afterKey }, select: { rank: true } })
        : null,
    ]);

    const newRank = rankBetween(before?.rank ?? null, after?.rank ?? null);
    const statusChanged = payload.status !== undefined && payload.status !== issue.status;

    const updated = await prisma.issue.update({
      where: { key },
      data: {
        rank: newRank,
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.sprintId !== undefined ? { sprintId: payload.sprintId } : {}),
        ...(payload.status && isDoneStatus(payload.status) && !issue.resolvedAt
          ? { resolvedAt: new Date() }
          : {}),
      },
      include: boardInclude,
    });

    if (statusChanged) {
      await activityService.log({
        issueId: issue.id,
        actorId,
        type: ActivityType.STATUS_CHANGED,
        field: 'status',
        oldValue: issue.status,
        newValue: payload.status,
      });
      emitToProject(issue.projectId, 'issue:moved', {
        issueKey: key,
        fromStatus: issue.status,
        toStatus: payload.status,
      });
    }
    emitToProject(issue.projectId, 'issue:updated', { issueKey: key, changes: payload });
    return updated;
  },

  async clone(key: string, actorId: string) {
    const src = await prisma.issue.findUnique({ where: { key } });
    if (!src) throw AppError.notFound('Issue');
    return this.create({
      projectId: src.projectId,
      reporterId: actorId,
      title: `(Clone) ${src.title}`,
      description: src.description ?? undefined,
      type: src.type,
      priority: src.priority,
      assigneeId: src.assigneeId,
      epicId: src.epicId,
      sprintId: src.sprintId,
      storyPoints: src.storyPoints,
      estimatedHours: src.estimatedHours,
      labels: src.labels,
    });
  },

  async bulkUpdate(
    keys: string[],
    actorId: string,
    data: Partial<{ status: string; assigneeId: string | null; sprintId: string | null; priority: IssuePriority }>
  ) {
    const issues = await prisma.issue.findMany({ where: { key: { in: keys } }, select: { id: true, projectId: true } });
    await prisma.issue.updateMany({ where: { key: { in: keys } }, data });
    await Promise.all(
      issues.map((i) =>
        activityService.log({ issueId: i.id, actorId, type: ActivityType.UPDATED, field: 'bulk', newValue: JSON.stringify(data) })
      )
    );
    const projectIds = [...new Set(issues.map((i) => i.projectId))];
    projectIds.forEach((pid) => emitToProject(pid, 'issue:updated', { bulk: true, keys, changes: data }));
    return { updated: issues.length };
  },

  async setWatching(key: string, userId: string, watching: boolean) {
    const issue = await prisma.issue.findUnique({ where: { key }, select: { id: true } });
    if (!issue) throw AppError.notFound('Issue');
    if (watching) {
      await prisma.issueWatcher.upsert({
        where: { issueId_userId: { issueId: issue.id, userId } },
        create: { issueId: issue.id, userId },
        update: {},
      });
    } else {
      await prisma.issueWatcher.deleteMany({ where: { issueId: issue.id, userId } });
    }
    return { watching };
  },

  async link(key: string, actorId: string, targetKey: string, type: IssueLinkType) {
    const [source, target] = await Promise.all([
      prisma.issue.findUnique({ where: { key }, select: { id: true } }),
      prisma.issue.findUnique({ where: { key: targetKey }, select: { id: true } }),
    ]);
    if (!source || !target) throw AppError.notFound('Issue');
    if (source.id === target.id) throw new AppError('Cannot link an issue to itself');

    const link = await prisma.issueLink.create({
      data: { sourceIssueId: source.id, targetIssueId: target.id, type },
    });
    await activityService.log({ issueId: source.id, actorId, type: ActivityType.LINKED, field: 'link', newValue: `${type}:${targetKey}` });
    return link;
  },

  async unlink(linkId: string) {
    await prisma.issueLink.delete({ where: { id: linkId } });
  },

  async listForExport(projectId: string, filters: IssueFilters) {
    return prisma.issue.findMany({
      where: buildWhere({ projectId }, filters),
      include: {
        assignee: { select: { displayName: true } },
        reporter: { select: { displayName: true } },
        epic: { select: { name: true } },
        sprint: { select: { name: true } },
      },
      orderBy: [{ rank: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async search(userId: string, filters: IssueFilters & { projectKey?: string }) {
    const projectIds = (
      await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } })
    ).map((m) => m.projectId);

    let scoped = projectIds;
    if (filters.projectKey) {
      const p = await prisma.project.findUnique({ where: { key: filters.projectKey }, select: { id: true } });
      scoped = p ? [p.id] : [];
    }

    return prisma.issue.findMany({
      where: buildWhere({ projectId: { in: scoped } }, filters),
      include: boardInclude,
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });
  },
};

function isDoneStatus(status: string): boolean {
  return /done|complete|closed|resolved/i.test(status);
}
