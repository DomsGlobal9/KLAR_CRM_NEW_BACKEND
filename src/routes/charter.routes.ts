import { Router } from 'express';
import { charterController } from '../controllers/charter.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// B2B Charter Queries
router.get('/b2b-charter-report', authenticate, charterController.getB2BCharterReport);
router.get('/b2b-charter-report/:id', authenticate, charterController.getSingleB2BCharter);

// B2C Charter Queries
router.get('/b2c-charter-report', authenticate, charterController.getB2CCharterReport);
router.get('/b2c-charter-report/:id', authenticate, charterController.getSingleB2CCharter);

export default router;