// import { Request, Response } from 'express';
// import * as FlightService from '../services/flight.service';
// import { sendSuccess, sendError } from '../utils/response.utils'; // Assuming you have these helpers

// export const getMyFlights = async (req: Request, res: Response) => {
//     try {
//         // Assuming your auth middleware attaches the user object to req.user
//         const userId = (req as any).user?._id;

//         if (!userId) {
//             return res.status(401).json({ message: "User not authenticated" });
//         }

//         const flights = await FlightService.getUserFlights(userId.toString());
        
//         return res.status(200).json({
//             success: true,
//             data: flights
//         });
//     } catch (error: any) {
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Internal Server Error"
//         });
//     }
// };

































// import { Request, Response } from 'express';
// import * as FlightService from '../services/flight.service';

// export const getMyFlights = async (req: Request, res: Response) => {
//     try {
//         const authenticatedUserId = (req as any).user?._id;

//         // if (!authenticatedUserId) {
//         //     return res.status(401).json({ 
//         //         success: false, 
//         //         message: "User not authenticated - No user ID found in request" 
//         //     });
//         // }
//         console.log("73flight.controller.ts", authenticatedUserId)

//         // 2. Fetch flights where flight.userId === user._id
//         const flights = await FlightService.getUserFlights(authenticatedUserId.toString());
        
//         return res.status(200).json({
//             success: true,
//             count: flights.length,
//             data: flights
//         });
//     } catch (error: any) {
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Internal Server Error"
//         });
//     }
// };


































// import { Request, Response } from 'express';
// import * as FlightService from '../services/flight.service';

// export const getMyFlights = async (req: Request, res: Response) => {
//     try {
//         // Access the user ID. 
//         // Note: Depending on your middleware, it might be req.user.id or req.user._id
//         const user = (req as any).user;
//         const authenticatedUserId = user?._id || user?.id;

//         console.log("Debug - User from request:", user);

//         if (!authenticatedUserId) {
//             return res.status(401).json({ 
//                 success: false, 
//                 message: "Authentication failed: No user found in request. Please check your token and auth middleware." 
//             });
//         }

//         // Now it's safe to call .toString()
//         const flights = await FlightService.getUserFlights(authenticatedUserId.toString());
        
//         return res.status(200).json({
//             success: true,
//             count: flights.length,
//             data: flights
//         });
//     } catch (error: any) {
//         console.error("Flight Controller Error:", error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Internal Server Error"
//         });
//     }
// };





















// export const getMyFlights = async (req: Request, res: Response) => {
//     try {
//         const user = (req as any).user;
//         // Supabase uses .id, Mongoose uses ._id. Use id first since middleware sets it.
//         const authenticatedUserId = user?.id || user?._id;

//         console.log("Debug - Supabase User ID:", authenticatedUserId);

//         if (!authenticatedUserId) {
//             return res.status(401).json({ 
//                 success: false, 
//                 message: "Authentication failed: No user found in request." 
//             });
//         }

//         const flights = await FlightService.getUserFlights();
        
//         return res.status(200).json({
//             success: true,
//             count: flights.length,
//             data: flights
//         });
//     } catch (error: any) {
//         // If the DB is disconnected, it will catch here after 10 seconds
//         return res.status(500).json({
//             success: false,
//             message: `Database Error: ${error.message}`
//         });
//     }
// };
















import { Request, Response } from 'express';
import * as FlightService from '../services/flight.service';

export const getFlightDetails = async (req: Request, res: Response) => {
    try {
        // We ignore the ID in the request as per your requirement
        const flights = await FlightService.getAllFlightsData();

        return res.status(200).json({
            success: true,
            count: flights.length,
            data: flights
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};