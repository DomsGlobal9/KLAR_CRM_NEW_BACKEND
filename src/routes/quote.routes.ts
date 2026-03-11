import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller';
import { authenticate, requireRole } from '../middleware';

const router = Router();
router.use(authenticate, requireRole('superadmin', 'admin', 'rm'));

// Quote CRUD routes
router.post('/', quoteController.createQuote);
router.get('/', quoteController.getAllQuotes);
router.get('/recent', quoteController.getRecentQuotes);
router.get('/search', quoteController.searchQuotes);
router.get('/stats', quoteController.getQuoteStatistics);
router.get('/generate-number', quoteController.generateQuoteNumber);




// // Route to download unified PDF
// router.get('/download-pdf', quoteController.downloadPDF);

/**
 * Generate and get PDF URL
 * GET /api/quotes/:quoteId/generate-pdf
 */
// router.get('/:quoteId/generate-pdf', quoteController.generateAndStoreQuotePDF);



/**
 * Direct Download Proposal PDF
 * GET /api/quotes/:quoteId/download-proposal
 */
router.get('/:quoteId/download-proposal', quoteController.downloadProposalPDF);




// Quote by ID routes
router.get('/:id', quoteController.getQuoteById);
router.put('/:id', quoteController.updateQuote);
router.delete('/:id', quoteController.deleteQuote);
router.patch('/:id/status', quoteController.updateQuoteStatus);

// Quote by number
router.get('/number/:quoteNumber', quoteController.getQuoteByNumber);

// Quotes by relation routes
router.get('/itinerary/:itineraryId', quoteController.getQuotesByItinerary);
router.get('/client/:email', quoteController.getQuotesByClientEmail);




export default router;