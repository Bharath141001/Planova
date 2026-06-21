import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(notificationController.list));
router.put('/read-all', asyncHandler(notificationController.markAllRead));
router.put('/:id/read', asyncHandler(notificationController.markRead));

export default router;
