// user-credentials.service.ts
import { emailService, SendEmailPayload } from './email.service';
import WhatsAppService from './whatsapp.service';

export interface UserCredentialsPayload {
    userId: string;
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    loginUrl?: string;
    appName?: string;
    createdBy?: string;
    role?: string;
}

export interface CredentialsDeliveryResult {
    success: boolean;
    email?: {
        sent: boolean;
        error?: string;
        messageId?: string;
        timestamp?: string;
    };
    whatsapp?: {
        sent: boolean;
        error?: string;
        timestamp?: string;
    };
    message: string;
    timestamp: string;
}

export interface BulkCredentialsResult {
    total: number;
    successful: number;
    failed: number;
    results: Array<{
        userId: string;
        email: string;
        result: CredentialsDeliveryResult;
    }>;
}

class UserCredentialsService {
    private readonly DEFAULT_APP_NAME = 'Our Platform';
    private readonly DEFAULT_LOGIN_PATH = '/login';

    /**
     * Send user credentials via email only
     */
    async sendCredentialsViaEmail(payload: UserCredentialsPayload): Promise<{
        sent: boolean;
        error?: string;
        messageId?: string;
        timestamp?: string;
    }> {
        try {
            const appName = payload.appName || this.DEFAULT_APP_NAME;
            const loginUrl = payload.loginUrl || `${process.env.APP_URL || 'http://localhost:3000'}${this.DEFAULT_LOGIN_PATH}`;

            // Validate email
            const validation = emailService.validateEmailAddresses(payload.email);
            if (validation.invalid.length > 0) {
                return {
                    sent: false,
                    error: 'Invalid email format',
                    timestamp: new Date().toISOString()
                };
            }

            // Create email payload
            const emailPayload: SendEmailPayload = {
                to: payload.email,
                subject: `Welcome to ${appName} - Your Account Credentials`,
                text: this.createEmailText(payload, loginUrl, appName),
                html: this.createEmailHTML(payload, loginUrl, appName),
                requireNewLead: false // Important: Don't block existing leads
            };

            // Send email
            const result = await emailService.sendEmail(emailPayload);

            if (result.success) {
                return {
                    sent: true,
                    messageId: result.messageId,
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    sent: false,
                    error: result.error || 'Failed to send email',
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error: any) {
            console.error('Error sending credentials email:', error);
            return {
                sent: false,
                error: error.message || 'Unknown error sending email',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Send user credentials via WhatsApp only
     */
    async sendCredentialsViaWhatsApp(payload: UserCredentialsPayload): Promise<{
        sent: boolean;
        error?: string;
        timestamp?: string;
    }> {
        try {
            if (!payload.phoneNumber) {
                return {
                    sent: false,
                    error: 'Phone number is required for WhatsApp delivery',
                    timestamp: new Date().toISOString()
                };
            }

            // Check WhatsApp service status
            if (!WhatsAppService.getStatus()) {
                return {
                    sent: false,
                    error: 'WhatsApp service is not ready',
                    timestamp: new Date().toISOString()
                };
            }

            const appName = payload.appName || this.DEFAULT_APP_NAME;
            const loginUrl = payload.loginUrl || `${process.env.APP_URL || 'http://localhost:3000'}${this.DEFAULT_LOGIN_PATH}`;

            const message = this.createWhatsAppMessage(payload, loginUrl, appName);

            const sent = await WhatsAppService.sendMessage(payload.phoneNumber, message);

            if (sent) {
                return {
                    sent: true,
                    timestamp: new Date().toISOString()
                };
            } else {
                return {
                    sent: false,
                    error: 'Failed to send WhatsApp message',
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error: any) {
            console.error('Error sending credentials via WhatsApp:', error);
            return {
                sent: false,
                error: error.message || 'Unknown error sending WhatsApp',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Send user credentials via both email and WhatsApp
     */
    async sendUserCredentials(payload: UserCredentialsPayload): Promise<CredentialsDeliveryResult> {
        const result: CredentialsDeliveryResult = {
            success: false,
            message: 'Credentials delivery attempt completed',
            timestamp: new Date().toISOString()
        };

        console.log(`📧 Sending credentials for user: ${payload.name} (ID: ${payload.userId})`);
        console.log(`👤 Role: ${payload.role || 'User'}`);
        console.log(`👑 Created by: ${payload.createdBy || 'Superadmin'}`);

        let anySuccess = false;

        // Send via email (always try if email is provided)
        if (payload.email) {
            console.log(`📧 Attempting email delivery to ${payload.email}...`);
            const emailResult = await this.sendCredentialsViaEmail(payload);

            result.email = {
                sent: emailResult.sent,
                error: emailResult.error,
                messageId: emailResult.messageId,
                timestamp: emailResult.timestamp
            };

            if (emailResult.sent) {
                anySuccess = true;
                console.log('✅ Credentials email sent successfully');
            } else {
                console.log(`❌ Failed to send credentials email: ${emailResult.error}`);
            }
        } else {
            console.log('⚠️ No email address provided, skipping email delivery');
        }

        // Send via WhatsApp (if phone number provided)
        if (payload.phoneNumber) {
            console.log(`📱 Attempting WhatsApp delivery to ${payload.phoneNumber}...`);
            const whatsappResult = await this.sendCredentialsViaWhatsApp(payload);

            result.whatsapp = {
                sent: whatsappResult.sent,
                error: whatsappResult.error,
                timestamp: whatsappResult.timestamp
            };

            if (whatsappResult.sent) {
                anySuccess = true;
                console.log('✅ Credentials sent via WhatsApp successfully');
            } else {
                console.log(`❌ Failed to send credentials via WhatsApp: ${whatsappResult.error}`);
            }
        } else {
            console.log('⚠️ No phone number provided, skipping WhatsApp delivery');
        }

        result.success = anySuccess;

        if (anySuccess) {
            result.message = `Credentials delivered successfully via ${result.email?.sent ? 'email' : ''}${result.email?.sent && result.whatsapp?.sent ? ' and ' : ''}${result.whatsapp?.sent ? 'WhatsApp' : ''}`;
        } else {
            result.message = 'Failed to deliver credentials via any channel';
        }

        console.log(`📊 Credentials delivery complete. Success: ${result.success}`);
        return result;
    }

    /**
     * Send credentials with priority channel (try primary, fallback to secondary)
     */
    async sendCredentialsWithPriority(
        payload: UserCredentialsPayload,
        priority: 'email' | 'whatsapp'
    ): Promise<CredentialsDeliveryResult> {
        console.log(`🎯 Sending credentials with ${priority} priority`);

        if (priority === 'email' && payload.email) {
            const emailResult = await this.sendCredentialsViaEmail(payload);
            if (emailResult.sent) {
                return {
                    success: true,
                    email: emailResult,
                    message: 'Credentials sent successfully via email',
                    timestamp: new Date().toISOString()
                };
            } else if (payload.phoneNumber) {
                // Fallback to WhatsApp
                console.log('⚠️ Email failed, falling back to WhatsApp');
                const whatsappResult = await this.sendCredentialsViaWhatsApp(payload);
                return {
                    success: whatsappResult.sent,
                    whatsapp: whatsappResult,
                    email: emailResult,
                    message: whatsappResult.sent ?
                        'Credentials sent via WhatsApp (email failed)' :
                        'Failed to send credentials via both channels',
                    timestamp: new Date().toISOString()
                };
            }
        }
        else if (priority === 'whatsapp' && payload.phoneNumber) {
            const whatsappResult = await this.sendCredentialsViaWhatsApp(payload);
            if (whatsappResult.sent) {
                return {
                    success: true,
                    whatsapp: whatsappResult,
                    message: 'Credentials sent successfully via WhatsApp',
                    timestamp: new Date().toISOString()
                };
            } else if (payload.email) {
                // Fallback to email
                console.log('⚠️ WhatsApp failed, falling back to email');
                const emailResult = await this.sendCredentialsViaEmail(payload);
                return {
                    success: emailResult.sent,
                    email: emailResult,
                    whatsapp: whatsappResult,
                    message: emailResult.sent ?
                        'Credentials sent via email (WhatsApp failed)' :
                        'Failed to send credentials via both channels',
                    timestamp: new Date().toISOString()
                };
            }
        }

        return {
            success: false,
            message: `Unable to send credentials: ${priority} channel not available`,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Send credentials to multiple users
     */
    async sendBulkCredentials(
        users: UserCredentialsPayload[],
        options?: {
            channels?: ('email' | 'whatsapp')[];
            delayBetween?: number;
        }
    ): Promise<BulkCredentialsResult> {
        const results: Array<{
            userId: string;
            email: string;
            result: CredentialsDeliveryResult;
        }> = [];

        let successful = 0;
        let failed = 0;

        console.log(`📦 Sending credentials to ${users.length} users...`);

        for (const user of users) {
            let result: CredentialsDeliveryResult;

            if (options?.channels) {
                // Send via specified channels only
                const deliveryResult = await this.sendCredentialsWithCustomChannels(user, options.channels);
                result = deliveryResult;
            } else {
                // Send via all available channels
                result = await this.sendUserCredentials(user);
            }

            results.push({
                userId: user.userId,
                email: user.email,
                result
            });

            if (result.success) {
                successful++;
            } else {
                failed++;
            }

            // Add delay between sends to avoid rate limiting
            if (options?.delayBetween) {
                await new Promise(resolve => setTimeout(resolve, options.delayBetween));
            }
        }

        console.log(`✅ Bulk credentials delivery complete: ${successful} successful, ${failed} failed`);

        return {
            total: users.length,
            successful,
            failed,
            results
        };
    }

    /**
     * Send credentials via custom channels
     */
    private async sendCredentialsWithCustomChannels(
        payload: UserCredentialsPayload,
        channels: ('email' | 'whatsapp')[]
    ): Promise<CredentialsDeliveryResult> {
        const result: CredentialsDeliveryResult = {
            success: false,
            message: 'Credentials delivery attempt completed',
            timestamp: new Date().toISOString()
        };

        let anySuccess = false;

        if (channels.includes('email') && payload.email) {
            const emailResult = await this.sendCredentialsViaEmail(payload);
            result.email = emailResult;
            if (emailResult.sent) anySuccess = true;
        }

        if (channels.includes('whatsapp') && payload.phoneNumber) {
            const whatsappResult = await this.sendCredentialsViaWhatsApp(payload);
            result.whatsapp = whatsappResult;
            if (whatsappResult.sent) anySuccess = true;
        }

        result.success = anySuccess;
        result.message = anySuccess ?
            'Credentials sent via selected channels' :
            'Failed to send credentials via any selected channel';

        return result;
    }

    /**
     * Create email text content
     */
    private createEmailText(payload: UserCredentialsPayload, loginUrl: string, appName: string): string {
        const roleText = payload.role ? `Role: ${payload.role}\n` : '';

        return `
Welcome to ${appName}!

Hello ${payload.name},

Your account has been created successfully. Here are your login credentials:

📧 Email: ${payload.email}
🔑 Password: ${payload.password}
${roleText}
You can log in using the link below:
${loginUrl}

⚠️ Security Note: For security reasons, we recommend changing your password after your first login.

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
${appName} Team
        `.trim();
    }

    /**
     * Create email HTML content
     */
    private createEmailHTML(payload: UserCredentialsPayload, loginUrl: string, appName: string): string {
        const roleBadge = payload.role ?
            `<p style="margin: 10px 0;"><strong>👔 Role:</strong> <span style="background-color: #e3f2fd; padding: 2px 8px; border-radius: 4px;">${payload.role}</span></p>` :
            '';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #4CAF50; border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
        <h1 style="color: white; margin-bottom: 10px;">Welcome to ${appName}! 🎉</h1>
        <p style="color: white; font-size: 18px;">Hello ${payload.name},</p>
    </div>

    <div style="background-color: #ffffff; border-radius: 8px; padding: 25px; margin-bottom: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #4CAF50; margin-top: 0;">Your Account Credentials</h2>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        
        <div style="background-color: #f5f5f5; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>📧 Email:</strong> ${payload.email}</p>
            <p style="margin: 10px 0;"><strong>🔑 Password:</strong> <span style="font-family: monospace; background-color: #e0e0e0; padding: 2px 6px; border-radius: 4px;">${payload.password}</span></p>
            ${roleBadge}
        </div>

        <div style="background-color: #e3f2fd; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
            <a href="${loginUrl}" 
               style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Click Here to Login
            </a>
            <p style="margin-top: 10px; color: #666; font-size: 14px;">
                Or copy this link: <a href="${loginUrl}" style="color: #2196F3;">${loginUrl}</a>
            </p>
        </div>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Security Note:</strong> For security reasons, we recommend changing your password after your first login.
            </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #666;">Best regards,<br>${appName} Team</p>
        <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
            This is an automated message, please do not reply directly to this email.
        </p>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Create WhatsApp message content
     */
    private createWhatsAppMessage(payload: UserCredentialsPayload, loginUrl: string, appName: string): string {
        const roleText = payload.role ? `Role: ${payload.role}\n` : '';

        return `
    *Welcome to ${appName}!* 🎉

    Hello ${payload.name},

    Your account has been created successfully. Here are your login credentials:

    📧 *Email:* ${payload.email}
    🔑 *Password:* ${payload.password}
    ${roleText}
    🔗 *Login Link:* ${loginUrl}

    ⚠️ *Security Note:* Please change your password after your first login.

    Thank you for joining ${appName}!

    Best regards,
    ${appName} Team
            `.trim();
        }

    /**
     * Get service status
     */
    async getServiceStatus(): Promise<{
        email: { ready: boolean; status: string };
        whatsapp: { ready: boolean; status: string };
        timestamp: string;
    }> {
        const emailStatus = await emailService.getServiceStatus();

        return {
            email: {
                ready: emailStatus.status === 'healthy',
                status: emailStatus.status
            },
            whatsapp: {
                ready: WhatsAppService.getStatus(),
                status: WhatsAppService.getStatus() ? 'connected' : 'disconnected'
            },
            timestamp: new Date().toISOString()
        };
    }
}

export const userCredentialsService = new UserCredentialsService();