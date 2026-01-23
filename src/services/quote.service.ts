import { quoteRepository } from '../repositories';
import {
    IQuote,
    ICreateQuoteDTO,
    IUpdateQuoteDTO,
    IQuoteFilter,
    IQuoteStats,
    IQuoteResponse
} from '../interfaces';

export const quoteService = {
    /**
     * Create a new quote
     */
    async createQuote(payload: ICreateQuoteDTO): Promise<IQuoteResponse> {
        try {
            /**
             * Validate required fields
             */
            if (!payload.client_name || !payload.client_email || !payload.client_phone) {
                return {
                    success: false,
                    error: 'Client name, email, and phone are required'
                };
            }

            // Check if quote number already exists
            if (payload.quote_number) {
                const exists = await quoteRepository.quoteNumberExists(payload.quote_number);
                if (exists) {
                    return {
                        success: false,
                        error: 'Quote number already exists'
                    };
                }
            }

            // Create the quote
            const quote = await quoteRepository.createQuote(payload);

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