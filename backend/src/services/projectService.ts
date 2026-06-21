import { ProjectRole, ProjectType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { invalidate } from '../config/redis';

const DEFAULT_COLUMNS = [
  { name: 'To Do', status: 'To Do', order: 0, color: '#42526E' },
  { name: 'In Progress', status: 'In Progress', order: 1, color: '#0052CC' },
  { name: 'In Review', status: 'In Review', order: 2, color: '#FF991F' },
  { name: 'Done', status: 'Done', order: 3, color: '#36B37E' },
];

const DEFAULT_LABELS = [
  { name: 'frontend', color: '#0052CC' },
  { name: 'backend', color: '#6554C0' },
  { name: 'design', color: '#FF991F' },
  { name: 'tech-debt', color: '#DE350B' },
];

const projectInclude = {
  members: {
    include: { user: { select: { id: true, displayName: true, avatarUrl: true, email: true } } },
  },
  columns: { orderBy: { order: 'asc' } },
  labels: true,
  _count: { select: { issues: true, sprints: true, epics: true } },
} satisfies Prisma.ProjectInclude;

export const projectService = {
  async list(userId: string, search?: string) {
    return prisma.project.findMany({
      where: {
        archivedAt: null,
        members: { some: { userId } },
        ...(search
          ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { key: { contains: search.toUpperCase() } }] }
          : {}),
      },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getByKey(key: string) {
    const project = await prisma.project.findUnique({ where: { key }, include: projectInclude });
    if (!project) throw AppError.notFound('Project');
    return project;
  },

  async create(input: {
    key: string;
    name: string;
    description?: string;
    type: ProjectType;
    isPrivate?: boolean;
    ownerId: string;
  }) {
    const key = input.key.toUpperCase();
    const existing = await prisma.project.findUnique({ where: { key } });
    if (existing) throw AppError.conflict(`Project key "${key}" is already in use`);

    return prisma.project.create({
      data: {
        key,
        name: input.name,
        description: input.description,
        type: input.type,
        isPrivate: input.isPrivate ?? false,
        members: { create: { userId: input.ownerId, role: ProjectRole.OWNER } },
        columns: { create: DEFAULT_COLUMNS },
        labels: { create: DEFAULT_LABELS },
      },
      include: projectInclude,
    });
  },

  async update(
    key: string,
    data: Partial<{ name: string; description: string; isPrivate: boolean; avatarUrl: string; type: ProjectType }>
  ) {
    await this.getByKey(key);
    const project = await prisma.project.update({ where: { key }, data, include: projectInclude });
    await invalidate(`project:${project.id}:*`);
    return project;
  },

  async archive(key: string) {
    return prisma.project.update({ where: { key }, data: { archivedAt: new Date() } });
  },

  async remove(key: string) {
    await prisma.project.delete({ where: { key } });
  },

  // ── Members ──────────────────────────────────────────────

  async listMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, displayName: true, email: true, avatarUrl: true, username: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  },

  async addMember(projectId: string, email: string, role: ProjectRole) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.notFound('User with that email');

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing) throw AppError.conflict('User is already a member');

    return prisma.projectMember.create({
      data: { projectId, userId: user.id, role },
      include: { user: { select: { id: true, displayName: true, email: true, avatarUrl: true } } },
    });
  },

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    if (role !== ProjectRole.OWNER) {
      const owners = await prisma.projectMember.count({ where: { projectId, role: ProjectRole.OWNER } });
      const target = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (owners <= 1 && target?.role === ProjectRole.OWNER) {
        throw AppError.conflict('Cannot demote the last project owner');
      }
    }
    return prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
    });
  },

  async removeMember(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw AppError.notFound('Member');
    if (member.role === ProjectRole.OWNER) {
      const owners = await prisma.projectMember.count({ where: { projectId, role: ProjectRole.OWNER } });
      if (owners <= 1) throw AppError.conflict('Cannot remove the last project owner');
    }
    await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
  },
};
