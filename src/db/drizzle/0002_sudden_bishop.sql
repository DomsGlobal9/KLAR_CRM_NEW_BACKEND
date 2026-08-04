ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "service_ids" uuid[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN IF EXISTS "service_ids";