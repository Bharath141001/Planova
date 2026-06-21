import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { sendSuccess } from '../utils/apiResponse';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ('none' as const) : ('lax' as const),
  maxAge: env.jwt.refreshExpiresMs,
  path: '/',
};

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(80),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8),
});

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.register(input);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    sendSuccess(res, { accessToken, user }, 201);
  },

  async login(req: Request, res: Response) {
    const { emailOrUsername, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(emailOrUsername, password);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    sendSuccess(res, { accessToken, user });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, error: { message: 'No refresh token', code: 'UNAUTHORIZED' } });
      return;
    }
    const { accessToken, refreshToken, user } = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    sendSuccess(res, { accessToken, user });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    sendSuccess(res, { message: 'Logged out' });
  },

  async forgotPassword(req: Request, res: Response) {
    const { email } = forgotSchema.parse(req.body);
    await authService.forgotPassword(email);
    sendSuccess(res, { message: 'If that email exists, a reset code has been sent' });
  },

  async resetPassword(req: Request, res: Response) {
    const { email, otp, password } = resetSchema.parse(req.body);
    await authService.resetPassword(email, otp, password);
    sendSuccess(res, { message: 'Password reset successful' });
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id);
    sendSuccess(res, { user });
  },
};
