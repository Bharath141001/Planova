import { Request } from 'express';
import { ApiMeta } from './apiResponse';

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function getPagination(req: Request, defaultSize = 25, maxSize = 100): PaginationParams {
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const requested = parseInt((req.query.pageSize as string) ?? `${defaultSize}`, 10) || defaultSize;
  const pageSize = Math.min(Math.max(1, requested), maxSize);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildMeta(page: number, pageSize: number, total: number): ApiMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
