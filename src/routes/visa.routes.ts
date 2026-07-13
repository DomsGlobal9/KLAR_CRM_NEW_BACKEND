// src/routes/visa.routes.ts
import { Router } from 'express';
import visaController from '../controllers/visa.controller';
import { authenticate } from '../middleware/auth.middleware';


const router = Router();

// ============ B2B PORTAL API ENDPOINTS ============
// Fetch all B2B bookings with pagination & structural filters
router.get('/b2b/bookings', authenticate, visaController.getB2BVisaBookings.bind(visaController));
// Fetch a single unique B2B visa booking by ID
router.get('/b2b/bookings/:id', authenticate, visaController.getB2BVisaBookingById.bind(visaController));

// ============ B2C PORTAL API ENDPOINTS ============
// Fetch all B2C consumer portal bookings
router.get('/b2c/bookings', authenticate, visaController.getB2CVisaBookings.bind(visaController));
// Fetch a single unique B2C visa booking by ID
router.get('/b2c/bookings/:id', authenticate, visaController.getB2CVisaBookingById.bind(visaController));

export default router;