import { Request, Response } from 'express';
import { fileQuoteService } from '../services/file-quote.service';
import { AuthRequest } from '../middleware';

export const fileQuoteController = {

    /**
     * Generate quote from file-based itinerary
     * POST /api/v1/quote/file-itinerary/:fileItineraryId
     */
    async generateQuoteFromFileItinerary(req: Request, res: Response) {
        try {
            // ✅ FIX: Convert to string
            const fileItineraryId = Array.isArray(req.params.fileItineraryId)
                ? req.params.fileItineraryId[0]
                : req.params.fileItineraryId;

            if (!fileItineraryId) {
                return res.status(400).json({
                    success: false,
                    error: 'File itinerary ID is required'
                });
            }

            const payload = req.body;

            const result = await fileQuoteService.generateQuoteFromFileItinerary(
                fileItineraryId,
                payload
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(201).json(result);
        } catch (error: any) {
            console.error('Error generating quote from file itinerary:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get quote by ID (for file-based)
     * GET /api/v1/quote/file/:quoteId
     */
    async getFileQuoteById(req: Request, res: Response) {
        try {
            // ✅ FIX: Convert to string
            const quoteId = Array.isArray(req.params.quoteId)
                ? req.params.quoteId[0]
                : req.params.quoteId;

            if (!quoteId) {
                return res.status(400).json({
                    success: false,
                    error: 'Quote ID is required'
                });
            }

            const result = await fileQuoteService.getFileQuoteById(quoteId);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error getting file quote:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Update file quote
     * PUT /api/v1/quote/file/:quoteId
     */
    async updateFileQuote(req: Request, res: Response) {
        try {
            // ✅ FIX: Convert to string
            const quoteId = Array.isArray(req.params.quoteId)
                ? req.params.quoteId[0]
                : req.params.quoteId;

            if (!quoteId) {
                return res.status(400).json({
                    success: false,
                    error: 'Quote ID is required'
                });
            }

            const payload = req.body;

            const result = await fileQuoteService.updateFileQuote(quoteId, payload);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error updating file quote:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Delete file quote
     * DELETE /api/v1/quote/file/:quoteId
     */
    async deleteFileQuote(req: Request, res: Response) {
        try {
            // ✅ FIX: Convert to string
            const quoteId = Array.isArray(req.params.quoteId)
                ? req.params.quoteId[0]
                : req.params.quoteId;

            if (!quoteId) {
                return res.status(400).json({
                    success: false,
                    error: 'Quote ID is required'
                });
            }

            const result = await fileQuoteService.deleteFileQuote(quoteId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error deleting file quote:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get all file-based quotes
     * GET /api/v1/quote/file/all
     */
    async getAllFileQuotes(req: AuthRequest, res: Response) {
        try {
            const userDetails = req.user;
            const userRole = userDetails?.role;
            const userId = userDetails?.id;

            const filter = {
                search: req.query.search as string,
                status: req.query.status as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                sort_by: req.query.sort_by as string,
                sort_order: req.query.sort_order as 'asc' | 'desc'
            };

            const result = await fileQuoteService.getAllFileQuotes(filter, userRole, userId);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error getting file quotes:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Share file quote PDF
     * POST /api/v1/quote/file/:quoteId/share
     */
    async shareFileQuotePDF(req: Request, res: Response) {
        try {
            // ✅ FIX: Convert to string
            const quoteId = Array.isArray(req.params.quoteId)
                ? req.params.quoteId[0]
                : req.params.quoteId;

            if (!quoteId) {
                return res.status(400).json({
                    success: false,
                    error: 'Quote ID is required'
                });
            }

            const { sendVia } = req.body;

            const result = await fileQuoteService.shareFileQuotePDF(quoteId, sendVia);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error sharing file quote PDF:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
 * Download file quote PDF
 * GET /api/v1/quote/file/:quoteId/download
 */
    async downloadFileQuotePDF(req: Request, res: Response) {
        try {
            // Convert to string
            const quoteId = Array.isArray(req.params.quoteId)
                ? req.params.quoteId[0]
                : req.params.quoteId;

            if (!quoteId) {
                return res.status(400).json({
                    success: false,
                    error: 'Quote ID is required'
                });
            }

            const result = await fileQuoteService.downloadFileQuotePDF(quoteId);

            // ✅ Check if result is successful and has data
            if (!result.success || !result.data) {
                return res.status(400).json({
                    success: false,
                    error: result.error || 'Failed to download quote PDF'
                });
            }

            // ✅ Type guard: ensure data has pdfBuffer and fileName
            const { pdfBuffer, fileName } = result.data;

            if (!pdfBuffer || !fileName) {
                return res.status(500).json({
                    success: false,
                    error: 'Invalid PDF data or filename'
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            return res.send(pdfBuffer);

        } catch (error: any) {
            console.error('Error downloading file quote PDF:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};