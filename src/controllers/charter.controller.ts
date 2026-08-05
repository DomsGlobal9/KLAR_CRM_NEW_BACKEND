import { Request, Response } from 'express';
import { charterService } from '../services/charter.service';

export class CharterController {
    getB2BCharterReport = async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const filter = (req.query.filter as string) || 'all';

            const { bookings, pagination } = await charterService.getCharterBookingsBySource('b2b', page, limit, filter);

            res.status(200).json({
                success: true,
                count: bookings.length,
                data: bookings,
                pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    getSingleB2BCharter = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const bookingId = Array.isArray(id) ? id[0] : id;

            const data = await charterService.getSingleCharterDetailsBySource(bookingId, 'b2b');

            res.status(200).json({
                success: true,
                data
            });
        } catch (error: any) {
            const statusCode = error.message?.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    };

    getB2CCharterReport = async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const filter = (req.query.filter as string) || 'all';

            const { bookings, pagination } = await charterService.getCharterBookingsBySource('b2c', page, limit, filter);

            res.status(200).json({
                success: true,
                count: bookings.length,
                data: bookings,
                pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    getSingleB2CCharter = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const bookingId = Array.isArray(id) ? id[0] : id;

            const data = await charterService.getSingleCharterDetailsBySource(bookingId, 'b2c');

            res.status(200).json({
                success: true,
                data
            });
        } catch (error: any) {
            const statusCode = error.message?.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    };
}

export const charterController = new CharterController();