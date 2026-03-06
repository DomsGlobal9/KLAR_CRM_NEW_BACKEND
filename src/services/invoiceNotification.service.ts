import { supabaseAdmin } from '../config';
import whatsappService from './whatsapp.service';

export interface InvoiceWithRestAmount {
    id: string;
    invoice_number: string;
    client_name: string;
    client_phone: string;
    total: number;
    paid_amount: number;
    rest_amount: number;
    due_date: string;
    status: string;
}

class InvoiceNotificationService {

    /**
     * Find all invoices with rest_amount > 0 (handling null values)
     */
    async findInvoicesWithRestAmount(): Promise<InvoiceWithRestAmount[]> {
        try {
            // First, let's check what's in the database
            const { data: allData, error: checkError } = await supabaseAdmin
                .from('invoices')
                .select('id, invoice_number, rest_amount, status, client_phone')
                .limit(10);


            // Fix: Use proper condition for rest_amount > 0 including handling null
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select(`
                    id,
                    invoice_number,
                    client_name,
                    client_phone,
                    total,
                    paid_amount,
                    rest_amount,
                    due_date,
                    status
                `)
                // Fix: rest_amount > 0 (this automatically excludes null)
                .gt('rest_amount', 0)
                .in('status', ['sent', 'pending', 'overdue', 'partial']) // Added 'partial' status
                .not('client_phone', 'is', null)
                .order('due_date', { ascending: true });

            if (error) {
                console.error('Error fetching invoices with rest amount:', error);
                return [];
            }

            console.log(`📊 Found ${data?.length || 0} invoices with rest_amount > 0`);

            // Log the invoices found for debugging
            if (data && data.length > 0) {
                data.forEach(inv => {
                    console.log(`- ${inv.invoice_number}: rest_amount=${inv.rest_amount}, status=${inv.status}, phone=${inv.client_phone}`);
                });
            }

            return data as InvoiceWithRestAmount[];
        } catch (error) {
            console.error('Error in findInvoicesWithRestAmount:', error);
            return [];
        }
    }

    /**
     * Find invoices with rest_amount that are overdue
     */
    async findOverdueInvoices(): Promise<InvoiceWithRestAmount[]> {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select(`
                    id,
                    invoice_number,
                    client_name,
                    client_phone,
                    total,
                    paid_amount,
                    rest_amount,
                    due_date,
                    status
                `)
                .gt('rest_amount', 0)
                .lt('due_date', today)
                .in('status', ['sent', 'pending', 'partial']) // Added 'partial'
                .not('client_phone', 'is', null);

            if (error) {
                console.error('Error fetching overdue invoices:', error);
                return [];
            }

            return data as InvoiceWithRestAmount[];
        } catch (error) {
            console.error('Error in findOverdueInvoices:', error);
            return [];
        }
    }

    /**
     * Send WhatsApp reminder for invoice
     */
    async sendInvoiceReminder(invoice: InvoiceWithRestAmount): Promise<boolean> {
        if (!invoice.client_phone) {
            console.log(`❌ No phone number for invoice ${invoice.invoice_number}`);
            return false;
        }

        const dueDate = new Date(invoice.due_date).toLocaleDateString();
        const restAmountFormatted = invoice.rest_amount?.toFixed(2) || '0';
        const totalFormatted = invoice.total?.toFixed(2) || '0';
        const paidFormatted = invoice.paid_amount?.toFixed(2) || '0';

        const message = `🔔 *Payment Reminder*\n\n` +
            `Dear ${invoice.client_name},\n\n` +
            `This is a reminder that you have an outstanding balance on invoice *${invoice.invoice_number}*.\n\n` +
            `📋 *Invoice Details:*\n` +
            `• Invoice Number: ${invoice.invoice_number}\n` +
            `• Total Amount: ₹${totalFormatted}\n` +
            `• Paid Amount: ₹${paidFormatted}\n` +
            `• Remaining Amount: *₹${restAmountFormatted}*\n` +
            `• Due Date: ${dueDate}\n\n` +
            `Please make the payment at your earliest convenience.\n\n` +
            `Thank you for your business!`;

        return await whatsappService.sendMessage(invoice.client_phone, message);
    }

    /**
     * Send overdue notification
     */
    async sendOverdueNotification(invoice: InvoiceWithRestAmount): Promise<boolean> {
        if (!invoice.client_phone) {
            console.log(`❌ No phone number for invoice ${invoice.invoice_number}`);
            return false;
        }

        const dueDate = new Date(invoice.due_date).toLocaleDateString();
        const restAmountFormatted = invoice.rest_amount?.toFixed(2) || '0';
        const totalFormatted = invoice.total?.toFixed(2) || '0';

        const message = `⚠️ *URGENT: Payment Overdue*\n\n` +
            `Dear ${invoice.client_name},\n\n` +
            `This is to notify you that your payment for invoice *${invoice.invoice_number}* is now OVERDUE.\n\n` +
            `📋 *Invoice Details:*\n` +
            `• Invoice Number: ${invoice.invoice_number}\n` +
            `• Total Amount: ₹${totalFormatted}\n` +
            `• Outstanding Amount: *₹${restAmountFormatted}*\n` +
            `• Due Date was: ${dueDate}\n\n` +
            `Please arrange for immediate payment to avoid any interruption of services.\n\n` +
            `If you have already made the payment, please disregard this message.`;

        return await whatsappService.sendMessage(invoice.client_phone, message);
    }

    /**
     * Process all invoices with rest amount
     */
    async processAllRestAmountInvoices(): Promise<{
        total: number;
        sent: number;
        failed: number;
        skipped: number;
    }> {
        const invoices = await this.findInvoicesWithRestAmount();

        console.log(`📊 Processing ${invoices.length} invoices with remaining balance`);

        let sent = 0;
        let failed = 0;
        let skipped = 0;

        for (const invoice of invoices) {
            try {
                if (!invoice.client_phone) {
                    console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - no phone number`);
                    skipped++;
                    continue;
                }

                console.log(`📤 Sending reminder for invoice ${invoice.invoice_number} to ${invoice.client_phone}`);

                const success = await this.sendInvoiceReminder(invoice);

                if (success) {
                    sent++;
                    console.log(`✅ Reminder sent for invoice ${invoice.invoice_number}`);

                    await supabaseAdmin
                        .from('invoices')
                        .update({ last_reminder_sent: new Date().toISOString() })
                        .eq('id', invoice.id);
                } else {
                    failed++;
                    console.log(`❌ Failed to send reminder for invoice ${invoice.invoice_number}`);
                }

                // Small delay between messages
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Error processing invoice ${invoice.invoice_number}:`, error);
                failed++;
            }
        }

        console.log(`📊 Summary: Total=${invoices.length}, Sent=${sent}, Failed=${failed}, Skipped=${skipped}`);

        return {
            total: invoices.length,
            sent,
            failed,
            skipped
        };
    }

    /**
     * Process overdue invoices
     */
    async processOverdueInvoices(): Promise<{
        total: number;
        sent: number;
        failed: number;
    }> {
        const invoices = await this.findOverdueInvoices();

        console.log(`📊 Found ${invoices.length} overdue invoices`);

        let sent = 0;
        let failed = 0;

        for (const invoice of invoices) {
            try {
                if (!invoice.client_phone) {
                    console.log(`⏭️ Skipping overdue invoice ${invoice.invoice_number} - no phone number`);
                    continue;
                }

                const success = await this.sendOverdueNotification(invoice);
                if (success) {
                    sent++;
                    console.log(`✅ Overdue notification sent for invoice ${invoice.invoice_number}`);

                    await supabaseAdmin
                        .from('invoices')
                        .update({
                            status: 'overdue',
                            last_reminder_sent: new Date().toISOString()
                        })
                        .eq('id', invoice.id);
                } else {
                    failed++;
                }

                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Error processing overdue invoice ${invoice.invoice_number}:`, error);
                failed++;
            }
        }

        return {
            total: invoices.length,
            sent,
            failed
        };
    }
}

export default new InvoiceNotificationService();