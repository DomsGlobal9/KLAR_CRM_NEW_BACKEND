import { envConfig } from '../config';
import { mailConfig, MailOptions } from '../config/mail.config';
import { supabase } from '../config/supabase.config';
import { emailMessageRepository } from '../repositories/email-message.repository';
import { emailRepository } from '../repositories/email.repository';
import { v4 as uuidv4 } from 'uuid';



export interface SendEmailPayload {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    requireNewLead?: boolean;
    leadId?: string;
    trackingId?: string;
    threadId?: string;
    source?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: Buffer | string;
        contentType?: string;
        encoding?: string;
    }>;
}

export interface EmailResponse {
    success: boolean;
    messageId?: string;
    response?: string;
    error?: string;
}

export interface BulkEmailPayload {
    emails: SendEmailPayload[];
}

export class EmailService {
    async sendEmail(payload: SendEmailPayload): Promise<EmailResponse> {
        try {
            if (!payload.to) {
                throw new Error('Recipient (to) is required');
            }
            if (!payload.subject) {
                throw new Error('Subject is required');
            }
            if (!payload.text && !payload.html) {
                throw new Error('Either text or html content is required');
            }

            const processRecipients = (recipients: string | string[] | undefined): string[] => {
                if (!recipients) return [];
                const arr = Array.isArray(recipients) ? recipients : [recipients];
                return [...new Set(arr.map(r => r.trim()))];
            };

            const uniqueTo = processRecipients(payload.to);
            const uniqueCc = processRecipients(payload.cc);
            const uniqueBcc = processRecipients(payload.bcc);

            const trackingId = payload.trackingId || uuidv4();

            let finalSubject = payload.subject;
            finalSubject += ` [TID:${trackingId}]`;

            if (payload.leadId) {
                finalSubject += ` [LEAD_ID:${payload.leadId}]`;
            }

            const result = await mailConfig.sendMail({
                from: process.env.SMTP_FROM || envConfig.SMTP_USER,
                to: uniqueTo,
                subject: finalSubject,
                text: payload.text,
                html: payload.html,
                cc: uniqueCc.length > 0 ? uniqueCc : undefined,
                bcc: uniqueBcc.length > 0 ? uniqueBcc : undefined,
                replyTo: payload.replyTo || envConfig.SMTP_USER,
                attachments: payload.attachments,
                headers: payload.threadId
                    ? {
                        'In-Reply-To': payload.threadId,
                        'References': payload.threadId,
                    }
                    : undefined,
            });

            await emailMessageRepository.createEmailMessage({
                tracking_id: trackingId,
                parent_tracking_id: null,
                message_id: result.messageId,
                in_reply_to: null,
                direction: 'outgoing',
                from_email: process.env.SMTP_FROM || envConfig.SMTP_USER,
                to_email: uniqueTo,
                cc_email: uniqueCc.length > 0 ? uniqueCc : null,
                bcc_email: uniqueBcc.length > 0 ? uniqueBcc : null,
                subject: finalSubject,
                body: payload.text || null,
                html_body: payload.html || null,
                status: 'sent',
                lead_id: payload.leadId || null,
                raw_headers: null,
                error: null,
            });

            return {
                success: true,
                messageId: result.messageId,
                response: result.response,
            };

        } catch (error: any) {
            console.error('EmailService.sendEmail error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send email',
            };
        }
    }

    async sendBulkEmails(payload: BulkEmailPayload): Promise<{
        success: boolean;
        results: Array<{ email: SendEmailPayload; response: EmailResponse }>;
        successful: number;
        failed: number;
    }> {
        const results = [];
        let successful = 0;
        let failed = 0;

        for (const email of payload.emails) {
            const response = await this.sendEmail(email);
            results.push({ email, response });

            if (response.success) {
                successful++;
            } else {
                failed++;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
            success: failed === 0,
            results,
            successful,
            failed,
        };
    }

    async sendTestEmail(to?: string): Promise<EmailResponse> {
        try {
            const testPayload: SendEmailPayload = {
                to: to || process.env.SMTP_USER || 'test@example.com',
                subject: 'Test Email from Mail Service',
                text: 'This is a test email sent from your mail service backend.',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Test Email</h1>
            <p>This is a test email sent from your mail service backend.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            </div>
            <p>If you received this email, your mail service is working correctly! ✅</p>
          </div>
        `,
            };

            return await this.sendEmail(testPayload);
        } catch (error: any) {
            console.error('EmailService.sendTestEmail error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send test email',
            };
        }
    }

    validateEmailAddresses(emails: string | string[]): { valid: string[]; invalid: string[] } {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailArray = Array.isArray(emails) ? emails : [emails];

        const valid: string[] = [];
        const invalid: string[] = [];

        emailArray.forEach(email => {
            if (emailRegex.test(email)) {
                valid.push(email);
            } else {
                invalid.push(email);
            }
        });

        return { valid, invalid };
    }

    async getServiceStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        message: string;
        timestamp: string;
        smtpConfig: {
            host: string;
            port: number;
            secure: boolean;
            user: string;
        };
    }> {
        try {
            await mailConfig.getTransporter().verify();

            return {
                status: 'healthy',
                message: 'Email service is operational',
                timestamp: new Date().toISOString(),
                smtpConfig: {
                    host: process.env.SMTP_HOST || 'not configured',
                    port: parseInt(process.env.SMTP_PORT || '587'),
                    secure: process.env.SMTP_SECURE === 'true',
                    user: process.env.SMTP_USER?.split('@')[0] + '...' || 'not configured',
                },
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'SMTP connection failed',
                timestamp: new Date().toISOString(),
                smtpConfig: {
                    host: process.env.SMTP_HOST || 'not configured',
                    port: parseInt(process.env.SMTP_PORT || '587'),
                    secure: process.env.SMTP_SECURE === 'true',
                    user: process.env.SMTP_USER?.split('@')[0] + '...' || 'not configured',
                },
            };
        }
    }
}

export const emailService = new EmailService();