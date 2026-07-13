import { Router } from 'express';
import { leadStageVoucherController } from '../controllers/leadStageVoucher.controller';
import { authenticate,  } from '../middleware';

const router = Router();

// Endpoint paths: POST /api/lead-stage-vouchers/submit
router.post('/submit', authenticate, leadStageVoucherController.submitVoucherDetails);
router.get('/', authenticate, leadStageVoucherController.getAllVouchers);
router.get('/:id', authenticate, leadStageVoucherController.getVoucherById);

// Target dynamic workflow route pattern matching your specifications
router.post('/:id/share-voucher', authenticate, leadStageVoucherController.shareVoucherRequirements);

// NEW PREVIEW ROUTE: GET /api/lead-stage-vouchers/:id/preview
router.get('/:id/preview', authenticate, leadStageVoucherController.previewVoucherPDF);


// Map the download controller action method
router.get('/:id/download', leadStageVoucherController.downloadVoucherPDF);

export default router;