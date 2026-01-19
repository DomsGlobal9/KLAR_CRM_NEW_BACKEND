import express from 'express';
import { leadController } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/capture', leadController.captureWebLead);

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================
// Uncomment when you want to enable authentication
// router.use(authenticate);

// ============================================
// BASIC LEAD OPERATIONS (Existing)
// ============================================
router.post('/', leadController.createLead);
router.get('/', leadController.getAllLeads);
router.get('/stats', leadController.getLeadStats);
router.get('/search', leadController.searchLeads);

// ============================================
// NEW: GET LEADS BY ASSIGNED RM
// ============================================
router.get('/rm/:rmId', leadController.getLeadsByAssignedRM);

// ============================================
// LEAD DETAILS ENDPOINTS
// ============================================
// Get lead by ID (basic requirements only - backward compatible)
router.get('/:id', leadController.getLeadById);

// NEW: Get lead with FULL details (flights, hotels, journey)
router.get('/:id/full-details', leadController.getLeadByIdWithFullDetails);

// Update and delete lead
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

// Lead stage and assignment
router.patch('/:id/stage', leadController.updateLeadStage);
router.patch('/:id/assign', leadController.assignLead);

// ============================================
// NEW: FLIGHT REQUIREMENTS ENDPOINTS
// ============================================
// Get flight requirements for a lead
router.get('/:leadId/flights', leadController.getFlightRequirementsByLeadId);

// Add flight requirement to a lead
router.post('/:leadId/flights', leadController.addFlightRequirement);

// Update flight requirement
router.put('/flights/:id', leadController.updateFlightRequirement);

// Delete flight requirement
router.delete('/flights/:id', leadController.deleteFlightRequirement);

// ============================================
// NEW: HOTEL REQUIREMENTS ENDPOINTS
// ============================================
// Get hotel requirements for a lead
router.get('/:leadId/hotels', leadController.getHotelRequirementsByLeadId);

// Add hotel requirement to a lead
router.post('/:leadId/hotels', leadController.addHotelRequirement);

// Update hotel requirement
router.put('/hotels/:id', leadController.updateHotelRequirement);

// Delete hotel requirement
router.delete('/hotels/:id', leadController.deleteHotelRequirement);

// ============================================
// NEW: JOURNEY DETAILS ENDPOINTS
// ============================================
// Get journey details for a lead
router.get('/:leadId/journey', leadController.getJourneyDetailsByLeadId);

// Create or update journey details
router.post('/:leadId/journey', leadController.upsertJourneyDetails);
router.put('/:leadId/journey', leadController.upsertJourneyDetails);

export default router;