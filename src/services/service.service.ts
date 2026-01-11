import { serviceRepository } from '../repositories';
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
import { supabaseAdmin } from '../config';

export const serviceService = {
    // ============ IService Methods ============

    /**
     * Create a new service with validation
     */
    async createService(payload: ICreateServiceDTO): Promise<IService> {
        // Validate required fields
        if (!payload.name || !payload.code) {
            throw new Error('IService name and code are required');
        }

        // Check if code already exists
        const codeExists = await serviceRepository.serviceCodeExists(payload.code);
        if (codeExists) {
            throw new Error(`IService with code "${payload.code}" already exists`);
        }

        // Check if name already exists
        const nameExists = await serviceRepository.serviceNameExists(payload.name);
        if (nameExists) {
            throw new Error(`IService with name "${payload.name}" already exists`);
        }

        // Validate code format (alphanumeric, dashes, underscores)
        const codeRegex = /^[a-zA-Z0-9_-]+$/;
        if (!codeRegex.test(payload.code)) {
            throw new Error('IService code can only contain letters, numbers, dashes, and underscores');
        }

        // Validate display_order
        if (payload.display_order !== undefined && payload.display_order < 1) {
            throw new Error('Display order must be a positive number');
        }

        return await serviceRepository.createService(payload);
    },

    /**
     * Get service by ID
     */
    async getServiceById(id: string): Promise<IService | null> {
        return await serviceRepository.getServiceById(id);
    },

    /**
     * Get service by ID with relations
     */
    async getServiceWithRelations(id: string): Promise<IServiceWithRelations | null> {
        return await serviceRepository.getServiceWithRelations(id);
    },

    /**
     * Get all services
     */
    async getAllServices(filter: IServiceFilter = {}): Promise<IService[]> {
        return await serviceRepository.getAllServices(filter);
    },

    /**
     * Get all services with relations
     */
    async getAllServicesWithRelations(filter: IServiceFilter = {}): Promise<IServiceWithRelations[]> {
        return await serviceRepository.getAllServicesWithRelations(filter);
    },

    /**
     * Update service with validation
     */
    async updateService(id: string, payload: IUpdateServiceDTO): Promise<IService> {
        // Check if service exists
        const existingService = await serviceRepository.getServiceById(id);
        if (!existingService) {
            throw new Error('IService not found');
        }

        // Check if new code conflicts
        if (payload.code && payload.code !== existingService.code) {
            const codeExists = await serviceRepository.serviceCodeExists(payload.code, id);
            if (codeExists) {
                throw new Error(`IService with code "${payload.code}" already exists`);
            }

            // Validate code format
            const codeRegex = /^[a-zA-Z0-9_-]+$/;
            if (!codeRegex.test(payload.code)) {
                throw new Error('IService code can only contain letters, numbers, dashes, and underscores');
            }
        }

        // Check if new name conflicts
        if (payload.name && payload.name !== existingService.name) {
            const nameExists = await serviceRepository.serviceNameExists(payload.name, id);
            if (nameExists) {
                throw new Error(`IService with name "${payload.name}" already exists`);
            }
        }

        // Validate display_order
        if (payload.display_order !== undefined && payload.display_order < 1) {
            throw new Error('Display order must be a positive number');
        }

        return await serviceRepository.updateService(id, payload);
    },

    /**
     * Delete service
     */
    async deleteService(id: string): Promise<boolean> {
        // Check if service exists
        const existingService = await serviceRepository.getServiceById(id);
        if (!existingService) {
            throw new Error('IService not found');
        }

        return await serviceRepository.deleteService(id);
    },

    /**
     * Toggle service status
     */
    async toggleServiceStatus(id: string, isActive: boolean): Promise<IService> {
        const existingService = await serviceRepository.getServiceById(id);
        if (!existingService) {
            throw new Error('IService not found');
        }

        return await serviceRepository.toggleServiceStatus(id, isActive);
    },

    // ============ Sub-IService Category Methods ============

    /**
     * Create sub-service category with validation
     */
    async createSubServiceCategory(payload: ICreateSubServiceCategoryDTO): Promise<ISubServiceCategory> {
        // Validate required fields
        if (!payload.service_id || !payload.name || !payload.code) {
            throw new Error('IService ID, category name and code are required');
        }

        // Check if service exists
        const serviceExists = await serviceRepository.getServiceById(payload.service_id);
        if (!serviceExists) {
            throw new Error('IService not found');
        }

        // Check if category code already exists
        const codeExists = await serviceRepository.categoryCodeExists(payload.code);
        if (codeExists) {
            throw new Error(`Category with code "${payload.code}" already exists`);
        }

        // Validate code format
        const codeRegex = /^[a-zA-Z0-9_-]+$/;
        if (!codeRegex.test(payload.code)) {
            throw new Error('Category code can only contain letters, numbers, dashes, and underscores');
        }

        // Validate input_type
        const validInputTypes = ['select', 'multi_select', 'radio', 'checkbox', 'text', 'number'];
        if (payload.input_type && !validInputTypes.includes(payload.input_type)) {
            throw new Error(`Invalid input type. Must be one of: ${validInputTypes.join(', ')}`);
        }

        // Validate display_order
        if (payload.display_order !== undefined && payload.display_order < 1) {
            throw new Error('Display order must be a positive number');
        }

        return await serviceRepository.createSubServiceCategory(payload);
    },

    /**
     * Get sub-service category by ID
     */
    async getSubServiceCategoryById(id: string): Promise<ISubServiceCategoryWithRelations | null> {
        return await serviceRepository.getSubServiceCategoryById(id);
    },

    /**
     * Get sub-service categories by service ID
     */
    async getSubServiceCategoriesByServiceId(
        serviceId: string,
        filter: ISubServiceCategoryFilter = {}
    ): Promise<ISubServiceCategoryWithRelations[]> {
        // Check if service exists
        const serviceExists = await serviceRepository.getServiceById(serviceId);
        if (!serviceExists) {
            throw new Error('IService not found');
        }

        return await serviceRepository.getSubServiceCategoriesByServiceId(serviceId, filter);
    },

    /**
     * Update sub-service category
     */
    async updateSubServiceCategory(id: string, payload: IUpdateSubServiceCategoryDTO): Promise<ISubServiceCategory> {
        // Check if category exists
        const existingCategory = await serviceRepository.getSubServiceCategoryById(id);
        if (!existingCategory) {
            throw new Error('Sub-service category not found');
        }

        // Check if new code conflicts
        if (payload.code && payload.code !== existingCategory.code) {
            const codeExists = await serviceRepository.categoryCodeExists(payload.code, id);
            if (codeExists) {
                throw new Error(`Category with code "${payload.code}" already exists`);
            }

            // Validate code format
            const codeRegex = /^[a-zA-Z0-9_-]+$/;
            if (!codeRegex.test(payload.code)) {
                throw new Error('Category code can only contain letters, numbers, dashes, and underscores');
            }
        }

        // Validate input_type
        if (payload.input_type) {
            const validInputTypes = ['select', 'multi_select', 'radio', 'checkbox', 'text', 'number'];
            if (!validInputTypes.includes(payload.input_type)) {
                throw new Error(`Invalid input type. Must be one of: ${validInputTypes.join(', ')}`);
            }
        }

        // Validate display_order
        if (payload.display_order !== undefined && payload.display_order < 1) {
            throw new Error('Display order must be a positive number');
        }

        return await serviceRepository.updateSubServiceCategory(id, payload);
    },

    /**
     * Delete sub-service category
     */
    async deleteSubServiceCategory(id: string): Promise<boolean> {
        const existingCategory = await serviceRepository.getSubServiceCategoryById(id);
        if (!existingCategory) {
            throw new Error('Sub-service category not found');
        }

        return await serviceRepository.deleteSubServiceCategory(id);
    },

    // ============ Sub-IService Methods ============

    /**
     * Create sub-service with validation
     */
    async createSubService(payload: ICreateSubServiceDTO): Promise<ISubService> {
        // Validate required fields
        if (!payload.sub_service_category_id || !payload.name || !payload.code) {
            throw new Error('Category ID, sub-service name and code are required');
        }

        // Check if category exists
        const categoryExists = await serviceRepository.getSubServiceCategoryById(payload.sub_service_category_id);
        if (!categoryExists) {
            throw new Error('Sub-service category not found');
        }

        // Check if sub-service code already exists
        const codeExists = await serviceRepository.subServiceCodeExists(payload.code);
        if (codeExists) {
            throw new Error(`Sub-service with code "${payload.code}" already exists`);
        }

        // Validate code format
        const codeRegex = /^[a-zA-Z0-9_-]+$/;
        if (!codeRegex.test(payload.code)) {
            throw new Error('Sub-service code can only contain letters, numbers, dashes, and underscores');
        }

        // Validate display_order
        if (payload.display_order !== undefined && payload.display_order < 1) {
            throw new Error('Display order must be a positive number');
        }

        return await serviceRepository.createSubService(payload);
    },

    /**
     * Get sub-service by ID
     */
    async getSubServiceById(id: string): Promise<ISubServiceWithRelations | null> {
        return await serviceRepository.getSubServiceById(id);
    },

    /**
     * Get sub-services by category ID
     */
    async getSubServicesByCategoryId(
        categoryId: string,
        filter: ISubServiceFilter = {}
    ): Promise<ISubService[]> {
        // Check if category exists
        const categoryExists = await serviceRepository.getSubServiceCategoryById(categoryId);
        if (!categoryExists) {
            throw new Error('Sub-service category not found');
        }

        return await serviceRepository.getSubServicesByCategoryId(categoryId, filter);
    },

    /**
     * Get sub-services by service ID
     */
    async getSubServicesByServiceId(
        serviceId: string,
        filter: ISubServiceFilter = {}
    ): Promise<ISubServiceWithRelations[]> {
        // Check if service exists
        const serviceExists = await serviceRepository.getServiceById(serviceId);
        if (!serviceExists) {
            throw new Error('IService not found');
        }

        return await serviceRepository.getSubServicesByServiceId(serviceId, filter);
    },

    /**
     * Update sub-service
     */
    async updateSubService(id: string, payload: IUpdateSubServiceDTO): Promise<ISubService> {
        // Check if sub-service exists
        const existingSubService = await serviceRepository.getSubServiceById(id);
        if (!existingSubService) {
            throw new Error('Sub-service not found');
        }

        // Check if new code conflicts
        if (payload.code && payload.code !== existingSubService.code) {
            const codeExists = await serviceRepository.subServiceCodeExists(payload.code, id);
            if (codeExists) {
                throw new Error(`Sub-service with code "${payload.code}" already exists`);
            }

            // Validate code format
            const codeRegex = /^[a-zA-Z0-9_-]+$/;
            if (!codeRegex.test(payload.code)) {
                throw new Error('Sub-service code can only contain letters, numbers, dashes, and underscores');
            }
        }

        // Validate display_order
        if (payload.display_order !== undefined && payload.display_order < 1) {
            throw new Error('Display order must be a positive number');
        }

        return await serviceRepository.updateSubService(id, payload);
    },

    /**
     * Delete sub-service
     */
    async deleteSubService(id: string): Promise<boolean> {
        const existingSubService = await serviceRepository.getSubServiceById(id);
        if (!existingSubService) {
            throw new Error('Sub-service not found');
        }

        return await serviceRepository.deleteSubService(id);
    },

    // ============ Helper Methods ============

    /**
     * Get complete service hierarchy
     */
    async getServiceHierarchy(): Promise<IServiceWithRelations[]> {
        const services = await serviceRepository.getAllServices({ is_active: true });

        const servicesWithHierarchy = await Promise.all(
            services.map(async (service) => {
                const categories = await serviceRepository.getSubServiceCategoriesByServiceId(service.id, { is_active: true });

                const categoriesWithSubServices = await Promise.all(
                    categories.map(async (category) => {
                        const subServices = await serviceRepository.getSubServicesByCategoryId(category.id, { is_active: true });
                        return {
                            ...category,
                            sub_services: subServices
                        };
                    })
                );

                return {
                    ...service,
                    sub_service_categories: categoriesWithSubServices
                };
            })
        );

        return servicesWithHierarchy;
    },

    /**
     * Search across services, categories, and sub-services
     */
    async searchServiceHierarchy(searchTerm: string): Promise<{
        services: IService[];
        categories: ISubServiceCategoryWithRelations[];
        sub_services: ISubServiceWithRelations[];
    }> {
        // Search services
        const services = await serviceRepository.getAllServices({
            search: searchTerm,
            is_active: true
        });

        // Search categories with their services
        const { data: categoriesData } = await supabaseAdmin
            .from('sub_service_categories')
            .select(`
        *,
        service:services (*)
      `)
            .ilike('name', `%${searchTerm}%`)
            .eq('is_active', true)
            .limit(20);

        const categories = (categoriesData || []).map(cat => ({
            ...cat,
            sub_services: []
        })) as ISubServiceCategoryWithRelations[];

        // Search sub-services with their categories and services
        const { data: subServicesData } = await supabaseAdmin
            .from('sub_services')
            .select(`
        *,
        sub_service_category:sub_service_categories (
          *,
          service:services (*)
        )
      `)
            .ilike('name', `%${searchTerm}%`)
            .eq('is_active', true)
            .limit(20);

        const sub_services = (subServicesData || []) as ISubServiceWithRelations[];

        return {
            services,
            categories,
            sub_services
        };
    }
};