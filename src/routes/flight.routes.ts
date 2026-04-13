// import { Router } from 'express';
// import { getMyFlights } from '../controllers/flight.controller';
// import { authenticate } from '../middleware/auth.middleware';

// const router = Router();

// // GET /api/flights/my-bookings
// router.get('/my-bookings', authenticate, getMyFlights);

// export default router;














import { Router } from 'express';
import { getFlightDetails } from '../controllers/flight.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Endpoint to get all flight details after checking user IDs
router.get('/my-bookings', authenticate, getFlightDetails);

export default router;