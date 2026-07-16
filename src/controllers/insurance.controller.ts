import { Request, Response } from "express";
import * as insuranceService from "../services/insurance.service";

// ==========================================
// B2B CONTROLLER HANDLERS
// ==========================================
export const getB2BInsuranceReport = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;

        const { bookings, pagination } = await insuranceService.getAllInsuranceReportsWithUserDetails(page, limit, "b2b");
        
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

export const getB2BInsuranceBookingById = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        const data = await insuranceService.getSingleInsuranceBookingDetails(id, "b2b");
        
        if (!data) {
            return res.status(404).json({ success: false, message: "B2B Insurance booking not found" });
        }

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// B2C CONTROLLER HANDLERS
// ==========================================
export const getB2CInsuranceReport = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;

        const { bookings, pagination } = await insuranceService.getAllInsuranceReportsWithUserDetails(page, limit, "b2c");
        
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

export const getB2CInsuranceBookingById = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        const data = await insuranceService.getSingleInsuranceBookingDetails(id, "b2c");
        
        if (!data) {
            return res.status(404).json({ success: false, message: "B2C Insurance booking not found" });
        }

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};