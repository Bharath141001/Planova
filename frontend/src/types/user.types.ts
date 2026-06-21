import { GlobalRole } from './common.types';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  role: GlobalRole;
}

export interface UserMini {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  username?: string;
}
