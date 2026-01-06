import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { teamMemberController } from '../controllers/teamMember.controller';

const router = Router();
// router.use(authenticate, requireRole('superadmin', 'admin'));


/**
 * Send OTP to add a new team member
 */
router.post('/send-otp', teamMemberController.sendAddMemberOTP);

/**
 * Verify OTP and create a new team member
 */
router.post('/verify-otp-and-create', teamMemberController.verifyOTPAndCreateMember);

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

