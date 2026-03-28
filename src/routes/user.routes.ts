import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware'; 
import { upload } from '../middleware/upload.middleware';

const router = Router();


/**
 * Apply authenticate middleware to all routes in this router
 */
router.use(authenticate);

/**
 * Get self user profile
 */
router.get('/me', userController.getMe);

/**
 * Update self user profile
 */
router.put('/me', authenticate, upload.single('image'), userController.updateMe);

export default router;