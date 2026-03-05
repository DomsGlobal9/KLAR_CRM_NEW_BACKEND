import { Router } from 'express';
import { teamLeadController } from '../controllers/teamLead.controller';
import { authenticate } from '../middleware'; 

const router = Router();

// Protect all Team Lead routes
router.use(authenticate);

/**
 * Get all RMs under a specific Team Lead
 * URL: GET /api/v1/team-lead/rms/:tlId
 */
router.get('/rms/tl/:tlId', teamLeadController.getRMsByTLId);

export default router;