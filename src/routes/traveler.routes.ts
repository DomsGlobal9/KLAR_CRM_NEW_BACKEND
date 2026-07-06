import { Router } from 'express';
import { travelerController } from '../controllers/traveler.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Create new traveler
router.post('/', travelerController.createTraveler);

// Get all travelers (with pagination)
router.get('/', travelerController.getAllTravelers);

// Search travelers
router.get('/search', travelerController.searchTravelers);

// Get traveler by ID
router.get('/:id', travelerController.getTravelerById);

// Update traveler by ID
router.patch('/:id', travelerController.updateTraveler);

// Delete traveler by ID
router.delete('/:id', authenticate, requireRole('superadmin', 'admin'), travelerController.deleteTraveler);

router.post('/filter', travelerController.filterAndSortTravelers);

router.post('/bulk', travelerController.bulkCreateTravelers);

export default router;