import { UserMini } from './user.types';
import { IssueSummary } from './issue.types';

export interface BurndownPoint {
  date: string;
  ideal: number;
  remaining: number;
}
export interface BurndownReport {
  points: BurndownPoint[];
  totalScope: number;
}

export interface VelocityReport {
  data: Array<{ sprintId: string; name: string; committed: number; completed: number }>;
  average: number;
}

export interface SprintReport {
  sprint: { id: string; name: string; goal: string | null; status: string };
  completed: IssueSummary[];
  incomplete: IssueSummary[];
  addedAfterStart: IssueSummary[];
  stats: {
    velocity: number;
    committedPoints: number;
    completionRate: number;
    completedCount: number;
    incompleteCount: number;
  };
}

export interface CumulativeFlowReport {
  statuses: string[];
  series: Array<Record<string, string | number>>;
}

export interface EpicReport {
  epic: { id: string; name: string; color: string };
  byStatus: Record<string, number>;
  progress: number;
  total: number;
  issues: Array<{ id: string; key: string; title: string; status: string; storyPoints: number | null }>;
}

export interface WorkloadEntry {
  user: UserMini | null;
  issueCount: number;
  storyPoints: number;
  estimatedHours: number;
  loggedHours: number;
}
