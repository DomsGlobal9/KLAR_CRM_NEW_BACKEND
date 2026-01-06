import { Router } from 'express';
import { invoiceController } from '../controllers';

const router = Router();

// GET /api/invoices
router.get('/', invoiceController.getAllInvoices); 

// GET /api/invoices/stats/overview
router.get('/stats/overview', invoiceController.getInvoiceStats);

// GET /api/invoices/:id
router.get('/:id', invoiceController.getInvoiceById);

// POST /api/invoices
router.post('/', invoiceController.createInvoice);

// PATCH /api/invoices/:id
router.patch('/:id', invoiceController.updateInvoice);

// DELETE /api/invoices/:id
router.delete('/:id', invoiceController.deleteInvoice);

// PATCH /api/invoices/:id/mark-paid
router.patch('/:id/mark-paid', invoiceController.markAsPaid);

// PATCH /api/invoices/:id/mark-sent
router.patch('/:id/mark-sent', invoiceController.markAsSent);

export default router;