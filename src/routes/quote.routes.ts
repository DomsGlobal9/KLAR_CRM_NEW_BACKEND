import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller';
import { authenticate, requireRole } from '../middleware';
import { fileQuoteController } from '../controllers/file-quote.controller';

const router = Router();
router.use(authenticate, requireRole('superadmin', 'admin', 'rm', 'tl'));

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




/**
 * Direct Download Itinerary Quotaion PDF
 * GET /api/quotes/:quoteId/download-proposal
 */
router.get('/:quoteId/download-proposal', quoteController.downloadProposalPDF);


//Get Quote only pdf
router.get('/:quoteId/download-quotation', quoteController.downloadQuoteOnlyPDF)


//Generate link (returns S3 Public URL)
router.post('/:quoteId/share-quotation', quoteController.shareQuotationPDF);

// Share Proposal (Returns S3 Public URL link)
router.post('/:quoteId/share-proposal', quoteController.shareProposalPDF);


// =============================================
// FILE-BASED QUOTE ROUTES
// =============================================

// Generate quote from file itinerary
router.post('/file-itinerary/:fileItineraryId', 
    fileQuoteController.generateQuoteFromFileItinerary
);

// Get all file-based quotes
router.get('/file/all', 
    fileQuoteController.getAllFileQuotes
);

// Get file quote by ID
router.get('/file/:quoteId', 
    fileQuoteController.getFileQuoteById
);

// Update file quote
router.put('/file/:quoteId', 
    fileQuoteController.updateFileQuote
);

// Delete file quote
router.delete('/file/:quoteId', 
    fileQuoteController.deleteFileQuote
);

// Share file quote PDF
router.post('/file/:quoteId/share', 
    fileQuoteController.shareFileQuotePDF
);

// Download file quote PDF
router.get('/file/:quoteId/download', 
    fileQuoteController.downloadFileQuotePDF
);


export default router;