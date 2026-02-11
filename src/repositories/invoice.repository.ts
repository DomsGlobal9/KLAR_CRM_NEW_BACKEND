import { supabaseAdmin } from '../config';
import { IInvoice, ICreateInvoiceDTO, IUpdateInvoiceDTO, IInvoiceStats } from '../interfaces/invoice.interface';

export const invoiceRepository = {
    /**
     * Get all IInvoices
     */
    async getAll(userRole?: string, userId?: string): Promise<IInvoice[]> {
        let query = supabaseAdmin
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false });

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
                return [];
            }

            const { data: quotes, error: quotesError } = await supabaseAdmin
                .from('quotes')
                .select('quote_number')
                .in('lead_id', leadIds);

            if (quotesError) {
                throw new Error(`Failed to fetch quotes: ${quotesError.message}`);
            }

            const quoteNumbers = quotes?.map(quote => quote.quote_number) || [];

            if (quoteNumbers.length === 0) {
                return [];
            }

            query = query.in('quote_number', quoteNumbers);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch invoices: ${error.message}`);
        }

        return data as IInvoice[];
    },

    /**
     * Get IInvoice by ID
     */
    async getById(id: string): Promise<IInvoice | null> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch IInvoice: ${error.message}`);
        }

        return data as IInvoice;
    },

    /**
     * Create new IInvoice
     */
    async create(IInvoiceData: ICreateInvoiceDTO): Promise<IInvoice> {
        const IInvoice: any = {
            ...IInvoiceData,
            created_at: new Date().toISOString(),
            paid_amount: 0,
            discount: IInvoiceData.discount || 0,
            tax_amount: IInvoiceData.tax_amount || 0,
            subtotal: IInvoiceData.subtotal || IInvoiceData.total,
            include_quote_details: IInvoiceData.include_quote_details || false,
            line_items: IInvoiceData.line_items || []
        };

        Object.keys(IInvoice).forEach(key => {
            if (IInvoice[key] === undefined) {
                delete IInvoice[key];
            }
        });

        const { data, error } = await supabaseAdmin
            .from('invoices')
            .insert(IInvoice)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create IInvoice: ${error.message}`);
        }

        return data as IInvoice;
    },

    /**
     * Update IInvoice
     */
    async update(id: string, updateData: IUpdateInvoiceDTO): Promise<IInvoice> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update IInvoice: ${error.message}`);
        }

        return data as IInvoice;
    },

    /**
     * Delete IInvoice
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete IInvoice: ${error.message}`);
        }
    },

    /**
     * Get IInvoice statistics
     */
    async getStats(): Promise<IInvoiceStats> {
        const { data: IInvoices, error } = await supabaseAdmin
            .from('invoices')
            .select('status, total, paid_amount');

        if (error) {
            throw new Error(`Failed to fetch IInvoice stats: ${error.message}`);
        }

        const stats: IInvoiceStats = {
            totalInvoices: IInvoices.length,
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            overdueAmount: 0,
            draftAmount: 0
        };

        IInvoices.forEach(IInvoice => {
            stats.totalAmount += IInvoice.total || 0;

            if (IInvoice.status === 'paid') {
                stats.paidAmount += IInvoice.total || 0;
            } else if (IInvoice.status === 'pending' || IInvoice.status === 'sent') {
                stats.pendingAmount += IInvoice.total || 0;
            } else if (IInvoice.status === 'overdue') {
                stats.overdueAmount += IInvoice.total || 0;
            } else if (IInvoice.status === 'draft') {
                stats.draftAmount += IInvoice.total || 0;
            }
        });

        return stats;
    }
};