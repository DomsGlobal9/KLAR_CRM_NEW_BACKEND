import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * Apply authenticate middleware to all routes in this router
 */
// router.use(authenticate);

/**
 * Team create route
 */
router.post('/', teamController.create);

/**
 * Team list route
 */
router.get('/', teamController.list);

/**
 * Team update route
 */
router.put('/:id', teamController.update);

/**
 * Team delete route
 */
router.delete('/:id', teamController.delete);

export default router;
