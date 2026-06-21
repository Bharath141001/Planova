import { Router } from 'express';
import { epicController } from '../controllers/epicController';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission } from '../middleware/permissionMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

// Update/delete an epic by id (list/create are project-nested in projectRoutes).
const router = Router();
router.use(authenticate);

router.put('/:epicId', requirePermission('epic:manage'), asyncHandler(epicController.update));
router.delete('/:epicId', requirePermission('epic:manage'), asyncHandler(epicController.remove));

export default router;
