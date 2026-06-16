import { Router } from 'express';
import { leadStageVoucherController } from '../controllers/leadStageVoucher.controller';
import { authenticate,  } from '../middleware';

const router = Router();

// Endpoint paths: POST /api/lead-stage-vouchers/submit
router.post('/submit', authenticate, leadStageVoucherController.submitVoucherDetails);
router.get('/', authenticate, leadStageVoucherController.getAllVouchers);
router.get('/:id', authenticate, leadStageVoucherController.getVoucherById);

export default router;