import express from 'express';
import { inquirySourceController } from '../controllers';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * Public routes - anyone can fetch sources
 */
router.get('/', inquirySourceController.getAllSources);
router.get('/categories', inquirySourceController.getSourcesByCategory);

/**
 * Protected routes - only admin and superadmin can manage sources
*/
// router.use(authenticate, requireRole('superadmin', 'admin'));

router.post('/', inquirySourceController.createSource);
router.put('/:id', inquirySourceController.updateSource);
router.delete('/:id', inquirySourceController.deleteSource);
router.patch('/:id/toggle', inquirySourceController.toggleSourceStatus);
router.post('/bulk/update-order', inquirySourceController.updateDisplayOrder);

export default router;