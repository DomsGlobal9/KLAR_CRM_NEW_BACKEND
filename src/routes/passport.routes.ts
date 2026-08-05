import { Router } from 'express';
import { passportController } from '../controllers/passport.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// B2B Passport Queries
router.get('/b2b-passport-report', authenticate, passportController.getB2BPassportReport);
router.get('/b2b-passport-report/:id', authenticate, passportController.getSingleB2BPassport);

// B2C Passport Queries
router.get('/b2c-passport-report', authenticate, passportController.getB2CPassportReport);
router.get('/b2c-passport-report/:id', authenticate, passportController.getSingleB2CPassport);

export default router;