import { Router } from 'express';
import { StageController } from '../controllers/stage.controller';
import { validateStage, validateUpdateStage } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const stageController = new StageController();

// Public routes (if needed)
router.get('/public/default-stages', stageController.initializeDefaultStages);

// Protected routes (require authentication)
router.use(authenticate);

// Stage CRUD operations
router.post('/', validateStage, stageController.createStage);
router.get('/', stageController.getAllStages);
router.get('/pipeline-data', stageController.getPipelineData);
router.get('/user/:userId', stageController.getStagesByUser);
router.get('/:id', stageController.getStage);
router.put('/:id', validateUpdateStage, stageController.updateStage);
router.delete('/:id', stageController.deleteStage);

// Initialize default stages for user
router.post('/initialize-default', stageController.initializeDefaultStages);

export default router;