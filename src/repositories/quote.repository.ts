import { supabaseAdmin } from '../config';
import {
    IQuote,
    ICreateQuoteDTO,
    IUpdateQuoteDTO,
    IQuoteFilter,
    IQuoteStats,
    IQuoteWithRelations
} from '../interfaces';

export const quoteRepository = {
    // ============ CRUD Operations ============

    /**
     * Generate unique quote number
     */
    async generateQuoteNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear().toString().slice(2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const { count, error } = await supabaseAdmin
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${date.getFullYear()}-${month}-${day}T00:00:00Z`)
            .lt('created_at', `${date.getFullYear()}-${month}-${day}T23:59:59Z`);

        if (error) {
            throw new Error(`Failed to generate quote number: ${error.message}`);
        }

        const sequence = String((count || 0) + 1).padStart(5, '0');
        return `QT${year}${month}${day}${sequence}`;
    },

    /**
     * Create a new quote
     */
    async createQuote(payload: ICreateQuoteDTO): Promise<IQuote> {
        console.log("^^^^^^^^^^^^^^^^^Repository Payload we get", JSON.stringify(payload, null, 2));

        // Always use the quote_number from the transformed DTO
        const quoteNumber = payload.quote_number;
        if (!quoteNumber) {
            throw new Error('Quote number is required');
        }

        // Extract client information - handle both structures
        const clientInfo = payload.client_information || {};
        const clientName = payload.client_name || clientInfo.name;
        const clientEmail = payload.client_email || clientInfo.email;
        const clientPhone = payload.client_phone || clientInfo.phone;
        const clientAddress = payload.client_address || clientInfo.address;

        // Extract totals - handle both structures safely
        const totals = payload.totals || {};
        const taxAmount = payload.tax_amount || (totals as any).tax_amount || (totals as any).taxes || 0;
        const finalAmount = payload.final_amount || (totals as any).final_amount || (totals as any).totalAmount || 0;
        const taxRate = payload.tax_rate || (totals as any).tax_rate || 18;
        const subtotal = payload.subtotal || (totals as any).subtotal || 0;
        const total = payload.total || finalAmount;

        // Extract services with type safety
        const services = payload.services as any;
        const activeServiceIds = services?.active_service_ids || null;

        // Prepare quote data that matches database schema
        const quoteData = {
            // Required fields (matching database columns)
            quote_number: quoteNumber,
            quote_title: payload.quote_title || 'Untitled Quote',
            status: payload.status || 'draft',
            currency: payload.currency || 'INR',

            // Client fields (direct columns, not nested)
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            client_address: clientAddress || null,
            gst_number: payload.gst_number || clientInfo.gst_number || null,

            // Financial fields
            subtotal: subtotal,
            tax_amount: taxAmount,
            tax_rate: taxRate,
            total: total,
            final_amount: finalAmount,
            initial_amount: payload.initial_amount || subtotal,
            discount_percent: payload.discount_percent || 0,
            discount_amount: payload.discount_amount || 0,

            // Dates and validity
            validity_days: payload.validity_days || 30,
            valid_until: payload.valid_until || (() => {
                const date = new Date();
                date.setDate(date.getDate() + (payload.validity_days || 30));
                return date.toISOString();
            })(),

            // Text fields
            notes: payload.notes || null,
            terms_conditions: payload.terms_conditions || null,

            // JSON fields (must match column names exactly)
            line_items: payload.line_items || [],
            itinerary_details: payload.itinerary_details || null,
            quote_inputs: payload.quote_inputs || null,
            totals: totals,
            services: services,
            selected_preferences: payload.selected_preferences || null,
            meta: payload.meta || null,
            identifiers: payload.identifiers || null,

            // Array fields
            services_included: activeServiceIds,

            // Single value fields
            active_service: payload.active_service || null,
            itinerary_id: payload.itinerary_id || null,
            lead_id: payload.lead_id || null,
            user_preference_id: payload.user_preference_id || null,
            destination: payload.destination || null,
            template: payload.template || null,

            created_at: new Date().toISOString()
        };

        console.log("Inserting quote data (database compatible):", JSON.stringify(quoteData, null, 2));

        // Insert into database
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .insert(quoteData)
            .select()
            .single();

        if (error || !data) {
            console.error('Failed to create quote:', error);
            throw new Error(`Failed to create quote: ${error?.message || 'Unknown error'}`);
        }

        return data as IQuote;
    },

    /**
     * Helper method for repository
     * @param services 
     * @returns 
     */
    createLineItemsFromServices(services: any[]): any[] {
        return services.map((service, index) => {
            let cost = 0;
            const formData = service.formData || {};

            if (formData.costPerPerson && formData.groupSize) {
                cost = parseFloat(formData.costPerPerson) * parseInt(formData.groupSize);
            } else if (formData.charterCharges) {
                cost = parseFloat(formData.charterCharges);
            } else if (formData.costPerPerson) {
                cost = parseFloat(formData.costPerPerson);
            }

            return {
                service_type: service.serviceCode.includes('CHARTER') ? 'flight' : 'other',
                description: service.serviceName || `Service ${index + 1}`,
                quantity: 1,
                unit_price: cost,
                total: cost,
                details: {
                    ...service,
                    service_type: service.serviceCode.includes('CHARTER') ? 'flight' : 'other'
                }
            };
        });
    },

    /**
     * Get quote by ID
     */
    async getQuoteById(id: string): Promise<IQuote | null> {
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

        return data as IQuote;
    },

    /**
     * Get quote by quote number
     */
    async getQuoteByNumber(quoteNumber: string): Promise<IQuote | null> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .eq('quote_number', quoteNumber)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch quote: ${error.message}`);
        }

        return data as IQuote;
    },

    /**
     * Get all quotes with filtering
     */
    async getAllQuotes(filter: IQuoteFilter = {}): Promise<{ quotes: IQuote[], total: number }> {
        let query = supabaseAdmin
            .from('quotes')
            .select('*', { count: 'exact' });

        // Apply filters
        if (filter.search) {
            query = query.or(`
        quote_number.ilike.%${filter.search}%,
        client_name.ilike.%${filter.search}%,
        client_email.ilike.%${filter.search}%,
        quote_title.ilike.%${filter.search}%
      `);
        }

        if (filter.status) {
            query = query.eq('status', filter.status);
        }

        if (filter.client_email) {
            query = query.eq('client_email', filter.client_email);
        }

        if (filter.itinerary_id) {
            query = query.eq('itinerary_id', filter.itinerary_id);
        }

        if (filter.from_date) {
            query = query.gte('created_at', filter.from_date);
        }

        if (filter.to_date) {
            query = query.lte('created_at', filter.to_date);
        }

        // Apply sorting
        if (filter.sort_by) {
            query = query.order(filter.sort_by, {
                ascending: filter.sort_order === 'asc'
            });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const offset = (page - 1) * limit;

        const { data, error, count } = await query
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(`Failed to fetch quotes: ${error.message}`);
        }

        return {
            quotes: data as IQuote[],
            total: count || 0
        };
    },

    /**
     * Update quote
     */
    async updateQuote(id: string, payload: IUpdateQuoteDTO): Promise<IQuote> {
        // If updating line items or pricing, recalculate totals
        if (payload.line_items || payload.subtotal !== undefined) {
            const currentQuote = await this.getQuoteById(id);
            if (!currentQuote) {
                throw new Error('Quote not found');
            }

            // Recalculate if line items are updated
            if (payload.line_items) {
                const subtotal = payload.line_items.reduce((sum, item) => sum + item.total, 0);
                const taxAmount = subtotal * (currentQuote.tax_rate || 0.18);
                const total = subtotal + taxAmount;
                const finalAmount = total - (payload.discount_amount || currentQuote.discount_amount || 0);

                payload.subtotal = subtotal;
                payload.tax_amount = taxAmount;
                payload.total = total;
                payload.final_amount = finalAmount;
            }
        }

        const { data, error } = await supabaseAdmin
            .from('quotes')
            .update({
                ...payload,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update quote: ${error.message}`);
        }

        return data as IQuote;
    },

    /**
     * Delete quote (soft delete by updating status to cancelled)
     */
    async deleteQuote(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('quotes')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete quote: ${error.message}`);
        }

        return true;
    },

    /**
     * Update quote status
     */
    async updateQuoteStatus(id: string, status: IQuote['status']): Promise<IQuote> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update quote status: ${error.message}`);
        }

        return data as IQuote;
    },

    /**
     * Get quotes by itinerary ID
     */
    async getQuotesByItinerary(itineraryId: string): Promise<IQuote[]> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .eq('itinerary_id', itineraryId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch quotes: ${error.message}`);
        }

        return data as IQuote[];
    },

    /**
     * Get quotes by client email
     */
    async getQuotesByClientEmail(clientEmail: string): Promise<IQuote[]> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .eq('client_email', clientEmail)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch quotes: ${error.message}`);
        }

        return data as IQuote[];
    },

    // ============ Statistics ============

    /**
     * Get quote statistics
     */
    async getQuoteStatistics(): Promise<IQuoteStats> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('status, final_amount');

        if (error) {
            throw new Error(`Failed to fetch quote statistics: ${error.message}`);
        }

        const stats: IQuoteStats = {
            total: data.length,
            draft: 0,
            sent: 0,
            accepted: 0,
            rejected: 0,
            expired: 0,
            cancelled: 0,
            total_amount: 0,
            average_amount: 0
        };

        let totalAmount = 0;

        data.forEach(quote => {
            if (stats[quote.status as keyof typeof stats] !== undefined) {
                stats[quote.status as keyof typeof stats] += 1;
            }
            totalAmount += quote.final_amount || 0;
        });

        stats.total_amount = totalAmount;
        stats.average_amount = data.length > 0 ? totalAmount / data.length : 0;

        return stats;
    },

    /**
     * Get recent quotes
     */
    async getRecentQuotes(limit: number = 10): Promise<IQuote[]> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch recent quotes: ${error.message}`);
        }

        return data as IQuote[];
    },

    /**
     * Search quotes
     */
    async searchQuotes(searchTerm: string, limit: number = 20): Promise<IQuote[]> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('*')
            .or(`
        quote_number.ilike.%${searchTerm}%,
        client_name.ilike.%${searchTerm}%,
        client_email.ilike.%${searchTerm}%,
        quote_title.ilike.%${searchTerm}%
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to search quotes: ${error.message}`);
        }

        return data as IQuote[];
    },

    /**
     * Check if quote number exists
     */
    async quoteNumberExists(quoteNumber: string): Promise<boolean> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .select('id')
            .eq('quote_number', quoteNumber)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to check quote number: ${error.message}`);
        }

        return !!data;
    }
};