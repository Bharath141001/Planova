import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody, ApiSuccess } from '@/types/common.types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

// In-memory access token. Refresh tokens live in an httpOnly cookie, so we
// never persist the access token beyond the tab's lifetime here.
let accessToken: string | null = null;
const TOKEN_KEY = 'jc_access_token';

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  accessToken = localStorage.getItem(TOKEN_KEY);
  return accessToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Refresh-on-401 with request queueing ──────────────────────
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null): void {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

let onAuthFailure: (() => void) | null = null;
export function registerAuthFailureHandler(fn: () => void): void {
  onAuthFailure = fn;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else reject(error);
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post<ApiSuccess<{ accessToken: string }>>(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        flushQueue(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        flushQueue(null);
        setAccessToken(null);
        onAuthFailure?.();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Unwraps the standard { success, data } envelope. */
export function unwrap<T>(promise: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  return promise.then((res) => res.data.data);
}

/** Extracts a human-readable message from an axios error. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as ApiErrorBody | undefined)?.error?.message ??
      error.message ??
      'Request failed'
    );
  }
  return error instanceof Error ? error.message : 'Unexpected error';
}
