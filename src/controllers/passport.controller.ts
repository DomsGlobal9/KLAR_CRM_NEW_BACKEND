import { Request, Response } from 'express';
import { passportService } from '../services/passport.service';

export class PassportController {
    getB2BPassportReport = async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const filter = (req.query.filter as string) || 'all';

            const { quotes, pagination } = await passportService.getPassportQuotesBySource('b2b', page, limit, filter);

            res.status(200).json({
                success: true,
                count: quotes.length,
                data: quotes,
                pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    getSingleB2BPassport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const bookingId = Array.isArray(id) ? id[0] : id;

            const data = await passportService.getSinglePassportDetailsBySource(bookingId, 'b2b');

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

    getB2CPassportReport = async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const filter = (req.query.filter as string) || 'all';

            const { quotes, pagination } = await passportService.getPassportQuotesBySource('b2c', page, limit, filter);

            res.status(200).json({
                success: true,
                count: quotes.length,
                data: quotes,
                pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    getSingleB2CPassport = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const bookingId = Array.isArray(id) ? id[0] : id;

            const data = await passportService.getSinglePassportDetailsBySource(bookingId, 'b2c');

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

export const passportController = new PassportController();