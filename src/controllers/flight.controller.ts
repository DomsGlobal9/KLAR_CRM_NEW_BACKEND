import { Request, Response } from "express";
import { getAllFlightsWithUsers, getSingleFlightDetails } from "../services/flight.service";

export const getFlightReport = async (req: Request, res: Response) => {
    try {
        const data = await getAllFlightsWithUsers();
        console.log("flight.controller.ts - getFlightReport - data:", data); // Debug log to check the data structure
        
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
            return res.status(400).json({ 
                success: false, 
                message: "Booking ID is required" 
            });
        }

        // Handle case where bookingId might be an array or string
        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        const data = await getSingleFlightDetails(id);
        
        res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
        // If the service throws "Booking not found", return 404
        const statusCode = error.message === "Booking not found" ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};