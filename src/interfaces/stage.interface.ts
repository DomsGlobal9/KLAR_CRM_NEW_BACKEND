export interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
  is_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStagePayload {
  name: string;
  color: string;
  position?: number;
  is_default?: boolean;
}

export interface UpdateStagePayload {
  name?: string;
  color?: string;
  position?: number;
  is_default?: boolean;
}

export interface StageFilter {
  search?: string;
  is_default?: boolean;
  limit?: number;
  offset?: number;
}

export interface PipelineStage extends Stage {
  deal_count: number;
  total_value: number;
}

export interface ReorderStagesPayload {
  stages: Array<{
    id: string;
    position: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}