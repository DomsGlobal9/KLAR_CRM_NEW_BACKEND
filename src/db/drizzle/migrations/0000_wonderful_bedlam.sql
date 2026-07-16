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
--> statement-breakpoint
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
