import {
  Stage,
  CreateStagePayload,
  UpdateStagePayload,
  StageFilter,
  PipelineStage,
  ReorderStagesPayload
} from '../interfaces/stage.interface';
import { stageRepository } from '../repositories/stage.repository';
import { StageValidationUtils } from '../utils';

export const stageService = {
  /**
   * Create a new stage
   */
  async createStage(payload: CreateStagePayload, userId?: string): Promise<Stage> {
    // Validate payload
    const validation = StageValidationUtils.validateStagePayload(payload);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if stage name already exists
    const exists = await stageRepository.stageNameExists(payload.name);
    if (exists) {
      throw new Error('Stage name already exists');
    }

    // Validate color format
    if (!StageValidationUtils.validateColor(payload.color)) {
      throw new Error('Invalid color format');
    }

    return await stageRepository.createStage(payload, userId);
  },

  /**
   * Get all stages
   */
  async getAllStages(filter: StageFilter = {}): Promise<Stage[]> {
    return await stageRepository.getAllStages(filter);
  },

  /**
   * Get stage by ID
   */
  async getStageById(id: string): Promise<Stage> {
    const stage = await stageRepository.getStageById(id);
    if (!stage) {
      throw new Error('Stage not found');
    }
    return stage;
  },

  /**
   * Update stage
   */
  async updateStage(id: string, payload: UpdateStagePayload): Promise<Stage> {
    // Get existing stage
    const existingStage = await stageRepository.getStageById(id);
    if (!existingStage) {
      throw new Error('Stage not found');
    }

    // If name is being updated, check for duplicates
    if (payload.name && payload.name !== existingStage.name) {
      const exists = await stageRepository.stageNameExists(payload.name, id);
      if (exists) {
        throw new Error('Stage name already exists');
      }
    }

    // Validate color if being updated
    if (payload.color && !StageValidationUtils.validateColor(payload.color)) {
      throw new Error('Invalid color format');
    }

    return await stageRepository.updateStage(id, payload);
  },

  /**
   * Delete stage
   */
  async deleteStage(id: string): Promise<boolean> {
    const stage = await stageRepository.getStageById(id);
    if (!stage) {
      throw new Error('Stage not found');
    }

    // Prevent deletion of default stages if needed
    if (stage.is_default) {
      throw new Error('Cannot delete default stage');
    }

    return await stageRepository.deleteStage(id);
  },

  /**
   * Reorder stages
   */
  async reorderStages(payload: ReorderStagesPayload): Promise<Stage[]> {
    // Validate payload
    if (!payload.stages || !Array.isArray(payload.stages)) {
      throw new Error('Invalid payload: stages array is required');
    }

    if (payload.stages.length === 0) {
      throw new Error('No stages provided for reordering');
    }

    // Validate each stage in payload
    for (const stage of payload.stages) {
      if (!stage.id || typeof stage.position !== 'number') {
        throw new Error('Invalid stage data: id and position are required');
      }

      // Verify stage exists
      const existing = await stageRepository.getStageById(stage.id);
      if (!existing) {
        throw new Error(`Stage not found: ${stage.id}`);
      }
    }

    return await stageRepository.reorderStages(payload.stages);
  },

  /**
   * Get pipeline stages with statistics
   */
  async getPipelineStages(): Promise<PipelineStage[]> {
    return await stageRepository.getPipelineStages();
  },

  /**
   * Get default stages
   */
  async getDefaultStages(): Promise<Stage[]> {
    return await stageRepository.getDefaultStages();
  },

  /**
   * Initialize default stages if none exist
   */
  async initializeDefaultStages(userId?: string): Promise<Stage[]> {
    const existingStages = await stageRepository.getAllStages();
    
    if (existingStages.length > 0) {
      return existingStages;
    }

    const defaultStages: CreateStagePayload[] = [
      { name: 'Lead', color: 'from-blue-500 to-blue-600', is_default: true, position: 1 },
      { name: 'Quotation Sent', color: 'from-yellow-500 to-yellow-600', is_default: true, position: 2 },
      { name: 'Negotiation', color: 'from-orange-500 to-orange-600', is_default: true, position: 3 },
      { name: 'Confirmed', color: 'from-green-500 to-green-600', is_default: true, position: 4 },
      { name: 'Closed Won', color: 'from-emerald-500 to-emerald-600', is_default: true, position: 5 }
    ];

    const createdStages: Stage[] = [];
    
    for (const stage of defaultStages) {
      try {
        const createdStage = await stageRepository.createStage(stage, userId);
        createdStages.push(createdStage);
      } catch (error) {
        console.error(`Failed to create default stage ${stage.name}:`, error);
      }
    }

    return createdStages;
  }
};