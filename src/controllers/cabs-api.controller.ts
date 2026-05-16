// import { Request, Response } from 'express';
// import { CabsOperationsService } from '../services/cabs-operations.service';

// export class CabsApiController {
//     private cabsService = new CabsOperationsService();

//     /**
//      * GET /api/v1/cabs/bookings
//      * Retrieve all cab bookings
//      */
//     public getAllBookings = async (req: Request, res: Response): Promise<void> => {
//         try {
//             // Context placeholder: extracted from auth token middleware details if needed
//             const b2bContext = (req as any).user ? { 
//                 agentId: (req as any).user.agentId, 
//                 userId: (req as any).user.id 
//             } : undefined;

//             const datasets = await this.cabsService.getAllCabBookings(b2bContext);
            
//             res.status(200).json({
//                 success: true,
//                 message: "Cab records bundle fetched successfully",
//                 count: datasets.length,
//                 data: datasets
//             });
//         } catch (error: any) {
//             res.status(500).json({
//                 success: false,
//                 message: error.message || "Internal server disruption executing cab logs lookup"
//             });
//         }
//     };

//     /**
//      * GET /api/v1/cabs/bookings/:bookingId
//      * Retrieve a single cab booking by ID
//      */
//     public getBookingDetail = async (req: Request, res: Response): Promise<void> => {
//         try {
//             const { bookingId } = req.params;
//             const cabBooking = await this.cabsService.getCabBookingDetail(bookingId);

//             res.status(200).json({
//                 success: true,
//                 message: "Cab booking file located successfully",
//                 data: cabBooking
//             });
//         } catch (error: any) {
//             const statusCode = error.message.includes("not found") ? 404 : 400;
//             res.status(statusCode).json({
//                 success: false,
//                 message: error.message || "Failed to parse requested cab document properties"
//             });
//         }
//     };
// }
























import { Request, Response } from 'express';
import { CabsOperationsService } from '../services/cabs-operations.service';

export class CabsApiController {
    private cabsService = new CabsOperationsService();

    public getAllBookings = async (req: Request, res: Response): Promise<void> => {
        try {
            const b2bContext = (req as any).user ? { 
                agentId: (req as any).user.agentId, 
                userId: (req as any).user.id 
            } : undefined;

            const records = await this.cabsService.getAllCabBookings(b2bContext);
            
            res.status(200).json({
                success: true,
                message: "Cab transactions cross-checked and compiled successfully",
                count: records.length,
                data: records
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || "Failed parsing across database bounds for cab summaries"
            });
        }
    };

    public getBookingDetail = async (req: Request, res: Response): Promise<void> => {
        try {
            const bookingIdParam = req.params.bookingId;
            const bookingId = Array.isArray(bookingIdParam) ? bookingIdParam[0] : bookingIdParam;
            const singleRecord = await this.cabsService.getCabBookingDetail(bookingId);

            res.status(200).json({
                success: true,
                message: "Cab booking item cross-referenced successfully",
                data: singleRecord
            });
        } catch (error: any) {
            const statusCode = error.message.includes("No record identified") ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    };
}