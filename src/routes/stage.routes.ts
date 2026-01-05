import express from 'express';
import { stageController } from '../controllers/stage.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticate);

// Stage CRUD operations
router.post('/', stageController.createStage);
router.get('/', stageController.getAllStages);
router.get('/pipeline', stageController.getPipelineStages);
router.get('/default', stageController.getDefaultStages);
router.get('/initialize', stageController.initializeDefaultStages);
router.get('/:id', stageController.getStageById);
router.put('/:id', stageController.updateStage);
router.delete('/:id', stageController.deleteStage);

// Special operations
router.patch('/reorder', stageController.reorderStages);

export default router;