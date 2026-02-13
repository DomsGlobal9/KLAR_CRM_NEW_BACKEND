import express from 'express';
import { leadController } from '../controllers/lead.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * Public routes
 */
router.post('/capture', leadController.createQuickLead);

/**
 * Protected routes - require authentication and specific roles
 */
router.use(authenticate, requireRole('superadmin', 'admin', 'rm'));

router.post('/', leadController.createLead);
router.get('/',  leadController.getAllLeads);
router.get('/stats', leadController.getLeadStats);
router.get('/search', leadController.searchLeads);
router.get('/:id', leadController.getLeadById);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);
router.patch('/:id/stage', leadController.updateLeadStage);
router.patch('/:id/assign', leadController.assignLead);

export default router;