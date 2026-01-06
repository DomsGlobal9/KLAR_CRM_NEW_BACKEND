import { invoiceRepository } from '../repositories';
import { CreateInvoiceDTO, UpdateInvoiceDTO } from '../interfaces/invoice.interface';
import { validateInvoiceData } from '../utils/invoice.validation';

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

    async createInvoice(invoiceData: CreateInvoiceDTO) {
        // Validate invoice data
        validateInvoiceData(invoiceData);

        // Create invoice
        return await invoiceRepository.create(invoiceData);
    },

    async updateInvoice(id: string, updateData: UpdateInvoiceDTO) {
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
        
        const updateData: UpdateInvoiceDTO = {
            status: 'paid',
            paidAmount: invoice.total,
            paidDate: new Date().toISOString()
        };

        return await this.updateInvoice(id, updateData);
    },

    async markInvoiceAsSent(id: string) {
        const updateData: UpdateInvoiceDTO = {
            status: 'sent',
            sentAt: new Date().toISOString()
        };

        return await this.updateInvoice(id, updateData);
    }
};