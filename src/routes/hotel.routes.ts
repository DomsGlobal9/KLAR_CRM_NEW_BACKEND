import { Router } from "express";
import { getHotelReport, getSingleHotelBooking } from "../controllers/hotel.controller";
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// List report (summary fields)
router.get("/hotel-report", authenticate, getHotelReport);

// Full details (single booking)
router.get("/hotel-report/:reservationId", authenticate, getSingleHotelBooking);

export default router;