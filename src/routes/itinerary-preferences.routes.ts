import { Router } from 'express';
import { itineraryPreferencesController } from '../controllers/itinerary-preferences.controller';
import { authenticate, requireRole } from '../middleware';

const router = Router();

/* =======================
   STATIC ROUTES FIRST
   ======================= */

router.use(authenticate, requireRole('superadmin', 'admin', 'rm', 'tl'));

router.post('/', itineraryPreferencesController.savePreferences);
router.post('/upsert', itineraryPreferencesController.saveOrUpdatePreferences);
router.post('/validate', itineraryPreferencesController.validatePreferences);

router.get('/flight/:id', itineraryPreferencesController.getFlightPreferenceById);
router.get('/hotel/:id', itineraryPreferencesController.getHotelPreferenceById);
router.get('/visa/:id', itineraryPreferencesController.getVisaPreferenceById);

/* =======================
   DYNAMIC LEAD ID ROUTES
   ======================= */

router.get('/all', itineraryPreferencesController.getAllLeads); 
router.get('/:leadId/check', itineraryPreferencesController.checkPreferencesExist);
router.get('/:leadId', itineraryPreferencesController.getPreferences);
router.put('/:leadId', itineraryPreferencesController.updatePreferences);
router.delete('/:leadId', itineraryPreferencesController.deletePreferences);


/* =======================
   Get Itinerary Pdf
   ======================= */
router.get('/:leadId/download-itinerary',  itineraryPreferencesController.downloadItineraryOnlyPDF)

export default router;