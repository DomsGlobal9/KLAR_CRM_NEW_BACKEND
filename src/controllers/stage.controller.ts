import { Request, Response } from 'express';
import { stageService } from '../services/stage.service';
import {
  CreateStagePayload,
  UpdateStagePayload,
  StageFilter,
  ReorderStagesPayload
} from '../interfaces/stage.interface';

export const stageController = {
  /**
   * Create a new stage
   */
  async createStage(req: Request, res: Response) {
    try {
      const payload: CreateStagePayload = req.body;
      const userId = (req as any).user?.id; // Assuming authentication middleware

      const stage = await stageService.createStage(payload, userId);
      if (!stage) {
        throw new Error('Stage creation failed');
      }

      res.status(201).json({
        success: true,
        message: 'Stage created successfully',
        // data: stage
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get all stages
   */
  async getAllStages(req: Request, res: Response) {
    try {
      const filter: StageFilter = {
        search: req.query.search as string,
        is_default: req.query.is_default !== undefined ? req.query.is_default === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const stages = await stageService.getAllStages(filter);
      if (!stages) {
        throw new Error('Failed to retrieve stages');
      }

      const formattedData = stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        color: stage.color
        // No other fields like position, is_default, created_at, etc.
      }));

      if (formattedData.length === 0) {
        throw new Error('No stages found');
      }

      res.json({
        success: true,
        data: formattedData,
        count: stages.length
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get stage by ID
   */
  async getStageById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stage = await stageService.getStageById(id);

      res.json({
        success: true,
        data: stage
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Update stage
   */
  async updateStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload: UpdateStagePayload = req.body;

      const stage = await stageService.updateStage(id, payload);

      res.json({
        success: true,
        message: 'Stage updated successfully',
        data: stage
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Delete stage
   */
  async deleteStage(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await stageService.deleteStage(id);

      res.json({
        success: true,
        message: 'Stage deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Reorder stages
   */
  async reorderStages(req: Request, res: Response) {
    try {
      const payload: ReorderStagesPayload = req.body;

      const stages = await stageService.reorderStages(payload);

      res.json({
        success: true,
        message: 'Stages reordered successfully',
        data: stages
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get pipeline stages with statistics
   */
  async getPipelineStages(req: Request, res: Response) {
    try {
      const stages = await stageService.getPipelineStages();

      res.json({
        success: true,
        data: stages,
        count: stages.length
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Get default stages
   */
  async getDefaultStages(req: Request, res: Response) {
    try {
      const stages = await stageService.getDefaultStages();

      res.json({
        success: true,
        data: stages,
        count: stages.length
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * Initialize default stages
   */
  async initializeDefaultStages(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const stages = await stageService.initializeDefaultStages(userId);

      res.json({
        success: true,
        message: 'Default stages initialized',
        data: stages,
        count: stages.length
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
};