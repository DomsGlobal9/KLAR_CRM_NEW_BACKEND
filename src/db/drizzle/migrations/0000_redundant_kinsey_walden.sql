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

CREATE TABLE "travelers" (
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

CREATE TABLE "roles" (
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

CREATE TABLE "teams" (
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

CREATE TABLE "auth.users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"created_at" timestamp,
	"updated_at" timestamp
);

ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_auth.users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth.users"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "idx_email_messages_tracking_id" ON "email_messages" USING btree ("tracking_id");
CREATE INDEX "idx_email_messages_parent_tracking_id" ON "email_messages" USING btree ("parent_tracking_id");
CREATE INDEX "idx_email_messages_message_id" ON "email_messages" USING btree ("message_id");
CREATE INDEX "idx_email_messages_lead_id" ON "email_messages" USING btree ("lead_id");
CREATE INDEX "idx_email_messages_direction" ON "email_messages" USING btree ("direction");
CREATE INDEX "idx_email_messages_created_at" ON "email_messages" USING btree ("created_at");
CREATE INDEX "idx_email_messages_from_email" ON "email_messages" USING btree ("from_email");
CREATE INDEX "idx_email_messages_in_reply_to" ON "email_messages" USING btree ("in_reply_to");
CREATE INDEX "idx_travelers_email" ON "travelers" USING btree ("traveler_email");
CREATE INDEX "idx_travelers_name" ON "travelers" USING btree ("traveler_name");
CREATE INDEX "idx_travelers_phone" ON "travelers" USING btree ("traveler_phone");
CREATE INDEX "idx_travelers_created_at" ON "travelers" USING btree ("created_at");
CREATE INDEX "idx_travelers_group_id" ON "travelers" USING btree ("group_id");
CREATE INDEX "idx_travelers_aadhaar" ON "travelers" USING btree ("aadhaar_number");
CREATE INDEX "idx_travelers_passport" ON "travelers" USING btree ("passport_number");
CREATE UNIQUE INDEX "idx_unique_aadhaar_not_null" ON "travelers" USING btree ("aadhaar_number") WHERE "travelers"."aadhaar_number" IS NOT NULL;
CREATE UNIQUE INDEX "idx_unique_passport_not_null" ON "travelers" USING btree ("passport_number") WHERE "travelers"."passport_number" IS NOT NULL;