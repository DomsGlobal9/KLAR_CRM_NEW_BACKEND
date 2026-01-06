import { supabaseAdmin } from '../config';
import { Invoice, CreateInvoiceDTO, UpdateInvoiceDTO, InvoiceStats } from '../interfaces/invoice.interface';

export const invoiceRepository = {
    /**
     * Get all invoices
     */
    async getAll(): Promise<Invoice[]> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch invoices: ${error.message}`);
        }

        return data as Invoice[];
    },

    /**
     * Get invoice by ID
     */
    async getById(id: string): Promise<Invoice | null> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch invoice: ${error.message}`);
        }

        return data as Invoice;
    },

    /**
     * Create new invoice
     */
    async create(invoiceData: CreateInvoiceDTO): Promise<Invoice> {
        const invoice: Omit<Invoice, 'id'> = {
            ...invoiceData,
            invoiceNumber: `INV-${Date.now()}`,
            status: invoiceData.status || 'draft',
            createdAt: new Date().toISOString(),
            dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            paidAmount: 0
        };

        const { data, error } = await supabaseAdmin
            .from('invoices')
            .insert(invoice)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create invoice: ${error.message}`);
        }

        return data as Invoice;
    },

    /**
     * Update invoice
     */
    async update(id: string, updateData: UpdateInvoiceDTO): Promise<Invoice> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update invoice: ${error.message}`);
        }

        return data as Invoice;
    },

    /**
     * Delete invoice
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete invoice: ${error.message}`);
        }
    },

    /**
     * Get invoice statistics
     */
    async getStats(): Promise<InvoiceStats> {
        const { data: invoices, error } = await supabaseAdmin
            .from('invoices')
            .select('status, total, paidAmount');

        if (error) {
            throw new Error(`Failed to fetch invoice stats: ${error.message}`);
        }

        const stats: InvoiceStats = {
            totalInvoices: invoices.length,
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            overdueAmount: 0,
            draftAmount: 0
        };

        invoices.forEach(invoice => {
            stats.totalAmount += invoice.total || 0;
            
            if (invoice.status === 'paid') {
                stats.paidAmount += invoice.total || 0;
            } else if (invoice.status === 'pending' || invoice.status === 'sent') {
                stats.pendingAmount += invoice.total || 0;
            } else if (invoice.status === 'overdue') {
                stats.overdueAmount += invoice.total || 0;
            } else if (invoice.status === 'draft') {
                stats.draftAmount += invoice.total || 0;
            }
        });

        return stats;
    }
};