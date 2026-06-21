import { Request, Response } from 'express';
import { ActivityType } from '@prisma/client';
import { prisma } from '../config/database';
import { uploadFile, deleteFile } from '../config/s3';
import { activityService } from '../services/activityService';
import { sendSuccess, AppError } from '../utils/apiResponse';
import { emitToIssue } from '../config/socket';

export const attachmentController = {
  async upload(req: Request, res: Response) {
    if (!req.file) throw new AppError('No file uploaded');
    const issue = await prisma.issue.findUnique({
      where: { key: req.params.issueKey },
      select: { id: true, key: true },
    });
    if (!issue) throw AppError.notFound('Issue');

    const stored = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const attachment = await prisma.attachment.create({
      data: {
        issueId: issue.id,
        uploadedById: req.user!.id,
        fileName: stored.fileName,
        fileUrl: stored.fileUrl,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
      },
    });
    await activityService.log({
      issueId: issue.id,
      actorId: req.user!.id,
      type: ActivityType.ATTACHMENT_ADDED,
      newValue: stored.fileName,
    });
    emitToIssue(issue.key, 'issue:updated', { issueKey: issue.key, changes: { attachment: true } });
    sendSuccess(res, attachment, 201);
  },

  async remove(req: Request, res: Response) {
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.attachmentId } });
    if (!attachment) throw AppError.notFound('Attachment');
    await deleteFile(attachment.fileUrl);
    await prisma.attachment.delete({ where: { id: attachment.id } });
    await activityService.log({
      issueId: attachment.issueId,
      actorId: req.user!.id,
      type: ActivityType.ATTACHMENT_REMOVED,
      oldValue: attachment.fileName,
    });
    sendSuccess(res, { message: 'Attachment removed' });
  },
};
