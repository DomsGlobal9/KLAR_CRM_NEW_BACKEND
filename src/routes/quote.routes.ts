import { Router } from 'express';
import { quoteController } from '../controllers';

const router = Router();

// GET /api/quotes
router.get('/', quoteController.getAllQuotes);

// GET /api/quotes/stats/overview
router.get('/stats/overview', quoteController.getQuoteStats);

// GET /api/quotes/lead/:leadId
router.get('/lead/:leadId', quoteController.getQuotesByLeadId);

// GET /api/quotes/:id
router.get('/:id', quoteController.getQuoteById);

// POST /api/quotes
router.post('/', quoteController.createQuote);

// PATCH /api/quotes/:id
router.patch('/:id', quoteController.updateQuote);

// DELETE /api/quotes/:id
router.delete('/:id', quoteController.deleteQuote);

// POST /api/quotes/:id/convert-to-invoice
router.post('/:id/convert-to-invoice', quoteController.convertToInvoice);

// PATCH /api/quotes/:id/mark-accepted
router.patch('/:id/mark-accepted', quoteController.markAsAccepted);

// PATCH /api/quotes/:id/mark-rejected
router.patch('/:id/mark-rejected', quoteController.markAsRejected);

// PATCH /api/quotes/:id/mark-sent
router.patch('/:id/mark-sent', quoteController.markAsSent);

export default router;