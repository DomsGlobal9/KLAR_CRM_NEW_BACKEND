import { Router } from 'express';
import { travelerController } from '../controllers/traveler.controller';

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
router.put('/:id', travelerController.updateTraveler);

// Delete traveler by ID
router.delete('/:id', travelerController.deleteTraveler);

export default router;