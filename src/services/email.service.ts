import { mailConfig, MailOptions } from '../config/mail.config';

export interface SendEmailPayload {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
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
    /**
     * Send a single email
     */
    async sendEmail(payload: SendEmailPayload): Promise<EmailResponse> {
        try {
            // Validate required fields
            if (!payload.to) {
                throw new Error('Recipient (to) is required');
            }
            if (!payload.subject) {
                throw new Error('Subject is required');
            }
            if (!payload.text && !payload.html) {
                throw new Error('Either text or html content is required');
            }

            // Convert single recipient to array for consistency
            const toArray = Array.isArray(payload.to) ? payload.to : [payload.to];

            // Send email using mail config
            const result = await mailConfig.sendMail({
                to: toArray,
                subject: payload.subject,
                text: payload.text,
                html: payload.html,
                cc: payload.cc,
                bcc: payload.bcc,
                replyTo: payload.replyTo,
                attachments: payload.attachments,
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

    /**
     * Send bulk emails
     */
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

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return {
            success: failed === 0,
            results,
            successful,
            failed,
        };
    }

    /**
     * Send a test email
     */
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

    /**
     * Validate email addresses
     */
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

    /**
     * Get service status
     */
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
            // Test SMTP connection
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