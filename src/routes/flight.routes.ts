import { Router } from "express";
import { getFlightReport } from "../controllers/flight.controller";
import { authenticate } from '../middleware/auth.middleware';


const router = Router();

// Get all flights (joined with auth user data)
router.get("/flights-report", authenticate, getFlightReport);

export default router;