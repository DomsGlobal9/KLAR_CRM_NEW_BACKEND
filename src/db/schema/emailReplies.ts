import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const emailReplies = pgTable('email_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackingId: text('tracking_id'),
  leadId: uuid('lead_id'),
  fromEmail: text('from_email').notNull(),
  toEmail: text('to_email').array(),
  subject: text('subject'),
  body: text('body'),
  htmlBody: text('html_body'),
  messageId: text('message_id'),
  inReplyTo: text('in_reply_to'),
  rawHeaders: jsonb('raw_headers'),
  createdAt: timestamp('created_at').defaultNow(),
});