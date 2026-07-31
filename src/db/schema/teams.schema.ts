import { pgTable, uuid, text, integer, boolean, timestamp, uuid as pgUuid } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    membersCount: integer("members_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    serviceIds: pgUuid("service_ids").array().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});