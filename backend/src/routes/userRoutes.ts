import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/search', asyncHandler(userController.search));
router.put('/profile', asyncHandler(userController.updateProfile));
router.post('/avatar', upload.single('avatar'), asyncHandler(userController.uploadAvatar));
router.get('/:userId', asyncHandler(userController.getById));

export default router;
