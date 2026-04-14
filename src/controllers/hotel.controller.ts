import { Request, Response } from "express";
import { getAllHotelsWithUsers } from "../services/hotel.service";

export const getHotelReport = async (req: Request, res: Response) => {
    try {
        const data = await getAllHotelsWithUsers();
        
        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};