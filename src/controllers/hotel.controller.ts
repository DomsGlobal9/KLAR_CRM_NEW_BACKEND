import { Request, Response } from "express";
import { getAllHotelsWithUsers, getSingleHotelDetails } from "../services/hotel.service";

export const getHotelReport = async (req: Request, res: Response) => {
    try {
        const data = await getAllHotelsWithUsers();
        
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







export const getSingleHotelBooking = async (req: Request, res: Response) => {
    try {
        const { reservationId } = req.params;

        if (!reservationId || Array.isArray(reservationId)) {
            return res.status(400).json({ success: false, message: "Reservation ID is required" });
        }

        const data = await getSingleHotelDetails(reservationId);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error: any) {
        const statusCode = error.message === "Hotel booking not found" ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};