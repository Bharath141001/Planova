import { useMemo } from 'react';
import { useSprints } from './useSprint';
import { useBoardIssues } from './useBoard';
import type { IssueFilters } from '@/services/issueService';
import type { IssueSummary } from '@/types/issue.types';
import type { Sprint } from '@/types/sprint.types';

export interface BacklogGroup {
  sprint: Sprint | null; // null = backlog
  issues: IssueSummary[];
  points: number;
}

/**
 * Combines sprints and issues into grouped backlog sections, ordered:
 * active sprint(s) → planned sprint(s) → backlog. Completed sprints are hidden.
 */
export function useBacklog(projectKey: string | undefined, filters: IssueFilters) {
  const sprintsQuery = useSprints(projectKey);
  const issuesQuery = useBoardIssues(projectKey, filters);

  const groups = useMemo<BacklogGroup[]>(() => {
    const sprints = (sprintsQuery.data ?? []).filter((s) => s.status !== 'COMPLETED');
    const issues = issuesQuery.data ?? [];

    const ordered = [...sprints].sort((a, b) => {
      const rank = (s: Sprint) => (s.status === 'ACTIVE' ? 0 : 1);
      return rank(a) - rank(b);
    });

    const points = (list: IssueSummary[]) => list.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

    const sprintGroups: BacklogGroup[] = ordered.map((sprint) => {
      const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
      return { sprint, issues: sprintIssues, points: points(sprintIssues) };
    });

    const backlogIssues = issues.filter((i) => !i.sprintId);
    sprintGroups.push({ sprint: null, issues: backlogIssues, points: points(backlogIssues) });

    return sprintGroups;
  }, [sprintsQuery.data, issuesQuery.data]);

  return {
    groups,
    isLoading: sprintsQuery.isLoading || issuesQuery.isLoading,
    isError: sprintsQuery.isError || issuesQuery.isError,
  };
}
