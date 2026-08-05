import { Request, Response } from 'express';
import { cruiseService } from '../services/cruise.service';

export class CruiseController {
    getB2BCruiseReport = async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const filter = (req.query.filter as string) || 'all';

            const { enquiries, pagination } = await cruiseService.getCruiseEnquiriesBySource('b2b', page, limit, filter);

            res.status(200).json({
                success: true,
                count: enquiries.length,
                data: enquiries,
                pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    getSingleB2BCruise = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const bookingId = Array.isArray(id) ? id[0] : id;

            const data = await cruiseService.getSingleCruiseDetailsBySource(bookingId, 'b2b');

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

    getB2CCruiseReport = async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const filter = (req.query.filter as string) || 'all';

            const { enquiries, pagination } = await cruiseService.getCruiseEnquiriesBySource('b2c', page, limit, filter);

            res.status(200).json({
                success: true,
                count: enquiries.length,
                data: enquiries,
                pagination
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    getSingleB2CCruise = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const bookingId = Array.isArray(id) ? id[0] : id;

            const data = await cruiseService.getSingleCruiseDetailsBySource(bookingId, 'b2c');

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

export const cruiseController = new CruiseController();