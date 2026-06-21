import { api, unwrap } from './api';
import type {
  Sprint,
  SprintWithIssues,
  CreateSprintInput,
  StartSprintInput,
  CompleteSprintInput,
  CompleteSprintResult,
} from '@/types/sprint.types';

export const sprintService = {
  listForProject: (projectKey: string) => unwrap<Sprint[]>(api.get(`/projects/${projectKey}/sprints`)),
  getById: (sprintId: string) => unwrap<SprintWithIssues>(api.get(`/sprints/${sprintId}`)),
  create: (projectKey: string, input: CreateSprintInput) =>
    unwrap<Sprint>(api.post(`/projects/${projectKey}/sprints`, input)),
  update: (sprintId: string, input: Partial<CreateSprintInput>) =>
    unwrap<Sprint>(api.put(`/sprints/${sprintId}`, input)),
  remove: (sprintId: string) => api.delete(`/sprints/${sprintId}`),
  start: (sprintId: string, input: StartSprintInput) => unwrap<Sprint>(api.post(`/sprints/${sprintId}/start`, input)),
  complete: (sprintId: string, input: CompleteSprintInput) =>
    unwrap<CompleteSprintResult>(api.post(`/sprints/${sprintId}/complete`, input)),
};
