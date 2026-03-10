import { Router } from 'express';
import { invoiceController } from '../controllers';
import { authenticate, requireRole } from '../middleware';

const router = Router();
router.use(authenticate, requireRole('superadmin', 'admin', 'rm', 'tl'));


// GET  /api/v1/invoice
router.get('/', invoiceController.getAllInvoices);


// POST /api/v1/invoice/convert-from-quote  ← MUST stay above /:id routes
router.post('/convert-from-quote', invoiceController.convertQuoteToInvoice);

// POST /api/v1/invoice
router.post('/', invoiceController.createInvoice);

// GET  /api/v1/invoice/stats/overview
router.get('/stats/overview', invoiceController.getInvoiceStats);


// ─── Dynamic /:id routes AFTER all named routes ───────────────────────────────

// GET    /api/v1/invoice/:id
router.get('/:id', invoiceController.getInvoiceById);

// PATCH  /api/v1/invoice/:id
// router.patch('/:id', invoiceController.updateInvoice);

// DELETE /api/v1/invoice/:id
router.delete('/:id', invoiceController.deleteInvoice);

// PATCH  /api/v1/invoice/:id/mark-paid
router.patch('/:id/mark-paid', invoiceController.markAsPaid);

// PATCH  /api/v1/invoice/:id/mark-sent
router.patch('/:id/mark-sent', invoiceController.markAsSent);



export default router;