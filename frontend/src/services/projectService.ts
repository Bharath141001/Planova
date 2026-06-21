import { api, unwrap } from './api';
import type { Project, CreateProjectInput, ProjectMember, Label, CustomField, BoardColumn } from '@/types/project.types';
import type { Epic } from '@/types/sprint.types';
import type { ProjectRole } from '@/types/common.types';

export const projectService = {
  list: (search?: string) => unwrap<Project[]>(api.get('/projects', { params: { search } })),
  getByKey: (key: string) => unwrap<Project>(api.get(`/projects/${key}`)),
  create: (input: CreateProjectInput) => unwrap<Project>(api.post('/projects', input)),
  update: (key: string, data: Partial<CreateProjectInput> & { avatarUrl?: string }) =>
    unwrap<Project>(api.put(`/projects/${key}`, data)),
  remove: (key: string) => api.delete(`/projects/${key}`),
  archive: (key: string) => api.post(`/projects/${key}/archive`),

  listMembers: (key: string) => unwrap<ProjectMember[]>(api.get(`/projects/${key}/members`)),
  addMember: (key: string, email: string, role: ProjectRole) =>
    unwrap<ProjectMember>(api.post(`/projects/${key}/members`, { email, role })),
  updateMember: (key: string, userId: string, role: ProjectRole) =>
    unwrap<ProjectMember>(api.put(`/projects/${key}/members/${userId}`, { role })),
  removeMember: (key: string, userId: string) => api.delete(`/projects/${key}/members/${userId}`),

  // Epics
  listEpics: (key: string) => unwrap<Epic[]>(api.get(`/projects/${key}/epics`)),
  createEpic: (key: string, data: Partial<Epic>) => unwrap<Epic>(api.post(`/projects/${key}/epics`, data)),
  updateEpic: (epicId: string, data: Partial<Epic>) => unwrap<Epic>(api.put(`/epics/${epicId}`, data)),
  removeEpic: (epicId: string) => api.delete(`/epics/${epicId}`),

  // Labels
  listLabels: (key: string) => unwrap<Label[]>(api.get(`/projects/${key}/labels`)),
  createLabel: (key: string, data: { name: string; color?: string }) =>
    unwrap<Label>(api.post(`/projects/${key}/labels`, data)),
  removeLabel: (key: string, labelId: string) => api.delete(`/projects/${key}/labels/${labelId}`),

  // Custom fields
  listCustomFields: (key: string) => unwrap<CustomField[]>(api.get(`/projects/${key}/custom-fields`)),
  createCustomField: (key: string, data: { name: string; type: string; options?: string[] }) =>
    unwrap<CustomField>(api.post(`/projects/${key}/custom-fields`, data)),
  removeCustomField: (key: string, fieldId: string) => api.delete(`/projects/${key}/custom-fields/${fieldId}`),

  // Columns
  createColumn: (key: string, data: { name: string; status: string; color?: string; wipLimit?: number | null }) =>
    unwrap<BoardColumn>(api.post(`/projects/${key}/columns`, data)),
  updateColumn: (key: string, columnId: string, data: Partial<BoardColumn>) =>
    unwrap<BoardColumn>(api.put(`/projects/${key}/columns/${columnId}`, data)),
  reorderColumns: (key: string, columnIds: string[]) =>
    api.put(`/projects/${key}/columns/reorder`, { columnIds }),
  deleteColumn: (key: string, columnId: string) => api.delete(`/projects/${key}/columns/${columnId}`),
};
