import { Request, Response } from "express";
import * as InsuranceService from "../services/insurance.service";

export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const data = await InsuranceService.getAllInsuranceReport();
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBookingDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = await InsuranceService.getSingleInsuranceDetails(id);
        if (!data) return res.status(404).json({ success: false, message: "Booking not found" });
        
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};