import { Request, Response } from 'express';
import { itineraryPreferencesService, quoteService } from '../services';
import {
    ICreateQuoteDTO,
    IUpdateQuoteDTO,
    IQuoteFilter
} from '../interfaces';
import { AuthRequest } from '../middleware';
import { pdfService } from '../services/invoicePdf.service';
import { travelDocumentService } from '../services/travel-document.service';
import { supabaseAdmin } from '../config/supabase.config';

export const quoteController = {
    /**
     * Create a new quote
     */
    async createQuote(req: Request, res: Response) {
        try {

            const payload = req.body;

            console.log('Raw payload received:', JSON.stringify(payload, null, 2));


            const finalPayload = payload.quoteData || payload;

            const result = await quoteService.createQuote(finalPayload);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(201).json(result);
        } catch (error: any) {
            console.error('Error in createQuote controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get quote by ID
     */
    async getQuoteById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const result = await quoteService.getQuoteById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getQuoteById controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get quote by quote number
     */
    async getQuoteByNumber(req: Request, res: Response) {
        try {
            const { quoteNumber } = req.params;

            const result = await quoteService.getQuoteByNumber(quoteNumber as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getQuoteByNumber controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get all quotes
     */
    async getAllQuotes(req: AuthRequest, res: Response) {
        try {
            const userDetails = req.user;
            const userRole = userDetails?.role;
            const userId = userDetails?.id;

            const filter: IQuoteFilter = {
                search: req.query.search as string,
                status: req.query.status as string,
                client_email: req.query.client_email as string,
                itinerary_id: req.query.itinerary_id as string,
                from_date: req.query.from_date as string,
                to_date: req.query.to_date as string,
                page: req.query.page ? parseInt(req.query.page as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                sort_by: req.query.sort_by as string,
                sort_order: req.query.sort_order as 'asc' | 'desc'
            };

            const result = await quoteService.getAllQuotes(filter, userRole, userId);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getAllQuotes controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Update quote
     */
    async updateQuote(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payload: IUpdateQuoteDTO = req.body;

            const result = await quoteService.updateQuote(id as string, payload);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in updateQuote controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Delete quote
     */
    async deleteQuote(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const result = await quoteService.deleteQuote(id as string);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in deleteQuote controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Update quote status
     */
    async updateQuoteStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: 'Status is required'
                });
            }

            const result = await quoteService.updateQuoteStatus(id as string, status);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in updateQuoteStatus controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get quotes by itinerary
     */
    async getQuotesByItinerary(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;

            const result = await quoteService.getQuotesByItinerary(itineraryId as string);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getQuotesByItinerary controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get quotes by client email
     */
    async getQuotesByClientEmail(req: Request, res: Response) {
        try {
            const { email } = req.params;

            const result = await quoteService.getQuotesByClientEmail(email as string);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getQuotesByClientEmail controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get quote statistics
     */
    async getQuoteStatistics(req: Request, res: Response) {
        try {
            const result = await quoteService.getQuoteStatistics();

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getQuoteStatistics controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Get recent quotes
     */
    async getRecentQuotes(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

            const result = await quoteService.getRecentQuotes(limit);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getRecentQuotes controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Search quotes
     */
    async searchQuotes(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const result = await quoteService.searchQuotes(q as string, limit);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in searchQuotes controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },

    /**
     * Generate quote number
     */
    async generateQuoteNumber(req: Request, res: Response) {
        try {
            const result = await quoteService.generateQuoteNumber();

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in generateQuoteNumber controller:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    },






//     async downloadProposalPDF(req: Request, res: Response) {
//     try {
//         const { quoteId } = req.params;

//         // 1. Fetch Quote Data from Repository
//         const quoteResult = await quoteService.getQuoteById(quoteId);
//         if (!quoteResult.success || !quoteResult.data) {
//             return res.status(404).json({ success: false, message: "Quote not found" });
//         }
//         const quote = quoteResult.data;

//         // 2. Fetch Itinerary/Preferences using the lead_id from the quote
//         const leadId = quote.lead_id;
//         const itinResult = await itineraryPreferencesService.getPreferences(leadId);
//         if (!itinResult.success || !itinResult.data) {
//             return res.status(404).json({ success: false, message: "Itinerary details for this lead not found" });
//         }
//         const itinerary = itinResult.data;

//         // 3. Generate the HTML and PDF Buffer
//         // This uses the travelDocumentService we created earlier
//         const html = await travelDocumentService.generateTravelProposalHTML(itinerary, quote);
//         const pdfBuffer = await travelDocumentService.generatePDFBuffer(html);

//         // 4. Send PDF in Response
//         const filename = `Proposal_${quote.quote_number}.pdf`;
        
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//         res.setHeader('Content-Length', pdfBuffer.length);

//         return res.end(pdfBuffer);

//     } catch (error: any) {
//         console.error("Direct PDF Download Error:", error);
//         res.status(500).json({ 
//             success: false, 
//             message: "Failed to generate PDF response",
//             error: error.message 
//         });
//     }
// }











async downloadProposalPDF(req: Request, res: Response) {
    try {
        const { quoteId } = req.params;

        // 1. Fetch Quote Data
        const quoteResult = await quoteService.getQuoteById(quoteId);
        if (!quoteResult.success || !quoteResult.data) {
            return res.status(404).json({ success: false, message: "Quote not found" });
        }
        const quote = quoteResult.data;

        // 2. Fetch Itinerary/Preferences using lead_id
        const leadId = quote.lead_id;
        const itinResult = await itineraryPreferencesService.getPreferences(leadId);
        if (!itinResult.success || !itinResult.data) {
            return res.status(404).json({ success: false, message: "Itinerary details not found for this lead" });
        }
        const itinerary = itinResult.data;

        // 3. Generate HTML & PDF
        const html = await travelDocumentService.generateTravelProposalHTML(itinerary, quote);
        
        // Note: Using generatePDFBuffer to match the service fix
        const pdfBuffer = await travelDocumentService.generatePDFBuffer(html);

        // 4. Send Response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Proposal_${quote.quote_number}.pdf"`);
        return res.end(pdfBuffer);

    } catch (error: any) {
        console.error("PDF Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}






};


