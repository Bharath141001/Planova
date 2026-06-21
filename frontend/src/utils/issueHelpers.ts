import { ISSUE_TYPES, PRIORITIES } from './constants';
import type { IssueType, IssuePriority } from '@/types/common.types';

export function issueTypeMeta(type: IssueType) {
  return ISSUE_TYPES.find((t) => t.value === type) ?? ISSUE_TYPES[1];
}

export function priorityMeta(priority: IssuePriority) {
  return PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[2];
}

export function isDoneStatus(status: string): boolean {
  return /done|complete|closed|resolved/i.test(status);
}

const PRIORITY_RANK: Record<IssuePriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

export function comparePriority(a: IssuePriority, b: IssuePriority): number {
  return PRIORITY_RANK[a] - PRIORITY_RANK[b];
}

/** Strips HTML tags to a plain-text preview (for cards / search results). */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
