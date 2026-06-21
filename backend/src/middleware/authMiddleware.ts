import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenHelper';
import { AppError } from '../utils/apiResponse';
import { prisma } from '../config/database';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Verifies the Bearer access token and attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

/** Restricts a route to global ADMIN users. */
export function requireGlobalAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    throw AppError.forbidden('Global admin access required');
  }
  next();
}

/** Loads the authenticated user's full record; throws if the account is gone. */
export async function loadCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized('Account no longer exists');
  return user;
}
