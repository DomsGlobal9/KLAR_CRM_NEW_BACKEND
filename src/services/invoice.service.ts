import { invoiceRepository } from '../repositories';
import { ICreateInvoiceDTO, IInvoice, IUpdateInvoiceDTO } from '../interfaces/invoice.interface';
import { validateInvoiceData } from '../utils/invoice.validation';
import { generateInvoiceNumber } from '../utils/date.utils';

export const invoiceService = {

    async getAllInvoices(userRole?: string, userId?: string): Promise<IInvoice[]> {
        try {
            return await invoiceRepository.getAll(userRole, userId);
        } catch (error: any) {
            console.error('Error fetching invoices:', error);
            throw new Error(error.message || 'Failed to fetch invoices');
        }
    },

    async getInvoiceById(id: string) {
        const invoice = await invoiceRepository.getById(id);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        return invoice;
    },

    async createInvoice(invoiceData: ICreateInvoiceDTO, skipValidation = false) {
        console.log(`invoiceService.createInvoice - skipValidation: ${skipValidation}`, {
            client_name: invoiceData.client_name,
            currency: invoiceData.currency,
            total: invoiceData.total
        });

        if (!skipValidation) {
            validateInvoiceData(invoiceData);
        }

        if (!invoiceData.invoice_number) {
            invoiceData.invoice_number = generateInvoiceNumber(invoiceData.quote_number);
        }

        // Honour the paid_amount coming from the frontend (e.g. cash upfront).
        const paidAmount = invoiceData.paid_amount ?? 0;

        // Auto-determine status based on paid amount vs total.
        let resolvedStatus: ICreateInvoiceDTO['status'];
        let paidDate: string | undefined;

        if (paidAmount >= invoiceData.total && paidAmount > 0) {
            // Full payment received
            resolvedStatus = 'paid';
            paidDate = new Date().toISOString();
        } else if (paidAmount > 0) {
            // Partial payment received
            resolvedStatus = 'partial';
        } else {
            // No payment — respect caller's choice or default to draft
            resolvedStatus = invoiceData.status || 'draft';
        }

        const completeInvoiceData = {
            ...invoiceData,
            status: resolvedStatus,
            created_at: new Date().toISOString(),
            due_date: invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            paid_amount: paidAmount,
            paid_date: paidDate,
            discount: invoiceData.discount || 0,
            tax_amount: invoiceData.tax_amount || 0,
            subtotal: invoiceData.subtotal || invoiceData.total,
            include_quote_details: invoiceData.include_quote_details || false
        };

        return await invoiceRepository.create(completeInvoiceData);
    },

    async updateInvoice(id: string, updateData: IUpdateInvoiceDTO) {
        // Check if invoice exists
        const existingInvoice = await invoiceRepository.getById(id);
        if (!existingInvoice) {
            throw new Error('Invoice not found');
        }

        // Update invoice
        return await invoiceRepository.update(id, updateData);
    },

    async deleteInvoice(id: string) {
        // Check if invoice exists
        const existingInvoice = await invoiceRepository.getById(id);
        if (!existingInvoice) {
            throw new Error('Invoice not found');
        }

        // Delete invoice
        await invoiceRepository.delete(id);
        return { success: true, message: 'Invoice deleted successfully' };
    },

    async getInvoiceStats() {
        return await invoiceRepository.getStats();
    },

    async markInvoiceAsPaid(id: string) {
        const invoice = await this.getInvoiceById(id);

        const updateData: IUpdateInvoiceDTO = {
            status: 'paid',
            paid_amount: invoice.total,
            paid_date: new Date().toISOString()
        };

        return await this.updateInvoice(id, updateData);
    },

    async markInvoiceAsSent(id: string) {
        const updateData: IUpdateInvoiceDTO = {
            status: 'sent',
            sent_at: new Date().toISOString()
        };

        return await this.updateInvoice(id, updateData);
    }
};
