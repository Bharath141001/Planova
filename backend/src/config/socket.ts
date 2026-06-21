import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from './logger';

export interface AuthedSocket extends Socket {
  userId?: string;
}

interface AccessTokenPayload {
  sub: string;
}

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use((socket: AuthedSocket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.replace('Bearer ', '') as string | undefined);

    if (!token) {
      return next(new Error('Unauthorized: missing token'));
    }
    try {
      const payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    logger.debug(`Socket connected: ${socket.id} (user ${socket.userId})`);

    // Each user joins a private room for direct notifications.
    if (socket.userId) socket.join(`user:${socket.userId}`);

    // Track rooms joined so we can explicitly leave them on disconnect.
    const joinedRooms = new Set<string>();

    socket.on('join:project', (projectId: string) => {
      const room = `project:${projectId}`;
      socket.join(room);
      joinedRooms.add(room);
    });
    socket.on('leave:project', (projectId: string) => {
      const room = `project:${projectId}`;
      socket.leave(room);
      joinedRooms.delete(room);
    });
    socket.on('join:issue', (issueKey: string) => {
      const room = `issue:${issueKey}`;
      socket.join(room);
      joinedRooms.add(room);
    });
    socket.on('leave:issue', (issueKey: string) => {
      const room = `issue:${issueKey}`;
      socket.leave(room);
      joinedRooms.delete(room);
    });

    socket.on('user:typing', (payload: { issueKey: string; user: unknown }) => {
      socket.to(`issue:${payload.issueKey}`).emit('user:typing', payload);
    });

    socket.on('disconnect', () => {
      // Explicitly leave all tracked rooms to free server-side room membership immediately.
      for (const room of joinedRooms) socket.leave(room);
      joinedRooms.clear();
      logger.debug(`Socket disconnected: ${socket.id} (user ${socket.userId})`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

/** Emit to all clients watching a project board. */
export function emitToProject(projectId: string, event: string, payload: unknown): void {
  io?.to(`project:${projectId}`).emit(event, payload);
}

/** Emit to all clients viewing a specific issue. */
export function emitToIssue(issueKey: string, event: string, payload: unknown): void {
  io?.to(`issue:${issueKey}`).emit(event, payload);
}

/** Emit a notification to a single user across all their tabs. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
