import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { issueService } from '@/services/issueService';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { Issue, UpdateIssueInput, CreateIssueInput } from '@/types/issue.types';

export function useIssue(issueKey: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.issue(issueKey ?? ''),
    queryFn: () => issueService.getByKey(issueKey!),
    enabled: !!issueKey,
  });
}

export function useIssueComments(issueKey: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.comments(issueKey ?? ''),
    queryFn: () => issueService.listComments(issueKey!),
    enabled: !!issueKey,
  });
}

export function useIssueActivity(issueKey: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.activity(issueKey ?? ''),
    queryFn: () => issueService.activity(issueKey!),
    enabled: !!issueKey,
  });
}

export function useUpdateIssue(issueKey: string, projectKey?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateIssueInput) => issueService.update(issueKey, data),
    onMutate: async (data) => {
      const queryKey = QUERY_KEYS.issue(issueKey);
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<Issue>(queryKey);
      if (previous) qc.setQueryData<Issue>(queryKey, { ...previous, ...data } as Issue);
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(QUERY_KEYS.issue(issueKey), ctx.previous);
      toast.error(getErrorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issueKey) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activity(issueKey) });
      if (projectKey) qc.invalidateQueries({ queryKey: QUERY_KEYS.issues(projectKey) });
    },
  });
}

export function useCreateIssue(projectKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) => issueService.create(projectKey, input),
    onSuccess: (issue) => {
      toast.success(`Created ${issue.key}`);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.issues(projectKey) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sprints(projectKey) });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteIssue(projectKey: string) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (issueKey: string) => issueService.remove(issueKey),
    onSuccess: () => {
      toast.success('Issue deleted');
      qc.invalidateQueries({ queryKey: QUERY_KEYS.issues(projectKey) });
      navigate(`/projects/${projectKey}/board`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useCommentMutations(issueKey: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.comments(issueKey) });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.issue(issueKey) });
  };

  const add = useMutation({
    mutationFn: ({ body, parentCommentId }: { body: string; parentCommentId?: string }) =>
      issueService.addComment(issueKey, body, parentCommentId),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const update = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      issueService.updateComment(commentId, body),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (commentId: string) => issueService.deleteComment(commentId),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const react = useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) =>
      issueService.reactComment(commentId, emoji),
    onSuccess: invalidate,
  });

  return { add, update, remove, react };
}
