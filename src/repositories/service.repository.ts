import { supabaseAdmin } from '../config';
import {
    IService,
    ISubServiceCategory,
    ISubService,
    IServiceWithRelations,
    ISubServiceCategoryWithRelations,
    ISubServiceWithRelations,
    ICreateServiceDTO,
    IUpdateServiceDTO,
    ICreateSubServiceCategoryDTO,
    IUpdateSubServiceCategoryDTO,
    ICreateSubServiceDTO,
    IUpdateSubServiceDTO,
    IServiceFilter,
    ISubServiceCategoryFilter,
    ISubServiceFilter
} from '../interfaces/service.interface';

export const serviceRepository = {
    
    // ============ IService CRUD ============

    /**
     * Create a new service
     */
    async createService(payload: ICreateServiceDTO): Promise<IService> {
        const { data, error } = await supabaseAdmin
            .from('services')
            .insert({
                ...payload,
                display_order: payload.display_order || 1,
                is_active: payload.is_active !== undefined ? payload.is_active : true,
                metadata: payload.metadata || {}
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create service: ${error.message}`);
        }

        return data as IService;
    },

    /**
     * Get service by ID
     */
    async getServiceById(id: string): Promise<IService | null> {
        const { data, error } = await supabaseAdmin
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch service: ${error.message}`);
        }

        return data as IService;
    },

    /**
     * Get service by ID with relations
     */
    async getServiceWithRelations(id: string): Promise<IServiceWithRelations | null> {
        const { data: serviceData, error: serviceError } = await supabaseAdmin
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (serviceError) {
            if (serviceError.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch service: ${serviceError.message}`);
        }

        const service = serviceData as IService;

        // Get sub-service categories with their sub-services
        const { data: categoriesData, error: categoriesError } = await supabaseAdmin
            .from('sub_service_categories')
            .select(`
        *,
        sub_services (*)
      `)
            .eq('service_id', id)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (categoriesError) {
            throw new Error(`Failed to fetch sub-service categories: ${categoriesError.message}`);
        }

        const sub_service_categories = categoriesData.map(cat => ({
            ...cat,
            sub_services: cat.sub_services || []
        })) as ISubServiceCategoryWithRelations[];

        return {
            ...service,
            sub_service_categories
        };
    },

    /**
     * Get service by code
     */
    async getServiceByCode(code: string): Promise<IService | null> {
        const { data, error } = await supabaseAdmin
            .from('services')
            .select('*')
            .eq('code', code)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch service by code: ${error.message}`);
        }

        return data as IService;
    },

    /**
     * Get all services
     */
    async getAllServices(filter: IServiceFilter = {}): Promise<IService[]> {
        let query = supabaseAdmin
            .from('services')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        // Apply filters
        if (filter.search) {
            query = query.or(`name.ilike.%${filter.search}%,code.ilike.%${filter.search}%`);
        }

        if (filter.is_active !== undefined) {
            query = query.eq('is_active', filter.is_active);
        }

        if (filter.limit) {
            query = query.limit(filter.limit);
        }

        if (filter.offset) {
            query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch services: ${error.message}`);
        }

        return data as IService[];
    },

    /**
     * Get all services with relations
     */
    async getAllServicesWithRelations(filter: IServiceFilter = {}): Promise<IServiceWithRelations[]> {
        const services = await this.getAllServices(filter);

        // Fetch categories and sub-services for each service
        const servicesWithRelations = await Promise.all(
            services.map(async (service) => {
                const { data: categoriesData } = await supabaseAdmin
                    .from('sub_service_categories')
                    .select(`
            *,
            sub_services (*)
          `)
                    .eq('service_id', service.id)
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                const sub_service_categories = (categoriesData || []).map(cat => ({
                    ...cat,
                    sub_services: cat.sub_services || []
                })) as ISubServiceCategoryWithRelations[];

                return {
                    ...service,
                    sub_service_categories
                };
            })
        );

        return servicesWithRelations;
    },

    /**
     * Update service
     */
    async updateService(id: string, payload: IUpdateServiceDTO): Promise<IService> {
        const { data, error } = await supabaseAdmin
            .from('services')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update service: ${error.message}`);
        }

        return data as IService;
    },

    /**
     * Delete service (cascade will delete categories and sub-services)
     */
    async deleteService(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete service: ${error.message}`);
        }

        return true;
    },

    /**
     * Toggle service active status
     */
    async toggleServiceStatus(id: string, isActive: boolean): Promise<IService> {
        const { data, error } = await supabaseAdmin
            .from('services')
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to toggle service status: ${error.message}`);
        }

        return data as IService;
    },

    // ============ Sub-IService Category CRUD ============

    /**
     * Create sub-service category
     */
    async createSubServiceCategory(payload: ICreateSubServiceCategoryDTO): Promise<ISubServiceCategory> {
        const { data, error } = await supabaseAdmin
            .from('sub_service_categories')
            .insert({
                ...payload,
                input_type: payload.input_type || 'select',
                is_required: payload.is_required || false,
                display_order: payload.display_order || 1,
                is_active: payload.is_active !== undefined ? payload.is_active : true
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create sub-service category: ${error.message}`);
        }

        return data as ISubServiceCategory;
    },

    /**
     * Get sub-service category by ID
     */
    async getSubServiceCategoryById(id: string): Promise<ISubServiceCategoryWithRelations | null> {
        const { data, error } = await supabaseAdmin
            .from('sub_service_categories')
            .select(`
        *,
        service:services (*),
        sub_services (*)
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch sub-service category: ${error.message}`);
        }

        return {
            ...data,
            service: data.service,
            sub_services: data.sub_services || []
        } as ISubServiceCategoryWithRelations;
    },

    /**
     * Get sub-service categories by service ID
     */
    async getSubServiceCategoriesByServiceId(
        serviceId: string,
        filter: IServiceFilter = {}
    ): Promise<ISubServiceCategoryWithRelations[]> {
        let query = supabaseAdmin
            .from('sub_service_categories')
            .select(`
        *,
        service:services (*),
        sub_services (*)
      `)
            .eq('service_id', serviceId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (filter.is_active !== undefined) {
            query = query.eq('is_active', filter.is_active);
        }

        if (filter.limit) {
            query = query.limit(filter.limit);
        }

        if (filter.offset) {
            query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch sub-service categories: ${error.message}`);
        }

        return data.map(item => ({
            ...item,
            service: item.service,
            sub_services: item.sub_services || []
        })) as ISubServiceCategoryWithRelations[];
    },

    /**
     * Update sub-service category
     */
    async updateSubServiceCategory(id: string, payload: IUpdateSubServiceCategoryDTO): Promise<ISubServiceCategory> {
        const { data, error } = await supabaseAdmin
            .from('sub_service_categories')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update sub-service category: ${error.message}`);
        }

        return data as ISubServiceCategory;
    },

    /**
     * Delete sub-service category (cascade will delete sub-services)
     */
    async deleteSubServiceCategory(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('sub_service_categories')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete sub-service category: ${error.message}`);
        }

        return true;
    },

    // ============ Sub-IService CRUD ============

    /**
     * Create sub-service
     */
    async createSubService(payload: ICreateSubServiceDTO): Promise<ISubService> {
        const { data, error } = await supabaseAdmin
            .from('sub_services')
            .insert({
                ...payload,
                display_order: payload.display_order || 1,
                is_active: payload.is_active !== undefined ? payload.is_active : true,
                metadata: payload.metadata || {}
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create sub-service: ${error.message}`);
        }

        return data as ISubService;
    },

    /**
     * Get sub-service by ID
     */
    async getSubServiceById(id: string): Promise<ISubServiceWithRelations | null> {
        const { data, error } = await supabaseAdmin
            .from('sub_services')
            .select(`
        *,
        sub_service_category:sub_service_categories (
          *,
          service:services (*)
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch sub-service: ${error.message}`);
        }

        return data as ISubServiceWithRelations;
    },

    /**
     * Get sub-services by category ID
     */
    async getSubServicesByCategoryId(
        categoryId: string,
        filter: ISubServiceFilter = {}
    ): Promise<ISubService[]> {
        let query = supabaseAdmin
            .from('sub_services')
            .select('*')
            .eq('sub_service_category_id', categoryId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (filter.is_active !== undefined) {
            query = query.eq('is_active', filter.is_active);
        }

        if (filter.limit) {
            query = query.limit(filter.limit);
        }

        if (filter.offset) {
            query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch sub-services: ${error.message}`);
        }

        return data as ISubService[];
    },

    /**
     * Get sub-services by service ID
     */
    async getSubServicesByServiceId(
        serviceId: string,
        filter: ISubServiceFilter = {}
    ): Promise<ISubServiceWithRelations[]> {
        let query = supabaseAdmin
            .from('sub_services')
            .select(`
        *,
        sub_service_category:sub_service_categories (
          *,
          service:services (*)
        )
      `)
            .eq('sub_service_categories.service_id', serviceId)
            .order('sub_services.display_order', { ascending: true });

        if (filter.is_active !== undefined) {
            query = query.eq('sub_services.is_active', filter.is_active);
        }

        if (filter.limit) {
            query = query.limit(filter.limit);
        }

        if (filter.offset) {
            query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch sub-services by service: ${error.message}`);
        }

        return data as ISubServiceWithRelations[];
    },

    /**
     * Update sub-service
     */
    async updateSubService(id: string, payload: IUpdateSubServiceDTO): Promise<ISubService> {
        const { data, error } = await supabaseAdmin
            .from('sub_services')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update sub-service: ${error.message}`);
        }

        return data as ISubService;
    },

    /**
     * Delete sub-service
     */
    async deleteSubService(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('sub_services')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete sub-service: ${error.message}`);
        }

        return true;
    },

    // ============ Utility Methods ============

    /**
     * Check if service code already exists
     */
    async serviceCodeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = supabaseAdmin
            .from('services')
            .select('id')
            .eq('code', code);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to check service code: ${error.message}`);
        }

        return (data?.length || 0) > 0;
    },

    /**
     * Check if service name already exists
     */
    async serviceNameExists(name: string, excludeId?: string): Promise<boolean> {
        let query = supabaseAdmin
            .from('services')
            .select('id')
            .eq('name', name);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to check service name: ${error.message}`);
        }

        return (data?.length || 0) > 0;
    },

    /**
     * Check if category code already exists
     */
    async categoryCodeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = supabaseAdmin
            .from('sub_service_categories')
            .select('id')
            .eq('code', code);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to check category code: ${error.message}`);
        }

        return (data?.length || 0) > 0;
    },

    /**
     * Check if sub-service code already exists
     */
    async subServiceCodeExists(code: string, excludeId?: string): Promise<boolean> {
        let query = supabaseAdmin
            .from('sub_services')
            .select('id')
            .eq('code', code);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to check sub-service code: ${error.message}`);
        }

        return (data?.length || 0) > 0;
    }
};