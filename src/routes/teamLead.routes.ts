import { Router } from 'express';
import { teamLeadController } from '../controllers/teamLead.controller';
import { authenticate, requireRole } from '../middleware'; 

const router = Router();

// Protect all Team Lead routes
router.use(authenticate, requireRole('superadmin', 'admin', 'rm', "tl"));

/**
 * Get all RMs under a specific Team Lead
 * URL: GET /api/v1/team-lead/rms/:tlId
 */
router.get('/rms/tl', teamLeadController.getRMsByTLId);

export default router;