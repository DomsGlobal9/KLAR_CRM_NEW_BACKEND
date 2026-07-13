import { supabaseAdmin } from '../config';
import {
    IQuote as IVoucher,                  // Aliased schemas matching your runtime data shapes safely
    ICreateQuoteDTO as ICreateVoucherDTO,
    IUpdateQuoteDTO as IUpdateVoucherDTO,
    IQuoteFilter as IVoucherFilter,
    IQuoteStats as IVoucherStats
} from '../interfaces';

export const voucherRepository = {
    // ============ CRUD Operations ============

    /**
     * Generate unique sequence voucher number: VCYYMMDDXXXXX
     */
    async generateVoucherNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear().toString().slice(2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const { count, error } = await supabaseAdmin
            .from('vouchers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${date.getFullYear()}-${month}-${day}T00:00:00Z`)
            .lt('created_at', `${date.getFullYear()}-${month}-${day}T23:59:59Z`);

        if (error) {
            throw new Error(`Failed to generate voucher sequence code identifier: ${error.message}`);
        }

        const sequence = String((count || 0) + 1).padStart(5, '0');
        return `VC${year}${month}${day}${sequence}`;
    },

    /**
     * Create a new voucher entity transaction record
     */
    async createVoucher(payload: ICreateVoucherDTO): Promise<IVoucher> {
        console.log("^^^^^^^^^^^^^^^^^ Voucher Repository Payload received", JSON.stringify(payload, null, 2));

        const voucherNumber = payload.voucher_number || (payload as any).voucherNumber;
        if (!voucherNumber) {
            throw new Error('Voucher identification serialization token string is required');
        }

        // Extract client information fallbacks safely
        const clientInfo = (payload as any).client_information || {};
        const clientName = payload.client_name || clientInfo.name;
        const clientEmail = payload.client_email || clientInfo.email;
        const clientPhone = payload.client_phone || clientInfo.phone;
        const clientAddress = (payload as any).client_address || clientInfo.address;

        // Extract pricing matrices definitions
        const totals = payload.totals || {};
        const taxAmount = payload.tax_amount || (totals as any).tax_amount || (totals as any).taxes || 0;
        const finalAmount = payload.final_amount || (totals as any).final_amount || (totals as any).totalAmount || 0;
        const taxRate = (payload as any).tax_rate || (totals as any).tax_rate || 0;
        const subtotal = payload.subtotal || (totals as any).subtotal || 0;
        const total = payload.total || finalAmount;

        const services = payload.services as any;
        const activeServiceIds = services?.active_service_ids || null;

        // Construct matching PostgreSQL schema object
        const voucherData = {
            voucher_number: voucherNumber,
            voucher_title: (payload as any).voucher_title || 'Confirmed Booking Voucher',
            status: 'Voucher_Generated',
            currency: payload.currency || 'INR',

            // Flattened columns
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            client_address: clientAddress || null,
            gst_number: (payload as any).gst_number || clientInfo.gst_number || null,

            // Accounting structures
            subtotal: subtotal,
            tax_amount: taxAmount,
            tax_rate: taxRate,
            total: total,
            final_amount: finalAmount,
            initial_amount: payload.initial_amount || subtotal,
            discount_percent: (payload as any).discount_percent || 0,
            discount_amount: (payload as any).discount_amount || 0,

            // Lifespans configuration
            validity_days: payload.validity_days || 30,
            valid_until: payload.valid_until || (() => {
                const date = new Date();
                date.setDate(date.getDate() + (payload.validity_days || 30));
                return date.toISOString();
            })(),

            notes: payload.notes || null,
            terms_conditions: payload.terms_conditions || null,

            // Structured JSON schemas blocks
            line_items: payload.line_items || [],
            itinerary_details: payload.itinerary_details || null,
            quote_inputs: payload.quote_inputs || null,
            totals: totals,
            services: services,
            selected_preferences: (payload as any).selected_preferences || null,
            meta: (payload as any).meta || null,
            identifiers: (payload as any).identifiers || null,

            services_included: activeServiceIds,

            active_service: (payload as any).active_service || null,
            itinerary_id: payload.itinerary_id || null,
            lead_id: payload.lead_id || null,
            user_preference_id: (payload as any).user_preference_id || null,
            destination: (payload as any).destination || null,
            template: (payload as any).template || null,

            created_at: new Date().toISOString()
        };

        console.log("Inserting voucher data to backend database table instance:", JSON.stringify(voucherData, null, 2));

        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .insert(voucherData)
            .select()
            .single();

        if (error || !data) {
            console.error('Failed to create voucher row mapping context:', error);
            throw new Error(`Failed to create voucher record tracking segment: ${error?.message || 'Unknown network trace standard event error'}`);
        }

        return data as IVoucher;
    },

    /**
     * Map dynamically evaluated services matrix components directly to rows
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
     * Locate explicit voucher element entity row by UUID
     */
    async getVoucherById(id: string): Promise<IVoucher | null> {
        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Safe fallback matching PostgREST row lookup exception code matches
            throw new Error(`Failed to locate requested voucher tracking index parameters: ${error.message}`);
        }

        return data as IVoucher;
    },

    /**
     * Retrieve target voucher record using structural serialization signature code identifier
     */
    async getVoucherByNumber(voucherNumber: string): Promise<IVoucher | null> {
        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .select('*')
            .eq('voucher_number', voucherNumber)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to locate requested voucher mapping record row sequence: ${error.message}`);
        }

        return data as IVoucher;
    },

    /**
     * Filter tracking elements based on permission profiles roles parameters matrix definitions
     */
    async getAllVouchers(filter: IVoucherFilter = {}, userRole?: string, userId?: string): Promise<{ vouchers: IVoucher[], total: number }> {
        let query = supabaseAdmin
            .from('vouchers')
            .select('*', { count: 'exact' });

        if (userRole === 'rm' && userId) {
            const { data: assignedLeads, error: leadsError } = await supabaseAdmin
                .from('leads')
                .select('id')
                .eq('assigned_to', userId);

            if (leadsError) {
                throw new Error(`Failed to evaluate user role tenant accessibility permissions restrictions parameters: ${leadsError.message}`);
            }

            const leadIds = assignedLeads?.map(lead => lead.id) || [];
            if (leadIds.length === 0) return { vouchers: [], total: 0 };

            query = query.in('lead_id', leadIds);
        }

        if (filter.search) {
            query = query.or(`
                voucher_number.ilike.%${filter.search}%,
                client_name.ilike.%${filter.search}%,
                client_email.ilike.%${filter.search}%,
                voucher_title.ilike.%${filter.search}%
            `);
        }

        if (filter.status) query = query.eq('status', filter.status);
        if (filter.client_email) query = query.eq('client_email', filter.client_email);
        if (filter.itinerary_id) query = query.eq('itinerary_id', filter.itinerary_id);
        if (filter.from_date) query = query.gte('created_at', filter.from_date);
        if (filter.to_date) query = query.lte('created_at', filter.to_date);

        if (filter.sort_by) {
            query = query.order(filter.sort_by, { ascending: filter.sort_order === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const offset = (page - 1) * limit;

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) throw new Error(`Failed to process execution workspace fetching queries loops sequence: ${error.message}`);

        return {
            vouchers: data as IVoucher[],
            total: count || 0
        };
    },

    /**
     * Update an existing voucher and automatically handle line item calculations
     */
    async updateVoucher(id: string, payload: IUpdateVoucherDTO): Promise<IVoucher> {
        const updateData: any = {
            ...payload,
            updated_at: new Date().toISOString()
        };

        if (updateData.tax_amount_old) delete updateData.tax_amount_old;

        if (payload.line_items && Array.isArray(payload.line_items) && payload.line_items.length > 0) {
            let subtotal = 0;
            let taxAmount = 0;

            payload.line_items.forEach((item: any) => {
                let itemBasePrice = 0;
                let itemTaxAmount = 0;

                if (item.details && typeof item.details === 'object') {
                    Object.entries(item.details).forEach(([key, value]) => {
                        if (value === null || value === undefined) return;

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

                        if (keyLower === 'taxes' || keyLower === 'tax' || keyLower === 'gst' || keyLower === 'tax_amount') {
                            itemTaxAmount += numValue;
                        } else if (
                            keyLower.includes('fare') ||
                            keyLower.includes('charge') ||
                            keyLower.includes('cost') ||
                            keyLower.includes('allowance') ||
                            keyLower.includes('parking') ||
                            keyLower.includes('fee') ||
                            keyLower.includes('price') ||
                            keyLower.includes('rate') ||
                            keyLower === 'amount'
                        ) {
                            itemBasePrice += numValue;
                        }
                    });
                }

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

                subtotal += itemBasePrice;
                taxAmount += itemTaxAmount;

                const calculatedTotal = itemBasePrice + itemTaxAmount;
                item.total = calculatedTotal;
                item.tax_amount = itemTaxAmount;
                item.unit_price = itemBasePrice;

                if (item.total_with_tax !== undefined) item.total_with_tax = calculatedTotal;
            });

            updateData.subtotal = subtotal;
            updateData.tax_amount = taxAmount;
            updateData.total = subtotal + taxAmount;
            updateData.final_amount = subtotal + taxAmount;
            updateData.tax_rate = 0;

            updateData.totals = {
                subtotal: subtotal,
                tax_rate: 0,
                tax_amount: taxAmount,
                final_amount: subtotal + taxAmount,
                discount_amount: (payload as any).discount_amount || 0
            };

            updateData.line_items = payload.line_items.map((item: any) => {
                const cleanedItem = { ...item };
                if (cleanedItem.total !== undefined && typeof cleanedItem.total === 'string') cleanedItem.total = parseFloat(cleanedItem.total);
                if (cleanedItem.tax_amount !== undefined && typeof cleanedItem.tax_amount === 'string') cleanedItem.tax_amount = parseFloat(cleanedItem.tax_amount);
                if (cleanedItem.unit_price !== undefined && typeof cleanedItem.unit_price === 'string') cleanedItem.unit_price = parseFloat(cleanedItem.unit_price);
                return cleanedItem;
            });
        }

        if (!payload.line_items && payload.subtotal !== undefined) {
            updateData.tax_rate = 0;
            if (updateData.tax_amount === undefined || updateData.tax_amount === null) updateData.tax_amount = 0;
            if (updateData.total === undefined) updateData.total = (updateData.subtotal || 0) + (updateData.tax_amount || 0);
            if (updateData.final_amount === undefined) updateData.final_amount = updateData.total;

            if (!updateData.totals) {
                updateData.totals = {
                    subtotal: updateData.subtotal || 0,
                    tax_rate: 0,
                    tax_amount: updateData.tax_amount || 0,
                    final_amount: updateData.final_amount || 0,
                    discount_amount: (payload as any).discount_amount || 0
                };
            }
        }

        const forbiddenFields = ['created_at', 'id', 'voucher_number'];
        forbiddenFields.forEach(field => delete updateData[field]);

        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Failed to complete update parameters validation sequencing query logic:', error);
            throw new Error(`Failed to update voucher row context state parameters values: ${error.message}`);
        }

        return data as IVoucher;
    },

    /**
     * Soft delete voucher tracking item components state
     */
    async deleteVoucher(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('vouchers')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw new Error(`Failed to safely soft delete target voucher record item: ${error.message}`);
        return true;
    },

    /**
     * Transition voucher status value
     */
    async updateVoucherStatus(id: string, status: string): Promise<IVoucher> {
        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to change state status metrics mapping elements inside database layer: ${error.message}`);
        return data as IVoucher;
    },

    /**
     * Fetch vouchers associated with an explicit itinerary array tracking signature mapping
     */
    async getVouchersByItinerary(itineraryId: string): Promise<IVoucher[]> {
        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .select('*')
            .eq('itinerary_id', itineraryId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to pull records matching itinerary constraints: ${error.message}`);
        return data as IVoucher[];
    },

    /**
     * Statistics evaluation aggregator routine loop logic
     */
    async getVoucherStatistics(): Promise<IVoucherStats> {
        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .select('status, final_amount');

        if (error) throw new Error(`Failed to build structural summary aggregations maps metrics counters values: ${error.message}`);

        const stats: IVoucherStats = {
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
        data.forEach(voucher => {
            if (stats[voucher.status as keyof typeof stats] !== undefined) {
                stats[voucher.status as keyof typeof stats] += 1;
            }
            totalAmount += voucher.final_amount || 0;
        });

        stats.total_amount = totalAmount;
        stats.average_amount = data.length > 0 ? totalAmount / data.length : 0;

        return stats;
    },

    /**
     * Verify serialization code tracking collision occurrences inside storage schema constraints structures boundaries
     */
    async voucherNumberExists(voucherNumber: string): Promise<boolean> {
        const { data, error } = await supabaseAdmin
            .from('vouchers')
            .select('id')
            .eq('voucher_number', voucherNumber)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to check sequence constraints validation parameters maps bounds: ${error.message}`);
        }

        return !!data;
    }
};