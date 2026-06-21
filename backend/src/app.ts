import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initSocket } from './config/socket';
import { localUploadDir } from './config/s3';

import { requestLogger } from './middleware/requestLogger';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import issueRoutes from './routes/issueRoutes';
import sprintRoutes from './routes/sprintRoutes';
import commentRoutes from './routes/commentRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import reportRoutes from './routes/reportRoutes';
import epicRoutes from './routes/epicRoutes';
import notificationRoutes from './routes/notificationRoutes';

import { startSprintAutoCloseJob } from './jobs/sprintAutoClose';
import { startNotificationDigestJob } from './jobs/notificationDigest';

export function createApp(): Application {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);

  // Serve locally-stored attachments (dev fallback when S3 is not configured).
  app.use('/uploads', express.static(localUploadDir));

  // Liveness: process is alive and can serve traffic.
  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.get('/health/live', (_req, res) => res.json({ success: true, data: { status: 'alive' } }));

  // Readiness: checks downstream dependencies before accepting traffic.
  app.get('/health/ready', async (_req, res) => {
    try {
      await (await import('./config/database')).prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, data: { status: 'ready', db: 'ok' } });
    } catch {
      res.status(503).json({ success: false, data: { status: 'not ready', db: 'unreachable' } });
    }
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/sprints', sprintRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/attachments', attachmentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/epics', epicRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function bootstrap(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);
  await connectDatabase();
  await connectRedis();

  const autoCloseTimer = startSprintAutoCloseJob();
  const digestTimer = startNotificationDigestJob();

  if (env.isProduction && !env.smtp.enabled) {
    logger.warn('SMTP is not configured — password-reset OTPs and email digests will be silently dropped in production. Set SMTP_HOST and SMTP_USER to enable email.');
  }

  server.listen(env.port, () => {
    logger.info(`🚀 API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    clearInterval(autoCloseTimer);
    clearInterval(digestTimer);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

// Only auto-start outside of tests.
if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error(`Fatal startup error: ${err instanceof Error ? err.stack : String(err)}`);
    process.exit(1);
  });
}
