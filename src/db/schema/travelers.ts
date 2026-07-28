import { 
  pgTable, 
  uuid, 
  varchar, 
  date, 
  jsonb, 
  timestamp, 
  index, 
  uniqueIndex,
  check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const travelers = pgTable(
  'travelers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 10 }),
    travelerName: varchar('traveler_name', { length: 255 }),
    travelerPhone: varchar('traveler_phone', { length: 50 }),
    travelerEmail: varchar('traveler_email', { length: 255 }),
    dateOfBirth: date('date_of_birth'),
    passport: jsonb('passport'),
    gst: jsonb('gst'),
    emergencyContact: jsonb('emergency_contact'),
    groupId: varchar('group_id', { length: 255 }),
    aadhaarNumber: varchar('aadhaar_number', { length: 20 }),
    passportNumber: varchar('passport_number', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Regular indexes (non-unique)
    emailIdx: index('idx_travelers_email').on(table.travelerEmail),
    nameIdx: index('idx_travelers_name').on(table.travelerName),
    phoneIdx: index('idx_travelers_phone').on(table.travelerPhone),
    createdAtIdx: index('idx_travelers_created_at').on(table.createdAt),
    groupIdIdx: index('idx_travelers_group_id').on(table.groupId),
    aadhaarIdx: index('idx_travelers_aadhaar').on(table.aadhaarNumber),
    passportIdx: index('idx_travelers_passport').on(table.passportNumber),
    
    // Unique indexes with partial condition (only when NOT NULL)
    uniqueAadhaar: uniqueIndex('idx_unique_aadhaar_not_null')
      .on(table.aadhaarNumber)
      .where(sql`${table.aadhaarNumber} IS NOT NULL`),
    
    uniquePassport: uniqueIndex('idx_unique_passport_not_null')
      .on(table.passportNumber)
      .where(sql`${table.passportNumber} IS NOT NULL`),
    
    // Check constraints
    aadhaarCheck: check(
      'check_aadhaar_format',
      sql`${table.aadhaarNumber} IS NULL OR ${table.aadhaarNumber} ~ '^[0-9]{12}$'`
    ),
    
    passportCheck: check(
      'check_passport_format',
      sql`${table.passportNumber} IS NULL OR ${table.passportNumber} ~ '^[A-Z0-9]{6,9}$'`
    ),
  })
);

// Type inference
export type Traveler = typeof travelers.$inferSelect;
export type NewTraveler = typeof travelers.$inferInsert;