import { Router } from 'express';
import { itineraryPreferencesController } from '../controllers/itinerary-preferences.controller';
import { authenticate, requireRole, upload } from '../middleware';
import { userItineraryFilesController } from '../controllers/user-itinerary-files.controller';

const router = Router();

/* =======================
   STATIC ROUTES FIRST
   ======================= */

router.use(authenticate, requireRole('superadmin', 'admin', 'rm', 'tl'));


router.get('/file-only-list', userItineraryFilesController.getAllFileItineraries);
router.get('/file-only/by-itinerary/:itineraryId', userItineraryFilesController.getFileOnlyItineraryById); 

router.post('/', itineraryPreferencesController.savePreferences);
// router.post('/upsert', itineraryPreferencesController.saveOrUpdatePreferences);
router.post('/validate', itineraryPreferencesController.validatePreferences);

router.get('/flight/:id', itineraryPreferencesController.getFlightPreferenceById);
router.get('/hotel/:id', itineraryPreferencesController.getHotelPreferenceById);
router.get('/visa/:id', itineraryPreferencesController.getVisaPreferenceById);

/* =======================
   DYNAMIC LEAD ID ROUTES
   ======================= */

router.get('/all', itineraryPreferencesController.getAllLeads);
router.get('/:leadId/check', itineraryPreferencesController.checkPreferencesExist);
router.get('/:itinerary_id', itineraryPreferencesController.getPreferences);
router.patch('/:itinerary_id', itineraryPreferencesController.updatePreferences);
router.delete('/:itinerary_id', itineraryPreferencesController.deletePreferences);


/* =======================
   Get Itinerary Pdf
   ======================= */
router.get('/:itinerary_id/download-itinerary', itineraryPreferencesController.downloadItineraryOnlyPDF)


/**
 * Uploads to S3 and returns the URL for sharing
 */
router.post('/:itinerary_id/share-itinerary', itineraryPreferencesController.uploadItineraryToS3);
router.get('/file-only/:leadId', userItineraryFilesController.getFileOnlyItinerary);
router.get('/file-only/:leadId/check', userItineraryFilesController.checkFileOnlyItinerary);
router.post('/file-only/:leadId', userItineraryFilesController.createFileOnlyItinerary);
router.delete('/file-only/:leadId', userItineraryFilesController.deleteFileOnlyItinerary);
router.post('/upload-multiple', upload.array('files', 10), userItineraryFilesController.uploadMultipleFiles);
router.post('/save-file-urls', userItineraryFilesController.saveUploadedFileUrls);
router.post('/upload-pdf', upload.single('file'), userItineraryFilesController.uploadPdfFile);
router.post('/upload-image', upload.single('file'), userItineraryFilesController.uploadImageFile);



export default router;