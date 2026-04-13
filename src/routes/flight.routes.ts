// import { Router } from 'express';
// import { getMyFlights } from '../controllers/flight.controller';
// import { authenticate } from '../middleware/auth.middleware';

// const router = Router();

// // GET /api/flights/my-bookings
// router.get('/my-bookings', authenticate, getMyFlights);

// export default router;














// import { Router } from 'express';
// import { getFlightDetails } from '../controllers/flight.controller';
// import { authenticate } from '../middleware/auth.middleware';

// const router = Router();

// // Endpoint to get all flight details after checking user IDs
// router.get('/my-bookings', authenticate, getFlightDetails);

// export default router;
















import { Router } from "express";
// import { getFlightReport } from "../controllers/user.controller";
import { getFlightReport } from "../controllers/flight.controller";
// import { authMiddleware } from "../middleware/auth.middleware";
import { authenticate } from '../middleware/auth.middleware';


const router = Router();

// Get all flights (joined with auth user data)
router.get("/flights-report", authenticate, getFlightReport);

export default router;