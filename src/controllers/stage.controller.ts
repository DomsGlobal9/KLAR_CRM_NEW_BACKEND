import { Request, Response } from "express";
import { StageService } from "../services/stage.service";
import { successResponse, errorResponse } from "../helpers/response.helper";

export class StageController {
  
  // Create stage
  async create(req: Request, res: Response) {
    try {
      const data = await StageService.createStage(req.body);
      return successResponse(res, data, "Stage created");
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  // List stages ordered
  async list(req: Request, res: Response) {
    try {
      const data = await StageService.getStages();
      return successResponse(res, data);
    } catch (err) {
      return errorResponse(res, err);
    }
  }

  // Delete stage
  async delete(req: Request, res: Response) {
    try {
      const data = await StageService.deleteStage(req.params.id);
      return successResponse(res, data, "Stage deleted");
    } catch (err) {
      return errorResponse(res, err);
    }
  }
}
