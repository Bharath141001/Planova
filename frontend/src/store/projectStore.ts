import { create } from 'zustand';
import type { Project } from '@/types/project.types';
import type { ProjectRole } from '@/types/common.types';

interface ProjectState {
  currentProject: Project | null;
  currentRole: ProjectRole | null;
  starred: string[];
  recentIssues: string[];
  setCurrentProject: (project: Project | null, currentUserId?: string) => void;
  toggleStar: (projectKey: string) => void;
  pushRecentIssue: (issueKey: string) => void;
}

const STAR_KEY = 'jc_starred_projects';
const loadStarred = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STAR_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  currentRole: null,
  starred: loadStarred(),
  recentIssues: [],
  setCurrentProject: (project, currentUserId) => {
    const role =
      project && currentUserId
        ? project.members.find((m) => m.userId === currentUserId)?.role ?? null
        : null;
    set({ currentProject: project, currentRole: role });
  },
  toggleStar: (projectKey) => {
    const next = get().starred.includes(projectKey)
      ? get().starred.filter((k) => k !== projectKey)
      : [...get().starred, projectKey];
    localStorage.setItem(STAR_KEY, JSON.stringify(next));
    set({ starred: next });
  },
  pushRecentIssue: (issueKey) =>
    set((s) => ({ recentIssues: [issueKey, ...s.recentIssues.filter((k) => k !== issueKey)].slice(0, 8) })),
}));
