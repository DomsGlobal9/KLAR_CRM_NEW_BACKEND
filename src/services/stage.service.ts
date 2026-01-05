import { StageRepository } from '../repositories/stage.repository';
import { 
  IStage, 
  ICreateStage, 
  IUpdateStage, 
  IStageFilters,
  IPipelineData,
  ApiResponse,
  PaginatedResponse
} from '../interfaces/stage.interface';
import { generateId } from '../utils/response.utils';

export class StageService {
  private stageRepository: StageRepository;

  constructor() {
    this.stageRepository = new StageRepository();
  }

  async createStage(stageData: ICreateStage): Promise<ApiResponse<IStage>> {
    try {
      // Validate required fields
      if (!stageData.name?.trim()) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Stage name is required'
        };
      }

      if (!stageData.color) {
        return {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Stage color is required'
        };
      }

      // Check if stage with same name already exists for this user
      const existingStages = await this.stageRepository.findAll({ 
        search: stageData.name,
        created_by: stageData.created_by 
      });
      
      const exactMatch = existingStages.find(s => 
        s.name.toLowerCase() === stageData.name.toLowerCase() && 
        s.created_by === stageData.created_by
      );
      
      if (exactMatch) {
        return {
          success: false,
          error: 'DUPLICATE_ERROR',
          message: `Stage "${stageData.name}" already exists`
        };
      }

      // If no position provided, add to end
      if (!stageData.position) {
        const count = await this.stageRepository.count({ created_by: stageData.created_by });
        stageData.position = count;
      }

      const stage = await this.stageRepository.create(stageData);
      
      return {
        success: true,
        data: stage,
        message: `Stage "${stage.name}" created successfully`
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: 'CREATE_ERROR',
        message: error.message || 'Failed to create stage'
      };
    }
  }

  async getStageById(id: string): Promise<ApiResponse<IStage>> {
    try {
      const stage = await this.stageRepository.findById(id);
      
      if (!stage) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Stage not found'
        };
      }
      
      return {
        success: true,
        data: stage
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.message || 'Failed to fetch stage'
      };
    }
  }

  async getAllStages(filters: IStageFilters = {}): Promise<PaginatedResponse<IStage[]>> {
    try {
      const [stages, total] = await Promise.all([
        this.stageRepository.findAll(filters),
        this.stageRepository.count(filters)
      ]);
      
      const response: PaginatedResponse<IStage[]> = {
        success: true,
        data: stages
      };
      
      // Add pagination info if page/limit provided
      if (filters.page && filters.limit) {
        response.pagination = {
          page: filters.page,
          limit: filters.limit,
          total: total,
          pages: Math.ceil(total / filters.limit)
        };
      }
      
      return response;
      
    } catch (error: any) {
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.message || 'Failed to fetch stages'
      };
    }
  }

  async updateStage(id: string, stageData: IUpdateStage): Promise<ApiResponse<IStage>> {
    try {
      // Check if stage exists
      const existingStage = await this.stageRepository.findById(id);
      
      if (!existingStage) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Stage not found'
        };
      }

      // If updating name, check for duplicates
      if (stageData.name && stageData.name !== existingStage.name) {
        const existingStages = await this.stageRepository.findAll({ 
          search: stageData.name,
          created_by: existingStage.created_by 
        });
        
        const duplicate = existingStages.find(s => 
          s.name.toLowerCase() === stageData.name.toLowerCase() && 
          s.id !== id
        );
        
        if (duplicate) {
          return {
            success: false,
            error: 'DUPLICATE_ERROR',
            message: `Stage "${stageData.name}" already exists`
          };
        }
      }

      const updatedStage = await this.stageRepository.update(id, stageData);
      
      return {
        success: true,
        data: updatedStage,
        message: 'Stage updated successfully'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: 'UPDATE_ERROR',
        message: error.message || 'Failed to update stage'
      };
    }
  }

  async deleteStage(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Check if stage exists
      const existingStage = await this.stageRepository.findById(id);
      
      if (!existingStage) {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Stage not found'
        };
      }

      // Check if it's a default stage (can't delete)
      if (existingStage.is_default) {
        return {
          success: false,
          error: 'PROTECTED_ERROR',
          message: 'Cannot delete default stage'
        };
      }

      await this.stageRepository.delete(id);
      
      return {
        success: true,
        data: true,
        message: 'Stage deleted successfully'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: 'DELETE_ERROR',
        message: error.message || 'Failed to delete stage'
      };
    }
  }

  async getPipelineData(userId?: string): Promise<ApiResponse<IPipelineData>> {
    try {
      const pipelineData = await this.stageRepository.getPipelineStats(userId);
      
      return {
        success: true,
        data: pipelineData
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: 'FETCH_ERROR',
        message: error.message || 'Failed to fetch pipeline data'
      };
    }
  }

  async initializeDefaultStages(userId: string): Promise<ApiResponse<IStage[]>> {
    try {
      const defaultStages = [
        { id: 'lead', name: 'Lead', color: 'from-blue-500 to-blue-600', position: 0, is_default: true },
        { id: 'quotation-sent', name: 'Quotation Sent', color: 'from-yellow-500 to-yellow-600', position: 1, is_default: true },
        { id: 'negotiation', name: 'Negotiation', color: 'from-orange-500 to-orange-600', position: 2, is_default: true },
        { id: 'confirmed', name: 'Confirmed', color: 'from-green-500 to-green-600', position: 3, is_default: true },
        { id: 'closed-won', name: 'Closed Won', color: 'from-emerald-500 to-emerald-600', position: 4, is_default: true }
      ];

      const createdStages: IStage[] = [];
      
      for (const defaultStage of defaultStages) {
        const stageData: ICreateStage = {
          ...defaultStage,
          created_by: userId
        };
        
        try {
          const stage = await this.stageRepository.create(stageData);
          createdStages.push(stage);
        } catch (error) {
          // Stage might already exist, continue
          continue;
        }
      }
      
      return {
        success: true,
        data: createdStages,
        message: 'Default stages initialized'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: 'INIT_ERROR',
        message: error.message || 'Failed to initialize default stages'
      };
    }
  }
}
