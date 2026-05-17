import { Request, Response } from "express";
import { getAllFlightsWithUsers, getSingleFlightDetails } from "../services/flight.service";

export const getFlightReport = async (req: Request, res: Response) => {
    try {
        const data = await getAllFlightsWithUsers();
        
        res.status(200).json({
            success: true,
            count: Array.isArray(data) ? data.length : 0,
            data: Array.isArray(data) ? data : []
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};







export const getSingleBooking = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params; 
        
        if (!bookingId) {
            return res.status(400).json({ success: false, message: "Booking ID is required" });
        }

        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        const data = await getSingleFlightDetails(id);
        
        res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
        const statusCode = error.message === "Booking not found" ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};