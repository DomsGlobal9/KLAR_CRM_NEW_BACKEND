import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * Apply authentication and authorization middleware
 */
router.use(authenticate, requireRole('SUPERADMIN', 'admin', 'relationship_manager', 'team_lead', 'OPERATION_TEAM'));

/**
 * Department routes
 */
router.post('/', departmentController.create);
router.get('/', departmentController.list);
router.get('/:id', departmentController.getById);
router.put('/:id', departmentController.update);
router.delete('/:id', departmentController.delete);

export default router;
