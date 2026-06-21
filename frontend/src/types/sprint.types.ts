import { SprintStatus } from './common.types';
import { IssueSummary } from './issue.types';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  velocity: number | null;
  createdAt: string;
  _count?: { issues: number };
}

export interface SprintWithIssues extends Sprint {
  issues: IssueSummary[];
  project?: { id: string; key: string };
}

export interface CreateSprintInput {
  name: string;
  goal?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface StartSprintInput {
  startDate: string;
  endDate: string;
  goal?: string;
}

export interface CompleteSprintInput {
  destination: 'backlog' | 'next';
  nextSprintId?: string;
}

export interface CompleteSprintResult {
  sprint: Sprint;
  summary: {
    completedCount: number;
    incompleteCount: number;
    velocity: number;
    movedTo: 'backlog' | 'next';
  };
}

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  color: string;
  startDate: string | null;
  endDate: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  _count?: { issues: number };
}
