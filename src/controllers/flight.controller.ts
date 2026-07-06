import { Request, Response } from "express";
import { getAllFlightsWithUsers, getSingleFlightDetails } from "../services/flight.service";

export const getFlightReport = async (req: Request, res: Response) => {
    try {
        // Extract pagination constraints from string queries with standard fallbacks
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;

        const { bookings, pagination } = await getAllFlightsWithUsers(page, limit); 

        res.status(200).json({
            success: true,
            count: Array.isArray(bookings) ? bookings.length : 0,
            data: Array.isArray(bookings) ? bookings : [],
            pagination
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

        const id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        const data = await getSingleFlightDetails(id);
        console.log("flight.controller.ts - getSingleBooking - data:", data); 
        
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