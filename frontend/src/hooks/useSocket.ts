import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

/** Lazily creates a single shared socket connection authenticated with the JWT. */
export function getSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) return null;
  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: true, transports: ['websocket'] });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

/** Subscribes to a socket event for the component's lifetime. */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
  deps: unknown[] = []
): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!isAuthenticated) return;
    const s = getSocket();
    if (!s) return;
    const cb = (payload: T) => handlerRef.current(payload);
    s.on(event, cb);
    return () => {
      s.off(event, cb);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isAuthenticated, ...deps]);
}

/** Joins/leaves a project room while mounted. */
export function useProjectRoom(projectId: string | undefined): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!projectId || !isAuthenticated) return;
    const s = getSocket();
    if (!s) return;
    s.emit('join:project', projectId);
    return () => {
      s.emit('leave:project', projectId);
    };
  }, [projectId, isAuthenticated]);
}

/** Joins/leaves an issue room while mounted. */
export function useIssueRoom(issueKey: string | undefined): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!issueKey || !isAuthenticated) return;
    const s = getSocket();
    if (!s) return;
    s.emit('join:issue', issueKey);
    return () => {
      s.emit('leave:issue', issueKey);
    };
  }, [issueKey, isAuthenticated]);
}
