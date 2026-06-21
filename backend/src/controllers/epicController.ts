import { Request, Response } from 'express';
import { z } from 'zod';
import { EpicStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { sendSuccess, AppError } from '../utils/apiResponse';

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  status: z.nativeEnum(EpicStatus).optional(),
});

const updateSchema = createSchema.partial();

function toDate(v?: string | null): Date | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  return new Date(v);
}

export const epicController = {
  async list(req: Request, res: Response) {
    const project = await prisma.project.findUnique({
      where: { key: req.params.projectKey },
      select: { id: true },
    });
    if (!project) throw AppError.notFound('Project');
    const epics = await prisma.epic.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { issues: true } } },
    });
    sendSuccess(res, epics);
  },

  async create(req: Request, res: Response) {
    const input = createSchema.parse(req.body);
    const epic = await prisma.epic.create({
      data: {
        projectId: req.projectId!,
        name: input.name,
        description: input.description,
        color: input.color,
        status: input.status,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
      },
    });
    sendSuccess(res, epic, 201);
  },

  async update(req: Request, res: Response) {
    const input = updateSchema.parse(req.body);
    const epic = await prisma.epic.update({
      where: { id: req.params.epicId },
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        status: input.status,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
      },
    });
    sendSuccess(res, epic);
  },

  async remove(req: Request, res: Response) {
    await prisma.epic.delete({ where: { id: req.params.epicId } });
    sendSuccess(res, { message: 'Epic deleted' });
  },
};
