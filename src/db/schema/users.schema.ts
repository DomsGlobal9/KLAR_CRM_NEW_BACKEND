import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { roles } from "./roles.schema";
import { teams } from "./teams.schema";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    username: text("username").unique(),
    fullName: text("full_name"),
    phone: text("phone"),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    department: text("department"),
    image: text("image"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastLoginAt: timestamp("last_login_at"),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
