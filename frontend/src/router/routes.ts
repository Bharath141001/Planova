/** Centralized route path builders. */
export const routes = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  dashboard: '/',
  projects: '/projects',
  projectCreate: '/projects/new',
  board: (key: string) => `/projects/${key}/board`,
  backlog: (key: string) => `/projects/${key}/backlog`,
  roadmap: (key: string) => `/projects/${key}/roadmap`,
  reports: (key: string) => `/projects/${key}/reports`,
  settings: (key: string) => `/projects/${key}/settings`,
  issue: (key: string) => `/issues/${key}`,
  profile: '/profile',
};
