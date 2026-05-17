import { Router } from "express";
import { getFlightReport, getSingleBooking } from "../controllers/flight.controller"; // Import new controller
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Get all flights (summary)
router.get("/flights-report", authenticate, getFlightReport);

// Get single flight (full details)
router.get("/flights-report/:bookingId", authenticate, getSingleBooking);

export default router;