import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { imapConfig } from '../config/imap.config';
import { emailMessageRepository } from '../repositories/email-message.repository';
import { v4 as uuidv4 } from 'uuid';

export class EmailReaderService {

    private client: ImapFlow;
    private isConnected: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.client = new ImapFlow({
            ...imapConfig,
            socketTimeout: 60000,
        });

        this.client.on('error', (err) => {
            console.error('IMAP Client Error:', err);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            console.warn('IMAP connection closed');
            this.isConnected = false;
        });
    }

    private extractBody(parsed: ParsedMail): { text: string | null; html: string | null } {
        let text: string | null = null;
        let html: string | null = null;

        if (parsed.text) {
            text = parsed.text;
        }

        if (parsed.html) {
            const htmlContent = parsed.html as string | Buffer;
            if (typeof htmlContent === 'string') {
                html = htmlContent;
            } else if (Buffer.isBuffer(htmlContent)) {
                html = htmlContent.toString('utf-8');
            }
        }

        if (!text && !html) {
            if (parsed.textAsHtml) {
                html = parsed.textAsHtml;
            }
        }

        if (!text && html) {
            const stripHtml = (htmlStr: string): string => {
                return htmlStr
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/\s+/g, ' ')
                    .trim();
            };
            text = stripHtml(html);
        }

        if (!text && !html && parsed.attachments && parsed.attachments.length > 0) {
            for (const attachment of parsed.attachments) {
                if (attachment.contentType === 'text/plain' || attachment.contentType === 'text/html') {
                    const content = attachment.content.toString('utf-8');
                    if (attachment.contentType === 'text/plain') {
                        text = content;
                    } else {
                        html = content;
                    }
                    break;
                }
            }
        }

        return { text, html };
    }

    async connect(): Promise<void> {
        if (this.isConnected) return;

        await this.client.connect();
        await this.client.mailboxOpen('INBOX');

        this.isConnected = true;

        console.log('✅ IMAP Connected');
    }

    private startKeepAlive(): void {
        if (this.reconnectTimer) clearInterval(this.reconnectTimer);
        this.reconnectTimer = setInterval(async () => {
            if (this.isConnected) {
                try {
                    await this.client.noop();
                } catch (err) {
                    console.error('Keep-alive failed:', err);
                    this.isConnected = false;
                    await this.connect();
                }
            }
        }, 60000);
    }

    private async parseEmailSource(source: any): Promise<ParsedMail | null> {
        try {
            let raw: Buffer;
            if (Buffer.isBuffer(source)) {
                raw = source;
            } else if (source && typeof source === 'object' && Symbol.asyncIterator in Object(source)) {
                const chunks: Buffer[] = [];
                for await (const chunk of source as AsyncIterable<Buffer>) {
                    chunks.push(chunk);
                }
                raw = Buffer.concat(chunks);
            } else {
                return null;
            }

            return await simpleParser(raw);
        } catch (err) {
            console.error('Failed to parse email source:', err);
            return null;
        }
    }

    private extractRecipients(parsed: ParsedMail): string[] {
        const recipients: string[] = [];

        if (parsed.to) {
            const toList = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
            for (const recipient of toList) {
                if (recipient && recipient.value) {
                    const values = Array.isArray(recipient.value) ? recipient.value : [recipient.value];
                    for (const v of values) {
                        if (v && v.address) {
                            recipients.push(v.address);
                        }
                    }
                }
            }
        }

        return recipients;
    }

    async readEmails(): Promise<void> {
        try {

            if (!this.isConnected) {
                await this.connect();
                if (!this.isConnected) {
                    return;
                }
            }

            const result = await this.client.search({ seen: false });
            const uids: number[] = Array.isArray(result) ? result : [];

            if (uids.length === 0) {
                return;
            }

            for (const uid of uids) {
                try {
                    const msg = await this.client.fetchOne(uid, { source: true });

                    if (!msg || !msg.source) {
                        continue;
                    }

                    const parsed = await this.parseEmailSource(msg.source);
                    if (!parsed) {
                        await this.client.messageFlagsAdd(uid, ['\\Seen']);
                        continue;
                    }

                    const subject = parsed.subject ?? '';
                    const from = parsed.from?.text ?? '';
                    const messageId = parsed.messageId;
                    const inReplyTo = parsed.inReplyTo?.[0] || null;
                    const toRecipients = this.extractRecipients(parsed);

                    const { text, html } = this.extractBody(parsed);

                    if (messageId) {
                        const existingMessage = await emailMessageRepository.getByMessageId(messageId);
                        if (existingMessage) {
                            await this.client.messageFlagsAdd(uid, ['\\Seen']);
                            continue;
                        }
                    }

                    let trackingId: string | null = null;
                    let parentTrackingId: string | null = null;
                    let leadId: string | null = null;

                    const tidMatch = subject.match(/\[TID:([^\]]+)\]/);
                    if (tidMatch) {
                        trackingId = tidMatch[1];
                    } else {
                        const trkMatch = subject.match(/\[(trk_[^\]]+)\]/);
                        if (trkMatch) {
                            trackingId = trkMatch[1];
                        }
                    }

                    if (!trackingId && parsed.inReplyTo && parsed.inReplyTo.length > 0) {
                        const parentMessage = await emailMessageRepository.getByMessageId(parsed.inReplyTo[0]);
                        if (parentMessage) {
                            trackingId = parentMessage.tracking_id;
                            parentTrackingId = parentMessage.tracking_id;
                            leadId = parentMessage.lead_id;
                        }
                    }

                    if (!trackingId) {
                        trackingId = uuidv4();
                        parentTrackingId = null;
                    }

                    if (trackingId) {
                        const existingMessage = await emailMessageRepository.getByTrackingIdAndDirection(trackingId, 'incoming');
                        if (existingMessage && existingMessage.message_id === messageId) {
                            await this.client.messageFlagsAdd(uid, ['\\Seen']);
                            continue;
                        }

                        await emailMessageRepository.createIncomingEmail({
                            tracking_id: trackingId,
                            parent_tracking_id: parentTrackingId,
                            message_id: messageId || null,
                            in_reply_to: inReplyTo,
                            from_email: from,
                            to_email: toRecipients.length > 0 ? toRecipients : [process.env.SMTP_USER || ''],
                            cc_email: null,
                            bcc_email: null,
                            subject: subject,
                            body: text || null,
                            html_body: html || null,
                            raw_headers: parsed.headers || null,
                            lead_id: leadId,
                        });
                    }

                    await this.client.messageFlagsAdd(uid, ['\\Seen']);

                } catch (err) {
                    console.error(`Error processing email UID ${uid}:`, err);
                    try {
                        await this.client.messageFlagsAdd(uid, ['\\Seen']);
                    } catch (flagErr) {
                        console.error(`Failed to mark email UID ${uid} as read:`, flagErr);
                    }
                }
            }

        } catch (error) {
            console.error('Fatal error in readEmails():', error);
            this.isConnected = false;
        }
    }

    public async start(): Promise<void> {
        while (true) {
            try {
                if (!this.isConnected) {
                    await this.connect();
                }

                console.log('📨 Waiting for new emails...');

                // while (this.isConnected) {
                //     await this.client.idle();
                //     await this.readEmails();
                // }

                while (this.isConnected) {
                    await this.readEmails();
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            } catch (err) {
                console.error('IDLE Error:', err);
                this.isConnected = false;

                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async stop(): Promise<void> {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        try {
            if (this.isConnected) {
                await this.client.logout();
                this.isConnected = false;
            }
        } catch (error) {
            console.error('Error closing IMAP:', error);
        }
    }
}

export const emailReaderService = new EmailReaderService();