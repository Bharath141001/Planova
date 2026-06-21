import { ActivityType, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/apiResponse';
import { activityService } from './activityService';
import { notificationService, extractMentions } from './notificationService';
import { emitToIssue } from '../config/socket';

const commentInclude = {
  author: { select: { id: true, displayName: true, avatarUrl: true, username: true } },
  reactions: { include: { user: { select: { id: true, displayName: true } } } },
} satisfies Prisma.CommentInclude;

export const commentService = {
  async list(issueKey: string) {
    const issue = await prisma.issue.findUnique({ where: { key: issueKey }, select: { id: true } });
    if (!issue) throw AppError.notFound('Issue');
    return prisma.comment.findMany({
      where: { issueId: issue.id, parentCommentId: null },
      include: { ...commentInclude, replies: { include: commentInclude, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async create(issueKey: string, authorId: string, body: string, parentCommentId?: string) {
    const issue = await prisma.issue.findUnique({
      where: { key: issueKey },
      select: { id: true, key: true, watchers: { select: { userId: true } } },
    });
    if (!issue) throw AppError.notFound('Issue');

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { issueId: issue.id, authorId, body, parentCommentId: parentCommentId ?? null },
        include: commentInclude,
      });
      // Author becomes a watcher; activity logged.
      await tx.issueWatcher.upsert({
        where: { issueId_userId: { issueId: issue.id, userId: authorId } },
        create: { issueId: issue.id, userId: authorId },
        update: {},
      });
      await activityService.log({ issueId: issue.id, actorId: authorId, type: ActivityType.COMMENTED }, tx);
      return created;
    });

    // Notify watchers and resolve @mentions.
    const watcherIds = issue.watchers.map((w) => w.userId);
    await notificationService.createMany(watcherIds, {
      type: NotificationType.COMMENT_ADDED,
      message: `commented on ${issue.key}`,
      issueId: issue.id,
      actorId: authorId,
    });

    const usernames = extractMentions(body);
    if (usernames.length) {
      const mentioned = await prisma.user.findMany({
        where: { username: { in: usernames } },
        select: { id: true },
      });
      await Promise.all(
        mentioned
          .filter((u) => u.id !== authorId)
          .map((u) => notificationService.notifyMention(u.id, authorId, issue.key, issue.id))
      );
    }

    emitToIssue(issue.key, 'comment:created', { issueKey: issue.key, comment });
    return comment;
  },

  async update(commentId: string, userId: string, body: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw AppError.notFound('Comment');
    if (comment.authorId !== userId) throw AppError.forbidden('You can only edit your own comments');

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { body, isEdited: true },
      include: commentInclude,
    });
    const issue = await prisma.issue.findUnique({ where: { id: comment.issueId }, select: { key: true } });
    if (issue) emitToIssue(issue.key, 'comment:updated', { commentId, body });
    return updated;
  },

  async remove(commentId: string, userId: string, projectRole?: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw AppError.notFound('Comment');
    const isPrivileged = projectRole === 'ADMIN' || projectRole === 'OWNER';
    if (comment.authorId !== userId && !isPrivileged) {
      throw AppError.forbidden('You can only delete your own comments');
    }
    await prisma.comment.delete({ where: { id: commentId } });
    const issue = await prisma.issue.findUnique({ where: { id: comment.issueId }, select: { key: true } });
    if (issue) emitToIssue(issue.key, 'comment:deleted', { commentId });
  },

  async toggleReaction(commentId: string, userId: string, emoji: string) {
    const existing = await prisma.reaction.findUnique({
      where: { commentId_userId_emoji: { commentId, userId, emoji } },
    });
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return { added: false };
    }
    await prisma.reaction.create({ data: { commentId, userId, emoji } });
    return { added: true };
  },
};
