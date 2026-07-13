import { quoteRepository } from '../repositories/quote.repository';
import { supabaseAdmin } from '../config';

export const voucherService = {
    /**
     * Generate unique sequence code prefixed with VC
     */
    async generateVoucherNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear().toString().slice(2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Check the vouchers table or generate based on current date index sequence offsets
        const { count, error } = await supabaseAdmin
            .from('quotes') // Or a custom 'vouchers' count table if tracked separately
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${date.getFullYear()}-${month}-${day}T00:00:00Z`)
            .lt('created_at', `${date.getFullYear()}-${month}-${day}T23:59:59Z`);

        if (error) {
            throw new Error(`Failed to safely compute sequence ranges code maps: ${error.message}`);
        }

        const sequence = String((count || 0) + 1).padStart(5, '0');
        return `VC${year}${month}${day}${sequence}`;
    },

    /**
     * Fetch quote details by ID and dynamically re-map it as a dynamic voucher shape
     */
    async getVoucherDataByQuoteId(quoteId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const quote = await quoteRepository.getQuoteById(quoteId);
            if (!quote) {
                return { success: false, error: 'Target source quote row entity missing' };
            }

            // Generate an on-the-fly custom Voucher configuration wrapping the raw dataset properties safely
            const generatedVoucherNumber = await this.generateVoucherNumber();

            const voucherPayload = {
                ...quote,
                voucher_number: generatedVoucherNumber, // Appending our structural signature tracking code context overriding properties
                voucher_title: 'Confirmed Booking Voucher',
                original_quote_number: quote.quote_number
            };

            return {
                success: true,
                data: voucherPayload
            };
        } catch (error: any) {
            console.error('Error constructing composite voucher framework values:', error);
            return {
                success: false,
                error: error.message || 'Failed processing context mappings conversion'
            };
        }
    }
};