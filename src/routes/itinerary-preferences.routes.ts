import { Router } from 'express';
import { itineraryPreferencesController } from '../controllers/itinerary-preferences.controller';

const router = Router();

/* =======================
   STATIC ROUTES FIRST
   ======================= */

router.post('/', itineraryPreferencesController.savePreferences);
router.post('/upsert', itineraryPreferencesController.saveOrUpdatePreferences);
router.post('/validate', itineraryPreferencesController.validatePreferences);

// BY PREFERENCE ID (STATIC PREFIX)
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

export default router;