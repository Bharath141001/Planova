import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sprintService } from '@/services/sprintService';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { CreateSprintInput, StartSprintInput, CompleteSprintInput } from '@/types/sprint.types';

export function useSprints(projectKey: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.sprints(projectKey ?? ''),
    queryFn: () => sprintService.listForProject(projectKey!),
    enabled: !!projectKey,
  });
}

export function useSprint(sprintId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.sprint(sprintId ?? ''),
    queryFn: () => sprintService.getById(sprintId!),
    enabled: !!sprintId,
  });
}

function invalidateProject(qc: ReturnType<typeof useQueryClient>, projectKey: string) {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.sprints(projectKey) });
  qc.invalidateQueries({ queryKey: QUERY_KEYS.issues(projectKey) });
}

export function useSprintMutations(projectKey: string) {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: CreateSprintInput) => sprintService.create(projectKey, input),
    onSuccess: () => {
      invalidateProject(qc, projectKey);
      toast.success('Sprint created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const start = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: StartSprintInput }) =>
      sprintService.start(sprintId, input),
    onSuccess: () => {
      invalidateProject(qc, projectKey);
      toast.success('Sprint started 🚀');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const complete = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: CompleteSprintInput }) =>
      sprintService.complete(sprintId, input),
    onSuccess: (res) => {
      invalidateProject(qc, projectKey);
      toast.success(`Sprint completed — velocity ${res.summary.velocity}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: Partial<CreateSprintInput> }) =>
      sprintService.update(sprintId, input),
    onSuccess: () => invalidateProject(qc, projectKey),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (sprintId: string) => sprintService.remove(sprintId),
    onSuccess: () => {
      invalidateProject(qc, projectKey);
      toast.success('Sprint deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return { create, start, complete, update, remove };
}
