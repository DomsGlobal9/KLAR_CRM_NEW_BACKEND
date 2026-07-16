import { Router } from "express";
import * as insuranceController from "../controllers/insurance.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ==========================================
// B2B Endpoints
// ==========================================
// Route to fetch all B2B insurance bookings
router.get("/insurance-report", authenticate, insuranceController.getB2BInsuranceReport);

// Route for specific B2B insurance booking details
router.get("/insurance-report/:bookingId", authenticate, insuranceController.getB2BInsuranceBookingById);


// ==========================================
// B2C Endpoints
// ==========================================
// Route to fetch all B2C insurance bookings
router.get("/b2c-insurance-report", authenticate, insuranceController.getB2CInsuranceReport);

// Route for specific B2C insurance booking details
router.get("/b2c-insurance-report/:bookingId", authenticate, insuranceController.getB2CInsuranceBookingById);

export default router;