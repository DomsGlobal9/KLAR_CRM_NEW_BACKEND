import getWhatsAppService from './whatsapp.service';
import { emailService, SendEmailPayload } from './email.service';

export interface PDFDeliveryOptions {
    leadId: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    pdfUrl: string;
    pdfFileName: string;
    htmlContent?: string;
    pdfBuffer?: Buffer;
}

export interface DeliveryResult {
    success: boolean;
    whatsapp?: {
        sent: boolean;
        error?: string;
        timestamp?: string;
    };
    email?: {
        sent: boolean;
        error?: string;
        messageId?: string;
        timestamp?: string;
    };
    message: string;
}

type DocumentType = 'invoice' | 'quotation' | 'proposal' | 'itinerary';

class PDFDeliveryService {
    private service: any;

    constructor() {
        this.service = getWhatsAppService();
    }

    /**
    * Helper to detect document type based on the file name
    */
    private detectDocumentType(fileName: string): DocumentType {
        const lowerName = fileName.toLowerCase();
        if (lowerName.includes('invoice')) return 'invoice';
        if (lowerName.includes('quotation')) return 'quotation';
        if (lowerName.includes('proposal')) return 'proposal';
        return 'itinerary';
    }

    /**
     * Cleans phone numbers to ensure compatibility with standard WhatsApp formats
     */
    private sanitizePhoneNumber(phone: string): string {
        let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned;
        }
        return cleaned;
    }

    /**
     * Send PDF via WhatsApp only
     */
    async sendViaWhatsApp(phoneNumber: string, pdfUrl: string, clientName: string, pdfFileName: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!phoneNumber) {
                return { success: false, error: 'Phone number is required' };
            }

            if (!this.service || !this.service.getStatus()) {
                return { success: false, error: 'WhatsApp service is not ready' };
            }

            const sanitizedPhone = this.sanitizePhoneNumber(phoneNumber);
            const message = this.createWhatsAppMessage(clientName, pdfUrl);

            const sent = await this.service.sendMessage(sanitizedPhone, message);

            if (sent) {
                return { success: true };
            } else {
                return { success: false, error: 'Failed to send WhatsApp message' };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Unknown WhatsApp delivery error'
            };
        }
    }

    /**
     * Send PDF via Email only (includes direct pdfBuffer attachment if provided)
     */
    async sendViaEmail(
        emailAddress: string,
        pdfUrl: string,
        clientName: string,
        leadId: string,
        htmlContent: string | undefined,
        pdfFileName: string,
        pdfBuffer?: Buffer
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            if (!emailAddress) {
                return { success: false, error: 'Email address is required' };
            }

            const validation = emailService.validateEmailAddresses(emailAddress);
            if (validation.invalid.length > 0) {
                return { success: false, error: 'Invalid email format' };
            }

            const docType = this.detectDocumentType(pdfFileName);
            const subjects: Record<DocumentType, string> = {
                invoice: `Your Invoice Details - ${clientName}`,
                quotation: `Your Quote Details - ${clientName}`,
                proposal: `Your Travel Proposal - ${clientName}`,
                itinerary: `Your Custom Itinerary Details - ${clientName}`
            };

            const attachments = pdfBuffer ? [{
                filename: pdfFileName,
                content: pdfBuffer,
                contentType: 'application/pdf',
            }] : [];

            const emailPayload: SendEmailPayload = {
                to: emailAddress,
                subject: subjects[docType] || `Your ${docType} - ${clientName}`,
                text: this.createEmailText(clientName, pdfUrl),
                html: htmlContent || this.createEmailHTML(clientName, pdfUrl, docType),
                requireNewLead: false,
                attachments
            };

            const result = await emailService.sendEmail(emailPayload);

            if (result.success) {
                return {
                    success: true,
                    messageId: result.messageId
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Failed to send email'
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Unknown email delivery error'
            };
        }
    }

    /**
     * Send PDF via both WhatsApp and Email
     */
    async deliverPDF(options: PDFDeliveryOptions): Promise<DeliveryResult> {
        const { leadId, clientName, clientEmail, clientPhone, pdfUrl, pdfFileName, htmlContent, pdfBuffer } = options;

        const result: DeliveryResult = {
            success: false,
            message: 'Delivery attempt completed'
        };

        let anySuccess = false;

        if (clientPhone) {
            const whatsappResult = await this.sendViaWhatsApp(clientPhone, pdfUrl, clientName, pdfFileName);
            result.whatsapp = {
                sent: whatsappResult.success,
                error: whatsappResult.error,
                timestamp: new Date().toISOString()
            };
            if (whatsappResult.success) {
                anySuccess = true;
            }
        }

        if (clientEmail) {
            const emailResult = await this.sendViaEmail(clientEmail, pdfUrl, clientName, leadId, htmlContent, pdfFileName, pdfBuffer);

            result.email = {
                sent: emailResult.success,
                error: emailResult.error,
                messageId: emailResult.messageId,
                timestamp: new Date().toISOString()
            };

            if (emailResult.success) {
                anySuccess = true;
            }
        }

        result.success = anySuccess;
        result.message = anySuccess
            ? 'PDF delivered successfully via at least one channel'
            : 'Failed to deliver PDF via any channel';

        return result;
    }

    /**
     * Send PDF via specified channels only
     */
    async deliverPDFViaChannels(
        options: PDFDeliveryOptions,
        channels: { whatsapp?: boolean; email?: boolean }
    ): Promise<DeliveryResult> {
        const { leadId, clientName, clientEmail, clientPhone, pdfUrl, pdfFileName, htmlContent, pdfBuffer } = options;

        const result: DeliveryResult = {
            success: false,
            message: 'Delivery attempt completed'
        };

        let anySuccess = false;

        if (channels.whatsapp && clientPhone) {
            const whatsappResult = await this.sendViaWhatsApp(clientPhone, pdfUrl, clientName, pdfFileName);
            result.whatsapp = {
                sent: whatsappResult.success,
                error: whatsappResult.error,
                timestamp: new Date().toISOString()
            };
            if (whatsappResult.success) anySuccess = true;
        }

        if (channels.email && clientEmail) {
            const emailResult = await this.sendViaEmail(clientEmail, pdfUrl, clientName, leadId, htmlContent, pdfFileName, pdfBuffer);
            result.email = {
                sent: emailResult.success,
                error: emailResult.error,
                messageId: emailResult.messageId,
                timestamp: new Date().toISOString()
            };
            if (emailResult.success) anySuccess = true;
        }

        result.success = anySuccess;
        result.message = anySuccess ?
            'PDF delivered successfully' :
            'Failed to deliver PDF via any requested channel';

        return result;
    }

    /**
     * Create WhatsApp message
     */
    private createWhatsAppMessage(clientName: string, pdfUrl: string): string {
        return `Hello ${clientName},

Your PDF document is ready. You can access it at:
${pdfUrl}

Thank you for choosing our services.`;
    }

    /**
     * Create plain text email content
     */
    private createEmailText(clientName: string, pdfUrl: string): string {
        return `Dear ${clientName},

Your customized travel document is attached to this email.

Thank you for choosing our services!`;
    }

    /**
     * Create HTML email content
     */
    private createEmailHTML(clientName: string, pdfUrl: string, docType: DocumentType): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #2563eb;">Your ${docType.toUpperCase()} Details</h2>
                <p>Dear <strong>${clientName}</strong>,</p>
                <p>Please find your ${docType} attached to this email.</p>
                <p style="margin-top: 20px;">If you have any questions, feel free to reply to this email.</p>
                <br/>
                <p>Best regards,<br/><strong>KLAR World Team</strong></p>
            </div>
        `;
    }
    /**
     * Send Reminder email
     */
    async sendReminderEmail(emailAddress: string, title: string, content: string, clientName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const emailPayload: SendEmailPayload = {
                to: emailAddress,
                subject: `Reminder: ${title}`,
                text: `Hello ${clientName},\n\nReminder: ${title}\n${content}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #2563eb;">Reminder: ${title}</h2>
                        <p>Hello <strong>${clientName}</strong>,</p>
                        <p>${content}</p>
                        <br/>
                        <p>Best regards,<br/><strong>KLAR World Team</strong></p>
                    </div>
                `,
            };

            const result = await emailService.sendEmail(emailPayload);
            return {
                success: result.success,
                messageId: result.messageId,
                error: result.error,
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Create Reminder WhatsApp message
     */
    createReminderWhatsApp(clientName: string, title: string, content: string): string {
        return `Hello ${clientName},\n\nReminder: ${title}\n${content}\n\nThank you!`;
    }
}

export const pdfDeliveryService = new PDFDeliveryService();