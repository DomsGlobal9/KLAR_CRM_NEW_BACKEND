import { Request, Response } from 'express';
import { emailReplyService } from '../services/emailReply.service';

export const emailReplyController = {

    async sendReply(req: Request, res: Response) {
        try {
            const { trackingId } = req.params;
            const { text, html, cc, bcc, attachments } = req.body;

            if (!trackingId) {
                return res.status(400).json({
                    success: false,
                    error: 'Tracking ID is required'
                });
            }

            if (!text && !html) {
                return res.status(400).json({
                    success: false,
                    error: 'Either text or html content is required'
                });
            }

            const result = await emailReplyService.sendReply({
                trackingId: trackingId as string,
                text,
                html,
                cc,
                bcc,
                attachments
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                message: 'Reply sent successfully',
                data: result
            });

        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
};