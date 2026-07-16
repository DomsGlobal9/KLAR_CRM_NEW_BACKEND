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
        await this.client.mailboxOpen("INBOX");

        this.isConnected = true;

        console.log("✅ IMAP Connected");
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
    console.log("📩 readEmails() called");

    try {

        if (!this.isConnected) {
            console.log("🔄 IMAP not connected. Reconnecting...");
            await this.connect();

            if (!this.isConnected) {
                console.log("❌ Reconnection failed.");
                return;
            }

            console.log("✅ Reconnected successfully.");
        }

        console.log("🔍 Searching for unread emails...");

        const result = await this.client.search({ seen: false });

        console.log("📋 Search Result:", result);

        const uids: number[] = Array.isArray(result) ? result : [];

        console.log(`📨 Total unread emails found: ${uids.length}`);

        if (uids.length === 0) {
            console.log("📭 No unread emails found.");
            return;
        }

        for (const uid of uids) {

            console.log(`\n==============================`);
            console.log(`📧 Processing UID: ${uid}`);
            console.log(`==============================`);

            try {

                console.log("📥 Fetching email...");

                const msg = await this.client.fetchOne(uid, {
                    source: true,
                });

                if (!msg || !msg.source) {
                    console.log(`❌ No source found for UID ${uid}`);
                    continue;
                }

                console.log("✅ Email fetched successfully.");

                console.log("📝 Parsing email...");

                const parsed = await this.parseEmailSource(msg.source);

                if (!parsed) {
                    console.log("❌ Email parsing failed.");

                    await this.client.messageFlagsAdd(uid, ['\\Seen']);

                    console.log("✔️ Email marked as read.");

                    continue;
                }

                console.log("✅ Email parsed.");

                const subject = parsed.subject ?? '';
                const from = parsed.from?.text ?? '';
                const messageId = parsed.messageId;
                const inReplyTo = parsed.inReplyTo?.[0] || null;

                console.log("Subject:", subject);
                console.log("From:", from);
                console.log("Message ID:", messageId);
                console.log("In Reply To:", inReplyTo);

                const toRecipients = this.extractRecipients(parsed);

                console.log("Recipients:", toRecipients);

                const { text, html } = this.extractBody(parsed);

                console.log("Body Length:", text?.length || 0);
                console.log("HTML Length:", html?.length || 0);

                if (messageId) {

                    console.log("🔎 Checking duplicate by Message ID...");

                    const existingMessage =
                        await emailMessageRepository.getByMessageId(messageId);

                    if (existingMessage) {

                        console.log("⚠️ Duplicate Message ID found. Skipping.");

                        await this.client.messageFlagsAdd(uid, ['\\Seen']);

                        continue;
                    }

                    console.log("✅ Message ID is unique.");
                }

                let trackingId: string | null = null;
                let parentTrackingId: string | null = null;
                let leadId: string | null = null;

                const tidMatch = subject.match(/\[TID:([^\]]+)\]/);

                if (tidMatch) {
                    trackingId = tidMatch[1];
                    console.log("Tracking ID from subject:", trackingId);
                } else {

                    const trkMatch = subject.match(/\[(trk_[^\]]+)\]/);

                    if (trkMatch) {
                        trackingId = trkMatch[1];
                        console.log("Tracking ID (legacy):", trackingId);
                    }
                }

                if (!trackingId && parsed.inReplyTo && parsed.inReplyTo.length > 0) {

                    console.log("Looking up parent message...");

                    const parentMessage =
                        await emailMessageRepository.getByMessageId(parsed.inReplyTo[0]);

                    if (parentMessage) {

                        trackingId = parentMessage.tracking_id;
                        parentTrackingId = parentMessage.tracking_id;
                        leadId = parentMessage.lead_id;

                        console.log("Parent Tracking ID:", trackingId);
                    }
                }

                if (!trackingId) {

                    trackingId = uuidv4();

                    console.log("Generated new Tracking ID:", trackingId);

                    parentTrackingId = null;
                }

                if (trackingId) {

                    console.log("Checking duplicate by Tracking ID...");

                    const existingMessage =
                        await emailMessageRepository.getByTrackingIdAndDirection(
                            trackingId,
                            'incoming'
                        );

                    if (
                        existingMessage &&
                        existingMessage.message_id === messageId
                    ) {

                        console.log("⚠️ Duplicate incoming email found.");

                        await this.client.messageFlagsAdd(uid, ['\\Seen']);

                        continue;
                    }

                    console.log("💾 Saving email to database...");

                    await emailMessageRepository.createIncomingEmail({
                        tracking_id: trackingId,
                        parent_tracking_id: parentTrackingId,
                        message_id: messageId || null,
                        in_reply_to: inReplyTo,
                        from_email: from,
                        to_email:
                            toRecipients.length > 0
                                ? toRecipients
                                : [process.env.SMTP_USER || ''],
                        cc_email: null,
                        bcc_email: null,
                        subject,
                        body: text || null,
                        html_body: html || null,
                        raw_headers: parsed.headers || null,
                        lead_id: leadId,
                    });

                    console.log("✅ Email saved successfully.");
                }

                console.log("✔️ Marking email as read...");

                await this.client.messageFlagsAdd(uid, ['\\Seen']);

                console.log(`✅ UID ${uid} processed successfully.`);

            } catch (err) {

                console.error(`❌ Error processing UID ${uid}:`, err);

                try {

                    console.log("Marking failed email as read...");

                    await this.client.messageFlagsAdd(uid, ['\\Seen']);

                    console.log("✔️ Marked as read.");

                } catch (flagErr) {

                    console.error("Failed to mark email as read:", flagErr);
                }
            }
        }

        console.log("🎉 Poll cycle completed.");

    } catch (error) {

        console.error("💥 Fatal error in readEmails():", error);

        this.isConnected = false;
    }
}

    public async start(): Promise<void> {
        while (true) {
            try {
                if (!this.isConnected) {
                    await this.connect();
                }

                console.log("📨 Checking for new emails...");

                await this.readEmails();

            } catch (err) {
                console.error("Email polling failed:", err);

                this.isConnected = false;

                try {
                    await this.client.logout();
                } catch { }

                this.client = new ImapFlow({
                    ...imapConfig,
                    socketTimeout: 60000,
                });
            }

            // Poll every 10 seconds
            await new Promise(resolve => setTimeout(resolve, 10000));
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