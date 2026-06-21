import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { sendSuccess, AppError } from '../utils/apiResponse';
import { uploadFile } from '../config/s3';

const publicSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  timezone: true,
  role: true,
};

const profileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  timezone: z.string().max(60).optional(),
});

export const userController = {
  async search(req: Request, res: Response) {
    const q = (req.query.q as string | undefined)?.trim() ?? '';
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: 10,
    });
    sendSuccess(res, users);
  },

  async getById(req: Request, res: Response) {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: publicSelect });
    if (!user) throw AppError.notFound('User');
    sendSuccess(res, user);
  },

  async updateProfile(req: Request, res: Response) {
    const data = profileSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data, select: publicSelect });
    sendSuccess(res, user);
  },

  async uploadAvatar(req: Request, res: Response) {
    if (!req.file) throw new AppError('No file uploaded');
    const { fileUrl } = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: fileUrl },
      select: publicSelect,
    });
    sendSuccess(res, user);
  },
};
