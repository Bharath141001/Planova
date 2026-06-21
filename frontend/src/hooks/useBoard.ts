import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { issueService, type IssueFilters } from '@/services/issueService';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { IssueSummary, RankIssueInput } from '@/types/issue.types';

export function useBoardIssues(projectKey: string | undefined, filters: IssueFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.issues(projectKey ?? '', filters),
    queryFn: () => issueService.listForProject(projectKey!, filters),
    enabled: !!projectKey,
  });
}

/**
 * Optimistically reorders/moves an issue on the board. Snapshots the cache,
 * applies the change immediately, and rolls back on error.
 */
export function useRankIssue(projectKey: string, filters: IssueFilters) {
  const qc = useQueryClient();
  const key = QUERY_KEYS.issues(projectKey, filters);

  return useMutation({
    mutationFn: ({ issueKey, payload }: { issueKey: string; payload: RankIssueInput }) =>
      issueService.rank(issueKey, payload),
    onMutate: async ({ issueKey, payload }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<IssueSummary[]>(key);
      if (previous) {
        qc.setQueryData<IssueSummary[]>(
          key,
          previous.map((i) =>
            i.key === issueKey
              ? { ...i, status: payload.status ?? i.status, sprintId: payload.sprintId ?? i.sprintId }
              : i
          )
        );
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(getErrorMessage(err));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.issues(projectKey) }),
  });
}

export function useBulkUpdate(projectKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keys, data }: { keys: string[]; data: Parameters<typeof issueService.bulk>[1] }) =>
      issueService.bulk(keys, data),
    onSuccess: (res) => {
      toast.success(`Updated ${res.updated} issue(s)`);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.issues(projectKey) });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
