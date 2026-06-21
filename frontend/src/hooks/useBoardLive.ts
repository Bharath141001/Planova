import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from './useSocket';
import { QUERY_KEYS } from '@/utils/constants';

/**
 * Invalidates board/issue queries when other users create, update, move, or
 * delete issues in the active project — keeping every viewer's board live.
 */
export function useBoardLiveUpdates(projectKey: string | undefined): void {
  const qc = useQueryClient();
  const refetch = () => {
    if (projectKey) qc.invalidateQueries({ queryKey: QUERY_KEYS.issues(projectKey) });
  };

  useSocketEvent('issue:created', refetch, [projectKey]);
  useSocketEvent('issue:updated', refetch, [projectKey]);
  useSocketEvent('issue:moved', refetch, [projectKey]);
  useSocketEvent('issue:deleted', refetch, [projectKey]);
  useSocketEvent('sprint:started', refetch, [projectKey]);
  useSocketEvent('sprint:completed', refetch, [projectKey]);
}
