import { Router } from 'express';
import { sprintController } from '../controllers/sprintController';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireProjectMember } from '../middleware/permissionMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/:sprintId', requireProjectMember(), asyncHandler(sprintController.get));
router.put('/:sprintId', requirePermission('sprint:edit'), asyncHandler(sprintController.update));
router.delete('/:sprintId', requirePermission('sprint:delete'), asyncHandler(sprintController.remove));
router.post('/:sprintId/start', requirePermission('sprint:start'), asyncHandler(sprintController.start));
router.post('/:sprintId/complete', requirePermission('sprint:complete'), asyncHandler(sprintController.complete));

export default router;
