import express from 'express';
import { itineraryController } from '../controllers/itinerary.controller';

const router = express.Router();

// Health check
router.get('/health', itineraryController.healthCheck);

// ============ CRUD Routes ============

/**
 * Create new itinerary
 * POST /api/itineraries
 */
router.post('/', itineraryController.createItinerary);

/**
 * Create itinerary from frontend data
 * POST /api/itineraries/from-frontend
 */
router.post('/from-frontend', itineraryController.createItineraryFromFrontend);

/**
 * Get all itineraries with filters
 * GET /api/itineraries
 */
router.get('/', itineraryController.getAllItineraries);

/**
 * Get itinerary by ID
 * GET /api/itineraries/:id
 */
router.get('/:id', itineraryController.getItineraryById);

/**
 * Get itinerary by itinerary number
 * GET /api/itineraries/number/:itineraryNumber
 */
router.get('/number/:itineraryNumber', itineraryController.getItineraryByNumber);

/**
 * Update itinerary
 * PUT /api/itineraries/:id
 */
router.put('/:id', itineraryController.updateItinerary);

/**
 * Delete itinerary (soft delete)
 * DELETE /api/itineraries/:id
 */
router.delete('/:id', itineraryController.deleteItinerary);

// ============ Service Management Routes ============

/**
 * Add service to itinerary
 * POST /api/itineraries/:itineraryId/services
 */
router.post('/:itineraryId/services', itineraryController.addServiceToItinerary);

/**
 * Remove service from itinerary
 * DELETE /api/itineraries/:itineraryId/services/:itineraryServiceId
 */
router.delete('/:itineraryId/services/:itineraryServiceId', itineraryController.removeServiceFromItinerary);

/**
 * Update itinerary service
 * PUT /api/itineraries/services/:itineraryServiceId
 */
router.put('/services/:itineraryServiceId', itineraryController.updateItineraryService);

/**
 * Update itinerary option
 * PUT /api/itineraries/options/:optionId
 */
router.put('/options/:optionId', itineraryController.updateItineraryOption);

/**
 * Remove option from itinerary
 * DELETE /api/itineraries/options/:optionId
 */
router.delete('/options/:optionId', itineraryController.removeOptionFromItinerary);

// ============ Helper Routes ============

/**
 * Change itinerary status
 * PATCH /api/itineraries/:id/status
 */
router.patch('/:id/status', itineraryController.changeItineraryStatus);

/**
 * Update itinerary total price
 * PATCH /api/itineraries/:id/update-total-price
 */
router.patch('/:id/update-total-price', itineraryController.updateItineraryTotalPrice);

/**
 * Get itinerary statistics
 * GET /api/itineraries/statistics
 */
router.get('/statistics/overview', itineraryController.getItineraryStatistics);

/**
 * Search itineraries
 * GET /api/itineraries/search
 */
router.get('/search/quick', itineraryController.searchItineraries);

export default router;