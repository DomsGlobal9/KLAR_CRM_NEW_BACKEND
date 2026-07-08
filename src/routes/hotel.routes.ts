// import { Router } from "express";
// import { getHotelReport, getSingleHotelBooking } from "../controllers/hotel.controller";
// import { authenticate } from '../middleware/auth.middleware';

// const router = Router();

// // List report (summary fields)
// router.get("/hotel-report", authenticate, getHotelReport);

// // Full details (single booking)
// router.get("/hotel-report/:reservationId", authenticate, getSingleHotelBooking);

// export default router;


















import { Router } from "express";
import { 
    getHotelReport, 
    getSingleHotelBooking, 
    getB2CHotelReport, 
    getSingleB2CHotelBooking 
} from "../controllers/hotel.controller";
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// B2B Hotel Endpoints
router.get("/hotel-report", authenticate, getHotelReport);
router.get("/hotel-report/:reservationId", authenticate, getSingleHotelBooking);

// B2C Hotel Endpoints
router.get("/b2c-hotel-report", authenticate, getB2CHotelReport);
router.get("/b2c-hotel-report/:reservationId", authenticate, getSingleB2CHotelBooking);

export default router;