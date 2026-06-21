import jwt, { SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

/** Refresh tokens are opaque random strings persisted in the DB (rotation-friendly). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + env.jwt.refreshExpiresMs);
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
