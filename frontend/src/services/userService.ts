import { api, unwrap } from './api';
import type { User, UserMini } from '@/types/user.types';

export const userService = {
  search: (q: string) => unwrap<UserMini[]>(api.get('/users/search', { params: { q } })),
  getById: (userId: string) => unwrap<User>(api.get(`/users/${userId}`)),
  updateProfile: (data: { displayName?: string; timezone?: string }) =>
    unwrap<User>(api.put('/users/profile', data)),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return unwrap<User>(api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
};
