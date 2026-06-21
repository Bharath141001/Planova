import { api, unwrap } from './api';
import type {
  BurndownReport,
  VelocityReport,
  SprintReport,
  CumulativeFlowReport,
  EpicReport,
  WorkloadEntry,
} from '@/types/report.types';

export const reportService = {
  burndown: (sprintId: string, mode: 'points' | 'count' = 'points') =>
    unwrap<BurndownReport>(api.get(`/reports/burndown/${sprintId}`, { params: { mode } })),
  velocity: (projectKey: string, limit = 7) =>
    unwrap<VelocityReport>(api.get(`/reports/velocity/${projectKey}`, { params: { limit } })),
  sprintReport: (sprintId: string) => unwrap<SprintReport>(api.get(`/reports/sprint/${sprintId}`)),
  cumulativeFlow: (projectKey: string, from?: string, to?: string) =>
    unwrap<CumulativeFlowReport>(api.get(`/reports/cumulative-flow/${projectKey}`, { params: { from, to } })),
  epicReport: (epicId: string) => unwrap<EpicReport>(api.get(`/reports/epic/${epicId}`)),
  workload: (projectKey: string) => unwrap<WorkloadEntry[]>(api.get(`/reports/workload/${projectKey}`)),
};
