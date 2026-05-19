import { Router } from "express";
import * as insuranceController from "../controllers/insurance.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Route for all insurance bookings (Report view)
router.get("/insurance-report", authenticate, insuranceController.getInsuranceBookingReport);

// Route for specific insurance booking details
router.get("/insurance-details/:bookingId", authenticate, insuranceController.getInsuranceBookingById);

export default router;