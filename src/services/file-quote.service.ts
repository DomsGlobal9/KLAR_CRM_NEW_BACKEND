import { supabaseAdmin } from '../config';
import { quoteRepository } from '../repositories/quote.repository';
import { ICreateQuoteDTO } from '../interfaces';
import { s3UploadService } from '../services/s3-upload.service';
import { processPDFDelivery, DeliveryOptions, formatDeliveryResponse } from '../helpers/pdfDelivery.helper';
import { quotePdfService } from '../services/quote-pdf.service';

const isDeliverySuccessful = (result: any): boolean => {
    if (!result) return false;
    
    if (result.delivery) {
        return result.delivery.whatsapp?.sent === true || 
               result.delivery.email?.sent === true;
    }
    
    if (result.whatsapp || result.email) {
        return result.whatsapp?.sent === true || 
               result.email?.sent === true;
    }
    
    if (result.success !== undefined) {
        return result.success === true;
    }
    
    return false;
};

const getDeliveryDetails = (result: any): { whatsapp: boolean; email: boolean } => {
    if (!result) return { whatsapp: false, email: false };
    
    if (result.delivery) {
        return {
            whatsapp: result.delivery.whatsapp?.sent === true,
            email: result.delivery.email?.sent === true
        };
    }
    
    if (result.whatsapp || result.email) {
        return {
            whatsapp: result.whatsapp?.sent === true,
            email: result.email?.sent === true
        };
    }
    
    return { whatsapp: false, email: false };
};

export const fileQuoteService = {

    async generateQuoteFromFileItinerary(fileItineraryId: string, payload: any) {
        try {
            const { data: fileRecord, error: fileError } = await supabaseAdmin
                .from('user_itinerary_files')
                .select('*, lead:lead_id(*)')
                .eq('id', fileItineraryId)
                .single();

            if (fileError || !fileRecord) {
                return {
                    success: false,
                    error: 'File itinerary not found'
                };
            }

            const leadData = fileRecord.lead;
            const uploadedFiles = fileRecord.metadata?.attachment_urls || fileRecord.files || {};

            const serviceItems = Object.entries(uploadedFiles).map(([serviceType, files]: [string, any]) => {
                const serviceName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1).toLowerCase();
                return {
                    service_id: serviceType,
                    service_name: serviceName,
                    service_code: serviceType.toLowerCase(),
                    file_count: Array.isArray(files) ? files.length : 0,
                    files: Array.isArray(files) ? files : []
                };
            });

            const quoteNumber = await quoteRepository.generateQuoteNumber();
            
            const quotePayload: ICreateQuoteDTO = {
                quote_number: quoteNumber,
                quote_title: payload.quote_title || `Quote for ${leadData.name}`,
                client_name: leadData.name || 'N/A',
                client_email: leadData.email || '',
                client_phone: leadData.phone || '',
                client_address: leadData.address || '',
                itinerary_id: fileItineraryId,
                itinerary_type: 'file',
                currency: payload.currency || 'INR',
                status: 'Quote_Generated',
                subtotal: payload.subtotal || 0,
                tax_amount: payload.tax_amount || 0,
                total: payload.total || 0,
                final_amount: payload.final_amount || 0,
                initial_amount: payload.initial_amount || 0,
                line_items: payload.line_items || serviceItems.map(item => ({
                    service_type: 'other',
                    description: `${item.service_name} (${item.file_count} files)`,
                    quantity: 1,
                    unit_price: 0,
                    total: 0,
                    details: {
                        service_type: item.service_code,
                        file_count: item.file_count,
                        files: item.files
                    }
                })),
                validity_days: payload.validity_days || 30,
                valid_until: payload.valid_until || this.calculateValidUntil(payload.validity_days || 30),
                notes: payload.notes || `Quote generated from file-based itinerary (${serviceItems.length} services)`,
                terms_conditions: payload.terms_conditions || '',
                services_included: serviceItems.map(item => item.service_id),
                meta: {
                    source: 'file-itinerary',
                    file_itinerary_id: fileItineraryId,
                    service_count: serviceItems.length,
                    total_files: Object.values(uploadedFiles).flat().length
                }
            };

            const result = await quoteRepository.createQuote(quotePayload);

            return {
                success: true,
                data: result,
                message: 'Quote created from file itinerary successfully'
            };

        } catch (error: any) {
            console.error('Error generating quote from file itinerary:', error);
            return {
                success: false,
                error: error.message || 'Failed to generate quote'
            };
        }
    },

    async getFileQuoteById(quoteId: string) {
        try {
            const quote = await quoteRepository.getQuoteById(quoteId);

            if (!quote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            if (quote.itinerary_type !== 'file') {
                return {
                    success: false,
                    error: 'This is not a file-based quote'
                };
            }

            const { data: fileRecord } = await supabaseAdmin
                .from('user_itinerary_files')
                .select('*, lead:lead_id(*)')
                .eq('id', quote.itinerary_id)
                .single();

            return {
                success: true,
                data: {
                    ...quote,
                    file_itinerary: fileRecord || null
                }
            };

        } catch (error: any) {
            console.error('Error getting file quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to get quote'
            };
        }
    },

    async updateFileQuote(quoteId: string, payload: any) {
        try {
            const existingQuote = await quoteRepository.getQuoteById(quoteId);
            if (!existingQuote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            if (existingQuote.itinerary_type !== 'file') {
                return {
                    success: false,
                    error: 'This is not a file-based quote'
                };
            }

            const updatedQuote = await quoteRepository.updateQuote(quoteId, payload);

            return {
                success: true,
                data: updatedQuote,
                message: 'Quote updated successfully'
            };

        } catch (error: any) {
            console.error('Error updating file quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to update quote'
            };
        }
    },

    async deleteFileQuote(quoteId: string) {
        try {
            const existingQuote = await quoteRepository.getQuoteById(quoteId);
            if (!existingQuote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            if (existingQuote.itinerary_type !== 'file') {
                return {
                    success: false,
                    error: 'This is not a file-based quote'
                };
            }

            await quoteRepository.deleteQuote(quoteId);

            return {
                success: true,
                message: 'Quote deleted successfully'
            };

        } catch (error: any) {
            console.error('Error deleting file quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete quote'
            };
        }
    },

    async getAllFileQuotes(filter: any = {}, userRole?: string, userId?: string) {
        try {
            const fileFilter = {
                ...filter,
                itinerary_type: 'file'
            };

            const result = await quoteRepository.getAllQuotes(fileFilter, userRole, userId);

            return {
                success: true,
                data: {
                    quotes: result.quotes,
                    total: result.total,
                    page: filter.page || 1,
                    limit: filter.limit || 20,
                    totalPages: Math.ceil(result.total / (filter.limit || 20))
                }
            };

        } catch (error: any) {
            console.error('Error getting file quotes:', error);
            return {
                success: false,
                error: error.message || 'Failed to get quotes'
            };
        }
    },

    async shareFileQuotePDF(quoteId: string, sendVia?: { whatsapp?: boolean; email?: boolean }) {
        try {
            const quote = await quoteRepository.getQuoteById(quoteId);
            if (!quote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            if (quote.itinerary_type !== 'file') {
                return {
                    success: false,
                    error: 'This is not a file-based quote'
                };
            }

            const html = await quotePdfService.generateHTML(quote);
            const buffer = await quotePdfService.generateBuffer(html);

            const clientName = quote.client_name?.replace(/\s+/g, '_') || 'client';
            const fileName = `file_quotation_${quote.quote_number}_${clientName}.pdf`;

            const publicUrl = await s3UploadService.uploadToS3(buffer, fileName);

            const leadId = quote.lead_id || '';
            const clientPhone = quote.client_phone || undefined;

            const deliveryOptions: DeliveryOptions = {
                leadId: leadId,
                clientName: quote.client_name || 'Client',
                clientEmail: quote.client_email,
                clientPhone: clientPhone,
                pdfUrl: publicUrl,
                pdfFileName: fileName,
                htmlContent: html
            };

            const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

            const isDelivered = isDeliverySuccessful(deliveryResult);
            const deliveryDetails = getDeliveryDetails(deliveryResult);

            if (isDelivered) {
                await quoteRepository.updateQuoteStatus(quoteId, 'Quote_Sent');
            }

            const formattedDelivery = formatDeliveryResponse(
                deliveryResult, 
                clientPhone, 
                quote.client_email
            );

            return {
                success: true,
                message: isDelivered ? 'File quote PDF shared successfully' : 'File quote PDF uploaded but delivery may have failed',
                data: {
                    public_url: publicUrl,
                    delivery: formattedDelivery,
                    delivered: isDelivered,
                    delivery_details: deliveryDetails
                }
            };

        } catch (error: any) {
            console.error('Error sharing file quote PDF:', error);
            return {
                success: false,
                error: error.message || 'Failed to share quote PDF'
            };
        }
    },

    async downloadFileQuotePDF(quoteId: string) {
        try {
            const quote = await quoteRepository.getQuoteById(quoteId);
            if (!quote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            if (quote.itinerary_type !== 'file') {
                return {
                    success: false,
                    error: 'This is not a file-based quote'
                };
            }

            const html = await quotePdfService.generateHTML(quote);
            const pdfBuffer = await quotePdfService.generateBuffer(html);

            const clientName = quote.client_name?.replace(/\s+/g, '_') || 'client';
            const fileName = `file_quotation_${quote.quote_number}_${clientName}.pdf`;

            return {
                success: true,
                data: {
                    pdfBuffer,
                    fileName
                }
            };

        } catch (error: any) {
            console.error('Error downloading file quote PDF:', error);
            return {
                success: false,
                error: error.message || 'Failed to download quote PDF'
            };
        }
    },

    calculateValidUntil(validityDays: number): string {
        const date = new Date();
        date.setDate(date.getDate() + validityDays);
        return date.toISOString();
    }
};