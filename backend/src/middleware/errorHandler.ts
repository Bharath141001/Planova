import { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/apiResponse';
import { logger } from '../config/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.status, err.code, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', err.flatten());
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return sendError(res, `A record with this ${target} already exists`, 409, 'CONFLICT');
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record not found', 404, 'NOT_FOUND');
    }
    if (err.code === 'P2003') {
      return sendError(res, 'Related record does not exist', 400, 'FK_CONSTRAINT');
    }
  }

  logger.error(err instanceof Error ? err.stack ?? err.message : String(err));
  return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
};
