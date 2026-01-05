import { Request, Response } from 'express';
import { StageService } from '../services/stage.service';
import { 
  ICreateStage, 
  IUpdateStage, 
  IStageFilters 
} from '../interfaces/stage.interface';
import { sendResponse } from '../utils/response.utils';

export class StageController {
  private stageService: StageService;

  constructor() {
    this.stageService = new StageService();
  }

  createStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const stageData: ICreateStage = {
        ...req.body,
        created_by: req.user?.id || req.body.created_by
      };
      
      const result = await this.stageService.createStage(stageData);
      sendResponse(res, result.success ? 201 : 400, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };

  getStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.stageService.getStageById(id);
      sendResponse(res, result.success ? 200 : 404, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };

  getAllStages = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: IStageFilters = {
        search: req.query.search as string,
        sort_by: req.query.sort_by as 'name' | 'position' | 'created_at',
        order: req.query.order as 'asc' | 'desc',
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        created_by: req.user?.id || req.query.created_by as string
      };
      
      const result = await this.stageService.getAllStages(filters);
      sendResponse(res, result.success ? 200 : 400, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };

  updateStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const stageData: IUpdateStage = req.body;
      
      const result = await this.stageService.updateStage(id, stageData);
      sendResponse(res, result.success ? 200 : 400, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };

  deleteStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.stageService.deleteStage(id);
      sendResponse(res, result.success ? 200 : 400, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };

  getPipelineData = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || req.query.user_id as string;
      const result = await this.stageService.getPipelineData(userId);
      sendResponse(res, result.success ? 200 : 400, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };

  initializeDefaultStages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || req.body.user_id;
      
      if (!userId) {
        sendResponse(res, 400, {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'User ID is required'
        });
        return;
      }
      
      const result = await this.stageService.initializeDefaultStages(userId);
      sendResponse(res, result.success ? 201 : 400, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };

  getStagesByUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || req.params.userId;
      
      if (!userId) {
        sendResponse(res, 400, {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'User ID is required'
        });
        return;
      }
      
      const filters: IStageFilters = {
        ...req.query,
        created_by: userId
      };
      
      const result = await this.stageService.getAllStages(filters);
      sendResponse(res, result.success ? 200 : 400, result);
    } catch (error: any) {
      sendResponse(res, 500, {
        success: false,
        error: 'SERVER_ERROR',
        message: error.message || 'Internal server error'
      });
    }
  };
}