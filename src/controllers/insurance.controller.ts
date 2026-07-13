import { Request, Response } from "express";
import * as insuranceService from "../services/insurance.service";

export const getInsuranceBookingReport = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;

        const { bookings, pagination } = await insuranceService.getAllInsuranceReportsWithUserDetails(page, limit);
        
        res.status(200).json({ 
            success: true, 
            count: Array.isArray(bookings) ? bookings.length : 0,
            data: bookings, 
            pagination 
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getInsuranceBookingById = async (req: Request, res: Response) => {
    try {
        const bookingIdParam = req.params.bookingId;
        const bookingId = Array.isArray(bookingIdParam) ? bookingIdParam[0] : bookingIdParam;
        const data = await insuranceService.getSingleInsuranceBookingDetails(bookingId);
        
        if (!data) {
            return res.status(404).json({ success: false, message: "Insurance booking not found" });
        }

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};