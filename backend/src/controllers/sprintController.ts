import { Request, Response } from 'express';
import { z } from 'zod';
import { sprintService } from '../services/sprintService';
import { prisma } from '../config/database';
import { sendSuccess, AppError } from '../utils/apiResponse';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

const updateSchema = createSchema.partial();

const startSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  goal: z.string().max(500).optional(),
});

const completeSchema = z.object({
  destination: z.enum(['backlog', 'next']),
  nextSprintId: z.string().optional(),
});

function toDate(v?: string | null): Date | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  return new Date(v);
}

export const sprintController = {
  async list(req: Request, res: Response) {
    const project = await prisma.project.findUnique({
      where: { key: req.params.projectKey },
      select: { id: true },
    });
    if (!project) throw AppError.notFound('Project');
    const sprints = await sprintService.listForProject(project.id);
    sendSuccess(res, sprints);
  },

  async create(req: Request, res: Response) {
    const input = createSchema.parse(req.body);
    const sprint = await sprintService.create({
      projectId: req.projectId!,
      name: input.name,
      goal: input.goal,
      startDate: toDate(input.startDate),
      endDate: toDate(input.endDate),
    });
    sendSuccess(res, sprint, 201);
  },

  async get(req: Request, res: Response) {
    const sprint = await sprintService.getById(req.params.sprintId);
    sendSuccess(res, sprint);
  },

  async update(req: Request, res: Response) {
    const input = updateSchema.parse(req.body);
    const sprint = await sprintService.update(req.params.sprintId, {
      name: input.name,
      goal: input.goal,
      startDate: toDate(input.startDate),
      endDate: toDate(input.endDate),
    });
    sendSuccess(res, sprint);
  },

  async remove(req: Request, res: Response) {
    await sprintService.remove(req.params.sprintId);
    sendSuccess(res, { message: 'Sprint deleted' });
  },

  async start(req: Request, res: Response) {
    const input = startSchema.parse(req.body);
    const sprint = await sprintService.start(req.params.sprintId, req.user!.id, {
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      goal: input.goal,
    });
    sendSuccess(res, sprint);
  },

  async complete(req: Request, res: Response) {
    const input = completeSchema.parse(req.body);
    const result = await sprintService.complete(req.params.sprintId, req.user!.id, input);
    sendSuccess(res, result);
  },
};
