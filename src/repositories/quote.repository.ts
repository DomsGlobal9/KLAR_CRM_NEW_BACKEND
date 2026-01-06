import { supabaseAdmin } from '../config';
import { Quote, CreateQuoteDTO, UpdateQuoteDTO, QuoteStats } from '../interfaces/quote.interface';

export const quoteRepository = {
    /**
     * Get all quotes
     */
    async getAll(): Promise<Quote[]> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch quotes: ${error.message}`);
        }

        return data as Quote[];
    },

    /**
     * Get quote by ID
     */
    async getById(id: string): Promise<Quote | null> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch quote: ${error.message}`);
        }

        return data as Quote;
    },

    /**
     * Get quotes by lead ID
     */
    async getByLeadId(leadId: string): Promise<Quote[]> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .eq('leadId', leadId)
            .order('createdAt', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch quotes by lead: ${error.message}`);
        }

        return data as Quote[];
    },

    /**
     * Create new quote
     */
    async create(quoteData: CreateQuoteDTO): Promise<Quote> {
        const quote: Omit<Quote, 'id'> = {
            ...quoteData,
            status: quoteData.status || 'draft',
            createdAt: new Date().toISOString(),
            validUntil: quoteData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('quotes')
            .insert(quote)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create quote: ${error.message}`);
        }

        return data as Quote;
    },

    /**
     * Update quote
     */
    async update(id: string, updateData: UpdateQuoteDTO): Promise<Quote> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update quote: ${error.message}`);
        }

        return data as Quote;
    },

    /**
     * Delete quote
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('quotes')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete quote: ${error.message}`);
        }
    },

    /**
     * Get quote statistics
     */
    async getStats(): Promise<QuoteStats> {
        const { data: quotes, error } = await supabaseAdmin
            .from('quotes')
            .select('status, finalAmount');

        if (error) {
            throw new Error(`Failed to fetch quote stats: ${error.message}`);
        }

        const stats: QuoteStats = {
            totalQuotes: quotes.length,
            acceptedQuotes: 0,
            rejectedQuotes: 0,
            convertedQuotes: 0,
            totalAmount: 0
        };

        quotes.forEach(quote => {
            stats.totalAmount += quote.finalAmount || 0;
            
            if (quote.status === 'accepted') {
                stats.acceptedQuotes += 1;
            } else if (quote.status === 'rejected') {
                stats.rejectedQuotes += 1;
            } else if (quote.status === 'converted') {
                stats.convertedQuotes += 1;
            }
        });

        return stats;
    }
};