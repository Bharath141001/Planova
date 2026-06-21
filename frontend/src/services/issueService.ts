import { api, unwrap } from './api';
import type {
  Issue,
  IssueSummary,
  CreateIssueInput,
  UpdateIssueInput,
  RankIssueInput,
  Comment,
  Activity,
  Attachment,
  Worklog,
  IssueLink,
} from '@/types/issue.types';
import type { IssueLinkType, IssuePriority } from '@/types/common.types';

export interface IssueFilters {
  status?: string;
  type?: string;
  priority?: string;
  assigneeId?: string;
  epicId?: string;
  sprintId?: string;
  label?: string;
  search?: string;
}

export const issueService = {
  listForProject: (projectKey: string, filters?: IssueFilters) =>
    unwrap<IssueSummary[]>(api.get(`/projects/${projectKey}/issues`, { params: filters })),
  getByKey: (key: string) => unwrap<Issue>(api.get(`/issues/${key}`)),
  create: (projectKey: string, input: CreateIssueInput) =>
    unwrap<Issue>(api.post(`/projects/${projectKey}/issues`, input)),
  update: (key: string, data: UpdateIssueInput) => unwrap<Issue>(api.put(`/issues/${key}`, data)),
  remove: (key: string) => api.delete(`/issues/${key}`),
  clone: (key: string) => unwrap<Issue>(api.post(`/issues/${key}/clone`)),
  rank: (key: string, payload: RankIssueInput) => unwrap<IssueSummary>(api.put(`/issues/${key}/rank`, payload)),
  watch: (key: string) => unwrap<{ watching: boolean }>(api.post(`/issues/${key}/watch`)),
  unwatch: (key: string) => unwrap<{ watching: boolean }>(api.delete(`/issues/${key}/watch`)),
  bulk: (keys: string[], data: { status?: string; assigneeId?: string | null; sprintId?: string | null; priority?: IssuePriority }) =>
    unwrap<{ updated: number }>(api.post('/issues/bulk', { keys, data })),
  search: (filters: IssueFilters & { projectKey?: string }) =>
    unwrap<IssueSummary[]>(api.get('/issues/search', { params: filters })),

  // Activity & worklog
  activity: (key: string) => unwrap<Activity[]>(api.get(`/issues/${key}/activity`)),
  logWork: (key: string, data: { timeSpent: number; description?: string; loggedAt?: string }) =>
    unwrap<Worklog>(api.post(`/issues/${key}/worklog`, data)),

  // Links
  link: (key: string, targetKey: string, type: IssueLinkType) =>
    unwrap<IssueLink>(api.post(`/issues/${key}/links`, { targetKey, type })),
  unlink: (key: string, linkId: string) => api.delete(`/issues/${key}/links/${linkId}`),

  // Comments
  listComments: (key: string) => unwrap<Comment[]>(api.get(`/issues/${key}/comments`)),
  addComment: (key: string, body: string, parentCommentId?: string) =>
    unwrap<Comment>(api.post(`/issues/${key}/comments`, { body, parentCommentId })),
  updateComment: (commentId: string, body: string) =>
    unwrap<Comment>(api.put(`/comments/${commentId}`, { body })),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),
  reactComment: (commentId: string, emoji: string) =>
    unwrap<{ added: boolean }>(api.post(`/comments/${commentId}/reactions`, { emoji })),

  exportCsv: (projectKey: string, filters?: IssueFilters) =>
    api
      .get(`/projects/${projectKey}/issues/export`, { params: filters, responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectKey}-issues.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }),

  // Attachments
  uploadAttachment: (key: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    // Do NOT set Content-Type manually — the browser must set it with the
    // multipart boundary (e.g. "multipart/form-data; boundary=----XYZ").
    // Overriding it strips the boundary and multer rejects the request.
    return unwrap<Attachment>(api.post(`/issues/${key}/attachments`, form));
  },
  deleteAttachment: (attachmentId: string) => api.delete(`/attachments/${attachmentId}`),
};
