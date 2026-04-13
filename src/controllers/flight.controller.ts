import { Request, Response } from "express";
import { getAllFlightsWithUsers } from "../services/flight.service";

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