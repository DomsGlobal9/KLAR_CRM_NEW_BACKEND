import { Router } from "express";
import * as InsuranceController from "../controllers/insurance.controller";
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get("/all-bookings", authenticate, InsuranceController.getAllBookings);
router.get("/details/:id", authenticate,     InsuranceController.getBookingDetails);

export default router;