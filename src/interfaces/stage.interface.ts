export interface IStage {
  id: string;
  name: string;
  color: string; // Tailwind gradient class
  position?: number;
  is_default?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ICreateStage {
  name: string;
  color: string;
  position?: number;
  created_by?: string;
}

export interface IUpdateStage {
  name?: string;
  color?: string;
  position?: number;
}

export interface IStageFilters {
  search?: string;
  sort_by?: 'name' | 'position' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  created_by?: string;
}

export interface IPipelineData {
  [stageId: string]: {
    count: number;
    total_value: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
