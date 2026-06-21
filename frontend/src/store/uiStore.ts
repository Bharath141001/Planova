import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UiState {
  sidebarCollapsed: boolean;
  theme: Theme;
  createIssueOpen: boolean;
  createIssueDefaults: { sprintId?: string | null; status?: string; type?: string } | null;
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  openCreateIssue: (defaults?: UiState['createIssueDefaults']) => void;
  closeCreateIssue: () => void;
  setCommandPalette: (open: boolean) => void;
  setShortcuts: (open: boolean) => void;
}

const THEME_KEY = 'jc_theme';
function initialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

const startTheme = initialTheme();
applyTheme(startTheme);

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  theme: startTheme,
  createIssueOpen: false,
  createIssueDefaults: null,
  commandPaletteOpen: false,
  shortcutsOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
  openCreateIssue: (defaults) => set({ createIssueOpen: true, createIssueDefaults: defaults ?? null }),
  closeCreateIssue: () => set({ createIssueOpen: false, createIssueDefaults: null }),
  setCommandPalette: (open) => set({ commandPaletteOpen: open }),
  setShortcuts: (open) => set({ shortcutsOpen: open }),
}));
