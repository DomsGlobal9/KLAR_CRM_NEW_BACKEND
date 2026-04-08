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
            await this.client.mailboxOpen('INBOX');

            this.isConnected = true;
            console.log('IMAP connected to INBOX');
        } catch (error) {
            console.error('IMAP connection error:', error);
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

            for (const uid of uids) {
                try {
                    const msg = await this.client.fetchOne(uid, { source: true });

                    if (!msg || !msg.source) {
                        continue;
                    }

                    let raw: Buffer;
                    if (Buffer.isBuffer(msg.source)) {
                        raw = msg.source;
                    } else if (msg.source && typeof msg.source === 'object' && Symbol.asyncIterator in Object(msg.source)) {
                        const chunks: Buffer[] = [];
                        for await (const chunk of msg.source as AsyncIterable<Buffer>) {
                            chunks.push(chunk);
                        }
                        raw = Buffer.concat(chunks);
                    } else {
                        continue;
                    }

                    const parsed: ParsedMail = await simpleParser(raw);

                    const subject = parsed.subject ?? '';
                    const from = parsed.from?.text ?? '';
                    const text = parsed.text ?? '';
                    const html = typeof parsed.html === 'string' ? parsed.html : '';
                    const messageId = parsed.messageId;

                    if (messageId) {
                        const existingReply = await emailRepository.getReplyByMessageId(messageId);
                        if (existingReply) {
                            await this.client.messageFlagsAdd(uid, ['\\Seen']);
                            continue;
                        }
                    }

                    let trackingId: string | null = null;

                    const tidMatch = subject.match(/\[TID:([^\]]+)\]/);
                    if (tidMatch) {
                        trackingId = tidMatch[1];
                    } else {
                        const trkMatch = subject.match(/\[(trk_[^\]]+)\]/);
                        trackingId = trkMatch ? trkMatch[1] : null;
                    }

                    if (!trackingId && parsed.inReplyTo && parsed.inReplyTo.length > 0) {
                        const parentLog = await emailRepository.getByMessageId(parsed.inReplyTo[0]);
                        if (parentLog && parentLog.tracking_id) {
                            trackingId = parentLog.tracking_id;
                        }
                    }

                    if (trackingId) {
                        const existingReply = await emailRepository.getReplyByTrackingIdAndUid(trackingId, uid);
                        if (!existingReply) {
                            await emailRepository.createEmailReply({
                                tracking_id: trackingId,
                                from_email: from,
                                subject,
                                body: text,
                                html_body: html,
                                message_id: messageId,
                                in_reply_to: parsed.inReplyTo?.[0] || undefined,
                                raw_headers: parsed.headers,
                            });
                        }
                    }

                    await this.client.messageFlagsAdd(uid, ['\\Seen']);

                } catch (err) {
                    // silently ignore or handle if needed
                }
            }

        } catch (error) {
            this.isConnected = false;
        }
    }

    // async readEmails(): Promise<void> {
    //     try {
    //         if (!this.isConnected) {
    //             await this.connect();
    //             if (!this.isConnected) return;
    //         }

    //         const result = await this.client.search({ seen: false });
    //         const uids: number[] = Array.isArray(result) ? result : [];

    //         if (uids.length === 0) return;

    //         for (const uid of uids) {
    //             try {
    //                 const msg = await this.client.fetchOne(uid, { source: true });

    //                 if (!msg || !msg.source) continue;

    //                 let raw: Buffer;
    //                 if (Buffer.isBuffer(msg.source)) {
    //                     raw = msg.source;
    //                 } else if (msg.source && typeof msg.source === 'object' && Symbol.asyncIterator in Object(msg.source)) {
    //                     const chunks: Buffer[] = [];
    //                     for await (const chunk of msg.source as AsyncIterable<Buffer>) {
    //                         chunks.push(chunk);
    //                     }
    //                     raw = Buffer.concat(chunks);
    //                 } else {
    //                     continue;
    //                 }

    //                 const parsed: ParsedMail = await simpleParser(raw);

    //                 const subject = parsed.subject ?? '';
    //                 const from = parsed.from?.text ?? '';
    //                 const text = parsed.text ?? '';
    //                 const html = typeof parsed.html === 'string' ? parsed.html : '';
    //                 const messageId = parsed.messageId;

    //                 if (messageId) {
    //                     const existingReply = await emailRepository.getReplyByMessageId(messageId);
    //                     if (existingReply) {
    //                         await this.client.messageFlagsAdd(uid, ['\\Seen']);
    //                         continue;
    //                     }
    //                 }

    //                 let trackingId: string | null = null;

    //                 const tidMatch = subject.match(/\[TID:([^\]]+)\]/);
    //                 if (tidMatch) {
    //                     trackingId = tidMatch[1];
    //                 } else {
    //                     const trkMatch = subject.match(/\[(trk_[^\]]+)\]/);
    //                     trackingId = trkMatch ? trkMatch[1] : null;
    //                 }

    //                 if (!trackingId && parsed.inReplyTo && parsed.inReplyTo.length > 0) {
    //                     const parentLog = await emailRepository.getByMessageId(parsed.inReplyTo[0]);
    //                     if (parentLog && parentLog.tracking_id) {
    //                         trackingId = parentLog.tracking_id;
    //                     }
    //                 }

    //                 if (trackingId) {
    //                     const existingReply = await emailRepository.getReplyByTrackingIdAndUid(trackingId, uid);
    //                     if (!existingReply) {
    //                         await emailRepository.createEmailReply({
    //                             tracking_id: trackingId,
    //                             from_email: from,
    //                             subject,
    //                             body: text,
    //                             html_body: html,
    //                             message_id: messageId,
    //                             in_reply_to: parsed.inReplyTo?.[0] || undefined,
    //                             raw_headers: parsed.headers,
    //                         });
    //                     }
    //                 }

    //                 await this.client.messageFlagsAdd(uid, ['\\Seen']);

    //             } catch (err) {
    //                 console.error(`Error processing email UID ${uid}:`, err);
    //             }
    //         }

    //     } catch (error) {
    //         console.error('Error reading emails:', error);
    //         this.isConnected = false;
    //     }
    // }

    async stop(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.client.logout();
                this.isConnected = false;
                console.log('IMAP disconnected');
            }
        } catch (error) {
            console.error('Error closing IMAP:', error);
        }
    }
}

export const emailReaderService = new EmailReaderService();