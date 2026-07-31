import { pgTable, uuid, text, integer, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { authUsers } from "./auth-users.schema";

export const roles = pgTable("roles", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    permissions: jsonb("permissions").default({}),
    assignedPeople: integer("assigned_people").notNull().default(0),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => authUsers.id, { onDelete: "set null" }),
});