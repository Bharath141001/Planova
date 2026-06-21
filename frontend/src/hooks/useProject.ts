import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectService } from '@/services/projectService';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage } from '@/services/api';
import type { CreateProjectInput } from '@/types/project.types';

export function useProjects(search?: string) {
  return useQuery({ queryKey: [...QUERY_KEYS.projects, search], queryFn: () => projectService.list(search) });
}

/** Loads a project by key and syncs it (with the user's role) into the store. */
export function useProject(projectKey: string | undefined) {
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery({
    queryKey: QUERY_KEYS.project(projectKey ?? ''),
    queryFn: () => projectService.getByKey(projectKey!),
    enabled: !!projectKey,
  });

  useEffect(() => {
    if (query.data) setCurrentProject(query.data, userId);
  }, [query.data, userId, setCurrentProject]);

  return query;
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      toast.success('Project created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useProjectMembers(projectKey: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.members(projectKey ?? ''),
    queryFn: () => projectService.listMembers(projectKey!),
    enabled: !!projectKey,
  });
}

export function useEpics(projectKey: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.epics(projectKey ?? ''),
    queryFn: () => projectService.listEpics(projectKey!),
    enabled: !!projectKey,
  });
}

export function useCreateEpic(projectKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => projectService.createEpic(projectKey, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.epics(projectKey) }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useLabels(projectKey: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.labels(projectKey ?? ''),
    queryFn: () => projectService.listLabels(projectKey!),
    enabled: !!projectKey,
  });
}
