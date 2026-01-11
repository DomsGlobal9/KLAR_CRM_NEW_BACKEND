/**
 * Base interfaces for Service hierarchy
 */
export interface IService {
    id: string;
    name: string;
    code: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order: number;
    is_active: boolean;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface ISubServiceCategory {
    id: string;
    service_id: string;
    name: string;
    code: string;
    description?: string;
    input_type: 'select' | 'multi_select' | 'radio' | 'checkbox' | 'text' | 'number';
    is_required: boolean;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ISubService {
    id: string;
    sub_service_category_id: string;
    name: string;
    code: string;
    description?: string;
    icon?: string;
    display_order: number;
    is_active: boolean;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface IServiceWithRelations extends IService {
    sub_service_categories: ISubServiceCategoryWithRelations[];
}

export interface ISubServiceCategoryWithRelations extends ISubServiceCategory {
    service?: IService;
    sub_services: ISubService[];
}

export interface ISubServiceWithRelations extends ISubService {
    sub_service_category?: ISubServiceCategoryWithRelations;
}

/**
 * Request DTOs
 */
export interface ICreateServiceDTO {
    name: string;
    code: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order?: number;
    is_active?: boolean;
    metadata?: Record<string, any>;
}

export interface IUpdateServiceDTO {
    name?: string;
    code?: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order?: number;
    is_active?: boolean;
    metadata?: Record<string, any>;
}

export interface ICreateSubServiceCategoryDTO {
    service_id: string;
    name: string;
    code: string;
    description?: string;
    input_type?: 'select' | 'multi_select' | 'radio' | 'checkbox' | 'text' | 'number';
    is_required?: boolean;
    display_order?: number;
    is_active?: boolean;
}

export interface IUpdateSubServiceCategoryDTO {
    name?: string;
    code?: string;
    description?: string;
    input_type?: 'select' | 'multi_select' | 'radio' | 'checkbox' | 'text' | 'number';
    is_required?: boolean;
    display_order?: number;
    is_active?: boolean;
}

export interface ICreateSubServiceDTO {
    sub_service_category_id: string;
    name: string;
    code: string;
    description?: string;
    icon?: string;
    display_order?: number;
    is_active?: boolean;
    metadata?: Record<string, any>;
}

export interface IUpdateSubServiceDTO {
    name?: string;
    code?: string;
    description?: string;
    icon?: string;
    display_order?: number;
    is_active?: boolean;
    metadata?: Record<string, any>;
}

/**
 * Filter interfaces
 */
export interface IServiceFilter {
    search?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
}

export interface ISubServiceCategoryFilter {
    service_id?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
}

export interface ISubServiceFilter {
    sub_service_category_id?: string;
    service_id?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
}