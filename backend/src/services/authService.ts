import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import {
  signAccessToken,
  generateRefreshToken,
  refreshTokenExpiry,
  generateOtp,
} from '../utils/tokenHelper';
import { emailService } from './emailService';

const SALT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  role: string;
}

function toPublicUser(u: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  role: string;
}): PublicUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    timezone: u.timezone,
    role: u.role,
  };
}

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

async function issueTokens(user: PublicUser): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshTokenExpiry() },
  });
  return { accessToken, refreshToken, user };
}

export const authService = {
  async register(input: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }): Promise<AuthResult> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });
    if (existing) {
      throw AppError.conflict(
        existing.email === input.email ? 'Email already registered' : 'Username already taken'
      );
    }
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        displayName: input.displayName,
      },
    });
    return issueTokens(toPublicUser(user));
  },

  async login(emailOrUsername: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    });
    if (!user) throw AppError.unauthorized('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    return issueTokens(toPublicUser(user));
  },

  /** Rotates the refresh token: invalidates the old, issues a new pair. */
  async refresh(token: string): Promise<AuthResult> {
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => undefined);
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    return issueTokens(toPublicUser(stored.user));
  },

  async logout(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always behave the same to avoid leaking which emails exist.
    if (!user) return;

    const otp = generateOtp();
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({
      data: {
        email,
        otpHash: hashOtp(otp),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    await emailService.sendPasswordResetOtp(email, otp);
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const record = await prisma.passwordResetToken.findFirst({
      where: { email, otpHash: hashOtp(otp), expiresAt: { gt: new Date() } },
    });
    if (!record) throw AppError.unauthorized('Invalid or expired reset code');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { email }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { email } }),
      prisma.refreshToken.deleteMany({ where: { user: { email } } }),
    ]);
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.unauthorized('Account no longer exists');
    return toPublicUser(user);
  },
};

export { toPublicUser };
