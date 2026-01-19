import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller';

const router = Router();

// Quote CRUD routes
router.post('/', quoteController.createQuote);
router.get('/', quoteController.getAllQuotes);
router.get('/recent', quoteController.getRecentQuotes);
router.get('/search', quoteController.searchQuotes);
router.get('/stats', quoteController.getQuoteStatistics);
router.get('/generate-number', quoteController.generateQuoteNumber);

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