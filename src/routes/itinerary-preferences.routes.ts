import { Router } from 'express';
import { itineraryPreferencesController } from '../controllers/itinerary-preferences.controller';

const router = Router();

/* =======================
   STATIC ROUTES FIRST
   ======================= */

router.post('/', itineraryPreferencesController.savePreferences);
router.post('/upsert', itineraryPreferencesController.saveOrUpdatePreferences);
router.post('/validate', itineraryPreferencesController.validatePreferences);
router.post('/by-ids', itineraryPreferencesController.getPreferencesByIds);

// ADMIN / ANALYTICS
router.get('/all-itineraries', itineraryPreferencesController.getAllItineraries);
router.get('/summary', itineraryPreferencesController.getAllItinerariesSummary);
router.get('/recent', itineraryPreferencesController.getRecentItineraries);
router.get('/admin/by-date-range', itineraryPreferencesController.getItinerariesByDateRange);

// BY PREFERENCE ID (STATIC PREFIX)
router.get('/flight/:id', itineraryPreferencesController.getFlightPreferenceById);
router.get('/hotel/:id', itineraryPreferencesController.getHotelPreferenceById);
router.get('/visa/:id', itineraryPreferencesController.getVisaPreferenceById);
router.get('/summary/:id', itineraryPreferencesController.getUserPreferencesSummaryById);
router.get('/preference/:id', itineraryPreferencesController.getPreferenceById);
router.get('/all-related/:id', itineraryPreferencesController.getAllRelatedDetailsById);

/* =======================
   DYNAMIC ITINERARY ID ROUTES LAST
   ======================= */

router.get('/:itineraryId/check', itineraryPreferencesController.checkPreferencesExist);
router.get('/:itineraryId/summary', itineraryPreferencesController.getPreferencesWithSummary);
router.get('/:itineraryId/formatted', itineraryPreferencesController.getFormattedPreferences);
router.get('/:itineraryId', itineraryPreferencesController.getPreferences);
router.put('/:itineraryId', itineraryPreferencesController.updatePreferences);
router.delete('/:itineraryId', itineraryPreferencesController.deletePreferences);

export default router;
