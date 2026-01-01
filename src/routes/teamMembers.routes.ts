import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { teamMemberController } from '../controllers/teamMember.controller';

const router = Router();
router.use(authenticate, requireRole('superadmin', 'admin'));


/**
 * Create a new team member
 */
router.post('/', teamMemberController.addMember);

/** 
 * Get team members
 */
router.get('/', teamMemberController.getAll);

/**
 * Get team members by team ID
 */
router.get('/team/:teamId', teamMemberController.getByTeam);

/**
 * Get unassigned team members
 */
router.get('/unassigned', teamMemberController.getUnassigned);

/**
 * Update a team member
 */
router.put('/:memberId', teamMemberController.update);

/**
 * Remove a team member
 */
router.delete('/:memberId', teamMemberController.remove);

export default router;

