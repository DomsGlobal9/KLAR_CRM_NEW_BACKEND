import { Request, Response } from 'express';
import { serviceService } from '../services';
import {
    ICreateServiceDTO,
    IUpdateServiceDTO,
    ICreateSubServiceCategoryDTO,
    IUpdateSubServiceCategoryDTO,
    ICreateSubServiceDTO,
    IUpdateSubServiceDTO,
    IServiceFilter,
    ISubServiceCategoryFilter,
    ISubServiceFilter,
    IService
} from '../interfaces';

export const serviceController = {
    // ============ Service Controllers ============

    /**
     * Create a new service
     */
    async createService(req: Request, res: Response) {
        try {
            const payload: ICreateServiceDTO = req.body;
            const service = await serviceService.createService(payload);

            res.status(201).json({
                success: true,
                message: 'Service created successfully',
                data: service
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create service',
                error: error.message
            });
        }
    },

    /**
     * Get service by ID
     */
    async getServiceById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const service = await serviceService.getServiceById(id as string);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            res.status(200).json({
                success: true,
                data: service
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch service',
                error: error.message
            });
        }
    },

    /**
     * Get service by ID with relations
     */
    async getServiceWithRelations(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const service = await serviceService.getServiceWithRelations(id as string);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            res.status(200).json({
                success: true,
                data: service
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch service with relations',
                error: error.message
            });
        }
    },

    /**
     * Get all services
     */
    async getAllServices(req: Request, res: Response) {
        try {
            const filter: IServiceFilter = {
                search: req.query.search as string,
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const services = await serviceService.getAllServices(filter);

            res.status(200).json({
                success: true,
                data: services,
                count: services.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch services',
                error: error.message
            });
        }
    },

    /**
     * Get all services with only id and name (for UI dropdowns)
     */
    async getAllServicesMinimal(req: Request, res: Response) {
        try {
            const filter: IServiceFilter = {
                search: req.query.search as string,
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : true,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const services = await serviceService.getAllServices(filter);

            const minimalServices = services.map(service => ({
                id: service.id,
                name: service.name,
                code: service.code,
                is_active: service.is_active,
                description: service.description,
                icon: service.icon,
                display_order: service.display_order
            }));

            res.status(200).json({
                success: true,
                data: minimalServices,
                count: minimalServices.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch services',
                error: error.message
            });
        }
    },

    /**
     * Get service by ID with its categories and sub-services
     * This is called when user clicks on a service in UI
     */
    async getServiceCategoriesAndSubServices(req: Request, res: Response) {
        try {
            const { serviceId } = req.params;

            const service = await serviceService.getServiceById(serviceId as string);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            const categoriesFilter: ISubServiceCategoryFilter = {
                is_active: req.query.categories_active ? req.query.categories_active === 'true' : true,
                limit: req.query.categories_limit ? parseInt(req.query.categories_limit as string) : undefined,
                offset: req.query.categories_offset ? parseInt(req.query.categories_offset as string) : undefined
            };

            const categories = await serviceService.getSubServiceCategoriesByServiceId(
                serviceId as string,
                categoriesFilter
            );

            const categoriesWithSubServices = await Promise.all(
                categories.map(async (category) => {
                    const subServicesFilter: ISubServiceFilter = {
                        is_active: req.query.sub_services_active ? req.query.sub_services_active === 'true' : true,
                        limit: req.query.sub_services_limit ? parseInt(req.query.sub_services_limit as string) : undefined,
                        offset: req.query.sub_services_offset ? parseInt(req.query.sub_services_offset as string) : undefined
                    };

                    const subServices = await serviceService.getSubServicesByCategoryId(
                        category.id,
                        subServicesFilter
                    );

                    return {
                        category: {
                            id: category.id,
                            name: category.name,
                            code: category.code,
                            description: category.description,
                            input_type: category.input_type,
                            is_required: category.is_required,
                            display_order: category.display_order,
                            is_active: category.is_active
                        },
                        sub_services: subServices.map(sub => ({
                            id: sub.id,
                            name: sub.name,
                            code: sub.code,
                            description: sub.description,
                            icon: sub.icon,
                            display_order: sub.display_order,
                            is_active: sub.is_active,
                            metadata: sub.metadata
                        }))
                    };
                })
            );

            res.status(200).json({
                success: true,
                data: {
                    service: {
                        id: service.id,
                        name: service.name,
                        code: service.code,
                        description: service.description,
                        icon: service.icon,
                        is_active: service.is_active
                    },
                    categories: categoriesWithSubServices,
                    counts: {
                        categories: categoriesWithSubServices.length,
                        sub_services: categoriesWithSubServices.reduce(
                            (total, cat) => total + cat.sub_services.length, 0
                        )
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch service details',
                error: error.message
            });
        }
    },

    /**
     * Get all services with hierarchical structure
     */
    async getServicesHierarchyMinimal(req: Request, res: Response) {
        try {
            const filter: IServiceFilter = {
                is_active: req.query.is_active ? req.query.is_active === 'true' : true,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
                search: req.query.search as string
            };

            const includeSubCategories = req.query.sub_categories === 'true';
            const includeSubServices = req.query.sub_services === 'true';

            const shouldIncludeSubCategories = includeSubCategories || includeSubServices;

            if (shouldIncludeSubCategories) {
                const services = await serviceService.getAllServicesWithRelationsMinimal(
                    filter,
                    true,
                    includeSubServices
                );

                const hierarchy = services.map(service => {
                    const hierarchyData: any = {
                        service: {
                            id: service.id,
                            name: service.name,
                            code: service.code,
                            is_active: service.is_active
                        }
                    };

                    if (includeSubCategories && service.sub_service_categories.length > 0) {
                        hierarchyData.categories = service.sub_service_categories.map(category => {
                            const categoryHierarchy: any = {
                                category: {
                                    id: category.id,
                                    name: category.name,
                                    code: category.code,
                                    is_active: category.is_active,
                                    input_type: category.input_type,
                                    is_required: category.is_required,
                                    display_order: category.display_order
                                }
                            };

                            if (includeSubServices && category.sub_services && category.sub_services.length > 0) {
                                categoryHierarchy.sub_services = category.sub_services.map(subService => ({
                                    id: subService.id,
                                    name: subService.name,
                                    code: subService.code,
                                    description: subService.description,
                                    icon: subService.icon,
                                    is_active: subService.is_active,
                                    display_order: subService.display_order,
                                    metadata: subService.metadata
                                }));
                            }

                            return categoryHierarchy;
                        });
                    }

                    return hierarchyData;
                });

                return res.status(200).json({
                    success: true,
                    data: hierarchy,
                    count: hierarchy.length,
                    metadata: {
                        includes_sub_categories: includeSubCategories,
                        includes_sub_services: includeSubServices
                    }
                });
            } else {
                const services = await serviceService.getAllServices(filter);

                const minimalServices = services.map(service => ({
                    id: service.id,
                    name: service.name,
                    code: service.code,
                    is_active: service.is_active
                }));

                res.status(200).json({
                    success: true,
                    data: minimalServices,
                    count: minimalServices.length,
                    metadata: {
                        includes_sub_categories: false,
                        includes_sub_services: false
                    }
                });
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch services hierarchy',
                error: error.message
            });
        }
    },

    /**
     * Get all services with relations
     */
    async getAllServicesWithRelations(req: Request, res: Response) {
        try {
            const filter: IServiceFilter = {
                search: req.query.search as string,
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const services = await serviceService.getAllServicesWithRelations(filter);

            res.status(200).json({
                success: true,
                data: services,
                count: services.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch services with relations',
                error: error.message
            });
        }
    },

    /**
     * Update service
     */
    async updateService(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payload: IUpdateServiceDTO = req.body;

            const service = await serviceService.updateService(id as string, payload);

            res.status(200).json({
                success: true,
                message: 'Service updated successfully',
                data: service
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to update service',
                error: error.message
            });
        }
    },

    /**
     * Delete service
     */
    async deleteService(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await serviceService.deleteService(id as string);

            res.status(200).json({
                success: true,
                message: 'Service deleted successfully'
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to delete service',
                error: error.message
            });
        }
    },

    /**
     * Toggle service status
     */
    async toggleServiceStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            if (typeof is_active !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'is_active must be a boolean value'
                });
            }

            const service = await serviceService.toggleServiceStatus(id as string, is_active);

            res.status(200).json({
                success: true,
                message: `Service ${is_active ? 'activated' : 'deactivated'} successfully`,
                data: service
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to toggle service status',
                error: error.message
            });
        }
    },

    // ============ Sub-Service Category Controllers ============

    /**
     * Create sub-service category
     */
    async createSubServiceCategory(req: Request, res: Response) {
        try {
            const payload: ICreateSubServiceCategoryDTO = req.body;
            const category = await serviceService.createSubServiceCategory(payload);

            res.status(201).json({
                success: true,
                message: 'Sub-service category created successfully',
                data: category
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create sub-service category',
                error: error.message
            });
        }
    },

    /**
     * Get sub-service category by ID
     */
    async getSubServiceCategoryById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const category = await serviceService.getSubServiceCategoryById(id as string);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Sub-service category not found'
                });
            }

            res.status(200).json({
                success: true,
                data: category
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sub-service category',
                error: error.message
            });
        }
    },

    /**
     * Get sub-service categories by service ID
     */
    async getSubServiceCategoriesByServiceId(req: Request, res: Response) {
        try {
            const { serviceId } = req.params;
            const filter: ISubServiceCategoryFilter = {
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const categories = await serviceService.getSubServiceCategoriesByServiceId(serviceId as string, filter);

            res.status(200).json({
                success: true,
                data: categories,
                count: categories.length
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to fetch sub-service categories',
                error: error.message
            });
        }
    },

    /**
     * Get sub service category
     * @param req 
     * @param res 
     */
    async getSubServiceCategoriesOnlyByServiceId(req: Request, res: Response) {
        try {
            const { serviceId } = req.params;
            const filter: ISubServiceCategoryFilter = {
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const categories = await serviceService.getSubServiceCategoriesOnlyByServiceId(serviceId as string, filter);

            res.status(200).json({
                success: true,
                data: categories,
                count: categories.length
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to fetch sub-service categories',
                error: error.message
            });
        }
    },

    /**
     * Update sub-service category
     */
    async updateSubServiceCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payload: IUpdateSubServiceCategoryDTO = req.body;

            const category = await serviceService.updateSubServiceCategory(id as string, payload);

            res.status(200).json({
                success: true,
                message: 'Sub-service category updated successfully',
                data: category
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to update sub-service category',
                error: error.message
            });
        }
    },

    /**
     * Delete sub-service category
     */
    async deleteSubServiceCategory(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await serviceService.deleteSubServiceCategory(id as string);

            res.status(200).json({
                success: true,
                message: 'Sub-service category deleted successfully'
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to delete sub-service category',
                error: error.message
            });
        }
    },

    // ============ Sub-Service Controllers ============

    /**
     * Create sub-service
     */
    async createSubService(req: Request, res: Response) {
        try {
            const payload: ICreateSubServiceDTO = req.body;
            const subService = await serviceService.createSubService(payload);

            res.status(201).json({
                success: true,
                message: 'Sub-service created successfully',
                data: subService
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create sub-service',
                error: error.message
            });
        }
    },

    /**
     * Get sub-service by ID
     */
    async getSubServiceById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const subService = await serviceService.getSubServiceById(id as string);

            if (!subService) {
                return res.status(404).json({
                    success: false,
                    message: 'Sub-service not found'
                });
            }

            res.status(200).json({
                success: true,
                data: subService
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sub-service',
                error: error.message
            });
        }
    },

    /**
     * Get sub-services by category ID
     */
    async getSubServicesByCategoryId(req: Request, res: Response) {
        try {
            const { categoryId } = req.params;
            const filter: ISubServiceFilter = {
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const subServices = await serviceService.getSubServicesByCategoryId(categoryId as string, filter);

            res.status(200).json({
                success: true,
                data: subServices,
                count: subServices.length
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to fetch sub-services',
                error: error.message
            });
        }
    },

    /**
     * Get sub-services by service ID
     */
    async getSubServicesByServiceId(req: Request, res: Response) {
        try {
            const { serviceId } = req.params;
            const filter: ISubServiceFilter = {
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const subServices = await serviceService.getSubServicesByServiceId(serviceId as string, filter);

            res.status(200).json({
                success: true,
                data: subServices,
                count: subServices.length
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to fetch sub-services',
                error: error.message
            });
        }
    },

    /**
     * Update sub-service
     */
    async updateSubService(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payload: IUpdateSubServiceDTO = req.body;

            const subService = await serviceService.updateSubService(id as string, payload);

            res.status(200).json({
                success: true,
                message: 'Sub-service updated successfully',
                data: subService
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to update sub-service',
                error: error.message
            });
        }
    },

    /**
     * Delete sub-service
     */
    async deleteSubService(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await serviceService.deleteSubService(id as string);

            res.status(200).json({
                success: true,
                message: 'Sub-service deleted successfully'
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to delete sub-service',
                error: error.message
            });
        }
    },

    // ============ Helper Controllers ============

    /**
     * Get complete service hierarchy
     */
    async getServiceHierarchy(req: Request, res: Response) {
        try {
            const hierarchy = await serviceService.getServiceHierarchy();

            res.status(200).json({
                success: true,
                data: hierarchy,
                count: hierarchy.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch service hierarchy',
                error: error.message
            });
        }
    },

    /**
     * Search across services, categories, and sub-services
     */
    async searchServiceHierarchy(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query (q) is required'
                });
            }

            const results = await serviceService.searchServiceHierarchy(q);

            res.status(200).json({
                success: true,
                data: results,
                summary: {
                    services: results.services.length,
                    categories: results.categories.length,
                    sub_services: results.sub_services.length
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to search service hierarchy',
                error: error.message
            });
        }
    },

    /**
     * Health check endpoint
     */
    async healthCheck(req: Request, res: Response) {
        res.status(200).json({
            success: true,
            message: 'Service controller is working properly',
            timestamp: new Date().toISOString()
        });
    }
};