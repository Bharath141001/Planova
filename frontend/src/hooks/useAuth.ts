import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken, registerAuthFailureHandler } from '@/services/api';
import { getErrorMessage } from '@/services/api';
import type { LoginInput, RegisterInput } from '@/types/auth.types';

/** Bootstraps the session on app load using the stored access token / refresh cookie. */
export function useInitAuth(): { isInitializing: boolean } {
  const { setUser, clear, setInitializing, isInitializing } = useAuthStore();

  useEffect(() => {
    registerAuthFailureHandler(() => clear());
    let cancelled = false;
    (async () => {
      if (!getAccessToken()) {
        // Try a silent refresh in case only the httpOnly cookie exists.
        try {
          const me = await authService.me();
          if (!cancelled) useAuthStore.getState().setUser(me);
          if (!cancelled) useAuthStore.setState({ isAuthenticated: true });
        } catch {
          /* not logged in */
        } finally {
          if (!cancelled) setInitializing(false);
        }
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) {
          setUser(me);
          useAuthStore.setState({ isAuthenticated: true });
        }
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isInitializing };
}

export function useAuth() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAuthenticated, setAuth, clear } = useAuthStore();

  const login = useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (data) => {
      qc.clear();
      setAuth(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.displayName}`);
      navigate('/');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const register = useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: (data) => {
      qc.clear();
      setAuth(data.user, data.accessToken);
      toast.success('Account created');
      navigate('/');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const logout = async () => {
    await authService.logout().catch(() => undefined);
    qc.clear();
    clear();
    navigate('/login');
  };

  return { user, isAuthenticated, login, register, logout };
}
