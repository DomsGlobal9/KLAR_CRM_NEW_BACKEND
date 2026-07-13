import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { imapConfig } from '../config/imap.config';
import { emailRepository } from '../repositories/email.repository';

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
            console.log('📧 ===== STARTING EMAIL READ =====');
            console.log(`📧 Time: ${new Date().toISOString()}`);

            if (!this.isConnected) {
                console.log('⚠️ Not connected to IMAP, attempting to connect...');
                await this.connect();
                if (!this.isConnected) {
                    console.log('❌ Failed to connect to IMAP server');
                    return;
                }
            }

            // Search for unread emails
            console.log('🔍 Searching for unread emails...');
            const result = await this.client.search({ seen: false });
            const uids: number[] = Array.isArray(result) ? result : [];

            console.log(`📧 Found ${uids.length} unread email(s)`);

            if (uids.length === 0) {
                console.log('📧 No unread emails to process');
                console.log('📧 ===== END EMAIL READ =====\n');
                return;
            }

            // Log all UIDs found
            console.log(`📧 UIDs to process: [${uids.join(', ')}]`);

            let processedCount = 0;
            let storedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            for (const uid of uids) {
                try {
                    console.log(`\n📧 ----- Processing UID: ${uid} -----`);

                    // Fetch the email
                    const msg = await this.client.fetchOne(uid, { source: true });

                    if (!msg || !msg.source) {
                        console.log(`⚠️ No source data for UID ${uid}, skipping`);
                        skippedCount++;
                        continue;
                    }

                    // Parse the raw email
                    console.log(`📧 Parsing email content...`);
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
                        console.log(`⚠️ Unexpected source format for UID ${uid}, skipping`);
                        skippedCount++;
                        continue;
                    }

                    // Parse email
                    const parsed: ParsedMail = await simpleParser(raw);

                    // Extract email details
                    const subject = parsed.subject ?? '';
                    const from = parsed.from?.text ?? '';
                    // const to = parsed.to?.text ?? '';
                    const text = parsed.text ?? '';
                    const html = typeof parsed.html === 'string' ? parsed.html : '';
                    const messageId = parsed.messageId;
                    const date = parsed.date;
                    const inReplyTo = parsed.inReplyTo?.[0] || null;

                    console.log(`📧 Email Details:`);
                    console.log(`   Subject: ${subject}`);
                    console.log(`   From: ${from}`);
                    // console.log(`   To: ${to}`);
                    console.log(`   Message ID: ${messageId || 'N/A'}`);
                    console.log(`   In Reply To: ${inReplyTo || 'N/A'}`);
                    console.log(`   Date: ${date?.toISOString() || 'N/A'}`);
                    console.log(`   Body Length: ${text?.length || 0} chars`);
                    console.log(`   Has HTML: ${!!html}`);

                    // Check if email already exists by message ID
                    if (messageId) {
                        console.log(`🔍 Checking if email already exists by message ID...`);
                        const existingReply = await emailRepository.getReplyByMessageId(messageId);
                        if (existingReply) {
                            console.log(`⚠️ Email with message ID "${messageId}" already exists, marking as read and skipping`);
                            await this.client.messageFlagsAdd(uid, ['\\Seen']);
                            skippedCount++;
                            continue;
                        }
                    }

                    // Extract tracking ID from subject
                    let trackingId: string | null = null;

                    // Try pattern 1: [TID:xxx]
                    const tidMatch = subject.match(/\[TID:([^\]]+)\]/);
                    if (tidMatch) {
                        trackingId = tidMatch[1];
                        console.log(`✅ Tracking ID found via [TID:xxx] pattern: ${trackingId}`);
                    } else {
                        // Try pattern 2: [trk_xxx]
                        const trkMatch = subject.match(/\[(trk_[^\]]+)\]/);
                        if (trkMatch) {
                            trackingId = trkMatch[1];
                            console.log(`✅ Tracking ID found via [trk_xxx] pattern: ${trackingId}`);
                        } else {
                            console.log(`⚠️ No tracking ID found in subject, checking in-reply-to...`);
                        }
                    }

                    // If no tracking ID in subject, check in-reply-to
                    if (!trackingId && parsed.inReplyTo && parsed.inReplyTo.length > 0) {
                        console.log(`🔍 Searching for parent email with message ID: ${parsed.inReplyTo[0]}`);
                        const parentLog = await emailRepository.getByMessageId(parsed.inReplyTo[0]);
                        if (parentLog && parentLog.tracking_id) {
                            trackingId = parentLog.tracking_id;
                            console.log(`✅ Tracking ID found from parent email: ${trackingId}`);
                        } else {
                            console.log(`⚠️ No parent email found with message ID: ${parsed.inReplyTo[0]}`);
                        }
                    }

                    // Store the email if we have a tracking ID
                    if (trackingId) {
                        console.log(`💾 Preparing to store email with tracking ID: ${trackingId}`);

                        // Check if email already exists for this tracking ID and UID
                        const existingReply = await emailRepository.getReplyByTrackingIdAndUid(trackingId, uid);
                        if (existingReply) {
                            console.log(`⚠️ Email already exists for tracking ID ${trackingId} and UID ${uid}, skipping`);
                            await this.client.messageFlagsAdd(uid, ['\\Seen']);
                            skippedCount++;
                            continue;
                        }

                        // Store the email
                        console.log(`💾 Storing email reply in database...`);
                        await emailRepository.createEmailReply({
                            tracking_id: trackingId,
                            from_email: from,
                            // to_email: to ? [to] : [],
                            subject: subject,
                            body: text,
                            html_body: html,
                            message_id: messageId || undefined,
                            in_reply_to: inReplyTo || undefined,
                            raw_headers: parsed.headers,
                        });

                        storedCount++;
                        console.log(`✅ Email stored successfully! (Stored: ${storedCount})`);

                    } else {
                        console.log(`❌ No tracking ID found for email from "${from}" with subject "${subject}"`);
                        console.log(`   Email will be marked as read but NOT stored`);
                    }

                    // Mark email as read
                    console.log(`📌 Marking email UID ${uid} as read...`);
                    await this.client.messageFlagsAdd(uid, ['\\Seen']);
                    processedCount++;
                    console.log(`✅ Email UID ${uid} processed successfully`);

                } catch (err) {
                    errorCount++;
                    console.error(`❌ Error processing email UID ${uid}:`, err);
                    if (err instanceof Error) {
                        console.error(`   Error details:`, {
                            message: err.message,
                            stack: err.stack
                        });
                    }
                    // Try to mark as read even if processing failed to avoid infinite loop
                    try {
                        await this.client.messageFlagsAdd(uid, ['\\Seen']);
                        console.log(`📌 Marked problematic email UID ${uid} as read to avoid reprocessing`);
                    } catch (flagErr) {
                        console.error(`❌ Failed to mark email UID ${uid} as read:`, flagErr);
                    }
                }
            }

            // Summary
            console.log(`\n📊 ===== EMAIL READ SUMMARY =====`);
            console.log(`📧 Total unread emails: ${uids.length}`);
            console.log(`✅ Processed: ${processedCount}`);
            console.log(`💾 Stored: ${storedCount}`);
            console.log(`⏭️ Skipped: ${skippedCount}`);
            console.log(`❌ Errors: ${errorCount}`);
            console.log(`📧 ===== END EMAIL READ =====\n`);

        } catch (error) {
            console.error('❌ Fatal error in readEmails():', error);
            if (error instanceof Error) {
                console.error('   Error details:', {
                    message: error.message,
                    stack: error.stack
                });
            }
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