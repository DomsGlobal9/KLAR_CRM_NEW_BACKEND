import { Router } from "express";
import * as cabController from "../controllers/cab.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ==========================================
// B2B Cab Endpoints
// ==========================================
router.get("/cab-report", authenticate, cabController.getB2BCabReport);
router.get("/cab-report/:bookingId", authenticate, cabController.getB2BCabBookingById);

// ==========================================
// B2C Cab Endpoints (Handles both b2c & GUEST)
// ==========================================
router.get("/b2c-cab-report", authenticate, cabController.getB2CCabReport);
router.get("/b2c-cab-report/:bookingId", authenticate, cabController.getB2CCabBookingById);

export default router;