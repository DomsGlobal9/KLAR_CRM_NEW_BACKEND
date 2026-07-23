import { Request, Response } from "express";
import * as tourService from "../services/tour.service";

// ==========================================
// B2B CONTROLLER HANDLERS
// ==========================================
export const getB2BTourReport = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const { queries, pagination } = await tourService.getTourQueriesByPortal(
      "B2B",
      page,
      limit
    );

    res.status(200).json({
      success: true,
      count: queries.length,
      data: queries,
      pagination,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getB2BTourById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await tourService.getSingleTourQueryDetails(id, "B2B");

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// ==========================================
// B2C CONTROLLER HANDLERS
// ==========================================
export const getB2CTourReport = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const { queries, pagination } = await tourService.getTourQueriesByPortal(
      "B2C",
      page,
      limit
    );

    res.status(200).json({
      success: true,
      count: queries.length,
      data: queries,
      pagination,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getB2CTourById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await tourService.getSingleTourQueryDetails(id, "B2C");

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};