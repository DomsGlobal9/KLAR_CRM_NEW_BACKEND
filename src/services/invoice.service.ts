import { invoiceRepository } from '../repositories';
import { ICreateInvoiceDTO, IUpdateInvoiceDTO } from '../interfaces/invoice.interface';
import { validateInvoiceData } from '../utils/invoice.validation';
import { generateInvoiceNumber } from '../utils/date.utils';

export const invoiceService = {
    async getAllInvoices() {
        return await invoiceRepository.getAll();
    },

    async getInvoiceById(id: string) {
        const invoice = await invoiceRepository.getById(id);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        return invoice;
    },

    async createInvoice(invoiceData: ICreateInvoiceDTO) {
        
        validateInvoiceData(invoiceData);
        
        if (!invoiceData.invoice_number) {
            invoiceData.invoice_number = generateInvoiceNumber(invoiceData.quote_number);
        }
        
        const completeInvoiceData = {
            ...invoiceData,
            status: invoiceData.status || 'draft',
            created_at: new Date().toISOString(),
            due_date: invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            paid_amount: 0,
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