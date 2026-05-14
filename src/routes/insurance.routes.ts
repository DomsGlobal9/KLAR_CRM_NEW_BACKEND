import { Router } from "express";
import * as InsuranceController from "../controllers/insurance.controller";

const router = Router();

router.get("/all-bookings", InsuranceController.getAllBookings);
router.get("/details/:id", InsuranceController.getBookingDetails);

export default router;