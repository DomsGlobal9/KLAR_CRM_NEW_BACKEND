import { leadRepository, quoteRepository, stageRepository } from '../repositories';
import {
    IQuote,
    ICreateQuoteDTO,
    IUpdateQuoteDTO,
    IQuoteFilter,
    IQuoteStats,
    IQuoteResponse,
    IQuoteLineItem
} from '../interfaces';
import { envConfig } from '../config';

export const quoteService = {
    /**
     * Create a new quote
     */
    async createQuote(payload: any): Promise<IQuoteResponse> {
        try {
            console.log("Raw payload:", JSON.stringify(payload, null, 2));

            const transformedPayload: ICreateQuoteDTO = this.transformPayload(payload);
            console.log("&&&&&&&&&&&&&&&&&&&&&The transformed payload:\n", JSON.stringify(transformedPayload, null, 2));

            const result = await quoteRepository.createQuote(transformedPayload);

            const stageName = await stageRepository.getStageNameById(envConfig.QUOTE_STAGE);
            if (!stageName) {
                throw new Error('Stage name not found for Itinerary Generation');
            }

            await leadRepository.updateLeadStageOnly(transformedPayload.lead_id, stageName);

            return {
                success: true,
                message: 'Quote created successfully',
                data: result
            };
        } catch (error: any) {
            console.error('Error creating quote:', error);
            return {
                success: false,
                error: error.message || 'Failed to create quote'
            };
        }
    },

    transformPayload(frontendPayload: any): ICreateQuoteDTO {
        console.log("^^^^^^^^^^^^^^^^^^^The payload we get", frontendPayload);

        // Extract quote number - check both possible field names
        const quoteNumber = frontendPayload.quote_number || frontendPayload.quoteNumber;
        if (!quoteNumber) {
            throw new Error('Quote number is required');
        }

        // Extract client information (flatten from nested structure)
        const clientInfo = frontendPayload.client_information || {};
        const clientName = frontendPayload.client_name || clientInfo.name || frontendPayload.lead?.name;
        const clientEmail = frontendPayload.client_email || clientInfo.email || frontendPayload.lead?.email;
        const clientPhone = frontendPayload.client_phone || clientInfo.phone || frontendPayload.lead?.phone;

        // Validate required fields
        if (!clientName || !clientEmail || !clientPhone) {
            throw new Error('Client name, email, and phone are required');
        }

        // Create the DTO with all required fields (flattened structure)
        const dto: ICreateQuoteDTO = {
            // Required fields (direct columns)
            quote_number: quoteNumber,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            quote_title: frontendPayload.quote_title || frontendPayload.title || 'Untitled Quote',
            valid_until: frontendPayload.valid_until || frontendPayload.quote_information?.valid_until || this.calculateValidUntil(frontendPayload.validity_days || frontendPayload.validityDays),
            currency: frontendPayload.currency || 'INR',
            subtotal: frontendPayload.subtotal || frontendPayload.totals?.subtotal || 0,
            tax_amount: frontendPayload.tax_amount || frontendPayload.totals?.tax_amount || 0,
            total: frontendPayload.total || frontendPayload.totals?.final_amount || 0,
            final_amount: frontendPayload.final_amount || frontendPayload.totals?.final_amount || 0,
            initial_amount: frontendPayload.initial_amount || frontendPayload.totals?.subtotal || 0,
            line_items: frontendPayload.line_items || [],
            status: frontendPayload.status || 'draft',

            // Optional but recommended fields (direct columns)
            validity_days: frontendPayload.validity_days || frontendPayload.validityDays || 30,
            terms_conditions: frontendPayload.terms_conditions || frontendPayload.termsAndConditions,
            notes: frontendPayload.notes || frontendPayload.description,

            // JSON fields (as they are in database)
            ...(frontendPayload.services && { services: frontendPayload.services }),
            ...(frontendPayload.quote_inputs && { quote_inputs: frontendPayload.quote_inputs }),
            ...(frontendPayload.totals && { totals: frontendPayload.totals }),
            ...(frontendPayload.itinerary_details && { itinerary_details: frontendPayload.itinerary_details }),

            // IDs
            itinerary_id: frontendPayload.itinerary_id || frontendPayload.lead_id || frontendPayload.lead?.id,
            lead_id: frontendPayload.lead_id || frontendPayload.lead?.id
        };

        console.log("&&&&&&&&&&&&&&&&&&&&&The transformed payload (flattened):\n", JSON.stringify(dto, null, 2));
        return dto;
    },

    extractCost(service: any): number {
        const formData = service.formData || service.details || {};

        // Try to extract any cost-related fields
        const costFields = [
            formData.costPerPerson,
            formData.charterCharges,
            formData.fuelCharges,
            formData.crewCharges,
            formData.amount,
            formData.total,
            formData.price,
            formData.baseFare,
            formData.unit_price
        ];

        for (const cost of costFields) {
            if (cost !== undefined && cost !== null) {
                const num = parseFloat(cost);
                if (!isNaN(num)) {
                    return num;
                }
            }
        }

        return 0;
    },

    /**
     * Transform frontend payload to backend format
     */
    transformFrontendPayloadToBackend(frontendPayload: any): any {
        const quoteData: any = {};

        // Basic quote info
        quoteData.quote_title = frontendPayload.title || 'Untitled Quote';
        quoteData.quote_number = frontendPayload.quoteNumber || undefined;
        quoteData.description = frontendPayload.description || null;
        quoteData.validity_days = frontendPayload.validityDays || 30;
        quoteData.terms_conditions = frontendPayload.termsAndConditions || null;

        // Client information from lead
        if (frontendPayload.lead) {
            quoteData.client_name = frontendPayload.lead.name;
            quoteData.client_email = frontendPayload.lead.email;
            quoteData.client_phone = frontendPayload.lead.phone;
            quoteData.lead_id = frontendPayload.lead.id;

            // Extract destination from services if available
            if (frontendPayload.services && frontendPayload.services.length > 0) {
                const firstService = frontendPayload.services[0];
                if (firstService.formData?.destination) {
                    quoteData.destination = firstService.formData.destination;
                }
            }
        }

        // Totals
        if (frontendPayload.totals) {
            quoteData.subtotal = frontendPayload.totals.subtotal || 0;
            quoteData.tax_amount = frontendPayload.totals.taxes || 0;
            quoteData.total = frontendPayload.totals.totalAmount || 0;
            quoteData.final_amount = frontendPayload.totals.totalAmount || 0;
            quoteData.initial_amount = frontendPayload.totals.subtotal || 0;
        }

        // Services information
        if (frontendPayload.services) {
            // Extract active service IDs
            const activeServiceIds = frontendPayload.services.map((service: any) => service.serviceId);
            quoteData.services_included = activeServiceIds;

            // Create services JSON structure
            quoteData.services = {
                active_service_ids: activeServiceIds,
                available_services: frontendPayload.services.map((service: any) => ({
                    id: service.serviceId,
                    name: service.serviceName,
                    count: 1
                }))
            };

            // Create quote_inputs structure
            quoteData.quote_inputs = {};
            frontendPayload.services.forEach((service: any) => {
                const serviceType = service.serviceCode.toLowerCase();
                quoteData.quote_inputs[serviceType] = {
                    ...service.formData,
                    categories: service.categories,
                    serviceId: service.serviceId,
                    serviceName: service.serviceName,
                    serviceCode: service.serviceCode
                };
            });

            // Create line items from services
            quoteData.line_items = this.createLineItemsFromServices(frontendPayload.services);
        }

        // Status
        quoteData.status = frontendPayload.status || 'draft';

        return quoteData;
    },

    /**
     * Create line items from services
     */
    createLineItemsFromServices(services: any[]): IQuoteLineItem[] {
        const lineItems: IQuoteLineItem[] = [];

        services.forEach((service, index) => {
            // Try to extract cost from formData
            let cost = 0;
            const formData = service.formData || {};

            if (formData.costPerPerson && formData.groupSize) {
                cost = parseFloat(formData.costPerPerson) * parseInt(formData.groupSize);
            } else if (formData.charterCharges) {
                cost = parseFloat(formData.charterCharges);
            } else if (formData.costPerPerson) {
                cost = parseFloat(formData.costPerPerson);
            }

            // Determine service type based on service code
            let serviceType: 'flight' | 'hotel' | 'visa' | 'other' = 'other';
            if (service.serviceCode.includes('CHARTER')) {
                serviceType = 'flight';
            } else if (service.serviceCode.includes('GROUP')) {
                serviceType = 'hotel'; // Could also be 'other'
            }

            lineItems.push({
                service_type: serviceType,
                description: service.serviceName || `Service ${index + 1}`,
                quantity: 1,
                unit_price: cost,
                total: cost,
                details: {
                    ...service,
                    service_type: serviceType
                }
            });
        });

        return lineItems;
    },

    /**
     * Calculate valid until date based on validity days
     */
    calculateValidUntil(validityDays: number = 30): string {
        const date = new Date();
        date.setDate(date.getDate() + validityDays);
        return date.toISOString();
    },

    /**
     * Helper to extract line items from quote_inputs (for old structure)
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
    async getAllQuotes(filter: IQuoteFilter = {}, userRole?: string, userId?: string): Promise<IQuoteResponse> {
        try {
            const result = await quoteRepository.getAllQuotes(filter, userRole, userId);

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