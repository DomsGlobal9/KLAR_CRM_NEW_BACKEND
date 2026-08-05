import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const roleScreenPermissions = pgTable("role_screen_permissions", {
    role: text("role").primaryKey(),
    permissions: jsonb("permissions").notNull().default({}),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
