import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { issueService } from '@/services/issueService';
import { Button } from '@/components/ui/Button';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import styles from './IssueWatcher.module.scss';

interface IssueWatcherProps {
  issueKey: string;
  isWatching: boolean;
  watcherCount: number;
}

export function IssueWatcher({ issueKey, isWatching, watcherCount }: IssueWatcherProps) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => (isWatching ? issueService.unwatch(issueKey) : issueService.watch(issueKey)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issueKey) });
      toast.success(isWatching ? 'Stopped watching' : 'Watching this issue');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Button variant="outline" size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
      {isWatching ? <EyeOff size={16} /> : <Eye size={16} />}
      {isWatching ? 'Watching' : 'Watch'}
      <span className={styles.count}>{watcherCount}</span>
    </Button>
  );
}
