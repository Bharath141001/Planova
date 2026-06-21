import { Request, Response } from 'express';
import { z } from 'zod';
import { commentService } from '../services/commentService';
import { sendSuccess } from '../utils/apiResponse';

const createSchema = z.object({
  body: z.string().min(1).max(10000),
  parentCommentId: z.string().optional(),
});

const updateSchema = z.object({ body: z.string().min(1).max(10000) });
const reactionSchema = z.object({ emoji: z.string().min(1).max(20) });

export const commentController = {
  async list(req: Request, res: Response) {
    const comments = await commentService.list(req.params.issueKey);
    sendSuccess(res, comments);
  },

  async create(req: Request, res: Response) {
    const { body, parentCommentId } = createSchema.parse(req.body);
    const comment = await commentService.create(req.params.issueKey, req.user!.id, body, parentCommentId);
    sendSuccess(res, comment, 201);
  },

  async update(req: Request, res: Response) {
    const { body } = updateSchema.parse(req.body);
    const comment = await commentService.update(req.params.commentId, req.user!.id, body);
    sendSuccess(res, comment);
  },

  async remove(req: Request, res: Response) {
    await commentService.remove(req.params.commentId, req.user!.id, req.projectRole);
    sendSuccess(res, { message: 'Comment deleted' });
  },

  async react(req: Request, res: Response) {
    const { emoji } = reactionSchema.parse(req.body);
    const result = await commentService.toggleReaction(req.params.commentId, req.user!.id, emoji);
    sendSuccess(res, result);
  },
};
