import { quoteRepository } from '../repositories';
import {
    IQuote,
    ICreateQuoteDTO,
    IUpdateQuoteDTO,
    IQuoteFilter,
    IQuoteStats,
    IQuoteResponse,
    IQuoteLineItem
} from '../interfaces';

export const quoteService = {
    /**
     * Create a new quote
     */
    async createQuote(payload: ICreateQuoteDTO): Promise<IQuoteResponse> {
        try {
            /**
             * Handle both new nested structure and old flat structure
             */
            let quoteData: any = {};
            console.log("@@@@@@@@@@@@@@@@\nThe quote data we get", payload);


            if (payload.client_information) {
                quoteData = {
                    ...quoteData,
                    client_name: payload.client_information.name,
                    client_email: payload.client_information.email,
                    client_phone: payload.client_information.phone,
                    client_address: payload.client_information.address,
                    gst_number: payload.client_information.gst_number
                };
            } else {
                quoteData = {
                    ...quoteData,
                    client_name: payload.client_name,
                    client_email: payload.client_email,
                    client_phone: payload.client_phone
                };
            }


            if (payload.quote_information) {
                quoteData = {
                    ...quoteData,
                    quote_number: payload.quote_information.quote_number,
                    quote_title: payload.quote_information.quote_title,
                    currency: payload.quote_information.currency || 'INR',
                    validity_days: payload.quote_information.validity_days,
                    valid_until: payload.quote_information.valid_until,
                    notes: payload.quote_information.notes,
                    terms_conditions: payload.quote_information.terms_conditions,
                    discount_percent: payload.quote_information.discount_percent,
                    discount_amount: payload.quote_information.discount_amount
                };
            } else {
                quoteData = {
                    ...quoteData,
                    quote_number: payload.quote_number,
                    quote_title: payload.quote_title,
                    currency: payload.currency || 'INR',
                    validity_days: payload.validity_days,
                    valid_until: payload.valid_until
                };
            }


            if (quoteData.quote_number) {
                const exists = await quoteRepository.quoteNumberExists(quoteData.quote_number);
                if (exists) {
                    return {
                        success: false,
                        error: 'Quote number already exists'
                    };
                }
            } else {

                quoteData.quote_number = await quoteRepository.generateQuoteNumber();
            }


            const finalPayload: ICreateQuoteDTO = {
                ...quoteData,


                status: 'draft',
                subtotal: payload.totals?.subtotal || payload.subtotal || 0,
                tax_amount: payload.totals?.tax_amount || payload.tax_amount || 0,
                tax_rate: payload.totals?.tax_rate || 18,
                total: payload.totals?.final_amount || payload.total || 0,
                final_amount: payload.totals?.final_amount || payload.final_amount || 0,
                initial_amount: payload.totals?.subtotal || payload.initial_amount || 0,


                line_items: payload.line_items || this.extractLineItemsFromQuoteInputs(payload),


                meta: payload.meta,
                identifiers: payload.identifiers,
                itinerary_details: payload.itinerary_details,
                services: payload.services,
                quote_inputs: payload.quote_inputs,
                totals: payload.totals,


                discount_amount: payload.discount_amount || 0,
                discount_percent: payload.discount_percent || 0
            };


            if (!finalPayload.client_name || !finalPayload.client_email || !finalPayload.client_phone) {
                return {
                    success: false,
                    error: 'Client name, email, and phone are required'
                };
            }

            if (!finalPayload.quote_number) {
                return {
                    success: false,
                    error: 'Quote number is required'
                };
            }

            const quote = await quoteRepository.createQuote(finalPayload);

            return {
                success: true,
                message: 'Quote created successfully',
                data: quote
            };
        } catch (error: any) {
            console.error('Error creating quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to create quote'
            };
        }
    },

    /**
     * Helper to extract line items from quote_inputs
     */
    extractLineItemsFromQuoteInputs(payload: ICreateQuoteDTO): IQuoteLineItem[] {
        const lineItems: IQuoteLineItem[] = [];

        if (payload.quote_inputs?.travel) {
            const travel = payload.quote_inputs.travel;
            lineItems.push({
                service_type: 'flight',
                description: 'Flight Booking',
                quantity: 1,
                unit_price: travel.total_amount || 0,
                total: travel.total_amount || 0,
                details: {
                    ...travel,
                    service_type: 'flight'
                }
            });
        }

        
        if (payload.quote_inputs?.hotel) {
            const hotel = payload.quote_inputs.hotel;
            lineItems.push({
                service_type: 'hotel',
                description: `Hotel Stay (${hotel.nights || 0} nights, ${hotel.rooms || 0} rooms)`,
                quantity: parseInt(hotel.nights || '0') * parseInt(hotel.rooms || '0'),
                unit_price: parseFloat(hotel.roomRate || '0'),
                total: hotel.total_amount || 0,
                details: {
                    ...hotel,
                    service_type: 'hotel'
                }
            });
        }

        
        if (payload.quote_inputs?.visa) {
            const visa = payload.quote_inputs.visa;
            lineItems.push({
                service_type: 'visa',
                description: 'Visa Processing',
                quantity: 1,
                unit_price: visa.total_amount || 0,
                total: visa.total_amount || 0,
                details: {
                    ...visa,
                    service_type: 'visa'
                }
            });
        }

        return lineItems;
    },

    /**
     * Get quote by ID
     */
    async getQuoteById(id: string): Promise<IQuoteResponse> {
        try {
            const quote = await quoteRepository.getQuoteById(id);

            if (!quote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            return {
                success: true,
                data: quote
            };
        } catch (error: any) {
            console.error('Error fetching quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch quote'
            };
        }
    },

    /**
     * Get quote by quote number
     */
    async getQuoteByNumber(quoteNumber: string): Promise<IQuoteResponse> {
        try {
            const quote = await quoteRepository.getQuoteByNumber(quoteNumber);

            if (!quote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            return {
                success: true,
                data: quote
            };
        } catch (error: any) {
            console.error('Error fetching quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch quote'
            };
        }
    },

    /**
     * Get all quotes with filtering
     */
    async getAllQuotes(filter: IQuoteFilter = {}): Promise<IQuoteResponse> {
        try {
            const result = await quoteRepository.getAllQuotes(filter);

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
            console.error('Error fetching quotes:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch quotes'
            };
        }
    },

    /**
     * Update quote
     */
    async updateQuote(id: string, payload: IUpdateQuoteDTO): Promise<IQuoteResponse> {
        try {
            // Check if quote exists
            const existingQuote = await quoteRepository.getQuoteById(id);
            if (!existingQuote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            // Update the quote
            const updatedQuote = await quoteRepository.updateQuote(id, payload);

            return {
                success: true,
                message: 'Quote updated successfully',
                data: updatedQuote
            };
        } catch (error: any) {
            console.error('Error updating quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to update quote'
            };
        }
    },

    /**
     * Delete quote
     */
    async deleteQuote(id: string): Promise<IQuoteResponse> {
        try {
            // Check if quote exists
            const existingQuote = await quoteRepository.getQuoteById(id);
            if (!existingQuote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            // Delete the quote (soft delete)
            await quoteRepository.deleteQuote(id);

            return {
                success: true,
                message: 'Quote deleted successfully'
            };
        } catch (error: any) {
            console.error('Error deleting quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete quote'
            };
        }
    },

    /**
     * Update quote status
     */
    async updateQuoteStatus(id: string, status: IQuote['status']): Promise<IQuoteResponse> {
        try {
            // Check if quote exists
            const existingQuote = await quoteRepository.getQuoteById(id);
            if (!existingQuote) {
                return {
                    success: false,
                    error: 'Quote not found'
                };
            }

            // Validate status
            const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return {
                    success: false,
                    error: 'Invalid status'
                };
            }

            // Update status
            const updatedQuote = await quoteRepository.updateQuoteStatus(id, status);

            return {
                success: true,
                message: `Quote status updated to ${status}`,
                data: updatedQuote
            };
        } catch (error: any) {
            console.error('Error updating quote status:', error);
            return {
                success: false,
                error: error.message || 'Failed to update quote status'
            };
        }
    },

    /**
     * Get quotes by itinerary ID
     */
    async getQuotesByItinerary(itineraryId: string): Promise<IQuoteResponse> {
        try {
            const quotes = await quoteRepository.getQuotesByItinerary(itineraryId);

            return {
                success: true,
                data: quotes
            };
        } catch (error: any) {
            console.error('Error fetching quotes by itinerary:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch quotes'
            };
        }
    },

    /**
     * Get quotes by client email
     */
    async getQuotesByClientEmail(clientEmail: string): Promise<IQuoteResponse> {
        try {
            const quotes = await quoteRepository.getQuotesByClientEmail(clientEmail);

            return {
                success: true,
                data: quotes
            };
        } catch (error: any) {
            console.error('Error fetching quotes by client:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch quotes'
            };
        }
    },

    /**
     * Get quote statistics
     */
    async getQuoteStatistics(): Promise<IQuoteResponse> {
        try {
            const stats = await quoteRepository.getQuoteStatistics();

            return {
                success: true,
                data: stats
            };
        } catch (error: any) {
            console.error('Error fetching quote statistics:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch statistics'
            };
        }
    },

    /**
     * Get recent quotes
     */
    async getRecentQuotes(limit: number = 10): Promise<IQuoteResponse> {
        try {
            const quotes = await quoteRepository.getRecentQuotes(limit);

            return {
                success: true,
                data: quotes
            };
        } catch (error: any) {
            console.error('Error fetching recent quotes:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch recent quotes'
            };
        }
    },

    /**
     * Search quotes
     */
    async searchQuotes(searchTerm: string, limit: number = 20): Promise<IQuoteResponse> {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                return {
                    success: false,
                    error: 'Search term must be at least 2 characters'
                };
            }

            const quotes = await quoteRepository.searchQuotes(searchTerm, limit);

            return {
                success: true,
                data: quotes
            };
        } catch (error: any) {
            console.error('Error searching quotes:', error);
            return {
                success: false,
                error: error.message || 'Failed to search quotes'
            };
        }
    },

    /**
     * Generate quote number
     */
    async generateQuoteNumber(): Promise<IQuoteResponse> {
        try {
            const quoteNumber = await quoteRepository.generateQuoteNumber();

            return {
                success: true,
                data: { quote_number: quoteNumber }
            };
        } catch (error: any) {
            console.error('Error generating quote number:', error);
            return {
                success: false,
                error: error.message || 'Failed to generate quote number'
            };
        }
    }
};