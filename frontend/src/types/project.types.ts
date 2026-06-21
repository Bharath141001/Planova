import { ProjectType, ProjectRole, CustomFieldType } from './common.types';
import { UserMini } from './user.types';

export interface BoardColumn {
  id: string;
  projectId: string;
  name: string;
  status: string;
  order: number;
  color: string;
  wipLimit: number | null;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface CustomField {
  id: string;
  projectId: string;
  name: string;
  type: CustomFieldType;
  options: string[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user: UserMini & { email?: string };
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: ProjectType;
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  members: ProjectMember[];
  columns: BoardColumn[];
  labels: Label[];
  _count?: { issues: number; sprints: number; epics: number };
}

export interface CreateProjectInput {
  key: string;
  name: string;
  description?: string;
  type: ProjectType;
  isPrivate?: boolean;
}
