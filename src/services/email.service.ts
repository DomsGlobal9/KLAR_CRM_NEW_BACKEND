import axios from 'axios';
import { envConfig } from '../config';
import { emailMessageRepository } from '../repositories/email-message.repository';
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
    userId?: string;
    senderName?: string;
    senderEmail?: string;
    trackingId?: string;
    threadId?: string;
    source?: string;
    saveToDb?: boolean;
    isOtp?: boolean;
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
    private getBackendUrl(path: string = '/email/send'): string {
        const baseUrl = (envConfig.EMAIL_BACKEND_URL || 'http://localhost:5013/api/emails').replace(/\/+$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    }

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
            if (!payload.isOtp) {
                finalSubject += ` [TID:${trackingId}]`;
                if (payload.leadId) {
                    finalSubject += ` [LEAD_ID:${payload.leadId}]`;
                }
            }

            const formattedAttachments = payload.attachments?.map((att) => ({
                filename: att.filename,
                content: att.content ? (Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content) : undefined,
                contentType: att.contentType,
                encoding: Buffer.isBuffer(att.content) ? 'base64' : att.encoding,
            }));

            // Call Email Backend Service (BullMQ / SES / Redis)
            const backendEndpoint = this.getBackendUrl('/email/send');
            const response = await axios.post(
                backendEndpoint,
                {
                    to: uniqueTo,
                    subject: finalSubject,
                    text: payload.text,
                    html: payload.html,
                    cc: uniqueCc.length > 0 ? uniqueCc : undefined,
                    bcc: uniqueBcc.length > 0 ? uniqueBcc : undefined,
                    leadId: payload.leadId,
                    trackingId,
                    userId: payload.userId,
                    user_id: payload.userId,
                    senderName: payload.senderName,
                    user_name: payload.senderName,
                    senderEmail: payload.senderEmail,
                    user_mail: payload.senderEmail,
                    user_email: payload.senderEmail,
                    attachments: formattedAttachments,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 20000,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );

            const responseData = response.data;
            const messageId = responseData?.data?.messageId || responseData?.data?.jobId || trackingId;

            return {
                success: true,
                messageId,
                response: 'Email dispatched via Email Backend Service',
            };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send email via Email Backend Service';
            console.error('[EmailService] Send email error:', errorMsg);

            return {
                success: false,
                error: errorMsg,
            };
        }
    }

    async sendBulkEmails(payload: BulkEmailPayload): Promise<{
        success: boolean;
        results: Array<{ email: SendEmailPayload; response: EmailResponse }>;
        successful: number;
        failed: number;
    }> {
        try {
            const processRecipients = (recipients: string | string[] | undefined): string[] => {
                if (!recipients) return [];
                const arr = Array.isArray(recipients) ? recipients : [recipients];
                return [...new Set(arr.map(r => r.trim()))];
            };

            const formattedEmails = payload.emails.map((email) => {
                const uniqueTo = processRecipients(email.to)[0] || '';
                return {
                    to: uniqueTo,
                    subject: email.subject,
                    text: email.text,
                    html: email.html,
                    leadId: email.leadId,
                    userId: email.userId,
                    user_id: email.userId,
                    senderName: email.senderName,
                    user_name: email.senderName,
                    senderEmail: email.senderEmail,
                    user_mail: email.senderEmail,
                    user_email: email.senderEmail,
                };
            });

            const bulkEndpoint = this.getBackendUrl('/email/send-bulk');
            const response = await axios.post(bulkEndpoint, { emails: formattedEmails }, { timeout: 15000 });

            const queuedCount = response.data?.data?.queuedCount || payload.emails.length;
            return {
                success: true,
                results: payload.emails.map((e) => ({ email: e, response: { success: true } })),
                successful: queuedCount,
                failed: 0,
            };
        } catch (error: any) {
            console.error('[EmailService] Send bulk emails error:', error.message);
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
            }

            return {
                success: failed === 0,
                results,
                successful,
                failed,
            };
        }
    }

    async sendTestEmail(to?: string): Promise<EmailResponse> {
        try {
            const testPayload: SendEmailPayload = {
                to: to || envConfig.SMTP_USER || 'test@example.com',
                subject: 'Test Email from KLAR CRM Backend Service',
                text: 'This is a test email sent via Email Backend Service.',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Test Email</h1>
                    <p>This is a test email sent via Email Backend Service.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Backend Endpoint:</strong> ${envConfig.EMAIL_BACKEND_URL}</p>
                    </div>
                    <p>If you received this email, your Email Backend integration is working correctly! ✅</p>
                </div>
                `,
            };

            return await this.sendEmail(testPayload);
        } catch (error: any) {
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
        backendUrl: string;
        queueMetrics?: any;
    }> {
        try {
            const statusUrl = this.getBackendUrl('/queue/status');
            const res = await axios.get(statusUrl, { timeout: 3000 });

            return {
                status: 'healthy',
                message: 'Email Backend Service is operational',
                timestamp: new Date().toISOString(),
                backendUrl: envConfig.EMAIL_BACKEND_URL,
                queueMetrics: res.data?.data,
            };
        } catch (error: any) {
            return {
                status: 'degraded',
                message: `Email Backend Service ping failed: ${error.message}`,
                timestamp: new Date().toISOString(),
                backendUrl: envConfig.EMAIL_BACKEND_URL,
            };
        }
    }
}

export const emailService = new EmailService();