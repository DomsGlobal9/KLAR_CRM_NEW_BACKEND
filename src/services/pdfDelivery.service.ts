import WhatsAppService from './whatsapp.service';
import { emailService, SendEmailPayload } from './email.service';

export interface PDFDeliveryOptions {
    leadId: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    pdfUrl: string;
    pdfFileName: string;
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

class PDFDeliveryService {

    /**
     * Send PDF via WhatsApp only
     */
    async sendViaWhatsApp(phoneNumber: string, pdfUrl: string, clientName: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!phoneNumber) {
                return { success: false, error: 'Phone number is required' };
            }

            if (!WhatsAppService.getStatus()) {
                return { success: false, error: 'WhatsApp service is not ready' };
            }
            
            const message = this.createWhatsAppMessage(clientName, pdfUrl);

            const sent = await WhatsAppService.sendMessage(phoneNumber, message);

            if (sent) {
                return { success: true };
            } else {
                return { success: false, error: 'Failed to send WhatsApp message' };
            }
        } catch (error: any) {
            console.error('WhatsApp delivery error:', error);
            return {
                success: false,
                error: error.message || 'Unknown WhatsApp delivery error'
            };
        }
    }

    /**
     * Send PDF via Email only
     */
    async sendViaEmail(emailAddress: string, pdfUrl: string, clientName: string, leadId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            if (!emailAddress) {
                return { success: false, error: 'Email address is required' };
            }

            const validation = emailService.validateEmailAddresses(emailAddress);
            if (validation.invalid.length > 0) {
                return { success: false, error: 'Invalid email format' };
            }

            const emailPayload: SendEmailPayload = {
                to: emailAddress,
                subject: `Your Itinerary PDF - ${clientName}`,
                text: this.createEmailText(clientName, pdfUrl),
                html: this.createEmailHTML(clientName, pdfUrl),
                requireNewLead: false, 
                attachments: [] 
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
            console.error('Email delivery error:', error);
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
        const { leadId, clientName, clientEmail, clientPhone, pdfUrl, pdfFileName } = options;

        const result: DeliveryResult = {
            success: false,
            message: 'Delivery attempt completed'
        };

        console.log(`📦 Starting PDF delivery for ${clientName} (Lead: ${leadId})`);
        console.log(`📎 PDF URL: ${pdfUrl}`);

        let anySuccess = false;

        if (clientPhone) {
            console.log(`📱 Attempting WhatsApp delivery to ${clientPhone}...`);
            const whatsappResult = await this.sendViaWhatsApp(clientPhone, pdfUrl, clientName);

            result.whatsapp = {
                sent: whatsappResult.success,
                error: whatsappResult.error,
                timestamp: new Date().toISOString()
            };

            if (whatsappResult.success) {
                anySuccess = true;
                console.log('✅ WhatsApp delivery successful');
            } else {
                console.log(`❌ WhatsApp delivery failed: ${whatsappResult.error}`);
            }
        } else {
            console.log('⚠️ No phone number provided, skipping WhatsApp');
        }

        if (clientEmail) {
            console.log(`📧 Attempting email delivery to ${clientEmail}...`);
            const emailResult = await this.sendViaEmail(clientEmail, pdfUrl, clientName, leadId);

            result.email = {
                sent: emailResult.success,
                error: emailResult.error,
                messageId: emailResult.messageId,
                timestamp: new Date().toISOString()
            };

            if (emailResult.success) {
                anySuccess = true;
                console.log('✅ Email delivery successful');
            } else {
                console.log(`❌ Email delivery failed: ${emailResult.error}`);
            }
        } else {
            console.log('⚠️ No email address provided, skipping email');
        }

        result.success = anySuccess;

        if (anySuccess) {
            result.message = 'PDF delivered successfully via at least one channel';
        } else {
            result.message = 'Failed to deliver PDF via any channel';
        }

        console.log(`📊 Delivery complete. Success: ${result.success}`);
        return result;
    }

    /**
     * Send PDF via specified channels only
     */
    async deliverPDFViaChannels(
        options: PDFDeliveryOptions,
        channels: { whatsapp?: boolean; email?: boolean }
    ): Promise<DeliveryResult> {
        const { leadId, clientName, clientEmail, clientPhone, pdfUrl, pdfFileName } = options;

        const result: DeliveryResult = {
            success: false,
            message: 'Delivery attempt completed'
        };

        let anySuccess = false;

        if (channels.whatsapp && clientPhone) {
            const whatsappResult = await this.sendViaWhatsApp(clientPhone, pdfUrl, clientName);
            result.whatsapp = {
                sent: whatsappResult.success,
                error: whatsappResult.error,
                timestamp: new Date().toISOString()
            };
            if (whatsappResult.success) anySuccess = true;
        }

        if (channels.email && clientEmail) {
            const emailResult = await this.sendViaEmail(clientEmail, pdfUrl, clientName, leadId);
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
     * Create WhatsApp message with PDF link
     */
    private createWhatsAppMessage(clientName: string, pdfUrl: string): string {
        return `
            Dear ${clientName},

            Your customized itinerary is ready! 

            📎 Click here to view/download your PDF:
            ${pdfUrl}

            You can also download and save this PDF for your reference.

            Thank you for choosing our services! ✈️🌍

            Best regards,
            Your Travel Team
                    `.trim();
    }

    /**
     * Create plain text email content
     */
    private createEmailText(clientName: string, pdfUrl: string): string {
        return `
            Dear ${clientName},

            Your customized itinerary is ready! 

            You can view and download your PDF itinerary here:
            ${pdfUrl}

            This link will allow you to access your itinerary anytime.

            Thank you for choosing our services!

            Best regards,
            Your Travel Team
                    `.trim();
    }

    /**
     * Create HTML email content
     */
    private createEmailHTML(clientName: string, pdfUrl: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
        <h1 style="color: #0066cc; margin-bottom: 10px;">Your Itinerary is Ready! 🎉</h1>
        <p style="font-size: 18px; color: #555;">Dear ${clientName},</p>
    </div>

    <div style="background-color: #ffffff; border-radius: 8px; padding: 25px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #0066cc; margin-top: 0;">Your PDF Itinerary</h2>
        <p>Your customized travel itinerary has been generated and is ready for viewing.</p>
        
        <div style="background-color: #f0f7ff; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
            <a href="${pdfUrl}" 
               style="display: inline-block; background-color: #25D366; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                📄 View Your Itinerary PDF
            </a>
            <p style="margin-top: 10px; color: #666; font-size: 14px;">
                Click the button above to view and download your PDF
            </p>
        </div>

        <p><strong>📎 Direct Link:</strong><br>
        <a href="${pdfUrl}" style="color: #0066cc; word-break: break-all;">${pdfUrl}</a></p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
            ⚡ This link is publicly accessible and can be shared.
        </p>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #666;">Thank you for choosing our services! ✈️🌍</p>
        <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">Best regards,<br>Your Travel Team</p>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Get delivery service status
     */
    async getServiceStatus(): Promise<{
        whatsapp: { ready: boolean };
        email: { status: string; message: string };
    }> {
        const emailStatus = await emailService.getServiceStatus();

        return {
            whatsapp: {
                ready: WhatsAppService.getStatus()
            },
            email: {
                status: emailStatus.status,
                message: emailStatus.message
            }
        };
    }
}

export const pdfDeliveryService = new PDFDeliveryService();