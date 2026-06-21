import { IssueType, IssuePriority, IssueLinkType } from './common.types';
import { UserMini } from './user.types';

export interface IssueSummary {
  id: string;
  key: string;
  title: string;
  type: IssueType;
  status: string;
  priority: IssuePriority;
  assigneeId: string | null;
  assignee?: UserMini | null;
  epicId: string | null;
  epic?: { id: string; name: string; color: string } | null;
  sprintId: string | null;
  storyPoints: number | null;
  labels: string[];
  rank: string;
  dueDate: string | null;
  _count?: { comments: number; subtasks: number; attachments: number };
}

export interface Attachment {
  id: string;
  issueId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface Worklog {
  id: string;
  issueId: string;
  userId: string;
  timeSpent: number;
  description: string | null;
  loggedAt: string;
  user: UserMini;
}

export interface IssueLink {
  id: string;
  type: IssueLinkType;
  targetIssue?: { id: string; key: string; title: string; status: string; type: IssueType };
  sourceIssue?: { id: string; key: string; title: string; status: string; type: IssueType };
}

export interface CustomFieldValue {
  id: string;
  fieldId: string;
  value: string;
  field: { id: string; name: string; type: string; options: string[] };
}

export interface Issue extends IssueSummary {
  description: string | null;
  reporterId: string;
  reporter: UserMini;
  parentIssueId: string | null;
  parentIssue?: { id: string; key: string; title: string } | null;
  subtasks: Array<{ id: string; key: string; title: string; status: string; type: IssueType; assigneeId: string | null }>;
  estimatedHours: number | null;
  loggedHours: number;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  watchers: Array<{ userId: string }>;
  attachments: Attachment[];
  worklogs: Worklog[];
  sourceLinks: IssueLink[];
  targetLinks: IssueLink[];
  customFieldValues: CustomFieldValue[];
  project: { id: string; key: string; name: string };
  sprint?: { id: string; name: string; status: string } | null;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  type?: IssueType;
  priority?: IssuePriority;
  status?: string;
  assigneeId?: string | null;
  epicId?: string | null;
  sprintId?: string | null;
  parentIssueId?: string | null;
  storyPoints?: number | null;
  estimatedHours?: number | null;
  dueDate?: string | null;
  labels?: string[];
  projectId: string;
}

export type UpdateIssueInput = Partial<Omit<CreateIssueInput, 'projectId'>> & { startDate?: string | null };

export interface RankIssueInput {
  beforeKey?: string | null;
  afterKey?: string | null;
  status?: string;
  sprintId?: string | null;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  author: UserMini;
  body: string;
  isEdited: boolean;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
  reactions: Array<{ id: string; emoji: string; userId: string; user: { id: string; displayName: string } }>;
  replies?: Comment[];
}

export interface Activity {
  id: string;
  issueId: string;
  actorId: string;
  actor: UserMini;
  type: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}
