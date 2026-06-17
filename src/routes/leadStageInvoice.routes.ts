import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { leadStageInvoiceController } from '../controllers/leadStageInvoice.controller';

const router = Router();

// Path payload pipeline map matching the frontend: POST /api/invoice/convert-from-voucher
router.post('/submit', authenticate, leadStageInvoiceController.generateInvoiceFromVoucher);

export default router;