import { Router } from 'express';
import { travelPlanController } from '../controllers/travelplan.controller';
import { authenticate, requireRole } from '../middleware';

const router = Router();

router.post('/generate', travelPlanController.generateTravelPlan);

router.post('/test', travelPlanController.testTravelPlanGeneration);

router.use(authenticate, requireRole('superadmin', 'admin', 'rm', 'tl'));

// Routes for authenticated users
router.get('/generate/:leadId', travelPlanController.generateTravelPlanByLeadId);
router.post('/save/:leadId',  travelPlanController.saveTravelPlanToLead);
router.get('/:planId', travelPlanController.getTravelPlanById);

// Optional: Admin only routes
// router.delete('/:planId', authenticate, requireRole('superadmin', 'admin'), travelPlanController.deleteTravelPlan);

export default router;