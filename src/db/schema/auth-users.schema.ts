import { pgSchema, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

// Reference to Supabase's auth.users table
export const authUsers = authSchema.table("users", {
    id: uuid("id").primaryKey(),
    email: text("email"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});