import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { leadStageInvoiceController } from '../controllers/leadStageInvoice.controller';

const router = Router();

// Secure entire router space with authentication block
router.use(authenticate);

// Core Data persistence submission endpoint
router.post('/submit', authenticate, leadStageInvoiceController.generateInvoiceFromVoucher);

// Core Retrieval Pipeline - Place this above any dynamic dynamic /:invoice_id routes
router.get('/', authenticate, leadStageInvoiceController.getAllInvoices);

// Fetch a single lead stage invoice details by ID
router.get('/:invoice_id', authenticate, leadStageInvoiceController.getInvoiceById);

// Dynamic Document Rendering & Media Generation
router.get('/:invoice_id/download-pdf', authenticate, leadStageInvoiceController.downloadInvoicePDF);

// Cloud asset storage pipeline and communications distribution delivery endpoints
router.post('/:invoice_id/share-invoice', authenticate, leadStageInvoiceController.shareInvoiceDocument);

// Document deletion route mapping to safely trace drop requests 
router.delete('/:invoice_id', authenticate, leadStageInvoiceController.deleteInvoiceRecord);

// Dynamic Lead Stage Invoice Document Fetcher/Previewer
router.get('/:invoice_id/preview', authenticate, leadStageInvoiceController.getInvoicePreviewOrPDF);

export default router;