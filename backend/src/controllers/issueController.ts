import { Request, Response } from 'express';
import { z } from 'zod';
import { IssueType, IssuePriority, IssueLinkType } from '@prisma/client';
import { issueService } from '../services/issueService';
import { activityService } from '../services/activityService';
import { prisma } from '../config/database';
import { sendSuccess, AppError } from '../utils/apiResponse';

const optionalDate = z
  .string()
  .datetime()
  .or(z.string().date())
  .nullable()
  .optional()
  .transform((v) => (v ? new Date(v) : v === null ? null : undefined));

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.nativeEnum(IssueType).optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  status: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  parentIssueId: z.string().nullable().optional(),
  storyPoints: z.number().int().min(0).nullable().optional(),
  estimatedHours: z.number().min(0).nullable().optional(),
  dueDate: optionalDate,
  labels: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial().extend({
  startDate: optionalDate,
});

const rankSchema = z.object({
  beforeKey: z.string().nullable().optional(),
  afterKey: z.string().nullable().optional(),
  status: z.string().optional(),
  sprintId: z.string().nullable().optional(),
});

const bulkSchema = z.object({
  keys: z.array(z.string()).min(1),
  data: z.object({
    status: z.string().optional(),
    assigneeId: z.string().nullable().optional(),
    sprintId: z.string().nullable().optional(),
    priority: z.nativeEnum(IssuePriority).optional(),
  }),
});

const linkSchema = z.object({ targetKey: z.string(), type: z.nativeEnum(IssueLinkType) });

const worklogSchema = z.object({
  timeSpent: z.number().positive(),
  description: z.string().optional(),
  loggedAt: z.string().datetime().optional(),
});

export const issueController = {
  async list(req: Request, res: Response) {
    const project = await prisma.project.findUnique({
      where: { key: req.params.projectKey },
      select: { id: true },
    });
    if (!project) throw AppError.notFound('Project');
    const issues = await issueService.listForProject(project.id, req.query);
    sendSuccess(res, issues);
  },

  async create(req: Request, res: Response) {
    const input = createSchema.parse(req.body);
    const issue = await issueService.create({
      ...input,
      projectId: req.projectId!,
      reporterId: req.user!.id,
    });
    sendSuccess(res, issue, 201);
  },

  async get(req: Request, res: Response) {
    const issue = await issueService.getByKey(req.params.issueKey);
    sendSuccess(res, issue);
  },

  async update(req: Request, res: Response) {
    const data = updateSchema.parse(req.body);
    const issue = await issueService.update(req.params.issueKey, req.user!.id, data);
    sendSuccess(res, issue);
  },

  async remove(req: Request, res: Response) {
    await issueService.remove(req.params.issueKey);
    sendSuccess(res, { message: 'Issue deleted' });
  },

  async clone(req: Request, res: Response) {
    const issue = await issueService.clone(req.params.issueKey, req.user!.id);
    sendSuccess(res, issue, 201);
  },

  async rank(req: Request, res: Response) {
    const payload = rankSchema.parse(req.body);
    const issue = await issueService.rank(req.params.issueKey, req.user!.id, payload);
    sendSuccess(res, issue);
  },

  async watch(req: Request, res: Response) {
    const result = await issueService.setWatching(req.params.issueKey, req.user!.id, true);
    sendSuccess(res, result);
  },

  async unwatch(req: Request, res: Response) {
    const result = await issueService.setWatching(req.params.issueKey, req.user!.id, false);
    sendSuccess(res, result);
  },

  async bulk(req: Request, res: Response) {
    const { keys, data } = bulkSchema.parse(req.body);
    const result = await issueService.bulkUpdate(keys, req.user!.id, data);
    sendSuccess(res, result);
  },

  async search(req: Request, res: Response) {
    const issues = await issueService.search(req.user!.id, req.query);
    sendSuccess(res, issues);
  },

  async link(req: Request, res: Response) {
    const { targetKey, type } = linkSchema.parse(req.body);
    const link = await issueService.link(req.params.issueKey, req.user!.id, targetKey, type);
    sendSuccess(res, link, 201);
  },

  async unlink(req: Request, res: Response) {
    await issueService.unlink(req.params.linkId);
    sendSuccess(res, { message: 'Link removed' });
  },

  async activity(req: Request, res: Response) {
    const issue = await prisma.issue.findUnique({
      where: { key: req.params.issueKey },
      select: { id: true },
    });
    if (!issue) throw AppError.notFound('Issue');
    const activities = await activityService.listForIssue(issue.id);
    sendSuccess(res, activities);
  },

  async exportCsv(req: Request, res: Response) {
    const project = await prisma.project.findUnique({
      where: { key: req.params.projectKey },
      select: { id: true, key: true },
    });
    if (!project) throw AppError.notFound('Project');

    const issues = await issueService.listForExport(project.id, req.query as Parameters<typeof issueService.listForExport>[1]);

    const cell = (v: unknown): string => {
      const s = String(v ?? '');
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const HEADERS = ['Key', 'Title', 'Type', 'Status', 'Priority', 'Assignee', 'Reporter', 'Sprint', 'Epic', 'Story Points', 'Estimated Hours', 'Logged Hours', 'Labels', 'Due Date', 'Created', 'Updated'];

    const rows = issues.map((i) =>
      [
        i.key,
        cell(i.title),
        i.type,
        cell(i.status),
        i.priority,
        cell(i.assignee?.displayName ?? ''),
        cell(i.reporter?.displayName ?? ''),
        cell(i.sprint?.name ?? ''),
        cell(i.epic?.name ?? ''),
        i.storyPoints ?? '',
        i.estimatedHours ?? '',
        i.loggedHours,
        cell(i.labels.join('; ')),
        i.dueDate?.toISOString().slice(0, 10) ?? '',
        i.createdAt.toISOString().slice(0, 10),
        i.updatedAt.toISOString().slice(0, 10),
      ].join(',')
    );

    const csv = [HEADERS.join(','), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${project.key}-issues.csv"`);
    // BOM so Excel opens UTF-8 correctly
    res.send('﻿' + csv);
  },

  async logWork(req: Request, res: Response) {
    const { timeSpent, description, loggedAt } = worklogSchema.parse(req.body);
    const issue = await prisma.issue.findUnique({
      where: { key: req.params.issueKey },
      select: { id: true },
    });
    if (!issue) throw AppError.notFound('Issue');

    const [worklog] = await prisma.$transaction([
      prisma.worklog.create({
        data: {
          issueId: issue.id,
          userId: req.user!.id,
          timeSpent,
          description,
          loggedAt: loggedAt ? new Date(loggedAt) : undefined,
        },
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      }),
      prisma.issue.update({ where: { id: issue.id }, data: { loggedHours: { increment: timeSpent } } }),
    ]);
    await activityService.log({
      issueId: issue.id,
      actorId: req.user!.id,
      type: 'WORKLOG_ADDED',
      field: 'loggedHours',
      newValue: String(timeSpent),
    });
    sendSuccess(res, worklog, 201);
  },
};
