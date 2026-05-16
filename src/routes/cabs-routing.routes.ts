// import { Router } from 'express';
// import { CabsApiController } from '../controllers/cabs-api.controller';
// // Import your auth middleware if required:
// // import { authMiddleware } from '../middleware/auth.middleware';

// const router = Router();
// const cabsController = new CabsApiController();

// // 1. Route to show all cab bookings
// router.get('/bookings', cabsController.getAllBookings);

// // 2. Route to get one booking based on the bookingId
// router.get('/bookings/:bookingId', cabsController.getBookingDetail);

// export default router;























import { Router } from 'express';
import { CabsApiController } from '../controllers/cabs-api.controller';
import { authenticate } from "../middleware/auth.middleware";


const router = Router();
const cabsController = new CabsApiController();

router.get('/cabs-report', authenticate, cabsController.getAllBookings);
router.get('/cabs-details/:bookingId', authenticate, cabsController.getBookingDetail);

export default router;