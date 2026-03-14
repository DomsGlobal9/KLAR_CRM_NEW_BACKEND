import { Request, Response } from 'express';
import { itineraryPreferencesService, quoteService } from '../services';
import {
    ICreateQuoteDTO,
    IUpdateQuoteDTO,
    IQuoteFilter
} from '../interfaces';
import { AuthRequest } from '../middleware';
import { pdfService } from '../services/invoicePdf.service';
import { travelDocumentService } from '../services/itinerary-quotePdf';
import { supabaseAdmin } from '../config/supabase.config';
import { quotePdfService } from '../services/quote-pdf.service';
import { s3UploadService } from '../services/s3-upload.service';
import { DeliveryOptions, formatDeliveryResponse, processPDFDelivery } from '../helpers/pdfDelivery.helper';

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


    /**
     * PDF for Itinerary and Quotation
     */
    async downloadProposalPDF(req: Request, res: Response) {
        try {
            const { quoteId } = req.params;

            // 1. Fetch data from Quote Repository
            const quoteResult = await quoteService.getQuoteById(quoteId as string);
            if (!quoteResult.success) throw new Error("Quote data missing");
            const quote = quoteResult.data;

            // 2. Fetch data from Itinerary Preference Repository using lead_id
            const leadId = quote.lead_id;
            const itinResult = await itineraryPreferencesService.getPreferences(leadId);
            if (!itinResult.success) throw new Error("Itinerary details missing");
            const itinerary = itinResult.data;

            // 3. Generate HTML & PDF Buffer
            const html = await travelDocumentService.generateTravelProposalHTML(itinerary, quote);
            const pdfBuffer = await travelDocumentService.generatePDFBuffer(html);

            // 4. Stream response
            const filename = `Klar_Proposal_${quote.quote_number}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            return res.send(pdfBuffer);

        } catch (error: any) {
            console.error("PDF Workflow Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },






    /**
     * Pdf for Quotation 
     */

    async downloadQuoteOnlyPDF(req: Request, res: Response) {
        const { quoteId } = req.params;
        const quoteResult = await quoteService.getQuoteById(quoteId as string);
        const html = await quotePdfService.generateHTML(quoteResult.data);
        const buffer = await quotePdfService.generateBuffer(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Quotation.pdf"');
        return res.send(buffer);
    },

    /**
     * Generates Quotation PDF, uploads to S3, and returns the public link
     * API: GET /api/v1/quote/:quoteId/share-quotation
     */
    async shareQuotationPDF(req: Request, res: Response) {
        try {
            const { quoteId } = req.params;
            const { sendVia } = req.body;

            // 1. Fetch Quote Data
            const quoteResult = await quoteService.getQuoteById(quoteId as string);
            if (!quoteResult.success || !quoteResult.data) {
                return res.status(404).json({ success: false, message: "Quote not found" });
            }
            const quote = quoteResult.data;

            // 2. Generate PDF Buffer
            const html = await quotePdfService.generateHTML(quote);
            const buffer = await quotePdfService.generateBuffer(html);

            // 3. Prepare unique filename
            const clientName = quote.client_name?.replace(/\s+/g, '_') || 'client';
            const fileName = `quotation_${quote.quote_number}_${clientName}.pdf`;

            // 4. Upload to S3 using your existing service
            const publicUrl = await s3UploadService.uploadToS3(buffer, fileName);

            // 5. Prepare delivery options
            const deliveryOptions: DeliveryOptions = {
                leadId: quote.lead_id,
                clientName: quote.client_name || 'Client',
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                pdfUrl: publicUrl,
                pdfFileName: fileName
            };

            // 6. Process delivery based on sendVia options
            const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

            // 7. Return the JSON response with delivery info
            return res.status(200).json({
                success: true,
                message: "Quotation uploaded to S3 successfully",
                data: {
                    quote_number: quote.quote_number,
                    public_url: publicUrl,
                    lead_id: quote.lead_id,
                    delivery: formatDeliveryResponse(deliveryResult, quote.client_phone, quote.client_email),
                    note: "This URL is permanent and can be shared with the client"
                }
            });

        } catch (error: any) {
            console.error("Quotation S3 Workflow Error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to process and share quotation PDF",
                error: error.message,
                delivery: {
                    success: false,
                    message: "Failed to process quotation",
                    error: error.message
                }
            });
        }
    },

    /**
     * Generates combined Itinerary & Quotation PDF, uploads to S3, and returns the public link
     * API: GET /api/v1/quote/:quoteId/share-proposal
     */
    async shareProposalPDF(req: Request, res: Response) {
        try {
            const { quoteId } = req.params;
            const { sendVia } = req.body;

            // 1. Fetch data from Quote Repository
            const quoteResult = await quoteService.getQuoteById(quoteId as string);
            if (!quoteResult.success || !quoteResult.data) {
                throw new Error("Quote data missing");
            }
            const quote = quoteResult.data;

            // 2. Fetch data from Itinerary Preference Repository using lead_id
            const leadId = quote.lead_id;
            const itinResult = await itineraryPreferencesService.getPreferences(leadId);
            if (!itinResult.success || !itinResult.data) {
                throw new Error("Itinerary details missing");
            }
            const itinerary = itinResult.data;

            // 3. Generate HTML & PDF Buffer
            const html = await travelDocumentService.generateTravelProposalHTML(itinerary, quote);
            const pdfBuffer = await travelDocumentService.generatePDFBuffer(html);

            // 4. Prepare unique filename
            const clientName = quote.client_name?.replace(/\s+/g, '_') || 'client';
            const fileName = `proposal_${quote.quote_number}_${clientName}.pdf`;

            // 5. Upload to S3 using your existing s3-upload.service.ts
            const publicUrl = await s3UploadService.uploadToS3(pdfBuffer, fileName);

            // 6. Prepare delivery options
            const deliveryOptions: DeliveryOptions = {
                leadId: quote.lead_id,
                clientName: quote.client_name || 'Client',
                clientEmail: quote.client_email,
                clientPhone: quote.client_phone,
                pdfUrl: publicUrl,
                pdfFileName: fileName
            };

            // 7. Process delivery based on sendVia options
            const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

            // 8. Return the JSON response with delivery info
            return res.status(200).json({
                success: true,
                message: "Proposal PDF uploaded to S3 successfully",
                data: {
                    quote_number: quote.quote_number,
                    public_url: publicUrl,
                    lead_id: quote.lead_id,
                    delivery: formatDeliveryResponse(deliveryResult, quote.client_phone, quote.client_email),
                    note: "This URL is permanent and can be shared with the client"
                }
            });

        } catch (error: any) {
            console.error("Proposal S3 Workflow Error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to process and share proposal PDF",
                error: error.message,
                delivery: {
                    success: false,
                    message: "Failed to process proposal",
                    error: error.message
                }
            });
        }
    }

};


