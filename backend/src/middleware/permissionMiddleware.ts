import { Request, Response, NextFunction } from 'express';
import { ProjectRole } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { Permission, roleHasPermission } from '../utils/permissions';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      projectId?: string;
      projectRole?: ProjectRole;
    }
  }
}

/**
 * Resolves the project from the route — supports :projectKey, :issueKey,
 * :sprintId, or a body.projectId — then verifies the user is a member and
 * holds the required permission. Attaches req.projectId / req.projectRole.
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();

    const projectId = await resolveProjectId(req);
    if (!projectId) throw AppError.notFound('Project');

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    // Global admins implicitly have OWNER rights on every project.
    const role: ProjectRole | undefined =
      membership?.role ?? (req.user.role === 'ADMIN' ? 'OWNER' : undefined);

    if (!role) throw AppError.forbidden('You are not a member of this project');
    if (!roleHasPermission(role, permission)) {
      throw AppError.forbidden(`Your role (${role}) lacks permission: ${permission}`);
    }

    req.projectId = projectId;
    req.projectRole = role;
    next();
  };
}

/** Membership check without a specific permission (read access to a project). */
export function requireProjectMember() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const projectId = await resolveProjectId(req);
    if (!projectId) throw AppError.notFound('Project');

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    const role = membership?.role ?? (req.user.role === 'ADMIN' ? 'OWNER' : undefined);
    if (!role) {
      // Allow read of public projects to any authenticated user.
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { isPrivate: true },
      });
      if (!project || project.isPrivate) throw AppError.forbidden('Project access denied');
    }
    req.projectId = projectId;
    if (role) req.projectRole = role;
    next();
  };
}

async function resolveProjectId(req: Request): Promise<string | null> {
  const { projectKey, issueKey, sprintId, epicId } = req.params;

  if (projectKey) {
    const p = await prisma.project.findUnique({ where: { key: projectKey }, select: { id: true } });
    return p?.id ?? null;
  }
  if (issueKey) {
    const i = await prisma.issue.findUnique({ where: { key: issueKey }, select: { projectId: true } });
    return i?.projectId ?? null;
  }
  if (sprintId) {
    const s = await prisma.sprint.findUnique({ where: { id: sprintId }, select: { projectId: true } });
    return s?.projectId ?? null;
  }
  if (epicId) {
    const e = await prisma.epic.findUnique({ where: { id: epicId }, select: { projectId: true } });
    return e?.projectId ?? null;
  }
  if (typeof req.body?.projectId === 'string') return req.body.projectId;
  if (typeof req.body?.projectKey === 'string') {
    const p = await prisma.project.findUnique({
      where: { key: req.body.projectKey },
      select: { id: true },
    });
    return p?.id ?? null;
  }
  return null;
}
