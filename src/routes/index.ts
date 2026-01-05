import { Router } from 'express';
import emailRoutes from './email.routes';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import rolesRoutes from './role.routes';
import teamRoutes from './team.route';
import teamMemberRoutes from './teamMembers.routes';
import leadRoutes from './lead.routes';

const router = Router();

/**
 * Base API routes
 */
router.use('/email', emailRoutes);
router.use('/role', rolesRoutes);
router.use('/user', userRoutes);
router.use('/team', teamRoutes);
router.use('/team-member', teamMemberRoutes);
router.use('/lead', leadRoutes);
router.use(authRoutes);

export default router;
