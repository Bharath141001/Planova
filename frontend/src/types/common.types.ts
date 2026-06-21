export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  success: false;
  error: { message: string; code: string; details?: unknown };
}

export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type IssueType = 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK' | 'IMPROVEMENT';
export type ProjectType = 'SCRUM' | 'KANBAN';
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type GlobalRole = 'ADMIN' | 'MEMBER' | 'VIEWER';
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';
export type EpicStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type IssueLinkType = 'BLOCKS' | 'IS_BLOCKED_BY' | 'DUPLICATES' | 'RELATES_TO' | 'CLONES';
export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTI_SELECT' | 'USER';
export type NotificationType =
  | 'ISSUE_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'STATUS_CHANGED'
  | 'MENTIONED'
  | 'SPRINT_STARTED'
  | 'SPRINT_COMPLETED'
  | 'DUE_DATE_APPROACHING';
