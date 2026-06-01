import { Router } from 'express';
import { voucherController } from '../controllers/voucher.controller';
import { authenticate, requireRole } from '../middleware';

const router = Router();

// Global gateway security layer for all voucher interactions
router.use(authenticate, requireRole('superadmin', 'admin', 'rm', 'tl'));

// ============= STATIC ROUTES (no parameters) =============
router.post('/generate-number', voucherController.generateVoucherNumber);

// ============= PARAMETERIZED ROUTES =============
// Download PDF - expects: /voucher/download-pdf/:quoteId
router.get('/download-pdf/:quoteId', voucherController.downloadVoucherPDF);

// Share voucher - expects: /voucher/share-voucher/:quoteId  
router.post('/share-voucher/:quoteId', voucherController.shareVoucherPDF);

// ============= WILDCARD ROUTE (must be last) =============
// Get voucher by quote ID - expects: /voucher/:quoteId
router.get('/:quoteId', voucherController.getVoucherByQuoteId);

export default router;