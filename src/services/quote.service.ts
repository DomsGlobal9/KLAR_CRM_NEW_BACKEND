import { quoteRepository, leadRepository } from '../repositories';
import { CreateQuoteDTO, UpdateQuoteDTO } from '../interfaces/quote.interface';
import { validateQuoteData } from '../utils/invoice.validation';
import { invoiceService } from './invoice.service';
import { CreateInvoiceDTO } from '../interfaces/invoice.interface';

export const quoteService = {
    async getAllQuotes() {
        return await quoteRepository.getAll();
    },

    async getQuoteById(id: string) {
        const quote = await quoteRepository.getById(id);
        if (!quote) {
            throw new Error('Quote not found');
        }
        return quote;
    },

    async getQuotesByLeadId(leadId: string) {
        // Check if lead exists
        const lead = await leadRepository.getLeadById(leadId);
        if (!lead) {
            throw new Error('Lead not found');
        }

        return await quoteRepository.getByLeadId(leadId);
    },

    async createQuote(quoteData: CreateQuoteDTO) {
        // Validate quote data
        validateQuoteData(quoteData);

        // Check if lead exists when leadId is provided
        if (quoteData.leadId) {
            const lead = await leadRepository.getLeadById(quoteData.leadId);
            if (!lead) {
                throw new Error('Lead not found');
            }
        }

        // Create quote
        const quote = await quoteRepository.create(quoteData);

        // Update lead stage if leadId exists
        if (quoteData.leadId) {
            try {
                await leadRepository.updateLeadWithQuote(quoteData.leadId, quote.id);
            } catch (error) {
                console.error('Failed to update lead stage:', error);
                // Don't throw error, quote creation was successful
            }
        }

        return quote;
    },

    async updateQuote(id: string, updateData: UpdateQuoteDTO) {
        // Check if quote exists
        const existingQuote = await quoteRepository.getById(id);
        if (!existingQuote) {
            throw new Error('Quote not found');
        }

        // Update quote
        return await quoteRepository.update(id, updateData);
    },

    async deleteQuote(id: string) {
        // Check if quote exists
        const existingQuote = await quoteRepository.getById(id);
        if (!existingQuote) {
            throw new Error('Quote not found');
        }

        // Delete quote
        await quoteRepository.delete(id);
        return { success: true, message: 'Quote deleted successfully' };
    },

    async getQuoteStats() {
        return await quoteRepository.getStats();
    },

    async convertQuoteToInvoice(quoteId: string) {
        const quote = await this.getQuoteById(quoteId);

        if (quote.status === 'converted') {
            throw new Error('Quote already converted to invoice');
        }

        // Create invoice from quote
        const invoiceData: CreateInvoiceDTO = {
            clientName: quote.clientName,
            clientEmail: quote.clientEmail,
            clientPhone: quote.clientPhone,
            clientAddress: quote.clientAddress,
            subtotal: quote.initialAmount,
            discount: quote.discountAmount,
            taxAmount: 0, // You might want to calculate this differently
            total: quote.finalAmount,
            currency: quote.currency,
            status: 'draft',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            quoteReference: quote.id,
            lineItems: quote.lineItems,
            notes: quote.notes,
            termsConditions: quote.termsConditions,
            gstNumber: quote.gstNumber
        };

        // Create invoice
        const invoice = await invoiceService.createInvoice(invoiceData);

        // Update quote status to converted
        await this.updateQuote(quoteId, { status: 'converted' });

        return invoice;
    },

    async markQuoteAsAccepted(id: string) {
        return await this.updateQuote(id, { status: 'accepted' });
    },

    async markQuoteAsRejected(id: string) {
        return await this.updateQuote(id, { status: 'rejected' });
    },

    async markQuoteAsSent(id: string) {
        return await this.updateQuote(id, { status: 'sent' });
    }
};