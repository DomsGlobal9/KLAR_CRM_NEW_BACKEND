import { Router } from 'express';
import { cruiseController } from '../controllers/cruise.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// B2B Cruise Queries
router.get('/b2b-cruise-report', authenticate, cruiseController.getB2BCruiseReport);
router.get('/b2b-cruise-report/:id', authenticate, cruiseController.getSingleB2BCruise);

// B2C Cruise Queries
router.get('/b2c-cruise-report', authenticate, cruiseController.getB2CCruiseReport);
router.get('/b2c-cruise-report/:id', authenticate, cruiseController.getSingleB2CCruise);

export default router;