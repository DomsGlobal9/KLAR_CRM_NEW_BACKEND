import { Request, Response } from 'express';
import { quoteService } from '../services';
import { CreateQuoteDTO, UpdateQuoteDTO } from '../interfaces/quote.interface';

export const quoteController = {
    async getAllQuotes(req: Request, res: Response) {
        try {
            const quotes = await quoteService.getAllQuotes();
            res.json({ success: true, data: quotes });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch quotes' 
            });
        }
    },

    async getQuoteById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quote = await quoteService.getQuoteById(id);
            res.json({ success: true, data: quote });
        } catch (error: any) {
            if (error.message === 'Quote not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: error.message || 'Failed to fetch quote' 
                });
            }
        }
    },

    async getQuotesByLeadId(req: Request, res: Response) {
        try {
            const { lead_id } = req.params;
            const quotes = await quoteService.getQuotesByLeadId(lead_id);
            res.json({ success: true, data: quotes });
        } catch (error: any) {
            if (error.message === 'Lead not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: error.message || 'Failed to fetch quotes' 
                });
            }
        }
    },

    async createQuote(req: Request, res: Response) {
        try {
            console.log('Request body for creating quote:', req.body);
            const quoteData: CreateQuoteDTO = req.body;
            if (!quoteData.lead_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Lead ID is required' 
                });
            }

            console.log('Creating quote with data:', quoteData);
            const quote = await quoteService.createQuote(quoteData);
            res.status(201).json({ success: true, data: quote });
        } catch (error: any) {
            res.status(400).json({ 
                success: false, 
                message: error.message || 'Failed to create quote' 
            });
        }
    },

    async updateQuote(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData: UpdateQuoteDTO = req.body;
            const quote = await quoteService.updateQuote(id, updateData);
            res.json({ success: true, data: quote });
        } catch (error: any) {
            if (error.message === 'Quote not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: error.message || 'Failed to update quote' 
                });
            }
        }
    },

    async deleteQuote(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await quoteService.deleteQuote(id);
            res.json(result);
        } catch (error: any) {
            if (error.message === 'Quote not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: error.message || 'Failed to delete quote' 
                });
            }
        }
    },

    async getQuoteStats(req: Request, res: Response) {
        try {
            const stats = await quoteService.getQuoteStats();
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch quote stats' 
            });
        }
    },

    async convertToInvoice(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const invoice = await quoteService.convertQuoteToInvoice(id);
            res.json({ 
                success: true, 
                data: invoice, 
                message: 'Quote converted to invoice successfully' 
            });
        } catch (error: any) {
            if (error.message === 'Quote not found') {
                res.status(404).json({ success: false, message: error.message });
            } else if (error.message === 'Quote already converted to invoice') {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: error.message || 'Failed to convert quote to invoice' 
                });
            }
        }
    },

    async markAsAccepted(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quote = await quoteService.markQuoteAsAccepted(id);
            res.json({ success: true, data: quote, message: 'Quote marked as accepted' });
        } catch (error: any) {
            if (error.message === 'Quote not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: error.message || 'Failed to update quote status' 
                });
            }
        }
    },

    async markAsRejected(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quote = await quoteService.markQuoteAsRejected(id);
            res.json({ success: true, data: quote, message: 'Quote marked as rejected' });
        } catch (error: any) {
            if (error.message === 'Quote not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: error.message || 'Failed to update quote status' 
                });
            }
        }
    },

    async markAsSent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quote = await quoteService.markQuoteAsSent(id);
            res.json({ success: true, data: quote, message: 'Quote marked as sent' });
        } catch (error: any) {
            if (error.message === 'Quote not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: error.message || 'Failed to update quote status' 
                });
            }
        }
    }
};