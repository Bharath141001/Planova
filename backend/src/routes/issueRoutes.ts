import { Router } from 'express';
import { issueController } from '../controllers/issueController';
import { commentController } from '../controllers/commentController';
import { attachmentController } from '../controllers/attachmentController';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireProjectMember } from '../middleware/permissionMiddleware';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

// Search & bulk must precede the :issueKey routes.
router.get('/search', asyncHandler(issueController.search));
router.post('/bulk', asyncHandler(issueController.bulk));

router.get('/:issueKey', requireProjectMember(), asyncHandler(issueController.get));
router.put('/:issueKey', requirePermission('issue:edit'), asyncHandler(issueController.update));
router.delete('/:issueKey', requirePermission('issue:delete'), asyncHandler(issueController.remove));
router.post('/:issueKey/clone', requirePermission('issue:create'), asyncHandler(issueController.clone));
router.put('/:issueKey/rank', requirePermission('issue:move'), asyncHandler(issueController.rank));
router.post('/:issueKey/watch', requireProjectMember(), asyncHandler(issueController.watch));
router.delete('/:issueKey/watch', requireProjectMember(), asyncHandler(issueController.unwatch));
router.get('/:issueKey/activity', requireProjectMember(), asyncHandler(issueController.activity));

// Links
router.post('/:issueKey/links', requirePermission('issue:edit'), asyncHandler(issueController.link));
router.delete('/:issueKey/links/:linkId', requirePermission('issue:edit'), asyncHandler(issueController.unlink));

// Worklog
router.post('/:issueKey/worklog', requirePermission('worklog:add'), asyncHandler(issueController.logWork));

// Comments (nested under issue)
router.get('/:issueKey/comments', requireProjectMember(), asyncHandler(commentController.list));
router.post('/:issueKey/comments', requirePermission('comment:create'), asyncHandler(commentController.create));

// Attachments (nested under issue)
router.post(
  '/:issueKey/attachments',
  requirePermission('attachment:upload'),
  upload.single('file'),
  asyncHandler(attachmentController.upload)
);

export default router;
