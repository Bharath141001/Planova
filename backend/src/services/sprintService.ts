import { SprintStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { notificationService } from './notificationService';
import { emitToProject } from '../config/socket';

const sprintInclude = {
  _count: { select: { issues: true } },
};

function isDoneStatus(status: string): boolean {
  return /done|complete|closed|resolved/i.test(status);
}

export const sprintService = {
  async listForProject(projectId: string) {
    return prisma.sprint.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      include: sprintInclude,
    });
  },

  async getById(id: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        issues: {
          include: { assignee: { select: { id: true, displayName: true, avatarUrl: true } } },
          orderBy: { rank: 'asc' },
        },
        project: { select: { id: true, key: true } },
      },
    });
    if (!sprint) throw AppError.notFound('Sprint');
    return sprint;
  },

  async create(input: {
    projectId: string;
    name: string;
    goal?: string;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    return prisma.sprint.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        goal: input.goal,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
      },
      include: sprintInclude,
    });
  },

  async update(
    id: string,
    data: Partial<{ name: string; goal: string; startDate: Date | null; endDate: Date | null }>
  ) {
    await this.assertExists(id);
    return prisma.sprint.update({ where: { id }, data, include: sprintInclude });
  },

  async remove(id: string) {
    const sprint = await this.assertExists(id);
    // Detach issues back to the backlog rather than deleting them.
    await prisma.$transaction([
      prisma.issue.updateMany({ where: { sprintId: id }, data: { sprintId: null } }),
      prisma.sprint.delete({ where: { id } }),
    ]);
    return sprint;
  },

  async start(id: string, actorId: string, data: { startDate: Date; endDate: Date; goal?: string }) {
    const sprint = await this.assertExists(id);
    if (sprint.status !== SprintStatus.PLANNED) {
      throw AppError.conflict('Only a planned sprint can be started');
    }
    const active = await prisma.sprint.findFirst({
      where: { projectId: sprint.projectId, status: SprintStatus.ACTIVE },
    });
    if (active) throw AppError.conflict(`Sprint "${active.name}" is already active`);

    const started = await prisma.sprint.update({
      where: { id },
      data: {
        status: SprintStatus.ACTIVE,
        startDate: data.startDate,
        endDate: data.endDate,
        goal: data.goal ?? sprint.goal,
      },
      include: sprintInclude,
    });

    const members = await prisma.projectMember.findMany({
      where: { projectId: sprint.projectId },
      select: { userId: true },
    });
    await notificationService.createMany(
      members.map((m) => m.userId),
      { type: NotificationType.SPRINT_STARTED, message: `started sprint "${started.name}"`, actorId }
    );
    emitToProject(sprint.projectId, 'sprint:started', { sprint: started });
    return started;
  },

  /** Completes a sprint, moves incomplete issues, and computes velocity. */
  async complete(
    id: string,
    actorId: string,
    moveTo: { destination: 'backlog' | 'next'; nextSprintId?: string }
  ) {
    const sprint = await this.getById(id);
    if (sprint.status !== SprintStatus.ACTIVE) {
      throw AppError.conflict('Only an active sprint can be completed');
    }

    const completed = sprint.issues.filter((i) => isDoneStatus(i.status));
    const incomplete = sprint.issues.filter((i) => !isDoneStatus(i.status));
    const velocity = completed.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

    let destinationSprintId: string | null = null;
    if (moveTo.destination === 'next') {
      if (moveTo.nextSprintId) {
        destinationSprintId = moveTo.nextSprintId;
      } else {
        const next = await prisma.sprint.create({
          data: { projectId: sprint.projectId, name: `${sprint.name} (carry-over)` },
        });
        destinationSprintId = next.id;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (incomplete.length) {
        await tx.issue.updateMany({
          where: { id: { in: incomplete.map((i) => i.id) } },
          data: { sprintId: destinationSprintId },
        });
      }
      return tx.sprint.update({
        where: { id },
        data: { status: SprintStatus.COMPLETED, completedAt: new Date(), velocity },
        include: sprintInclude,
      });
    });

    const members = await prisma.projectMember.findMany({
      where: { projectId: sprint.projectId },
      select: { userId: true },
    });
    await notificationService.createMany(
      members.map((m) => m.userId),
      { type: NotificationType.SPRINT_COMPLETED, message: `completed sprint "${sprint.name}"`, actorId }
    );
    emitToProject(sprint.projectId, 'sprint:completed', { sprint: result });

    return {
      sprint: result,
      summary: {
        completedCount: completed.length,
        incompleteCount: incomplete.length,
        velocity,
        movedTo: moveTo.destination,
      },
    };
  },

  async assertExists(id: string) {
    const sprint = await prisma.sprint.findUnique({ where: { id } });
    if (!sprint) throw AppError.notFound('Sprint');
    return sprint;
  },
};
