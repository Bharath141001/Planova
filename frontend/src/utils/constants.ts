import type { IssueType, IssuePriority, IssueLinkType } from '@/types/common.types';

export const ISSUE_TYPES: { value: IssueType; label: string; icon: string; color: string }[] = [
  { value: 'STORY', label: 'Story', icon: '📗', color: '#36B37E' },
  { value: 'TASK', label: 'Task', icon: '🔵', color: '#4BADE8' },
  { value: 'BUG', label: 'Bug', icon: '🐞', color: '#E5493A' },
  { value: 'EPIC', label: 'Epic', icon: '⚡', color: '#6554C0' },
  { value: 'SUBTASK', label: 'Subtask', icon: '🔗', color: '#4BADE8' },
  { value: 'IMPROVEMENT', label: 'Improvement', icon: '⬆️', color: '#FF991F' },
];

export const PRIORITIES: { value: IssuePriority; label: string; color: string }[] = [
  { value: 'CRITICAL', label: 'Critical', color: '#DE350B' },
  { value: 'HIGH', label: 'High', color: '#FF5630' },
  { value: 'MEDIUM', label: 'Medium', color: '#FF991F' },
  { value: 'LOW', label: 'Low', color: '#0065FF' },
  { value: 'NONE', label: 'None', color: '#6B778C' },
];

export const LINK_TYPES: { value: IssueLinkType; label: string }[] = [
  { value: 'BLOCKS', label: 'blocks' },
  { value: 'IS_BLOCKED_BY', label: 'is blocked by' },
  { value: 'DUPLICATES', label: 'duplicates' },
  { value: 'RELATES_TO', label: 'relates to' },
  { value: 'CLONES', label: 'clones' },
];

export const STORY_POINT_OPTIONS = [1, 2, 3, 5, 8, 13, 21];

export const REACTION_EMOJIS = ['👍', '👎', '❤️', '🎉', '😄', '🚀', '👀'];

export const LABEL_COLORS = [
  '#0052CC', '#6554C0', '#FF991F', '#DE350B', '#36B37E', '#00B8D9', '#FF8B00', '#8777D9',
];

export const QUERY_KEYS = {
  projects: ['projects'] as const,
  project: (key: string) => ['project', key] as const,
  issues: (key: string, filters?: unknown) => ['issues', key, filters] as const,
  issue: (key: string) => ['issue', key] as const,
  comments: (key: string) => ['comments', key] as const,
  activity: (key: string) => ['activity', key] as const,
  sprints: (key: string) => ['sprints', key] as const,
  sprint: (id: string) => ['sprint', id] as const,
  epics: (key: string) => ['epics', key] as const,
  notifications: ['notifications'] as const,
  members: (key: string) => ['members', key] as const,
  labels: (key: string) => ['labels', key] as const,
};
