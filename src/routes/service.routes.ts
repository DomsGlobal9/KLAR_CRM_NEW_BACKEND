import express from 'express';
import { serviceController } from '../controllers/service.controller';
import { authenticate, requireRole } from '../middleware';

const router = express.Router();

/**
 * Health check
 */
router.get('/health', serviceController.healthCheck);

/**
 * Get all services with only id and name (for UI dropdowns)
 */
router.get('/services-minimal', authenticate, requireRole('superadmin', 'admin', 'rm', 'tl'), serviceController.getAllServicesMinimal);

router.get('/services-hierarchy', serviceController.getServicesHierarchyMinimal);

/**
 * Get service with all categories and sub-services
 */
router.get('/:serviceId/full-details', serviceController.getServiceCategoriesAndSubServices);

// ***************************Service routes********************************


/**
 * API for create service
 */
router.post('/', serviceController.createService);

/**
 * API for get all services
 */
router.get('/', serviceController.getAllServices);


/**
 * API for get all services with relations
 */
router.get('/with-relations', serviceController.getAllServicesWithRelations);


/**
 * Api for get Services by ID
 */
router.get('/:id', serviceController.getServiceById);

/**
 * API for get service with relations
 */
router.get('/:id/with-relations', serviceController.getServiceWithRelations);

/**
 * API for put Update Service
 */
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);
router.patch('/:id/toggle-status', serviceController.toggleServiceStatus);

// Sub-service category routes
router.post('/sub-service-categories', serviceController.createSubServiceCategory);
router.get('/sub-service-categories/:id', serviceController.getSubServiceCategoryById);
router.get('/:serviceId/sub-service-categories', serviceController.getSubServiceCategoriesByServiceId);
router.get('/:serviceId/sub-service-categories-only', serviceController.getSubServiceCategoriesOnlyByServiceId);
router.put('/sub-service-categories/:id', serviceController.updateSubServiceCategory);
router.delete('/sub-service-categories/:id', serviceController.deleteSubServiceCategory);

// Sub-service routes
router.post('/sub-services', serviceController.createSubService);
router.get('/sub-services/:id', serviceController.getSubServiceById);
router.get('/sub-service-categories/:categoryId/sub-services', serviceController.getSubServicesByCategoryId);
router.get('/:serviceId/sub-services', serviceController.getSubServicesByServiceId);
router.put('/sub-services/:id', serviceController.updateSubService);
router.delete('/sub-services/:id', serviceController.deleteSubService);

// Helper routes
router.get('/hierarchy', serviceController.getServiceHierarchy);
router.get('/search', serviceController.searchServiceHierarchy);

export default router;