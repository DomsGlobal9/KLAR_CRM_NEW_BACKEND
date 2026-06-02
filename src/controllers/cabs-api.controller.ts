import { Request, Response } from 'express';
import { CabsOperationsService } from '../services/cabs-operations.service';

export class CabsApiController {
    private cabsService = new CabsOperationsService();

    public getAllBookings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            let targetUserId: string | undefined = undefined;

            // Check if the user is an AGENT or a standard client role. 
            // If they don't hold B2B_ADMIN rights, restrict the query scope to their profile ID.
            const isGlobalAdmin = user?.roles?.includes("B2B_ADMIN");

            if (user && !isGlobalAdmin) {
                const rawId = user.id || user._id;
                targetUserId = rawId ? rawId.toString() : undefined;
            }

            // NOTE: If you want to bypass filtering completely during testing to verify data,
            // comment out the line below and pass 'undefined' instead:
            // const records = await this.cabsService.getAllCabBookings(undefined);
            const records = await this.cabsService.getAllCabBookings(targetUserId);
            
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