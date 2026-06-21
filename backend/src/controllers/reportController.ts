import { Request, Response } from 'express';
import { reportService } from '../services/reportService';
import { sendSuccess } from '../utils/apiResponse';

export const reportController = {
  async burndown(req: Request, res: Response) {
    const mode = (req.query.mode as 'points' | 'count') ?? 'points';
    const data = await reportService.burndown(req.params.sprintId, mode);
    sendSuccess(res, data);
  },

  async velocity(req: Request, res: Response) {
    const limit = parseInt((req.query.limit as string) ?? '7', 10);
    const data = await reportService.velocity(req.params.projectKey, limit);
    sendSuccess(res, data);
  },

  async sprintReport(req: Request, res: Response) {
    const data = await reportService.sprintReport(req.params.sprintId);
    sendSuccess(res, data);
  },

  async cumulativeFlow(req: Request, res: Response) {
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const from = req.query.from
      ? new Date(req.query.from as string)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const data = await reportService.cumulativeFlow(req.params.projectKey, from, to);
    sendSuccess(res, data);
  },

  async epicReport(req: Request, res: Response) {
    const data = await reportService.epicReport(req.params.epicId);
    sendSuccess(res, data);
  },

  async workload(req: Request, res: Response) {
    const data = await reportService.workload(req.params.projectKey);
    sendSuccess(res, data);
  },
};
