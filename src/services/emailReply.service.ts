import { emailMessageRepository } from '../repositories/email-message.repository';
import { emailService } from './email.service';
import { envConfig } from '../config';
import { v4 as uuidv4 } from 'uuid';

export interface SendReplyPayload {
    trackingId: string;
    text?: string;
    html?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: Buffer | string;
        contentType?: string;
        encoding?: string;
    }>;
}

export const emailReplyService = {
    async sendReply(payload: SendReplyPayload) {
        try {
            const { trackingId, text, html, cc, bcc, attachments } = payload;

            const threadMessages = await emailMessageRepository.getThreadByTrackingId(trackingId);

            if (!threadMessages || threadMessages.length === 0) {
                return {
                    success: false,
                    error: 'No email thread found for this tracking ID'
                };
            }

            const lastMessage = threadMessages[threadMessages.length - 1];

            const replyExists = await emailMessageRepository.checkReplyExists(
                trackingId,
                lastMessage.message_id || ''
            );

            if (replyExists) {
                return {
                    success: false,
                    error: 'Reply already sent for this message'
                };
            }

            const leadId = lastMessage.lead_id;

            let toEmail: string[] = [];
            let replyTo: string | undefined;

            if (lastMessage.direction === 'incoming') {
                toEmail = [lastMessage.from_email];
                replyTo = lastMessage.from_email;
            } else {
                toEmail = lastMessage.to_email;
                const fromEmail = lastMessage.from_email;
                if (fromEmail) {
                    replyTo = fromEmail;
                }
            }

            if (toEmail.length === 0) {
                return {
                    success: false,
                    error: 'Unable to determine recipient for reply'
                };
            }

            const subject = lastMessage.subject?.replace(/\[TID:[^\]]+\]/, '').trim() || 'Re: Your email';

            const newTrackingId = uuidv4();

            const emailResult = await emailService.sendEmail({
                to: toEmail,
                subject: subject,
                text: text,
                html: html,
                cc: cc,
                bcc: bcc,
                replyTo: envConfig.SMTP_USER,
                leadId: leadId,
                trackingId: trackingId,
                threadId: lastMessage.message_id || undefined,
                attachments: attachments
            });

            if (!emailResult.success) {
                return {
                    success: false,
                    error: emailResult.error || 'Failed to send reply email'
                };
            }

            // await emailMessageRepository.createEmailMessage({
            //     tracking_id: trackingId,
            //     parent_tracking_id: trackingId,
            //     message_id: emailResult.messageId || null,
            //     in_reply_to: lastMessage.message_id || null,
            //     direction: 'outgoing',
            //     from_email: process.env.SMTP_FROM || envConfig.SMTP_USER,
            //     to_email: toEmail,
            //     cc_email: cc ? (Array.isArray(cc) ? cc : [cc]) : null,
            //     bcc_email: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : null,
            //     subject: subject,
            //     body: text || null,
            //     html_body: html || null,
            //     status: 'sent',
            //     lead_id: leadId || null,
            //     raw_headers: null,
            //     error: null,
            // });

            return {
                success: true,
                messageId: emailResult.messageId,
                trackingId: trackingId,
                parentTrackingId: trackingId,
                leadId: leadId
            };

        } catch (error: any) {
            console.error('EmailReplyService.sendReply error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send reply'
            };
        }
    }
};