import { Response } from 'express';

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: ApiMeta
): Response<ApiSuccess<T>> {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function sendError(
  res: Response,
  message: string,
  status = 400,
  code = 'BAD_REQUEST',
  details?: unknown
): Response<ApiError> {
  return res.status(status).json({ success: false, error: { message, code, details } });
}

/**
 * Application-level error carrying an HTTP status and machine-readable code.
 * Thrown anywhere in services/controllers and handled by errorHandler.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }
}
