import { Request, Response } from "express";
import { 
    getAllB2BHotelsWithUsers, 
    getSingleB2BHotelDetails,
    getAllB2CHotelsWithUsers,
    getSingleB2CHotelDetails 
} from "../services/hotel.service";

// B2B Controllers
export const getHotelReport = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;

        const { bookings, pagination } = await getAllB2BHotelsWithUsers(page, limit);
        res.status(200).json({ success: true, count: bookings.length, data: bookings, pagination });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSingleHotelBooking = async (req: Request, res: Response) => {
    try {
        const { reservationId } = req.params;
        if (!reservationId) return res.status(400).json({ success: false, message: "Reservation ID is required" });

        const data = await getSingleB2BHotelDetails(reservationId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        const code = error.message.includes("not found") ? 404 : 500;
        res.status(code).json({ success: false, message: error.message });
    }
};

// B2C Controllers
export const getB2CHotelReport = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;

        const { bookings, pagination } = await getAllB2CHotelsWithUsers(page, limit);
        res.status(200).json({ success: true, count: bookings.length, data: bookings, pagination });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSingleB2CHotelBooking = async (req: Request, res: Response) => {
    try {
        const { reservationId } = req.params;
        if (!reservationId) return res.status(400).json({ success: false, message: "Reservation ID is required" });

        const data = await getSingleB2CHotelDetails(reservationId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        const code = error.message.includes("not found") ? 404 : 500;
        res.status(code).json({ success: false, message: error.message });
    }
};