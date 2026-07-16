CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" text NOT NULL,
	"lead_id" uuid,
	"message_id" text,
	"in_reply_to" text,
	"to_email" text[] NOT NULL,
	"cc_email" text[],
	"bcc_email" text[],
	"subject" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "email_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" text,
	"lead_id" uuid,
	"from_email" text NOT NULL,
	"to_email" text[],
	"subject" text,
	"body" text,
	"html_body" text,
	"message_id" text,
	"in_reply_to" text,
	"raw_headers" jsonb,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_id" text NOT NULL,
	"parent_tracking_id" text,
	"message_id" text,
	"in_reply_to" text,
	"direction" text NOT NULL,
	"from_email" text NOT NULL,
	"to_email" text[] NOT NULL,
	"cc_email" text[],
	"bcc_email" text[],
	"subject" text NOT NULL,
	"body" text,
	"html_body" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"lead_id" uuid,
	"raw_headers" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX "idx_email_messages_tracking_id" ON "email_messages" USING btree ("tracking_id");
CREATE INDEX "idx_email_messages_parent_tracking_id" ON "email_messages" USING btree ("parent_tracking_id");
CREATE INDEX "idx_email_messages_message_id" ON "email_messages" USING btree ("message_id");
CREATE INDEX "idx_email_messages_lead_id" ON "email_messages" USING btree ("lead_id");
CREATE INDEX "idx_email_messages_direction" ON "email_messages" USING btree ("direction");
CREATE INDEX "idx_email_messages_created_at" ON "email_messages" USING btree ("created_at");
CREATE INDEX "idx_email_messages_from_email" ON "email_messages" USING btree ("from_email");
CREATE INDEX "idx_email_messages_in_reply_to" ON "email_messages" USING btree ("in_reply_to");