import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const emailMessages = pgTable('email_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  trackingId: text('tracking_id').notNull(),
  parentTrackingId: text('parent_tracking_id'),
  messageId: text('message_id'),
  inReplyTo: text('in_reply_to'),
  
  direction: text('direction').notNull(),
  
  fromEmail: text('from_email').notNull(),
  toEmail: text('to_email').array().notNull(),
  ccEmail: text('cc_email').array(),
  bccEmail: text('bcc_email').array(),
  
  subject: text('subject').notNull(),
  body: text('body'),
  htmlBody: text('html_body'),
  
  status: text('status').default('sent').notNull(),
  
  leadId: uuid('lead_id'),
  
  rawHeaders: jsonb('raw_headers'),
  error: text('error'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  trackingIdIdx: index('idx_email_messages_tracking_id').on(table.trackingId),
  parentTrackingIdIdx: index('idx_email_messages_parent_tracking_id').on(table.parentTrackingId),
  messageIdIdx: index('idx_email_messages_message_id').on(table.messageId),
  leadIdIdx: index('idx_email_messages_lead_id').on(table.leadId),
  directionIdx: index('idx_email_messages_direction').on(table.direction),
  createdAtIdx: index('idx_email_messages_created_at').on(table.createdAt),
  fromEmailIdx: index('idx_email_messages_from_email').on(table.fromEmail),
  inReplyToIdx: index('idx_email_messages_in_reply_to').on(table.inReplyTo),
}));