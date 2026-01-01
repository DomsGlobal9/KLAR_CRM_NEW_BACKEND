import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware'; 

const router = Router();

/**
 * Apply authenticate middleware to all routes in this router
 */
router.use(authenticate);

/**
 * Update self user profile
 */
router.put('/me', userController.updateMe);

/**
 * Get self user profile
 */
router.get('/me', userController.getMe);

export default router;