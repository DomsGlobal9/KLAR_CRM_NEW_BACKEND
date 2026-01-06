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

    async getQuotesByLeadId(lead_id: string) {
        // Check if lead exists using your existing method
        const lead = await leadRepository.getLeadById(lead_id);
        if (!lead) {
            throw new Error('Lead not found');
        }

        return await quoteRepository.getByLeadId(lead_id);
    },

    async createQuote(quoteData: CreateQuoteDTO) {

        console.log('Received quote data for creation:', quoteData);
        // Validate quote data
        validateQuoteData(quoteData);
        console.log('Quote data validation passed');

        // Check if lead exists when lead_id is provided
        if (quoteData.lead_id) {
            const lead = await leadRepository.getLeadById(quoteData.lead_id);
            if (!lead) {
                throw new Error('Lead not found');
            }
        }
        console.log('Quote data validated successfully');

        // Generate quote number if not provided
        if (!quoteData.quote_number) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            quoteData.quote_number = `QT-${timestamp}-${random}`;
        }

        console.log('Validated quote data:', quoteData);

        // Create quote
        const quote = await quoteRepository.create(quoteData);

        // Update lead stage if lead_id exists
        // if (quoteData.lead_id) {
        //     try {
        //         // Update lead with quote reference
        //         const updatePayload = {
        //             stage: 'quotation-sent',
        //             quoteId: quote.id
        //         };

        //         // Using your updateLeadWithRequirements method
        //         await leadRepository.updateLeadWithRequirements(
        //             quoteData.lead_id,
        //             updatePayload as any
        //         );
        //     } catch (error) {
        //         console.error('Failed to update lead stage:', error);
        //         // Don't throw error, quote creation was successful
        //     }
        // }

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

        // If quote is linked to a lead, update lead stage back
        if (existingQuote.lead_id) {
            try {
                await leadRepository.updateLeadWithRequirements(
                    existingQuote.lead_id,
                    { stage: 'quote-deleted' } as any
                );
            } catch (error) {
                console.error('Failed to update lead after quote deletion:', error);
            }
        }

        // Delete quote
        await quoteRepository.delete(id);
        return { success: true, message: 'Quote deleted successfully' };
    },

    async getQuoteStats() {
        return await quoteRepository.getStats();
    },

    async convertQuoteToInvoice(quoteId: string, dueDate?: string, notes?: string) {
        const quote = await this.getQuoteById(quoteId);

        if (quote.status === 'converted') {
            throw new Error('Quote already converted to invoice');
        }

        // If quote is linked to a lead, update lead stage
        if (quote.lead_id) {
            try {
                await leadRepository.updateLeadWithRequirements(
                    quote.lead_id,
                    { stage: 'quotation-accepted' } as any
                );
            } catch (error) {
                console.error('Failed to update lead stage:', error);
            }
        }

        
        const invoiceData: CreateInvoiceDTO = {
            client_name: quote.client_name,
            client_email: quote.client_email,
            client_phone: quote.client_phone,
            client_address: quote.client_address,
            subtotal: quote.initial_amount,
            discount: quote.discount_amount,
            tax_amount: quote.tax_amount || 0,
            total: quote.final_amount,
            currency: quote.currency,
            status: 'draft',
            due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            quote_reference: quote.id,
            line_items: quote.line_items,
            notes: notes || quote.notes,
            terms_conditions: quote.terms_conditions,
            gst_number: quote.gst_number
        };

        // Create invoice
        const invoice = await invoiceService.createInvoice(invoiceData);

        // Update quote status to converted
        await this.updateQuote(quoteId, { status: 'converted' });

        return invoice;
    },

    async markQuoteAsAccepted(id: string) {
        const quote = await this.getQuoteById(id);

        // If quote is linked to a lead, update lead stage
        if (quote.lead_id) {
            try {
                await leadRepository.updateLeadWithRequirements(
                    quote.lead_id,
                    { stage: 'quotation-accepted' } as any
                );
            } catch (error) {
                console.error('Failed to update lead stage:', error);
            }
        }

        return await this.updateQuote(id, { status: 'accepted' });
    },

    async markQuoteAsRejected(id: string) {
        const quote = await this.getQuoteById(id);

        // If quote is linked to a lead, update lead stage
        if (quote.lead_id) {
            try {
                await leadRepository.updateLeadWithRequirements(
                    quote.lead_id,
                    { stage: 'quotation-rejected' } as any
                );
            } catch (error) {
                console.error('Failed to update lead stage:', error);
            }
        }

        return await this.updateQuote(id, { status: 'rejected' });
    },

    async markQuoteAsSent(id: string) {
        const quote = await this.getQuoteById(id);

        // If quote is linked to a lead, update lead stage
        if (quote.lead_id) {
            try {
                await leadRepository.updateLeadWithRequirements(
                    quote.lead_id,
                    { stage: 'quotation-sent' } as any
                );
            } catch (error) {
                console.error('Failed to update lead stage:', error);
            }
        }

        return await this.updateQuote(id, { status: 'sent' });
    },

    async getQuotesForLeadDashboard(lead_id: string) {
        // Get lead with requirements
        const lead = await leadRepository.getLeadById(lead_id);
        if (!lead) {
            throw new Error('Lead not found');
        }

        // Get all quotes for this lead
        const quotes = await quoteRepository.getByLeadId(lead_id);

        // Get lead requirements to populate quote template if needed
        const requirements = lead.requirements;

        return {
            lead,
            quotes,
            requirements,
            quoteCount: quotes.length,
            acceptedQuotes: quotes.filter(q => q.status === 'accepted').length,
            pendingQuotes: quotes.filter(q => q.status === 'draft' || q.status === 'sent').length
        };
    },

    async generateQuoteFromLead(lead_id: string, templateId?: string) {
        // Get lead with requirements
        const lead = await leadRepository.getLeadById(lead_id);
        if (!lead) {
            throw new Error('Lead not found');
        }

        // Use lead data to populate quote
        const quoteData: CreateQuoteDTO = {
            quote_number: `QT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            lead_id: lead.id,
            client_name: lead.name,
            client_email: lead.email,
            client_phone: lead.phone || '',
            destination: lead.requirements?.destination || '',
            subtotal: 0, // Will be calculated from line items
            tax_amount: 0, // Will be calculated
            total: 0, // Will be calculated
            currency: 'INR',
            status: 'draft',
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            template: templateId || 'custom',
            line_items: [],
            notes: `Generated from lead: ${lead.name} (${lead.email})`,
            terms_conditions: 'Standard terms and conditions apply.',
            gst_number: lead.requirements?.gst_number || '',
            initial_amount: lead.requirements?.budget || 0,
            discount_percent: 0,
            discount_amount: 0,
            final_amount: lead.requirements?.budget || 0
        };

        // Auto-populate line items based on lead requirements
        if (lead.requirements) {
            const requirements = lead.requirements;
            const lineItems = [];

            // Add destination if available
            if (requirements.destination) {
                lineItems.push({
                    id: `item-${Date.now()}-1`,
                    description: `Travel to ${requirements.destination}`,
                    quantity: 1,
                    unitPrice: requirements.budget ? requirements.budget * 0.6 : 10000,
                    taxRate: 18,
                    total: 0 // Will be calculated
                });
            }

            // Add flight if applicable
            if (requirements.flight_class) {
                lineItems.push({
                    id: `item-${Date.now()}-2`,
                    description: `${requirements.flight_class} Class Flight`,
                    quantity: requirements.travelers || 1,
                    unitPrice: requirements.flight_class === 'business' ? 25000 : 8000,
                    taxRate: 5,
                    total: 0
                });
            }

            // Add visa service if needed
            if (requirements.needs_visa) {
                lineItems.push({
                    id: `item-${Date.now()}-3`,
                    description: 'Visa Processing Service',
                    quantity: requirements.travelers || 1,
                    unitPrice: 5000,
                    taxRate: 18,
                    total: 0
                });
            }

            // Calculate totals
            lineItems.forEach(item => {
                const subtotal = item.quantity * item.unitPrice;
                const taxAmount = (subtotal * item.taxRate) / 100;
                item.total = subtotal + taxAmount;
            });

            const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const taxAmount = lineItems.reduce((sum, item) => {
                const itemSubtotal = item.quantity * item.unitPrice;
                return sum + (itemSubtotal * item.taxRate) / 100;
            }, 0);
            const total = subtotal + taxAmount;

            quoteData.line_items = lineItems;
            quoteData.subtotal = subtotal;
            quoteData.tax_amount = taxAmount;
            quoteData.total = total;
            quoteData.initial_amount = total;
            quoteData.final_amount = total;
        }

        return await this.createQuote(quoteData);
    },

    async bulkUpdateQuoteStatus(quoteIds: string[], status: 'accepted' | 'rejected' | 'sent' | 'converted') {
        const results = [];

        for (const quoteId of quoteIds) {
            try {
                const quote = await this.getQuoteById(quoteId);

                // Update based on status
                switch (status) {
                    case 'accepted':
                        await this.markQuoteAsAccepted(quoteId);
                        break;
                    case 'rejected':
                        await this.markQuoteAsRejected(quoteId);
                        break;
                    case 'sent':
                        await this.markQuoteAsSent(quoteId);
                        break;
                    case 'converted':
                        // For conversion, we need additional data
                        // This would require more parameters in a real scenario
                        break;
                }

                results.push({ quoteId, success: true });
            } catch (error: any) {
                results.push({
                    quoteId,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }
};