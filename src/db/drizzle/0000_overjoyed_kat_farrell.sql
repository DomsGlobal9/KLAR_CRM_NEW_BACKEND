CREATE TABLE IF NOT EXISTS "email_logs" (
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
CREATE TABLE IF NOT EXISTS "email_replies" (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_messages" (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "travelers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(10),
	"traveler_name" varchar(255),
	"traveler_phone" varchar(50),
	"traveler_email" varchar(255),
	"date_of_birth" date,
	"passport" jsonb,
	"gst" jsonb,
	"emergency_contact" jsonb,
	"group_id" varchar(255),
	"aadhaar_number" varchar(20),
	"passport_number" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "check_aadhaar_format" CHECK ("travelers"."aadhaar_number" IS NULL OR "travelers"."aadhaar_number" ~ '^[0-9]{12}$'),
	CONSTRAINT "check_passport_format" CHECK ("travelers"."passport_number" IS NULL OR "travelers"."passport_number" ~ '^[A-Z0-9]{6,9}$')
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"assigned_people" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"members_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"service_ids" uuid[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_tracking_id" ON "email_messages" USING btree ("tracking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_parent_tracking_id" ON "email_messages" USING btree ("parent_tracking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_message_id" ON "email_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_lead_id" ON "email_messages" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_direction" ON "email_messages" USING btree ("direction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_created_at" ON "email_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_from_email" ON "email_messages" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_messages_in_reply_to" ON "email_messages" USING btree ("in_reply_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_travelers_email" ON "travelers" USING btree ("traveler_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_travelers_name" ON "travelers" USING btree ("traveler_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_travelers_phone" ON "travelers" USING btree ("traveler_phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_travelers_created_at" ON "travelers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_travelers_group_id" ON "travelers" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_travelers_aadhaar" ON "travelers" USING btree ("aadhaar_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_travelers_passport" ON "travelers" USING btree ("passport_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_aadhaar_not_null" ON "travelers" USING btree ("aadhaar_number") WHERE "travelers"."aadhaar_number" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_passport_not_null" ON "travelers" USING btree ("passport_number") WHERE "travelers"."passport_number" IS NOT NULL;