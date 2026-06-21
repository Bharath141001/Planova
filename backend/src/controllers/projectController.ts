import { Request, Response } from 'express';
import { z } from 'zod';
import { ProjectRole, ProjectType } from '@prisma/client';
import { projectService } from '../services/projectService';
import { sendSuccess } from '../utils/apiResponse';

const createSchema = z.object({
  key: z.string().min(2).max(10).regex(/^[A-Za-z][A-Za-z0-9]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(ProjectType).default(ProjectType.SCRUM),
  isPrivate: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  isPrivate: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
  type: z.nativeEnum(ProjectType).optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

const roleSchema = z.object({ role: z.nativeEnum(ProjectRole) });

export const projectController = {
  async list(req: Request, res: Response) {
    const projects = await projectService.list(req.user!.id, req.query.search as string | undefined);
    sendSuccess(res, projects);
  },

  async create(req: Request, res: Response) {
    const input = createSchema.parse(req.body);
    const project = await projectService.create({ ...input, ownerId: req.user!.id });
    sendSuccess(res, project, 201);
  },

  async getByKey(req: Request, res: Response) {
    const project = await projectService.getByKey(req.params.projectKey);
    sendSuccess(res, project);
  },

  async update(req: Request, res: Response) {
    const data = updateSchema.parse(req.body);
    const project = await projectService.update(req.params.projectKey, data);
    sendSuccess(res, project);
  },

  async remove(req: Request, res: Response) {
    await projectService.remove(req.params.projectKey);
    sendSuccess(res, { message: 'Project deleted' });
  },

  async archive(req: Request, res: Response) {
    await projectService.archive(req.params.projectKey);
    sendSuccess(res, { message: 'Project archived' });
  },

  async listMembers(req: Request, res: Response) {
    const members = await projectService.listMembers(req.projectId!);
    sendSuccess(res, members);
  },

  async addMember(req: Request, res: Response) {
    const { email, role } = addMemberSchema.parse(req.body);
    const member = await projectService.addMember(req.projectId!, email, role);
    sendSuccess(res, member, 201);
  },

  async updateMember(req: Request, res: Response) {
    const { role } = roleSchema.parse(req.body);
    const member = await projectService.updateMemberRole(req.projectId!, req.params.userId, role);
    sendSuccess(res, member);
  },

  async removeMember(req: Request, res: Response) {
    await projectService.removeMember(req.projectId!, req.params.userId);
    sendSuccess(res, { message: 'Member removed' });
  },
};
