import { Router } from 'express';
import { attachmentController } from '../controllers/attachmentController';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.delete('/:attachmentId', asyncHandler(attachmentController.remove));

export default router;
