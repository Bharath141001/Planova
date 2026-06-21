import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse';

const handler = (_req: unknown, res: import('express').Response) =>
  sendError(res, 'Too many requests, please try again later', 429, 'RATE_LIMITED');

/** Strict limiter for auth endpoints (login, register, password reset). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** General API limiter applied to all routes. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
