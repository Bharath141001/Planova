import { SprintStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';

function isDoneStatus(status: string): boolean {
  return /done|complete|closed|resolved/i.test(status);
}

function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export interface BurndownPoint {
  date: string;
  ideal: number;
  remaining: number;
}

export const reportService = {
  /** Burndown: remaining story points vs an ideal straight line over the sprint. */
  async burndown(sprintId: string, mode: 'points' | 'count' = 'points'): Promise<{
    points: BurndownPoint[];
    totalScope: number;
  }> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: { issues: { include: { activities: true } } },
    });
    if (!sprint) throw AppError.notFound('Sprint');

    const start = sprint.startDate ?? sprint.createdAt;
    const end = sprint.endDate ?? new Date();
    const days = eachDay(start, end);

    const weight = (i: { storyPoints: number | null }) =>
      mode === 'points' ? i.storyPoints ?? 0 : 1;
    const totalScope = sprint.issues.reduce((s, i) => s + weight(i), 0);

    // Determine the resolved date for each issue (resolvedAt or last STATUS_CHANGED to done).
    const resolutions = sprint.issues.map((i) => {
      const resolvedAt =
        i.resolvedAt ??
        (isDoneStatus(i.status)
          ? i.activities
              .filter((a) => a.field === 'status' && a.newValue && isDoneStatus(a.newValue))
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? i.updatedAt
          : null);
      return { weight: weight(i), resolvedAt };
    });

    const span = days.length - 1 || 1;
    const points: BurndownPoint[] = days.map((day, idx) => {
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      const burned = resolutions
        .filter((r) => r.resolvedAt && r.resolvedAt <= endOfDay)
        .reduce((s, r) => s + r.weight, 0);
      return {
        date: day.toISOString().slice(0, 10),
        ideal: Math.round((totalScope - (totalScope / span) * idx) * 100) / 100,
        remaining: totalScope - burned,
      };
    });

    return { points, totalScope };
  },

  /** Velocity: committed vs completed points for the last N completed sprints. */
  async velocity(projectKey: string, limit = 7) {
    const project = await prisma.project.findUnique({ where: { key: projectKey }, select: { id: true } });
    if (!project) throw AppError.notFound('Project');

    const sprints = await prisma.sprint.findMany({
      where: { projectId: project.id, status: SprintStatus.COMPLETED },
      orderBy: { completedAt: 'desc' },
      take: limit,
      include: { issues: { select: { storyPoints: true, status: true } } },
    });

    const data = sprints
      .reverse()
      .map((s) => {
        const committed = s.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
        const completed = s.issues
          .filter((i) => isDoneStatus(i.status))
          .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
        return { sprintId: s.id, name: s.name, committed, completed };
      });

    const avg =
      data.length > 0 ? Math.round(data.reduce((s, d) => s + d.completed, 0) / data.length) : 0;
    return { data, average: avg };
  },

  async sprintReport(sprintId: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        issues: {
          include: { assignee: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
    if (!sprint) throw AppError.notFound('Sprint');

    const completed = sprint.issues.filter((i) => isDoneStatus(i.status));
    const incomplete = sprint.issues.filter((i) => !isDoneStatus(i.status));
    // Issues created after the sprint started were "added mid-sprint".
    const addedAfterStart = sprint.startDate
      ? sprint.issues.filter((i) => i.createdAt > sprint.startDate!)
      : [];

    const committedPoints = sprint.issues.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
    const completedPoints = completed.reduce((s, i) => s + (i.storyPoints ?? 0), 0);

    return {
      sprint: { id: sprint.id, name: sprint.name, goal: sprint.goal, status: sprint.status },
      completed,
      incomplete,
      addedAfterStart,
      stats: {
        velocity: completedPoints,
        committedPoints,
        completionRate: committedPoints ? Math.round((completedPoints / committedPoints) * 100) : 0,
        completedCount: completed.length,
        incompleteCount: incomplete.length,
      },
    };
  },

  /** Cumulative flow: issue count per status per day over a date range. */
  async cumulativeFlow(projectKey: string, from: Date, to: Date) {
    const project = await prisma.project.findUnique({
      where: { key: projectKey },
      select: { id: true, columns: { orderBy: { order: 'asc' } } },
    });
    if (!project) throw AppError.notFound('Project');

    const statuses = project.columns.map((c) => c.status);
    const issues = await prisma.issue.findMany({
      where: { projectId: project.id, createdAt: { lte: to } },
      select: { createdAt: true, status: true, resolvedAt: true },
    });

    const days = eachDay(from, to);
    const series = days.map((day) => {
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      const counts: Record<string, number> = {};
      statuses.forEach((s) => (counts[s] = 0));
      issues
        .filter((i) => i.createdAt <= endOfDay)
        .forEach((i) => {
          // Approximate historical status: done if resolved by this day, else current.
          const status = i.resolvedAt && i.resolvedAt <= endOfDay ? lastDone(statuses) : i.status;
          if (counts[status] !== undefined) counts[status] += 1;
        });
      return { date: day.toISOString().slice(0, 10), ...counts };
    });

    return { statuses, series };
  },

  async epicReport(epicId: string) {
    const epic = await prisma.epic.findUnique({
      where: { id: epicId },
      include: { issues: { select: { id: true, key: true, title: true, status: true, storyPoints: true } } },
    });
    if (!epic) throw AppError.notFound('Epic');

    const byStatus: Record<string, number> = {};
    epic.issues.forEach((i) => (byStatus[i.status] = (byStatus[i.status] ?? 0) + 1));
    const done = epic.issues.filter((i) => isDoneStatus(i.status)).length;
    const progress = epic.issues.length ? Math.round((done / epic.issues.length) * 100) : 0;

    return { epic: { id: epic.id, name: epic.name, color: epic.color }, byStatus, progress, total: epic.issues.length, issues: epic.issues };
  },

  async workload(projectKey: string) {
    const project = await prisma.project.findUnique({ where: { key: projectKey }, select: { id: true } });
    if (!project) throw AppError.notFound('Project');

    const issues = await prisma.issue.findMany({
      where: { projectId: project.id, resolvedAt: null },
      select: {
        storyPoints: true,
        estimatedHours: true,
        loggedHours: true,
        assignee: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    const map = new Map<string, { user: { id: string; displayName: string; avatarUrl: string | null } | null; issueCount: number; storyPoints: number; estimatedHours: number; loggedHours: number }>();
    for (const i of issues) {
      const key = i.assignee?.id ?? 'unassigned';
      const entry = map.get(key) ?? {
        user: i.assignee ?? null,
        issueCount: 0,
        storyPoints: 0,
        estimatedHours: 0,
        loggedHours: 0,
      };
      entry.issueCount += 1;
      entry.storyPoints += i.storyPoints ?? 0;
      entry.estimatedHours += i.estimatedHours ?? 0;
      entry.loggedHours += i.loggedHours;
      map.set(key, entry);
    }
    return [...map.values()];
  },
};

function lastDone(statuses: string[]): string {
  return [...statuses].reverse().find((s) => isDoneStatus(s)) ?? statuses[statuses.length - 1] ?? 'Done';
}
