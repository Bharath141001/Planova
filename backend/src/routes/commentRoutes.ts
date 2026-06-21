import { Router } from 'express';
import { commentController } from '../controllers/commentController';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

// Operations on an existing comment by id (issue-nested create/list live in issueRoutes).
const router = Router();
router.use(authenticate);

router.put('/:commentId', asyncHandler(commentController.update));
router.delete('/:commentId', asyncHandler(commentController.remove));
router.post('/:commentId/reactions', asyncHandler(commentController.react));

export default router;
