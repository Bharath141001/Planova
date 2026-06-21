import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate } from '../middleware/authMiddleware';
import { requireProjectMember } from '../middleware/permissionMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/burndown/:sprintId', requireProjectMember(), asyncHandler(reportController.burndown));
router.get('/velocity/:projectKey', requireProjectMember(), asyncHandler(reportController.velocity));
router.get('/sprint/:sprintId', requireProjectMember(), asyncHandler(reportController.sprintReport));
router.get('/cumulative-flow/:projectKey', requireProjectMember(), asyncHandler(reportController.cumulativeFlow));
router.get('/epic/:epicId', requireProjectMember(), asyncHandler(reportController.epicReport));
router.get('/workload/:projectKey', requireProjectMember(), asyncHandler(reportController.workload));

export default router;
