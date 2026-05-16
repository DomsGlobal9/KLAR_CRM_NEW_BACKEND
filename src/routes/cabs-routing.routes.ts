import { Router } from 'express';
import { CabsApiController } from '../controllers/cabs-api.controller';
import { authenticate } from "../middleware/auth.middleware";


const router = Router();
const cabsController = new CabsApiController();

router.get('/cabs-report', authenticate, cabsController.getAllBookings);
router.get('/cabs-details/:bookingId', authenticate, cabsController.getBookingDetail);

export default router;