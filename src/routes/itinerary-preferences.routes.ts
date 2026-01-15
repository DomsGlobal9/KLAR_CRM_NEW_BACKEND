import { Router } from 'express';
import { itineraryPreferencesController } from '../controllers/itinerary-preferences.controller';

const router = Router();

// Existing routes
router.post('/', itineraryPreferencesController.savePreferences);
router.get('/:itineraryId', itineraryPreferencesController.getPreferences);
router.post('/upsert', itineraryPreferencesController.saveOrUpdatePreferences);
router.put('/:itineraryId', itineraryPreferencesController.updatePreferences);
router.delete('/:itineraryId', itineraryPreferencesController.deletePreferences);
router.get('/:itineraryId/check', itineraryPreferencesController.checkPreferencesExist);

// NEW ENHANCED ROUTES WITH HELPER FUNCTIONS

/**
 * @route   GET /api/itinerary-preferences/:itineraryId/summary
 * @desc    Get preferences with human-readable summary
 * @access  Public/Private
 */
router.get('/:itineraryId/summary', itineraryPreferencesController.getPreferencesWithSummary);

/**
 * @route   POST /api/itinerary-preferences/validate
 * @desc    Validate form data without saving
 * @access  Public/Private
 */
router.post('/validate', itineraryPreferencesController.validatePreferences);

/**
 * @route   GET /api/itinerary-preferences/:itineraryId/formatted
 * @desc    Get preferences formatted for display
 * @access  Public/Private
 */
router.get('/:itineraryId/formatted', itineraryPreferencesController.getFormattedPreferences);

// NEW ROUTES (by individual preference ID)

/**
 * @route   GET /api/itinerary-preferences/flight/:id
 * @desc    Get flight preference by ID
 * @access  Public/Private
 */
router.get('/flight/:id', itineraryPreferencesController.getFlightPreferenceById);

/**
 * @route   GET /api/itinerary-preferences/hotel/:id
 * @desc    Get hotel preference by ID
 * @access  Public/Private
 */
router.get('/hotel/:id', itineraryPreferencesController.getHotelPreferenceById);

/**
 * @route   GET /api/itinerary-preferences/visa/:id
 * @desc    Get visa preference by IDhotel
 * @access  Public/Private
 */
router.get('/visa/:id', itineraryPreferencesController.getVisaPreferenceById);

/**
 * @route   GET /api/itinerary-preferences/summary/:id
 * @desc    Get user preferences summary by ID
 * @access  Public/Private
 */
router.get('/summary/:id', itineraryPreferencesController.getUserPreferencesSummaryById);

/**
 * @route   GET /api/itinerary-preferences/preference/:id
 * @desc    Get any preference by ID (auto-detect type)
 * @access  Public/Private
 */
router.get('/preference/:id', itineraryPreferencesController.getPreferenceById);

/**
 * @route   POST /api/itinerary-preferences/by-ids
 * @desc    Get multiple preferences by their IDs
 * @access  Public/Private
 */
router.post('/by-ids', itineraryPreferencesController.getPreferencesByIds);


/**
 * @route   GET /api/itinerary-preferences/all-related/:id
 * @desc    Get all related details from database by ID only (auto-detects type)
 * @access  Public/Private
 */
router.get('/all-related/:id', itineraryPreferencesController.getAllRelatedDetailsById);



/**
 * @route   GET /api/itinerary-preferences/admin/all-itineraries
 * @desc    Get all itineraries with preferences (admin/analytics endpoint)
 * @access  Private (Admin only)
 */
router.get('/all-itineraries', itineraryPreferencesController.getAllItineraries);

/**
 * @route   GET /api/itinerary-preferences/admin/summary
 * @desc    Get summary statistics of all itineraries
 * @access  Private (Admin only)
 */
router.get('/summary', itineraryPreferencesController.getAllItinerariesSummary);

/**
 * @route   GET /api/itinerary-preferences/admin/recent
 * @desc    Get recent itineraries (paginated)
 * @access  Private (Admin only)
 */
router.get('/recent', itineraryPreferencesController.getRecentItineraries);

/**
 * @route   GET /api/itinerary-preferences/admin/by-date-range
 * @desc    Get itineraries within a date range
 * @access  Private (Admin only)
 */
router.get('/admin/by-date-range', itineraryPreferencesController.getItinerariesByDateRange);





export default router;