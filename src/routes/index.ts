import { Router } from 'express';
import emailRoutes from './email.routes';
// import userAuthRoutes from './user.routes';
import authRoutes from './auth.routes';
import rolesRoutes from './role.routes';

const router = Router();

/**
 * Base API routes
 */
router.use('/email', emailRoutes);
router.use('/role', rolesRoutes);
// router.use('/auth', userAuthRoutes);
router.use(authRoutes);

export default router;
