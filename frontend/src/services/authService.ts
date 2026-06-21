import { api, unwrap } from './api';
import type { AuthResponse, LoginInput, RegisterInput, ResetPasswordInput } from '@/types/auth.types';
import type { User } from '@/types/user.types';

export const authService = {
  login: (input: LoginInput) => unwrap<AuthResponse>(api.post('/auth/login', input)),
  register: (input: RegisterInput) => unwrap<AuthResponse>(api.post('/auth/register', input)),
  logout: () => api.post('/auth/logout'),
  me: () => unwrap<{ user: User }>(api.get('/auth/me')).then((d) => d.user),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (input: ResetPasswordInput) => api.post('/auth/reset-password', input),
};
