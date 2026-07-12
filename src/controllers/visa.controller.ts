import { Request, Response } from 'express';
import visaService from '../services/visa.service';

export class VisaController {
    private getStringParam(param: any): string {
        return Array.isArray(param) ? String(param[0]) : String(param || '');
    }

    // ============ B2B PORTAL CONTROLLERS ============

    async getB2BVisaBookings(req: Request, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const filter: any = { source: 'B2B_PORTAL' };

            if (search) {
                const searchStr = this.getStringParam(search);
                filter.$or = [
                    { fullName: { $regex: searchStr, $options: 'i' } },
                    { email: { $regex: searchStr, $options: 'i' } },
                    { contactNumber: { $regex: searchStr, $options: 'i' } }
                ];
            }

            const result = await visaService.getVisaBookings(filter, Number(page), Number(limit));
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch B2B visa bookings',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getB2BVisaBookingById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            // ✅ Fix: Use the helper to sanitize the parameter into a clean string primitive
            const idStr = this.getStringParam(id);
            
            const booking = await visaService.getVisaBookingByIdAndSource(idStr, 'B2B_PORTAL');
            res.status(200).json({ success: true, data: booking });
        } catch (error) {
            res.status(error instanceof Error && error.message === 'Visa booking not found' ? 404 : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch B2B booking'
            });
        }
    }

    // ============ B2C PORTAL CONTROLLERS ============

    async getB2CVisaBookings(req: Request, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 10, email } = req.query;
            
            const filter: any = { source: 'B2C_PORTAL' };

            if (email) {
                filter.email = this.getStringParam(email).trim();
            }

            const result = await visaService.getVisaBookings(filter, Number(page), Number(limit));
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch B2C visa bookings',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getB2CVisaBookingById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const idStr = this.getStringParam(id);

            const booking = await visaService.getVisaBookingByIdAndSource(idStr, 'B2C_PORTAL');
            res.status(200).json({ success: true, data: booking });
        } catch (error) {
            res.status(error instanceof Error && error.message === 'Visa booking not found' ? 404 : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch B2C booking'
            });
        }
    }
}

export default new VisaController();