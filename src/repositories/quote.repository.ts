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
        const taxRate = payload.tax_rate || (totals as any).tax_rate || 0;
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
            status: 'Quote_Generated',
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
    async getAllQuotes(filter: IQuoteFilter = {}, userRole?: string, userId?: string): Promise<{ quotes: IQuote[], total: number }> {
        let query = supabaseAdmin
            .from('quotes')
            .select('*', { count: 'exact' });

        if (userRole === 'rm' && userId) {

            const { data: assignedLeads, error: leadsError } = await supabaseAdmin
                .from('leads')
                .select('id')
                .eq('assigned_to', userId);

            if (leadsError) {
                throw new Error(`Failed to fetch assigned leads: ${leadsError.message}`);
            }

            const leadIds = assignedLeads?.map(lead => lead.id) || [];

            if (leadIds.length === 0) {
                return {
                    quotes: [],
                    total: 0
                };
            }

            query = query.in('lead_id', leadIds);
        }

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

        if (filter.sort_by) {
            query = query.order(filter.sort_by, {
                ascending: filter.sort_order === 'asc'
            });
        } else {
            query = query.order('created_at', { ascending: false });
        }

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
    // Create a clean update object
    const updateData: any = {
        ...payload,
        updated_at: new Date().toISOString()
    };

    // Remove any old tax_amount from root level to avoid conflicts
    if (updateData.tax_amount_old) {
        delete updateData.tax_amount_old;
    }

    // Recalculate totals from line items if present
    if (payload.line_items && Array.isArray(payload.line_items) && payload.line_items.length > 0) {
        let subtotal = 0;
        let taxAmount = 0;

        // Calculate totals from each line item
        payload.line_items.forEach((item: any) => {
            let itemBasePrice = 0;
            let itemTaxAmount = 0;
            
            // Calculate from details fields
            if (item.details && typeof item.details === 'object') {
                Object.entries(item.details).forEach(([key, value]) => {
                    // Skip null/undefined values
                    if (value === null || value === undefined) return;
                    
                    // Convert to number
                    let numValue = 0;
                    if (typeof value === 'string') {
                        const cleaned = value.replace(/[^0-9.-]/g, '');
                        numValue = parseFloat(cleaned);
                        if (isNaN(numValue)) numValue = 0;
                    } else if (typeof value === 'number') {
                        numValue = value;
                    } else {
                        return;
                    }
                    
                    if (numValue === 0) return;
                    
                    const keyLower = key.toLowerCase();
                    
                    // Check if it's a tax field
                    if (keyLower === 'taxes' || keyLower === 'tax' || keyLower === 'gst' || keyLower === 'tax_amount') {
                        itemTaxAmount += numValue;
                    } 
                    // Check if it's a pricing field - EXPANDED KEYWORDS
                    else if (
                        keyLower.includes('fare') ||
                        keyLower.includes('charge') ||
                        keyLower.includes('cost') ||
                        keyLower.includes('allowance') ||  // ADD THIS for driverAllowance
                        keyLower.includes('parking') ||    // ADD THIS for tollParking
                        keyLower.includes('fee') ||
                        keyLower.includes('price') ||
                        keyLower.includes('rate') ||
                        keyLower === 'amount'
                    ) {
                        itemBasePrice += numValue;
                    }
                });
            }
            
            // Fallback: If no pricing fields found in details, try using total_price or unit_price
            if (itemBasePrice === 0 && itemTaxAmount === 0) {
                if (item.total_price !== undefined && item.total_price > 0) {
                    itemBasePrice = typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price;
                } else if (item.total !== undefined && item.total > 0) {
                    itemBasePrice = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
                } else if (item.unit_price !== undefined && item.unit_price > 0) {
                    itemBasePrice = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price;
                    itemBasePrice = itemBasePrice * (item.quantity || 1);
                }
                
                if (item.tax_amount !== undefined && item.tax_amount > 0) {
                    itemTaxAmount = typeof item.tax_amount === 'string' ? parseFloat(item.tax_amount) : item.tax_amount;
                }
            }
            
            // Log calculation for debugging
            console.log(`Calculated for ${item.service_name || item.description}:`, {
                basePrice: itemBasePrice,
                taxAmount: itemTaxAmount,
                total: itemBasePrice + itemTaxAmount,
                details: item.details
            });
            
            subtotal += itemBasePrice;
            taxAmount += itemTaxAmount;
            
            // Update the item with calculated values
            const calculatedTotal = itemBasePrice + itemTaxAmount;
            item.total = calculatedTotal;
            item.tax_amount = itemTaxAmount;
            item.unit_price = itemBasePrice;
            
            // Update total_with_tax if it exists
            if (item.total_with_tax !== undefined) {
                item.total_with_tax = calculatedTotal;
            }
        });

        // Update the payload with recalculated values
        updateData.subtotal = subtotal;
        updateData.tax_amount = taxAmount;
        updateData.total = subtotal + taxAmount;
        updateData.final_amount = subtotal + taxAmount;
        updateData.tax_rate = 0;

        // Update the totals JSON object
        updateData.totals = {
            subtotal: subtotal,
            tax_rate: 0,
            tax_amount: taxAmount,
            final_amount: subtotal + taxAmount,
            discount_amount: payload.discount_amount || 0
        };

        // Clean up line items
        updateData.line_items = payload.line_items.map((item: any) => {
            const cleanedItem = { ...item };
            // Ensure numeric values are numbers, not strings
            if (cleanedItem.total !== undefined && typeof cleanedItem.total === 'string') {
                cleanedItem.total = parseFloat(cleanedItem.total);
            }
            if (cleanedItem.tax_amount !== undefined && typeof cleanedItem.tax_amount === 'string') {
                cleanedItem.tax_amount = parseFloat(cleanedItem.tax_amount);
            }
            if (cleanedItem.unit_price !== undefined && typeof cleanedItem.unit_price === 'string') {
                cleanedItem.unit_price = parseFloat(cleanedItem.unit_price);
            }
            return cleanedItem;
        });

        console.log('Recalculated totals in repository:', {
            subtotal: updateData.subtotal,
            tax_amount: updateData.tax_amount,
            total: updateData.total,
            final_amount: updateData.final_amount,
            totals_object: updateData.totals
        });
    }

    // If no line items but subtotal is provided directly
    if (!payload.line_items && payload.subtotal !== undefined) {
        updateData.tax_rate = 0;
        if (updateData.tax_amount === undefined || updateData.tax_amount === null) {
            updateData.tax_amount = 0;
        }
        if (updateData.total === undefined) {
            updateData.total = (updateData.subtotal || 0) + (updateData.tax_amount || 0);
        }
        if (updateData.final_amount === undefined) {
            updateData.final_amount = updateData.total;
        }
        
        if (!updateData.totals) {
            updateData.totals = {
                subtotal: updateData.subtotal || 0,
                tax_rate: 0,
                tax_amount: updateData.tax_amount || 0,
                final_amount: updateData.final_amount || 0,
                discount_amount: payload.discount_amount || 0
            };
        }
    }

    // Remove any fields that shouldn't be updated directly
    const forbiddenFields = ['created_at', 'id', 'quote_number'];
    forbiddenFields.forEach(field => {
        delete updateData[field];
    });

    console.log('Final update data being sent to database:', JSON.stringify({
        ...updateData,
        line_items_count: updateData.line_items?.length,
        subtotal: updateData.subtotal,
        tax_amount: updateData.tax_amount,
        total: updateData.total,
        final_amount: updateData.final_amount,
        totals: updateData.totals
    }, null, 2));

    const { data, error } = await supabaseAdmin
        .from('quotes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Failed to update quote:', error);
        throw new Error(`Failed to update quote: ${error.message}`);
    }

    console.log('Quote updated successfully:', {
        id: data.id,
        quote_number: data.quote_number,
        subtotal: data.subtotal,
        tax_amount: data.tax_amount,
        total: data.total,
        final_amount: data.final_amount,
        totals: data.totals
    });

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
    async updateQuoteStatus(id: string, status: string): Promise<IQuote> {
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .update({
                status,
                // updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        console.log("Updated quote we got", data.status);

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
    },
};