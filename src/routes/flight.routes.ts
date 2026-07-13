import { Router } from "express";
import { getFlightReport, getSingleBooking, getB2CFlightReport, getSingleB2CBooking } from "../controllers/flight.controller";
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// B2B Endpoints
router.get("/flights-report", authenticate, getFlightReport);
router.get("/flights-report/:bookingId", authenticate, getSingleBooking);


// B2C Endpoints
router.get("/b2c-flights-report", authenticate, getB2CFlightReport);
router.get("/b2c-flights-report/:bookingId", authenticate, getSingleB2CBooking);

export default router;