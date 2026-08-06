import { Router } from 'express';
import { travelPlanController } from '../controllers/travelplan.controller';
import { authenticate, requireRole } from '../middleware';

const router = Router();

router.post('/generate', travelPlanController.generateTravelPlan);

router.post('/test', travelPlanController.testTravelPlanGeneration);

router.use(authenticate, requireRole('SUPERADMIN', 'admin', 'relationship_manager', 'team_lead'));

// Routes for authenticated users
router.get('/generate/:leadId', travelPlanController.generateTravelPlanByLeadId);
router.post('/save/:leadId',  travelPlanController.saveTravelPlanToLead);
router.get('/:planId', travelPlanController.getTravelPlanById);

// Optional: Admin only routes
// router.delete('/:planId', authenticate, requireRole('SUPERADMIN', 'admin'), travelPlanController.deleteTravelPlan);

export default router;