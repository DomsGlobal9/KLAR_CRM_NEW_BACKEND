import { Router } from 'express';
import emailRoutes from './email.routes';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import rolesRoutes from './role.routes';
import teamRoutes from './team.route';
import teamMemberRoutes from './teamMembers.routes';
import leadRoutes from './lead.routes';
import stageRoutes from './stage.routes';
import invoiceRoutes from './invoice.routes';
import quoteRoutes from './quote.routes';

const router = Router();

/**
 * Base API routes
 */
router.use('/email', emailRoutes);
router.use('/role', rolesRoutes);
router.use('/user', userRoutes);
router.use('/team', teamRoutes);
router.use('/team-member', teamMemberRoutes);
router.use('/stage', stageRoutes);
router.use('/lead', leadRoutes);
router.use(authRoutes);
router.use('/invoice', invoiceRoutes);
router.use('/quote', quoteRoutes);

export default router;
