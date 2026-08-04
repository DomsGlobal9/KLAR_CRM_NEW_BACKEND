import { pgTable, uuid, text, boolean, timestamp, uuid as pgUuid } from "drizzle-orm/pg-core";

export const departments = pgTable("departments", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    adminIds: pgUuid("admin_ids").array().default([]),
    teamIds: pgUuid("team_ids").array().default([]),
    serviceIds: pgUuid("service_ids").array().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
