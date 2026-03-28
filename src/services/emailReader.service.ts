import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { imapConfig } from '../config/imap.config';
import { emailRepository } from '../repositories/email.repository';

type MsgWithSource = {
    uid?: number;
    source?: Buffer | AsyncIterable<Buffer>;
};

export class EmailReaderService {
    private client: ImapFlow;
    private isConnected: boolean = false;

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

    async connect(): Promise<void> {
        try {
            if (this.isConnected) return;

            await this.client.connect();
            await this.client.mailboxOpen('[Gmail]/Important');

            this.isConnected = true;
            console.log('✅ IMAP connected to Primary Inbox');
        } catch (error) {
            console.error('❌ IMAP connection error:', error);
            this.isConnected = false;
        }
    }

    async readEmails(): Promise<void> {
        try {
            if (!this.isConnected) {
                await this.connect();
                if (!this.isConnected) return;
            }

            const result = await this.client.search({ seen: false });
            const uids: number[] = Array.isArray(result) ? result : [];

            if (uids.length === 0) return;

            // ✅ Fetch all messages first
            const messages: MsgWithSource[] = [];

            for await (const msg of this.client.fetch(uids, { source: true }) as AsyncIterable<MsgWithSource>) {
                messages.push(msg);
            }

            // ✅ Process in parallel
            await Promise.all(
                messages.map(async (msg) => {
                    try {
                        if (!msg.source) return;

                        let raw: Buffer;

                        // ✅ Buffer case
                        if (Buffer.isBuffer(msg.source)) {
                            raw = msg.source;
                        }
                        // ✅ Stream case
                        else {
                            const chunks: Buffer[] = [];
                            for await (const chunk of msg.source) {
                                chunks.push(chunk);
                            }
                            raw = Buffer.concat(chunks);
                        }

                        const parsed: ParsedMail = await simpleParser(raw);

                        const subject = parsed.subject ?? '';
                        const from = parsed.from?.text ?? '';
                        const text = parsed.text ?? '';
                        const html = typeof parsed.html === 'string' ? parsed.html : '';

                        let trackingId: string | null = null;

                        const tidMatch = subject.match(/\[TID:([^\]]+)\]/);
                        if (tidMatch) {
                            trackingId = tidMatch[1];
                        } else {
                            const trkMatch = subject.match(/\[(trk_[^\]]+)\]/);
                            trackingId = trkMatch ? trkMatch[1] : null;
                        }

                        if (trackingId) {
                            await emailRepository.createEmailReply({
                                tracking_id: trackingId,
                                from_email: from,
                                subject,
                                body: text,
                                html_body: html,
                            });

                            // ✅ mark as read
                            if (msg.uid) {
                                await this.client.messageFlagsAdd(msg.uid, ['\\Seen']);
                            }
                        }
                    } catch (err) {
                        console.error('❌ Error processing message:', err);
                    }
                })
            );

        } catch (error) {
            console.error('❌ Error reading emails:', error);
            this.isConnected = false;
        }
    }

    async stop(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.client.logout();
                this.isConnected = false;
                console.log('✅ IMAP disconnected');
            }
        } catch (error) {
            console.error('❌ Error closing IMAP:', error);
        }
    }
}

export const emailReaderService = new EmailReaderService();