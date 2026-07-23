import { Router } from "express";
import * as tourController from "../controllers/tour.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// ==========================================
// B2B Endpoints
// ==========================================
// Get all B2B tour queries
router.get("/b2b-tour-report", authenticate, tourController.getB2BTourReport);

// Get single B2B tour query by Mongo ObjectId
router.get("/b2b-tour-report/:id", authenticate, tourController.getB2BTourById);

// ==========================================
// B2C Endpoints
// ==========================================
// Get all B2C tour queries
router.get(
  "/b2c-tour-report",
  authenticate,
  tourController.getB2CTourReport
);

// Get single B2C tour query by Mongo ObjectId
router.get(
  "/b2c-tour-report/:id",
  authenticate,
  tourController.getB2CTourById
);

export default router;