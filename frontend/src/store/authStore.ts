import { create } from 'zustand';
import type { User } from '@/types/user.types';
import { setAccessToken } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setInitializing: (value: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isInitializing: false });
  },
  setUser: (user) => set({ user }),
  setInitializing: (value) => set({ isInitializing: value }),
  clear: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isInitializing: false });
  },
}));
