import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackingId: text('tracking_id').notNull(),
  leadId: uuid('lead_id'),
  messageId: text('message_id'),
  inReplyTo: text('in_reply_to'),
  toEmail: text('to_email').array().notNull(),
  ccEmail: text('cc_email').array(),
  bccEmail: text('bcc_email').array(),
  subject: text('subject').notNull(),
  status: text('status').default('sent').notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});