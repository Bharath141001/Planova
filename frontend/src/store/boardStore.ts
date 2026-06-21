import { create } from 'zustand';
import type { IssueFilters } from '@/services/issueService';

export type Swimlane = 'none' | 'assignee' | 'epic';

interface BoardState {
  filters: IssueFilters;
  swimlane: Swimlane;
  collapsedColumns: string[];
  selectedIssueKeys: string[];
  setFilter: <K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) => void;
  clearFilters: () => void;
  setSwimlane: (swimlane: Swimlane) => void;
  toggleColumn: (status: string) => void;
  toggleSelected: (key: string) => void;
  clearSelected: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  filters: {},
  swimlane: 'none',
  collapsedColumns: [],
  selectedIssueKeys: [],
  setFilter: (key, value) =>
    set((s) => {
      const filters = { ...s.filters };
      if (value === undefined || value === '' || value === null) delete filters[key];
      else filters[key] = value;
      return { filters };
    }),
  clearFilters: () => set({ filters: {} }),
  setSwimlane: (swimlane) => set({ swimlane }),
  toggleColumn: (status) =>
    set((s) => ({
      collapsedColumns: s.collapsedColumns.includes(status)
        ? s.collapsedColumns.filter((c) => c !== status)
        : [...s.collapsedColumns, status],
    })),
  toggleSelected: (key) =>
    set((s) => ({
      selectedIssueKeys: s.selectedIssueKeys.includes(key)
        ? s.selectedIssueKeys.filter((k) => k !== key)
        : [...s.selectedIssueKeys, key],
    })),
  clearSelected: () => set({ selectedIssueKeys: [] }),
}));
