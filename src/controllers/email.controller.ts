import { 
    Request, 
    Response 
} from 'express';
import { 
    emailService, 
    SendEmailPayload, 
    BulkEmailPayload 
} from '../services';

export class EmailController {
    /**
     * Send a single email
     */
    async sendEmail(req: Request, res: Response): Promise<void> {
        try {
            const payload: SendEmailPayload = req.body;

            // Basic validation
            if (!payload || Object.keys(payload).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Request body is required',
                });
                return;
            }

            const result = await emailService.sendEmail(payload);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Email sent successfully',
                    data: {
                        messageId: result.messageId,
                        response: result.response,
                    },
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to send email',
                    error: result.error,
                });
            }
        } catch (error: any) {
            console.error('EmailController.sendEmail error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmails(req: Request, res: Response): Promise<void> {
        try {
            const payload: BulkEmailPayload = req.body;

            // Validation
            if (!payload.emails || !Array.isArray(payload.emails) || payload.emails.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Emails array is required and must not be empty',
                });
                return;
            }

            // Limit bulk emails to prevent abuse
            if (payload.emails.length > 100) {
                res.status(400).json({
                    success: false,
                    message: 'Bulk email limit exceeded. Maximum 100 emails per request',
                });
                return;
            }

            const result = await emailService.sendBulkEmails(payload);

            res.status(200).json({
                success: result.success,
                message: `Sent ${result.successful} emails successfully, ${result.failed} failed`,
                data: {
                    total: payload.emails.length,
                    successful: result.successful,
                    failed: result.failed,
                    results: result.results,
                },
            });
        } catch (error: any) {
            console.error('EmailController.sendBulkEmails error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }

    /**
     * Send a test email
     */
    async sendTestEmail(req: Request, res: Response): Promise<void> {
        try {
            const { to } = req.body;
            const result = await emailService.sendTestEmail(to);

            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Test email sent successfully',
                    data: {
                        messageId: result.messageId,
                        response: result.response,
                    },
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to send test email',
                    error: result.error,
                });
            }
        } catch (error: any) {
            console.error('EmailController.sendTestEmail error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }

    /**
     * Validate email addresses
     */
    validateEmails(req: Request, res: Response): void {
        try {
            const { emails } = req.body;

            if (!emails) {
                res.status(400).json({
                    success: false,
                    message: 'Emails field is required',
                });
                return;
            }

            const validationResult = emailService.validateEmailAddresses(emails);

            res.status(200).json({
                success: true,
                message: 'Email validation completed',
                data: validationResult,
            });
        } catch (error: any) {
            console.error('EmailController.validateEmails error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }

    /**
     * Get email service status
     */
    async getServiceStatus(req: Request, res: Response): Promise<void> {
        try {
            const status = await emailService.getServiceStatus();

            res.status(200).json({
                success: true,
                message: 'Service status retrieved',
                data: status,
            });
        } catch (error: any) {
            console.error('EmailController.getServiceStatus error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get service status',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req: Request, res: Response): Promise<void> {
        try {
            const status = await emailService.getServiceStatus();

            res.status(status.status === 'healthy' ? 200 : 503).json({
                success: status.status === 'healthy',
                status: status.status,
                message: status.message,
                timestamp: status.timestamp,
                service: 'Email Service',
                version: '1.0.0',
            });
        } catch (error: any) {
            console.error('EmailController.healthCheck error:', error);
            res.status(503).json({
                success: false,
                status: 'unhealthy',
                message: 'Service health check failed',
                timestamp: new Date().toISOString(),
                service: 'Email Service',
                version: '1.0.0',
            });
        }
    }
}

export const emailController = new EmailController();