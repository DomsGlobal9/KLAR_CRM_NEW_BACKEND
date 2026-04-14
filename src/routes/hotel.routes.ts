import { Router } from "express";
import { getHotelReport } from "../controllers/hotel.controller";
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get("/hotel-report", authenticate, getHotelReport);

export default router;